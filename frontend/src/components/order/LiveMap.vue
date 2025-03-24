<template>
  <div class="live-map">
    <div ref="mapContainer" class="map-container" style="height: 400px"></div>
    <div v-if="isLoading" class="map-loader">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <p class="text-caption mt-2">Loading map...</p>
    </div>
    
    <div v-if="eta" class="map-eta pa-2">
      <div class="d-flex align-center">
        <v-icon color="primary" size="small" class="mr-2">mdi-clock-outline</v-icon>
        <span>ETA: {{ formatETA(eta) }}</span>
      </div>
    </div>
    
    <!-- Traffic conditions indicator -->
    <div v-if="trafficConditions" class="map-traffic pa-2">
      <div class="d-flex align-center">
        <v-icon :color="getTrafficColor(trafficConditions)" size="small" class="mr-2">
          {{ getTrafficIcon(trafficConditions) }}
        </v-icon>
        <span>Traffic: {{ trafficConditions }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default {
  name: 'LiveMap',
  
  props: {
    deliveryAddress: {
      type: Object,
      required: true
    },
    restaurantLocation: {
      type: Object,
      required: true
    },
    driverLocation: {
      type: Object,
      default: null
    },
    eta: {
      type: Number,
      default: null
    },
    pathPoints: {
      type: Array,
      default: () => []
    },
    trafficConditions: {
      type: String,
      default: null
    }
  },
  
  setup(props, { emit }) {
    const mapContainer = ref(null);
    const map = ref(null);
    const isLoading = ref(true);
    const markers = ref({
      restaurant: null,
      customer: null,
      driver: null
    });
    const routePath = ref(null);
    const driverHistory = ref([]);
    const driverHistoryPath = ref(null);
    
    // Format ETA in minutes
    const formatETA = (minutes) => {
      if (minutes < 1) return 'Less than a minute';
      return `${Math.round(minutes)} ${Math.round(minutes) === 1 ? 'minute' : 'minutes'}`;
    };
    
    // Traffic condition helpers
    const getTrafficColor = (condition) => {
      const colors = {
        'light': 'success',
        'moderate': 'warning',
        'heavy': 'error'
      };
      return colors[condition?.toLowerCase()] || 'grey';
    };
    
    const getTrafficIcon = (condition) => {
      const icons = {
        'light': 'mdi-car-cruise-control',
        'moderate': 'mdi-car',
        'heavy': 'mdi-car-brake-alert'
      };
      return icons[condition?.toLowerCase()] || 'mdi-car';
    };
    
    // Initialize map
    const initializeMap = () => {
      if (!mapContainer.value) return;
      
      isLoading.value = true;
      
      // Create map instance
      map.value = L.map(mapContainer.value, {
        center: [props.deliveryAddress.lat, props.deliveryAddress.lng],
        zoom: 13,
        zoomControl: true
      });
      
      // Add tile layer (map style)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map.value);
      
      // Add markers
      addMarkers();
      
      // If driver is available, add and center on driver
      if (props.driverLocation) {
        addDriverMarker();
        drawRoute();
      } else {
        // If no driver, fit bounds to show both restaurant and delivery address
        const bounds = L.latLngBounds(
          [props.restaurantLocation.lat, props.restaurantLocation.lng],
          [props.deliveryAddress.lat, props.deliveryAddress.lng]
        );
        map.value.fitBounds(bounds, { padding: [50, 50] });
      }
      
      isLoading.value = false;
      emit('map-ready');
    };
    
    // Add restaurant and customer markers
    const addMarkers = () => {
      // Add restaurant marker
      const restaurantIcon = L.divIcon({
        html: `<div class="custom-marker restaurant-marker">
                <v-icon color="primary">mdi-store</v-icon>
               </div>`,
        className: 'custom-marker-container',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
      
      markers.value.restaurant = L.marker(
        [props.restaurantLocation.lat, props.restaurantLocation.lng],
        { icon: restaurantIcon }
      )
        .addTo(map.value)
        .bindPopup('<b>Restaurant</b><br>' + props.restaurantLocation.address);
      
      // Add customer marker
      const customerIcon = L.divIcon({
        html: `<div class="custom-marker customer-marker">
                <v-icon color="success">mdi-home</v-icon>
               </div>`,
        className: 'custom-marker-container',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
      
      markers.value.customer = L.marker(
        [props.deliveryAddress.lat, props.deliveryAddress.lng],
        { icon: customerIcon }
      )
        .addTo(map.value)
        .bindPopup('<b>Delivery Address</b><br>' + props.deliveryAddress.address);
    };
    
    // Add or update driver marker
    const addDriverMarker = () => {
      if (!props.driverLocation) return;
      
      // Add current position to history
      driverHistory.value.push([props.driverLocation.lat, props.driverLocation.lng]);
      
      // Limit history length
      if (driverHistory.value.length > 20) {
        driverHistory.value.shift();
      }
      
      // Create driver icon
      const driverIcon = L.divIcon({
        html: `<div class="custom-marker driver-marker pulse">
                <v-icon color="red">mdi-bike</v-icon>
               </div>`,
        className: 'custom-marker-container',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
      
      // If driver marker exists, update its position with animation
      if (markers.value.driver) {
        const newLatLng = [props.driverLocation.lat, props.driverLocation.lng];
        markers.value.driver.setLatLng(newLatLng);
        
        // Update driver's history path
        if (driverHistory.value.length > 1) {
          if (driverHistoryPath.value) {
            map.value.removeLayer(driverHistoryPath.value);
          }
          
          driverHistoryPath.value = L.polyline(driverHistory.value, {
            color: '#FF6B6B',
            weight: 3,
            opacity: 0.6,
            dashArray: '5, 10',
            lineJoin: 'round'
          }).addTo(map.value);
        }
      } 
      // Otherwise create a new marker
      else {
        markers.value.driver = L.marker(
          [props.driverLocation.lat, props.driverLocation.lng],
          { icon: driverIcon }
        )
          .addTo(map.value)
          .bindPopup('<b>Driver</b><br>Your food is on the way!');
      }
    };
    
    // Draw route from driver to customer
    const drawRoute = () => {
      if (!props.driverLocation) return;
      
      // Define route points
      let routePoints = [];
      
      // If we have path points from the API, use them
      if (props.pathPoints && props.pathPoints.length > 0) {
        routePoints = props.pathPoints.map(point => [point.lat, point.lng]);
      } 
      // Otherwise draw a direct line
      else {
        routePoints = [
          [props.driverLocation.lat, props.driverLocation.lng],
          [props.deliveryAddress.lat, props.deliveryAddress.lng]
        ];
      }
      
      // Remove existing path if it exists
      if (routePath.value) {
        map.value.removeLayer(routePath.value);
      }
      
      // Draw the path with styled appearance
      routePath.value = L.polyline(routePoints, {
        color: '#007BFF',
        weight: 4,
        opacity: 0.8,
        lineJoin: 'round',
        lineCap: 'round'
      }).addTo(map.value);
      
      // Add direction arrows
      const arrowDecorator = L.polylineDecorator(routePath.value, {
        patterns: [
          {
            offset: '5%',
            repeat: '10%',
            symbol: L.Symbol.arrowHead({
              pixelSize: 10,
              polygon: false,
              pathOptions: {
                color: '#007BFF',
                fillOpacity: 1,
                weight: 2
              }
            })
          }
        ]
      }).addTo(map.value);
      
      // Fit map to show the entire route
      const bounds = L.latLngBounds(routePoints);
      map.value.fitBounds(bounds, { padding: [50, 50] });
    };
    
    // Center map on driver
    const centerOnDriver = () => {
      if (props.driverLocation && map.value) {
        map.value.setView([props.driverLocation.lat, props.driverLocation.lng], 15);
      }
    };
    
    // Lifecycle hooks
    onMounted(() => {
      initializeMap();
    });
    
    onUnmounted(() => {
      if (map.value) {
        map.value.remove();
        map.value = null;
      }
    });
    
    // Watch for changes to driver location
    watch(() => props.driverLocation, (newLocation) => {
      if (newLocation && map.value) {
        addDriverMarker();
        drawRoute();
      }
    }, { deep: true });
    
    return {
      mapContainer,
      isLoading,
      formatETA,
      getTrafficColor,
      getTrafficIcon,
      centerOnDriver
    };
  }
};
</script>

<style scoped>
.live-map {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
}

.map-container {
  width: 100%;
  height: 100%;
  z-index: 1;
}

.map-loader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.map-eta {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  font-weight: 500;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.map-traffic {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 4px;
  font-weight: 500;
  z-index: 5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Pulse animation for driver marker */
.pulse {
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Ensuring the map displays correctly */
:deep(.leaflet-control-container) {
  position: absolute;
  z-index: 1000;
}

:deep(.leaflet-popup-content) {
  margin: 8px;
}

/* Custom marker styles */
:deep(.custom-marker-container) {
  background: none;
  border: none;
}

:deep(.custom-marker) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 40px;
  height: 40px;
}
</style> 