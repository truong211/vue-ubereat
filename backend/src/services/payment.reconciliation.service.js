const db = require('../config/database');
const logger = require('../utils/logger');

class PaymentReconciliationService {
  constructor() {
    this.pendingReconciliations = new Map();
  }
  
  async reconcilePayment(orderId, paymentData) {
    try {
      // Get payment history for the order
      const paymentHistory = await db.query(
        'SELECT * FROM payment_history WHERE orderId = ? ORDER BY createdAt DESC LIMIT 1',
        [orderId]
      );
      
      if (!paymentHistory || paymentHistory.length === 0) {
        logger.error(`No payment history found for order ${orderId}`);
        return { success: false, message: 'No payment history found' };
      }
      
      const payment = paymentHistory[0];
      
      // Get order details
      const [order] = await db.query(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );
      
      if (!order) {
        logger.error(`Order not found: ${orderId}`);
        return { success: false, message: 'Order not found' };
      }
      
      // Check for discrepancy
      const orderAmount = parseFloat(order.totalAmount);
      const paidAmount = parseFloat(payment.amount);
      const discrepancy = Math.abs(orderAmount - paidAmount);
      
      // Record reconciliation result
      const reconciliationData = {
        orderId,
        paymentId: payment.id,
        orderAmount,
        paidAmount,
        discrepancy,
        isReconciled: discrepancy <= 0.01, // Allow small rounding differences
        notes: discrepancy > 0.01 ? 'Amount mismatch detected' : 'Successfully reconciled',
        reconciledAt: new Date(),
        paymentReference: paymentData.reference || payment.transactionId
      };
      
      // Log the reconciliation result
      logger.info(`Payment reconciliation for order ${orderId}: ${JSON.stringify(reconciliationData)}`);
      
      // Update payment status if necessary
      if (reconciliationData.isReconciled && payment.status !== 'completed') {
        await db.query(
          'UPDATE payment_history SET status = ? WHERE id = ?',
          ['completed', payment.id]
        );
        
        // Also update order payment status
        await db.query(
          'UPDATE orders SET paymentStatus = ? WHERE id = ?',
          ['paid', orderId]
        );
      } else if (!reconciliationData.isReconciled) {
        // Flag discrepancy for review
        this.pendingReconciliations.set(orderId, reconciliationData);
        
        // Create notification for admin
        await db.query(
          `INSERT INTO notifications (userId, title, message, type, data) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            1, // Admin user ID
            'Payment Discrepancy',
            `Order #${order.orderNumber} has a payment discrepancy of ${discrepancy.toFixed(2)}`,
            'payment_alert',
            JSON.stringify(reconciliationData)
          ]
        );
      }
      
      return {
        success: true,
        isReconciled: reconciliationData.isReconciled,
        discrepancy: discrepancy > 0.01 ? discrepancy.toFixed(2) : 0,
        message: reconciliationData.notes
      };
    } catch (error) {
      logger.error(`Payment reconciliation error: ${error.message}`, { orderId, error });
      return { success: false, message: 'Reconciliation error', error: error.message };
    }
  }
  
  async getPendingReconciliations() {
    return Array.from(this.pendingReconciliations.values());
  }
  
  async resolvePendingReconciliation(orderId, resolution) {
    if (!this.pendingReconciliations.has(orderId)) {
      return { success: false, message: 'No pending reconciliation found' };
    }
    
    const reconciliation = this.pendingReconciliations.get(orderId);
    
    try {
      // Update payment history with resolution
      await db.query(
        `UPDATE payment_history 
         SET status = ?, notes = ? 
         WHERE orderId = ?`,
        [
          resolution.action === 'approve' ? 'completed' : 'failed',
          `Manually ${resolution.action}d by admin: ${resolution.notes}`,
          orderId
        ]
      );
      
      // Update order status
      if (resolution.action === 'approve') {
        await db.query(
          'UPDATE orders SET paymentStatus = ? WHERE id = ?',
          ['paid', orderId]
        );
      } else {
        await db.query(
          'UPDATE orders SET paymentStatus = ?, status = ? WHERE id = ?',
          ['failed', 'cancelled', orderId]
        );
      }
      
      // Remove from pending list
      this.pendingReconciliations.delete(orderId);
      
      // Log the resolution
      logger.info(`Payment reconciliation for order ${orderId} resolved: ${resolution.action}`);
      
      return { 
        success: true, 
        message: `Reconciliation ${resolution.action}d`,
        orderId
      };
    } catch (error) {
      logger.error(`Error resolving reconciliation: ${error.message}`, { orderId, error });
      return { success: false, message: 'Resolution error', error: error.message };
    }
  }
  
  async auditPayments(startDate, endDate) {
    try {
      const payments = await db.query(
        `SELECT 
           p.*, o.orderNumber, o.totalAmount as orderAmount 
         FROM 
           payment_history p
         JOIN 
           orders o ON p.orderId = o.id
         WHERE 
           p.createdAt BETWEEN ? AND ?`,
        [startDate, endDate]
      );
      
      const auditResults = {
        totalPayments: payments.length,
        reconciled: 0,
        discrepancies: 0,
        totalAmount: 0,
        discrepancyAmount: 0
      };
      
      const discrepancies = [];
      
      for (const payment of payments) {
        const orderAmount = parseFloat(payment.orderAmount);
        const paidAmount = parseFloat(payment.amount);
        const difference = Math.abs(orderAmount - paidAmount);
        
        auditResults.totalAmount += paidAmount;
        
        if (difference > 0.01) {
          auditResults.discrepancies++;
          auditResults.discrepancyAmount += difference;
          
          discrepancies.push({
            orderId: payment.orderId,
            orderNumber: payment.orderNumber,
            paymentId: payment.id,
            orderAmount,
            paidAmount,
            difference,
            date: payment.createdAt
          });
        } else {
          auditResults.reconciled++;
        }
      }
      
      return {
        summary: auditResults,
        discrepancies
      };
    } catch (error) {
      logger.error(`Payment audit error: ${error.message}`, { startDate, endDate, error });
      throw error;
    }
  }
}

module.exports = new PaymentReconciliationService();