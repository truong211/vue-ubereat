<template>
  <div class="admin-dashboard">
    <h1 class="text-h4 font-weight-bold mb-6">Dashboard</h1>

    <!-- Alerts Panel -->
    <alerts-panel class="mb-6"></alerts-panel>

    <!-- Stats Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-overline text-medium-emphasis">Total Orders</div>
                <div class="text-h4 font-weight-bold">{{ stats.orders.total }}</div>
                <div class="text-caption text-success d-flex align-center">
                  <v-icon size="small" class="mr-1">mdi-arrow-up</v-icon>
                  {{ stats.orders.growth }}% from last month
                </div>
              </div>
              <v-avatar rounded="lg" size="56" class="bg-primary-lighten-2 elevation-1">
                <v-icon size="32" color="primary">mdi-receipt</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-overline text-medium-emphasis">Total Revenue</div>
                <div class="text-h4 font-weight-bold">${{ formatMoney(stats.revenue.total) }}</div>
                <div class="text-caption text-success d-flex align-center">
                  <v-icon size="small" class="mr-1">mdi-arrow-up</v-icon>
                  {{ stats.revenue.growth }}% from last month
                </div>
              </div>
              <v-avatar rounded="lg" size="56" class="bg-success-lighten-2 elevation-1">
                <v-icon size="32" color="success">mdi-currency-usd</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-overline text-medium-emphasis">Total Users</div>
                <div class="text-h4 font-weight-bold">{{ stats.users.total }}</div>
                <div class="text-caption text-success d-flex align-center">
                  <v-icon size="small" class="mr-1">mdi-arrow-up</v-icon>
                  {{ stats.users.growth }}% from last month
                </div>
              </div>
              <v-avatar rounded="lg" size="56" class="bg-info-lighten-2 elevation-1">
                <v-icon size="32" color="info">mdi-account-group</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card">
          <v-card-text>
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-overline text-medium-emphasis">Restaurants</div>
                <div class="text-h4 font-weight-bold">{{ stats.restaurants.total }}</div>
                <div class="text-caption text-success d-flex align-center">
                  <v-icon size="small" class="mr-1">mdi-arrow-up</v-icon>
                  {{ stats.restaurants.growth }}% from last month
                </div>
              </div>
              <v-avatar rounded="lg" size="56" class="bg-warning-lighten-2 elevation-1">
                <v-icon size="32" color="warning">mdi-store</v-icon>
              </v-avatar>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts -->
    <v-row class="mb-6">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            Revenue Overview
            <v-spacer></v-spacer>
            <v-select
              v-model="revenueTimeframe"
              :items="timeframes"
              variant="outlined"
              density="compact"
              hide-details
              class="timeframe-select"
            ></v-select>
          </v-card-title>
          
          <v-card-text>
            <v-chart class="chart" :option="revenueChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Order Status</v-card-title>
          <v-card-text class="text-center">
            <v-chart class="pie-chart" :option="orderStatusChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Secondary Charts -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>User Growth</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="userGrowthChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Top Restaurants</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item v-for="(restaurant, index) in topRestaurants" :key="index">
                <template v-slot:prepend>
                  <v-avatar size="32">
                    <v-img :src="restaurant.logo" :alt="restaurant.name"></v-img>
                  </v-avatar>
                </template>
                
                <v-list-item-title>{{ restaurant.name }}</v-list-item-title>
                
                <template v-slot:append>
                  <div class="d-flex align-center">
                    <span class="text-body-2 font-weight-bold mr-2">${{ formatMoney(restaurant.revenue) }}</span>
                    <v-icon color="success" size="small">mdi-arrow-up</v-icon>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Top Cities</v-card-title>
          <v-card-text>
            <v-chart class="chart" :option="topCitiesChartOption" autoresize />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Orders -->
    <v-card>
      <v-card-title class="d-flex align-center">
        Recent Orders
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          color="primary"
          prepend-icon="mdi-eye"
          to="/admin/orders"
        >
          View All
        </v-btn>
      </v-card-title>
      
      <v-data-table
        :headers="orderHeaders"
        :items="recentOrders"
        :loading="loading"
        items-per-page="5"
      >
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getOrderStatusColor(item.status)"
            size="small"
          >
            {{ item.status }}
          </v-chip>
        </template>
        
        <template v-slot:item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>
        
        <template v-slot:item.amount="{ item }">
          ${{ formatMoney(item.amount) }}
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-icon
            color="primary"
            @click="viewOrder(item)"
          >
            mdi-eye
          </v-icon>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script>
