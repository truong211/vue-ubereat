<template>
  <div class="admin-dashboard-home">
    <h1 class="text-h4 mb-6">Admin Dashboard</h1>
    
    <!-- Stats Cards -->
    <v-row>
      <v-col v-for="stat in statsData" :key="stat.title" cols="12" sm="6" md="3">
        <v-card :color="stat.color" :variant="stat.variant" height="100%">
          <v-card-item>
            <v-card-title>{{ stat.title }}</v-card-title>
            <template v-slot:prepend>
              <v-icon :icon="stat.icon" size="large"></v-icon>
            </template>
            <div class="text-h4 mt-4">{{ stat.value }}</div>
            <div v-if="stat.change !== undefined" class="d-flex align-center mt-1">
              <span :class="stat.change >= 0 ? 'text-success' : 'text-error'">
                <v-icon 
                  size="small" 
                  :icon="stat.change >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down'"
                ></v-icon>
                {{ Math.abs(stat.change) }}%
              </span>
              <span class="text-caption ml-1">vs last week</span>
            </div>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <!-- Quick Actions -->
      <v-col cols="12" md="4">
        <v-card height="100%">
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item v-for="(action, i) in quickActions" :key="i" :to="action.to">
                <template v-slot:prepend>
                  <v-avatar color="primary" variant="tonal">
                    <v-icon :icon="action.icon"></v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title>{{ action.title }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Recent Activities -->
      <v-col cols="12" md="8">
        <v-card height="100%">
          <v-card-title class="d-flex justify-space-between align-center">
            Recent Activities
            <v-btn variant="text" color="primary" size="small">View All</v-btn>
          </v-card-title>
          <v-list lines="two">
            <v-list-item v-for="(activity, i) in recentActivities" :key="i">
              <template v-slot:prepend>
                <v-avatar :color="activity.color" size="36">
                  <v-icon :icon="activity.icon" color="white" size="small"></v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>
                {{ activity.title }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ activity.description }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <span class="text-caption">{{ activity.time }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <!-- Sales Chart -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            Sales Analytics
            <v-select
              v-model="salesPeriod"
              :items="['7 Days', '30 Days', '90 Days', 'This Year']"
              variant="underlined"
              hide-details
              density="compact"
              class="max-width-120"
            ></v-select>
          </v-card-title>
          <v-card-text>
            <canvas ref="salesChart" height="250"></canvas>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Pending Tasks -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Pending Tasks</v-card-title>
          <v-list>
            <v-list-item
              v-for="(task, i) in pendingTasks"
              :key="i"
              :value="task"
              :title="task.title"
              :subtitle="task.description"
              lines="two"
            >
              <template v-slot:append>
                <v-chip
                  :color="getTaskPriorityColor(task.priority)"
                  size="small"
                >
                  {{ task.priority }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
          <v-card-actions class="justify-center">
            <v-btn variant="text" color="primary">View All Tasks</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import Chart from 'chart.js/auto';

export default {
  name: 'AdminDashboardHome',
  
  setup() {
    const store = useStore();
    
    // References
    const salesChart = ref(null);
    let chartInstance = null;
    
    // Stats data
    const statsData = ref([
      {
        title: 'Total Orders',
        value: 0,
        icon: 'mdi-cart',
        color: 'primary',
        variant: 'tonal',
        change: 0
      },
      {
        title: 'Revenue',
        value: '$0',
        icon: 'mdi-currency-usd',
        color: 'success',
        variant: 'tonal',
        change: 0
      },
      {
        title: 'New Users',
        value: 0,
        icon: 'mdi-account-plus',
        color: 'info',
        variant: 'tonal',
        change: 0
      },
      {
        title: 'Active Restaurants',
        value: 0,
        icon: 'mdi-store',
        color: 'warning',
        variant: 'tonal',
        change: 0
      }
    ]);
    
    // Quick actions
    const quickActions = [
      { title: 'Approve Restaurant', icon: 'mdi-check-circle', to: '/admin/restaurant-approval' },
      { title: 'Manage Users', icon: 'mdi-account-group', to: '/admin/users' },
      { title: 'Create Promotion', icon: 'mdi-tag-plus', to: '/admin/promotions' },
      { title: 'View Reports', icon: 'mdi-chart-box', to: '/admin/analytics' },
      { title: 'System Settings', icon: 'mdi-cog', to: '/admin/settings' }
    ];
    
    // Recent activities
    const recentActivities = ref([]);
    
    // Pending tasks
    const pendingTasks = ref([]);
    
    // Sales period filter
    const salesPeriod = ref('7 Days');
    
    const getTaskPriorityColor = (priority) => {
      switch (priority.toLowerCase()) {
        case 'high': return 'error';
        case 'medium': return 'warning';
        case 'low': return 'info';
        default: return 'grey';
      }
    };
    
    // Fetch dashboard data
    const fetchDashboardData = async () => {
      try {
        const response = await store.dispatch('admin/fetchDashboardData');
        
        // Update stats
        if (response.stats) {
          statsData.value[0].value = response.stats.totalOrders;
          statsData.value[0].change = response.stats.orderChange;
          
          statsData.value[1].value = `$${response.stats.revenue.toLocaleString()}`;
          statsData.value[1].change = response.stats.revenueChange;
          
          statsData.value[2].value = response.stats.newUsers;
          statsData.value[2].change = response.stats.userChange;
          
          statsData.value[3].value = response.stats.activeRestaurants;
          statsData.value[3].change = response.stats.restaurantChange;
        }
        
        // Update recent activities
        if (response.activities) {
          recentActivities.value = response.activities;
        }
        
        // Update pending tasks
        if (response.tasks) {
          pendingTasks.value = response.tasks;
        }
        
        // Update chart data
        if (response.salesData) {
          updateChart(response.salesData);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    // Chart functions
    const initChart = () => {
      const ctx = salesChart.value.getContext('2d');
      
      // Sample data
      const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            label: 'Orders',
            data: [65, 59, 80, 81, 56, 55, 40],
            fill: false,
            borderColor: '#4CAF50',
            tension: 0.1
          },
          {
            label: 'Revenue',
            data: [28, 48, 40, 19, 86, 27, 90],
            fill: false,
            borderColor: '#2196F3',
            tension: 0.1
          }
        ]
      };
      
      chartInstance = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
        }
      });
    };
    
    const updateChart = (salesData) => {
      if (chartInstance) {
        chartInstance.data.labels = salesData.labels;
        chartInstance.data.datasets[0].data = salesData.orders;
        chartInstance.data.datasets[1].data = salesData.revenue;
        chartInstance.update();
      }
    };
    
    // Watch for period changes
    watch(salesPeriod, async (newPeriod) => {
      try {
        const response = await store.dispatch('admin/fetchSalesData', { period: newPeriod });
        if (response.salesData) {
          updateChart(response.salesData);
        }
      } catch (error) {
        console.error('Error fetching sales data:', error);
      }
    });
    
    onMounted(() => {
      fetchDashboardData();
      initChart();
    });
    
    return {
      statsData,
      quickActions,
      recentActivities,
      pendingTasks,
      salesPeriod,
      salesChart,
      getTaskPriorityColor
    };
  }
};
</script>

<style scoped>
.max-width-120 {
  max-width: 120px;
}
</style>