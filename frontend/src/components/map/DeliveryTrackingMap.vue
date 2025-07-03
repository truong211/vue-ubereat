<template>
  <div class="delivery-tracking-map">
    <v-card :height="mapHeight" class="position-relative">
      <!-- Status Header -->
      <v-toolbar v-if="showStatusBar" density="compact" color="primary" class="status-toolbar">
        <v-toolbar-title class="d-flex align-center">
          <v-icon :icon="statusIcon" class="mr-2"></v-icon>
          <span>{{ statusText }}</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-chip
          v-if="eta"
          :color="etaColor"
          variant="elevated"
          size="small"
        >
          <v-icon start icon="mdi-clock-outline"></v-icon>
          {{ formattedEta }}
        </v-chip>
      </v-toolbar>

      <!-- Map Container -->
      <div 
        :id="mapId" 
        class="map-container"
        :style="{ height: showStatusBar ? 'calc(100% - 48px)' : '100%' }"
      ></div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="map-loading-overlay">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <div class="mt-2">{{ loadingText }}</div>
      </div>

      <!-- Delivery Info Card -->
      <v-card
        v-if="orderData && !loading"
        class="delivery-info-card"
        variant="elevated"
        elevation="8"
      >
        <v-card-title class="pb-2">
          <div class="d-flex align-center">
            <v-avatar size="40" class="mr-3">
              <v-img :src="orderData.restaurant?.thumbnail || '/img/restaurant-placeholder.jpg'"></v-img>
            </v-avatar>
            <div>
              <div class="text-subtitle-1 font-weight-bold">{{ orderData.restaurant?.name }}</div>
              <div class="text-caption">Đơn hàng #{{ orderData.orderNumber }}</div>
            </div>
          </div>
        </v-card-title>

        <v-card-text class="pt-0">
          <!-- Progress Steps -->
          <v-timeline density="compact" class="mb-3">
            <v-timeline-item
              v-for="(step, index) in deliverySteps"
              :key="index"
              :dot-color="step.completed ? 'success' : step.active ? 'primary' : 'grey'"
              size="small"
            >
              <div class="d-flex align-center">
                <v-icon 
                  :icon="step.icon" 
                  size="small"
                  :color="step.completed ? 'success' : step.active ? 'primary' : 'grey'"
                  class="mr-2"
                ></v-icon>
                <span 
                  :class="[
                    'text-caption',
                    step.completed ? 'text-success' : step.active ? 'text-primary' : 'text-grey'
                  ]"
                >
                  {{ step.text }}
                </span>
                <v-spacer></v-spacer>
                <span v-if="step.time" class="text-caption text-grey">
                  {{ formatTime(step.time) }}
                </span>
              </div>
            </v-timeline-item>
          </v-timeline>

          <!-- Driver Info -->
          <div v-if="driverInfo" class="driver-info mb-3">
            <v-divider class="mb-2"></v-divider>
            <div class="d-flex align-center">
              <v-avatar size="32" class="mr-2">
                <v-img :src="driverInfo.avatar || '/img/driver-avatar.png'"></v-img>
              </v-avatar>
              <div>
                <div class="text-caption font-weight-bold">{{ driverInfo.name }}</div>
                <div class="text-caption text-grey">
                  <v-icon size="x-small" class="mr-1">mdi-star</v-icon>
                  {{ driverInfo.rating || 'N/A' }}
                </div>
              </div>
              <v-spacer></v-spacer>
              <v-btn
                icon="mdi-phone"
                variant="text"
                size="small"
                color="primary"
                @click="callDriver"
              ></v-btn>
            </div>
          </div>

          <!-- ETA and Distance Info -->
          <div v-if="routeInfo" class="route-summary">
            <v-row dense>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h6 font-weight-bold text-primary">{{ routeInfo.distanceText }}</div>
                  <div class="text-caption text-grey">Khoảng cách</div>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="text-center">
                  <div class="text-h6 font-weight-bold text-success">{{ routeInfo.durationText }}</div>
                  <div class="text-caption text-grey">Thời gian còn lại</div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-card-text>

        <v-card-actions v-if="showActions">
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-directions"
            @click="showFullRoute"
            size="small"
          >
            Xem toàn bộ lộ trình
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            prepend-icon="mdi-phone-hangup"
            @click="reportIssue"
            size="small"
          >
            Báo lỗi
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Connection Status -->
      <v-alert
        v-if="!connected && !loading"
        type="warning"
        variant="tonal"
        class="connection-alert"
        closable
      >
        Mất kết nối real-time. Đang thử kết nối lại...
      </v-alert>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useToast } from 'vue-toastification';
