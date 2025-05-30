const express = require('express');
const staffpassport = require('passport');
const router = express.Router();

// Home & OAuth routes
router.get('/',           (req, res) => res.render('login',    { user: req.user }));
router.get('/auth/discord',      staffpassport.authenticate('discord-staff'));
router.get('/auth/discord/callback',
  staffpassport.authenticate('discord-staff', { failureRedirect: '/' }),
  (req, res) => res.redirect('/members')
);
router.get('/logout', (req, res) => req.logout(() => res.redirect('/')));

module.exports = router;
