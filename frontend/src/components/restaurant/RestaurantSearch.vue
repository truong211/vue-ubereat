<template>
  <div class="restaurant-search">
    <!-- Search Header -->
    <div class="search-header mb-4">
      <v-text-field
        v-model="searchQuery"
        placeholder="Search for restaurants or cuisines..."
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
        :loading="isLoading"
        prepend-inner-icon="mdi-magnify"
        @update:model-value="handleSearch"
      >
        <!-- Add recent searches dropdown -->
        <template v-slot:append-inner>
          <v-menu v-if="recentSearches.length > 0">
            <template v-slot:activator="{ props }">
              <v-btn
                icon
                variant="text"
                v-bind="props"
                size="small"
              >
                <v-icon>mdi-history</v-icon>
              </v-btn>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="(search, index) in recentSearches"
                :key="index"
                :value="search"
                @click="selectRecentSearch(search)"
              >
                <v-list-item-title>{{ search }}</v-list-item-title>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item @click="clearSearchHistory">
                <v-list-item-title class="text-caption">Clear History</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-text-field>
    </div>

    <!-- Enhanced Filter Panel -->
    <v-expand-transition>
      <div v-show="showFilters" class="filters-panel mb-4">
        <v-card>
          <v-card-text>
            <!-- Sort Options -->
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Sort By</div>
              <v-btn-toggle
                v-model="sortBy"
                mandatory
                divided
                color="primary"
              >
                <v-btn value="rating">
                  <v-icon start>mdi-star</v-icon>
                  Rating
                </v-btn>
                <v-btn value="distance">
                  <v-icon start>mdi-map-marker</v-icon>
                  Distance
                </v-btn>
                <v-btn value="price_asc">
                  <v-icon start>mdi-currency-usd</v-icon>
                  Price: Low to High
                </v-btn>
                <v-btn value="price_desc">
                  <v-icon start>mdi-currency-usd</v-icon>
                  Price: High to Low
                </v-btn>
              </v-btn-toggle>
            </div>

            <!-- Cuisine Types -->
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Cuisines</div>
              <v-chip-group
                v-model="selectedCuisines"
                multiple
                selected-class="selected-chip"
              >
                <v-chip
                  v-for="cuisine in cuisineTypes"
                  :key="cuisine.id"
                  :value="cuisine.id"
                  filter
                  variant="elevated"
                >
                  <v-icon start size="small">{{ cuisine.icon }}</v-icon>
                  {{ cuisine.name }}
                </v-chip>
              </v-chip-group>
            </div>

            <!-- Price Range -->
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Price Range</div>
              <v-chip-group
                v-model="priceRange"
                multiple
                selected-class="selected-chip"
              >
                <v-chip
                  v-for="price in priceRanges"
                  :key="price.value"
                  :value="price.value"
                  filter
                  variant="elevated"
                >
                  {{ price.label }}
                </v-chip>
              </v-chip-group>
            </div>

            <!-- Rating Filter -->
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Minimum Rating</div>
              <v-rating
                v-model="minRating"
                color="amber"
                half-increments
                hover
              ></v-rating>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>

    <!-- Active Filters -->
    <div v-if="hasActiveFilters" class="active-filters mb-4">
      <v-chip
        v-for="filter in activeFilters"
        :key="filter.id"
        closable
        size="small"
        class="mr-2 mb-2"
        @click:close="removeFilter(filter)"
      >
        <v-icon start size="small">{{ filter.icon }}</v-icon>
        {{ filter.label }}
      </v-chip>
    </div>

    <!-- Search Results -->
    <div v-if="isLoading" class="text-center py-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
      <div class="text-body-1 mt-4">Searching restaurants...</div>
    </div>

    <div v-else-if="filteredRestaurants.length === 0" class="text-center py-8">
      <v-icon size="64" color="grey-lighten-1">mdi-store-search</v-icon>
      <h3 class="text-h6 mt-4">No restaurants found</h3>
      <p class="text-body-1 text-medium-emphasis">
        Try adjusting your filters or search terms
      </p>
      <v-btn
        color="primary"
        variant="text"
        class="mt-2"
        @click="resetFilters"
      >
        Clear Filters
      </v-btn>
    </div>

    <div v-else>
      <div class="results-header d-flex align-center justify-space-between mb-4">
        <div class="text-body-1">
          {{ filteredRestaurants.length }} restaurants found
        </div>
        <v-btn-toggle
          v-model="viewMode"
          mandatory
          density="comfortable"
        >
          <v-btn value="grid" icon="mdi-view-grid"></v-btn>
          <v-btn value="list" icon="mdi-view-list"></v-btn>
          <v-btn value="map" icon="mdi-map"></v-btn>
        </v-btn-toggle>
      </div>

      <!-- Grid View -->
      <v-row v-if="viewMode === 'grid'">
        <v-col
          v-for="restaurant in filteredRestaurants"
          :key="restaurant.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            :to="{ name: 'RestaurantDetail', params: { id: restaurant.id }}"
            class="h-100"
          >
            <v-img
              :src="restaurant.image"
              height="200"
              cover
              class="bg-grey-lighten-2"
            >
              <template v-slot:placeholder>
                <v-icon size="48" color="grey-lighten-1">mdi-store</v-icon>
              </template>
            </v-img>

            <v-card-text>
              <div class="d-flex justify-space-between align-start mb-2">
                <div class="text-subtitle-1 font-weight-bold">{{ restaurant.name }}</div>
                <v-chip
                  v-if="restaurant.deliveryFee === 0"
                  color="success"
                  size="small"
                  class="ml-2"
                >
                  Free Delivery
                </v-chip>
              </div>

              <div class="mb-2">
                <v-chip-group>
                  <v-chip
                    v-for="cuisine in restaurant.cuisines"
                    :key="cuisine"
                    size="x-small"
                    class="mr-1"
                  >
                    {{ cuisine }}
                  </v-chip>
                </v-chip-group>
              </div>

              <div class="d-flex align-center text-body-2 mb-1">
                <v-icon size="small" color="amber-darken-2" class="mr-1">
                  mdi-star
                </v-icon>
                <span class="font-weight-medium mr-1">
                  {{ restaurant.rating.toFixed(1) }}
                </span>
                <span class="text-medium-emphasis">
                  ({{ restaurant.reviewCount }})
                </span>
              </div>

              <div class="d-flex align-center text-body-2">
                <v-icon size="small" color="grey" class="mr-1">
                  mdi-clock-outline
                </v-icon>
                {{ restaurant.deliveryTime }} min
                <v-icon size="small" color="grey" class="mx-1">
                  mdi-circle-small
                </v-icon>
                {{ restaurant.distance }} km
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- List View -->
      <v-list
        v-else-if="viewMode === 'list'"
        lines="three"
      >
        <v-list-item
          v-for="restaurant in filteredRestaurants"
          :key="restaurant.id"
          :to="{ name: 'RestaurantDetail', params: { id: restaurant.id }}"
          :title="restaurant.name"
        >
          <template v-slot:prepend>
            <v-avatar
              size="80"
              rounded
              class="mr-4"
            >
              <v-img :src="restaurant.image" cover></v-img>
            </v-avatar>
          </template>

          <template v-slot:subtitle>
            <div class="mt-1">
              <div class="d-flex align-center mb-1">
                <v-icon size="small" color="amber-darken-2" class="mr-1">
                  mdi-star
                </v-icon>
                <span class="font-weight-medium mr-1">
                  {{ restaurant.rating.toFixed(1) }}
                </span>
                <span class="text-medium-emphasis">
                  ({{ restaurant.reviewCount }})
                </span>
                <v-icon size="small" color="grey" class="mx-1">
                  mdi-circle-small
                </v-icon>
                {{ restaurant.deliveryTime }} min
                <v-icon size="small" color="grey" class="mx-1">
                  mdi-circle-small
                </v-icon>
                {{ restaurant.distance }} km
              </div>
              <v-chip-group>
                <v-chip
                  v-for="cuisine in restaurant.cuisines"
                  :key="cuisine"
                  size="x-small"
                  class="mr-1"
                >
                  {{ cuisine }}
                </v-chip>
              </v-chip-group>
            </div>
          </template>

          <template v-slot:append>
            <div class="text-right">
              <v-chip
                v-if="restaurant.deliveryFee === 0"
                color="success"
                size="small"
              >
                Free Delivery
              </v-chip>
            </div>
          </template>
        </v-list-item>
      </v-list>

      <!-- Map View -->
      <div v-else class="map-view" style="height: 600px;">
        <restaurant-map
          :restaurants="filteredRestaurants"
          :selected-restaurant="selectedRestaurant"
          @restaurant-clicked="handleRestaurantClick"
        />
      </div>

      <!-- Load More -->
      <div v-if="hasMoreResults" class="text-center mt-6">
        <v-btn
          variant="outlined"
          :loading="isLoadingMore"
          @click="loadMore"
        >
          Load More Results
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import RestaurantMap from '@/components/restaurant/RestaurantMap.vue'
import { useDebounce } from '@/composables/useDebounce'

