// app.js
require('dotenv').config();

const express  = require('express');
const session  = require('express-session');
const passport = require('./middleware/passport');
const path     = require('path');


////////////////////////////////////////////////////////////////////////////////
// Create the appealApp for bans.example.com
////////////////////////////////////////////////////////////////////////////////
const appealApp = express();

// view engine + static files
appealApp.set('views',      path.join(__dirname, 'views'));
appealApp.set('view engine', 'ejs');
appealApp.use(express.static(path.join(__dirname, 'public')));
appealApp.use(express.urlencoded({ extended: false }));
appealApp.use(express.json());

// session + passport
appealApp.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));

appealApp.use(passport.initialize());
appealApp.use(passport.session());

// Home route
appealApp.get('/login', passport.authenticate('discord-appeals'));

const ensureadmin = require('./middleware/ensureadmin');
const ensureauth = require('./middleware/ensureauth');

appealApp.get(
  '/auth/discord/callback',
  passport.authenticate('discord-appeals', { failureRedirect: '/' }),
  (req, res) => res.redirect('/postLogin')
);

// This route decides admin vs. normal user:
appealApp.get('/postLogin', ensureauth, ensureadmin, (req, res) => {
  if (req.isAdmin) {
    // send them to a choice page
    res.redirect('/choose');
  } else {
    // non-admins go straight to their appeals
    res.redirect(`/profile/${req.user.id}`);
  }
});
const chooseRouter = require('./routes/choose');
appealApp.use('/choose', chooseRouter);

appealApp.get('/logout', (req, res) => {
  req.logout(() => res.redirect('/'));
});


////////////////////////////////////////////////////////////////////////////////
// Import Routers
////////////////////////////////////////////////////////////////////////////////
const homeRouter = require('./routes/homeRouter');
appealApp.use('/', homeRouter);

const profileRouter = require('./routes/profile');
appealApp.use('/profile', profileRouter);

const appealRouter = require('./routes/appeal');
appealApp.use('/appeal', appealRouter);

const appealManageRouter = require('./routes/appealManagement');
appealApp.use('/appeal', appealManageRouter);

const staffRouter = require('./routes/staff');
appealApp.use('/staff', ensureauth, ensureadmin, staffRouter);

module.exports = {app:appealApp}