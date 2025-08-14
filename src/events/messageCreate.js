const {
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { modmailChannelID } = require("../config.json");

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message) {
    // Only process DMs from non-bots
    if (message.author.bot || message.guild) return;

    console.log(`DM received from ${message.author.tag}: ${message.content}`);

    let modmailChannel;
    try {
      modmailChannel = await message.client.channels.fetch(modmailChannelID);
    } catch (err) {
      console.error("Error fetching modmail channel:", err);
      return;
    }

    if (!modmailChannel) {
      console.warn("Modmail channel not found.");
      return;
    }

    try {
      const attachments = Array.from(message.attachments.values());
      const attachmentFiles = [];
      const attachmentInfo = [];

      let imageAttachments = [];
      let otherAttachments = [];

      for (const attachment of attachments) {
        attachmentInfo.push({
          name: attachment.name,
          size: attachment.size,
          type: attachment.contentType || "unknown",
          url: attachment.url,
        });

        if (attachment.contentType?.startsWith("image/")) {
          imageAttachments.push(attachment);
        } else {
          otherAttachments.push(attachment);
        }

        try {
          const response = await fetch(attachment.url);
          if (response.ok) {
            const buffer = Buffer.from(await response.arrayBuffer());
            const attachmentBuilder = new AttachmentBuilder(buffer, {
              name: attachment.name,
            });
            attachmentFiles.push(attachmentBuilder);
          }
        } catch (fetchError) {
          console.error(
            `Failed to download attachment ${attachment.name}:`,
            fetchError
          );
          // Continue with other attachments
        }
      }

      // Create base embed
      const embed = {
        color: 0x2b2d31,
        author: {
          name: `${message.author.tag}`,
          icon_url: message.author.displayAvatarURL(),
        },
        description: `\n${message.content || "*No message content*"}\n`,
        footer: { text: `User ID: ${message.author.id}` },
        timestamp: new Date(),
      };

      // if (imageAttachments.length > 0) {
      //   embed.image = {
      //     url: imageAttachments[0].url,
      //   };
      // }

      // Add attachment information to embed
      if (attachmentInfo.length > 0) {
        const totalSize = attachmentInfo.reduce(
          (sum, att) => sum + att.size,
          0
        );
        const totalSizeKB = (totalSize / 1024).toFixed(1);
        const attachmentList = `Total size of attachment(s): ${totalSizeKB}KB`;

        embed.fields = [
          {
            name: `📎 Attachments included: ${attachmentInfo.length}`,
            value: attachmentList,
            inline: false,
          },
        ];

        // If there are multiple images, mention it
        // if (imageAttachments.length > 1) {
        //   embed.fields.push({
        //     name: "Additional Images",
        //     value: `${
        //       imageAttachments.length - 1
        //     } more image(s) attached with the message`,
        //     inline: false,
        //   });
        // }

        // If there are non-image files, mention them
        if (otherAttachments.length > 0) {
          embed.fields.push({
            name: "Files",
            value: `${otherAttachments.length} file(s) attached`,
            inline: false,
          });
        }
      }

      // Create buttons
      const showIdButton = new ButtonBuilder()
        .setCustomId(`show_userid_${message.author.id}`)
        .setLabel("Show User ID")
        .setStyle(ButtonStyle.Secondary);

      const replyButton = new ButtonBuilder()
        .setCustomId(`quick_reply_${message.author.id}`)
        .setLabel("Quick Reply")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder().addComponents(
        showIdButton,
        replyButton
      );

      // Prepare message object
      const modmailMessage = {
        embeds: [embed],
        components: [row],
      };

      // Add attachments if any were successfully processed
      if (attachmentFiles.length > 0) {
        modmailMessage.files = attachmentFiles;
      }

      // Send to modmail channel
      await modmailChannel.send(modmailMessage);

      // Log success
      let logMessage = `Forwarded DM from ${message.author.tag} to modmail channel.`;
      if (attachmentInfo.length > 0) {
        logMessage += ` [${attachmentInfo.length} attachment(s)]`;
      }
      console.log(logMessage);

      // Optional: Send confirmation to user
      try {
        if (message.content || attachments.length > 0) {
          let confirmationMessage =
            "✅ Your message has been received by our staff team.";
          // if (attachments.length > 0) {
          //   confirmationMessage += ` We received your ${attachments.length} attachment(s).`;
          // }
          confirmationMessage += "We'll get back to you soon.";

          await message.author.send(confirmationMessage);
        }
      } catch (confirmError) {
        console.warn(
          "Could not send confirmation to user:",
          confirmError.message
        );
        // Don't fail the whole process if confirmation fails
      }
    } catch (err) {
      console.error("Failed to process DM for modmail:", err);

      // Try to send a basic message without attachments as fallback
      try {
        const fallbackEmbed = {
          color: 0xff0000, // Red for error
          author: {
            name: `${message.author.tag}`,
            icon_url: message.author.displayAvatarURL(),
          },
          description: message.content || "*No message content*",
          footer: {
            text: `User ID: ${message.author.id} | Error processing attachments`,
          },
          timestamp: new Date(),
        };

        if (message.attachments.size > 0) {
          fallbackEmbed.fields = [
            {
              name: "⚠️ Attachment Error",
              value: `Failed to process ${message.attachments.size} attachment(s). Original URLs may be available in logs.`,
              inline: false,
            },
          ];
        }

        const showIdButton = new ButtonBuilder()
          .setCustomId(`show_userid_${message.author.id}`)
          .setLabel("Show User ID")
          .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder().addComponents(showIdButton);

        await modmailChannel.send({
          embeds: [fallbackEmbed],
          components: [row],
        });

        console.log("Sent fallback message to modmail channel.");
      } catch (fallbackError) {
        console.error("Failed to send fallback message:", fallbackError);
      }
    }
  },
};
