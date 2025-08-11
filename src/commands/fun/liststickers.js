const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Sticker = require("../../../models/sticker.js");

module.exports = {
  category: "fun",
  data: new SlashCommandBuilder()
    .setName("liststickers")
    .setDescription("List all the stickers with previews"),

  async execute(interaction) {
    try {
      await interaction.deferReply();

      const stickers = await Sticker.find({}).sort({ name: 1 });

      if (!stickers.length) {
        return interaction.editReply({
          content: "No stickers found.",
          ephemeral: true,
        });
      }

      let currentPage = 1;
      const itemsPerPage = 30;
      const totalPages = Math.ceil(stickers.length / itemsPerPage);

      const generatePageContent = (page) => {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageStickers = stickers.slice(startIndex, endIndex);

        let gridText = "";
        let currentRow = "";
        let itemsInRow = 0;

        for (let i = 0; i < pageStickers.length; i++) {
          const sticker = pageStickers[i];

          let stickerDisplay = "";
          if (sticker.url.startsWith("data:")) {
            // For base64 stickers, show a placeholder emoji with name
            stickerDisplay = `\`:${sticker.name}:\``;
          } else {
            stickerDisplay = `<:${sticker.name}:${sticker._id}> \`:${sticker.name}:\``;
          }

          currentRow += stickerDisplay + " ";
          itemsInRow++;

          if (itemsInRow === 3 || i === pageStickers.length - 1) {
            gridText += currentRow.trim() + "\n";
            currentRow = "";
            itemsInRow = 0;
          }
        }

        // If no grid content, show message
        if (!gridText.trim()) {
          gridText = "No stickers on this page.";
        }

        const embed = new EmbedBuilder()
          .setTitle(`Available Stickers (Page ${page}/${totalPages})`)
          .setDescription(
            `To use these stickers, use \`/sticker <name>\`\n\n${gridText}`
          )
          .setColor(0xffc0cb)
          .setFooter({
            text: `Total stickers: ${stickers.length} stickers | Page ${page} of ${totalPages}`,
          });

        return embed;
      };

      // Function to create navigation buttons
      const createButtons = (page, totalPages) => {
        if (totalPages <= 1) return [];

        const row = new ActionRowBuilder();

        // First page button
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("sticker_first")
            .setLabel("⏮️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 1)
        );

        // Previous page button
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("sticker_prev")
            .setLabel("◀️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 1)
        );

        // Page indicator
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("sticker_page")
            .setLabel(`${page}/${totalPages}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

        // Next page button
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("sticker_next")
            .setLabel("▶️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === totalPages)
        );

        // Last page button
        row.addComponents(
          new ButtonBuilder()
            .setCustomId("sticker_last")
            .setLabel("⏭️")
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === totalPages)
        );

        return [row];
      };

      // Generate initial content
      const initialEmbed = generatePageContent(currentPage);
      const initialButtons = createButtons(currentPage, totalPages);

      // Send initial response
      const response = {
        embeds: [initialEmbed],
        components: initialButtons,
      };

      const message = await interaction.editReply(response);

      // Set up button collector (only if there are multiple pages)
      if (totalPages > 1) {
        const collector = message.createMessageComponentCollector({
          time: 300000, // 5 minutes
        });

        collector.on("collect", async (buttonInteraction) => {
          if (buttonInteraction.user.id !== interaction.user.id) {
            return buttonInteraction.reply({
              content: "Cannot use the button.",
              ephemeral: true,
            });
          }

          // Handle button clicks
          switch (buttonInteraction.customId) {
            case "sticker_first":
              currentPage = 1;
              break;
            case "sticker_prev":
              if (currentPage > 1) currentPage--;
              break;
            case "sticker_next":
              if (currentPage < totalPages) currentPage++;
              break;
            case "sticker_last":
              currentPage = totalPages;
              break;
          }

          try {
            // Generate new page content
            const newEmbed = generatePageContent(currentPage);
            const newButtons = createButtons(currentPage, totalPages);

            // Update the message
            await buttonInteraction.update({
              embeds: [newEmbed],
              components: newButtons,
            });
          } catch (error) {
            console.error("[ERROR] Failed to update page:", error);
            await buttonInteraction.reply({
              content: "Failed to load page. Please try again.",
              ephemeral: true,
            });
          }
        });

        collector.on("end", async () => {
          try {
            // Disable all buttons when collector expires
            const disabledRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("sticker_expired")
                .setLabel("Buttons expired.")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
            );

            await message.edit({ components: [disabledRow] });
          } catch (error) {
            console.error("[ERROR] Failed to disable buttons:", error);
          }
        });
      }
    } catch (error) {
      console.error(`[ERROR] List stickers command failed:`, error);

      let errorMessage = "❌ An error occurred while listing stickers.";

      if (
        error.message.includes("MongoError") ||
        error.message.includes("MongoDB")
      ) {
        errorMessage = "❌ Database error. Please try again later.";
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
