<template>
  <v-container>
    <!-- Search and Filters Section -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row>
          <!-- Location Search -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="locationQuery"
              label="Delivery Location"
              prepend-inner-icon="mdi-map-marker"
              variant="outlined"
              hide-details
              class="mb-4"
            >
              <template v-slot:append>
                <v-btn icon @click="getCurrentLocation">
                  <v-icon>mdi-crosshairs-gps</v-icon>
                </v-btn>
              </template>
            </v-text-field>
            <!-- Location Suggestions -->
            <v-list v-if="showLocationSuggestions && locationSuggestions.length" class="location-suggestions">
              <v-list-item
                v-for="suggestion in locationSuggestions"
                :key="suggestion"
                @click="selectLocationSuggestion(suggestion)"
              >
                <v-list-item-title>{{ suggestion }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>

          <!-- Restaurant/Food Search -->
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="searchQuery"
              label="Search restaurants or foods"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              hide-details
              class="mb-4"
            ></v-text-field>
            <!-- Search Suggestions -->
            <v-list v-if="showSuggestions && suggestions.length" class="search-suggestions">
              <v-list-item
                v-for="suggestion in suggestions"
                :key="suggestion"
                @click="selectSuggestion(suggestion)"
              >
                <v-list-item-title>{{ suggestion }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
        </v-row>

        <!-- Filter Section -->
        <v-row>
          <!-- Categories -->
          <v-col cols="12">
            <v-chip-group
              v-model="filters.category"
              class="mb-4"
              selected-class="primary"
            >
              <v-chip
                v-for="category in categories"
                :key="category.id"
                :value="category"
                filter
                variant="outlined"
              >
                {{ category.name }}
              </v-chip>
            </v-chip-group>
          </v-col>

          <!-- Filter Buttons -->
          <v-col cols="12" sm="3">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  block
                  variant="outlined"
                  v-bind="props"
                  class="mb-2"
                >
                  Price Range: {{ getPriceRangeText() }}
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="range in ['$', '$$', '$$$', '$$$$']"
                  :key="range"
                  @click="setPriceRange(range)"
                >
                  <v-list-item-title>{{ range }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>

          <v-col cols="12" sm="3">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  block
                  variant="outlined"
                  v-bind="props"
                  class="mb-2"
                >
                  Delivery Time: {{ getDeliveryTimeText() }}
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="time in [15, 30, 45, 60]"
                  :key="time"
                  @click="setDeliveryTime(time)"
                >
                  <v-list-item-title>Under {{ time }} min</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>

          <v-col cols="12" sm="3">
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  block
                  variant="outlined"
                  v-bind="props"
                  class="mb-2"
                >
                  Rating: {{ filters.minRating || 'Any' }}+
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="rating in [3, 3.5, 4, 4.5]"
                  :key="rating"
                  @click="setMinRating(rating)"
                >
                  <v-list-item-title>{{ rating }}+ Stars</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </v-col>

          <v-col cols="12" sm="3">
            <v-btn
              block
              color="primary"
              @click="filters = {}"
              class="mb-2"
            >
              Clear Filters
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Results Section -->
    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
    </div>

    <div v-else>
      <!-- Results Count -->
      <div class="d-flex align-center mb-4">
        <h2 class="text-h6">{{ filteredRestaurants.length }} Restaurants Available</h2>
        <v-spacer></v-spacer>
        <v-select
          v-model="filters.sortBy"
          :items="[
            { title: 'Featured', value: 'featured' },
            { title: 'Rating', value: 'rating' },
            { title: 'Delivery Time', value: 'deliveryTime' },
            { title: 'Distance', value: 'distance' }
          ]"
          label="Sort by"
          hide-details
          variant="outlined"
          density="compact"
          style="max-width: 200px"
        ></v-select>
      </div>

      <!-- Restaurant Grid -->
      <v-row>
        <v-col
          v-for="restaurant in filteredRestaurants"
          :key="restaurant.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            @click="viewRestaurant(restaurant.id)"
            class="h-100"
            hover
          >
            <v-img
              :src="restaurant.image"
              height="200"
              cover
              class="restaurant-image"
            >
              <template v-slot:placeholder>
                <v-row
                  class="fill-height ma-0"
                  align="center"
                  justify="center"
                >
                  <v-progress-circular
                    indeterminate
                    color="grey-lighten-5"
                  ></v-progress-circular>
                </v-row>
              </template>
            </v-img>

            <v-card-text>
              <div class="d-flex align-center mb-2">
                <h3 class="text-h6 text-truncate">{{ restaurant.name }}</h3>
                <v-spacer></v-spacer>
                <v-chip
                  size="small"
                  :color="restaurant.rating >= 4.5 ? 'success' : 'primary'"
                >
                  {{ restaurant.rating }}
                  <v-icon size="small" class="ml-1">mdi-star</v-icon>
                </v-chip>
              </div>

              <div class="text-caption text-grey mb-2">
                {{ restaurant.cuisineType.join(' • ') }}
              </div>

              <div class="d-flex align-center">
                <v-icon size="small" color="grey">mdi-clock-outline</v-icon>
                <span class="text-caption ml-1">{{ restaurant.deliveryTime }} min</span>
                <v-divider vertical class="mx-2"></v-divider>
                <v-icon size="small" color="grey">mdi-map-marker</v-icon>
                <span class="text-caption ml-1">{{ restaurant.distance }} km</span>
                <v-spacer></v-spacer>
                <span class="text-caption">{{ restaurant.priceRange }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- No Results Message -->
      <v-card
        v-if="filteredRestaurants.length === 0"
        class="text-center pa-6"
      >
        <v-icon
          size="64"
          color="grey-lighten-1"
          class="mb-4"
        >
          mdi-store-off
        </v-icon>
        <h3 class="text-h6 mb-2">No Restaurants Found</h3>
        <p class="text-body-2 text-grey">
          Try adjusting your filters or search criteria
        </p>
      </v-card>
    </div>
  </v-container>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRestaurantSearch } from '../composables/useRestaurantSearch'

const router = useRouter()
const {
  searchQuery,
  locationQuery,
  suggestions,
  locationSuggestions,
  restaurants,
  loading,
  filters,
  filteredRestaurants,
  getCurrentLocation
} = useRestaurantSearch()

const showSuggestions = ref(false)
const showLocationSuggestions = ref(false)

const categories = ref([
  { id: 1, name: 'Vietnamese' },
  { id: 2, name: 'Japanese' },
  { id: 3, name: 'Chinese' },
  { id: 4, name: 'Italian' },
  { id: 5, name: 'Thai' },
  { id: 6, name: 'Indian' }
])

function selectCategory(category) {
  filters.value.category = category
}

function setPriceRange(range) {
  filters.value.priceRange = range
}

function setDeliveryTime(time) {
  filters.value.deliveryTime = time
}

function setMinRating(rating) {
  filters.value.minRating = rating
}

function getPriceRangeText() {
  return filters.value.priceRange || 'Any'
}

function getDeliveryTimeText() {
  if (!filters.value.deliveryTime) return 'Any'
  return `Under ${filters.value.deliveryTime} min`
}

function viewRestaurant(id) {
  router.push(`/restaurant/${id}`)
}

function selectSuggestion(suggestion) {
  searchQuery.value = suggestion
  showSuggestions.value = false
}

function selectLocationSuggestion(suggestion) {
  locationQuery.value = suggestion
  showLocationSuggestions.value = false
}

watch(searchQuery, () => {
  showSuggestions.value = searchQuery.value.length >= 2
})

watch(locationQuery, () => {
  showLocationSuggestions.value = locationQuery.value.length >= 3
})

onMounted(async () => {
  await getCurrentLocation()
})
</script>
