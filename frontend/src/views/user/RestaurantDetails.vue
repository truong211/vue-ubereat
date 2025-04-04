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
                  <div v-for="category in restaurant.menu" :key="category.id" class="mb-6">
                    <h2 class="text-h5 mb-3">{{ category.name }}</h2>
                    
                    <v-row>
                      <v-col 
                        v-for="item in category.items" 
                        :key="item.id" 
                        cols="12" 
                        sm="6"
                        class="mb-4"
                      >
                        <v-card flat @click="addToCart(item)" class="menu-item">
                          <div class="d-flex">
                            <div class="flex-grow-1 pr-4">
                              <div class="text-h6">{{ item.name }}</div>
                              <div class="text-body-2 text-truncate">{{ item.description }}</div>
                              <div class="text-subtitle-1 mt-2 font-weight-bold">${{ item.price.toFixed(2) }}</div>
                            </div>
                            <v-img
                              v-if="item.image"
                              :src="item.image"
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
                  <div class="d-flex align-start mb-4">
                    <v-icon size="24" class="mr-3 mt-1">mdi-map-marker</v-icon>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">Address</div>
                      <div class="text-body-2">{{ restaurant.address }}</div>
                    </div>
                  </div>
                  
                  <div class="d-flex align-start mb-4">
                    <v-icon size="24" class="mr-3 mt-1">mdi-phone</v-icon>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">Phone</div>
                      <div class="text-body-2">{{ restaurant.phone }}</div>
                    </div>
                  </div>
                  
                  <div class="d-flex align-start mb-4">
                    <v-icon size="24" class="mr-3 mt-1">mdi-clock-outline</v-icon>
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">Hours</div>
                      <div class="text-body-2">
                        <div v-for="(hours, day) in restaurant.hours" :key="day">
                          <strong>{{ day }}:</strong> {{ hours }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Restaurant Map -->
                  <div class="mt-6">
                    <h3 class="text-h6 mb-3">Location</h3>
                    <restaurant-map
                      :restaurant-location="{
                        lat: restaurant.location.lat,
                        lng: restaurant.location.lng,
                        name: restaurant.name,
                        address: restaurant.address
                      }"
                      :user-location="userLocation"
                    ></restaurant-map>
                  </div>
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
import { useStore } from 'vuex';
import RestaurantMap from '@/components/restaurant/RestaurantMap.vue';
import restaurantAPI from '@/services/restaurantAPI';
import { useToast } from 'vue-toastification';

export default {
  name: 'RestaurantDetails',
  
  components: {
    RestaurantMap
  },
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const toast = useToast();
    
    const loading = ref(true);
    const error = ref(null);
    const restaurant = ref(null);
    const activeTab = ref('menu');
    const userLocation = ref(null); // Will be populated with user's location
    
    // Use computed values from store for cart
    const cartItems = computed(() => store.getters['cart/cartItems']);
    const cartSubtotal = computed(() => store.getters['cart/cartSubtotal']);
    const cartTotal = computed(() => store.getters['cart/cartTotal']);
    const cartLoading = computed(() => store.getters['cart/isLoading']);
    
    // Fetch restaurant details
    const fetchRestaurantDetails = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const restaurantId = route.params.id;
        
        // Call the restaurant API to get details
        const response = await restaurantAPI.getRestaurantById(restaurantId);
        restaurant.value = response.data;
        
        // Fetch menu items for this restaurant
        const menuResponse = await restaurantAPI.getRestaurantMenu(restaurantId);
        if (menuResponse.data && restaurant.value) {
          restaurant.value.menu = menuResponse.data;
        }
        
        // Fetch reviews for this restaurant
        const reviewsResponse = await restaurantAPI.getRestaurantReviews(restaurantId);
        if (reviewsResponse.data && restaurant.value) {
          restaurant.value.reviews = reviewsResponse.data.reviews;
          restaurant.value.reviewCount = reviewsResponse.data.total;
        }
        
        // Try to get user location for the map
        getUserLocation();
        
        loading.value = false;
      } catch (err) {
        console.error('Error fetching restaurant details:', err);
        error.value = 'Could not load restaurant details. Please try again later.';
      } finally {
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
    
    // Fetch user's cart
    const fetchCart = async () => {
      try {
        await store.dispatch('cart/fetchCart');
      } catch (err) {
        console.error('Error fetching cart:', err);
      }
    };
    
    // Add item to cart
    const addToCart = async (item) => {
      try {
        await store.dispatch('cart/addToCart', {
          productId: item.id,
          quantity: 1
        });
        toast.success(`${item.name} added to cart`);
      } catch (err) {
        toast.error('Failed to add item to cart');
      }
    };
    
    // Increment item quantity
    const incrementItem = async (index) => {
      try {
        const item = cartItems.value[index];
        await store.dispatch('cart/updateCartItem', {
          itemId: item.id,
          quantity: item.quantity + 1
        });
      } catch (err) {
        toast.error('Failed to update cart');
      }
    };
    
    // Decrement item quantity
    const decrementItem = async (index) => {
      try {
        const item = cartItems.value[index];
        if (item.quantity > 1) {
          await store.dispatch('cart/updateCartItem', {
            itemId: item.id,
            quantity: item.quantity - 1
          });
        } else {
          await store.dispatch('cart/removeFromCart', item.id);
        }
      } catch (err) {
        toast.error('Failed to update cart');
      }
    };
    
    // Remove item from cart
    const removeItem = async (index) => {
      try {
        const item = cartItems.value[index];
        await store.dispatch('cart/removeFromCart', item.id);
        toast.success('Item removed from cart');
      } catch (err) {
        toast.error('Failed to remove item from cart');
      }
    };
    
    // Calculate subtotal - now using store computed value
    const calculateSubtotal = () => {
      return cartSubtotal.value;
    };
    
    // Calculate total - now using store computed value
    const calculateTotal = () => {
      return cartTotal.value;
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
    
    // Lifecycle hooks
    onMounted(() => {
      fetchRestaurantDetails();
      fetchCart();
    });
    
    return {
      loading,
      error,
      restaurant,
      activeTab,
      cartItems,
      userLocation,
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
</style> 