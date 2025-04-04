<template>
  <div class="admin-dashboard">
    <v-container fluid>
      <!-- Loading overlay -->
      <v-overlay v-if="loading" :value="loading" class="d-flex justify-center align-center">
        <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
      </v-overlay>

      <!-- Error alert -->
      <v-alert v-if="hasError" type="error" class="mb-4">
        There was an error loading some dashboard data. Some information may be incomplete.
        <v-btn @click="loadDashboardData" color="white" text class="ml-2">Retry</v-btn>
    </v-alert>

      <!-- Dashboard header -->
      <v-row class="mb-6">
        <v-col cols="12" md="8">
          <h1 class="text-h4 font-weight-bold">Dashboard</h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            Welcome to the admin dashboard. Here's an overview of your platform.
          </p>
        </v-col>
        <v-col cols="12" md="4" class="d-flex justify-end align-center">
          <v-select
            v-model="timeframe"
            :items="timeframes"
            item-title="title"
            item-value="value"
            label="Timeframe"
            hide-details
            dense
            outlined
            class="max-width-200"
          ></v-select>
        </v-col>
      </v-row>

      <!-- Stats Overview -->
      <v-row>
        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg">
            <v-card-text class="pa-4">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-overline text-medium-emphasis">TOTAL ORDERS</div>
                  <div class="text-h4 font-weight-bold">{{ stats.orders?.total || 0 }}</div>
                  <div class="d-flex align-center mt-1">
                    <v-icon 
                      :color="(stats.orders?.growth || 0) >= 0 ? 'success' : 'error'" 
                      size="small"
                    >
                      {{ (stats.orders?.growth || 0) >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                    </v-icon>
                    <span class="text-caption ml-1" :class="(stats.orders?.growth || 0) >= 0 ? 'text-success' : 'text-error'">
                      {{ Math.abs(stats.orders?.growth || 0) }}%
                    </span>
                  </div>
                </div>
                <v-avatar color="primary" size="56" class="elevation-2">
                  <v-icon color="white" size="32">mdi-receipt</v-icon>
                </v-avatar>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg">
            <v-card-text class="pa-4">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-overline text-medium-emphasis">REVENUE</div>
                  <div class="text-h4 font-weight-bold">${{ formatMoney(stats.revenue?.total || 0) }}</div>
                  <div class="d-flex align-center mt-1">
                    <v-icon 
                      :color="(stats.revenue?.growth || 0) >= 0 ? 'success' : 'error'" 
                      size="small"
                    >
                      {{ (stats.revenue?.growth || 0) >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                    </v-icon>
                    <span class="text-caption ml-1" :class="(stats.revenue?.growth || 0) >= 0 ? 'text-success' : 'text-error'">
                      {{ Math.abs(stats.revenue?.growth || 0) }}%
                    </span>
                  </div>
                </div>
                <v-avatar color="success" size="56" class="elevation-2">
                  <v-icon color="white" size="32">mdi-cash-multiple</v-icon>
                </v-avatar>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg">
            <v-card-text class="pa-4">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-overline text-medium-emphasis">USERS</div>
                  <div class="text-h4 font-weight-bold">{{ formatNumber(stats.users?.total || 0) }}</div>
                  <div class="d-flex align-center mt-1">
                    <v-icon 
                      :color="(stats.users?.growth || 0) >= 0 ? 'success' : 'error'" 
                      size="small"
                    >
                      {{ (stats.users?.growth || 0) >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                    </v-icon>
                    <span class="text-caption ml-1" :class="(stats.users?.growth || 0) >= 0 ? 'text-success' : 'text-error'">
                      {{ Math.abs(stats.users?.growth || 0) }}%
                    </span>
                  </div>
                </div>
                <v-avatar color="info" size="56" class="elevation-2">
                  <v-icon color="white" size="32">mdi-account-group</v-icon>
                </v-avatar>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" sm="6" md="3">
          <v-card class="rounded-lg">
            <v-card-text class="pa-4">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-overline text-medium-emphasis">RESTAURANTS</div>
                  <div class="text-h4 font-weight-bold">{{ formatNumber(stats.restaurants?.total || 0) }}</div>
                  <div class="d-flex align-center mt-1">
                    <v-icon 
                      :color="(stats.restaurants?.growth || 0) >= 0 ? 'success' : 'error'" 
                      size="small"
                    >
                      {{ (stats.restaurants?.growth || 0) >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
                    </v-icon>
                    <span class="text-caption ml-1" :class="(stats.restaurants?.growth || 0) >= 0 ? 'text-success' : 'text-error'">
                      {{ Math.abs(stats.restaurants?.growth || 0) }}%
                    </span>
                  </div>
                </div>
                <v-avatar color="warning" size="56" class="elevation-2">
                  <v-icon color="white" size="32">mdi-store</v-icon>
                </v-avatar>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts and alerts section -->
      <v-row class="mt-6">
      <!-- Charts -->
        <v-col cols="12" md="8">
          <v-card class="rounded-lg mb-4">
            <v-card-title class="d-flex justify-space-between align-center">
              Revenue Trend
              <v-select
                v-model="revenueTimeframe"
                :items="timeframes"
                item-title="title"
                item-value="value"
                label="Timeframe"
                hide-details
                dense
                class="max-width-150"
              ></v-select>
            </v-card-title>
            <v-card-text>
              <v-sheet height="300" class="pa-4" v-if="analyticsData.revenueTrend && analyticsData.revenueTrend.length > 0">
                <v-chart :option="revenueChartOption" autoresize />
              </v-sheet>
              <v-sheet height="300" class="pa-4 d-flex justify-center align-center" v-else>
                <div class="text-center">
                  <v-icon color="grey" size="64">mdi-chart-line</v-icon>
                  <div class="text-subtitle-1 text-medium-emphasis mt-2">No revenue data available for the selected timeframe</div>
                </div>
              </v-sheet>
            </v-card-text>
          </v-card>

          <v-row>
            <v-col cols="12" md="6">
              <v-card class="rounded-lg">
                <v-card-title>Order Status</v-card-title>
            <v-card-text>
                  <v-sheet height="200" class="pa-2" v-if="analyticsData.orderStatusCounts && analyticsData.orderStatusCounts.length > 0">
                    <v-chart :option="orderStatusChartOption" autoresize />
                  </v-sheet>
                  <v-sheet height="200" class="pa-2 d-flex justify-center align-center" v-else>
                <div class="text-center">
                      <v-icon color="grey" size="48">mdi-chart-pie</v-icon>
                      <div class="text-subtitle-2 text-medium-emphasis mt-2">No order status data</div>
                </div>
                  </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>
        
            <v-col cols="12" md="6">
              <v-card class="rounded-lg">
                <v-card-title>User Growth</v-card-title>
                <v-card-text>
                  <v-sheet height="200" class="pa-2" v-if="analyticsData.userGrowth && analyticsData.userGrowth.length > 0">
                    <v-chart :option="userGrowthChartOption" autoresize />
                  </v-sheet>
                  <v-sheet height="200" class="pa-2 d-flex justify-center align-center" v-else>
                <div class="text-center">
                      <v-icon color="grey" size="48">mdi-account-multiple</v-icon>
                      <div class="text-subtitle-2 text-medium-emphasis mt-2">No user growth data</div>
                </div>
                  </v-sheet>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-col>

        <!-- Alerts Panel -->
        <v-col cols="12" md="4">
          <v-card v-if="hasAlertsPanel" class="rounded-lg mb-4">
            <component 
              :is="alertsPanel" 
              @error="(err) => handleComponentError(err, 'AlertsPanel')"
            />
          </v-card>
          <v-card v-else class="rounded-lg mb-4">
            <v-card-title>Alerts</v-card-title>
            <v-card-text class="text-center pa-6">
              <v-icon color="grey" size="64">mdi-bell-off</v-icon>
              <div class="text-h6 mt-2">Alert System Unavailable</div>
              <div class="text-body-2 text-medium-emphasis">
                The alert system is temporarily unavailable. Check back later.
              </div>
            </v-card-text>
          </v-card>

          <v-card class="rounded-lg">
            <v-card-title>Restaurant Status</v-card-title>
            <v-card-text class="px-0">
              <v-list>
                <v-list-item @click="viewPendingRestaurants">
                  <template v-slot:prepend>
                    <v-avatar color="warning" size="32">
                      <v-icon color="white" size="small">mdi-clock-outline</v-icon>
                    </v-avatar>
                  </template>
                  
                  <div class="d-flex align-center">
                    <v-list-item-title>Pending Approval</v-list-item-title>
                  </div>
                  
                  <template v-slot:append>
                    <v-chip color="warning" text-color="white">{{ restaurantStats.pending || 0 }}</v-chip>
                  </template>
                </v-list-item>
                
                <v-divider></v-divider>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-avatar color="success" size="32">
                      <v-icon color="white" size="small">mdi-check-circle</v-icon>
                    </v-avatar>
                  </template>
                  
                  <div class="d-flex align-center">
                    <v-list-item-title>Active Restaurants</v-list-item-title>
                  </div>
                  
                  <template v-slot:append>
                    <v-chip color="success" text-color="white">{{ restaurantStats.active || 0 }}</v-chip>
                  </template>
                </v-list-item>
                
                <v-divider></v-divider>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-avatar color="error" size="32">
                      <v-icon color="white" size="small">mdi-alert-circle</v-icon>
                    </v-avatar>
                  </template>
                  
                  <div class="d-flex align-center">
                    <v-list-item-title>Suspended</v-list-item-title>
                  </div>
                  
                  <template v-slot:append>
                    <v-chip color="error" text-color="white">{{ restaurantStats.suspended || 0 }}</v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Popular cities and top restaurants -->
      <v-row class="mt-6">
        <v-col cols="12" md="6">
          <v-card class="rounded-lg">
            <v-card-title>Popular Cities</v-card-title>
            <v-card-text>
              <v-sheet height="300" class="pa-2" v-if="analyticsData.topCities && analyticsData.topCities.length > 0">
                <v-chart :option="topCitiesChartOption" autoresize />
              </v-sheet>
              <v-sheet height="300" class="pa-2 d-flex justify-center align-center" v-else>
                <div class="text-center">
                  <v-icon color="grey" size="64">mdi-map-marker</v-icon>
                  <div class="text-subtitle-1 text-medium-emphasis mt-2">No city data available</div>
                </div>
              </v-sheet>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-card class="rounded-lg">
            <v-card-title>Top Restaurants</v-card-title>
            <v-card-text class="pa-0">
              <v-list>
                <template v-for="(restaurant, index) in topRestaurants" :key="index">
                  <v-list-item>
                  <template v-slot:prepend>
                      <v-avatar size="40">
                        <v-img :src="restaurant.logo" alt="Restaurant logo"></v-img>
                    </v-avatar>
                  </template>
                    
                    <div class="d-flex align-center">
                  <v-list-item-title>{{ restaurant.name }}</v-list-item-title>
                    </div>
                    
                  <template v-slot:append>
                      <div class="text-subtitle-2 font-weight-medium text-success">
                        {{ formatCurrency(restaurant.revenue) }}
                    </div>
                  </template>
                </v-list-item>
                  <v-divider v-if="index < topRestaurants.length - 1"></v-divider>
                </template>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Database tables -->
      <v-row class="mt-6">
        <v-col cols="12">
          <v-card class="rounded-lg">
            <v-card-title class="d-flex justify-space-between align-center">
              Database Tables
              <v-text-field
                v-model="tableSearch"
                prepend-inner-icon="mdi-magnify"
                label="Search tables"
                hide-details
                density="compact"
                class="max-width-300"
              ></v-text-field>
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col v-for="table in filteredTables" :key="table ? table.name || 'unknown' : 'unknown'" cols="12" sm="6" md="4" lg="3">
                  <v-card 
                    v-if="table && table.name"
                    variant="outlined" 
                    class="rounded-lg mb-3 pa-2 table-card"
                    @click="navigateToTable(table.name)"
                    style="cursor: pointer;"
                    :ripple="true"
                  >
                    <div class="d-flex align-center pa-2">
                      <v-avatar color="primary" class="mr-4" size="40">
                        <v-icon color="white">{{ table.icon || 'mdi-database' }}</v-icon>
                      </v-avatar>
                      <div>
                        <div class="text-subtitle-1 font-weight-medium">{{ formatTableName(table.name) }}</div>
                        <div class="text-caption text-medium-emphasis">{{ table.description || 'Database table' }}</div>
                      </div>
                    </div>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick actions -->
      <v-row class="mt-6 mb-6">
        <v-col cols="12">
          <v-card class="rounded-lg">
            <v-card-title>Quick Actions</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6" md="4">
          <v-btn
                    @click="viewPendingRestaurants" 
                    color="warning" 
                    block 
                    variant="elevated" 
                    class="py-6"
                  >
                    <v-icon start>mdi-store-clock</v-icon>
                    View Pending Restaurants
          </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-btn 
                    @click="viewRecentOrders" 
                    color="success" 
                    block 
                    variant="elevated" 
                    class="py-6"
                  >
                    <v-icon start>mdi-receipt</v-icon>
                    View Recent Orders
                  </v-btn>
                </v-col>
                <v-col cols="12" sm="6" md="4">
                  <v-btn 
                    @click="viewUserManagement" 
                    color="info" 
                    block 
                    variant="elevated" 
                    class="py-6"
                  >
                    <v-icon start>mdi-account-cog</v-icon>
                    User Management
                  </v-btn>
                </v-col>
              </v-row>
            </v-card-text>
      </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import axios from 'axios'
import VChart from 'vue-echarts'
import * as echarts from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

// Register ECharts components
echarts.use([
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  LineChart,
  PieChart,
  CanvasRenderer
])

export default {
  name: 'AdminDashboard',
  
  components: {
    VChart,
    // Lazy load the alerts panel to avoid errors if it fails to load
    AlertsPanel: defineAsyncComponent({
      loader: () => import('@/components/admin/AlertsPanel.vue'),
      onError: (error, retry, fail, attempts) => {
        console.error('Error loading AlertsPanel component:', error)
        if (attempts <= 3) {
          retry()
        } else {
          fail()
        }
      }
    })
  },
  
  setup() {
    const router = useRouter()
    const toast = useToast()
    
    // Dashboard state
    const loading = ref(true)
    const hasError = ref(false)
    const hasAlertsPanel = ref(true)
    const alertsPanel = ref('AlertsPanel')
    const timeframe = ref('week')
    const revenueTimeframe = ref('week')
    const tableSearch = ref('')
    const stats = ref({
      orders: { total: 0, growth: 0 },
      revenue: { total: 0, growth: 0 },
      users: { total: 0, growth: 0 },
      restaurants: { total: 0, growth: 0 }
    })
    
    // Dashboard views
    const orderHeaders = ref([
      { title: 'Order ID', key: 'id' },
      { title: 'Customer', key: 'customer' },
      { title: 'Date', key: 'date' },
      { title: 'Amount', key: 'amount' },
      { title: 'Status', key: 'status' },
      { title: 'Actions', key: 'actions' }
    ])
    
    // Chart options (placeholders)
    const revenueChartOption = computed(() => {
      if (!analyticsData.value.revenueTrend || analyticsData.value.revenueTrend.length === 0) {
        return {
          title: { text: 'Revenue Trend' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: [] },
          yAxis: { type: 'value' },
          series: [{ data: [], type: 'line' }]
        }
      }
      
      return {
        title: { text: 'Revenue Trend' },
        tooltip: { trigger: 'axis' },
        xAxis: { 
          type: 'category', 
          data: analyticsData.value.revenueTrend.map(item => item.date || '') 
        },
        yAxis: { type: 'value' },
        series: [{ 
          data: analyticsData.value.revenueTrend.map(item => item.amount || 0), 
          type: 'line',
          smooth: true
        }]
      }
    })
    
    const orderStatusChartOption = computed(() => {
      if (!analyticsData.value.orderStatusCounts || analyticsData.value.orderStatusCounts.length === 0) {
        return {
          title: { text: 'Order Status' },
          tooltip: { trigger: 'item' },
          series: [{ type: 'pie', radius: '70%', data: [] }]
        }
      }
      
      return {
        title: { text: 'Order Status' },
        tooltip: { trigger: 'item' },
        series: [{ 
          type: 'pie', 
          radius: '70%', 
          data: analyticsData.value.orderStatusCounts.map(item => ({
            name: item.status || 'Unknown',
            value: item.count || 0
          }))
        }]
      }
    })
    
    const userGrowthChartOption = computed(() => {
      if (!analyticsData.value.userGrowth || analyticsData.value.userGrowth.length === 0) {
        return {
          title: { text: 'User Growth' },
          tooltip: { trigger: 'axis' },
          xAxis: { type: 'category', data: [] },
          yAxis: { type: 'value' },
          series: [{ data: [], type: 'line' }]
        }
      }
      
      return {
        title: { text: 'User Growth' },
        tooltip: { trigger: 'axis' },
        xAxis: { 
          type: 'category', 
          data: analyticsData.value.userGrowth.map(item => item.date || '') 
        },
        yAxis: { type: 'value' },
        series: [{ 
          data: analyticsData.value.userGrowth.map(item => item.count || 0), 
          type: 'line',
          smooth: true
        }]
      }
    })
    
    const topCitiesChartOption = computed(() => {
      if (!analyticsData.value.topCities || analyticsData.value.topCities.length === 0) {
        return {
          title: { text: 'Top Cities' },
          tooltip: { trigger: 'item' },
          series: [{ type: 'pie', radius: '70%', data: [] }]
        }
      }
      
      return {
        title: { text: 'Top Cities' },
        tooltip: { trigger: 'item' },
        series: [{ 
          type: 'pie', 
          radius: '70%', 
          data: analyticsData.value.topCities.map(item => ({
            name: item.city || 'Unknown',
            value: item.count || 0
          }))
        }]
      }
    })
    
    // Sample data
    const topRestaurants = ref([
      { name: 'Burger Palace', logo: '/img/restaurants/logo1.png', revenue: 12500 },
      { name: 'Pizza Hut', logo: '/img/restaurants/logo2.png', revenue: 10200 },
      { name: 'Taco Bell', logo: '/img/restaurants/logo3.png', revenue: 9800 }
    ])
    
    const timeframes = ref([
      { title: 'Today', value: 'today' },
      { title: 'This Week', value: 'week' },
      { title: 'This Month', value: 'month' },
      { title: 'This Year', value: 'year' }
    ])
    
    // Database tables
    const tables = ref([
      { name: 'users', icon: 'mdi-account-multiple', description: 'Manage user accounts' },
      { name: 'restaurants', icon: 'mdi-store', description: 'Manage restaurant listings' },
      { name: 'categories', icon: 'mdi-tag-multiple', description: 'Manage food categories' },
      { name: 'products', icon: 'mdi-food', description: 'Manage food products' },
      { name: 'orders', icon: 'mdi-receipt', description: 'View and manage orders' },
      { name: 'order_items', icon: 'mdi-cart-outline', description: 'Manage order items' },
      { name: 'reviews', icon: 'mdi-star', description: 'Moderate customer reviews' },
      { name: 'review_votes', icon: 'mdi-thumb-up-down', description: 'Review feedback' },
      { name: 'addresses', icon: 'mdi-map-marker', description: 'Manage delivery addresses' },
      { name: 'cart', icon: 'mdi-cart', description: 'View active shopping carts' },
      { name: 'user_favorites', icon: 'mdi-heart', description: 'User favorites' },
      { name: 'promotions', icon: 'mdi-ticket-percent', description: 'Manage promotions' },
      { name: 'user_promotions', icon: 'mdi-ticket-account', description: 'User promotion claims' },
      { name: 'loyalty', icon: 'mdi-medal', description: 'Loyalty program management' },
      { name: 'loyalty_rewards', icon: 'mdi-gift', description: 'Loyalty rewards' },
      { name: 'loyalty_redemptions', icon: 'mdi-gift-outline', description: 'Reward redemptions' },
      { name: 'review_responses', icon: 'mdi-comment-text', description: 'Review responses' },
      { name: 'notifications', icon: 'mdi-bell', description: 'Notification management' },
      { name: 'static_pages', icon: 'mdi-file-document', description: 'Manage static pages' },
      { name: 'delivery_configs', icon: 'mdi-truck-delivery', description: 'Delivery configurations' },
      { name: 'site_config', icon: 'mdi-cog', description: 'Site configuration' },
      { name: 'articles', icon: 'mdi-newspaper', description: 'Manage articles/blog' },
      { name: 'review_reports', icon: 'mdi-flag', description: 'Review reports' },
      { name: 'restaurant_settings', icon: 'mdi-store-cog', description: 'Restaurant settings' },
      { name: 'driver_locations', icon: 'mdi-map-marker-path', description: 'Driver locations' },
      { name: 'order_status_logs', icon: 'mdi-history', description: 'Order status history' },
      { name: 'marketing_content', icon: 'mdi-bullhorn', description: 'Marketing campaigns' },
      { name: 'banners', icon: 'mdi-image', description: 'Manage banner ads' },
      { name: 'faqs', icon: 'mdi-help-circle', description: 'Manage FAQs' },
      { name: 'staff_permissions', icon: 'mdi-account-key', description: 'Staff permissions' },
      { name: 'delivery_fee_tiers', icon: 'mdi-cash', description: 'Delivery fee structure' },
      { name: 'notification_tracking', icon: 'mdi-bell-ring', description: 'Notification analytics' },
      { name: 'promotion_categories', icon: 'mdi-tag-multiple', description: 'Promotion categories' },
      { name: 'promotion_campaigns', icon: 'mdi-bullhorn', description: 'Promotion campaigns' },
      { name: 'api_performance_logs', icon: 'mdi-chart-line', description: 'API performance logs' },
      { name: 'user_activity_logs', icon: 'mdi-account-clock', description: 'User activity logs' },
      { name: 'payment_history', icon: 'mdi-credit-card', description: 'Payment history' },
      { name: 'product_promotions', icon: 'mdi-food-variant', description: 'Product promotions' },
      { name: 'menu_items', icon: 'mdi-silverware-fork-knife', description: 'Menu items' },
      { name: 'order_details', icon: 'mdi-information', description: 'Order details' }
    ])
    
    // Restaurant approval stats
    const restaurantStats = ref({
      pending: 0,
      active: 0,
      suspended: 0
    })
    
    // Filter tables based on search
    const filteredTables = computed(() => {
      // Check if tables value is properly initialized
      if (!tables.value || !Array.isArray(tables.value)) {
        console.warn('Tables array is not properly initialized');
        return [];
      }
      
      if (!tableSearch.value) {
        return tables.value;
      }
      
      const searchTerm = tableSearch.value.toLowerCase();
      return tables.value.filter(table => {
        if (!table || !table.name) return false;
        
        const nameMatch = table.name.toLowerCase().includes(searchTerm);
        const descMatch = table.description ? table.description.toLowerCase().includes(searchTerm) : false;
        
        return nameMatch || descMatch;
      });
    })
    
    // Format table name for display
    const formatTableName = (tableName) => {
      // Handle undefined or null values
      if (!tableName) return '';
      
      // Convert snake_case or camelCase to Title Case with spaces
      return tableName
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/\b\w/g, char => char.toUpperCase())
    }

    // Analytics data
    const analyticsData = ref({
      orderTrend: [],
      revenueTrend: [],
      userGrowth: [],
      popularCategories: [],
      topCities: [],
      orderStatusCounts: []
    })

    // Recent activities
    const recentOrders = ref([])
    const recentUsers = ref([])
    const recentRestaurants = ref([])

    // Fetch dashboard data
    const loadDashboardData = async () => {
      try {
        loading.value = true
        hasError.value = false
        
        // Load dashboard data with individual try/catch blocks for each API call
        try {
          const statsResponse = await axios.get('/api/admin/dashboard/stats')
          stats.value = statsResponse.data.data.stats || {
            orders: { total: 0, growth: 0 },
            revenue: { total: 0, growth: 0 },
            users: { total: 0, growth: 0 },
            restaurants: { total: 0, growth: 0 }
          }
          restaurantStats.value = statsResponse.data.data.restaurantStats || {
            pending: 0,
            active: 0,
            suspended: 0
          }
        } catch (statsError) {
          console.error('Error loading dashboard stats:', statsError)
          toast.error('Failed to load dashboard statistics')
          // Set fallback data for stats
          stats.value = {
            orders: { total: '--', growth: 0 },
            revenue: { total: '--', growth: 0 },
            users: { total: '--', growth: 0 },
            restaurants: { total: '--', growth: 0 }
          }
        }
        
        try {
          const analyticsResponse = await axios.get('/api/admin/analytics', { 
            params: { timeframe: timeframe.value }
          })
          analyticsData.value = analyticsResponse.data.data || {
            orderTrend: [],
            revenueTrend: [],
            userGrowth: [],
            popularCategories: [],
            topCities: [],
            orderStatusCounts: []
          }
        } catch (analyticsError) {
          console.error('Error loading analytics data:', analyticsError)
          // Don't show toast for this to avoid multiple errors
          // Set fallback data for analytics
          analyticsData.value = {
            orderTrend: [],
            revenueTrend: [],
            userGrowth: [],
            popularCategories: [],
            topCities: [],
            orderStatusCounts: []
          }
        }
        
        try {
          // Try to load database tables information
          const tablesResponse = await axios.get('/api/admin/tables')
          
          // Validate that we received a proper response with data
          if (tablesResponse.data && Array.isArray(tablesResponse.data)) {
            // Ensure each table has the required properties
            tables.value = tablesResponse.data.map(table => ({
              name: table.name || '',
              icon: table.icon || 'mdi-database',
              description: table.description || 'Database table'
            }));
          } else if (tablesResponse.data && typeof tablesResponse.data === 'object') {
            // Different response format - array might be nested
            const tablesData = tablesResponse.data.data || tablesResponse.data.tables || [];
            if (Array.isArray(tablesData)) {
              tables.value = tablesData.map(table => ({
                name: table.name || '',
                icon: table.icon || 'mdi-database',
                description: table.description || 'Database table'
              }));
            }
            // If no valid data is found, keep the default tables array
          }
        } catch (tablesError) {
          console.error('Error loading tables data:', tablesError)
          // Keep using the default tables list, no need to update
        }
        
      } catch (error) {
        console.error('Dashboard data error:', error)
        toast.error('Failed to load some dashboard data')
        hasError.value = true
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
    
    const viewOrder = (order) => {
      router.push(`/admin/orders/${order.id}`)
    }

    // Format values
    const formatCurrency = (value) => {
      if (value === null || value === undefined) return '$0.00';
      
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(value)
    }

    const formatMoney = (value) => {
      // Simple formatter that handles string or number
      if (typeof value === 'string' && value === '--') return value;
      if (value === null || value === undefined) return '0.00';
      
      return Number(value || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }

    const formatNumber = (value) => {
      if (value === null || value === undefined) return '0';
      
      return new Intl.NumberFormat('en-US').format(value)
    }

    const formatDate = (date) => {
      if (!date) return '';
      
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    // Get status color mapping
    const getStatusColor = (status) => {
      if (!status) return 'grey';
      
      const colors = {
        pending: 'warning',
        active: 'success',
        suspended: 'error',
        completed: 'success',
        processing: 'info',
        cancelled: 'error'
      }
      return colors[status.toLowerCase()] || 'grey'
    }
    
    const getOrderStatusColor = (status) => {
      if (!status) return 'grey';
      
      const colors = {
        'pending': 'warning',
        'preparing': 'info',
        'ready': 'success',
        'delivered': 'success',
        'cancelled': 'error'
      }
      return colors[status.toLowerCase()] || 'grey'
    }

    // Watch for timeframe changes
    watch(timeframe, () => {
      loadDashboardData()
    })

    // Also watch revenueTimeframe if it should load different data
    watch(revenueTimeframe, () => {
      // If revenue timeframe should load different data than main timeframe
      // loadRevenueData()
    })

    // Load initial data
    onMounted(() => {
      loadDashboardData()
    })

    // Handle component errors
    const handleComponentError = (error, component) => {
      console.error(`Error in ${component || 'unknown'} component:`, error)
      if (component === 'AlertsPanel') {
        hasAlertsPanel.value = false
      }
    }

    // Navigate to table
    const navigateToTable = (tableName) => {
      if (!tableName) {
        console.error('Invalid table name');
        return;
      }
      
      console.log(`Navigating to table: ${tableName} at path: /admin/tables/${tableName}`);
      router.push(`/admin/tables/${tableName}`);
    }

    return {
      loading,
      hasError,
      hasAlertsPanel,
      alertsPanel,
      timeframe,
      revenueTimeframe,
      tableSearch,
      stats,
      tables,
      restaurantStats,
      filteredTables,
      formatTableName,
      analyticsData,
      recentOrders,
      recentUsers,
      recentRestaurants,
      viewPendingRestaurants,
      viewRecentOrders,
      viewUserManagement,
      viewOrder,
      formatCurrency,
      formatMoney,
      formatNumber,
      formatDate,
      getStatusColor,
      getOrderStatusColor,
      handleComponentError,
      orderHeaders,
      topRestaurants,
      timeframes,
      revenueChartOption,
      orderStatusChartOption,
      userGrowthChartOption,
      topCitiesChartOption,
      loadDashboardData,
      navigateToTable
    }
  }
}
</script>

<style scoped>
.admin-dashboard {
  padding: 16px;
}

.max-width-150 {
  max-width: 150px;
}

.max-width-200 {
  max-width: 200px;
}

.max-width-300 {
  max-width: 300px;
}

.rounded-lg {
  border-radius: 8px;
}

/* Ensure charts have proper dimensions */
.v-chart {
  width: 100%;
  height: 100%;
}

/* Add animation to cards */
.v-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.v-card:hover:not(.v-card--flat) {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.stat-card {
  height: 100%;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.pie-chart {
  width: 100%;
  height: 250px;
}

.db-table-card {
  transition: all 0.2s;
}

.db-table-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeframe-select {
  max-width: 150px;
}

/* Fix list item styles for Vuetify 3 */
.v-list-item {
  min-height: 48px;
  padding: 0 16px;
}

.v-list-item-title {
  font-size: 0.9375rem;
  font-weight: 500;
}

/* Ensure content properly aligned */
.v-list-item .d-flex.align-center {
  flex: 1;
  min-width: 0;
  padding: 12px 0;
}

/* Add any other custom styles */
</style>
