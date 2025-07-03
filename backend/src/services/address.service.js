'use strict';

const { Address } = require('../models/sequelize');
const { sequelize } = require('../models/sequelize');

class AddressService {
  /**
   * List all addresses of a user ordered by default first and newest first.
   */
  static async list(userId) {
    return await Address.findAll({
      where: { user_id: userId },
      order: [
        ['is_default', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
  }

  /**
   * Get single address owned by user.
   */
  static async get(userId, addressId) {
    return await Address.findOne({ where: { id: addressId, user_id: userId } });
  }

  /**
   * Create a new address for user. If is_default true, unset other defaults.
   */
  static async create(userId, data) {
    return await sequelize.transaction(async (t) => {
      if (data.is_default) {
        await Address.update(
          { is_default: false },
          { where: { user_id: userId, is_default: true }, transaction: t }
        );
      }
      const address = await Address.create(
        {
          user_id: userId,
          ...data,
        },
        { transaction: t }
      );
      return address;
    });
  }

  /**
   * Update address (ownership enforced). Handles default flag logic.
   */
  static async update(userId, addressId, payload) {
    return await sequelize.transaction(async (t) => {
      const address = await Address.findOne({
        where: { id: addressId, user_id: userId },
        transaction: t,
      });
      if (!address) return null;

      if (payload.is_default === true && !address.is_default) {
        await Address.update(
          { is_default: false },
          { where: { user_id: userId, is_default: true }, transaction: t }
        );
      }

      await address.update(payload, { transaction: t });
      return address;
    });
  }

  /**
   * Delete address; if deleted address was default, set last one as default.
   */
  static async remove(userId, addressId) {
    return await sequelize.transaction(async (t) => {
      const address = await Address.findOne({
        where: { id: addressId, user_id: userId },
        transaction: t,
      });
      if (!address) return null;
      const wasDefault = address.is_default;
      await address.destroy({ transaction: t });

      if (wasDefault) {
        const latest = await Address.findOne({
          where: { user_id: userId },
          order: [['created_at', 'DESC']],
          transaction: t,
        });
        if (latest) {
          await latest.update({ is_default: true }, { transaction: t });
        }
      }
      return true;
    });
  }

  /**
   * Explicitly set an address as default for user.
   */
  static async setDefault(userId, addressId) {
    return await sequelize.transaction(async (t) => {
      const address = await Address.findOne({
        where: { id: addressId, user_id: userId },
        transaction: t,
      });
      if (!address) return null;
      // unset others then set this
      await Address.update(
        { is_default: false },
        { where: { user_id: userId }, transaction: t }
      );
      await address.update({ is_default: true }, { transaction: t });
      return address;
    });
  }
}

module.exports = AddressService;