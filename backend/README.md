# Food Delivery Backend

## Database Changes: Using Direct SQL Instead of Sequelize

This backend has been modified to stop using Sequelize ORM and instead use direct SQL queries with the `mysql2` driver. This change helps simplify the database layer by using the SQL schema defined in the `food_Delivery.sql` file at the root of the project.

### Advantages of this Change

1. **No automatic schema sync**: Sequelize's auto-sync feature is no longer active, preventing any accidental schema changes.
2. **Direct SQL Access**: The application now uses the SQL schema as the single source of truth.
3. **Simplified Model Logic**: Models now use explicit SQL operations which can be easier to debug.
4. **Performance Improvement**: Direct SQL queries can be more efficient than ORM operations.

### How to Initialize the Database

The database can be initialized using the `setup-database.js` script in the root folder:

```bash
node setup-database.js
```

This script will:
1. Create or recreate the database
2. Apply the schema from `food_Delivery.sql`
3. Set up basic data

### Model Structure

Models have been updated to use direct SQL queries. For example:

```javascript
// Example model method
findAll: async (options = {}) => {
  let sql = 'SELECT * FROM tableName';
  const params = [];
  
  // Handle conditions/filters
  if (options.where) {
    // Process where conditions
  }
  
  return await query(sql, params);
}
```

### Step by Step Guide for Converting Models

To convert a Sequelize model to use direct SQL:

1. **Create a New Model File**:
   - Create a file in `backend/models/` (e.g., `modelName.js`) without the `.model.js` suffix
   - Import the database connection: `const { query } = require('../config/database');`

2. **Implement CRUD Operations**:
   - `findAll`: For retrieving multiple records with filtering and pagination
   - `findOne`: For retrieving a single record with conditions
   - `findByPk`: For retrieving a record by primary key (usually ID)
   - `create`: For inserting new records
   - `update`: For updating existing records
   - `destroy`: For deleting records

3. **Handle Relationships**:
   - Use SQL JOINs to replace Sequelize's include functionality
   - Use subqueries for more complex relationship queries

4. **Process Special Data Types**:
   - JSON fields need to be parsed/stringified
   - Dates need to be properly formatted
   - Boolean values need to be converted

5. **Register in Index.js**:
   - Add your model to `backend/models/index.js`

6. **Update Controllers**:
   - Update the corresponding controller to use the new model methods

### Examples of Converted Models

Two models have been converted as examples:

1. **Article Model**: A simple model with basic CRUD operations
   - Demonstrates handling basic WHERE conditions
   - Shows how to handle pagination
   - Includes an example of joining with the users table

2. **Restaurant Model**: A more complex model with multiple relationships
   - Shows how to handle complex JOINs and GROUP BY
   - Implements custom search functionality
   - Demonstrates handling JSON fields
   - Includes location-based search using geographical calculations
   - Shows how to handle complex statistics with subqueries

### Migration Status

Currently, these models have been migrated to direct SQL:
- Article
- Restaurant

The following models still need to be migrated:
- User
- Product
- Order
- Category
- Cart
- Review
- etc.

### Additional SQL Tables

The `food_Delivery.sql` file has been updated to include all necessary tables for the application, including:
- banners
- faqs
- staff_permissions
- delivery_fee_tiers
- notification_tracking
- promotion_categories
- promotion_campaigns
- api_performance_logs
- user_activity_logs
- payment_history
- product_promotions
- menu_items
- order_details

## Getting Started

1. Ensure MySQL is installed and running
2. Copy `.env.example` to `.env` and set your database credentials
3. Run `npm install` to install dependencies
4. Run the setup script: `node ../setup-database.js`
5. Start the development server: `npm run dev`

## Environment Variables

Ensure these environment variables are set in your `.env` file:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=food_delivery
```

## Troubleshooting

### Database Connection Issues

If you're seeing 500 errors on API endpoints and "Access denied for user ''@'localhost'" in the logs, this indicates that the environment variables for the database connection aren't being loaded properly.

#### Solution:

1. Make sure your `.env` file exists in the `backend` directory and contains the correct database credentials:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456  # Use your actual password
DB_NAME=food_delivery
DB_PORT=3307  # Use the correct port for your database
```

2. If you're still seeing issues, the application may not be finding the `.env` file. Update the `database.js` file to use an absolute path:

```javascript
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
```

3. Add fallback values for database connection properties:

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'food_delivery',
  port: process.env.DB_PORT || 3306,
  // other options...
});
```

4. Restart the server after making these changes.

### Guest User Connections

If you're seeing "Customer connected: guest" in the logs even after logging in, this indicates that the authentication information isn't being properly passed to the backend. Make sure your frontend is:

1. Correctly storing JWT tokens after login
2. Including the token in the Authorization header for all authenticated requests
3. Handling token expiration and refresh properly 