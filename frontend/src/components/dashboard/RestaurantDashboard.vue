<template>
  <div class="restaurant-dashboard">
    <v-row>
      <!-- Key Metrics Cards -->
      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4 h-100">
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-overline mb-1">Today's Orders</div>
            <div class="text-h3 font-weight-bold">{{ loading ? '...' : metrics.todayOrders }}</div>
            <div class="d-flex align-center mt-2">
              <v-icon
                :color="metrics.ordersTrend > 0 ? 'success' : metrics.ordersTrend < 0 ? 'error' : 'grey'"
                size="small"
                class="mr-1"
              >
                {{ metrics.ordersTrend > 0 ? 'mdi-arrow-up' : metrics.ordersTrend < 0 ? 'mdi-arrow-down' : 'mdi-minus' }}
              </v-icon>
              <span :class="metrics.ordersTrend > 0 ? 'text-success' : metrics.ordersTrend < 0 ? 'text-error' : ''">
                {{ Math.abs(metrics.ordersTrend) }}% vs yesterday
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4 h-100">
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-overline mb-1">Today's Revenue</div>
            <div class="text-h3 font-weight-bold">{{ loading ? '...' : formatPrice(metrics.todayRevenue) }}</div>
            <div class="d-flex align-center mt-2">
              <v-icon
                :color="metrics.revenueTrend > 0 ? 'success' : metrics.revenueTrend < 0 ? 'error' : 'grey'"
                size="small"
                class="mr-1"
              >
                {{ metrics.revenueTrend > 0 ? 'mdi-arrow-up' : metrics.revenueTrend < 0 ? 'mdi-arrow-down' : 'mdi-minus' }}
              </v-icon>
              <span :class="metrics.revenueTrend > 0 ? 'text-success' : metrics.revenueTrend < 0 ? 'text-error' : ''">
                {{ Math.abs(metrics.revenueTrend) }}% vs yesterday
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4 h-100">
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-overline mb-1">Average Order Value</div>
            <div class="text-h3 font-weight-bold">{{ loading ? '...' : formatPrice(metrics.avgOrderValue) }}</div>
            <div class="d-flex align-center mt-2">
              <v-icon
                :color="metrics.avgOrderTrend > 0 ? 'success' : metrics.avgOrderTrend < 0 ? 'error' : 'grey'"
                size="small"
                class="mr-1"
              >
                {{ metrics.avgOrderTrend > 0 ? 'mdi-arrow-up' : metrics.avgOrderTrend < 0 ? 'mdi-arrow-down' : 'mdi-minus' }}
              </v-icon>
              <span :class="metrics.avgOrderTrend > 0 ? 'text-success' : metrics.avgOrderTrend < 0 ? 'text-error' : ''">
                {{ Math.abs(metrics.avgOrderTrend) }}% vs last week
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4 h-100">
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-overline mb-1">Customer Satisfaction</div>
            <div class="text-h3 font-weight-bold">{{ loading ? '...' : metrics.satisfaction.toFixed(1) }}</div>
            <div class="d-flex align-center mt-2">
              <v-rating
                :model-value="metrics.satisfaction"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="small"
              ></v-rating>
              <span class="ml-1">{{ metrics.reviewCount }} reviews</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row>
      <!-- Revenue Chart -->
      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <span>Revenue Trends</span>
            <v-spacer></v-spacer>
            <v-select
              v-model="revenueChartPeriod"
              :items="periodOptions"
              variant="outlined"
              density="compact"
              hide-details
              class="period-select"
              @update:model-value="loadRevenueData"
            ></v-select>
          </v-card-title>
          
          <v-card-text>
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
            </div>
            <div v-else class="chart-container">
              <canvas ref="revenueChart"></canvas>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Order Status Breakdown -->
      <v-col cols="12" md="4">
        <v-card class="mb-4">
          <v-card-title>Order Status</v-card-title>
          
          <v-card-text>
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
            </div>
            <div v-else class="chart-container">
              <canvas ref="orderStatusChart"></canvas>
            </div>
            
            <v-list v-if="!loading" class="mt-4" lines="one">
              <v-list-item
                v-for="(status, index) in orderStatusData.labels"
                :key="status"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="orderStatusData.backgroundColor[index]"
                    size="small"
                    class="mr-2"
                  ></v-avatar>
                </template>
                <v-list-item-title>{{ status }}</v-list-item-title>
                <template v-slot:append>
                  <div class="d-flex align-center">
                    <span class="font-weight-bold mr-2">{{ orderStatusData.data[index] }}</span>
                    <span class="text-caption">{{ ((orderStatusData.data[index] / orderStatusData.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1) }}%</span>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row>
      <!-- Top Products -->
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title>Top Selling Products</v-card-title>
          
          <v-card-text>
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
            </div>
            <v-list v-else lines="two">
              <v-list-item
                v-for="(product, index) in topProducts"
                :key="product.id"
              >
                <template v-slot:prepend>
                  <v-avatar size="48" rounded>
                    <v-img
                      :src="product.image_url || '/images/food-placeholder.jpg'"
                      cover
                    ></v-img>
                  </v-avatar>
                </template>
                
                <v-list-item-title>
                  {{ product.name }}
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  {{ formatPrice(product.price) }} · {{ product.category }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <div class="text-right">
                    <div class="font-weight-bold">{{ product.quantity }} sold</div>
                    <div class="text-caption">{{ formatPrice(product.revenue) }}</div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            
            <div v-if="!loading" class="text-center mt-4">
              <v-btn
                variant="text"
                color="primary"
                @click="viewAllProducts"
              >
                View All Products
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Recent Reviews -->
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <span>Recent Reviews</span>
            <v-spacer></v-spacer>
            <v-chip
              color="amber"
              class="font-weight-bold"
            >
              <v-icon start>mdi-star</v-icon>
              {{ metrics.satisfaction.toFixed(1) }}
            </v-chip>
          </v-card-title>
          
          <v-card-text>
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
            </div>
            <div v-else-if="recentReviews.length === 0" class="text-center py-8">
              <v-icon size="large" color="grey">mdi-comment-outline</v-icon>
              <div class="mt-2">No reviews yet</div>
            </div>
            <v-list v-else lines="three">
              <v-list-item
                v-for="review in recentReviews"
                :key="review.id"
              >
                <template v-slot:prepend>
                  <v-avatar color="primary" class="mr-3">
                    <span class="text-h6 text-white">{{ review.user.full_name.charAt(0) }}</span>
                  </v-avatar>
                </template>
                
                <v-list-item-title class="d-flex align-center">
                  <span>{{ review.user.full_name }}</span>
                  <v-spacer></v-spacer>
                  <v-rating
                    :model-value="review.rating"
                    color="amber"
                    density="compact"
                    half-increments
                    readonly
                    size="small"
                  ></v-rating>
                </v-list-item-title>
                
                <v-list-item-subtitle class="text-caption">
                  {{ formatDate(review.created_at) }}
                </v-list-item-subtitle>
                
                <v-list-item-subtitle class="mt-1 text-wrap">
                  {{ review.comment }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            
            <div v-if="!loading && recentReviews.length > 0" class="text-center mt-4">
              <v-btn
                variant="text"
                color="primary"
                @click="viewAllReviews"
              >
                View All Reviews
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row>
      <!-- Recent Orders -->
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <span>Recent Orders</span>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              color="primary"
              @click="viewAllOrders"
            >
              View All Orders
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <div v-if="loading" class="text-center py-8">
              <v-progress-circular
                indeterminate
                color="primary"
              ></v-progress-circular>
            </div>
            <v-table v-else>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in recentOrders" :key="order.id">
                  <td>
                    <div class="font-weight-medium">#{{ order.id }}</div>
                    <div class="text-caption">{{ order.payment_method }}</div>
                  </td>
                  <td>
                    <div class="font-weight-medium">{{ order.user.full_name }}</div>
                    <div class="text-caption">{{ order.user.phone || 'No phone' }}</div>
                  </td>
                  <td>
                    <div>{{ formatDate(order.created_at) }}</div>
                    <div class="text-caption">{{ formatTime(order.created_at) }}</div>
                  </td>
                  <td>
                    <div>{{ getItemCount(order) }} items</div>
                    <div class="text-caption text-truncate" style="max-width: 150px;">
                      {{ getItemSummary(order) }}
                    </div>
                  </td>
                  <td>
                    <div class="font-weight-medium">{{ formatPrice(order.total_amount) }}</div>
                  </td>
                  <td>
                    <v-chip
                      :color="getStatusColor(order.status)"
                      size="small"
                      class="text-capitalize"
                    >
                      {{ order.status }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn
                      icon
                      variant="text"
                      color="primary"
                      @click="viewOrderDetails(order.id)"
                    >
                      <v-icon>mdi-eye</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import Chart from 'chart.js/auto';

export default {
  name: 'RestaurantDashboard',
  
  props: {
    restaurantId: {
      type: [Number, String],
      required: true
    }
  },
  
  data() {
    return {
      loading: true,
      revenueChartPeriod: 'week',
      periodOptions: [
        { title: 'Last 7 Days', value: 'week' },
        { title: 'Last 30 Days', value: 'month' },
        { title: 'Last 90 Days', value: 'quarter' },
        { title: 'Last Year', value: 'year' }
      ],
      metrics: {
        todayOrders: 0,
        ordersTrend: 0,
        todayRevenue: 0,
        revenueTrend: 0,
        avgOrderValue: 0,
        avgOrderTrend: 0,
        satisfaction: 0,
        reviewCount: 0
      },
      revenueChart: null,
      orderStatusChart: null,
      orderStatusData: {
        labels: [],
        data: [],
        backgroundColor: []
      },
      topProducts: [],
      recentReviews: [],
      recentOrders: []
    };
  },
  
  computed: {
    ...mapState({
      dashboardData: state => state.restaurantAdmin.dashboardData
    })
  },
  
  methods: {
    ...mapActions({
      fetchDashboardData: 'restaurantAdmin/fetchDashboardData',
      fetchRevenueData: 'restaurantAdmin/fetchRevenueData'
    }),
    
    async loadDashboardData() {
      this.loading = true;
      
      try {
        await this.fetchDashboardData({
          restaurantId: this.restaurantId
        });
        
        // Update local data from store
        this.updateDashboardData();
        
        // Initialize charts
        this.initCharts();
      } catch (error) {
        this.$toast.error('Failed to load dashboard data');
        console.error('Error loading dashboard data:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadRevenueData() {
      try {
        await this.fetchRevenueData({
          restaurantId: this.restaurantId,
          period: this.revenueChartPeriod
        });
        
        // Update revenue chart
        this.updateRevenueChart();
      } catch (error) {
        this.$toast.error('Failed to load revenue data');
        console.error('Error loading revenue data:', error);
      }
    },
    
    updateDashboardData() {
      if (!this.dashboardData) return;
      
      // Update metrics
      this.metrics = this.dashboardData.metrics;
      
      // Update order status data
      this.orderStatusData = {
        labels: this.dashboardData.orderStatus.labels,
        data: this.dashboardData.orderStatus.data,
        backgroundColor: [
          '#4CAF50', // Delivered
          '#2196F3', // Preparing
          '#FFC107', // Ready for pickup
          '#9C27B0', // Out for delivery
          '#FF5722', // Pending
          '#F44336', // Cancelled
          '#607D8B'  // Other
        ]
      };
      
      // Update top products
      this.topProducts = this.dashboardData.topProducts;
      
      // Update recent reviews
      this.recentReviews = this.dashboardData.recentReviews;
      
      // Update recent orders
      this.recentOrders = this.dashboardData.recentOrders;
    },
    
    initCharts() {
      this.$nextTick(() => {
        // Initialize revenue chart
        this.initRevenueChart();
        
        // Initialize order status chart
        this.initOrderStatusChart();
      });
    },
    
    initRevenueChart() {
      const ctx = this.$refs.revenueChart?.getContext('2d');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.revenueChart) {
        this.revenueChart.destroy();
      }
      
      const revenueData = this.dashboardData.revenueData;
      
      this.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: revenueData.labels,
          datasets: [
            {
              label: 'Revenue',
              data: revenueData.revenue,
              borderColor: '#4CAF50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              tension: 0.4,
              fill: true
            },
            {
              label: 'Orders',
              data: revenueData.orders,
              borderColor: '#2196F3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)',
              tension: 0.4,
              fill: true,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Revenue (VND)'
              },
              ticks: {
                callback: (value) => {
                  return this.formatShortPrice(value);
                }
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              title: {
                display: true,
                text: 'Orders'
              },
              grid: {
                drawOnChartArea: false
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  let label = context.dataset.label || '';
                  if (label) {
                    label += ': ';
                  }
                  if (context.datasetIndex === 0) {
                    label += this.formatPrice(context.raw);
                  } else {
                    label += context.raw;
                  }
                  return label;
                }
              }
            }
          }
        }
      });
    },
    
    initOrderStatusChart() {
      const ctx = this.$refs.orderStatusChart?.getContext('2d');
      if (!ctx) return;
      
      // Destroy existing chart if it exists
      if (this.orderStatusChart) {
        this.orderStatusChart.destroy();
      }
      
      this.orderStatusChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: this.orderStatusData.labels,
          datasets: [{
            data: this.orderStatusData.data,
            backgroundColor: this.orderStatusData.backgroundColor,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          }
        }
      });
    },
    
    updateRevenueChart() {
      if (!this.revenueChart || !this.dashboardData.revenueData) return;
      
      const revenueData = this.dashboardData.revenueData;
      
      this.revenueChart.data.labels = revenueData.labels;
      this.revenueChart.data.datasets[0].data = revenueData.revenue;
      this.revenueChart.data.datasets[1].data = revenueData.orders;
      this.revenueChart.update();
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    },
    
    formatShortPrice(price) {
      if (price >= 1000000) {
        return (price / 1000000).toFixed(1) + 'M';
      } else if (price >= 1000) {
        return (price / 1000).toFixed(1) + 'K';
      }
      return price;
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    },
    
    formatTime(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    
    getItemCount(order) {
      return order.order_details ? order.order_details.reduce((total, item) => total + item.quantity, 0) : 0;
    },
    
    getItemSummary(order) {
      if (!order.order_details || order.order_details.length === 0) return 'No items';
      
      return order.order_details
        .slice(0, 2)
        .map(item => `${item.quantity}x ${item.product.name}`)
        .join(', ') + (order.order_details.length > 2 ? '...' : '');
    },
    
    getStatusColor(status) {
      switch (status) {
        case 'pending':
          return 'grey';
        case 'confirmed':
          return 'info';
        case 'preparing':
          return 'primary';
        case 'ready_for_pickup':
          return 'amber-darken-2';
        case 'out_for_delivery':
          return 'deep-purple';
        case 'delivered':
          return 'success';
        case 'cancelled':
          return 'error';
        default:
          return 'grey';
      }
    },
    
    viewAllProducts() {
      this.$router.push({ name: 'RestaurantMenu' });
    },
    
    viewAllReviews() {
      this.$router.push({ name: 'RestaurantReviews' });
    },
    
    viewAllOrders() {
      this.$router.push({ name: 'RestaurantOrders' });
    },
    
    viewOrderDetails(orderId) {
      this.$router.push({ name: 'RestaurantOrderDetail', params: { id: orderId } });
    }
  },
  
  async mounted() {
    await this.loadDashboardData();
  },
  
  beforeUnmount() {
    // Destroy charts when component is destroyed
    if (this.revenueChart) {
      this.revenueChart.destroy();
    }
    
    if (this.orderStatusChart) {
      this.orderStatusChart.destroy();
    }
  }
};
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
}

.period-select {
  max-width: 200px;
}

.text-wrap {
  white-space: normal;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
</style> 