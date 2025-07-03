<template>
  <div class="real-time-tracking">
    <v-card class="tracking-container" elevation="2">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between pa-4">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-package-variant</v-icon>
          <div>
            <h3 class="text-h6 mb-0">Theo dõi đơn hàng #{{ order.id }}</h3>
            <span class="text-caption text-medium-emphasis">{{ formatOrderTime(order.createdAt) }}</span>
          </div>
        </div>
        <v-chip 
          :color="getStatusColor(order.status)" 
          :text="getStatusText(order.status)"
          size="small"
        ></v-chip>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Map Section -->
      <div class="map-section" :style="{ height: mapHeight }">
        <div id="tracking-map" ref="mapContainer" class="tracking-map"></div>
        
        <!-- Map Loading -->
        <div v-if="mapLoading" class="map-loading-overlay">
          <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
          <span class="mt-3">Đang tải bản đồ...</span>
        </div>

        <!-- ETA Card -->
        <div v-if="eta && !mapLoading" class="eta-card">
          <v-card variant="outlined" class="pa-3">
            <div class="d-flex align-center justify-space-between">
              <div>
                <div class="text-caption text-medium-emphasis">Dự kiến giao hàng</div>
                <div class="text-h6 text-primary">{{ formatETA(eta) }}</div>
              </div>
              <v-icon size="32" color="primary">mdi-clock-outline</v-icon>
            </div>
            <div v-if="distance" class="text-caption mt-1">
              <v-icon size="small" class="mr-1">mdi-map-marker-distance</v-icon>
              {{ formatDistance(distance) }} từ vị trí hiện tại
            </div>
          </v-card>
        </div>

        <!-- Map Controls -->
        <div class="map-controls">
          <v-btn
            icon
            variant="outlined"
            size="small"
            class="mb-2"
            @click="centerOnDelivery"
            title="Về địa điểm giao hàng"
          >
            <v-icon>mdi-home-map-marker</v-icon>
          </v-btn>
          <v-btn
            v-if="driverLocation"
            icon
            variant="outlined"
            size="small"
            class="mb-2"
            @click="centerOnDriver"
            title="Theo dõi tài xế"
          >
            <v-icon>mdi-motorbike</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="outlined"
            size="small"
            @click="toggleFullscreen"
            :title="isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'"
          >
            <v-icon>{{ isFullscreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen' }}</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Order Progress -->
      <div class="progress-section pa-4">
        <v-timeline density="compact" align="start">
          <v-timeline-item
            v-for="(step, index) in orderSteps"
            :key="index"
            :dot-color="step.completed ? 'success' : step.active ? 'primary' : 'grey-lighten-1'"
            size="small"
          >
            <template v-slot:icon>
              <v-icon size="small" :color="step.completed ? 'white' : undefined">
                {{ step.icon }}
              </v-icon>
            </template>
            <div class="d-flex justify-space-between align-center">
              <div>
                <h4 class="text-subtitle-2" :class="step.completed || step.active ? 'text-primary' : 'text-medium-emphasis'">
                  {{ step.title }}
                </h4>
                <p class="text-caption text-medium-emphasis mb-0">{{ step.description }}</p>
              </div>
              <span v-if="step.time" class="text-caption text-medium-emphasis">
                {{ formatTime(step.time) }}
              </span>
            </div>
          </v-timeline-item>
        </v-timeline>
      </div>

      <!-- Driver Info (when order is being delivered) -->
      <div v-if="order.status === 'out_for_delivery' && driverInfo" class="driver-section pa-4">
        <v-divider class="mb-4"></v-divider>
        <h4 class="text-subtitle-1 mb-3">Thông tin tài xế</h4>
        <div class="d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-avatar size="48" class="mr-3">
              <v-img 
                :src="driverInfo.profileImage || '/img/default-driver.png'" 
                :alt="driverInfo.fullName"
              ></v-img>
            </v-avatar>
            <div>
              <h5 class="text-subtitle-2">{{ driverInfo.fullName }}</h5>
              <div class="d-flex align-center text-caption text-medium-emphasis">
                <v-icon size="small" class="mr-1">mdi-star</v-icon>
                <span>{{ driverInfo.rating || '4.8' }}</span>
                <span class="mx-1">•</span>
                <span>{{ driverInfo.deliveryCount || '150+' }} giao hàng</span>
              </div>
            </div>
          </div>
          <div class="d-flex">
            <v-btn
              icon
              variant="outlined"
              size="small"
              class="mr-2"
              @click="callDriver"
              title="Gọi tài xế"
            >
              <v-icon>mdi-phone</v-icon>
            </v-btn>
            <v-btn
              icon
              variant="outlined"
              size="small"
              @click="openChat"
              title="Nhắn tin"
            >
              <v-icon>mdi-message</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="order-summary pa-4">
        <v-divider class="mb-4"></v-divider>
        <h4 class="text-subtitle-1 mb-3">Chi tiết đơn hàng</h4>
        <div class="d-flex justify-space-between align-center mb-2">
          <span>Nhà hàng:</span>
          <span class="font-weight-medium">{{ order.restaurant?.name }}</span>
        </div>
        <div class="d-flex justify-space-between align-center mb-2">
          <span>Địa chỉ giao hàng:</span>
          <span class="font-weight-medium">{{ order.deliveryAddress }}</span>
        </div>
        <div class="d-flex justify-space-between align-center mb-2">
          <span>Tổng tiền:</span>
          <span class="font-weight-medium text-primary">{{ formatCurrency(order.totalAmount) }}</span>
        </div>
      </div>
    </v-card>

    <!-- Chat Dialog -->
    <v-dialog v-model="showChat" max-width="400" scrollable>
      <DeliveryChat 
        v-if="showChat"
        :order-id="order.id"
        :driver-info="driverInfo"
        @close="showChat = false"
      />
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import mapService from '@/services/mapService';
import { io } from 'socket.io-client';
import DeliveryChat from './DeliveryChat.vue';

// Props
const props = defineProps({
  orderId: {
    type: [String, Number],
    required: true
  },
  mapHeight: {
    type: String,
    default: '400px'
  }
});

// Store and router
const store = useStore();
const router = useRouter();

// Refs
const mapContainer = ref(null);
const map = ref(null);
const markers = ref({});
const directionsRenderer = ref(null);
const socket = ref(null);

// State
const order = ref({});
const driverLocation = ref(null);
const driverInfo = ref(null);
const eta = ref(null);
const distance = ref(null);
const mapLoading = ref(true);
const isFullscreen = ref(false);
const showChat = ref(false);
const locationWatchId = ref(null);

// Computed
const orderSteps = computed(() => [
  {
    title: 'Đã đặt hàng',
    description: 'Đơn hàng của bạn đã được xác nhận',
    icon: 'mdi-check-circle',
    completed: true,
    time: order.value.createdAt
  },
  {
    title: 'Nhà hàng đang chuẩn bị',
    description: 'Đầu bếp đang chuẩn bị món ăn',
    icon: 'mdi-chef-hat',
    completed: ['ready_for_pickup', 'assigned_to_driver', 'out_for_delivery', 'delivered'].includes(order.value.status),
    active: order.value.status === 'preparing',
    time: order.value.status === 'preparing' ? null : order.value.updatedAt
  },
  {
    title: 'Tài xế đã nhận đơn',
    description: 'Tài xế đang đến nhà hàng',
    icon: 'mdi-motorbike',
    completed: ['out_for_delivery', 'delivered'].includes(order.value.status),
    active: ['ready_for_pickup', 'assigned_to_driver'].includes(order.value.status),
    time: order.value.status === 'assigned_to_driver' ? order.value.updatedAt : null
  },
  {
    title: 'Đang giao hàng',
    description: 'Tài xế đang trên đường đến bạn',
    icon: 'mdi-truck-delivery',
    completed: order.value.status === 'delivered',
    active: order.value.status === 'out_for_delivery',
    time: order.value.status === 'out_for_delivery' ? order.value.updatedAt : null
  },
  {
    title: 'Đã giao hàng',
    description: 'Đơn hàng đã được giao thành công',
    icon: 'mdi-check-all',
    completed: order.value.status === 'delivered',
    active: false,
    time: order.value.status === 'delivered' ? order.value.actualDeliveryTime : null
  }
]);

// Methods
const initializeMap = async () => {
  try {
    mapLoading.value = true;
    
    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded');
    }

    // Create map
    const mapOptions = {
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    };

    map.value = new google.maps.Map(mapContainer.value, mapOptions);

    // Initialize directions renderer
    directionsRenderer.value = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#2196F3',
        strokeWeight: 4,
        strokeOpacity: 0.8
      }
    });
    directionsRenderer.value.setMap(map.value);

    // Add markers
    await addMapMarkers();
    
    // Calculate and show route
    if (driverLocation.value && order.value.deliveryAddress) {
      await calculateRoute();
    }

    mapLoading.value = false;
  } catch (error) {
    console.error('Error initializing map:', error);
    mapLoading.value = false;
  }
};

