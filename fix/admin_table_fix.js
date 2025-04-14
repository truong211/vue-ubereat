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
    console.error(`Error getting table structure for ${req.params.table || req.params.tableName || 'unknown'}:`, error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get table structure',
      error: error.message
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
    
    // Parse query parameters
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const sort = req.query.sort || 'id';
    const order = req.query.order || 'asc';
    const search = req.query.q || '';
    let filters = {};
    
    try {
      if (req.query.filters) {
        filters = JSON.parse(req.query.filters);
      }
    } catch (e) {
      console.error('Error parsing filters:', e);
    }
    
    // Validate sort field to prevent SQL injection
    if (!isValidFieldName(sort)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid sort field'
      });
    }
    
    // Build query
    let query = `SELECT * FROM \`${tableName}\``;
    let countQuery = `SELECT COUNT(*) as total FROM \`${tableName}\``;
    const queryParams = [];
    
    // Add search filter if provided
    if (search) {
      const structure = await getTableStructureHelper(tableName);
      const searchableFields = structure.fields.filter(f => 
        isSearchableType(f.name)
      ).map(f => f.name);
      
      if (searchableFields.length > 0) {
        const searchConditions = searchableFields.map(field => `\`${field}\` LIKE ?`);
        const whereSearch = `(${searchConditions.join(' OR ')})`;
        
        query += query.includes('WHERE') ? ` AND ${whereSearch}` : ` WHERE ${whereSearch}`;
        countQuery += countQuery.includes('WHERE') ? ` AND ${whereSearch}` : ` WHERE ${whereSearch}`;
        
        // Add search parameter for each field
        searchableFields.forEach(() => queryParams.push(`%${search}%`));
      }
    }
    
    // Add filters if provided
    if (Object.keys(filters).length > 0) {
      const structure = await getTableStructureHelper(tableName);
      const validFields = structure.fields.map(f => f.name);
      
      const filterConditions = [];
      
      for (const [field, value] of Object.entries(filters)) {
        if (validFields.includes(field)) {
          if (value === null) {
            filterConditions.push(`\`${field}\` IS NULL`);
          } else {
            filterConditions.push(`\`${field}\` = ?`);
            queryParams.push(value);
          }
        }
      }
      
      if (filterConditions.length > 0) {
        const whereFilter = `(${filterConditions.join(' AND ')})`;
        query += query.includes('WHERE') ? ` AND ${whereFilter}` : ` WHERE ${whereFilter}`;
        countQuery += countQuery.includes('WHERE') ? ` AND ${whereFilter}` : ` WHERE ${whereFilter}`;
      }
    }
    
    // Add order by
    query += ` ORDER BY \`${sort}\` ${order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
    
    // Add limit and offset
    query += ' LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    // Execute queries
    const countParams = [...queryParams]; // Clone for the count query
    countParams.splice(-2); // Remove limit and offset
    
    // Execute total count query
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    // Execute records query
    let records = [];
    try {
      records = await db.query(query, queryParams);
    } catch (dbError) {
      console.error(`Database error executing query: ${query}`, dbError);
      return res.status(500).json({
        status: 'error',
        message: 'Database error while fetching records',
        error: dbError.message
      });
    }
    
    // Return results
    return res.status(200).json({
      status: 'success',
      data: {
        records: records || [],
        total,
        page: Math.floor(offset / limit) + 1,
        pageSize: limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error(`Error getting records from ${req.params.table || req.params.tableName || 'unknown'}:`, error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get records',
      error: error.message
    });
  }
};

// Helper functions
function isValidTableName(tableName) {
  // Check if tableName is undefined or null or empty string
  if (!tableName || tableName === 'undefined') {
    return false;
  }
  
  // Whitelist of allowed tables for the admin interface
  const allowedTables = [
    'users', 
    'restaurants', 
    'orders', 
    'products', 
    'categories',
    'reviews',
    'banners',
    'promotions',
    'static_pages',
    'menu_items',
    'order_items',
    'delivery_zones'
  ];
  
  // Check if the table is in the allowed list
  if (!allowedTables.includes(tableName.toLowerCase())) {
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