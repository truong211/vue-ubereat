<template>
  <div class="restaurant-list">
    <v-container>
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
          </v-card>
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
            </v-img>

            <v-card-title class="text-truncate">{{ restaurant.name }}</v-card-title>
            
            <v-card-subtitle>
              <v-rating
                :model-value="restaurant.rating"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="small"
              ></v-rating>
              <span class="ml-1">{{ restaurant.rating.toFixed(1) }}</span>
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

export default {
  name: 'RestaurantList',
  
  data() {
    return {
      loading: false,
      filters: {
        search: '',
        cuisine: null,
        sortBy: 'rating'
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
        { title: 'Distance', value: 'distance' }
      ],
      favorites: []
    };
  },
  
  computed: {
    ...mapState({
      restaurants: state => state.restaurant.restaurants,
      totalRestaurants: state => state.restaurant.totalRestaurants,
      userFavorites: state => state.user.favorites || []
    }),
    
    filteredRestaurants() {
      return this.restaurants;
    }
  },
  
  methods: {
    ...mapActions({
      fetchRestaurants: 'restaurant/fetchRestaurants',
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
          sortBy: this.filters.sortBy
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
          sortBy: this.filters.sortBy
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
    }
  },
  
  async mounted() {
    this.loading = true;
    
    try {
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
</style>
