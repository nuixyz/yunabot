const { Client, Events, GatewayIntentBits } = require("discord.js");
const { token } = require("./config.json");

const yunabot = new Client({ intents: [GatewayIntentBits.Guilds] });

yunabot.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

yunabot.login(token);
// console.log(token);
