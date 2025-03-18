const { validationResult } = require('express-validator');
const { Order, User, PaymentHistory } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const uuid = require('uuid').v4;
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');

class PaymentController {
  // Initialize payment services
  constructor() {
    this.vnpayConfig = {
      tmnCode: config.vnpay.tmnCode,
      hashSecret: config.vnpay.hashSecret,
      apiUrl: config.vnpay.apiUrl
    };

    this.momoConfig = {
      partnerCode: config.momo.partnerCode,
      accessKey: config.momo.accessKey,
      secretKey: config.momo.secretKey,
      apiUrl: config.momo.apiUrl
    };

    this.zalopayConfig = {
      appId: config.zalopay.appId,
      key1: config.zalopay.key1,
      key2: config.zalopay.key2,
      apiUrl: config.zalopay.apiUrl
    };
  }

  // Process VNPay payment
  async processVNPayPayment(req, res) {
    try {
      const { order_id, return_url } = req.body;
      const order = await Order.findByPk(order_id);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const tmnCode = this.vnpayConfig.tmnCode;
      const secretKey = this.vnpayConfig.hashSecret;
      const returnUrl = return_url;
      
      const date = new Date();
      const createDate = date.toISOString().split('T')[0].replace(/-/g, '');
      const orderId = `${order.id}_${Date.now()}`;
      
      // Create VNPay payment URL
      const vnpUrl = new URL(this.vnpayConfig.apiUrl);
      const params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: orderId,
        vnp_OrderInfo: `Payment for order ${order.id}`,
        vnp_OrderType: 'food_delivery',
        vnp_Amount: order.total_amount * 100, // Amount in VND cents
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: req.ip,
        vnp_CreateDate: createDate
      };

      // Generate signature
      const signData = Object.keys(params)
        .sort()
        .map(key => `${key}=${params[key]}`)
        .join('&');
      
      const hmac = crypto.createHmac('sha512', secretKey);
      params.vnp_SecureHash = hmac.update(signData).digest('hex');

      // Add params to URL
      Object.keys(params).forEach(key => vnpUrl.searchParams.append(key, params[key]));

      // Save payment attempt
      await PaymentHistory.create({
        order_id: order.id,
        payment_method: 'vnpay',
        amount: order.total_amount,
        status: 'pending',
        transaction_ref: orderId
      });

      res.json({ redirect_url: vnpUrl.toString() });
    } catch (error) {
      console.error('VNPay payment error:', error);
      res.status(500).json({ message: 'Failed to process VNPay payment' });
    }
  }

  // Process Momo payment
  async processMomoPayment(req, res) {
    try {
      const { order_id, return_url } = req.body;
      const order = await Order.findByPk(order_id);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const requestId = `${Date.now()}_${order.id}`;
      const orderId = `${order.id}_${Date.now()}`;
      
      // Create Momo payment request
      const rawSignature = `partnerCode=${this.momoConfig.partnerCode}&accessKey=${this.momoConfig.accessKey}&requestId=${requestId}&amount=${order.total_amount}&orderId=${orderId}&orderInfo=Payment for order ${order.id}&returnUrl=${return_url}&notifyUrl=${config.momo.notifyUrl}&extraData=`;
      
      const signature = crypto
        .createHmac('sha256', this.momoConfig.secretKey)
        .update(rawSignature)
        .digest('hex');

      const requestBody = {
        partnerCode: this.momoConfig.partnerCode,
        accessKey: this.momoConfig.accessKey,
        requestId: requestId,
        amount: order.total_amount,
        orderId: orderId,
        orderInfo: `Payment for order ${order.id}`,
        returnUrl: return_url,
        notifyUrl: config.momo.notifyUrl,
        extraData: '',
        requestType: 'captureMoMoWallet',
        signature: signature
      };

      const response = await axios.post(this.momoConfig.apiUrl, requestBody);

      if (response.data.errorCode !== 0) {
        throw new Error(response.data.message);
      }

      // Save payment attempt
      await PaymentHistory.create({
        order_id: order.id,
        payment_method: 'momo',
        amount: order.total_amount,
        status: 'pending',
        transaction_ref: orderId
      });

      res.json({ redirect_url: response.data.payUrl });
    } catch (error) {
      console.error('Momo payment error:', error);
      res.status(500).json({ message: 'Failed to process Momo payment' });
    }
  }

  // Process ZaloPay payment
  async processZaloPayment(req, res) {
    try {
      const { order_id, return_url } = req.body;
      const order = await Order.findByPk(order_id);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      const embedData = {
        redirecturl: return_url
      };

      const items = [{
        itemid: order.id,
        itemname: `Order #${order.id}`,
        itemprice: order.total_amount,
        itemquantity: 1
      }];

      const transId = `${Date.now()}_${order.id}`;
      
      // Create ZaloPay order data
      const orderData = {
        app_id: this.zalopayConfig.appId,
        app_trans_id: transId,
        app_user: order.user_id,
        app_time: Date.now(),
        amount: order.total_amount,
        item: JSON.stringify(items),
        embed_data: JSON.stringify(embedData),
        description: `Payment for order ${order.id}`
      };

      // Generate MAC for verification
      const data = `${this.zalopayConfig.appId}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
      const mac = crypto
        .createHmac('sha256', this.zalopayConfig.key1)
        .update(data)
        .digest('hex');

      orderData.mac = mac;

      const response = await axios.post(this.zalopayConfig.apiUrl, orderData);

      if (response.data.return_code !== 1) {
        throw new Error(response.data.return_message);
      }

      // Save payment attempt
      await PaymentHistory.create({
        order_id: order.id,
        payment_method: 'zalopay',
        amount: order.total_amount,
        status: 'pending',
        transaction_ref: transId
      });

      res.json({ redirect_url: response.data.order_url });
    } catch (error) {
      console.error('ZaloPay payment error:', error);
      res.status(500).json({ message: 'Failed to process ZaloPay payment' });
    }
  }

  // Process card payment
  async processCardPayment(req, res) {
    try {
      const { order_id, card_token, save_card } = req.body;
      const order = await Order.findByPk(order_id);

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Create payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total_amount * 100), // Convert to cents
        currency: 'usd',
        payment_method: card_token,
        confirm: true,
        return_url: `${config.baseUrl}/payment/callback`,
        metadata: {
          order_id: order.id
        }
      });

      // Save card if requested
      if (save_card && req.user) {
        await this.saveCardForUser(req.user.id, card_token);
      }

      // Create payment record
      await PaymentHistory.create({
        order_id: order.id,
        user_id: req.user?.id,
        payment_method: 'card',
        amount: order.total_amount,
        status: paymentIntent.status,
        transaction_ref: paymentIntent.id,
        payment_details: {
          last4: paymentIntent.payment_method_details.card.last4,
          brand: paymentIntent.payment_method_details.card.brand
        }
      });

      // Update order status
      await order.update({
        payment_status: paymentIntent.status === 'succeeded' ? 'paid' : 'pending',
        payment_id: paymentIntent.id
      });

      res.json({
        success: true,
        payment_intent: paymentIntent.client_secret,
        status: paymentIntent.status
      });
    } catch (error) {
      console.error('Card payment error:', error);
      res.status(400).json({
        message: error.message || 'Payment processing failed'
      });
    }
  }

  // Verify VNPay payment callback
  async verifyVNPayPayment(req, res) {
    try {
      const vnpParams = req.query;
      const secureHash = vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHashType;

      // Generate signature for verification
      const signData = Object.keys(vnpParams)
        .sort()
        .map(key => `${key}=${vnpParams[key]}`)
        .join('&');
      
      const hmac = crypto.createHmac('sha512', this.vnpayConfig.hashSecret);
      const calculatedHash = hmac.update(signData).digest('hex');

      if (secureHash !== calculatedHash) {
        throw new Error('Invalid signature');
      }

      const orderId = vnpParams.vnp_TxnRef.split('_')[0];
      const responseCode = vnpParams.vnp_ResponseCode;

      const paymentHistory = await PaymentHistory.findOne({
        where: {
          order_id: orderId,
          payment_method: 'vnpay',
          status: 'pending'
        }
      });

      if (!paymentHistory) {
        throw new Error('Payment record not found');
      }

      if (responseCode === '00') {
        // Payment successful
        await paymentHistory.update({ status: 'completed' });
        await Order.update(
          { payment_status: 'paid', payment_method: 'vnpay' },
          { where: { id: orderId } }
        );
      } else {
        // Payment failed
        await paymentHistory.update({ status: 'failed' });
      }

      // Redirect back to frontend with status
      res.redirect(`${config.frontendUrl}/payment/status?orderId=${orderId}&status=${responseCode === '00' ? 'success' : 'failed'}`);
    } catch (error) {
      console.error('VNPay verification error:', error);
      res.redirect(`${config.frontendUrl}/payment/status?status=error`);
    }
  }

  // Verify Momo payment callback
  async verifyMomoPayment(req, res) {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = req.body;

      // Verify signature
      const rawSignature = `partnerCode=${partnerCode}&accessKey=${this.momoConfig.accessKey}&requestId=${requestId}&amount=${amount}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&transId=${transId}&message=${message}&resultCode=${resultCode}&payType=${payType}&responseTime=${responseTime}&extraData=${extraData}`;
      
      const calculatedSignature = crypto
        .createHmac('sha256', this.momoConfig.secretKey)
        .update(rawSignature)
        .digest('hex');

      if (signature !== calculatedSignature) {
        throw new Error('Invalid signature');
      }

      const originalOrderId = orderId.split('_')[0];
      const paymentHistory = await PaymentHistory.findOne({
        where: {
          order_id: originalOrderId,
          payment_method: 'momo',
          status: 'pending'
        }
      });

      if (!paymentHistory) {
        throw new Error('Payment record not found');
      }

      if (resultCode === '0') {
        // Payment successful
        await paymentHistory.update({ status: 'completed' });
        await Order.update(
          { payment_status: 'paid', payment_method: 'momo' },
          { where: { id: originalOrderId } }
        );
      } else {
        // Payment failed
        await paymentHistory.update({ status: 'failed' });
      }

      res.json({ message: 'Payment verification processed' });
    } catch (error) {
      console.error('Momo verification error:', error);
      res.status(500).json({ message: 'Payment verification failed' });
    }
  }

  // Verify ZaloPay payment callback
  async verifyZaloPayPayment(req, res) {
    try {
      const {
        app_id,
        app_trans_id,
        amount,
        timestamp,
        description,
        embed_data,
        mac
      } = req.body;

      // Verify MAC
      const data = `${app_id}|${app_trans_id}|${amount}|${description}|${embed_data}|${timestamp}`;
      const expectedMac = crypto
        .createHmac('sha256', this.zalopayConfig.key2)
        .update(data)
        .digest('hex');

      if (mac !== expectedMac) {
        throw new Error('Invalid MAC');
      }

      const originalOrderId = app_trans_id.split('_')[0];
      const paymentHistory = await PaymentHistory.findOne({
        where: {
          order_id: originalOrderId,
          payment_method: 'zalopay',
          status: 'pending'
        }
      });

      if (!paymentHistory) {
        throw new Error('Payment record not found');
      }

      // Update payment status
      await paymentHistory.update({ status: 'completed' });
      await Order.update(
        { payment_status: 'paid', payment_method: 'zalopay' },
        { where: { id: originalOrderId } }
      );

      res.json({ return_code: 1, return_message: 'Success' });
    } catch (error) {
      console.error('ZaloPay verification error:', error);
      res.json({ return_code: -1, return_message: 'Failed to verify payment' });
    }
  }

  // Get saved cards
  async getSavedCards(req, res) {
    try {
      // In a real application, fetch saved cards from a secure payment service
      // For demo, return mock data
      const mockSavedCards = [
        {
          id: 'card_1',
          brand: 'visa',
          last4: '4242',
          expMonth: '12',
          expYear: '24'
        },
        {
          id: 'card_2',
          brand: 'mastercard',
          last4: '8210',
          expMonth: '08',
          expYear: '25'
        }
      ];

      res.json(mockSavedCards);
    } catch (error) {
      console.error('Error fetching saved cards:', error);
      res.status(500).json({ message: 'Failed to fetch saved cards' });
    }
  }

  // Delete saved card
  async deleteSavedCard(req, res) {
    try {
      const { cardId } = req.params;
      // In a real application, delete card from payment service
      // For demo, just return success
      res.json({ message: 'Card deleted successfully' });
    } catch (error) {
      console.error('Error deleting saved card:', error);
      res.status(500).json({ message: 'Failed to delete saved card' });
    }
  }

  // Verify payment callback
  async verifyPayment(req, res) {
    try {
      const { provider, transaction_ref } = req.params;
      const payment = await PaymentHistory.findOne({
        where: { transaction_ref }
      });

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      let verificationResult;
      
      switch (provider) {
        case 'momo':
          verificationResult = await this.verifyMomoPayment(req.body);
          break;
        case 'vnpay':
          verificationResult = await this.verifyVNPayPayment(req.query);
          break;
        case 'card':
          verificationResult = await this.verifyCardPayment(transaction_ref);
          break;
        default:
          throw new Error('Unsupported payment provider');
      }

      // Update payment status
      await payment.update({
        status: verificationResult.status,
        verification_data: verificationResult.data
      });

      // Update order status
      const order = await Order.findByPk(payment.order_id);
      if (order) {
        await order.update({
          payment_status: verificationResult.status === 'succeeded' ? 'paid' : 'failed'
        });
      }

      res.json({
        success: true,
        status: verificationResult.status
      });
    } catch (error) {
      console.error('Payment verification error:', error);
      res.status(400).json({
        message: error.message || 'Payment verification failed'
      });
    }
  }

  // Helper method to sort object by key
  sortObject(obj) {
    return Object.keys(obj)
      .sort()
      .reduce((result, key) => {
        result[key] = obj[key];
        return result;
      }, {});
  }

  // Helper methods for payment verification
  async verifyMomoPayment(payload) {
    // Verify Momo signature and payment status
    const { signature, requestId, orderId, resultCode, ...rest } = payload;
    const rawSignature = Object.entries(this.sortObject(rest))
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const checkSignature = crypto
      .createHmac('sha256', this.momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');

    if (signature !== checkSignature) {
      throw new Error('Invalid signature');
    }

    return {
      status: resultCode === '0' ? 'succeeded' : 'failed',
      data: payload
    };
  }

  async verifyVNPayPayment(params) {
    const secureHash = params.vnp_SecureHash;
    const { vnp_SecureHash, vnp_SecureHashType, ...rest } = params;
    
    const sortedParams = this.sortObject(rest);
    const signData = Object.entries(sortedParams)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    
    const hmac = crypto
      .createHmac('sha512', this.vnpayConfig.hashSecret)
      .update(signData)
      .digest('hex');

    if (secureHash !== hmac) {
      throw new Error('Invalid signature');
    }

    return {
      status: params.vnp_ResponseCode === '00' ? 'succeeded' : 'failed',
      data: params
    };
  }

  async verifyCardPayment(paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    return {
      status: paymentIntent.status,
      data: paymentIntent
    };
  }
}

module.exports = new PaymentController();