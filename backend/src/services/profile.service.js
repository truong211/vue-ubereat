'use strict';

const { User, Address, UserProfileHistory } = require('../models/sequelize');

/**
 * ProfileService
 * ---------------------------------------------------------------------------
 * Encapsulates business logic related to user profile management.
 */
class ProfileService {
  /**
   * Fetch a user profile by id, including addresses (if any).
   * Returns `null` if the user does not exist.
   */
  static async getProfile(userId) {
    return await User.findByPk(userId, {
      attributes: { exclude: ['password_hash'] },
      include: [
        { model: Address, as: 'addresses' },
      ],
    });
  }

  /**
   * Update profile data for the given user and persist change logs.
   *
   * @param {number}   userId     - The id of the user to update
   * @param {Object}   payload    - Key-value pairs of fields to update
   * @param {string=}  changedIp  - IP address of the client (optional)
   *
   * @returns {Promise<Object>} Updated user instance
   */
  static async updateProfile(userId, payload = {}, changedIp = null) {
    // Fetch user first
    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }

    // Whitelist updatable columns
    const allowed = ['full_name', 'email', 'phone', 'avatar_url'];

    const updates = {};
    const historyRows = [];

    for (const key of allowed) {
      if (payload.hasOwnProperty(key) && payload[key] !== user[key]) {
        historyRows.push({
          user_id: userId,
          field: key,
          old_value: user[key],
          new_value: payload[key],
          changed_by_ip: changedIp || null,
        });
        updates[key] = payload[key];
      }
    }

    // If nothing to update just return existing user
    if (Object.keys(updates).length === 0) {
      return user;
    }

    // Perform update and history logging in parallel / transaction (simple variant)
    await user.update(updates);
    if (historyRows.length > 0) {
      await UserProfileHistory.bulkCreate(historyRows);
    }

    return user;
  }
}

module.exports = ProfileService;