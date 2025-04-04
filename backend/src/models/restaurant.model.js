const db = require('../config/database');

/**
 * Restaurant model with direct SQL implementation
 */
const Restaurant = {
  tableName: 'restaurants',
  
  findByPk: async (id) => {
    try {
      const results = await db.query('SELECT * FROM restaurants WHERE id = ?', [id]);
      return results[0];
    } catch (error) {
      console.error('Error in Restaurant.findByPk:', error);
      throw error;
    }
  },
  
  findOne: async (where) => {
    try {
      const whereClause = Object.entries(where)
        .map(([key, value]) => `${key} = ?`)
        .join(' AND ');
      const values = Object.values(where);
      
      const results = await db.query(`SELECT * FROM restaurants WHERE ${whereClause} LIMIT 1`, values);
      return results[0];
    } catch (error) {
      console.error('Error in Restaurant.findOne:', error);
      throw error;
    }
  },
  
  findAll: async (options = {}) => {
    try {
      let sql = 'SELECT * FROM restaurants';
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
      console.error('Error in Restaurant.findAll:', error);
      throw error;
    }
  },
  
  // Add findAndCountAll method to mimic Sequelize's behavior
  findAndCountAll: async (options = {}) => {
    try {
      // First, get the count without limit and offset
      let countSql = 'SELECT COUNT(*) as count FROM restaurants';
      const countValues = [];
      
      if (options.where) {
        const whereClause = Object.entries(options.where)
          .map(([key, value]) => `${key} = ?`)
          .join(' AND ');
        countSql += ` WHERE ${whereClause}`;
        countValues.push(...Object.values(options.where));
      }
      
      const countResult = await db.query(countSql, countValues);
      const count = countResult[0].count;
      
      // Then get the rows with limit and offset
      let rowsSql = 'SELECT * FROM restaurants';
      const rowsValues = [];
      
      if (options.where) {
        const whereClause = Object.entries(options.where)
          .map(([key, value]) => `${key} = ?`)
          .join(' AND ');
        rowsSql += ` WHERE ${whereClause}`;
        rowsValues.push(...Object.values(options.where));
      }
      
      if (options.order && options.order.length > 0) {
        // Handle sequelize-style ordering [[field, direction]]
        if (Array.isArray(options.order[0])) {
          const [field, direction] = options.order[0];
          rowsSql += ` ORDER BY ${field} ${direction}`;
        } else {
          rowsSql += ` ORDER BY ${options.order}`;
        }
      }
      
      if (options.limit) {
        rowsSql += ` LIMIT ${parseInt(options.limit)}`;
      }
      
      if (options.offset) {
        rowsSql += ` OFFSET ${parseInt(options.offset)}`;
      }
      
      const rows = await db.query(rowsSql, rowsValues);
      
      // Return in the format expected by the controller: { count, rows }
      return { count, rows };
    } catch (error) {
      console.error('Error in Restaurant.findAndCountAll:', error);
      throw error;
    }
  },
  
  create: async (data) => {
    try {
      // Handle JSON fields
      const processedData = { ...data };
      ['businessHours', 'deliveryZones', 'cuisine', 'features'].forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'object') {
          processedData[field] = JSON.stringify(processedData[field]);
        }
      });
      
      const columns = Object.keys(processedData).join(', ');
      const placeholders = Object.keys(processedData).map(() => '?').join(', ');
      const values = Object.values(processedData);
      
      const result = await db.query(
        `INSERT INTO restaurants (${columns}) VALUES (${placeholders})`, 
        values
      );
      
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error('Error in Restaurant.create:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      // Handle JSON fields
      const processedData = { ...data };
      ['businessHours', 'deliveryZones', 'cuisine', 'features'].forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'object') {
          processedData[field] = JSON.stringify(processedData[field]);
        }
      });
      
      const setClauses = Object.keys(processedData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(processedData), id];
      
      const result = await db.query(
        `UPDATE restaurants SET ${setClauses} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Restaurant.update:', error);
      throw error;
    }
  },
  
  destroy: async (id) => {
    try {
      const result = await db.query('DELETE FROM restaurants WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Restaurant.destroy:', error);
      throw error;
    }
  },
  
  count: async (where = {}) => {
    try {
      let sql = 'SELECT COUNT(*) as count FROM restaurants';
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
      console.error('Error in Restaurant.count:', error);
      throw error;
    }
  }
};

module.exports = Restaurant; 