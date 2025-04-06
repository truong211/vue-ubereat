<template>
  <div class="search-page">
    <v-container fluid>
      <!-- Search Header -->
      <v-row class="search-header mb-4">
        <v-col cols="12" md="6" xl="4">
          <h1 class="text-h4 font-weight-bold mb-2">Tìm nhà hàng</h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            Khám phá các nhà hàng gần bạn và tìm món ăn yêu thích
          </p>
        </v-col>
        
        <v-col cols="12" md="6" xl="8">
          <SmartSearch
            @search="handleSearch"
            @item-selected="handleSelectRestaurant"
            class="mb-2"
          />
          
          <div class="d-flex align-center flex-wrap">
            <v-btn
              v-for="(cuisine, index) in popularCuisines"
              :key="index"
              variant="outlined"
              color="primary"
              size="small"
              rounded
              class="mr-2 mb-2"
              @click="addCuisineFilter(cuisine)"
            >
              {{ cuisine }}
            </v-btn>
          </div>
        </v-col>
      </v-row>
      
      <!-- View Mode Tabs -->
      <v-row>
        <v-col cols="12">
          <v-card flat>
            <v-tabs
              v-model="viewMode"
              color="primary"
              align-tabs="center"
              grow
            >
              <v-tab value="list" class="text-none">
                <v-icon class="mr-2">mdi-format-list-bulleted</v-icon>
                Danh sách
              </v-tab>
              <v-tab value="map" class="text-none">
                <v-icon class="mr-2">mdi-map</v-icon>
                Bản đồ
              </v-tab>
            </v-tabs>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Main Content -->
      <v-row>
        <!-- Filters Panel -->
        <v-col cols="12" md="3" xl="2">
          <SearchFilters
            v-model:filters="searchFilters"
            @apply-filters="applyFilters"
            @reset-filters="resetFilters"
          />
        </v-col>
        
        <!-- Results Area -->
        <v-col cols="12" md="9" xl="10">
          <v-window v-model="viewMode">
            <!-- List View -->
            <v-window-item value="list">
              <SearchResults
                :loading="loading"
                :restaurants="filteredRestaurants"
                :total-results="totalResults"
                :sort-by="sortBy"
                :view-mode="resultsViewMode"
                @sort-change="updateSort"
                @view-mode-change="updateResultsViewMode"
                @page-change="changePage"
                @reset-filters="resetFilters"
              />
            </v-window-item>
            
            <!-- Map View -->
            <v-window-item value="map">
              <RestaurantMap
                :restaurants="filteredRestaurants"
                :user-location="userLocation"
                :height="mapHeight"
                @restaurant-selected="handleSelectRestaurant"
                @location-changed="handleLocationChange"
              />
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>
      
      <!-- Selected Restaurant Details Dialog -->
      <v-dialog v-model="showRestaurantDetails" max-width="600">
        <v-card v-if="selectedRestaurant">
          <v-img
            :src="selectedRestaurant.coverImage || selectedRestaurant.thumbnail"
            height="200"
            cover
            class="restaurant-cover"
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-row>
            </template>
          </v-img>
          
          <v-card-title class="pt-4 pb-2">
            {{ selectedRestaurant.name }}
          </v-card-title>
          
          <v-card-subtitle>
            <div class="d-flex align-center">
              <v-rating
                :model-value="selectedRestaurant.rating"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="small"
              ></v-rating>
              <span class="ml-1">({{ selectedRestaurant.reviewCount }})</span>
              <v-divider vertical class="mx-2"></v-divider>
              <span>{{ selectedRestaurant.cuisineType }}</span>
            </div>
          </v-card-subtitle>
          
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-2">mdi-map-marker</v-icon>
                  <span>{{ formatDistance(selectedRestaurant.distance) }}</span>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-2">mdi-clock-outline</v-icon>
                  <span>{{ selectedRestaurant.deliveryTime }} phút</span>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-2">mdi-currency-usd</v-icon>
                  <span>{{ formatPrice(selectedRestaurant.priceRange) }}</span>
                </div>
              </v-col>
              <v-col cols="6">
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-2">mdi-silverware-fork-knife</v-icon>
                  <span>{{ selectedRestaurant.specialOffer ? selectedRestaurant.specialOffer : 'Không có ưu đãi' }}</span>
                </div>
              </v-col>
            </v-row>
            
            <v-divider class="my-3"></v-divider>
            
            <p class="text-body-1">{{ selectedRestaurant.description }}</p>
            
            <div v-if="selectedRestaurant.popularItems" class="mt-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Món ăn phổ biến</h3>
              <v-chip-group>
                <v-chip
                  v-for="(item, index) in selectedRestaurant.popularItems"
                  :key="index"
                  color="primary"
                  variant="outlined"
                  class="mr-2"
                >
                  {{ item }}
                </v-chip>
              </v-chip-group>
            </div>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              variant="text"
              @click="showRestaurantDetails = false"
            >
              Đóng
            </v-btn>
            <v-btn
              color="primary"
              :to="`/restaurant/${selectedRestaurant.id}`"
            >
              Xem nhà hàng
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDisplay } from 'vuetify';

