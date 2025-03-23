<template>
  <v-container>
    <h1 class="text-h4 mb-6">Theo Dõi Đơn Hàng</h1>
    
    <v-row v-if="loading">
      <v-col cols="12" class="d-flex justify-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </v-col>
    </v-row>
    
    <template v-else-if="order">
      <v-row>
        <v-col cols="12" md="8">
          <!-- Bản đồ trực tiếp và Trạng thái Tài xế -->
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
                
                <!-- Trạng thái kết nối -->
                <div v-if="!isConnected" class="connection-status">
                  <v-alert
                    type="warning"
                    variant="tonal"
                    density="compact"
                  >
                    Đang kết nối lại dịch vụ theo dõi...
                  </v-alert>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Thông tin Tài xế (khi có tài xế được giao) -->
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
                    <span class="text-caption ml-2">{{ order.driver.rating }} ({{ order.driver.deliveries }}+ giao hàng)</span>
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
                  Gọi Tài xế
                </v-btn>
                <v-btn
                  color="primary"
                  variant="outlined"
                  block
                  prepend-icon="mdi-message"
                  @click="messageDriver"
                >
                  Nhắn tin
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Tiến trình đơn hàng -->
          <v-card>
            <v-card-title class="d-flex align-center">
              Trạng Thái Đơn Hàng
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
          <!-- Chi tiết đơn hàng -->
          <v-card class="mb-6">
            <v-card-title>Đơn hàng #{{ order.orderNumber }}</v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Ngày đặt:</span>
                <span>{{ formatDate(order.createdAt) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Thời gian giao hàng dự kiến (ETA):</span>
                <span>{{ formatETA(order.estimatedDeliveryTime) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Phương thức thanh toán:</span>
                <span>{{ getPaymentMethodText(order.paymentMethod) }}</span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="text-subtitle-2">Tổng tiền:</span>
                <span class="text-h6 font-weight-bold">{{ formatCurrency(order.total) }}</span>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Thông tin nhà hàng -->
          <v-card class="mb-6">
            <v-card-title>Nhà Hàng</v-card-title>
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
                Gọi Nhà Hàng
              </v-btn>
            </v-card-text>
          </v-card>
          
          <!-- Thông tin tài xế -->
          <v-card v-if="order.driver && order.status === 'out_for_delivery'">
            <v-card-title>Tài Xế Của Bạn</v-card-title>
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
                Gọi Tài Xế
              </v-btn>
              <v-btn
                color="success"
                block
                @click="messageDriver"
              >
                <v-icon start>mdi-message</v-icon>
                Nhắn Tin Tài Xế
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
    
    <!-- Thông báo khi không tìm thấy đơn hàng -->
    <v-row v-else>
      <v-col cols="12" class="text-center">
        <v-alert
          type="warning"
          variant="tonal"
          class="mb-4"
        >
          Không tìm thấy thông tin đơn hàng
        </v-alert>
        <v-btn
          color="primary"
          to="/user/orders"
        >
          Quay Lại Danh Sách Đơn Hàng
        </v-btn>
      </v-col>
    </v-row>
  </v-container>

  <!-- Hộp thoại chat -->
  <v-dialog v-model="showChatDialog" max-width="400">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Nhắn tin với Tài xế</span>
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
          placeholder="Nhập tin nhắn của bạn..."
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
          Gửi
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  
  <!-- Thông báo trạng thái -->
  <v-snackbar
    v-model="showNotification"
    :color="notificationColor"
    timeout="3000"
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
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import { useSocket } from '@/composables/useSocket'
import LiveMap from '@/components/LiveMap.vue'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

const store = useStore()
const route = useRoute()
const router = useRouter()
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
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationColor = ref('success')

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
    title: 'Đã Đặt Hàng',
    description: 'Nhà hàng đang xem xét đơn hàng của bạn',
    icon: 'mdi-receipt',
    timestamp: order.value?.createdAt
  },
  {
    status: 'confirmed',
    title: 'Đã Xác Nhận',
    description: 'Nhà hàng đã chấp nhận đơn hàng của bạn',
    icon: 'mdi-check-circle',
    timestamp: order.value?.confirmedAt
  },
  {
    status: 'preparing',
    title: 'Đang Chuẩn Bị',
    description: 'Món ăn của bạn đang được chuẩn bị',
    icon: 'mdi-food',
    timestamp: order.value?.preparingAt
  },
  {
    status: 'ready_for_pickup',
    title: 'Sẵn Sàng Giao',
    description: 'Đơn hàng đã sẵn sàng để tài xế lấy',
    icon: 'mdi-package-variant-closed',
    timestamp: order.value?.readyAt
  },
  {
    status: 'out_for_delivery',
    title: 'Đang Giao Hàng',
    description: order.value?.driver ? `${order.value.driver.name} đang trên đường giao hàng` : 'Tài xế đang trên đường giao hàng',
    icon: 'mdi-bike',
    timestamp: order.value?.pickedUpAt
  },
  {
    status: 'delivered',
    title: 'Đã Giao Hàng',
    description: 'Chúc ngon miệng!',
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
    
    // Set up polling for order status and driver location updates
    if (!['delivered', 'cancelled'].includes(order.value.status)) {
      startPolling()
    }
  } catch (error) {
    console.error('Lỗi khi tải thông tin đơn hàng:', error)
    showErrorNotification('Không thể tải thông tin đơn hàng')
  } finally {
    loading.value = false
  }
}

// Thiết lập chức năng cập nhật định kỳ
const pollingInterval = ref(null)
const startPolling = () => {
  // Clear any existing polling
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
  
  // Poll every 30 seconds
  pollingInterval.value = setInterval(async () => {
    if (!order.value || ['delivered', 'cancelled'].includes(order.value.status)) {
      clearInterval(pollingInterval.value)
      return
    }
    
    try {
      // Update order status
      await updateOrderStatus()
      
      // Update driver location if applicable
      if (order.value.status === 'out_for_delivery' && order.value.driverId) {
        await updateDriverLocation()
      }
    } catch (error) {
      console.error('Lỗi khi cập nhật đơn hàng:', error)
    }
  }, 30000) // 30 seconds
}

const updateOrderStatus = async () => {
  try {
    const updatedOrder = await store.dispatch('orders/fetchOrderUpdates', route.params.id)
    
    if (updatedOrder && updatedOrder.status !== order.value.status) {
      // Status has changed
      showStatusChangeNotification(updatedOrder.status)
      order.value = updatedOrder
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error)
  }
}

const updateDriverLocation = async () => {
  try {
    const driverInfo = await store.dispatch('tracking/getDriverLocation', order.value.driverId)
    
    if (driverInfo && driverInfo.location) {
      // Update driver location in order object
      if (!order.value.driver) {
        order.value.driver = { location: {} }
      }
      
      order.value.driver.location = {
        lat: driverInfo.location.latitude,
        lng: driverInfo.location.longitude
      }
      
      // Regenerate route points
      generateRoutePoints()
      
      // Update ETA if available
      if (driverInfo.eta) {
        order.value.estimatedDeliveryTime = driverInfo.eta
      }
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật vị trí tài xế:', error)
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

const getStatusText = (status) => {
  const statusMap = {
    'pending': 'Chờ Xác Nhận',
    'confirmed': 'Đã Xác Nhận',
    'preparing': 'Đang Chuẩn Bị',
    'ready_for_pickup': 'Sẵn Sàng Giao',
    'out_for_delivery': 'Đang Giao Hàng',
    'delivered': 'Đã Giao Hàng',
    'cancelled': 'Đã Hủy'
  }
  
  return statusMap[status] || status
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
  return new Date(timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const formatDate = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString('vi-VN', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatETA = (minutes) => {
  if (!minutes) return 'Đang tính toán...'
  
  // Nếu minutes là chuỗi ISO datetime
  if (typeof minutes === 'string' && minutes.includes('T')) {
    const etaDate = new Date(minutes)
    const now = new Date()
    const diffMinutes = Math.round((etaDate - now) / (1000 * 60))
    
    if (diffMinutes <= 0) {
      return 'Sắp giao đến'
    }
    
    return `${diffMinutes} phút`
  }
  
  // Nếu minutes là số phút
  return `${minutes} phút`
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { 
    style: 'currency', 
    currency: 'VND' 
  }).format(amount)
}

const getPaymentMethodText = (method) => {
  const methodMap = {
    'cash': 'Tiền mặt',
    'credit_card': 'Thẻ tín dụng',
    'momo': 'MoMo',
    'zalopay': 'ZaloPay',
    'vnpay': 'VNPay'
  }
  
  return methodMap[method] || method
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
    
    // Add message to local chat
    chatMessages.value.push({
      id: Date.now(),
      sender: 'user',
      text: newMessage.value.trim(),
      timestamp: new Date().toISOString()
    })
    
    newMessage.value = ''
    scrollToLatestMessage()
  } catch (error) {
    console.error('Lỗi khi gửi tin nhắn:', error)
    showErrorNotification('Không thể gửi tin nhắn')
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

const showStatusChangeNotification = (status) => {
  const statusMessageMap = {
    'confirmed': 'Đơn hàng của bạn đã được xác nhận!',
    'preparing': 'Nhà hàng đang chuẩn bị món ăn của bạn',
    'ready_for_pickup': 'Đơn hàng đã sẵn sàng để giao',
    'out_for_delivery': 'Tài xế đang trên đường giao hàng',
    'delivered': 'Đơn hàng đã được giao thành công!'
  }
  
  notificationMessage.value = statusMessageMap[status] || `Trạng thái đơn hàng đã cập nhật: ${getStatusText(status)}`
  notificationColor.value = getStatusColor(status)
  showNotification.value = true
  
  // Hiển thị cả browser notification nếu được hỗ trợ
  if ('Notification' in window) {
    if (Notification.permission === 'granted') {
      new Notification('Cập nhật trạng thái đơn hàng', {
        body: notificationMessage.value,
        icon: '/img/icons/android-chrome-192x192.png'
      })
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification('Cập nhật trạng thái đơn hàng', {
            body: notificationMessage.value,
            icon: '/img/icons/android-chrome-192x192.png'
          })
        }
      })
    }
  }
}

const showErrorNotification = (message) => {
  notificationMessage.value = message
  notificationColor.value = 'error'
  showNotification.value = true
}

const onMapReady = (map) => {
  // Store map instance
  mapInstance.value = map
}

// Socket event handlers
const setupSocketEvents = () => {
  if (!socket.value) return
  
  socket.value.on('orderUpdate', (data) => {
    if (data.orderId === order.value?.id) {
      // Check if status has changed
      if (data.status && data.status !== order.value.status) {
        showStatusChangeNotification(data.status)
      }
      
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
  
  socket.value.on('eta_updated', (data) => {
    if (data.orderId === order.value?.id) {
      order.value.estimatedDeliveryTime = data.estimatedDeliveryTime
      
      showNotification.value = true
      notificationMessage.value = 'Thời gian giao hàng dự kiến đã được cập nhật'
      notificationColor.value = 'info'
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
  
  // Request notification permission
  if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  if (isConnected.value) {
    disconnect()
  }
  
  if (pollingInterval.value) {
    clearInterval(pollingInterval.value)
  }
})

// Watch for status changes
watch(() => order.value?.status, (newStatus, oldStatus) => {
  if (newStatus && isTrackableStatus(newStatus) && !isConnected.value) {
    connect()
    setupSocketEvents()
  }
  
  // Stop polling when order is delivered or cancelled
  if (newStatus && ['delivered', 'cancelled'].includes(newStatus) && pollingInterval.value) {
    clearInterval(pollingInterval.value)
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