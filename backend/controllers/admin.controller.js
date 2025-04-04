const mysql = require('mysql2/promise');
const dbConfig = require('../config/db.config');
const pool = mysql.createPool(dbConfig);

/**
 * Get table structure
 * @param {*} req 
 * @param {*} res 
 */
exports.getTableStructure = async (req, res) => {
  const { tableName } = req.params;
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Get table structure using INFORMATION_SCHEMA
    const [columns] = await pool.execute(`
      SELECT 
        COLUMN_NAME as name, 
        DATA_TYPE as dataType,
        COLUMN_TYPE as columnType,
        IS_NULLABLE = 'YES' as nullable,
        COLUMN_KEY = 'PRI' as isPrimary,
        COLUMN_DEFAULT as \`default\`,
        EXTRA = 'auto_increment' as auto
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [dbConfig.database, tableName]);
    
    res.json(columns);
  } catch (error) {
    console.error('Error getting table structure:', error);
    res.status(500).json({ message: 'Error getting table structure', error: error.message });
  }
};

/**
 * Get list of all tables
 * @param {*} req 
 * @param {*} res 
 */
exports.getAllTables = async (req, res) => {
  try {
    const [tables] = await pool.execute(`
      SELECT 
        TABLE_NAME as name,
        TABLE_ROWS as rowCount,
        CREATE_TIME as createdAt,
        UPDATE_TIME as updatedAt
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME
    `, [dbConfig.database]);
    
    res.json(tables);
  } catch (error) {
    console.error('Error getting tables:', error);
    res.status(500).json({ message: 'Error getting tables', error: error.message });
  }
};

/**
 * Get records from a table with pagination, sorting and filtering
 * @param {*} req 
 * @param {*} res 
 */
exports.getTableRecords = async (req, res) => {
  const { tableName } = req.params;
  const { page = 1, limit = 10, search = '', sortBy = 'id', sortDesc = 0 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    // Validate the table name and sort field to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    if (!isValidFieldName(sortBy)) {
      return res.status(400).json({ message: 'Invalid sort field' });
    }
    
    // Get table structure to know which fields to search
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME as name 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    `, [dbConfig.database, tableName]);
    
    // Generate WHERE conditions for search
    let whereClause = '';
    let searchParams = [];
    
    if (search) {
      const searchConditions = columns
        .filter(col => isSearchableType(col.name))
        .map(col => `${col.name} LIKE ?`);
      
      if (searchConditions.length > 0) {
        whereClause = 'WHERE ' + searchConditions.join(' OR ');
        searchParams = Array(searchConditions.length).fill(`%${search}%`);
      }
    }
    
    // Add any filter conditions from query params
    Object.entries(req.query).forEach(([key, value]) => {
      if (!['page', 'limit', 'search', 'sortBy', 'sortDesc'].includes(key) && 
          columns.some(col => col.name === key)) {
        
        whereClause = whereClause ? `${whereClause} AND ` : 'WHERE ';
        whereClause += `${key} = ?`;
        searchParams.push(value);
      }
    });
    
    // Get total count
    const [countResult] = await pool.execute(`
      SELECT COUNT(*) as total FROM ${tableName} ${whereClause}
    `, searchParams);
    
    const total = countResult[0].total;
    
    // Get records with pagination
    const [records] = await pool.execute(`
      SELECT * FROM ${tableName} 
      ${whereClause}
      ORDER BY ${sortBy} ${parseInt(sortDesc) ? 'DESC' : 'ASC'}
      LIMIT ? OFFSET ?
    `, [...searchParams, parseInt(limit), parseInt(offset)]);
    
    res.json({
      data: records,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error getting records:', error);
    res.status(500).json({ message: 'Error getting records', error: error.message });
  }
};

/**
 * Get a single record by ID
 * @param {*} req 
 * @param {*} res 
 */
exports.getRecordById = async (req, res) => {
  const { tableName, id } = req.params;
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Get record by ID
    const [records] = await pool.execute(`
      SELECT * FROM ${tableName} WHERE id = ?
    `, [id]);
    
    if (records.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Format JSON fields if any
    const record = formatRecordData(records[0]);
    
    res.json(record);
  } catch (error) {
    console.error('Error getting record:', error);
    res.status(500).json({ message: 'Error getting record', error: error.message });
  }
};

/**
 * Create a new record
 * @param {*} req 
 * @param {*} res 
 */
exports.createRecord = async (req, res) => {
  const { tableName } = req.params;
  const data = req.body;
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Get table structure to validate fields
    const [columns] = await pool.execute(`
      SELECT 
        COLUMN_NAME as name,
        IS_NULLABLE = 'YES' as nullable,
        COLUMN_KEY = 'PRI' as isPrimary,
        EXTRA = 'auto_increment' as auto,
        DATA_TYPE as dataType
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    `, [dbConfig.database, tableName]);
    
    // Prepare data for insertion
    const fields = [];
    const placeholders = [];
    const values = [];
    
    columns.forEach(column => {
      if (!column.auto && column.name !== 'id' && data[column.name] !== undefined) {
        fields.push(column.name);
        placeholders.push('?');
        
        // Serialize JSON data if needed
        if (column.dataType === 'json' && typeof data[column.name] === 'object') {
          values.push(JSON.stringify(data[column.name]));
        } else {
          values.push(data[column.name]);
        }
      }
    });
    
    // Insert record
    const [result] = await pool.execute(`
      INSERT INTO ${tableName} (${fields.join(', ')}) 
      VALUES (${placeholders.join(', ')})
    `, values);
    
    // Get the inserted record
    const [insertedRecord] = await pool.execute(`
      SELECT * FROM ${tableName} WHERE id = ?
    `, [result.insertId]);
    
    res.status(201).json(formatRecordData(insertedRecord[0]));
  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ message: 'Error creating record', error: error.message });
  }
};