import SearchFilters from '@/components/search/SearchFilters.vue';
import SmartSearch from '@/components/search/SmartSearch.vue';
import SearchResults from '@/components/search/SearchResults.vue';
import RestaurantMap from '@/components/map/RestaurantMap.vue';
import restaurantAPI from '@/services/restaurantAPI';

// Router
const route = useRoute();
const router = useRouter();

// Display
const { height, name } = useDisplay();

// State
const viewMode = ref('list');
const resultsViewMode = ref('grid');
const loading = ref(true);
const error = ref(null);
const restaurants = ref([]);
const filteredRestaurants = ref([]);
const searchFilters = ref({
  cuisines: [],
  price: [50000, 300000],
  rating: 0,
  distance: 5,
  deliveryTime: null,
  specialOffers: false
});
const selectedRestaurant = ref(null);
const showRestaurantDetails = ref(false);
const userLocation = ref({ lat: 10.8231, lng: 106.6297 }); // Default to Ho Chi Minh City
const sortBy = ref('rating');
const searchQuery = ref('');
const currentPage = ref(1);
const totalResults = ref(0);

// Popular cuisines for quick filtering
const popularCuisines = [
  'Đồ ăn Việt Nam',
  'Pizza',
  'Burger',
  'Sushi',
  'Đồ ăn Thái',
  'Trà sữa',
  'Bánh Ngọt',
  'Đồ chay'
];

// Computed values
const mapHeight = computed(() => {
  // Responsive map height
  if (name.value === 'xs') return '400px';
  if (name.value === 'sm') return '500px';
  return '700px';
});

// Fetch restaurants
const fetchRestaurants = async () => {
  loading.value = true;
  error.value = null;
  
  try {
    const params = {
      // For the query parameter, use 'search' instead of 'q' to match the backend expectation
      // and ensure it's a string
      search: typeof searchQuery.value === 'string' ? searchQuery.value : '',
      cuisine: searchFilters.value.cuisines.join(','),
      priceRange: searchFilters.value.price.join(','),
      minRating: searchFilters.value.rating,
      sort: sortBy.value,
      page: currentPage.value,
      limit: 10 // Assuming a default limit
    };
    
    // Log the exact params being sent to the API
    console.log('Search parameters:', params);
    
    // Include location coordinates if available
    if (userLocation.value) {
      params.latitude = userLocation.value.lat;
      params.longitude = userLocation.value.lng;
    }
    
    const response = await restaurantAPI.getAllRestaurants(params);
    
    // Check if response.data exists and handle different response formats
    if (response && response.data) {
      // Handle different response formats
      if (Array.isArray(response.data)) {
        restaurants.value = response.data;
        totalResults.value = response.data.length;
      } else if (response.data.restaurants && Array.isArray(response.data.restaurants)) {
        restaurants.value = response.data.restaurants;
        totalResults.value = response.data.total || response.data.restaurants.length;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        restaurants.value = response.data.data;
        totalResults.value = response.data.total || response.data.data.length;
      } else {
        // Fallback to empty array if no valid format is found
        console.warn('Unexpected API response format:', response.data);
        restaurants.value = [];
        totalResults.value = 0;
      }
    } else {
      // Handle case where response or response.data is undefined
      console.warn('No data returned from API');
      restaurants.value = [];
      totalResults.value = 0;
    }
  } catch (err) {
    console.error('Error fetching restaurants:', err);
    error.value = 'Could not load restaurants. Please try again later.';
    // Ensure restaurants.value is always an array even on error
    restaurants.value = [];
    totalResults.value = 0;
  } finally {
    loading.value = false;
  }
};

// Format distance
const formatDistance = (distance) => {
  return `${distance.toFixed(1)} km`;
};

// Format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Handle search
const handleSearch = (query) => {
  searchQuery.value = query;
  applyFilters();
};

// Add cuisine filter
const addCuisineFilter = (cuisine) => {
  if (!searchFilters.value.cuisines.includes(cuisine)) {
    searchFilters.value.cuisines.push(cuisine);
    applyFilters();
  }
};

