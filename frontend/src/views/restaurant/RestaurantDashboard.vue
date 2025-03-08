<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-6">Restaurant Dashboard</h1>

        <!-- Date Range Selector -->
        <v-card class="mb-6">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" sm="4">
                <v-select
                  v-model="dateRange"
                  :items="dateRangeOptions"
                  label="Date Range"
                  @update:model-value="fetchAnalytics"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="customStartDate"
                  type="date"
                  label="Start Date"
                  :disabled="dateRange !== 'custom'"
                  @update:model-value="fetchAnalytics"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="customEndDate"
                  type="date"
                  label="End Date"
                  :disabled="dateRange !== 'custom'"
                  @update:model-value="fetchAnalytics"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Revenue Statistics -->
        <v-row>
          <v-col cols="12" md="8">
            <v-card class="mb-6">
              <v-card-title>Revenue Statistics</v-card-title>
              <v-card-text>
                <v-chart class="chart" :option="revenueChartOption" autoresize />
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="mb-6">
              <v-card-title>Summary</v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item>
                    <v-list-item-title>Total Revenue</v-list-item-title>
                    <v-list-item-subtitle>{{ formatCurrency(totalRevenue) }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Total Orders</v-list-item-title>
                    <v-list-item-subtitle>{{ totalOrders }}</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <v-list-item-title>Average Order Value</v-list-item-title>
                    <v-list-item-subtitle>{{ formatCurrency(averageOrderValue) }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Best Selling Items -->
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center">
            Best Selling Items
            <v-spacer />
            <v-btn
              prepend-icon="mdi-download"
              variant="outlined"
              @click="exportReport"
            >
              Export Report
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Quantity Sold</th>
                  <th>Revenue</th>
                  <th>Average Rating</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in bestSellingItems" :key="item.id">
                  <td>{{ item.name }}</td>
                  <td>{{ item.quantitySold }}</td>
                  <td>{{ formatCurrency(item.revenue) }}</td>
                  <td>
                    <v-rating
                      :model-value="item.rating"
                      density="compact"
                      size="small"
                      readonly
                    />
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import analyticsService from '@/services/analytics.service'

// Initialize ECharts
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent
])

const store = useStore()
const dateRange = ref('last30days')
const customStartDate = ref('')
const customEndDate = ref('')
const totalRevenue = ref(0)
const totalOrders = ref(0)
const averageOrderValue = ref(0)
const bestSellingItems = ref([])

const dateRangeOptions = [
  { title: 'Last 7 Days', value: 'last7days' },
  { title: 'Last 30 Days', value: 'last30days' },
  { title: 'Last 90 Days', value: 'last90days' },
  { title: 'Custom Range', value: 'custom' }
]

const revenueChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['Revenue', 'Orders']
  },
  xAxis: {
    type: 'category',
    data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  },
  yAxis: [
    {
      type: 'value',
      name: 'Revenue',
      axisLabel: {
        formatter: '{value} đ'
      }
    },
    {
      type: 'value',
      name: 'Orders',
      axisLabel: {
        formatter: '{value}'
      }
    }
  ],
  series: [
    {
      name: 'Revenue',
      type: 'bar',
      data: [10000, 15000, 12000, 18000, 20000, 25000, 22000]
    },
    {
      name: 'Orders',
      type: 'line',
      yAxisIndex: 1,
      data: [20, 30, 25, 35, 40, 50, 45]
    }
  ]
}))

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}

const fetchAnalytics = async () => {
  try {
    const restaurantId = store.state.auth.user.restaurantId
    const options = {
      startDate: customStartDate.value || undefined,
      endDate: customEndDate.value || undefined
    }

    const [salesData, menuData] = await Promise.all([
      analyticsService.getSalesAnalytics(restaurantId, options),
      analyticsService.getMenuAnalytics(restaurantId, options)
    ])

    // Update the data
    totalRevenue.value = salesData.totalRevenue
    totalOrders.value = salesData.totalOrders
    averageOrderValue.value = salesData.averageOrderValue
    bestSellingItems.value = menuData.items

    // Update chart data here...
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  }
}

const exportReport = async () => {
  try {
    const restaurantId = store.state.auth.user.restaurantId
    const format = 'pdf' // or 'excel'
    const response = await analyticsService.exportReport(restaurantId, {
      startDate: customStartDate.value,
      endDate: customEndDate.value,
      format
    })

    // Handle the response - typically downloading the file
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `restaurant-report.${format}`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (error) {
    console.error('Failed to export report:', error)
  }
}

onMounted(() => {
  fetchAnalytics()
})
</script>

<style scoped>
.chart {
  height: 400px;
}
</style>