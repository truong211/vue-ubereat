<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1>Order food to your door</h1>
        <div class="search-bar">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search for restaurants or food"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="comfortable"
            hide-details
            @keyup.enter="searchRestaurants"
          ></v-text-field>
          <v-btn color="primary" @click="searchRestaurants">Search</v-btn>
        </div>
      </div>
    </section>
    
    <!-- Filter Section -->
    <section class="filter-section">
      <div class="container">
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.category"
              :items="categories"
              label="Category"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.sortBy"
              :items="sortOptions"
              label="Sort By"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.priceRange"
              :items="priceRanges"
              label="Price Range"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="3" class="d-flex align-center">
            <v-checkbox
              v-model="filters.onlyOpen"
              label="Open Now"
              hide-details
            ></v-checkbox>
          </v-col>
        </v-row>
      </div>
    </section>
    
    <!-- Restaurants Section -->
    <section class="restaurants-section">
      <div class="container">
        <h2>Restaurants Near You</h2>
        
        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p>Loading restaurants...</p>
        </div>
        
        <!-- Error State -->
        <v-alert
          v-else-if="error"
          type="error"
          title="Error"
          text="Failed to load restaurants. Please try again."
          class="mb-4"
        ></v-alert>
        
        <!-- No Results -->
        <v-alert
          v-else-if="filteredRestaurants.length === 0"
          type="info"
          title="No Results"
          text="No restaurants found matching your criteria."
          class="mb-4"
        ></v-alert>
        
        <!-- Restaurant Cards -->
        <v-row v-else>
          <v-col
            v-for="restaurant in filteredRestaurants"
            :key="restaurant.id"
            cols="12" sm="6" md="4" lg="3"
          >
            <v-card
              class="restaurant-card"
              :to="{ name: 'RestaurantDetail', params: { id: restaurant.id }}"
            >
              <v-img
                :src="restaurant.image_url || '/img/restaurant-placeholder.jpg'"
                height="160"
                cover
                class="restaurant-image"
              >
                <template v-slot:placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
                  </v-row>
                </template>
              </v-img>
              
              <v-card-text>
                <div class="d-flex justify-space-between align-center">
                  <h3 class="restaurant-name">{{ restaurant.name }}</h3>
                  <div class="rating">
                    <v-icon color="amber">mdi-star</v-icon>
                    <span>{{ restaurant.rating.toFixed(1) }}</span>
                  </div>
                </div>
                
                <p class="restaurant-description">{{ truncateText(restaurant.description, 60) }}</p>
                
                <div class="restaurant-details">
                  <div class="detail">
                    <v-icon size="small">mdi-map-marker</v-icon>
                    <span>{{ truncateText(restaurant.address, 20) }}</span>
                  </div>
                  
                  <div class="detail">
                    <v-icon size="small">mdi-clock-outline</v-icon>
                    <span>{{ restaurant.status === 'active' ? 'Open' : 'Closed' }}</span>
                  </div>
                </div>
              </v-card-text>
              
              <v-card-actions>
                <v-btn variant="text" color="primary">View Menu</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- Pagination -->
        <div class="pagination-controls mt-4">
          <v-pagination
            v-if="totalPages > 1"
            v-model="currentPage"
            :length="totalPages"
            rounded="circle"
          ></v-pagination>
        </div>
      </div>
    </section>
    
    <!-- Popular Categories Section -->
    <section class="categories-section">
      <div class="container">
        <h2>Popular Categories</h2>
        <v-row>
          <v-col
            v-for="category in popularCategories"
            :key="category.id"
            cols="6" sm="4" md="3" lg="2"
          >
            <v-card
              class="category-card"
              @click="selectCategory(category)"
            >
              <v-img
                :src="category.image || '/img/category-placeholder.jpg'"
                height="100"
                cover
              ></v-img>
              <v-card-text class="text-center">
                <h3>{{ category.name }}</h3>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </section>
    
    <!-- Promotions Section -->
    <section class="promotions-section">
      <div class="container">
        <h2>Special Offers</h2>
        <v-carousel
          hide-delimiter-background
          height="200"
          show-arrows="hover"
        >
          <v-carousel-item
            v-for="promotion in promotions"
            :key="promotion.id"
          >
            <v-sheet
              height="100%"
              color="primary"
              class="d-flex justify-center align-center text-center promotion-slide"
            >
              <div>
                <h3>{{ promotion.name }}</h3>
                <p>{{ promotion.description }}</p>
                <v-btn variant="outlined" color="white">View Details</v-btn>
              </div>
            </v-sheet>
          </v-carousel-item>
        </v-carousel>
      </div>
    </section>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import restaurantService from '@/services/restaurant.service';
import categoryService from '@/services/category.service';
import promotionService from '@/services/promotion.service';

