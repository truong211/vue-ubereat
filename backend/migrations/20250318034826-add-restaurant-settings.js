'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('restaurants', 'openingHours', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {
        Monday: { enabled: true, open: '09:00', close: '22:00' },
        Tuesday: { enabled: true, open: '09:00', close: '22:00' },
        Wednesday: { enabled: true, open: '09:00', close: '22:00' },
        Thursday: { enabled: true, open: '09:00', close: '22:00' },
        Friday: { enabled: true, open: '09:00', close: '22:00' },
        Saturday: { enabled: true, open: '10:00', close: '23:00' },
        Sunday: { enabled: true, open: '10:00', close: '22:00' }
      }
    });

    await queryInterface.addColumn('restaurants', 'specialHolidays', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('restaurants', 'deliverySettings', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {
        radius: 5,
        minOrder: 10,
        baseFee: 2,
        perKmFee: 0.5,
        autoAccept: false,
        pickupEnabled: true
      }
    });

    await queryInterface.addColumn('restaurants', 'notificationPreferences', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {
        email: true,
        sms: true,
        push: true,
        newOrders: true,
        orderUpdates: true,
        reviews: true
      }
    });

    await queryInterface.createTable('payment_histories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      payment_method: {
        type: Sequelize.ENUM('card', 'momo', 'vnpay', 'zalopay', 'cash'),
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'VND'
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
        defaultValue: 'pending'
      },
      transaction_ref: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      payment_details: {
        type: Sequelize.JSON,
        allowNull: true
      },
      verification_data: {
        type: Sequelize.JSON,
        allowNull: true
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      refund_status: {
        type: Sequelize.ENUM('none', 'pending', 'completed', 'failed'),
        defaultValue: 'none'
      },
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('payment_histories', ['order_id']);
    await queryInterface.addIndex('payment_histories', ['user_id']);
    await queryInterface.addIndex('payment_histories', ['transaction_ref'], { unique: true });
    await queryInterface.addIndex('payment_histories', ['status']);
    await queryInterface.addIndex('payment_histories', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('restaurants', 'openingHours');
    await queryInterface.removeColumn('restaurants', 'specialHolidays');
    await queryInterface.removeColumn('restaurants', 'deliverySettings');
    await queryInterface.removeColumn('restaurants', 'notificationPreferences');
    await queryInterface.dropTable('payment_histories');
  }
};
