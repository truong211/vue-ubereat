<template>
  <div class="order-tracking-page">
    <v-container class="tracker-container">
      <v-card class="tracking-card">
        <v-toolbar color="primary" flat>
          <v-toolbar-title class="white--text">
            Theo dõi đơn hàng #{{ orderNumberFormatted }}
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="refreshData" :loading="isLoading">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </v-toolbar>

        <!-- Order Status Timeline -->
        <v-card-text>
          <div class="mt-4 mb-4">
            <h3 class="text-h6 mb-3">Trạng thái đơn hàng</h3>
            <v-timeline side="end" align="start" truncate-line="both">
              <v-timeline-item 
                v-for="(status, index) in orderStatusTimeline" 
                :key="index"
                :dot-color="getStatusColor(status.completed, status.current)"
                :size="status.current ? 'large' : 'small'"
                :icon="status.icon"
              >
                <div class="d-flex align-center mb-1 mt-n2">
                  <strong :class="{'primary--text': status.current }">{{ status.label }}</strong>
                  <v-spacer></v-spacer>
                  <span class="text-caption text-grey">{{ formatTime(status.time) }}</span>
                </div>
                <div v-if="status.message" class="text-body-2 mt-1">
                  {{ status.message }}
                </div>
              </v-timeline-item>
            </v-timeline>
          </div>

          <!-- Delivery ETA -->
          <v-card class="mb-4 delivery-eta-card" v-if="order && order.status !== 'delivered' && order.status !== 'cancelled'">
            <v-card-text class="d-flex align-center">
              <v-icon class="mr-2" color="primary">mdi-clock-outline</v-icon>
              <div>
                <div class="text-subtitle-2">Thời gian giao hàng ước tính</div>
                <div class="text-h6 mt-1">{{ formatETA(order.estimatedDeliveryTime) }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-chip v-if="etaCountdown" color="primary" text-color="white">
                {{ etaCountdown }}
              </v-chip>
            </v-card-text>
          </v-card>

          <!-- Live Map with Driver Location -->
          <div class="map-wrapper mb-4">
            <h3 class="text-h6 mb-2">Vị trí tài xế</h3>
            <div class="live-map">
              <LiveMap
                v-if="mapDataReady"
                :driver-location="driverLocation"
                :delivery-address="deliveryAddress"
                :restaurant-location="restaurantLocation"
                :route-points="routePoints"
                :eta="order?.estimatedDeliveryTime"
                @map-ready="onMapReady"
              />
              <div v-else class="map-loading-placeholder d-flex align-center justify-center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <span class="ml-2">Đang tải bản đồ...</span>
              </div>
            </div>
            
            <!-- Driver Info Card -->
            <v-card v-if="order && order.driver" class="mt-3 driver-info-card">
              <v-card-text class="d-flex align-center">
                <v-avatar size="50" class="mr-3">
                  <v-img :src="order.driver.avatar || '/img/avatar-placeholder.png'" alt="Driver"></v-img>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ order.driver.name }}</div>
                  <div class="text-body-2">{{ order.driver.vehicleInfo }}</div>
                </div>
                <v-spacer></v-spacer>
                <v-btn icon color="primary" @click="callDriver">
                  <v-icon>mdi-phone</v-icon>
                </v-btn>
                <v-btn icon color="primary" class="ml-2" @click="openChat">
                  <v-icon>mdi-chat</v-icon>
                </v-btn>
              </v-card-text>
            </v-card>
          </div>

          <!-- Order details summary -->
          <div class="order-summary">
            <h3 class="text-h6 mb-2">Chi tiết đơn hàng</h3>
            <v-card>
              <v-list>
                <v-list-item v-for="(item, i) in order?.items" :key="i">
                  <v-list-item-title>
                    {{ item.quantity }}x {{ item.name }}
                    <span v-if="item.options && item.options.length" class="text-body-2 text-grey">
                      ({{ item.options.map(o => o.value).join(', ') }})
                    </span>
                  </v-list-item-title>
                  <v-list-item-action>
                    {{ formatPrice(item.price * item.quantity) }}
                  </v-list-item-action>
                </v-list-item>
                
                <v-divider></v-divider>
                
                <v-list-item>
                  <v-list-item-title>Tổng cộng món</v-list-item-title>
                  <v-list-item-action>{{ formatPrice(order?.subtotal) }}</v-list-item-action>
                </v-list-item>
                
                <v-list-item v-if="order?.deliveryFee">
                  <v-list-item-title>Phí giao hàng</v-list-item-title>
                  <v-list-item-action>{{ formatPrice(order?.deliveryFee) }}</v-list-item-action>
                </v-list-item>
                
                <v-list-item v-if="order?.discount">
                  <v-list-item-title>Giảm giá</v-list-item-title>
                  <v-list-item-action class="success--text">-{{ formatPrice(order?.discount) }}</v-list-item-action>
                </v-list-item>
                
                <v-list-item class="font-weight-bold">
                  <v-list-item-title>Tổng thanh toán</v-list-item-title>
                  <v-list-item-action>{{ formatPrice(order?.total) }}</v-list-item-action>
                </v-list-item>
              </v-list>
            </v-card>
          </div>
        </v-card-text>
      </v-card>
    </v-container>

    <!-- Chat Dialog -->
    <v-dialog v-model="showChatDialog" max-width="400">
      <v-card>
        <v-toolbar color="primary" dark>
          <v-toolbar-title>
            Chat với tài xế
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="showChatDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>
        <v-card-text class="chat-container" ref="chatContainer">
          <div v-for="(message, i) in chatMessages" :key="i" 
               :class="['message-bubble', message.fromDriver ? 'from-driver' : 'from-me']">
            <div class="message-content">{{ message.text }}</div>
            <div class="message-time">{{ formatTime(message.time) }}</div>
          </div>
        </v-card-text>
        <v-card-actions class="chat-input">
          <v-text-field
            v-model="chatMessage"
            placeholder="Nhập tin nhắn..."
            append-inner-icon="mdi-send"
            variant="outlined"
            hide-details
            @click:append-inner="sendMessage"
            @keyup.enter="sendMessage"
          ></v-text-field>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Notification Toast -->
    <v-snackbar
      v-model="showNotification"
      :color="notificationColor"
      :timeout="5000"
      location="top"
    >
      {{ notificationMessage }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="showNotification = false"
        >
          Đóng
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrdersStore } from '@/store/modules/orders'
import { useNotificationStore } from '@/store/notification'
import { formatCurrency } from '@/utils/format'
import LiveMap from '@/components/LiveMap.vue'
import io from 'socket.io-client'

