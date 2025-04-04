const db = require('../config/database');

/**
 * DeliveryFeeTier model with direct SQL implementation
 */
const DeliveryFeeTier = {
  tableName: 'delivery_fee_tiers',
  
  findByPk: async (id) => {
    try {
      const results = await db.query('SELECT * FROM delivery_fee_tiers WHERE id = ?', [id]);
      return results[0];
    } catch (error) {
      console.error('Error in DeliveryFeeTier.findByPk:', error);
      throw error;
    }
  },
  
  findOne: async (where) => {
    try {
      const whereEntries = Object.entries(where);
      if (whereEntries.length === 0) {
        return null;
      }
      
      const whereClause = whereEntries
        .map(([key, value]) => value === null ? `${key} IS NULL` : `${key} = ?`)
        .join(' AND ');
      
      const values = whereEntries
        .filter(([key, value]) => value !== null)
        .map(([key, value]) => value);
      
      const results = await db.query(`SELECT * FROM delivery_fee_tiers WHERE ${whereClause} LIMIT 1`, values);
      return results[0];
    } catch (error) {
      console.error('Error in DeliveryFeeTier.findOne:', error);
      throw error;
    }
  },
  
  findAll: async (options = {}, orderBy = '') => {
    try {
      let sql = 'SELECT * FROM delivery_fee_tiers';
      const values = [];
      
      if (options.where) {
        const whereEntries = Object.entries(options.where);
        if (whereEntries.length > 0) {
          const whereClause = whereEntries
            .map(([key, value]) => value === null ? `${key} IS NULL` : `${key} = ?`)
            .join(' AND ');
          
          sql += ` WHERE ${whereClause}`;
          
          const whereValues = whereEntries
            .filter(([key, value]) => value !== null)
            .map(([key, value]) => value);
          
          values.push(...whereValues);
        }
      }
      
      if (options.order) {
        // Handle both string and array format for ordering
        if (typeof options.order === 'string') {
          sql += ` ORDER BY ${options.order}`;
        } else if (Array.isArray(options.order)) {
          const orderParts = options.order.map(part => 
            Array.isArray(part) ? `${part[0]} ${part[1]}` : part
          );
          sql += ` ORDER BY ${orderParts.join(', ')}`;
        }
      } else if (orderBy) {
        // Use the orderBy parameter if provided
        sql += ` ${orderBy}`;
      }
      
      return await db.query(sql, values);
    } catch (error) {
      console.error('Error in DeliveryFeeTier.findAll:', error);
      throw error;
    }
  },
  
  create: async (data) => {
    try {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const result = await db.query(
        `INSERT INTO delivery_fee_tiers (${columns}) VALUES (${placeholders})`, 
        values
      );
      
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error('Error in DeliveryFeeTier.create:', error);
      throw error;
    }
  },
  
  bulkCreate: async (dataArray) => {
    try {
      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return [];
      }
      
      // Ensure all objects have the same keys
      const firstItemKeys = Object.keys(dataArray[0]);
      const columns = firstItemKeys.join(', ');
      
      // Create placeholders for each item
      const placeholderGroups = dataArray.map(() => 
        `(${firstItemKeys.map(() => '?').join(', ')})`
      ).join(', ');
      
      // Flatten all values
      const values = dataArray.flatMap(item => 
        firstItemKeys.map(key => item[key])
      );
      
      const result = await db.query(
        `INSERT INTO delivery_fee_tiers (${columns}) VALUES ${placeholderGroups}`, 
        values
      );
      
      // Return created items with IDs (approximation since we don't know exact IDs)
      return dataArray.map((item, index) => ({
        id: result.insertId + index,
        ...item
      }));
    } catch (error) {
      console.error('Error in DeliveryFeeTier.bulkCreate:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];
      
      const result = await db.query(
        `UPDATE delivery_fee_tiers SET ${setClauses} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in DeliveryFeeTier.update:', error);
      throw error;
    }
  },
  
  destroy: async (where) => {
    try {
      if (typeof where === 'object') {
        const whereClause = Object.entries(where)
          .map(([key, value]) => `${key} = ?`)
          .join(' AND ');
          
        const values = Object.values(where);
        
        const result = await db.query(
          `DELETE FROM delivery_fee_tiers WHERE ${whereClause}`,
          values
        );
        
        return result.affectedRows > 0;
      } else if (typeof where === 'number') {
        // Treat as ID if a number was passed
        const result = await db.query('DELETE FROM delivery_fee_tiers WHERE id = ?', [where]);
        return result.affectedRows > 0;
      }
      
      throw new Error('Invalid parameters for destroy');
    } catch (error) {
      console.error('Error in DeliveryFeeTier.destroy:', error);
      throw error;
    }
  }
};

module.exports = DeliveryFeeTier;
