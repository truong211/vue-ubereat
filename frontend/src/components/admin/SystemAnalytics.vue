<template>
  <div class="system-analytics">
    <h2 class="text-h5 mb-6">System-wide Analytics</h2>

    <!-- Time Period Selector -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-select
              v-model="timePeriod"
              :items="timePeriodOptions"
              label="Time Period"
              variant="outlined"
              density="compact"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-menu
              v-model="datePickerMenu"
              :close-on-content-click="false"
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="customDateRange"
                  label="Custom Date Range"
                  prepend-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  density="compact"
                  variant="outlined"
                  hide-details
                  :disabled="timePeriod !== 'custom'"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="dateRange"
                range
                @update:modelValue="updateDateRange"
              ></v-date-picker>
            </v-menu>
          </v-col>
          <v-col cols="12" md="4" class="d-flex justify-end">
            <v-btn
              prepend-icon="mdi-refresh"
              @click="refreshData"
              variant="outlined"
            >
              Refresh Data
            </v-btn>
            <v-btn
              prepend-icon="mdi-download"
              @click="exportData"
              variant="text"
              class="ml-2"
            >
              Export
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Key Performance Indicators -->
    <v-row>
      <v-col v-for="(metric, index) in keyMetrics" :key="index" cols="12" sm="6" md="3">
        <v-card :color="metric.color" :variant="metric.variant" class="metric-card">
          <v-card-text>
            <div class="text-overline mb-1">{{ metric.label }}</div>
            <div class="d-flex align-center">
              <div class="text-h4">{{ metric.value }}</div>
              <div class="ml-auto">
                <v-icon size="36" :icon="metric.icon"></v-icon>
              </div>
            </div>
            <div class="d-flex align-center mt-2">
              <span :class="metric.trend > 0 ? 'text-success' : 'text-error'">
                <v-icon size="small" :icon="metric.trend > 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"></v-icon>
                {{ Math.abs(metric.trend) }}%
              </span>
              <span class="text-caption ml-1">vs previous period</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Section -->
    <v-row class="mt-4">
      <!-- Revenue Chart -->
      <v-col cols="12" md="8">
        <v-card height="400px">
          <v-card-title class="d-flex justify-space-between align-center">
            Revenue & Orders Trend
            <v-btn-toggle v-model="revenueChartType" mandatory>
              <v-btn value="daily">Daily</v-btn>
              <v-btn value="weekly">Weekly</v-btn>
              <v-btn value="monthly">Monthly</v-btn>
            </v-btn-toggle>
          </v-card-title>
          <v-card-text>
            <canvas ref="revenueChart" height="300"></canvas>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- User Acquisition -->
      <v-col cols="12" md="4">
        <v-card height="400px">
          <v-card-title>User Acquisition</v-card-title>
          <v-card-text>
            <canvas ref="userAcquisitionChart" height="300"></canvas>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Platform Performance -->
    <v-row class="mt-4">
      <v-col cols="12" md="6">
        <v-card height="400px">
          <v-card-title>Order Completion Rate</v-card-title>
          <v-card-text>
            <div class="text-center mb-4">
              <v-progress-circular
                :model-value="orderCompletionRate"
                :size="150"
                :width="15"
                color="success"
              >
                {{ orderCompletionRate }}%
              </v-progress-circular>
            </div>
            <v-list density="compact">
              <v-list-item>
                <v-list-item-title>Completed Orders</v-list-item-title>
                <template v-slot:append>{{ completedOrders }}</template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Cancelled Orders</v-list-item-title>
                <template v-slot:append>{{ cancelledOrders }}</template>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Delivery Issues</v-list-item-title>
                <template v-slot:append>{{ deliveryIssues }}</template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Geographic Distribution -->
      <v-col cols="12" md="6">
        <v-card height="400px">
          <v-card-title>Geographic Distribution</v-card-title>
          <v-card-text>
            <canvas ref="geoDistChart" height="300"></canvas>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Detailed Analytics Tables -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-tabs v-model="activeTab">
            <v-tab value="restaurants">Top Restaurants</v-tab>
            <v-tab value="dishes">Popular Dishes</v-tab>
            <v-tab value="users">Active Users</v-tab>
            <v-tab value="drivers">Driver Performance</v-tab>
          </v-tabs>

          <v-window v-model="activeTab">
            <!-- Top Restaurants -->
            <v-window-item value="restaurants">
              <v-data-table
                :headers="restaurantHeaders"
                :items="topRestaurants"
                :items-per-page="5"
              >
                <template v-slot:item.revenueShare="{ item }">
                  <v-progress-linear
                    :model-value="item.revenueShare"
                    height="20"
                    color="primary"
                    rounded
                  >
                    <template v-slot:default="{ value }">
                      {{ Math.round(value) }}%
                    </template>
                  </v-progress-linear>
                </template>

                <template v-slot:item.rating="{ item }">
                  <v-rating
                    :model-value="item.rating"
                    color="amber"
                    density="compact"
                    size="x-small"
                    readonly
                  ></v-rating>
                  <span class="ml-2">{{ item.rating.toFixed(1) }}</span>
                </template>
              </v-data-table>
            </v-window-item>

            <!-- Popular Dishes -->
            <v-window-item value="dishes">
              <v-data-table
                :headers="dishHeaders"
                :items="popularDishes"
                :items-per-page="5"
              ></v-data-table>
            </v-window-item>

            <!-- Active Users -->
            <v-window-item value="users">
              <v-data-table
                :headers="userHeaders"
                :items="activeUsers"
                :items-per-page="5"
              ></v-data-table>
            </v-window-item>

            <!-- Driver Performance -->
            <v-window-item value="drivers">
              <v-data-table
                :headers="driverHeaders"
                :items="driverPerformance"
                :items-per-page="5"
              >
                <template v-slot:item.onTimeRate="{ item }">
                  <v-progress-linear
                    :model-value="item.onTimeRate"
                    height="20"
                    color="success"
                    rounded
                  >
                    <template v-slot:default="{ value }">
                      {{ Math.round(value) }}%
                    </template>
                  </v-progress-linear>
                </template>
              </v-data-table>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import { useStore } from 'vuex';