// Apply filters
const applyFilters = () => {
  loading.value = true;
  
  // Ensure restaurants.value is an array before trying to spread it
  if (!restaurants.value || !Array.isArray(restaurants.value)) {
    console.warn('Restaurants data is not an array:', restaurants.value);
    restaurants.value = [];
  }
  
  // Use a try-catch block to handle any potential issues with the spread operator
  let results = [];
  try {
    results = [...restaurants.value];
  } catch (error) {
    console.error('Error spreading restaurants array:', error);
    results = [];
  }
  
  // Filter by search query
  if (searchQuery.value) {
    // Make sure searchQuery.value is a string before calling toLowerCase()
    const query = typeof searchQuery.value === 'string' 
      ? searchQuery.value.toLowerCase() 
      : String(searchQuery.value).toLowerCase();
    
    results = results.filter(restaurant => 
      restaurant.name.toLowerCase().includes(query) || 
      restaurant.cuisineType.toLowerCase().includes(query)
    );
  }
  
  // Filter by cuisines
  if (searchFilters.value.cuisines.length > 0) {
    results = results.filter(restaurant => 
      restaurant.cuisineType && searchFilters.value.cuisines.includes(restaurant.cuisineType)
    );
  }
  
  // Filter by price range
  results = results.filter(restaurant => 
    restaurant.priceRange && restaurant.priceRange >= searchFilters.value.price[0] && 
    restaurant.priceRange <= searchFilters.value.price[1]
  );
  
  // Filter by rating
  if (searchFilters.value.rating > 0) {
    results = results.filter(restaurant => 
      restaurant.rating && restaurant.rating >= searchFilters.value.rating
    );
  }
  
  // Filter by distance
  results = results.filter(restaurant => 
    restaurant.distance && restaurant.distance <= searchFilters.value.distance
  );
  
  // Filter by delivery time
  if (searchFilters.value.deliveryTime) {
    results = results.filter(restaurant => 
      restaurant.deliveryTime && restaurant.deliveryTime <= searchFilters.value.deliveryTime
    );
  }
  
  // Filter by special offers
  if (searchFilters.value.specialOffers) {
    results = results.filter(restaurant => 
      restaurant.specialOffer !== null && restaurant.specialOffer !== undefined
    );
  }
  
  // Apply sorting
  applySorting(results);
  
  // Update total results
  totalResults.value = results.length;
  
  // Apply pagination in a real app
  // Here we're just setting the filtered results
  filteredRestaurants.value = results;
  
  loading.value = false;
};

// Apply sorting
const applySorting = (results) => {
  switch (sortBy.value) {
    case 'rating':
      results.sort((a, b) => b.rating - a.rating);
      break;
    case 'distance':
      results.sort((a, b) => a.distance - b.distance);
      break;
    case 'deliveryTime':
      results.sort((a, b) => a.deliveryTime - b.deliveryTime);
      break;
    case 'popularity':
      results.sort((a, b) => b.popularity - a.popularity);
      break;
  }
};

// Reset filters
const resetFilters = () => {
  searchFilters.value = {
    cuisines: [],
    price: [50000, 300000],
    rating: 0,
    distance: 5,
    deliveryTime: null,
    specialOffers: false
  };
  searchQuery.value = '';
  applyFilters();
};

// Update sort
const updateSort = (value) => {
  sortBy.value = value;
  applyFilters();
};

// Update results view mode
const updateResultsViewMode = (value) => {
  resultsViewMode.value = value;
};

// Change page
const changePage = (page) => {
  currentPage.value = page;
  // In a real app, you would fetch new data or paginate the current data
};

// Handle restaurant selection
const handleSelectRestaurant = (restaurant) => {
  selectedRestaurant.value = restaurant;
  showRestaurantDetails.value = true;
};

// Handle location change from the map
const handleLocationChange = (location) => {
  userLocation.value = {
    lat: location.lat,
    lng: location.lng
  };
  // In a real app, you might want to refetch data for the new location
};

// Initialize
onMounted(() => {
  // Get user location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userLocation.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        fetchRestaurants();
      },
      (error) => {
        console.error('Error getting user location:', error);
        fetchRestaurants();
      }
    );
  } else {
    fetchRestaurants();
  }
  
  // Set initial filters from URL query parameters
  const query = route.query;
  
  if (query.q) {
    searchQuery.value = query.q;
  }
  
  if (query.cuisines) {
    searchFilters.value.cuisines = Array.isArray(query.cuisines) 
      ? query.cuisines 
      : [query.cuisines];
  }
  
  if (query.rating) {
    searchFilters.value.rating = Number(query.rating);
  }
  
  if (query.sort) {
    sortBy.value = query.sort;
  }
  
  if (query.view) {
    viewMode.value = query.view;
  }
});

// Update URL when filters change
watch(
  [searchQuery, searchFilters, sortBy, viewMode],
  () => {
    // Construct query parameters
    const query = {};
    
    if (searchQuery.value) {
      query.q = searchQuery.value;
    }
    
    if (searchFilters.value.cuisines.length > 0) {
      query.cuisines = searchFilters.value.cuisines;
    }
    
    if (searchFilters.value.rating > 0) {
      query.rating = searchFilters.value.rating;
    }
    
    if (sortBy.value !== 'rating') {
      query.sort = sortBy.value;
    }
    
    if (viewMode.value !== 'list') {
      query.view = viewMode.value;
    }
    
    // Update route
    router.replace({ query });
  },
  { deep: true }
);
</script>

<style scoped>
.search-page {
  min-height: 100vh;
}

.restaurant-cover {
  position: relative;
}

.restaurant-cover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%);
}

@media (max-width: 600px) {
  .search-header {
    text-align: center;
  }
}
</style> 