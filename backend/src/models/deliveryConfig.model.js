const db = require('../config/database');

/**
 * DeliveryConfig model with direct SQL implementation
 */
const DeliveryConfig = {
  tableName: 'delivery_configs',
  
  findByPk: async (id) => {
    try {
      const results = await db.query('SELECT * FROM delivery_configs WHERE id = ?', [id]);
      return results[0];
    } catch (error) {
      console.error('Error in DeliveryConfig.findByPk:', error);
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
      
      const results = await db.query(`SELECT * FROM delivery_configs WHERE ${whereClause} LIMIT 1`, values);
      return results[0];
    } catch (error) {
      console.error('Error in DeliveryConfig.findOne:', error);
      throw error;
    }
  },
  
  findAll: async (options = {}) => {
    try {
      let sql = 'SELECT * FROM delivery_configs';
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
      
      return await db.query(sql, values);
    } catch (error) {
      console.error('Error in DeliveryConfig.findAll:', error);
      throw error;
    }
  },
  
  create: async (data) => {
    try {
      const columns = Object.keys(data).join(', ');
      const placeholders = Object.keys(data).map(() => '?').join(', ');
      const values = Object.values(data);
      
      const result = await db.query(
        `INSERT INTO delivery_configs (${columns}) VALUES (${placeholders})`, 
        values
      );
      
      return { id: result.insertId, ...data };
    } catch (error) {
      console.error('Error in DeliveryConfig.create:', error);
      throw error;
    }
  },
  
  update: async (id, data) => {
    try {
      const setClauses = Object.keys(data).map(key => `${key} = ?`).join(', ');
      const values = [...Object.values(data), id];
      
      const result = await db.query(
        `UPDATE delivery_configs SET ${setClauses} WHERE id = ?`,
        values
      );
      
      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error in DeliveryConfig.update:', error);
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
          `DELETE FROM delivery_configs WHERE ${whereClause}`,
          values
        );
        
        return result.affectedRows > 0;
      } else if (typeof where === 'number') {
        // Treat as ID if a number was passed
        const result = await db.query('DELETE FROM delivery_configs WHERE id = ?', [where]);
        return result.affectedRows > 0;
      }
      
      throw new Error('Invalid parameters for destroy');
    } catch (error) {
      console.error('Error in DeliveryConfig.destroy:', error);
      throw error;
    }
  },
  
  // Add toJSON method for serialization
  toJSON: function() {
    return {
      id: this.id,
      restaurantId: this.restaurantId,
      maxDeliveryDistance: this.maxDeliveryDistance,
      minOrderAmountForDelivery: this.minOrderAmountForDelivery,
      baseDeliveryFee: this.baseDeliveryFee,
      useDistanceBasedFee: this.useDistanceBasedFee,
      feePerKilometer: this.feePerKilometer,
      freeDeliveryThreshold: this.freeDeliveryThreshold,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      restaurant: this.restaurant,
      feeTiers: this.feeTiers
    };
  }
};

module.exports = DeliveryConfig;
