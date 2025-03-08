<template>
  <div class="home">
    <!-- Hero carousel section -->
    <v-container fluid class="hero-section pa-0">
      <v-carousel
        cycle
        height="500"
        hide-delimiter-background
        show-arrows="hover"
      >
        <v-carousel-item
          v-for="(slide, i) in carouselSlides"
          :key="i"
          :src="slide.image"
          cover
        >
          <div class="d-flex flex-column fill-height justify-center align-center text-white slide-content">
            <h1 class="text-h2 font-weight-bold mb-4 text-center slide-up">{{ slide.title }}</h1>
            <p class="text-h5 mb-6 text-center slide-up">{{ slide.subtitle }}</p>
          </div>
        </v-carousel-item>
      </v-carousel>

      <!-- Search overlay -->
      <v-card width="90%" max-width="600" elevation="8" class="search-overlay">
        <v-card-text>
          <v-row align="center">
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="searchQuery"
                :label="$t('home.hero.searchPlaceholder')"
                prepend-inner-icon="mdi-map-marker"
                variant="outlined"
                hide-details
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="4">
              <v-btn 
                color="primary" 
                size="large" 
                block
                @click="searchRestaurants"
                class="hover-scale"
              >
                {{ $t('common.search') }}
              </v-btn>
            </v-col>
          </v-row>
          <v-expand-transition>
            <div v-if="showAdvancedSearch">
              <v-divider class="my-3"></v-divider>
              <v-row>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="filters.cuisine"
                    :items="cuisineOptions"
                    label="Cuisine Type"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="mb-3"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="filters.sort"
                    :items="sortOptions"
                    label="Sort By"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="mb-3"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="filters.price"
                    :items="priceOptions"
                    label="Price Range"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="mb-3"
                  ></v-select>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-select
                    v-model="filters.dietary"
                    :items="dietaryOptions"
                    label="Dietary"
                    variant="outlined"
                    density="comfortable"
                    hide-details
                    class="mb-3"
                  ></v-select>
                </v-col>
              </v-row>
            </div>
          </v-expand-transition>
          <div class="d-flex justify-end mt-2">
            <v-btn
              variant="text"
              size="small"
              @click="showAdvancedSearch = !showAdvancedSearch"
              color="primary"
              class="px-0"
            >
              {{ showAdvancedSearch ? 'Simple Search' : 'Advanced Search' }}
              <v-icon right>{{ showAdvancedSearch ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
          </div>
        </v-card-text>
      </v-card>
    </v-container>

    <v-container class="pt-12">
      <!-- Promotional Banner -->
      <promotional-banner :banners="promotionalBanners"></promotional-banner>
      
      <!-- Personalized Recommendations (if logged in) -->
      <personalized-recommendations 
        v-if="isLoggedIn"
        :is-logged-in="isLoggedIn"
        class="mb-8"
      ></personalized-recommendations>
      
      <!-- Nearby Restaurants -->
      <nearby-restaurants 
        :user-location="userLocation" 
        :max-results="4"
        class="mb-8"
        @update-location="updateLocation"
      ></nearby-restaurants>
    </v-container>

    <!-- How it works section -->
    <v-container class="py-8">
      <h2 class="text-h4 text-center mb-8 slide-up">{{ $t('home.howItWorks.title') }}</h2>
      <v-row>
        <v-col v-for="(step, index) in steps" :key="index" cols="12" md="4">
          <v-card class="mx-auto h-100 hover-shadow" flat>
            <div class="text-center pa-4">
              <v-icon size="x-large" color="primary">{{ step.icon }}</v-icon>
              <h3 class="text-h5 my-3">{{ step.title }}</h3>
              <p>{{ step.description }}</p>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Categories section -->
    <v-container fluid class="grey lighten-4 py-8">
      <v-container>
        <div class="d-flex justify-space-between align-center mb-6">
          <h2 class="text-h4">{{ $t('home.categories.title') }}</h2>
          <v-btn variant="text" color="primary" to="/restaurants" class="hover-scale">
            {{ $t('home.categories.viewAll') }}
          </v-btn>
        </div>
        <v-row>
          <v-col v-for="category in popularCategories" :key="category.id" cols="6" sm="4" md="3" lg="2">
            <v-card 
              @click="filterByCategory(category.id)" 
              class="mx-auto category-card"
              hover
              elevation="2"
            >
              <v-img :src="category.image" height="120" cover class="category-image">
                <div class="d-flex align-end h-100">
                  <div class="category-overlay text-center w-100 pa-2">
                    <div class="text-subtitle-1 font-weight-medium text-white">{{ category.name }}</div>
                  </div>
                </div>
              </v-img>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-container>
    
    <!-- Featured restaurants section -->
    <v-container class="py-8">
      <featured-restaurants 
        :max-items="6"
        @favorite-toggled="handleFavoriteToggled"
      ></featured-restaurants>
    </v-container>

    <!-- Promotions section -->
    <v-container fluid class="primary lighten-5 py-8">
      <v-container>
        <h2 class="text-h4 mb-6">{{ $t('home.promotions.title') }}</h2>
        <v-row>
          <v-col v-for="(promo, index) in promotions" :key="index" cols="12" md="6">
            <v-card class="mx-auto hover-shadow" hover>
              <v-row no-gutters>
                <v-col cols="4">
                  <v-img :src="promo.image" height="100%" cover></v-img>
                </v-col>
                <v-col cols="8">
                  <v-card-text>
                    <div class="text-h6 mb-2">{{ promo.title }}</div>
                    <p>{{ promo.description }}</p>
                    <v-btn color="primary" variant="text" class="hover-scale">
                      {{ $t('home.promotions.useCode') }}: {{ promo.code }}
                    </v-btn>
                  </v-card-text>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-container>

    <!-- App download section -->
    <v-container class="py-12">
      <v-row align="center">
        <v-col cols="12" md="6">
          <h2 class="text-h4 mb-4">{{ $t('home.app.title') }}</h2>
          <p class="mb-6">{{ $t('home.app.description') }}</p>
          <div class="d-flex flex-wrap">
            <v-img src="/images/app-store.png" max-width="180" class="mr-4 mb-4 hover-scale"></v-img>
            <v-img src="/images/google-play.png" max-width="180" class="mb-4 hover-scale"></v-img>
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <v-img src="/images/app-mockup.png" max-width="400" class="mx-auto slide-up"></v-img>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Location update dialog -->
    <v-dialog v-model="locationDialog" max-width="500">
      <v-card>
        <v-card-title>Update Your Location</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="newLocation"
            label="Enter your address"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          <v-btn color="primary" block @click="confirmLocationUpdate">Update</v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import PromotionalBanner from '@/components/common/PromotionalBanner.vue'
import NearbyRestaurants from '@/components/restaurant/NearbyRestaurants.vue'
import FeaturedRestaurants from '@/components/restaurant/FeaturedRestaurants.vue'
import PersonalizedRecommendations from '@/components/restaurant/PersonalizedRecommendations.vue'

export default {
  name: 'HomeView',
  
  components: {
    PromotionalBanner,
    NearbyRestaurants,
    FeaturedRestaurants,
    PersonalizedRecommendations
  },

  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const toast = useToast()
    
    const searchQuery = ref('')
    const showAdvancedSearch = ref(false)
    const isLoggedIn = ref(true) // Would be determined by auth state in real app
    const locationDialog = ref(false)
    const newLocation = ref('')
    
    // User location
    const userLocation = ref({
      address: 'San Francisco, CA',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    })
    
    // Search filters
    const filters = ref({
      cuisine: null,
      sort: 'rating',
      price: null,
      dietary: null
    })
    
    // Filter options
    const cuisineOptions = [
      { title: 'All Cuisines', value: null },
      { title: 'American', value: 'american' },
      { title: 'Italian', value: 'italian' },
      { title: 'Chinese', value: 'chinese' },
      { title: 'Japanese', value: 'japanese' },
      { title: 'Mexican', value: 'mexican' },
      { title: 'Thai', value: 'thai' },
      { title: 'Indian', value: 'indian' }
    ]
    
    const sortOptions = [
      { title: 'Rating', value: 'rating' },
      { title: 'Delivery Time', value: 'deliveryTime' },
      { title: 'Distance', value: 'distance' },
      { title: 'Popularity', value: 'popularity' }
    ]
    
    const priceOptions = [
      { title: 'All Prices', value: null },
      { title: '$', value: '1' },
      { title: '$$', value: '2' },
      { title: '$$$', value: '3' },
      { title: '$$$$', value: '4' }
    ]
    
    const dietaryOptions = [
      { title: 'None', value: null },
      { title: 'Vegetarian', value: 'vegetarian' },
      { title: 'Vegan', value: 'vegan' },
      { title: 'Gluten-Free', value: 'gluten-free' },
      { title: 'Halal', value: 'halal' },
      { title: 'Kosher', value: 'kosher' }
    ]

    const carouselSlides = [
      {
        image: '/images/banners/banner1.jpg',
        title: t('home.hero.title'),
        subtitle: t('home.hero.subtitle')
      },
      {
        image: '/images/banners/banner2.jpg',
        title: t('home.hero.title2'),
        subtitle: t('home.hero.subtitle2')
      },
      {
        image: '/images/banners/banner3.jpg',
        title: t('home.hero.title3'),
        subtitle: t('home.hero.subtitle3')
      }
    ]

    const steps = [
      {
        icon: 'mdi-map-marker',
        title: t('home.howItWorks.step1.title'),
        description: t('home.howItWorks.step1.description')
      },
      {
        icon: 'mdi-food',
        title: t('home.howItWorks.step2.title'),
        description: t('home.howItWorks.step2.description')
      },
      {
        icon: 'mdi-bike-fast',
        title: t('home.howItWorks.step3.title'),
        description: t('home.howItWorks.step3.description')
      }
    ]
    
    // Promotional banners
    const promotionalBanners = ref([
      {
        title: 'Limited Time Offer: 30% OFF',
        description: 'Use code WELCOME30 on your first order',
        buttonText: 'Order Now',
        link: '/restaurants',
        image: '/images/banners/promo-banner1.jpg'
      },
      {
        title: 'Free Delivery Weekend',
        description: 'No delivery fees on all orders over $20',
        buttonText: 'Explore Restaurants',
        link: '/restaurants',
        image: '/images/banners/promo-banner2.jpg'
      },
      {
        title: 'Try Our New Partner Restaurants',
        description: 'Exciting new flavors await',
        buttonText: 'Discover Now',
        link: '/restaurants',
        image: '/images/banners/promo-banner3.jpg'
      }
    ])
    
    const popularCategories = [
      { id: 1, name: 'Pizza', image: '/images/categories/pizza.jpg' },
      { id: 2, name: 'Burgers', image: '/images/categories/burger.jpg' },
      { id: 3, name: 'Sushi', image: '/images/categories/sushi.jpg' },
      { id: 4, name: 'Healthy', image: '/images/categories/healthy.jpg' },
      { id: 5, name: 'Italian', image: '/images/categories/italian.jpg' },
      { id: 6, name: 'Chinese', image: '/images/categories/chinese.jpg' },
      { id: 7, name: 'Indian', image: '/images/categories/indian.jpg' },
      { id: 8, name: 'Mexican', image: '/images/categories/mexican.jpg' },
      { id: 9, name: 'Thai', image: '/images/categories/thai.jpg' },
      { id: 10, name: 'Desserts', image: '/images/categories/desserts.jpg' },
      { id: 11, name: 'Breakfast', image: '/images/categories/breakfast.jpg' },
      { id: 12, name: 'Drinks', image: '/images/categories/drinks.jpg' },
    ]
    
    const promotions = [
      {
        title: '50% OFF Your First Order',
        description: 'Use this code for 50% off your first order over $20',
        code: 'WELCOME50',
        image: '/images/promotions/promo1.jpg'
      },
      {
        title: 'Free Delivery',
        description: 'Get free delivery on all orders over $15',
        code: 'FREEDEL',
        image: '/images/promotions/promo2.jpg'
      }
    ]
    
    // Methods
    const searchRestaurants = () => {
      // Build query parameters based on search and filters
      const query = { 
        address: searchQuery.value 
      }
      
      // Add any selected filters
      if (filters.value.cuisine) query.cuisine = filters.value.cuisine
      if (filters.value.price) query.price = filters.value.price
      if (filters.value.dietary) query.dietary = filters.value.dietary
      if (filters.value.sort) query.sort = filters.value.sort
      
      // Navigate to restaurants page with query params
      router.push({
        name: 'Restaurants',
        query
      })
    }
    
    const filterByCategory = (categoryId) => {
      router.push({
        name: 'Restaurants',
        query: { category: categoryId }
      })
    }
    
    const updateLocation = () => {
      locationDialog.value = true
    }
    
    const confirmLocationUpdate = () => {
      if (newLocation.value) {
        userLocation.value = {
          ...userLocation.value,
          address: newLocation.value
        }
        
        toast.success(`Location updated to ${newLocation.value}`)
        
        // In a real app, geocoding would be done here to get coordinates
        // For this demo, we'll just update the address
        
        locationDialog.value = false
        newLocation.value = ''
      }
    }
    
    const handleFavoriteToggled = ({ id, isFavorite }) => {
      // This would typically update a user's favorites in the application state
      console.log(`Restaurant ${id} favorite status: ${isFavorite}`)
    }
    
    onMounted(() => {
      // Check if user is logged in
      // In a real app this would be handled by auth service
    })

    return {
      searchQuery,
      carouselSlides,
      steps,
      popularCategories,
      promotions,
      promotionalBanners,
      isLoggedIn,
      userLocation,
      showAdvancedSearch,
      filters,
      cuisineOptions,
      sortOptions,
      priceOptions,
      dietaryOptions,
      locationDialog,
      newLocation,
      searchRestaurants,
      filterByCategory,
      updateLocation,
      confirmLocationUpdate,
      handleFavoriteToggled
    }
  }
}
</script>

<style scoped>
.hero-section {
  position: relative;
}

.slide-content {
  background: rgba(0, 0, 0, 0.4);
  padding: 2rem;
}

.search-overlay {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.category-card {
  transition: transform 0.2s ease;
  overflow: hidden;
}

.category-card:hover {
  transform: translateY(-5px);
}

.category-card:hover .category-image {
  transform: scale(1.1);
}

.category-image {
  transition: transform 0.5s ease;
}

.category-overlay {
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
}

.hover-shadow {
  transition: box-shadow 0.3s ease;
}

.hover-shadow:hover {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

@media (max-width: 600px) {
  .slide-content {
    padding: 1rem;
  }
  
  .search-overlay {
    position: relative;
    bottom: auto;
    left: auto;
    transform: none;
    width: 100%;
    margin: -2rem auto 2rem;
  }
  
  .text-h2 {
    font-size: 2rem !important;
  }
  
  .text-h5 {
    font-size: 1.2rem !important;
  }
}

/* Animation delays for staggered entrance */
.slide-up {
  animation-delay: 0.2s;
}

.v-col:nth-child(2) .slide-up {
  animation-delay: 0.4s;
}

.v-col:nth-child(3) .slide-up {
  animation-delay: 0.6s;
}
</style>
