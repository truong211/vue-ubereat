<template>
  <div class="featured-restaurants">
    <div class="d-flex justify-space-between align-center mb-6">
      <div>
        <h2 class="text-h4">{{ title }}</h2>
        <p class="text-subtitle-2 text-medium-emphasis">{{ subtitle }}</p>
      </div>
      <router-link to="/restaurants" class="text-decoration-none">
        <v-btn variant="text" color="primary" class="hover-scale">
          {{ viewAllText }}
        </v-btn>
      </router-link>
    </div>
    
    <v-row v-if="loading">
      <v-col v-for="i in 3" :key="i" cols="12" sm="6" md="4">
        <v-skeleton-loader type="card" height="300"></v-skeleton-loader>
      </v-col>
    </v-row>
    
    <v-row v-else>
      <v-col v-for="restaurant in featuredRestaurants" :key="restaurant.id" cols="12" sm="6" md="4">
        <v-card 
          @click="goToRestaurant(restaurant.id)" 
          class="restaurant-card h-100" 
          hover
          elevation="3"
        >
          <v-img 
            :src="restaurant.image" 
            height="200" 
            cover
            class="restaurant-image"
          >
            <template v-slot:placeholder>
              <div class="loading-skeleton"></div>
            </template>
            
            <div class="d-flex justify-space-between pa-2">
              <v-chip
                v-if="restaurant.promotion"
                color="primary"
                size="small"
                class="promotion-chip"
              >
                {{ restaurant.promotion }}
              </v-chip>
              
              <v-chip
                v-if="restaurant.deliveryFee === 0"
                color="success"
                size="small"
              >
                Free Delivery
              </v-chip>
            </div>
            
            <div class="image-overlay d-flex flex-column justify-end pa-4">
              <div class="d-flex align-center">
                <v-chip 
                  v-if="restaurant.isOpen !== undefined" 
                  :color="restaurant.isOpen ? 'success' : 'error'" 
                  size="x-small"
                  class="mr-2"
                >
                  {{ restaurant.isOpen ? 'Open' : 'Closed' }}
                </v-chip>
                
                <v-chip
                  v-for="(tag, index) in restaurant.tags?.slice(0, 2)"
                  :key="index"
                  size="x-small"
                  class="mr-2"
                  variant="outlined"
                  color="white"
                >
                  {{ tag }}
                </v-chip>
              </div>
            </div>
          </v-img>
          
          <v-card-title class="d-flex align-start justify-space-between">
            <span class="text-truncate">{{ restaurant.name }}</span>
            <v-btn
              icon
              variant="text"
              density="comfortable"
              color="red"
              @click.stop="toggleFavorite(restaurant)"
            >
              <v-icon>{{ restaurant.isFavorite ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
            </v-btn>
          </v-card-title>
          
          <v-card-subtitle class="pt-0">
            <div class="d-flex align-center mb-1">
              <v-rating
                :model-value="restaurant.rating"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="small"
              ></v-rating>
              <span class="ml-2 text-body-2">{{ restaurant.rating }} ({{ restaurant.reviewCount }})</span>
            </div>
            
            <div class="text-truncate mb-1">{{ restaurant.categories.join(', ') }}</div>
            
            <div class="d-flex align-center text-body-2">
              <v-icon size="small" color="grey">mdi-clock-outline</v-icon>
              <span class="ml-1">{{ restaurant.deliveryTime }} min</span>
              <span class="mx-2">•</span>
              <span v-if="restaurant.deliveryFee === 0">Free delivery</span>
              <span v-else>${{ typeof restaurant.deliveryFee === 'number' ? restaurant.deliveryFee.toFixed(2) : restaurant.deliveryFee }} delivery</span>
            </div>
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, defineComponent, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

export default defineComponent({
  name: 'FeaturedRestaurants',
  
  props: {
    title: {
      type: String,
      default: 'Featured Restaurants'
    },
    subtitle: {
      type: String,
      default: 'Our selection of the best restaurants'
    },
    viewAllText: {
      type: String,
      default: 'View All'
    },
    restaurants: {
      type: Array,
      default: () => []
    },
    maxItems: {
      type: Number,
      default: 6
    }
  },
  
  emits: ['favorite-toggled'],
  
  setup(props, { emit }) {
    const router = useRouter()
    const toast = useToast()
    const loading = ref(true)
    const localRestaurants = ref([])
    
    const fetchFeaturedRestaurants = async () => {
      loading.value = true
      
      try {
        // Use provided restaurants or fetch from API
        if (props.restaurants.length > 0) {
          localRestaurants.value = [...props.restaurants].map(restaurant => ({
            ...restaurant,
            isFavorite: false
          }))
          loading.value = false
          return
        }
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock data
        localRestaurants.value = [
          {
            id: 1,
            name: 'Burger King',
            image: '/images/restaurants/burger-king.jpg',
            rating: 4.2,
            reviewCount: 328,
            categories: ['Burgers', 'Fast Food'],
            deliveryTime: '15-25',
            deliveryFee: 0,
            isOpen: true,
            isFavorite: false,
            promotion: '20% OFF',
            tags: ['Bestseller', 'Fast Delivery']
          },
          {
            id: 2,
            name: 'Pizza Hut',
            image: '/images/restaurants/pizza-hut.jpg',
            rating: 4.5,
            reviewCount: 512,
            categories: ['Pizza', 'Italian'],
            deliveryTime: '20-30',
            deliveryFee: 1.99,
            isOpen: true,
            isFavorite: false,
            tags: ['Family Size', 'Deals']
          },
          {
            id: 3,
            name: 'Sushi Palace',
            image: '/images/restaurants/sushi.jpg',
            rating: 4.8,
            reviewCount: 205,
            categories: ['Sushi', 'Japanese'],
            deliveryTime: '25-40',
            deliveryFee: 2.99,
            isOpen: true,
            isFavorite: false,
            promotion: 'Buy 1 Get 1 Free',
            tags: ['Premium', 'Healthy']
          }
        ]
      } catch (error) {
        toast.error('Failed to load featured restaurants')
        console.error(error)
      } finally {
        loading.value = false
      }
    }
    
    const featuredRestaurants = computed(() => {
      return localRestaurants.value.slice(0, props.maxItems)
    })
    
    const goToRestaurant = (id) => {
      router.push({
        name: 'RestaurantDetail',
        params: { id }
      })
    }
    
    const toggleFavorite = (restaurant) => {
      restaurant.isFavorite = !restaurant.isFavorite
      
      // In a real app, this would call an API to toggle the favorite status
      const message = restaurant.isFavorite 
        ? `Added ${restaurant.name} to favorites` 
        : `Removed ${restaurant.name} from favorites`
      
      toast.success(message)
      emit('favorite-toggled', { id: restaurant.id, isFavorite: restaurant.isFavorite })
    }
    
    onMounted(() => {
      fetchFeaturedRestaurants()
    })
    
    return {
      loading,
      featuredRestaurants,
      goToRestaurant,
      toggleFavorite
    }
  }
})
</script>

<style scoped>
.restaurant-card {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.restaurant-card:hover {
  transform: translateY(-5px);
}

.restaurant-card:hover .restaurant-image {
  transform: scale(1.05);
}

.restaurant-image {
  transition: transform 0.5s ease;
}

.loading-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
}

.promotion-chip {
  background: rgba(63, 81, 181, 0.85) !important;
  color: white !important;
  font-weight: 500;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

@keyframes loading {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style> 