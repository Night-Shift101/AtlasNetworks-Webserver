// middleware/checkAdmin.js
const bot = require('./bot.js'); // your Discord.js bot bot
const { GuildMember } = require('discord.js');

// List the role IDs that grant “admin” access:
const ADMIN_ROLE_IDS = [
  '1355360412769456287', // e.g. Staff role
  '1333939000486137927', // e.g. Moderator role
  // …add as many as you need
];

module.exports = async function ensureadmin(req, res, next) {
  if (!req.user) {
    // not even logged in
    return res.redirect('/login');
  }

  try {
    // Replace with the guild where your staff roles live:
    const GUILD_ID = process.env.TARGET_GUILD_ID;
    const guild = await bot.guilds.fetch(GUILD_ID);
    const member = await guild.members.fetch(req.user.id);

    // Check if they have *any* of the admin roles:
    const isAdmin = ADMIN_ROLE_IDS.some(roleId =>
      member.roles.cache.has(roleId)
    );

    req.isAdmin = isAdmin;
    next();
  } catch (err) {
    console.error('checkAdmin error:', err);
    // we’ll treat failures as non-admin
    req.isAdmin = false;
    next();
  }
};
