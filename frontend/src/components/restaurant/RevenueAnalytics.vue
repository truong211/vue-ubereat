<template>
  <div class="revenue-analytics">
    <!-- Time Range Selection -->
    <v-row class="mb-4">
      <v-col cols="12" sm="4">
        <v-select
          v-model="timeRange"
          :items="timeRanges"
          :label="$t('restaurant.analytics.timeRange')"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="loadData"
        ></v-select>
      </v-col>
      <v-col cols="12" sm="4" v-if="timeRange === 'custom'">
        <v-text-field
          v-model="dateRange.start"
          type="date"
          :label="$t('restaurant.analytics.startDate')"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="loadData"
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="4" v-if="timeRange === 'custom'">
        <v-text-field
          v-model="dateRange.end"
          type="date"
          :label="$t('restaurant.analytics.endDate')"
          density="compact"
          variant="outlined"
          hide-details
          @update:model-value="loadData"
        ></v-text-field>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">{{ $t('restaurant.analytics.totalRevenue') }}</div>
            <div class="text-h4">{{ formatPrice(summaryData.revenue) }}</div>
            <div class="d-flex align-center mt-2">
              <v-icon
                :color="summaryData.revenueChange >= 0 ? 'success' : 'error'"
                size="small"
              >
                {{ summaryData.revenueChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span class="text-body-2 ml-1" :class="{
                'text-success': summaryData.revenueChange >= 0,
                'text-error': summaryData.revenueChange < 0
              }">
                {{ Math.abs(summaryData.revenueChange) }}%
              </span>
              <span class="text-caption ml-2">{{ $t('restaurant.analytics.vsPrevPeriod') }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">{{ $t('restaurant.analytics.totalOrders') }}</div>
            <div class="text-h4">{{ summaryData.orders }}</div>
            <div class="d-flex align-center mt-2">
              <v-icon
                :color="summaryData.ordersChange >= 0 ? 'success' : 'error'"
                size="small"
              >
                {{ summaryData.ordersChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span class="text-body-2 ml-1" :class="{
                'text-success': summaryData.ordersChange >= 0,
                'text-error': summaryData.ordersChange < 0
              }">
                {{ Math.abs(summaryData.ordersChange) }}%
              </span>
              <span class="text-caption ml-2">{{ $t('restaurant.analytics.vsPrevPeriod') }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">{{ $t('restaurant.analytics.avgOrderValue') }}</div>
            <div class="text-h4">{{ formatPrice(summaryData.avgOrderValue) }}</div>
            <div class="d-flex align-center mt-2">
              <v-icon
                :color="summaryData.avgOrderChange >= 0 ? 'success' : 'error'"
                size="small"
              >
                {{ summaryData.avgOrderChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span class="text-body-2 ml-1" :class="{
                'text-success': summaryData.avgOrderChange >= 0,
                'text-error': summaryData.avgOrderChange < 0
              }">
                {{ Math.abs(summaryData.avgOrderChange) }}%
              </span>
              <span class="text-caption ml-2">{{ $t('restaurant.analytics.vsPrevPeriod') }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">{{ $t('restaurant.analytics.cancelRate') }}</div>
            <div class="text-h4">{{ summaryData.cancelRate }}%</div>
            <div class="d-flex align-center mt-2">
              <v-icon
                :color="summaryData.cancelRateChange <= 0 ? 'success' : 'error'"
                size="small"
              >
                {{ summaryData.cancelRateChange <= 0 ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
              </v-icon>
              <span class="text-body-2 ml-1" :class="{
                'text-success': summaryData.cancelRateChange <= 0,
                'text-error': summaryData.cancelRateChange > 0
              }">
                {{ Math.abs(summaryData.cancelRateChange) }}%
              </span>
              <span class="text-caption ml-2">{{ $t('restaurant.analytics.vsPrevPeriod') }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Revenue Chart -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>{{ $t('restaurant.analytics.revenueChart') }}</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="revenueChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Order Statistics -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>{{ $t('restaurant.analytics.ordersByHour') }}</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="hourlyChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>{{ $t('restaurant.analytics.ordersByDay') }}</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="dailyChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Top Items -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            {{ $t('restaurant.analytics.topItems') }}
            <v-btn
              variant="text"
              color="primary"
              size="small"
              :to="{ name: 'RestaurantReports' }"
            >
              {{ $t('restaurant.analytics.viewDetails') }}
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-list lines="two">
              <v-list-item
                v-for="item in topItems"
                :key="item.id"
                :title="item.name"
                :subtitle="`${item.quantity} ${$t('restaurant.analytics.orders')} · ${formatPrice(item.revenue)}`"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :image="item.image"
                    size="40"
                    class="rounded"
                  ></v-avatar>
                </template>
                <template v-slot:append>
                  <div class="d-flex align-center">
                    <v-icon
                      :color="item.trend >= 0 ? 'success' : 'error'"
                      size="small"
                      class="mr-1"
                    >
                      {{ item.trend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                    </v-icon>
                    <span :class="{
                      'text-success': item.trend >= 0,
                      'text-error': item.trend < 0
                    }">
                      {{ Math.abs(item.trend) }}%
                    </span>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Performance Metrics -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>{{ $t('restaurant.analytics.metrics') }}</v-card-title>
          <v-card-text>
            <div class="d-flex flex-column gap-4">
              <div v-for="metric in performanceMetrics" :key="metric.name">
                <div class="d-flex justify-space-between mb-1">
                  <span class="text-subtitle-2">{{ $t(`restaurant.analytics.${metric.name}`) }}</span>
                  <span class="text-subtitle-1">{{ metric.value }}{{ metric.unit }}</span>
                </div>
                <v-progress-linear
                  :model-value="metric.percentage"
                  :color="getMetricColor(metric.percentage)"
                  height="8"
                  rounded
                ></v-progress-linear>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
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
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

interface SummaryData {
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

const { t } = useI18n()
const store = useStore()

// State
const timeRange = ref('week')
const dateRange = ref({
  start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
  end: format(new Date(), 'yyyy-MM-dd')
})

const timeRanges = [
  { title: t('restaurant.analytics.ranges.today'), value: 'today' },
  { title: t('restaurant.analytics.ranges.week'), value: 'week' },
  { title: t('restaurant.analytics.ranges.month'), value: 'month' },
  { title: t('restaurant.analytics.ranges.quarter'), value: 'quarter' },
  { title: t('restaurant.analytics.ranges.year'), value: 'year' },
  { title: t('restaurant.analytics.ranges.custom'), value: 'custom' }
]

// Sample data (replace with actual API calls)
const summaryData = ref<SummaryData>({
  revenue: 0,
  revenueChange: 0,
  orders: 0,
  ordersChange: 0,
  avgOrderValue: 0,
  avgOrderChange: 0,
  cancelRate: 0,
  cancelRateChange: 0
})

const topItems = ref<TopItem[]>([])
const performanceMetrics = ref<PerformanceMetric[]>([])

// Chart options
const revenueChartOption = computed(() => ({
  title: {
    show: false
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any[]) => {
      const [revenue, orders] = params
      return `${revenue.axisValue}<br/>
        ${t('restaurant.analytics.revenue')}: ${formatPrice(revenue.value)}<br/>
        ${t('restaurant.analytics.orders')}: ${orders.value}`
    }
  },
  legend: {
    data: [t('restaurant.analytics.revenue'), t('restaurant.analytics.orders')]
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  yAxis: [
    {
      type: 'value',
      name: t('restaurant.analytics.revenue'),
      axisLabel: {
        formatter: (value: number) => formatPrice(value)
      }
    },
    {
      type: 'value',
      name: t('restaurant.analytics.orders'),
      splitLine: {
        show: false
      }
    }
  ],
  series: [
    {
      name: t('restaurant.analytics.revenue'),
      type: 'line',
      smooth: true,
      data: [150000, 230000, 224000, 218000, 135000, 147000, 260000]
    },
    {
      name: t('restaurant.analytics.orders'),
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: [15, 23, 22, 21, 13, 14, 26]
    }
  ]
}))

const hourlyChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: Array.from({ length: 24 }, (_, i) => `${i}:00`)
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      type: 'bar',
      data: [
        10, 5, 2, 1, 0, 0, 3, 15, 25, 20,
        18, 32, 35, 30, 25, 20, 15, 25, 35, 30,
        25, 20, 15, 10
      ],
      itemStyle: {
        color: '#1867C0'
      }
    }
  ]
}))

const dailyChartOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 148, name: t('restaurant.analytics.days.mon') },
        { value: 135, name: t('restaurant.analytics.days.tue') },
        { value: 142, name: t('restaurant.analytics.days.wed') },
        { value: 165, name: t('restaurant.analytics.days.thu') },
        { value: 182, name: t('restaurant.analytics.days.fri') },
        { value: 210, name: t('restaurant.analytics.days.sat') },
        { value: 195, name: t('restaurant.analytics.days.sun') }
      ]
    }
  ]
}))

// Methods
const loadData = async () => {
  try {
    const response = await store.dispatch('restaurant/getAnalytics', {
      timeRange: timeRange.value,
      startDate: dateRange.value.start,
      endDate: dateRange.value.end
    })

    summaryData.value = response.summary
    topItems.value = response.topItems
    performanceMetrics.value = response.metrics
    
    // Update charts with new data...
  } catch (error) {
    console.error('Error loading analytics:', error)
  }
}

const getMetricColor = (percentage: number): string => {
  if (percentage >= 80) return 'success'
  if (percentage >= 60) return 'info'
  if (percentage >= 40) return 'warning'
  return 'error'
}

const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

// Initial load
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.revenue-analytics {
  padding: 16px;
}

.chart {
  height: 400px;
}

:deep(.v-card-text) {
  padding: 16px;
}

:deep(.v-list-item) {
  padding: 12px 16px;
}

.metric-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
}

.metric-value {
  font-size: 1rem;
  font-weight: 500;
}
</style>