// Router
const route = useRoute()
const router = useRouter()

// Stores
const orderStore = useOrdersStore()
const notificationStore = useNotificationStore()

// Data
const order = ref(null)
const isLoading = ref(false)
const socket = ref(null)
const driverLocation = ref(null)
const restaurantLocation = ref(null)
const deliveryAddress = ref(null)
const routePoints = ref([])
const etaInterval = ref(null)
const etaCountdown = ref(null)
const mapDataReady = ref(false)
const chatMessages = ref([])
const chatMessage = ref('')
const showChatDialog = ref(false)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationColor = ref('primary')

// Computed
const orderId = computed(() => route.params.id)

const orderNumberFormatted = computed(() => {
  return order.value?.orderNumber.toString().padStart(6, '0') || ''
})

const orderStatusTimeline = computed(() => {
  if (!order.value) return []
  
  const statusSteps = [
    {
      status: 'pending',
      label: 'Đã đặt hàng',
      icon: 'mdi-cart-check',
      completed: false,
      current: false,
      time: order.value.createdAt,
      message: 'Đơn hàng đã được nhà hàng ghi nhận'
    },
    {
      status: 'confirmed',
      label: 'Đã xác nhận',
      icon: 'mdi-check-circle',
      completed: false,
      current: false,
      time: order.value.confirmedAt,
      message: 'Nhà hàng đang chuẩn bị món ăn'
    },
    {
      status: 'preparing',
      label: 'Đang chuẩn bị',
      icon: 'mdi-food',
      completed: false,
      current: false,
      time: order.value.preparingAt,
      message: 'Nhà hàng đang chuẩn bị món ăn'
    },
    {
      status: 'ready',
      label: 'Sẵn sàng giao hàng',
      icon: 'mdi-package-variant-closed',
      completed: false,
      current: false,
      time: order.value.readyAt,
      message: 'Đơn hàng đã sẵn sàng để giao'
    },
    {
      status: 'pickup',
      label: 'Tài xế đã lấy hàng',
      icon: 'mdi-bike',
      completed: false,
      current: false,
      time: order.value.pickedUpAt,
      message: 'Tài xế đang trên đường đến'
    },
    {
      status: 'delivering',
      label: 'Đang giao hàng',
      icon: 'mdi-truck-delivery',
      completed: false,
      current: false,
      time: order.value.deliveringAt,
      message: 'Đơn hàng đang được giao đến bạn'
    },
    {
      status: 'delivered',
      label: 'Đã giao hàng',
      icon: 'mdi-check-decagram',
      completed: false,
      current: false,
      time: order.value.deliveredAt,
      message: 'Đơn hàng đã được giao thành công'
    }
  ]
  
  // If cancelled, replace the timeline with a single cancelled status
  if (order.value.status === 'cancelled') {
    return [
      {
        status: 'cancelled',
        label: 'Đã hủy',
        icon: 'mdi-cancel',
        completed: true,
        current: false,
        time: order.value.cancelledAt,
        message: order.value.cancellationReason || 'Đơn hàng đã bị hủy'
      }
    ]
  }
  
  // Update the completion and current status for each step
  const currentStatusIndex = statusSteps.findIndex(step => step.status === order.value.status)
  
  return statusSteps.map((step, index) => {
    return {
      ...step,
      completed: index < currentStatusIndex || order.value.status === step.status,
      current: order.value.status === step.status
    }
  })
})

