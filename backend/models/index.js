'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../config/database')[env];
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Track model names to avoid duplicate loading
const loadedModelNames = new Set();

// FIRST PHASE: Load and define all model files
const loadModelsFromDir = (directory, pattern) => {
  // Skip if directory doesn't exist
  if (!fs.existsSync(directory)) return;
  
  fs.readdirSync(directory)
    .filter(file => {
      return (
        file.indexOf('.') !== 0 &&
        file !== basename && 
        file.slice(-3) === '.js' &&
        (pattern ? file.includes(pattern) : true) &&
        file.indexOf('.test.js') === -1
      );
    })
    .forEach(file => {
      try {
        const filePath = path.join(directory, file);
        const imported = require(filePath);
        
        // Handle Sequelize model factory functions
        if (typeof imported === 'function') {
          const model = imported(sequelize, Sequelize.DataTypes);
          
          // Skip if we've already loaded a model with this name
          if (loadedModelNames.has(model.name)) {
            console.log(`Skipping duplicate model: ${model.name} from ${file}`);
            return;
          }
          
          db[model.name] = model;
          loadedModelNames.add(model.name);
          console.log(`Loaded Sequelize model: ${model.name} from ${file}`);
        } 
        // Handle direct model objects that might have a name property
        else if (typeof imported === 'object' && imported !== null) {
          const modelName = imported.name || path.basename(file, '.js');
          
          // Skip if we've already loaded a model with this name
          if (loadedModelNames.has(modelName)) {
            console.log(`Skipping duplicate model object: ${modelName} from ${file}`);
            return;
          }
          
          db[modelName] = imported;
          loadedModelNames.add(modelName);
          console.log(`Loaded model object: ${modelName} from ${file}`);
        } else {
          console.error(`Unknown model format in file ${file}`);
        }
      } catch (error) {
        console.error(`Error loading model from ${file}:`, error.message);
        if (error.stack) {
          console.error(error.stack);
        }
      }
    });
};

// Load all models starting with the .model.js files
console.log('Loading models from backend/models directory...');
loadModelsFromDir(__dirname, null);

console.log('Loading models from backend/src/models directory...');
loadModelsFromDir(path.join(__dirname, '../src/models'), '.model.js');

// SECOND PHASE: Set up associations after all models are defined
console.log('\nSetting up model associations...');
Object.keys(db).forEach(modelName => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    try {
      db[modelName].associate(db);
      console.log(`✓ Successfully set up associations for model ${modelName}`);
    } catch (error) {
      console.error(`✗ Error setting up associations for model ${modelName}:`, error.message);
      console.error(`  Models available for association:`, Object.keys(db).join(', '));
      if (error.stack) {
        console.error(error.stack);
      }
    }
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;