/**
 * Update a record
 * @param {*} req 
 * @param {*} res 
 */
exports.updateRecord = async (req, res) => {
  const { tableName, id } = req.params;
  const data = req.body;
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Get table structure
    const [columns] = await pool.execute(`
      SELECT 
        COLUMN_NAME as name,
        DATA_TYPE as dataType
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
    `, [dbConfig.database, tableName]);
    
    // Prepare update fields
    const updateFields = [];
    const values = [];
    
    columns.forEach(column => {
      if (column.name !== 'id' && data[column.name] !== undefined) {
        updateFields.push(`${column.name} = ?`);
        
        // Serialize JSON data if needed
        if (column.dataType === 'json' && typeof data[column.name] === 'object') {
          values.push(JSON.stringify(data[column.name]));
        } else {
          values.push(data[column.name]);
        }
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    // Update record
    values.push(id); // Add ID for WHERE clause
    
    await pool.execute(`
      UPDATE ${tableName} 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `, values);
    
    // Get the updated record
    const [updatedRecord] = await pool.execute(`
      SELECT * FROM ${tableName} WHERE id = ?
    `, [id]);
    
    if (updatedRecord.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    res.json(formatRecordData(updatedRecord[0]));
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ message: 'Error updating record', error: error.message });
  }
};

/**
 * Delete a record
 * @param {*} req 
 * @param {*} res 
 */
exports.deleteRecord = async (req, res) => {
  const { tableName, id } = req.params;
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Get the record first to return it after deletion
    const [record] = await pool.execute(`
      SELECT * FROM ${tableName} WHERE id = ?
    `, [id]);
    
    if (record.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Delete the record
    await pool.execute(`
      DELETE FROM ${tableName} WHERE id = ?
    `, [id]);
    
    res.json({ message: 'Record deleted successfully', data: formatRecordData(record[0]) });
  } catch (error) {
    console.error('Error deleting record:', error);
    res.status(500).json({ message: 'Error deleting record', error: error.message });
  }
};

/**
 * Get related tables for a record
 * @param {*} req 
 * @param {*} res 
 */
exports.getRelatedTables = async (req, res) => {
  const { tableName, id } = req.params;
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Get all tables in the database
    const [tables] = await pool.execute(`
      SELECT TABLE_NAME as name
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = ?
    `, [dbConfig.database]);
    
    // For each table, check if it has a foreign key to our table
    const relatedTables = [];
    
    for (const table of tables) {
      if (table.name === tableName) continue;
      
      // Check for common foreign key pattern: tableName + 'Id'
      const foreignKey = `${getSingular(tableName)}Id`;
      
      // Check if this foreign key exists in the table
      const [columns] = await pool.execute(`
        SELECT COLUMN_NAME as name
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?
      `, [dbConfig.database, table.name, foreignKey]);
      
      if (columns.length > 0) {
        // This table has a foreign key to our table, count related records
        const [count] = await pool.execute(`
          SELECT COUNT(*) as count
          FROM ${table.name}
          WHERE ${foreignKey} = ?
        `, [id]);
        
        relatedTables.push({
          table: table.name,
          foreignKey,
          count: count[0].count
        });
      }
    }
    
    res.json(relatedTables);
  } catch (error) {
    console.error('Error getting related tables:', error);
    res.status(500).json({ message: 'Error getting related tables', error: error.message });
  }
};

