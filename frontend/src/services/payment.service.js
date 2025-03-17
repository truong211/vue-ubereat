import axios from 'axios';
import { API_URL } from '@/config';

class PaymentService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_URL}/api/payment`,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  // Get available payment methods
  async getPaymentMethods() {
    return this.api.get('/methods').then(response => response.data);
  }

  // Get saved payment methods
  async getSavedPaymentMethods() {
    return this.api.get('/saved-cards').then(response => response.data);
  }

  // Delete saved payment method
  async deleteSavedPaymentMethod(methodId) {
    return this.api.delete(`/saved-cards/${methodId}`).then(response => response.data);
  }

  // Process VNPay payment
  async processVNPayPayment(orderData) {
    return this.api.post('/vnpay/init', orderData).then(response => response.data);
  }

  // Process Momo payment
  async processMomoPayment(orderData) {
    return this.api.post('/momo/init', orderData).then(response => response.data);
  }

  // Process ZaloPay payment
  async processZaloPayment(orderData) {
    return this.api.post('/zalopay/init', orderData).then(response => response.data);
  }

  // Process card payment
  async processCardPayment(orderData) {
    return this.api.post('/process', orderData).then(response => response.data);
  }

  // Verify payment status
  async verifyPayment(provider, paymentId) {
    return this.api.get(`/${provider}/verify/${paymentId}`).then(response => response.data);
  }

  // Process refund
  async processRefund(orderId, refundData) {
    return this.api.post(`/refund/${orderId}`, refundData).then(response => response.data);
  }

  // Save payment method
  async savePaymentMethod(paymentMethod) {
    return this.api.post('/saved-cards', paymentMethod).then(response => response.data);
  }

  // Request charge for saved card
  async chargeCard(cardId, amount) {
    return this.api.post(`/charge/${cardId}`, { amount }).then(response => response.data);
  }
}

export default new PaymentService();