import enhancedTrackingService from '@/services/enhanced-tracking.service';
import mapService from '@/services/map.service';

// Props
const props = defineProps({
  orderId: {
    type: String,
    required: true
  },
  mapHeight: {
    type: String,
    default: '500px'
  },
  showStatusBar: {
    type: Boolean,
    default: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  autoCenter: {
    type: Boolean,
    default: true
  },
  updateInterval: {
    type: Number,
    default: 5000 // 5 seconds
  }
});

// Emits
const emit = defineEmits(['status-changed', 'eta-updated', 'driver-arrived', 'delivery-completed']);

// Composables
const toast = useToast();

// Refs
const map = ref(null);
const markers = ref({
  restaurant: null,
  driver: null,
  customer: null
});
const routePolyline = ref(null);
const driverPath = ref([]);
const loading = ref(true);
const loadingText = ref('Đang tải thông tin giao hàng...');
const connected = ref(false);

// Data
const orderData = ref(null);
const driverInfo = ref(null);
const driverPosition = ref(null);
const routeInfo = ref(null);
const eta = ref(null);
const deliveryMilestones = ref([]);

// Generate unique map ID
const mapId = `delivery-map-${props.orderId}`;

// Computed
const statusIcon = computed(() => {
  if (!orderData.value) return 'mdi-package';
  
  const status = orderData.value.status;
  const icons = {
    'preparing': 'mdi-chef-hat',
    'ready_for_pickup': 'mdi-check-circle',
    'picked_up': 'mdi-truck',
    'on_the_way': 'mdi-map-marker-path',
    'arriving': 'mdi-map-marker-check',
    'delivered': 'mdi-check-all'
  };
  
  return icons[status] || 'mdi-package';
});

const statusText = computed(() => {
  if (!orderData.value) return 'Đang tải...';
  
  const status = orderData.value.status;
  const texts = {
    'preparing': 'Đang chuẩn bị món ăn',
    'ready_for_pickup': 'Sẵn sàng lấy hàng',
    'picked_up': 'Đã lấy hàng',
    'on_the_way': 'Đang giao hàng',
    'arriving': 'Sắp đến nơi',
    'delivered': 'Đã giao hàng'
  };
  
  return texts[status] || 'Đang xử lý';
});

const etaColor = computed(() => {
  if (!eta.value) return 'grey';
  
  const now = new Date();
  const etaTime = new Date(eta.value);
  const diffMinutes = Math.floor((etaTime - now) / (1000 * 60));
  
  if (diffMinutes <= 5) return 'error';
  if (diffMinutes <= 15) return 'warning';
  return 'success';
});

const formattedEta = computed(() => {
  if (!eta.value) return 'Đang tính...';
  
  const now = new Date();
  const etaTime = new Date(eta.value);
  const diffMinutes = Math.floor((etaTime - now) / (1000 * 60));
  
  if (diffMinutes < 0) return 'Đã quá giờ';
  if (diffMinutes === 0) return 'Sắp đến';
  if (diffMinutes < 60) return `${diffMinutes} phút`;
  
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  return `${hours}h ${minutes}m`;
});

const deliverySteps = computed(() => {
  if (!orderData.value) return [];
  
  const status = orderData.value.status;
  const steps = [
    { 
      key: 'preparing', 
      text: 'Chuẩn bị món ăn', 
      icon: 'mdi-chef-hat',
      completed: ['ready_for_pickup', 'picked_up', 'on_the_way', 'arriving', 'delivered'].includes(status),
      active: status === 'preparing'
    },
    { 
      key: 'ready_for_pickup', 
      text: 'Sẵn sàng lấy hàng', 
      icon: 'mdi-check-circle',
      completed: ['picked_up', 'on_the_way', 'arriving', 'delivered'].includes(status),
      active: status === 'ready_for_pickup'
    },
    { 
      key: 'picked_up', 
      text: 'Tài xế đã lấy hàng', 
      icon: 'mdi-package-up',
      completed: ['on_the_way', 'arriving', 'delivered'].includes(status),
      active: status === 'picked_up'
    },
    { 
      key: 'on_the_way', 
      text: 'Đang giao hàng', 
      icon: 'mdi-truck',
      completed: ['arriving', 'delivered'].includes(status),
      active: status === 'on_the_way'
    },
    { 
      key: 'arriving', 
      text: 'Sắp đến nơi', 
      icon: 'mdi-map-marker-check',
      completed: status === 'delivered',
      active: status === 'arriving'
    },
    { 
      key: 'delivered', 
      text: 'Đã giao hàng', 
      icon: 'mdi-check-all',
      completed: status === 'delivered',
      active: false
    }
  ];
  
  // Add timestamps from milestones
  deliveryMilestones.value.forEach(milestone => {
    const step = steps.find(s => s.key === milestone.type);
    if (step) {
      step.time = milestone.timestamp;
    }
  });
  
  return steps;
});

// Methods
const initMap = async () => {
  try {
    loading.value = true;
    loadingText.value = 'Đang tải bản đồ...';

    // Initialize map service
    await mapService.initialize();

    // Create map
    map.value = new google.maps.Map(document.getElementById(mapId), {
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    loading.value = false;
  } catch (error) {
    console.error('Error initializing map:', error);
    toast.error('Không thể tải bản đồ');
    loading.value = false;
  }
};

const startTracking = async () => {
  try {
    loadingText.value = 'Đang kết nối theo dõi...';
    
    // Register callbacks
    enhancedTrackingService.registerCallbacks({
      onConnect: handleConnect,
      onDisconnect: handleDisconnect,
      onTrackingStarted: handleTrackingStarted,
      onDriverLocationUpdate: handleDriverLocationUpdate,
      onOrderStatusChange: handleOrderStatusChange,
      onEtaUpdated: handleEtaUpdated,
      onDeliveryMilestone: handleDeliveryMilestone,
      onDriverArrived: handleDriverArrived,
      onDelivered: handleDelivered
    });

    // Start tracking
    const trackingData = await enhancedTrackingService.startOrderTracking(props.orderId, {
      userId: 'current_user', // Get from auth store
      userType: 'customer'
    });

    orderData.value = trackingData;
    
    if (trackingData.driverId) {
      driverInfo.value = trackingData.driver;
      driverPosition.value = trackingData.driverLocation;
    }

    // Setup map markers
    await setupMapMarkers();
    
    loading.value = false;
  } catch (error) {
    console.error('Error starting tracking:', error);
    toast.error('Không thể bắt đầu theo dõi đơn hàng');
    loading.value = false;
  }
};

const setupMapMarkers = async () => {
  if (!map.value || !orderData.value) return;

  // Restaurant marker
  if (orderData.value.restaurant) {
    markers.value.restaurant = new google.maps.Marker({
      position: {
        lat: orderData.value.restaurant.latitude,
        lng: orderData.value.restaurant.longitude
      },
      map: map.value,
      icon: {
        url: '/img/restaurant-marker.png',
        scaledSize: new google.maps.Size(32, 32)
      },
      title: orderData.value.restaurant.name
    });
  }

  // Customer marker
  if (orderData.value.deliveryAddress) {
    markers.value.customer = new google.maps.Marker({
      position: {
        lat: orderData.value.deliveryAddress.latitude,
        lng: orderData.value.deliveryAddress.longitude
      },
      map: map.value,
      icon: {
        url: '/img/customer-marker.png',
        scaledSize: new google.maps.Size(32, 32)
      },
      title: 'Địa chỉ giao hàng'
    });
  }

  // Driver marker (if available)
  if (driverPosition.value) {
    updateDriverMarker();
  }

  // Calculate and display route
  if (driverPosition.value && orderData.value.deliveryAddress) {
    await updateRoute();
  }

  // Fit bounds to show all markers
  fitMapBounds();
};

const updateDriverMarker = () => {
  if (!map.value || !driverPosition.value) return;

  // Remove existing driver marker
  if (markers.value.driver) {
    markers.value.driver.setMap(null);
  }

  // Create new driver marker with rotation
  const icon = {
    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
    scale: 6,
    fillColor: '#4285F4',
    fillOpacity: 1,
    strokeColor: '#FFFFFF',
    strokeWeight: 2,
    rotation: driverPosition.value.heading || 0
  };

  markers.value.driver = new google.maps.Marker({
    position: {
      lat: driverPosition.value.lat,
      lng: driverPosition.value.lng
    },
    map: map.value,
    icon: icon,
    title: `Tài xế ${driverInfo.value?.name || 'N/A'}`,
    zIndex: 1000
  });

  // Add to driver path
  driverPath.value.push({
    lat: driverPosition.value.lat,
    lng: driverPosition.value.lng,
    timestamp: Date.now()
  });

  // Keep only last 50 positions
  if (driverPath.value.length > 50) {
    driverPath.value = driverPath.value.slice(-50);
  }

  // Auto-center on driver if enabled
  if (props.autoCenter) {
    map.value.setCenter({
      lat: driverPosition.value.lat,
      lng: driverPosition.value.lng
    });
  }
};

const updateRoute = async () => {
  if (!map.value || !driverPosition.value) return;

  try {
    let destination;
    if (orderData.value.status === 'preparing' || orderData.value.status === 'ready_for_pickup') {
      // Route to restaurant
      destination = {
        lat: orderData.value.restaurant.latitude,
        lng: orderData.value.restaurant.longitude
      };
    } else {
      // Route to customer
      destination = {
        lat: orderData.value.deliveryAddress.latitude,
        lng: orderData.value.deliveryAddress.longitude
      };
    }

    const route = await mapService.getRoute(driverPosition.value, destination);
    routeInfo.value = route;

    // Display route on map
    if (routePolyline.value) {
      routePolyline.value.setMap(null);
    }

    routePolyline.value = new google.maps.Polyline({
      path: route.points,
      geodesic: true,
      strokeColor: '#4285F4',
      strokeOpacity: 0.8,
      strokeWeight: 4
    });

    routePolyline.value.setMap(map.value);
  } catch (error) {
    console.error('Error updating route:', error);
  }
};

const fitMapBounds = () => {
  if (!map.value) return;

  const bounds = new google.maps.LatLngBounds();
  
  Object.values(markers.value).forEach(marker => {
    if (marker) bounds.extend(marker.getPosition());
  });

  if (!bounds.isEmpty()) {
    map.value.fitBounds(bounds, 50);
  }
};

// Event Handlers
const handleConnect = () => {
  connected.value = true;
  toast.success('Đã kết nối theo dõi real-time');
};

const handleDisconnect = () => {
  connected.value = false;
  toast.warning('Mất kết nối theo dõi');
};

const handleTrackingStarted = (data) => {
  console.log('Tracking started:', data);
};

const handleDriverLocationUpdate = async (data) => {
  if (data.orderId === props.orderId) {
    driverPosition.value = data.location;
    
    // Update marker with animation
    updateDriverMarker();
    
    // Update route
    await updateRoute();
  }
};

const handleOrderStatusChange = (data) => {
  if (data.orderId === props.orderId) {
    orderData.value.status = data.status;
    emit('status-changed', data);
    
    // Show toast notification
    toast.info(`Trạng thái đơn hàng: ${statusText.value}`);
  }
};

const handleEtaUpdated = (data) => {
  if (data.orderId === props.orderId) {
    eta.value = data.eta;
    routeInfo.value = data.route;
    emit('eta-updated', data);
  }
};

const handleDeliveryMilestone = (data) => {
  if (data.orderId === props.orderId) {
    deliveryMilestones.value.push(data.milestone);
  }
};

const handleDriverArrived = (data) => {
  if (data.orderId === props.orderId) {
    emit('driver-arrived', data);
    
    if (data.arrivalType === 'customer') {
      toast.success('Tài xế đã đến nơi giao hàng!');
    }
  }
};

const handleDelivered = (data) => {
  if (data.orderId === props.orderId) {
    emit('delivery-completed', data);
    toast.success('Đơn hàng đã được giao thành công!');
  }
};

// Actions
const callDriver = () => {
  if (driverInfo.value?.phone) {
    window.open(`tel:${driverInfo.value.phone}`);
  } else {
    toast.warning('Không có thông tin liên hệ tài xế');
  }
};

const showFullRoute = () => {
  fitMapBounds();
};

const reportIssue = () => {
  // Open support dialog
  toast.info('Chức năng báo lỗi đang được phát triển');
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Lifecycle
onMounted(async () => {
  await initMap();
  await startTracking();
});

onUnmounted(() => {
  // Stop tracking and cleanup
  if (props.orderId) {
    enhancedTrackingService.stopOrderTracking(props.orderId);
  }
  
  // Cleanup map markers
  Object.values(markers.value).forEach(marker => {
    if (marker) marker.setMap(null);
  });
  
  if (routePolyline.value) {
    routePolyline.value.setMap(null);
  }
});
</script>

<style scoped>
.delivery-tracking-map {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
}

.status-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
}

.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 20;
}

.delivery-info-card {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  z-index: 10;
  max-width: 400px;
  backdrop-filter: blur(10px);
}

.connection-alert {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 15;
}

.driver-info {
  background: rgba(66, 133, 244, 0.05);
  border-radius: 8px;
  padding: 8px;
}

.route-summary {
  background: rgba(76, 175, 80, 0.05);
  border-radius: 8px;
  padding: 12px;
}

@media (max-width: 600px) {
  .delivery-info-card {
    bottom: 8px;
    left: 8px;
    right: 8px;
  }
}
</style>