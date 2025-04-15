<template>
  <v-container>
    <!-- Location Selector Banner -->
    <v-card class="mb-6 location-banner" color="primary" variant="flat">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12">
            <div class="d-flex align-center">
              <v-icon size="large" class="mr-2">mdi-map-marker</v-icon>
              <div class="location-display" @click="openLocationDialog">
                <div class="text-subtitle-1 font-weight-bold">Delivery Location</div>
                <div class="text-body-2">{{ locationQuery || 'Select your location' }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-btn
                variant="outlined"
                color="white"
                @click="openLocationDialog"
              >
                Change
              </v-btn>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Search and Filters Section -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row>
          <!-- Location Search (Hidden, replaced by banner) -->
          <v-col cols="12" sm="6" class="d-none">
            <v-text-field
              v-model="locationQuery"
              label="Delivery Location"
              prepend-inner-icon="mdi-map-marker"
              variant="outlined"
              hide-details
              class="mb-4"
              @keyup.enter="handleLocationSearch"
            >
              <template v-slot:append>
                <v-btn
                  icon
                  @click="handleGetCurrentLocation"
                  :loading="isLocating"
                  :disabled="isLocating"
                  class="location-btn"
                >
                  <v-tooltip activator="parent" location="top">
                    Use my current location
                  </v-tooltip>
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

  <!-- Location Selection Dialog -->
  <v-dialog v-model="locationDialog" max-width="600">
    <v-card>
      <v-card-title class="text-h5 pb-2">
        Select Delivery Location
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="tempLocationQuery"
              label="Enter your address or city"
              prepend-inner-icon="mdi-map-marker"
              variant="outlined"
              hide-details
              class="mb-4"
              @keyup.enter="confirmLocationSelection"
            ></v-text-field>

            <!-- Popular Cities -->
            <div class="mt-4 mb-2">
              <div class="text-subtitle-1 font-weight-bold mb-2">Popular Cities</div>
              <v-chip-group>
                <v-chip
                  v-for="city in popularCities"
                  :key="city"
                  @click="selectCity(city)"
                  class="mr-2 mb-2"
                >
                  {{ city }}
                </v-chip>
              </v-chip-group>
            </div>

            <!-- Use Current Location Button -->
            <v-btn
              prepend-icon="mdi-crosshairs-gps"
              variant="outlined"
              class="mt-4"
              :loading="isLocating"
              :disabled="isLocating"
              @click="handleGetCurrentLocation"
            >
              Use my current location
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="grey-darken-1"
          variant="text"
          @click="locationDialog = false"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          @click="confirmLocationSelection"
        >
          Confirm Location
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useRestaurantSearch } from '../composables/useRestaurantSearch'
import { useToast } from 'vue-toastification'

const router = useRouter()
const toast = useToast()

const {
  searchQuery,
  locationQuery,
  suggestions,
  locationSuggestions,
  restaurants,
  loading,
  filters,
  filteredRestaurants,
  getCurrentLocation,
  searchRestaurants
} = useRestaurantSearch()

const showSuggestions = ref(false)
const showLocationSuggestions = ref(false)
const isLocating = ref(false)
const locationDialog = ref(false)
const tempLocationQuery = ref('')

// Popular cities for quick selection
const popularCities = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego'
]

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

  // Trigger search with the selected location
  handleLocationSearch()
}

async function handleLocationSearch() {
  try {
    loading.value = true
    await searchRestaurants({
      locationQuery: locationQuery.value
    })
    toast.success('Location updated successfully')
  } catch (error) {
    console.error('Location search error:', error)
    toast.error('Error searching with this location')
  } finally {
    loading.value = false
  }
}

async function handleGetCurrentLocation() {
  isLocating.value = true
  try {
    const locationData = await getCurrentLocation()
    toast.success('Location updated successfully')
    // Trigger search with the new location
    await searchRestaurants()

    // Close the dialog if it's open
    if (locationDialog.value) {
      locationDialog.value = false
    }
  } catch (error) {
    console.error('Error getting location:', error)
    toast.error(error.message || 'Error getting your location')

    // If error occurred, we'll show a dialog to manually enter location
    if (error.code === 1) { // PERMISSION_DENIED
      // Show an alert that helps users understand how to enable location
      toast.info('You can search by typing your address manually')
    }
  } finally {
    isLocating.value = false
  }
}

watch(() => searchQuery?.value, (newVal) => {
  showSuggestions.value = Boolean(newVal && newVal.length >= 2)
}, { immediate: true })

watch(() => locationQuery.value, (newVal) => {
  if (newVal !== undefined) {
    showLocationSuggestions.value = newVal.length >= 3
  }
}, { immediate: true })

// Open location dialog
function openLocationDialog() {
  tempLocationQuery.value = locationQuery.value
  locationDialog.value = true
}

// Select a city from the popular cities list
function selectCity(city) {
  tempLocationQuery.value = city
}

// Confirm location selection and close dialog
function confirmLocationSelection() {
  if (tempLocationQuery.value.trim()) {
    locationQuery.value = tempLocationQuery.value
    handleLocationSearch()
    locationDialog.value = false
  } else {
    toast.error('Please enter a location')
  }
}

onMounted(async () => {
  try {
    await searchRestaurants()
  } catch (error) {
    console.error('Error fetching initial restaurants:', error)
  }
})
</script>

<style scoped>
.location-btn {
  cursor: pointer;
  padding: 0;
  margin-right: 4px;
  z-index: 1;
}

.location-suggestions,
.search-suggestions {
  position: absolute;
  width: 100%;
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
  margin-top: -16px;
  border: 1px solid #e0e0e0;
  border-radius: 0 0 4px 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.location-banner {
  border-radius: 8px;
}

.location-display {
  cursor: pointer;
  flex-grow: 1;
  transition: all 0.2s ease;
}

.location-display:hover {
  opacity: 0.8;
}
</style>
