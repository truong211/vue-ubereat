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
            
            <!-- Call to Action Buttons -->
            <div class="d-flex flex-wrap justify-center">
              <v-btn
                color="primary"
                size="large"
                class="mx-2 mb-2 mb-sm-0 hover-scale"
                to="/restaurants"
              >
                Explore Restaurants
              </v-btn>
              <v-btn
                color="success"
                size="large"
                class="mx-2 mb-2 mb-sm-0 hover-scale"
                to="/order-now"
              >
                Order Now
              </v-btn>
              <v-btn
                v-if="!isLoggedIn"
                color="white"
                size="large"
                class="mx-2 hover-scale"
                to="/register"
                variant="outlined"
              >
                Sign Up Now
              </v-btn>
            </div>
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

    <!-- Login/Register CTA for non-logged in users -->
    <v-container v-if="!isLoggedIn" class="my-6 auth-cta-container">
      <v-card class="auth-cta-card pa-4" elevation="4">
        <v-row align="center">
          <v-col cols="12" md="8">
            <h2 class="text-h5 mb-2">Sign in to enjoy personalized recommendations!</h2>
            <p class="mb-0">Get access to exclusive deals, save your favorite restaurants, and track your orders.</p>
          </v-col>
          <v-col cols="12" md="4" class="d-flex justify-center justify-md-end mt-4 mt-md-0">
            <v-btn
              to="/login"
              color="primary"
              variant="flat"
              class="mx-2"
              min-width="100"
            >
              Login
            </v-btn>
            <v-btn
              to="/register"
              color="primary"
              variant="outlined"
              min-width="100"
              class="mx-2"
            >
              Register
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-container>

    <v-container class="pt-6">
      <!-- Promotional Banner -->
      <promotional-banner :banners="promotionalBanners"></promotional-banner>

      <!-- Featured Products Section -->
      <featured-products
        :max-items="8"
        class="mb-8 mt-8"
      ></featured-products>

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

    <!-- Services Section -->
    <v-container fluid class="py-8 grey lighten-4">
      <v-container>
        <services-section></services-section>
      </v-container>
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

    <!-- Featured Products Section (New Enhanced Section) -->
    <v-container class="py-8">
      <div class="d-flex justify-space-between align-center mb-6">
        <h2 class="text-h4">{{ $t('home.featuredProducts.title', 'Món Ngon Nổi Bật') }}</h2>
        <v-btn variant="text" color="primary" to="/foods" class="hover-scale">
          {{ $t('home.featuredProducts.viewAll', 'Xem tất cả món ăn') }}
        </v-btn>
      </div>
      
      <v-row>
        <v-col 
          v-for="(product, index) in featuredProducts" 
          :key="index" 
          cols="12" sm="6" md="4" lg="3"
        >
          <v-card
            class="mx-auto product-card h-100"
            hover
          >
            <div class="product-image-container">
              <v-img
                :src="product.imageUrl || '/img/product-placeholder.jpg'"
                height="200"
                cover
                class="product-image"
              ></v-img>
              <div class="product-badge" v-if="product.discount">
                -{{ product.discount }}%
              </div>
            </div>
            
            <v-card-text>
              <div class="d-flex align-center mb-1">
                <v-rating
                  :model-value="product.rating"
                  color="amber"
                  density="compact"
                  size="small"
                  readonly
                ></v-rating>
                <span class="text-caption ml-2">({{ product.reviewCount }})</span>
                <v-spacer></v-spacer>
                <span class="text-caption">{{ product.restaurant }}</span>
              </div>
              
              <h3 class="product-title text-subtitle-1 font-weight-bold mb-1">{{ product.name }}</h3>
              <p class="product-description text-caption text-medium-emphasis mb-2">{{ product.description }}</p>
              
              <div class="d-flex align-center justify-space-between">
                <div>
                  <span class="text-h6 font-weight-bold primary--text">{{ formatPrice(product.price) }}</span>
                  <span v-if="product.originalPrice" class="text-caption text-decoration-line-through ml-2">
                    {{ formatPrice(product.originalPrice) }}
                  </span>
                </div>
                <v-btn
                  color="primary"
                  icon
                  variant="text"
                  @click.stop="addToCart(product)"
                >
                  <v-icon>mdi-cart-plus</v-icon>
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
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
    <app-download-section
      title="Tải ứng dụng để trải nghiệm tốt hơn"
      description="Đặt món yêu thích, theo dõi đơn hàng theo thời gian thực và nhận nhiều ưu đãi độc quyền dành cho người dùng ứng dụng di động."
    ></app-download-section>

    <!-- Customer testimonials -->
    <v-container fluid class="grey lighten-4 py-12">
      <v-container>
        <customer-testimonials></customer-testimonials>
      </v-container>
    </v-container>

    <!-- FAQ section -->
    <faq-section
      title="Câu hỏi thường gặp"
      help-center-text="Xem tất cả câu hỏi"
      help-center-link="/help"
      contact-link="/contact"
    ></faq-section>

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
// Import Pinia store directly
import { useCategoryStore } from '@/stores/category.js'
// Import other required Pinia stores
import { useProductStore } from '@/stores/product.js'
import { useRestaurantStore } from '@/stores/restaurant.js'
import { useCartStore } from '@/stores/cart.js'
import { useUserStore } from '@/stores/user.js'
import { useAuthStore } from '@/stores/auth.js' // Corrected import path to .js
import PromotionalBanner from '@/components/home/PromotionalBanner.vue'
import ServicesSection from '@/components/home/ServicesSection.vue'
import AppDownloadSection from '@/components/home/AppDownloadSection.vue'
import CustomerTestimonials from '@/components/home/CustomerTestimonials.vue'
import FaqSection from '@/components/home/FaqSection.vue'
import NearbyRestaurants from '@/components/restaurant/NearbyRestaurants.vue'
import FeaturedRestaurants from '@/components/restaurant/FeaturedRestaurants.vue'
import FeaturedProducts from '@/components/product/FeaturedProducts.vue'
import PersonalizedRecommendations from '@/components/recommendation/PersonalizedRecommendations.vue'

