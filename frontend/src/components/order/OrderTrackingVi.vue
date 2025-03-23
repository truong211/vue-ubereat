<template>
  <v-container>
    <!-- Order Status Card -->
    <v-card class="mb-4">
      <v-card-title class="text-h6">Trạng thái đơn hàng #{{ order?.orderNumber }}</v-card-title>
      <v-card-text>
        <v-timeline density="compact">
          <v-timeline-item
            v-for="step in orderSteps"
            :key="step.status"
            :dot-color="getStepColor(step)"
            :icon="step.icon"
          >
            <template v-slot:opposite>
              {{ formatTime(step.timestamp) }}
            </template>
            <div class="text-subtitle-1 font-weight-bold mb-1">
              {{ step.title }}
            </div>
            <div class="text-body-2">{{ step.description }}</div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>

    <!-- ETA Card -->
    <v-card v-if="showETA" class="mb-4">
      <v-card-text>
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-clock-outline</v-icon>
          <div>
            <div class="text-subtitle-1">Thời gian giao hàng dự kiến</div>
            <div class="text-h6 mt-1">{{ formatETA(order?.estimatedDeliveryTime) }}</div>
          </div>
          <v-spacer></v-spacer>
          <v-chip v-if="etaCountdown" color="primary" text-color="white">
            {{ etaCountdown }}
          </v-chip>
        </div>
      </v-card-text>
    </v-card>

    <!-- Live Map -->
    <v-card v-if="showMap" class="mb-4">
      <v-card-title class="text-h6">
        <v-icon left color="primary">mdi-map-marker</v-icon>
        Vị trí tài xế
      </v-card-title>
      <v-card-text>
        <div class="map-container" style="height: 400px">
          <div v-if="mapDataReady" ref="mapContainer" style="height: 100%"></div>
          <v-skeleton-loader v-else type="image" height="400"></v-skeleton-loader>
        </div>
      </v-card-text>
    </v-card>

    <!-- Driver Info -->
    <v-card v-if="order?.driver" class="mb-4">
      <v-card-title class="text-h6">
        <v-icon left color="primary">mdi-account</v-icon>
        Thông tin tài xế
      </v-card-title>
      <v-card-text>
        <div class="d-flex align-center">
          <v-avatar size="48" color="grey lighten-2">
            <v-img v-if="order.driver.profileImage" :src="order.driver.profileImage"></v-img>
            <v-icon v-else>mdi-account</v-icon>
          </v-avatar>
          <div class="ml-4">
            <div class="text-h6">{{ order.driver.fullName }}</div>
            <div class="text-subtitle-1">{{ order.driver.phone }}</div>
          </div>
          <v-spacer></v-spacer>
          <v-btn icon @click="callDriver">
            <v-icon>mdi-phone</v-icon>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- Status Notifications -->
    <v-snackbar
      v-model="showNotification"
      :color="notificationColor"
      timeout="5000"
      multi-line
    >
      {{ notificationMessage }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="showNotification = false">
          Đóng
        </v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const store = useStore()
const route = useRoute()

// State
const order = ref(null)
const loading = ref(false)
const socket = ref(null)
const mapInstance = ref(null)
const mapDataReady = ref(false)
const driverMarker = ref(null)
const routeLayer = ref(null)
const etaInterval = ref(null)
const etaCountdown = ref(null)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationColor = ref('success')

// Computed
const showETA = computed(() => {
  return ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.value?.status)
})

const showMap = computed(() => {
  return order.value?.status === 'out_for_delivery' && order.value?.driver
})

const orderSteps = computed(() => [
  {
    status: 'pending',
    title: 'Đã đặt hàng',
    description: 'Đơn hàng của bạn đang chờ nhà hàng xác nhận',
    icon: 'mdi-receipt',
    timestamp: order.value?.createdAt
  },
  {
    status: 'confirmed',
    title: 'Đã xác nhận',
    description: 'Nhà hàng đã xác nhận đơn hàng của bạn',
    icon: 'mdi-check-circle',
    timestamp: order.value?.confirmedAt
  },
  {
    status: 'preparing',
    title: 'Đang chuẩn bị',
    description: 'Nhà hàng đang chuẩn bị món ăn của bạn',
    icon: 'mdi-food',
    timestamp: order.value?.preparingAt
  },
  {
    status: 'ready',
    title: 'Sẵn sàng giao',
    description: 'Đơn hàng đã sẵn sàng để giao',
    icon: 'mdi-package-variant-closed',
    timestamp: order.value?.readyAt
  },
  {
    status: 'out_for_delivery',
    title: 'Đang giao hàng',
    description: order.value?.driver ? `${order.value.driver.fullName} đang trên đường giao hàng` : 'Tài xế đang trên đường giao hàng',
    icon: 'mdi-bike',
    timestamp: order.value?.pickedUpAt
  },
  {
    status: 'delivered',
    title: 'Đã giao hàng',
    description: 'Chúc ngon miệng!',
    icon: 'mdi-check-circle',
    timestamp: order.value?.deliveredAt
  }
])

// Methods
const fetchOrder = async () => {
  loading.value = true
  try {
    const response = await store.dispatch('orders/getOrderDetails', route.params.id)
    order.value = response
    
    if (isTrackableStatus(order.value.status)) {
      await store.dispatch('tracking/startTracking', route.params.id)
    }
    
    if (order.value.driver?.location) {
      initializeMap()
    }
    
    startEtaCountdown()
  } catch (error) {
    console.error('Error fetching order:', error)
    showErrorNotification('Không thể tải thông tin đơn hàng')
  } finally {
    loading.value = false
  }
}