import AlertsPanel from '@/components/admin/AlertsPanel.vue'
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminAPI } from '@/services/api.service'
import { useToast } from 'vue-toastification'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import { TooltipComponent, GridComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register ECharts components
echarts.use([
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  BarChart,
  PieChart,
  CanvasRenderer
])

export default {
  name: 'AdminDashboard',
  components: {
    AlertsPanel,
    VChart
  },
  setup() {
    const router = useRouter()
    const toast = useToast()
    const loading = ref(true)
    
    // Timeframe for revenue chart
    const revenueTimeframe = ref('month')
    const timeframes = [
      { title: 'Last 7 Days', value: 'week' },
      { title: 'Last 30 Days', value: 'month' },
      { title: 'Last 90 Days', value: 'quarter' },
      { title: 'Last Year', value: 'year' }
    ]
    
    // Dashboard statistics
    const stats = ref({
      orders: {
        total: 0,
        growth: 0
      },
      revenue: {
        total: 0,
        growth: 0
      },
      users: {
        total: 0,
        growth: 0
      },
      restaurants: {
        total: 0,
        growth: 0
      }
    })
    
    // Top restaurants
    const topRestaurants = ref([])
    
    // Recent orders
    const recentOrders = ref([])
    const orderHeaders = [
      { title: 'Order ID', key: 'id', sortable: true },
      { title: 'Date', key: 'date', sortable: true },
      { title: 'Customer', key: 'customer', sortable: true },
      { title: 'Restaurant', key: 'restaurant', sortable: true },
      { title: 'Amount', key: 'amount', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: '', key: 'actions', sortable: false, align: 'end' }
    ]
    
    // Revenue chart
    const revenueChartOption = computed(() => {
      let dates = []
      let revenues = []
      let orders = []
      
      // Generate dates based on selected timeframe
      const now = new Date()
      let days
      
      switch (revenueTimeframe.value) {
        case 'week':
          days = 7
          break
        case 'month':
          days = 30
          break
        case 'quarter':
          days = 90
          break
        case 'year':
          days = 365
          break
        default:
          days = 30
      }
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        
        if (days <= 30) {
          // Show day of month for shorter timeframes
          dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
        } else if (days <= 90) {
          // Show week number for quarter
          const weekNumber = Math.ceil((date.getDate() + 6 - date.getDay()) / 7)
          dates.push(`W${weekNumber}, ${date.toLocaleDateString('en-US', { month: 'short' })}`)
        } else {
          // Show month for year
          dates.push(date.toLocaleDateString('en-US', { month: 'short' }))
        }
        
        // For now, using mock data
        // In a real app, this data would come from the API
        revenues.push(Math.floor(Math.random() * 5000 + 1000))
        orders.push(Math.floor(Math.random() * 50 + 10))
      }
      
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            label: {
              backgroundColor: '#6a7985'
            }
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
        xAxis: [
          {
            type: 'category',
            boundaryGap: false,
            data: dates
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: 'Revenue ($)',
            position: 'left'
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
            areaStyle: {},
            emphasis: {
              focus: 'series'
            },
            data: revenues
          },
          {
            name: 'Orders',
            type: 'bar',
            yAxisIndex: 1,
            emphasis: {
              focus: 'series'
            },
            data: orders
          }
        ]
      }
    })
    
    // Order status chart
    const orderStatusChartOption = computed(() => {
      return {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: ['Completed', 'In Progress', 'Cancelled', 'Refunded']
        },
        series: [
          {
            name: 'Order Status',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: [
              { value: 735, name: 'Completed', itemStyle: { color: '#4CAF50' } },
              { value: 148, name: 'In Progress', itemStyle: { color: '#2196F3' } },
              { value: 78, name: 'Cancelled', itemStyle: { color: '#F44336' } },
              { value: 24, name: 'Refunded', itemStyle: { color: '#FF9800' } }
            ]
          }
        ]
      }
    })
    
    // User growth chart
    const userGrowthChartOption = computed(() => {
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['Customers', 'Restaurants', 'Drivers']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: 'Customers',
            type: 'bar',
            stack: 'total',
            emphasis: { focus: 'series' },
            data: [320, 302, 341, 374, 390, 450]
          },
          {
            name: 'Restaurants',
            type: 'bar',
            stack: 'total',
            emphasis: { focus: 'series' },
            data: [120, 132, 101, 134, 190, 230]
          },
          {
            name: 'Drivers',
            type: 'bar',
            stack: 'total',
            emphasis: { focus: 'series' },
            data: [220, 182, 191, 234, 290, 330]
          }
        ]
      }
    })
    
    // Top cities chart
    const topCitiesChartOption = computed(() => {
      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          top: 10,
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'value'
        },
        yAxis: {
          type: 'category',
          data: ['New York', 'Los Angeles', 'Chicago', 'Boston', 'Miami']
        },
        series: [
          {
            name: 'Orders',
            type: 'bar',
            data: [
              { value: 5000, itemStyle: { color: '#4CAF50' } },
              { value: 4200, itemStyle: { color: '#2196F3' } },
              { value: 3800, itemStyle: { color: '#9C27B0' } },
              { value: 3100, itemStyle: { color: '#FF9800' } },
              { value: 2500, itemStyle: { color: '#F44336' } }
            ]
          }
        ]
      }
    })
    
    // Methods
    const loadDashboardData = async () => {
      loading.value = true
      
      try {
        const response = await adminAPI.getDashboardStats()
        
        // Update dashboard stats
        stats.value = response.data.stats || {
          orders: {
            total: 1247,
            growth: 12.6
          },
          revenue: {
            total: 95420,
            growth: 15.3
          },
          users: {
            total: 3865,
            growth: 8.5
          },
          restaurants: {
            total: 187,
            growth: 5.2
          }
        }
        
        // Update top restaurants
        topRestaurants.value = response.data.topRestaurants || [
          {
            name: 'Italian Delights',
            logo: 'https://via.placeholder.com/40',
            revenue: 12500
          },
          {
            name: 'Burger Heaven',
            logo: 'https://via.placeholder.com/40',
            revenue: 11200
          },
          {
            name: 'Sushi Oasis',
            logo: 'https://via.placeholder.com/40',
            revenue: 9800
          },
          {
            name: 'Mexican Fiesta',
            logo: 'https://via.placeholder.com/40',
            revenue: 8500
          },
          {
            name: 'Bangkok Kitchen',
            logo: 'https://via.placeholder.com/40',
            revenue: 7300
          }
        ]
        
        // Update recent orders
        recentOrders.value = response.data.recentOrders || [
          {
            id: 'ORD-12345',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000),
            customer: 'John Smith',
            restaurant: 'Italian Delights',
            amount: 45.90,
            status: 'completed'
          },
          {
            id: 'ORD-12344',
            date: new Date(Date.now() - 3 * 60 * 60 * 1000),
            customer: 'Emma Johnson',
            restaurant: 'Burger Heaven',
            amount: 32.50,
            status: 'completed'
          },
          {
            id: 'ORD-12343',
            date: new Date(Date.now() - 5 * 60 * 60 * 1000),
            customer: 'Michael Davis',
            restaurant: 'Sushi Oasis',
            amount: 78.20,
            status: 'in-progress'
          },
          {
            id: 'ORD-12342',
            date: new Date(Date.now() - 6 * 60 * 60 * 1000),
            customer: 'Sarah Wilson',
            restaurant: 'Thai Spice',
            amount: 29.95,
            status: 'completed'
          },
          {
            id: 'ORD-12341',
            date: new Date(Date.now() - 12 * 60 * 60 * 1000),
            customer: 'Robert Brown',
            restaurant: 'Mexican Fiesta',
            amount: 52.75,
            status: 'cancelled'
          }
        ]
      } catch (error) {
        toast.error('Failed to load dashboard data: ' + (error.response?.data?.message || error.message))
      } finally {
        loading.value = false
      }
    }
    
    const formatMoney = (value) => {
      return parseFloat(value).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }
    
    const formatDate = (date) => {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }
    
    const getOrderStatusColor = (status) => {
      switch (status) {
        case 'completed': return 'success'
        case 'in-progress': return 'info'
        case 'cancelled': return 'error'
        case 'refunded': return 'warning'
        default: return 'grey'
      }
    }
    
    const viewOrder = (order) => {
      router.push(`/admin/orders/${order.id}`)
    }
    
    // Initialize data
    onMounted(() => {
      loadDashboardData()
    })
    
    return {
      loading,
      stats,
      revenueTimeframe,
      timeframes,
      topRestaurants,
      recentOrders,
      orderHeaders,
      revenueChartOption,
      orderStatusChartOption,
      userGrowthChartOption,
      topCitiesChartOption,
      formatMoney,
      formatDate,
      getOrderStatusColor,
      viewOrder
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  width: 100%;
  margin: 0 auto;
}

.stat-card {
  height: 100%;
}

.chart {
  height: 400px;
}

.pie-chart {
  height: 300px;
}

.timeframe-select {
  max-width: 180px;
}
</style>
