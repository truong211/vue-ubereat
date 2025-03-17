import axios from 'axios';
import { store } from '@/store';

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
   * Calculate points earned from an order
   * @param {Object} order - The order object
   * @returns {Number} - Points earned
   */
  calculateOrderPoints(order) {
    if (!order || !order.total) {
      return 0;
    }

    // Basic calculation: 10 points per dollar spent
    let points = Math.floor(order.total * 10);
    
    // Check for tier multipliers
    const userTier = this.getUserTier();
    const tierMultipliers = {
      'bronze': 1,
      'silver': 1.2,
      'gold': 1.5,
      'platinum': 2
    };
    
    if (tierMultipliers[userTier]) {
      points = Math.floor(points * tierMultipliers[userTier]);
    }
    
    return points;
  }

  /**
   * Get available rewards for the current user
   * @returns {Promise<Array>} - List of available rewards
   */
  async getAvailableRewards() {
    try {
      const response = await axios.get('/api/rewards/available');
      return response.data.rewards || [];
    } catch (error) {
      console.error('Error fetching available rewards:', error);
      return [];
    }
  }

  /**
   * Get user's reward history
   * @param {Number} page - Page number
   * @param {Number} limit - Number of items per page
   * @returns {Promise<Object>} - Reward history with pagination
   */
  async getRewardHistory(page = 1, limit = 10) {
    try {
      const response = await axios.get(`/api/rewards/history?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reward history:', error);
      return { rewards: [], total: 0 };
    }
  }

  /**
   * Redeem reward points for a specific reward
   * @param {String} rewardId - ID of the reward to redeem
   * @returns {Promise<Object>} - Redemption result
   */
  async redeemReward(rewardId) {
    try {
      const response = await axios.post('/api/rewards/redeem', { rewardId });
      
      // Update user points in store
      if (response.data.success) {
        store.dispatch('user/updateUserPoints', response.data.remainingPoints);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error redeeming reward:', error);
      throw error;
    }
  }

  /**
   * Apply a reward to an order
   * @param {String} rewardId - ID of the reward to apply
   * @param {String} orderId - ID of the order
   * @returns {Promise<Object>} - Updated order with applied reward
   */
  async applyRewardToOrder(rewardId, orderId) {
    try {
      const response = await axios.post(`/api/orders/${orderId}/apply-reward`, { rewardId });
      return response.data;
    } catch (error) {
      console.error('Error applying reward to order:', error);
      throw error;
    }
  }

  /**
   * Get the user's current loyalty tier
   * @returns {String} - User tier (bronze, silver, gold, platinum)
   */
  getUserTier() {
    const user = store.state.auth.user;
    if (!user || !user.loyaltyPoints) {
      return 'bronze';
    }
    
    const points = user.loyaltyPoints;
    
    if (points >= 10000) {
      return 'platinum';
    } else if (points >= 5000) {
      return 'gold';
    } else if (points >= 1000) {
      return 'silver';
    } else {
      return 'bronze';
    }
  }

  /**
   * Get tier benefits for a specific tier or all tiers
   * @param {String} tier - Optional tier to get benefits for
   * @returns {Object} - Tier benefits
   */
  getTierBenefits(tier = null) {
    const benefits = {
      'bronze': {
        pointsMultiplier: 1,
        freeDelivery: false,
        exclusiveOffers: false,
        prioritySupport: false,
        birthdayReward: true
      },
      'silver': {
        pointsMultiplier: 1.2,
        freeDelivery: false,
        exclusiveOffers: true,
        prioritySupport: false,
        birthdayReward: true
      },
      'gold': {
        pointsMultiplier: 1.5,
        freeDelivery: true,
        exclusiveOffers: true,
        prioritySupport: false,
        birthdayReward: true
      },
      'platinum': {
        pointsMultiplier: 2,
        freeDelivery: true,
        exclusiveOffers: true,
        prioritySupport: true,
        birthdayReward: true
      }
    };
    
    return tier ? benefits[tier] : benefits;
  }

  /**
   * Calculate points needed for next tier
   * @returns {Object} - Next tier info with points needed
   */
  getNextTierInfo() {
    const user = store.state.auth.user;
    const currentPoints = user?.loyaltyPoints || 0;
    const currentTier = this.getUserTier();
    
    const tierThresholds = {
      'bronze': 0,
      'silver': 1000,
      'gold': 5000,
      'platinum': 10000
    };
    
    if (currentTier === 'platinum') {
      return {
        nextTier: null,
        pointsNeeded: 0,
        progress: 100
      };
    }
    
    const nextTierMap = {
      'bronze': 'silver',
      'silver': 'gold',
      'gold': 'platinum'
    };
    
    const nextTier = nextTierMap[currentTier];
    const nextTierPoints = tierThresholds[nextTier];
    const pointsNeeded = Math.max(0, nextTierPoints - currentPoints);
    const progress = Math.min(100, Math.floor((currentPoints / nextTierPoints) * 100));
    
    return {
      currentTier,
      nextTier,
      currentPoints,
      pointsNeeded,
      progress
    };
  }

  /**
   * Check if birthday reward is available
   * @returns {Promise<Boolean>} - Whether birthday reward is available
   */
  async checkBirthdayReward() {
    try {
      const response = await axios.get('/api/rewards/birthday-check');
      return response.data.available || false;
    } catch (error) {
      console.error('Error checking birthday reward:', error);
      return false;
    }
  }

  /**
   * Claim birthday reward
   * @returns {Promise<Object>} - Claimed reward
   */
  async claimBirthdayReward() {
    try {
      const response = await axios.post('/api/rewards/claim-birthday');
      return response.data;
    } catch (error) {
      console.error('Error claiming birthday reward:', error);
      throw error;
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

export const loyaltyService = new LoyaltyService();
export default loyaltyService;