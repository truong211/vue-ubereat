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
    }
  },
  
  setup(props) {
    const mapContainer = ref(null);
    const map = ref(null);
    const isLoading = ref(true);
    const markers = ref({
      restaurant: null,
      customer: null,
      driver: null
    });
    const routePath = ref(null);
    
    // Format ETA in minutes
    const formatETA = (minutes) => {
      if (minutes < 1) return 'Less than a minute';
      return `${Math.round(minutes)} ${minutes === 1 ? 'minute' : 'minutes'}`;
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
      
      // Create driver icon
      const driverIcon = L.divIcon({
        html: `<div class="custom-marker driver-marker">
                <v-icon color="red">mdi-bike</v-icon>
               </div>`,
        className: 'custom-marker-container',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });
      
      // If driver marker exists, update its position
      if (markers.value.driver) {
        markers.value.driver.setLatLng([props.driverLocation.lat, props.driverLocation.lng]);
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
      
      // Draw the path
      routePath.value = L.polyline(routePoints, {
        color: '#007BFF',
        weight: 4,
        opacity: 0.7,
        lineJoin: 'round'
      }).addTo(map.value);
      
      // Fit map to show the entire route
      const bounds = L.latLngBounds(routePoints);
      map.value.fitBounds(bounds, { padding: [50, 50] });
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
      formatETA
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
  border-radius: 8px;
}

.map-loader {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.8);
  padding: 16px;
  border-radius: 8px;
}

.map-eta {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
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