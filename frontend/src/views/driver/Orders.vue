<template>
  <div>
    <!-- Active Orders -->
    <v-card class="mb-6">
      <v-card-title>
        Active Orders
        <v-chip
          v-if="activeOrders.length"
          class="ml-2"
          color="primary"
        >
          {{ activeOrders.length }}
        </v-chip>
      </v-card-title>

      <v-expand-transition>
        <div v-if="activeOrders.length">
          <v-row>
            <v-col
              v-for="order in activeOrders"
              :key="order.id"
              cols="12"
              md="6"
            >
              <v-card
                :color="getOrderColor(order.status)"
                :theme="isDarkOrderStatus(order.status) ? 'dark' : undefined"
              >
                <v-card-title class="d-flex justify-space-between">
                  <div>Order #{{ order.id }}</div>
                  <v-chip>{{ formatStatus(order.status) }}</v-chip>
                </v-card-title>

                <v-card-text>
                  <v-row>
                    <v-col cols="6">
                      <div class="text-caption">Restaurant</div>
                      <div class="text-subtitle-1">{{ order.restaurant.name }}</div>
                      <div class="text-caption">{{ order.restaurant.address }}</div>
                    </v-col>

                    <v-col cols="6">
                      <div class="text-caption">Customer</div>
                      <div class="text-subtitle-1">{{ order.customer.name }}</div>
                      <div class="text-caption">{{ order.customer.address }}</div>
                    </v-col>
                  </v-row>

                  <v-divider class="my-3"></v-divider>

                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-caption">Total Amount</div>
                      <div class="text-h6">{{ formatPrice(order.total) }}</div>
                    </div>

                    <!-- Status Action Buttons -->
                    <div>
                      <v-btn-group v-if="order.status === 'accepted'">
                        <v-btn
                          color="info"
                          prepend-icon="mdi-map"
                          :href="getDirectionsUrl(order.restaurant.address)"
                          target="_blank"
                        >
                          Navigate
                        </v-btn>
                        <v-btn
                          color="primary"
                          @click="updateStatus(order.id, 'picked_up')"
                        >
                          Pick Up
                        </v-btn>
                      </v-btn-group>

                      <v-btn-group v-if="order.status === 'picked_up'">
                        <v-btn
                          color="info"
                          prepend-icon="mdi-map"
                          :href="getDirectionsUrl(order.customer.address)"
                          target="_blank"
                        >
                          Navigate
                        </v-btn>
                        <v-btn
                          color="success"
                          @click="updateStatus(order.id, 'completed')"
                        >
                          Complete
                        </v-btn>
                      </v-btn-group>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </div>
        <v-card-text v-else>
          <div class="text-center pa-4 text-medium-emphasis">
            No active orders
          </div>
        </v-card-text>
      </v-expand-transition>
    </v-card>

    <!-- Order History -->
    <v-card>
      <v-card-title class="d-flex align-center">
        Order History
        <v-spacer></v-spacer>
        <!-- Filters -->
        <v-row align="center" class="mx-2" style="max-width: 600px">
          <v-col cols="auto">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              density="compact"
              hide-details
              style="min-width: 150px"
            ></v-select>
          </v-col>
          <v-col>
            <v-text-field
              v-model="filters.search"
              label="Search orders"
              density="compact"
              hide-details
              prepend-inner-icon="mdi-magnify"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-title>

      <!-- History Table -->
      <v-data-table
        v-model:page="page"
        :headers="headers"
        :items="orderHistory"
        :items-per-page="itemsPerPage"
        :loading="loading"
      >
        <!-- Status Column -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getOrderColor(item.status)"
            size="small"
          >
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <!-- Customer Column -->
        <template v-slot:item.customer="{ item }">
          <div>{{ item.customer.name }}</div>
          <div class="text-caption">{{ item.customer.address }}</div>
        </template>

        <!-- Restaurant Column -->
        <template v-slot:item.restaurant="{ item }">
          <div>{{ item.restaurant.name }}</div>
          <div class="text-caption">{{ item.restaurant.address }}</div>
        </template>

        <!-- Amount Column -->
        <template v-slot:item.total="{ item }">
          <div>{{ formatPrice(item.total) }}</div>
          <div class="text-caption">
            Earnings: {{ formatPrice(item.driverEarnings) }}
          </div>
        </template>

        <!-- Time Column -->
        <template v-slot:item.time="{ item }">
          <div>{{ formatDate(item.createdAt) }}</div>
          <div class="text-caption">{{ formatTime(item.createdAt) }}</div>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-information"
            variant="text"
            size="small"
            @click="showOrderDetails(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Order Details Dialog -->
    <v-dialog
      v-model="detailsDialog.show"
      max-width="600"
    >
      <v-card v-if="detailsDialog.order">
        <v-toolbar
          :color="getOrderColor(detailsDialog.order.status)"
          :theme="isDarkOrderStatus(detailsDialog.order.status) ? 'dark' : undefined"
        >
          <v-toolbar-title>Order #{{ detailsDialog.order.id }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-chip>{{ formatStatus(detailsDialog.order.status) }}</v-chip>
        </v-toolbar>

        <v-card-text class="pa-4">
          <!-- Order Timeline -->
          <v-timeline density="compact">
            <v-timeline-item
              v-for="event in detailsDialog.order.timeline"
              :key="event.time"
              :dot-color="getTimelineColor(event.status)"
              size="small"
            >
              <template v-slot:opposite>
                {{ formatTime(event.time) }}
              </template>
              {{ getTimelineText(event.status) }}
            </v-timeline-item>
          </v-timeline>

          <v-divider class="my-4"></v-divider>

          <!-- Order Details -->
          <v-row>
            <v-col cols="6">
              <div class="text-subtitle-2">Restaurant</div>
              <v-list density="compact">
                <v-list-item
                  :title="detailsDialog.order.restaurant.name"
                  :subtitle="detailsDialog.order.restaurant.address"
                ></v-list-item>
              </v-list>
            </v-col>

            <v-col cols="6">
              <div class="text-subtitle-2">Customer</div>
              <v-list density="compact">
                <v-list-item
                  :title="detailsDialog.order.customer.name"
                  :subtitle="detailsDialog.order.customer.address"
                ></v-list-item>
              </v-list>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <!-- Order Items -->
          <div class="text-subtitle-2 mb-2">Order Items</div>
          <v-list density="compact">
            <v-list-item
              v-for="item in detailsDialog.order.items"
              :key="item.id"
              :title="item.name"
              :subtitle="`Quantity: ${item.quantity}`"
            >
              <template v-slot:append>
                {{ formatPrice(item.price * item.quantity) }}
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <!-- Order Summary -->
          <div class="d-flex justify-space-between mb-2">
            <div>Subtotal</div>
            <div>{{ formatPrice(detailsDialog.order.subtotal) }}</div>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <div>Delivery Fee</div>
            <div>{{ formatPrice(detailsDialog.order.deliveryFee) }}</div>
          </div>
          <div class="d-flex justify-space-between font-weight-bold">
            <div>Total</div>
            <div>{{ formatPrice(detailsDialog.order.total) }}</div>
          </div>

          <v-alert
            v-if="detailsDialog.order.rating"
            :color="getRatingColor(detailsDialog.order.rating)"
            class="mt-4"
          >
            <div class="text-subtitle-2">Customer Rating</div>
            <v-rating
              :model-value="detailsDialog.order.rating"
              color="white"
              readonly
              half-increments
              size="small"
            ></v-rating>
            <div v-if="detailsDialog.order.review" class="mt-2">
              "{{ detailsDialog.order.review }}"
            </div>
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="detailsDialog.show = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'DriverOrders',

  setup() {
    const store = useStore()
    const loading = ref(false)
    const page = ref(1)
    const itemsPerPage = ref(10)

    // Filters
    const filters = ref({
      status: 'all',
      search: ''
    })

    const statusOptions = [
      { title: 'All Orders', value: 'all' },
      { title: 'Completed', value: 'completed' },
      { title: 'Cancelled', value: 'cancelled' }
    ]

    // Table headers
    const headers = [
      { title: 'Order #', key: 'id' },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Restaurant', key: 'restaurant' },
      { title: 'Customer', key: 'customer' },
      { title: 'Amount', key: 'total', sortable: true },
      { title: 'Time', key: 'time', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ]

    // Computed properties
    const activeOrders = computed(() => store.state.driver.activeOrders)
    const orderHistory = computed(() => store.state.driver.orderHistory)

    // Dialog state
    const detailsDialog = ref({
      show: false,
      order: null
    })

    // Methods
    const loadOrders = async () => {
      loading.value = true
      try {
        await store.dispatch('driver/fetchOrderHistory', {
          page: page.value,
          limit: itemsPerPage.value,
          ...filters.value
        })
      } catch (error) {
        console.error('Failed to load orders:', error)
      } finally {
        loading.value = false
      }
    }

    const updateStatus = async (orderId, status) => {
      try {
        await store.dispatch('driver/updateOrderStatus', { orderId, status })
      } catch (error) {
        console.error('Failed to update order status:', error)
      }
    }

    const showOrderDetails = (order) => {
      detailsDialog.value = {
        show: true,
        order
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
        case 'cancelled': return 'error'
        default: return undefined
      }
    }

    const getTimelineColor = (status) => {
      switch (status) {
        case 'created': return 'grey'
        case 'assigned': return 'warning'
        case 'accepted': return 'primary'
        case 'picked_up': return 'info'
        case 'completed': return 'success'
        case 'cancelled': return 'error'
        default: return 'grey'
      }
    }

    const getTimelineText = (status) => {
      switch (status) {
        case 'created': return 'Order Created'
        case 'assigned': return 'Assigned to Driver'
        case 'accepted': return 'Order Accepted'
        case 'picked_up': return 'Picked Up from Restaurant'
        case 'completed': return 'Delivered to Customer'
        case 'cancelled': return 'Order Cancelled'
        default: return status
      }
    }

    const getRatingColor = (rating) => {
      if (rating >= 4.5) return 'success'
      if (rating >= 3.5) return 'info'
      if (rating >= 2.5) return 'warning'
      return 'error'
    }

    const isDarkOrderStatus = (status) => {
      return ['assigned', 'accepted', 'picked_up'].includes(status)
    }

    const formatStatus = (status) => {
      return status.replace('_', ' ').charAt(0).toUpperCase() + 
        status.slice(1).replace('_', ' ')
    }

    const formatDate = (timestamp) => {
      return new Date(timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
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

    // Watch for filter changes
    watch([filters, page], () => {
      loadOrders()
    })

    // Lifecycle
    onMounted(() => {
      loadOrders()
    })

    return {
      loading,
      page,
      itemsPerPage,
      filters,
      statusOptions,
      headers,
      activeOrders,
      orderHistory,
      detailsDialog,
      updateStatus,
      showOrderDetails,
      getDirectionsUrl,
      getOrderColor,
      getTimelineColor,
      getTimelineText,
      getRatingColor,
      isDarkOrderStatus,
      formatStatus,
      formatDate,
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

.v-timeline {
  max-height: 300px;
  overflow-y: auto;
}
</style>
