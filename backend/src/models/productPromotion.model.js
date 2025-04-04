const { query } = require('../config/database');

// A simple class that mimics a Sequelize model but uses direct SQL connection
class ProductPromotion {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  // For Sequelize compatibility
  toJSON() {
    return { ...this };
  }

  // Static methods to mimic Sequelize
  static async findAll(options = {}) {
    let sql = `
      SELECT pp.*, p.name as productName, pr.name as promotionName
      FROM product_promotions pp
      LEFT JOIN products p ON pp.productId = p.id
      LEFT JOIN promotions pr ON pp.promotionId = pr.id
    `;
    
    const params = [];
    const where = [];
    
    // Process where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value === null) {
          where.push(`pp.${key} IS NULL`);
        } else if (Array.isArray(value)) {
          where.push(`pp.${key} IN (?)`);
          params.push(value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle operator objects (like { gte: 5 })
          Object.entries(value).forEach(([op, val]) => {
            switch(op) {
              case 'gte':
                where.push(`pp.${key} >= ?`);
                params.push(val);
                break;
              case 'lte':
                where.push(`pp.${key} <= ?`);
                params.push(val);
                break;
              case 'gt':
                where.push(`pp.${key} > ?`);
                params.push(val);
                break;
              case 'lt':
                where.push(`pp.${key} < ?`);
                params.push(val);
                break;
              case 'like':
                where.push(`pp.${key} LIKE ?`);
                params.push(`%${val}%`);
                break;
              case 'notLike':
                where.push(`pp.${key} NOT LIKE ?`);
                params.push(`%${val}%`);
                break;
              default:
                where.push(`pp.${key} = ?`);
                params.push(val);
            }
          });
        } else {
          where.push(`pp.${key} = ?`);
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
      sql += ' ORDER BY pp.createdAt DESC';
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
    return results.map(data => new ProductPromotion(data));
  }
  
  static async findOne(options = {}) {
    // Use findAll with limit 1
    const results = await ProductPromotion.findAll({
      ...options,
      limit: 1
    });
    
    return results.length > 0 ? results[0] : null;
  }

  static async create(data) {
    // Create the SQL
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO product_promotions (${columns}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    return new ProductPromotion({
      ...data,
      id: result.insertId
    });
  }

  static async destroy(options = {}) {
    let sql = 'DELETE FROM product_promotions';
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

  // Method to get products for a specific promotion
  static async getProductsForPromotion(promotionId) {
    const sql = `
      SELECT p.* 
      FROM products p
      JOIN product_promotions pp ON p.id = pp.productId
      WHERE pp.promotionId = ?
    `;
    
    return await query(sql, [promotionId]);
  }

  // Method to get promotions for a specific product
  static async getPromotionsForProduct(productId) {
    const sql = `
      SELECT pr.* 
      FROM promotions pr
      JOIN product_promotions pp ON pr.id = pp.promotionId
      WHERE pp.productId = ?
    `;
    
    return await query(sql, [productId]);
  }

  // These are stubs for Sequelize compatibility
  static init() {
    return ProductPromotion;
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
module.exports = ProductPromotion;

// Mock the Sequelize DataTypes for compatibility
ProductPromotion.DataTypes = {
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