const addMapMarkers = async () => {
  // Add delivery location marker
  if (order.value.deliveryAddress) {
    try {
      const deliveryCoords = await mapService.geocodeAddress(order.value.deliveryAddress);
      if (deliveryCoords) {
        markers.value.delivery = new google.maps.Marker({
          position: deliveryCoords,
          map: map.value,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#4CAF50',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3
          },
          title: 'Địa điểm giao hàng'
        });

        // Center map on delivery location initially
        map.value.setCenter(deliveryCoords);
      }
    } catch (error) {
      console.error('Error geocoding delivery address:', error);
    }
  }

  // Add restaurant marker
  if (order.value.restaurant?.lat && order.value.restaurant?.lng) {
    markers.value.restaurant = new google.maps.Marker({
      position: { 
        lat: order.value.restaurant.lat, 
        lng: order.value.restaurant.lng 
      },
      map: map.value,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#FF5722',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      },
      title: order.value.restaurant.name
    });
  }

  // Add driver marker if available
  updateDriverMarker();
};

const updateDriverMarker = () => {
  if (!driverLocation.value || !map.value) return;

  if (markers.value.driver) {
    // Animate marker movement
    animateMarkerTo(markers.value.driver, driverLocation.value);
  } else {
    // Create new driver marker
    markers.value.driver = new google.maps.Marker({
      position: driverLocation.value,
      map: map.value,
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#2196F3',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        rotation: driverLocation.value.heading || 0
      },
      title: 'Tài xế',
      zIndex: 1000
    });
  }
};

