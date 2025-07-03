<template>
  <div class="delivery-tracking-container">
    <!-- Status Header -->
    <v-card class="mb-4 status-header" :color="getStatusColor()" variant="flat">
      <v-card-text>
        <div class="d-flex align-center">
          <v-icon size="large" class="mr-3">{{ getStatusIcon() }}</v-icon>
          <div>
            <h3 class="text-h6 font-weight-bold">{{ getStatusText() }}</h3>
            <p class="text-body-2 mb-0">{{ getStatusDescription() }}</p>
          </div>
          <v-spacer></v-spacer>
          <div class="text-right">
            <div class="text-h6 font-weight-bold">{{ formattedETA }}</div>
            <div class="text-caption">Estimated arrival</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Map Container -->
    <v-card class="mb-4 map-container">
      <div ref="mapContainer" class="delivery-map" style="height: 400px;"></div>
      
      <!-- Map Controls -->
      <div class="map-controls">
        <v-btn-toggle v-model="mapMode" mandatory>
          <v-btn icon="mdi-map" value="overview" size="small"></v-btn>
          <v-btn icon="mdi-account-circle" value="follow" size="small"></v-btn>
        </v-btn-toggle>
        
        <v-btn
          icon="mdi-refresh"
          size="small"
          @click="refreshDriverLocation"
          :loading="refreshing"
          class="ml-2"
        ></v-btn>
        
        <v-btn
          icon="mdi-fullscreen"
          size="small"
          @click="toggleFullscreen"
          class="ml-2"
        ></v-btn>
      </div>
    </v-card>

    <!-- Progress Timeline -->
    <v-card class="mb-4">
      <v-card-title class="pb-2">Delivery Progress</v-card-title>
      <v-card-text>
        <v-timeline density="compact" side="end">
          <v-timeline-item
            v-for="(step, index) in deliverySteps"
            :key="index"
            :dot-color="getStepColor(step.status)"
            size="small"
          >
            <template v-slot:icon>
              <v-icon size="small">{{ getStepIcon(step.type) }}</v-icon>
            </template>
            
            <div class="d-flex align-center">
              <div class="flex-grow-1">
                <div class="text-subtitle-2">{{ step.title }}</div>
                <div class="text-caption text-grey">{{ step.description }}</div>
              </div>
              <div class="text-caption">
                {{ step.timestamp ? formatTime(step.timestamp) : '' }}
              </div>
            </div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>

    <!-- Driver Info -->
    <v-card v-if="driverInfo" class="mb-4">
      <v-card-text>
        <div class="d-flex align-center">
          <v-avatar size="60" class="mr-4">
            <v-img :src="driverInfo.photo" :alt="driverInfo.name"></v-img>
          </v-avatar>
          <div class="flex-grow-1">
            <h4 class="text-subtitle-1">{{ driverInfo.name }}</h4>
            <div class="d-flex align-center mb-1">
              <v-rating
                :model-value="driverInfo.rating"
                readonly
                density="compact"
                size="small"
                class="mr-2"
              ></v-rating>
              <span class="text-caption">{{ driverInfo.rating }}</span>
            </div>
            <div class="text-caption text-grey">
              {{ driverInfo.deliveries }} deliveries completed
            </div>
          </div>
          <div class="d-flex flex-column ga-2">
            <v-btn
              prepend-icon="mdi-phone"
              variant="outlined"
              size="small"
              @click="callDriver"
            >
              Call
            </v-btn>
            <v-btn
              prepend-icon="mdi-message"
              variant="outlined" 
              size="small"
              @click="messageDriver"
            >
              Message
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Turn-by-Turn Directions (for driver mode) -->
    <v-card v-if="showDirections && directions.length" class="mb-4">
      <v-card-title class="pb-2">
        Turn-by-Turn Directions
        <v-spacer></v-spacer>
        <v-chip size="small" color="primary">
          {{ currentStepIndex + 1 }} / {{ directions.length }}
        </v-chip>
      </v-card-title>
      <v-card-text>
        <div class="current-direction mb-3 pa-3" style="background: #f5f5f5; border-radius: 8px;">
          <div class="d-flex align-center">
            <v-icon class="mr-3" color="primary">{{ getCurrentDirectionIcon() }}</v-icon>
            <div>
              <div class="text-subtitle-2">{{ currentDirection?.instruction }}</div>
              <div class="text-caption text-grey">
                In {{ currentDirection?.distance }} - {{ currentDirection?.duration }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Next few steps -->
        <div v-if="nextDirections.length" class="next-directions">
          <div class="text-caption text-grey mb-2">UPCOMING TURNS</div>
          <div
            v-for="(direction, index) in nextDirections.slice(0, 3)"
            :key="index"
            class="d-flex align-center mb-2"
          >
            <v-icon size="small" class="mr-3" color="grey">{{ getDirectionIcon(direction.maneuver) }}</v-icon>
            <div class="text-caption">{{ direction.instruction }}</div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Order Details -->
    <v-card>
      <v-card-title class="pb-2">Order Details</v-card-title>
      <v-card-text>
        <div class="order-info">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Order #</span>
            <span class="text-body-2 font-weight-bold">{{ orderInfo.id }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Restaurant</span>
            <span class="text-body-2">{{ orderInfo.restaurant?.name }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Total Distance</span>
            <span class="text-body-2">{{ totalDistance }} km</span>
          </div>
          <div class="d-flex justify-space-between">
            <span class="text-body-2">Delivery Fee</span>
            <span class="text-body-2">${{ orderInfo.deliveryFee }}</span>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, defineProps, defineEmits } from 'vue'
import trackingService from '@/services/tracking.service'
import mapService from '@/services/map.service'

const props = defineProps({
  orderId: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    default: 'customer' // 'customer' or 'driver'
  }
})

const emit = defineEmits(['status-updated', 'location-updated'])

// Refs
const mapContainer = ref(null)
const map = ref(null)
const driverMarker = ref(null)
const userMarker = ref(null)
const restaurantMarker = ref(null)
const routePolyline = ref(null)
const directionsRenderer = ref(null)
const refreshing = ref(false)

// Data
const orderInfo = ref({})
const driverInfo = ref(null)
const driverLocation = ref(null)
const userLocation = ref(null)
const restaurantLocation = ref(null)
const orderStatus = ref('pending')
const estimatedArrival = ref(null)
const directions = ref([])
const currentStepIndex = ref(0)
const totalDistance = ref(0)

// UI State
const mapMode = ref('overview') // 'overview' or 'follow'
const showDirections = computed(() => props.userRole === 'driver')
const isFullscreen = ref(false)

// Computed
const formattedETA = computed(() => {
  if (!estimatedArrival.value) return '--:--'
  return new Date(estimatedArrival.value).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
})

const currentDirection = computed(() => {
  return directions.value[currentStepIndex.value]
})

const nextDirections = computed(() => {
  return directions.value.slice(currentStepIndex.value + 1)
})

const deliverySteps = computed(() => {
  const steps = [
    {
      type: 'order',
      title: 'Order Confirmed',
      description: 'Restaurant is preparing your order',
      status: orderStatus.value === 'pending' ? 'current' : 'completed',
      timestamp: orderInfo.value.createdAt
    },
    {
      type: 'preparing',
      title: 'Preparing Food',
      description: 'Your order is being prepared',
      status: orderStatus.value === 'preparing' ? 'current' : 
             ['pending'].includes(orderStatus.value) ? 'pending' : 'completed',
      timestamp: orderInfo.value.preparedAt
    },
    {
      type: 'pickup',
      title: 'Driver Assigned',
      description: 'Driver is on the way to restaurant',
      status: orderStatus.value === 'assigned' ? 'current' : 
             ['pending', 'preparing'].includes(orderStatus.value) ? 'pending' : 'completed',
      timestamp: orderInfo.value.assignedAt
    },
    {
      type: 'transit',
      title: 'On the Way',
      description: 'Driver is coming to your location',
      status: orderStatus.value === 'in_transit' ? 'current' : 
             ['pending', 'preparing', 'assigned'].includes(orderStatus.value) ? 'pending' : 'completed',
      timestamp: orderInfo.value.pickedUpAt
    },
    {
      type: 'delivered',
      title: 'Delivered',
      description: 'Order has been delivered',
      status: orderStatus.value === 'delivered' ? 'completed' : 'pending',
      timestamp: orderInfo.value.deliveredAt
    }
  ]
  
  return steps
})

// Methods
const initializeTracking = async () => {
  try {
    // Start tracking the order
    const trackingData = await trackingService.startTracking(props.orderId)
    
    // Update order information
    orderInfo.value = trackingData.order
    driverInfo.value = trackingData.driver
    userLocation.value = trackingData.deliveryLocation
    restaurantLocation.value = trackingData.restaurant?.location
    orderStatus.value = trackingData.status
    estimatedArrival.value = trackingData.estimatedArrival
    
    // Initialize map
    await initializeMap()
    
    // Register tracking callbacks
    trackingService.registerCallbacks({
      onDriverLocationUpdate: handleDriverLocationUpdate,
      onOrderStatusUpdate: handleOrderStatusUpdate,
      onEtaUpdate: handleEtaUpdate
    })
    
  } catch (error) {
    console.error('Failed to initialize tracking:', error)
  }
}

const initializeMap = async () => {
  if (!mapContainer.value) return

  try {
    await mapService.initialize()
    
    // Create map
    map.value = new google.maps.Map(mapContainer.value, {
      zoom: 13,
      center: userLocation.value || { lat: 21.0285, lng: 105.8542 }, // Default to Hanoi
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }]
        }
      ]
    })

    // Initialize directions renderer
    directionsRenderer.value = new google.maps.DirectionsRenderer({
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#4285F4',
        strokeWeight: 5,
        strokeOpacity: 0.8
      }
    })
    directionsRenderer.value.setMap(map.value)

    // Add markers
    addMapMarkers()
    
    // Calculate and display route
    await calculateRoute()
    
  } catch (error) {
    console.error('Failed to initialize map:', error)
  }
}

