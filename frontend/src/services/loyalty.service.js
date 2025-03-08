import api from './api.service'

class LoyaltyService {
  /**
   * Get customer loyalty status
   * @param {string} customerId Customer ID
   * @returns {Promise<Object>} Loyalty status
   */
  async getLoyaltyStatus(customerId) {
    try {
      const response = await api.get(`/loyalty/status/${customerId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch loyalty status:', error)
      throw error
    }
  }

  /**
   * Get available rewards
   * @param {string} customerId Customer ID
   * @returns {Promise<Object>} Available rewards
   */
  async getAvailableRewards(customerId) {
    try {
      const response = await api.get(`/loyalty/rewards/${customerId}/available`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch available rewards:', error)
      throw error
    }
  }

  /**
   * Get reward history
   * @param {string} customerId Customer ID
   * @param {Object} options Query options
   * @returns {Promise<Object>} Reward history
   */
  async getRewardHistory(customerId, options = {}) {
    try {
      const response = await api.get(`/loyalty/rewards/${customerId}/history`, {
        params: options
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch reward history:', error)
      throw error
    }
  }

  /**
   * Get point transactions
   * @param {string} customerId Customer ID
   * @param {Object} options Query options
   * @returns {Promise<Object>} Point transactions
   */
  async getPointTransactions(customerId, options = {}) {
    try {
      const response = await api.get(`/loyalty/points/${customerId}/transactions`, {
        params: options
      })
      return response.data
    } catch (error) {
      console.error('Failed to fetch point transactions:', error)
      throw error
    }
  }

  /**
   * Calculate points for order
   * @param {Object} order Order details
   * @returns {Promise<Object>} Points calculation
   */
  async calculateOrderPoints(order) {
    try {
      const response = await api.post('/loyalty/points/calculate', order)
      return response.data
    } catch (error) {
      console.error('Failed to calculate points:', error)
      throw error
    }
  }

  /**
   * Award points
   * @param {string} customerId Customer ID
   * @param {Object} transaction Transaction details
   * @returns {Promise<Object>} Updated points
   */
  async awardPoints(customerId, transaction) {
    try {
      const response = await api.post(
        `/loyalty/points/${customerId}/award`,
        transaction
      )
      return response.data
    } catch (error) {
      console.error('Failed to award points:', error)
      throw error
    }
  }

  /**
   * Redeem reward
   * @param {string} customerId Customer ID
   * @param {string} rewardId Reward ID
   * @returns {Promise<Object>} Redemption result
   */
  async redeemReward(customerId, rewardId) {
    try {
      const response = await api.post(
        `/loyalty/rewards/${customerId}/redeem/${rewardId}`
      )
      return response.data
    } catch (error) {
      console.error('Failed to redeem reward:', error)
      throw error
    }
  }

  /**
   * Get tier benefits
   * @param {string} tierId Tier ID
   * @returns {Promise<Object>} Tier benefits
   */
  async getTierBenefits(tierId) {
    try {
      const response = await api.get(`/loyalty/tiers/${tierId}/benefits`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch tier benefits:', error)
      throw error
    }
  }

  /**
   * Get tier progress
   * @param {string} customerId Customer ID
   * @returns {Promise<Object>} Tier progress
   */
  async getTierProgress(customerId) {
    try {
      const response = await api.get(`/loyalty/tiers/${customerId}/progress`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch tier progress:', error)
      throw error
    }
  }

  /**
   * Get personalized offers
   * @param {string} customerId Customer ID
   * @returns {Promise<Object>} Personalized offers
   */
  async getPersonalizedOffers(customerId) {
    try {
      const response = await api.get(`/loyalty/offers/${customerId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch personalized offers:', error)
      throw error
    }
  }

  /**
   * Get referral code
   * @param {string} customerId Customer ID
   * @returns {Promise<Object>} Referral code
   */
  async getReferralCode(customerId) {
    try {
      const response = await api.get(`/loyalty/referral/${customerId}/code`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch referral code:', error)
      throw error
    }
  }

  /**
   * Apply referral code
   * @param {string} customerId Customer ID
   * @param {string} referralCode Referral code
   * @returns {Promise<Object>} Referral result
   */
  async applyReferralCode(customerId, referralCode) {
    try {
      const response = await api.post(
        `/loyalty/referral/${customerId}/apply`,
        { code: referralCode }
      )
      return response.data
    } catch (error) {
      console.error('Failed to apply referral code:', error)
      throw error
    }
  }

  /**
   * Get referral statistics
   * @param {string} customerId Customer ID
   * @returns {Promise<Object>} Referral statistics
   */
  async getReferralStats(customerId) {
    try {
      const response = await api.get(`/loyalty/referral/${customerId}/stats`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch referral statistics:', error)
      throw error
    }
  }

  /**
   * Get birthday rewards
   * @param {string} customerId Customer ID
   * @returns {Promise<Object>} Birthday rewards
   */
  async getBirthdayRewards(customerId) {
    try {
      const response = await api.get(`/loyalty/rewards/${customerId}/birthday`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch birthday rewards:', error)
      throw error
    }
  }

  /**
   * Get loyalty insights
   * @param {string} customerId Customer ID
   * @returns {Promise<Object>} Loyalty insights
   */
  async getLoyaltyInsights(customerId) {
    try {
      const response = await api.get(`/loyalty/insights/${customerId}`)
      return response.data
    } catch (error) {
      console.error('Failed to fetch loyalty insights:', error)
      throw error
    }
  }

  /**
   * Update notification preferences
   * @param {string} customerId Customer ID
   * @param {Object} preferences Notification preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateNotificationPreferences(customerId, preferences) {
    try {
      const response = await api.put(
        `/loyalty/notifications/${customerId}/preferences`,
        preferences
      )
      return response.data
    } catch (error) {
      console.error('Failed to update notification preferences:', error)
      throw error
    }
  }
}

export default new LoyaltyService()