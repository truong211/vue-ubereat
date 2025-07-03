<template>
  <div class="enhanced-restaurant-map">
    <v-card class="map-container" elevation="2">
      <!-- Header Controls -->
      <v-card-title class="d-flex align-center justify-space-between pa-3">
        <div class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-map-search</v-icon>
          <h3 class="text-h6 mb-0">Khám phá nhà hàng</h3>
        </div>
        <div class="d-flex align-center">
          <!-- Search radius -->
          <v-select
            v-model="searchRadius"
            :items="radiusOptions"
            item-title="text"
            item-value="value"
            density="compact"
            variant="outlined"
            class="mr-2"
            style="width: 120px;"
            @update:model-value="onRadiusChange"
          ></v-select>
          
          <!-- View mode toggle -->
          <v-btn-toggle
            v-model="viewMode"
            density="compact"
            color="primary"
            mandatory
            @update:model-value="onViewModeChange"
          >
            <v-btn size="small" value="map">
              <v-icon size="small">mdi-map</v-icon>
            </v-btn>
            <v-btn size="small" value="list">
              <v-icon size="small">mdi-view-list</v-icon>
            </v-btn>
          </v-btn-toggle>
        </div>
      </v-card-title>

      <v-divider></v-divider>

      <!-- Filters -->
      <div class="filters-section pa-3">
        <v-row dense>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              placeholder="Tìm kiếm nhà hàng..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              @input="onSearchChange"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedCuisines"
              :items="cuisineTypes"
              label="Loại món ăn"
              multiple
              chips
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="onFiltersChange"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="priceRange"
              :items="priceRanges"
              item-title="text"
              item-value="value"
              label="Mức giá"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="onFiltersChange"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              item-title="text"
              item-value="value"
              label="Sắp xếp"
              variant="outlined"
              density="compact"
              hide-details
              @update:model-value="onFiltersChange"
            ></v-select>
          </v-col>
          <v-col cols="12" md="2">
            <div class="d-flex align-center">
              <v-switch
                v-model="showDeliveryZones"
                label="Vùng giao hàng"
                color="primary"
                hide-details
                @update:model-value="toggleDeliveryZones"
              ></v-switch>
            </div>
          </v-col>
        </v-row>
      </div>

      <v-divider></v-divider>

      <!-- Map/List Content -->
      <div class="content-section" :style="{ height: contentHeight }">
        <!-- Map View -->
        <div v-show="viewMode === 'map'" class="map-wrapper">
          <div id="enhanced-map" ref="mapContainer" class="enhanced-map"></div>
          
          <!-- Map Loading -->
          <div v-if="mapLoading" class="map-loading-overlay">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
            <span class="mt-3">Đang tải bản đồ...</span>
          </div>

          <!-- User Location Button -->
          <v-btn
            icon
            variant="elevated"
            color="primary"
            class="location-btn"
            @click="centerOnUserLocation"
            title="Vị trí của tôi"
          >
            <v-icon>mdi-crosshairs-gps</v-icon>
          </v-btn>

          <!-- Legend -->
          <div v-if="showDeliveryZones" class="map-legend">
            <v-card variant="outlined" class="pa-2">
              <div class="text-caption font-weight-bold mb-2">Vùng giao hàng</div>
              <div v-for="zone in legendZones" :key="zone.label" class="d-flex align-center mb-1">
                <div 
                  class="legend-color mr-2" 
                  :style="{ backgroundColor: zone.color }"
                ></div>
                <span class="text-caption">{{ zone.label }}</span>
              </div>
            </v-card>
          </div>
        </div>

        <!-- List View -->
        <div v-show="viewMode === 'list'" class="list-wrapper pa-3">
          <div v-if="filteredRestaurants.length === 0" class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-store-off</v-icon>
            <p class="text-h6 text-grey-lighten-1 mt-4">Không tìm thấy nhà hàng nào</p>
            <p class="text-body-2 text-grey">Thử điều chỉnh bộ lọc hoặc mở rộng khu vực tìm kiếm</p>
          </div>
          
          <v-row v-else>
            <v-col
              v-for="restaurant in filteredRestaurants"
              :key="restaurant.id"
              cols="12"
              md="6"
              lg="4"
            >
              <RestaurantCard
                :restaurant="restaurant"
                :user-location="userLocation"
                @click="selectRestaurant(restaurant)"
                @navigate="navigateToRestaurant(restaurant)"
              />
            </v-col>
          </v-row>
        </div>
      </div>

      <!-- Selected Restaurant Info -->
      <div v-if="selectedRestaurant" class="selected-info pa-3">
        <v-divider class="mb-3"></v-divider>
        <RestaurantInfoCard
          :restaurant="selectedRestaurant"
          :user-location="userLocation"
          :eta="selectedRestaurantETA"
          :delivery-fee="selectedRestaurantFee"
          :can-deliver="canDeliverToUser"
          @order="goToRestaurant"
          @call="callRestaurant"
          @get-directions="getDirectionsToRestaurant"
        />
      </div>
    </v-card>

    <!-- Navigation Dialog -->
    <v-dialog v-model="showNavigation" max-width="500" scrollable>
      <NavigationDialog
        v-if="showNavigation"
        :origin="userLocation"
        :destination="navigationDestination"
        @close="showNavigation = false"
      />
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import mapService from '@/services/mapService';
import RestaurantCard from './RestaurantCard.vue';
import RestaurantInfoCard from './RestaurantInfoCard.vue';
import NavigationDialog from '../navigation/NavigationDialog.vue';

