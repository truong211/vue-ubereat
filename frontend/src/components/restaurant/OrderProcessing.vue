<template>
  <div class="order-processing">
    <!-- Header with Filters -->
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">Order Processing</h2>
      <v-spacer></v-spacer>
      <v-select
        v-model="timeFilter"
        :items="[
          { title: 'Today', value: 'today' },
          { title: 'Yesterday', value: 'yesterday' },
          { title: 'Last 7 Days', value: 'week' }
        ]"
        label="Time Period"
        density="comfortable"
        hide-details
        class="max-width-200 mr-2"
      ></v-select>
      <v-btn-toggle
        v-model="viewMode"
        density="comfortable"
        color="primary"
      >
        <v-btn value="kanban">
          <v-icon>mdi-view-column</v-icon>
        </v-btn>
        <v-btn value="list">
          <v-icon>mdi-format-list-bulleted</v-icon>
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Kanban Board View -->
    <div v-if="viewMode === 'kanban'" class="kanban-view">
      <v-row>
        <v-col 
          v-for="status in orderStatuses" 
          :key="status.value"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card class="status-column">
            <v-card-title :class="['py-2', status.color + '-lighten-4']">
              <v-icon :color="status.color" class="mr-2">{{ status.icon }}</v-icon>
              {{ status.title }}
              <v-chip
                :color="status.color"
                size="small"
                class="ml-2"
              >
                {{ getOrdersByStatus(status.value).length }}
              </v-chip>
            </v-card-title>

            <v-card-text class="pa-2">
              <div class="order-list">
                <v-card
                  v-for="order in getOrdersByStatus(status.value)"
                  :key="order.id"
                  class="order-card mb-2"
                  :class="{ 'urgent': isUrgentOrder(order) }"
                >
                  <v-card-text>
                    <div class="d-flex justify-space-between align-center">
                      <strong>#{{ order.orderNumber }}</strong>
                      <v-chip
                        size="x-small"
                        :color="isUrgentOrder(order) ? 'error' : 'grey'"
                      >
                        {{ formatWaitTime(order.createdAt) }}
                      </v-chip>
                    </div>
                    
                    <div class="mt-2">
                      <div v-for="item in order.items" :key="item.id" class="order-item">
                        {{ item.quantity }}x {{ item.name }}
                        <div class="text-caption">
                          {{ item.specialInstructions || 'No special instructions' }}
                        </div>
                      </div>
                    </div>

                    <v-divider class="my-2"></v-divider>

                    <div class="d-flex justify-space-between align-center">
                      <div class="text-caption">
                        {{ formatTime(order.createdAt) }}
                      </div>
                      <div>
                        <v-btn
                          v-if="status.value === 'pending'"
                          color="success"
                          size="small"
                          variant="text"
                          @click="acceptOrder(order)"
                        >
                          Accept
                        </v-btn>
                        <v-btn
                          v-if="status.value === 'pending'"
                          color="error"
                          size="small"
                          variant="text"
                          @click="rejectOrder(order)"
                        >
                          Reject
                        </v-btn>
                        <v-btn
                          v-if="status.value === 'preparing'"
                          color="primary"
                          size="small"
                          variant="text"
                          @click="completePreparation(order)"
                        >
                          Ready
                        </v-btn>
                        <v-btn
                          v-if="['preparing', 'ready'].includes(status.value)"
                          icon="mdi-clock"
                          size="small"
                          variant="text"
                          @click="updateEstimatedTime(order)"
                        ></v-btn>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- List View -->
    <v-card v-else>
      <v-data-table
        :headers="tableHeaders"
        :items="filteredOrders"
        :loading="loading"
        :sort-by="[{ key: 'createdAt', order: 'desc' }]"
      >
        <template v-slot:item.orderNumber="{ item }">
          #{{ item.raw.orderNumber }}
        </template>

        <template v-slot:item.items="{ item }">
          <div class="text-truncate" style="max-width: 300px;">
            {{ formatOrderItems(item.raw.items) }}
          </div>
        </template>

        <template v-slot:item.createdAt="{ item }">
          <div>{{ formatTime(item.raw.createdAt) }}</div>
          <div class="text-caption">{{ formatWaitTime(item.raw.createdAt) }}</div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.raw.status)"
            size="small"
          >
            {{ item.raw.status }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex gap-2">
            <v-btn
              v-if="item.raw.status === 'pending'"
              color="success"
              size="small"
              @click="acceptOrder(item.raw)"
            >
              Accept
            </v-btn>
            <v-btn
              v-if="item.raw.status === 'pending'"
              color="error"
              size="small"
              @click="rejectOrder(item.raw)"
            >
              Reject
            </v-btn>
            <v-btn
              v-if="item.raw.status === 'preparing'"
              color="primary"
              size="small"
              @click="completePreparation(item.raw)"
            >
              Ready
            </v-btn>
            <v-btn
              icon="mdi-eye"
              size="small"
              variant="text"
              @click="viewOrderDetails(item.raw)"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Order Details Dialog -->
    <v-dialog v-model="orderDialog.show" max-width="600">
      <v-card v-if="orderDialog.order">
        <v-card-title class="d-flex align-center">
          Order #{{ orderDialog.order.orderNumber }}
          <v-spacer></v-spacer>
          <v-chip :color="getStatusColor(orderDialog.order.status)">
            {{ orderDialog.order.status }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 mb-2">Customer Information</h3>
              <div>{{ orderDialog.order.customer.name }}</div>
              <div>{{ orderDialog.order.customer.phone }}</div>
              <div class="text-caption">{{ orderDialog.order.customer.email }}</div>
            </v-col>

            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 mb-2">Delivery Information</h3>
              <div>{{ orderDialog.order.deliveryAddress.street }}</div>
              <div>
                {{ orderDialog.order.deliveryAddress.city }},
                {{ orderDialog.order.deliveryAddress.state }}
                {{ orderDialog.order.deliveryAddress.zipCode }}
              </div>
              <div class="text-caption">
                Instructions: {{ orderDialog.order.deliveryInstructions || 'None' }}
              </div>
            </v-col>

            <v-col cols="12">
              <h3 class="text-subtitle-1 mb-2">Order Items</h3>
              <v-list density="compact">
                <v-list-item
                  v-for="item in orderDialog.order.items"
                  :key="item.id"
                >
                  <v-list-item-title>
                    {{ item.quantity }}x {{ item.name }}
                    <span class="float-right">${{ (item.price * item.quantity).toFixed(2) }}</span>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="item.specialInstructions">
                    Note: {{ item.specialInstructions }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-divider></v-divider>

                <v-list-item>
                  <v-list-item-title class="d-flex justify-space-between">
                    <strong>Subtotal</strong>
                    <span>${{ orderDialog.order.subtotal.toFixed(2) }}</span>
                  </v-list-item-title>
                </v-list-item>

                <v-list-item v-if="orderDialog.order.tax">
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>Tax</span>
                    <span>${{ orderDialog.order.tax.toFixed(2) }}</span>
                  </v-list-item-title>
                </v-list-item>

                <v-list-item v-if="orderDialog.order.deliveryFee">
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>Delivery Fee</span>
                    <span>${{ orderDialog.order.deliveryFee.toFixed(2) }}</span>
                  </v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <v-list-item-title class="d-flex justify-space-between">
                    <strong>Total</strong>
                    <strong>${{ orderDialog.order.total.toFixed(2) }}</strong>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="orderDialog.show = false"
          >
            Close
          </v-btn>
          <v-btn
            v-if="orderDialog.order.status === 'pending'"
            color="success"
            @click="acceptOrder(orderDialog.order)"
          >
            Accept Order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Estimated Time Dialog -->
    <v-dialog v-model="estimatedTimeDialog.show" max-width="400">
      <v-card>
        <v-card-title>Update Estimated Time</v-card-title>
        <v-card-text>
          <v-slider
            v-model="estimatedTimeDialog.minutes"
            :min="5"
            :max="60"
            :step="5"
            thumb-label
            label="Minutes"
          ></v-slider>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="estimatedTimeDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="updateEstimatedTimeConfirm"
            :loading="estimatedTimeDialog.loading"
          >
            Update
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'
import { formatDistanceToNow, format } from 'date-fns'

const store = useStore()
const toast = useToast()

// State
const loading = ref(false)
const viewMode = ref('kanban')
const timeFilter = ref('today')

const orderDialog = ref({
  show: false,
  order: null
})

const estimatedTimeDialog = ref({
  show: false,
  order: null,
  minutes: 30,
  loading: false
})

// Order statuses configuration
const orderStatuses = [
  {
    title: 'New Orders',
    value: 'pending',
    color: 'warning',
    icon: 'mdi-bell'
  },
  {
    title: 'Preparing',
    value: 'preparing',
    color: 'info',
    icon: 'mdi-food'
  },
  {
    title: 'Ready',
    value: 'ready',
    color: 'success',
    icon: 'mdi-check-circle'
  }
]

// Table headers for list view
const tableHeaders = [
  { title: 'Order #', key: 'orderNumber', sortable: true },
  { title: 'Time', key: 'createdAt', sortable: true },
  { title: 'Items', key: 'items' },
  { title: 'Customer', key: 'customer.name', sortable: true },
  { title: 'Total', key: 'total', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Computed
const orders = computed(() => store.state.restaurantAdmin.orders)

const filteredOrders = computed(() => {
  let filtered = [...orders.value]
  
  // Apply time filter
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)

  switch (timeFilter.value) {
    case 'today':
      filtered = filtered.filter(order => new Date(order.createdAt) >= today)
      break
    case 'yesterday':
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt)
        return orderDate >= yesterday && orderDate < today
      })
      break
    case 'week':
      filtered = filtered.filter(order => new Date(order.createdAt) >= lastWeek)
      break
  }

  return filtered
})

// Methods
const getOrdersByStatus = (status) => {
  return filteredOrders.value.filter(order => order.status === status)
}

const formatOrderItems = (items) => {
  return items.map(item => `${item.quantity}x ${item.name}`).join(', ')
}

const formatTime = (timestamp) => {
  return format(new Date(timestamp), 'HH:mm')
}

const formatWaitTime = (timestamp) => {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

const getStatusColor = (status) => {
  const statusConfig = orderStatuses.find(s => s.value === status)
  return statusConfig ? statusConfig.color : 'grey'
}

const isUrgentOrder = (order) => {
  const waitTime = Date.now() - new Date(order.createdAt).getTime()
  const waitMinutes = Math.floor(waitTime / 60000)
  return (order.status === 'pending' && waitMinutes > 5) || 
         (order.status === 'preparing' && waitMinutes > 20)
}

const viewOrderDetails = (order) => {
  orderDialog.value.order = order
  orderDialog.value.show = true
}

const acceptOrder = async (order) => {
  try {
    await store.dispatch('restaurantAdmin/updateOrderStatus', {
      orderId: order.id,
      status: 'preparing'
    })
    toast.success('Order accepted successfully')
    if (orderDialog.value.show) {
      orderDialog.value.show = false
    }
  } catch (error) {
    toast.error('Failed to accept order')
  }
}

const rejectOrder = async (order) => {
  try {
    await store.dispatch('restaurantAdmin/updateOrderStatus', {
      orderId: order.id,
      status: 'cancelled',
      reason: 'Restaurant cannot fulfill order'
    })
    toast.success('Order rejected')
  } catch (error) {
    toast.error('Failed to reject order')
  }
}

const completePreparation = async (order) => {
  try {
    await store.dispatch('restaurantAdmin/updateOrderStatus', {
      orderId: order.id,
      status: 'ready'
    })
    toast.success('Order marked as ready')
  } catch (error) {
    toast.error('Failed to update order status')
  }
}

const updateEstimatedTime = (order) => {
  estimatedTimeDialog.value.order = order
  estimatedTimeDialog.value.minutes = order.estimatedTime || 30
  estimatedTimeDialog.value.show = true
}

const updateEstimatedTimeConfirm = async () => {
  if (!estimatedTimeDialog.value.order) return

  estimatedTimeDialog.value.loading = true
  try {
    await store.dispatch('restaurantAdmin/updateOrderEstimatedTime', {
      orderId: estimatedTimeDialog.value.order.id,
      estimatedTime: estimatedTimeDialog.value.minutes
    })
    toast.success('Estimated time updated')
    estimatedTimeDialog.value.show = false
  } catch (error) {
    toast.error('Failed to update estimated time')
  } finally {
    estimatedTimeDialog.value.loading = false
  }
}
</script>

<style scoped>
.max-width-200 {
  max-width: 200px;
}

.kanban-view {
  overflow-x: auto;
}

.status-column {
  height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
}

.order-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.order-card {
  border-left: 4px solid transparent;
}

.order-card.urgent {
  border-left-color: var(--v-error-base);
}

.order-item {
  margin-bottom: 4px;
}

.order-item:last-child {
  margin-bottom: 0;
}
</style>