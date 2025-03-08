import { formatISO, parseISO, eachDayOfInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

class AnalyticsService {
  constructor() {
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes cache
    this.cachedData = new Map()
  }

  /**
   * Get earnings analytics
   */
  async getEarningsAnalytics(timeframe = 'week', date = new Date()) {
    const cacheKey = `earnings_${timeframe}_${formatISO(date)}`
    if (this.isCacheValid(cacheKey)) {
      return this.cachedData.get(cacheKey).data
    }

    try {
      const { start, end } = this.getTimeframeDates(timeframe, date)
      const response = await fetch(`/api/driver/analytics/earnings?start=${start}&end=${end}`)
      const data = await response.json()
      
      const processed = this.processEarningsData(data, timeframe)
      this.cacheData(cacheKey, processed)
      return processed
    } catch (error) {
      console.error('Failed to fetch earnings analytics:', error)
      throw error
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics(timeframe = 'week', date = new Date()) {
    const cacheKey = `performance_${timeframe}_${formatISO(date)}`
    if (this.isCacheValid(cacheKey)) {
      return this.cachedData.get(cacheKey).data
    }

    try {
      const { start, end } = this.getTimeframeDates(timeframe, date)
      const response = await fetch(`/api/driver/analytics/performance?start=${start}&end=${end}`)
      const data = await response.json()
      
      const processed = this.processPerformanceData(data, timeframe)
      this.cacheData(cacheKey, processed)
      return processed
    } catch (error) {
      console.error('Failed to fetch performance analytics:', error)
      throw error
    }
  }

  /**
   * Get detailed order statistics
   */
  async getOrderStatistics(timeframe = 'week', date = new Date()) {
    const cacheKey = `orders_${timeframe}_${formatISO(date)}`
    if (this.isCacheValid(cacheKey)) {
      return this.cachedData.get(cacheKey).data
    }

    try {
      const { start, end } = this.getTimeframeDates(timeframe, date)
      const response = await fetch(`/api/driver/analytics/orders?start=${start}&end=${end}`)
      const data = await response.json()
      
      const processed = this.processOrderData(data, timeframe)
      this.cacheData(cacheKey, processed)
      return processed
    } catch (error) {
      console.error('Failed to fetch order statistics:', error)
      throw error
    }
  }

  /**
   * Process earnings data into chart format
   */
  processEarningsData(data, timeframe) {
    const { start, end } = this.getTimeframeDates(timeframe)
    const days = eachDayOfInterval({ start: parseISO(start), end: parseISO(end) })
    
    const chartData = days.map(date => {
      const dayData = data.earnings.find(e => 
        e.date.startsWith(formatISO(date, { representation: 'date' }))
      ) || { total: 0, deliveries: 0, tips: 0, bonus: 0 }

      return {
        date: formatISO(date),
        total: dayData.total,
        deliveries: dayData.deliveries,
        tips: dayData.tips,
        bonus: dayData.bonus
      }
    })

    return {
      chart: chartData,
      summary: {
        total: data.summary.total,
        deliveries: data.summary.totalDeliveries,
        averagePerDelivery: data.summary.averagePerDelivery,
        averagePerHour: data.summary.averagePerHour,
        bestDay: data.summary.bestDay,
        tips: data.summary.totalTips,
        bonus: data.summary.totalBonus
      },
      trends: {
        weekOverWeek: data.trends.weekOverWeek,
        monthOverMonth: data.trends.monthOverMonth
      }
    }
  }

  /**
   * Process performance data into chart format
   */
  processPerformanceData(data, timeframe) {
    return {
      ratings: {
        average: data.ratings.average,
        total: data.ratings.total,
        distribution: data.ratings.distribution
      },
      metrics: {
        acceptanceRate: data.metrics.acceptanceRate,
        completionRate: data.metrics.completionRate,
        onTimeRate: data.metrics.onTimeRate,
        averageDeliveryTime: data.metrics.averageDeliveryTime
      },
      feedback: data.feedback.map(f => ({
        date: f.date,
        rating: f.rating,
        comment: f.comment,
        orderId: f.orderId
      })),
      issues: {
        total: data.issues.total,
        resolved: data.issues.resolved,
        categories: data.issues.categories
      }
    }
  }

  /**
   * Process order data into statistics
   */
  processOrderData(data, timeframe) {
    return {
      totals: {
        completed: data.totals.completed,
        cancelled: data.totals.cancelled,
        batch: data.totals.batch
      },
      averages: {
        deliveryTime: data.averages.deliveryTime,
        distancePerDelivery: data.averages.distancePerDelivery,
        batchSize: data.averages.batchSize
      },
      peakHours: data.peakHours.map(h => ({
        hour: h.hour,
        deliveries: h.deliveries,
        earnings: h.earnings
      })),
      areas: data.areas.map(a => ({
        name: a.name,
        deliveries: a.deliveries,
        earnings: a.earnings
      }))
    }
  }

  /**
   * Cache handling
   */
  isCacheValid(key) {
    const cached = this.cachedData.get(key)
    if (!cached) return false
    return Date.now() - cached.timestamp < this.cacheTimeout
  }

  cacheData(key, data) {
    this.cachedData.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Get date range for timeframe
   */
  getTimeframeDates(timeframe, date = new Date()) {
    switch (timeframe) {
      case 'day':
        return {
          start: formatISO(startOfDay(date)),
          end: formatISO(endOfDay(date))
        }
      case 'week':
        return {
          start: formatISO(startOfWeek(date, { weekStartsOn: 1 })),
          end: formatISO(endOfWeek(date, { weekStartsOn: 1 }))
        }
      case 'month':
        return {
          start: formatISO(startOfMonth(date)),
          end: formatISO(endOfMonth(date))
        }
      default:
        throw new Error('Invalid timeframe')
    }
  }

  /**
   * Calculate earnings projections
   */
  calculateProjections(historicalData) {
    const averageDaily = historicalData.reduce((sum, day) => sum + day.total, 0) / historicalData.length
    const trend = this.calculateTrend(historicalData)

    return {
      daily: averageDaily,
      weekly: averageDaily * 7,
      monthly: averageDaily * 30,
      yearly: averageDaily * 365,
      trend
    }
  }

  /**
   * Calculate earnings trend
   */
  calculateTrend(data) {
    const n = data.length
    if (n < 2) return 0

    let sumX = 0
    let sumY = 0
    let sumXY = 0
    let sumXX = 0

    data.forEach((point, i) => {
      sumX += i
      sumY += point.total
      sumXY += i * point.total
      sumXX += i * i
    })

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    return slope
  }

  /**
   * Format currency amounts
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  /**
   * Format percentages
   */
  formatPercentage(value) {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value)
  }

  /**
   * Format duration in minutes to human readable
   */
  formatDuration(minutes) {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }
}

export default new AnalyticsService()
