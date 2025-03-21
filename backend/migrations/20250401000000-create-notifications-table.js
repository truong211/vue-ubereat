'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
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
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'general'
      },
      data: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      read: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      endpoint: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      subscription: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      userAgent: {
        type: Sequelize.STRING,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create indexes
    await queryInterface.addIndex('notifications', ['userId'], {
      name: 'idx_notifications_user_id'
    });
    
    await queryInterface.addIndex('notifications', ['read'], {
      name: 'idx_notifications_read'
    });
    
    await queryInterface.addIndex('notifications', ['type'], {
      name: 'idx_notifications_type'
    });
    
    // Add notification preferences to users table
    await queryInterface.addColumn('users', 'notificationPreferences', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {
        orderUpdates: true,
        promotions: true,
        driverLocation: true,
        marketing: false,
        email: true,
        push: true,
        sms: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'notificationPreferences');
    await queryInterface.removeIndex('notifications', 'idx_notifications_type');
    await queryInterface.removeIndex('notifications', 'idx_notifications_read');
    await queryInterface.removeIndex('notifications', 'idx_notifications_user_id');
    await queryInterface.dropTable('notifications');
  }
};