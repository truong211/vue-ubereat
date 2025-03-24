const axios = require('axios');
const { User } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/error.middleware');
const config = require('../config/config');

/**
 * Verify Google ID token and extract user information
 */
const verifyGoogleToken = async (idToken) => {
  try {
    // Verify the token with Google
    const response = await axios.get(
      `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${idToken}`
    );
    
    if (!response.data || !response.data.sub) {
      throw new AppError('Invalid Google token', 401);
    }
    
    // Extract user information
    return {
      providerId: response.data.sub,
      email: response.data.email,
      name: response.data.name || `${response.data.given_name} ${response.data.family_name}`,
      picture: response.data.picture,
      isEmailVerified: response.data.email_verified === 'true'
    };
  } catch (error) {
    console.error('Google token verification error:', error);
    throw new AppError('Failed to verify Google token', 401);
  }
};

/**
 * Verify Facebook access token and extract user information
 */
const verifyFacebookToken = async (accessToken) => {
  try {
    // Get user information from Facebook
    const response = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`
    );
    
    if (!response.data || !response.data.id) {
      throw new AppError('Invalid Facebook token', 401);
    }
    
    // Extract user information
    return {
      providerId: response.data.id,
      email: response.data.email,
      name: response.data.name,
      picture: response.data.picture?.data?.url,
      isEmailVerified: true // Facebook provides verified emails
    };
  } catch (error) {
    console.error('Facebook token verification error:', error);
    throw new AppError('Failed to verify Facebook token', 401);
  }
};

/**
 * Handle social login/registration flow
 */
const handleSocialAuth = async (provider, userData) => {
  const { providerId, email, name, picture, isEmailVerified } = userData;
  
  // Find user by social ID or email
  let user = await User.findOne({
    where: {
      [Op.or]: [
        { socialId: providerId, socialProvider: provider },
        { email }
      ]
    }
  });
  
  if (user) {
    // Update user information
    await user.update({
      socialProvider: provider,
      socialId: providerId,
      isEmailVerified: isEmailVerified || user.isEmailVerified,
      profileImage: user.profileImage || picture,
      lastLogin: new Date()
    });
  } else {
    // Create new user
    user = await User.create({
      username: `${provider}_${providerId}`,
      email,
      fullName: name,
      socialProvider: provider,
      socialId: providerId,
      isEmailVerified,
      profileImage: picture,
      lastLogin: new Date()
    });
  }
  
  return user;
};

/**
 * Handle Google login/registration
 */
const loginWithGoogle = async (idToken) => {
  const userData = await verifyGoogleToken(idToken);
  return await handleSocialAuth('google', userData);
};

/**
 * Handle Facebook login/registration
 */
const loginWithFacebook = async (accessToken) => {
  const userData = await verifyFacebookToken(accessToken);
  return await handleSocialAuth('facebook', userData);
};

module.exports = {
  verifyGoogleToken,
  verifyFacebookToken,
  handleSocialAuth,
  loginWithGoogle,
  loginWithFacebook
}; 