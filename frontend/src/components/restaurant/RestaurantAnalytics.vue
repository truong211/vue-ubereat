<template>
  <div class="restaurant-analytics">
    <!-- Time Period Selector -->
    <div class="d-flex align-center mb-4">
      <v-btn-toggle
        v-model="timeRange"
        mandatory
        class="mr-4"
      >
        <v-btn value="today">Today</v-btn>
        <v-btn value="week">Week</v-btn>
        <v-btn value="month">Month</v-btn>
        <v-btn value="custom">Custom</v-btn>
      </v-btn-toggle>

      <v-dialog v-model="showDatePicker" max-width="300">
        <template v-slot:activator="{ props }">
          <v-btn
            v-if="timeRange === 'custom'"
            v-bind="props"
            variant="outlined"
            prepend-icon="mdi-calendar"
          >
            {{ formatDateRange(startDate, endDate) }}
          </v-btn>
        </template>

        <v-card>
          <v-card-text>
            <v-date-picker
              v-model="dateRange"
              range
              @update:modelValue="updateDateRange"
            ></v-date-picker>
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-spacer></v-spacer>

      <v-btn
        icon="mdi-refresh"
        variant="text"
        :loading="isLoading"
        @click="refreshData"
      >
        <v-tooltip activator="parent" location="top">
          Refresh Data
        </v-tooltip>
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="metric-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-overline mb-1">Revenue</div>
                <div class="text-h4">${{ formatNumber(metrics.revenue) }}</div>
              </div>
              <v-icon
                size="48"
                :color="getTrendColor(metrics.revenueTrend)"
              >
                {{ getTrendIcon(metrics.revenueTrend) }}
              </v-icon>
            </div>
            <div class="mt-2 d-flex align-center">
              <v-icon
                size="16"
                :color="getTrendColor(metrics.revenueTrend)"
                class="mr-1"
              >
                {{ metrics.revenueTrend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span :class="`${getTrendColor(metrics.revenueTrend)}--text`">
                {{ Math.abs(metrics.revenueTrend) }}% from previous period
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="metric-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-overline mb-1">Orders</div>
                <div class="text-h4">{{ formatNumber(metrics.orders) }}</div>
              </div>
              <v-icon
                size="48"
                :color="getTrendColor(metrics.ordersTrend)"
              >
                mdi-shopping
              </v-icon>
            </div>
            <div class="mt-2 d-flex align-center">
              <v-icon
                size="16"
                :color="getTrendColor(metrics.ordersTrend)"
                class="mr-1"
              >
                {{ metrics.ordersTrend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span :class="`${getTrendColor(metrics.ordersTrend)}--text`">
                {{ Math.abs(metrics.ordersTrend) }}% from previous period
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="metric-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-overline mb-1">Avg Order Value</div>
                <div class="text-h4">${{ formatNumber(metrics.averageOrder) }}</div>
              </div>
              <v-icon size="48" color="info">mdi-cash-register</v-icon>
            </div>
            <div class="mt-2 d-flex align-center">
              <v-icon
                size="16"
                :color="getTrendColor(metrics.avgOrderTrend)"
                class="mr-1"
              >
                {{ metrics.avgOrderTrend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span :class="`${getTrendColor(metrics.avgOrderTrend)}--text`">
                {{ Math.abs(metrics.avgOrderTrend) }}% from previous period
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="metric-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-overline mb-1">Customer Satisfaction</div>
                <div class="text-h4">{{ metrics.satisfaction }}%</div>
              </div>
              <v-icon
                size="48"
                :color="getSatisfactionColor(metrics.satisfaction)"
              >
                {{ getSatisfactionIcon(metrics.satisfaction) }}
              </v-icon>
            </div>
            <div class="mt-2">
              Based on {{ metrics.reviewCount }} reviews
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row>
      <!-- Sales Chart -->
      <v-col cols="12" lg="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            Sales Overview
            <v-btn-toggle
              v-model="salesMetric"
              mandatory
              density="comfortable"
            >
              <v-btn value="revenue">Revenue</v-btn>
              <v-btn value="orders">Orders</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-card-text>
            <v-chart
              :option="salesChartOptions"
              autoresize
              style="width: 100%; height: 400px;"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Top Items -->
      <v-col cols="12" lg="4">
        <v-card>
          <v-card-title>Top Items</v-card-title>
          <v-list lines="two">
            <v-list-item
              v-for="item in topItems"
              :key="item.id"
              :value="item"
            >
              <template v-slot:prepend>
                <v-avatar :image="item.image">
                  <v-icon>mdi-food</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title>{{ item.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ item.orderCount }} orders • ${{ formatNumber(item.revenue) }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-chip
                  :color="getPerformanceColor(item.performance)"
                  size="small"
                >
                  {{ formatPerformance(item.performance) }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Customer Insights -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Customer Insights</v-card-title>
          <v-card-text>
            <div class="d-flex mb-4">
              <div class="flex-grow-1">
                <div class="text-h6">{{ metrics.newCustomers }}</div>
                <div class="text-caption">New Customers</div>
              </div>
              <div class="flex-grow-1">
                <div class="text-h6">{{ metrics.returningCustomers }}</div>
                <div class="text-caption">Returning Customers</div>
              </div>
              <div class="flex-grow-1">
                <div class="text-h6">${{ formatNumber(metrics.customerLtv) }}</div>
                <div class="text-caption">Avg. Customer LTV</div>
              </div>
            </div>

            <v-chart
              :option="customerChartOptions"
              autoresize
              style="width: 100%; height: 300px;"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Operational Metrics -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Operational Metrics</v-card-title>
          <v-card-text>
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <div class="text-subtitle-2">Preparation Time</div>
                <div>{{ metrics.avgPrepTime }} min</div>
              </div>
              <v-progress-linear
                :model-value="(metrics.avgPrepTime / metrics.targetPrepTime) * 100"
                :color="getPrepTimeColor(metrics.avgPrepTime, metrics.targetPrepTime)"
                height="8"
                rounded
              ></v-progress-linear>
            </div>

            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <div class="text-subtitle-2">Delivery Time</div>
                <div>{{ metrics.avgDeliveryTime }} min</div>
              </div>
              <v-progress-linear
                :model-value="(metrics.avgDeliveryTime / metrics.targetDeliveryTime) * 100"
                :color="getDeliveryTimeColor(metrics.avgDeliveryTime, metrics.targetDeliveryTime)"
                height="8"
                rounded
              ></v-progress-linear>
            </div>

            <div class="mb-4">
              <div class="d-flex justify-space-between mb-2">
                <div class="text-subtitle-2">Order Accuracy</div>
                <div>{{ metrics.orderAccuracy }}%</div>
              </div>
              <v-progress-linear
                :model-value="metrics.orderAccuracy"
                color="success"
                height="8"
                rounded
              ></v-progress-linear>
            </div>

            <v-divider class="my-4"></v-divider>

            <div class="d-flex justify-space-between align-center">
              <div class="text-subtitle-1">Real-time Status</div>
              <v-chip
                :color="getStatusColor(metrics.status)"
                size="small"
              >
                {{ metrics.status }}
              </v-chip>
            </div>

            <div class="mt-4">
              <div class="d-flex justify-space-between mb-1">
                <span>Active Orders</span>
                <span>{{ metrics.activeOrders }}</span>
              </div>
              <div class="d-flex justify-space-between mb-1">
                <span>Queue Time</span>
                <span>{{ metrics.queueTime }} min</span>
              </div>
              <div class="d-flex justify-space-between">
                <span>Staff Utilization</span>
                <span>{{ metrics.staffUtilization }}%</span>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Rating Distribution -->
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Rating Distribution</v-card-title>
          <v-card-text>
            <div class="d-flex flex-column align-center mb-4">
              <div class="text-h2 font-weight-bold">{{ averageRating }}</div>
              <v-rating
                :model-value="parseFloat(averageRating)"
                color="amber"
                half-increments
                readonly
              ></v-rating>
              <div class="text-subtitle-1">Based on {{ totalReviews }} reviews</div>
            </div>

            <div class="rating-bars">
              <div v-for="n in 5" :key="n" class="d-flex align-center mb-2">
                <div class="text-body-2 mr-4" style="width: 20px">{{ 6-n }}</div>
                <v-progress-linear
                  :model-value="getRatingPercentage(6-n)"
                  color="amber"
                  height="8"
                  class="flex-grow-1 mr-4"
                  rounded
                ></v-progress-linear>
                <div class="text-body-2" style="width: 40px">{{ getRatingCount(6-n) }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Review Trends</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="ratingTrendOptions" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Reviews -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            Recent Reviews
            <v-spacer></v-spacer>
            <v-select
              v-model="reviewFilter"
              :items="reviewFilterOptions"
              density="comfortable"
              hide-details
              class="max-width-200"
            ></v-select>
          </v-card-title>

          <v-divider></v-divider>

          <v-card-text>
            <div v-if="loading" class="d-flex justify-center py-4">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>

            <div v-else-if="!recentReviews.length" class="text-center py-8">
              <v-icon size="64" color="grey">mdi-comment-text-outline</v-icon>
              <div class="text-h6 mt-2">No Reviews Yet</div>
              <div class="text-body-2 text-medium-emphasis">
                Reviews will appear here as customers rate their experience
              </div>
            </div>

            <v-list v-else lines="three">
              <template v-for="(review, index) in filteredReviews" :key="review.id">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-avatar :image="review.user.profileImage" class="mr-3">
                      <v-icon v-if="!review.user.profileImage">mdi-account</v-icon>
                    </v-avatar>
                  </template>

                  <v-list-item-title>
                    <div class="d-flex justify-space-between align-center">
                      <div>
                        {{ review.user.fullName }}
                        <v-rating
                          :model-value="review.rating"
                          color="amber"
                          density="compact"
                          half-increments
                          readonly
                          size="small"
                          class="d-inline-block ml-2"
                        ></v-rating>
                      </div>
                      <div class="text-caption">{{ formatDate(review.createdAt) }}</div>
                    </div>
                  </v-list-item-title>

                  <v-list-item-subtitle class="mt-1">{{ review.comment }}</v-list-item-subtitle>

                  <v-list-item-subtitle v-if="review.response" class="mt-2 response-block">
                    <div class="d-flex align-center mb-1">
                      <v-icon size="small" color="primary" class="mr-2">mdi-reply</v-icon>
                      <span class="text-primary">Response from restaurant</span>
                    </div>
                    {{ review.response }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <v-btn
                      v-if="!review.response"
                      variant="text"
                      color="primary"
                      @click="openResponseDialog(review)"
                    >
                      Respond
                    </v-btn>
                  </template>
                </v-list-item>

                <v-divider v-if="index < recentReviews.length - 1"></v-divider>
              </template>
            </v-list>

            <div v-if="recentReviews.length" class="d-flex justify-center mt-4">
              <v-pagination
                v-model="page"
                :length="totalPages"
                :total-visible="7"
              ></v-pagination>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Response Dialog -->
    <v-dialog v-model="responseDialog.show" max-width="600">
      <v-card>
        <v-card-title>Respond to Review</v-card-title>
        <v-card-text>
          <div class="mb-4">
            <v-rating
              :model-value="responseDialog.review?.rating"
              color="amber"
              density="compact"
              half-increments
              readonly
            ></v-rating>
            <div class="text-body-1 mt-2">{{ responseDialog.review?.comment }}</div>
          </div>

          <v-textarea
            v-model="responseDialog.response"
            label="Your Response"
            placeholder="Write your response to this review..."
            :rules="responseRules"
            counter="1000"
            rows="4"
            auto-grow
          ></v-textarea>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="responseDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="responseDialog.loading"
            :disabled="!isValidResponse"
            @click="submitResponse"
          >
            Submit Response
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import {
  format,
  subDays,
  startOfDay,
  endOfDay,
  parseISO
} from 'date-fns'
import analyticsService from '@/services/analytics.service'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  LineChart,
  BarChart,
  PieChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent
])

export default {
  name: 'RestaurantAnalytics',

  components: {
    VChart
  },

  props: {
    restaurantId: {
      type: String,
      required: true
    },
    
    refreshInterval: {
      type: Number,
      default: 300 // 5 minutes
    }
  },

  setup(props) {
    const store = useStore()
    
    // State
    const timeRange = ref('week')
    const salesMetric = ref('revenue')
    const showDatePicker = ref(false)
    const dateRange = ref([])
    const startDate = ref(subDays(new Date(), 7))
    const endDate = ref(new Date())
    const isLoading = ref(false)
    const metrics = ref({
      revenue: 0,
      revenueTrend: 0,
      orders: 0,
      ordersTrend: 0,
      averageOrder: 0,
      avgOrderTrend: 0,
      satisfaction: 0,
      reviewCount: 0,
      newCustomers: 0,
      returningCustomers: 0,
      customerLtv: 0,
      avgPrepTime: 0,
      targetPrepTime: 20,
      avgDeliveryTime: 0,
      targetDeliveryTime: 30,
      orderAccuracy: 0,
      status: 'normal',
      activeOrders: 0,
      queueTime: 0,
      staffUtilization: 0
    })

    const salesData = ref([])
    const topItems = ref([])
    const refreshTimer = ref(null)

    // Load analytics data
    const loadAnalytics = async () => {
      isLoading.value = true
      try {
        const [sales, realtime] = await Promise.all([
          analyticsService.getSalesAnalytics(props.restaurantId, {
            startDate: startDate.value,
            endDate: endDate.value
          }),
          analyticsService.getRealTimeMetrics(props.restaurantId)
        ])

        // Update metrics
        metrics.value = {
          ...metrics.value,
          ...sales.totals,
          ...realtime.currentLoad,
          ...realtime.performance
        }

        salesData.value = sales.daily
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        isLoading.value = false
      }
    }

    // Chart options
    const salesChartOptions = computed(() => ({
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: salesData.value.map(item => item.date)
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: salesMetric.value === 'revenue' ? 'Revenue' : 'Orders',
          type: 'line',
          smooth: true,
          data: salesData.value.map(item => 
            salesMetric.value === 'revenue' ? item.revenue : item.orders
          )
        }
      ]
    }))

    const customerChartOptions = computed(() => ({
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'horizontal',
        bottom: 10
      },
      series: [
        {
          name: 'Customer Type',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              formatter: '{b}: {c} ({d}%)'
            }
          },
          data: [
            { value: metrics.value.newCustomers, name: 'New' },
            { value: metrics.value.returningCustomers, name: 'Returning' }
          ]
        }
      ]
    }))

    // Utility methods
    const formatNumber = (value) => {
      return new Intl.NumberFormat().format(value)
    }

    const formatDateRange = (start, end) => {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`
    }

    const getTrendColor = (trend) => {
      if (trend > 0) return 'success'
      if (trend < 0) return 'error'
      return 'grey'
    }

    const getTrendIcon = (trend) => {
      if (trend > 0) return 'mdi-trending-up'
      if (trend < 0) return 'mdi-trending-down'
      return 'mdi-trending-neutral'
    }

    const getSatisfactionColor = (value) => {
      if (value >= 90) return 'success'
      if (value >= 70) return 'warning'
      return 'error'
    }

    const getSatisfactionIcon = (value) => {
      if (value >= 90) return 'mdi-emoticon-happy'
      if (value >= 70) return 'mdi-emoticon-neutral'
      return 'mdi-emoticon-sad'
    }

    const getPerformanceColor = (value) => {
      if (value >= 10) return 'success'
      if (value >= 0) return 'info'
      return 'error'
    }

    const formatPerformance = (value) => {
      const sign = value >= 0 ? '+' : ''
      return `${sign}${value}%`
    }

    const getPrepTimeColor = (actual, target) => {
      const ratio = actual / target
      if (ratio <= 1) return 'success'
      if (ratio <= 1.2) return 'warning'
      return 'error'
    }

    const getDeliveryTimeColor = (actual, target) => {
      const ratio = actual / target
      if (ratio <= 1) return 'success'
      if (ratio <= 1.2) return 'warning'
      return 'error'
    }

    const getStatusColor = (status) => {
      const colors = {
        normal: 'success',
        busy: 'warning',
        overloaded: 'error'
      }
      return colors[status] || 'grey'
    }

    // Event handlers
    const updateDateRange = (range) => {
      if (range?.length === 2) {
        startDate.value = parseISO(range[0])
        endDate.value = parseISO(range[1])
        showDatePicker.value = false
        loadAnalytics()
      }
    }

    const refreshData = () => {
      loadAnalytics()
    }

    // Watch for time range changes
    watch(timeRange, (newValue) => {
      switch (newValue) {
        case 'today':
          startDate.value = startOfDay(new Date())
          endDate.value = endOfDay(new Date())
          break
        case 'week':
          startDate.value = subDays(new Date(), 7)
          endDate.value = new Date()
          break
        case 'month':
          startDate.value = subDays(new Date(), 30)
          endDate.value = new Date()
          break
      }
      if (newValue !== 'custom') {
        loadAnalytics()
      }
    })

    // Setup auto-refresh
    onMounted(() => {
      loadAnalytics()
      refreshTimer.value = setInterval(loadAnalytics, props.refreshInterval * 1000)
    })

    onUnmounted(() => {
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value)
      }
    })

    return {
      timeRange,
      salesMetric,
      showDatePicker,
      dateRange,
      startDate,
      endDate,
      isLoading,
      metrics,
      topItems,
      salesChartOptions,
      customerChartOptions,
      formatNumber,
      formatDateRange,
      getTrendColor,
      getTrendIcon,
      getSatisfactionColor,
      getSatisfactionIcon,
      getPerformanceColor,
      formatPerformance,
      getPrepTimeColor,
      getDeliveryTimeColor,
      getStatusColor,
      updateDateRange,
      refreshData
    }
  }
}
</script>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

const props = defineProps({
  restaurantId: {
    type: [String, Number],
    required: true
  }
})

const store = useStore()

// State
const loading = ref(false)
const page = ref(1)
const recentReviews = ref([])
const totalPages = ref(1)
const reviewFilter = ref('all')
const averageRating = ref(0)
const totalReviews = ref(0)
const ratingDistribution = ref({})
const monthlyStats = ref([])

const responseDialog = ref({
  show: false,
  review: null,
  response: '',
  loading: false
})

// Filter options
const reviewFilterOptions = [
  { title: 'All Reviews', value: 'all' },
  { title: '5 Stars', value: '5' },
  { title: '4 Stars', value: '4' },
  { title: '3 Stars', value: '3' },
  { title: '2 Stars', value: '2' },
  { title: '1 Star', value: '1' },
  { title: 'With Response', value: 'responded' },
  { title: 'Needs Response', value: 'unresponded' }
]

// Response validation
const responseRules = [
  v => !!v || 'Response is required',
  v => v.length >= 10 || 'Response must be at least 10 characters long',
  v => v.length <= 1000 || 'Response cannot exceed 1000 characters'
]

// Computed
const filteredReviews = computed(() => {
  if (!recentReviews.value) return []
  
  let filtered = [...recentReviews.value]
  
  switch (reviewFilter.value) {
    case '5':
    case '4':
    case '3':
    case '2':
    case '1':
      filtered = filtered.filter(review => Math.floor(review.rating) === parseInt(reviewFilter.value))
      break
    case 'responded':
      filtered = filtered.filter(review => review.response)
      break
    case 'unresponded':
      filtered = filtered.filter(review => !review.response)
      break
  }
  
  return filtered
})

const isValidResponse = computed(() => {
  const response = responseDialog.value.response
  return response && response.length >= 10 && response.length <= 1000
})

// Rating trend chart options
const ratingTrendOptions = computed(() => {
  const dates = monthlyStats.value.map(stat => stat.date)
  const ratings = monthlyStats.value.map(stat => parseFloat(stat.averageRating).toFixed(1))
  const counts = monthlyStats.value.map(stat => stat.count)
  
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['Average Rating', 'Number of Reviews']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates
    },
    yAxis: [
      {
        type: 'value',
        name: 'Rating',
        min: 0,
        max: 5,
        interval: 1
      },
      {
        type: 'value',
        name: 'Reviews',
        splitLine: {
          show: false
        }
      }
    ],
    series: [
      {
        name: 'Average Rating',
        type: 'line',
        data: ratings,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'Number of Reviews',
        type: 'line',
        yAxisIndex: 1,
        data: counts,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        }
      }
    ]
  }
})

// Methods
const fetchReviews = async () => {
  loading.value = true
  try {
    const response = await store.dispatch('reviews/fetchRestaurantStats', {
      restaurantId: props.restaurantId
    })
    
    recentReviews.value = response.reviews
    totalPages.value = response.totalPages
    averageRating.value = response.averageRating
    totalReviews.value = response.totalReviews
    ratingDistribution.value = response.ratingDistribution
    monthlyStats.value = response.monthlyStats
  } catch (error) {
    console.error('Failed to fetch reviews:', error)
  } finally {
    loading.value = false
  }
}

const getRatingCount = (rating) => {
  return ratingDistribution.value[rating] || 0
}

const getRatingPercentage = (rating) => {
  if (totalReviews.value === 0) return 0
  return (getRatingCount(rating) / totalReviews.value) * 100
}

const formatDate = (date) => {
  return format(new Date(date), 'MMM d, yyyy')
}

const openResponseDialog = (review) => {
  responseDialog.value = {
    show: true,
    review,
    response: '',
    loading: false
  }
}

const submitResponse = async () => {
  if (!isValidResponse.value) return
  
  responseDialog.value.loading = true
  try {
    await store.dispatch('reviews/respondToReview', {
      reviewId: responseDialog.value.review.id,
      restaurantId: props.restaurantId,
      response: responseDialog.value.response
    })
    
    // Refresh reviews to show the new response
    await fetchReviews()
    responseDialog.value.show = false
  } catch (error) {
    console.error('Failed to submit response:', error)
  } finally {
    responseDialog.value.loading = false
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchReviews()
})

// Watch for page changes
watch(page, () => {
  fetchReviews()
})
</script>

<style scoped>
.restaurant-analytics {
  max-width: 1600px;
  margin: 0 auto;
  padding: 16px;
}

.metric-card {
  height: 100%;
}

.v-card-text {
  height: 100%;
}

.max-width-200 {
  max-width: 200px;
}

.chart {
  height: 400px;
}

.response-block {
  background-color: var(--v-surface-variant);
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 8px;
}
</style>