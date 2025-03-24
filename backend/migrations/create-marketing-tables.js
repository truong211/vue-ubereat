'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create loyalty table
    await queryInterface.createTable('loyalty', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      restaurantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'restaurants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      tier: {
        type: Sequelize.ENUM('bronze', 'silver', 'gold', 'platinum'),
        defaultValue: 'bronze'
      },
      lastPointEarned: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create loyalty_rewards table
    await queryInterface.createTable('loyalty_rewards', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      restaurantId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'restaurants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      pointsRequired: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      rewardType: {
        type: Sequelize.ENUM('discount', 'free_item', 'delivery_fee', 'special_offer'),
        allowNull: false
      },
      rewardValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      tier: {
        type: Sequelize.ENUM('bronze', 'silver', 'gold', 'platinum', 'all'),
        defaultValue: 'all'
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create loyalty_redemptions table
    await queryInterface.createTable('loyalty_redemptions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      rewardId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'loyalty_rewards',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      pointsSpent: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      status: {
        type: Sequelize.ENUM('redeemed', 'used', 'expired', 'cancelled'),
        defaultValue: 'redeemed'
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create review_responses table
    await queryInterface.createTable('review_responses', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      reviewId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'reviews',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      restaurantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      response: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      respondedBy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      isEdited: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('loyalty', ['userId']);
    await queryInterface.addIndex('loyalty', ['restaurantId']);
    await queryInterface.addIndex('loyalty_rewards', ['restaurantId']);
    await queryInterface.addIndex('loyalty_rewards', ['status', 'tier']);
    await queryInterface.addIndex('loyalty_redemptions', ['userId']);
    await queryInterface.addIndex('loyalty_redemptions', ['rewardId']);
    await queryInterface.addIndex('loyalty_redemptions', ['orderId']);
    await queryInterface.addIndex('review_responses', ['reviewId']);
    await queryInterface.addIndex('review_responses', ['restaurantId']);
    await queryInterface.addIndex('review_responses', ['respondedBy']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tables in reverse order
    await queryInterface.dropTable('review_responses');
    await queryInterface.dropTable('loyalty_redemptions');
    await queryInterface.dropTable('loyalty_rewards');
    await queryInterface.dropTable('loyalty');
    
    // Drop ENUMs
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_loyalty_tier";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_loyalty_rewards_rewardType";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_loyalty_rewards_tier";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_loyalty_rewards_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_loyalty_redemptions_status";');
  }
}; 