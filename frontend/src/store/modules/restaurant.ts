import { Module } from 'vuex'
import axios from 'axios'

interface AnalyticsSummary {
  revenue: number
  revenueChange: number
  orders: number
  ordersChange: number
  avgOrderValue: number
  avgOrderChange: number
  cancelRate: number
  cancelRateChange: number
}

interface TopItem {
  id: string
  name: string
  image: string
  quantity: number
  revenue: number
  trend: number
}

interface PerformanceMetric {
  name: string
  value: number
  unit: string
  percentage: number
}

interface TimeSeriesData {
  date: string
  revenue: number
  orders: number
}

interface AnalyticsState {
  summary: AnalyticsSummary
  topItems: TopItem[]
  metrics: PerformanceMetric[]
  timeSeriesData: TimeSeriesData[]
  loading: boolean
  error: string | null
}

const restaurantModule: Module<AnalyticsState, any> = {
  namespaced: true,

  state: () => ({
    summary: {
      revenue: 0,
      revenueChange: 0,
      orders: 0,
      ordersChange: 0,
      avgOrderValue: 0,
      avgOrderChange: 0,
      cancelRate: 0,
      cancelRateChange: 0
    },
    topItems: [],
    metrics: [],
    timeSeriesData: [],
    loading: false,
    error: null
  }),

  mutations: {
    SET_ANALYTICS_DATA(state, data) {
      state.summary = data.summary
      state.topItems = data.topItems
      state.metrics = data.metrics
      state.timeSeriesData = data.timeSeriesData
    },
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    SET_ERROR(state, error) {
      state.error = error
    }
  },

  actions: {
    async getAnalytics({ commit }, params) {
      commit('SET_LOADING', true)
      commit('SET_ERROR', null)

      try {
        const response = await axios.get('/api/restaurant/analytics', { params })
        commit('SET_ANALYTICS_DATA', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    },

    async getTimeSeriesData({ commit }, params) {
      try {
        const response = await axios.get('/api/restaurant/analytics/timeseries', { params })
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    async getTopItems({ commit }, params) {
      try {
        const response = await axios.get('/api/restaurant/analytics/top-items', { params })
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    },

    async getPerformanceMetrics({ commit }, params) {
      try {
        const response = await axios.get('/api/restaurant/analytics/metrics', { params })
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message)
        throw error
      }
    }
  },

  getters: {
    isLoading: (state) => state.loading,
    hasError: (state) => state.error !== null,
    errorMessage: (state) => state.error,
    summary: (state) => state.summary,
    topItems: (state) => state.topItems,
    metrics: (state) => state.metrics,
    timeSeriesData: (state) => state.timeSeriesData,

    revenueData: (state) => ({
      labels: state.timeSeriesData.map(d => d.date),
      revenues: state.timeSeriesData.map(d => d.revenue),
      orders: state.timeSeriesData.map(d => d.orders)
    }),

    metricsWithTrends: (state) => {
      return state.metrics.map(metric => ({
        ...metric,
        trend: calculateTrend(metric.value, metric.previousValue)
      }))
    }
  }
}

function calculateTrend(current: number, previous: number): number {
  if (!previous) return 0
  return ((current - previous) / previous) * 100
}

export default restaurantModule