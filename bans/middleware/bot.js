// botClient.js

require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');

// Create a new client instance
const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,        // for guild-related events
    GatewayIntentBits.GuildBans,     // to fetch ban information
  ],
  partials: [
    Partials.GuildMember,            // in case of uncached members
    Partials.User                    // in case of uncached users
  ]
});

// Once ready, log to console
bot.once('ready', () => {
  console.log(`🤖 Bot logged in as ${bot.user.tag}`);
});

// Handle errors
bot.on('error', console.error);

// Log in with your bot token from .env
bot.login(process.env.BOT_TOKEN)
  .catch(err => {
    console.error('Failed to login bot:', err);
    process.exit(1);
  });

module.exports = bot;
