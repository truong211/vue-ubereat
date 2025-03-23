<template>
  <div class="analytics">
    <v-row>
      <v-col cols="12" class="d-flex align-center mb-4">
        <h1 class="text-h4">Analytics & Reports</h1>
        <v-spacer></v-spacer>
        <v-select
          v-model="timeRange"
          :items="timeRanges"
          density="comfortable"
          hide-details
          class="time-select"
        ></v-select>
      </v-col>
    </v-row>

    <!-- Metrics Summary Cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stats-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-medium-emphasis text-caption">Tổng doanh thu</div>
                <div class="text-h5 font-weight-bold">
                  {{ formatCurrency(metrics.revenue) }}
                </div>
              </div>
              <v-avatar color="primary" size="48" rounded>
                <v-icon>mdi-currency-usd</v-icon>
              </v-avatar>
            </div>
            <v-chip
              density="comfortable"
              size="small"
              :color="metrics.revenueTrend >= 0 ? 'success' : 'error'"
              class="mt-2"
            >
              <v-icon start size="small">
                {{ metrics.revenueTrend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              {{ Math.abs(metrics.revenueTrend).toFixed(1) }}%
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stats-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-medium-emphasis text-caption">Tổng đơn hàng</div>
                <div class="text-h5 font-weight-bold">{{ metrics.orders }}</div>
              </div>
              <v-avatar color="info" size="48" rounded>
                <v-icon>mdi-receipt</v-icon>
              </v-avatar>
            </div>
            <v-chip
              density="comfortable"
              size="small"
              :color="metrics.ordersTrend >= 0 ? 'success' : 'error'"
              class="mt-2"
            >
              <v-icon start size="small">
                {{ metrics.ordersTrend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              {{ Math.abs(metrics.ordersTrend).toFixed(1) }}%
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stats-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-medium-emphasis text-caption">Giá trị trung bình</div>
                <div class="text-h5 font-weight-bold">
                  {{ formatCurrency(metrics.avgOrderValue) }}
                </div>
              </div>
              <v-avatar color="success" size="48" rounded>
                <v-icon>mdi-cash-multiple</v-icon>
              </v-avatar>
            </div>
            <v-chip
              density="comfortable"
              size="small"
              :color="metrics.avgOrderTrend >= 0 ? 'success' : 'error'"
              class="mt-2"
            >
              <v-icon start size="small">
                {{ metrics.avgOrderTrend >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              {{ Math.abs(metrics.avgOrderTrend).toFixed(1) }}%
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stats-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-medium-emphasis text-caption">Tỷ lệ hủy</div>
                <div class="text-h5 font-weight-bold">
                  {{ metrics.cancelRate.toFixed(1) }}%
                </div>
              </div>
              <v-avatar :color="metrics.cancelRate > 10 ? 'error' : 'success'" size="48" rounded>
                <v-icon>mdi-close-circle</v-icon>
              </v-avatar>
            </div>
            <v-chip
              density="comfortable"
              size="small"
              :color="metrics.cancelRateTrend <= 0 ? 'success' : 'error'"
              class="mt-2"
            >
              <v-icon start size="small">
                {{ metrics.cancelRateTrend <= 0 ? 'mdi-arrow-down' : 'mdi-arrow-up' }}
              </v-icon>
              {{ Math.abs(metrics.cancelRateTrend).toFixed(1) }}%
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Row -->
    <v-row class="mt-4">
      <!-- Revenue Chart -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            Doanh thu theo thời gian
            <v-spacer></v-spacer>
            <v-btn-group density="comfortable">
              <v-btn
                v-for="period in ['day', 'week', 'month']"
                :key="period"
                :active="selectedPeriod === period"
                @click="selectedPeriod = period"
                size="small"
                variant="text"
              >
                {{ period === 'day' ? 'Ngày' : period === 'week' ? 'Tuần' : 'Tháng' }}
              </v-btn>
            </v-btn-group>
          </v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="revenueChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Category Distribution -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Phân bố theo danh mục</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="categoryChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Popular Items and Customer Analytics -->
    <v-row class="mt-4">
      <!-- Popular Items -->
      <v-col cols="12" md="7">
        <v-card>
          <v-card-title>Món ăn bán chạy</v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Món ăn</th>
                  <th class="text-right">Số lượng</th>
                  <th class="text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in topItems" :key="item.id">
                  <td>
                    <div class="d-flex align-center">
                      <v-avatar size="32" class="mr-2">
                        <v-img :src="item.image" cover></v-img>
                      </v-avatar>
                      {{ item.name }}
                    </div>
                  </td>
                  <td class="text-right">{{ item.quantity }}</td>
                  <td class="text-right">{{ formatCurrency(item.revenue) }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Customer Analytics -->
      <v-col cols="12" md="5">
        <v-card>
          <v-card-title>Phân tích khách hàng</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-account-multiple</v-icon>
                </template>
                <v-list-item-title>Tổng số khách hàng</v-list-item-title>
                <v-list-item-subtitle>{{ customerMetrics.totalCustomers }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="success">mdi-account-plus</v-icon>
                </template>
                <v-list-item-title>Khách hàng mới</v-list-item-title>
                <v-list-item-subtitle>{{ customerMetrics.newCustomers }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="info">mdi-account-check</v-icon>
                </template>
                <v-list-item-title>Khách hàng quay lại</v-list-item-title>
                <v-list-item-subtitle>{{ customerMetrics.returningCustomers }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
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
import { LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import analyticsService from '@/services/analytics.service'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent
])

export default {
  name: 'RestaurantAnalytics',
  
  components: {
    VChart
  },

  setup() {
    const store = useStore()
    const timeRange = ref('week')
    const selectedPeriod = ref('week')
    const metrics = ref({
      revenue: 0,
      orders: 0,
      avgOrderValue: 0,
      cancelRate: 0,
      revenueTrend: 0,
      ordersTrend: 0,
      avgOrderTrend: 0,
      cancelRateTrend: 0
    })
    const timeSeriesData = ref([])
    const topItems = ref([])
    const customerMetrics = ref({
      totalCustomers: 0,
      newCustomers: 0,
      returningCustomers: 0
    })

    const timeRanges = [
      { title: 'Hôm nay', value: 'day' },
      { title: 'Tuần này', value: 'week' },
      { title: 'Tháng này', value: 'month' }
    ]

    // Format currency
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value)
    }

    // Revenue chart options
    const revenueChartOption = computed(() => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const [revenue, orders] = params
          return `${revenue.axisValue}<br/>
            ${revenue.marker} Doanh thu: ${formatCurrency(revenue.value)}<br/>
            ${orders.marker} Đơn hàng: ${orders.value}`
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
        boundaryGap: false,
        data: timeSeriesData.value.map(item => item.date)
      },
      yAxis: [
        {
          type: 'value',
          name: 'Doanh thu',
          axisLabel: {
            formatter: value => formatCurrency(value)
          }
        },
        {
          type: 'value',
          name: 'Đơn hàng',
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Doanh thu',
          type: 'line',
          smooth: true,
          data: timeSeriesData.value.map(item => item.revenue),
          areaStyle: {
            opacity: 0.1
          }
        },
        {
          name: 'Đơn hàng',
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: timeSeriesData.value.map(item => item.orders)
        }
      ]
    }))

    // Category distribution chart options
    const categoryChartOption = computed(() => ({
      tooltip: {
        trigger: 'item',
        formatter: params => `${params.name}: ${params.value}%`
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
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
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          data: store.state.analytics.categoryData
        }
      ]
    }))

    // Load analytics data
    const loadAnalytics = async () => {
      try {
        const restaurantId = store.state.auth.restaurant?.id
        if (!restaurantId) return

        // Get revenue analytics
        const revenueData = await analyticsService.getRevenueAnalytics(restaurantId, {
          timeRange: timeRange.value
        })
        metrics.value = revenueData.summary
        timeSeriesData.value = revenueData.timeSeriesData
        topItems.value = revenueData.topItems

        // Get customer analytics
        const customerData = await analyticsService.getCustomerAnalytics(restaurantId, {
          period: timeRange.value
        })
        customerMetrics.value = customerData

        // Get menu analytics for category distribution
        const menuData = await analyticsService.getMenuAnalytics(restaurantId, {
          period: timeRange.value
        })
        store.commit('analytics/setCategoryData', menuData.categories)
      } catch (error) {
        console.error('Failed to load analytics:', error)
      }
    }

    // Watch for time range changes
    watch(timeRange, () => {
      loadAnalytics()
    })

    // Initialize data
    onMounted(() => {
      loadAnalytics()
    })

    return {
      timeRange,
      timeRanges,
      selectedPeriod,
      metrics,
      topItems,
      customerMetrics,
      revenueChartOption,
      categoryChartOption,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.analytics {
  padding: 16px;
}

.chart {
  width: 100%;
  height: 400px;
}

.time-select {
  max-width: 150px;
}

:deep(.v-card-text) {
  padding: 16px;
}
</style>