const addMapMarkers = () => {
  // Add user location marker
  if (userLocation.value) {
    userMarker.value = new google.maps.Marker({
      position: userLocation.value,
      map: map.value,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#4CAF50',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 10
      },
      title: 'Delivery Location'
    })
  }

  // Add restaurant marker
  if (restaurantLocation.value) {
    restaurantMarker.value = new google.maps.Marker({
      position: restaurantLocation.value,
      map: map.value,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: '#F44336',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 10
      },
      title: 'Restaurant'
    })
  }

  // Add driver marker (will be updated dynamically)
  updateDriverMarker()
}

const updateDriverMarker = () => {
  if (!driverLocation.value) return

  if (!driverMarker.value) {
    driverMarker.value = new google.maps.Marker({
      position: driverLocation.value,
      map: map.value,
      icon: {
        url: '/img/driver-marker.png',
        scaledSize: new google.maps.Size(40, 40)
      },
      title: 'Driver'
    })
  } else {
    // Animate marker movement
    driverMarker.value.setPosition(driverLocation.value)
  }

  // Follow driver if in follow mode
  if (mapMode.value === 'follow') {
    map.value.setCenter(driverLocation.value)
  }
}

const calculateRoute = async () => {
  if (!driverLocation.value || !userLocation.value) return

  try {
    const route = await mapService.getRoute(driverLocation.value, userLocation.value)
    
    // Update total distance
    totalDistance.value = (route.distance / 1000).toFixed(1)
    
    // Update ETA
    estimatedArrival.value = new Date(Date.now() + route.duration * 1000)
    
    // Update directions for driver
    if (showDirections.value) {
      directions.value = route.steps.map(step => ({
        instruction: step.instructions,
        distance: step.distance,
        duration: step.duration,
        maneuver: step.maneuver || 'straight'
      }))
    }
    
    // Display route on map
    displayRoute(route)
    
  } catch (error) {
    console.error('Failed to calculate route:', error)
  }
}

