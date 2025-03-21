const { PaymentHistory, Order } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');
const moment = require('moment');

class PaymentReconciliationService {
  /**
   * Reconcile all pending payment records with payment providers
   * @returns {Promise<Object>} - Reconciliation report
   */
  async reconcileAllPendingPayments() {
    try {
      // Find all pending payments that need reconciliation
      const pendingPayments = await PaymentHistory.findAll({
        where: {
          status: 'pending',
          createdAt: {
            [Op.gte]: moment().subtract(24, 'hours').toDate() // Only reconcile payments from the last 24 hours
          }
        },
        include: [
          {
            model: Order,
            as: 'order'
          }
        ]
      });

      console.log(`Found ${pendingPayments.length} pending payments to reconcile`);

      const results = {
        total: pendingPayments.length,
        succeeded: 0,
        failed: 0,
        unchanged: 0,
        errors: []
      };

      // Process each pending payment
      for (const payment of pendingPayments) {
        try {
          // Check payment status with the corresponding payment provider
          const updatedStatus = await this.checkPaymentWithProvider(payment);
          
          if (updatedStatus === payment.status) {
            // Status unchanged
            results.unchanged++;
            continue;
          }

          // Update payment status
          await payment.update({ status: updatedStatus });

          // Update order payment status if needed
          if (payment.order) {
            let orderPaymentStatus = 'pending';
            
            if (updatedStatus === 'completed' || updatedStatus === 'succeeded') {
              orderPaymentStatus = 'paid';
              results.succeeded++;
            } else if (updatedStatus === 'failed' || updatedStatus === 'cancelled') {
              orderPaymentStatus = 'failed';
              results.failed++;
            }

            await payment.order.update({ payment_status: orderPaymentStatus });
          }
        } catch (error) {
          console.error(`Error reconciling payment ${payment.id}:`, error);
          results.errors.push({
            paymentId: payment.id,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in payment reconciliation:', error);
      throw error;
    }
  }

  /**
   * Manually reconcile a specific payment with its provider
   * @param {string} paymentId - Payment history ID
   * @returns {Promise<Object>} - Updated payment details
   */
  async reconcilePayment(paymentId) {
    try {
      const payment = await PaymentHistory.findByPk(paymentId, {
        include: [
          {
            model: Order,
            as: 'order'
          }
        ]
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      // Check status with provider
      const updatedStatus = await this.checkPaymentWithProvider(payment);
      
      // If status changed, update the record
      if (updatedStatus !== payment.status) {
        await payment.update({ status: updatedStatus });

        // Update order payment status if needed
        if (payment.order) {
          let orderPaymentStatus = 'pending';
          
          if (updatedStatus === 'completed' || updatedStatus === 'succeeded') {
            orderPaymentStatus = 'paid';
          } else if (updatedStatus === 'failed' || updatedStatus === 'cancelled') {
            orderPaymentStatus = 'failed';
          }

          await payment.order.update({ payment_status: orderPaymentStatus });
        }
      }

      return {
        success: true,
        paymentId: payment.id,
        previousStatus: payment.status,
        currentStatus: updatedStatus,
        statusChanged: updatedStatus !== payment.status
      };
    } catch (error) {
      console.error(`Error reconciling payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Check payment status with the corresponding payment provider
   * @param {Object} payment - Payment history record
   * @returns {Promise<string>} - Updated payment status
   */
  async checkPaymentWithProvider(payment) {
    try {
      switch (payment.payment_method) {
        case 'vnpay':
          return this.checkVNPayPayment(payment);
        case 'momo':
          return this.checkMomoPayment(payment);
        case 'zalopay':
          return this.checkZaloPayPayment(payment);
        case 'card':
          return this.checkCardPayment(payment);
        case 'cash':
          // Cash payments don't need reconciliation
          return payment.status;
        default:
          throw new Error(`Unsupported payment method: ${payment.payment_method}`);
      }
    } catch (error) {
      console.error(`Error checking payment with provider:`, error);
      throw error;
    }
  }

  /**
   * Check VNPay payment status
   * @param {Object} payment - Payment record
   * @returns {Promise<string>} - Updated status
   */
  async checkVNPayPayment(payment) {
    try {
      const orderId = payment.transaction_ref;
      
      // Prepare query parameters for VNPay API
      const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'querydr',
        vnp_TmnCode: config.vnpay.tmnCode,
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Query for order ${orderId}`,
        vnp_TransactionDate: moment(payment.createdAt).format('YYYYMMDDHHmmss'),
        vnp_CreateDate: moment().format('YYYYMMDDHHmmss'),
        vnp_IpAddr: '127.0.0.1' // Replace with server IP
      };
      
      // Sort parameters and create signature
      const signData = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      const hmac = crypto.createHmac('sha512', config.vnpay.hashSecret);
      params.vnp_SecureHash = hmac.update(signData).digest('hex');
      
      // Make API request
      const queryString = Object.keys(params)
        .map(key => `${key}=${encodeURIComponent(params[key])}`)
        .join('&');
      
      const response = await axios.get(`${config.vnpay.apiUrl}?${queryString}`);
      
      // Check response code
      if (response.data.vnp_ResponseCode === '00') {
        // Transaction successful
        return 'completed';
      } else if (['01', '02', '04', '97', '99'].includes(response.data.vnp_ResponseCode)) {
        // Transaction failed
        return 'failed';
      } else {
        // Transaction still pending
        return 'pending';
      }
    } catch (error) {
      console.error('Error checking VNPay payment:', error);
      // If API call fails, don't change status
      return payment.status;
    }
  }

  /**
   * Check Momo payment status
   * @param {Object} payment - Payment record
   * @returns {Promise<string>} - Updated status
   */
  async checkMomoPayment(payment) {
    try {
      const requestId = `${Date.now()}_${payment.id}`;
      const orderId = payment.transaction_ref;
      
      // Prepare request body for Momo API
      const rawSignature = `partnerCode=${config.momo.partnerCode}&accessKey=${config.momo.accessKey}&requestId=${requestId}&orderId=${orderId}&requestType=transactionStatus`;
      
      const signature = crypto
        .createHmac('sha256', config.momo.secretKey)
        .update(rawSignature)
        .digest('hex');
      
      const requestBody = {
        partnerCode: config.momo.partnerCode,
        accessKey: config.momo.accessKey,
        requestId: requestId,
        orderId: orderId,
        requestType: 'transactionStatus',
        signature: signature
      };
      
      // Make API request
      const response = await axios.post(config.momo.apiUrl, requestBody);
      
      // Check response
      if (response.data.errorCode === 0) {
        if (response.data.status === 0) {
          // Transaction successful
          return 'completed';
        } else if (response.data.status === 1) {
          // Transaction pending
          return 'pending';
        } else {
          // Transaction failed
          return 'failed';
        }
      } else {
        // API error
        return payment.status;
      }
    } catch (error) {
      console.error('Error checking Momo payment:', error);
      // If API call fails, don't change status
      return payment.status;
    }
  }

  /**
   * Check ZaloPay payment status
   * @param {Object} payment - Payment record
   * @returns {Promise<string>} - Updated status
   */
  async checkZaloPayPayment(payment) {
    try {
      const appTransId = payment.transaction_ref;
      
      // Prepare data for ZaloPay API
      const data = {
        app_id: config.zalopay.appId,
        app_trans_id: appTransId
      };
      
      const dataStr = `${data.app_id}|${data.app_trans_id}|${config.zalopay.key1}`;
      const mac = crypto
        .createHmac('sha256', config.zalopay.key1)
        .update(dataStr)
        .digest('hex');
      
      data.mac = mac;
      
      // Make API request
      const response = await axios.post(`${config.zalopay.apiUrl}/query`, data);
      
      // Check response
      if (response.data.return_code === 1) {
        // Transaction successful
        return 'completed';
      } else if (response.data.return_code === 2) {
        // Transaction pending
        return 'pending';
      } else {
        // Transaction failed or cancelled
        return 'failed';
      }
    } catch (error) {
      console.error('Error checking ZaloPay payment:', error);
      // If API call fails, don't change status
      return payment.status;
    }
  }

  /**
   * Check card payment status
   * @param {Object} payment - Payment record
   * @returns {Promise<string>} - Updated status
   */
  async checkCardPayment(payment) {
    try {
      // Here you would typically use a payment gateway like Stripe to check the payment status
      // For simplicity, we'll return the current status for card payments since they're usually
      // processed immediately
      return payment.status;
    } catch (error) {
      console.error('Error checking card payment:', error);
      return payment.status;
    }
  }

  /**
   * Generate a payment reconciliation report for a specific period
   * @param {Date} startDate - Start date for report period
   * @param {Date} endDate - End date for report period
   * @returns {Promise<Object>} - Reconciliation report
   */
  async generateReconciliationReport(startDate, endDate) {
    try {
      const payments = await PaymentHistory.findAll({
        where: {
          createdAt: {
            [Op.between]: [startDate, endDate]
          }
        },
        include: [
          {
            model: Order,
            as: 'order'
          }
        ]
      });

      // Group payments by method and status
      const summary = {
        totalAmount: 0,
        totalCount: payments.length,
        methods: {},
        statuses: {}
      };

      // Summarize by payment method
      for (const payment of payments) {
        // Add payment amount to total
        summary.totalAmount += parseFloat(payment.amount);

        // Group by payment method
        const method = payment.payment_method;
        if (!summary.methods[method]) {
          summary.methods[method] = {
            count: 0,
            amount: 0
          };
        }
        summary.methods[method].count++;
        summary.methods[method].amount += parseFloat(payment.amount);

        // Group by status
        const status = payment.status;
        if (!summary.statuses[status]) {
          summary.statuses[status] = {
            count: 0,
            amount: 0
          };
        }
        summary.statuses[status].count++;
        summary.statuses[status].amount += parseFloat(payment.amount);
      }

      // Calculate discrepancies between order and payment status
      const discrepancies = [];
      for (const payment of payments) {
        if (payment.order) {
          // Check if payment status matches order payment status
          const paymentStatus = payment.status;
          const orderPaymentStatus = payment.order.payment_status;
          
          let expectedOrderStatus = 'pending';
          if (paymentStatus === 'completed' || paymentStatus === 'succeeded') {
            expectedOrderStatus = 'paid';
          } else if (paymentStatus === 'failed' || paymentStatus === 'cancelled') {
            expectedOrderStatus = 'failed';
          }
          
          if (expectedOrderStatus !== orderPaymentStatus) {
            discrepancies.push({
              paymentId: payment.id,
              orderId: payment.order.id,
              paymentStatus,
              orderPaymentStatus,
              expectedOrderStatus,
              amount: payment.amount
            });
          }
        }
      }

      return {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        summary,
        discrepancies,
        detailed: payments.map(p => ({
          id: p.id,
          orderId: p.order?.id,
          method: p.payment_method,
          amount: p.amount,
          status: p.status,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          transactionRef: p.transaction_ref
        }))
      };
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
      throw error;
    }
  }
}

module.exports = new PaymentReconciliationService();