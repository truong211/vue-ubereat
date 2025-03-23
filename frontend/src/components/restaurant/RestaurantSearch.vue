<template>
  <div class="restaurant-search">
    <!-- Enhanced Search Bar -->
    <div class="search-header mb-4">
      <v-text-field
        v-model="searchQuery"
        placeholder="Search restaurants, cuisines, or dishes..."
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
        :loading="isLoading"
        prepend-inner-icon="mdi-magnify"
        @update:model-value="handleSearch"
      >
        <!-- Auto-suggestions dropdown -->
        <template v-slot:append-inner>
          <v-menu
            v-model="showSuggestions"
            :close-on-content-click="false"
            location="bottom end"
            max-height="300"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                icon
                variant="text"
                v-bind="props"
                size="small"
                :disabled="!searchQuery"
              >
                <v-icon>mdi-chevron-down</v-icon>
              </v-btn>
            </template>

            <v-card min-width="300">
              <v-list v-if="suggestions.length > 0">
                <v-list-item
                  v-for="suggestion in suggestions"
                  :key="suggestion.id"
                  :subtitle="suggestion.type"
                  @click="selectSuggestion(suggestion)"
                >
                  <template v-slot:prepend>
                    <v-icon :color="getSuggestionIcon(suggestion.type).color">
                      {{ getSuggestionIcon(suggestion.type).icon }}
                    </v-icon>
                  </template>
                  <v-list-item-title>{{ suggestion.text }}</v-list-item-title>
                </v-list-item>
              </v-list>
              <v-card-text v-else class="text-center text-body-2 py-4">
                No suggestions found
              </v-card-text>
            </v-card>
          </v-menu>
        </template>
      </v-text-field>
    </div>

    <!-- Filter Panel -->
    <v-expand-transition>
      <div v-show="showFilters" class="filters-panel mb-4">
        <v-card>
          <v-card-text>
            <!-- Primary Filters -->
            <v-row>
              <!-- Sort Options -->
              <v-col cols="12" sm="4">
                <v-select
                  v-model="sortBy"
                  :items="sortOptions"
                  label="Sort By"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:model-value="applyFilters"
                >
                  <template v-slot:prepend-inner>
                    <v-icon size="small">mdi-sort</v-icon>
                  </template>
                </v-select>
              </v-col>

              <!-- Rating Filter -->
              <v-col cols="12" sm="4">
                <v-select
                  v-model="filters.rating"
                  :items="ratingOptions"
                  label="Rating"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:model-value="applyFilters"
                >
                  <template v-slot:prepend-inner>
                    <v-icon size="small" color="amber">mdi-star</v-icon>
                  </template>
                </v-select>
              </v-col>

              <!-- Distance Filter -->
              <v-col cols="12" sm="4">
                <v-select
                  v-model="filters.distance"
                  :items="distanceOptions"
                  label="Distance"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :disabled="!userLocation"
                  @update:model-value="applyFilters"
                >
                  <template v-slot:prepend-inner>
                    <v-icon size="small">mdi-map-marker</v-icon>
                  </template>
                </v-select>
              </v-col>
            </v-row>

            <!-- Advanced Filters -->
            <v-row class="mt-4">
              <!-- Cuisine Types -->
              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">Cuisines</div>
                <v-chip-group
                  v-model="selectedCuisines"
                  multiple
                  selected-class="selected-chip"
                  @update:model-value="applyFilters"
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
              </v-col>

              <!-- Price Range -->
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 mb-2">Price Range</div>
                <v-chip-group
                  v-model="priceRange"
                  multiple
                  selected-class="selected-chip"
                  @update:model-value="applyFilters"
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
              </v-col>

              <!-- Additional Filters -->
              <v-col cols="12" md="6">
                <div class="text-subtitle-1 mb-2">Additional Filters</div>
                <v-checkbox
                  v-model="filters.freeDelivery"
                  label="Free Delivery"
                  hide-details
                  class="mb-2"
                  @update:model-value="applyFilters"
                ></v-checkbox>
                <v-checkbox
                  v-model="filters.openNow"
                  label="Open Now"
                  hide-details
                  @update:model-value="applyFilters"
                ></v-checkbox>
              </v-col>
            </v-row>

            <!-- Reset Button -->
            <v-row class="mt-4">
              <v-col cols="12" class="text-center">
                <v-btn
                  variant="text"
                  color="primary"
                  @click="resetFilters"
                >
                  Reset All Filters
                </v-btn>
              </v-col>
            </v-row>
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
            :to="{ name: 'RestaurantDetail', params: { id: restaurant.id }} "
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
          :to="{ name: 'RestaurantDetail', params: { id: restaurant.id }} "
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
import { ref, computed, onMounted, watch } from 'vue'
import { useDebounce } from '@/composables/useDebounce'
import { useRestaurantSearch } from '@/composables/useRestaurantSearch'
import { useMapService } from '@/composables/useMapService'

