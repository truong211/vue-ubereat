const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middleware/error.middleware');
const multer = require('multer');
const path = require('path');
const os = require('os');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.originalUrl.includes('categories') ? 'categories' : 'banners';
    cb(null, `uploads/${type}`);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images are allowed'));
  }
}).single('image');

// Dashboard Statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    // Create a default stats structure
    const stats = {
      orders: {
        total: 0,
        growth: 0
      },
      revenue: {
        total: 0,
        growth: 0
      },
      users: {
        total: 0,
        growth: 0
      },
      restaurants: {
        total: 0,
        growth: 0
      }
    };
    
    // Default restaurant stats - no need to query since status column doesn't exist
    const restaurantStats = {
      pending: 0,
      active: 0,
      suspended: 0
    };

    try {
      // Get order counts
      const [orderResult] = await db.query('SELECT COUNT(*) as count FROM orders');
      if (orderResult && orderResult.count) {
        stats.orders.total = orderResult.count;
      }
    } catch (err) {
      console.error('Error getting order stats:', err);
    }

    try {
      // Get revenue
      const [revenueResult] = await db.query('SELECT SUM(totalAmount) as sum FROM orders');
      if (revenueResult && revenueResult.sum) {
        stats.revenue.total = revenueResult.sum;
      }
    } catch (err) {
      console.error('Error getting revenue stats:', err);
    }

    try {
      // Get user counts
      const [userResult] = await db.query('SELECT COUNT(*) as count FROM users');
      if (userResult && userResult.count) {
        stats.users.total = userResult.count;
      }
    } catch (err) {
      console.error('Error getting user stats:', err);
    }

    try {
      // Get restaurant counts
      const [restaurantResult] = await db.query('SELECT COUNT(*) as count FROM restaurants');
      if (restaurantResult && restaurantResult.count) {
        stats.restaurants.total = restaurantResult.count;
        
        // For now, set all restaurants as active since we don't have a status column
        restaurantStats.active = restaurantResult.count;
      }
    } catch (err) {
      console.error('Error getting restaurant stats:', err);
    }

    res.status(200).json({
      status: 'success',
      data: { stats, restaurantStats }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching dashboard statistics',
      data: {
        stats: {
          orders: { total: 0, growth: 0 },
          revenue: { total: 0, growth: 0 },
          users: { total: 0, growth: 0 },
          restaurants: { total: 0, growth: 0 }
        },
        restaurantStats: {
          pending: 0,
          active: 0,
          suspended: 0
        }
      }
    });
  }
};

// Analytics Data
exports.getAnalytics = async (req, res) => {
  try {
    // Simplified analytics response
    return res.json({
      status: 'success',
      data: {
        orderTrend: [],
        revenueTrend: [],
        userGrowth: [],
        popularCategories: [],
        topCities: [],
        orderStatusCounts: []
      }
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    return res.status(500).json({ 
      message: 'Failed to get analytics', 
      error: error.message 
    });
  }
};

/**
 * Gets all available database tables
 */
exports.getAllTables = async (req, res) => {
  try {
    // Use column aliases with backticks to avoid reserved keyword issues
    const result = await db.query(`
      SELECT 
        TABLE_NAME AS \`name\`,
        TABLE_ROWS AS \`row_count\`,
        CREATE_TIME AS \`created\`,
        UPDATE_TIME AS \`updated\`
      FROM 
        INFORMATION_SCHEMA.TABLES 
      WHERE 
        TABLE_SCHEMA = DATABASE()
      ORDER BY 
        TABLE_NAME
    `);
    
    return res.json({ tables: result });
  } catch (error) {
    console.error('Error getting tables:', error);
    return res.status(500).json({ 
      message: 'Failed to get tables', 
      error: error.message 
    });
  }
};

/**
 * Gets the structure of a specific table
 */
exports.getTableStructure = async (req, res) => {
  // Accept either table or tableName parameter
  const tableName = req.params.table || req.params.tableName;
  
  // Check if tableName is undefined or invalid
  if (!tableName || tableName === 'undefined') {
    return res.status(400).json({ 
      message: 'Invalid table name. Please provide a valid table name.',
      error: 'Table name is undefined or missing'
    });
  }
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    const structure = await getTableStructureHelper(tableName);
    return res.json(structure);
  } catch (error) {
    console.error(`Error getting table structure for ${tableName}:`, error);
    return res.status(500).json({ 
      message: `Failed to get table structure for ${tableName}`, 
      error: error.message 
    });
  }
};

/**
 * Gets records from a specific table
 */
exports.getTableRecords = async (req, res) => {
  // Accept either table or tableName parameter
  const tableName = req.params.table || req.params.tableName;
  
  // Check if tableName is undefined or invalid
  if (!tableName || tableName === 'undefined') {
    return res.status(400).json({ 
      message: 'Invalid table name. Please provide a valid table name.',
      error: 'Table name is undefined or missing'
    });
  }
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    
    // Get records from the table
    const records = await db.query(`SELECT * FROM \`${tableName}\` LIMIT ? OFFSET ?`, [limit, offset]);
    
    // Get total count for pagination
    const countResult = await db.query(`SELECT COUNT(*) as total FROM \`${tableName}\``);
    const total = countResult[0].total;
    
    return res.json({
      records,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(`Error getting records from ${tableName}:`, error);
    return res.status(500).json({ 
      message: `Failed to get records from ${tableName}`, 
      error: error.message 
    });
  }
};

/**
 * Endpoint to get a single table record by ID
 */
exports.getTableRecord = async (req, res) => {
  // Accept either table or tableName parameter
  const tableName = req.params.table || req.params.tableName;
  const id = req.params.id;
  
  // Check if tableName is undefined or invalid
  if (!tableName || tableName === 'undefined') {
    return res.status(400).json({ 
      message: 'Invalid table name. Please provide a valid table name.',
      error: 'Table name is undefined or missing'
    });
  }
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Get record from the table
    const record = await db.query(`SELECT * FROM \`${tableName}\` WHERE id = ?`, [id]);
    
    if (!record || record.length === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    return res.json(record[0]);
  } catch (error) {
    console.error(`Error getting record from ${tableName}:`, error);
    return res.status(500).json({ 
      message: `Failed to get record from ${tableName}`, 
      error: error.message 
    });
  }
};

/**
 * Alias for the getTableRecord function for backward compatibility
 */
exports.getRecordById = exports.getTableRecord;

/**
 * Endpoint to create a new record
 */
exports.createTableRecord = async (req, res) => {
  // Accept either table or tableName parameter
  const tableName = req.params.table || req.params.tableName;
  
  // Check if tableName is undefined or invalid
  if (!tableName || tableName === 'undefined') {
    return res.status(400).json({ 
      message: 'Invalid table name. Please provide a valid table name.',
      error: 'Table name is undefined or missing'
    });
  }
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Get the table structure to validate fields
    const { fields } = await getTableStructureHelper(tableName);
    
    // Filter out any fields that don't exist in the table or are auto-increment
    const validFieldNames = fields.filter(f => !f.isAutoIncrement).map(f => f.name);
    const filteredData = {};
    
    Object.keys(req.body).forEach(key => {
      if (validFieldNames.includes(key)) {
        filteredData[key] = req.body[key];
      }
    });
    
    // Check if we have any data left after filtering
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided' });
    }
    
    // Create columns and values for the SQL query
    const columns = Object.keys(filteredData).map(key => `\`${key}\``).join(', ');
    const placeholders = Object.keys(filteredData).map(() => '?').join(', ');
    const values = Object.values(filteredData);
    
    // Insert into the table
    const result = await db.query(
      `INSERT INTO \`${tableName}\` (${columns}) VALUES (${placeholders})`, 
      values
    );
    
    // Return the newly created record
    const newRecord = await db.query(
      `SELECT * FROM \`${tableName}\` WHERE id = ?`, 
      [result.insertId]
    );
    
    return res.status(201).json(newRecord[0]);
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    return res.status(500).json({ 
      message: `Failed to create record in ${tableName}`, 
      error: error.message 
    });
  }
};

