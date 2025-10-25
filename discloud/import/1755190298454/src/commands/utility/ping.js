const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  category: "Utility",
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with a pong"),

  async execute(interaction) {
    const sent = await interaction.reply({
      content: "Pinging...",
      fetchReply: true,
    });
    interaction.editReply(
      `Pong! \`${sent.createdTimestamp - interaction.createdTimestamp}ms\``
    );
  },
};
