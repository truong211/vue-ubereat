<template>
  <div class="restaurant-map">
    <v-card class="map-container" :height="height">
      <v-card-title v-if="showHeader" class="d-flex align-center py-2">
        <span>{{ title }}</span>
        <v-spacer></v-spacer>
        <v-btn-toggle
          v-model="mapMode"
          density="comfortable"
          color="primary"
          mandatory
        >
          <v-btn size="small" value="restaurants">
            <v-icon size="small">mdi-store</v-icon>
            <span class="d-none d-sm-inline ml-1">Nhà hàng</span>
          </v-btn>
          <v-btn size="small" value="heatmap">
            <v-icon size="small">mdi-chart-bubble</v-icon>
            <span class="d-none d-sm-inline ml-1">Mật độ</span>
          </v-btn>
        </v-btn-toggle>
      </v-card-title>

      <div id="restaurant-map-container" :style="{ height: showHeader ? 'calc(100% - 48px)' : '100%' }"></div>

      <!-- Map loading overlay -->
      <div v-if="loading" class="map-loading-overlay d-flex flex-column justify-center align-center">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <span class="mt-3">Đang tải bản đồ...</span>
      </div>

      <!-- Selected restaurant info -->
      <div v-if="selectedRestaurant" class="selected-restaurant-info">
        <v-card variant="outlined" class="pa-3">
          <div class="d-flex">
            <v-avatar rounded size="48" class="mr-3">
              <v-img :src="selectedRestaurant.thumbnail" cover></v-img>
            </v-avatar>
            <div>
              <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ selectedRestaurant.name }}</h3>
              <div class="text-caption d-flex align-center">
                <span>{{ selectedRestaurant.rating }}</span>
                <v-icon color="amber" size="x-small" class="mx-1">mdi-star</v-icon>
                <span>({{ selectedRestaurant.reviewCount }})</span>
                <v-divider vertical class="mx-2"></v-divider>
                <span>{{ selectedRestaurant.cuisineType }}</span>
              </div>
              <div class="text-caption mt-1">
                <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
                <span>{{ selectedRestaurant.deliveryTime }} phút</span>
                <v-icon size="x-small" class="ml-2 mr-1">mdi-map-marker</v-icon>
                <span>{{ formatDistance(selectedRestaurant.distance) }}</span>
              </div>
            </div>
          </div>
          <div class="d-flex justify-end mt-2">
            <v-btn
              variant="text"
              density="compact"
              color="primary"
              :to="`/restaurant/${selectedRestaurant.id}`"
            >
              Xem chi tiết
            </v-btn>
          </div>
        </v-card>
      </div>

      <!-- Map controls -->
      <div class="map-controls">
        <v-btn
          icon
          variant="outlined"
          class="mb-2"
          @click="centerMap"
          title="Về vị trí của tôi"
        >
          <v-icon>mdi-crosshairs-gps</v-icon>
        </v-btn>
        <v-btn
          icon
          variant="outlined"
          @click="toggleFilterPanel"
          title="Bộ lọc bản đồ"
        >
          <v-icon>mdi-filter</v-icon>
        </v-btn>
      </div>

      <!-- Map filter panel -->
      <v-card v-if="showFilterPanel" class="map-filter-panel">
        <v-card-title class="d-flex justify-space-between align-center py-2">
          <span class="text-subtitle-1">Bộ lọc bản đồ</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            density="compact"
            @click="showFilterPanel = false"
          ></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <div class="text-subtitle-2 mb-1">Bán kính hiển thị</div>
              <v-slider
                v-model="displayRadius"
                :min="1"
                :max="10"
                :step="0.5"
                thumb-label
                color="primary"
                :hide-details="false"
                :details="`${displayRadius} km`"
              ></v-slider>
            </v-col>
            
            <v-col cols="12">
              <v-checkbox
                v-model="showDeliveryRadii"
                label="Hiển thị bán kính giao hàng"
                color="primary"
                hide-details
              ></v-checkbox>
            </v-col>
            
            <v-col cols="12">
              <v-checkbox
                v-model="clusterMarkers"
                label="Gom nhóm nhà hàng"
                color="primary"
                hide-details
              ></v-checkbox>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn
            block
            color="primary"
            @click="applyMapFilters"
          >
            Áp dụng
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';

