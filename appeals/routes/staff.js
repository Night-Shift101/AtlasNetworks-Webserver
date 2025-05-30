// routes/staff.js
const express    = require('express');
const router     = express.Router();
const pool       = require('../middleware/db.js');
const ensureauth = require('../middleware/ensureauth');
const ensureadmin = require('../middleware/ensureadmin');
const bot = require('../middleware/bot')

// Admin home page (optional)
router.get('/', (req, res) => {
  res.render('staff/home', { user: req.user });
});

// Pending appeals
router.get('/appeals/pending', async (req, res) => {
  try {
    const [appeals] = await pool.query(
      `SELECT
         appeal_id,
         ban_id,
         user_id,
         filed_at
       FROM appeals
       WHERE status = 'pending'
       ORDER BY filed_at ASC`
    );
    res.render('staff/pendingAppeals', { user: req.user, appeals });
  } catch (err) {
    console.error('Error fetching pending appeals', err);
    res.status(500).send('Server error');
  }
});

// All appeals
router.get('/appeals/all', async (req, res) => {
  try {
    const [appeals] = await pool.query(
      `SELECT
         appeal_id,
         ban_id,
         user_id,
         status,
         filed_at,
         decided_at
       FROM appeals
       ORDER BY filed_at DESC`
    );
    res.render('staff/allAppeals', { user: req.user, appeals });
  } catch (err) {
    console.error('Error fetching all appeals', err);
    res.status(500).send('Server error');
  }
});
router.get('/profile/:userId', ensureadmin, async (req, res) => {
    const { userId } = req.params;

  try {
    // fetch all appeals by this user, newest first
    const [appeals] = await pool.query(
        `SELECT
           appeal_id,
           ban_id,
           status,
           filed_at,
           decided_at,
           decided_by,
           decision_message
         FROM appeals
         WHERE user_id = ?
         ORDER BY filed_at DESC`,
        [userId]
      );

    // render a view called 'profile', passing in the appeals array

    let user = await bot.users.fetch(userId)
    let isadmin = req.isAdmin
    res.render('profile', { user, req, appeals, isadmin });
  } catch (err) {
    console.error('Error fetching appeals for user', userId, err);
    res.status(500).send('An error occurred while loading your appeals.');
  }
  });



  router.get('/profile/:userId/:appealId', ensureadmin, async (req, res) => {
      const { userId, appealId } = req.params;
      try {
        // 1) Fetch the appeal itself
        const [appealRows] = await pool.query(
          `SELECT
             ban_id,
             appeal_id,
             appeal_message,
             status,
             filed_at,
             decided_at,
             decided_by,
             decision_message
           FROM appeals
           WHERE user_id = ? AND appeal_id = ?
           LIMIT 1`,
          [userId, appealId]
        );
    
        if (!appealRows.length) {
          return res.status(404).render('404', { message: 'Appeal not found.' });
        }
        const appeal = appealRows[0];
    
        // 2) If there's a ban_id, fetch the corresponding blacklist entry
        let punishment = null;
        if (appeal.ban_id) {
          const [blacklistRows] = await pool.query(
            `SELECT
               id,
               userId,
               reason,
               timestamp
             FROM blacklist
             WHERE id = ? AND userId = ? 
             LIMIT 1`,
            [appeal.ban_id, userId]
          );
          if (blacklistRows.length) {
            punishment = blacklistRows[0];
          }
        }
    
        // 3) Render, passing both appeal and (possibly null) punishment
        let passUser = await bot.users.fetch(userId)
        let isadmin = req.isAdmin
        res.render('appealDetail', {
          user: passUser,
          appeal,
          punishment,
          isadmin
        });
      } catch (err) {
        console.error('Error loading appeal detail', err);
        res.status(500).send('Server error');
      }
    });
module.exports = router;
