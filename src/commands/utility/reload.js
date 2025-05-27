const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const path = require("node:path");

module.exports = {
  category: "utility",
  data: new SlashCommandBuilder()
    .setName("reload")
    .setDescription("Reloads a command")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("The command to reload.")
        .setRequired(true)
    ),

  async execute(interaction) {
    const commandName = interaction.options
      .getString("command", true)
      .toLowerCase();

    const command = interaction.client.commands.get(commandName);
    if (!command) {
      return interaction.reply({
        content: `There is no command with name \`${commandName}\`!`,
        ephemeral: true,
      });
    }

    try {
      const commandPath = path.join(
        __dirname,
        "..",
        command.category,
        `${command.data.name}.js`
      );

      delete require.cache[require.resolve(commandPath)];

      const newCommand = require(commandPath);
      interaction.client.commands.set(newCommand.data.name, newCommand);
      console.log(`${command.data.name} was reloaded!`);
      console.log(`Path: ${commandPath}`);

      await interaction.reply({
        content: `Command \`${newCommand.data.name}\` was successfully reloaded!`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error reloading command:", error);
      await interaction.reply({
        content: `There was an error while reloading the command \`${commandName}\`:\n\`${error.message}\``,
        ephemeral: true,
      });
    }
  },
};