/**
 * Alias for the createTableRecord function for backward compatibility
 */
exports.createRecord = exports.createTableRecord;

/**
 * Endpoint to update a record
 */
exports.updateTableRecord = async (req, res) => {
  // Accept either table or tableName parameter
  const tableName = req.params.table || req.params.tableName;
  const id = req.params.id;
  
  // Check if tableName is undefined or invalid
  if (!tableName || tableName === 'undefined') {
    return res.status(400).json({ 
      message: 'Invalid table name. Please provide a valid table name.',
      error: 'Table name is undefined or missing'
    });
  }
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Get the table structure to validate fields
    const { fields } = await getTableStructureHelper(tableName);
    
    // Filter out any fields that don't exist in the table or are primary keys
    const validFieldNames = fields.filter(f => !f.isPrimaryKey).map(f => f.name);
    const filteredData = {};
    
    Object.keys(req.body).forEach(key => {
      if (validFieldNames.includes(key)) {
        filteredData[key] = req.body[key];
      }
    });
    
    // Check if we have any data left after filtering
    if (Object.keys(filteredData).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }
    
    // Create SET clause for the SQL query
    const setClause = Object.keys(filteredData)
      .map(key => `\`${key}\` = ?`)
      .join(', ');
    const values = [...Object.values(filteredData), id];
    
    // Update the record
    const result = await db.query(
      `UPDATE \`${tableName}\` SET ${setClause} WHERE id = ?`, 
      values
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    // Return the updated record
    const updatedRecord = await db.query(
      `SELECT * FROM \`${tableName}\` WHERE id = ?`, 
      [id]
    );
    
    return res.json(updatedRecord[0]);
  } catch (error) {
    console.error(`Error updating record in ${tableName}:`, error);
    return res.status(500).json({ 
      message: `Failed to update record in ${tableName}`, 
      error: error.message 
    });
  }
};

/**
 * Alias for the updateTableRecord function for backward compatibility
 */
exports.updateRecord = exports.updateTableRecord;

/**
 * Endpoint to delete a record
 */
exports.deleteTableRecord = async (req, res) => {
  // Accept either table or tableName parameter
  const tableName = req.params.table || req.params.tableName;
  const id = req.params.id;
  
  // Check if tableName is undefined or invalid
  if (!tableName || tableName === 'undefined') {
    return res.status(400).json({ 
      message: 'Invalid table name. Please provide a valid table name.',
      error: 'Table name is undefined or missing'
    });
  }
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Delete the record
    const result = await db.query(
      `DELETE FROM \`${tableName}\` WHERE id = ?`, 
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Record not found' });
    }
    
    return res.json({ message: 'Record deleted successfully' });
  } catch (error) {
    console.error(`Error deleting record from ${tableName}:`, error);
    return res.status(500).json({ 
      message: `Failed to delete record from ${tableName}`, 
      error: error.message 
    });
  }
};

// Alias for the deleteTableRecord function for backward compatibility
exports.deleteRecord = exports.deleteTableRecord;

