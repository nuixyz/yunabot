const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  category: "admin",
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot say or announce something!")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("What do you want me to say? :3")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Which channel should I send the message to?")
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.Administrator | PermissionFlagsBits.ManageMessages
    ),

  async execute(interaction) {
    const sayMessage = interaction.options.getString("message");
    const channel = interaction.options.getChannel("channel");

    channel === null
      ? interaction.channel.send({ content: sayMessage })
      : channel.send({ content: sayMessage });

    await interaction.reply({
      content: "Message was sent!",
      ephemeral: true,
    });
  },
};
