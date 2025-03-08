<template>
  <div>
    <!-- Header with filters -->
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">Orders</h1>
      <v-spacer></v-spacer>
      <v-btn-toggle
        v-model="timeFilter"
        mandatory
        class="mr-4"
      >
        <v-btn value="today">Today</v-btn>
        <v-btn value="week">This Week</v-btn>
        <v-btn value="month">This Month</v-btn>
      </v-btn-toggle>
      <v-select
        v-model="statusFilter"
        :items="statusOptions"
        label="Status"
        hide-details
        class="max-width-200"
        variant="outlined"
        density="comfortable"
      ></v-select>
    </div>

    <!-- Orders Grid -->
    <v-row>
      <v-col cols="12" md="3">
        <!-- New Orders -->
        <v-card class="mb-6">
          <v-card-title class="bg-primary text-white">
            New Orders
            <v-badge
              :content="newOrders.length.toString()"
              :model-value="newOrders.length > 0"
              color="error"
              class="ml-2"
            ></v-badge>
          </v-card-title>
          <v-card-text class="pa-0">
            <order-list
              :orders="newOrders"
              @click="openOrderDetails"
              @accept="acceptOrder"
              @reject="rejectOrder"
            ></order-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <!-- Preparing -->
        <v-card class="mb-6">
          <v-card-title class="bg-info text-white">
            Preparing
            <v-badge
              :content="preparingOrders.length.toString()"
              :model-value="preparingOrders.length > 0"
              color="info"
              class="ml-2"
            ></v-badge>
          </v-card-title>
          <v-card-text class="pa-0">
            <order-list
              :orders="preparingOrders"
              @click="openOrderDetails"
              @ready="markOrderReady"
            ></order-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <!-- Ready for Pickup -->
        <v-card class="mb-6">
          <v-card-title class="bg-success text-white">
            Ready for Pickup
            <v-badge
              :content="readyOrders.length.toString()"
              :model-value="readyOrders.length > 0"
              color="success"
              class="ml-2"
            ></v-badge>
          </v-card-title>
          <v-card-text class="pa-0">
            <order-list
              :orders="readyOrders"
              @click="openOrderDetails"
              @pickup="confirmPickup"
            ></order-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <!-- Completed -->
        <v-card class="mb-6">
          <v-card-title class="bg-grey text-white">
            Completed Today
          </v-card-title>
          <v-card-text class="pa-0">
            <order-list
              :orders="completedOrders"
              @click="openOrderDetails"
            ></order-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Order Details Dialog -->
    <v-dialog
      v-model="orderDialog.show"
      max-width="700"
    >
      <v-card>
        <v-toolbar
          :color="getStatusColor(orderDialog.order?.status)"
          dark
        >
          <v-toolbar-title>
            Order #{{ orderDialog.order?.id }}
            <v-chip
              class="ml-2"
              size="small"
            >
              {{ formatOrderStatus(orderDialog.order?.status) }}
            </v-chip>
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="orderDialog.show = false"
          ></v-btn>
        </v-toolbar>

        <v-card-text class="pa-4">
          <!-- Order Info -->
          <v-row>
            <v-col cols="6">
              <div class="text-subtitle-2">Customer</div>
              <div>{{ orderDialog.order?.customer?.name }}</div>
              <div>{{ orderDialog.order?.customer?.phone }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-subtitle-2">Delivery Address</div>
              <div>{{ orderDialog.order?.address?.street }}</div>
              <div>{{ orderDialog.order?.address?.city }}</div>
              <div class="text-caption" v-if="orderDialog.order?.address?.instructions">
                Note: {{ orderDialog.order?.address?.instructions }}
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <!-- Order Items -->
          <div class="text-subtitle-2 mb-2">Order Items</div>
          <v-list>
            <v-list-item
              v-for="item in orderDialog.order?.items"
              :key="item.id"
              :title="`${item.quantity}x ${item.name}`"
              :subtitle="formatItemOptions(item.options)"
            >
              <template v-slot:append>
                {{ formatPrice(item.price * item.quantity) }}
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <!-- Order Totals -->
          <div class="d-flex justify-space-between mb-2">
            <span>Subtotal</span>
            <span>{{ formatPrice(orderDialog.order?.subtotal) }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span>Delivery Fee</span>
            <span>{{ formatPrice(orderDialog.order?.deliveryFee) }}</span>
          </div>
          <div v-if="orderDialog.order?.discount" class="d-flex justify-space-between mb-2">
            <span>Discount</span>
            <span class="success--text">-{{ formatPrice(orderDialog.order?.discount) }}</span>
          </div>
          <div class="d-flex justify-space-between text-h6">
            <span>Total</span>
            <span>{{ formatPrice(orderDialog.order?.total) }}</span>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- Action Buttons -->
          <v-card-actions>
            <v-btn
              v-if="orderDialog.order?.status === 'pending'"
              color="success"
              prepend-icon="mdi-check"
              @click="acceptOrder(orderDialog.order)"
            >
              Accept Order
            </v-btn>
            <v-btn
              v-if="orderDialog.order?.status === 'pending'"
              color="error"
              prepend-icon="mdi-close"
              @click="rejectOrder(orderDialog.order)"
            >
              Reject Order
            </v-btn>
            <v-btn
              v-if="orderDialog.order?.status === 'preparing'"
              color="success"
              prepend-icon="mdi-check-all"
              @click="markOrderReady(orderDialog.order)"
            >
              Mark as Ready
            </v-btn>
            <v-btn
              v-if="orderDialog.order?.status === 'ready'"
              color="success"
              prepend-icon="mdi-bike"
              @click="confirmPickup(orderDialog.order)"
            >
              Confirm Pickup
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-printer"
              @click="printOrder(orderDialog.order)"
            >
              Print Order
            </v-btn>
          </v-card-actions>

          <!-- Shipper Info -->
          <template v-if="orderDialog.order?.shipper">
            <v-divider class="my-4"></v-divider>
            <div class="text-subtitle-2 mb-2">Delivery Partner</div>
            <v-list-item
              :title="orderDialog.order.shipper.name"
              :subtitle="orderDialog.order.shipper.phone"
            >
              <template v-slot:prepend>
                <v-avatar color="grey">
                  <v-img
                    v-if="orderDialog.order.shipper.avatar"
                    :src="orderDialog.order.shipper.avatar"
                  ></v-img>
                  <span v-else class="text-h6 white--text">
                    {{ orderDialog.order.shipper.name.charAt(0) }}
                  </span>
                </v-avatar>
              </template>
              <template v-slot:append>
                <v-btn
                  icon="mdi-phone"
                  variant="text"
                  color="primary"
                  @click="callShipper(orderDialog.order.shipper)"
                ></v-btn>
              </template>
            </v-list-item>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Confirm Dialog -->
    <v-dialog
      v-model="confirmDialog.show"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
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
import { mapState, mapActions } from 'vuex';
import { format } from 'date-fns';
import OrderList from '@/components/restaurant/OrderList.vue';

export default {
  name: 'RestaurantOrders',
  components: { OrderList },

  data() {
    return {
      timeFilter: 'today',
      statusFilter: 'all',
      statusOptions: [
        { text: 'All Orders', value: 'all' },
        { text: 'New Orders', value: 'pending' },
        { text: 'Preparing', value: 'preparing' },
        { text: 'Ready', value: 'ready' },
        { text: 'Completed', value: 'completed' },
        { text: 'Cancelled', value: 'cancelled' }
      ],
      orderDialog: {
        show: false,
        order: null
      }
    };
  },

  computed: {
    ...mapState('restaurantAdmin', [
      'orders',
      'pendingOrders',
      'loading',
      'error'
    ]),

    newOrders() {
      return this.pendingOrders;
    },

    preparingOrders() {
      return this.orders.filter(order => order.status === 'preparing');
    },

    readyOrders() {
      return this.orders.filter(order => order.status === 'ready');
    },

    completedOrders() {
      return this.orders.filter(order => order.status === 'completed');
    }
  },

  methods: {
    ...mapActions('restaurantAdmin', [
      'fetchOrders',
      'updateOrder'
    ]),

    async loadOrders() {
      try {
        await this.fetchOrders({
          status: this.statusFilter,
          timeframe: this.timeFilter
        });
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    },

    openOrderDetails(order) {
      this.orderDialog.order = order;
      this.orderDialog.show = true;
    },

    async acceptOrder(orderId) {
      try {
        await this.updateOrder({ orderId, status: 'preparing' });
        this.$emit('order-accepted', orderId);
      } catch (error) {
        console.error('Error accepting order:', error);
      }
    },

    async rejectOrder(orderId) {
      try {
        await this.updateOrder({ orderId, status: 'cancelled' });
        this.$emit('order-rejected', orderId);
      } catch (error) {
        console.error('Error rejecting order:', error);
      }
    },

    async markOrderReady(orderId) {
      try {
        await this.updateOrder({ orderId, status: 'ready' });
        this.$emit('order-ready', orderId);
      } catch (error) {
        console.error('Error marking order as ready:', error);
      }
    },

    async confirmPickup(orderId) {
      try {
        await this.updateOrder({ orderId, status: 'completed' });
        this.$emit('order-completed', orderId);
      } catch (error) {
        console.error('Error confirming pickup:', error);
      }
    },

    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    },

    formatOrderStatus(status) {
      const statusMap = {
        pending: 'Pending',
        preparing: 'Preparing',
        ready: 'Ready',
        completed: 'Completed',
        cancelled: 'Cancelled'
      };
      return statusMap[status] || status;
    },

    getStatusColor(status) {
      const colorMap = {
        pending: 'warning',
        preparing: 'info',
        ready: 'success',
        completed: 'grey',
        cancelled: 'error'
      };
      return colorMap[status] || 'grey';
    },

    formatItemOptions(options) {
      if (!options || !options.length) return '';
      return options.map(opt => `${opt.name}: ${opt.value}`).join(', ');
    }
  },

  watch: {
    timeFilter() {
      this.loadOrders();
    },
    statusFilter() {
      this.loadOrders();
    }
  },
<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import OrderList from '@/components/restaurant/OrderList.vue'

const store = useStore()
const wsConnection = ref(null)

// Filters
const timeFilter = ref('today')
const statusFilter = ref('all')

const statusOptions = ref([
  { title: 'All Orders', value: 'all' },
  { title: 'New Orders', value: 'pending' },
  { title: 'Preparing', value: 'preparing' },
  { title: 'Ready for Pickup', value: 'ready' },
  { title: 'Out for Delivery', value: 'delivering' },
  { title: 'Completed', value: 'completed' },
  { title: 'Cancelled', value: 'cancelled' }
])

// Orders state
const orders = computed(() => store.state.restaurantAdmin.orders)
const newOrders = computed(() => orders.value.filter(order => order.status === 'pending'))
const preparingOrders = computed(() => orders.value.filter(order => order.status === 'preparing'))
const readyOrders = computed(() => orders.value.filter(order => order.status === 'ready'))
const completedOrders = computed(() => orders.value.filter(order => order.status === 'completed'))

// Order dialog
const orderDialog = ref({
  show: false,
  order: null
})

// Confirm dialog
const confirmDialog = ref({
  show: false,
  title: '',
  message: '',
  color: 'primary',
  onConfirm: () => {}
})
    const store = useStore()
    const wsConnection = ref(null)

    // Filters
    const timeFilter = ref('today')
    const statusFilter = ref('all')

    const statusOptions = [
      { title: 'All Orders', value: 'all' },
      { title: 'New Orders', value: 'pending' },
      { title: 'Preparing', value: 'preparing' },
      { title: 'Ready for Pickup', value: 'ready' },
      { title: 'Out for Delivery', value: 'delivering' },
      { title: 'Completed', value: 'completed' },
      { title: 'Cancelled', value: 'cancelled' }
    ]

    // Orders by status
    const orders = computed(() => store.state.restaurantAdmin.orders)
    const newOrders = computed(() => 
      orders.value.filter(order => order.status === 'pending')
    )
    const preparingOrders = computed(() => 
      orders.value.filter(order => order.status === 'preparing')
    )
    const readyOrders = computed(() => 
      orders.value.filter(order => order.status === 'ready')
    )
    const completedOrders = computed(() => 
      orders.value.filter(order => 
        order.status === 'completed' && 
        new Date(order.completedAt).toDateString() === new Date().toDateString()
      )
    )

    // Dialogs
    const orderDialog = ref({
      show: false,
      order: null
    })

    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      color: 'primary',
      onConfirm: null
    })

    // Methods
    const openOrderDetails = (order) => {
      orderDialog.value = {
        show: true,
        order
      }
    }

    const acceptOrder = (order) => {
      confirmDialog.value = {
        show: true,
        title: 'Accept Order',
        message: 'Are you sure you want to accept this order?',
        color: 'success',
        onConfirm: async () => {
          try {
            await store.dispatch('restaurantAdmin/updateOrder', {
              orderId: order.id,
              status: 'preparing'
            })
            confirmDialog.value.show = false
            if (orderDialog.value.show) {
              orderDialog.value.order = {
                ...orderDialog.value.order,
                status: 'preparing'
              }
            }
          } catch (error) {
            console.error('Failed to accept order:', error)
          }
        }
      }
    }

    const rejectOrder = (order) => {
      confirmDialog.value = {
        show: true,
        title: 'Reject Order',
        message: 'Are you sure you want to reject this order?',
        color: 'error',
        onConfirm: async () => {
          try {
            await store.dispatch('restaurantAdmin/updateOrder', {
              orderId: order.id,
              status: 'cancelled'
            })
            confirmDialog.value.show = false
            orderDialog.value.show = false
          } catch (error) {
            console.error('Failed to reject order:', error)
          }
        }
      }
    }

    const markOrderReady = (order) => {
      confirmDialog.value = {
        show: true,
        title: 'Mark Order Ready',
        message: 'Is this order ready for pickup?',
        color: 'success',
        onConfirm: async () => {
          try {
            await store.dispatch('restaurantAdmin/updateOrder', {
              orderId: order.id,
              status: 'ready'
            })
            confirmDialog.value.show = false
            if (orderDialog.value.show) {
              orderDialog.value.order = {
                ...orderDialog.value.order,
                status: 'ready'
              }
            }
          } catch (error) {
            console.error('Failed to mark order as ready:', error)
          }
        }
      }
    }

    const confirmPickup = (order) => {
      confirmDialog.value = {
        show: true,
        title: 'Confirm Pickup',
        message: `Has the driver picked up this order?`,
        color: 'success',
        onConfirm: async () => {
          try {
            await store.dispatch('restaurantAdmin/updateOrder', {
              orderId: order.id,
              status: 'delivering'
            })
            confirmDialog.value.show = false
            orderDialog.value.show = false
          } catch (error) {
            console.error('Failed to confirm pickup:', error)
          }
        }
      }
    }

    const callShipper = (shipper) => {
      window.location.href = `tel:${shipper.phone}`
    }

    const printOrder = (order) => {
      // Implement order printing logic
      console.log('Printing order:', order.id)
    }

    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'warning'
        case 'preparing': return 'info'
        case 'ready': return 'success'
        case 'delivering': return 'primary'
        case 'completed': return 'grey'
        case 'cancelled': return 'error'
        default: return 'grey'
      }
    }

    const formatOrderStatus = (status) => {
      return status?.charAt(0).toUpperCase() + status?.slice(1)
    }

    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }

    const formatItemOptions = (options) => {
      if (!options) return ''
      const parts = []
      if (options.size) parts.push(options.size.name)
      if (options.toppings?.length) {
        parts.push(options.toppings.map(t => t.name).join(', '))
      }
      return parts.join(' • ')
    }

    // WebSocket connection
    const connectToWebSocket = () => {
      wsConnection.value = new WebSocket(
        `ws://api.example.com/restaurant/orders`
      )

      wsConnection.value.onmessage = (event) => {
        const data = JSON.parse(event.data)
        store.dispatch('restaurantAdmin/handleOrderUpdate', data)
      }
    }

    // Lifecycle
    onMounted(async () => {
      try {
        await store.dispatch('restaurantAdmin/fetchOrders')
        connectToWebSocket()
      } catch (error) {
        console.error('Failed to fetch orders:', error)
      }
    })

    onUnmounted(() => {
      if (wsConnection.value) {
        wsConnection.value.close()
      }
    })

    return {
      timeFilter,
      statusFilter,
      statusOptions,
      newOrders,
      preparingOrders,
      readyOrders,
      completedOrders,
      orderDialog,
      confirmDialog,
      openOrderDetails,
      acceptOrder,
      rejectOrder,
      markOrderReady,
      confirmPickup,
      callShipper,
      printOrder,
      getStatusColor,
      formatOrderStatus,
      formatPrice,
      formatItemOptions
    }
  }
}
</script>

<style scoped>
.max-width-200 {
  max-width: 200px;
}
</style>
</template>

<script setup>
import { ref } from 'vue'

// Reactive state
const timeFilter = ref('today')
const statusFilter = ref('all')
const orderDialog = ref({
  show: false,
  order: null
})

// Status options for filter
const statusOptions = [
  'all',
  'pending',
  'preparing',
  'ready',
  'completed'
]
</script>