// Methods
const fetchOrder = async () => {
  isLoading.value = true
  try {
    const response = await orderStore.getOrder(orderId.value)
    order.value = response
    
    // Set up map data
    if (order.value) {
      deliveryAddress.value = {
        lat: order.value.deliveryAddress.latitude,
        lng: order.value.deliveryAddress.longitude,
        address: order.value.deliveryAddress.formattedAddress
      }
      
      restaurantLocation.value = {
        lat: order.value.restaurant.latitude,
        lng: order.value.restaurant.longitude,
        name: order.value.restaurant.name
      }
      
      // If driver is assigned, set initial driver location (will be updated by socket)
      if (order.value.driver && order.value.driver.lastLocation) {
        driverLocation.value = {
          lat: order.value.driver.lastLocation.latitude,
          lng: order.value.driver.lastLocation.longitude
        }
      }
      
      mapDataReady.value = true
      
      // Start countdown timer for ETA
      startEtaCountdown()
    }
  } catch (error) {
    showErrorNotification('Không thể tải thông tin đơn hàng')
    console.error('Error fetching order:', error)
  } finally {
    isLoading.value = false
  }
}

const onMapReady = (mapInstance) => {
  // We can store the map instance if needed for future manipulation
  console.log('Map is ready')
}

const refreshData = () => {
  fetchOrder()
}

const startEtaCountdown = () => {
  // Clear any existing interval
  if (etaInterval.value) {
    clearInterval(etaInterval.value)
  }
  
  // Only start countdown if we have an ETA and order is not delivered yet
  if (order.value && order.value.estimatedDeliveryTime && 
      order.value.status !== 'delivered' && order.value.status !== 'cancelled') {
    
    const updateCountdown = () => {
      const now = new Date()
      const eta = new Date(order.value.estimatedDeliveryTime)
      const diff = eta - now
      
      if (diff <= 0) {
        etaCountdown.value = 'Sắp đến'
        return
      }
      
      const minutes = Math.floor(diff / 60000)
      const seconds = Math.floor((diff % 60000) / 1000)
      
      etaCountdown.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
    }
    
    // Update immediately and then every second
    updateCountdown()
    etaInterval.value = setInterval(updateCountdown, 1000)
  } else {
    etaCountdown.value = null
  }
}

const callDriver = () => {
  if (order.value && order.value.driver && order.value.driver.phone) {
    window.location.href = `tel:${order.value.driver.phone}`
  } else {
    showErrorNotification('Không có thông tin liên lạc với tài xế')
  }
}

const openChat = () => {
  showChatDialog.value = true
  // Scroll to bottom of chat
  setTimeout(() => {
    if (this.$refs.chatContainer) {
      this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight
    }
  }, 100)
}

const sendMessage = () => {
  if (!chatMessage.value.trim()) return
  
  const message = {
    orderId: orderId.value,
    text: chatMessage.value,
    fromDriver: false,
    time: new Date()
  }
  
  // Add to local chat messages
  chatMessages.value.push(message)
  
  // Send via socket
  if (socket.value) {
    socket.value.emit('send-message', message)
  }
  
  // Clear input
  chatMessage.value = ''
  
  // Scroll to bottom
  setTimeout(() => {
    if (this.$refs.chatContainer) {
      this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight
    }
  }, 100)
}

