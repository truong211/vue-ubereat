<template>
  <v-card class="nearby-restaurants-container">
    <v-card-title class="d-flex justify-space-between align-center">
      <div>
        <h2 class="text-h5">Restaurants Near You</h2>
        <p class="text-subtitle-2 text-medium-emphasis">{{ location }}</p>
      </div>
      <v-btn 
        variant="text" 
        color="primary" 
        to="/restaurants" 
        class="hover-scale"
      >
        View All
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-row v-if="loading">
        <v-col v-for="i in 4" :key="i" cols="12" sm="6" md="3">
          <v-skeleton-loader type="card"></v-skeleton-loader>
        </v-col>
      </v-row>

      <v-row v-else-if="nearbyRestaurants.length">
        <v-col v-for="restaurant in nearbyRestaurants" :key="restaurant.id" cols="12" sm="6" md="3">
          <v-card 
            @click="goToRestaurant(restaurant.id)" 
            class="restaurant-card h-100"
            hover
            elevation="2"
          >
            <v-img 
              :src="restaurant.image" 
              height="150" 
              cover
              class="position-relative"
            >
              <div class="d-flex justify-space-between pa-2">
                <v-chip
                  v-if="restaurant.distance"
                  color="info"
                  size="x-small"
                  class="distance-chip"
                >
                  {{ restaurant.distance }} km
                </v-chip>
                <v-chip
                  v-if="restaurant.deliveryFee === 0"
                  color="success"
                  size="x-small"
                >
                  Free Delivery
                </v-chip>
              </div>
            </v-img>
            
            <v-card-title class="text-subtitle-1">
              {{ restaurant.name }}
              <v-chip
                :color="restaurant.isOpen ? 'success' : 'error'"
                size="x-small"
                class="ml-2"
              >
                {{ restaurant.isOpen ? 'Open' : 'Closed' }}
              </v-chip>
            </v-card-title>
            
            <v-card-text>
              <div class="d-flex align-center mb-1">
                <v-rating
                  :model-value="restaurant.rating"
                  color="amber"
                  density="compact"
                  half-increments
                  readonly
                  size="x-small"
                ></v-rating>
                <span class="ml-1 text-body-2">({{ restaurant.reviewCount }})</span>
              </div>
              
              <div class="text-body-2 mb-1">{{ restaurant.categories.join(', ') }}</div>
              
              <div class="d-flex align-center text-body-2">
                <v-icon size="small" color="grey">mdi-clock-outline</v-icon>
                <span class="ml-1">{{ restaurant.deliveryTime }} min</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

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
    const userCoordinates = ref(null)
    const currentAddress = ref('')
    
    const fetchNearbyRestaurants = async () => {
      loading.value = true
      
      try {
        // In a real app, this would call an API with the user's coordinates
        // For demo purposes, we're using mock data
        await new Promise(resolve => setTimeout(resolve, 800)) // Simulate API delay
        
        // Mock data for nearby restaurants
        restaurants.value = [
          {
            id: 1,
            name: 'Burger King',
            image: '/images/restaurants/burger-king.jpg',
            categories: ['Burgers', 'Fast Food'],
            rating: 4.2,
            reviewCount: 328,
            deliveryTime: '15-25',
            deliveryFee: 0,
            distance: '0.8',
            isOpen: true
          },
          {
            id: 2,
            name: 'Pizza Hut',
            image: '/images/restaurants/pizza-hut.jpg',
            categories: ['Pizza', 'Italian'],
            rating: 4.5,
            reviewCount: 512,
            deliveryTime: '20-30',
            deliveryFee: 1.99,
            distance: '1.2',
            isOpen: true
          },
          {
            id: 3,
            name: 'Sushi Palace',
            image: '/images/restaurants/sushi.jpg',
            categories: ['Sushi', 'Japanese'],
            rating: 4.8,
            reviewCount: 205,
            deliveryTime: '25-40',
            deliveryFee: 2.99,
            distance: '1.5',
            isOpen: true
          },
          {
            id: 4,
            name: 'Thai Spice',
            image: '/images/restaurants/thai.jpg',
            categories: ['Thai', 'Asian'],
            rating: 4.4,
            reviewCount: 189,
            deliveryTime: '20-35',
            deliveryFee: 1.50,
            distance: '1.8',
            isOpen: false
          }
        ]
      } catch (error) {
        toast.error('Failed to load nearby restaurants')
        console.error(error)
      } finally {
        loading.value = false
      }
    }
    
    const getCurrentLocation = () => {
      // In a real app, this would use the browser's geolocation API
      // For demo purposes, we're using mock data
      currentAddress.value = props.userLocation?.address || 'San Francisco, CA'
      userCoordinates.value = props.userLocation?.coordinates || { lat: 37.7749, lng: -122.4194 }
      
      fetchNearbyRestaurants()
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
      return restaurants.value.slice(0, props.maxResults)
    })
    
    const location = computed(() => {
      return currentAddress.value || 'Location not set'
    })
    
    onMounted(() => {
      getCurrentLocation()
    })
    
    return {
      loading,
      nearbyRestaurants,
      location,
      updateLocation,
      goToRestaurant
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