// Props
const props = defineProps({
  restaurants: {
    type: Array,
    default: () => []
  },
  userLocation: {
    type: Object,
    default: () => ({ lat: 10.8231, lng: 106.6297 }) // Default to Ho Chi Minh City
  },
  height: {
    type: String,
    default: '500px'
  },
  title: {
    type: String,
    default: 'Nhà hàng gần đây'
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  initialZoom: {
    type: Number,
    default: 14
  }
});

// Emits
const emit = defineEmits(['restaurant-selected', 'map-ready', 'location-changed']);

// Router
const router = useRouter();

// Refs
const mapInstance = ref(null);
const markers = ref([]);
const circles = ref([]);
const userMarker = ref(null);
const heatmap = ref(null);
const markerCluster = ref(null);
const loading = ref(true);

// State
const mapMode = ref('restaurants');
const selectedRestaurant = ref(null);
const showFilterPanel = ref(false);
const displayRadius = ref(5);
const showDeliveryRadii = ref(true);
const clusterMarkers = ref(true);

// Format distance
const formatDistance = (distance) => {
  return `${distance.toFixed(1)} km`;
};

// Initialize map
const initMap = async () => {
  try {
    loading.value = true;
    
    // Ensure Google Maps API is loaded
    if (!window.google || !window.google.maps) {
      await loadGoogleMapsAPI();
    }
    
    // Create map instance
    const mapOptions = {
      center: { lat: props.userLocation.lat, lng: props.userLocation.lng },
      zoom: props.initialZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: getMapStyles()
    };
    
    mapInstance.value = new google.maps.Map(
      document.getElementById('restaurant-map-container'),
      mapOptions
    );
    
    // Add user marker
    addUserMarker();
    
    // Add restaurant markers
    addRestaurantMarkers();
    
    // Create heatmap layer
    createHeatmap();
    
    // Set map mode
    updateMapMode();
    
    // Add map event listeners
    mapInstance.value.addListener('idle', () => {
      // When map stops moving, emit location changed event
      const center = mapInstance.value.getCenter();
      emit('location-changed', {
        lat: center.lat(),
        lng: center.lng(),
        bounds: mapInstance.value.getBounds()
      });
    });
    
    // Emit map ready event
    emit('map-ready', mapInstance.value);
    
    loading.value = false;
  } catch (error) {
    console.error('Error initializing map:', error);
    loading.value = false;
  }
};

// Load Google Maps API
const loadGoogleMapsAPI = () => {
  return new Promise((resolve, reject) => {
    // This is a placeholder. In a real application, you would load the Google Maps API here
    // For this example, we'll assume it's already loaded or would be loaded via a script tag
    if (window.google && window.google.maps) {
      resolve();
    } else {
      reject(new Error('Google Maps API not loaded'));
    }
  });
};

// Add user marker
const addUserMarker = () => {
  if (!mapInstance.value) return;
  
  // Remove existing user marker
  if (userMarker.value) {
    userMarker.value.setMap(null);
  }
  
  // Create user marker
  userMarker.value = new google.maps.Marker({
    position: { lat: props.userLocation.lat, lng: props.userLocation.lng },
    map: mapInstance.value,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2
    },
    title: 'Vị trí của bạn',
    zIndex: 999
  });
  
  // Add user radius circle
  const userCircle = new google.maps.Circle({
    strokeColor: '#4285F4',
    strokeOpacity: 0.2,
    strokeWeight: 2,
    fillColor: '#4285F4',
    fillOpacity: 0.1,
    map: mapInstance.value,
    center: { lat: props.userLocation.lat, lng: props.userLocation.lng },
    radius: displayRadius.value * 1000 // Convert to meters
  });
  
  circles.value.push(userCircle);
};

// Add restaurant markers
const addRestaurantMarkers = () => {
  if (!mapInstance.value) return;
  
  // Clear existing markers
  clearMarkers();
  
  // Create markers array
  const markersArray = [];
  
  // Add marker for each restaurant
  props.restaurants.forEach(restaurant => {
    const marker = new google.maps.Marker({
      position: { lat: restaurant.lat, lng: restaurant.lng },
      title: restaurant.name,
      icon: {
        url: getMarkerIcon(restaurant),
        scaledSize: new google.maps.Size(32, 32)
      }
    });
    
    // Add click event
    marker.addListener('click', () => {
      selectedRestaurant.value = restaurant;
      emit('restaurant-selected', restaurant);
    });
    
    // Add delivery radius circle if option is enabled
    if (showDeliveryRadii.value) {
      const circle = new google.maps.Circle({
        strokeColor: '#FF5722',
        strokeOpacity: 0.2,
        strokeWeight: 1,
        fillColor: '#FF5722',
        fillOpacity: 0.1,
        map: mapInstance.value,
        center: { lat: restaurant.lat, lng: restaurant.lng },
        radius: restaurant.deliveryRadius * 1000 // Convert to meters
      });
      
      circles.value.push(circle);
    }
    
    markersArray.push(marker);
  });
  
  // Add markers to map
  if (clusterMarkers.value && window.MarkerClusterer) {
    // If clustering is enabled and the library is available
    markerCluster.value = new MarkerClusterer(mapInstance.value, markersArray, {
      imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
    });
  } else {
    // Otherwise, just add markers to the map
    markersArray.forEach(marker => {
      marker.setMap(mapInstance.value);
    });
  }
  
  // Store markers
  markers.value = markersArray;
};

