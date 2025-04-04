// Import the database connection
const { query } = require('../src/config/database');

const Restaurant = {
  // Get all restaurants
  findAll: async (options = {}) => {
    let sql = `
      SELECT r.*, u.fullName as ownerName, u.email as ownerEmail, 
             u.phone as ownerPhone, COUNT(DISTINCT o.id) as totalOrders,
             AVG(rev.rating) as averageRating
      FROM restaurants r
      LEFT JOIN users u ON r.userId = u.id
      LEFT JOIN orders o ON r.id = o.restaurantId
      LEFT JOIN reviews rev ON r.id = rev.restaurantId
    `;
    
    const params = [];
    const where = [];
    
    // Process where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        // Handle different key formats (table.column or just column)
        const field = key.includes('.') ? key : `r.${key}`;
        if (value === null) {
          where.push(`${field} IS NULL`);
        } else if (Array.isArray(value)) {
          where.push(`${field} IN (?)`);
          params.push(value);
        } else if (typeof value === 'object' && value !== null) {
          // Handle operator objects (like { gte: 5 })
          Object.entries(value).forEach(([op, val]) => {
            switch(op) {
              case 'gte':
                where.push(`${field} >= ?`);
                params.push(val);
                break;
              case 'lte':
                where.push(`${field} <= ?`);
                params.push(val);
                break;
              case 'gt':
                where.push(`${field} > ?`);
                params.push(val);
                break;
              case 'lt':
                where.push(`${field} < ?`);
                params.push(val);
                break;
              case 'like':
                where.push(`${field} LIKE ?`);
                params.push(`%${val}%`);
                break;
              case 'notLike':
                where.push(`${field} NOT LIKE ?`);
                params.push(`%${val}%`);
                break;
              default:
                where.push(`${field} = ?`);
                params.push(val);
            }
          });
        } else {
          where.push(`${field} = ?`);
          params.push(value);
        }
      });
    }
    
    // Add search functionality
    if (options.search) {
      where.push(`(r.name LIKE ? OR r.description LIKE ? OR r.address LIKE ?)`);
      params.push(`%${options.search}%`, `%${options.search}%`, `%${options.search}%`);
    }
    
    // Add location-based search
    if (options.latitude && options.longitude && options.radius) {
      where.push(`
        (6371 * acos(cos(radians(?)) * cos(radians(r.latitude)) * 
        cos(radians(r.longitude) - radians(?)) + 
        sin(radians(?)) * sin(radians(r.latitude)))) < ?
      `);
      params.push(
        options.latitude, 
        options.longitude, 
        options.latitude, 
        options.radius
      );
    }
    
    // Add where clause if conditions exist
    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }
    
    // Group by restaurant id to handle the joins properly
    sql += ' GROUP BY r.id';
    
    // Add ordering
    if (options.order) {
      sql += ' ORDER BY ' + options.order.map(([col, dir]) => {
        const field = col.includes('.') ? col : `r.${col}`;
        return `${field} ${dir}`;
      }).join(', ');
    } else {
      sql += ' ORDER BY r.id DESC';
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
    
    return await query(sql, params);
  },
  
  // Find restaurant by id
  findByPk: async (id, options = {}) => {
    let sql = `
      SELECT r.*, u.fullName as ownerName, u.email as ownerEmail, 
             u.phone as ownerPhone, COUNT(DISTINCT o.id) as totalOrders,
             AVG(rev.rating) as averageRating
      FROM restaurants r
      LEFT JOIN users u ON r.userId = u.id
      LEFT JOIN orders o ON r.id = o.restaurantId
      LEFT JOIN reviews rev ON r.id = rev.restaurantId
      WHERE r.id = ?
      GROUP BY r.id
    `;
    
    const result = await query(sql, [id]);
    return result[0];
  },
  
  // Find one restaurant with conditions
  findOne: async (options = {}) => {
    const results = await Restaurant.findAll({
      ...options,
      limit: 1
    });
    
    return results[0];
  },
  
  // Create a new restaurant
  create: async (data) => {
    // Process JSON fields
    const processedData = { ...data };
    if (processedData.openingHours && typeof processedData.openingHours !== 'string') {
      processedData.openingHours = JSON.stringify(processedData.openingHours);
    }
    if (processedData.specialHolidays && typeof processedData.specialHolidays !== 'string') {
      processedData.specialHolidays = JSON.stringify(processedData.specialHolidays);
    }
    
    const columns = Object.keys(processedData).join(', ');
    const placeholders = Object.keys(processedData).map(() => '?').join(', ');
    const values = Object.values(processedData);
    
    const sql = `INSERT INTO restaurants (${columns}) VALUES (${placeholders})`;
    const result = await query(sql, values);
    
    // Return the created restaurant
    return {
      id: result.insertId,
      ...processedData
    };
  },
  
  // Update a restaurant
  update: async (data, options) => {
    // Process JSON fields
    const processedData = { ...data };
    if (processedData.openingHours && typeof processedData.openingHours !== 'string') {
      processedData.openingHours = JSON.stringify(processedData.openingHours);
    }
    if (processedData.specialHolidays && typeof processedData.specialHolidays !== 'string') {
      processedData.specialHolidays = JSON.stringify(processedData.specialHolidays);
    }
    
    const params = [];
    const sets = Object.entries(processedData).map(([key, value]) => {
      params.push(value);
      return `${key} = ?`;
    }).join(', ');
    
    let sql = `UPDATE restaurants SET ${sets}`;
    const where = [];
    
    // Process where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        where.push(`${key} = ?`);
        params.push(value);
      });
    }
    
    // Add where clause
    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }
    
    const result = await query(sql, params);
    return result.affectedRows;
  },
  
  // Delete a restaurant
  destroy: async (options) => {
    let sql = 'DELETE FROM restaurants';
    const params = [];
    const where = [];
    
    // Process where conditions
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        where.push(`${key} = ?`);
        params.push(value);
      });
    }
    
    // Add where clause
    if (where.length > 0) {
      sql += ' WHERE ' + where.join(' AND ');
    }
    
    const result = await query(sql, params);
    return result.affectedRows;
  },
  
  // Get restaurant with detailed stats
  getWithStats: async (id) => {
    const sql = `
      SELECT 
        r.*,
        u.fullName as ownerName,
        COUNT(DISTINCT o.id) as totalOrders,
        COUNT(DISTINCT p.id) as totalProducts,
        AVG(rev.rating) as averageRating,
        COUNT(DISTINCT rev.id) as totalReviews,
        SUM(o.totalAmount) as totalRevenue,
        (SELECT COUNT(*) FROM orders WHERE restaurantId = ? AND status = 'delivered') as completedOrders,
        (SELECT COUNT(*) FROM orders WHERE restaurantId = ? AND status = 'cancelled') as cancelledOrders
      FROM restaurants r
      LEFT JOIN users u ON r.userId = u.id
      LEFT JOIN orders o ON r.id = o.restaurantId
      LEFT JOIN products p ON r.id = p.restaurantId
      LEFT JOIN reviews rev ON r.id = rev.restaurantId
      WHERE r.id = ?
      GROUP BY r.id
    `;
    
    const result = await query(sql, [id, id, id]);
    return result[0];
  },
  
  // Direct query method for custom SQL
  rawQuery: async (sql, params = []) => {
    return await query(sql, params);
  }
};

module.exports = Restaurant; 