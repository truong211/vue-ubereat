const { query } = require('../config/database');

class ProductOption {
  static tableName = 'product_options';

  static async findAll(where = {}, orderBy = '') {
    let whereClause = '';
    const values = [];
    if (Object.keys(where).length > 0) {
      whereClause = 'WHERE ' + Object.keys(where).map(key => `${key} = ?`).join(' AND ');
      values.push(...Object.values(where));
    }
    const orderClause = orderBy ? ` ORDER BY ${orderBy}` : '';
    return await query(`SELECT * FROM ${this.tableName} ${whereClause}${orderClause}`, values);
  }

  static async findByPk(id) {
    const res = await query(`SELECT * FROM ${this.tableName} WHERE id = ? LIMIT 1`, [id]);
    return res[0] || null;
  }

  static async create(data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const result = await query(`INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders})`, Object.values(data));
    return { id: result.insertId, ...data };
  }

  static async update(id, data) {
    const setClause = Object.keys(data).map(key => `${key} = ?`).join(', ');
    await query(`UPDATE ${this.tableName} SET ${setClause} WHERE id = ?`, [...Object.values(data), id]);
    return this.findByPk(id);
  }

  static async destroy(id) {
    await query(`DELETE FROM ${this.tableName} WHERE id = ?`, [id]);
    return true;
  }
}

module.exports = ProductOption;