// Create heatmap layer
const createHeatmap = () => {
  if (!mapInstance.value || !window.google.maps.visualization) return;
  
  // Create heatmap data points
  const heatmapData = props.restaurants.map(restaurant => {
    return {
      location: new google.maps.LatLng(restaurant.lat, restaurant.lng),
      weight: restaurant.popularity || 1
    };
  });
  
  // Create heatmap layer
  heatmap.value = new google.maps.visualization.HeatmapLayer({
    data: heatmapData,
    dissipating: true,
    radius: 30,
    opacity: 0.8,
    maxIntensity: 10
  });
};

// Update map mode (restaurants or heatmap)
const updateMapMode = () => {
  if (!mapInstance.value) return;
  
  if (mapMode.value === 'restaurants') {
    // Show markers
    markers.value.forEach(marker => {
      marker.setMap(mapInstance.value);
    });
    
    // Show circles if option is enabled
    if (showDeliveryRadii.value) {
      circles.value.forEach(circle => {
        circle.setMap(mapInstance.value);
      });
    }
    
    // Hide heatmap
    if (heatmap.value) {
      heatmap.value.setMap(null);
    }
  } else if (mapMode.value === 'heatmap') {
    // Hide markers
    markers.value.forEach(marker => {
      marker.setMap(null);
    });
    
    // Hide circles
    circles.value.forEach(circle => {
      circle.setMap(null);
    });
    
    // Show heatmap
    if (heatmap.value) {
      heatmap.value.setMap(mapInstance.value);
    }
  }
};

// Clear markers and circles
const clearMarkers = () => {
  // Clear markers
  markers.value.forEach(marker => {
    marker.setMap(null);
  });
  markers.value = [];
  
  // Clear circles
  circles.value.forEach(circle => {
    circle.setMap(null);
  });
  circles.value = [];
  
  // Clear marker cluster
  if (markerCluster.value) {
    markerCluster.value.clearMarkers();
  }
};

// Get marker icon based on restaurant data
const getMarkerIcon = (restaurant) => {
  // This is a placeholder. In a real application, you would use actual icons
  return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
};

// Center map on user location
const centerMap = () => {
  if (!mapInstance.value) return;
  
  mapInstance.value.setCenter({ lat: props.userLocation.lat, lng: props.userLocation.lng });
  mapInstance.value.setZoom(props.initialZoom);
};

// Toggle filter panel
const toggleFilterPanel = () => {
  showFilterPanel.value = !showFilterPanel.value;
};

// Apply map filters
const applyMapFilters = () => {
  // Update user radius circle
  if (circles.value.length > 0 && userMarker.value) {
    circles.value[0].setRadius(displayRadius.value * 1000);
  }
  
  // Redraw markers to apply new filters
  addRestaurantMarkers();
  
  // Update map mode
  updateMapMode();
  
  // Close filter panel
  showFilterPanel.value = false;
};

// Get map styles
const getMapStyles = () => {
  // This is a custom style for the map. You can modify it or use the default style.
  return [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }]
    }
  ];
};

// Watch for changes
watch(() => props.restaurants, () => {
  // When restaurants change, redraw markers
  nextTick(() => {
    addRestaurantMarkers();
    createHeatmap();
    updateMapMode();
  });
}, { deep: true });

watch(() => props.userLocation, () => {
  // When user location changes, update user marker
  nextTick(() => {
    addUserMarker();
  });
}, { deep: true });

watch(mapMode, () => {
  // When map mode changes, update display
  updateMapMode();
});

// Initialize map on mount
onMounted(() => {
  nextTick(() => {
    initMap();
  });
});
</script>

<style scoped>
.restaurant-map {
  position: relative;
}

.map-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
}

.map-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.selected-restaurant-info {
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 300px;
  max-width: calc(100% - 32px);
  z-index: 5;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 5;
  display: flex;
  flex-direction: column;
}

.map-filter-panel {
  position: absolute;
  top: 16px;
  left: 16px;
  width: 300px;
  max-width: calc(100% - 32px);
  z-index: 5;
}
</style> 