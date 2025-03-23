'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create promotion categories table
    await queryInterface.createTable('promotion_categories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create promotion campaigns table
    await queryInterface.createTable('promotion_campaigns', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'promotion_categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      budget: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      spent_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      target_audience: {
        type: Sequelize.JSON,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'),
        defaultValue: 'draft'
      },
      metrics: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add campaign_id to promotions table
    await queryInterface.addColumn('promotions', 'campaign_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'promotion_campaigns',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Add indexes
    await queryInterface.addIndex('promotion_campaigns', ['status', 'start_date', 'end_date']);
    await queryInterface.addIndex('promotion_campaigns', ['category_id']);
    await queryInterface.addIndex('promotions', ['campaign_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('promotions', 'campaign_id');
    await queryInterface.dropTable('promotion_campaigns');
    await queryInterface.dropTable('promotion_categories');
  }
};