const HomeView = {
  name: 'HomeView',

  components: {
    PromotionalBanner,
    ServicesSection,
    AppDownloadSection,
    CustomerTestimonials,
    FaqSection,
    NearbyRestaurants,
    FeaturedRestaurants,
    FeaturedProducts,
    PersonalizedRecommendations
  },

  setup() {
    const { t } = useI18n()
    const router = useRouter()
    const toast = useToast()
    
    // Initialize stores
    const authStore = useAuthStore()
    const categoryStore = useCategoryStore()
    const productStore = useProductStore()      // Now using Pinia store
    const restaurantStore = useRestaurantStore() // Now using Pinia store
    const cartStore = useCartStore()          // Now using Pinia store
    const userStore = useUserStore()          // Now using Pinia store

    const searchQuery = ref('')
    const showAdvancedSearch = ref(false)
    const isLoggedIn = computed(() => authStore.isAuthenticated)
    const locationDialog = ref(false)
    const newLocation = ref('')

    // User location
    const userLocation = ref({
      latitude: null,
      longitude: null,
      address: ''
    })

    // Search filters
    const filters = ref({
      cuisine: null,
      sort: 'popular',
      price: null,
      dietary: null
    })

    // Filter options
    const cuisineOptions = ref([
      'All Cuisines',
      'Italian',
      'Chinese',
      'Japanese',
      'Indian',
      'Thai',
      'Mexican',
      'American'
    ])

    const sortOptions = ref([
      { title: 'Popularity', value: 'popular' },
      { title: 'Rating', value: 'rating' },
      { title: 'Delivery Time', value: 'delivery_time' },
      { title: 'Price: Low to High', value: 'price_asc' },
      { title: 'Price: High to Low', value: 'price_desc' }
    ])

    const priceOptions = ref([
      { title: 'All Prices', value: null },
      { title: '$', value: 'low' },
      { title: '$$', value: 'medium' },
      { title: '$$$', value: 'high' },
      { title: '$$$$', value: 'luxury' }
    ])

    const dietaryOptions = ref([
      { title: 'All', value: null },
      { title: 'Vegetarian', value: 'vegetarian' },
      { title: 'Vegan', value: 'vegan' },
      { title: 'Gluten-Free', value: 'gluten_free' },
      { title: 'Halal', value: 'halal' },
      { title: 'Kosher', value: 'kosher' }
    ])

    const carouselSlides = ref([
      {
        image: '/images/slider/food-delivery-1.jpg',
        title: 'Fast Food Delivery',
        subtitle: 'Order delicious meals from your favorite restaurants'
      },
      {
        image: '/images/slider/food-delivery-2.jpg',
        title: 'Special Discounts',
        subtitle: 'Get exclusive offers on your favorite cuisines'
      },
      {
        image: '/images/slider/food-delivery-3.jpg',
        title: 'Premium Quality',
        subtitle: 'Taste the difference with our selected restaurants'
      }
    ])

    // How it works steps
    const steps = ref([
      {
        icon: 'mdi-map-marker',
        title: 'Set Your Location',
        description: 'Choose your location to find nearby restaurants and stores.'
      },
      {
        icon: 'mdi-food',
        title: 'Choose Your Meal',
        description: 'Browse restaurants and select your favorite dishes.'
      },
      {
        icon: 'mdi-bike-fast',
        title: 'Fast Delivery',
        description: 'Track your order and enjoy quick delivery to your doorstep.'
      }
    ])

    // Categories and Products
    const popularCategories = ref([])
    const featuredProducts = ref([])
    
    // Promotions
    const promotions = ref([
      {
        image: '/images/promotions/promo1.jpg',
        title: 'Special 2+1 Offer',
        description: 'Order any 2 meals and get 1 free dessert.',
        code: 'DESSERT123'
      },
      {
        image: '/images/promotions/promo2.jpg',
        title: 'Free Delivery',
        description: 'Free delivery on orders over $25.',
        code: 'FREEDEL25'
      }
    ])
    
    // Promotional banners
    const promotionalBanners = ref([
      {
        image: '/images/banners/banner1.jpg',
        title: 'Save 20% on Your First Order',
        description: 'Use promo code WELCOME20 at checkout',
        buttonText: 'Order Now',
        link: '/restaurants'
      }
    ])
    
    // Methods
    const searchRestaurants = () => {
      router.push({
        path: '/search',
        query: {
          q: searchQuery.value,
          ...filters.value
        }
      })
    }
    
    const filterByCategory = (categoryId) => {
      router.push({
        path: '/restaurants',
        query: { category: categoryId }
      })
    }
    
    const updateLocation = async (location) => { // Ensure async is present
      userLocation.value = location
      try {
        await userStore.updateLocation(location) // Assuming Pinia action might be async
        console.log('User location updated via store.');
      } catch (error) {
        console.error('Failed to update location via store:', error);
        toast.error('Could not update your location.'); // Add user feedback
      }
    }
    
    const fetchCategories = async () => {
      try {
        // Assuming fetchCategories returns the full list and updates the store state internally
        await categoryStore.fetchCategories()
        // Use a computed property or watch the store state for updates
        // For now, let's assume the store updates its own state and we can access it
        // This might need adjustment based on how categoryStore is implemented
        popularCategories.value = categoryStore.categories.slice(0, 6) // Example access
      } catch (error) {
        console.error('Failed to fetch categories', error)
      }
    }

    const fetchFeaturedProducts = async () => {
      try {
        // Assuming fetchFeaturedProducts updates the store state internally
        await productStore.fetchFeaturedProducts()
        // Access the state from the store
        featuredProducts.value = productStore.featured // Example access
      } catch (error) {
        console.error('Failed to fetch featured products', error)
      }
    }
    
    const handleFavoriteToggled = async (restaurant) => {
      if (!isLoggedIn.value) {
        router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath))
        return
      }
      
      try {
        await restaurantStore.toggleFavorite(restaurant.id) // Assuming Pinia action name is the same
      } catch (error) {
        console.error('Failed to toggle favorite', error)
      }
    }

    const addToCart = async (product) => {
      try {
        await cartStore.addToCart(product) // Assuming Pinia action name is the same
        toast.success(t('cart.addedToCart', { productName: product.name }))
      } catch (error) {
        console.error('Failed to add product to cart', error)
      }
    }

    const formatPrice = (price) => {
      if (typeof price !== 'number' || isNaN(price)) {
        return ''
      }
      return `$${price.toFixed(2)}`
    }

    // Initialize
    onMounted(async () => {
      await Promise.all([
        fetchCategories(),
        fetchFeaturedProducts()
      ])
    })

    return {
      searchQuery,
      carouselSlides,
      steps,
      popularCategories,
      promotions,
      promotionalBanners,
      featuredProducts,
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
      handleFavoriteToggled,
      addToCart,
      formatPrice
    }
  }
}

export default HomeView
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

.product-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  border-radius: 12px;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1) !important;
}

.product-image-container {
  position: relative;
  overflow: hidden;
}

.product-image {
  transition: transform 0.5s ease;
}

.product-card:hover .product-image {
  transform: scale(1.1);
}

.product-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #ff5252;
  color: white;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.8rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.product-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  height: 32px;
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

/* New styles for auth CTA */
.auth-cta-container {
  max-width: 1000px;
}

.auth-cta-card {
  background: linear-gradient(to right, #ffffff, #f8f9fa);
  border-left: 4px solid var(--primary-color);
  border-radius: 8px;
}

/* Hero section styles */
.hero-section {
  position: relative;
}

.search-overlay {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.slide-content {
  background-color: rgba(0, 0, 0, 0.4);
  padding: 2rem;
  border-radius: 8px;
}

.slide-up {
  animation: slide-up 0.6s ease-out;
}

/* Animation keyframes */
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Card styles */
.category-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  cursor: pointer;
}

.category-card:hover {
  transform: translateY(-5px);
}

.category-image {
  transition: transform 0.5s ease;
}

.category-card:hover .category-image {
  transform: scale(1.1);
}

.category-overlay {
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
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
</style>
