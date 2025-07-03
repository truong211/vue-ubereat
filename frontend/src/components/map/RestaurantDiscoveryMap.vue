<template>
  <div class="restaurant-discovery-map">
    <v-card :height="mapHeight" class="position-relative">
      <!-- Search Bar -->
      <v-toolbar v-if="showSearchBar" density="compact" color="transparent" class="search-toolbar">
        <v-text-field
          v-model="searchQuery"
          placeholder="Tìm kiếm nhà hàng..."
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          class="mx-4"
          @keyup.enter="searchRestaurants"
          @input="onSearchInput"
        >
          <template v-slot:append-inner>
            <v-btn
              v-if="searchQuery"
              icon="mdi-close"
              variant="text"
              size="small"
              @click="clearSearch"
            ></v-btn>
          </template>
        </v-text-field>
        
        <v-btn
          icon="mdi-filter"
          variant="text"
          @click="showFilters = !showFilters"
          :color="activeFilters ? 'primary' : ''"
        ></v-btn>
        
        <v-btn
          icon="mdi-crosshairs-gps"
          variant="text"
          @click="getCurrentLocation"
          :loading="gettingLocation"
        ></v-btn>
      </v-toolbar>

      <!-- Filter Panel -->
      <v-expand-transition>
        <v-card v-if="showFilters" class="filter-panel ma-4" variant="outlined">
          <v-card-text>
            <v-row dense>
              <v-col cols="6" sm="3">
                <v-select
                  v-model="filters.cuisineType"
                  :items="cuisineTypes"
                  label="Loại ẩm thực"
                  variant="outlined"
                  density="compact"
                  clearable
                  hide-details
                ></v-select>
              </v-col>
              <v-col cols="6" sm="3">
                <v-select
                  v-model="filters.sortBy"
                  :items="sortOptions"
                  label="Sắp xếp theo"
                  variant="outlined"
                  density="compact"
                  hide-details
                ></v-select>
              </v-col>
              <v-col cols="6" sm="3">
                <v-slider
                  v-model="filters.radius"
                  label="Bán kính"
                  :min="1"
                  :max="10"
                  :step="0.5"
                  thumb-label
                  hide-details
                  class="mt-4"
                ></v-slider>
              </v-col>
              <v-col cols="6" sm="3">
                <v-rating
                  v-model="filters.minRating"
                  density="compact"
                  half-increments
                  hover
                  clearable
                ></v-rating>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-expand-transition>

      <!-- Map Container -->
      <div id="discovery-map" class="map-container"></div>

      <!-- Loading Overlay -->
      <div v-if="loading" class="map-loading-overlay">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
        <div class="mt-2">{{ loadingText }}</div>
      </div>

      <!-- Restaurant Info Card -->
      <v-card
        v-if="selectedRestaurant"
        class="restaurant-info-card"
        variant="elevated"
        elevation="8"
      >
        <v-card-title class="d-flex align-center">
          <v-avatar size="40" class="mr-3">
            <v-img :src="selectedRestaurant.thumbnail || '/img/restaurant-placeholder.jpg'"></v-img>
          </v-avatar>
          <div>
            <div class="text-h6">{{ selectedRestaurant.name }}</div>
            <div class="text-caption d-flex align-center">
              <v-rating
                :model-value="selectedRestaurant.rating"
                density="compact"
                readonly
                size="small"
                color="amber"
              ></v-rating>
              <span class="ml-1">({{ selectedRestaurant.reviewCount || 0 }})</span>
            </div>
          </div>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            @click="clearSelection"
          ></v-btn>
        </v-card-title>

        <v-card-text>
          <div class="mb-2">
            <v-chip size="small" color="green" variant="text">
              <v-icon start icon="mdi-clock-outline"></v-icon>
              {{ selectedRestaurant.deliveryTimeRange?.text || 'Đang tính...' }}
            </v-chip>
            <v-chip size="small" color="blue" variant="text" class="ml-2">
              <v-icon start icon="mdi-map-marker-distance"></v-icon>
              {{ selectedRestaurant.distanceText || 'Đang tính...' }}
            </v-chip>
          </div>
          
          <div v-if="selectedRestaurant.cuisineType" class="text-caption mb-2">
            {{ selectedRestaurant.cuisineType }}
          </div>
          
          <div v-if="routeInfo" class="route-info mb-2">
            <v-divider class="mb-2"></v-divider>
            <div class="text-subtitle-2 mb-1">Thông tin chỉ đường</div>
            <div class="d-flex justify-space-between">
              <span>Khoảng cách:</span>
              <span class="font-weight-bold">{{ routeInfo.distanceText }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span>Thời gian di chuyển:</span>
              <span class="font-weight-bold">{{ routeInfo.durationText }}</span>
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-directions"
            @click="showDirections"
            :disabled="!selectedRestaurant"
          >
            Chỉ đường
          </v-btn>
          <v-btn
            color="success"
            :to="`/restaurant/${selectedRestaurant.id}`"
            append-icon="mdi-arrow-right"
          >
            Đặt món
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- Directions Panel -->
      <v-navigation-drawer
        v-model="showDirectionsPanel"
        location="right"
        width="300"
        temporary
        class="directions-panel"
      >
        <v-toolbar density="compact">
          <v-toolbar-title>Chỉ đường</v-toolbar-title>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="hideDirections"
          ></v-btn>
        </v-toolbar>

        <v-card-text v-if="routeDirections">
          <div class="mb-3">
            <div class="text-subtitle-1 font-weight-bold">
              Đến {{ selectedRestaurant?.name }}
            </div>
            <div class="text-caption">
              {{ routeDirections.distanceText }} • {{ routeDirections.durationText }}
            </div>
          </div>

          <v-list density="compact">
            <v-list-item
              v-for="(step, index) in routeDirections.steps"
              :key="index"
              class="px-0"
            >
              <template v-slot:prepend>
                <v-avatar size="24" color="primary">
                  <span class="text-caption">{{ index + 1 }}</span>
                </v-avatar>
              </template>
              <v-list-item-title class="text-wrap text-caption">
                <div v-html="step.instructions"></div>
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ step.distance?.text }} • {{ step.duration?.text }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-navigation-drawer>
    </v-card>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useToast } from 'vue-toastification';
