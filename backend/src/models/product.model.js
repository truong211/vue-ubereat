const db = require('../config/database');

/**
 * Product model with direct SQL implementation
 */
const Product = {
  tableName: 'products',

  findByPk: async (id) => {
    try {
      const results = await db.query('SELECT * FROM products WHERE id = ?', [id]);
      return results[0];
    } catch (error) {
      console.error('Error in Product.findByPk:', error);
      throw error;
    }
  },

  findOne: async (where) => {
    try {
      const whereClause = Object.entries(where)
        .map(([key, value]) => `${key} = ?`)
        .join(' AND ');
      const values = Object.values(where);

      const results = await db.query(`SELECT * FROM products WHERE ${whereClause} LIMIT 1`, values);
      return results[0];
    } catch (error) {
      console.error('Error in Product.findOne:', error);
      throw error;
    }
  },

  findAll: async (options = {}) => {
    try {
      let sql = 'SELECT p.* FROM products p';
      const values = [];
      const joins = [];

      // Handle includes for related models
      if (options.include) {
        options.include.forEach((include, index) => {
          const alias = include.as || include.model.tableName;

          if (include.model.tableName === 'categories') {
            joins.push(`LEFT JOIN categories ${alias} ON p.categoryId = ${alias}.id`);
            sql = sql.replace('p.*', `p.*, ${alias}.name as category_name`);
          }

          if (include.model.tableName === 'restaurants') {
            joins.push(`LEFT JOIN restaurants ${alias} ON p.restaurantId = ${alias}.id`);
            sql = sql.replace('p.*', `p.*, ${alias}.name as restaurant_name, ${alias}.logo as restaurant_logo`);
          }
        });
      }

      // Add joins to SQL
      if (joins.length > 0) {
        sql += ' ' + joins.join(' ');
      }

      // Handle where clause
      if (options.where) {
        const whereClauses = [];

        Object.entries(options.where).forEach(([key, value]) => {
          // Handle simple equality
          if (typeof value !== 'object' || value === null) {
            whereClauses.push(`p.${key} = ?`);
            values.push(value);
          }
          // Handle operators like Op.like, Op.gte, etc.
          else {
            const fieldClauses = [];

            Object.entries(value).forEach(([opKey, opValue]) => {
              switch(opKey) {
                case 'like':
                  fieldClauses.push(`p.${key} LIKE ?`);
                  values.push(opValue);
                  break;
                case 'gte':
                  fieldClauses.push(`p.${key} >= ?`);
                  values.push(opValue);
                  break;
                case 'lte':
                  fieldClauses.push(`p.${key} <= ?`);
                  values.push(opValue);
                  break;
                case 'ne':
                  fieldClauses.push(`p.${key} IS NOT NULL`);
                  break;
                case 'gt':
                  fieldClauses.push(`p.${key} > ?`);
                  values.push(opValue);
                  break;
                default:
                  fieldClauses.push(`p.${key} = ?`);
                  values.push(opValue);
              }
            });

            // Combine all operators for this field with AND
            if (fieldClauses.length > 0) {
              whereClauses.push(`(${fieldClauses.join(' AND ')})`);
            }
          }
        });

        if (whereClauses.length > 0) {
          sql += ' WHERE ' + whereClauses.join(' AND ');
        }
      }

      // Handle order
      if (options.order) {
        if (Array.isArray(options.order) && options.order.length > 0) {
          const [field, direction] = options.order[0];
          sql += ` ORDER BY p.${field} ${direction}`;
        } else {
          sql += ` ORDER BY ${options.order}`;
        }
      }

      // Handle limit and offset for pagination
      if (options.limit) {
        sql += ` LIMIT ${parseInt(options.limit)}`;
      }

      if (options.offset) {
        sql += ` OFFSET ${parseInt(options.offset)}`;
      }

      // Execute query
      const results = await db.query(sql, values);

      // Process results to match Sequelize format
      return results.map(row => {
        const product = { ...row };

        // Add related models if included
        if (options.include) {
          options.include.forEach(include => {
            const alias = include.as || include.model.tableName;

            if (include.model.tableName === 'categories' && row.category_name) {
              product.category = {
                id: row.categoryId,
                name: row.category_name
              };
              delete product.category_name;
            }

            if (include.model.tableName === 'restaurants' && row.restaurant_name) {
              product.restaurant = {
                id: row.restaurantId,
                name: row.restaurant_name,
                logo: row.restaurant_logo
              };
              delete product.restaurant_name;
              delete product.restaurant_logo;
            }
          });
        }

        return product;
      });
    } catch (error) {
      console.error('Error in Product.findAll:', error);
      throw error;
    }
  },

  create: async (data) => {
    try {
      // Handle JSON fields
      const processedData = { ...data };
      ['nutritionalInfo', 'options'].forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'object') {
          processedData[field] = JSON.stringify(processedData[field]);
        }
      });

      const columns = Object.keys(processedData).join(', ');
      const placeholders = Object.keys(processedData).map(() => '?').join(', ');
      const values = Object.values(processedData);

      const result = await db.query(
        `INSERT INTO products (${columns}) VALUES (${placeholders})`,
        values
      );

      return { id: result.insertId, ...data };
    } catch (error) {
      console.error('Error in Product.create:', error);
      throw error;
    }
  },

  update: async (id, data) => {
    try {
      // Handle JSON fields
      const processedData = { ...data };
      ['nutritionalInfo', 'options'].forEach(field => {
        if (processedData[field] && typeof processedData[field] === 'object') {
          processedData[field] = JSON.stringify(processedData[field]);
        }
      });

      const setClauses = Object.keys(processedData)
        .map(key => `${key} = ?`)
        .join(', ');
      const values = [...Object.values(processedData), id];

      const result = await db.query(
        `UPDATE products SET ${setClauses} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Product.update:', error);
      throw error;
    }
  },

  destroy: async (id) => {
    try {
      const result = await db.query('DELETE FROM products WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in Product.destroy:', error);
      throw error;
    }
  },

  count: async (where = {}) => {
    try {
      let sql = 'SELECT COUNT(*) as count FROM products p';
      const values = [];

      // Handle where clause
      if (Object.keys(where).length > 0) {
        const whereClauses = [];

        Object.entries(where).forEach(([key, value]) => {
          // Handle simple equality
          if (typeof value !== 'object' || value === null) {
            whereClauses.push(`p.${key} = ?`);
            values.push(value);
          }
          // Handle operators like Op.like, Op.gte, etc.
          else {
            const fieldClauses = [];

            Object.entries(value).forEach(([opKey, opValue]) => {
              switch(opKey) {
                case 'like':
                  fieldClauses.push(`p.${key} LIKE ?`);
                  values.push(opValue);
                  break;
                case 'gte':
                  fieldClauses.push(`p.${key} >= ?`);
                  values.push(opValue);
                  break;
                case 'lte':
                  fieldClauses.push(`p.${key} <= ?`);
                  values.push(opValue);
                  break;
                case 'ne':
                  fieldClauses.push(`p.${key} IS NOT NULL`);
                  break;
                case 'gt':
                  fieldClauses.push(`p.${key} > ?`);
                  values.push(opValue);
                  break;
                default:
                  fieldClauses.push(`p.${key} = ?`);
                  values.push(opValue);
              }
            });

            // Combine all operators for this field with AND
            if (fieldClauses.length > 0) {
              whereClauses.push(`(${fieldClauses.join(' AND ')})`);
            }
          }
        });

        if (whereClauses.length > 0) {
          sql += ' WHERE ' + whereClauses.join(' AND ');
        }
      }

      const results = await db.query(sql, values);
      return results[0].count;
    } catch (error) {
      console.error('Error in Product.count:', error);
      throw error;
    }
  },

  findAndCountAll: async (options = {}) => {
    try {
      // First, get the count
      const count = await Product.count(options.where || {});

      // Then, get the rows
      const rows = await Product.findAll(options);

      return { count, rows };
    } catch (error) {
      console.error('Error in Product.findAndCountAll:', error);
      throw error;
    }
  }
};

module.exports = Product;