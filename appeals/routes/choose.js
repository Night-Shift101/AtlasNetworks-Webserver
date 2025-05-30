// routes/choose.js
const express = require('express');
const router  = express.Router();
const ensureAuth = require('../middleware/ensureauth');
const checkAdmin = require('../middleware/ensureadmin');

router.get('/', ensureAuth, checkAdmin, (req, res) => {
  if (!req.isAdmin) {
    return res.redirect(`/profile/${req.user.id}`);
  }
  res.render('choose', { user: req.user });
});

module.exports = router;
