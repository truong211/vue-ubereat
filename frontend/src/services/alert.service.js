import api from './api.service'
import { format } from 'date-fns'

class AlertService {
  /**
   * Get delayed orders
   * @param {Object} options Query options
   * @returns {Promise<Array>} Delayed orders
   */
  async getDelayedOrders(options = {}) {
    try {
      const response = await api.get('/alerts/delayed-orders', { params: options })
      return this.processDelayedOrders(response.data)
    } catch (error) {
      console.error('Failed to fetch delayed orders:', error)
      throw error
    }
  }

  /**
   * Get customer complaints
   * @param {Object} options Query options
   * @returns {Promise<Array>} Customer complaints
   */
  async getComplaints(options = {}) {
    try {
      const response = await api.get('/alerts/complaints', { params: options })
      return this.processComplaints(response.data)
    } catch (error) {
      console.error('Failed to fetch complaints:', error)
      throw error
    }
  }

  /**
   * Get system alerts
   * @returns {Promise<Array>} System alerts
   */
  async getSystemAlerts() {
    try {
      const response = await api.get('/alerts/system')
      return this.processSystemAlerts(response.data)
    } catch (error) {
      console.error('Failed to fetch system alerts:', error)
      throw error
    }
  }

  /**
   * Process delayed orders data
   * @param {Array} orders Raw delayed orders data
   * @returns {Array} Processed delayed orders
   */
  processDelayedOrders(orders) {
    return orders.map(order => ({
      id: order.id,
      restaurant: order.restaurant,
      customer: order.customer,
      expectedTime: new Date(order.expectedTime),
      currentDelay: this.calculateDelay(order.expectedTime),
      status: order.status,
      priority: this.calculatePriority(order.expectedTime, order.type)
    }))
  }

  /**
   * Process customer complaints data
   * @param {Array} complaints Raw complaints data
   * @returns {Array} Processed complaints
   */
  processComplaints(complaints) {
    return complaints.map(complaint => ({
      id: complaint.id,
      orderId: complaint.orderId,
      customer: complaint.customer,
      type: complaint.type,
      description: complaint.description,
      timestamp: new Date(complaint.timestamp),
      status: complaint.status,
      priority: this.calculateComplaintPriority(complaint.type)
    }))
  }

  /**
   * Process system alerts data
   * @param {Array} alerts Raw system alerts data
   * @returns {Array} Processed system alerts
   */
  processSystemAlerts(alerts) {
    return alerts.map(alert => ({
      id: alert.id,
      type: alert.type,
      message: alert.message,
      timestamp: new Date(alert.timestamp),
      severity: alert.severity,
      status: alert.status
    }))
  }

  /**
   * Calculate delay in minutes
   * @param {string} expectedTime Expected delivery time
   * @returns {number} Delay in minutes
   */
  calculateDelay(expectedTime) {
    const expected = new Date(expectedTime)
    const now = new Date()
    return Math.max(0, Math.floor((now - expected) / (1000 * 60)))
  }

  /**
   * Calculate priority level for delayed orders
   * @param {string} expectedTime Expected delivery time
   * @param {string} orderType Order type
   * @returns {string} Priority level
   */
  calculatePriority(expectedTime, orderType) {
    const delayMinutes = this.calculateDelay(expectedTime)
    
    if (delayMinutes > 30) return 'critical'
    if (delayMinutes > 15) return 'high'
    if (delayMinutes > 5) return 'medium'
    return 'low'
  }

  /**
   * Calculate priority level for complaints
   * @param {string} complaintType Type of complaint
   * @returns {string} Priority level
   */
  calculateComplaintPriority(complaintType) {
    const priorityMap = {
      'food_quality': 'high',
      'delivery_time': 'high',
      'missing_items': 'medium',
      'wrong_order': 'medium',
      'driver_behavior': 'high',
      'app_issues': 'low'
    }
    
    return priorityMap[complaintType] || 'medium'
  }
}

export default new AlertService()