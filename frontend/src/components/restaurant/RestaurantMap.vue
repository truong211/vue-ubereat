<template>
  <div class="restaurant-map">
    <!-- Map controls -->
    <div class="map-controls">
      <v-btn-group>
        <v-btn
          icon="mdi-crosshairs-gps"
          variant="tonal"
          @click="centerOnUserLocation"
          :loading="locatingUser"
        ></v-btn>
        <v-btn
          :icon="showList ? 'mdi-map' : 'mdi-format-list-bulleted'"
          variant="tonal"
          @click="toggleView"
        ></v-btn>
      </v-btn-group>
    </div>

    <!-- Map/List toggle view -->
    <v-window v-model="activeView">
      <!-- Map View -->
      <v-window-item value="map">
        <div class="map-container" ref="mapContainer">
          <!-- Map will be mounted here -->
        </div>
        
        <!-- Restaurant preview card when marker is clicked -->
        <v-card
          v-if="selectedRestaurant"
          class="restaurant-preview"
          elevation="4"
          @click="viewRestaurantDetails(selectedRestaurant.id)"
        >
          <div class="d-flex">
            <v-img
              :src="selectedRestaurant.image"
              width="120"
              height="120"
              cover
            ></v-img>
            <v-card-text class="pa-4">
              <div class="text-h6 mb-1">{{ selectedRestaurant.name }}</div>
              <div class="d-flex align-center mb-2">
                <v-rating
                  :model-value="selectedRestaurant.rating"
                  color="amber"
                  density="compact"
                  half-increments
                  readonly
                  size="small"
                ></v-rating>
                <span class="text-body-2 ml-2">({{ selectedRestaurant.reviewCount }})</span>
              </div>
              <div class="text-body-2 mb-1">{{ selectedRestaurant.cuisines.join(', ') }}</div>
              <div class="d-flex align-center">
                <v-icon size="small" color="grey">mdi-map-marker</v-icon>
                <span class="text-body-2 ml-1">{{ selectedRestaurant.distance }}km</span>
                <span class="mx-2">•</span>
                <span class="text-body-2">{{ selectedRestaurant.deliveryTime }} min</span>
              </div>
            </v-card-text>
          </div>
        </v-card>
      </v-window-item>

      <!-- List View -->
      <v-window-item value="list">
        <v-container class="py-2">
          <div v-if="restaurants.length" class="restaurant-list">
            <v-card
              v-for="restaurant in sortedRestaurants"
              :key="restaurant.id"
              :class="[
                'restaurant-card mb-4',
                { 'selected': selectedRestaurant?.id === restaurant.id }
              ]"
              @click="selectRestaurant(restaurant)"
            >
              <div class="d-flex">
                <v-img
                  :src="restaurant.image"
                  width="120"
                  height="120"
                  cover
                ></v-img>
                <v-card-text class="pa-4">
                  <div class="text-h6 mb-1">{{ restaurant.name }}</div>
                  <div class="d-flex align-center mb-2">
                    <v-rating
                      :model-value="restaurant.rating"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="small"
                    ></v-rating>
                    <span class="text-body-2 ml-2">({{ restaurant.reviewCount }})</span>
                  </div>
                  <div class="text-body-2 mb-1">{{ restaurant.cuisines.join(', ') }}</div>
                  <div class="d-flex align-center">
                    <v-icon size="small" color="grey">mdi-map-marker</v-icon>
                    <span class="text-body-2 ml-1">{{ restaurant.distance }}km</span>
                    <span class="mx-2">•</span>
                    <span class="text-body-2">{{ restaurant.deliveryTime }} min</span>
                  </div>
                </v-card-text>
              </div>
            </v-card>
          </div>
          <v-alert
            v-else
            type="info"
            variant="tonal"
            class="mt-4"
          >
            {{ $t('restaurants.noResults') }}
          </v-alert>
        </v-container>
      </v-window-item>
    </v-window>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { Loader } from '@googlemaps/js-api-loader'
import debounce from 'lodash/debounce'

