module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('restaurants', 'menuAvailability', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {
        scheduleEnabled: false,
        defaultAvailability: true,
        schedules: []
      }
    });

    await queryInterface.addColumn('restaurants', 'tempClosureSettings', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: {
        isTemporarilyClosed: false,
        reopenDate: null,
        closureReason: null,
        showReason: true,
        acceptPreOrders: false
      }
    });

    // Create menu availability schedules table
    await queryInterface.createTable('menu_availability_schedules', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      restaurantId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'restaurants',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      categoryId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'products',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      availability: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      startTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      endTime: {
        type: Sequelize.TIME,
        allowNull: false
      },
      days: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false
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
    await queryInterface.addIndex('menu_availability_schedules', ['restaurantId']);
    await queryInterface.addIndex('menu_availability_schedules', ['categoryId']);
    await queryInterface.addIndex('menu_availability_schedules', ['itemId']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('restaurants', 'menuAvailability');
    await queryInterface.removeColumn('restaurants', 'tempClosureSettings');
    await queryInterface.dropTable('menu_availability_schedules');
  }
};