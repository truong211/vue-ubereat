const db = require('../config/database');

/**
 * Address model using direct SQL implementation.
 * Provides basic CRUD and utility methods similar to User and Order models.
 */
const Address = {
  tableName: 'addresses',

  // Retrieve a single address by its primary key
  findByPk: async (id) => {
    if (id === undefined || id === null) return null;
    try {
      const results = await db.query('SELECT * FROM addresses WHERE id = ? LIMIT 1', [id]);
      return results[0] || null;
    } catch (error) {
      console.error('Error in Address.findByPk:', error);
      throw error;
    }
  },

  // Retrieve a single address matching the provided where clause
  findOne: async (where = {}) => {
    try {
      const whereKeys = Object.keys(where);
      if (whereKeys.length === 0) return null;

      const whereClause = whereKeys.map((key) => `${key} = ?`).join(' AND ');
      const values = Object.values(where);

      const results = await db.query(`SELECT * FROM addresses WHERE ${whereClause} LIMIT 1`, values);
      return results[0] || null;
    } catch (error) {
      console.error('Error in Address.findOne:', error);
      throw error;
    }
  },

  // Retrieve multiple addresses with optional filters, ordering, pagination
  findAll: async (options = {}) => {
    try {
      let sql = 'SELECT * FROM addresses';
      const values = [];

      if (options.where && Object.keys(options.where).length > 0) {
        const whereClause = Object.entries(options.where)
          .map(([key, _]) => `${key} = ?`)
          .join(' AND ');
        sql += ` WHERE ${whereClause}`;
        values.push(...Object.values(options.where));
      }

      if (options.order) sql += ` ORDER BY ${options.order}`;
      if (options.limit) sql += ` LIMIT ${parseInt(options.limit, 10)}`;
      if (options.offset) sql += ` OFFSET ${parseInt(options.offset, 10)}`;

      return await db.query(sql, values);
    } catch (error) {
      console.error('Error in Address.findAll:', error);
      throw error;
    }
  },

  // Create a new address record
  create: async (data) => {
    try {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);

      const result = await db.query(
        `INSERT INTO addresses (${columns}) VALUES (${placeholders})`,
        values
      );
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error('Error in Address.create:', error);
      throw error;
    }
  },

  // Update an existing address by ID
  update: async (id, data) => {
    try {
      const setClause = Object.keys(data)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(data), id];

      const result = await db.query(`UPDATE addresses SET ${setClause} WHERE id = ?`, values);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Address.update:', error);
      throw error;
    }
  },

  // Delete an address by ID
  destroy: async (id) => {
    try {
      const result = await db.query('DELETE FROM addresses WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Address.destroy:', error);
      throw error;
    }
  },

  // Count addresses with optional where clause
  count: async (where = {}) => {
    try {
      let sql = 'SELECT COUNT(*) AS count FROM addresses';
      const values = [];

      if (Object.keys(where).length > 0) {
        const whereClause = Object.entries(where)
          .map(([key, _]) => `${key} = ?`)
          .join(' AND ');
        sql += ` WHERE ${whereClause}`;
        values.push(...Object.values(where));
      }

      const results = await db.query(sql, values);
      return results[0].count;
    } catch (error) {
      console.error('Error in Address.count:', error);
      throw error;
    }
  },
};

module.exports = Address;