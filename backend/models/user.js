// Import the database connection and required packages
const { query } = require('../src/config/database');
const bcrypt = require('bcryptjs');

const User = {
  // Find all users with filtering and pagination
  findAll: async (options = {}) => {
    let sql = 'SELECT * FROM users';
    const params = [];
    const where = [];
    
    // Process where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value === null) {
          where.push(`${key} IS NULL`);
        } else if (Array.isArray(value)) {
          where.push(`${key} IN (?)`);
          params.push(value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle operator objects (like { gte: 5 })
          Object.entries(value).forEach(([op, val]) => {
            switch(op) {
              case 'gte':
                where.push(`${key} >= ?`);
                params.push(val);
                break;
              case 'lte':
                where.push(`${key} <= ?`);
                params.push(val);
                break;
              case 'gt':
                where.push(`${key} > ?`);
                params.push(val);
                break;
              case 'lt':
                where.push(`${key} < ?`);
                params.push(val);
                break;
              case 'like':
                where.push(`${key} LIKE ?`);
                params.push(`%${val}%`);
                break;
              case 'notLike':
                where.push(`${key} NOT LIKE ?`);
                params.push(`%${val}%`);
                break;
              default:
                where.push(`${key} = ?`);
                params.push(val);
            }
          });
        } else {
          where.push(`${key} = ?`);
          params.push(value);
        }
      });
    }
    
    // Add where clause if conditions exist
    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }
    
    // Add ordering
    if (options.order) {
      sql += ' ORDER BY ' + options.order.map(([col, dir]) => `${col} ${dir}`).join(', ');
    } else {
      sql += ' ORDER BY id DESC';
    }
    
    // Add pagination
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(Number(options.limit));
      
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(Number(options.offset));
      }
    }
    
    const users = await query(sql, params);
    
    // Remove sensitive data
    return users.map(user => {
      const { password, socialToken, verificationToken, resetPasswordToken, 
              emailVerificationOtp, phoneVerificationOtp, resetPasswordOtp, ...safeUser } = user;
      return safeUser;
    });
  },
  
  // Find user by primary key (id)
  findByPk: async (id) => {
    const sql = 'SELECT * FROM users WHERE id = ?';
    const results = await query(sql, [id]);
    
    if (results.length === 0) return null;
    
    // Remove sensitive data
    const { password, socialToken, verificationToken, resetPasswordToken, 
            emailVerificationOtp, phoneVerificationOtp, resetPasswordOtp, ...safeUser } = results[0];
    return safeUser;
  },
  
  // Find a single user by conditions
  findOne: async (options = {}) => {
    const users = await User.findAll({
      ...options,
      limit: 1
    });
    
    return users[0] || null;
  },
  
  // Find a user by email (common operation)
  findByEmail: async (email) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const results = await query(sql, [email]);
    
    return results[0] || null;
  },
  
  // Find a user for authentication (returns with password for verification)
  findForAuth: async (email) => {
    const sql = 'SELECT * FROM users WHERE email = ?';
    const results = await query(sql, [email]);
    
    return results[0] || null;
  },
  
  // Create a new user
  create: async (data) => {
    // Hash password if provided
    const userData = { ...data };
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }
    
    // Process JSON fields
    for (const field of ['notificationPreferences', 'favoriteRestaurants', 'favoriteDishes']) {
      if (userData[field] && typeof userData[field] !== 'string') {
        userData[field] = JSON.stringify(userData[field]);
      }
    }
    
    const columns = Object.keys(userData).join(', ');
    const placeholders = Object.keys(userData).map(() => '?').join(', ');
    const values = Object.values(userData);
    
    const sql = `INSERT INTO users (${columns}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    // Return the created user without sensitive data
    const { password, socialToken, verificationToken, resetPasswordToken, 
            emailVerificationOtp, phoneVerificationOtp, resetPasswordOtp, ...safeUser } = userData;
    
    return {
      id: result.insertId,
      ...safeUser
    };
  },
  
  // Update a user
  update: async (data, options) => {
    const userData = { ...data };
    const params = [];
    
    // Hash password if changed
    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 12);
    }
    
    // Process JSON fields
    for (const field of ['notificationPreferences', 'favoriteRestaurants', 'favoriteDishes']) {
      if (userData[field] && typeof userData[field] !== 'string') {
        userData[field] = JSON.stringify(userData[field]);
      }
    }
    
    const sets = Object.entries(userData).map(([key, value]) => {
      params.push(value);
      return `${key} = ?`;
    }).join(', ');
    
    let sql = `UPDATE users SET ${sets}`;
    const where = [];
    
    // Process where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        where.push(`${key} = ?`);
        params.push(value);
      });
    }
    
    // Add where clause
    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }
    
    const result = await query(sql, params);
    
    // If id is specified in options.where, return the updated user
    if (options.where && options.where.id) {
      return User.findByPk(options.where.id);
    }
    
    return result.affectedRows;
  },
  
  // Delete a user
  destroy: async (options) => {
    let sql = 'DELETE FROM users';
    const params = [];
    const where = [];
    
    // Process where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        where.push(`${key} = ?`);
        params.push(value);
      });
    }
    
    // Add where clause
    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }
    
    const result = await query(sql, params);
    return result.affectedRows;
  },
  
  // Compare password (replacement for User.correctPassword() instance method)
  correctPassword: async (candidatePassword, userPassword) => {
    try {
      if (!userPassword) return false;
      console.log('Comparing passwords:');
      console.log('Candidate password length:', candidatePassword.length);
      console.log('Stored hash:', userPassword);
      const isMatch = await bcrypt.compare(candidatePassword, userPassword);
      console.log('Password match result:', isMatch);
      return isMatch;
    } catch (error) {
      console.error('Password comparison error:', error);
      return false;
    }
  },
  
  // Update last login timestamp
  updateLoginTimestamp: async (userId) => {
    const sql = 'UPDATE users SET lastLogin = NOW() WHERE id = ?';
    return await query(sql, [userId]);
  },
  
  // Add a restaurant to user's favorites
  addFavoriteRestaurant: async (userId, restaurantId) => {
    // First get current favorites
    const user = await User.findByPk(userId);
    if (!user) return false;
    
    let favorites = [];
    try {
      favorites = user.favoriteRestaurants ? JSON.parse(user.favoriteRestaurants) : [];
    } catch (e) {
      favorites = [];
    }
    
    // Add if not already in favorites
    if (!favorites.includes(restaurantId)) {
      favorites.push(restaurantId);
      await User.update(
        { favoriteRestaurants: JSON.stringify(favorites) },
        { where: { id: userId } }
      );
    }
    
    return true;
  },
  
  // Remove a restaurant from user's favorites
  removeFavoriteRestaurant: async (userId, restaurantId) => {
    // First get current favorites
    const user = await User.findByPk(userId);
    if (!user) return false;
    
    let favorites = [];
    try {
      favorites = user.favoriteRestaurants ? JSON.parse(user.favoriteRestaurants) : [];
    } catch (e) {
      favorites = [];
    }
    
    // Remove from favorites if exists
    const index = favorites.indexOf(restaurantId);
    if (index !== -1) {
      favorites.splice(index, 1);
      await User.update(
        { favoriteRestaurants: JSON.stringify(favorites) },
        { where: { id: userId } }
      );
    }
    
    return true;
  }
};

module.exports = User; 