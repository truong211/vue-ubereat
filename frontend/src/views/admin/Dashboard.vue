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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import axios from 'axios'

export default {
  name: 'AdminDashboard',
  
  setup() {
    const router = useRouter()
    const toast = useToast()
    
    // Dashboard state
    const loading = ref(true)
    const timeframe = ref('week')
    const stats = ref({
      orders: { total: 0, growth: 0 },
      revenue: { total: 0, growth: 0 },
      users: { total: 0, growth: 0 },
      restaurants: { total: 0, growth: 0 }
    })
    
    // Restaurant approval stats
    const restaurantStats = ref({
      pending: 0,
      active: 0,
      suspended: 0
    })

    // Analytics data
    const analyticsData = ref({
      orderTrend: [],
      revenueTrend: [],
      userGrowth: [],
      popularCategories: [],
      topCities: []
    })

    // Recent activities
    const recentOrders = ref([])
    const recentUsers = ref([])
    const recentRestaurants = ref([])

    // Fetch dashboard data
    const loadDashboardData = async () => {
      try {
        loading.value = true
        const [statsResponse, analyticsResponse, activitiesResponse] = await Promise.all([
          axios.get('/api/admin/stats'),
          axios.get('/api/admin/analytics', { params: { timeframe: timeframe.value }}),
          axios.get('/api/admin/recent-activities')
        ])

        // Update stats
        stats.value = statsResponse.data.stats
        restaurantStats.value = statsResponse.data.restaurantStats
        
        // Update analytics
        analyticsData.value = analyticsResponse.data
        
        // Update activities
        recentOrders.value = activitiesResponse.data.orders
        recentUsers.value = activitiesResponse.data.users
        recentRestaurants.value = activitiesResponse.data.restaurants

      } catch (error) {
        toast.error('Failed to load dashboard data')
        console.error('Dashboard data error:', error)
      } finally {
        loading.value = false
      }
    }

    // Quick actions
    const viewPendingRestaurants = () => {
      router.push('/admin/restaurants?status=pending')
    }

    const viewRecentOrders = () => {
      router.push('/admin/orders')
    }

    const viewUserManagement = () => {
      router.push('/admin/users')
    }

    // Format values
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(value)
    }

    const formatNumber = (value) => {
      return new Intl.NumberFormat('en-US').format(value)
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    const getStatusColor = (status) => {
      const colors = {
        pending: 'warning',
        active: 'success',
        suspended: 'error',
        completed: 'success',
        processing: 'info',
        cancelled: 'error'
      }
      return colors[status] || 'grey'
    }

    // Watch for timeframe changes
    watch(timeframe, () => {
      loadDashboardData()
    })

    // Load initial data
    onMounted(() => {
      loadDashboardData()
    })

    return {
      loading,
      timeframe,
      stats,
      restaurantStats,
      analyticsData,
      recentOrders,
      recentUsers,
      recentRestaurants,
      viewPendingRestaurants,
      viewRecentOrders,
      viewUserManagement,
      formatCurrency,
      formatNumber,
      formatDate,
      getStatusColor
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

.dashboard-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.stats-card {
  height: 100%;
}

.chart-container {
  height: 300px;
}
</style>
