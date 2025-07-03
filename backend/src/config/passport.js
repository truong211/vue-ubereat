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
    async (accessToken, refreshToken, profile, done) => {
      try {
        const User = require('../../models/user');

        // Extract email and name
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        const fullName = profile.displayName || `${profile.name.givenName || ''} ${profile.name.familyName || ''}`.trim();

        if (!email) {
          return done(new Error('Google profile does not contain an email'));
        }

        // Check if user exists by email
        let user = await User.findByEmail(email);

        // If not, create
        if (!user) {
          // Generate unique username from email local part
          let username = email.split('@')[0];
          if (username.length < 3) {
            username += Math.random().toString(36).substring(2, 5);
          }

          user = await User.create({
            fullName,
            email,
            username,
            isEmailVerified: true,
            socialProvider: 'google',
            socialId: profile.id,
            profileImage: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
            role: 'customer'
          });
        } else {
          // Update social details if missing
          await User.update(
            {
              socialProvider: 'google',
              socialId: profile.id,
              isEmailVerified: true,
              profileImage: profile.photos && profile.photos[0] ? profile.photos[0].value : user.profileImage
            },
            { where: { id: user.id } }
          );
          user = await User.findByPk(user.id); // Refresh data
        }

        return done(null, user);
      } catch (err) {
        console.error('Google passport strategy error:', err);
        return done(err, null);
      }
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