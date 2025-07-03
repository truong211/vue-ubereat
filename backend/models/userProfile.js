const { v4: uuidv4 } = require('uuid');
const db = require('../src/config/database');

/**
 * UserProfile model – minimal user profile (direct SQL implementation)
 * Matches the new simplified users table defined in migrations.
 * Table: users (id: CHAR(36))
 */
const UserProfile = {
  tableName: 'users',

  // Get user by primary key
  findByPk: async (id) => {
    if (!id) return null;
    const results = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return results[0] || null;
  },

  // Get one user matching where conditions (object key -> value)
  findOne: async (where = {}) => {
    const keys = Object.keys(where);
    if (keys.length === 0) return null;
    const whereClause = keys.map((k) => `${k} = ?`).join(' AND ');
    const params = Object.values(where);
    const results = await db.query(`SELECT * FROM users WHERE ${whereClause} LIMIT 1`, params);
    return results[0] || null;
  },

  // List users with optional filters, pagination and ordering
  findAll: async (options = {}) => {
    let sql = 'SELECT * FROM users';
    const params = [];

    // WHERE
    if (options.where) {
      const clauses = Object.entries(options.where).map(([k, v]) => {
        params.push(v);
        return `${k} = ?`;
      });
      if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
    }

    // ORDER BY
    if (options.order) {
      const orderStr = Array.isArray(options.order)
        ? options.order.map(([col, dir]) => `${col} ${dir}`).join(', ')
        : options.order;
      sql += ` ORDER BY ${orderStr}`;
    }

    // LIMIT / OFFSET
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

  // Create new user (expects { full_name, email, phone, avatar_url, password_hash })
  create: async (data) => {
    const id = uuidv4();
    const userData = { id, ...data };
    const columns = Object.keys(userData).join(', ');
    const placeholders = Object.keys(userData).map(() => '?').join(', ');
    const values = Object.values(userData);

    await db.query(`INSERT INTO users (${columns}) VALUES (${placeholders})`, values);
    return { id, ...data };
  },

  // Update user – data is object of fields, where is object for conditions (e.g., { id })
  update: async (data, where) => {
    if (!where || Object.keys(where).length === 0) throw new Error('Update requires where conditions');

    const setClause = Object.entries(data).map(([k, v]) => `${k} = ?`).join(', ');
    const params = [...Object.values(data)];

    const whereClause = Object.entries(where).map(([k, v]) => {
      params.push(v);
      return `${k} = ?`;
    }).join(' AND ');

    const result = await db.query(`UPDATE users SET ${setClause} WHERE ${whereClause}`, params);
    return result.affectedRows;
  },

  // Delete users matching where
  destroy: async (where) => {
    if (!where || Object.keys(where).length === 0) throw new Error('Destroy requires where conditions');
    const params = [];
    const whereClause = Object.entries(where).map(([k, v]) => {
      params.push(v);
      return `${k} = ?`;
    }).join(' AND ');

    const result = await db.query(`DELETE FROM users WHERE ${whereClause}`, params);
    return result.affectedRows;
  }
};

module.exports = UserProfile;