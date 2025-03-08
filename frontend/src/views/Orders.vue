<template>
  <div class="orders">
    <v-container>
      <h1 class="text-h4 mb-6">My Orders</h1>

      <!-- Order Tabs -->
      <v-tabs v-model="activeTab" class="mb-6">
        <v-tab value="active">Active Orders</v-tab>
        <v-tab value="past">Order History</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <!-- Active Orders -->
        <v-window-item value="active">
          <div v-if="activeOrders.length > 0">
            <v-card
              v-for="order in activeOrders"
              :key="order.id"
              class="mb-4"
              elevation="2"
            >
              <v-card-title class="d-flex justify-space-between">
                <span>Order #{{ order.id }}</span>
                <v-chip
                  :color="getStatusColor(order.status)"
                  text-color="white"
                >
                  {{ order.status }}
                </v-chip>
              </v-card-title>

              <v-card-text>
                <div class="d-flex align-center mb-4">
                  <v-avatar size="48" class="mr-4">
                    <v-img :src="order.restaurant.image"></v-img>
                  </v-avatar>
                  <div>
                    <div class="text-h6">{{ order.restaurant.name }}</div>
                    <div class="text-subtitle-2 text-grey">
                      {{ order.items.length }} items · ${{ order.total.toFixed(2) }}
                    </div>
                  </div>
                </div>

                <!-- Order Progress -->
                <v-stepper
                  v-if="order.status !== 'cancelled'"
                  :value="getStepValue(order.status)"
                  class="elevation-0"
                >
                  <v-stepper-header class="elevation-0">
                    <v-stepper-item step="1">Confirmed</v-stepper-item>
                    <v-divider></v-divider>
                    <v-stepper-item step="2">Preparing</v-stepper-item>
                    <v-divider></v-divider>
                    <v-stepper-item step="3">On the way</v-stepper-item>
                    <v-divider></v-divider>
                    <v-stepper-item step="4">Delivered</v-stepper-item>
                  </v-stepper-header>
                </v-stepper>

                <!-- Estimated Delivery Time -->
                <div class="mt-4 d-flex align-center" v-if="order.estimatedDeliveryTime">
                  <v-icon class="mr-2">mdi-clock-outline</v-icon>
                  <span>Estimated delivery: {{ order.estimatedDeliveryTime }}</span>
                </div>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-btn
                  text
                  color="primary"
                  @click="order.showDetails = !order.showDetails"
                >
                  {{ order.showDetails ? 'Hide' : 'View' }} Details
                  <v-icon right>
                    {{ order.showDetails ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  v-if="order.status === 'delivered'"
                  text
                  color="primary"
                  @click="reorder(order)"
                >
                  Reorder
                </v-btn>
              </v-card-actions>

              <v-expand-transition>
                <div v-show="order.showDetails">
                  <v-divider></v-divider>
                  <v-card-text>
                    <div
                      v-for="item in order.items"
                      :key="item.id"
                      class="d-flex justify-space-between mb-2"
                    >
                      <span>{{ item.quantity }}x {{ item.name }}</span>
                      <span>${{ (item.price * item.quantity).toFixed(2) }}</span>
                    </div>
                    <v-divider class="my-4"></v-divider>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Subtotal</span>
                      <span>${{ order.subtotal.toFixed(2) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Delivery Fee</span>
                      <span>${{ order.deliveryFee.toFixed(2) }}</span>
                    </div>
                    <div class="d-flex justify-space-between text-subtitle-1 font-weight-bold">
                      <span>Total</span>
                      <span>${{ order.total.toFixed(2) }}</span>
                    </div>
                  </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </div>
          <v-alert
            v-else
            type="info"
            text
            class="text-center"
          >
            No active orders
          </v-alert>
        </v-window-item>

        <!-- Past Orders -->
        <v-window-item value="past">
          <div v-if="pastOrders.length > 0">
            <v-card
              v-for="order in pastOrders"
              :key="order.id"
              class="mb-4"
              elevation="2"
            >
              <v-card-title class="d-flex justify-space-between">
                <span>Order #{{ order.id }}</span>
                <div class="text-caption text-grey">
                  {{ formatDate(order.completedAt) }}
                </div>
              </v-card-title>

              <v-card-text>
                <div class="d-flex align-center">
                  <v-avatar size="48" class="mr-4">
                    <v-img :src="order.restaurant.image"></v-img>
                  </v-avatar>
                  <div>
                    <div class="text-h6">{{ order.restaurant.name }}</div>
                    <div class="text-subtitle-2 text-grey">
                      {{ order.items.length }} items · ${{ order.total.toFixed(2) }}
                    </div>
                  </div>
                </div>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-btn
                  text
                  color="primary"
                  @click="order.showDetails = !order.showDetails"
                >
                  {{ order.showDetails ? 'Hide' : 'View' }} Details
                  <v-icon right>
                    {{ order.showDetails ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  text
                  color="primary"
                  @click="reorder(order)"
                >
                  Reorder
                </v-btn>
              </v-card-actions>

              <v-expand-transition>
                <div v-show="order.showDetails">
                  <v-divider></v-divider>
                  <v-card-text>
                    <div
                      v-for="item in order.items"
                      :key="item.id"
                      class="d-flex justify-space-between mb-2"
                    >
                      <span>{{ item.quantity }}x {{ item.name }}</span>
                      <span>${{ (item.price * item.quantity).toFixed(2) }}</span>
                    </div>
                    <v-divider class="my-4"></v-divider>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Subtotal</span>
                      <span>${{ order.subtotal.toFixed(2) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span>Delivery Fee</span>
                      <span>${{ order.deliveryFee.toFixed(2) }}</span>
                    </div>
                    <div class="d-flex justify-space-between text-subtitle-1 font-weight-bold">
                      <span>Total</span>
                      <span>${{ order.total.toFixed(2) }}</span>
                    </div>
                  </v-card-text>
                </div>
              </v-expand-transition>
            </v-card>
          </div>
          <v-alert
            v-else
            type="info"
            text
            class="text-center"
          >
            No order history
          </v-alert>
        </v-window-item>
      </v-window>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'Orders',
  setup() {
    const store = useStore()
    const router = useRouter()
    const activeTab = ref('active')

    const orders = computed(() => store.state.orders)

    const activeOrders = computed(() =>
      orders.value.filter(order =>
        ['confirmed', 'preparing', 'on_the_way'].includes(order.status)
      )
    )

    const pastOrders = computed(() =>
      orders.value.filter(order =>
        ['delivered', 'cancelled'].includes(order.status)
      ).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
    )

    const getStatusColor = (status) => {
      const colors = {
        confirmed: 'primary',
        preparing: 'info',
        on_the_way: 'warning',
        delivered: 'success',
        cancelled: 'error'
      }
      return colors[status] || 'grey'
    }

    const getStepValue = (status) => {
      const steps = {
        confirmed: 1,
        preparing: 2,
        on_the_way: 3,
        delivered: 4
      }
      return steps[status] || 0
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const reorder = (order) => {
      // Clear current cart
      store.commit('clearCart')
      
      // Add all items from the order to cart
      order.items.forEach(item => {
        store.commit('addToCart', item)
      })

      // Navigate to the restaurant page
      router.push(`/restaurant/${order.restaurant.id}`)
    }

    onMounted(async () => {
      try {
        await store.dispatch('fetchOrders')
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      }
    })

    return {
      activeTab,
      activeOrders,
      pastOrders,
      getStatusColor,
      getStepValue,
      formatDate,
      reorder
    }
  }
}
</script>