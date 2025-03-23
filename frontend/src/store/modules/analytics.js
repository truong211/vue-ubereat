import analyticsService from '@/services/analytics.service'

export default {
  namespaced: true,

  state: () => ({
    categoryData: [],
    timeSeriesData: [],
    metrics: {
      revenue: 0,
      orders: 0,
      avgOrderValue: 0,
      cancelRate: 0
    },
    topItems: [],
    customerMetrics: {
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0
    },
    loading: false,
    error: null
  }),

  mutations: {
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    },
    setCategoryData(state, data) {
      state.categoryData = data
    },
    setTimeSeriesData(state, data) {
      state.timeSeriesData = data
    },
    setMetrics(state, metrics) {
      state.metrics = metrics
    },
    setTopItems(state, items) {
      state.topItems = items
    },
    setCustomerMetrics(state, metrics) {
      state.customerMetrics = metrics
    }
  },

  actions: {
    async fetchAnalytics({ commit }, { restaurantId, timeRange }) {
      try {
        commit('setLoading', true)
        commit('setError', null)

        const [revenueData, customerData, menuData] = await Promise.all([
          analyticsService.getRevenueAnalytics(restaurantId, { timeRange }),
          analyticsService.getCustomerAnalytics(restaurantId, { period: timeRange }),
          analyticsService.getMenuAnalytics(restaurantId, { period: timeRange })
        ])

        commit('setMetrics', revenueData.summary)
        commit('setTimeSeriesData', revenueData.timeSeriesData)
        commit('setTopItems', revenueData.topItems)
        commit('setCustomerMetrics', customerData)
        commit('setCategoryData', menuData.categories)
      } catch (error) {
        commit('setError', error.message)
        console.error('Error fetching analytics:', error)
      } finally {
        commit('setLoading', false)
      }
    }
  },

  getters: {
    isLoading: state => state.loading,
    hasError: state => !!state.error,
    errorMessage: state => state.error,
    totalRevenue: state => state.metrics.revenue,
    totalOrders: state => state.metrics.orders,
    averageOrderValue: state => state.metrics.avgOrderValue,
    cancelRate: state => state.metrics.cancelRate
  }
}