// Props
const props = defineProps({
  initialLocation: {
    type: Object,
    default: () => ({ lat: 10.8231, lng: 106.6297 }) // Ho Chi Minh City
  },
  contentHeight: {
    type: String,
    default: '600px'
  }
});

// Store and router
const store = useStore();
const router = useRouter();

// Refs
const mapContainer = ref(null);
const map = ref(null);
const userMarker = ref(null);
const restaurantMarkers = ref([]);
const deliveryZoneCircles = ref([]);

// State
const userLocation = ref(props.initialLocation);
const restaurants = ref([]);
const selectedRestaurant = ref(null);
const selectedRestaurantETA = ref(null);
const selectedRestaurantFee = ref(null);
const canDeliverToUser = ref(true);
const mapLoading = ref(true);
const showNavigation = ref(false);
const navigationDestination = ref(null);

// Filters and search
const searchQuery = ref('');
const selectedCuisines = ref([]);
const priceRange = ref('all');
const sortBy = ref('distance');
const searchRadius = ref(10);
const viewMode = ref('map');
const showDeliveryZones = ref(false);

// Options
const radiusOptions = [
  { text: '2 km', value: 2 },
  { text: '5 km', value: 5 },
  { text: '10 km', value: 10 },
  { text: '15 km', value: 15 },
  { text: '20 km', value: 20 }
];

const priceRanges = [
  { text: 'Tất cả', value: 'all' },
  { text: 'Dưới 100k', value: 'under-100' },
  { text: '100k - 200k', value: '100-200' },
  { text: '200k - 500k', value: '200-500' },
  { text: 'Trên 500k', value: 'over-500' }
];

const sortOptions = [
  { text: 'Khoảng cách', value: 'distance' },
  { text: 'Đánh giá', value: 'rating' },
  { text: 'Thời gian giao', value: 'delivery-time' },
  { text: 'Phí giao hàng', value: 'delivery-fee' },
  { text: 'Phổ biến', value: 'popularity' }
];

const cuisineTypes = ref([]);

const legendZones = [
  { label: '0-2 km', color: '#4CAF50' },
  { label: '2-5 km', color: '#FF9800' },
  { label: '5+ km', color: '#F44336' }
];

// Computed
const filteredRestaurants = computed(() => {
  let filtered = [...restaurants.value];

  // Text search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(restaurant =>
      restaurant.name.toLowerCase().includes(query) ||
      restaurant.cuisineType?.toLowerCase().includes(query) ||
      restaurant.address?.toLowerCase().includes(query)
    );
  }

  // Cuisine filter
  if (selectedCuisines.value.length > 0) {
    filtered = filtered.filter(restaurant =>
      selectedCuisines.value.includes(restaurant.cuisineType)
    );
  }

  // Price range filter
  if (priceRange.value !== 'all') {
    filtered = filtered.filter(restaurant => {
      const avgPrice = restaurant.averagePrice || 0;
      switch (priceRange.value) {
        case 'under-100': return avgPrice < 100000;
        case '100-200': return avgPrice >= 100000 && avgPrice <= 200000;
        case '200-500': return avgPrice > 200000 && avgPrice <= 500000;
        case 'over-500': return avgPrice > 500000;
        default: return true;
      }
    });
  }

  // Sort
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'distance':
        return (a.distance || 0) - (b.distance || 0);
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'delivery-time':
        return (a.deliveryTime || 0) - (b.deliveryTime || 0);
      case 'delivery-fee':
        return (a.deliveryFee || 0) - (b.deliveryFee || 0);
      case 'popularity':
        return (b.orderCount || 0) - (a.orderCount || 0);
      default:
        return 0;
    }
  });

  return filtered;
});

