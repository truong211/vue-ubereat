const { query } = require('../config/database');

// A simple class that mimics a Sequelize model but uses direct SQL
class NotificationTracking {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  // For Sequelize compatibility
  toJSON() {
    return { ...this };
  }

  // Save method to mimic Sequelize's save
  async save() {
    // If the notification tracking has an ID, it's an update, otherwise it's a create
    if (this.id) {
      const { id, ...data } = this;
      
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
      
      const sql = `UPDATE notification_trackings SET ${setClauses.join(', ')} WHERE id = ?`;
      await query(sql, params);
      
      return this;
    } else {
      const data = { ...this };
      
      // Create the SQL
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const sql = `INSERT INTO notification_trackings (${columns}) VALUES (${placeholders})`;
      const result = await query(sql, values);
      
      this.id = result.insertId;
      return this;
    }
  }

  // Static methods to mimic Sequelize
  static async findAll(options = {}) {
    let sql = 'SELECT * FROM notification_trackings';
    const params = [];
    
    // Handle conditions/filters
    if (options.where) {
      const conditions = [];
      Object.entries(options.where).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Handle operator objects like {[Op.gt]: 5}
          Object.entries(value).forEach(([op, val]) => {
            switch(op) {
              case 'gt':
                conditions.push(`${key} > ?`);
                params.push(val);
                break;
              case 'gte':
                conditions.push(`${key} >= ?`);
                params.push(val);
                break;
              case 'lt':
                conditions.push(`${key} < ?`);
                params.push(val);
                break;
              case 'lte':
                conditions.push(`${key} <= ?`);
                params.push(val);
                break;
              case 'ne':
                conditions.push(`${key} != ?`);
                params.push(val);
                break;
              case 'like':
                conditions.push(`${key} LIKE ?`);
                params.push(`%${val}%`);
                break;
              default:
                conditions.push(`${key} = ?`);
                params.push(val);
            }
          });
        } else if (Array.isArray(value)) {
          conditions.push(`${key} IN (?)`);
          params.push(value);
        } else if (value === null) {
          conditions.push(`${key} IS NULL`);
        } else {
          conditions.push(`${key} = ?`);
          params.push(value);
        }
      });
      
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    // Handle ordering
    if (options.order) {
      sql += ' ORDER BY ' + options.order.map(([col, dir]) => `${col} ${dir}`).join(', ');
    } else {
      sql += ' ORDER BY id DESC';
    }
    
    // Handle pagination
    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }
    
    const results = await query(sql, params);
    return results.map(row => new NotificationTracking(row));
  }

  static async findByPk(id) {
    const sql = 'SELECT * FROM notification_trackings WHERE id = ? LIMIT 1';
    const results = await query(sql, [id]);
    
    if (results.length === 0) return null;
    return new NotificationTracking(results[0]);
  }

  static async findOne(options = {}) {
    options.limit = 1;
    const results = await this.findAll(options);
    return results.length > 0 ? results[0] : null;
  }

  static async create(data) {
    // Create the SQL
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO notification_trackings (${columns}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    return new NotificationTracking({
      id: result.insertId,
      ...data
    });
  }

  static async update(data, options = {}) {
    // Create the SET part of the SQL
    const setClauses = [];
    const params = [];
    
    for (const [key, value] of Object.entries(data)) {
      setClauses.push(`${key} = ?`);
      params.push(value);
    }
    
    // If there's nothing to update, just return [0]
    if (setClauses.length === 0) return [0];
    
    let sql = `UPDATE notification_trackings SET ${setClauses.join(', ')}`;
    
    // Handle WHERE conditions
    const conditions = [];
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Handle operator objects like {[Op.gt]: 5}
          Object.entries(value).forEach(([op, val]) => {
            switch(op) {
              case 'gt':
                conditions.push(`${key} > ?`);
                params.push(val);
                break;
              case 'gte':
                conditions.push(`${key} >= ?`);
                params.push(val);
                break;
              case 'lt':
                conditions.push(`${key} < ?`);
                params.push(val);
                break;
              case 'lte':
                conditions.push(`${key} <= ?`);
                params.push(val);
                break;
              case 'ne':
                conditions.push(`${key} != ?`);
                params.push(val);
                break;
              case 'like':
                conditions.push(`${key} LIKE ?`);
                params.push(`%${val}%`);
                break;
              default:
                conditions.push(`${key} = ?`);
                params.push(val);
            }
          });
        } else if (Array.isArray(value)) {
          conditions.push(`${key} IN (?)`);
          params.push(value);
        } else if (value === null) {
          conditions.push(`${key} IS NULL`);
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
    return [result.affectedRows];
  }

  static async destroy(options = {}) {
    let sql = 'DELETE FROM notification_trackings';
    const params = [];
    
    // Handle WHERE conditions
    const conditions = [];
    if (options.where) {
      for (const [key, value] of Object.entries(options.where)) {
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          // Handle operator objects like {[Op.gt]: 5}
          Object.entries(value).forEach(([op, val]) => {
            switch(op) {
              case 'gt':
                conditions.push(`${key} > ?`);
                params.push(val);
                break;
              case 'gte':
                conditions.push(`${key} >= ?`);
                params.push(val);
                break;
              case 'lt':
                conditions.push(`${key} < ?`);
                params.push(val);
                break;
              case 'lte':
                conditions.push(`${key} <= ?`);
                params.push(val);
                break;
              case 'ne':
                conditions.push(`${key} != ?`);
                params.push(val);
                break;
              case 'like':
                conditions.push(`${key} LIKE ?`);
                params.push(`%${val}%`);
                break;
              default:
                conditions.push(`${key} = ?`);
                params.push(val);
            }
          });
        } else if (Array.isArray(value)) {
          conditions.push(`${key} IN (?)`);
          params.push(value);
        } else if (value === null) {
          conditions.push(`${key} IS NULL`);
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
    return result.affectedRows;
  }

  // These are stubs to prevent errors during initialization
  static init() {
    return NotificationTracking;
  }

  static associate() {
    // No-op
  }
  
  // Mock association methods as no-ops to prevent errors
  static belongsTo() {}
  static hasMany() {}
  static belongsToMany() {}
}

// Export for both direct usage and Sequelize compatibility
module.exports = NotificationTracking;

// Mock the Sequelize DataTypes for compatibility
NotificationTracking.DataTypes = {
  STRING: 'STRING',
  TEXT: 'TEXT',
  INTEGER: 'INTEGER', 
  FLOAT: 'FLOAT',
  DECIMAL: 'DECIMAL',
  DATE: 'DATE',
  BOOLEAN: 'BOOLEAN',
  ENUM: function() { return 'ENUM'; }
}; 