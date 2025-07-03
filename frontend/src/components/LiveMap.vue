<template>
  <div class="map-container" ref="mapContainer">
    <!-- Placeholder for when map fails to load -->
    <div v-if="showMapError" class="map-error">
      <v-alert type="error" variant="tonal">
        Không thể tải bản đồ. Vui lòng thử lại sau.
        <template v-slot:append>
          <v-btn color="error" @click="initMap">Thử lại</v-btn>
        </template>
      </v-alert>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, defineProps, defineEmits, computed } from 'vue'
import { useDriverTracking } from '@/composables/useDriverTracking'

const props = defineProps({
  deliveryAddress: {
    type: Object,
    default: null
  },
  restaurantLocation: {
    type: Object,
    default: null
  },
  driverLocation: {
    type: Object,
    default: null
  },
  orderId: {
    type: [String, Number],
    default: null
  },
  routePoints: {
    type: Array,
    default: () => []
  },
  eta: {
    type: [String, Number],
    default: null
  }
})

const emit = defineEmits(['map-ready'])

// If orderId provided, use websocket driver tracking composable
const driverTracking = props.orderId && props.deliveryAddress ? useDriverTracking(props.orderId, props.deliveryAddress) : null

// Prefer live driver location from tracking
const currentDriverLocation = computed(() => {
  return driverTracking && driverTracking.driverLocation.value ? driverTracking.driverLocation.value : props.driverLocation
})
const currentEta = computed(() => {
  return driverTracking && driverTracking.eta.value ? driverTracking.eta.value.durationText : props.eta
})

// Refs
const mapContainer = ref(null)
const map = ref(null)
const markers = ref({
  restaurant: null,
  driver: null,
  delivery: null
})
const routePath = ref(null)
const mapLoadAttempts = ref(0)
const showMapError = ref(false)
const driverMarkerAnimation = ref(null)
const watchId = ref(null)

// Methods
const initMap = async () => {
  if (!mapContainer.value) return
  if (mapLoadAttempts.value >= 3) {
    showMapError.value = true
    return
  }
  
  mapLoadAttempts.value++
  showMapError.value = false
  
  try {
    // Check if Google Maps script is already loaded
    if (!window.google || !window.google.maps) {
      await loadGoogleMapsScript()
    }
    
    // Create map instance
    const mapOptions = {
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      fullscreenControl: false,
      mapTypeControl: false,
      zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
      }
    }
    
    map.value = new google.maps.Map(mapContainer.value, mapOptions)
    
    // Center map on delivery location if available, otherwise on restaurant
    if (props.deliveryAddress) {
      map.value.setCenter({ 
        lat: props.deliveryAddress.lat, 
        lng: props.deliveryAddress.lng 
      })
    } else if (props.restaurantLocation) {
      map.value.setCenter({ 
        lat: props.restaurantLocation.lat, 
        lng: props.restaurantLocation.lng 
      })
    }
    
    // Set up markers
    updateMapMarkers()
    
    // Draw route if we have both driver and delivery locations
    if (props.routePoints && props.routePoints.length > 0) {
      drawRoute()
    } else if (currentDriverLocation.value && props.deliveryAddress) {
      drawDirectRoute()
    }
    
    // Map is ready
    emit('map-ready', map.value)
  } catch (error) {
    console.error('Error initializing map:', error)
    showMapError.value = true
  }
}

