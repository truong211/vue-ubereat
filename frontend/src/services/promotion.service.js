/**
 * Promotion Service
 * Handles promo codes, discounts, and other promotional features
 */

import axios from 'axios'

class PromotionService {
  /**
   * Validate a promo code
   * @param {string} code - The promo code to validate
   * @param {number} subtotal - The order subtotal
   * @returns {Promise<Object>} Promotion details if valid
   */
  async validatePromoCode(code, subtotal) {
    try {
      const response = await axios.post('/api/promotions/validate', {
        code,
        subtotal
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Invalid promotion code')
    }
  }

  /**
   * Get active promotions for a restaurant
   * @param {number} restaurantId - The restaurant ID
   * @returns {Promise<Array>} Array of active promotions
   */
  async getRestaurantPromotions(restaurantId) {
    try {
      const response = await axios.get(`/api/restaurants/${restaurantId}/promotions`)
      return response.data
    } catch (error) {
      console.error('Error fetching restaurant promotions:', error)
      return []
    }
  }

  /**
   * Get available promotions for the current user
   * @returns {Promise<Array>} Array of available promotions
   */
  async getUserPromotions() {
    try {
      const response = await axios.get('/api/user/promotions')
      return response.data
    } catch (error) {
      console.error('Error fetching user promotions:', error)
      return []
    }
  }

  /**
   * Apply a promotion to an order
   * @param {string} code - Promotion code
   * @param {Object} orderDetails - Order details
   * @returns {Promise<Object>} Updated order with applied promotion
   */
  async applyPromotion(code, orderDetails) {
    try {
      const response = await axios.post('/api/orders/apply-promotion', {
        code,
        orderDetails
      })
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to apply promotion')
    }
  }

  /**
   * Calculate discount amount
   * @param {Object} promotion - Promotion details
   * @param {number} subtotal - Order subtotal
   * @returns {Object} Discount details
   */
  calculateDiscount(promotion, subtotal) {
    if (!promotion) return { amount: 0, freeDelivery: false }

    let discountAmount = 0
    const freeDelivery = !!promotion.freeDelivery

    // Calculate discount based on promotion type
    switch (promotion.type) {
      case 'percentage':
        discountAmount = (subtotal * promotion.value) / 100
        // Apply max discount if specified
        if (promotion.maxDiscount && discountAmount > promotion.maxDiscount) {
          discountAmount = promotion.maxDiscount
        }
        break

      case 'fixed':
        discountAmount = promotion.value
        break

      case 'free_delivery':
        // No discount amount, just free delivery
        break

      default:
        break
    }

    return {
      amount: parseFloat(discountAmount.toFixed(2)),
      freeDelivery
    }
  }

  /**
   * Create a new promotion (admin/restaurant owner only)
   * @param {Object} promotionData - Promotion data to create
   * @returns {Promise<Object>} Created promotion
   */
  async createPromotion(promotionData) {
    try {
      const response = await axios.post('/api/admin/promotions', promotionData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create promotion')
    }
  }

  /**
   * Update an existing promotion (admin/restaurant owner only)
   * @param {number} id - Promotion ID
   * @param {Object} promotionData - Updated promotion data
   * @returns {Promise<Object>} Updated promotion
   */
  async updatePromotion(id, promotionData) {
    try {
      const response = await axios.put(`/api/admin/promotions/${id}`, promotionData)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update promotion')
    }
  }

  /**
   * Delete a promotion (admin/restaurant owner only)
   * @param {number} id - Promotion ID
   * @returns {Promise<boolean>} Success status
   */
  async deletePromotion(id) {
    try {
      await axios.delete(`/api/admin/promotions/${id}`)
      return true
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete promotion')
    }
  }
}

export default new PromotionService()
