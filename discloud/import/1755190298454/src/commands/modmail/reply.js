const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  AttachmentBuilder,
} = require("discord.js");
const { modmailChannelID } = require("../../config.json");

module.exports = {
  category: "modmail",
  data: new SlashCommandBuilder()
    .setName("reply")
    .setDescription("Reply to a message")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("Mention the user you want to reply to")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message content")
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName("attachment1")
        .setDescription("Optional attachment")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("attachment2")
        .setDescription("Optional attachment")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("attachment3")
        .setDescription("Optional attachment")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("attachment4")
        .setDescription("Optional attachment")
        .setRequired(false)
    )
    .addAttachmentOption((option) =>
      option
        .setName("attachment5")
        .setDescription("Optional attachment")
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const user = interaction.options.getUser("user");
      const message = interaction.options.getString("message");

      const attachments = [];
      const attachmentFiles = [];

      for (let i = 1; i <= 5; i++) {
        const attachment = interaction.options.getAttachment(`attachment${i}`);
        if (attachment) {
          attachments.push(attachment);

          try {
            const response = await fetch(attachment.url);
            if (!response.ok) {
              console.error(
                `Failed to fetch attachment ${i}:`,
                response.status
              );
              continue;
            }

            const buffer = Buffer.from(await response.arrayBuffer());
            const attachmentBuilder = new AttachmentBuilder(buffer, {
              name: attachment.name,
            });
            attachmentFiles.push(attachmentBuilder);
          } catch (error) {
            console.error(`Error processing attachment ${i}:`, error);
          }
        }
      }

      const maxSize = 25 * 1024 * 1024; // 25MB total limit for attachments
      let totalSize = 0;
      for (const attachment of attachments) {
        totalSize += attachment.size;
      }

      if (totalSize > maxSize) {
        return interaction.editReply({
          content:
            "❌ Total attachment size exceeds 25MB limit. Please use smaller files or try uploading one at a time.",
        });
      }

      let modmailChannel;
      try {
        modmailChannel = await interaction.client.channels.fetch(
          modmailChannelID
        );
      } catch (error) {
        console.error("Error fetching modmail channel:", error);
        return interaction.editReply({
          content: "❌ Could not find the modmail channel.",
        });
      }

      const embed = {
        color: 0x2b2d31,
        title: "Message from Staff",
        description: `\n${message}\n`,
        footer: { text: "Reply via server if needed." },
        timestamp: new Date(),
      };

      if (attachments.length > 0) {
        const totalSize = attachments.reduce((sum, att) => sum + att.size, 0);
        const totalSizeKB = (totalSize / 1024).toFixed(1);
        const attachmentList = `Total size of attachment(s): ${totalSizeKB}KB`;

        embed.fields = [
          {
            name: `📎 Attachments included: ${attachments.length}`,
            value: attachmentList,
            inline: false,
          },
        ];
      }

      const dmMessage = {
        embeds: [embed],
      };

      const logMessage = {
        content: `**${interaction.user.tag}** replied to **${user.tag}**:`,
        embeds: [
          {
            description: message,
            color: 0x2b2d31,
            footer: { text: `Sent by ${interaction.user.tag}` },
            timestamp: new Date(),
            ...(attachments.length > 0 && {
              fields: [
                {
                  name: `📎 Attachments (${attachments.length})`,
                  value: attachments
                    .map(
                      (att, index) =>
                        `${index + 1}. ${att.name} (${(att.size / 1024).toFixed(
                          1
                        )}KB)`
                    )
                    .join("\n"),
                  inline: false,
                },
              ],
            }),
          },
        ],
      };

      // Add files if available
      if (attachmentFiles.length > 0) {
        dmMessage.files = attachmentFiles;
        // Create new attachment builders for log (Discord requires separate instances)
        const logFiles = [];
        for (let i = 0; i < attachmentFiles.length; i++) {
          const originalFile = attachmentFiles[i];
          const response = await fetch(attachments[i].url);
          const buffer = Buffer.from(await response.arrayBuffer());
          logFiles.push(
            new AttachmentBuilder(buffer, { name: attachments[i].name })
          );
        }
        logMessage.files = logFiles;
      }

      try {
        await user.send(dmMessage);

        await modmailChannel.send(logMessage);

        let successMessage = `✅ Successfully sent reply to **${user.tag}**.`;
        if (attachments.length > 0) {
          successMessage += `\n📎 Included ${attachments.length} attachment(s).`;
        }

        await interaction.editReply({
          content: successMessage,
        });
      } catch (dmError) {
        console.error("Error sending DM:", dmError);

        try {
          await modmailChannel.send({
            ...logMessage,
            content: `DM failed:`,
            embeds: [
              {
                ...logMessage.embeds[0],
                footer: {
                  text: `Failed to send DM - User may have DMs disabled.`,
                },
              },
            ],
          });
        } catch (logError) {
          console.error("Error logging failed DM:", logError);
        }

        await interaction.editReply({
          content:
            "❌ Couldn't send the message. User may have DMs disabled or blocked the bot.",
        });
      }
    } catch (error) {
      console.error("Error in modmail reply command:", error);

      const errorMessage = "❌ An error occurred while processing your reply.";
      try {
        if (interaction.deferred) {
          await interaction.editReply({ content: errorMessage });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      } catch (replyError) {
        console.error("Failed to send error message:", replyError);
      }
    }
  },
};
