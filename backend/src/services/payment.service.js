const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');
const { PaymentHistory, Order } = require('../models');

class PaymentService {
  constructor() {
    this.vnpayConfig = config.paymentConfig.vnpay;
    this.momoConfig = config.paymentConfig.momo;
    this.zalopayConfig = config.paymentConfig.zalopay;
    this.baseUrl = config.paymentConfig.baseUrl;
  }

  async initializeVNPay(order) {
    const tmnCode = this.vnpayConfig.tmnCode;
    const date = new Date();
    const createDate = date.toISOString().split('T')[0].replace(/-/g, '');
    const orderId = `${order.id}_${Date.now()}`;

    const params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: `Payment for order ${order.id}`,
      vnp_OrderType: 'food_delivery',
      vnp_Amount: order.totalAmount * 100,
      vnp_ReturnUrl: `${this.baseUrl}/api/payments/callback/vnpay`,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate
    };

    const signData = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const hmac = crypto.createHmac('sha512', this.vnpayConfig.hashSecret);
    params.vnp_SecureHash = hmac.update(signData).digest('hex');

    const vnpUrl = new URL(this.vnpayConfig.apiUrl);
    Object.keys(params).forEach(key => vnpUrl.searchParams.append(key, params[key]));

    await this.savePaymentHistory(order.id, 'vnpay', order.totalAmount, orderId);
    return vnpUrl.toString();
  }

  async initializeMomo(order) {
    const requestId = `${Date.now()}_${order.id}`;
    const orderId = `${order.id}_${Date.now()}`;
    
    const rawSignature = `partnerCode=${this.momoConfig.partnerCode}&accessKey=${this.momoConfig.accessKey}&requestId=${requestId}&amount=${order.totalAmount}&orderId=${orderId}&orderInfo=Payment for order ${order.id}&returnUrl=${this.baseUrl}/api/payments/callback/momo&notifyUrl=${this.momoConfig.notifyUrl}&extraData=`;
    
    const signature = crypto
      .createHmac('sha256', this.momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.momoConfig.partnerCode,
      accessKey: this.momoConfig.accessKey,
      requestId: requestId,
      amount: order.totalAmount,
      orderId: orderId,
      orderInfo: `Payment for order ${order.id}`,
      returnUrl: `${this.baseUrl}/api/payments/callback/momo`,
      notifyUrl: this.momoConfig.notifyUrl,
      extraData: '',
      requestType: 'captureMoMoWallet',
      signature: signature
    };

    const response = await axios.post(this.momoConfig.apiUrl, requestBody);
    await this.savePaymentHistory(order.id, 'momo', order.totalAmount, orderId);
    return response.data.payUrl;
  }

  async initializeZaloPay(order) {
    const embedData = {
      redirecturl: `${this.baseUrl}/api/payments/callback/zalopay`
    };

    const items = [{
      itemid: order.id,
      itemname: `Order #${order.id}`,
      itemprice: order.totalAmount,
      itemquantity: 1
    }];

    const transId = `${Date.now()}_${order.id}`;
    const orderData = {
      app_id: this.zalopayConfig.appId,
      app_trans_id: transId,
      app_user: order.userId,
      app_time: Date.now(),
      amount: order.totalAmount,
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embedData),
      description: `Payment for order ${order.id}`
    };

    const data = `${this.zalopayConfig.appId}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
    const mac = crypto
      .createHmac('sha256', this.zalopayConfig.key1)
      .update(data)
      .digest('hex');

    orderData.mac = mac;

    const response = await axios.post(this.zalopayConfig.apiUrl, orderData);
    await this.savePaymentHistory(order.id, 'zalopay', order.totalAmount, transId);
    return response.data.order_url;
  }

  async savePaymentHistory(orderId, method, amount, transactionRef) {
    // Get the order to get the user ID
    const order = await Order.findByPk(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return PaymentHistory.create({
      orderId: orderId,
      userId: order.userId, // Get the user ID from the order
      amount: amount,
      paymentMethod: method,
      transactionId: transactionRef,
      status: 'pending',
      paymentDetails: JSON.stringify({
        transactionRef: transactionRef,
        gateway: method
      })
    });
  }

  async verifyPayment(provider, transactionRef) {
    const payment = await PaymentHistory.findOne({
      where: { transactionId: transactionRef }
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    let verificationResult;
    switch (provider) {
      case 'vnpay':
        verificationResult = await this.verifyVNPayPayment(transactionRef);
        break;
      case 'momo':
        verificationResult = await this.verifyMomoPayment(transactionRef);
        break;
      case 'zalopay':
        verificationResult = await this.verifyZaloPayPayment(transactionRef);
        break;
      default:
        throw new Error('Unsupported payment provider');
    }

    // Update the payment with the verification result
    payment.status = verificationResult.status;
    payment.gatewayResponse = JSON.stringify(verificationResult.data);
    await payment.save();

    const order = await Order.findByPk(payment.orderId);
    if (order) {
      order.payment_status = verificationResult.status === 'succeeded' ? 'paid' : 'failed';
      await order.save();
    }

    return verificationResult;
  }

  // Implement verification methods for each payment gateway
  async verifyVNPayPayment(transactionRef) {
    try {
      // Extract order ID from transaction reference
      const orderId = transactionRef.split('_')[0];
      
      // In a real app, we would call VNPay API to verify the payment
      // For this demo, we'll simulate a successful verification
      const params = {
        vnp_TmnCode: this.vnpayConfig.tmnCode,
        vnp_TxnRef: transactionRef,
      };
      
      // Build the verification URL
      const verifyUrl = new URL(`${this.vnpayConfig.apiUrl}/vnpay_query.html`);
      Object.keys(params).forEach(key => verifyUrl.searchParams.append(key, params[key]));
      
      // For demo/dev purposes, simulate a successful response
      // In production, you would actually call the API
      console.log(`Would verify VNPay payment at: ${verifyUrl.toString()}`);
      
      // Simulate API response
      const simulatedResponse = {
        vnp_ResponseCode: '00', // Success code
        vnp_TransactionStatus: '00', // Success status
        vnp_Amount: '100000', // Amount in VND cents
        vnp_TxnRef: transactionRef,
        vnp_OrderInfo: `Payment for order ${orderId}`
      };
      
      // Process the response
      const isSuccess = simulatedResponse.vnp_ResponseCode === '00' && 
                        simulatedResponse.vnp_TransactionStatus === '00';
                        
      return {
        status: isSuccess ? 'succeeded' : 'failed',
        data: simulatedResponse
      };
    } catch (error) {
      console.error('VNPay verification error:', error);
      return {
        status: 'failed',
        data: { error: error.message }
      };
    }
  }
  
  async verifyMomoPayment(transactionRef) {
    try {
      // Extract order ID from transaction reference
      const orderId = transactionRef.split('_')[0];
      
      // In a real app, we would call Momo API to verify the payment
      // For this demo, we'll simulate a successful verification
      const requestBody = {
        partnerCode: this.momoConfig.partnerCode,
        accessKey: this.momoConfig.accessKey,
        requestId: `query_${Date.now()}`,
        orderId: transactionRef,
        requestType: 'transactionStatus'
      };
      
      // Sign the request (in a real app)
      const rawSignature = `accessKey=${requestBody.accessKey}&orderId=${requestBody.orderId}&partnerCode=${requestBody.partnerCode}&requestId=${requestBody.requestId}&requestType=${requestBody.requestType}`;
      const signature = crypto
        .createHmac('sha256', this.momoConfig.secretKey)
        .update(rawSignature)
        .digest('hex');
      requestBody.signature = signature;
      
      // For demo/dev purposes, simulate a successful response
      // In production, you would actually call the API
      console.log(`Would verify Momo payment with data:`, requestBody);
      
      // Simulate API response
      const simulatedResponse = {
        partnerCode: this.momoConfig.partnerCode,
        orderId: transactionRef,
        requestId: requestBody.requestId,
        amount: 100000,
        responseTime: Date.now(),
        resultCode: 0, // Success code
        extraData: '',
        message: 'Success',
        orderInfo: `Payment for order ${orderId}`
      };
      
      // Process the response
      const isSuccess = simulatedResponse.resultCode === 0;
                        
      return {
        status: isSuccess ? 'succeeded' : 'failed',
        data: simulatedResponse
      };
    } catch (error) {
      console.error('Momo verification error:', error);
      return {
        status: 'failed',
        data: { error: error.message }
      };
    }
  }
  
  async verifyZaloPayPayment(transactionRef) {
    try {
      // In a real app, we would call ZaloPay API to verify the payment
      // For this demo, we'll simulate a successful verification
      const requestData = {
        app_id: this.zalopayConfig.appId,
        app_trans_id: transactionRef
      };
      
      // Sign the request (in a real app)
      const data = `${requestData.app_id}|${requestData.app_trans_id}|${this.zalopayConfig.key1}`;
      const mac = crypto
        .createHmac('sha256', this.zalopayConfig.key1)
        .update(data)
        .digest('hex');
      requestData.mac = mac;
      
      // For demo/dev purposes, simulate a successful response
      // In production, you would actually call the API
      console.log(`Would verify ZaloPay payment with data:`, requestData);
      
      // Simulate API response
      const simulatedResponse = {
        return_code: 1, // Success code
        return_message: "Success",
        sub_return_code: 1,
        sub_return_message: "Success",
        app_trans_id: transactionRef,
        zp_trans_id: `ZP${Date.now()}`,
        amount: 100000,
        channel: 36,
        merchant_user_id: "user123",
        user_fee_amount: 0,
        discount_amount: 0
      };
      
      // Process the response
      const isSuccess = simulatedResponse.return_code === 1;
                        
      return {
        status: isSuccess ? 'succeeded' : 'failed',
        data: simulatedResponse
      };
    } catch (error) {
      console.error('ZaloPay verification error:', error);
      return {
        status: 'failed',
        data: { error: error.message }
      };
    }
  }

  generateReceipt(payment) {
    // Implementation for receipt generation
    // This could be a PDF generation using libraries like PDFKit
    return {
      receiptNumber: `REC-${payment.id}`,
      transactionDate: payment.createdAt,
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      status: payment.status
    };
  }
}

module.exports = new PaymentService();