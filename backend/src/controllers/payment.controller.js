const { validationResult } = require('express-validator');
const { Order, PaymentHistory } = require('../models');
const { AppError } = require('../middleware/error.middleware');
const PaymentService = require('../services/payment.service');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PaymentController {
  async processPayment(req, res, next) {
    try {
      const { orderId, method } = req.body;
      const order = await Order.findByPk(orderId);

      if (!order) {
        return next(new AppError('Order not found', 404));
      }

      let redirectUrl;
      switch (method) {
        case 'vnpay':
          redirectUrl = await PaymentService.initializeVNPay(order);
          break;
        case 'momo':
          redirectUrl = await PaymentService.initializeMomo(order);
          break;
        case 'zalopay':
          redirectUrl = await PaymentService.initializeZaloPay(order);
          break;
        default:
          return next(new AppError('Invalid payment method', 400));
      }

      res.json({ redirect_url: redirectUrl });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }

  async verifyPayment(req, res, next) {
    try {
      const { provider, transactionRef } = req.params;
      const result = await PaymentService.verifyPayment(provider, transactionRef);
      
      res.json({
        success: true,
        status: result.status,
        data: result.data
      });
    } catch (error) {
      next(new AppError(error.message, 400));
    }
  }

  async generateReceipt(req, res, next) {
    try {
      const { id } = req.params;
      const payment = await PaymentHistory.findByPk(id);

      if (!payment) {
        return next(new AppError('Payment not found', 404));
      }

      const order = payment.orderId ? await Order.findByPk(payment.orderId) : null;
      payment.order = order;

      if (payment.status !== 'succeeded' && payment.status !== 'completed') {
        return next(new AppError('Cannot generate receipt for incomplete payment', 400));
      }

      const doc = new PDFDocument();
      const fileName = `receipt-${payment.id}.pdf`;
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'receipts', fileName);

      const dir = path.join(__dirname, '..', '..', 'uploads', 'receipts');
      if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
      }

      doc.pipe(fs.createWriteStream(filePath));

      doc.fontSize(25).text('Payment Receipt', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12);
      doc.text(`Receipt Number: REC-${payment.id}`);
      doc.text(`Order Number: ${order ? order.id : 'N/A'}`);
      doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`);
      doc.text(`Amount: ${payment.amount.toFixed(2)} VND`);
      doc.text(`Payment Method: ${payment.paymentMethod.toUpperCase()}`);
      doc.text(`Status: ${payment.status}`);

      doc.end();

      res.json({
        success: true,
        receipt_url: `/receipts/${fileName}`
      });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }

  async downloadReceipt(req, res, next) {
    try {
      const { id } = req.params;
      const fileName = `receipt-${id}.pdf`;
      const filePath = path.join(__dirname, '..', '..', 'uploads', 'receipts', fileName);

      if (!fs.existsSync(filePath)) {
        return next(new AppError('Receipt not found', 404));
      }

      res.download(filePath, fileName);
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }

  async reconcilePayments(req, res, next) {
    try {
      const startDate = req.query.start_date ? new Date(req.query.start_date) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = req.query.end_date ? new Date(req.query.end_date) : new Date();

      const payments = await PaymentHistory.findAll({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const reconciliationResults = await Promise.all(
        payments.map(async (payment) => {
          if (payment.status === 'pending') {
            try {
              const result = await PaymentService.verifyPayment(
                payment.paymentMethod,
                payment.transactionId
              );
              return {
                payment_id: payment.id,
                status: result.status,
                reconciled: true
              };
            } catch (error) {
              return {
                payment_id: payment.id,
                status: 'failed',
                reconciled: false,
                error: error.message
              };
            }
          }
          return {
            payment_id: payment.id,
            status: payment.status,
            reconciled: false,
            reason: 'Payment not in pending state'
          };
        })
      );

      res.json({
        success: true,
        results: reconciliationResults
      });
    } catch (error) {
      next(new AppError(error.message, 500));
    }
  }
}

module.exports = new PaymentController();