const displayRoute = (route) => {
  if (!map.value || !route.points) return

  // Clear existing route
  if (routePolyline.value) {
    routePolyline.value.setMap(null)
  }

  // Create new polyline
  routePolyline.value = new google.maps.Polyline({
    path: route.points,
    geodesic: true,
    strokeColor: '#4285F4',
    strokeOpacity: 0.8,
    strokeWeight: 5
  })

  routePolyline.value.setMap(map.value)

  // Fit map to show entire route
  if (mapMode.value === 'overview') {
    const bounds = new google.maps.LatLngBounds()
    route.points.forEach(point => bounds.extend(point))
    if (userLocation.value) bounds.extend(userLocation.value)
    if (restaurantLocation.value) bounds.extend(restaurantLocation.value)
    map.value.fitBounds(bounds, 50)
  }
}

const handleDriverLocationUpdate = (data) => {
  driverLocation.value = data.location
  updateDriverMarker()
  
  // Recalculate route if driver location changed significantly
  calculateRoute()
  
  emit('location-updated', data)
}

const handleOrderStatusUpdate = (data) => {
  orderStatus.value = data.status
  emit('status-updated', data)
}

const handleEtaUpdate = (data) => {
  estimatedArrival.value = data.eta
}

const refreshDriverLocation = async () => {
  if (!driverInfo.value?.id) return
  
  refreshing.value = true
  try {
    const location = await trackingService.getDriverLocation(driverInfo.value.id)
    handleDriverLocationUpdate({ location })
  } catch (error) {
    console.error('Failed to refresh driver location:', error)
  } finally {
    refreshing.value = false
  }
}

const toggleFullscreen = () => {
  // Toggle fullscreen functionality would be implemented here
  isFullscreen.value = !isFullscreen.value
}

const callDriver = () => {
  if (driverInfo.value?.phone) {
    window.open(`tel:${driverInfo.value.phone}`)
  }
}

