import axios from 'axios'
import { handleError } from '@/utils/error-handler'

class PaymentService {
  constructor() {
    this.api = axios.create({
      baseURL: `${process.env.VUE_APP_API_URL}/api/payments`,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  // Add authentication header
  setAuthHeader(token) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  }

  // Initialize payment with VNPay
  async initVNPay(orderData) {
    try {
      const response = await this.api.post('/vnpay/create', {
        amount: orderData.amount,
        orderId: orderData.id,
        orderInfo: `Payment for order #${orderData.id}`,
        returnUrl: `${window.location.origin}/payment/vnpay/callback`
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Initialize payment with Momo
  async initMomo(orderData) {
    try {
      const response = await this.api.post('/momo/create', {
        amount: orderData.amount,
        orderId: orderData.id,
        orderInfo: `Payment for order #${orderData.id}`,
        returnUrl: `${window.location.origin}/payment/momo/callback`,
        notifyUrl: `${process.env.VUE_APP_API_URL}/api/payments/momo/ipn`
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Initialize payment with ZaloPay
  async initZaloPay(orderData) {
    try {
      const response = await this.api.post('/zalopay/create', {
        amount: orderData.amount,
        orderId: orderData.id,
        orderInfo: `Payment for order #${orderData.id}`,
        returnUrl: `${window.location.origin}/payment/zalopay/callback`
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Verify payment status
  async verifyPayment(paymentData) {
    try {
      const response = await this.api.post('/verify', paymentData)
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Request refund
  async requestRefund(orderData) {
    try {
      const response = await this.api.post('/refund', {
        orderId: orderData.id,
        amount: orderData.amount,
        reason: orderData.reason
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Get payment methods for user
  async getPaymentMethods() {
    try {
      const response = await this.api.get('/methods')
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Save payment method for future use
  async savePaymentMethod(methodData) {
    try {
      const response = await this.api.post('/methods', methodData)
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Delete saved payment method
  async deletePaymentMethod(methodId) {
    try {
      const response = await this.api.delete(`/methods/${methodId}`)
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Get payment history
  async getPaymentHistory(params) {
    try {
      const response = await this.api.get('/history', { params })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Get transaction details
  async getTransactionDetails(transactionId) {
    try {
      const response = await this.api.get(`/transactions/${transactionId}`)
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Request invoice for order
  async requestInvoice(orderId) {
    try {
      const response = await this.api.post(`/invoice/${orderId}`)
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Get invoice PDF
  async getInvoicePDF(invoiceId) {
    try {
      const response = await this.api.get(`/invoice/${invoiceId}/pdf`, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }

  // Handle payment callbacks
  async handlePaymentCallback(provider, data) {
    try {
      const response = await this.api.post(`/${provider}/callback`, data)
      return response.data
    } catch (error) {
      throw handleError(error)
    }
  }
}

export default new PaymentService()
