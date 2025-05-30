// routes/staff/bansLookup.js
const express    = require('express');
const router     = express.Router();
const { ensureAuth } = require('../middleware/auth');
const bot        = require('../middleware/bot');

router.get('/', ensureAuth, (req, res) => {
  // first load: just show the empty form
  res.render('bansLookup', {
    user: req.user,
    queryId: null,
    results: null,
    error: null
  });
});

router.post('/', ensureAuth, async (req, res, next) => {
  const queryId = req.body.userId?.trim();
  if (!queryId) {
    return res.render('bansLookup', {
      user: req.user,
      queryId: null,
      results: null,
      error: 'Please enter a valid Discord ID.'
    });
  }

  try {
    const results = [];

    await Promise.all(
      bot.guilds.cache.map(async guild => {
        try {
          const ban = await guild.bans.fetch(queryId);
          if (ban) {
            results.push({
              guild: guild.name,
              reason: ban.reason || 'No reason given'
            });
          }
        } catch (err) {
          // ignore “not banned” errors
          if (err.code !== 10026) console.error(`Error checking ${guild.id}:`, err);
        }
      })
    );

    res.render('bansLookup', {
      user: req.user,
      queryId,
      results,
      error: null
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
