const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const Sticker = require("../../../models/sticker.js");

module.exports = {
  category: "fun",
  data: new SlashCommandBuilder()
    .setName("sticker")
    .setDescription("Send a sticker")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the sticker")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const inputName = interaction.options.getString("name");
      const normalizedName = inputName.toLowerCase().replace(/\s+/g, "_");

      // console.log(`[DEBUG] Looking for sticker: "${normalizedName}"`);

      // More flexible search - try exact match first, then partial match
      let sticker = await Sticker.findOne({
        name: { $regex: `${normalizedName}, $options: "i"` },
      });

      // If exact match fails, try partial match
      if (!sticker) {
        sticker = await Sticker.findOne({
          name: { $regex: normalizedName, $options: "i" },
        });
      }

      if (!sticker) {
        return interaction.editReply({
          content: `❌ Sticker "${inputName}" not found.`,
          ephemeral: true,
        });
      }

      // console.log(`[DEBUG] Found sticker in DB:`, sticker);

      // Validate URL exists and is accessible
      if (!sticker.url) {
        return interaction.editReply({
          content: `❌ Sticker "${inputName}" has no URL.`,
          ephemeral: true,
        });
      }

      // Handle base64 data URLs (from the addsticker command)
      if (sticker.url.startsWith("data:")) {
        const [mimeInfo, base64Data] = sticker.url.split(",");
        const mimeType = mimeInfo.match(/data:([^;]+)/)?.[1] || "image/png";
        const fileExtension = mimeType.split("/")[1] || "png";

        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, "base64");

        // Create attachment from buffer
        const attachment = new AttachmentBuilder(buffer, {
          name: `${normalizedName}.${fileExtension}`,
        });

        await interaction.editReply({
          files: [attachment],
        });
      } else {
        // Handle regular URLs
        try {
          new URL(sticker.url);
        } catch (urlError) {
          console.error(
            `[ERROR] Invalid URL for sticker "${inputName}":`,
            sticker.url
          );
          return interaction.editReply({
            content: `❌ Sticker "${inputName}" has an invalid URL.`,
            ephemeral: true,
          });
        }

        // Create attachment from URL
        const fileExtension =
          sticker.url.split(".").pop()?.split("?")[0] || "png";
        const attachment = new AttachmentBuilder(sticker.url, {
          name: `${normalizedName}.${fileExtension}`,
        });

        await interaction.editReply({
          files: [attachment],
        });
      }
    } catch (error) {
      console.error(`[ERROR] Sticker command failed:`, error);

      let errorMessage = "❌ An error occurred while fetching the sticker.";

      // Handle different types of errors
      if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
        errorMessage =
          "❌ Failed to load sticker image. The URL might be broken.";
      } else if (error.message.includes("Request entity too large")) {
        errorMessage = "❌ Sticker file is too large to send.";
      } else if (error.message.includes("Invalid attachment")) {
        errorMessage =
          "❌ Invalid sticker data. The sticker might be corrupted.";
      } else if (error.code === 50035) {
        errorMessage =
          "❌ Invalid form body. The sticker data might be malformed.";
      }

      try {
        await interaction.editReply({
          content: errorMessage,
          ephemeral: true,
        });
      } catch (replyError) {
        console.error("[ERROR] Failed to send error message:", replyError);
      }
    }
  },
};
