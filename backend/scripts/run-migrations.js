const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

(async () => {
  try {
    // Load env variables from backend/.env if exists, fallback to project root .env
    const envPathBackend = path.join(__dirname, '..', '.env');
    const envPathRoot = path.join(__dirname, '..', '..', '.env');
    if (fs.existsSync(envPathBackend)) {
      dotenv.config({ path: envPathBackend });
    } else if (fs.existsSync(envPathRoot)) {
      dotenv.config({ path: envPathRoot });
    }

    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'food_delivery',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      multipleStatements: true,
    };

    console.log('💾 Running database migrations...');

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Ensure migrations table exists to track applied migrations
      await connection.query(`CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uniq_migration_filename (filename)
      );`);

      const [appliedRows] = await connection.query('SELECT filename FROM migrations');
      const appliedSet = new Set(appliedRows.map((row) => row.filename));

      const migrationsDir = path.join(__dirname, '..', 'migrations');
      const files = fs
        .readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of files) {
        if (appliedSet.has(file)) {
          console.log(`✔️  Migration already applied: ${file}`);
          continue;
        }

        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        console.log(`👉 Applying migration: ${file}`);
        await connection.query(sql);
        await connection.query('INSERT INTO migrations (filename) VALUES (?)', [file]);
        console.log(`✅ Migration applied: ${file}`);
      }

      console.log('🎉 All migrations executed successfully!');
    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
})();