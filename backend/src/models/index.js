const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.json')[env];
const db = {};

console.log('Initializing database connection...');

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      ...config,
      logging: (msg) => console.log('[Sequelize]', msg)
    }
  );
}

// Test database connection
async function initializeDatabase() {
  try {
    console.log('Attempting to authenticate database connection...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Read and initialize models
    const modelFiles = fs.readdirSync(__dirname).filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename &&
        file.slice(-3) === '.js' &&
        file.indexOf('.test.js') === -1 &&
        file !== 'associations.js'  // Exclude associations.js from model loading
      );
    });
console.log(`[Database] Loading ${modelFiles.length} model files...`);
console.log('[Database] Model files to load:', modelFiles);
console.log('[Database] Current working directory:', __dirname);


    for (const file of modelFiles) {
      try {
        const modelFunc = require(path.join(__dirname, file));
        if (typeof modelFunc !== 'function') {
          throw new Error(`Model file ${file} does not export a function`);
        }
        
        const model = modelFunc(sequelize, Sequelize.DataTypes);
        if (!model) {
          throw new Error(`Model initialization failed for ${file}`);
        }

        const modelName = model.name || path.parse(file).name;
        db[modelName] = model;
        
        console.log(`[Database] Model ${modelName} loaded successfully with associations:`,
          Object.keys(model.associations || {}));
      } catch (error) {
        console.error(`Error loading model ${file}:`, error);
        throw error; // Re-throw to prevent partial initialization
      }
    }

    // Set up model associations
    console.log('Setting up model associations...');
    // First set up Sequelize associations
    Object.keys(db).forEach(modelName => {
      if (db[modelName].associate) {
        db[modelName].associate(db);
      }
    });
    
    // Then set up custom SQL associations
    const setupAssociations = require('./associations');
    setupAssociations(db);

    // Sync database
    console.log('[Database] Synchronizing database schema...');
    await sequelize.sync({ alter: false });  // Change to false to prevent automatic table alterations
    console.log('[Database] Database synchronized successfully');
    console.log('[Database] Initialized models:', Object.keys(db).filter(key =>
      typeof db[key] === 'function' && db[key].prototype && db[key].prototype.constructor.name !== 'Sequelize'
    ));

    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
    db.isInitialized = true;
    
    console.log('Available models:', Object.keys(db));
    console.log('Database initialization completed successfully');

    return db;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

let initializationPromise = null;

const getDb = async () => {
  if (!initializationPromise) {
    initializationPromise = initializeDatabase();
  }
  return initializationPromise;
};

module.exports = {
  getDb
};