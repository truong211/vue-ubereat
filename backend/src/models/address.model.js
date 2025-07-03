const { query } = require('../config/database');

// A lightweight Address model that mimics common Sequelize methods but uses raw SQL queries under the hood.
class Address {
  constructor(data = {}) {
    Object.assign(this, data);
  }

  // -------- Instance helpers --------
  toJSON() {
    return { ...this };
  }

  // Persist current state back to DB (update only – insert handled by create())
  async save() {
    if (!this.id) {
      throw new Error('Cannot call save() on an Address without an id');
    }

    const { id, ...data } = this;
    const setClauses = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      // skip undefined so we do not overwrite with NULL unintentionally
      if (value === undefined) continue;
      setClauses.push(`${key} = ?`);
      params.push(value);
    }

    if (setClauses.length === 0) return this; // nothing to update

    params.push(id);
    await query(`UPDATE addresses SET ${setClauses.join(', ')} WHERE id = ?`, params);
    return this;
  }

  async destroy() {
    if (!this.id) return 0;
    const result = await query('DELETE FROM addresses WHERE id = ?', [this.id]);
    return result.affectedRows || 0;
  }

  // -------- Static helpers --------
  static async findByPk(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM addresses WHERE id = ? LIMIT 1', [id]);
    return rows.length ? new Address(rows[0]) : null;
  }

  static async findOne(options = {}) {
    const results = await Address.findAll({ ...options, limit: 1 });
    return results.length ? results[0] : null;
  }

  static async findAll(options = {}) {
    let sql = 'SELECT * FROM addresses';
    const params = [];
    const whereClauses = [];

    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        if (value === null) {
          whereClauses.push(`${key} IS NULL`);
        } else if (Array.isArray(value)) {
          whereClauses.push(`${key} IN (?)`);
          params.push(value);
        } else {
          whereClauses.push(`${key} = ?`);
          params.push(value);
        }
      });
    }

    if (whereClauses.length) sql += ' WHERE ' + whereClauses.join(' AND ');

    if (options.order) {
      // Expecting [[column, 'ASC'|'DESC'], ...]
      const orderStr = options.order.map(([col, dir]) => `${col} ${dir}`).join(', ');
      sql += ' ORDER BY ' + orderStr;
    }

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(options.limit));
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(options.offset));
      }
    }

    const rows = await query(sql, params);
    return rows.map(r => new Address(r));
  }

  static async create(data) {
    const insertData = { ...data };

    const columns = Object.keys(insertData).join(', ');
    const placeholders = Object.keys(insertData).map(() => '?').join(', ');
    const values = Object.values(insertData);

    const result = await query(`INSERT INTO addresses (${columns}) VALUES (${placeholders})`, values);
    return new Address({ id: result.insertId, ...data });
  }

  // update(data, options) – Sequelize-like signature (used in some controllers)
  static async update(data, options = {}) {
    const updateData = { ...data };

    const setClauses = [];
    const params = [];
    Object.entries(updateData).forEach(([key, value]) => {
      setClauses.push(`${key} = ?`);
      params.push(value);
    });

    if (setClauses.length === 0) return [0];

    let sql = `UPDATE addresses SET ${setClauses.join(', ')}`;
    const whereClauses = [];
    if (options.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        whereClauses.push(`${key} = ?`);
        params.push(value);
      });
    }
    if (whereClauses.length) sql += ' WHERE ' + whereClauses.join(' AND ');

    const result = await query(sql, params);
    return [result.affectedRows];
  }

  // Sequelize compatibility stubs
  static init() {
    return Address;
  }
  static associate() {}
  static belongsTo() {}
  static hasMany() {}
  static belongsToMany() {}
}

module.exports = Address;