const initializeMap = () => {
  if (!mapInstance.value && order.value?.driver?.location) {
    mapInstance.value = L.map(mapContainer.value).setView(
      [order.value.driver.location.lat, order.value.driver.location.lng],
      13
    )
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.value)
    
    // Add driver marker
    driverMarker.value = L.marker(
      [order.value.driver.location.lat, order.value.driver.location.lng],
      {
        icon: L.divIcon({
          className: 'driver-marker',
          html: '<i class="mdi mdi-bike"></i>',
          iconSize: [30, 30]
        })
      }
    ).addTo(mapInstance.value)
    
    mapDataReady.value = true
  }
}

const updateDriverLocation = (location) => {
  if (mapInstance.value && driverMarker.value) {
    driverMarker.value.setLatLng([location.lat, location.lng])
    mapInstance.value.panTo([location.lat, location.lng])
    
    if (order.value?.deliveryAddress) {
      updateRoute(location)
    }
  }
}

const updateRoute = async (driverLocation) => {
  if (!order.value?.deliveryAddress) return
  
  const deliveryLocation = {
    lat: order.value.deliveryAddress.latitude,
    lng: order.value.deliveryAddress.longitude
  }
  
  // Clear existing route
  if (routeLayer.value) {
    mapInstance.value.removeLayer(routeLayer.value)
  }
  
  // Draw direct line (in real app, use routing service)
  routeLayer.value = L.polyline(
    [
      [driverLocation.lat, driverLocation.lng],
      [deliveryLocation.lat, deliveryLocation.lng]
    ],
    { color: 'blue' }
  ).addTo(mapInstance.value)
}

const startEtaCountdown = () => {
  if (etaInterval.value) {
    clearInterval(etaInterval.value)
  }
  
  if (!order.value?.estimatedDeliveryTime) return
  
  const updateCountdown = () => {
    const now = new Date()
    const eta = new Date(order.value.estimatedDeliveryTime)
    const diff = eta - now
    
    if (diff <= 0) {
      clearInterval(etaInterval.value)
      etaCountdown.value = null
      return
    }
    
    const minutes = Math.floor(diff / 60000)
    etaCountdown.value = `${minutes} phút`
  }
  
  updateCountdown()
  etaInterval.value = setInterval(updateCountdown, 60000)
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatETA = (timestamp) => {
  if (!timestamp) return 'Đang tính toán...'
  return new Date(timestamp).toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getStepColor = (step) => {
  if (!order.value) return 'grey'
  
  const currentStepIndex = orderSteps.value.findIndex(s => s.status === order.value.status)
  const stepIndex = orderSteps.value.findIndex(s => s.status === step.status)
  
  if (stepIndex < currentStepIndex) return 'success'
  if (stepIndex === currentStepIndex) return 'primary'
  return 'grey'
}

const isTrackableStatus = (status) => {
  return ['confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(status)
}

const showErrorNotification = (message) => {
  notificationMessage.value = message
  notificationColor.value = 'error'
  showNotification.value = true
}

const callDriver = () => {
  if (order.value?.driver?.phone) {
    window.location.href = `tel:${order.value.driver.phone}`
  }
}

// Socket events
const setupSocketEvents = () => {
  if (!socket.value) return
  
  socket.value.on('order_status_updated', (data) => {
    if (data.orderId === order.value?.id) {
      const statusMessages = {
        'confirmed': 'Nhà hàng đã xác nhận đơn hàng của bạn',
        'preparing': 'Nhà hàng đang chuẩn bị món ăn của bạn',
        'ready': 'Đơn hàng đã sẵn sàng để giao',
        'out_for_delivery': 'Tài xế đang trên đường giao hàng',
        'delivered': 'Đơn hàng đã được giao thành công'
      }
      
      notificationMessage.value = statusMessages[data.status] || `Trạng thái đơn hàng đã cập nhật: ${data.status}`
      notificationColor.value = data.status === 'delivered' ? 'success' : 'info'
      showNotification.value = true
      
      // Update order data
      fetchOrder()
    }
  })
  
  socket.value.on('driver_location_updated', (data) => {
    if (data.orderId === order.value?.id && data.location) {
      updateDriverLocation(data.location)
    }
  })
  
  socket.value.on('eta_updated', (data) => {
    if (data.orderId === order.value?.id) {
      order.value.estimatedDeliveryTime = data.estimatedDeliveryTime
      startEtaCountdown()
      
      notificationMessage.value = 'Thời gian giao hàng dự kiến đã được cập nhật'
      notificationColor.value = 'info'
      showNotification.value = true
    }
  })
}

// Lifecycle hooks
onMounted(async () => {
  await fetchOrder()
  
  if (isTrackableStatus(order.value?.status)) {
    await store.dispatch('socket/connect')
    socket.value = store.state.socket.instance
    setupSocketEvents()
  }
})

onUnmounted(() => {
  if (etaInterval.value) {
    clearInterval(etaInterval.value)
  }
  
  if (mapInstance.value) {
    mapInstance.value.remove()
  }
  
  if (socket.value) {
    socket.value.disconnect()
  }
})

// Watch for status changes
watch(() => order.value?.status, (newStatus, oldStatus) => {
  if (newStatus && isTrackableStatus(newStatus) && !socket.value) {
    store.dispatch('socket/connect').then(() => {
      socket.value = store.state.socket.instance
      setupSocketEvents()
    })
  }
})
</script>

<style scoped>
.map-container {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.driver-marker {
  background: #1976D2;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
}

.driver-marker i {
  font-size: 18px;
}
</style>