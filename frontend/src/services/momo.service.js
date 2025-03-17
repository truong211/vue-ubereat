import axios from 'axios';
import { handleError } from '@/utils/error-handler';

class MomoService {
  constructor() {
    this.api = axios.create({
      baseURL: `${import.meta.env.VITE_API_URL}/api/payments/momo`,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Initialize Momo payment
  async createPayment(orderData) {
    try {
      const response = await this.api.post('/create', {
        amount: orderData.amount,
        orderId: orderData.id,
        orderInfo: `Payment for order #${orderData.id}`,
        returnUrl: `${window.location.origin}/payment/momo/callback`,
        notifyUrl: `${import.meta.env.VITE_API_URL}/api/payments/momo/ipn`
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  }

  // Process Momo payment callback
  async processCallback(params) {
    try {
      const response = await this.api.post('/callback', params);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  }

  // Verify Momo payment status
  async verifyPayment(params) {
    try {
      const response = await this.api.post('/verify', params);
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  }

  // Request refund
  async requestRefund(refundData) {
    try {
      const response = await this.api.post('/refund', {
        transactionId: refundData.transactionId,
        amount: refundData.amount,
        orderId: refundData.orderId,
        reason: refundData.reason
      });
      return response.data;
    } catch (error) {
      throw handleError(error);
    }
  }
}

export default new MomoService();