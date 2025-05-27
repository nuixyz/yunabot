const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

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

    try {
      await user.send(
        `You received a reply from the Staff team: \n\n${message}`
      );
      await interaction.reply({
        content: `Reply sent to user ${user.tag}`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "⚠️ Couldn't send the message. User may have DMs disabled.",
        ephemeral: true,
      });
    }
  },
};
