<template>
  <div class="restaurant-list">
    <v-container>
      <!-- Map View Component -->
      <MapRestaurantView 
        :restaurants="filteredRestaurants"
        :initial-radius="filters.distance || 5"
        @location-updated="handleLocationUpdate"
        @calculate-distances="calculateRestaurantDistances"
      />

      <!-- Filters Section -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card class="filter-card pa-4" elevation="2">
            <v-row>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="filters.search"
                  label="Search restaurants"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:model-value="debounceSearch"
                  clearable
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="3">
                <v-select
                  v-model="filters.cuisine"
                  :items="cuisineOptions"
                  label="Cuisine"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:model-value="applyFilters"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="3">
                <v-select
                  v-model="filters.sortBy"
                  :items="sortOptions"
                  label="Sort by"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:model-value="applyFilters"
                ></v-select>
              </v-col>
              <v-col cols="12" sm="2">
                <v-btn 
                  color="primary" 
                  block 
                  @click="applyFilters"
                  :loading="loading"
                >
                  Filter
                </v-btn>
              </v-col>
            </v-row>

            <!-- Additional Filters -->
            <v-expand-transition>
              <v-row v-if="showAdvancedFilters" class="mt-4">
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="filters.rating"
                    :items="ratingOptions"
                    label="Minimum Rating"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    @update:model-value="applyFilters"
                    clearable
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="filters.deliveryTime"
                    :items="deliveryTimeOptions"
                    label="Delivery Time"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    @update:model-value="applyFilters"
                    clearable
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="filters.distance"
                    :items="distanceOptions"
                    label="Distance"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    :disabled="!userLocation"
                    @update:model-value="applyFilters"
                    clearable
                  >
                    <template v-slot:prepend-inner>
                      <v-icon :color="userLocation ? 'primary' : 'grey'" size="small">
                        mdi-map-marker
                      </v-icon>
                    </template>
                  </v-select>
                </v-col>
                <v-col cols="12" sm="3">
                  <v-select
                    v-model="filters.priceRange"
                    :items="priceRangeOptions"
                    label="Price Range"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    @update:model-value="applyFilters"
                    clearable
                  ></v-select>
                </v-col>
              </v-row>
            </v-expand-transition>

            <v-row class="mt-2">
              <v-col cols="12" class="d-flex justify-space-between align-center">
                <v-btn
                  variant="text"
                  size="small"
                  @click="showAdvancedFilters = !showAdvancedFilters"
                >
                  {{ showAdvancedFilters ? 'Hide' : 'Show' }} advanced filters
                  <v-icon right>
                    {{ showAdvancedFilters ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                  </v-icon>
                </v-btn>
                <v-btn
                  v-if="hasActiveFilters"
                  variant="text"
                  size="small"
                  color="error"
                  @click="clearFilters"
                >
                  <v-icon left size="small">mdi-close</v-icon>
                  Clear filters
                </v-btn>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>

      <!-- Featured Categories (Food Types) -->
      <v-row class="mb-4">
        <v-col cols="12">
          <h2 class="text-h5 mb-4">Explore by Food Category</h2>
          <div class="categories-container">
            <v-sheet class="d-flex flex-nowrap overflow-x-auto pb-2" elevation="0">
              <v-card
                v-for="category in featuredCategories"
                :key="category.id"
                class="ma-2 category-card"
                width="140"
                height="120"
                @click="selectCategory(category)"
                :color="activeCategory?.id === category.id ? 'primary' : undefined"
              >
                <v-img
                  :src="category.image_url || '/images/category-placeholder.jpg'"
                  height="80"
                  cover
                  class="category-image"
                  :class="{ 'greyscale': activeCategory && activeCategory.id !== category.id }"
                ></v-img>
                <v-card-title class="pa-2 text-center text-subtitle-2 text-truncate" 
                  :class="{ 'text-white': activeCategory?.id === category.id }">
                  {{ category.name }}
                </v-card-title>
              </v-card>
            </v-sheet>
          </div>
        </v-col>
      </v-row>

      <!-- Loading State -->
      <v-row v-if="loading">
        <v-col cols="12" class="text-center">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
        </v-col>
      </v-row>

      <!-- No Results -->
      <v-row v-else-if="filteredRestaurants.length === 0">
        <v-col cols="12" class="text-center">
          <v-alert
            type="info"
            title="No restaurants found"
            text="Try adjusting your filters or search criteria"
          >
            <template v-slot:append>
              <v-btn color="info" variant="text" @click="clearFilters">Clear Filters</v-btn>
            </template>
          </v-alert>
        </v-col>
      </v-row>

      <!-- Restaurant Grid -->
      <v-row v-else>
        <v-col cols="12">
          <div class="d-flex justify-space-between align-center mb-4">
            <h2 class="text-h5">
              {{ activeCategory ? `${activeCategory.name} Restaurants` : 'All Restaurants' }}
            </h2>
            <div class="restaurant-count text-subtitle-1">
              {{ filteredRestaurants.length }} {{ filteredRestaurants.length === 1 ? 'restaurant' : 'restaurants' }} found
            </div>
          </div>
        </v-col>

        <v-col
          v-for="restaurant in filteredRestaurants"
          :key="restaurant.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            class="restaurant-card h-100"
            elevation="2"
            @click="viewRestaurant(restaurant.id)"
          >
            <v-img
              :src="restaurant.logo ? `${baseUrl}/uploads/restaurants/${restaurant.logo}` : '/images/restaurant-placeholder.jpg'"
              height="200"
              cover
              class="restaurant-image"
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
                </v-row>
              </template>
              
              <!-- Delivery time badge -->
              <div class="delivery-badge">
                <v-chip
                  color="white"
                  label
                  size="small"
                  class="font-weight-medium"
                >
                  {{ restaurant.estimatedDeliveryTime || '30-45' }} min
                </v-chip>
              </div>
              
              <!-- Distance badge (if available) -->
              <div v-if="restaurant.distance" class="distance-badge">
                <v-chip
                  color="info"
                  label
                  size="small"
                  class="font-weight-medium"
                >
                  {{ formatDistance(restaurant.distance) }}
                </v-chip>
              </div>
            </v-img>

            <v-card-title class="text-truncate">{{ restaurant.name }}</v-card-title>
            
            <v-card-subtitle>
              <div class="d-flex align-center">
                <v-rating
                  :model-value="restaurant.rating"
                  color="amber"
                  density="compact"
                  half-increments
                  readonly
                  size="small"
                ></v-rating>
                <span class="ml-1">{{ restaurant.rating ? restaurant.rating.toFixed(1) : '0.0' }}</span>
                
                <!-- Display price range if available -->
                <v-spacer></v-spacer>
                <span class="text-caption">
                  {{ getPriceRangeSymbol(restaurant.priceRange) }}
                </span>
              </div>
            </v-card-subtitle>
            
            <v-card-text>
              <div class="text-truncate mb-2">
                <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                {{ restaurant.address }}
              </div>
              <div class="d-flex align-center">
                <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                <span v-if="restaurant.isActive">Open</span>
                <span v-else class="text-red">Closed</span>
                <v-spacer></v-spacer>
                <v-chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  class="ml-2"
                >
                  {{ restaurant.cuisineType || 'Various' }}
                </v-chip>
              </div>
            </v-card-text>
            
            <v-card-actions>
              <v-btn
                variant="text"
                color="primary"
                @click.stop="viewRestaurant(restaurant.id)"
              >
                View Menu
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                icon
                variant="text"
                @click.stop="toggleFavorite(restaurant)"
              >
                <v-icon>
                  {{ isFavorite(restaurant.id) ? 'mdi-heart' : 'mdi-heart-outline' }}
                </v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <!-- Pagination -->
      <v-row v-if="filteredRestaurants.length > 0 && pagination.totalPages > 1">
        <v-col cols="12" class="text-center">
          <v-pagination
            v-model="pagination.page"
            :length="pagination.totalPages"
            @update:model-value="changePage"
            rounded="circle"
          ></v-pagination>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { computed, ref, watch, onMounted } from 'vue';
import MapRestaurantView from './MapRestaurantView.vue';
import { useMapService } from '@/composables/useMapService';
import { useRestaurantSearch } from '@/composables/useRestaurantSearch';
import debounce from 'lodash/debounce';
import { API_URL } from '@/config';

export default {
  name: 'RestaurantList',
  
  components: {
    MapRestaurantView
  },
  
  setup() {
    const {
      calculateDistance,
      formatDistance
    } = useMapService();
    
    const {
      cuisineOptions,
      sortOptions,
      ratingOptions,
      deliveryTimeOptions,
      distanceOptions,
      priceRangeOptions
    } = useRestaurantSearch();
    
    const filters = ref({
      search: '',
      cuisine: null,
      sortBy: 'rating',
      rating: null,
      deliveryTime: null,
      distance: null,
      priceRange: null
    });
    
    const pagination = ref({
      page: 1,
      limit: 12,
      totalPages: 1
    });
    
    const showAdvancedFilters = ref(false);
    const activeCategory = ref(null);
    const userLocation = ref(null);
    
    const hasActiveFilters = computed(() => {
      return filters.value.search || 
        filters.value.cuisine || 
        filters.value.rating || 
        filters.value.deliveryTime || 
        filters.value.distance || 
        filters.value.priceRange ||
        activeCategory.value;
    });
    
    const getPriceRangeSymbol = (priceRange) => {
      if (!priceRange) return '';
      
      switch(priceRange) {
        case 'low': return '$';
        case 'medium': return '$$';
        case 'high': return '$$$';
        default: return priceRange; 
      }
    };
    
    // Create debounced search function
    const debounceSearch = debounce(() => {
      applyFilters();
    }, 500);
    
    return {
      // Exposing values from composables
      filters,
      pagination,
      cuisineOptions,
      sortOptions,
      ratingOptions,
      deliveryTimeOptions,
      distanceOptions,
      priceRangeOptions,
      calculateDistance,
      formatDistance,
      
      // Local state
      showAdvancedFilters,
      activeCategory,
      userLocation,
      hasActiveFilters,
      getPriceRangeSymbol,
      debounceSearch,
      baseUrl: API_URL
    };
  },
  
  data() {
    return {
      loading: false
    };
  },
  
  computed: {
    ...mapState({
      restaurants: state => state.restaurants.restaurants,
      totalRestaurants: state => state.restaurants.totalRestaurants,
      userFavorites: state => state.auth.favorites || [],
      categories: state => state.categories.categories || [],
      storeUserLocation: state => state.restaurants.userLocation
    }),
    
    filteredRestaurants() {
      return this.restaurants;
    },
    
    featuredCategories() {
      // Return a subset of categories to display as featured
      return this.categories.filter(cat => cat.featured).slice(0, 10);
    }
  },
  
  methods: {
    ...mapActions({
      fetchRestaurants: 'restaurants/fetchRestaurants',
      fetchCategories: 'categories/fetchCategories',
      addFavorite: 'user/addFavorite',
      removeFavorite: 'user/removeFavorite',
      setUserLocation: 'restaurants/setUserLocation'
    }),
    
    async applyFilters() {
      this.loading = true;
      this.pagination.page = 1;
      
      try {
        await this.fetchRestaurants({
          page: this.pagination.page,
          limit: this.pagination.limit,
          search: this.filters.search,
          cuisine: this.filters.cuisine,
          category_id: this.activeCategory?.id,
          sortBy: this.filters.sortBy,
          minRating: this.filters.rating,
          maxDeliveryTime: this.filters.deliveryTime,
          maxDistance: this.filters.distance,
          priceRange: this.filters.priceRange,
          latitude: this.userLocation?.lat,
          longitude: this.userLocation?.lng,
        });
        
        this.pagination.totalPages = Math.ceil(this.totalRestaurants / this.pagination.limit);
      } catch (error) {
        console.error('Error applying filters:', error);
      } finally {
        this.loading = false;
      }
    },
    
    clearFilters() {
      this.filters.search = '';
      this.filters.cuisine = null;
      this.filters.rating = null;
      this.filters.deliveryTime = null;
      this.filters.distance = null;
      this.filters.priceRange = null;
      this.activeCategory = null;
      
      this.applyFilters();
    },
    
    async changePage(page) {
      this.loading = true;
      
      try {
        await this.fetchRestaurants({
          page: page,
          limit: this.pagination.limit,
          search: this.filters.search,
          cuisine: this.filters.cuisine,
          category_id: this.activeCategory?.id,
          sortBy: this.filters.sortBy,
          minRating: this.filters.rating,
          maxDeliveryTime: this.filters.deliveryTime,
          maxDistance: this.filters.distance,
          priceRange: this.filters.priceRange,
          latitude: this.userLocation?.lat,
          longitude: this.userLocation?.lng,
        });
      } catch (error) {
        console.error('Error changing page:', error);
      } finally {
        this.loading = false;
      }
    },
    
    viewRestaurant(id) {
      this.$router.push({ name: 'RestaurantDetail', params: { id } });
    },
    
    toggleFavorite(restaurant) {
      if (this.isFavorite(restaurant.id)) {
        this.removeFavorite(restaurant.id);
      } else {
        this.addFavorite(restaurant);
      }
    },
    
    isFavorite(restaurantId) {
      return this.userFavorites.some(fav => fav.id === restaurantId);
    },
    
    handleLocationUpdate(location) {
      this.userLocation = location;
      // Store location in Vuex for other components
      this.setUserLocation(location);
      this.applyFilters();
    },
    
    calculateRestaurantDistances(userPosition) {
      // Calculate distance for each restaurant based on user position
      if (!userPosition || !this.restaurants.length) return;
      
      this.restaurants.forEach(restaurant => {
        if (restaurant.latitude && restaurant.longitude) {
          restaurant.distance = this.calculateDistance(
            userPosition,
            {
              lat: parseFloat(restaurant.latitude),
              lng: parseFloat(restaurant.longitude)
            }
          );
        }
      });
      
      // If sorting by distance, re-sort the list
      if (this.filters.sortBy === 'distance') {
        this.applyFilters();
      }
    },
    
    selectCategory(category) {
      // Toggle off if already active
      if (this.activeCategory && this.activeCategory.id === category.id) {
        this.activeCategory = null;
      } else {
        this.activeCategory = category;
      }
      
      this.applyFilters();
    }
  },
  
  watch: {
    // If location changes in store, update local location
    storeUserLocation: {
      handler(newLocation) {
        if (newLocation && (!this.userLocation || 
            newLocation.lat !== this.userLocation.lat || 
            newLocation.lng !== this.userLocation.lng)) {
          this.userLocation = newLocation;
        }
      },
      immediate: true
    }
  },
  
  async mounted() {
    this.loading = true;
    
    try {
      // Fetch categories first
      await this.fetchCategories();
      
      // Check if we have stored user location
      if (this.storeUserLocation) {
        this.userLocation = this.storeUserLocation;
      }
      
      // Then fetch restaurants
      await this.fetchRestaurants({
        page: this.pagination.page,
        limit: this.pagination.limit,
        latitude: this.userLocation?.lat,
        longitude: this.userLocation?.lng
      });
      
      this.pagination.totalPages = Math.ceil(this.totalRestaurants / this.pagination.limit);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      this.loading = false;
    }
  }
};
</script>

<style scoped>
.restaurant-list {
  padding-bottom: 40px;
}

.filter-card {
  border-radius: 8px;
}

.restaurant-card {
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
}

.restaurant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.restaurant-image {
  position: relative;
}

.delivery-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
}

.distance-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
}

.categories-container {
  margin-bottom: 16px;
}

.category-card {
  transition: transform 0.2s;
  cursor: pointer;
  min-width: 140px;
}

.category-card:hover {
  transform: translateY(-3px);
}

.greyscale {
  filter: grayscale(0.8);
}
</style>
