module.exports = {
  name: "interactionCreate",
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const customId = interaction.customId;

    if (customId.startsWith("show_userid_")) {
      const userId = customId.replace("show_userid_", "");
      await interaction.reply({
        content: `${userId}`,
        ephemeral: true,
      });
    }
  },
};
