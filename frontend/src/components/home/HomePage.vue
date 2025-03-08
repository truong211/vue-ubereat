<template>
  <div class="home-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <v-container>
        <v-row align="center" class="py-12">
          <v-col cols="12" md="6">
            <h1 class="text-h2 font-weight-bold mb-4">Delicious Food Delivered To Your Door</h1>
            <p class="text-body-1 mb-6">
              Order from your favorite restaurants and get food delivered right to your doorstep. Fast, reliable, and delicious!
            </p>
            <div class="d-flex flex-wrap gap-4">
              <v-btn
                color="primary"
                size="large"
                to="/restaurants"
                prepend-icon="mdi-silverware-fork-knife"
              >
                Order Now
              </v-btn>
              <v-btn
                variant="outlined"
                size="large"
                to="/restaurants/register"
                prepend-icon="mdi-store"
              >
                Register Restaurant
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="6" class="d-flex justify-center">
            <v-img
              src="/images/hero-food.jpg"
              alt="Delicious Food"
              max-width="500"
              class="rounded-lg hero-image"
            ></v-img>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Search Section -->
    <section class="search-section py-6">
      <v-container>
        <v-card class="search-card pa-4">
          <v-row align="center">
            <v-col cols="12" sm="5">
              <v-text-field
                v-model="searchQuery"
                label="Search for food or restaurants"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-magnify"
                hide-details
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="5">
              <v-autocomplete
                v-model="selectedLocation"
                :items="locations"
                label="Delivery Location"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-map-marker"
                hide-details
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" sm="2">
              <v-btn
                color="primary"
                block
                height="56"
                @click="searchRestaurants"
              >
                Search
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </section>

    <!-- Featured Restaurants Section -->
    <section class="featured-section py-12">
      <v-container>
        <div class="d-flex justify-space-between align-center mb-6">
          <h2 class="text-h4 font-weight-bold">Featured Restaurants</h2>
          <v-btn
            variant="text"
            color="primary"
            to="/restaurants"
            append-icon="mdi-arrow-right"
          >
            View All
          </v-btn>
        </div>

        <v-row v-if="loading">
          <v-col
            v-for="i in 4"
            :key="i"
            cols="12"
            sm="6"
            md="3"
          >
            <v-skeleton-loader
              type="card"
              height="300"
            ></v-skeleton-loader>
          </v-col>
        </v-row>

        <v-row v-else-if="featuredRestaurants.length > 0">
          <v-col
            v-for="restaurant in featuredRestaurants"
            :key="restaurant.id"
            cols="12"
            sm="6"
            md="3"
          >
            <v-card
              class="restaurant-card h-100"
              :to="{ name: 'RestaurantDetail', params: { id: restaurant.id }}"
            >
              <v-img
                :src="restaurant.image_url || '/images/restaurant-placeholder.jpg'"
                height="180"
                cover
                class="restaurant-image"
              >
                <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </div>
                </template>
                <div class="restaurant-overlay d-flex align-end">
                  <div v-if="restaurant.delivery_time" class="delivery-time">
                    {{ restaurant.delivery_time }} min
                  </div>
                </div>
              </v-img>

              <v-card-title class="restaurant-title">
                {{ restaurant.name }}
              </v-card-title>

              <v-card-subtitle>
                <div class="d-flex align-center">
                  <v-rating
                    :model-value="restaurant.rating"
                    color="amber"
                    density="compact"
                    size="small"
                    readonly
                  ></v-rating>
                  <span class="text-body-2 ml-2">
                    {{ restaurant.rating.toFixed(1) }}
                    ({{ restaurant.review_count || 0 }})
                  </span>
                </div>
                <div class="text-truncate">
                  {{ restaurant.cuisine_type || 'Various Cuisines' }}
                </div>
              </v-card-subtitle>

              <v-card-text class="pt-0">
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-1">mdi-map-marker</v-icon>
                  <span class="text-body-2 text-truncate">{{ restaurant.address }}</span>
                </div>
                <div class="d-flex align-center mt-1">
                  <v-icon size="small" color="success" class="mr-1">mdi-currency-usd</v-icon>
                  <span class="text-body-2">{{ restaurant.price_range || '$' }}</span>
                  <v-spacer></v-spacer>
                  <v-chip
                    v-if="restaurant.free_delivery"
                    size="x-small"
                    color="success"
                    variant="outlined"
                  >
                    Free Delivery
                  </v-chip>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <div v-else class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-store-off</v-icon>
          <div class="text-h6 mt-4">No restaurants found</div>
          <div class="text-body-1 text-medium-emphasis mb-4">
            Try changing your search criteria
          </div>
        </div>
      </v-container>
    </section>

    <!-- Popular Dishes Section -->
    <section class="popular-dishes-section py-12 bg-grey-lighten-4">
      <v-container>
        <h2 class="text-h4 font-weight-bold mb-6">Popular Dishes</h2>
        
        <v-slide-group
          show-arrows
          class="pa-4"
        >
          <v-slide-group-item
            v-for="dish in popularDishes"
            :key="dish.id"
          >
            <v-card
              width="240"
              class="ma-2 dish-card"
              :to="{ name: 'RestaurantDetail', params: { id: dish.restaurant_id }}"
            >
              <v-img
                :src="dish.image_url || '/images/dish-placeholder.jpg'"
                height="160"
                cover
                class="dish-image"
              ></v-img>
              
              <v-card-title class="dish-title">
                {{ dish.name }}
              </v-card-title>
              
              <v-card-subtitle>
                <div class="d-flex align-center">
                  <v-icon size="small" color="primary" class="mr-1">mdi-store</v-icon>
                  <span class="text-body-2 text-truncate">{{ dish.restaurant_name }}</span>
                </div>
              </v-card-subtitle>
              
              <v-card-text class="pt-0">
                <div class="d-flex justify-space-between align-center">
                  <span class="text-h6 font-weight-bold">{{ formatPrice(dish.price) }}</span>
                  <v-btn
                    icon
                    color="primary"
                    variant="text"
                    size="small"
                  >
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-slide-group-item>
        </v-slide-group>
      </v-container>
    </section>

    <!-- Categories Section -->
    <section class="categories-section py-12">
      <v-container>
        <h2 class="text-h4 font-weight-bold mb-6">Browse By Category</h2>
        
        <v-row>
          <v-col
            v-for="category in categories"
            :key="category.id"
            cols="6"
            sm="4"
            md="2"
          >
            <v-card
              class="category-card text-center pa-4"
              :to="{ name: 'Restaurants', query: { category: category.id }}"
              flat
            >
              <v-avatar
                color="primary"
                size="64"
                class="mb-3"
              >
                <v-icon size="32" color="white">{{ category.icon }}</v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-medium">{{ category.name }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- How It Works Section -->
    <section class="how-it-works-section py-12 bg-grey-lighten-4">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-center mb-8">How It Works</h2>
        
        <v-row>
          <v-col
            v-for="(step, index) in howItWorks"
            :key="index"
            cols="12"
            md="4"
            class="text-center"
          >
            <v-avatar
              color="primary"
              size="80"
              class="mb-4"
            >
              <v-icon size="40" color="white">{{ step.icon }}</v-icon>
            </v-avatar>
            <h3 class="text-h5 font-weight-bold mb-2">{{ step.title }}</h3>
            <p class="text-body-1">{{ step.description }}</p>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- App Download Section -->
    <section class="app-download-section py-12">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="6">
            <h2 class="text-h4 font-weight-bold mb-4">Get The Mobile App</h2>
            <p class="text-body-1 mb-6">
              Download our mobile app for a better experience. Order food, track delivery, and get exclusive offers.
            </p>
            <div class="d-flex flex-wrap gap-4">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-apple"
                size="large"
                href="#"
                target="_blank"
              >
                App Store
              </v-btn>
              <v-btn
                variant="outlined"
                prepend-icon="mdi-google-play"
                size="large"
                href="#"
                target="_blank"
              >
                Google Play
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="6" class="d-flex justify-center">
            <v-img
              src="/images/mobile-app.png"
              alt="Mobile App"
              max-width="400"
              class="rounded-lg"
            ></v-img>
          </v-col>
        </v-row>
      </v-container>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials-section py-12 bg-grey-lighten-4">
      <v-container>
        <h2 class="text-h4 font-weight-bold text-center mb-8">What Our Customers Say</h2>
        
        <v-carousel
          hide-delimiters
          show-arrows="hover"
          height="300"
        >
          <v-carousel-item
            v-for="(testimonial, index) in testimonials"
            :key="index"
          >
            <v-sheet
              class="d-flex flex-column align-center justify-center fill-height pa-6"
              color="transparent"
            >
              <v-avatar size="80" class="mb-4">
                <v-img :src="testimonial.avatar" alt="Customer Avatar"></v-img>
              </v-avatar>
              <div class="text-body-1 text-center mb-4 testimonial-text">
                "{{ testimonial.text }}"
              </div>
              <v-rating
                :model-value="testimonial.rating"
                color="amber"
                readonly
                size="small"
                class="mb-2"
              ></v-rating>
              <div class="text-subtitle-1 font-weight-bold">{{ testimonial.name }}</div>
              <div class="text-caption">{{ testimonial.location }}</div>
            </v-sheet>
          </v-carousel-item>
        </v-carousel>
      </v-container>
    </section>

    <!-- Newsletter Section -->
    <section class="newsletter-section py-12">
      <v-container>
        <v-card class="newsletter-card pa-6">
          <v-row align="center">
            <v-col cols="12" md="7">
              <h2 class="text-h4 font-weight-bold mb-2">Subscribe to Our Newsletter</h2>
              <p class="text-body-1">
                Get updates on special offers, new restaurants, and more.
              </p>
            </v-col>
            <v-col cols="12" md="5">
              <v-form @submit.prevent="subscribeNewsletter">
                <div class="d-flex">
                  <v-text-field
                    v-model="newsletterEmail"
                    label="Your Email"
                    variant="outlined"
                    hide-details
                    class="mr-2"
                  ></v-text-field>
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="subscribing"
                  >
                    Subscribe
                  </v-btn>
                </div>
              </v-form>
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </section>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'HomePage',
  
  data() {
    return {
      loading: false,
      searchQuery: '',
      selectedLocation: null,
      newsletterEmail: '',
      subscribing: false,
      
      locations: [
        'Ho Chi Minh City',
        'Hanoi',
        'Da Nang',
        'Nha Trang',
        'Can Tho',
        'Hue'
      ],
      
      featuredRestaurants: [
        {
          id: 1,
          name: 'Pho Delicious',
          image_url: '/images/restaurants/pho-restaurant.jpg',
          rating: 4.7,
          review_count: 243,
          cuisine_type: 'Vietnamese',
          address: '123 Nguyen Hue, District 1',
          price_range: '$$',
          delivery_time: 25,
          free_delivery: true
        },
        {
          id: 2,
          name: 'Sushi World',
          image_url: '/images/restaurants/sushi-restaurant.jpg',
          rating: 4.5,
          review_count: 187,
          cuisine_type: 'Japanese',
          address: '45 Le Loi, District 1',
          price_range: '$$$',
          delivery_time: 35,
          free_delivery: false
        },
        {
          id: 3,
          name: 'Pizza Heaven',
          image_url: '/images/restaurants/pizza-restaurant.jpg',
          rating: 4.3,
          review_count: 156,
          cuisine_type: 'Italian',
          address: '78 Pasteur, District 3',
          price_range: '$$',
          delivery_time: 30,
          free_delivery: true
        },
        {
          id: 4,
          name: 'Burger Joint',
          image_url: '/images/restaurants/burger-restaurant.jpg',
          rating: 4.2,
          review_count: 132,
          cuisine_type: 'American',
          address: '22 Thai Van Lung, District 1',
          price_range: '$$',
          delivery_time: 20,
          free_delivery: false
        }
      ],
      
      popularDishes: [
        {
          id: 1,
          name: 'Beef Pho',
          image_url: '/images/dishes/pho.jpg',
          restaurant_id: 1,
          restaurant_name: 'Pho Delicious',
          price: 75000
        },
        {
          id: 2,
          name: 'Salmon Sushi Set',
          image_url: '/images/dishes/sushi.jpg',
          restaurant_id: 2,
          restaurant_name: 'Sushi World',
          price: 150000
        },
        {
          id: 3,
          name: 'Margherita Pizza',
          image_url: '/images/dishes/pizza.jpg',
          restaurant_id: 3,
          restaurant_name: 'Pizza Heaven',
          price: 120000
        },
        {
          id: 4,
          name: 'Classic Cheeseburger',
          image_url: '/images/dishes/burger.jpg',
          restaurant_id: 4,
          restaurant_name: 'Burger Joint',
          price: 85000
        },
        {
          id: 5,
          name: 'Pad Thai',
          image_url: '/images/dishes/padthai.jpg',
          restaurant_id: 5,
          restaurant_name: 'Thai Flavors',
          price: 90000
        },
        {
          id: 6,
          name: 'Chicken Biryani',
          image_url: '/images/dishes/biryani.jpg',
          restaurant_id: 6,
          restaurant_name: 'Spice Garden',
          price: 110000
        }
      ],
      
      categories: [
        { id: 1, name: 'Vietnamese', icon: 'mdi-bowl-mix' },
        { id: 2, name: 'Japanese', icon: 'mdi-food-sushi' },
        { id: 3, name: 'Italian', icon: 'mdi-pizza' },
        { id: 4, name: 'American', icon: 'mdi-hamburger' },
        { id: 5, name: 'Thai', icon: 'mdi-noodles' },
        { id: 6, name: 'Indian', icon: 'mdi-food-curry' },
        { id: 7, name: 'Chinese', icon: 'mdi-food-drumstick' },
        { id: 8, name: 'Desserts', icon: 'mdi-cake' },
        { id: 9, name: 'Drinks', icon: 'mdi-coffee' },
        { id: 10, name: 'Healthy', icon: 'mdi-fruit-watermelon' },
        { id: 11, name: 'Fast Food', icon: 'mdi-food-hot-dog' },
        { id: 12, name: 'Vegetarian', icon: 'mdi-leaf' }
      ],
      
      howItWorks: [
        {
          icon: 'mdi-map-marker',
          title: 'Choose Location',
          description: 'Enter your address to find restaurants that deliver to you'
        },
        {
          icon: 'mdi-silverware-fork-knife',
          title: 'Choose Restaurant',
          description: 'Browse menus and select your favorite dishes'
        },
        {
          icon: 'mdi-truck-delivery',
          title: 'Get Delivery',
          description: 'Your food will be delivered to your door in no time'
        }
      ],
      
      testimonials: [
        {
          name: 'Nguyen Van A',
          avatar: '/images/avatars/avatar1.jpg',
          text: 'The food delivery service is amazing! Always on time and the food is still hot when it arrives.',
          rating: 5,
          location: 'Ho Chi Minh City'
        },
        {
          name: 'Tran Thi B',
          avatar: '/images/avatars/avatar2.jpg',
          text: 'I love the variety of restaurants available. I can order anything from Vietnamese to Italian food.',
          rating: 4,
          location: 'Hanoi'
        },
        {
          name: 'Le Van C',
          avatar: '/images/avatars/avatar3.jpg',
          text: 'The app is very easy to use and the delivery tracking feature is really helpful.',
          rating: 5,
          location: 'Da Nang'
        }
      ]
    };
  },
  
  methods: {
    ...mapActions({
      fetchFeaturedRestaurants: 'restaurants/fetchFeatured',
      fetchPopularDishes: 'dishes/fetchPopular',
      subscribeToNewsletter: 'marketing/subscribeToNewsletter'
    }),
    
    async loadData() {
      this.loading = true;
      
      try {
        // In a real app, you would uncomment these lines to fetch data from the API
        // const featuredRestaurants = await this.fetchFeaturedRestaurants();
        // this.featuredRestaurants = featuredRestaurants;
        
        // const popularDishes = await this.fetchPopularDishes();
        // this.popularDishes = popularDishes;
      } catch (error) {
        console.error('Error loading homepage data:', error);
      } finally {
        this.loading = false;
      }
    },
    
    searchRestaurants() {
      this.$router.push({
        name: 'Restaurants',
        query: {
          search: this.searchQuery,
          location: this.selectedLocation
        }
      });
    },
    
    async subscribeNewsletter() {
      if (!this.newsletterEmail || !/.+@.+\..+/.test(this.newsletterEmail)) {
        this.$toast.error('Please enter a valid email address');
        return;
      }
      
      this.subscribing = true;
      
      try {
        await this.subscribeToNewsletter(this.newsletterEmail);
        this.$toast.success('Thank you for subscribing to our newsletter!');
        this.newsletterEmail = '';
      } catch (error) {
        this.$toast.error('Failed to subscribe. Please try again.');
        console.error('Newsletter subscription error:', error);
      } finally {
        this.subscribing = false;
      }
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    }
  },
  
  mounted() {
    this.loadData();
  }
};
</script>

