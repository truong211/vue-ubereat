/**
 * Model Generator Script
 * 
 * This script generates Sequelize model files from existing database tables.
 * Usage: node generate-model.js <tableName>
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const fs = require('fs');

// Command line arguments
const args = process.argv.slice(2);
const tableName = args[0];

if (!tableName) {
  console.error('Please provide a table name as an argument');
  process.exit(1);
}

async function generateModel() {
  try {
    console.log(`Generating model for table: ${tableName}`);
    
    // Query the database schema
    const [columns] = await sequelize.query(`
      SELECT 
        COLUMN_NAME as name, 
        DATA_TYPE as type,
        CHARACTER_MAXIMUM_LENGTH as maxLength,
        IS_NULLABLE as nullable, 
        COLUMN_DEFAULT as defaultValue,
        COLUMN_KEY as columnKey,
        EXTRA as extra,
        COLUMN_COMMENT as comment
      FROM 
        INFORMATION_SCHEMA.COLUMNS 
      WHERE 
        TABLE_NAME = '${tableName}' 
        AND TABLE_SCHEMA = '${process.env.DB_NAME}'
      ORDER BY 
        ORDINAL_POSITION
    `);

    // Query foreign keys
    const [foreignKeys] = await sequelize.query(`
      SELECT
        COLUMN_NAME as column,
        REFERENCED_TABLE_NAME as referencedTable,
        REFERENCED_COLUMN_NAME as referencedColumn
      FROM
        INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE
        TABLE_NAME = '${tableName}'
        AND TABLE_SCHEMA = '${process.env.DB_NAME}'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    // Query indexes
    const [indexes] = await sequelize.query(`
      SELECT
        INDEX_NAME as name,
        COLUMN_NAME as column,
        NON_UNIQUE as nonUnique
      FROM
        INFORMATION_SCHEMA.STATISTICS
      WHERE
        TABLE_NAME = '${tableName}'
        AND TABLE_SCHEMA = '${process.env.DB_NAME}'
        AND INDEX_NAME != 'PRIMARY'
      ORDER BY
        INDEX_NAME, SEQ_IN_INDEX
    `);

    if (columns.length === 0) {
      console.error(`No columns found for table: ${tableName}`);
      process.exit(1);
    }

    // Process indexes into a more usable format
    const processedIndexes = [];
    const indexMap = {};
    
    indexes.forEach(index => {
      if (!indexMap[index.name]) {
        indexMap[index.name] = {
          name: index.name,
          fields: [],
          unique: index.nonUnique === 0
        };
        processedIndexes.push(indexMap[index.name]);
      }
      indexMap[index.name].fields.push(index.column);
    });

    // Process foreign keys into a map for easy lookup
    const foreignKeysMap = {};
    foreignKeys.forEach(fk => {
      foreignKeysMap[fk.column] = {
        table: fk.referencedTable,
        column: fk.referencedColumn
      };
    });

    // Generate model name (PascalCase singular form)
    const pascalCase = str => 
      str.replace(/_([a-z])/g, (match, char) => char.toUpperCase())
         .replace(/^([a-z])/, (match, char) => char.toUpperCase());
    
    // Handle some special plural cases
    let modelName = tableName;
    if (modelName.endsWith('ies')) {
      modelName = modelName.slice(0, -3) + 'y';
    } else if (modelName.endsWith('s')) {
      modelName = modelName.slice(0, -1);
    }
    modelName = pascalCase(modelName);

    // Start building the model file content
    let modelContent = `/**
 * ${modelName} model with Sequelize implementation
 * Generated from existing database table: ${tableName}
 */