/**
 * Get dashboard statistics
 * @param {*} req 
 * @param {*} res 
 */
exports.getDashboardStats = async (req, res) => {
  try {
    // Get total users
    const [users] = await pool.execute(`
      SELECT COUNT(*) as total FROM users
    `);
    
    // Get new users in last 30 days
    const [newUsers] = await pool.execute(`
      SELECT COUNT(*) as total FROM users
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    // Get total restaurants
    const [restaurants] = await pool.execute(`
      SELECT COUNT(*) as total FROM restaurants
    `);
    
    // Get total orders
    const [orders] = await pool.execute(`
      SELECT COUNT(*) as total FROM orders
    `);
    
    // Get orders in last 30 days
    const [recentOrders] = await pool.execute(`
      SELECT COUNT(*) as total FROM orders
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    // Get total revenue
    const [revenue] = await pool.execute(`
      SELECT SUM(totalAmount) as total FROM orders
      WHERE status != 'cancelled'
    `);
    
    // Get revenue in last 30 days
    const [recentRevenue] = await pool.execute(`
      SELECT SUM(totalAmount) as total FROM orders
      WHERE status != 'cancelled' AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `);
    
    // Calculate growth percentages
    const userGrowth = users[0].total > 0 
      ? (newUsers[0].total / users[0].total) * 100 
      : 0;
    
    const orderGrowth = orders[0].total > 0 
      ? (recentOrders[0].total / orders[0].total) * 100 
      : 0;
    
    const revenueGrowth = revenue[0].total > 0 
      ? (recentRevenue[0].total / revenue[0].total) * 100 
      : 0;
    
    res.json({
      users: {
        total: users[0].total,
        growth: parseFloat(userGrowth.toFixed(2))
      },
      restaurants: {
        total: restaurants[0].total,
        growth: 0 // Would need historical data to calculate
      },
      orders: {
        total: orders[0].total,
        growth: parseFloat(orderGrowth.toFixed(2))
      },
      revenue: {
        total: revenue[0].total || 0,
        growth: parseFloat(revenueGrowth.toFixed(2))
      }
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Error getting dashboard stats', error: error.message });
  }
};

// Helper Functions

/**
 * Validate table name to prevent SQL injection
 * @param {string} tableName 
 * @returns {boolean}
 */
function isValidTableName(tableName) {
  // Only allow alphanumeric and underscore characters
  return /^[a-zA-Z0-9_]+$/.test(tableName);
}

/**
 * Validate field name to prevent SQL injection
 * @param {string} fieldName 
 * @returns {boolean}
 */
function isValidFieldName(fieldName) {
  // Only allow alphanumeric and underscore characters
  return /^[a-zA-Z0-9_]+$/.test(fieldName);
}

/**
 * Check if field type is searchable
 * @param {string} fieldName 
 * @returns {boolean}
 */
function isSearchableType(fieldName) {
  // Exclude common non-searchable fields and JSON fields
  const nonSearchableFields = ['id', 'password', 'createdAt', 'updatedAt'];
  
  if (nonSearchableFields.includes(fieldName) || 
      fieldName.includes('JSON') ||
      fieldName.endsWith('Id')) {
    return false;
  }
  
  return true;
}

/**
 * Format record data (handle JSON fields, etc.)
 * @param {Object} record 
 * @returns {Object}
 */
function formatRecordData(record) {
  if (!record) return null;
  
  const formatted = { ...record };
  
  // Parse JSON strings to objects
  Object.keys(formatted).forEach(key => {
    if (typeof formatted[key] === 'string' && 
        (formatted[key].startsWith('{') || formatted[key].startsWith('['))) {
      try {
        formatted[key] = JSON.parse(formatted[key]);
      } catch (e) {
        // Not valid JSON, leave as is
      }
    }
  });
  
  return formatted;
}

/**
 * Get singular form of table name for foreign key matching
 * @param {string} tableName 
 * @returns {string}
 */
function getSingular(tableName) {
  // Handle common plurals (very basic)
  if (tableName.endsWith('ies')) {
    return tableName.slice(0, -3) + 'y';
  } else if (tableName.endsWith('s')) {
    return tableName.slice(0, -1);
  }
  return tableName;
} 