<style scoped>
.home-page {
  overflow-x: hidden;
}

.hero-section {
  background: linear-gradient(to right, #f5f5f5, #e0f2f1);
  position: relative;
}

.hero-image {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.hero-image:hover {
  transform: translateY(-10px);
}

.search-section {
  margin-top: -30px;
  position: relative;
  z-index: 2;
}

.search-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.restaurant-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  border-radius: 12px;
}

.restaurant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.restaurant-image {
  position: relative;
}

.restaurant-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
}

.delivery-time {
  background-color: white;
  color: #333;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.restaurant-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dish-card {
  transition: transform 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
}

.dish-card:hover {
  transform: translateY(-5px);
}

.dish-image {
  transition: transform 0.3s ease;
}

.dish-card:hover .dish-image {
  transform: scale(1.05);
}

.dish-title {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
}

.category-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.newsletter-card {
  background: linear-gradient(to right, #f5f5f5, #e0f2f1);
  border-radius: 12px;
}

.testimonial-text {
  max-width: 700px;
  font-style: italic;
}

@media (max-width: 600px) {
  .hero-section {
    text-align: center;
  }
  
  .hero-section .v-col {
    padding-top: 24px;
    padding-bottom: 24px;
  }
  
  .search-section {
    margin-top: 0;
  }
}
</style> 