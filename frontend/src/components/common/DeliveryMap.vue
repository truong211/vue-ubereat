<template>
  <div class="delivery-map" :style="{ height: `${height}px` }">
    <div v-if="loading" class="map-loading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <span class="ml-2">Loading map...</span>
    </div>
    
    <div v-else-if="error" class="map-error">
      <v-icon size="32" color="error">mdi-map-marker-off</v-icon>
      <span class="ml-2">{{ error }}</span>
    </div>
    
    <div v-else ref="mapContainer" class="map-container"></div>
    
    <div v-if="showLocationDetails && !loading && !error" class="map-details">
      <div class="location-card">
        <div v-if="driverLocation" class="location-item">
          <v-icon color="primary" class="mr-2">mdi-bike</v-icon>
          <div>
            <div class="text-caption text-grey">Driver</div>
            <div class="text-body-2">{{ driverInfo?.name || 'Driver' }}</div>
            <div v-if="driverInfo?.eta" class="text-caption">
              <v-icon size="x-small" class="mr-1">mdi-clock</v-icon>
              {{ driverInfo.eta }} min away
            </div>
          </div>
        </div>
        
        <div class="location-item">
          <v-icon color="error" class="mr-2">mdi-store</v-icon>
          <div>
            <div class="text-caption text-grey">Restaurant</div>
            <div class="text-body-2">{{ restaurantName }}</div>
          </div>
        </div>
        
        <div class="location-item">
          <v-icon color="success" class="mr-2">mdi-home</v-icon>
          <div>
            <div class="text-caption text-grey">Delivery Address</div>
            <div class="text-body-2">{{ deliveryAddress }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import mapService from '@/services/map'

export default {
  name: 'DeliveryMap',

  props: {
    restaurantLocation: {
      type: Object,
      required: true,
      validator: value => 'lat' in value && 'lng' in value
    },
    deliveryLocation: {
      type: Object,
      required: true,
      validator: value => 'lat' in value && 'lng' in value
    },
    driverLocation: {
      type: Object,
      default: null,
      validator: value => value === null || ('lat' in value && 'lng' in value)
    },
    restaurantName: {
      type: String,
      default: 'Restaurant'
    },
    deliveryAddress: {
      type: String,
      default: 'Delivery Address'
    },
    driverInfo: {
      type: Object,
      default: () => ({})
    },
    showLocationDetails: {
      type: Boolean,
      default: true
    },
    height: {
      type: Number,
      default: 400
    }
  },

  emits: [
    'map-loaded',
    'map-error'
  ],

  setup(props, { emit }) {
    const mapContainer = ref(null)
    const map = ref(null)
    const markers = ref({
      restaurant: null,
      delivery: null,
      driver: null
    })
    const routePolyline = ref(null)
    const driverPath = ref(null)
    const loading = ref(true)
    const error = ref(null)
    
    // Store previous driver location for animations
    const previousDriverLocation = ref(null)
    
    // Calculate center point for map initialization
    const getCenterPoint = () => {
      // Get midpoint between restaurant and delivery
      const lat = (props.restaurantLocation.lat + props.deliveryLocation.lat) / 2
      const lng = (props.restaurantLocation.lng + props.deliveryLocation.lng) / 2
      return { lat, lng }
    }
    
    // Calculate appropriate zoom level based on distance
    const getAppropriateZoom = () => {
      // Calculate distance between restaurant and delivery
      const distance = calculateDistance(
        props.restaurantLocation.lat,
        props.restaurantLocation.lng,
        props.deliveryLocation.lat,
        props.deliveryLocation.lng
      )
      
      // Set zoom based on distance (in km)
      if (distance > 10) return 11
      if (distance > 5) return 12
      if (distance > 2) return 13
      if (distance > 1) return 14
      return 15
    }
    
    // Calculate distance between two points using Haversine formula
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371 // Radius of Earth in kilometers
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLon = (lon2 - lon1) * Math.PI / 180
      
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
        
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c // Distance in km
    }
    
    // Add markers for restaurant, delivery, and driver
    const addMarkers = async () => {
      // Restaurant marker
      markers.value.restaurant = await mapService.addMarker(map.value, {
        position: props.restaurantLocation,
        title: props.restaurantName,
        icon: {
          url: '/icons/restaurant-marker.svg',
          scaledSize: { width: 32, height: 32 }
        }
      })
      
      // Delivery marker
      markers.value.delivery = await mapService.addMarker(map.value, {
        position: props.deliveryLocation,
        title: 'Delivery Location',
        icon: {
          url: '/icons/home-marker.svg',
          scaledSize: { width: 32, height: 32 }
        }
      })
      
      // Driver marker (if available)
      if (props.driverLocation) {
        markers.value.driver = await mapService.addMarker(map.value, {
          position: props.driverLocation,
          title: props.driverInfo?.name || 'Driver',
          icon: {
            url: '/icons/driver-marker.svg',
            scaledSize: { width: 32, height: 32 }
          }
        })
      }
      
      // Fit bounds to show all markers
      mapService.fitBounds(map.value, [
        props.restaurantLocation,
        props.deliveryLocation,
        ...(props.driverLocation ? [props.driverLocation] : [])
      ])
    }
    
    // Draw route between restaurant and delivery location
    const drawRoute = async () => {
      try {
        // Calculate and display route between restaurant and delivery
        const routeResult = await mapService.calculateRoute(
          props.restaurantLocation,
          props.deliveryLocation
        )
        
        // Draw the route on the map
        routePolyline.value = await mapService.displayRoute(map.value, routeResult, {
          strokeColor: '#4CAF50',
          strokeWeight: 4,
          strokeOpacity: 0.7
        })
        
        // If driver location is available, draw path from driver to restaurant or delivery
        if (props.driverLocation) {
          await drawDriverPath()
        }
      } catch (err) {
        console.error('Failed to draw route:', err)
      }
    }
    
    // Draw driver path based on current order status
    const drawDriverPath = async () => {
      try {
        // Clear existing driver path
        if (driverPath.value) {
          mapService.removePolyline(map.value, driverPath.value)
        }
        
        // Determine destination based on order status
        // If status is "on_the_way", driver is going to delivery location
        // Otherwise driver is going to restaurant
        const destination = props.driverInfo?.status === 'on_the_way' 
          ? props.deliveryLocation 
          : props.restaurantLocation
        
        // Calculate and display route between driver and destination
        const routeResult = await mapService.calculateRoute(
          props.driverLocation,
          destination
        )
        
        // Draw the driver's path on the map
        driverPath.value = await mapService.displayRoute(map.value, routeResult, {
          strokeColor: '#2196F3',
          strokeWeight: 4,
          strokeOpacity: 0.7,
          strokeDashArray: [4, 4] // Dashed line
        })
      } catch (err) {
        console.error('Failed to draw driver path:', err)
      }
    }
    
    // Update driver marker position with animation
    const updateDriverMarker = async () => {
      if (!markers.value.driver && props.driverLocation) {
        // Create new driver marker if it doesn't exist
        markers.value.driver = await mapService.addMarker(map.value, {
          position: props.driverLocation,
          title: props.driverInfo?.name || 'Driver',
          icon: {
            url: '/icons/driver-marker.svg',
            scaledSize: { width: 32, height: 32 }
          }
        })
      } else if (markers.value.driver && props.driverLocation) {
        // Update existing driver marker position
        await mapService.animateMarker(
          markers.value.driver,
          previousDriverLocation.value || props.driverLocation,
          props.driverLocation,
          1000 // Animation duration in ms
        )
      }
      
      // Update previous driver location
      if (props.driverLocation) {
        previousDriverLocation.value = { ...props.driverLocation }
      }
      
      // Update driver path if needed
      if (props.driverLocation) {
        await drawDriverPath()
      }
    }
    
    // Initialize map
    const initMap = async () => {
      if (!mapContainer.value) return
      
      try {
        loading.value = true
        error.value = null
        
        // Initialize map centered on midpoint
        const centerPoint = getCenterPoint()
        map.value = await mapService.createMap(mapContainer.value, {
          center: centerPoint,
          zoom: getAppropriateZoom(),
          styles: [
            // Add custom map styles here if needed
          ]
        })
        
        // Add markers
        await addMarkers()
        
        // Draw delivery route
        await drawRoute()
        
        // Emit map loaded event
        emit('map-loaded', map.value)
        
        loading.value = false
      } catch (err) {
        console.error('Failed to initialize map:', err)
        error.value = 'Failed to load map. Please try again.'
        emit('map-error', err)
        loading.value = false
      }
    }
    
    // Watch for changes in driver location
    watch(() => props.driverLocation, async (newLocation, oldLocation) => {
      if (!newLocation) return
      
      // If map is not initialized yet, return
      if (!map.value) return
      
      // Update driver marker
      await updateDriverMarker()
      
      // Update previous driver location
      previousDriverLocation.value = oldLocation
    }, { deep: true })
    
    // Lifecycle hooks
    onMounted(() => {
      initMap()
    })
    
    onUnmounted(() => {
      // Clean up map resources
      if (map.value) {
        mapService.destroyMap(map.value)
      }
    })
    
    return {
      mapContainer,
      loading,
      error
    }
  }
}
</script>

<style scoped>
.delivery-map {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.map-container {
  width: 100%;
  height: 100%;
}

.map-loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 8px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.9);
  padding: 16px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-details {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  z-index: 1;
}

.location-card {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.location-item {
  display: flex;
  align-items: flex-start;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.location-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.location-item:first-child {
  padding-top: 0;
}
</style>
