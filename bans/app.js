// app.js
require('dotenv').config();

const express  = require('express');
const session  = require('express-session');
const passport = require('./middleware/passport');
const path     = require('path');

const bot       = require('./middleware/bot');
const bansRoute = require('./routes/bans');

////////////////////////////////////////////////////////////////////////////////
// 1) Create the banApp for bans.example.com
////////////////////////////////////////////////////////////////////////////////
const banApp = express();

// view engine + static files
banApp.set('views',      path.join(__dirname, 'views'));
banApp.set('view engine', 'ejs');
banApp.use(express.static(path.join(__dirname, 'public')));
banApp.use(express.urlencoded({ extended: false }));

// session + passport
banApp.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
banApp.use(passport.initialize());
banApp.use(passport.session());

// Auth routes
banApp.get('/login', passport.authenticate('discord-bans'));
banApp.get('/auth/discord/callback',
  passport.authenticate('discord-bans', { failureRedirect: '/' }),
  (req, res) => res.redirect('/bans')
);
banApp.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});

// Home route
banApp.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.send(`
      <p>Welcome, ${req.user.username}#${req.user.discriminator}</p>
      <p><a href="/bans">View Your Bans</a> | <a href="/logout">Logout</a></p>
    `);
  } else {
    res.send(`<p><a href="/login">Login with Discord</a></p>`);
  }
});

// Mount the bans router
banApp.use('/bans', require('./routes/bans'));
banApp.use('/bans', require('./routes/blacklists'));
module.exports = {app:banApp}