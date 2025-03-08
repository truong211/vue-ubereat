<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">Analytics</h1>
      <v-spacer></v-spacer>
      <!-- Time Range Selector -->
      <v-select
        v-model="timeRange"
        :items="timeRanges"
        label="Time Range"
        density="comfortable"
        hide-details
        class="max-width-200"
      ></v-select>
    </div>

    <!-- Key Metrics -->
    <v-row>
      <v-col
        v-for="metric in keyMetrics"
        :key="metric.title"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card>
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-2 text-medium-emphasis">
                {{ metric.title }}
              </span>
              <v-icon :color="metric.trend >= 0 ? 'success' : 'error'">
                {{ metric.trend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
            </div>
            <div class="text-h4 mb-1">{{ metric.value }}</div>
            <div class="d-flex align-center">
              <span
                :class="metric.trend >= 0 ? 'success--text' : 'error--text'"
                class="text-caption font-weight-medium"
              >
                {{ Math.abs(metric.trend) }}%
              </span>
              <span class="text-caption text-medium-emphasis ml-1">
                vs previous {{ timeRange }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row class="mt-6">
      <!-- Revenue Chart -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Revenue Overview</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="revenueChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Order Distribution -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Order Distribution</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="orderDistributionOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Popular Items Table -->
    <v-row class="mt-6">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Popular Items</v-card-title>
          <v-table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-center">Orders</th>
                <th class="text-center">Revenue</th>
                <th class="text-center">Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in popularItems" :key="item.id">
                <td>{{ item.name }}</td>
                <td class="text-center">{{ item.orders }}</td>
                <td class="text-center">{{ formatPrice(item.revenue) }}</td>
                <td class="text-center">
                  <v-icon
                    :color="item.trend >= 0 ? 'success' : 'error'"
                    size="small"
                  >
                    {{ item.trend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                  </v-icon>
                  {{ Math.abs(item.trend) }}%
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>

      <!-- Customer Insights -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Customer Insights</v-card-title>
          <v-card-text>
            <v-row>
              <!-- Customer Satisfaction -->
              <v-col cols="12" sm="6">
                <div class="text-subtitle-2 mb-2">Customer Satisfaction</div>
                <v-progress-circular
                  :size="100"
                  :width="10"
                  :model-value="customerSatisfaction * 20"
                  color="primary"
                >
                  {{ customerSatisfaction }}/5
                </v-progress-circular>
                <div class="mt-2 text-caption">
                  Based on {{ ratings.length }} ratings
                </div>
              </v-col>

              <!-- Repeat Customers -->
              <v-col cols="12" sm="6">
                <div class="text-subtitle-2 mb-2">Repeat Customers</div>
                <v-progress-circular
                  :size="100"
                  :width="10"
                  :model-value="repeatCustomerRate"
                  color="success"
                >
                  {{ repeatCustomerRate }}%
                </v-progress-circular>
                <div class="mt-2 text-caption">
                  Of total customers
                </div>
              </v-col>
            </v-row>

            <!-- Rating Distribution -->
            <div class="mt-6">
              <div class="text-subtitle-2 mb-2">Rating Distribution</div>
              <div
                v-for="n in 5"
                :key="n"
                class="d-flex align-center mb-1"
              >
                <div class="mr-2" style="width: 20px">{{ n }}★</div>
                <v-progress-linear
                  :model-value="getRatingPercentage(n)"
                  height="8"
                  color="amber"
                  class="flex-grow-1"
                ></v-progress-linear>
                <div class="ml-2" style="width: 40px">
                  {{ getRatingPercentage(n) }}%
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Peak Hours -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Peak Hours</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="peakHoursOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import {
  LineChart,
  BarChart,
  PieChart,
  HeatmapChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  VisualMapComponent
])

export default {
  name: 'RestaurantAnalytics',

  components: {
    VChart
  },

  setup() {
    const store = useStore()
    const timeRange = ref('week')
    const timeRanges = [
      { title: 'Today', value: 'today' },
      { title: 'This Week', value: 'week' },
      { title: 'This Month', value: 'month' },
      { title: 'This Year', value: 'year' }
    ]

    // Computed metrics
    const metrics = computed(() => store.state.restaurantAdmin.metrics)
    const keyMetrics = computed(() => [
      {
        title: 'Total Orders',
        value: metrics.value.totalOrders,
        trend: metrics.value.ordersTrend
      },
      {
        title: 'Total Revenue',
        value: formatPrice(metrics.value.totalRevenue),
        trend: metrics.value.revenueTrend
      },
      {
        title: 'Average Order Value',
        value: formatPrice(metrics.value.avgOrderValue),
        trend: metrics.value.avgOrderTrend
      },
      {
        title: 'Customer Rating',
        value: metrics.value.avgRating.toFixed(1),
        trend: metrics.value.ratingTrend
      }
    ])

    // Charts data
    const revenueChartOption = computed(() => ({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['Revenue', 'Orders']
      },
      xAxis: {
        type: 'category',
        data: metrics.value.timeline
      },
      yAxis: [
        {
          type: 'value',
          name: 'Revenue',
          axisLabel: {
            formatter: '${value}'
          }
        },
        {
          type: 'value',
          name: 'Orders',
          position: 'right'
        }
      ],
      series: [
        {
          name: 'Revenue',
          type: 'line',
          smooth: true,
          data: metrics.value.revenueData
        },
        {
          name: 'Orders',
          type: 'bar',
          yAxisIndex: 1,
          data: metrics.value.ordersData
        }
      ]
    }))

    const orderDistributionOption = computed(() => ({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { value: metrics.value.deliveryOrders, name: 'Delivery' },
            { value: metrics.value.pickupOrders, name: 'Pickup' }
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }
      ]
    }))

    const peakHoursOption = computed(() => ({
      tooltip: {
        position: 'top'
      },
      visualMap: {
        min: 0,
        max: 10,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        top: 0
      },
      calendar: {
        top: 80,
        left: 30,
        right: 30,
        cellSize: ['auto', 20],
        range: metrics.value.peakHoursRange,
        itemStyle: {
          borderWidth: 0.5
        },
        yearLabel: { show: false }
      },
      series: {
        type: 'heatmap',
        coordinateSystem: 'calendar',
        data: metrics.value.peakHoursData
      }
    }))

    // Customer data
    const customerSatisfaction = computed(() => metrics.value.avgRating || 0)
    const repeatCustomerRate = computed(() => metrics.value.repeatCustomerRate || 0)
    const ratings = computed(() => metrics.value.ratings || [])
    const popularItems = computed(() => metrics.value.popularItems || [])

    const getRatingPercentage = (rating) => {
      if (!ratings.value.length) return 0
      const count = ratings.value.filter(r => Math.round(r) === rating).length
      return Math.round((count / ratings.value.length) * 100)
    }

    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }

    // Fetch data
    onMounted(async () => {
      try {
        await store.dispatch('restaurantAdmin/fetchAnalytics', {
          timeRange: timeRange.value
        })
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      }
    })

    return {
      timeRange,
      timeRanges,
      keyMetrics,
      revenueChartOption,
      orderDistributionOption,
      peakHoursOption,
      customerSatisfaction,
      repeatCustomerRate,
      ratings,
      popularItems,
      getRatingPercentage,
      formatPrice
    }
  }
}
</script>

<style scoped>
.max-width-200 {
  max-width: 200px;
}

.chart {
  width: 100%;
  height: 300px;
}
</style>
