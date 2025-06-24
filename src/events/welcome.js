const { welcomeChannelID } = require("../config.json");
const { EmbedBuilder } = require("discord.js");

async function WelcomeMembers(member, client) {
  const welcomeMessages = [
    `Welcome to the server! Grab some roles and a crayon ${member.user.tag}! <:yunana_heart:1221000789334560869>`,
    `I hope you bought some crayons with you ${member.user.tag}`,
    `It's so nice to have you here! <:wah:1369195996210532372> ${member.user.tag}`,
  ];

  const welcomeGifs = [
    "https://c.tenor.com/vZZoqxpDgVkAAAAC/tenor.gif",
    "https://c.tenor.com/qnLFmJNI1HQAAAAC/tenor.gif",
    "https://c.tenor.com/NQMeDmfBSKwAAAAC/tenor.gif",
    "https://c.tenor.com/MkSnXmQKi_gAAAAC/tenor.gif",
  ];

  try {
    const channel = await client.channels.fetch(welcomeChannelID);
    if (!channel) {
      console.error("Channel not found.");
      return;
    }

    const welcomeMessage =
      welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    const welcomeGif =
      welcomeGifs[Math.floor(Math.random() * welcomeGifs.length)];

    const welcomeMessageEmbed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle(`Welcome to the server, ${member.user.tag}`)
      .setDescription(welcomeMessage)
      .setImage(welcomeGif)
      .setFooter({ text: "Welcome to the server!" });

    console.log(`User ID: ${member.user.id}`);
    await channel.send({ embeds: [welcomeMessageEmbed] });
  } catch (error) {
    console.error("Error fetching channel or sending message:", error);
  }
}

module.exports = { WelcomeMembers };
