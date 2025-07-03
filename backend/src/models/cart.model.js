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
    // Dynamically build query based on provided keys
    const columns = Object.keys(data);
    const placeholdersArr = columns.map(() => '?');
    const values = columns.map((key) => {
      if (key === 'options') {
        return data[key] ? JSON.stringify(data[key]) : null;
      }
      return data[key];
    });

    // Add timestamps
    columns.push('createdAt', 'updatedAt');
    placeholdersArr.push('NOW()', 'NOW()');

    const sql = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholdersArr.join(', ')})`;

    const result = await query(sql, values);
    // After insert, fetch the record
    const insertedId = result.insertId || (result[0] && result[0].id);
    const [created] = await query(`SELECT * FROM ${this.tableName} WHERE id = ?`, [insertedId]);
    return created;
  }

  /**
   * Update a cart item
   * @param {Number} id - Cart item ID
   * @param {Object} data - Updated cart item data
   * @returns {Promise<Object>} - Updated cart item
   */
  static async update(id, data) {
    if (Object.keys(data).length === 0) return this.findByPk(id);

    const setClauses = Object.keys(data).map((key) => `${key} = ?`).join(', ');
    const values = Object.values(data).map((v, idx) => {
      const key = Object.keys(data)[idx];
      if (key === 'options') {
        return v ? JSON.stringify(v) : null;
      }
      return v;
    });

    values.push(id);

    await query(`UPDATE ${this.tableName} SET ${setClauses}, updatedAt = NOW() WHERE id = ?`, values);
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