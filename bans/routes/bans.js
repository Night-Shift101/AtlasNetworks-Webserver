// routes/bans.js
const express = require('express');
const router = express.Router();
const ensureAuth = require('../middleware/ensureauth');
const db = require('../middleware/db'); // e.g. a mysql2 or pg connection pool
const bot = require('../middleware/bot'); // your logged-in Discord.js client instance
const { EmbedBuilder } = require('discord.js')
const ADMIN_IDS = process.env.ADMIN_IDS?.split(',') || [];
router.get('/', ensureAuth, async (req, res, next) => {
  try {
    const discordUserId = req.user.id;
    const bannedIn = [];

    // 1) Check bans across all guilds
    await Promise.all(
      bot.guilds.cache.map(async guild => {
        try {
          const ban = await guild.bans.fetch(discordUserId);
          if (ban) {
            bannedIn.push({
              name: guild.name,
              reason: ban.reason || 'No reason given'
            });
          }
        } catch (err) {
          // 10026 = Unknown Ban (user isn’t banned), ignore
          if (err.code !== 10026) console.error(`Guild ${guild.id} ban-check error:`, err);
        }
      })
    );

    // 2) Check blacklist table
    const [rows] = await db.query(
      'SELECT reason FROM blacklist WHERE userId = ? LIMIT 1',
      [discordUserId]
    );
    const blacklistEntry = rows[0] || null;

    const isAdmin = ADMIN_IDS.includes(discordUserId);

    // 4) Render view, passing isAdmin
    res.render('bans', {
      user: req.user,
      bannedIn,
      blacklistEntry,
      isAdmin
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
