<template>
  <v-card class="personalized-recs mb-6">
    <v-card-title class="d-flex justify-space-between align-center">
      <div>
        <h2 class="text-h5">{{ title }}</h2>
        <p class="text-subtitle-2 text-medium-emphasis">Based on your order history</p>
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

    <v-divider></v-divider>
    
    <v-card-text class="py-4">
      <div v-if="!isLoggedIn" class="text-center pa-6">
        <v-icon icon="mdi-account-circle-outline" size="x-large" color="grey-lighten-1" class="mb-4"></v-icon>
        <h3 class="text-h6 mb-2">Login to see your personalized recommendations</h3>
        <p class="text-body-2 mb-4">We'll suggest restaurants and dishes based on your taste</p>
        <v-btn color="primary" to="/auth/login">Login</v-btn>
      </div>
      
      <v-row v-else-if="loading">
        <v-col v-for="i in 4" :key="i" cols="12" sm="6" md="3">
          <v-skeleton-loader type="card"></v-skeleton-loader>
        </v-col>
      </v-row>
      
      <div v-else>
        <v-tabs v-model="activeTab" color="primary" center-active>
          <v-tab value="favorites">Your Favorites</v-tab>
          <v-tab value="similar">Similar to Past Orders</v-tab>
          <v-tab value="trending">Trending Near You</v-tab>
        </v-tabs>
        
        <v-window v-model="activeTab" class="mt-4">
          <v-window-item value="favorites">
            <v-row v-if="favorites.length">
              <v-col v-for="item in favorites" :key="item.id" cols="12" sm="6" md="3">
                <restaurant-recommendation-card :item="item" />
              </v-col>
            </v-row>
            
            <v-sheet v-else class="text-center pa-4">
              <p>You haven't favorited any restaurants yet. Heart your favorite places to see them here!</p>
            </v-sheet>
          </v-window-item>
          
          <v-window-item value="similar">
            <v-row>
              <v-col v-for="item in similarRestaurants" :key="item.id" cols="12" sm="6" md="3">
                <restaurant-recommendation-card :item="item" />
              </v-col>
            </v-row>
          </v-window-item>
          
          <v-window-item value="trending">
            <v-row>
              <v-col v-for="item in trendingRestaurants" :key="item.id" cols="12" sm="6" md="3">
                <restaurant-recommendation-card :item="item" />
              </v-col>
            </v-row>
          </v-window-item>
        </v-window>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import RestaurantRecommendationCard from './RestaurantRecommendationCard.vue'

export default {
  name: 'PersonalizedRecommendations',
  
  components: {
    RestaurantRecommendationCard
  },
  
  props: {
    title: {
      type: String,
      default: 'Recommended for You'
    },
    isLoggedIn: {
      type: Boolean,
      default: true
    }
  },
  
  setup() {
    const toast = useToast()
    const loading = ref(true)
    const activeTab = ref('favorites')
    
    // These would be fetched from an API in a real application
    const favorites = ref([])
    const similarRestaurants = ref([])
    const trendingRestaurants = ref([])
    
    const fetchRecommendations = async () => {
      loading.value = true
      
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock data
        favorites.value = [
          {
            id: 1,
            name: 'Burger King',
            image: '/images/restaurants/burger-king.jpg',
            rating: 4.2,
            categories: ['Burgers', 'Fast Food'],
            lastOrdered: '2 days ago',
            favoriteItem: 'Whopper Meal',
            type: 'restaurant'
          },
          {
            id: 3,
            name: 'Sushi Palace',
            image: '/images/restaurants/sushi.jpg',
            rating: 4.8,
            categories: ['Sushi', 'Japanese'],
            lastOrdered: '1 week ago',
            favoriteItem: 'Dragon Roll Combo',
            type: 'restaurant'
          }
        ]
        
        similarRestaurants.value = [
          {
            id: 5,
            name: 'Five Guys',
            image: '/images/restaurants/five-guys.jpg',
            rating: 4.6,
            categories: ['Burgers', 'American'],
            reason: 'Similar to Burger King',
            type: 'restaurant'
          },
          {
            id: 6,
            name: 'Sushi House',
            image: '/images/restaurants/sushi-house.jpg',
            rating: 4.7,
            categories: ['Sushi', 'Japanese'],
            reason: 'Similar to Sushi Palace',
            type: 'restaurant'
          },
          {
            id: 7,
            name: 'Taco Bell',
            image: '/images/restaurants/taco-bell.jpg',
            rating: 3.9,
            categories: ['Mexican', 'Fast Food'],
            reason: 'You might like this',
            type: 'restaurant'
          },
          {
            id: 8,
            name: 'Pizza Express',
            image: '/images/restaurants/pizza-express.jpg',
            rating: 4.3,
            categories: ['Pizza', 'Italian'],
            reason: 'Popular in your area',
            type: 'restaurant'
          }
        ]
        
        trendingRestaurants.value = [
          {
            id: 9,
            name: 'The Spicy Noodle',
            image: '/images/restaurants/spicy-noodle.jpg',
            rating: 4.5,
            categories: ['Chinese', 'Noodles'],
            trending: true,
            popularity: '92% ordered again',
            type: 'restaurant'
          },
          {
            id: 10,
            name: 'Fresh Poke',
            image: '/images/restaurants/poke.jpg',
            rating: 4.4,
            categories: ['Hawaiian', 'Healthy'],
            trending: true,
            popularity: 'Ordered 5x more this week',
            type: 'restaurant'
          },
          {
            id: 11,
            name: 'Shake Shack',
            image: '/images/restaurants/shake-shack.jpg',
            rating: 4.7,
            categories: ['Burgers', 'American'],
            trending: true,
            popularity: 'New and popular',
            type: 'restaurant'
          },
          {
            id: 12,
            name: 'Vegan Delight',
            image: '/images/restaurants/vegan.jpg',
            rating: 4.6,
            categories: ['Vegan', 'Healthy'],
            trending: true,
            popularity: 'Top rated this month',
            type: 'restaurant'
          }
        ]
      } catch (error) {
        toast.error('Failed to load recommendations')
        console.error(error)
      } finally {
        loading.value = false
      }
    }
    
    onMounted(() => {
      fetchRecommendations()
    })
    
    return {
      loading,
      activeTab,
      favorites,
      similarRestaurants,
      trendingRestaurants
    }
  }
}
</script>

<style scoped>
.personalized-recs {
  border-radius: 8px;
  overflow: hidden;
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}
</style> 