const { query, getById, update, remove } = require('../config/database');

/**
 * Cart Model
 * Represents user shopping carts in the system
 */
class Cart {
  static tableName = 'cart';

  /**
   * Find all cart items for a user
   * @param {Object} where - Conditions for the query
   * @param {String} orderBy - Optional order by clause
   * @returns {Promise<Array>} - Array of cart items
   */
  static async findAll(where = {}, orderBy = '') {
    let whereClause = '';
    const values = [];

    if (Object.keys(where).length > 0) {
      whereClause = 'WHERE ';
      const conditions = [];
      
      for (const [key, value] of Object.entries(where)) {
        // Fix ambiguous column names by prefixing with table alias
        if (key === 'userId') {
          conditions.push(`c.${key} = ?`);
        } else {
          conditions.push(`${key} = ?`);
        }
        values.push(value);
      }
      
      whereClause += conditions.join(' AND ');
    }

    const orderClause = orderBy ? ` ORDER BY ${orderBy}` : '';
    
    const sql = `
      SELECT c.*, 
             p.name as product_name, 
             p.price, 
             p.discountPrice as discountPrice, 
             p.image, 
             p.restaurantId as restaurantId, 
             r.name as restaurant_name,
             r.deliveryFee as deliveryFee,
             r.minOrderAmount as minOrderAmount,
             r.estimatedDeliveryTime as estimatedDeliveryTime,
             r.logo,
             r.rating
      FROM ${this.tableName} c
      JOIN products p ON c.productId = p.id
      JOIN restaurants r ON p.restaurantId = r.id
      ${whereClause}
      ${orderClause}
    `;
    
    console.log('Cart SQL Query:', sql);
    console.log('Cart SQL Values:', values);
    
    const results = await query(sql, values);
    
    // Parse options JSON for each result
    return results.map(item => {
      if (item.options && typeof item.options === 'string') {
        try {
          item.options = JSON.parse(item.options);
        } catch (err) {
          console.error('Error parsing options JSON:', err);
          item.options = {};
        }
      }
      return item;
    });
  }

  /**
   * Find a cart item by ID
   * @param {Number} id - Cart item ID
   * @returns {Promise<Object>} - Cart item
   */
  static async findByPk(id) {
    return await query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [id]);
  }

  /**
   * Create a new cart item
   * @param {Object} data - Cart item data
   * @returns {Promise<Object>} - Created cart item
   */
  static async create(data) {
    const { userId, productId, quantity, options, notes } = data;
    
    // Convert options to JSON string if it's an object
    const optionsStr = options ? JSON.stringify(options) : null;
    
    const sql = `
      INSERT INTO ${this.tableName} (userId, productId, quantity, options, notes, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await query(sql, [userId, productId, quantity, optionsStr, notes]);
    return result[0];
  }

  /**
   * Update a cart item
   * @param {Number} id - Cart item ID
   * @param {Object} data - Updated cart item data
   * @returns {Promise<Object>} - Updated cart item
   */
  static async update(id, data) {
    const entries = Object.entries(data);
    const setClauses = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([_, value]) => value);
    
    values.push(id); // Add the ID for the WHERE clause
    
    const sql = `
      UPDATE ${this.tableName} 
      SET ${setClauses}, updatedAt = NOW() 
      WHERE id = ?
    `;
    
    await query(sql, values);
    return this.findByPk(id);
  }

  /**
   * Delete a cart item
   * @param {Number} id - Cart item ID
   * @returns {Promise<Boolean>} - True if deleted
   */
  static async destroy(id) {
    await query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return true;
  }
}

module.exports = Cart;