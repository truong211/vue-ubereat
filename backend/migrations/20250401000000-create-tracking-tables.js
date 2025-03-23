'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add notification preferences to Users table
    await queryInterface.addColumn('Users', 'notificationPreferences', {
      type: Sequelize.JSONB,
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

    // Create notification tracking table
    await queryInterface.createTable('NotificationSubscriptions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      endpoint: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      subscription: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Stringified push subscription object'
      },
      userAgent: {
        type: Sequelize.STRING,
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
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

    // Add indexes for notification tracking
    await queryInterface.addIndex('NotificationSubscriptions', ['userId']);
    await queryInterface.addIndex('NotificationSubscriptions', ['endpoint']);
    await queryInterface.addIndex('NotificationSubscriptions', ['active']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Users', 'notificationPreferences');
    await queryInterface.dropTable('NotificationSubscriptions');
  }
};