// Methods
const initializeMap = async () => {
  try {
    mapLoading.value = true;

    if (!window.google || !window.google.maps) {
      throw new Error('Google Maps API not loaded');
    }

    // Create map
    const mapOptions = {
      zoom: 14,
      center: userLocation.value,
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

    // Add user location marker
    addUserLocationMarker();

    // Load restaurants
    await loadRestaurants();

    mapLoading.value = false;
  } catch (error) {
    console.error('Error initializing map:', error);
    mapLoading.value = false;
  }
};

const addUserLocationMarker = () => {
  if (!map.value || !userLocation.value) return;

  if (userMarker.value) {
    userMarker.value.setMap(null);
  }

  userMarker.value = new google.maps.Marker({
    position: userLocation.value,
    map: map.value,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 10,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 3
    },
    title: 'Vị trí của bạn',
    zIndex: 1000
  });
};

const loadRestaurants = async () => {
  try {
    const nearbyRestaurants = await mapService.getNearbyRestaurants(
      userLocation.value,
      searchRadius.value
    );

    // Calculate additional info for each restaurant
    restaurants.value = await Promise.all(
      nearbyRestaurants.map(async (restaurant) => {
        // Calculate distance if not provided
        if (!restaurant.distance && restaurant.lat && restaurant.lng) {
          restaurant.distance = mapService.calculateDistance(
            userLocation.value,
            { lat: restaurant.lat, lng: restaurant.lng }
          );
        }

        // Calculate ETA
        restaurant.eta = mapService.calculateEstimatedDeliveryTime(
          restaurant.distance,
          'preparing'
        );

        // Calculate delivery fee
        try {
          const feeData = await mapService.calculateDeliveryFee(
            restaurant.distance,
            restaurant.id,
            0
          );
          restaurant.deliveryFee = feeData.deliveryFee;
          restaurant.canDeliver = feeData.canDeliver;
        } catch (error) {
          console.error('Error calculating delivery fee:', error);
          restaurant.deliveryFee = 15000; // Default fee
          restaurant.canDeliver = restaurant.distance <= 10;
        }

        return restaurant;
      })
    );

    // Get unique cuisine types for filter
    cuisineTypes.value = [...new Set(restaurants.value.map(r => r.cuisineType).filter(Boolean))];

    // Add restaurant markers to map
    addRestaurantMarkers();
  } catch (error) {
    console.error('Error loading restaurants:', error);
  }
};

const addRestaurantMarkers = () => {
  if (!map.value) return;

  // Clear existing markers
  restaurantMarkers.value.forEach(marker => marker.setMap(null));
  restaurantMarkers.value = [];

  // Add new markers
  filteredRestaurants.value.forEach(restaurant => {
    if (!restaurant.lat || !restaurant.lng) return;

    const marker = new google.maps.Marker({
      position: { lat: restaurant.lat, lng: restaurant.lng },
      map: map.value,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: restaurant.canDeliver ? '#FF5722' : '#9E9E9E',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      },
      title: restaurant.name,
      zIndex: 100
    });

    // Add click listener
    marker.addListener('click', () => {
      selectRestaurant(restaurant);
    });

    restaurantMarkers.value.push(marker);
  });

  // Fit bounds to show all markers
  if (restaurantMarkers.value.length > 0) {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userLocation.value);
    restaurantMarkers.value.forEach(marker => {
      bounds.extend(marker.getPosition());
    });
    map.value.fitBounds(bounds, 50);
  }
};

