// passportConfig.js
require('dotenv').config();
const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;

// Scopes we need: identify (username, discriminator), guilds (list of guilds)
const SCOPES = ['identify', 'guilds'];

passport.serializeUser((user, done) => {
  // store entire Discord profile in session (or just id)
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});
const banStrat = new DiscordStrategy({
    clientID:     process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL:  "http://bans.atlasnetworksroleplay.com/auth/discord/callback",  // e.g. https://app.example.com/auth/discord/callback
    scope:        SCOPES
  },
  (accessToken, refreshToken, profile, done) => {
    // you could persist accessToken if you need to fetch additional data later
    profile.accessToken = accessToken;
    return done(null, profile);
  }
)
passport.use('discord-bans', banStrat);

module.exports = passport;
