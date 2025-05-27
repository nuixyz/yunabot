const fs = require("node:fs");
const path = require("node:path");
const { REST, Routes } = require("discord.js");
const { token, clientID, guildID } = require("../config.json");

const mode = process.argv[2] || "global";

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

    let data;
    if (mode === "guild") {
      // Deploy to a specific guild for testing
      data = await rest.put(
        Routes.applicationGuildCommands(clientID, guildID),
        {
          body: commands,
        }
      );
    } else {
      // Deploy globally
      data = await rest.put(Routes.applicationCommands(clientID), {
        body: commands,
      });
    }

    console.log(
      `Successfully loaded ${data.length} application (/) commands in ${mode} mode.`
    );
  } catch (error) {
    console.error("Failed to deploy commands:", error);
  }
})();
