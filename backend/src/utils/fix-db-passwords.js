require('dotenv').config({ path: './backend/.env' });
const { Sequelize } = require('sequelize');
const { hashPassword } = require('./password.util');

// Initialize Sequelize
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

async function fixDatabasePasswords() {
    try {
        console.log('=== Database Password Fix ===\n');

        // Test connection
        await sequelize.authenticate();
        console.log('Database connection established.\n');

        // Get all users
        const users = await sequelize.query(
            'SELECT id, email, password FROM users',
            { 
                type: Sequelize.QueryTypes.SELECT,
                raw: true
            }
        );

        console.log(`Found ${users.length} users to process.\n`);

        // Default test password
        const defaultPassword = '123456aA@';

        // Process each user
        for (const user of users) {
            console.log(`Processing user ID: ${user.id}, Email: ${user.email}`);
            
            try {
                // Generate new hash with correct salt rounds
                const newHash = await hashPassword(defaultPassword);
                
                // Update user's password
                await sequelize.query(
                    'UPDATE users SET password = ? WHERE id = ?',
                    {
                        replacements: [newHash, user.id],
                        type: Sequelize.QueryTypes.UPDATE
                    }
                );

                console.log('Password updated successfully');
                console.log('New hash format:', newHash.substring(0, 7));
                console.log('---\n');
            } catch (err) {
                console.error(`Error processing user ${user.id}:`, err);
            }
        }

        console.log('\nAll users processed. New test password is:', defaultPassword);
        
        // Close connection
        await sequelize.close();
        console.log('Database connection closed.');

    } catch (error) {
        console.error('Database fix error:', error);
        if (sequelize) {
            await sequelize.close();
        }
    }
}

// Run the fix
fixDatabasePasswords();