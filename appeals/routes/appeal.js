const express    = require('express');
const router     = express.Router();
const ensureAuth = require('../middleware/ensureauth');
const pool       = require('../middleware/db.js');
const bot       = require('../middleware/bot.js');
const {MessageActionRow, MessageButton, Component, ButtonStyle} = require("discord.js")
const LOG_GUILD_ID   = '1323763034488963143';
const LOG_CHANNEL_ID = '1372382479792734249';

// GET /appeal/new
router.get('/new', ensureAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    // 1) fetch all punishments for this user
    const [punishments] = await pool.query(
      `SELECT id AS ban_id, reason, timestamp
       FROM blacklist
       WHERE userId = ?`,
      [userId]
    );

    // 2) check for an existing pending appeal
    const [[{ pendingCount }]] = await pool.query(
      `SELECT COUNT(*) AS pendingCount
       FROM appeals
       WHERE user_id = ? AND status = 'pending'`,
      [userId]
    );

    // 3) check for a denied appeal in the last month
    const [[{ recentDenied }]] = await pool.query(
      `SELECT COUNT(*) AS recentDenied
       FROM appeals
       WHERE user_id = ?
         AND status = 'denied'
         AND decided_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)`,
      [userId]
    );

    // If they can’t file, show a message
    if (pendingCount > 0 || recentDenied > 0) {
      return res.render('newAppeal', {
        user: req.user,
        punishments,
        error: pendingCount > 0
          ? 'You already have a pending appeal.'
          : 'You were denied an appeal within the last month.'
      });
    }

    // Otherwise show the form
    res.render('newAppeal', { user: req.user, punishments, error: null });
  } catch (err) {
    console.error('Error loading new appeal form', err);
    res.status(500).send('Server error');
  }
});

// POST /appeal/new
router.post('/new', ensureAuth, async (req, res) => {
    const userId    = req.user.id;
    const { banId, reason } = req.body;
    const appealReason = reason.trim();
  
    if (!banId || !appealReason) {
      return res.status(400).send('Ban and reason are required.');
    }
  
    try {
      // 1) Insert the appeal
      const [result] = await pool.query(
        `INSERT INTO appeals (ban_id, user_id, appeal_message)
         VALUES (?, ?, ?)`,
        [banId, userId, appealReason]
      );
      const appealId = result.insertId;
  
      // 2) Look up the original ban reason
      const [blacklistRows] = await pool.query(
        `SELECT reason, timestamp
         FROM blacklist
         WHERE id = ? AND userId = ?
         LIMIT 1`,
        [banId, userId]
      );
  
      const banInfo = blacklistRows[0] || {};
      const banReason   = banInfo.reason   || 'Unknown';
      const banWhen     = banInfo.timestamp
                           ? new Date(banInfo.timestamp).toLocaleString()
                           : 'Unknown';
  
      // 3) Send a log message to Discord
      // Ensure the bot is ready
      if (bot.isReady()) {
        const channel = await bot.channels.fetch(LOG_CHANNEL_ID);
        if (channel && channel.guild.id === LOG_GUILD_ID) {
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

            // … after you’ve got `channel`, `appealId`, etc…
            
            // 1) Build the button
            const openAppealButton = new ButtonBuilder()
              .setLabel('Open Appeal')
              .setStyle(ButtonStyle.Link)
              .setURL('https://appeals.atlasnetworksroleplay.com/login');
            
            // 2) Wrap it in an ActionRow
            const row = new ActionRowBuilder().addComponents(openAppealButton);
            
            // 3) Build your embed
            const embed = new EmbedBuilder()
              .setTitle(`New Appeal #${appealId}`)
              .setColor(0x5865F2)
              .addFields(
                { name: 'Applicant',            value: `<@${userId}> • \`${userId}\``, inline: false },
                { name: 'Ban ID',               value: `\`${banId}\``,                 inline: true  },
                { name: 'Original Ban Reason',  value: banReason,                      inline: true  },
                { name: 'Ban Timestamp',        value: banWhen,                        inline: false },
                { name: 'Appeal Reason',        value: appealReason,                  inline: false }
              )
              .setTimestamp();
            
            // 4) Send it
            await channel.send({
              embeds: [embed],
              components: [row]
            });
        } else {
          console.warn(`Cannot find channel ${LOG_CHANNEL_ID} in guild ${LOG_GUILD_ID}`);
        }
      } else {
        console.warn('Discord bot not ready—appeal log not sent.');
      }
  
      // 4) Redirect the user to their detail page
      res.redirect(`/profile/${userId}/${appealId}`);
    } catch (err) {
      console.error('Error creating new appeal', err);
      res.status(500).send('Server error');
    }
  });
  

module.exports = router;
