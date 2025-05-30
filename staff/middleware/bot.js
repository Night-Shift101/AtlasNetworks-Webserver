const { Client, GatewayIntentBits } = require('discord.js');
const bot = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });
bot.login(process.env.BOT_TOKEN);
module.exports = bot;
