import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const PaymentService = {
  /**
   * Initialize VNPay payment
   * @param {Object} orderData - Order details including amount and order info
   * @returns {Promise<string>} - Payment URL to redirect to VNPay gateway
   */
  async initializeVNPay(orderData) {
    try {
      const response = await axios.post(`${API_URL}/payments/vnpay/create`, {
        amount: orderData.total,
        orderInfo: `Payment for order #${orderData.orderId}`,
        orderType: 'food_delivery'
      })
      return response.data.paymentUrl
    } catch (error) {
      console.error('VNPay initialization failed:', error)
      throw new Error('Failed to initialize VNPay payment')
    }
  },

  /**
   * Initialize Momo payment
   * @param {Object} orderData - Order details including amount and order info
   * @returns {Promise<string>} - Payment URL to redirect to Momo gateway
   */
  async initializeMomo(orderData) {
    try {
      const response = await axios.post(`${API_URL}/payments/momo/create`, {
        amount: orderData.total,
        orderInfo: `Payment for order #${orderData.orderId}`,
        orderType: 'food_delivery'
      })
      return response.data.paymentUrl
    } catch (error) {
      console.error('Momo initialization failed:', error)
      throw new Error('Failed to initialize Momo payment')
    }
  },

  /**
   * Verify payment status
   * @param {string} paymentId - Payment transaction ID
   * @param {string} paymentType - Payment type (vnpay/momo)
   * @returns {Promise<Object>} - Payment verification result
   */
  async verifyPayment(paymentId, paymentType) {
    try {
      const response = await axios.post(`${API_URL}/payments/${paymentType}/verify`, {
        paymentId
      })
      return response.data
    } catch (error) {
      console.error('Payment verification failed:', error)
      throw new Error('Failed to verify payment')
    }
  }
}