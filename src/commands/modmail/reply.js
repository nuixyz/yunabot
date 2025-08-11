const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
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
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const message = interaction.options.getString("message");

    let modmailChannel;
    try {
      modmailChannel = await interaction.client.channels.fetch(
        modmailChannelID
      );
    } catch (error) {
      console.error("Error fetching modmail channel:", error);
      return interaction.reply({
        content: "Could not find the modmail channel.",
        ephemeral: true,
      });
    }

    try {
      // Send DM to user
      await user.send({
        embeds: [
          {
            color: 0x2b2d31,
            title: "Message from Staff",
            description: message,
            footer: { text: "Reply via server if needed." },
            timestamp: new Date(),
          },
        ],
      });

      //Log the message
      await modmailChannel.send({
        content: `**${interaction.user.tag}** replied to **${user.tag}**:`,
        embeds: [
          {
            description: message,
            color: 0x2b2d31,
            footer: { text: `Sent by ${interaction.user.tag}` },
            timestamp: new Date(),
          },
        ],
      });
    } catch (error) {
      console.error("Error sending DM or logging to modmail:", error);
      await interaction.reply({
        content: "Couldn't send the message. User may have DMs disabled.",
        ephemeral: true,
      });
    }
  },
};
