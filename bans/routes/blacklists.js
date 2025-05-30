const express      = require('express');
const router       = express.Router();
const ensureAuth = require('../middleware/ensureauth');
const ensureAdmin  = require('../middleware/ensureadmin');
const db           = require('../middleware/db');
const bot           = require('../middleware/bot');
const {EmbedBuilder}           = require('discord.js');
// … your existing GET '/' handler …

/**
 * GET /bans/blacklist/manage
 * Renders a page listing all blacklist entries with “Remove” buttons.
 */
router.get(
  '/blacklist/manage',
  ensureAuth,
  ensureAdmin,
  async (req, res, next) => {
    try {
      // Fetch all blacklist entries
      const [entries] = await db.query(
        'SELECT userId, reason FROM blacklist ORDER BY timestamp DESC'
      );

      // Render management view
      res.render('blacklistManage', {
        user: req.user,
        entries
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /bans/blacklist/manage/remove/:userId
 * Deletes a single blacklist entry, then redirects back to the manage page.
 */
router.post(
    '/blacklist/manage/remove/:userId',
    ensureAuth,
    ensureAdmin,
    async (req, res, next) => {
      const targetId = req.params.userId;
      try {
        // 1) Remove from database
        await db.query(
          'DELETE FROM blacklist WHERE userId = ?',
          [targetId]
        );
  
        // 2) Unban from all guilds
        await Promise.all(
          bot.guilds.cache.map(async guild => {
            try {
              await guild.bans.remove(targetId);
              console.log(`Unbanned ${targetId} from ${guild.name}`);
            } catch (err) {
              // 10026 = Unknown Ban, ignore if not banned
              if (err.code !== 10026) {
                console.error(`Failed to unban ${targetId} from ${guild.id}:`, err);
              }
            }
          })
        );
        try {
          const embed = new EmbedBuilder()
          .setTitle('Blacklist Revoked')
          .setColor('Green')
          .setTimestamp()
          .addFields(
            { name: 'User', value: `${targetId}`, inline: false },
            { name: 'Revoked By', value: `<@${req.user.id}>`, inline: false }
        );
        const mainGuildId = '1323763034488963143' // Add this to config.json!
        const mainGuild = bot.guilds.cache.get(mainGuildId);
        if (!mainGuild) {
            console.error(`[Security Error] Could not find main guild ${mainGuildId}`);
            return { ignored: false };
        }
    
        const staffChannel = await mainGuild.channels.fetch('1362919928356667462').catch(() => null);
        if (!staffChannel) {
            console.error(`[Security Error] Failed to fetch mod log channel for main guild ${mainGuild.name}`);
            return { ignored: false };
        }
        await staffChannel.send({embeds: [embed]})
        } catch (err) {
          console.log(`[Discord Logging Error] ${err}`)
        }
        // 3) Redirect back to management page
        res.redirect('/bans/blacklist/manage');
      } catch (err) {
        next(err);
      }
    }
  );
  

module.exports = router;