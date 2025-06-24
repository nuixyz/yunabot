const fs = require("node:fs");
const path = require("node:path");
const { WelcomeMembers } = require("./events/welcome");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  ActivityType,
  Partials,
} = require("discord.js");
const { token } = require("./config.json");

const yunabot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

yunabot.commands = new Collection();

const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandsFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandsFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      yunabot.commands.set(command.data.name, command);
    } else {
      console.log(
        `[!!WARNING!!] The command at ${filePath} is missing a property.`
      );
    }
  }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  // console.log(`Loading event: ${event.name}`);
  if (event.once) {
    yunabot.once(event.name, (...args) => event.execute(...args));
  } else {
    yunabot.on(event.name, (...args) => event.execute(...args));
  }
}

//interaction builder
yunabot.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = yunabot.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    }
  }
});

//member welcome
yunabot.on("guildMemberAdd", (member) => {
  console.log(`Member joined: ${member.user.tag}`);
  WelcomeMembers(member, yunabot);
});

// client ready
yunabot.once(Events.ClientReady, (client) => {
  console.log(`Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: `with crayuns 🖍️`, type: ActivityType.Playing }],
    status: "online",
  });
});

yunabot.login(token);