const addDeliveryZones = async () => {
  if (!map.value || !selectedRestaurant.value) return;

  // Clear existing zones
  clearDeliveryZones();

  try {
    const zonesData = await mapService.getRestaurantDeliveryZones(selectedRestaurant.value.id);
    
    zonesData.zones.forEach(zone => {
      const circle = new google.maps.Circle({
        strokeColor: zone.color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: zone.color,
        fillOpacity: 0.15,
        map: map.value,
        center: { 
          lat: selectedRestaurant.value.lat, 
          lng: selectedRestaurant.value.lng 
        },
        radius: zone.maxDistance * 1000 // Convert to meters
      });
      
      deliveryZoneCircles.value.push(circle);
    });
  } catch (error) {
    console.error('Error adding delivery zones:', error);
  }
};

const clearDeliveryZones = () => {
  deliveryZoneCircles.value.forEach(circle => circle.setMap(null));
  deliveryZoneCircles.value = [];
};

const selectRestaurant = async (restaurant) => {
  selectedRestaurant.value = restaurant;

  // Calculate detailed ETA
  selectedRestaurantETA.value = mapService.formatEstimatedTime(restaurant.eta);
  selectedRestaurantFee.value = restaurant.deliveryFee;
  canDeliverToUser.value = restaurant.canDeliver;

  // Show delivery zones if enabled
  if (showDeliveryZones.value) {
    await addDeliveryZones();
  }

  // Center map on restaurant
  if (map.value && restaurant.lat && restaurant.lng) {
    map.value.setCenter({ lat: restaurant.lat, lng: restaurant.lng });
    map.value.setZoom(16);
  }
};

const centerOnUserLocation = async () => {
  try {
    const location = await mapService.getCurrentLocation();
    userLocation.value = location;
    addUserLocationMarker();
    if (map.value) {
      map.value.setCenter(location);
      map.value.setZoom(15);
    }
    await loadRestaurants();
  } catch (error) {
    console.error('Error getting user location:', error);
  }
};

const navigateToRestaurant = (restaurant) => {
  navigationDestination.value = {
    lat: restaurant.lat,
    lng: restaurant.lng,
    name: restaurant.name,
    address: restaurant.address
  };
  showNavigation.value = true;
};

const goToRestaurant = (restaurant) => {
  router.push(`/restaurant/${restaurant.id}`);
};

const callRestaurant = (restaurant) => {
  if (restaurant.phone) {
    window.open(`tel:${restaurant.phone}`);
  }
};

const getDirectionsToRestaurant = (restaurant) => {
  const url = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.value.lat},${userLocation.value.lng}&destination=${restaurant.lat},${restaurant.lng}&travelmode=driving`;
  window.open(url, '_blank');
};

const toggleDeliveryZones = () => {
  if (showDeliveryZones.value && selectedRestaurant.value) {
    addDeliveryZones();
  } else {
    clearDeliveryZones();
  }
};

// Event handlers
const onRadiusChange = () => {
  loadRestaurants();
};

const onViewModeChange = () => {
  if (viewMode.value === 'map') {
    nextTick(() => {
      if (map.value) {
        google.maps.event.trigger(map.value, 'resize');
      }
    });
  }
};

const onSearchChange = () => {
  // Debounce search
  clearTimeout(onSearchChange.timer);
  onSearchChange.timer = setTimeout(() => {
    addRestaurantMarkers();
  }, 300);
};

const onFiltersChange = () => {
  addRestaurantMarkers();
};

// Lifecycle
onMounted(async () => {
  // Try to get user's current location
  try {
    const location = await mapService.getCurrentLocation();
    userLocation.value = location;
  } catch (error) {
    console.log('Using default location');
  }

  await nextTick();
  await initializeMap();
});

onUnmounted(() => {
  // Cleanup
  clearDeliveryZones();
  restaurantMarkers.value.forEach(marker => marker.setMap(null));
});

// Watchers
watch(() => userLocation.value, () => {
  addUserLocationMarker();
  loadRestaurants();
}, { deep: true });
</script>

<style scoped>
.enhanced-restaurant-map {
  height: 100%;
}

.map-container {
  border-radius: 12px;
  overflow: hidden;
}

.content-section {
  position: relative;
}

.map-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
}

.enhanced-map {
  width: 100%;
  height: 100%;
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

.location-btn {
  position: absolute;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

.map-legend {
  position: absolute;
  bottom: 20px;
  left: 20px;
  z-index: 100;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.list-wrapper {
  height: 100%;
  overflow-y: auto;
}

.filters-section {
  background: #fafafa;
}

.selected-info {
  background: #f5f5f5;
}
</style>