const connectToSocket = () => {
  // Connect to socket.io server
  const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
  socket.value = io(socketUrl, {
    query: {
      orderId: orderId.value
    }
  })
  
  // Socket event listeners
  socket.value.on('connect', () => {
    console.log('Connected to socket server')
  })
  
  socket.value.on('order-status-update', (data) => {
    if (data.orderId === orderId.value) {
      // Update order status locally
      order.value = {
        ...order.value,
        status: data.status,
        [data.status + 'At']: new Date()
      }
      
      // Show notification
      showNotification.value = true
      notificationColor.value = 'primary'
      notificationMessage.value = data.message || `Đơn hàng của bạn đã được cập nhật thành "${getStatusLabel(data.status)}"`
      
      // Refresh data from server to get all updated fields
      fetchOrder()
    }
  })
  
  socket.value.on('driver-location-update', (data) => {
    if (data.orderId === orderId.value) {
      driverLocation.value = {
        lat: data.latitude,
        lng: data.longitude
      }
      
      // If we have route points, update them
      if (data.routePoints) {
        routePoints.value = data.routePoints.map(point => ({
          lat: point.latitude,
          lng: point.longitude
        }))
      }
      
      // Update ETA if provided
      if (data.estimatedDeliveryTime) {
        order.value = {
          ...order.value,
          estimatedDeliveryTime: data.estimatedDeliveryTime
        }
        
        startEtaCountdown()
      }
    }
  })
  
  socket.value.on('chat-message', (data) => {
    if (data.orderId === orderId.value) {
      chatMessages.value.push({
        text: data.text,
        fromDriver: data.fromDriver,
        time: new Date(data.time)
      })
      
      // If chat dialog is not open, show notification
      if (!showChatDialog.value) {
        showNotification.value = true
        notificationColor.value = 'info'
        notificationMessage.value = `Tin nhắn mới từ tài xế: ${data.text}`
      }
      
      // Scroll to bottom if chat is open
      if (showChatDialog.value) {
        setTimeout(() => {
          if (this.$refs.chatContainer) {
            this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight
          }
        }, 100)
      }
    }
  })
  
  socket.value.on('disconnect', () => {
    console.log('Disconnected from socket server')
  })
  
  socket.value.on('error', (error) => {
    console.error('Socket error:', error)
  })
}

const getStatusColor = (completed, current) => {
  if (current) return 'primary'
  return completed ? 'success' : 'grey'
}

const getStatusLabel = (status) => {
  const statusMap = {
    'pending': 'Đã đặt hàng',
    'confirmed': 'Đã xác nhận',
    'preparing': 'Đang chuẩn bị',
    'ready': 'Sẵn sàng giao hàng',
    'pickup': 'Tài xế đã lấy hàng',
    'delivering': 'Đang giao hàng',
    'delivered': 'Đã giao hàng',
    'cancelled': 'Đã hủy'
  }
  
  return statusMap[status] || status
}

const formatTime = (time) => {
  if (!time) return ''
  
  const date = new Date(time)
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatETA = (time) => {
  if (!time) return 'Không có thông tin'
  
  const date = new Date(time)
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatPrice = (price) => {
  return formatCurrency(price || 0)
}

const showErrorNotification = (message) => {
  notificationMessage.value = message
  notificationColor.value = 'error'
  showNotification.value = true
}

// Register for push notifications
const registerForNotifications = async () => {
  try {
    // Request notification permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        // Register with notification service
        await notificationStore.registerForOrderNotifications(orderId.value)
      }
    }
  } catch (error) {
    console.error('Error registering for notifications:', error)
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchOrder()
  connectToSocket()
  registerForNotifications()
  
  // Listen for notifications
  window.addEventListener('notification', (event) => {
    if (event.detail && event.detail.orderId === orderId.value) {
      showNotification.value = true
      notificationColor.value = event.detail.type || 'primary'
      notificationMessage.value = event.detail.message
      
      // Refresh data if it's an order status update
      if (event.detail.refreshData) {
        fetchOrder()
      }
    }
  })
})

onUnmounted(() => {
  // Clean up
  if (socket.value) {
    socket.value.disconnect()
  }
  
  if (etaInterval.value) {
    clearInterval(etaInterval.value)
  }
  
  // Unregister from notifications
  if (orderId.value) {
    notificationStore.unregisterFromOrderNotifications(orderId.value)
      .catch(error => console.error('Error unregistering from notifications:', error))
  }
})

// Watch for route changes to update the order ID
watch(() => route.params.id, (newId) => {
  if (newId && newId !== orderId.value) {
    fetchOrder()
    
    // Reconnect socket with new order ID
    if (socket.value) {
      socket.value.disconnect()
    }
    
    connectToSocket()
  }
})
</script>

<style scoped>
.tracker-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 16px;
}

.tracking-card {
  border-radius: 12px;
  overflow: hidden;
}

.live-map {
  height: 300px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.map-loading-placeholder {
  height: 100%;
  background-color: #f5f5f5;
  color: #757575;
}

.delivery-eta-card {
  border-left: 4px solid var(--v-primary-base);
}

.driver-info-card {
  border-radius: 8px;
}

.chat-container {
  height: 300px;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message-bubble {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 18px;
  margin-bottom: 8px;
  position: relative;
}

.message-bubble.from-driver {
  align-self: flex-start;
  background-color: #f5f5f5;
  border-bottom-left-radius: 4px;
}

.message-bubble.from-me {
  align-self: flex-end;
  background-color: var(--v-primary-lighten3);
  border-bottom-right-radius: 4px;
}

.message-content {
  word-break: break-word;
}

.message-time {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.6);
  margin-top: 4px;
  text-align: right;
}

.chat-input {
  padding: 8px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

@media (max-width: 600px) {
  .tracker-container {
    padding: 8px;
  }
  
  .live-map {
    height: 250px;
  }
}
</style>
