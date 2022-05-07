import { Client } from "discordx";
import { Intents } from "discord.js";
export const client = new Client({
    simpleCommand: {
      prefix: "!",
    },
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MEMBERS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    ],
    // If you only want to use global commands only, comment this line
    botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
});