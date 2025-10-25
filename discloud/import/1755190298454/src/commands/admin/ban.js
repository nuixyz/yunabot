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
    .setName("ban")
    .setDescription("Select a member and ban them.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("Mention the user to ban them")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName("reason").setDescription("What's the reason for banning?")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const reason =
      interaction.options.getString("reason") ?? "<no reason was provided>";

    const targetMember = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    if (!targetMember) {
      return await interaction.reply({
        content: "User not found.",
        ephemeral: true,
      });
    }

    if (targetMember.id === interaction.guild.ownerId) {
      return await interaction.reply({
        content: "Are you dumb?",
        ephemeral: true,
      });
    }

    const botMember = interaction.guild.members.me;
    if (
      targetMember.roles.highest.position >= botMember.roles.highest.position
    ) {
      return await interaction.reply({
        content: "Cannot ban admin.",
        ephemeral: true,
      });
    }

    const commandUser = interaction.member;
    if (
      targetMember.roles.highest.position >=
        commandUser.roles.highest.position &&
      commandUser.id !== interaction.guild.ownerId
    ) {
      return await interaction.reply({
        content: "Cannot ban admin.",
        ephemeral: true,
      });
    }

    const confirm = new ButtonBuilder()
      .setCustomId("confirm")
      .setLabel("Confirm Ban")
      .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
      .setCustomId("cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(cancel, confirm);

    await interaction.reply({
      content: `Are you sure you want to ban ${target} for reason: ${reason}?`,
      components: [row],
    });

    const filter = (i) => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "confirm") {
        try {
          await interaction.guild.members.ban(target, { reason });
          await i.update({
            content: `✅ ${target.username} has been banned.`,
            components: [],
          });
          console.log(`${target.tag} was banned by ${interaction.user.tag}`);
        } catch (error) {
          console.error("Ban error:", error);
          await i.update({
            content: `❌ Failed to ban ${target.username}. Error: ${error.message}`,
            components: [],
          });
        }
      } else if (i.customId === "cancel") {
        await i.update({
          content: "❌ Ban cancelled.",
          components: [],
        });
      }
      collector.stop();
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        interaction.editReply({
          content: "⏰ Ban action timed out.",
          components: [],
        });
      }
    });
  },
};