export default {
  name: 'RestaurantSearch',
  
  components: {
    RestaurantMap
  },
  
  props: {
    // Initial search parameters
    initialQuery: {
      type: String,
      default: ''
    },
    
    initialFilters: {
      type: Object,
      default: () => ({})
    }
  },
  
  emits: [
    'update:search',
    'update:filters',
    'restaurant-selected'
  ],
  
  setup(props, { emit }) {
    // Search state
    const searchQuery = ref(props.initialQuery)
    const isLoading = ref(false)
    const isLoadingMore = ref(false)
    const hasMoreResults = ref(true)
    
    // Filter states
    const showFilters = ref(false)
    const selectedCuisines = ref(JSON.parse(localStorage.getItem('filter_cuisines') || '[]'))
    const sortBy = ref(localStorage.getItem('filter_sortBy') || 'rating')
    const priceRange = ref(JSON.parse(localStorage.getItem('filter_priceRange') || '[]'))
    const dietaryPreferences = ref(JSON.parse(localStorage.getItem('filter_dietary') || '[]'))
    const freeDelivery = ref(localStorage.getItem('filter_freeDelivery') === 'true')
    const openNow = ref(localStorage.getItem('filter_openNow') === 'true')
    const onlyRated = ref(localStorage.getItem('filter_onlyRated') === 'true')
    const distanceRange = ref([0, parseInt(localStorage.getItem('filter_maxDistance') || '10')])
    const ratingRange = ref([0, parseFloat(localStorage.getItem('filter_minRating') || '5')])
    const minRating = ref(0)
    
    // View state
    const viewMode = ref('grid')
    const selectedRestaurant = ref(null)
    
    // Mock data for demo
    const cuisineTypes = [
      { id: 'italian', name: 'Italian', icon: 'mdi-pizza' },
      { id: 'japanese', name: 'Japanese', icon: 'mdi-food-sushi' },
      { id: 'chinese', name: 'Chinese', icon: 'mdi-noodles' },
      { id: 'indian', name: 'Indian', icon: 'mdi-food-curry' },
      { id: 'thai', name: 'Thai', icon: 'mdi-bowl-mix' },
      { id: 'mexican', name: 'Mexican', icon: 'mdi-taco' }
    ]
    
    const priceRanges = [
      { value: 1, label: '$' },
      { value: 2, label: '$$' },
      { value: 3, label: '$$$' },
      { value: 4, label: '$$$$' }
    ]
    
    const dietaryOptions = [
      { id: 'vegetarian', name: 'Vegetarian', icon: 'mdi-leaf' },
      { id: 'vegan', name: 'Vegan', icon: 'mdi-sprout' },
      { id: 'gluten_free', name: 'Gluten Free', icon: 'mdi-grain-off' },
      { id: 'halal', name: 'Halal', icon: 'mdi-food-halal' }
    ]
    
    // Mock restaurants data
    const restaurants = ref([
      {
        id: 1,
        name: 'Pizza Palace',
        image: '/images/restaurants/pizza-palace.jpg',
        cuisines: ['Italian', 'Pizza'],
        rating: 4.5,
        reviewCount: 234,
        deliveryTime: 30,
        distance: 2.5,
        deliveryFee: 0,
        priceRange: 2
      },
      // Add more restaurants...
    ])
    
    // Computed properties
    const hasActiveFilters = computed(() => {
      return selectedCuisines.value.length > 0 ||
        priceRange.value.length > 0 ||
        dietaryPreferences.value.length > 0 ||
        freeDelivery.value ||
        openNow.value ||
        onlyRated.value
    })
    
    const activeFiltersCount = computed(() => {
      let count = 0
      count += selectedCuisines.value.length
      count += priceRange.value.length
      count += dietaryPreferences.value.length
      if (freeDelivery.value) count++
      if (openNow.value) count++
      if (onlyRated.value) count++
      return count
    })
    
    const activeFilters = computed(() => {
      const filters = []
      
      selectedCuisines.value.forEach(cuisine => {
        const cuisineType = cuisineTypes.find(c => c.id === cuisine)
        if (cuisineType) {
          filters.push({
            id: `cuisine-${cuisine}`,
            label: cuisineType.name,
            icon: cuisineType.icon,
            type: 'cuisine'
          })
        }
      })
      
      if (freeDelivery.value) {
        filters.push({
          id: 'free-delivery',
          label: 'Free Delivery',
          icon: 'mdi-truck-fast',
          type: 'delivery'
        })
      }
      
      if (openNow.value) {
        filters.push({
          id: 'open-now',
          label: 'Open Now',
          icon: 'mdi-clock',
          type: 'status'
        })
      }
      
      if (onlyRated.value) {
        filters.push({
          id: '4plus-rating',
          label: '4+ Rating',
          icon: 'mdi-star',
          type: 'rating'
        })
      }
      
      return filters
    })
    
    const filteredRestaurants = computed(() => {
      // In a real app, this would be handled by the backend
      return restaurants.value
    })
    
    // Methods
    const toggleFilters = () => {
      showFilters.value = !showFilters.value
    }
    
    const handleSearch = useDebounce((query) => {
      // In a real app, this would trigger an API call
      console.log('Searching for:', query)
      emit('update:search', query)
    }, 300)
    
    const applyFilters = () => {
      showFilters.value = false
      // Save filters to localStorage
      localStorage.setItem('filter_cuisines', JSON.stringify(selectedCuisines.value))
      localStorage.setItem('filter_sortBy', sortBy.value)
      localStorage.setItem('filter_priceRange', JSON.stringify(priceRange.value))
      localStorage.setItem('filter_dietary', JSON.stringify(dietaryPreferences.value))
      localStorage.setItem('filter_freeDelivery', freeDelivery.value)
      localStorage.setItem('filter_openNow', openNow.value)
      localStorage.setItem('filter_maxDistance', distanceRange.value[1])
      localStorage.setItem('filter_minRating', ratingRange.value[1])

      emit('update:filters', {
        cuisines: selectedCuisines.value,
        priceRange: priceRange.value,
        dietary: dietaryPreferences.value,
        freeDelivery: freeDelivery.value,
        openNow: openNow.value,
        distanceRange: distanceRange.value,
        ratingRange: ratingRange.value
      })
    }
    
    const resetFilters = () => {
      selectedCuisines.value = []
      priceRange.value = []
      dietaryPreferences.value = []
      freeDelivery.value = false
      openNow.value = false
      onlyRated.value = false
      distanceRange.value = [0, 10]
      ratingRange.value = [0, 5]
      
      // Clear localStorage
      localStorage.removeItem('filter_cuisines')
      localStorage.removeItem('filter_sortBy')
      localStorage.removeItem('filter_priceRange')
      localStorage.removeItem('filter_dietary')
      localStorage.removeItem('filter_freeDelivery')
      localStorage.removeItem('filter_openNow')
      localStorage.removeItem('filter_maxDistance')
      localStorage.removeItem('filter_minRating')
      
      applyFilters()
    }
    
    const removeFilter = (filter) => {
      switch (filter.type) {
        case 'cuisine':
          selectedCuisines.value = selectedCuisines.value.filter(
            c => `cuisine-${c}` !== filter.id
          )
          break
        case 'delivery':
          freeDelivery.value = false
          break
        case 'status':
          openNow.value = false
          break
        case 'rating':
          onlyRated.value = false
          break
      }
      applyFilters()
    }
    
    const handleRestaurantClick = (restaurant) => {
      selectedRestaurant.value = restaurant
      emit('restaurant-selected', restaurant)
    }
    
    const loadMore = async () => {
      isLoadingMore.value = true
      try {
        // In a real app, this would load more results from the API
        await new Promise(resolve => setTimeout(resolve, 1000))
        hasMoreResults.value = false
      } finally {
        isLoadingMore.value = false
      }
    }
    
    // Initialize filters from props
    if (props.initialFilters) {
      selectedCuisines.value = props.initialFilters.cuisines || []
      priceRange.value = props.initialFilters.priceRange || []
      dietaryPreferences.value = props.initialFilters.dietary || []
      freeDelivery.value = props.initialFilters.freeDelivery || false
      openNow.value = props.initialFilters.openNow || false
      onlyRated.value = props.initialFilters.minRating >= 4 || false
    }
    
    return {
      // State
      searchQuery,
      isLoading,
      isLoadingMore,
      hasMoreResults,
      showFilters,
      selectedCuisines,
      sortBy,
      priceRange,
      dietaryPreferences,
      freeDelivery,
      openNow,
      onlyRated,
      viewMode,
      selectedRestaurant,
      minRating,
      
      // Data
      cuisineTypes,
      priceRanges,
      dietaryOptions,
      restaurants,
      
      // Computed
      hasActiveFilters,
      activeFiltersCount,
      activeFilters,
      filteredRestaurants,
      
      // Methods
      toggleFilters,
      handleSearch,
      applyFilters,
      resetFilters,
      removeFilter,
      handleRestaurantClick,
      loadMore
    }
  }
}
</script>

<style scoped>
.restaurant-search {
  max-width: 1200px;
  margin: 0 auto;
}

.filters-panel {
  position: relative;
  z-index: 1;
}

.selected-chip {
  background-color: var(--v-primary-base) !important;
  color: white !important;
}

.map-view {
  border-radius: 8px;
  overflow: hidden;
}
</style>