// Fix for admin.controller.js to handle undefined table names

// Enhanced getTableStructure function
exports.getTableStructure = async (req, res) => {
  try {
    // Get the table name from request parameters
    const tableName = req.params.table || req.params.tableName;
    
    // Check if table name is valid
    if (!tableName || tableName === 'undefined') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or missing table name. Please specify a valid table name.'
      });
    }
    
    // Check if table name is allowed
    if (!isValidTableName(tableName)) {
      return res.status(403).json({
        status: 'error',
        message: `Access to table "${tableName}" is not permitted`
      });
    }
    
    // Get table structure
    const structure = await getTableStructureHelper(tableName);
    
    return res.status(200).json({
      status: 'success',
      data: {
        columns: structure
      }
    });
  } catch (error) {
    console.error(`Error getting table structure for ${req.params.table || req.params.tableName}: ${error}`);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Enhanced getTableRecords function
exports.getTableRecords = async (req, res) => {
  try {
    // Get the table name from request parameters
    const tableName = req.params.table || req.params.tableName;
    
    // Check if table name is valid
    if (!tableName || tableName === 'undefined') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or missing table name. Please specify a valid table name.'
      });
    }
    
    // Check if table name is allowed
    if (!isValidTableName(tableName)) {
      return res.status(403).json({
        status: 'error',
        message: `Access to table "${tableName}" is not permitted`
      });
    }
    
    // Extract query parameters
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const sortField = req.query.sort || 'id';
    const sortOrder = req.query.order || 'ASC';
    const searchQuery = req.query.q || '';
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    
    // Construct SQL query
    let sql = `SELECT * FROM \`${tableName}\``;
    const values = [];
    
    // Add WHERE clause for search and filters
    const whereClauses = [];
    
    // First handle search across searchable fields
    if (searchQuery) {
      // Get table structure to find searchable columns
      const structure = await getTableStructureHelper(tableName);
      const searchableColumns = structure
        .filter(col => isSearchableType(col.Type))
        .map(col => col.Field);
      
      if (searchableColumns.length > 0) {
        const searchConditions = searchableColumns.map(col => `${col} LIKE ?`);
        whereClauses.push(`(${searchConditions.join(' OR ')})`);
        searchableColumns.forEach(() => values.push(`%${searchQuery}%`));
      }
    }
    
    // Then handle specific column filters
    Object.entries(filters).forEach(([column, value]) => {
      // Handle different types of filters
      if (Array.isArray(value)) {
        // Handle range filters like price
        if (value.length === 2) {
          whereClauses.push(`${column} >= ? AND ${column} <= ?`);
          values.push(value[0], value[1]);
        }
      } else if (typeof value === 'string' || typeof value === 'number') {
        whereClauses.push(`${column} = ?`);
        values.push(value);
      } else if (typeof value === 'boolean') {
        whereClauses.push(`${column} = ?`);
        values.push(value ? 1 : 0);
      }
    });
    
    // Combine WHERE clauses if any
    if (whereClauses.length > 0) {
      sql += ' WHERE ' + whereClauses.join(' AND ');
    }
    
    // Add sorting
    sql += ` ORDER BY ${sortField} ${sortOrder}`;
    
    // Add pagination
    sql += ` LIMIT ${limit} OFFSET ${offset}`;
    
    // Execute the query
    const results = await db.query(sql, values);
    
    // Get total count (for pagination)
    let countSql = `SELECT COUNT(*) as total FROM \`${tableName}\``;
    if (whereClauses.length > 0) {
      countSql += ' WHERE ' + whereClauses.join(' AND ');
    }
    const countResult = await db.query(countSql, values);
    const total = countResult[0].total;
    
    return res.status(200).json({
      status: 'success',
      data: {
        records: results,
        total,
        offset,
        limit
      }
    });
  } catch (error) {
    console.error(`Error getting records from ${req.params.table || req.params.tableName}: ${error}`);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Helper function to validate table names
function isValidTableName(tableName) {
  // Add your table name validation logic here
  // For example, check against a whitelist of allowed tables
  // or prevent access to sensitive tables
  
  // List of allowed tables to access through the UI
  const allowedTables = [
    'restaurants', 'users', 'categories', 'products', 'orders',
    'reviews', 'addresses', 'promotions', 'loyalty', 'banners',
    'delivery_configs', 'delivery_fee_tiers', 'menu_items',
    'notifications', 'static_pages', 'site_config'
  ];
  
  // Check if the table name is in the allowed list
  return allowedTables.includes(tableName);
}

// Usage instructions:
// 1. Locate the admin.controller.js file in your backend/src/controllers directory
// 2. Replace the getTableStructure and getTableRecords functions with the ones above
// 3. Add the isValidTableName function if it doesn't exist
// 4. Test by accessing the admin interface and navigating through different tables 