export default {
  name: 'RestaurantMap',
  
  props: {
    restaurants: {
      type: Array,
      required: true
    },
    sortBy: {
      type: String,
      default: 'distance'
    }
  },

  setup(props) {
    const store = useStore()
    const router = useRouter()
    const mapContainer = ref(null)
    const map = ref(null)
    const markers = ref([])
    const selectedRestaurant = ref(null)
    const activeView = ref('map')
    const locatingUser = ref(false)
    const showList = computed(() => activeView.value === 'list')

    // Sort restaurants based on selected criteria
    const sortedRestaurants = computed(() => {
      const sorted = [...props.restaurants]
      switch (props.sortBy) {
        case 'rating':
          return sorted.sort((a, b) => b.rating - a.rating)
        case 'distance':
          return sorted.sort((a, b) => a.distance - b.distance)
        default:
          return sorted
      }
    })

    // Initialize Google Maps
    const initMap = async () => {
      try {
        const loader = new Loader({
          apiKey: process.env.VUE_APP_GOOGLE_MAPS_API_KEY,
          version: 'weekly',
          libraries: ['places']
        })

        const google = await loader.load()
        const userLocation = await store.dispatch('getUserLocation')
        
        map.value = new google.maps.Map(mapContainer.value, {
          center: { lat: userLocation.lat, lng: userLocation.lng },
          zoom: 13,
          styles: [
            // Custom map styles here
          ]
        })

        // Add markers for all restaurants
        addMarkers()

        // Add user location marker
        new google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: map.value,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          }
        })
      } catch (error) {
        console.error('Error initializing map:', error)
        store.dispatch('ui/showSnackbar', {
          text: 'Error loading map',
          color: 'error'
        })
      }
    }

    // Add restaurant markers to map
    const addMarkers = () => {
      // Clear existing markers
      markers.value.forEach(marker => marker.setMap(null))
      markers.value = []

      props.restaurants.forEach(restaurant => {
        const marker = new google.maps.Marker({
          position: {
            lat: restaurant.location.lat,
            lng: restaurant.location.lng
          },
          map: map.value,
          title: restaurant.name,
          animation: google.maps.Animation.DROP
        })

        marker.addListener('click', () => {
          selectRestaurant(restaurant)
        })

        markers.value.push(marker)
      })
    }

    // Center map on user's location
    const centerOnUserLocation = async () => {
      locatingUser.value = true
      try {
        const location = await store.dispatch('getUserLocation')
        if (map.value && location) {
          map.value.panTo({ lat: location.lat, lng: location.lng })
          map.value.setZoom(13)
        }
      } catch (error) {
        console.error('Error getting user location:', error)
      } finally {
        locatingUser.value = false
      }
    }

    // Select a restaurant and show its details
    const selectRestaurant = (restaurant) => {
      selectedRestaurant.value = restaurant
      if (map.value && restaurant.location) {
        map.value.panTo({
          lat: restaurant.location.lat,
          lng: restaurant.location.lng
        })
      }
    }

    // Toggle between map and list view
    const toggleView = () => {
      activeView.value = activeView.value === 'map' ? 'list' : 'map'
    }

    // Navigate to restaurant details page
    const viewRestaurantDetails = (restaurantId) => {
      router.push({
        name: 'RestaurantDetail',
        params: { id: restaurantId }
      })
    }

    // Update markers when restaurants change
    watch(() => props.restaurants, () => {
      if (map.value) {
        addMarkers()
      }
    })

    // Lifecycle hooks
    onMounted(() => {
      initMap()
    })

    onUnmounted(() => {
      // Clean up markers
      markers.value.forEach(marker => marker.setMap(null))
    })

    return {
      mapContainer,
      selectedRestaurant,
      activeView,
      showList,
      locatingUser,
      sortedRestaurants,
      centerOnUserLocation,
      selectRestaurant,
      toggleView,
      viewRestaurantDetails
    }
  }
}
</script>

<style scoped>
.restaurant-map {
  position: relative;
  height: 100%;
  min-height: 400px;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
}

.map-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 1;
}

.restaurant-preview {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 400px;
  z-index: 1;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.restaurant-preview:hover {
  transform: translateX(-50%) translateY(-4px);
}

.restaurant-list {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.restaurant-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.restaurant-card:hover {
  transform: translateY(-4px);
}

.restaurant-card.selected {
  border: 2px solid var(--v-primary-base);
}

@media (max-width: 600px) {
  .restaurant-preview {
    bottom: 0;
    left: 0;
    transform: none;
    width: 100%;
    max-width: none;
    border-radius: 0;
  }

  .restaurant-preview:hover {
    transform: none;
  }
}
</style>