const axios = require('axios');
const crypto = require('crypto');
const config = require('../config');
const { PaymentHistory, Order } = require('../models');

class PaymentService {
  constructor() {
    this.vnpayConfig = config.vnpay;
    this.momoConfig = config.momo;
    this.zalopayConfig = config.zalopay;
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
      vnp_Amount: order.total_amount * 100,
      vnp_ReturnUrl: `${config.baseUrl}/api/payments/callback/vnpay`,
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

    await this.savePaymentHistory(order.id, 'vnpay', order.total_amount, orderId);
    return vnpUrl.toString();
  }

  async initializeMomo(order) {
    const requestId = `${Date.now()}_${order.id}`;
    const orderId = `${order.id}_${Date.now()}`;
    
    const rawSignature = `partnerCode=${this.momoConfig.partnerCode}&accessKey=${this.momoConfig.accessKey}&requestId=${requestId}&amount=${order.total_amount}&orderId=${orderId}&orderInfo=Payment for order ${order.id}&returnUrl=${config.baseUrl}/api/payments/callback/momo&notifyUrl=${config.momo.notifyUrl}&extraData=`;
    
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
      returnUrl: `${config.baseUrl}/api/payments/callback/momo`,
      notifyUrl: config.momo.notifyUrl,
      extraData: '',
      requestType: 'captureMoMoWallet',
      signature: signature
    };

    const response = await axios.post(this.momoConfig.apiUrl, requestBody);
    await this.savePaymentHistory(order.id, 'momo', order.total_amount, orderId);
    return response.data.payUrl;
  }

  async initializeZaloPay(order) {
    const embedData = {
      redirecturl: `${config.baseUrl}/api/payments/callback/zalopay`
    };

    const items = [{
      itemid: order.id,
      itemname: `Order #${order.id}`,
      itemprice: order.total_amount,
      itemquantity: 1
    }];

    const transId = `${Date.now()}_${order.id}`;
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

    const data = `${this.zalopayConfig.appId}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
    const mac = crypto
      .createHmac('sha256', this.zalopayConfig.key1)
      .update(data)
      .digest('hex');

    orderData.mac = mac;

    const response = await axios.post(this.zalopayConfig.apiUrl, orderData);
    await this.savePaymentHistory(order.id, 'zalopay', order.total_amount, transId);
    return response.data.order_url;
  }

  async savePaymentHistory(orderId, method, amount, transactionRef) {
    return PaymentHistory.create({
      order_id: orderId,
      payment_method: method,
      amount: amount,
      status: 'pending',
      transaction_ref: transactionRef
    });
  }

  async verifyPayment(provider, transactionRef) {
    const payment = await PaymentHistory.findOne({
      where: { transaction_ref: transactionRef }
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

    await payment.update({
      status: verificationResult.status,
      verification_data: verificationResult.data
    });

    const order = await Order.findByPk(payment.order_id);
    if (order) {
      await order.update({
        payment_status: verificationResult.status === 'succeeded' ? 'paid' : 'failed'
      });
    }

    return verificationResult;
  }

  generateReceipt(payment) {
    // Implementation for receipt generation
    // This could be a PDF generation using libraries like PDFKit
    return {
      receiptNumber: `REC-${payment.id}`,
      transactionDate: payment.created_at,
      amount: payment.amount,
      paymentMethod: payment.payment_method,
      status: payment.status
    };
  }
}

module.exports = new PaymentService();