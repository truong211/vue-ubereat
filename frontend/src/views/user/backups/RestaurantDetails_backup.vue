<template>
  <v-container>
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular size="64" indeterminate color="primary"></v-progress-circular>
      <div class="mt-4 text-body-1">Loading restaurant details...</div>
    </div>
    
    <!-- Error State -->
    <v-alert v-else-if="error" type="error" class="mb-4">
      {{ error }}
      <div class="mt-2">
        <v-btn color="primary" @click="fetchRestaurantDetails">Try Again</v-btn>
      </div>
    </v-alert>
    
    <!-- Restaurant Details -->
    <template v-else-if="restaurant">
      <!-- Restaurant Header -->
      <div class="restaurant-header mb-6">
        <v-img
          :src="restaurant.coverImage || '/img/restaurant-cover-placeholder.jpg'"
          height="200"
          cover
          class="rounded-lg"
        >
          <div class="fill-height d-flex align-end">
            <v-card flat color="rgba(0,0,0,0.6)" class="pa-4 rounded-0 rounded-b-lg w-100">
              <div class="d-flex align-center">
                <v-avatar size="80" class="mr-4">
                  <v-img :src="restaurant.logo || '/img/restaurant-logo-placeholder.jpg'"></v-img>
                </v-avatar>
                <div>
                  <h1 class="text-h4 text-white font-weight-bold">{{ restaurant.name }}</h1>
                  <div class="d-flex align-center mt-1">
                    <v-rating
                      :model-value="restaurant.rating"
                      color="amber"
                      density="compact"
                      size="small"
                      readonly
                      half-increments
                    ></v-rating>
                    <span class="text-white ml-2">({{ restaurant.reviewCount }} reviews)</span>
                    <v-chip size="small" color="primary" class="ml-3">{{ restaurant.category }}</v-chip>
                  </div>
                </div>
                
                <!-- Quick Info -->
                <v-spacer></v-spacer>
                <div class="d-none d-md-flex align-center">
                  <v-chip class="mr-2" color="success" variant="elevated">
                    <v-icon start size="small">mdi-clock-outline</v-icon>
                    {{ isRestaurantOpen ? 'Open Now' : 'Closed' }}
                  </v-chip>
                  <v-chip class="mr-2" color="info" variant="elevated">
                    <v-icon start size="small">mdi-bike</v-icon>
                    {{ restaurant.deliveryTime }} min
                  </v-chip>
                </div>
              </div>
            </v-card>
          </div>
        </v-img>
      </div>
      
      <v-row>
        <!-- Menu Section -->
        <v-col cols="12" md="8">
          <!-- Restaurant Info Tabs -->
          <v-card class="mb-6">
            <v-tabs v-model="activeTab" bg-color="primary">
              <v-tab value="menu">Menu</v-tab>
              <v-tab value="reviews">Reviews</v-tab>
              <v-tab value="info">Info</v-tab>
            </v-tabs>
            
            <v-window v-model="activeTab">
              <!-- Menu Tab -->
              <v-window-item value="menu">
                <v-card-text>
                  <!-- Featured Dishes Section -->
                  <div v-if="featuredItems.length" class="mb-8">
                    <div class="d-flex align-center mb-3">
                      <h2 class="text-h5">Featured Dishes</h2>
                      <v-chip class="ml-3" color="error" size="small">POPULAR</v-chip>
                    </div>
                    
                    <v-carousel
                      show-arrows="hover"
                      height="200"
                      hide-delimiter-background
                      delimiter-icon="mdi-circle"
                    >
                      <v-carousel-item
                        v-for="(item, i) in featuredItems"
                        :key="i"
                      >
                        <v-sheet height="100%" class="d-flex align-center justify-center">
                          <v-card width="90%" flat class="mx-auto">
                            <div class="d-flex align-center">
                              <v-img
                                :src="item.image || '/img/food-placeholder.jpg'"
                                width="120"
                                height="120"
                                cover
                                class="rounded mr-4"
                              ></v-img>
                              <div>
                                <div class="text-h6">{{ item.name }}</div>
                                <div class="text-body-2">{{ item.description }}</div>
                                <div class="d-flex align-center mt-2">
                                  <div class="text-subtitle-1 font-weight-bold">${{ item.price.toFixed(2) }}</div>
                                  <v-spacer></v-spacer>
                                  <v-btn
                                    color="primary"
                                    size="small"
                                    @click="addToCart(item)"
                                    prepend-icon="mdi-cart-plus"
                                  >
                                    Add to Cart
                                  </v-btn>
                                </div>
                              </div>
                            </div>
                          </v-card>
                        </v-sheet>
                      </v-carousel-item>
                    </v-carousel>
                  </div>
                  
                  <!-- Category Navigation -->
                  <div class="mb-4 category-nav">
                    <v-chip-group
                      v-model="selectedCategory"
                      selected-class="bg-primary text-white"
                      mandatory
                    >
                      <v-chip
                        v-for="category in restaurant.menu"
                        :key="category.id"
                        :value="category.id"
                        filter
                        variant="outlined"
                      >
                        {{ category.name }}
                      </v-chip>
                    </v-chip-group>
                  </div>
                  
                  <!-- Menu Categories -->
                  <div v-for="category in restaurant.menu" :key="category.id" class="mb-6" :id="`category-${category.id}`">
                    <h2 class="text-h5 mb-3 category-title" :ref="`category-title-${category.id}`">{{ category.name }}</h2>
                    
                    <v-row>
                      <v-col 
                        v-for="item in category.items" 
                        :key="item.id" 
                        cols="12" 
                        sm="6"
                        class="mb-4"
                      >
                        <v-card
                          elevation="2"
                          @click="addToCart(item)"
                          class="menu-item pa-3"
                          :class="{'featured-item': item.featured}"
                        >
                          <div class="d-flex">
                            <div class="flex-grow-1 pr-4">
                              <div class="d-flex align-center">
                                <div class="text-h6">{{ item.name }}</div>
                                <v-chip
                                  v-if="item.featured"
                                  size="x-small"
                                  color="error"
                                  class="ml-2"
                                >
                                  Popular
                                </v-chip>
                              </div>
                              <div class="text-body-2 text-truncate-2-lines">{{ item.description }}</div>
                              <div class="text-subtitle-1 mt-2 font-weight-bold">${{ item.price.toFixed(2) }}</div>
                            </div>
                            <v-img
                              :src="item.image || '/img/food-placeholder.jpg'"
                              width="100"
                              height="100"
                              cover
                              class="rounded"
                            ></v-img>
                          </div>
                          <v-btn
                            color="primary"
                            size="small"
                            variant="text"
                            class="mt-2"
                            prepend-icon="mdi-cart-plus"
                          >
                            Add to Cart
                          </v-btn>
                        </v-card>
                      </v-col>
                    </v-row>
                  </div>
                </v-card-text>
              </v-window-item>
              
              <!-- Reviews Tab -->
              <v-window-item value="reviews">
                <v-card-text>
                  <!-- Rating Summary -->
                  <v-card class="mb-4 pa-4">
                    <div class="d-flex align-center">
                      <div class="text-center mr-6">
                        <div class="text-h3 font-weight-bold">{{ restaurant.rating.toFixed(1) }}</div>
                        <v-rating
                          :model-value="restaurant.rating"
                          color="amber"
                          density="compact"
                          readonly
                          half-increments
                        ></v-rating>
                        <div class="text-caption mt-1">{{ restaurant.reviewCount }} reviews</div>
                      </div>
                      
                      <v-divider vertical class="mx-4"></v-divider>
                      
                      <!-- Rating Breakdown -->
                      <div class="flex-grow-1">
                        <div v-for="n in 5" :key="n" class="d-flex align-center mb-1">
                          <div class="text-body-2 mr-2">{{ 6 - n }} stars</div>
                          <v-progress-linear
                            :model-value="getRatingPercentage(6 - n)"
                            color="amber"
                            height="8"
                            rounded
                            class="flex-grow-1 mr-2"
                          ></v-progress-linear>
                          <div class="text-caption">{{ getRatingCount(6 - n) }}</div>
                        </div>
                      </div>
                    </div>
                  </v-card>
                  
                  <!-- Reviews List -->
                  <div v-if="restaurant.reviews && restaurant.reviews.length">
                    <div v-for="review in restaurant.reviews" :key="review.id" class="mb-4">
                      <div class="d-flex align-start">
                        <v-avatar size="40" color="grey-lighten-3" class="mr-3">
                          <v-img v-if="review.userAvatar" :src="review.userAvatar"></v-img>
                          <v-icon v-else>mdi-account</v-icon>
                        </v-avatar>
                        <div class="flex-grow-1">
                          <div class="d-flex justify-space-between">
                            <div class="text-subtitle-1 font-weight-bold">{{ review.userName }}</div>
                            <div class="text-caption text-grey">{{ formatDate(review.date) }}</div>
                          </div>
                          <v-rating
                            :model-value="review.rating"
                            color="amber"
                            density="compact"
                            size="small"
                            readonly
                            half-increments
                          ></v-rating>
                          <div class="text-body-2 mt-1">{{ review.comment }}</div>
                        </div>
                      </div>
                      <v-divider class="my-3"></v-divider>
                    </div>
                  </div>
                  <v-alert v-else type="info" class="mt-2">
                    There are no reviews yet for this restaurant.
                  </v-alert>
                </v-card-text>
              </v-window-item>
              
              <!-- Info Tab -->
              <v-window-item value="info">
                <v-card-text>
                  <!-- Contact & Basic Info -->
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-card class="pa-4 h-100">
                        <h3 class="text-h6 mb-3">Contact Information</h3>
                        
                        <div class="d-flex align-start mb-4">
                          <v-icon size="24" class="mr-3 mt-1" color="primary">mdi-map-marker</v-icon>
                          <div>
                            <div class="text-subtitle-1 font-weight-bold">Address</div>
                            <div class="text-body-2">{{ restaurant.address }}</div>
                          </div>
                        </div>
                        
                        <div class="d-flex align-start mb-4">
                          <v-icon size="24" class="mr-3 mt-1" color="primary">mdi-phone</v-icon>
                          <div>
                            <div class="text-subtitle-1 font-weight-bold">Phone</div>
                            <div class="text-body-2">{{ restaurant.phone }}</div>
                          </div>
                        </div>
                        
                        <div class="d-flex align-start mb-4">
                          <v-icon size="24" class="mr-3 mt-1" color="primary">mdi-email-outline</v-icon>
                          <div>
                            <div class="text-subtitle-1 font-weight-bold">Email</div>
                            <div class="text-body-2">{{ restaurant.email || 'info@deliciousrestaurant.com' }}</div>
                          </div>
                        </div>
                        
                        <div class="d-flex align-start">
                          <v-icon size="24" class="mr-3 mt-1" color="primary">mdi-web</v-icon>
                          <div>
                            <div class="text-subtitle-1 font-weight-bold">Website</div>
                            <div class="text-body-2">{{ restaurant.website || 'www.deliciousrestaurant.com' }}</div>
                          </div>
                        </div>
                      </v-card>
                    </v-col>
                    
                    <v-col cols="12" sm="6">
                      <v-card class="pa-4 h-100">
                        <h3 class="text-h6 mb-3">Opening Hours</h3>
                        
                        <div v-for="(hours, day) in restaurant.hours" :key="day" class="d-flex mb-2">
                          <div class="font-weight-medium" style="width: 120px;">{{ day }}</div>
                          <div :class="{'text-success': isOpenToday(day)}">{{ hours }}</div>
                        </div>
                      </v-card>
                    </v-col>
                  </v-row>
                  
                  <!-- Restaurant Map -->
                  <v-card class="mt-6">
                    <v-card-title>Location</v-card-title>
                    <v-card-text>
                      <restaurant-map
                        :restaurant-location="{
                          lat: restaurant.location.lat,
                          lng: restaurant.location.lng,
                          name: restaurant.name,
                          address: restaurant.address
                        }"
                        :user-location="userLocation"
                        height="400"
                      ></restaurant-map>
                    </v-card-text>
                  </v-card>
                </v-card-text>
              </v-window-item>
            </v-window>
          </v-card>
        </v-col>
        
        <!-- Sidebar -->
        <v-col cols="12" md="4">
          <!-- Restaurant Info Card -->
          <v-card class="mb-6">
            <v-card-text>
              <div class="d-flex align-start mb-4">
                <v-icon size="20" class="mr-2 mt-1">mdi-clock-outline</v-icon>
                <div>
                  <div class="font-weight-medium">Delivery Time</div>
                  <div class="text-body-2">{{ restaurant.deliveryTime }} min</div>
                </div>
              </div>
              
              <div class="d-flex align-start mb-4">
                <v-icon size="20" class="mr-2 mt-1">mdi-bike</v-icon>
                <div>
                  <div class="font-weight-medium">Delivery Fee</div>
                  <div class="text-body-2">${{ restaurant.deliveryFee.toFixed(2) }}</div>
                </div>
              </div>
              
              <div class="d-flex align-start mb-4">
                <v-icon size="20" class="mr-2 mt-1">mdi-currency-usd</v-icon>
                <div>
                  <div class="font-weight-medium">Minimum Order</div>
                  <div class="text-body-2">${{ restaurant.minimumOrder.toFixed(2) }}</div>
                </div>
              </div>
              
              <div class="d-flex align-start">
                <v-icon size="20" class="mr-2 mt-1">mdi-cash-multiple</v-icon>
                <div>
                  <div class="font-weight-medium">Payment Methods</div>
                  <div class="text-body-2">{{ restaurant.paymentMethods.join(', ') }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Cart Section -->
          <v-card>
            <v-card-title>Your Cart</v-card-title>
            <v-card-text v-if="cartItems.length === 0" class="text-center pa-4">
              <v-icon size="64" color="grey-lighten-2">mdi-cart-outline</v-icon>
              <div class="text-h6 mt-2">Your cart is empty</div>
              <div class="text-body-2 text-grey">Add items from the menu to start your order</div>
            </v-card-text>
            
            <template v-else>
              <v-list>
                <v-list-item v-for="(item, index) in cartItems" :key="index">
                  <v-list-item-title>
                    <div class="d-flex align-center">
                      <div class="mr-2">{{ item.quantity }}x</div>
                      <div class="flex-grow-1">{{ item.name }}</div>
                      <div>${{ (item.price * item.quantity).toFixed(2) }}</div>
                    </div>
                  </v-list-item-title>
                  <v-list-item-subtitle class="d-flex justify-end mt-1">
                    <v-btn
                      size="x-small"
                      icon
                      variant="text"
                      density="compact"
                      @click="decrementItem(index)"
                    >
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>
                    <v-btn
                      size="x-small"
                      icon
                      variant="text"
                      density="compact"
                      @click="incrementItem(index)"
                    >
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                    <v-btn
                      size="x-small"
                      icon
                      variant="text"
                      density="compact"
                      @click="removeItem(index)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-divider></v-divider>
                
                <v-list-item>
                  <div class="d-flex justify-space-between">
                    <div>Subtotal</div>
                    <div>${{ calculateSubtotal().toFixed(2) }}</div>
                  </div>
                </v-list-item>
                <v-list-item>
                  <div class="d-flex justify-space-between">
                    <div>Delivery Fee</div>
                    <div>${{ restaurant.deliveryFee.toFixed(2) }}</div>
                  </div>
                </v-list-item>
                <v-list-item>
                  <div class="d-flex justify-space-between font-weight-bold">
                    <div>Total</div>
                    <div>${{ calculateTotal().toFixed(2) }}</div>
                  </div>
                </v-list-item>
              </v-list>
              
              <v-card-actions>
                <v-btn
                  color="primary"
                  block
                  size="large"
                  :disabled="calculateSubtotal() < restaurant.minimumOrder"
                  @click="proceedToCheckout"
                >
                  Proceed to Checkout
                </v-btn>
              </v-card-actions>
              
              <v-card-text v-if="calculateSubtotal() < restaurant.minimumOrder" class="text-center pt-0">
                <v-alert
                  type="warning"
                  density="compact"
                  variant="tonal"
                >
                  Add ${{ (restaurant.minimumOrder - calculateSubtotal()).toFixed(2) }} more to meet the minimum order amount
                </v-alert>
              </v-card-text>
            </template>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RestaurantMap from '@/components/restaurant/RestaurantMap.vue';

export default {
  name: 'RestaurantDetails',
  
  components: {
    RestaurantMap
  },
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    const loading = ref(true);
    const error = ref(null);
    const restaurant = ref(null);
    const activeTab = ref('menu');
    const cartItems = ref([]);
    const userLocation = ref(null); // Will be populated with user's location
    const selectedCategory = ref(1); // Default to first category
    
    // Computed property for featured items
    const featuredItems = computed(() => {
      if (!restaurant.value) return [];
      
      return restaurant.value.menu
        .flatMap(category => category.items.filter(item => item.featured))
        .slice(0, 5); // Limit to 5 featured items
    });
    
    // Computed property to check if restaurant is currently open
    const isRestaurantOpen = computed(() => {
      if (!restaurant.value) return false;
      
      // Get current day and time
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = days[now.getDay()];
      
      // Get opening hours for current day
      const hoursToday = restaurant.value.hours[currentDay];
      if (!hoursToday || hoursToday.toLowerCase().includes('closed')) {
        return false;
      }
      
      // Parse hours
      const [openingTime, closingTime] = hoursToday.split(' - ').map(time => {
        const [hours, minutesPeriod] = time.split(':');
        const [minutes, period] = minutesPeriod.split(' ');
        let hour = parseInt(hours);
        
        // Convert to 24-hour format
        if (period === 'PM' && hour < 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        
        return { hour, minutes: parseInt(minutes) };
      });
      
      // Check if current time is within opening hours
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Create date objects for comparison
      const currentTimeValue = currentHour * 60 + currentMinute;
      const openingTimeValue = openingTime.hour * 60 + openingTime.minutes;
      const closingTimeValue = closingTime.hour * 60 + closingTime.minutes;
      
      return currentTimeValue >= openingTimeValue && currentTimeValue <= closingTimeValue;
    });
    
    // Function to check if the day is today
    const isOpenToday = (day) => {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const currentDay = days[new Date().getDay()];
      return day === currentDay;
    };
    
    // Function to get rating percentage for a specific star rating
    const getRatingPercentage = (stars) => {
      if (!restaurant.value || !restaurant.value.reviews) return 0;
      
      const count = restaurant.value.reviews.filter(review => Math.round(review.rating) === stars).length;
      return (count / restaurant.value.reviews.length) * 100;
    };
    
    // Function to get the count of a specific star rating
    const getRatingCount = (stars) => {
      if (!restaurant.value || !restaurant.value.reviews) return 0;
      
      return restaurant.value.reviews.filter(review => Math.round(review.rating) === stars).length;
    };
    
    // Fetch restaurant details
    const fetchRestaurantDetails = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const restaurantId = route.params.id;
        
        // In a real app, this would be an API call
        // const response = await axios.get(`/api/restaurants/${restaurantId}`);
        // restaurant.value = response.data;
        
        // For demo, use mock data
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
        restaurant.value = generateMockRestaurantDetails(restaurantId);
        
        // Try to get user location for the map
        getUserLocation();
        
        loading.value = false;
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
        error.value = 'Failed to load restaurant details. Please try again.';
        loading.value = false;
      }
    };
    
    // Get user location
    const getUserLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            userLocation.value = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
          },
          (error) => {
            console.log('Geolocation error:', error);
            // Use a default location or leave as null
          }
        );
      }
    };
    
    // Add item to cart
    const addToCart = (item) => {
      // Check if item already exists in cart
      const existingItemIndex = cartItems.value.findIndex(cartItem => cartItem.id === item.id);
      
      if (existingItemIndex >= 0) {
        // Increment quantity if already in cart
        cartItems.value[existingItemIndex].quantity += 1;
      } else {
        // Add new item to cart
        cartItems.value.push({
          ...item,
          quantity: 1
        });
      }
    };
    
    // Increment item quantity
    const incrementItem = (index) => {
      cartItems.value[index].quantity += 1;
    };
    
    // Decrement item quantity
    const decrementItem = (index) => {
      if (cartItems.value[index].quantity > 1) {
        cartItems.value[index].quantity -= 1;
      } else {
        removeItem(index);
      }
    };
    
    // Remove item from cart
    const removeItem = (index) => {
      cartItems.value.splice(index, 1);
    };
    
    // Calculate subtotal
    const calculateSubtotal = () => {
      return cartItems.value.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    };
    
    // Calculate total
    const calculateTotal = () => {
      return calculateSubtotal() + (restaurant.value ? restaurant.value.deliveryFee : 0);
    };
    
    // Proceed to checkout
    const proceedToCheckout = () => {
      // In a real app, you would save the cart to store/localStorage
      // and redirect to checkout page
      router.push('/checkout');
    };
    
    // Format date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    // Generate mock restaurant details
    const generateMockRestaurantDetails = (id) => {
      // Restaurant location (Manhattan, NYC area)
      const restaurantLat = 40.7128 + (Math.random() * 0.02 - 0.01);
      const restaurantLng = -74.0060 + (Math.random() * 0.02 - 0.01);
      
      return {
        id: id,
        name: 'Delicious Restaurant',
        category: 'Italian',
        rating: 4.7,
        reviewCount: 253,
        deliveryTime: 25,
        deliveryFee: 3.99,
        minimumOrder: 15.00,
        address: '123 Example Street, New York, NY 10001',
        phone: '+1 (555) 123-4567',
        email: 'contact@deliciousrestaurant.com',
        website: 'www.deliciousrestaurant.com',
        location: {
          lat: restaurantLat,
          lng: restaurantLng
        },
        hours: {
          'Monday': '11:00 AM - 10:00 PM',
          'Tuesday': '11:00 AM - 10:00 PM',
          'Wednesday': '11:00 AM - 10:00 PM',
          'Thursday': '11:00 AM - 10:00 PM',
          'Friday': '11:00 AM - 11:00 PM',
          'Saturday': '11:00 AM - 11:00 PM',
          'Sunday': '12:00 PM - 9:00 PM'
        },
        paymentMethods: ['Credit Card', 'PayPal', 'Cash'],
        menu: [
          {
            id: 1,
            name: 'Appetizers',
            items: [
              {
                id: 101,
                name: 'Bruschetta',
                description: 'Toasted bread topped with fresh tomatoes, garlic, and basil',
                price: 8.99,
                featured: true,
                image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
              },
              {
                id: 102,
                name: 'Mozzarella Sticks',
                description: 'Breaded mozzarella sticks with marinara sauce',
                price: 7.99,
                image: 'https://images.unsplash.com/photo-1548340748-6d2b7d7da280?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
              }
            ]
          },
          {
            id: 2,
            name: 'Pasta',
            items: [
              {
                id: 201,
                name: 'Spaghetti Carbonara',
                description: 'Spaghetti with eggs, cheese, bacon, and black pepper',
                price: 14.99,
                featured: true,
                image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
              },
              {
                id: 202,
                name: 'Fettuccine Alfredo',
                description: 'Fettuccine tossed with parmesan cream sauce',
                price: 13.99,
                image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023882c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
              }
            ]
          },
          {
            id: 3,
            name: 'Pizza',
            items: [
              {
                id: 301,
                name: 'Margherita Pizza',
                description: 'Tomato sauce, mozzarella, and fresh basil',
                price: 12.99,
                featured: true,
                image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
              },
              {
                id: 302,
                name: 'Pepperoni Pizza',
                description: 'Tomato sauce, mozzarella, and pepperoni',
                price: 14.99,
                image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
              }
            ]
          }
        ],
        reviews: [
          {
            id: 1,
            userName: 'John D.',
            userAvatar: null,
            rating: 5,
            date: '2023-06-15',
            comment: 'Amazing food and quick delivery! Will definitely order again.'
          },
          {
            id: 2,
            userName: 'Sarah M.',
            userAvatar: null,
            rating: 4,
            date: '2023-05-22',
            comment: 'Food was great. Delivery was a bit delayed but still good overall.'
          },
          {
            id: 3,
            userName: 'Mike R.',
            userAvatar: null,
            rating: 5,
            date: '2023-07-01',
            comment: 'Best Italian food in town! The pasta is incredible.'
          },
          {
            id: 4,
            userName: 'Lisa T.',
            userAvatar: null,
            rating: 3,
            date: '2023-06-05',
            comment: 'Decent food but nothing extraordinary. Service was good though.'
          }
        ]
      };
    };
    
    // Lifecycle hooks
    onMounted(() => {
      fetchRestaurantDetails();
    });
    
    return {
      loading,
      error,
      restaurant,
      activeTab,
      cartItems,
      userLocation,
      selectedCategory,
      featuredItems,
      isRestaurantOpen,
      isOpenToday,
      getRatingPercentage,
      getRatingCount,
      fetchRestaurantDetails,
      addToCart,
      incrementItem,
      decrementItem,
      removeItem,
      calculateSubtotal,
      calculateTotal,
      proceedToCheckout,
      formatDate
    };
  }
};
</script>

<style scoped>
.menu-item {
  cursor: pointer;
  transition: all 0.2s ease;
}

.menu-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.featured-item {
  border-left: 3px solid #ff5252;
}

.category-nav {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: white;
  padding: 10px 0;
}

.category-title {
  scroll-margin-top: 80px;
}

.text-truncate-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style> 