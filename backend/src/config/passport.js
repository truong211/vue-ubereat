const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const oauthConfig = require('./oauth.config');

// Configure Google Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: oauthConfig.google.clientID,
      clientSecret: oauthConfig.google.clientSecret,
      callbackURL: oauthConfig.google.callbackURL,
      scope: ['profile', 'email']
    },
    (accessToken, refreshToken, profile, done) => {
      // Pass profile info to callback
      return done(null, profile);
    }
  )
);

// Configure Facebook Strategy
passport.use(
  new FacebookStrategy(
    {
      clientID: oauthConfig.facebook.clientID,
      clientSecret: oauthConfig.facebook.clientSecret,
      callbackURL: oauthConfig.facebook.callbackURL,
      profileFields: oauthConfig.facebook.profileFields
    },
    (accessToken, refreshToken, profile, done) => {
      // Pass profile info to callback
      return done(null, profile);
    }
  )
);

// Serialize and deserialize user (required for session)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

module.exports = passport;