const animateMarkerTo = (marker, newPosition) => {
  const start = marker.getPosition();
  const end = new google.maps.LatLng(newPosition.lat, newPosition.lng);
  
  let step = 0;
  const numSteps = 50;
  const timePerStep = 5;
  
  const animate = () => {
    step++;
    if (step > numSteps) return;
    
    const progress = step / numSteps;
    const lat = start.lat() + (end.lat() - start.lat()) * progress;
    const lng = start.lng() + (end.lng() - start.lng()) * progress;
    
    marker.setPosition(new google.maps.LatLng(lat, lng));
    
    if (step < numSteps) {
      setTimeout(animate, timePerStep);
    }
  };
  
  animate();
};

const calculateRoute = async () => {
  if (!driverLocation.value || !order.value.deliveryAddress || !directionsRenderer.value) return;

  try {
    const deliveryCoords = await mapService.geocodeAddress(order.value.deliveryAddress);
    if (!deliveryCoords) return;

    const directionsService = new google.maps.DirectionsService();
    
    directionsService.route({
      origin: driverLocation.value,
      destination: deliveryCoords,
      travelMode: google.maps.TravelMode.DRIVING
    }, (result, status) => {
      if (status === 'OK') {
        directionsRenderer.value.setDirections(result);
        
        // Update ETA and distance
        const route = result.routes[0];
        if (route && route.legs[0]) {
          distance.value = route.legs[0].distance.value / 1000; // Convert to km
          const durationMinutes = route.legs[0].duration.value / 60; // Convert to minutes
          eta.value = new Date(Date.now() + durationMinutes * 60 * 1000);
        }
      }
    });
  } catch (error) {
    console.error('Error calculating route:', error);
  }
};

const centerOnDelivery = () => {
  if (markers.value.delivery) {
    map.value.setCenter(markers.value.delivery.getPosition());
    map.value.setZoom(16);
  }
};

const centerOnDriver = () => {
  if (markers.value.driver) {
    map.value.setCenter(markers.value.driver.getPosition());
    map.value.setZoom(16);
  }
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  // Implement fullscreen logic
  nextTick(() => {
    if (map.value) {
      google.maps.event.trigger(map.value, 'resize');
    }
  });
};