import restaurantDiscoveryService from '@/services/restaurant-discovery.service';
import mapService from '@/services/map.service';

// Props
const props = defineProps({
  mapHeight: {
    type: String,
    default: '500px'
  },
  showSearchBar: {
    type: Boolean,
    default: true
  },
  initialLocation: {
    type: Object,
    default: () => ({ lat: 10.8231, lng: 106.6297 }) // Ho Chi Minh City
  },
  autoDetectLocation: {
    type: Boolean,
    default: true
  }
});

// Emits
const emit = defineEmits(['restaurant-selected', 'location-changed']);

// Composables
const toast = useToast();

// Refs
const map = ref(null);
const userLocation = ref(props.initialLocation);
const searchQuery = ref('');
const loading = ref(true);
const loadingText = ref('Đang tải bản đồ...');
const gettingLocation = ref(false);

// UI State
const showFilters = ref(false);
const selectedRestaurant = ref(null);
const showDirectionsPanel = ref(false);

// Data
const restaurants = ref([]);
const markers = ref([]);
const userMarker = ref(null);
const routeRenderer = ref(null);
const routeInfo = ref(null);
const routeDirections = ref(null);

// Filters
const filters = ref({
  cuisineType: null,
  sortBy: 'distance',
  radius: 5,
  minRating: null
});

// Options
const cuisineTypes = [
  { title: 'Việt Nam', value: 'vietnamese' },
  { title: 'Trung Hoa', value: 'chinese' },
  { title: 'Nhật Bản', value: 'japanese' },
  { title: 'Hàn Quốc', value: 'korean' },
  { title: 'Thái Lan', value: 'thai' },
  { title: 'Ý', value: 'italian' },
  { title: 'Mỹ', value: 'american' },
  { title: 'Fastfood', value: 'fastfood' }
];

const sortOptions = [
  { title: 'Khoảng cách', value: 'distance' },
  { title: 'Đánh giá', value: 'rating' },
  { title: 'Thời gian giao hàng', value: 'deliveryTime' },
  { title: 'Phí giao hàng', value: 'deliveryFee' }
];

// Computed
const activeFilters = computed(() => {
  return filters.value.cuisineType || 
         filters.value.minRating || 
         filters.value.radius !== 5;
});

// Methods
const initMap = async () => {
  try {
    loading.value = true;
    loadingText.value = 'Đang tải bản đồ...';

    // Initialize map service
    await mapService.initialize();

    // Create map
    map.value = new google.maps.Map(document.getElementById('discovery-map'), {
      center: userLocation.value,
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    // Get user location if auto-detect is enabled
    if (props.autoDetectLocation) {
      await getCurrentLocation();
    }

    // Add user marker
    addUserMarker();

    // Load nearby restaurants
    await loadNearbyRestaurants();

    loading.value = false;
  } catch (error) {
    console.error('Error initializing map:', error);
    toast.error('Không thể tải bản đồ');
    loading.value = false;
  }
};

const getCurrentLocation = async () => {
  if (!navigator.geolocation) {
    toast.error('Trình duyệt không hỗ trợ định vị');
    return;
  }

  gettingLocation.value = true;
  
  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });

    userLocation.value = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };

    if (map.value) {
      map.value.setCenter(userLocation.value);
      addUserMarker();
      await loadNearbyRestaurants();
    }

    emit('location-changed', userLocation.value);
  } catch (error) {
    console.error('Error getting location:', error);
    toast.warning('Không thể lấy vị trí hiện tại');
  } finally {
    gettingLocation.value = false;
  }
};

const addUserMarker = () => {
  if (userMarker.value) {
    userMarker.value.setMap(null);
  }

  userMarker.value = new google.maps.Marker({
    position: userLocation.value,
    map: map.value,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 8,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2
    },
    title: 'Vị trí của bạn',
    zIndex: 1000
  });
};

