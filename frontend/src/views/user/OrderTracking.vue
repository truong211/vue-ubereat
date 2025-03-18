<template>
  <v-container>
    <h1 class="text-h4 mb-6">Track Your Order</h1>
    
    <v-row v-if="loading">
      <v-col cols="12" class="d-flex justify-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </v-col>
    </v-row>
    
    <template v-else-if="order">
      <v-row>
        <v-col cols="12" md="8">
          <!-- Live Map and Driver Status -->
          <v-card class="mb-6">
            <v-card-text class="pa-0">
              <div class="map-container" style="height: 400px; position: relative;">
                <live-map
                  :delivery-address="deliveryAddress"
                  :restaurant-location="restaurantLocation"
                  :driver-location="driverLocation"
                  :route-points="routePoints"
                  :eta="order.estimatedDeliveryTime"
                  @map-ready="onMapReady"
                ></live-map>
                
                <!-- Connection Status Overlay -->
                <div v-if="!isConnected" class="connection-status">
                  <v-alert
                    type="warning"
                    variant="tonal"
                    density="compact"
                  >
                    Reconnecting to tracking service...
                  </v-alert>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Driver Info Card (when driver is assigned) -->
          <v-card v-if="order.driver && ['ready_for_pickup', 'out_for_delivery'].includes(order.status)" class="mb-6">
            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-avatar size="48" class="mr-4">
                  <v-img v-if="order.driver.avatar" :src="order.driver.avatar"></v-img>
                  <v-icon v-else>mdi-account</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-h6">{{ order.driver.name }}</div>
                  <div class="d-flex align-center">
                    <v-rating
                      :model-value="order.driver.rating"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="small"
                    ></v-rating>
                    <span class="text-caption ml-2">{{ order.driver.rating }} ({{ order.driver.deliveries }}+ deliveries)</span>
                  </div>
                </div>
                <v-chip color="primary" v-if="order.estimatedDeliveryTime">
                  <v-icon start>mdi-clock-outline</v-icon>
                  {{ formatETA(order.estimatedDeliveryTime) }}
                </v-chip>
              </div>
              
              <div class="d-flex gap-2">
                <v-btn
                  color="primary"
                  variant="outlined"
                  block
                  prepend-icon="mdi-phone"
                  :href="'tel:' + order.driver.phone"
                >
                  Call Driver
                </v-btn>
                <v-btn
                  color="primary"
                  variant="outlined"
                  block
                  prepend-icon="mdi-message"
                  @click="messageDriver"
                >
                  Message
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Order Timeline -->
          <v-card>
            <v-card-title class="d-flex align-center">
              Order Status
              <v-chip
                :color="getStatusColor(order.status)"
                class="ml-auto"
              >
                {{ getStatusText(order.status) }}
              </v-chip>
            </v-card-title>
            <v-card-text>
              <v-timeline align="start">
                <v-timeline-item
                  v-for="step in orderSteps"
                  :key="step.status"
                  :dot-color="getStepColor(step.status)"
                  :icon="step.icon"
                  size="small"
                  :fill-dot="isStepCompleted(step.status, order.status)"
                >
                  <div class="d-flex align-center justify-space-between">
                    <div>
                      <div :class="{'font-weight-bold': isCurrentStep(step.status)}">
                        {{ step.title }}
                      </div>
                      <div class="text-caption">{{ step.description }}</div>
                    </div>
                    <div v-if="step.timestamp" class="text-caption">
                      {{ formatTime(step.timestamp) }}
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <!-- Order Details -->
          <v-card class="mb-6">
            <v-card-title>Order #{{ order.orderNumber }}</v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Order Date:</span>
                <span>{{ formatDate(order.createdAt) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Estimated Delivery:</span>
                <span>{{ formatETA(order.estimatedDeliveryTime) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Payment Method:</span>
                <span>{{ order.paymentMethod }}</span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="text-subtitle-2">Total:</span>
                <span class="text-h6 font-weight-bold">${{ order.total.toFixed(2) }}</span>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Restaurant Info Card -->
          <v-card class="mb-6">
            <v-card-title>Restaurant</v-card-title>
            <v-card-text>
              <div class="mb-4">
                <div class="text-h6">{{ order.restaurant.name }}</div>
                <div class="text-body-2">{{ order.restaurant.address }}</div>
                <div class="text-body-2">{{ order.restaurant.phone }}</div>
              </div>
              <v-btn
                color="primary"
                variant="outlined"
                block
                :href="`tel:${order.restaurant.phone}`"
              >
                <v-icon start>mdi-phone</v-icon>
                Call Restaurant
              </v-btn>
            </v-card-text>
          </v-card>
          
          <!-- Driver Info Card -->
          <v-card v-if="order.driver">
            <v-card-title>Your Driver</v-card-title>
            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-avatar size="50" color="grey-lighten-3" class="mr-4">
                  <v-img v-if="order.driver.avatarUrl" :src="order.driver.avatarUrl" alt="Driver"></v-img>
                  <v-icon v-else size="40">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h6">{{ order.driver.name }}</div>
                  <div class="d-flex align-center">
                    <v-icon size="small" color="amber-darken-2">mdi-star</v-icon>
                    <span class="ml-1">{{ order.driver.rating }} ({{ order.driver.totalRatings }})</span>
                  </div>
                </div>
              </div>
              <v-btn
                color="primary"
                variant="outlined"
                block
                class="mb-3"
                :href="`tel:${order.driver.phone}`"
              >
                <v-icon start>mdi-phone</v-icon>
                Call Driver
              </v-btn>
              <v-btn
                color="success"
                block
                @click="messageDriver"
              >
                <v-icon start>mdi-message</v-icon>
                Message Driver
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>

  <!-- Chat Dialog -->
  <v-dialog v-model="showChatDialog" max-width="400">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Message Driver</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="showChatDialog = false"></v-btn>
      </v-card-title>
      <v-card-text>
        <div class="chat-messages" ref="chatContainer">
          <div
            v-for="message in chatMessages"
            :key="message.id"
            :class="['message', message.sender === 'user' ? 'message-outgoing' : 'message-incoming']"
          >
            {{ message.text }}
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        <v-textarea
          v-model="newMessage"
          rows="3"
          placeholder="Type your message..."
          hide-details
          @keyup.enter="sendMessage"
        ></v-textarea>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          :loading="sendingMessage"
          :disabled="!newMessage.trim()"
          @click="sendMessage"
        >
          Send
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { useSocket } from '@/composables/useSocket'
import LiveMap from '@/components/LiveMap.vue'
import { formatDistanceToNow } from 'date-fns'

const store = useStore()
const route = useRoute()
const { socket, isConnected, connect, disconnect } = useSocket()

// State
const loading = ref(true)
const order = ref(null)
const routePoints = ref([])
const showChatDialog = ref(false)
const chatMessages = ref([])
const newMessage = ref('')
const sendingMessage = ref(false)
const chatContainer = ref(null)

// Computed
const deliveryAddress = computed(() => {
  if (!order.value?.deliveryAddress) return null
  return {
    lat: order.value.deliveryAddress.lat,
    lng: order.value.deliveryAddress.lng,
    address: order.value.deliveryAddress.address
  }
})

const restaurantLocation = computed(() => {
  if (!order.value?.restaurant?.location) return null
  return {
    lat: order.value.restaurant.location.lat,
    lng: order.value.restaurant.location.lng,
    name: order.value.restaurant.name
  }
})

const driverLocation = computed(() => {
  if (!order.value?.driver?.location) return null
  return {
    lat: order.value.driver.location.lat,
    lng: order.value.driver.location.lng
  }
})

const orderSteps = computed(() => [
  {
    status: 'pending',
    title: 'Order Placed',
    description: 'Restaurant is reviewing your order',
    icon: 'mdi-receipt',
    timestamp: order.value?.createdAt
  },
  {
    status: 'confirmed',
    title: 'Order Confirmed',
    description: 'Restaurant has accepted your order',
    icon: 'mdi-check-circle',
    timestamp: order.value?.confirmedAt
  },
  {
    status: 'preparing',
    title: 'Preparing',
    description: 'Your food is being prepared',
    icon: 'mdi-food',
    timestamp: order.value?.preparingAt
  },
  {
    status: 'ready_for_pickup',
    title: 'Ready for Pickup',
    description: 'Order is ready for driver pickup',
    icon: 'mdi-package-variant-closed',
    timestamp: order.value?.readyAt
  },
  {
    status: 'out_for_delivery',
    title: 'Out for Delivery',
    description: order.value?.driver ? `${order.value.driver.name} is on the way` : 'Driver is on the way',
    icon: 'mdi-bike',
    timestamp: order.value?.pickedUpAt
  },
  {
    status: 'delivered',
    title: 'Delivered',
    description: 'Enjoy your meal!',
    icon: 'mdi-check-circle',
    timestamp: order.value?.deliveredAt
  }
])

// Methods
const fetchOrderDetails = async () => {
  loading.value = true
  try {
    const response = await store.dispatch('orders/fetchOrderDetails', route.params.id)
    order.value = response
    
    if (isTrackableStatus(order.value.status)) {
      await store.dispatch('tracking/startTracking', route.params.id)
    }
    
    if (order.value.driver?.location) {
      generateRoutePoints()
    }
  } catch (error) {
    console.error('Error fetching order:', error)
  } finally {
    loading.value = false
  }
}

const generateRoutePoints = () => {
  if (!order.value?.driver?.location || !order.value?.deliveryAddress) return
  
  // This is a simplified version - in production, use actual route data from a mapping service
  const start = [order.value.driver.location.lat, order.value.driver.location.lng]
  const end = [order.value.deliveryAddress.lat, order.value.deliveryAddress.lng]
  const points = []
  
  // Generate points along a straight line
  for (let i = 0; i <= 10; i++) {
    const factor = i / 10
    points.push({
      lat: start[0] + (end[0] - start[0]) * factor,
      lng: start[1] + (end[1] - start[1]) * factor
    })
  }
  
  routePoints.value = points
}

const isTrackableStatus = (status) => {
  return ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(status)
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    confirmed: 'info',
    preparing: 'info',
    ready_for_pickup: 'info',
    out_for_delivery: 'primary',
    delivered: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'grey'
}

const getStepColor = (stepStatus) => {
  if (order.value?.status === 'cancelled') return 'grey'
  return isStepCompleted(stepStatus) ? 'primary' : 'grey'
}

const isStepCompleted = (stepStatus) => {
  const statusOrder = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered']
  const currentIndex = statusOrder.indexOf(order.value?.status)
  const stepIndex = statusOrder.indexOf(stepStatus)
  return stepIndex <= currentIndex
}

const isCurrentStep = (stepStatus) => {
  return stepStatus === order.value?.status
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatETA = (minutes) => {
  return `${minutes} min${minutes === 1 ? '' : 's'}`
}

const messageDriver = () => {
  if (!order.value?.driver) return
  showChatDialog.value = true
  scrollToLatestMessage()
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || sendingMessage.value) return
  
  sendingMessage.value = true
  try {
    await store.dispatch('chat/sendMessage', {
      orderId: order.value.id,
      message: newMessage.value.trim()
    })
    
    newMessage.value = ''
    scrollToLatestMessage()
  } catch (error) {
    console.error('Error sending message:', error)
  } finally {
    sendingMessage.value = false
  }
}

const scrollToLatestMessage = () => {
  setTimeout(() => {
    if (chatContainer.value) {
      chatContainer.value.scrollTop = chatContainer.value.scrollHeight
    }
  }, 100)
}

// Socket event handlers
const setupSocketEvents = () => {
  if (!socket.value) return
  
  socket.value.on('orderUpdate', (data) => {
    if (data.orderId === order.value?.id) {
      order.value = { ...order.value, ...data }
    }
  })
  
  socket.value.on('driverLocation', (data) => {
    if (data.orderId === order.value?.id && order.value?.driver) {
      order.value.driver.location = data.location
      generateRoutePoints()
    }
  })
  
  socket.value.on('chat', (message) => {
    if (message.orderId === order.value?.id) {
      chatMessages.value.push(message)
      if (showChatDialog.value) {
        scrollToLatestMessage()
      }
    }
  })
}

// Lifecycle
onMounted(async () => {
  await fetchOrderDetails()
  if (isTrackableStatus(order.value?.status)) {
    await connect()
    setupSocketEvents()
  }
})

onUnmounted(() => {
  if (isConnected.value) {
    disconnect()
  }
})

// Watch for status changes
watch(() => order.value?.status, (newStatus, oldStatus) => {
  if (newStatus && isTrackableStatus(newStatus) && !isConnected.value) {
    connect()
    setupSocketEvents()
  }
})
</script>

<style scoped>
.map-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.connection-status {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 1000;
}

.chat-messages {
  height: 300px;
  overflow-y: auto;
  padding: 16px;
  background: #f5f5f5;
  border-radius: 8px;
  margin-bottom: 16px;
}

.message {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  margin-bottom: 8px;
}

.message-outgoing {
  background: var(--v-primary-base);
  color: white;
  margin-left: auto;
}

.message-incoming {
  background: white;
  margin-right: auto;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 4px;
}
</style>