const db = require('../config/database');

/**
 * Product model with direct SQL implementation
 */
const Product = {
  tableName: 'products',
  
  findByPk: async (id) => {
    try {
      const results = await db.query('SELECT * FROM products WHERE id = ?', [id]);
      return results[0];
    } catch (error) {
      console.error('Error in Product.findByPk:', error);
      throw error;
    }
  },
  
  findOne: async (where) => {
    try {
      const whereClause = Object.entries(where)
        .map(([key, value]) => `${key} = ?`)
        .join(' AND ');
      const values = Object.values(where);
      
      const results = await db.query(`SELECT * FROM products WHERE ${whereClause} LIMIT 1`, values);
      return results[0];
    } catch (error) {
      console.error('Error in Product.findOne:', error);
      throw error;
    }
  },
  
  findAll: async (options = {}) => {
    try {
      let sql = 'SELECT * FROM products';
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
      console.error('Error in Product.findAll:', error);
      throw error;
    }
  },
  
  create: async (data) => {
    try {
      // Handle JSON fields
      const processedData = { ...data };
      ['nutritionalInfo', 'options'].forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'object') {
          processedData[field] = JSON.stringify(processedData[field]);
        }
      });
      
      const columns = Object.keys(processedData).join(', ');
      const placeholders = Object.keys(processedData).map(() => '?').join(', ');
      const values = Object.values(processedData);
      
      const result = await db.query(
        `INSERT INTO products (${columns}) VALUES (${placeholders})`, 
        values
      );
      
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error('Error in Product.create:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      // Handle JSON fields
      const processedData = { ...data };
      ['nutritionalInfo', 'options'].forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'object') {
          processedData[field] = JSON.stringify(processedData[field]);
        }
      });
      
      const setClauses = Object.keys(processedData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(processedData), id];
      
      const result = await db.query(
        `UPDATE products SET ${setClauses} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Product.update:', error);
      throw error;
    }
  },
  
  destroy: async (id) => {
    try {
      const result = await db.query('DELETE FROM products WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Product.destroy:', error);
      throw error;
    }
  },
  
  count: async (where = {}) => {
    try {
      let sql = 'SELECT COUNT(*) as count FROM products';
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
      console.error('Error in Product.count:', error);
      throw error;
    }
  }
};

module.exports = Product; 