const loadGoogleMapsScript = () => {
  return new Promise((resolve, reject) => {
    const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY' // Replace with actual API key from config
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`
    script.async = true
    script.defer = true
    
    script.onload = resolve
    script.onerror = () => reject(new Error('Failed to load Google Maps script'))
    
    document.head.appendChild(script)
  })
}

const updateMapMarkers = () => {
  if (!map.value) return
  
  // Compute driver position source
  const driverPosSource = currentDriverLocation.value
  
  // Update restaurant marker
  if (props.restaurantLocation) {
    if (!markers.value.restaurant) {
      markers.value.restaurant = new google.maps.Marker({
        map: map.value,
        position: { 
          lat: props.restaurantLocation.lat, 
          lng: props.restaurantLocation.lng 
        },
        icon: {
          url: '/img/markers/restaurant-marker.png',
          scaledSize: new google.maps.Size(40, 40)
        },
        title: props.restaurantLocation.name || 'Nhà hàng'
      })
    } else {
      markers.value.restaurant.setPosition({ 
        lat: props.restaurantLocation.lat, 
        lng: props.restaurantLocation.lng 
      })
    }
  }
  
  // Update delivery location marker
  if (props.deliveryAddress) {
    if (!markers.value.delivery) {
      markers.value.delivery = new google.maps.Marker({
        map: map.value,
        position: { 
          lat: props.deliveryAddress.lat, 
          lng: props.deliveryAddress.lng 
        },
        icon: {
          url: '/img/markers/destination-marker.png',
          scaledSize: new google.maps.Size(40, 40)
        },
        title: 'Địa điểm giao hàng'
      })
    } else {
      markers.value.delivery.setPosition({ 
        lat: props.deliveryAddress.lat, 
        lng: props.deliveryAddress.lng 
      })
    }
  }
  
  // Update driver marker
  if (driverPosSource) {
    const driverPos = { 
      lat: driverPosSource.lat, 
      lng: driverPosSource.lng 
    }
    
    if (!markers.value.driver) {
      markers.value.driver = new google.maps.Marker({
        map: map.value,
        position: driverPos,
        icon: {
          url: '/img/markers/delivery-bike.png',
          scaledSize: new google.maps.Size(40, 40)
        },
        title: 'Tài xế',
        animation: google.maps.Animation.BOUNCE
      })
      
      // Stop bouncing after 3 seconds
      setTimeout(() => {
        if (markers.value.driver) {
          markers.value.driver.setAnimation(null)
        }
      }, 3000)
    } else {
      // Smooth transition to new position with animation
      animateMarkerMovement(markers.value.driver, driverPos)
    }
    
    // Center map on driver
    map.value.setCenter(driverPos)
  }
  
  // Fit bounds to show all markers
  if (Object.values(markers.value).filter(Boolean).length > 1) {
    const bounds = new google.maps.LatLngBounds()
    
    Object.values(markers.value).forEach(marker => {
      if (marker) {
        bounds.extend(marker.getPosition())
      }
    })
    
    map.value.fitBounds(bounds)
    
    // Add some padding
    const padding = {
      top: 50,
      right: 50,
      bottom: 50,
      left: 50
    }
    
    map.value.fitBounds(bounds, padding)
  }
}

const animateMarkerMovement = (marker, newPosition) => {
  if (driverMarkerAnimation.value) {
    window.cancelAnimationFrame(driverMarkerAnimation.value)
  }
  
  const startPosition = marker.getPosition()
  const startLat = startPosition.lat()
  const startLng = startPosition.lng()
  const latDiff = newPosition.lat - startLat
  const lngDiff = newPosition.lng - startLng
  const frames = 20
  let frame = 0
  
  const animate = () => {
    if (frame >= frames) {
      marker.setPosition(newPosition)
      return
    }
    
    frame++
    const progress = frame / frames
    const lat = startLat + latDiff * progress
    const lng = startLng + lngDiff * progress
    
    marker.setPosition({ lat, lng })
    driverMarkerAnimation.value = window.requestAnimationFrame(animate)
  }
  
  driverMarkerAnimation.value = window.requestAnimationFrame(animate)
}

const drawRoute = () => {
  if (!map.value || !props.routePoints || props.routePoints.length < 2) return
  
  // Clear existing route
  if (routePath.value) {
    routePath.value.setMap(null)
  }
  
  // Convert route points to LatLng objects
  const path = props.routePoints.map(point => (
    new google.maps.LatLng(point.lat, point.lng)
  ))
  
  // Create polyline for route
  routePath.value = new google.maps.Polyline({
    path: path,
    geodesic: true,
    strokeColor: '#4285F4',
    strokeOpacity: 0.8,
    strokeWeight: 5
  })
  
  routePath.value.setMap(map.value)
}

const drawDirectRoute = () => {
  if (!map.value || !currentDriverLocation.value || !props.deliveryAddress) return
  
  // Draw a direct line between driver and delivery address
  const path = [
    new google.maps.LatLng(currentDriverLocation.value.lat, currentDriverLocation.value.lng),
    new google.maps.LatLng(props.deliveryAddress.lat, props.deliveryAddress.lng)
  ]
  
  // Clear existing route
  if (routePath.value) {
    routePath.value.setMap(null)
  }
  
  // Create polyline for route
  routePath.value = new google.maps.Polyline({
    path: path,
    geodesic: true,
    strokeColor: '#4285F4',
    strokeOpacity: 0.8,
    strokeWeight: 5,
    icons: [{
      icon: {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW
      },
      offset: '50%',
      repeat: '100px'
    }]
  })
  
  routePath.value.setMap(map.value)
}

// Watchers
watch(currentDriverLocation, () => {
  if (map.value) {
    updateMapMarkers()
    
    if (props.routePoints && props.routePoints.length > 0) {
      drawRoute()
    } else if (currentDriverLocation.value && props.deliveryAddress) {
      drawDirectRoute()
    }
  }
}, { deep: true })

watch(() => props.routePoints, () => {
  if (map.value) {
    drawRoute()
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  initMap()
  
  // Handle device orientation updates for a more dynamic map
  if (window.DeviceOrientationEvent) {
    window.addEventListener('deviceorientation', (event) => {
      if (map.value && markers.value.driver && event.alpha) {
        // Update driver marker rotation based on device orientation
        const icon = markers.value.driver.getIcon()
        icon.rotation = 360 - event.alpha
        markers.value.driver.setIcon(icon)
      }
    })
  }
  
  // Try to get user's current position (useful for relative ETAs)
  if (navigator.geolocation) {
    watchId.value = navigator.geolocation.watchPosition(
      (position) => {
        // We could use this to calculate an even more accurate ETA
        // or show user's position on the map if needed
      },
      (error) => {
        console.warn('Không thể lấy vị trí hiện tại:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    )
  }
})

onUnmounted(() => {
  // Clean up resources
  if (driverMarkerAnimation.value) {
    window.cancelAnimationFrame(driverMarkerAnimation.value)
  }
  
  if (watchId.value) {
    navigator.geolocation.clearWatch(watchId.value)
  }
  
  // Clear markers and polylines
  Object.values(markers.value).forEach(marker => {
    if (marker) marker.setMap(null)
  })
  
  if (routePath.value) {
    routePath.value.setMap(null)
  }
})
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  background-color: #f5f5f5;
  position: relative;
}

.map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 400px;
  z-index: 10;
}
</style>