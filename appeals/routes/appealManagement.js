// routes/appeal.js (or your appealManagement.js)
const express     = require('express');
const router      = express.Router();
const ensureAuth  = require('../middleware/ensureauth');
const ensureadmin  = require('../middleware/ensureadmin');
const pool        = require('../middleware/db.js');
const bot         = require('../middleware/bot.js');
const { EmbedBuilder } = require('discord.js');

const MAIN_GUILD_ID   = '1323763034488963143';
const STAFF_CHANNEL_ID = '1362919928356667462';
const APPEAL_CHANNEL_ID = '1372382479792734249';

router.post(
  '/approve/:appealId',
  ensureAuth,
  ensureadmin,
  async (req, res) => {
    const { appealId } = req.params;
    const adminId      = req.user.id;
    const note         = req.body.message || null;

    const conn = pool; // assuming mysql2/promise pool

    try {
      // 1) Fetch the appeal to get ban_id and user_id
      const [[ appeal ]] = await conn.query(
        `SELECT ban_id, user_id
         FROM appeals
         WHERE appeal_id = ?
           AND status = 'pending'`,
        [appealId]
      );
      if (!appeal) {
        return res.status(404).json({ error: 'Appeal not found or not pending.' });
      }
      const targetId = appeal.user_id;
      const banId    = appeal.ban_id;

      // 2) Remove from blacklist table
      await conn.query(
        `DELETE FROM blacklist
         WHERE id = ? AND userId = ?`,
        [banId, targetId]
      );

      // 3) Unban from every guild
      await Promise.all(
        bot.guilds.cache.map(async guild => {
          try {
            await guild.bans.remove(targetId);
            console.log(`Unbanned ${targetId} from ${guild.name}`);
          } catch (err) {
            // ignore “Unknown Ban” errors
            if (err.code !== 10026) {
              console.error(`Failed to unban ${targetId} from ${guild.id}:`, err);
            }
          }
        })
      );

      // 4) Send log embed
      const mainGuild = bot.guilds.cache.get(MAIN_GUILD_ID);
      if (mainGuild) {
        const staffChannel = mainGuild.channels.cache.get(STAFF_CHANNEL_ID)
          || await mainGuild.channels.fetch(STAFF_CHANNEL_ID).catch(() => null);

        if (staffChannel?.isTextBased()) {
          const embed = new EmbedBuilder()
            .setTitle('Blacklist Revoked ('+appeal.appeal_id+")")
            .setColor('Green')
            .setTimestamp()
            .addFields(
              { name: 'User',            value: `<@${targetId}> (\`${targetId}\`)`, inline: false },
              { name: 'Revoked By',      value: `<@${adminId}>`,                     inline: false },
              { name: 'Original Ban ID', value: `\`${banId}\``,                      inline: false },
              { name: 'Note | Removed Via Appeal:',            value: note || '—' }
            );
          await staffChannel.send({ embeds: [embed] });
        }

        const appealChannel = mainGuild.channels.cache.get(APPEAL_CHANNEL_ID)
          || await mainGuild.channels.fetch(APPEAL_CHANNEL_ID).catch(() => null);

        if (appealChannel?.isTextBased()) {
          const appealembed = new EmbedBuilder()
            .setTitle('Appeal Approved')
            .setColor('Green')
            .setTimestamp()
            .addFields(
              { name: 'User',            value: `<@${targetId}> (\`${targetId}\`)`, inline: false },
              { name: 'Approved By',      value: `<@${adminId}>`,                     inline: false },
              { name: 'Original Ban ID', value: `\`${banId}\``,                      inline: false },
              { name: 'Note',            value: note || '—' }
            );
          await appealChannel.send({ embeds: [appealembed] });
        }
      }

      // 5) Update the appeal record to approved
      await conn.query(
        `UPDATE appeals
         SET status = 'approved',
             decided_at = NOW(),
             decided_by = ?,
             decision_message = ?
         WHERE appeal_id = ?`,
        [adminId, note, appealId]
      );

      // 6) Respond
      return res.json({ success: true });
    } catch (err) {
      console.error('Error in approve route:', err);
      return res.status(500).json({ error: 'Server error' });
    }
  }
);

router.post(
    '/deny/:appealId',
    ensureAuth,
    ensureadmin,
    async (req, res) => {
      const { appealId } = req.params;
      const adminId      = req.user.id;
      const message      = req.body.message?.trim();
  
      if (!message) {
        return res.status(400).json({ error: 'Denial message is required.' });
      }
  
      try {
        // 1) Fetch appeal to ensure it exists and is pending
        const [[ appeal ]] = await pool.query(
          `SELECT ban_id, user_id
           FROM appeals
           WHERE appeal_id = ? AND status = 'pending'`,
          [appealId]
        );
        if (!appeal) {
          return res.status(404).json({ error: 'Appeal not found or not pending.' });
        }
  
        const { ban_id: banId, user_id: targetId } = appeal;
  
        // 2) Update the appeal as denied
        await pool.query(
          `UPDATE appeals
           SET status = 'denied',
               decided_at = NOW(),
               decided_by = ?,
               decision_message = ?
           WHERE appeal_id = ?`,
          [adminId, message, appealId]
        );
  
        // 3) Send “Appeal Denied” embed to staff channel
        const mainGuild   = bot.guilds.cache.get(MAIN_GUILD_ID);
        if (mainGuild) {
          const staffChannel = mainGuild.channels.cache.get(APPEAL_CHANNEL_ID)
            || await mainGuild.channels.fetch(APPEAL_CHANNEL_ID).catch(() => null);
  
          if (staffChannel?.isTextBased()) {
            const embed = new EmbedBuilder()
              .setTitle('Appeal Denied')
              .setColor('Red')
              .setTimestamp()
              .addFields(
                { name: 'Appeal ID',      value: `#${appealId}`,                 inline: true  },
                { name: 'Applicant',      value: `<@${targetId}> (\`${targetId}\`)`, inline: false },
                { name: 'Denied By',      value: `<@${adminId}>`,                   inline: true  },
                { name: 'Denial Message', value: message,                           inline: false }
              );
            await staffChannel.send({ embeds: [embed] });
          }
        }
  
        // 4) Respond to the frontend
        return res.json({ success: true });
      } catch (err) {
        console.error('Error in deny route:', err);
        return res.status(500).json({ error: 'Server error' });
      }
    }
  );

module.exports = router;