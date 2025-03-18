<template>
  <div class="restaurant-dashboard">
    <!-- Quick Stats -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">Today's Orders</div>
            <div class="d-flex align-center">
              <div class="text-h4">{{ metrics.todayOrders }}</div>
              <v-chip
                :color="metrics.ordersTrend >= 0 ? 'success' : 'error'"
                size="small"
                class="ml-4"
              >
                {{ metrics.ordersTrend >= 0 ? '+' : '' }}{{ metrics.ordersTrend }}%
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">Today's Revenue</div>
            <div class="d-flex align-center">
              <div class="text-h4">${{ formatPrice(metrics.todayRevenue) }}</div>
              <v-chip
                :color="metrics.revenueTrend >= 0 ? 'success' : 'error'"
                size="small"
                class="ml-4"
              >
                {{ metrics.revenueTrend >= 0 ? '+' : '' }}{{ metrics.revenueTrend }}%
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">Avg Order Value</div>
            <div class="d-flex align-center">
              <div class="text-h4">${{ formatPrice(metrics.avgOrderValue) }}</div>
              <v-chip
                :color="metrics.avgOrderTrend >= 0 ? 'success' : 'error'"
                size="small"
                class="ml-4"
              >
                {{ metrics.avgOrderTrend >= 0 ? '+' : '' }}{{ metrics.avgOrderTrend }}%
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-overline mb-1">Customer Rating</div>
            <div class="d-flex align-center">
              <div class="text-h4">{{ metrics.avgRating.toFixed(1) }}</div>
              <v-rating
                :model-value="metrics.avgRating"
                color="amber"
                density="compact"
                half-increments
                readonly
                class="ml-2"
              ></v-rating>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-tabs v-model="activeTab" class="mt-4">
      <v-tab value="orders">
        <v-icon start>mdi-clipboard-list</v-icon>
        Orders
      </v-tab>
      <v-tab value="menu">
        <v-icon start>mdi-food</v-icon>
        Menu
      </v-tab>
      <v-tab value="analytics">
        <v-icon start>mdi-chart-line</v-icon>
        Analytics
      </v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="mt-4">
      <!-- Orders Tab -->
      <v-window-item value="orders">
        <OrderProcessing />
      </v-window-item>

      <!-- Menu Tab -->
      <v-window-item value="menu">
        <MenuManagement />
      </v-window-item>

      <!-- Analytics Tab -->
      <v-window-item value="analytics">
        <RestaurantAnalytics :restaurant-id="restaurantId" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useStore } from 'vuex'
import OrderProcessing from '@/components/restaurant/OrderProcessing.vue'
import MenuManagement from '@/components/restaurant/MenuManagement.vue'
import RestaurantAnalytics from '@/components/restaurant/RestaurantAnalytics.vue'

const store = useStore()
const activeTab = ref('orders')

// Restaurant ID should come from auth store or route params
const restaurantId = computed(() => store.state.auth.restaurant?.id)

// Metrics from store
const metrics = computed(() => store.state.restaurantAdmin.metrics)

// Format price with 2 decimal places
const formatPrice = (value) => {
  return value.toFixed(2)
}

// Initialize dashboard data
onMounted(async () => {
  await Promise.all([
    store.dispatch('restaurantAdmin/fetchMetrics'),
    store.dispatch('restaurantAdmin/fetchOrders'),
    store.dispatch('restaurantAdmin/fetchMenuItems')
  ])

  // Set up WebSocket connection for real-time updates
  store.dispatch('restaurantAdmin/initializeWebSocket')
})
</script>

<style scoped>
.restaurant-dashboard {
  padding: 16px;
  max-width: 1600px;
  margin: 0 auto;
}

.v-card {
  height: 100%;
}
</style>