export default {
  name: 'RestaurantSearch',

  setup() {
    const {
      restaurants,
      loading: isLoading,
      filters,
      sortOptions,
      ratingOptions,
      distanceOptions,
      userLocation,
      searchRestaurants
    } = useRestaurantSearch()

    const searchQuery = ref('')
    const showSuggestions = ref(false)
    const suggestions = ref([])
    const selectedCuisines = ref([])
    const priceRange = ref([])
    const showFilters = ref(false)

    // Options data
    const cuisineTypes = [
      { id: 'vietnamese', name: 'Vietnamese', icon: 'mdi-bowl' },
      { id: 'japanese', name: 'Japanese', icon: 'mdi-food-sushi' },
      { id: 'chinese', name: 'Chinese', icon: 'mdi-noodles' },
      { id: 'italian', name: 'Italian', icon: 'mdi-pizza' },
      { id: 'thai', name: 'Thai', icon: 'mdi-bowl-mix' },
      { id: 'indian', name: 'Indian', icon: 'mdi-food-curry' }
    ]

    const priceRanges = [
      { value: 1, label: '$' },
      { value: 2, label: '$$' },
      { value: 3, label: '$$$' },
      { value: 4, label: '$$$$' }
    ]

    // Methods
    const handleSearch = useDebounce(async (query) => {
      if (!query || query.length < 2) {
        suggestions.value = []
        showSuggestions.value = false
        return
      }

      isLoading.value = true
      try {
        const response = await searchRestaurants({
          search: query,
          limit: 5
        })
        
        suggestions.value = [
          ...response.restaurants.map(r => ({
            id: r.id,
            type: 'restaurant',
            text: r.name
          })),
          ...response.cuisines.map(c => ({
            id: c.id,
            type: 'cuisine',
            text: c.name
          })),
          ...response.dishes.map(d => ({
            id: d.id,
            type: 'dish',
            text: d.name
          }))
        ]
        showSuggestions.value = true
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        isLoading.value = false
      }
    }, 300)

    const selectSuggestion = (suggestion) => {
      searchQuery.value = suggestion.text
      showSuggestions.value = false
      
      if (suggestion.type === 'cuisine') {
        selectedCuisines.value = [suggestion.id]
      }
      
      applyFilters()
    }

    const getSuggestionIcon = (type) => {
      switch (type) {
        case 'restaurant':
          return { icon: 'mdi-store', color: 'primary' }
        case 'cuisine':
          return { icon: 'mdi-food-variant', color: 'success' }
        case 'dish':
          return { icon: 'mdi-food', color: 'warning' }
        default:
          return { icon: 'mdi-magnify', color: 'grey' }
      }
    }

    const applyFilters = () => {
      searchRestaurants({
        search: searchQuery.value,
        cuisines: selectedCuisines.value,
        priceRange: priceRange.value,
        ...filters.value
      })
    }

    const resetFilters = () => {
      searchQuery.value = ''
      selectedCuisines.value = []
      priceRange.value = []
      filters.value = {
        rating: null,
        distance: null,
        freeDelivery: false,
        openNow: false
      }
      applyFilters()
    }

    // Initialize
    onMounted(() => {
      searchRestaurants()
    })

    // Watch for location changes
    watch(userLocation, () => {
      if (userLocation.value && filters.value.distance) {
        applyFilters()
      }
    })

    return {
      searchQuery,
      showSuggestions,
      suggestions,
      selectedCuisines,
      priceRange,
      showFilters,
      filters,
      isLoading,
      userLocation,
      cuisineTypes,
      priceRanges,
      sortOptions,
      ratingOptions,
      distanceOptions,
      handleSearch,
      selectSuggestion,
      getSuggestionIcon,
      applyFilters,
      resetFilters
    }
  }
}
</script>

<style scoped>
.restaurant-search {
  max-width: 1200px;
  margin: 0 auto;
}

.selected-chip {
  background-color: var(--v-primary-base) !important;
  color: white !important;
}

.filters-panel {
  position: relative;
  z-index: 1;
}
</style>