const callDriver = () => {
  if (driverInfo.value?.phone) {
    window.open(`tel:${driverInfo.value.phone}`);
  }
};

const openChat = () => {
  showChat.value = true;
};

const fetchOrderData = async () => {
  try {
    const orderData = await store.dispatch('orders/getOrderById', props.orderId);
    order.value = orderData;
    
    // Fetch driver info if available
    if (orderData.driverId) {
      driverInfo.value = await store.dispatch('users/getDriverInfo', orderData.driverId);
    }
  } catch (error) {
    console.error('Error fetching order data:', error);
  }
};

const setupRealTimeUpdates = () => {
  // Connect to socket
  socket.value = io(process.env.VUE_APP_API_URL || 'http://localhost:3001');
  
  // Join order room
  socket.value.emit('join_order', { orderId: props.orderId });
  
  // Listen for driver location updates
  socket.value.on('driver_location_updated', (data) => {
    if (data.orderId == props.orderId && data.location) {
      driverLocation.value = {
        lat: data.location.latitude,
        lng: data.location.longitude,
        heading: data.location.heading
      };
      updateDriverMarker();
      calculateRoute();
    }
  });
  
  // Listen for ETA updates
  socket.value.on('eta_updated', (data) => {
    if (data.orderId == props.orderId) {
      eta.value = new Date(data.estimatedDeliveryTime);
    }
  });
  
  // Listen for order status updates
  socket.value.on('order_status_updated', (data) => {
    if (data.orderId == props.orderId) {
      order.value.status = data.status;
      if (data.status === 'delivered') {
        // Order completed
        setTimeout(() => {
          router.push('/orders');
        }, 3000);
      }
    }
  });
};

// Utility functions
const getStatusColor = (status) => {
  const colors = {
    'pending': 'orange',
    'preparing': 'blue',
    'ready_for_pickup': 'purple',
    'assigned_to_driver': 'indigo',
    'out_for_delivery': 'primary',
    'delivered': 'success',
    'cancelled': 'error'
  };
  return colors[status] || 'grey';
};

const getStatusText = (status) => {
  const texts = {
    'pending': 'Chờ xác nhận',
    'preparing': 'Đang chuẩn bị',
    'ready_for_pickup': 'Sẵn sàng lấy',
    'assigned_to_driver': 'Đã giao tài xế',
    'out_for_delivery': 'Đang giao hàng',
    'delivered': 'Đã giao',
    'cancelled': 'Đã hủy'
  };
  return texts[status] || 'Không xác định';
};

const formatOrderTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('vi-VN');
};

const formatETA = (eta) => {
  return new Date(eta).toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatDistance = (distance) => {
  return mapService.formatDistance(distance);
};

const formatTime = (timestamp) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString('vi-VN', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// Lifecycle
onMounted(async () => {
  await fetchOrderData();
  await nextTick();
  await initializeMap();
  setupRealTimeUpdates();
});

onUnmounted(() => {
  // Cleanup
  if (socket.value) {
    socket.value.disconnect();
  }
  if (locationWatchId.value) {
    mapService.stopWatchingLocation(locationWatchId.value);
  }
});

// Watchers
watch(() => order.value.status, (newStatus) => {
  if (newStatus === 'out_for_delivery') {
    // Start real-time tracking
    if (order.value.driverId) {
      // Fetch initial driver location
      mapService.getDriverLocation(order.value.driverId)
        .then(location => {
          if (location) {
            driverLocation.value = {
              lat: location.latitude,
              lng: location.longitude,
              heading: location.heading
            };
            updateDriverMarker();
            calculateRoute();
          }
        })
        .catch(console.error);
    }
  }
});
</script>

<style scoped>
.real-time-tracking {
  max-width: 800px;
  margin: 0 auto;
}

.tracking-container {
  border-radius: 12px;
}

.map-section {
  position: relative;
  width: 100%;
}

.tracking-map {
  width: 100%;
  height: 100%;
  border-radius: 0;
}

.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.eta-card {
  position: absolute;
  top: 16px;
  left: 16px;
  max-width: 200px;
  z-index: 100;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  z-index: 100;
}

.progress-section {
  background: #fafafa;
}

.driver-section {
  background: #f5f5f5;
}
</style>