import Chart from 'chart.js/auto';
import { format, addDays, subDays, parseISO } from 'date-fns';

export default {
  name: 'SystemAnalytics',

  setup() {
    const store = useStore();

    // Chart references
    const revenueChart = ref(null);
    const userAcquisitionChart = ref(null);
    const geoDistChart = ref(null);
    
    // Chart instances
    let revenueChartInstance = null;
    let userAcquisitionChartInstance = null;
    let geoDistChartInstance = null;

    // Filter states
    const timePeriod = ref('last30days');
    const timePeriodOptions = [
      { title: 'Today', value: 'today' },
      { title: 'Yesterday', value: 'yesterday' },
      { title: 'Last 7 Days', value: 'last7days' },
      { title: 'Last 30 Days', value: 'last30days' },
      { title: 'This Month', value: 'thisMonth' },
      { title: 'Last Month', value: 'lastMonth' },
      { title: 'Custom Range', value: 'custom' },
    ];
    
    const dateRange = ref([]);
    const datePickerMenu = ref(false);
    
    const customDateRange = computed(() => {
      if (dateRange.value.length === 2) {
        return `${dateRange.value[0]} - ${dateRange.value[1]}`;
      }
      return '';
    });
    
    const updateDateRange = () => {
      if (dateRange.value.length === 2) {
        fetchAnalyticsData();
        datePickerMenu.value = false;
      }
    };

    // KPI Metrics
    const keyMetrics = ref([
      {
        label: 'Total Revenue',
        value: '$0',
        icon: 'mdi-currency-usd',
        color: 'success',
        variant: 'tonal',
        trend: 0
      },
      {
        label: 'Total Orders',
        value: 0,
        icon: 'mdi-cart-outline',
        color: 'primary',
        variant: 'tonal',
        trend: 0
      },
      {
        label: 'Active Users',
        value: 0,
        icon: 'mdi-account-group-outline',
        color: 'info',
        variant: 'tonal',
        trend: 0
      },
      {
        label: 'Avg. Order Value',
        value: '$0',
        icon: 'mdi-receipt',
        color: 'warning',
        variant: 'tonal',
        trend: 0
      }
    ]);

    // Chart data settings
    const revenueChartType = ref('daily');
    
    // Performance metrics
    const orderCompletionRate = ref(0);
    const completedOrders = ref(0);
    const cancelledOrders = ref(0);
    const deliveryIssues = ref(0);
    
    // Detailed analytics tab
    const activeTab = ref('restaurants');
    
    // Table data
    const topRestaurants = ref([]);
    const popularDishes = ref([]);
    const activeUsers = ref([]);
    const driverPerformance = ref([]);
    
    // Table headers
    const restaurantHeaders = [
      { title: 'Restaurant', key: 'name' },
      { title: 'Orders', key: 'orders', align: 'end' },
      { title: 'Revenue', key: 'revenue', align: 'end' },
      { title: '% of Total Revenue', key: 'revenueShare', align: 'end' },
      { title: 'Rating', key: 'rating', align: 'center' },
    ];
    
    const dishHeaders = [
      { title: 'Dish', key: 'name' },
      { title: 'Restaurant', key: 'restaurant' },
      { title: 'Orders', key: 'orders', align: 'end' },
      { title: 'Revenue', key: 'revenue', align: 'end' },
      { title: 'Average Rating', key: 'rating', align: 'end' },
    ];
    
    const userHeaders = [
      { title: 'User', key: 'name' },
      { title: 'Orders', key: 'orders', align: 'end' },
      { title: 'Total Spent', key: 'spent', align: 'end' },
      { title: 'Last Order', key: 'lastOrder', align: 'end' },
      { title: 'Member Since', key: 'memberSince', align: 'end' },
    ];
    
    const driverHeaders = [
      { title: 'Driver', key: 'name' },
      { title: 'Deliveries', key: 'deliveries', align: 'end' },
      { title: 'On-Time Rate', key: 'onTimeRate', align: 'end' },
      { title: 'Avg. Delivery Time', key: 'avgTime', align: 'end' },
      { title: 'Rating', key: 'rating', align: 'end' },
    ];

    // Methods
    const initCharts = () => {
      // Initialize Revenue Chart
      if (revenueChart.value) {
        const revenueCtx = revenueChart.value.getContext('2d');
        revenueChartInstance = new Chart(revenueCtx, {
          type: 'line',
          data: {
            labels: [],
            datasets: [
              {
                label: 'Revenue',
                data: [],
                borderColor: '#4CAF50',
                backgroundColor: 'rgba(76, 175, 80, 0.1)',
                yAxisID: 'y',
                fill: true,
                tension: 0.3
              },
              {
                label: 'Orders',
                data: [],
                borderColor: '#2196F3',
                backgroundColor: 'rgba(33, 150, 243, 0.1)',
                yAxisID: 'y1',
                fill: true,
                tension: 0.3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                  display: true,
                  text: 'Revenue ($)'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                  display: true,
                  text: 'Orders'
                },
                grid: {
                  drawOnChartArea: false
                }
              }
            }
          }
        });
      }
      
      // Initialize User Acquisition Chart
      if (userAcquisitionChart.value) {
        const userCtx = userAcquisitionChart.value.getContext('2d');
        userAcquisitionChartInstance = new Chart(userCtx, {
          type: 'doughnut',
          data: {
            labels: ['Direct', 'Social Media', 'Referral', 'Ads', 'Other'],
            datasets: [{
              data: [30, 25, 20, 15, 10],
              backgroundColor: [
                '#4CAF50', '#2196F3', '#FFC107', '#9C27B0', '#F44336'
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
      
      // Initialize Geographic Distribution Chart
      if (geoDistChart.value) {
        const geoCtx = geoDistChart.value.getContext('2d');
        geoDistChartInstance = new Chart(geoCtx, {
          type: 'bar',
          data: {
            labels: ['Downtown', 'Uptown', 'West Side', 'East Side', 'North End', 'South Side'],
            datasets: [{
              label: 'Orders by Region',
              data: [65, 59, 80, 81, 56, 55],
              backgroundColor: '#673AB7'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Orders'
                }
              }
            }
          }
        });
      }
    };
    
    const fetchAnalyticsData = async () => {
      try {
        let timeframe;
        
        if (timePeriod.value === 'custom' && dateRange.value.length === 2) {
          timeframe = {
            start: dateRange.value[0],
            end: dateRange.value[1]
          };
        } else {
          timeframe = timePeriod.value;
        }
        
        const response = await store.dispatch('admin/fetchSystemAnalytics', { timeframe });
        
        if (response) {
          updateMetrics(response.metrics);
          updateCharts(response.chartData);
          updatePerformanceData(response.performance);
          updateDetailedAnalytics(response.detailedData);
        }
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };
    
    const updateMetrics = (metrics) => {
      if (!metrics) return;
      
      keyMetrics.value[0].value = `$${metrics.totalRevenue.toLocaleString()}`;
      keyMetrics.value[0].trend = metrics.revenueTrend;
      
      keyMetrics.value[1].value = metrics.totalOrders.toLocaleString();
      keyMetrics.value[1].trend = metrics.ordersTrend;
      
      keyMetrics.value[2].value = metrics.activeUsers.toLocaleString();
      keyMetrics.value[2].trend = metrics.usersTrend;
      
      keyMetrics.value[3].value = `$${metrics.avgOrderValue.toFixed(2)}`;
      keyMetrics.value[3].trend = metrics.avgOrderValueTrend;
    };
    
    const updateCharts = (chartData) => {
      if (!chartData) return;
      
      // Update Revenue Chart
      if (revenueChartInstance && chartData.revenue) {
        revenueChartInstance.data.labels = chartData.revenue.labels;
        revenueChartInstance.data.datasets[0].data = chartData.revenue.revenueData;
        revenueChartInstance.data.datasets[1].data = chartData.revenue.ordersData;
        revenueChartInstance.update();
      }
      
      // Update User Acquisition Chart
      if (userAcquisitionChartInstance && chartData.userAcquisition) {
        userAcquisitionChartInstance.data.labels = chartData.userAcquisition.labels;
        userAcquisitionChartInstance.data.datasets[0].data = chartData.userAcquisition.data;
        userAcquisitionChartInstance.update();
      }
      
      // Update Geographic Chart
      if (geoDistChartInstance && chartData.geoDist) {
        geoDistChartInstance.data.labels = chartData.geoDist.labels;
        geoDistChartInstance.data.datasets[0].data = chartData.geoDist.data;
        geoDistChartInstance.update();
      }
    };
    
    const updatePerformanceData = (performance) => {
      if (!performance) return;
      
      orderCompletionRate.value = performance.completionRate;
      completedOrders.value = performance.completedOrders;
      cancelledOrders.value = performance.cancelledOrders;
      deliveryIssues.value = performance.deliveryIssues;
    };
    
    const updateDetailedAnalytics = (detailedData) => {
      if (!detailedData) return;
      
      if (detailedData.restaurants) {
        topRestaurants.value = detailedData.restaurants;
      }
      
      if (detailedData.dishes) {
        popularDishes.value = detailedData.dishes;
      }
      
      if (detailedData.users) {
        activeUsers.value = detailedData.users;
      }
      
      if (detailedData.drivers) {
        driverPerformance.value = detailedData.drivers;
      }
    };
    
    const refreshData = () => {
      fetchAnalyticsData();
    };
    
    const exportData = async () => {
      try {
        let timeframe;
        
        if (timePeriod.value === 'custom' && dateRange.value.length === 2) {
          timeframe = {
            start: dateRange.value[0],
            end: dateRange.value[1]
          };
        } else {
          timeframe = timePeriod.value;
        }
        
        await store.dispatch('admin/exportAnalyticsData', { timeframe });
        // Show success notification
      } catch (error) {
        console.error('Error exporting analytics data:', error);
        // Show error notification
      }
    };
    
    // Watchers
    watch(timePeriod, (newVal) => {
      if (newVal !== 'custom') {
        fetchAnalyticsData();
      }
    });
    
    watch(revenueChartType, async (newVal) => {
      try {
        const response = await store.dispatch('admin/fetchRevenueData', {
          type: newVal,
          timeframe: timePeriod.value === 'custom' && dateRange.value.length === 2 
            ? { start: dateRange.value[0], end: dateRange.value[1] } 
            : timePeriod.value
        });
        
        if (response && revenueChartInstance) {
          revenueChartInstance.data.labels = response.labels;
          revenueChartInstance.data.datasets[0].data = response.revenueData;
          revenueChartInstance.data.datasets[1].data = response.ordersData;
          revenueChartInstance.update();
        }
      } catch (error) {
        console.error('Error fetching revenue data:', error);
      }
    });
    
    watch(activeTab, async (newVal) => {
      try {
        const response = await store.dispatch('admin/fetchDetailedAnalytics', {
          type: newVal,
          timeframe: timePeriod.value === 'custom' && dateRange.value.length === 2 
            ? { start: dateRange.value[0], end: dateRange.value[1] } 
            : timePeriod.value
        });
        
        if (response) {
          updateDetailedAnalytics({ [newVal]: response });
        }
      } catch (error) {
        console.error(`Error fetching ${newVal} data:`, error);
      }
    });
    
    onMounted(() => {
      initCharts();
      fetchAnalyticsData();
    });

    return {
      timePeriod,
      timePeriodOptions,
      dateRange,
      datePickerMenu,
      customDateRange,
      keyMetrics,
      revenueChartType,
      revenueChart,
      userAcquisitionChart,
      geoDistChart,
      orderCompletionRate,
      completedOrders,
      cancelledOrders,
      deliveryIssues,
      activeTab,
      topRestaurants,
      popularDishes,
      activeUsers,
      driverPerformance,
      restaurantHeaders,
      dishHeaders,
      userHeaders,
      driverHeaders,
      updateDateRange,
      refreshData,
      exportData
    };
  }
};
</script>

<style scoped>
.metric-card {
  transition: transform 0.2s;
}

.metric-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15);
}
</style>