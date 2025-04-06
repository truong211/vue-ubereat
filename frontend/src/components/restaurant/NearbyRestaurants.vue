<template>
  <v-card class="nearby-restaurants-container">
    <v-card-title class="text-h6 font-weight-bold">
      <v-icon icon="mdi-map-marker" color="primary" class="mr-2"></v-icon>
      Restaurants Near You
    </v-card-title>
    <v-card-subtitle>{{ location }}</v-card-subtitle>
    
    <v-card-text>
      <v-row v-if="loading">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </v-col>
      </v-row>

      <v-row v-else-if="nearbyRestaurants && nearbyRestaurants.length > 0" dense>
        <v-col v-for="restaurant in nearbyRestaurants" :key="restaurant.id" cols="12" sm="6" md="3">
          <v-card class="restaurant-card hover-scale" @click="goToRestaurant(restaurant.id)">
            <v-img
              :src="restaurant.logo || '/images/placeholder-restaurant.jpg'"
              height="160"
              cover
              class="text-white"
            >
              <template v-slot:placeholder>
                <v-row class="fill-height ma-0" align="center" justify="center">
                  <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
                </v-row>
              </template>
              
              <div class="d-flex flex-column fill-height justify-space-between">
                <v-chip 
                  class="ma-2 distance-chip" 
                  size="small" 
                  prepend-icon="mdi-map-marker-distance"
                >
                  {{ restaurant.distance ? restaurant.distance.toFixed(1) + 'km' : 'Unknown' }}
                </v-chip>
              </div>
            </v-img>
            
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-1">
                <div class="text-subtitle-1 font-weight-medium text-truncate">{{ restaurant.name }}</div>
                <v-rating
                  :model-value="restaurant.rating || 0"
                  color="amber"
                  density="compact"
                  size="small"
                  readonly
                  half-increments
                ></v-rating>
              </div>
              
              <div class="text-caption text-grey mb-2 text-truncate">
                {{ restaurant.cuisineType || restaurant.cuisine || 'Various Cuisines' }}
              </div>
              
              <div class="d-flex align-center text-caption text-grey">
                <v-icon icon="mdi-bike-fast" size="small" class="mr-1"></v-icon>
                <span class="ml-1">{{ restaurant.deliveryFee ? '$' + (restaurant.deliveryFee / 1000).toFixed(1) : 'Free' }}</span>
                <v-spacer></v-spacer>
                <v-icon icon="mdi-clock-outline" size="small"></v-icon>
                <span class="ml-1">{{ restaurant.deliveryTime || restaurant.estimatedDeliveryTime || '30-45' }} min</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-sheet v-else-if="error" class="text-center pa-6">
        <v-icon icon="mdi-alert-circle" size="x-large" color="error" class="mb-4"></v-icon>
        <h3 class="text-h6 mb-2">Error loading restaurants</h3>
        <p class="text-body-2 mb-4">{{ error }}</p>
        <v-btn color="primary" @click="fetchNearbyRestaurants">Try Again</v-btn>
      </v-sheet>

      <v-sheet v-else class="text-center pa-6">
        <v-icon icon="mdi-map-marker-off" size="x-large" color="grey-lighten-1" class="mb-4"></v-icon>
        <h3 class="text-h6 mb-2">No restaurants found nearby</h3>
        <p class="text-body-2 mb-4">Please update your location or try expanding your search area</p>
        <v-btn color="primary" @click="updateLocation">Update Location</v-btn>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import restaurantAPI from '@/services/restaurantAPI'

