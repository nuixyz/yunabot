const { SlashCommandBuilder } = require("discord.js");
const Sticker = require("../../../models/sticker.js");
const sharp = require("sharp");

module.exports = {
  category: "admin",
  data: new SlashCommandBuilder()
    .setName("addsticker")
    .setDescription("Add a Custom Sticker")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("Name of the sticker")
        .setRequired(true)
    )
    .addAttachmentOption((option) =>
      option
        .setName("file")
        .setDescription(
          "Attach an image or GIF. Supported formats: PNG, JPEG, GIF"
        )
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const name = interaction.options
        .getString("name")
        .toLowerCase()
        .replace(/\s+/g, "_");
      const file = interaction.options.getAttachment("file");

      const validTypes = ["image/png", "image/jpeg", "image/gif"];
      if (!validTypes.includes(file.contentType)) {
        return interaction.editReply({
          content:
            "Unsupported file format. Only PNG, JPEG and GIF are supported.",
        });
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return interaction.editReply({
          content: "File too large. Maximum size is 5MB.",
        });
      }

      const exists = await Sticker.findOne({ name });
      if (exists) {
        return interaction.editReply({
          content: `A sticker with the name **${name}** already exists.`,
        });
      }

      // ai code from here idk what this does
      const response = await fetch(file.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }

      const buffer = Buffer.from(await response.arrayBuffer());

      let processedBuffer;

      // Handle GIFs differently (preserve animation)
      if (file.contentType === "image/gif") {
        // For GIFs, we'll resize but try to preserve animation
        // Sharp has limited GIF support, so we'll be more conservative
        processedBuffer = await sharp(buffer, { animated: true })
          .resize(320, 320, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .gif()
          .toBuffer();
      } else {
        // For static images, convert to PNG and resize
        processedBuffer = await sharp(buffer)
          .resize(320, 320, {
            fit: "inside",
            withoutEnlargement: true,
            background: { r: 0, g: 0, b: 0, alpha: 0 }, // transparent background was supposed to work
          })
          .png({
            quality: 90,
            compressionLevel: 6,
          })
          .toBuffer();
      }

      // Check processed file size
      const base64Data = processedBuffer.toString("base64");
      const estimatedSize = (base64Data.length * 3) / 4; // Rough base64 size estimation

      // MongoDB document size limit is 16MB, but let's be conservative
      const maxDocSize = 10 * 1024 * 1024; // 10MB
      if (estimatedSize > maxDocSize) {
        return interaction.editReply({
          content:
            "❌ Processed image is too large for storage. Try a smaller image.",
        });
      }

      // Create the sticker document
      const mimeType =
        file.contentType === "image/gif" ? "image/gif" : "image/png";
      const newSticker = new Sticker({
        name,
        url: `data:${mimeType};base64,${base64Data}`,
        addedBy: interaction.user.id,
        addedAt: new Date(),
        originalFilename: file.name,
        fileSize: processedBuffer.length,
      });

      // Save to database
      await newSticker.save();

      await interaction.editReply({
        content: `✅ Sticker **${name}** added successfully!\n`,
      });
    } catch (error) {
      console.error(`[ERROR] Add sticker command failed:`, error);

      let errorMessage = "❌ An error occurred while adding the sticker.";

      if (error.message.includes("fetch")) {
        errorMessage =
          "❌ Failed to download the attachment. Please try again.";
      } else if (error.message.includes("Sharp")) {
        errorMessage =
          "❌ Failed to process the image. Make sure it's a valid image file.";
      } else if (error.message.includes("E11000")) {
        errorMessage = "❌ A sticker with this name already exists.";
      } else if (error.message.includes("validation")) {
        errorMessage = "❌ Invalid sticker data. Please check your input.";
      }

      try {
        await interaction.editReply({ content: errorMessage });
      } catch (replyError) {
        console.error("[ERROR] Failed to send error message:", replyError);
      }
    }
  },
};