const loadNearbyRestaurants = async () => {
  try {
    loadingText.value = 'Đang tìm nhà hàng gần đây...';
    
    const options = {
      radius: filters.value.radius,
      cuisineType: filters.value.cuisineType,
      sortBy: filters.value.sortBy,
      rating: filters.value.minRating
    };

    restaurants.value = await restaurantDiscoveryService.findNearbyRestaurants(
      userLocation.value,
      options
    );

    addRestaurantMarkers();
  } catch (error) {
    console.error('Error loading restaurants:', error);
    toast.error('Không thể tải danh sách nhà hàng');
  }
};

const addRestaurantMarkers = () => {
  // Clear existing markers
  markers.value.forEach(marker => marker.setMap(null));
  markers.value = [];

  // Add new markers
  restaurants.value.forEach(restaurant => {
    const marker = new google.maps.Marker({
      position: { lat: restaurant.latitude, lng: restaurant.longitude },
      map: map.value,
      icon: {
        url: '/img/restaurant-marker.png',
        scaledSize: new google.maps.Size(32, 32)
      },
      title: restaurant.name
    });

    marker.addListener('click', () => {
      selectRestaurant(restaurant);
    });

    markers.value.push(marker);
  });

  // Fit bounds to show all markers
  if (markers.value.length > 0) {
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(userLocation.value);
    markers.value.forEach(marker => bounds.extend(marker.getPosition()));
    map.value.fitBounds(bounds);
  }
};

const selectRestaurant = async (restaurant) => {
  selectedRestaurant.value = restaurant;
  emit('restaurant-selected', restaurant);

  // Calculate route to restaurant
  try {
    const route = await mapService.getRoute(
      userLocation.value,
      { lat: restaurant.latitude, lng: restaurant.longitude }
    );
    
    routeInfo.value = route;
    
    // Display route on map
    displayRoute(route);
  } catch (error) {
    console.error('Error calculating route:', error);
  }
};

const displayRoute = (route) => {
  // Clear existing route
  if (routeRenderer.value) {
    routeRenderer.value.setMap(null);
  }

  // Create polyline for route
  routeRenderer.value = new google.maps.Polyline({
    path: route.points,
    geodesic: true,
    strokeColor: '#4285F4',
    strokeOpacity: 1.0,
    strokeWeight: 3
  });

  routeRenderer.value.setMap(map.value);
};

const showDirections = async () => {
  if (!selectedRestaurant.value) return;

  try {
    const route = await mapService.getRoute(
      userLocation.value,
      { lat: selectedRestaurant.value.latitude, lng: selectedRestaurant.value.longitude }
    );
    
    routeDirections.value = route;
    showDirectionsPanel.value = true;
  } catch (error) {
    console.error('Error getting directions:', error);
    toast.error('Không thể lấy thông tin chỉ đường');
  }
};

const hideDirections = () => {
  showDirectionsPanel.value = false;
};

const clearSelection = () => {
  selectedRestaurant.value = null;
  routeInfo.value = null;
  
  if (routeRenderer.value) {
    routeRenderer.value.setMap(null);
  }
};

const searchRestaurants = async () => {
  if (!searchQuery.value.trim()) {
    await loadNearbyRestaurants();
    return;
  }

  try {
    loadingText.value = 'Đang tìm kiếm...';
    loading.value = true;

    const results = await restaurantDiscoveryService.searchRestaurants(
      searchQuery.value,
      userLocation.value,
      {
        radius: filters.value.radius,
        sortBy: filters.value.sortBy
      }
    );

    restaurants.value = results;
    addRestaurantMarkers();
  } catch (error) {
    console.error('Error searching restaurants:', error);
    toast.error('Không thể tìm kiếm nhà hàng');
  } finally {
    loading.value = false;
  }
};

const onSearchInput = () => {
  // Debounce search
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim()) {
      searchRestaurants();
    }
  }, 500);
};

const clearSearch = () => {
  searchQuery.value = '';
  loadNearbyRestaurants();
};

let searchTimeout;

// Watchers
watch(filters, async () => {
  await loadNearbyRestaurants();
}, { deep: true });

// Lifecycle
onMounted(() => {
  initMap();
});

onUnmounted(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});
</script>

<style scoped>
.restaurant-discovery-map {
  position: relative;
  width: 100%;
  height: 100%;
}

.map-container {
  width: 100%;
  height: 100%;
}

.search-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
}

.filter-panel {
  position: absolute;
  top: 64px;
  left: 0;
  right: 0;
  z-index: 9;
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
  background: rgba(255, 255, 255, 0.8);
  z-index: 20;
}

.restaurant-info-card {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  z-index: 10;
  max-width: 400px;
}

.directions-panel {
  z-index: 15;
}

.route-info {
  background: rgba(66, 133, 244, 0.1);
  border-radius: 8px;
  padding: 8px;
}

@media (max-width: 600px) {
  .restaurant-info-card {
    bottom: 8px;
    left: 8px;
    right: 8px;
  }
}
</style>