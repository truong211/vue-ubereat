const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { PaymentHistory, Order, User, Restaurant } = require('../models');
const config = require('../config');
const qrcode = require('qrcode');
const moment = require('moment');

class PaymentReceiptService {
  /**
   * Generate a payment receipt PDF for an order
   * @param {string} orderId - The order ID
   * @param {string} paymentId - The payment history ID
   * @returns {Promise<string>} - The path to the generated PDF
   */
  async generateReceipt(orderId, paymentId) {
    try {
      // Get payment and order details with related data
      const payment = await PaymentHistory.findByPk(paymentId, {
        include: [
          {
            model: Order,
            as: 'order',
            include: [
              {
                model: User,
                as: 'customer',
                attributes: ['id', 'fullName', 'email', 'phone']
              },
              {
                model: Restaurant,
                as: 'restaurant',
                attributes: ['id', 'name', 'address', 'phone', 'taxId']
              }
            ]
          }
        ]
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      const order = payment.order;
      
      // Create receipts directory if it doesn't exist
      const receiptDir = path.join(__dirname, '../../uploads/receipts');
      if (!fs.existsSync(receiptDir)) {
        fs.mkdirSync(receiptDir, { recursive: true });
      }

      // Define receipt file path
      const receiptFilename = `receipt_${order.id}_${payment.id}.pdf`;
      const receiptPath = path.join(receiptDir, receiptFilename);
      
      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      // Pipe to file
      doc.pipe(fs.createWriteStream(receiptPath));
      
      // Add logo (if exists)
      const logoPath = path.join(__dirname, '../../public/img/logo.png');
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 50, 45, { width: 150 });
      } else {
        doc.fontSize(24).text('Food Delivery', 50, 45);
      }
      
      // Add receipt title
      doc.fontSize(20)
         .text('PAYMENT RECEIPT', 50, 160, { align: 'center' })
         .moveDown();

      // Add horizontal line
      doc.strokeColor('#999999').lineWidth(1).moveTo(50, 190).lineTo(550, 190).stroke();
      
      // Add receipt information
      doc.fontSize(12).fillColor('#444444');
      
      // Add payment details
      doc.text(`Receipt No: ${payment.id}`, 50, 210)
         .text(`Order ID: #${order.id}`, 50, 230)
         .text(`Date: ${moment(payment.updatedAt).format('MMM DD, YYYY HH:mm')}`, 50, 250)
         .text(`Status: ${this.formatStatus(payment.status)}`, 50, 270)
         .moveDown();
      
      // Add customer information
      doc.fontSize(14).fillColor('#444444').text('Customer Information', 50, 310);
      doc.fontSize(12)
         .text(`Customer: ${order.customer?.fullName || 'Guest'}`, 50, 330)
         .text(`Email: ${order.customer?.email || 'N/A'}`, 50, 350)
         .text(`Phone: ${order.customer?.phone || 'N/A'}`, 50, 370)
         .moveDown();
      
      // Add restaurant information
      doc.fontSize(14).fillColor('#444444').text('Restaurant Information', 300, 310);
      doc.fontSize(12)
         .text(`Restaurant: ${order.restaurant?.name || 'N/A'}`, 300, 330)
         .text(`Address: ${order.restaurant?.address || 'N/A'}`, 300, 350)
         .text(`Phone: ${order.restaurant?.phone || 'N/A'}`, 300, 370)
         .moveDown();
      
      // Add horizontal line
      doc.strokeColor('#999999').lineWidth(1).moveTo(50, 400).lineTo(550, 400).stroke();
      
      // Add payment details header
      doc.fontSize(14).fillColor('#444444').text('Payment Details', 50, 420);
      
      // Add payment method icon
      const paymentMethodIcon = this.getPaymentMethodIcon(payment.payment_method);
      if (paymentMethodIcon) {
        const iconPath = path.join(__dirname, `../../public/img/payment/${paymentMethodIcon}`);
        if (fs.existsSync(iconPath)) {
          doc.image(iconPath, 350, 420, { width: 30 });
        }
      }
      
      // Add payment method and amount
      doc.fontSize(12)
         .text(`Payment Method: ${this.formatPaymentMethod(payment.payment_method)}`, 50, 450)
         .text(`Transaction Reference: ${payment.transaction_ref || 'N/A'}`, 50, 470)
         .text(`Amount: ${this.formatCurrency(payment.amount)}`, 50, 490)
         .text(`Time: ${moment(payment.updatedAt).format('HH:mm:ss')}`, 50, 510)
         .moveDown();
      
      // Add horizontal line
      doc.strokeColor('#999999').lineWidth(1).moveTo(50, 540).lineTo(550, 540).stroke();
      
      // Add QR code with payment details
      const qrData = JSON.stringify({
        receiptId: payment.id,
        orderId: order.id,
        amount: payment.amount,
        method: payment.payment_method,
        date: payment.updatedAt,
        verificationUrl: `${config.baseUrl}/api/payments/verify/${payment.id}`
      });
      
      // Generate QR code
      const qrCodeDataUrl = await this.generateQRCode(qrData);
      
      // Add QR code
      doc.image(qrCodeDataUrl, 400, 550, { width: 100 })
         .fontSize(10).fillColor('#666666')
         .text('Scan to verify payment', 400, 655, { width: 100, align: 'center' });
      
      // Add verification text
      doc.fontSize(10).fillColor('#666666')
         .text(`This receipt can be verified at ${config.baseUrl}/api/payments/verify/${payment.id}`, 50, 600)
         .moveDown();
      
      // Add footer
      doc.fontSize(10).fillColor('#666666')
         .text('Thank you for your order!', 50, 650, { align: 'center' })
         .text(`Generated on ${moment().format('MMM DD, YYYY HH:mm:ss')}`, 50, 670, { align: 'center' })
         .text('This is an automatically generated receipt and does not require a signature.', 50, 690, { align: 'center' });
      
      // Finalize PDF file
      doc.end();
      
      // Return the path to the generated receipt
      return {
        filePath: receiptPath,
        fileName: receiptFilename,
        url: `${config.baseUrl}/uploads/receipts/${receiptFilename}`
      };
    } catch (error) {
      console.error('Error generating receipt:', error);
      throw error;
    }
  }

