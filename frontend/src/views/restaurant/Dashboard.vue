<template>
  <div>
    <!-- Metrics Cards -->
    <v-row>
      <!-- Today's Orders -->
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-overline mb-1">Today's Orders</div>
            <div class="text-h4 mb-2">{{ metrics.todayOrders }}</div>
            <v-progress-circular
              :rotate="-90"
              :size="50"
              :width="7"
              :model-value="orderProgress"
              color="primary"
            >
              {{ orderProgress }}%
            </v-progress-circular>
            <div class="text-caption mt-2">
              vs. {{ avgDailyOrders }} daily average
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Today's Revenue -->
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-overline mb-1">Today's Revenue</div>
            <div class="text-h4 mb-2">{{ formatPrice(metrics.todayRevenue) }}</div>
            <v-chip
              :color="revenueChange >= 0 ? 'success' : 'error'"
              size="small"
            >
              <v-icon start>
                {{ revenueChange >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}
              </v-icon>
              {{ Math.abs(revenueChange) }}% vs. yesterday
            </v-chip>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Average Delivery Time -->
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-overline mb-1">Avg. Delivery Time</div>
            <div class="text-h4 mb-2">{{ metrics.avgDeliveryTime }} min</div>
            <v-rating
              :model-value="deliveryTimeScore"
              color="amber"
              density="compact"
              half-increments
              readonly
            ></v-rating>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Average Rating -->
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text class="d-flex flex-column align-center">
            <div class="text-overline mb-1">Rating</div>
            <div class="text-h4 mb-2">{{ metrics.avgRating.toFixed(1) }}</div>
            <v-rating
              :model-value="metrics.avgRating"
              color="amber"
              density="compact"
              half-increments
              readonly
            ></v-rating>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <!-- Pending Orders -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex align-center">
            Pending Orders
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="text"
              to="/restaurant-admin/orders"
            >
              View All
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Time</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="order in pendingOrders" :key="order.id">
                  <td>{{ order.id }}</td>
                  <td>{{ formatTime(order.createdAt) }}</td>
                  <td>{{ order.items.length }} items</td>
                  <td>{{ formatPrice(order.total) }}</td>
                  <td>
                    <v-chip
                      :color="getStatusColor(order.status)"
                      size="small"
                    >
                      {{ order.status }}
                    </v-chip>
                  </td>
                  <td>
                    <v-btn-group density="comfortable">
                      <v-btn
                        icon="mdi-eye"
                        variant="text"
                        size="small"
                        @click="viewOrder(order.id)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-check"
                        variant="text"
                        size="small"
                        color="success"
                        @click="acceptOrder(order.id)"
                        v-if="order.status === 'pending'"
                      ></v-btn>
                      <v-btn
                        icon="mdi-close"
                        variant="text"
                        size="small"
                        color="error"
                        @click="rejectOrder(order.id)"
                        v-if="order.status === 'pending'"
                      ></v-btn>
                    </v-btn-group>
                  </td>
                </tr>
                <tr v-if="pendingOrders.length === 0">
                  <td colspan="6" class="text-center pa-4">
                    No pending orders
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Quick Actions -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Quick Actions</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="action in quickActions"
                :key="action.title"
                :to="action.path"
                :prepend-icon="action.icon"
                :title="action.title"
                :subtitle="action.subtitle"
              ></v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <!-- Recent Reviews -->
        <v-card class="mt-4">
          <v-card-title class="d-flex align-center">
            Recent Reviews
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="text"
              to="/restaurant-admin/reviews"
            >
              View All
            </v-btn>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-list lines="three">
              <v-list-item
                v-for="review in recentReviews"
                :key="review.id"
                :subtitle="review.comment"
              >
                <template v-slot:prepend>
                  <v-avatar color="grey-lighten-1">
                    <span class="text-h6">
                      {{ review.userName.charAt(0) }}
                    </span>
                  </v-avatar>
                </template>

                <template v-slot:title>
                  <div class="d-flex align-center">
                    {{ review.userName }}
                    <v-rating
                      :model-value="review.rating"
                      color="amber"
                      density="compact"
                      size="small"
                      half-increments
                      readonly
                      class="ml-2"
                    ></v-rating>
                  </div>
                </template>

                <template v-slot:append>
                  <div class="text-caption">
                    {{ formatDate(review.createdAt) }}
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Confirm Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="confirmDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="confirmDialog.color"
            @click="confirmDialog.onConfirm"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'RestaurantDashboard',

  setup() {
    const store = useStore()
    const router = useRouter()

    // State
    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      color: 'primary',
      onConfirm: () => {}
    })

    // Computed
    const metrics = computed(() => store.getters['restaurantAdmin/getMetrics'])
    const pendingOrders = computed(() => store.getters['restaurantAdmin/getPendingOrders'])
    const recentReviews = computed(() => store.getters['restaurantAdmin/getReviews'].slice(0, 3))

    const orderProgress = computed(() => {
      const target = 100 // Example target orders per day
      return Math.min(Math.round((metrics.value.todayOrders / target) * 100), 100)
    })

    const avgDailyOrders = computed(() => {
      return Math.round(metrics.value.monthlyOrders / 30)
    })

    const revenueChange = computed(() => {
      // Dummy calculation - replace with actual data
      return 15
    })

    const deliveryTimeScore = computed(() => {
      // Convert delivery time to a 5-star rating
      // Example: 30 min = 5 stars, 45 min = 3 stars, 60 min = 1 star
      const score = 5 - ((metrics.value.avgDeliveryTime - 30) / 7.5)
      return Math.max(1, Math.min(5, score))
    })

    const quickActions = [
      {
        title: 'Add Menu Item',
        subtitle: 'Create new dishes or update existing ones',
        icon: 'mdi-food',
        path: '/restaurant-admin/menu'
      },
      {
        title: 'Create Promotion',
        subtitle: 'Set up discounts and special offers',
        icon: 'mdi-ticket-percent',
        path: '/restaurant-admin/promotions'
      },
      {
        title: 'View Analytics',
        subtitle: 'Check your restaurant performance',
        icon: 'mdi-chart-line',
        path: '/restaurant-admin/analytics'
      },
      {
        title: 'Update Settings',
        subtitle: 'Manage restaurant information',
        icon: 'mdi-cog',
        path: '/restaurant-admin/settings'
      }
    ]

    // Methods
    const viewOrder = (orderId) => {
      router.push(`/restaurant-admin/orders/${orderId}`)
    }

    const acceptOrder = (orderId) => {
      confirmDialog.value = {
        show: true,
        title: 'Accept Order',
        message: 'Are you sure you want to accept this order?',
        color: 'success',
        onConfirm: async () => {
          try {
            await store.dispatch('restaurantAdmin/updateOrder', {
              orderId,
              status: 'preparing'
            })
            confirmDialog.value.show = false
          } catch (error) {
            console.error('Failed to accept order:', error)
          }
        }
      }
    }

    const rejectOrder = (orderId) => {
      confirmDialog.value = {
        show: true,
        title: 'Reject Order',
        message: 'Are you sure you want to reject this order?',
        color: 'error',
        onConfirm: async () => {
          try {
            await store.dispatch('restaurantAdmin/updateOrder', {
              orderId,
              status: 'cancelled'
            })
            confirmDialog.value.show = false
          } catch (error) {
            console.error('Failed to reject order:', error)
          }
        }
      }
    }

    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'warning'
        case 'preparing': return 'info'
        case 'ready': return 'success'
        case 'cancelled': return 'error'
        default: return 'grey'
      }
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }

    const formatPrice = (price) => {
      return `$${price.toFixed(2)}`
    }

    // Lifecycle
    onMounted(async () => {
      try {
        await Promise.all([
          store.dispatch('restaurantAdmin/fetchMetrics'),
          store.dispatch('restaurantAdmin/fetchOrders', { status: 'pending' }),
          store.dispatch('restaurantAdmin/fetchReviews', { limit: 3 })
        ])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      }
    })

    return {
      metrics,
      pendingOrders,
      recentReviews,
      orderProgress,
      avgDailyOrders,
      revenueChange,
      deliveryTimeScore,
      quickActions,
      confirmDialog,
      viewOrder,
      acceptOrder,
      rejectOrder,
      getStatusColor,
      formatTime,
      formatDate,
      formatPrice
    }
  }
}
</script>
