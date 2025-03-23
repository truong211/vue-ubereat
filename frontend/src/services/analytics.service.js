import { api } from '@/services/api';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

class AnalyticsService {
  /**
   * Get sales analytics data
   * @param {string} restaurantId Restaurant ID
   * @param {Object} options Query options
   * @returns {Promise<Object>} Analytics data
   */
  async getSalesAnalytics(restaurantId, options = {}) {
    const {
      startDate = subDays(new Date(), 30),
      endDate = new Date(),
      interval = 'daily'
    } = options

    try {
      const response = await api.get(`/analytics/sales/${restaurantId}`, {
        params: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd'),
          interval
        }
      })

      return this.processSalesData(response.data)
    } catch (error) {
      console.error('Failed to fetch sales analytics:', error)
      throw error
    }
  }

  /**
   * Get customer analytics data
   * @param {string} restaurantId Restaurant ID
   * @param {Object} options Query options
   * @returns {Promise<Object>} Analytics data
   */
  async getCustomerAnalytics(restaurantId, options = {}) {
    const { period = 'month' } = options;

    try {
      const response = await api.get(`/analytics/customers/${restaurantId}`, {
        params: { period }
      });

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch customer analytics:', error);
      throw error;
    }
  }

  /**
   * Get real-time performance metrics
   * @param {string} restaurantId Restaurant ID
   * @returns {Promise<Object>} Performance metrics
   */
  async getRealTimeMetrics(restaurantId) {
    try {
      const response = await api.get(`/analytics/realtime/${restaurantId}`)
      return this.processRealTimeData(response.data)
    } catch (error) {
      console.error('Failed to fetch real-time metrics:', error)
      throw error
    }
  }

  /**
   * Get menu item performance analytics
   * @param {string} restaurantId Restaurant ID
   * @param {Object} options Query options
   * @returns {Promise<Object>} Menu analytics data
   */
  async getMenuAnalytics(restaurantId, options = {}) {
    const {
      period = 'month',
      limit = 10
    } = options;

    try {
      const response = await api.get(`/analytics/menu/${restaurantId}`, {
        params: { period, limit }
      });

      return this.processMenuData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch menu analytics:', error);
      throw error;
    }
  }

  /**
   * Get delivery performance analytics
   * @param {string} restaurantId Restaurant ID
   * @param {Object} options Query options
   * @returns {Promise<Object>} Delivery analytics data
   */
  async getDeliveryAnalytics(restaurantId, options = {}) {
    const {
      startDate = subDays(new Date(), 30),
      endDate = new Date()
    } = options

    try {
      const response = await api.get(`/analytics/delivery/${restaurantId}`, {
        params: {
          startDate: format(startDate, 'yyyy-MM-dd'),
          endDate: format(endDate, 'yyyy-MM-dd')
        }
      })

      return this.processDeliveryData(response.data)
    } catch (error) {
      console.error('Failed to fetch delivery analytics:', error)
      throw error
    }
  }

  /**
   * Get revenue analytics data
   * @param {string} restaurantId Restaurant ID
   * @param {Object} options Query options
   * @returns {Promise<Object>} Analytics data
   */
  async getRevenueAnalytics(restaurantId, options = {}) {
    const {
      timeRange = 'week',
      startDate,
      endDate
    } = options;

    try {
      const response = await api.get(`/analytics/revenue/${restaurantId}`, {
        params: {
          timeRange,
          startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
          endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
        }
      });

      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Process sales analytics data
   * @param {Object} data Raw sales data
   * @returns {Object} Processed sales data
   */
  processSalesData(data) {
    const { daily, weekly, monthly } = data

    return {
      daily: this.aggregateTimeSeries(daily),
      weekly: this.aggregateTimeSeries(weekly),
      monthly: this.aggregateTimeSeries(monthly),
      trends: this.calculateTrends(daily),
      totals: this.calculateTotals(daily)
    }
  }

  /**
   * Process customer analytics data
   * @param {Object} data Raw customer data
   * @returns {Object} Processed customer data
   */
  processCustomerData(data) {
    const {
      newCustomers,
      returningCustomers,
      orderFrequency,
      customerLifetime,
      demographics
    } = data

    return {
      acquisition: {
        new: this.aggregateTimeSeries(newCustomers),
        returning: this.aggregateTimeSeries(returningCustomers)
      },
      engagement: {
        frequency: this.calculateFrequencyDistribution(orderFrequency),
        lifetime: this.calculateLifetimeValue(customerLifetime)
      },
      demographics: this.processDemographics(demographics)
    }
  }

  /**
   * Process real-time performance data
   * @param {Object} data Raw real-time data
   * @returns {Object} Processed real-time metrics
   */
  processRealTimeData(data) {
    const {
      activeOrders,
      preparationTimes,
      queueLength,
      deliveryTimes
    } = data

    return {
      currentLoad: {
        activeOrders: activeOrders.length,
        avgPrepTime: this.calculateAverage(preparationTimes),
        queueLength,
        deliveryETA: this.calculateDeliveryETA(deliveryTimes)
      },
      performance: {
        onTime: this.calculateOnTimePerformance(activeOrders),
        efficiency: this.calculateKitchenEfficiency(preparationTimes),
        utilization: this.calculateResourceUtilization(activeOrders)
      }
    }
  }

  /**
   * Process menu analytics data
   * @param {Object} data Raw menu data
   * @returns {Object} Processed menu analytics
   */
  processMenuData(data) {
    // Calculate percentages for category data
    const totalRevenue = data.categories.reduce((sum, cat) => sum + cat.totalRevenue, 0);
    
    return {
      ...data,
      categories: data.categories.map(cat => ({
        ...cat,
        percentage: totalRevenue > 0 ? (cat.totalRevenue / totalRevenue) * 100 : 0
      }))
    };
  }

  /**
   * Process delivery analytics data
   * @param {Object} data Raw delivery data
   * @returns {Object} Processed delivery analytics
   */
  processDeliveryData(data) {
    const {
      deliveryTimes,
      driverPerformance,
      customerFeedback,
      issues
    } = data

    return {
      timing: this.analyzeDeliveryTimes(deliveryTimes),
      drivers: this.analyzeDriverPerformance(driverPerformance),
      satisfaction: this.analyzeFeedback(customerFeedback),
      problems: this.categorizeIssues(issues)
    }
  }

  /**
   * Aggregate time series data
   * @param {Array} data Time series data
   * @returns {Object} Aggregated data
   */
  aggregateTimeSeries(data) {
    const aggregated = data.reduce((acc, entry) => {
      const date = format(new Date(entry.timestamp), 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = {
          revenue: 0,
          orders: 0,
          items: 0
        }
      }
      acc[date].revenue += entry.revenue
      acc[date].orders += entry.orders
      acc[date].items += entry.items
      return acc
    }, {})

    return Object.entries(aggregated).map(([date, values]) => ({
      date,
      ...values,
      averageOrderValue: values.revenue / values.orders
    }))
  }

  /**
   * Calculate trends from time series data
   * @param {Array} data Time series data
   * @returns {Object} Trend analysis
   */
  calculateTrends(data) {
    const periods = {
      daily: data.slice(-1)[0],
      weekly: data.slice(-7),
      monthly: data.slice(-30)
    }

    return {
      daily: this.calculateGrowth(periods.daily),
      weekly: this.calculateGrowth(periods.weekly),
      monthly: this.calculateGrowth(periods.monthly)
    }
  }

  /**
   * Calculate growth rates
   * @param {Array} data Period data
   * @returns {Object} Growth rates
   */
  calculateGrowth(data) {
    if (!Array.isArray(data)) {
      data = [data]
    }

    const current = data.reduce((sum, entry) => sum + entry.revenue, 0)
    const previous = data.reduce((sum, entry) => sum + entry.previousRevenue, 0)

    return {
      revenue: ((current - previous) / previous) * 100,
      orders: this.calculateOrderGrowth(data)
    }
  }

  /**
   * Calculate order growth rate
   * @param {Array} data Period data
   * @returns {number} Growth rate
   */
  calculateOrderGrowth(data) {
    const currentOrders = data.reduce((sum, entry) => sum + entry.orders, 0)
    const previousOrders = data.reduce((sum, entry) => sum + entry.previousOrders, 0)

    return ((currentOrders - previousOrders) / previousOrders) * 100
  }

  /**
   * Calculate totals from time series data
   * @param {Array} data Time series data
   * @returns {Object} Totals
   */
  calculateTotals(data) {
    return data.reduce((totals, entry) => ({
      revenue: totals.revenue + entry.revenue,
      orders: totals.orders + entry.orders,
      items: totals.items + entry.items,
      averageOrderValue: totals.revenue / totals.orders
    }), { revenue: 0, orders: 0, items: 0, averageOrderValue: 0 })
  }

  /**
   * Calculate average from array
   * @param {Array} values Number array
   * @returns {number} Average value
   */
  calculateAverage(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length
  }
}

export default new AnalyticsService()

import api from './api';

export const analyticsService = {
  async getRevenueAnalytics(restaurantId, params = {}) {
    const { data } = await api.get(`/analytics/revenue/${restaurantId}`, { params });
    return data;
  },

  async getMenuAnalytics(restaurantId, params = {}) {
    const { data } = await api.get(`/analytics/menu/${restaurantId}`, { params });
    return data;
  },

  async getCustomerAnalytics(restaurantId, params = {}) {
    const { data } = await api.get(`/analytics/customers/${restaurantId}`, { params });
    return data;
  }
};