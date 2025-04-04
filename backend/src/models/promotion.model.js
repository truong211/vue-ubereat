const { query } = require('../config/database');

// A simple class that mimics a Sequelize model but uses direct SQL connection
class Promotion {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  // For Sequelize compatibility
  toJSON() {
    return { ...this };
  }

  // Save method to mimic Sequelize's save
  async save() {
    // If the promotion has an ID, it's an update, otherwise it's a create
    if (this.id) {
      const { id, ...data } = this;
      
      // Handle special fields like JSON
      for (const [key, value] of Object.entries(data)) {
        if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
          data[key] = JSON.stringify(value);
        }
      }
      
      // Create the SET part of the SQL
      const setClauses = [];
      const params = [];
      
      for (const [key, value] of Object.entries(data)) {
        setClauses.push(`${key} = ?`);
        params.push(value);
      }
      
      // If there's nothing to update, just return
      if (setClauses.length === 0) return this;
      
      // Add the ID to the parameters
      params.push(id);
      
      const sql = `UPDATE promotions SET ${setClauses.join(', ')} WHERE id = ?`;
      await query(sql, params);
      
      return this;
    } else {
      throw new Error('Cannot save a promotion without an ID');
    }
  }

  // Static methods to mimic Sequelize
  static async findAll(options = {}) {
    let sql = `
      SELECT p.*, r.name as restaurantName 
      FROM promotions p
      LEFT JOIN restaurants r ON p.restaurant_id = r.id
    `;
    
    const params = [];
    const where = [];
    
    // Process where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value === null) {
          where.push(`p.${key} IS NULL`);
        } else if (Array.isArray(value)) {
          where.push(`p.${key} IN (?)`);
          params.push(value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle operator objects (like { gte: 5 })
          Object.entries(value).forEach(([op, val]) => {
            switch(op) {
              case 'gte':
                where.push(`p.${key} >= ?`);
                params.push(val);
                break;
              case 'lte':
                where.push(`p.${key} <= ?`);
                params.push(val);
                break;
              case 'gt':
                where.push(`p.${key} > ?`);
                params.push(val);
                break;
              case 'lt':
                where.push(`p.${key} < ?`);
                params.push(val);
                break;
              case 'like':
                where.push(`p.${key} LIKE ?`);
                params.push(`%${val}%`);
                break;
              case 'notLike':
                where.push(`p.${key} NOT LIKE ?`);
                params.push(`%${val}%`);
                break;
              default:
                where.push(`p.${key} = ?`);
                params.push(val);
            }
          });
        } else {
          where.push(`p.${key} = ?`);
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
      sql += ' ORDER BY p.id DESC';
    }
    
    // Add pagination
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(options.limit));
      
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(options.offset));
      }
    }

    const results = await query(sql, params);
    return results.map(data => new Promotion(data));
  }
  
  static async findByPk(id) {
    if (!id) return null;
    
    const sql = `
      SELECT p.*, r.name as restaurantName 
      FROM promotions p
      LEFT JOIN restaurants r ON p.restaurant_id = r.id
      WHERE p.id = ?
    `;
    
    const result = await query(sql, [id]);
    return result.length > 0 ? new Promotion(result[0]) : null;
  }

  static async findOne(options = {}) {
    // Use findAll with limit 1
    const results = await Promotion.findAll({
      ...options,
      limit: 1
    });
    
    return results.length > 0 ? results[0] : null;
  }

  static async create(data) {
    // Process the data
    const promotionData = { ...data };
    
    // Handle JSON fields
    for (const [key, value] of Object.entries(promotionData)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        promotionData[key] = JSON.stringify(value);
      }
    }
    
    // Create the SQL
    const columns = Object.keys(promotionData).join(', ');
    const placeholders = Object.keys(promotionData).map(() => '?').join(', ');
    const values = Object.values(promotionData);
    
    const sql = `INSERT INTO promotions (${columns}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    return new Promotion({
      id: result.insertId,
      ...promotionData
    });
  }

  static async update(data, options = {}) {
    // Process the data
    const promotionData = { ...data };
    
    // Handle JSON fields
    for (const [key, value] of Object.entries(promotionData)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        promotionData[key] = JSON.stringify(value);
      }
    }
    
    // Create the SET part of the SQL
    const setClauses = [];
    const params = [];
    
    for (const [key, value] of Object.entries(promotionData)) {
      setClauses.push(`${key} = ?`);
      params.push(value);
    }
    
    // If there's nothing to update, just return [0]
    if (setClauses.length === 0) return [0];
    
    let sql = `UPDATE promotions SET ${setClauses.join(', ')}`;
    
    // Handle WHERE conditions
    const conditions = [];
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    const result = await query(sql, params);
    return [result.affectedRows];
  }

  static async destroy(options = {}) {
    let sql = 'DELETE FROM promotions';
    const params = [];
    
    // Handle WHERE conditions
    const conditions = [];
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        conditions.push(`${key} = ?`);
        params.push(value);
      }
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    const result = await query(sql, params);
    return result.affectedRows;
  }

  // Add count method to fix the "Promotion.count is not a function" error
  static async count(options = {}) {
    let sql = 'SELECT COUNT(*) as count FROM promotions';
    const params = [];
    
    // Handle WHERE conditions
    const conditions = [];
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (value === null) {
          conditions.push(`${key} IS NULL`);
        } else if (Array.isArray(value)) {
          conditions.push(`${key} IN (?)`);
          params.push(value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle operator objects (like { gte: 5 })
          Object.entries(value).forEach(([op, val]) => {
            switch(op) {
              case 'gte':
                conditions.push(`${key} >= ?`);
                params.push(val);
                break;
              case 'lte':
                conditions.push(`${key} <= ?`);
                params.push(val);
                break;
              case 'gt':
                conditions.push(`${key} > ?`);
                params.push(val);
                break;
              case 'lt':
                conditions.push(`${key} < ?`);
                params.push(val);
                break;
              case 'like':
                conditions.push(`${key} LIKE ?`);
                params.push(`%${val}%`);
                break;
              case 'notLike':
                conditions.push(`${key} NOT LIKE ?`);
                params.push(`%${val}%`);
                break;
              default:
                conditions.push(`${key} = ?`);
                params.push(val);
            }
          });
        } else {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      }
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }
    
    const result = await query(sql, params);
    return result[0].count;
  }

  // Method to get products with this promotion
  static async getProducts(promotionId) {
    const sql = `
      SELECT p.*, pp.promotionId 
      FROM products p
      JOIN product_promotions pp ON p.id = pp.productId
      WHERE pp.promotionId = ?
    `;
    
    return await query(sql, [promotionId]);
  }

  // These are stubs for Sequelize compatibility
  static init() {
    return Promotion;
  }

  static associate() {
    // No-op - we'll handle relationships in SQL queries directly
  }
  
  // Mock association methods as no-ops to prevent errors
  static belongsTo() {}
  static hasMany() {}
  static belongsToMany() {}
}

// Export for both direct usage and Sequelize compatibility
module.exports = Promotion;

// Mock the Sequelize DataTypes for compatibility
Promotion.DataTypes = {
  STRING: 'STRING',
  TEXT: 'TEXT',
  INTEGER: 'INTEGER', 
  FLOAT: 'FLOAT',
  DECIMAL: 'DECIMAL',
  DATE: 'DATE',
  BOOLEAN: 'BOOLEAN',
  JSON: 'JSON',
  ENUM: function() { return 'ENUM'; }
}; 