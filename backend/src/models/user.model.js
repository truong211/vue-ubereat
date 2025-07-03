const bcrypt = require('bcryptjs');
const db = require('../config/database');

/**
 * User model with direct SQL implementation
 */
const User = {
  tableName: 'users',
  
  findByPk: async (id, _options = {}) => {
    try {
      // Check if id is undefined or null, return null early
      if (id === undefined || id === null) {
        return null;
      }
      
      const results = await db.query('SELECT * FROM users WHERE id = ?', [id]);
      return results[0];
    } catch (error) {
      console.error('Error in User.findByPk:', error);
      throw error;
    }
  },
  
  findOne: async (where) => {
    try {
      const whereClause = Object.entries(where)
        .map(([key, value]) => `${key} = ?`)
        .join(' AND ');
      const values = Object.values(where);
      
      const results = await db.query(`SELECT * FROM users WHERE ${whereClause} LIMIT 1`, values);
      return results[0];
    } catch (error) {
      console.error('Error in User.findOne:', error);
      throw error;
    }
  },
  
  findAll: async (options = {}) => {
    try {
      let sql = 'SELECT * FROM users';
      const values = [];
      
      if (options.where) {
        const whereClause = Object.entries(options.where)
          .map(([key, value]) => `${key} = ?`)
          .join(' AND ');
        sql += ` WHERE ${whereClause}`;
        values.push(...Object.values(options.where));
      }
      
      if (options.order) {
        sql += ` ORDER BY ${options.order}`;
      }
      
      if (options.limit) {
        sql += ` LIMIT ${parseInt(options.limit)}`;
      }
      
      if (options.offset) {
        sql += ` OFFSET ${parseInt(options.offset)}`;
      }
      
      return await db.query(sql, values);
    } catch (error) {
      console.error('Error in User.findAll:', error);
      throw error;
    }
  },
  
  create: async (data) => {
    try {
      // Handle password hashing
      const processedData = { ...data };
      if (processedData.password) {
        const salt = await bcrypt.genSalt(10);
        processedData.password = await bcrypt.hash(processedData.password, salt);
      }
      
      // Handle JSON fields
      ['preferences', 'savedAddresses'].forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'object') {
          processedData[field] = JSON.stringify(processedData[field]);
        }
      });
      
      const columns = Object.keys(processedData).join(', ');
      const placeholders = Object.keys(processedData).map(() => '?').join(', ');
      const values = Object.values(processedData);
      
      const result = await db.query(
        `INSERT INTO users (${columns}) VALUES (${placeholders})`, 
        values
      );
      
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error('Error in User.create:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      // Handle password hashing
      const processedData = { ...data };
      if (processedData.password) {
        const salt = await bcrypt.genSalt(10);
        processedData.password = await bcrypt.hash(processedData.password, salt);
      }
      
      // Handle JSON fields
      ['preferences', 'savedAddresses'].forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'object') {
          processedData[field] = JSON.stringify(processedData[field]);
        }
      });
      
      const setClauses = Object.keys(processedData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(processedData), id];
      
      const result = await db.query(
        `UPDATE users SET ${setClauses} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in User.update:', error);
      throw error;
    }
  },
  
  destroy: async (id) => {
    try {
      const result = await db.query('DELETE FROM users WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in User.destroy:', error);
      throw error;
    }
  },
  
  count: async (where = {}) => {
    try {
      let sql = 'SELECT COUNT(*) as count FROM users';
      const values = [];
      
      if (Object.keys(where).length > 0) {
        const whereClause = Object.entries(where)
          .map(([key, value]) => `${key} = ?`)
          .join(' AND ');
        sql += ` WHERE ${whereClause}`;
        values.push(...Object.values(where));
      }
      
      const results = await db.query(sql, values);
      return results[0].count;
    } catch (error) {
      console.error('Error in User.count:', error);
      throw error;
    }
  },
  
  // Special method to verify password
  comparePassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },
  
  // Utility functions
  validatePassword: async (user, password) => {
    return await bcrypt.compare(password, user.password);
  },
  
  passwordChangedAfter: (user, timestamp) => {
    if (user.passwordChangedAt) {
      const changedTimestamp = parseInt(
        new Date(user.passwordChangedAt).getTime() / 1000,
        10
      );
      return timestamp < changedTimestamp;
    }
    return false;
  }
};

module.exports = User;
