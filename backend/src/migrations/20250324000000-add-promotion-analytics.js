'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('promotions', 'name', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'Unnamed Promotion'
    });

    await queryInterface.addColumn('promotions', 'current_redemptions', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('promotions', 'max_redemptions', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('promotions', 'max_per_user', {
      type: Sequelize.INTEGER,
      defaultValue: 1
    });

    await queryInterface.addColumn('promotions', 'total_discount_amount', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });

    await queryInterface.addColumn('promotions', 'total_order_value', {
      type: Sequelize.DECIMAL(10, 2),
      defaultValue: 0
    });

    await queryInterface.addColumn('promotions', 'last_used_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('promotions', 'applicable_to', {
      type: Sequelize.ENUM('all', 'selected_restaurants', 'categories'),
      defaultValue: 'all'
    });

    await queryInterface.addColumn('promotions', 'user_type', {
      type: Sequelize.ENUM('all', 'new', 'existing'),
      defaultValue: 'all'
    });

    // Add indexes for performance
    await queryInterface.addIndex('promotions', ['current_redemptions', 'max_redemptions']);
    await queryInterface.addIndex('promotions', ['applicable_to']);
    await queryInterface.addIndex('promotions', ['user_type']);
    await queryInterface.addIndex('promotions', ['last_used_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('promotions', 'name');
    await queryInterface.removeColumn('promotions', 'current_redemptions');
    await queryInterface.removeColumn('promotions', 'max_redemptions');
    await queryInterface.removeColumn('promotions', 'max_per_user');
    await queryInterface.removeColumn('promotions', 'total_discount_amount');
    await queryInterface.removeColumn('promotions', 'total_order_value');
    await queryInterface.removeColumn('promotions', 'last_used_at');
    await queryInterface.removeColumn('promotions', 'applicable_to');
    await queryInterface.removeColumn('promotions', 'user_type');
  }
};