  /**
   * Generate a QR code for payment verification
   * @param {string} data - Data to encode in QR code
   * @returns {Promise<string>} - Base64 encoded data URL
   */
  async generateQRCode(data) {
    try {
      return await qrcode.toDataURL(data);
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw error;
    }
  }

  /**
   * Format payment status for display
   * @param {string} status - Payment status
   * @returns {string} - Formatted status
   */
  formatStatus(status) {
    const statusMap = {
      'pending': 'Pending',
      'completed': 'Completed',
      'succeeded': 'Succeeded',
      'failed': 'Failed',
      'refunded': 'Refunded',
      'cancelled': 'Cancelled'
    };
    
    return statusMap[status] || status;
  }

  /**
   * Format payment method for display
   * @param {string} method - Payment method
   * @returns {string} - Formatted method
   */
  formatPaymentMethod(method) {
    const methodMap = {
      'vnpay': 'VNPay',
      'momo': 'MoMo',
      'zalopay': 'ZaloPay',
      'card': 'Credit/Debit Card',
      'cash': 'Cash on Delivery'
    };
    
    return methodMap[method] || method;
  }

  /**
   * Format currency for display
   * @param {number} amount - Payment amount
   * @returns {string} - Formatted currency
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  /**
   * Get payment method icon filename
   * @param {string} method - Payment method
   * @returns {string} - Icon filename
   */
  getPaymentMethodIcon(method) {
    const iconMap = {
      'vnpay': 'vnpay.png',
      'momo': 'momo.png',
      'zalopay': 'zalopay.png',
      'card': 'card.png',
      'cash': 'cash.png'
    };
    
    return iconMap[method] || null;
  }
}

module.exports = new PaymentReceiptService();