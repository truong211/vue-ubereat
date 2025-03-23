&lt;template>
  <div class="analytics pa-6">
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">System Analytics</h1>
      <v-spacer></v-spacer>
      <v-btn-group class="mr-4">
        <v-btn
          v-for="period in timePeriods"
          :key="period.value"
          :variant="selectedPeriod === period.value ? 'elevated' : 'text'"
          @click="selectedPeriod = period.value"
        >
          {{ period.label }}
        </v-btn>
      </v-btn-group>
      <v-btn
        prepend-icon="mdi-download"
        @click="downloadReport"
      >
        Export Report
      </v-btn>
    </div>

    <!-- Stats Overview -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon size="36" color="primary" class="mr-4">mdi-currency-usd</v-icon>
              <div>
                <div class="text-overline mb-1">Total Revenue</div>
                <div class="text-h4">{{ formatCurrency(stats.revenue) }}</div>
              </div>
            </div>
            <div class="d-flex align-center">
              <v-icon
                :color="stats.revenueGrowth >= 0 ? 'success' : 'error'"
                size="small"
              >
                {{ stats.revenueGrowth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span 
                :class="stats.revenueGrowth >= 0 ? 'text-success' : 'text-error'"
                class="text-body-2 ml-1"
              >
                {{ Math.abs(stats.revenueGrowth) }}%
              </span>
              <span class="text-caption ml-2">vs previous period</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon size="36" color="success" class="mr-4">mdi-shopping</v-icon>
              <div>
                <div class="text-overline mb-1">Total Orders</div>
                <div class="text-h4">{{ formatNumber(stats.orders) }}</div>
              </div>
            </div>
            <div class="d-flex align-center">
              <v-icon
                :color="stats.ordersGrowth >= 0 ? 'success' : 'error'"
                size="small"
              >
                {{ stats.ordersGrowth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span 
                :class="stats.ordersGrowth >= 0 ? 'text-success' : 'text-error'"
                class="text-body-2 ml-1"
              >
                {{ Math.abs(stats.ordersGrowth) }}%
              </span>
              <span class="text-caption ml-2">vs previous period</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon size="36" color="info" class="mr-4">mdi-store</v-icon>
              <div>
                <div class="text-overline mb-1">Active Restaurants</div>
                <div class="text-h4">{{ formatNumber(stats.restaurants) }}</div>
              </div>
            </div>
            <div class="d-flex align-center">
              <v-icon
                :color="stats.restaurantsGrowth >= 0 ? 'success' : 'error'"
                size="small"
              >
                {{ stats.restaurantsGrowth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span 
                :class="stats.restaurantsGrowth >= 0 ? 'text-success' : 'text-error'"
                class="text-body-2 ml-1"
              >
                {{ Math.abs(stats.restaurantsGrowth) }}%
              </span>
              <span class="text-caption ml-2">vs previous period</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon size="36" color="warning" class="mr-4">mdi-account-group</v-icon>
              <div>
                <div class="text-overline mb-1">Active Users</div>
                <div class="text-h4">{{ formatNumber(stats.users) }}</div>
              </div>
            </div>
            <div class="d-flex align-center">
              <v-icon
                :color="stats.usersGrowth >= 0 ? 'success' : 'error'"
                size="small"
              >
                {{ stats.usersGrowth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              <span 
                :class="stats.usersGrowth >= 0 ? 'text-success' : 'text-error'"
                class="text-body-2 ml-1"
              >
                {{ Math.abs(stats.usersGrowth) }}%
              </span>
              <span class="text-caption ml-2">vs previous period</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row>
      <!-- Revenue Trend -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Revenue & Orders Trend</v-card-title>
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

    <!-- Detailed Analytics -->
    <v-row class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title>Detailed Analytics</v-card-title>
          <v-tabs v-model="activeTab">
            <v-tab value="restaurants">
              <v-icon start>mdi-store</v-icon>
              Restaurants
            </v-tab>
            <v-tab value="orders">
              <v-icon start>mdi-shopping</v-icon>
              Orders
            </v-tab>
            <v-tab value="users">
              <v-icon start>mdi-account-group</v-icon>
              Users
            </v-tab>
            <v-tab value="drivers">
              <v-icon start>mdi-bike</v-icon>
              Drivers
            </v-tab>
          </v-tabs>

          <v-card-text>
            <v-window v-model="activeTab">
              <!-- Restaurant Analytics -->
              <v-window-item value="restaurants">
                <v-table>
                  <thead>
                    <tr>
                      <th>Restaurant</th>
                      <th class="text-center">Orders</th>
                      <th class="text-center">Revenue</th>
                      <th class="text-center">Avg. Rating</th>
                      <th class="text-center">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="restaurant in topRestaurants" :key="restaurant.id">
                      <td>
                        <div class="d-flex align-center">
                          <v-avatar size="32" class="mr-2">
                            <v-img :src="restaurant.logo || '/img/default-restaurant.png'" />
                          </v-avatar>
                          {{ restaurant.name }}
                        </div>
                      </td>
                      <td class="text-center">{{ formatNumber(restaurant.orders) }}</td>
                      <td class="text-center">{{ formatCurrency(restaurant.revenue) }}</td>
                      <td class="text-center">
                        <v-rating
                          :model-value="restaurant.rating"
                          density="compact"
                          size="small"
                          readonly
                        ></v-rating>
                      </td>
                      <td class="text-center">
                        <v-chip
                          :color="restaurant.growth >= 0 ? 'success' : 'error'"
                          size="small"
                        >
                          {{ restaurant.growth >= 0 ? '+' : '' }}{{ restaurant.growth }}%
                        </v-chip>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-window-item>

              <!-- Order Analytics -->
              <v-window-item value="orders">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card flat>
                      <v-card-text>
                        <div class="text-h6 mb-2">Order Status Distribution</div>
                        <v-chart :option="orderStatusOption" autoresize class="chart-medium" />
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card flat>
                      <v-card-text>
                        <div class="text-h6 mb-2">Order Value Distribution</div>
                        <v-chart :option="orderValueOption" autoresize class="chart-medium" />
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- User Analytics -->
              <v-window-item value="users">
                <v-row>
                  <v-col cols="12" md="6">
                    <v-card flat>
                      <v-card-text>
                        <div class="text-h6 mb-2">User Growth</div>
                        <v-chart :option="userGrowthOption" autoresize class="chart-medium" />
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="12" md="6">
                    <v-card flat>
                      <v-card-text>
                        <div class="text-h6 mb-2">User Segments</div>
                        <v-chart :option="userSegmentsOption" autoresize class="chart-medium" />
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-window-item>

              <!-- Driver Analytics -->
              <v-window-item value="drivers">
                <v-table>
                  <thead>
                    <tr>
                      <th>Driver</th>
                      <th class="text-center">Deliveries</th>
                      <th class="text-center">On-Time Rate</th>
                      <th class="text-center">Avg. Delivery Time</th>
                      <th class="text-center">Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="driver in topDrivers" :key="driver.id">
                      <td>
                        <div class="d-flex align-center">
                          <v-avatar size="32" class="mr-2">
                            <v-img :src="driver.avatar || '/img/default-avatar.png'" />
                          </v-avatar>
                          {{ driver.name }}
                        </div>
                      </td>
                      <td class="text-center">{{ formatNumber(driver.deliveries) }}</td>
                      <td class="text-center">
                        <v-chip
                          :color="getOnTimeRateColor(driver.onTimeRate)"
                          size="small"
                        >
                          {{ driver.onTimeRate }}%
                        </v-chip>
                      </td>
                      <td class="text-center">{{ formatTime(driver.avgDeliveryTime) }}</td>
                      <td class="text-center">
                        <v-rating
                          :model-value="driver.rating"
                          density="compact"
                          size="small"
                          readonly
                        ></v-rating>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Export Dialog -->
    <v-dialog v-model="exportDialog.show" max-width="400">
      <v-card>
        <v-card-title>Export Report</v-card-title>
        <v-card-text>
          <v-form ref="exportForm">
            <v-select
              v-model="exportDialog.format"
              :items="exportFormats"
              label="Export Format"
              required
            ></v-select>
            <v-select
              v-model="exportDialog.sections"
              :items="exportSections"
              label="Report Sections"
              multiple
              chips
              required
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="exportDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="exportDialog.loading"
            @click="generateReport"
          >
            Export
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import {
  CanvasRenderer
} from 'echarts/renderers'
import {
  LineChart,
  BarChart,
  PieChart
} from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components'
import { useToast } from 'vue-toastification'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  ToolboxComponent
])

const store = useStore()
const toast = useToast()

// State
const selectedPeriod = ref('month')
const activeTab = ref('restaurants')
const loading = ref(false)
const stats = ref({
  revenue: 0,
  revenueGrowth: 0,
  orders: 0,
  ordersGrowth: 0,
  restaurants: 0,
  restaurantsGrowth: 0,
  users: 0,
  usersGrowth: 0
})

const topRestaurants = ref([])
const topDrivers = ref([])

const exportDialog = ref({
  show: false,
  format: 'excel',
  sections: ['overview'],
  loading: false
})

// Constants
const timePeriods = [
  { label: 'Today', value: 'today' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Year', value: 'year' }
]

const exportFormats = [
  { title: 'Excel (.xlsx)', value: 'excel' },
  { title: 'PDF (.pdf)', value: 'pdf' },
  { title: 'CSV (.csv)', value: 'csv' }
]

const exportSections = [
  { title: 'Overview', value: 'overview' },
  { title: 'Restaurant Analytics', value: 'restaurants' },
  { title: 'Order Analytics', value: 'orders' },
  { title: 'User Analytics', value: 'users' },
  { title: 'Driver Analytics', value: 'drivers' }
]

// Chart Options
const revenueChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross'
    }
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
    type: 'time',
    boundaryGap: false
  },
  yAxis: [
    {
      type: 'value',
      name: 'Revenue',
      position: 'left',
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
      data: store.state.analytics?.revenueTrend || []
    },
    {
      name: 'Orders',
      type: 'line',
      smooth: true,
      yAxisIndex: 1,
      data: store.state.analytics?.orderTrend || []
    }
  ]
}))

const orderDistributionOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: '{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: 'Orders',
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
          fontSize: '16',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: store.state.analytics?.orderDistribution || []
    }
  ]
}))

const orderStatusOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    top: '5%',
    left: 'center'
  },
  series: [
    {
      name: 'Order Status',
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
          fontSize: '16',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: store.state.analytics?.orderStatusDistribution || []
    }
  ]
}))

const orderValueOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'category',
    data: store.state.analytics?.orderValueRanges?.map(r => `$${r.min}-${r.max}`) || []
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: store.state.analytics?.orderValueDistribution || [],
      type: 'bar'
    }
  ]
}))

const userGrowthOption = computed(() => ({
  tooltip: {
    trigger: 'axis'
  },
  xAxis: {
    type: 'time',
    boundaryGap: false
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: store.state.analytics?.userGrowth || [],
      type: 'line',
      smooth: true,
      areaStyle: {}
    }
  ]
}))

const userSegmentsOption = computed(() => ({
  tooltip: {
    trigger: 'item'
  },
  legend: {
    orient: 'vertical',
    left: 'left'
  },
  series: [
    {
      name: 'User Segments',
      type: 'pie',
      radius: '50%',
      data: store.state.analytics?.userSegments || [],
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

// Methods
const loadAnalytics = async () => {
  loading.value = true
  try {
    const response = await store.dispatch('admin/getAnalytics', { period: selectedPeriod.value })
    stats.value = response.stats
    topRestaurants.value = response.restaurants
    topDrivers.value = response.drivers
  } catch (error) {
    toast.error('Failed to load analytics data')
    console.error('Analytics error:', error)
  } finally {
    loading.value = false
  }
}

const downloadReport = () => {
  exportDialog.value.show = true
}

const generateReport = async () => {
  exportDialog.value.loading = true
  try {
    await store.dispatch('admin/exportAnalytics', {
      format: exportDialog.value.format,
      sections: exportDialog.value.sections,
      period: selectedPeriod.value
    })
    exportDialog.value.show = false
    toast.success('Report exported successfully')
  } catch (error) {
    toast.error('Failed to export report')
    console.error('Export error:', error)
  } finally {
    exportDialog.value.loading = false
  }
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

const formatNumber = (value) => {
  return new Intl.NumberFormat().format(value)
}

const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const getOnTimeRateColor = (rate) => {
  if (rate >= 95) return 'success'
  if (rate >= 85) return 'warning'
  return 'error'
}

// Lifecycle
onMounted(() => {
  loadAnalytics()
})

// Watch for period changes
watch(selectedPeriod, () => {
  loadAnalytics()
})
</script>

<style scoped>
.chart {
  height: 400px;
}

.chart-medium {
  height: 300px;
}

:deep(.v-card-text) {
  padding: 16px;
}

.stats-card:hover {
  transform: translateY(-4px);
  transition: transform 0.2s ease;
}
</style>