export default {
  name: 'HomePage',
  
  setup() {
    const store = useStore();
    const router = useRouter();
    
    // State
    const restaurants = ref([]);
    const categories = ref([]);
    const promotions = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const searchQuery = ref('');
    const currentPage = ref(1);
    const itemsPerPage = ref(12);
    const totalItems = ref(0);
    const filters = ref({
      category: null,
      sortBy: 'rating',
      priceRange: null,
      onlyOpen: false
    });
    
    // Computed
    const filteredRestaurants = computed(() => {
      let result = [...restaurants.value];
      
      // Apply filters
      if (filters.value.category) {
        // This is a simplified filter - in reality, restaurants might have multiple categories
        result = result.filter(r => r.categories && r.categories.includes(filters.value.category));
      }
      
      if (filters.value.onlyOpen) {
        result = result.filter(r => r.status === 'active');
      }
      
      // Apply search query
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase().trim();
        result = result.filter(r => 
          r.name.toLowerCase().includes(query) || 
          (r.description && r.description.toLowerCase().includes(query))
        );
      }
      
      // Apply sorting
      if (filters.value.sortBy === 'rating') {
        result.sort((a, b) => b.rating - a.rating);
      } else if (filters.value.sortBy === 'name') {
        result.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      return result;
    });
    
    const totalPages = computed(() => {
      return Math.ceil(filteredRestaurants.value.length / itemsPerPage.value);
    });
    
    const paginatedRestaurants = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return filteredRestaurants.value.slice(start, end);
    });
    
    const popularCategories = computed(() => {
      return categories.value.slice(0, 6); // Show first 6 categories
    });
    
    // Options for filters
    const sortOptions = [
      { title: 'Rating (High to Low)', value: 'rating' },
      { title: 'Name (A to Z)', value: 'name' }
    ];
    
    const priceRanges = [
      { title: 'All Prices', value: null },
      { title: '$', value: 1 },
      { title: '$$', value: 2 },
      { title: '$$$', value: 3 }
    ];
    
    // Methods
    const fetchRestaurants = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await restaurantService.getRestaurants();
        restaurants.value = response.data;
        totalItems.value = response.data.length;
      } catch (err) {
        console.error('Error fetching restaurants:', err);
        error.value = err.message || 'Failed to load restaurants';
      } finally {
        loading.value = false;
      }
    };
    
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        categories.value = response.data;
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    const fetchPromotions = async () => {
      try {
        const response = await promotionService.getActivePromotions();
        promotions.value = response.data;
      } catch (err) {
        console.error('Error fetching promotions:', err);
      }
    };
    
    const searchRestaurants = () => {
      currentPage.value = 1; // Reset to first page when searching
      
      if (searchQuery.value.trim()) {
        // Advanced option: Navigate to dedicated search page if needed
        // router.push({ name: 'Search', query: { q: searchQuery.value } });
      }
    };
    
    const selectCategory = (category) => {
      filters.value.category = category.id;
      currentPage.value = 1;
    };
    
    const truncateText = (text, maxLength) => {
      if (!text) return '';
      return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };
    
    // Watchers
    watch(filters, () => {
      currentPage.value = 1; // Reset pagination when filters change
    }, { deep: true });
    
    // Lifecycle hooks
    onMounted(async () => {
      await Promise.all([
        fetchRestaurants(),
        fetchCategories(),
        fetchPromotions()
      ]);
    });
    
    return {
      restaurants,
      categories,
      promotions,
      loading,
      error,
      searchQuery,
      currentPage,
      filters,
      filteredRestaurants,
      totalPages,
      popularCategories,
      sortOptions,
      priceRanges,
      searchRestaurants,
      selectCategory,
      truncateText
    };
  }
};
</script>

<style scoped>
.home-page {
  padding-bottom: 3rem;
}

.hero-section {
  height: 400px;
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('/img/hero-background.jpg');
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: white;
  margin-bottom: 2rem;
}

.hero-content {
  max-width: 600px;
  width: 90%;
}

.hero-content h1 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
}

.search-bar {
  display: flex;
  background: white;
  border-radius: 4px;
  overflow: hidden;
}

.search-bar .v-text-field {
  flex-grow: 1;
}

.filter-section {
  margin-bottom: 2rem;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

section h2 {
  margin-bottom: 1.5rem;
  font-size: 1.8rem;
}

.restaurants-section, .categories-section, .promotions-section {
  margin-bottom: 3rem;
}

.restaurant-card {
  height: 100%;
  transition: transform 0.2s;
}

.restaurant-card:hover {
  transform: translateY(-5px);
}

.restaurant-name {
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0;
}

.restaurant-description {
  margin: 0.5rem 0;
  color: rgba(0, 0, 0, 0.6);
  height: 40px;
}

.restaurant-details {
  display: flex;
  justify-content: space-between;
}

.detail {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
}

.rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 600;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
}

.pagination-controls {
  display: flex;
  justify-content: center;
}

.category-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.category-card:hover {
  transform: scale(1.05);
}

.promotion-slide {
  padding: 1rem;
  color: white;
}

@media (max-width: 600px) {
  .hero-section {
    height: 300px;
  }
  
  .hero-content h1 {
    font-size: 1.8rem;
  }
}
</style>