const db = require('../config/database');

/**
 * SiteConfig model with direct SQL implementation
 */
const SiteConfig = {
  tableName: 'site_config',
  
  findByPk: async (id) => {
    try {
      const results = await db.query('SELECT * FROM site_config WHERE id = ?', [id]);
      return results[0];
    } catch (error) {
      console.error('Error in SiteConfig.findByPk:', error);
      throw error;
    }
  },
  
  findOne: async (where = {}) => {
    try {
      if (Object.keys(where).length === 0) {
        // If no conditions provided, just get the first record (usually only one config exists)
        const results = await db.query(`SELECT * FROM site_config LIMIT 1`);
        return results[0];
      }
      
      const whereClause = Object.entries(where)
        .map(([key, value]) => `${key} = ?`)
        .join(' AND ');
      const values = Object.values(where);
      
      const results = await db.query(`SELECT * FROM site_config WHERE ${whereClause} LIMIT 1`, values);
      return results[0];
    } catch (error) {
      console.error('Error in SiteConfig.findOne:', error);
      throw error;
    }
  },
  
  findAll: async (options = {}) => {
    try {
      let sql = 'SELECT * FROM site_config';
      const values = [];
      
      if (options.where) {
        const whereClause = Object.entries(options.where)
          .map(([key, value]) => `${key} = ?`)
          .join(' AND ');
        sql += ` WHERE ${whereClause}`;
        values.push(...Object.values(options.where));
      }
      
      if (options.limit) {
        sql += ` LIMIT ${parseInt(options.limit)}`;
      }
      
      if (options.offset) {
        sql += ` OFFSET ${parseInt(options.offset)}`;
      }
      
      return await db.query(sql, values);
    } catch (error) {
      console.error('Error in SiteConfig.findAll:', error);
      throw error;
    }
  },
  
  create: async (data) => {
    try {
      // Handle JSON fields
      const processedData = { ...data };
      ['socialLinks', 'metaTags'].forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'object') {
          processedData[field] = JSON.stringify(processedData[field]);
        }
      });
      
      const columns = Object.keys(processedData).join(', ');
      const placeholders = Object.keys(processedData).map(() => '?').join(', ');
      const values = Object.values(processedData);
      
      const result = await db.query(
        `INSERT INTO site_config (${columns}) VALUES (${placeholders})`, 
        values
      );
      
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error('Error in SiteConfig.create:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      // Handle JSON fields
      const processedData = { ...data };
      ['socialLinks', 'metaTags'].forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'object') {
          processedData[field] = JSON.stringify(processedData[field]);
        }
      });
      
      const setClauses = Object.keys(processedData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(processedData), id];
      
      const result = await db.query(
        `UPDATE site_config SET ${setClauses} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in SiteConfig.update:', error);
      throw error;
    }
  },
  
  destroy: async (id) => {
    try {
      const result = await db.query('DELETE FROM site_config WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in SiteConfig.destroy:', error);
      throw error;
    }
  },
  
  // Find or create a config record
  findOrCreate: async (options) => {
    try {
      const { where, defaults } = options;
      
      // Try to find the record
      let config = null;
      if (Object.keys(where).length > 0) {
        const whereClause = Object.entries(where)
          .map(([key, value]) => `${key} = ?`)
          .join(' AND ');
        const values = Object.values(where);
        
        const results = await db.query(`SELECT * FROM site_config WHERE ${whereClause} LIMIT 1`, values);
        config = results[0];
      } else {
        // Get the first record if no conditions
        const results = await db.query('SELECT * FROM site_config LIMIT 1');
        config = results[0];
      }
      
      // If not found, create it with defaults
      if (!config) {
        const data = { ...defaults };
        
        // Handle JSON fields
        ['socialLinks', 'metaTags'].forEach(field => {
          if (data[field] && typeof data[field] === 'object') {
            data[field] = JSON.stringify(data[field]);
          }
        });
        
        const columns = Object.keys(data).join(', ');
        const placeholders = Object.keys(data).map(() => '?').join(', ');
        const values = Object.values(data);
        
        const result = await db.query(
          `INSERT INTO site_config (${columns}) VALUES (${placeholders})`, 
          values
        );
        
        config = { id: result.insertId, ...defaults };
        return [config, true]; // Created
      }
      
      return [config, false]; // Found existing
    } catch (error) {
      console.error('Error in SiteConfig.findOrCreate:', error);
      throw error;
    }
  }
};

module.exports = SiteConfig; 