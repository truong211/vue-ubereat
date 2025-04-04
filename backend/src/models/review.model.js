const db = require('../config/database');

/**
 * Review model with direct SQL implementation
 */
const Review = {
  tableName: 'reviews',
  
  findByPk: async (id) => {
    try {
      const results = await db.query('SELECT * FROM reviews WHERE id = ?', [id]);
      return results[0];
    } catch (error) {
      console.error('Error in Review.findByPk:', error);
      throw error;
    }
  },
  
  findOne: async (where) => {
    try {
      const whereClause = Object.entries(where)
        .map(([key, value]) => `${key} = ?`)
        .join(' AND ');
      const values = Object.values(where);
      
      const results = await db.query(`SELECT * FROM reviews WHERE ${whereClause} LIMIT 1`, values);
      return results[0];
    } catch (error) {
      console.error('Error in Review.findOne:', error);
      throw error;
    }
  },
  
  findAll: async (options = {}) => {
    try {
      let sql = 'SELECT * FROM reviews';
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
      console.error('Error in Review.findAll:', error);
      throw error;
    }
  },
  
  create: async (data) => {
    try {
      // Handle JSON fields
      const processedData = { ...data };
      if (processedData.images && typeof processedData.images === 'object') {
        processedData.images = JSON.stringify(processedData.images);
      }
      
      const columns = Object.keys(processedData).join(', ');
      const placeholders = Object.keys(processedData).map(() => '?').join(', ');
      const values = Object.values(processedData);
      
      const result = await db.query(
        `INSERT INTO reviews (${columns}) VALUES (${placeholders})`, 
        values
      );
      
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error('Error in Review.create:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      // Handle JSON fields
      const processedData = { ...data };
      if (processedData.images && typeof processedData.images === 'object') {
        processedData.images = JSON.stringify(processedData.images);
      }
      
      const setClauses = Object.keys(processedData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(processedData), id];
      
      const result = await db.query(
        `UPDATE reviews SET ${setClauses} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Review.update:', error);
      throw error;
    }
  },
  
  destroy: async (id) => {
    try {
      const result = await db.query('DELETE FROM reviews WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Review.destroy:', error);
      throw error;
    }
  },
  
  count: async (where = {}) => {
    try {
      let sql = 'SELECT COUNT(*) as count FROM reviews';
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
      console.error('Error in Review.count:', error);
      throw error;
    }
  },
  
  // Find by primary key with join to get user and restaurant information
  findByPkWithDetails: async (id) => {
    try {
      const query = `
        SELECT r.*, u.fullName as userName, res.name as restaurantName 
        FROM reviews r 
        LEFT JOIN users u ON r.userId = u.id 
        LEFT JOIN restaurants res ON r.restaurantId = res.id 
        WHERE r.id = ?
      `;
      
      const results = await db.query(query, [id]);
      return results[0];
    } catch (error) {
      console.error('Error in Review.findByPkWithDetails:', error);
      throw error;
    }
  }
};

module.exports = Review; 