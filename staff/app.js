require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const staffpassport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const { Client, GatewayIntentBits } = require('discord.js');
const { rolecheck } = require('./middleware/auth');

const staffApp = express();

// static, view engine, session, staffpassport, etc
staffApp.use(express.static(path.join(__dirname, '/public')));
staffApp.set('view engine', 'ejs');
staffApp.use(express.urlencoded({ extended: true }));
staffApp.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false }));
staffApp.use(staffpassport.initialize());
staffApp.use(staffpassport.session());
staffApp.set('views', path.join(__dirname, '/views'));

staffpassport.serializeUser((u, done) => done(null, u));
staffpassport.deserializeUser((u, done) => done(null, u));
const staffStrategy = new DiscordStrategy({
  clientID:     process.env.DISCORD_CLIENT_ID,
  clientSecret: process.env.DISCORD_CLIENT_SECRET,
  callbackURL:  "http://staff.atlasnetworksroleplay.com/auth/discord/callback",      // e.g. https://app.example.com/auth/discord/callback
  scope:        ['identify','guilds']
}, (accessToken, refreshToken, profile, done) => done(null, profile));
staffpassport.use('discord-staff', staffStrategy);
staffApp.use(rolecheck)
// Mount routers (express.Router) ─ see “Routing” in the Express guide:
staffApp.use('/',           require('./routes/auth'));           // https://expressjs.com/en/guide/routing.html
staffApp.use('/members',    require('./routes/members'));
staffApp.use('/members',    require('./routes/profile'));
staffApp.use('/',    require('./routes/rootadmin'));
staffApp.use('/bans-lookup',    require('./routes/bansLookup'));
// catch-all error handler or 404 here…

module.exports = { app: staffApp };
