const jwt = require('jsonwebtoken');
const config = require('../config');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required' 
      });
    }

    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      
      // Ensure we have the required user data
      if (!decoded.id) {
        throw new Error('Invalid token payload');
      }

      req.user = decoded;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          error: 'Token has expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        success: false,
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error during authentication' 
    });
  }
};

module.exports = auth;