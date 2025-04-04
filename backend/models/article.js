// Import the database connection
const { query } = require('../src/config/database');

const Article = {
  // Get all articles
  findAll: async (options = {}) => {
    let sql = 'SELECT * FROM articles';
    const params = [];
    
    // Handle conditions/filters
    if (options.where) {
      const conditions = [];
      Object.entries(options.where).forEach(([key, value]) => {
        conditions.push(`${key} = ?`);
        params.push(value);
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
    
    return await query(sql, params);
  },
  
  // Find article by id
  findByPk: async (id) => {
    return (await query('SELECT * FROM articles WHERE id = ?', [id]))[0];
  },
  
  // Find article by specific condition
  findOne: async (options = {}) => {
    let sql = 'SELECT * FROM articles';
    const params = [];
    
    if (options.where) {
      const conditions = [];
      Object.entries(options.where).forEach(([key, value]) => {
        conditions.push(`${key} = ?`);
        params.push(value);
      });
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    if (options.include) {
      // Handle joins - simplified version for custom SQL
      sql = `
        SELECT a.*, u.username as author_username, u.fullName as author_name 
        FROM articles a
        LEFT JOIN users u ON a.authorId = u.id
        ${sql.includes('WHERE') ? sql.split('WHERE')[1] : ''}
      `;
    }
    
    sql += ' LIMIT 1';
    
    const results = await query(sql, params);
    return results[0];
  },
  
  // Create a new article
  create: async (data) => {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);
    
    const sql = `INSERT INTO articles (${columns}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    return {
      id: result.insertId,
      ...data
    };
  },
  
  // Update an article
  update: async (data, options) => {
    const params = [];
    const sets = Object.entries(data).map(([key, value]) => {
      params.push(value);
      return `${key} = ?`;
    }).join(', ');
    
    let sql = `UPDATE articles SET ${sets}`;
    
    if (options.where) {
      const conditions = [];
      Object.entries(options.where).forEach(([key, value]) => {
        conditions.push(`${key} = ?`);
        params.push(value);
      });
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    const result = await query(sql, params);
    return result.affectedRows;
  },
  
  // Delete an article
  destroy: async (options) => {
    let sql = 'DELETE FROM articles';
    const params = [];
    
    if (options.where) {
      const conditions = [];
      Object.entries(options.where).forEach(([key, value]) => {
        conditions.push(`${key} = ?`);
        params.push(value);
      });
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    const result = await query(sql, params);
    return result.affectedRows;
  },
  
  // Get articles with author information
  getWithAuthor: async (options = {}) => {
    let sql = `
      SELECT a.*, u.username as author_username, u.fullName as author_name 
      FROM articles a
      LEFT JOIN users u ON a.authorId = u.id
    `;
    
    const params = [];
    
    if (options.where) {
      const conditions = [];
      Object.entries(options.where).forEach(([key, value]) => {
        conditions.push(`a.${key} = ?`);
        params.push(value);
      });
      if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
      }
    }
    
    // Handle ordering
    if (options.order) {
      sql += ' ORDER BY ' + options.order.map(([col, dir]) => `a.${col} ${dir}`).join(', ');
    } else {
      sql += ' ORDER BY a.id DESC';
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
    
    return await query(sql, params);
  }
};

module.exports = Article; 