const messageDriver = () => {
  // Open chat/messaging interface
  // This would integrate with your chat system
  console.log('Open chat with driver')
}

// Helper functions
const getStatusColor = () => {
  const colors = {
    pending: 'orange',
    preparing: 'blue',
    assigned: 'purple',
    in_transit: 'green',
    delivered: 'success',
    cancelled: 'error'
  }
  return colors[orderStatus.value] || 'grey'
}

const getStatusIcon = () => {
  const icons = {
    pending: 'mdi-clock-outline',
    preparing: 'mdi-chef-hat',
    assigned: 'mdi-account-check',
    in_transit: 'mdi-truck-delivery',
    delivered: 'mdi-check-circle',
    cancelled: 'mdi-close-circle'
  }
  return icons[orderStatus.value] || 'mdi-help-circle'
}

const getStatusText = () => {
  const texts = {
    pending: 'Order Confirmed',
    preparing: 'Preparing Your Order',
    assigned: 'Driver Assigned',
    in_transit: 'On the Way',
    delivered: 'Delivered',
    cancelled: 'Cancelled'
  }
  return texts[orderStatus.value] || 'Unknown Status'
}

const getStatusDescription = () => {
  const descriptions = {
    pending: 'Your order has been confirmed and will be prepared soon',
    preparing: 'The restaurant is preparing your delicious meal',
    assigned: 'A driver has been assigned to your order',
    in_transit: 'Your driver is on the way with your order',
    delivered: 'Your order has been successfully delivered',
    cancelled: 'This order has been cancelled'
  }
  return descriptions[orderStatus.value] || ''
}

const getStepColor = (status) => {
  const colors = {
    completed: 'success',
    current: 'primary',
    pending: 'grey-lighten-1'
  }
  return colors[status] || 'grey'
}

const getStepIcon = (type) => {
  const icons = {
    order: 'mdi-receipt',
    preparing: 'mdi-chef-hat',
    pickup: 'mdi-account-circle',
    transit: 'mdi-truck-delivery',
    delivered: 'mdi-check-circle'
  }
  return icons[type] || 'mdi-circle'
}

const getCurrentDirectionIcon = () => {
  if (!currentDirection.value) return 'mdi-navigation'
  return getDirectionIcon(currentDirection.value.maneuver)
}

const getDirectionIcon = (maneuver) => {
  const icons = {
    'turn-left': 'mdi-turn-left',
    'turn-right': 'mdi-turn-right',
    'turn-slight-left': 'mdi-turn-left',
    'turn-slight-right': 'mdi-turn-right',
    'turn-sharp-left': 'mdi-turn-left',
    'turn-sharp-right': 'mdi-turn-right',
    'uturn-left': 'mdi-u-turn-left',
    'uturn-right': 'mdi-u-turn-right',
    'straight': 'mdi-arrow-up',
    'ramp-left': 'mdi-highway',
    'ramp-right': 'mdi-highway',
    'merge': 'mdi-merge',
    'fork-left': 'mdi-call-split',
    'fork-right': 'mdi-call-split',
    'roundabout-left': 'mdi-rotate-left',
    'roundabout-right': 'mdi-rotate-right'
  }
  return icons[maneuver] || 'mdi-navigation'
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

// Watchers
watch(() => mapMode.value, (newMode) => {
  if (newMode === 'follow' && driverLocation.value) {
    map.value.setCenter(driverLocation.value)
    map.value.setZoom(16)
  } else if (newMode === 'overview') {
    // Fit bounds to show entire route
    const bounds = new google.maps.LatLngBounds()
    if (driverLocation.value) bounds.extend(driverLocation.value)
    if (userLocation.value) bounds.extend(userLocation.value)
    if (restaurantLocation.value) bounds.extend(restaurantLocation.value)
    if (!bounds.isEmpty()) {
      map.value.fitBounds(bounds, 50)
    }
  }
})

// Lifecycle
onMounted(() => {
  initializeTracking()
})

onUnmounted(() => {
  trackingService.stopTracking(props.orderId)
})
</script>

<style scoped>
.delivery-tracking-container {
  position: relative;
}

.status-header .v-card-text {
  color: white;
}

.delivery-map {
  width: 100%;
  border-radius: 8px;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  align-items: center;
}

.current-direction {
  border-left: 4px solid #1976d2;
}

.order-info {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}

.next-directions {
  border-top: 1px solid #e0e0e0;
  padding-top: 12px;
}

@media (max-width: 768px) {
  .map-controls {
    top: 8px;
    right: 8px;
  }
  
  .restaurant-info-overlay {
    left: 8px;
    right: 8px;
    max-width: none;
  }
}
</style>