module.exports = (sequelize, DataTypes) => {
  const ${modelName} = sequelize.define('${modelName}', {
`;

    // Add column definitions
    columns.forEach(column => {
      const columnName = column.name;
      let sequelizeType = mapMySQLToSequelizeType(column.type, column.maxLength);
      
      // Special handling for enum types
      if (sequelizeType.startsWith('ENUM')) {
        // Need to query for enum values
        console.log(`Column ${columnName} appears to be an ENUM. Getting values...`);
        // This is a placeholder. In a real implementation, we would fetch enum values.
        sequelizeType = 'DataTypes.STRING';
      }
      
      let columnDefinition = `    ${columnName}: {\n`;
      columnDefinition += `      type: ${sequelizeType},\n`;
      
      // Primary key
      if (column.columnKey === 'PRI') {
        columnDefinition += `      primaryKey: true,\n`;
      }
      
      // Auto increment
      if (column.extra && column.extra.includes('auto_increment')) {
        columnDefinition += `      autoIncrement: true,\n`;
      }
      
      // Nullable
      columnDefinition += `      allowNull: ${column.nullable === 'YES' ? 'true' : 'false'},\n`;
      
      // Default value
      if (column.defaultValue !== null && column.defaultValue !== undefined) {
        if (column.defaultValue === 'CURRENT_TIMESTAMP') {
          columnDefinition += `      defaultValue: DataTypes.NOW,\n`;
        } else if (column.type === 'tinyint' && column.defaultValue === '1') {
          columnDefinition += `      defaultValue: true,\n`;
        } else if (column.type === 'tinyint' && column.defaultValue === '0') {
          columnDefinition += `      defaultValue: false,\n`;
        } else if (!isNaN(column.defaultValue)) {
          columnDefinition += `      defaultValue: ${column.defaultValue},\n`;
        } else {
          columnDefinition += `      defaultValue: "${column.defaultValue}",\n`;
        }
      }
      
      // Foreign keys
      if (foreignKeysMap[columnName]) {
        columnDefinition += `      references: {\n`;
        columnDefinition += `        model: '${foreignKeysMap[columnName].table}',\n`;
        columnDefinition += `        key: '${foreignKeysMap[columnName].column}'\n`;
        columnDefinition += `      },\n`;
      }
      
      // Comment
      if (column.comment) {
        columnDefinition += `      comment: '${column.comment}',\n`;
      }
      
      // Close the column definition
      columnDefinition += `    }`;
      
      // Add a comma for all columns except the last one
      if (column !== columns[columns.length - 1]) {
        columnDefinition += ',';
      }
      
      modelContent += columnDefinition + '\n';
    });

    // Close the columns definition and add table name and timestamps
    modelContent += `  }, {
    tableName: '${tableName}',
    timestamps: true`;
    
    // Add indexes if any
    if (processedIndexes.length > 0) {
      modelContent += `,
    indexes: [
`;
      processedIndexes.forEach((index, idx) => {
        modelContent += `      {
        name: '${index.name}',
        ${index.unique ? 'unique: true,' : ''}
        fields: [${index.fields.map(f => `'${f}'`).join(', ')}]
      }`;
        if (idx < processedIndexes.length - 1) {
          modelContent += ',';
        }
        modelContent += '\n';
      });
      modelContent += '    ]';
    }
    
    modelContent += `
  });

  // Associations
  ${modelName}.associate = (models) => {
    // Define associations here
    // Examples:
    // ${modelName}.belongsTo(models.SomeModel, {
    //   foreignKey: 'someModelId',
    //   as: 'someModel'
    // });
    //
    // ${modelName}.hasMany(models.SomeOtherModel, {
    //   foreignKey: 'thisModelId',
    //   as: 'otherModels'
    // });
`;

    // Add suggested associations based on foreign keys
    Object.keys(foreignKeysMap).forEach(columnName => {
      const fk = foreignKeysMap[columnName];
      const referencedModelName = pascalCase(fk.table.endsWith('s') ? fk.table.slice(0, -1) : fk.table);
      modelContent += `
    ${modelName}.belongsTo(models.${referencedModelName}, {
      foreignKey: '${columnName}',
      as: '${camelCase(referencedModelName)}'
    });`;
    });

    modelContent += `
  };

  return ${modelName};
};

// Helper function to convert database column name to camelCase
function camelCase(str) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}
`;

    // Save the model to a file
    const outputPath = path.join(__dirname, `../models/${camelCase(modelName)}.model.js`);
    fs.writeFileSync(outputPath, modelContent);
    
    console.log(`Model file created at: ${outputPath}`);
    process.exit(0);
  } catch (error) {
    console.error('Error generating model:', error);
    process.exit(1);
  }
}

// Helper function to map MySQL types to Sequelize types
function mapMySQLToSequelizeType(mysqlType, maxLength) {
  switch (mysqlType.toLowerCase()) {
    case 'varchar':
      return maxLength ? `DataTypes.STRING(${maxLength})` : 'DataTypes.STRING';
    case 'char':
      return maxLength ? `DataTypes.CHAR(${maxLength})` : 'DataTypes.CHAR';
    case 'text':
      return 'DataTypes.TEXT';
    case 'longtext':
      return 'DataTypes.TEXT(\'long\')';
    case 'tinytext':
      return 'DataTypes.TEXT(\'tiny\')';
    case 'mediumtext':
      return 'DataTypes.TEXT(\'medium\')';
    case 'int':
    case 'integer':
    case 'smallint':
    case 'mediumint':
    case 'bigint':
      return 'DataTypes.INTEGER';
    case 'tinyint':
      return maxLength === 1 ? 'DataTypes.BOOLEAN' : 'DataTypes.INTEGER';
    case 'float':
    case 'real':
      return 'DataTypes.FLOAT';
    case 'double':
      return 'DataTypes.DOUBLE';
    case 'decimal':
      return 'DataTypes.DECIMAL(10, 2)';
    case 'date':
      return 'DataTypes.DATEONLY';
    case 'time':
      return 'DataTypes.TIME';
    case 'datetime':
    case 'timestamp':
      return 'DataTypes.DATE';
    case 'json':
      return 'DataTypes.JSON';
    case 'enum':
      return 'DataTypes.ENUM'; // Needs values
    case 'blob':
    case 'longblob':
    case 'mediumblob':
    case 'tinyblob':
    case 'binary':
    case 'varbinary':
      return 'DataTypes.BLOB';
    default:
      console.warn(`Unknown MySQL type: ${mysqlType}. Defaulting to STRING.`);
      return 'DataTypes.STRING';
  }
}

// Helper function to convert string to camelCase
function camelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase())
    .replace(/\s+/g, '');
}

// Run the generate model function
generateModel(); 