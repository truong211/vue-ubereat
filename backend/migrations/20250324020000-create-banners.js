'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('banners', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      image: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      position: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'home_top'
      },
      link: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      expiryDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      device: {
        type: Sequelize.ENUM('all', 'mobile', 'desktop'),
        defaultValue: 'all'
      },
      clickCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      viewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('banners', ['active']);
    await queryInterface.addIndex('banners', ['position']);
    await queryInterface.addIndex('banners', ['displayOrder']);
    await queryInterface.addIndex('banners', ['device']);
    await queryInterface.addIndex('banners', ['expiryDate']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('banners');
  }
};