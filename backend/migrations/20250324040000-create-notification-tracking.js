'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('notification_tracking', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      notificationId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Notifications',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      deliveryStatus: {
        type: Sequelize.ENUM('sent', 'delivered', 'failed', 'clicked'),
        defaultValue: 'sent'
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      clickedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deviceInfo: {
        type: Sequelize.JSONB,
        defaultValue: {}
      },
      errorDetails: {
        type: Sequelize.TEXT,
        allowNull: true
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

    // Add indexes for better query performance
    await queryInterface.addIndex('notification_tracking', ['notificationId']);
    await queryInterface.addIndex('notification_tracking', ['userId']);
    await queryInterface.addIndex('notification_tracking', ['deliveryStatus']);
    await queryInterface.addIndex('notification_tracking', ['deliveredAt']);
    await queryInterface.addIndex('notification_tracking', ['clickedAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('notification_tracking');
  }
};