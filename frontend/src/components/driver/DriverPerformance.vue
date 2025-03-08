<template>
  <div class="driver-performance">
    <!-- Performance Overview -->
    <v-row>
      <v-col
        v-for="metric in performanceMetrics"
        :key="metric.id"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card :color="getMetricColor(metric)">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-subtitle-2">{{ metric.name }}</div>
                <div class="text-h4">{{ formatMetricValue(metric) }}</div>
              </div>
              <v-icon size="48" :color="getMetricIconColor(metric)">
                {{ metric.icon }}
              </v-icon>
            </div>
            <div class="d-flex align-center mt-2">
              <v-icon
                size="small"
                :color="metric.trend === 'up' ? 'success' : 'error'"
              >
                {{ metric.trend === 'up' ? 'mdi-trending-up' : 'mdi-trending-down' }}
              </v-icon>
              <span class="text-caption ml-1">
                {{ metric.trend === 'up' ? '+' : '-' }}{{ metric.change }}%
                vs last week
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Earnings Summary -->
    <v-card class="mt-4">
      <v-card-title class="d-flex justify-space-between align-center">
        Earnings Summary
        <v-btn-group>
          <v-btn
            v-for="period in earningPeriods"
            :key="period.value"
            :variant="selectedPeriod === period.value ? 'elevated' : 'text'"
            @click="selectedPeriod = period.value"
          >
            {{ period.label }}
          </v-btn>
        </v-btn-group>
      </v-card-title>

      <v-card-text>
        <v-row>
          <!-- Earnings Chart -->
          <v-col cols="12" md="8">
            <v-chart
              :option="earningsChartOptions"
              autoresize
              style="width: 100%; height: 300px;"
            />
          </v-col>

          <!-- Earnings Breakdown -->
          <v-col cols="12" md="4">
            <v-list density="compact">
              <v-list-subheader>Earnings Breakdown</v-list-subheader>
              <v-list-item
                v-for="item in earningsBreakdown"
                :key="item.id"
              >
                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <template v-slot:append>
                  <div class="text-right">
                    <div>${{ formatNumber(item.amount) }}</div>
                    <div class="text-caption">{{ item.orders }} orders</div>
                  </div>
                </template>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <v-list-item-title class="font-weight-bold">
                  Total Earnings
                </v-list-item-title>
                <template v-slot:append>
                  <div class="text-h6">${{ formatNumber(totalEarnings) }}</div>
                </template>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Performance Details -->
    <v-row class="mt-4">
      <!-- Delivery Stats -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Delivery Statistics</v-card-title>
          <v-card-text>
            <!-- Delivery Time -->
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <div class="text-subtitle-2">Average Delivery Time</div>
                <div>{{ stats.avgDeliveryTime }} mins</div>
              </div>
              <v-progress-linear
                :model-value="getDeliveryTimeScore"
                color="success"
                height="8"
                rounded
              >
                <template v-slot:default>
                  {{ getDeliveryTimeScore }}%
                </template>
              </v-progress-linear>
            </div>

            <!-- On-Time Rate -->
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <div class="text-subtitle-2">On-Time Rate</div>
                <div>{{ stats.onTimeRate }}%</div>
              </div>
              <v-progress-linear
                :model-value="stats.onTimeRate"
                :color="getOnTimeColor"
                height="8"
                rounded
              >
                <template v-slot:default>
                  {{ stats.onTimeRate }}%
                </template>
              </v-progress-linear>
            </div>

            <!-- Order Completion -->
            <div class="mb-4">
              <div class="d-flex justify-space-between mb-1">
                <div class="text-subtitle-2">Order Completion Rate</div>
                <div>{{ stats.completionRate }}%</div>
              </div>
              <v-progress-linear
                :model-value="stats.completionRate"
                :color="getCompletionColor"
                height="8"
                rounded
              >
                <template v-slot:default>
                  {{ stats.completionRate }}%
                </template>
              </v-progress-linear>
            </div>

            <!-- Trip Details -->
            <v-list density="compact">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-map-marker-distance</v-icon>
                </template>
                <v-list-item-title>Total Distance</v-list-item-title>
                <template v-slot:append>
                  {{ stats.totalDistance }} km
                </template>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-clock-outline</v-icon>
                </template>
                <v-list-item-title>Active Hours</v-list-item-title>
                <template v-slot:append>
                  {{ stats.activeHours }} hrs
                </template>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-gas-station</v-icon>
                </template>
                <v-list-item-title>Fuel Efficiency</v-list-item-title>
                <template v-slot:append>
                  {{ stats.fuelEfficiency }} km/L
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Customer Feedback -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Customer Feedback</v-card-title>
          <v-card-text>
            <!-- Rating Distribution -->
            <div class="mb-4">
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-subtitle-2">Rating Distribution</div>
                <div class="text-h5">{{ stats.averageRating }}</div>
              </div>
              
              <div
                v-for="(count, rating) in stats.ratingDistribution"
                :key="rating"
                class="d-flex align-center mb-1"
              >
                <div class="text-caption mr-2" style="width: 24px;">
                  {{ rating }}★
                </div>
                <v-progress-linear
                  :model-value="(count / stats.totalRatings) * 100"
                  color="amber"
                  height="8"
                  class="flex-grow-1"
                >
                  <template v-slot:default>
                    {{ count }}
                  </template>
                </v-progress-linear>
              </div>
            </div>

            <!-- Recent Reviews -->
            <div class="text-subtitle-2 mb-2">Recent Reviews</div>
            <v-list lines="three">
              <v-list-item
                v-for="review in recentReviews"
                :key="review.id"
                :value="review"
              >
                <template v-slot:prepend>
                  <v-rating
                    :model-value="review.rating"
                    color="amber"
                    density="compact"
                    size="small"
                    readonly
                  ></v-rating>
                </template>
                
                <v-list-item-title>{{ review.customerName }}</v-list-item-title>
                <v-list-item-subtitle>{{ review.comment }}</v-list-item-subtitle>
                <v-list-item-subtitle class="text-caption">
                  {{ formatDate(review.date) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Improvement Tips -->
    <v-card class="mt-4">
      <v-card-title>Performance Tips</v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            v-for="tip in improvementTips"
            :key="tip.id"
            cols="12"
            md="4"
          >
            <v-card variant="outlined">
              <v-card-text>
                <div class="d-flex align-center mb-2">
                  <v-icon :color="tip.color" class="mr-2">
                    {{ tip.icon }}
                  </v-icon>
                  <div class="text-subtitle-1">{{ tip.title }}</div>
                </div>
                <p class="text-body-2">{{ tip.description }}</p>
                <v-btn
                  v-if="tip.action"
                  :color="tip.color"
                  variant="text"
                  block
                  class="mt-2"
                  @click="handleTipAction(tip)"
                >
                  {{ tip.action }}
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { format } from 'date-fns'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
])

