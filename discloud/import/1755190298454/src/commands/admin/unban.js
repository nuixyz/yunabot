const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  category: "admin",
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a banned user.")
    .addStringOption((option) =>
      option
        .setName("target_id")
        .setDescription("The ID of the user to unban")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetID = interaction.options.getString("target_id");

    try {
      await interaction.guild.members.unban(targetID);
      await interaction.reply(`<@${targetID}> has been unbanned.`);
      console.log(`${targetID} was unbanned.`);
    } catch (error) {
      await interaction.reply(
        `Failed to unban <@${targetID}>. Please check the ID and try again.`
      );
      console.error(error);
    }
  },
};
