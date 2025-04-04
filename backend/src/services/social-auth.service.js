const axios = require('axios');
const { User } = require('../models');
const { Op } = require('sequelize');
const { AppError } = require('../middleware/error.middleware');
const config = require('../config/config');
const db = require('../config/database');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

class SocialAuthService {
  constructor() {}

  async handleSocialAuth(profile, provider) {
    try {
      // Check if user exists by social ID
      const [existingUser] = await db.query(
        'SELECT * FROM users WHERE socialProvider = ? AND socialId = ?',
        [provider, profile.id]
      );

      if (existingUser) {
        // Update token if needed
        if (profile.token && profile.token !== existingUser.socialToken) {
          await db.query(
            'UPDATE users SET socialToken = ?, lastLogin = NOW() WHERE id = ?',
            [profile.token, existingUser.id]
          );
        }
        
        return this.generateTokenResponse(existingUser);
      }

      // Check if email already exists
      if (profile.email) {
        const [emailUser] = await db.query(
          'SELECT * FROM users WHERE email = ?',
          [profile.email]
        );

        if (emailUser) {
          // Link social account to existing email account
          await db.query(
            'UPDATE users SET socialProvider = ?, socialId = ?, socialToken = ?, lastLogin = NOW() WHERE id = ?',
            [provider, profile.id, profile.token, emailUser.id]
          );
          
          return this.generateTokenResponse(emailUser);
        }
      }

      // Create new user if not exists
      const newUser = {
        username: this.generateUsername(profile),
        fullName: profile.displayName || profile.name || 'Social User',
        email: profile.email || `${profile.id}@${provider}.user`,
        profileImage: profile.picture || profile.photos?.[0]?.value || null,
        socialProvider: provider,
        socialId: profile.id,
        socialToken: profile.token,
        isEmailVerified: !!profile.email, // Auto-verify if email provided by provider
        password: await this.generateRandomPassword(),
        role: 'customer',
        isActive: true,
        lastLogin: new Date()
      };

      const result = await db.query(
        `INSERT INTO users SET ?`,
        [newUser]
      );

      newUser.id = result.insertId;
      return this.generateTokenResponse(newUser);
    } catch (error) {
      console.error('Social auth error:', error);
      throw error;
    }
  }

  generateUsername(profile) {
    const baseName = profile.displayName || profile.name || 'user';
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const randomString = crypto.randomBytes(4).toString('hex');
    return `${sanitizedName}_${randomString}`;
  }

  async generateRandomPassword() {
    // Generate random password and hash it
    const password = crypto.randomBytes(10).toString('hex');
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  generateTokenResponse(user) {
    const accessToken = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        profileImage: user.profileImage
      },
      accessToken
    };
  }
}

module.exports = new SocialAuthService(); 