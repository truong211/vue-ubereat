<template>
  <div class="restaurant-list">
    <v-container>
      <!-- Map View Component -->
      <MapRestaurantView 
        :restaurants="filteredRestaurants"
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
                  @input="applyFilters"
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
                    @update:model-value="applyFilters"
                  ></v-select>
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
                  ></v-select>
                </v-col>
              </v-row>
            </v-expand-transition>

            <v-row class="mt-2">
              <v-col cols="12" class="text-center">
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
              >
                <v-img
                  :src="category.image_url || '/images/category-placeholder.jpg'"
                  height="80"
                  cover
                  class="category-image"
                ></v-img>
                <v-card-title class="pa-2 text-center text-subtitle-2 text-truncate">
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
          ></v-alert>
        </v-col>
      </v-row>

      <!-- Restaurant Grid -->
      <v-row v-else>
        <v-col cols="12">
          <h2 class="text-h5 mb-4">
            {{ activeCategory ? `${activeCategory.name} Restaurants` : 'All Restaurants' }}
          </h2>
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
              :src="restaurant.image_url || '/images/restaurant-placeholder.jpg'"
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
                  {{ restaurant.delivery_time || '30-45' }} min
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
                <span class="ml-1">{{ restaurant.rating.toFixed(1) }}</span>
                
                <!-- Display distance if available -->
                <v-spacer></v-spacer>
                <span v-if="restaurant.distance" class="text-caption">
                  {{ formatDistance(restaurant.distance) }}
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
                <span v-if="restaurant.status === 'active'">Open</span>
                <span v-else class="text-red">Closed</span>
                <v-spacer></v-spacer>
                <v-chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  class="ml-2"
                >
                  {{ restaurant.cuisine || 'Various' }}
                </v-chip>
              </div>
            </v-card-text>
            
            <!-- Popular items section (if available) -->
            <v-divider v-if="restaurant.popular_items && restaurant.popular_items.length"></v-divider>
            <v-card-text v-if="restaurant.popular_items && restaurant.popular_items.length" class="pt-2">
              <p class="text-body-2 text-grey mb-2">Popular Items:</p>
              <div class="popular-items text-caption">
                {{ formatPopularItems(restaurant.popular_items) }}
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
      <v-row v-if="filteredRestaurants.length > 0">
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
import MapRestaurantView from './MapRestaurantView.vue';
import { useMapService } from '@/composables/useMapService';
import { useRestaurantSearch } from '@/composables/useRestaurantSearch';

export default {
  name: 'RestaurantList',
  
  components: {
    MapRestaurantView
  },
  
  setup() {
    const { calculateDistance } = useMapService();
    const { searchRestaurants } = useRestaurantSearch();
    
    return {
      calculateDistance,
      searchRestaurants
    };
  },
  
  data() {
    return {
      loading: false,
      showAdvancedFilters: false,
      userLocation: null,
      activeCategory: null,
      filters: {
        search: '',
        cuisine: null,
        sortBy: 'rating',
        rating: null,
        deliveryTime: null,
        distance: null,
        priceRange: null
      },
      pagination: {
        page: 1,
        limit: 12,
        totalPages: 1
      },
      cuisineOptions: [
        { title: 'All Cuisines', value: null },
        { title: 'Italian', value: 'Italian' },
        { title: 'Chinese', value: 'Chinese' },
        { title: 'Japanese', value: 'Japanese' },
        { title: 'Mexican', value: 'Mexican' },
        { title: 'Indian', value: 'Indian' },
        { title: 'Thai', value: 'Thai' },
        { title: 'American', value: 'American' },
        { title: 'Fast Food', value: 'Fast Food' }
      ],
      sortOptions: [
        { title: 'Rating (High to Low)', value: 'rating' },
        { title: 'Name (A-Z)', value: 'name_asc' },
        { title: 'Name (Z-A)', value: 'name_desc' },
        { title: 'Distance (Near to Far)', value: 'distance' },
        { title: 'Delivery Time (Fast to Slow)', value: 'delivery_time' }
      ],
      ratingOptions: [
        { title: 'Any Rating', value: null },
        { title: '4.5+', value: 4.5 },
        { title: '4.0+', value: 4.0 },
        { title: '3.5+', value: 3.5 },
        { title: '3.0+', value: 3.0 }
      ],
      deliveryTimeOptions: [
        { title: 'Any Time', value: null },
        { title: 'Under 30 min', value: 30 },
        { title: 'Under 45 min', value: 45 },
        { title: 'Under 60 min', value: 60 }
      ],
      distanceOptions: [
        { title: 'Any Distance', value: null },
        { title: 'Under 1 km', value: 1 },
        { title: 'Under 3 km', value: 3 },
        { title: 'Under 5 km', value: 5 },
        { title: 'Under 10 km', value: 10 }
      ],
      priceRangeOptions: [
        { title: 'Any Price', value: null },
        { title: '$', value: 'low' },
        { title: '$$', value: 'medium' },
        { title: '$$$', value: 'high' }
      ],
      favorites: []
    };
  },
  
  computed: {
    ...mapState({
      restaurants: state => state.restaurants.restaurants,
      totalRestaurants: state => state.restaurants.totalRestaurants,
      userFavorites: state => state.user.favorites || [],
      categories: state => state.categories.categories || []
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
      removeFavorite: 'user/removeFavorite'
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
          min_rating: this.filters.rating,
          max_delivery_time: this.filters.deliveryTime,
          max_distance: this.filters.distance,
          price_range: this.filters.priceRange,
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
          min_rating: this.filters.rating,
          max_delivery_time: this.filters.deliveryTime,
          max_distance: this.filters.distance,
          price_range: this.filters.priceRange,
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
    
    formatDistance(distance) {
      if (!distance) return '';
      
      if (distance < 1) {
        // Convert to meters if less than 1km
        return `${Math.round(distance * 1000)}m away`;
      }
      
      return `${distance.toFixed(1)}km away`;
    },
    
    formatPopularItems(items) {
      if (!items || !items.length) return '';
      
      // Show maximum 3 popular items
      const displayItems = items.slice(0, 3);
      return displayItems.map(item => item.name).join(', ');
    },
    
    selectCategory(category) {
      this.activeCategory = category;
      this.applyFilters();
    }
  },
  
  async mounted() {
    this.loading = true;
    
    try {
      // Fetch categories first
      await this.fetchCategories();
      
      // Then fetch restaurants
      await this.fetchRestaurants({
        page: this.pagination.page,
        limit: this.pagination.limit
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

.popular-items {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #757575;
}
</style>