export default {
  name: 'DriverPerformance',

  components: {
    VChart
  },

  props: {
    driverId: {
      type: String,
      required: true
    }
  },

  setup() {
    // State
    const selectedPeriod = ref('week')

    // Performance Metrics
    const performanceMetrics = ref([
      {
        id: 1,
        name: 'Today\'s Earnings',
        value: 185.50,
        format: 'currency',
        icon: 'mdi-cash',
        trend: 'up',
        change: 12,
        threshold: { good: 150, warning: 100 }
      },
      {
        id: 2,
        name: 'Deliveries',
        value: 24,
        format: 'number',
        icon: 'mdi-cube-send',
        trend: 'up',
        change: 8,
        threshold: { good: 20, warning: 15 }
      },
      {
        id: 3,
        name: 'Rating',
        value: 4.8,
        format: 'rating',
        icon: 'mdi-star',
        trend: 'up',
        change: 2,
        threshold: { good: 4.5, warning: 4.0 }
      },
      {
        id: 4,
        name: 'Acceptance Rate',
        value: 92,
        format: 'percentage',
        icon: 'mdi-check-circle',
        trend: 'down',
        change: 3,
        threshold: { good: 90, warning: 80 }
      }
    ])

    // Period options
    const earningPeriods = [
      { label: 'Week', value: 'week' },
      { label: 'Month', value: 'month' },
      { label: 'Year', value: 'year' }
    ]

    // Earnings breakdown
    const earningsBreakdown = ref([
      { id: 1, name: 'Delivery Fees', amount: 850, orders: 42 },
      { id: 2, name: 'Tips', amount: 245, orders: 38 },
      { id: 3, name: 'Bonuses', amount: 175, orders: 12 }
    ])

    // Delivery stats
    const stats = ref({
      avgDeliveryTime: 28,
      onTimeRate: 94,
      completionRate: 98,
      totalDistance: 285,
      activeHours: 38,
      fuelEfficiency: 12.5,
      averageRating: 4.8,
      totalRatings: 426,
      ratingDistribution: {
        5: 320,
        4: 82,
        3: 18,
        2: 4,
        1: 2
      }
    })

    // Recent reviews
    const recentReviews = ref([
      {
        id: 1,
        customerName: 'John D.',
        rating: 5,
        comment: 'Very professional and quick delivery!',
        date: new Date('2025-02-24T18:30:00')
      },
      {
        id: 2,
        customerName: 'Sarah M.',
        rating: 5,
        comment: 'Food was still hot, great service',
        date: new Date('2025-02-24T16:15:00')
      },
      {
        id: 3,
        customerName: 'Mike R.',
        rating: 4,
        comment: 'Good service overall',
        date: new Date('2025-02-24T14:45:00')
      }
    ])

    // Improvement tips
    const improvementTips = ref([
      {
        id: 1,
        title: 'Optimize Your Routes',
        description: 'Try batching nearby deliveries to reduce travel time.',
        icon: 'mdi-map-marker-path',
        color: 'primary',
        action: 'View Route Tips'
      },
      {
        id: 2,
        title: 'Peak Hours',
        description: 'Schedule shifts during lunch and dinner rush for maximum earnings.',
        icon: 'mdi-clock-time-four',
        color: 'success',
        action: 'View Schedule'
      },
      {
        id: 3,
        title: 'Customer Service',
        description: 'Keep customers updated on delivery progress.',
        icon: 'mdi-account-star',
        color: 'info',
        action: 'View Best Practices'
      }
    ])

    // Computed
    const totalEarnings = computed(() => {
      return earningsBreakdown.value.reduce((sum, item) => sum + item.amount, 0)
    })

    const earningsChartOptions = computed(() => ({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['Earnings', 'Deliveries']
      },
      xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      yAxis: [
        {
          type: 'value',
          name: 'Earnings ($)'
        },
        {
          type: 'value',
          name: 'Deliveries'
        }
      ],
      series: [
        {
          name: 'Earnings',
          type: 'line',
          smooth: true,
          data: [120, 132, 145, 160, 178, 190, 165]
        },
        {
          name: 'Deliveries',
          type: 'bar',
          yAxisIndex: 1,
          data: [12, 14, 16, 18, 20, 22, 18]
        }
      ]
    }))

    const getDeliveryTimeScore = computed(() => {
      const target = 30 // Target delivery time in minutes
      const score = Math.max(0, 100 - ((stats.value.avgDeliveryTime - target) * 5))
      return Math.min(100, Math.round(score))
    })

    const getOnTimeColor = computed(() => {
      const rate = stats.value.onTimeRate
      if (rate >= 95) return 'success'
      if (rate >= 85) return 'warning'
      return 'error'
    })

    const getCompletionColor = computed(() => {
      const rate = stats.value.completionRate
      if (rate >= 98) return 'success'
      if (rate >= 95) return 'warning'
      return 'error'
    })

    // Methods
    const getMetricColor = (metric: any) => {
      const value = metric.value
      const { good, warning } = metric.threshold
      
      if (value >= good) return 'success-lighten-4'
      if (value >= warning) return 'warning-lighten-4'
      return 'error-lighten-4'
    }

    const getMetricIconColor = (metric: any) => {
      const value = metric.value
      const { good, warning } = metric.threshold
      
      if (value >= good) return 'success'
      if (value >= warning) return 'warning'
      return 'error'
    }

    const formatMetricValue = (metric: any) => {
      switch (metric.format) {
        case 'currency':
          return `$${metric.value.toFixed(2)}`
        case 'percentage':
          return `${metric.value}%`
        case 'rating':
          return metric.value.toFixed(1)
        default:
          return metric.value.toString()
      }
    }

    const formatNumber = (value: number) => {
      return value.toFixed(2)
    }

    const formatDate = (date: Date) => {
      return format(date, 'MMM d, h:mm a')
    }

    const handleTipAction = (tip: any) => {
      console.log('Tip action:', tip.action)
      // Implement tip action handling
    }

    return {
      selectedPeriod,
      performanceMetrics,
      earningPeriods,
      earningsBreakdown,
      stats,
      recentReviews,
      improvementTips,
      totalEarnings,
      earningsChartOptions,
      getDeliveryTimeScore,
      getOnTimeColor,
      getCompletionColor,
      getMetricColor,
      getMetricIconColor,
      formatMetricValue,
      formatNumber,
      formatDate,
      handleTipAction
    }
  }
}
</script>

<style scoped>
.driver-performance {
  max-width: 1400px;
  margin: 0 auto;
}
</style>