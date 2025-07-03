/* eslint-disable camelcase */
'use strict';

/**
 * Migration: create users, user_profile_history, and addresses tables
 *
 * This migration follows the database schema outlined in section B of the
 * specification:
 *   1. users
 *   2. user_profile_history
 *   3. addresses
 *
 * All column names use snake_case and timestamps are handled automatically by
 * Sequelize when `timestamps: true` is provided.  We intentionally disable the
 * default pluralisation and naming conventions by explicitly specifying table
 * names.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /** ------------------------------------------------------------------
     * 1. users
     * ------------------------------------------------------------------ */
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
        unique: true,
      },
      avatar_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      // Additional optional/user-management columns
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      role: {
        type: Sequelize.ENUM('admin', 'customer', 'restaurant', 'driver'),
        defaultValue: 'customer',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    /** ------------------------------------------------------------------
     * 2. user_profile_history
     * ------------------------------------------------------------------ */
    await queryInterface.createTable('user_profile_history', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      field: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'The profile field that was changed (e.g., full_name, email)'
      },
      old_value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      new_value: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      changed_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      changed_by_ip: {
        type: Sequelize.STRING(45), // IPv6 max length
        allowNull: true,
      },
    });

    /** ------------------------------------------------------------------
     * 3. addresses
     * ------------------------------------------------------------------ */
    await queryInterface.createTable('addresses', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      recipient_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      line1: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Street address, apartment, etc.',
      },
      ward: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      district: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      province: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_default: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    // Indexes -----------------------------------------------------------
    await queryInterface.addIndex('addresses', ['user_id'], { name: 'idx_addresses_user' });
    await queryInterface.addIndex('addresses', ['is_default'], { name: 'idx_addresses_is_default' });
    await queryInterface.addIndex('user_profile_history', ['user_id', 'changed_at'], { name: 'idx_uph_user_date' });
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['phone']);
  },

  down: async (queryInterface /* , Sequelize */) => {
    await queryInterface.dropTable('addresses');
    await queryInterface.dropTable('user_profile_history');
    await queryInterface.dropTable('users');
  },
};