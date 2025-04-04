const { query } = require('../config/database');

// A simple class that mimics a Sequelize model but uses direct SQL connection
class ReviewReport {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  // For Sequelize compatibility
  toJSON() {
    return { ...this };
  }

  // Save method to mimic Sequelize's save
  async save() {
    // If the review report has an ID, it's an update, otherwise it's a create
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
      
      const sql = `UPDATE review_reports SET ${setClauses.join(', ')} WHERE id = ?`;
      await query(sql, params);
      
      return this;
    } else {
      throw new Error('Cannot save a review report without an ID');
    }
  }

  // Static methods to mimic Sequelize
  static async findAll(options = {}) {
    let sql = `
      SELECT rr.*, u.fullName as reporterName, r.comment as reviewComment
      FROM review_reports rr
      LEFT JOIN users u ON rr.userId = u.id
      LEFT JOIN reviews r ON rr.reviewId = r.id
    `;
    
    const params = [];
    const where = [];
    
    // Process where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value === null) {
          where.push(`rr.${key} IS NULL`);
        } else if (Array.isArray(value)) {
          where.push(`rr.${key} IN (?)`);
          params.push(value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle operator objects (like { gte: 5 })
          Object.entries(value).forEach(([op, val]) => {
            switch(op) {
              case 'gte':
                where.push(`rr.${key} >= ?`);
                params.push(val);
                break;
              case 'lte':
                where.push(`rr.${key} <= ?`);
                params.push(val);
                break;
              case 'gt':
                where.push(`rr.${key} > ?`);
                params.push(val);
                break;
              case 'lt':
                where.push(`rr.${key} < ?`);
                params.push(val);
                break;
              case 'like':
                where.push(`rr.${key} LIKE ?`);
                params.push(`%${val}%`);
                break;
              case 'notLike':
                where.push(`rr.${key} NOT LIKE ?`);
                params.push(`%${val}%`);
                break;
              default:
                where.push(`rr.${key} = ?`);
                params.push(val);
            }
          });
        } else {
          where.push(`rr.${key} = ?`);
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
      sql += ' ORDER BY rr.createdAt DESC';
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
    return results.map(data => new ReviewReport(data));
  }
  
  static async findByPk(id) {
    if (!id) return null;
    
    const sql = `
      SELECT rr.*, u.fullName as reporterName, r.comment as reviewComment
      FROM review_reports rr
      LEFT JOIN users u ON rr.userId = u.id
      LEFT JOIN reviews r ON rr.reviewId = r.id
      WHERE rr.id = ?
    `;
    
    const result = await query(sql, [id]);
    return result.length > 0 ? new ReviewReport(result[0]) : null;
  }

  static async findOne(options = {}) {
    // Use findAll with limit 1
    const results = await ReviewReport.findAll({
      ...options,
      limit: 1
    });
    
    return results.length > 0 ? results[0] : null;
  }

  static async create(data) {
    // Process the data
    const reportData = { ...data };
    
    // Handle JSON fields
    for (const [key, value] of Object.entries(reportData)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        reportData[key] = JSON.stringify(value);
      }
    }
    
    // Create the SQL
    const columns = Object.keys(reportData).join(', ');
    const placeholders = Object.keys(reportData).map(() => '?').join(', ');
    const values = Object.values(reportData);
    
    const sql = `INSERT INTO review_reports (${columns}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    return new ReviewReport({
      id: result.insertId,
      ...reportData
    });
  }

  static async update(data, options = {}) {
    // Process the data
    const reportData = { ...data };
    
    // Handle JSON fields
    for (const [key, value] of Object.entries(reportData)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        reportData[key] = JSON.stringify(value);
      }
    }
    
    // Create the SET part of the SQL
    const setClauses = [];
    const params = [];
    
    for (const [key, value] of Object.entries(reportData)) {
      setClauses.push(`${key} = ?`);
      params.push(value);
    }
    
    // If there's nothing to update, just return [0]
    if (setClauses.length === 0) return [0];
    
    let sql = `UPDATE review_reports SET ${setClauses.join(', ')}`;
    
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
    let sql = 'DELETE FROM review_reports';
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

  // These are stubs for Sequelize compatibility
  static init() {
    return ReviewReport;
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
module.exports = ReviewReport;

// Mock the Sequelize DataTypes for compatibility
ReviewReport.DataTypes = {
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