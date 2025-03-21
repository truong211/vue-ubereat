require('dotenv').config();

module.exports = {
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE,
    hashSecret: process.env.VNPAY_HASH_SECRET,
    apiUrl: process.env.VNPAY_API_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/api/payments/callback/vnpay'
  },
  momo: {
    partnerCode: process.env.MOMO_PARTNER_CODE,
    accessKey: process.env.MOMO_ACCESS_KEY,
    secretKey: process.env.MOMO_SECRET_KEY,
    apiUrl: process.env.MOMO_API_URL || 'https://test-payment.momo.vn/v2/gateway/api/create',
    notifyUrl: process.env.MOMO_NOTIFY_URL || 'http://localhost:3000/api/payments/callback/momo'
  },
  zalopay: {
    appId: process.env.ZALOPAY_APP_ID,
    key1: process.env.ZALOPAY_KEY1,
    key2: process.env.ZALOPAY_KEY2,
    apiUrl: process.env.ZALOPAY_API_URL || 'https://sandbox.zalopay.com.vn/v001/tpe/createorder',
    redirectUrl: process.env.ZALOPAY_REDIRECT_URL || 'http://localhost:3000/api/payments/callback/zalopay'
  },
  receipts: {
    uploadPath: process.env.RECEIPTS_UPLOAD_PATH || 'uploads/receipts',
    baseUrl: process.env.RECEIPTS_BASE_URL || 'http://localhost:3000/receipts'
  }
};