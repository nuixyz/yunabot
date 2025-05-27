const { modmailChannelID } = require("../config.json");

module.exports = {
  name: "messageCreate",
  once: false,
  async execute(message) {
    if (message.author.bot || message.guild) return;

    console.log(
      `📨 DM received from ${message.author.tag}: ${message.content}`
    );

    let modmailChannel;
    try {
      modmailChannel = await message.client.channels.fetch(modmailChannelID);
    } catch (err) {
      console.error("Error fetching modmail channel:", err);
      return;
    }

    if (!modmailChannel) {
      console.warn("Modmail channel not found.");
      return;
    }

    const imageAttachment = message.attachments.find((attachment) =>
      attachment.contentType?.startsWith("image/")
    );

    const embed = {
      color: 0x2b2d31,
      author: {
        name: `${message.author.tag}`,
        icon_url: message.author.displayAvatarURL(),
      },
      description: message.content || "*No message content*",
      footer: { text: `User ID: ${message.author.id}` },
      timestamp: new Date(),
    };

    if (imageAttachment) {
      embed.image = {
        url: imageAttachment.url,
      };
    } else {
      embed.setImage(imageAttachment)
    }

    try {
      await modmailChannel.send({ embeds: [embed] });
      console.log(
        `Forwarded DM from ${message.author.tag} to modmail channel.`
      );
    } catch (err) {
      console.error("Failed to send embed to modmail channel:", err);
    }
  },
};
