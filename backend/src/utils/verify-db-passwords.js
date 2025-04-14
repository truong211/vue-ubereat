require('dotenv').config({ path: './backend/.env' });
const { Sequelize } = require('sequelize');
const { verifyPassword } = require('./password.util');

// Initialize Sequelize with environment variables
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false
    }
);

async function verifyDatabasePasswords() {
    try {
        console.log('=== Database Password Verification ===\n');

        // Get all users
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Query users directly
        const users = await sequelize.query(
            'SELECT id, email, password FROM users',
            {
                type: Sequelize.QueryTypes.SELECT,
                raw: true
            }
        );

        console.log(`Found ${users ? users.length : 0} users to verify\n`);

        if (!users || users.length === 0) {
            console.log('No users found in database.');
            return;
        }

        for (const user of users) {
            console.log(`Checking user ID: ${user.id}, Email: ${user.email}`);
            console.log('Hash Format:', user.password.substring(0, 7));
            console.log('Hash Length:', user.password.length);

            // Verify hash format
            const isValidFormat = user.password.startsWith('$2a$') || user.password.startsWith('$2b$');
            console.log('Valid Hash Format:', isValidFormat);

            if (!isValidFormat) {
                console.log('WARNING: Invalid hash format - needs rehashing\n');
                continue;
            }

            // Test with a known password (for demo only)
            const testPassword = '123456aA@';
            const verifyResult = await verifyPassword(testPassword, user.password);
            
            console.log(`Test verification with '${testPassword}':`, verifyResult);
            console.log('---\n');
        }
// Close database connection
await sequelize.close();
console.log('\nDatabase connection closed.');


    } catch (error) {
        console.error('Verification error:', error);
    }
}

// Run verification
verifyDatabasePasswords();