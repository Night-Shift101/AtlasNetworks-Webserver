// appeals/routes/profile.js
const express = require('express');
const router = express.Router();
const pool = require('../middleware/db'); // your mysql2/promise pool
const ensureauth = require("../middleware/ensureauth")
// GET /profile/:userId
router.get('/:userId', ensureauth, async (req, res) => {
  const { userId } = req.params;
    if (userId !== req.user.id) {return res.redirect(`/profile/${req.user.id}`)}
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
    let user = req.user
    res.render('profile', { user, req, appeals, isadmin: false });
  } catch (err) {
    console.error('Error fetching appeals for user', userId, err);
    res.status(500).send('An error occurred while loading your appeals.');
  }
});
// routes/profile.js
router.get('/:userId/:appealId', ensureauth, async (req, res) => {
    const { userId, appealId } = req.params;
    if (userId !== req.user.id) {return res.redirect(`/profile/${req.user.id}`)}
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
      res.render('appealDetail', {
        user: req.user,
        appeal,
        punishment,
        isadmin: false
      });
    } catch (err) {
      console.error('Error loading appeal detail', err);
      res.status(500).send('Server error');
    }
  });
  

module.exports = router;
