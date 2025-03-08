<template>
  <div class="analytics-insights">
    <!-- Key Performance Metrics -->
    <v-row>
      <v-col
        v-for="metric in kpiMetrics"
        :key="metric.id"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card :color="metric.trend === 'up' ? 'success-lighten-4' : 'error-lighten-4'">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div class="text-subtitle-2">{{ metric.name }}</div>
              <v-icon
                :color="metric.trend === 'up' ? 'success' : 'error'"
              >
                {{ metric.trend === 'up' ? 'mdi-trending-up' : 'mdi-trending-down' }}
              </v-icon>
            </div>
            <div class="text-h5 mt-2">{{ formatValue(metric.value, metric.format) }}</div>
            <div class="text-caption">
              {{ metric.trend === 'up' ? '+' : '-' }}{{ metric.change }}% vs last period
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Revenue Analysis -->
    <v-card class="mt-4">
      <v-card-title class="d-flex justify-space-between align-center">
        Revenue Analysis
        <v-btn-group>
          <v-btn
            v-for="period in analysisPeriods"
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
          <v-col cols="12" md="8">
            <v-chart
              :option="revenueChartOptions"
              autoresize
              style="width: 100%; height: 300px;"
            />
          </v-col>
          <v-col cols="12" md="4">
            <div class="text-subtitle-1 mb-2">Revenue Breakdown</div>
            <v-list density="compact">
              <v-list-item
                v-for="source in revenueSources"
                :key="source.id"
              >
                <v-list-item-title>{{ source.name }}</v-list-item-title>
                <template v-slot:append>
                  <div class="d-flex align-center">
                    <span class="mr-2">${{ formatNumber(source.amount) }}</span>
                    <v-progress-linear
                      :model-value="source.percentage"
                      :color="source.color"
                      width="60"
                    ></v-progress-linear>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Performance Insights -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <!-- Popular Items -->
        <v-card height="100%">
          <v-card-title>Top Performing Items</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="item in topItems"
                :key="item.id"
                :value="item"
              >
                <template v-slot:prepend>
                  <v-avatar :image="item.image" size="48">
                    <v-icon>mdi-food</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>{{ item.name }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ item.orders }} orders • ${{ formatNumber(item.revenue) }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-chip
                    size="small"
                    :color="item.trend === 'up' ? 'success' : 'error'"
                  >
                    {{ item.trend === 'up' ? '+' : '-' }}{{ item.change }}%
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <!-- Customer Insights -->
        <v-card height="100%">
          <v-card-title>Customer Insights</v-card-title>
          <v-card-text>
            <!-- Peak Hours -->
            <div class="mb-4">
              <div class="text-subtitle-2 mb-2">Peak Hours</div>
              <v-chart
                :option="peakHoursChartOptions"
                autoresize
                style="width: 100%; height: 150px;"
              />
            </div>

            <!-- Order Types -->
            <div class="mb-4">
              <div class="text-subtitle-2 mb-2">Order Distribution</div>
              <v-row>
                <v-col
                  v-for="type in orderTypes"
                  :key="type.id"
                  cols="6"
                >
                  <div class="d-flex align-center">
                    <v-icon :color="type.color" class="mr-2">
                      {{ type.icon }}
                    </v-icon>
                    <div class="flex-grow-1">
                      <div class="text-body-2">{{ type.name }}</div>
                      <v-progress-linear
                        :model-value="type.percentage"
                        :color="type.color"
                        height="4"
                      ></v-progress-linear>
                    </div>
                    <div class="ml-2">{{ type.percentage }}%</div>
                  </div>
                </v-col>
              </v-row>
            </div>

            <!-- Customer Satisfaction -->
            <div>
              <div class="text-subtitle-2 mb-2">Customer Satisfaction</div>
              <v-row>
                <v-col cols="6">
                  <v-card variant="outlined">
                    <v-card-text class="text-center">
                      <div class="text-h4">{{ customerMetrics.rating }}</div>
                      <div class="text-caption">Average Rating</div>
                      <v-rating
                        :model-value="customerMetrics.rating"
                        color="amber"
                        density="compact"
                        size="small"
                        readonly
                      ></v-rating>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="6">
                  <v-card variant="outlined">
                    <v-card-text class="text-center">
                      <div class="text-h4">{{ customerMetrics.nps }}%</div>
                      <div class="text-caption">Net Promoter Score</div>
                      <v-progress-circular
                        :model-value="customerMetrics.nps"
                        :color="getNpsColor"
                        size="40"
                      >
                        {{ customerMetrics.nps }}
                      </v-progress-circular>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recommendations -->
    <v-card class="mt-4">
      <v-card-title>
        Actionable Insights
        <v-btn
          icon="mdi-refresh"
          variant="text"
          :loading="refreshingInsights"
          @click="refreshInsights"
        ></v-btn>
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col
            v-for="insight in actionableInsights"
            :key="insight.id"
            cols="12"
            md="4"
          >
            <v-card variant="outlined" :color="insight.color + '-lighten-5'">
              <v-card-text>
                <div class="d-flex align-center mb-2">
                  <v-icon :color="insight.color" class="mr-2">
                    {{ insight.icon }}
                  </v-icon>
                  <div class="text-subtitle-1">{{ insight.title }}</div>
                </div>
                <p class="text-body-2">{{ insight.description }}</p>
                <v-btn
                  :color="insight.color"
                  variant="text"
                  block
                  @click="applyInsight(insight)"
                >
                  {{ insight.actionText }}
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
  name: 'AnalyticsInsights',

  components: {
    VChart
  },

  props: {
    restaurantId: {
      type: String,
      required: true
    },
    dateRange: {
      type: Object,
      default: () => ({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      })
    }
  },

  setup() {
    // State
    const selectedPeriod = ref('month')
    const refreshingInsights = ref(false)

    // KPI Metrics
    const kpiMetrics = ref([
      {
        id: 1,
        name: 'Total Revenue',
        value: 52500,
        format: 'currency',
        trend: 'up',
        change: 12
      },
      {
        id: 2,
        name: 'Orders',
        value: 845,
        format: 'number',
        trend: 'up',
        change: 8
      },
      {
        id: 3,
        name: 'Average Order Value',
        value: 62.13,
        format: 'currency',
        trend: 'up',
        change: 4
      },
      {
        id: 4,
        name: 'Customer Return Rate',
        value: 68,
        format: 'percentage',
        trend: 'down',
        change: 2
      }
    ])

    // Analysis Periods
    const analysisPeriods = [
      { label: 'Week', value: 'week' },
      { label: 'Month', value: 'month' },
      { label: 'Quarter', value: 'quarter' }
    ]

    // Revenue Sources
    const revenueSources = ref([
      {
        id: 1,
        name: 'Delivery',
        amount: 25000,
        percentage: 48,
        color: 'primary'
      },
      {
        id: 2,
        name: 'Pickup',
        amount: 15000,
        percentage: 28,
        color: 'success'
      },
      {
        id: 3,
        name: 'Dine-in',
        amount: 12500,
        percentage: 24,
        color: 'info'
      }
    ])

    // Top Items
    const topItems = ref([
      {
        id: 1,
        name: 'Margherita Pizza',
        image: '/images/items/pizza.jpg',
        orders: 245,
        revenue: 4900,
        trend: 'up',
        change: 15
      },
      {
        id: 2,
        name: 'Chicken Wings',
        image: '/images/items/wings.jpg',
        orders: 198,
        revenue: 3960,
        trend: 'up',
        change: 8
      },
      {
        id: 3,
        name: 'Caesar Salad',
        image: '/images/items/salad.jpg',
        orders: 156,
        revenue: 2340,
        trend: 'down',
        change: 3
      }
    ])

    // Order Types
    const orderTypes = ref([
      {
        id: 1,
        name: 'Mobile App',
        percentage: 45,
        color: 'primary',
        icon: 'mdi-cellphone'
      },
      {
        id: 2,
        name: 'Website',
        percentage: 30,
        color: 'info',
        icon: 'mdi-laptop'
      },
      {
        id: 3,
        name: 'Phone',
        percentage: 15,
        color: 'success',
        icon: 'mdi-phone'
      },
      {
        id: 4,
        name: 'Walk-in',
        percentage: 10,
        color: 'warning',
        icon: 'mdi-walk'
      }
    ])

    // Customer Metrics
    const customerMetrics = ref({
      rating: 4.5,
      nps: 75
    })

    // Actionable Insights
    const actionableInsights = ref([
      {
        id: 1,
        title: 'Menu Optimization',
        description: 'Consider adjusting prices for low-performing items to increase sales.',
        icon: 'mdi-silverware-fork-knife',
        color: 'primary',
        actionText: 'View Suggestions'
      },
      {
        id: 2,
        title: 'Peak Hour Staffing',
        description: 'Add more staff during Thursday evenings to reduce wait times.',
        icon: 'mdi-account-group',
        color: 'warning',
        actionText: 'Update Schedule'
      },
      {
        id: 3,
        title: 'Promotion Opportunity',
        description: 'Launch a weekend special to boost dine-in orders.',
        icon: 'mdi-tag',
        color: 'success',
        actionText: 'Create Promotion'
      }
    ])

    // Chart Options
    const revenueChartOptions = computed(() => ({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['Revenue', 'Orders']
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
          name: 'Revenue ($)'
        },
        {
          type: 'value',
          name: 'Orders'
        }
      ],
      series: [
        {
          name: 'Revenue',
          type: 'line',
          smooth: true,
          data: [5000, 6200, 7800, 8500, 9200, 10500, 9800]
        },
        {
          name: 'Orders',
          type: 'bar',
          yAxisIndex: 1,
          data: [80, 95, 120, 135, 150, 165, 145]
        }
      ]
    }))

    const peakHoursChartOptions = computed(() => ({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          data: [15, 45, 35, 30, 65, 55, 25],
          type: 'bar',
          color: '#1976D2'
        }
      ]
    }))

    // Computed
    const getNpsColor = computed(() => {
      const nps = customerMetrics.value.nps
      if (nps >= 70) return 'success'
      if (nps >= 50) return 'warning'
      return 'error'
    })

    // Methods
    const formatValue = (value: number, format: string) => {
      switch (format) {
        case 'currency':
          return `$${formatNumber(value)}`
        case 'percentage':
          return `${value}%`
        default:
          return formatNumber(value)
      }
    }

    const formatNumber = (value: number) => {
      return new Intl.NumberFormat().format(value)
    }

    const refreshInsights = async () => {
      refreshingInsights.value = true
      try {
        // Update insights logic here
        await new Promise(resolve => setTimeout(resolve, 1000))
      } finally {
        refreshingInsights.value = false
      }
    }

    const applyInsight = (insight: any) => {
      console.log('Applying insight:', insight)
      // Handle insight action
    }

    return {
      selectedPeriod,
      refreshingInsights,
      kpiMetrics,
      analysisPeriods,
      revenueSources,
      topItems,
      orderTypes,
      customerMetrics,
      actionableInsights,
      revenueChartOptions,
      peakHoursChartOptions,
      getNpsColor,
      formatValue,
      formatNumber,
      refreshInsights,
      applyInsight
    }
  }
}
</script>

<style scoped>
.analytics-insights {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px;
}
</style>