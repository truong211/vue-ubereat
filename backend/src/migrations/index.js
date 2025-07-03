const fs = require('fs');
const path = require('path');
const db = require('../config/database');

/**
 * Simple SQL migration runner.
 *
 * 1. Ensures a `migrations` metadata table exists.
 * 2. Executes every .sql file in this directory (alphabetically) that has not
 *    been executed before.
 * 3. Records the migration name once completed so it is not re-run.
 *
 * Run with:  `npm run migrate`  (see package.json)
 */
(async () => {
  try {
    // 1) Ensure metadata table
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    // 2) Load migration files
    const migrationsDir = __dirname;
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const already = await db.query('SELECT 1 FROM migrations WHERE name = ? LIMIT 1', [file]);
      if (already.length > 0) {
        // Skip if already applied
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`\nApplying migration ${file}...`);
      await db.query(sql);
      await db.query('INSERT INTO migrations (name) VALUES (?)', [file]);
      console.log(`Migration ${file} applied.`);
    }

    console.log('\nAll migrations complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();