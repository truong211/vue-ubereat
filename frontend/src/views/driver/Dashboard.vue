<template>
  <div>
    <!-- Status Card -->
    <v-row>
      <v-col cols="12">
        <v-card :color="isOnline ? 'success' : undefined" :theme="isOnline ? 'dark' : undefined">
          <v-card-text>
            <div class="d-flex align-center">
              <div>
                <div class="text-h6">Current Status</div>
                <div class="text-h4">{{ getStatusText }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-switch
                v-model="isOnline"
                :color="isOnline ? 'white' : 'success'"
                hide-details
                inset
                @change="toggleStatus"
              ></v-switch>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stats Cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Today's Earnings</div>
            <div class="text-h4">{{ formatPrice(todayStats.earnings) }}</div>
            <div class="text-caption">{{ todayStats.deliveries }} deliveries</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Average Rating</div>
            <div class="d-flex align-center">
              <div class="text-h4 mr-2">{{ metrics.avgRating.toFixed(1) }}</div>
              <v-rating
                :model-value="metrics.avgRating"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="small"
              ></v-rating>
            </div>
            <div class="text-caption">{{ metrics.totalRatings }} ratings</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Acceptance Rate</div>
            <div class="text-h4">{{ metrics.acceptanceRate }}%</div>
            <v-progress-linear
              :model-value="metrics.acceptanceRate"
              :color="getAcceptanceRateColor"
              height="4"
              class="mt-1"
            ></v-progress-linear>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">On-Time Delivery</div>
            <div class="text-h4">{{ metrics.onTimeDeliveryRate }}%</div>
            <v-progress-linear
              :model-value="metrics.onTimeDeliveryRate"
              color="success"
              height="4"
              class="mt-1"
            ></v-progress-linear>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Current Order -->
    <v-row v-if="currentOrder">
      <v-col cols="12">
        <v-card>
          <v-toolbar
            :color="getOrderColor(currentOrder.status)"
            :theme="isDarkOrderStatus(currentOrder.status) ? 'dark' : undefined"
          >
            <v-toolbar-title>Current Order #{{ currentOrder.id }}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-chip>{{ formatStatus(currentOrder.status) }}</v-chip>
          </v-toolbar>

          <v-card-text class="pa-4">
            <v-row>
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 font-weight-bold mb-2">Restaurant</div>
                <v-list density="compact">
                  <v-list-item
                    :title="currentOrder.restaurant.name"
                    :subtitle="currentOrder.restaurant.address"
                    :prepend-avatar="currentOrder.restaurant.logo"
                  >
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-phone"
                        variant="text"
                        :href="`tel:${currentOrder.restaurant.phone}`"
                      ></v-btn>
                      <v-btn
                        icon="mdi-map"
                        variant="text"
                        :href="getDirectionsUrl(currentOrder.restaurant.address)"
                        target="_blank"
                      ></v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-col>

              <v-col cols="12" md="6">
                <div class="text-subtitle-1 font-weight-bold mb-2">Customer</div>
                <v-list density="compact">
                  <v-list-item
                    :title="currentOrder.customer.name"
                    :subtitle="currentOrder.customer.address"
                  >
                    <template v-slot:append>
                      <v-btn
                        icon="mdi-phone"
                        variant="text"
                        :href="`tel:${currentOrder.customer.phone}`"
                      ></v-btn>
                      <v-btn
                        icon="mdi-map"
                        variant="text"
                        :href="getDirectionsUrl(currentOrder.customer.address)"
                        target="_blank"
                      ></v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </v-col>
            </v-row>

            <v-divider class="my-4"></v-divider>

            <!-- Order Items -->
            <div class="text-subtitle-1 font-weight-bold mb-2">Order Items</div>
            <v-list>
              <v-list-item
                v-for="item in currentOrder.items"
                :key="item.id"
                :title="item.name"
                :subtitle="`Quantity: ${item.quantity}`"
              >
                <template v-slot:append>
                  {{ formatPrice(item.price * item.quantity) }}
                </template>
              </v-list-item>

              <v-divider class="my-2"></v-divider>

              <v-list-item>
                <template v-slot:prepend>
                  <div class="text-subtitle-1">Total</div>
                </template>
                <template v-slot:append>
                  <div class="text-subtitle-1 font-weight-bold">
                    {{ formatPrice(currentOrder.total) }}
                  </div>
                </template>
              </v-list-item>
            </v-list>

            <!-- Action Buttons -->
            <div class="d-flex justify-end mt-4">
              <template v-if="currentOrder.status === 'assigned'">
                <v-btn
                  color="error"
                  variant="outlined"
                  class="mr-2"
                  @click="rejectOrder"
                >
                  Reject Order
                </v-btn>
                <v-btn
                  color="success"
                  @click="acceptOrder"
                >
                  Accept Order
                </v-btn>
              </template>

              <template v-if="currentOrder.status === 'accepted'">
                <v-btn
                  color="primary"
                  @click="updateStatus('picked_up')"
                >
                  Pick Up Order
                </v-btn>
              </template>

              <template v-if="currentOrder.status === 'picked_up'">
                <v-btn
                  color="success"
                  @click="updateStatus('completed')"
                >
                  Complete Delivery
                </v-btn>
              </template>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Orders -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            Recent Orders
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              color="primary"
              to="/driver/orders"
            >
              View All
            </v-btn>
          </v-card-title>

          <v-table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Restaurant</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td>{{ order.id }}</td>
                <td>{{ order.restaurant.name }}</td>
                <td>{{ order.customer.name }}</td>
                <td>{{ formatPrice(order.total) }}</td>
                <td>
                  <v-chip
                    :color="getOrderColor(order.status)"
                    size="small"
                  >
                    {{ formatStatus(order.status) }}
                  </v-chip>
                </td>
                <td>{{ formatTime(order.createdAt) }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'DriverDashboard',

  setup() {
    const store = useStore()
    const isOnline = ref(false)

    // Computed properties
    const currentOrder = computed(() => store.state.driver.currentOrder)
    const todayStats = computed(() => store.getters['driver/getTodayStats'])
    const metrics = computed(() => store.state.driver.metrics)
    const recentOrders = computed(() => 
      store.state.driver.orderHistory.slice(0, 5)
    )

    const getAcceptanceRateColor = computed(() => {
      const rate = metrics.value.acceptanceRate
      if (rate >= 90) return 'success'
      if (rate >= 70) return 'warning'
      return 'error'
    })

    const getStatusText = computed(() => {
      if (!isOnline.value) return 'Offline'
      return currentOrder.value ? 'On Delivery' : 'Available'
    })

    // Methods
    const toggleStatus = async (value) => {
      try {
        await store.dispatch('driver/updateStatus', { online: value })
      } catch (error) {
        isOnline.value = !value // Revert on failure
      }
    }

    const acceptOrder = async () => {
      if (!currentOrder.value) return
      try {
        await store.dispatch('driver/acceptOrder', currentOrder.value.id)
      } catch (error) {
        console.error('Failed to accept order:', error)
      }
    }

    const rejectOrder = async () => {
      if (!currentOrder.value) return
      try {
        await store.dispatch('driver/rejectOrder', currentOrder.value.id)
      } catch (error) {
        console.error('Failed to reject order:', error)
      }
    }

    const updateStatus = async (status) => {
      if (!currentOrder.value) return
      try {
        await store.dispatch('driver/updateOrderStatus', {
          orderId: currentOrder.value.id,
          status
        })
      } catch (error) {
        console.error('Failed to update order status:', error)
      }
    }

    const getDirectionsUrl = (address) => {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
    }

    const getOrderColor = (status) => {
      switch (status) {
        case 'assigned': return 'warning'
        case 'accepted': return 'primary'
        case 'picked_up': return 'info'
        case 'completed': return 'success'
        default: return undefined
      }
    }

    const isDarkOrderStatus = (status) => {
      return ['assigned', 'accepted', 'picked_up'].includes(status)
    }

    const formatStatus = (status) => {
      return status.replace('_', ' ').charAt(0).toUpperCase() + 
        status.slice(1).replace('_', ' ')
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }

    // Lifecycle
    onMounted(async () => {
      isOnline.value = store.getters['driver/isOnline']
      await Promise.all([
        store.dispatch('driver/fetchCurrentOrder'),
        store.dispatch('driver/fetchMetrics'),
        store.dispatch('driver/fetchEarnings'),
        store.dispatch('driver/fetchOrderHistory')
      ])
    })

    return {
      isOnline,
      currentOrder,
      todayStats,
      metrics,
      recentOrders,
      getAcceptanceRateColor,
      getStatusText,
      toggleStatus,
      acceptOrder,
      rejectOrder,
      updateStatus,
      getDirectionsUrl,
      getOrderColor,
      isDarkOrderStatus,
      formatStatus,
      formatTime,
      formatPrice
    }
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-card-text {
  padding: 20px;
}
</style>