// Helper function to get table structure
async function getTableStructureHelper(table) {
  // Check if table name is valid
  if (!table || table === 'undefined') {
    throw new Error('Invalid or missing table name');
  }
  
  console.log(`Getting structure for table: ${table}`);
  
  // Query to get column information for the table
  const query = `
    SELECT 
      COLUMN_NAME as column_name,
      DATA_TYPE as data_type,
      COLUMN_TYPE as column_type,
      IS_NULLABLE as is_nullable,
      COLUMN_KEY as column_key,
      COLUMN_DEFAULT as column_default,
      CHARACTER_MAXIMUM_LENGTH as character_maximum_length,
      EXTRA as extra,
      COLUMN_COMMENT as column_comment
    FROM 
      INFORMATION_SCHEMA.COLUMNS 
    WHERE 
      TABLE_NAME = ?
      AND TABLE_SCHEMA = DATABASE()
    ORDER BY 
      ORDINAL_POSITION;
  `;
  
  const columns = await db.query(query, [table]);
  
  if (!columns || columns.length === 0) {
    console.error(`No columns found for table: ${table}`);
    throw new Error('Table not found');
  }
  
  console.log(`Found ${columns.length} columns for table ${table}`);
  
  // Log first column as sample
  if (columns.length > 0) {
    console.log('Sample column data:', JSON.stringify(columns[0], null, 2));
  }
  
  // Transform column data into a more useful format
  const fields = columns.map((column, index) => {
    // Handle potential null values
    const columnName = column.column_name || '';
    const dataType = column.data_type || '';
    const columnType = column.column_type || '';
    const isNullable = column.is_nullable || 'YES';
    const columnKey = column.column_key || '';
    const columnDefault = column.column_default;
    const columnComment = column.column_comment || '';
    const extra = column.extra || '';
    
    // Debug logging to track column data
    console.log(`Field ${index+1}: ${columnName} (${dataType})`);
    
    // Determine field type
    let fieldType = 'string';
    
    if (['int', 'integer', 'bigint', 'smallint', 'decimal', 'numeric', 'real', 'double precision', 'float', 'mediumint', 'tinyint'].includes(dataType.toLowerCase())) {
      // Handle tinyint(1) as boolean
      if (dataType.toLowerCase() === 'tinyint' && columnType.includes('(1)')) {
        fieldType = 'boolean';
      } else {
        fieldType = 'number';
      }
    } else if (['boolean', 'bool'].includes(dataType.toLowerCase())) {
      fieldType = 'boolean';
    } else if (['text', 'longtext', 'mediumtext'].includes(dataType.toLowerCase())) {
      fieldType = 'textarea';
    } else if (['date', 'timestamp', 'timestamptz', 'datetime', 'time'].includes(dataType.toLowerCase())) {
      fieldType = 'date';
    } else if (dataType.toLowerCase() === 'enum' || columnType.toLowerCase().includes('enum(')) {
      fieldType = 'select';
    } else if (dataType.toLowerCase() === 'json') {
      fieldType = 'json';
    } else {
      fieldType = 'text';
    }
    
    // Generate a description for the field if none exists
    let description = columnComment;
    if (!description) {
      if (columnName === 'id') {
        description = 'Primary identifier for this record';
      } else if (columnName === 'createdAt') {
        description = 'Date and time when this record was created';
      } else if (columnName === 'updatedAt') {
        description = 'Date and time when this record was last updated';
      } else if (columnName.endsWith('Id')) {
        const relatedEntity = columnName.substring(0, columnName.length - 2);
        description = `Reference to a ${relatedEntity}`;
      } else if (columnName === 'email') {
        description = 'Email address';
      } else if (columnName === 'password') {
        description = 'Hashed password (not displayed)';
      } else if (columnName === 'phoneNumber') {
        description = 'Contact phone number';
      } else if (columnName.includes('status')) {
        description = 'Current status';
      } else if (columnName.includes('image') || columnName.includes('photo') || columnName.includes('avatar')) {
        description = 'Image file path or URL';
      } else if (columnName.includes('description')) {
        description = 'Detailed description';
      } else if (columnName.includes('name')) {
        description = 'Name identifier';
      }
    }
    
    // Get enum values if applicable
    let enumValues = [];
    if (columnType && columnType.toLowerCase().includes('enum(')) {
      const enumMatch = columnType.match(/enum\((.*)\)/i);
      if (enumMatch && enumMatch[1]) {
        enumValues = enumMatch[1].split(',').map(val => val.replace(/'/g, '').trim());
      }
    }
    
    const field = {
      name: columnName,
      type: fieldType,
      dataType: dataType,
      columnType: columnType,
      required: isNullable === 'NO',
      isPrimaryKey: columnKey === 'PRI',
      defaultValue: columnDefault,
      maxLength: column.character_maximum_length,
      isAutoIncrement: extra.toLowerCase().includes('auto_increment'),
      description: description,
      enumValues: enumValues.length > 0 ? enumValues : undefined
    };
    
    // Log every 5th field or if it's the first or last
    if (index === 0 || index === columns.length - 1 || index % 5 === 0) {
      console.log(`Field ${index+1}/${columns.length}:`, field.name, field.type);
    }
    
    return field;
  });
  
  console.log(`Processed ${fields.length} fields for table ${table}`);
  
  return { fields };
}

// Get related tables for a record
exports.getRelatedTables = async (req, res) => {
  // Accept either table or tableName parameter
  const tableName = req.params.table || req.params.tableName;
  const id = req.params.id;
  
  // Check if tableName is undefined or invalid
  if (!tableName || tableName === 'undefined') {
    return res.status(400).json({ 
      message: 'Invalid table name. Please provide a valid table name.',
      error: 'Table name is undefined or missing'
    });
  }
  
  try {
    // Validate the table name to prevent SQL injection
    if (!isValidTableName(tableName)) {
      return res.status(400).json({ message: 'Invalid table name' });
    }
    
    // Get all tables in the database
    const tables = await db.query(`
      SELECT TABLE_NAME as name
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    
    // For each table, check if it has a foreign key to our table
    const relatedTables = [];
    
    for (const table of tables) {
      if (table.name === tableName) continue;
      
      // Check for common foreign key pattern: tableName + 'Id'
      const foreignKey = `${getSingular(tableName)}Id`;
      
      // Check if this foreign key exists in the table
      const columns = await db.query(`
        SELECT COLUMN_NAME as name
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
      `, [table.name, foreignKey]);
      
      if (columns.length > 0) {
        // This table has a foreign key to our table, count related records
        const count = await db.query(`
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

// Helper functions
function calculateGrowth(current, previous) {
  if (!previous) return 100;
  return Number(((current - previous) / previous * 100).toFixed(1));
}

function getStartDate(timeframe) {
  const date = new Date();
  switch (timeframe) {
    case 'week':
      date.setDate(date.getDate() - 7);
      break;
    case 'month':
      date.setMonth(date.getMonth() - 1);
      break;
    case 'quarter':
      date.setMonth(date.getMonth() - 3);
      break;
    case 'year':
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setDate(date.getDate() - 7);
  }
  return date;
}

async function getOrderTrend(startDate) {
  const startDateStr = startDate.toISOString().slice(0, 19).replace('T', ' ');
  
  return await db.query(`
    SELECT 
      DATE(createdAt) as date, 
      COUNT(*) as count
    FROM orders
    WHERE createdAt >= ?
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `, [startDateStr]);
}

async function getRevenueTrend(startDate) {
  const startDateStr = startDate.toISOString().slice(0, 19).replace('T', ' ');
  
  return await db.query(`
    SELECT 
      DATE(createdAt) as date, 
      SUM(totalAmount) as total
    FROM orders
    WHERE createdAt >= ?
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `, [startDateStr]);
}

async function getUserGrowth(startDate) {
  const startDateStr = startDate.toISOString().slice(0, 19).replace('T', ' ');
  
  return await db.query(`
    SELECT 
      DATE(createdAt) as date, 
      COUNT(*) as count
    FROM users
    WHERE createdAt >= ?
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `, [startDateStr]);
}

async function getPopularCategories() {
  return await db.query(`
    SELECT 
      c.name,
      COUNT(p.id) as productCount,
      SUM(COALESCE(p.orderCount, 0)) as orderCount
    FROM categories c
    LEFT JOIN products p ON c.id = p.categoryId
    GROUP BY c.id, c.name
    ORDER BY orderCount DESC
    LIMIT 5
  `);
}

async function getTopCities() {
  return await db.query(`
    SELECT 
      city,
      COUNT(*) as restaurantCount,
      SUM(COALESCE(orderCount, 0)) as orderCount
    FROM restaurants
    GROUP BY city
    ORDER BY orderCount DESC
    LIMIT 5
  `);
}

function isValidTableName(tableName) {
  // Check if tableName is undefined or null or empty string
  if (!tableName || tableName === 'undefined') {
    return false;
  }
  
  // Only allow alphanumeric and underscore characters
  return /^[a-zA-Z0-9_]+$/.test(tableName);
}

function isValidFieldName(fieldName) {
  // Only allow alphanumeric and underscore characters
  return /^[a-zA-Z0-9_]+$/.test(fieldName);
}

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

function getSingular(tableName) {
  // Handle common plurals (very basic)
  if (tableName.endsWith('ies')) {
    return tableName.slice(0, -3) + 'y';
  } else if (tableName.endsWith('s')) {
    return tableName.slice(0, -1);
  }
  return tableName;
}

/**
 * Get system alerts for admin dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getSystemAlerts = async (req, res) => {
  try {
    // Simplified system alerts response
    return res.json({
      status: 'success',
      data: []
    });
  } catch (error) {
    console.error('Error getting system alerts:', error);
    return res.status(500).json({ 
      message: 'Failed to get system alerts', 
      error: error.message 
    });
  }
};

// Get recent activities
exports.getRecentActivities = async (req, res) => {
  try {
    // Simplified recent activities response
    return res.json({
      status: 'success',
      data: {
        orders: [],
        users: [],
        restaurants: []
      }
    });
  } catch (error) {
    console.error('Error getting recent activities:', error);
    return res.status(500).json({ 
      message: 'Failed to get recent activities', 
      error: error.message 
    });
  }
};

// Get pending restaurants
exports.getPendingRestaurants = async (req, res) => {
  try {
    // Simplified pending restaurants response
    return res.json({
      status: 'success',
      data: []
    });
  } catch (error) {
    console.error('Error getting pending restaurants:', error);
    return res.status(500).json({ 
      message: 'Failed to get pending restaurants', 
      error: error.message 
    });
  }
};

// Update restaurant status
exports.updateRestaurantStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;
    
    // Simplified response
    return res.json({
      status: 'success',
      message: 'Restaurant status updated'
    });
  } catch (error) {
    console.error('Error updating restaurant status:', error);
    return res.status(500).json({ 
      message: 'Failed to update restaurant status', 
      error: error.message 
    });
  }
};

// Get banners
exports.getBanners = async (req, res) => {
  try {
    // Simplified banners response
    return res.json({
      status: 'success',
      data: []
    });
  } catch (error) {
    console.error('Error getting banners:', error);
    return res.status(500).json({ 
      message: 'Failed to get banners', 
      error: error.message 
    });
  }
};

// Create banner
exports.createBanner = async (req, res) => {
  try {
    // Simplified response
    return res.status(201).json({
      status: 'success',
      message: 'Banner created'
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    return res.status(500).json({ 
      message: 'Failed to create banner', 
      error: error.message 
    });
  }
};

// Update banner
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Simplified response
    return res.json({
      status: 'success',
      message: 'Banner updated'
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    return res.status(500).json({ 
      message: 'Failed to update banner', 
      error: error.message 
    });
  }
};

// Delete banner
exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Simplified response
    return res.json({
      status: 'success',
      message: 'Banner deleted'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return res.status(500).json({ 
      message: 'Failed to delete banner', 
      error: error.message 
    });
  }
};

// Get static pages
exports.getPages = async (req, res) => {
  try {
    // Use the StaticPage model to get all pages
    const { StaticPage } = require('../models');
    const pages = await StaticPage.findAll({
      order: [['title', 'ASC']]
    });

    return res.json({
      status: 'success',
      data: pages
    });
  } catch (error) {
    console.error('Error getting pages:', error);
    return res.status(500).json({ 
      message: 'Failed to get pages', 
      error: error.message 
    });
  }
};

// Create static page
exports.createPage = async (req, res) => {
  try {
    const { StaticPage } = require('../models');
    const { title, slug, content, published } = req.body;
    
    // Create the page in the database
    const page = await StaticPage.create({
      title,
      slug,
      content,
      published: published !== undefined ? published : false
    });

    return res.status(201).json({
      status: 'success',
      data: {
        page
      }
    });
  } catch (error) {
    console.error('Error creating page:', error);
    return res.status(500).json({ 
      message: 'Failed to create page', 
      error: error.message 
    });
  }
};

// Update static page
exports.updatePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { StaticPage } = require('../models');
    const { title, slug, content, published } = req.body;
    
    // First check if page exists
    const existingPage = await StaticPage.findByPk(id);
    
    if (!existingPage) {
      return res.status(404).json({
        status: 'error',
        message: 'Page not found'
      });
    }
    
    // Update the page
    await existingPage.update({
      title: title || existingPage.title,
      slug: slug || existingPage.slug,
      content: content || existingPage.content,
      published: published !== undefined ? published : existingPage.published
    });
    
    // Get the updated page
    const updatedPage = await StaticPage.findByPk(id);
    
    return res.json({
      status: 'success',
      data: {
        page: updatedPage
      }
    });
  } catch (error) {
    console.error('Error updating page:', error);
    return res.status(500).json({ 
      message: 'Failed to update page', 
      error: error.message 
    });
  }
};

// Delete static page
exports.deletePage = async (req, res) => {
  try {
    const { id } = req.params;
    const { StaticPage } = require('../models');
    
    // First check if page exists
    const existingPage = await StaticPage.findByPk(id);
    
    if (!existingPage) {
      return res.status(404).json({
        status: 'error',
        message: 'Page not found'
      });
    }
    
    // Delete the page
    await existingPage.destroy();
    
    return res.status(200).json({
      status: 'success',
      message: 'Page deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return res.status(500).json({ 
      message: 'Failed to delete page', 
      error: error.message 
    });
  }
};

// Get site configuration
exports.getConfig = async (req, res) => {
  try {
    // Simplified config response
    return res.json({
      status: 'success',
      data: {
        siteName: 'Food Delivery',
        logo: '/uploads/logo.png',
        contactEmail: 'contact@fooddelivery.com',
        supportPhone: '+1234567890',
        socialLinks: {
          facebook: 'https://facebook.com',
          twitter: 'https://twitter.com',
          instagram: 'https://instagram.com'
        },
        footerText: '© 2023 Food Delivery. All rights reserved.'
      }
    });
  } catch (error) {
    console.error('Error getting config:', error);
    return res.status(500).json({ 
      message: 'Failed to get config', 
      error: error.message 
    });
  }
};

// Update site configuration
exports.updateConfig = async (req, res) => {
  try {
    // Simplified response
    return res.json({
      status: 'success',
      message: 'Config updated'
    });
  } catch (error) {
    console.error('Error updating config:', error);
    return res.status(500).json({ 
      message: 'Failed to update config', 
      error: error.message 
    });
  }
};

// Get reported users
exports.getReportedUsers = async (req, res) => {
  try {
    // Simplified reported users response
    return res.json({
      status: 'success',
      data: []
    });
  } catch (error) {
    console.error('Error getting reported users:', error);
    return res.status(500).json({ 
      message: 'Failed to get reported users', 
      error: error.message 
    });
  }
};

// Get all users with pagination and search
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role;
    const status = req.query.status;
    
    let query = 'SELECT id, username, email, fullName, phone, role, isActive, createdAt, updatedAt FROM users';
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    
    const conditions = [];
    const params = [];
    
    if (search) {
      conditions.push('(username LIKE ? OR email LIKE ? OR fullName LIKE ? OR phone LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }
    
    if (role) {
      conditions.push('role = ?');
      params.push(role);
    }
    
    if (status) {
      if (status === 'active') {
        conditions.push('isActive = ?');
        params.push(true);
      } else if (status === 'suspended') {
        conditions.push('isActive = ?');
        params.push(false);
      }
    }
    
    if (conditions.length > 0) {
      const whereClause = 'WHERE ' + conditions.join(' AND ');
      query += ' ' + whereClause;
      countQuery += ' ' + whereClause;
    }
    
    query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
    
    // Clone params for count query before adding limit and offset
    const countParams = [...params];
    
    // Add limit and offset for the main query
    params.push(limit, offset);
    
    // Database queries with proper error handling
    let users = [];
    let countResult = { total: 0 };
    
    try {
      users = await db.query(query, params);
      console.log('Users query result:', users ? `Found ${users.length} users` : 'No users found');
    } catch (err) {
      console.error('Error in users query:', err.message);
      users = [];
    }
    
    try {
      const countResults = await db.query(countQuery, countParams);
      if (Array.isArray(countResults) && countResults.length > 0) {
        countResult = countResults[0];
      } else if (countResults && countResults.total !== undefined) {
        countResult = countResults;
      }
      console.log('Count query result:', countResult);
    } catch (err) {
      console.error('Error in count query:', err.message);
    }
    
    const total = countResult.total || 0;
    const totalPages = Math.ceil(total / limit);
    
    // Map isActive to status for consistency with frontend
    const formattedUsers = users.map(user => ({
      ...user,
      status: user.isActive ? 'active' : 'suspended'
    }));
    
    return res.json({
      status: 'success',
      data: {
        users: formattedUsers || [],
        pagination: {
          page,
          limit,
          total,
          totalPages
        },
        totalResults: total,
        currentPage: page,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get users',
      error: error.message
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID'
      });
    }
    
    // Query for the user
    const user = await db.query('SELECT id, username, email, fullName, phone, role, isActive, address, profileImage, createdAt, updatedAt FROM users WHERE id = ?', [id]);
    
    if (!user || !user.length) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Format user data
    const userData = {
      ...user[0],
      status: user[0].isActive ? 'active' : 'suspended'
    };
    
    return res.json({
      status: 'success',
      data: {
        user: userData
      }
    });
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get user details',
      error: error.message
    });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { fullName, email, username, phone, role, password } = req.body;
    
    // Basic validation
    if (!fullName || !email || !role) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: fullName, email, and role are required'
      });
    }
    
    // Check if email already exists
    const existingUser = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    
    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already in use'
      });
    }
    
    // Generate a username if not provided
    const finalUsername = username || email.split('@')[0] + Math.floor(Math.random() * 1000);
    
    // Generate a default password if not provided
    const bcrypt = require('bcryptjs');
    const defaultPassword = password || 'changeme123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    // Insert the new user
    const result = await db.query(
      'INSERT INTO users (fullName, email, username, password, phone, role, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, true, NOW(), NOW())',
      [fullName, email, finalUsername, hashedPassword, phone || null, role]
    );
    
    if (!result || !result.insertId) {
      throw new Error('Failed to create user record');
    }
    
    // Fetch the newly created user
    const newUser = await db.query('SELECT id, username, email, fullName, phone, role, isActive, createdAt, updatedAt FROM users WHERE id = ?', [result.insertId]);
    
    return res.status(201).json({
      status: 'success',
      message: 'User created successfully',
      data: {
        user: {
          ...newUser[0],
          status: 'active'
        }
      }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create user',
      error: error.message
    });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, role } = req.body;
    
    // Validate ID is a number
    if (isNaN(parseInt(id))) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid user ID'
      });
    }
    
    // Check if user exists
    const existingUser = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    
    if (!existingUser || !existingUser.length) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Update the user record
    const updates = [];
    const values = [];
    
    if (fullName) {
      updates.push('fullName = ?');
      values.push(fullName);
    }
    
    if (email) {
      // Check if email is unique
      const emailCheck = await db.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailCheck && emailCheck.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Email is already in use by another user'
        });
      }
      
      updates.push('email = ?');
      values.push(email);
    }
    
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    
    // Add timestamp for the update
    updates.push('updatedAt = NOW()');
    
    if (updates.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No fields to update'
      });
    }
    
    // Execute the update query
    values.push(id); // Add ID for WHERE clause
    const updateQuery = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const result = await db.query(updateQuery, values);
    
    if (!result || result.affectedRows === 0) {
      throw new Error('Failed to update user');
    }
    
    // Fetch the updated user
    const updatedUser = await db.query('SELECT id, username, email, fullName, phone, role, isActive, createdAt, updatedAt FROM users WHERE id = ?', [id]);
    
    return res.json({
      status: 'success',
      message: 'User updated successfully',
      data: {
        user: {
          ...updatedUser[0],
          status: updatedUser[0].isActive ? 'active' : 'suspended'
        }
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update user',
      error: error.message
    });
  }
};

// Update user status
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    // Validate parameters
    if (!id || !status) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID and status are required'
      });
    }
    
    // Verify status is valid
    if (status !== 'active' && status !== 'suspended') {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either "active" or "suspended"'
      });
    }
    
    // If suspending, reason is required
    if (status === 'suspended' && !reason) {
      return res.status(400).json({
        status: 'error',
        message: 'Reason is required when suspending a user'
      });
    }
    
    // Check if user exists
    const existingUser = await db.query('SELECT id, role FROM users WHERE id = ?', [id]);
    
    if (!existingUser || !existingUser.length) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Prevent suspending the only admin user
    if (existingUser[0].role === 'admin' && status === 'suspended') {
      const adminCount = await db.query('SELECT COUNT(*) as count FROM users WHERE role = "admin" AND isActive = true', []);
      
      if (adminCount[0].count <= 1) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot suspend the only active admin user'
        });
      }
    }
    
    // Update user status
    const isActive = status === 'active';
    const result = await db.query(
      'UPDATE users SET isActive = ?, updatedAt = NOW() WHERE id = ?',
      [isActive, id]
    );
    
    if (!result || result.affectedRows === 0) {
      throw new Error('Failed to update user status');
    }
    
    // Save suspension reason to activity log if provided
    if (reason) {
      try {
        await db.query(
          'INSERT INTO user_activity_logs (userId, action, details, timestamp) VALUES (?, ?, ?, NOW())',
          [id, `status_change_to_${status}`, JSON.stringify({ reason, changedBy: req.user.id })]
        );
      } catch (logError) {
        console.error('Error logging status change:', logError);
        // Continue even if logging fails
      }
    }
    
    // Fetch the updated user
    const updatedUser = await db.query('SELECT id, username, email, fullName, phone, role, isActive, createdAt, updatedAt FROM users WHERE id = ?', [id]);
    
    return res.json({
      status: 'success',
      message: `User ${status === 'active' ? 'activated' : 'suspended'} successfully`,
      data: {
        user: {
          ...updatedUser[0],
          status: updatedUser[0].isActive ? 'active' : 'suspended'
        }
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

/**
 * Render admin login page
 * @route GET /admin/login
 * @access Public
 */
exports.renderLoginPage = (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Login</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f5f5f5;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
        }
        .login-container {
          background-color: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          width: 100%;
          max-width: 400px;
        }
        h1 {
          text-align: center;
          color: #333;
          margin-bottom: 1.5rem;
        }
        .form-group {
          margin-bottom: 1rem;
        }
        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: bold;
        }
        input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          box-sizing: border-box;
        }
        button {
          width: 100%;
          padding: 0.75rem;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
        }
        button:hover {
          background-color: #45a049;
        }
        .error {
          color: red;
          margin-top: 1rem;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="login-container">
        <h1>Admin Login</h1>
        <div id="error-message" class="error"></div>
        <form id="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
      
      <script>
        document.getElementById('login-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          
          try {
            document.getElementById('error-message').textContent = 'Logging in...';
            
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ email, password }),
              credentials: 'include' // Include cookies in the request
            });
            
            const data = await response.json();
            
            if (response.ok) {
              document.getElementById('error-message').textContent = 'Login successful, redirecting...';
              
              // The server should set the cookie automatically
              // Still store tokens in multiple storage mechanisms for resilience
              
              // 1. localStorage (accessible by JavaScript, persistent across sessions)
              localStorage.setItem('adminToken', data.token);
              localStorage.setItem('refreshToken', data.refreshToken);
              
              // 2. sessionStorage (cleared when tab is closed)
              sessionStorage.setItem('adminToken', data.token);
              sessionStorage.setItem('refreshToken', data.refreshToken);
              
              // 3. Manual document.cookie as backup
              if (data.token) {
                const secureFlag = window.location.protocol === 'https:' ? '; secure' : '';
                document.cookie = 'jwt=' + data.token + '; path=/; max-age=604800; samesite=lax' + secureFlag;
                if (data.refreshToken) {
                  document.cookie = 'refresh_token=' + data.refreshToken + '; path=/; max-age=2592000; samesite=lax' + secureFlag;
                }
              }
              
              // Do a check to make sure the user is an admin
              if (data.user && data.user.role === 'admin') {
                // Store user data
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                
                // Redirect to admin dashboard
                setTimeout(() => {
                  window.location.href = '/admin/dashboard';
                }, 500); // Small delay to ensure cookies are set
              } else {
                document.getElementById('error-message').textContent = 'Access denied. Admin privileges required.';
              }
            } else {
              document.getElementById('error-message').textContent = data.message || 'Login failed';
            }
          } catch (error) {
            console.error('Login error:', error);
            document.getElementById('error-message').textContent = 'An error occurred. Please try again.';
          }
        });
      </script>
    </body>
    </html>
  `);
};

/**
 * Render admin dashboard page
 * @route GET /admin/dashboard
 * @access Admin
 */
exports.renderDashboard = (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Dashboard</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .container {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 250px;
          background-color: #333;
          color: white;
          padding: 1rem;
        }
        .sidebar h2 {
          margin-top: 0;
          padding-bottom: 1rem;
          border-bottom: 1px solid #444;
        }
        .sidebar ul {
          list-style: none;
          padding: 0;
        }
        .sidebar li {
          margin-bottom: 0.5rem;
        }
        .sidebar a {
          color: white;
          text-decoration: none;
          display: block;
          padding: 0.5rem;
          border-radius: 4px;
        }
        .sidebar a:hover {
          background-color: #444;
        }
        .content {
          flex: 1;
          padding: 1rem;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background-color: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 1rem;
        }
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }
        .stat-card {
          background-color: white;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .stat-card h3 {
          margin-top: 0;
          color: #555;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #333;
        }
        .logout-btn {
          padding: 0.5rem 1rem;
          background-color: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .logout-btn:hover {
          background-color: #d32f2f;
        }
        #auth-status {
          background-color: #ffeb3b;
          padding: 0.5rem 1rem;
          margin: 1rem 0;
          border-radius: 4px;
          display: none;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .user-name {
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="sidebar">
          <h2>Admin Panel</h2>
          <ul>
            <li><a href="/admin/dashboard">Dashboard</a></li>
            <li><a href="/admin/restaurants">Restaurants</a></li>
            <li><a href="/admin/users">Users</a></li>
            <li><a href="/admin/orders">Orders</a></li>
            <li><a href="/admin/banners">Banners</a></li>
            <li><a href="/admin/pages">Pages</a></li>
            <li><a href="/admin/settings">Settings</a></li>
          </ul>
        </div>
        <div class="content">
          <div class="header">
            <h1>Dashboard</h1>
            <div class="user-info">
              <span class="user-name" id="user-name"></span>
            <button id="logout-btn" class="logout-btn">Logout</button>
            </div>
          </div>
          
          <div id="auth-status"></div>
          
          <div class="stats-container">
            <div class="stat-card">
              <h3>Total Users</h3>
              <div class="stat-value" id="total-users">Loading...</div>
            </div>
            <div class="stat-card">
              <h3>Total Restaurants</h3>
              <div class="stat-value" id="total-restaurants">Loading...</div>
            </div>
            <div class="stat-card">
              <h3>Total Orders</h3>
              <div class="stat-value" id="total-orders">Loading...</div>
            </div>
            <div class="stat-card">
              <h3>Revenue</h3>
              <div class="stat-value" id="total-revenue">Loading...</div>
            </div>
          </div>
        </div>
      </div>
      
      <script>
        // Get token from various sources
        function getToken() {
          // First try to get from cookies
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('jwt='))
            ?.split('=')[1];
            
          // If not found in cookies, try sessionStorage
          const sessionToken = sessionStorage.getItem('adminToken');
          
          // If not found in sessionStorage, try localStorage
          const localToken = localStorage.getItem('adminToken');
          
          // Return the first token found, prioritizing cookies
          const token = cookieToken || sessionToken || localToken;
          
          // If token found but not in cookie, update cookie
          if (token && !cookieToken) {
            console.log('Restoring token to cookie');
            const secureFlag = window.location.protocol === 'https:' ? '; secure' : '';
            document.cookie = 'jwt=' + token + '; path=/; max-age=604800; samesite=lax' + secureFlag;
            document.getElementById('auth-status').style.display = 'block';
            document.getElementById('auth-status').textContent = 'Session restored from backup. If you experience issues, please login again.';
          }
          
          return token;
        }
        
        // Get refresh token from various sources
        function getRefreshToken() {
          // First try to get from cookies
          const cookieToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('refresh_token='))
            ?.split('=')[1];
            
          // If not found in cookies, try sessionStorage
          const sessionToken = sessionStorage.getItem('refreshToken');
          
          // If not found in sessionStorage, try localStorage
          const localToken = localStorage.getItem('refreshToken');
          
          // Return the first token found, prioritizing cookies
          return cookieToken || sessionToken || localToken;
        }
        
        // Get user data
        function getUserData() {
          // Try localStorage first
          const storedUser = localStorage.getItem('adminUser');
          if (storedUser) {
            try {
              return JSON.parse(storedUser);
            } catch (e) {
              console.error('Error parsing user data:', e);
            }
          }
          return null;
        }
        
        // Update user info in UI
        function updateUserInfo() {
          const user = getUserData();
          if (user) {
            document.getElementById('user-name').textContent = user.name || user.email;
          }
        }
        
        // Try to refresh the token
        async function refreshToken() {
          try {
            const refreshToken = getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }
            
            const response = await fetch('/api/auth/refresh', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ refreshToken }),
              credentials: 'include'
            });
            
            if (!response.ok) {
              throw new Error('Token refresh failed');
            }
            
            const data = await response.json();
            
            // Update stored tokens
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('refreshToken', data.refreshToken);
            sessionStorage.setItem('adminToken', data.token);
            sessionStorage.setItem('refreshToken', data.refreshToken);
            
            document.getElementById('auth-status').style.display = 'block';
            document.getElementById('auth-status').textContent = 'Session refreshed successfully.';
            
            // Hide the message after 3 seconds
            setTimeout(() => {
              document.getElementById('auth-status').style.display = 'none';
            }, 3000);
            
            return data.token;
          } catch (error) {
            console.error('Token refresh failed:', error);
            document.getElementById('auth-status').style.display = 'block';
            document.getElementById('auth-status').textContent = 'Session expired. Redirecting to login...';
            
            // Clear tokens
            localStorage.removeItem('adminToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('adminUser');
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('refreshToken');
            document.cookie = 'jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            
            // Redirect to login after a short delay
            setTimeout(() => {
              window.location.href = '/admin/login';
            }, 2000);
            
            return null;
          }
        }
        
        // Check if user is logged in
        const token = getToken();
        if (!token) {
          console.error('No authentication token found, redirecting to login');
          window.location.href = '/admin/login';
        } else {
          // Update user info in UI
          updateUserInfo();
        }
        
        // Fetch dashboard stats
        async function fetchStats() {
          try {
            // Always get a fresh token in case it was updated
            const currentToken = getToken();
            
            const response = await fetch('/api/admin/dashboard/stats', {
              headers: {
                'Authorization': currentToken ? 'Bearer ' + currentToken : '',
                'Content-Type': 'application/json'
              },
              credentials: 'include' // Include cookies in the request
            });
            
            if (response.status === 401 || response.status === 403) {
              console.log('Authentication failed, trying to refresh token...');
              
              // Try to refresh the token
              const newToken = await refreshToken();
              
              if (newToken) {
                // Retry the request with the new token
                const retryResponse = await fetch('/api/admin/dashboard/stats', {
                  headers: {
                    'Authorization': 'Bearer ' + newToken,
                    'Content-Type': 'application/json'
                  },
                  credentials: 'include'
                });
                
                if (retryResponse.ok) {
                  const data = await retryResponse.json();
                  updateDashboardStats(data);
                  return;
                }
              }
              
              // If we get here, the refresh failed or the retry failed
              console.error('Authentication failed after token refresh, redirecting to login');
              window.location.href = '/admin/login';
              return;
            }
            
            if (response.ok) {
            const data = await response.json();
              updateDashboardStats(data);
            } else {
              document.getElementById('auth-status').style.display = 'block';
              document.getElementById('auth-status').textContent = 'Error loading dashboard data: ' + (await response.text());
            }
          } catch (error) {
            console.error('Error fetching stats:', error);
            document.getElementById('auth-status').style.display = 'block';
            document.getElementById('auth-status').textContent = 'Error loading dashboard data. Please refresh the page or login again.';
          }
        }
        
        // Update dashboard stats with fetched data
        function updateDashboardStats(data) {
            if (data.status === 'success') {
              // Update stats
              const stats = data.data.stats || {};
              document.getElementById('total-users').textContent = stats.users?.total || '0';
              document.getElementById('total-restaurants').textContent = stats.restaurants?.total || '0';
              document.getElementById('total-orders').textContent = stats.orders?.total || '0';
              document.getElementById('total-revenue').textContent = '$' + (stats.revenue?.total || '0');
          }
        }
        
        // Periodically check authentication
        function checkAuth() {
          const token = getToken();
          if (!token) {
            console.error('Token missing during auth check, attempting to refresh...');
            refreshToken();
          }
        }
        
        // Refresh token periodically to prevent expiration
        async function scheduleTokenRefresh() {
          try {
            await refreshToken();
            console.log('Token refreshed successfully');
          } catch (error) {
            console.error('Scheduled token refresh failed:', error);
          }
        }
        
        // Set interval to check auth every 30 seconds
        setInterval(checkAuth, 30000);
        
        // Set interval to refresh token every 6 hours (to prevent expiration)
        setInterval(scheduleTokenRefresh, 6 * 60 * 60 * 1000);
        
        // Handle logout
        document.getElementById('logout-btn').addEventListener('click', async () => {
          try {
            // Call logout API
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + getToken(),
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });
          } catch (error) {
            console.error('Error logging out:', error);
          }

          // Clear token from localStorage and cookies
          localStorage.removeItem('adminToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('adminUser');
          sessionStorage.removeItem('adminToken');
          sessionStorage.removeItem('refreshToken');
          document.cookie = 'jwt=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          
          // Redirect to login page
          window.location.href = '/admin/login';
        });
        
        // Fetch stats on page load
        fetchStats();
      </script>
    </body>
    </html>
  `);
};