export default {
  name: 'NearbyRestaurants',
  
  props: {
    userLocation: {
      type: Object,
      default: null
    },
    maxDistance: {
      type: Number,
      default: 5 // km
    },
    maxResults: {
      type: Number,
      default: 8
    }
  },
  
  emits: ['update-location'],
  
  setup(props, { emit }) {
    const router = useRouter()
    const toast = useToast()
    
    const loading = ref(true)
    const restaurants = ref([])
    const error = ref(null)
    const userCoordinates = ref(null)
    const currentAddress = ref('')
    
    const fetchNearbyRestaurants = async () => {
      if (!props.userLocation) {
        loading.value = false
        error.value = null
        restaurants.value = []
        return
      }
      
      loading.value = true
      error.value = null
      
      try {
        console.log('Fetching nearby restaurants with:', {
          lat: props.userLocation.lat,
          lng: props.userLocation.lng,
          maxDistance: props.maxDistance || 5,
          maxResults: props.maxResults || 8
        });
        
        const response = await restaurantAPI.getNearbyRestaurants(
          props.userLocation.lat,
          props.userLocation.lng,
          props.maxDistance || 5,
          props.maxResults || 8
        )
        
        console.log('API Response:', response);
        
        // Reset restaurants to empty array initially
        restaurants.value = []
        
        // Handle response based on its format - Try all known response formats
        if (response && response.data) {
          // Format 1: {data: [...restaurants]}
          if (Array.isArray(response.data)) {
            restaurants.value = response.data
          } 
          // Format 2: {data: {data: {restaurants: [...]}}}
          else if (response.data.data && response.data.data.restaurants) {
            restaurants.value = response.data.data.restaurants
          } 
          // Format 3: {data: {restaurants: [...]}}
          else if (response.data.restaurants) {
            restaurants.value = response.data.restaurants
          } 
          // Format 4: {data: {data: [...]}}
          else if (response.data.data && Array.isArray(response.data.data)) {
            restaurants.value = response.data.data
          } 
          // Format 5: Direct data property with status field
          else if (response.data.status === 'success') {
            if (response.data.data && response.data.data.restaurants) {
              restaurants.value = response.data.data.restaurants
            } else if (Array.isArray(response.data.data)) {
              restaurants.value = response.data.data
            }
          } else {
            console.warn('Unexpected response format:', response.data)
          }
        }
        
        // Log the extracted restaurants data for debugging
        console.log('Extracted restaurants:', restaurants.value)
        
        // Make sure restaurants is always an array
        if (!Array.isArray(restaurants.value)) {
          console.warn('Restaurants data is not an array, resetting to empty array')
          restaurants.value = []
        }
      } catch (err) {
        console.error('Error fetching nearby restaurants:', err)
        const errorMessage = err?.response?.data?.message || 
                          err?.response?.message || 
                          err?.message || 
                          'Could not load nearby restaurants';
        error.value = errorMessage;
        restaurants.value = [];
        
        // Show a toast with the error message
        toast.error(`Failed to load nearby restaurants: ${errorMessage}`);
      } finally {
        loading.value = false
      }
    }
    
    const getCurrentLocation = () => {
      // Use the browser's geolocation API instead of mock data
      if (navigator.geolocation) {
        loading.value = true
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const { latitude, longitude } = position.coords
              
              // Get address using reverse geocoding
              let address = 'Current Location'
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                )
                const data = await response.json()
                if (data && data.display_name) {
                  address = data.display_name
                }
              } catch (e) {
                console.error('Error getting address:', e)
              }
              
              currentAddress.value = address
              userCoordinates.value = { lat: latitude, lng: longitude }
              
              // Update the user location and emit the event
              const locationData = {
                lat: latitude,
                lng: longitude,
                address: address
              }
              
              emit('update-location', locationData)
              
              // Fetch nearby restaurants
              await fetchNearbyRestaurants()
            } catch (err) {
              console.error('Error processing location:', err)
              error.value = 'Error processing your location'
            } finally {
              loading.value = false
            }
          },
          (err) => {
            console.error('Geolocation error:', err)
            error.value = 'Could not get your location. Please check your browser permissions.'
            loading.value = false
            toast.error('Could not get your location')
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        )
      } else {
        error.value = 'Geolocation is not supported by your browser'
        toast.error('Geolocation is not supported by your browser')
      }
    }
    
    const updateLocation = () => {
      emit('update-location')
    }
    
    const goToRestaurant = (id) => {
      router.push({
        name: 'RestaurantDetail',
        params: { id }
      })
    }
    
    const nearbyRestaurants = computed(() => {
      return Array.isArray(restaurants.value) 
        ? restaurants.value.slice(0, props.maxResults) 
        : []
    })
    
    const location = computed(() => {
      return currentAddress.value || 'Location not set'
    })
    
    watch(() => props.userLocation, (newLocation) => {
      if (newLocation) {
        fetchNearbyRestaurants()
      }
    }, { immediate: true })
    
    return {
      loading,
      nearbyRestaurants,
      location,
      updateLocation,
      goToRestaurant,
      error,
      fetchNearbyRestaurants
    }
  }
}
</script>

<style scoped>
.nearby-restaurants-container {
  border-radius: 8px;
  overflow: hidden;
}

.restaurant-card {
  transition: transform 0.2s ease;
}

.restaurant-card:hover {
  transform: translateY(-5px);
}

.distance-chip {
  background: rgba(0, 0, 0, 0.6) !important;
  color: white !important;
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}
</style> 