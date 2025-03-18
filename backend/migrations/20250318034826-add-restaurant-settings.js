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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('restaurants', 'openingHours');
    await queryInterface.removeColumn('restaurants', 'specialHolidays');
    await queryInterface.removeColumn('restaurants', 'deliverySettings');
    await queryInterface.removeColumn('restaurants', 'notificationPreferences');
  }
};
