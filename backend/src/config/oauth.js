const { OAuth2Client } = require('google-auth-library');

// Load environment variables
require('dotenv').config();

// Create Google OAuth client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
);

// Facebook OAuth config
const facebookConfig = {
  appId: process.env.FACEBOOK_APP_ID,
  appSecret: process.env.FACEBOOK_APP_SECRET,
  redirectUri: process.env.FACEBOOK_REDIRECT_URI || 'http://localhost:3000/api/auth/facebook/callback',
  graphApiVersion: 'v18.0' // Use the latest supported version
};

module.exports = {
  googleClient,
  facebookConfig
};
