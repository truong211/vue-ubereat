const { query } = require('../config/database');

// A simple class that mimics a Sequelize model but uses direct SQL connection
class ReviewVote {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  // For Sequelize compatibility
  toJSON() {
    return { ...this };
  }

  // Save method to mimic Sequelize's save
  async save() {
    // If the review vote has an ID, it's an update, otherwise it's a create
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
      
      const sql = `UPDATE review_votes SET ${setClauses.join(', ')} WHERE id = ?`;
      await query(sql, params);
      
      return this;
    } else {
      throw new Error('Cannot save a review vote without an ID');
    }
  }

  // Static methods to mimic Sequelize
  static async findAll(options = {}) {
    let sql = `
      SELECT rv.*, u.fullName as userName, r.comment as reviewComment
      FROM review_votes rv
      LEFT JOIN users u ON rv.userId = u.id
      LEFT JOIN reviews r ON rv.reviewId = r.id
    `;
    
    const params = [];
    const where = [];
    
    // Process where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value === null) {
          where.push(`rv.${key} IS NULL`);
        } else if (Array.isArray(value)) {
          where.push(`rv.${key} IN (?)`);
          params.push(value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle operator objects (like { gte: 5 })
          Object.entries(value).forEach(([op, val]) => {
            switch(op) {
              case 'gte':
                where.push(`rv.${key} >= ?`);
                params.push(val);
                break;
              case 'lte':
                where.push(`rv.${key} <= ?`);
                params.push(val);
                break;
              case 'gt':
                where.push(`rv.${key} > ?`);
                params.push(val);
                break;
              case 'lt':
                where.push(`rv.${key} < ?`);
                params.push(val);
                break;
              case 'like':
                where.push(`rv.${key} LIKE ?`);
                params.push(`%${val}%`);
                break;
              case 'notLike':
                where.push(`rv.${key} NOT LIKE ?`);
                params.push(`%${val}%`);
                break;
              default:
                where.push(`rv.${key} = ?`);
                params.push(val);
            }
          });
        } else {
          where.push(`rv.${key} = ?`);
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
      sql += ' ORDER BY rv.createdAt DESC';
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
    return results.map(data => new ReviewVote(data));
  }
  
  static async findByPk(id) {
    if (!id) return null;
    
    const sql = `
      SELECT rv.*, u.fullName as userName, r.comment as reviewComment
      FROM review_votes rv
      LEFT JOIN users u ON rv.userId = u.id
      LEFT JOIN reviews r ON rv.reviewId = r.id
      WHERE rv.id = ?
    `;
    
    const result = await query(sql, [id]);
    return result.length > 0 ? new ReviewVote(result[0]) : null;
  }

  static async findOne(options = {}) {
    // Use findAll with limit 1
    const results = await ReviewVote.findAll({
      ...options,
      limit: 1
    });
    
    return results.length > 0 ? results[0] : null;
  }

  static async create(data) {
    // Process the data
    const voteData = { ...data };
    
    // Handle JSON fields
    for (const [key, value] of Object.entries(voteData)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        voteData[key] = JSON.stringify(value);
      }
    }
    
    // Create the SQL
    const columns = Object.keys(voteData).join(', ');
    const placeholders = Object.keys(voteData).map(() => '?').join(', ');
    const values = Object.values(voteData);
    
    const sql = `INSERT INTO review_votes (${columns}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    return new ReviewVote({
      id: result.insertId,
      ...voteData
    });
  }

  static async update(data, options = {}) {
    // Process the data
    const voteData = { ...data };
    
    // Handle JSON fields
    for (const [key, value] of Object.entries(voteData)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        voteData[key] = JSON.stringify(value);
      }
    }
    
    // Create the SET part of the SQL
    const setClauses = [];
    const params = [];
    
    for (const [key, value] of Object.entries(voteData)) {
      setClauses.push(`${key} = ?`);
      params.push(value);
    }
    
    // If there's nothing to update, just return [0]
    if (setClauses.length === 0) return [0];
    
    let sql = `UPDATE review_votes SET ${setClauses.join(', ')}`;
    
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
    let sql = 'DELETE FROM review_votes';
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
    return ReviewVote;
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
module.exports = ReviewVote;

// Mock the Sequelize DataTypes for compatibility
ReviewVote.DataTypes = {
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