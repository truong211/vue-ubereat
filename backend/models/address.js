const { v4: uuidv4 } = require('uuid');
const db = require('../src/config/database');

/**
 * Address model – direct SQL implementation for addresses table.
 */
const Address = {
  tableName: 'addresses',

  findByPk: async (id) => {
    if (!id) return null;
    const results = await db.query('SELECT * FROM addresses WHERE id = ? LIMIT 1', [id]);
    return results[0] || null;
  },

  findAll: async (options = {}) => {
    let sql = 'SELECT * FROM addresses';
    const params = [];

    if (options.where) {
      const clauses = Object.entries(options.where).map(([k, v]) => {
        params.push(v);
        return `${k} = ?`;
      });
      if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
    }

    if (options.order) {
      const orderStr = Array.isArray(options.order)
        ? options.order.map(([col, dir]) => `${col} ${dir}`).join(', ')
        : options.order;
      sql += ` ORDER BY ${orderStr}`;
    }

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(Number(options.limit));
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(Number(options.offset));
      }
    }

    return await db.query(sql, params);
  },

  create: async (data) => {
    const id = uuidv4();
    const record = { id, ...data };
    const cols = Object.keys(record).join(', ');
    const placeholders = Object.keys(record).map(() => '?').join(', ');
    const vals = Object.values(record);

    await db.query(`INSERT INTO addresses (${cols}) VALUES (${placeholders})`, vals);
    return { id, ...data };
  },

  update: async (data, where) => {
    if (!where || Object.keys(where).length === 0) throw new Error('Update requires where conditions');

    const setClause = Object.entries(data).map(([k, v]) => `${k} = ?`).join(', ');
    const params = [...Object.values(data)];

    const whereClause = Object.entries(where).map(([k, v]) => {
      params.push(v);
      return `${k} = ?`;
    }).join(' AND ');

    const result = await db.query(`UPDATE addresses SET ${setClause} WHERE ${whereClause}`, params);
    return result.affectedRows;
  },

  destroy: async (where) => {
    if (!where || Object.keys(where).length === 0) throw new Error('Destroy requires where conditions');

    const params = [];
    const whereClause = Object.entries(where).map(([k, v]) => {
      params.push(v);
      return `${k} = ?`;
    }).join(' AND ');

    const result = await db.query(`DELETE FROM addresses WHERE ${whereClause}`, params);
    return result.affectedRows;
  }
};

module.exports = Address;