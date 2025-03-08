<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Today's Orders</h3>
        <p class="value">{{ stats.todayOrders }}</p>
      </div>
      <div class="stat-card">
        <h3>Total Revenue</h3>
        <p class="value">${{ stats.totalRevenue }}</p>
      </div>
      <div class="stat-card">
        <h3>Average Rating</h3>
        <p class="value">{{ stats.avgRating }}/5</p>
      </div>
    </div>

    <div class="charts">
      <div class="chart-container">
        <h3>Revenue Last 7 Days</h3>
        <LineChart :data="revenueData" />
      </div>
      <div class="chart-container">
        <h3>Order Status Distribution</h3>
        <DoughnutChart :data="orderStatusData" />
      </div>
    </div>

    <div class="recent-orders">
      <h3>Recent Orders</h3>
      <OrderList :orders="recentOrders" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { fetchRestaurantStats } from '@/services/analytics.service'
import LineChart from '@/components/charts/LineChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import OrderList from '@/components/orders/OrderList.vue'

const route = useRoute()
const restaurantId = route.params.id

const stats = ref({
  todayOrders: 0,
  totalRevenue: 0,
  avgRating: 0
})

const revenueData = ref({
  labels: [],
  datasets: [{
    label: 'Revenue',
    data: []
  }]
})

const orderStatusData = ref({
  labels: ['Pending', 'Preparing', 'Delivering', 'Delivered'],
  datasets: [{
    data: [0, 0, 0, 0],
    backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0']
  }]
})

const recentOrders = ref([])

onMounted(async () => {
  const data = await fetchRestaurantStats(restaurantId)
  stats.value = data.stats
  revenueData.value = transformRevenueData(data.revenue)
  orderStatusData.value.datasets[0].data = data.orderStatus
  recentOrders.value = data.recentOrders
})

function transformRevenueData(rawData) {
  return {
    labels: rawData.map(d => d.date),
    datasets: [{
      label: 'Revenue',
      data: rawData.map(d => d.amount),
      borderColor: '#4bc0c0',
      tension: 0.1
    }]
  }
}
</script>

<style scoped>
.dashboard {
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.stat-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #666;
}

.stat-card .value {
  font-size: 2rem;
  margin: 0;
  font-weight: bold;
  color: #333;
}

.charts {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.chart-container {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.recent-orders {
  background: white;
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
</style>