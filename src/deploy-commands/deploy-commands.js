const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");
const { token, clientID, guildID } = require("../config.json");

const commands = [];

const foldersPath = path.join(__dirname, "..", "commands");
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(
        `[!!!WARNING!!!] The command at ${filePath} is missing a property.`
      );
    }
  }
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`Loading ${commands.length} commands...`);

    const data = await rest.put(
      Routes.applicationGuildCommands(clientID, guildID),
      { body: commands }
    );

    console.log(`Successfully loaded ${data.length} commands.`);
  } catch (error) {
    console.error(error);
  }
})();
