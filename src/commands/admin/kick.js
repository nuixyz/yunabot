const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  category: "admin",
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Mention user")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription(
          "Reason for kicking"
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") ?? "<no reason was provided>";

    const Yes = new ButtonBuilder()
      .setCustomId("yes")
      .setLabel("Yes")
      .setStyle(ButtonStyle.Danger);

    const No = new ButtonBuilder()
      .setCustomId("no")
      .setLabel("No")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(Yes, No);

    await interaction.reply({
      content: `Final confirmation: Kick <@${target.id}> for ${reason}?`,
      components: [row],
    });

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "yes") {
        try {
          const member = await interaction.guild.members.fetch(target.id);
          await member.kick(reason);
          await i.update({
            content: `${target.username} was kicked out of the server!`,
            components: [],
          });
          console.log(`${target} was kicked out of the server`);
        } catch (error) {
          await i.update({
            content: `Failed to kick ${target.username}. They may not be in the server.`,
            components: [],
          });
        }
      } else if (i.customId === "no") {
        await i.update({ content: "Kick action cancelled.", components: [] });
      }
      collector.stop();
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        interaction.editReply({
          content: "Kick action timed out.",
          components: [],
        });
      }
    });
  },
};
