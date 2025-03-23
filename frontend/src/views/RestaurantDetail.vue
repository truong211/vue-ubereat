<template>
  <div class="restaurant-detail">
    <!-- Loading state -->
    <div v-if="isLoading" class="loading-container">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading restaurant details...</p>
    </div>

    <div v-else>
      <!-- Restaurant header with background image -->
      <v-img
        :src="restaurant.coverImage"
        height="300"
        class="align-end"
        gradient="to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)"
      >
        <v-container>
          <div class="restaurant-header-content text-white">
            <h1 class="text-h3 font-weight-bold mb-2">{{ restaurant.name }}</h1>
            <div class="d-flex align-center mb-2">
              <v-rating
                :model-value="restaurant.rating"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="small"
              ></v-rating>
              <span class="ml-2">{{ restaurant.rating }} ({{ restaurant.reviewCount }} reviews)</span>
              <v-divider vertical class="mx-3"></v-divider>
              <span>{{ restaurant.categories.join(', ') }}</span>
            </div>
            <div class="d-flex align-center mb-4">
              <v-icon size="small" color="white">mdi-clock-outline</v-icon>
              <span class="ml-1">{{ restaurant.deliveryTime }} min</span>
              <span class="mx-2">•</span>
              <v-icon size="small" color="white">mdi-map-marker</v-icon>
              <span class="ml-1">{{ restaurant.distance }} km</span>
              <span class="mx-2">•</span>
              <span>{{ restaurant.deliveryFee }}</span>
            </div>
            <v-chip
              :color="restaurant.isOpen ? 'success' : 'error'"
              text-color="white"
              size="small"
            >
              {{ restaurant.isOpen ? 'Open Now' : 'Closed' }}
            </v-chip>
            <v-chip
              v-if="restaurant.promotion"
              color="primary"
              size="small"
              class="ml-2"
            >
              {{ restaurant.promotion }}
            </v-chip>
          </div>
        </v-container>
      </v-img>

      <v-container>
        <v-row>
          <!-- Menu section (left) -->
          <v-col cols="12" md="8">
            <!-- Restaurant info tabs -->
            <v-card class="mb-6">
              <v-tabs v-model="activeTab" color="primary">
                <v-tab value="menu">Menu</v-tab>
                <v-tab value="reviews">Reviews</v-tab>
                <v-tab value="info">Info</v-tab>
              </v-tabs>
              
              <v-window v-model="activeTab">
                <!-- Menu Tab -->
                <v-window-item value="menu">
                  <!-- Search bar for menu items -->
                  <v-card-text>
                    <v-text-field
                      v-model="menuSearch"
                      placeholder="Search menu items"
                      prepend-inner-icon="mdi-magnify"
                      variant="outlined"
                      density="comfortable"
                      clearable
                      class="mb-4"
                    ></v-text-field>

                    <!-- Menu category navigation -->
                    <div class="category-nav mb-4 overflow-x-auto">
                      <v-btn
                        v-for="category in restaurant.menuCategories"
                        :key="category.id"
                        variant="text"
                        :color="activeCategoryId === category.id ? 'primary' : undefined"
                        @click="scrollToCategory(category.id)"
                        class="mr-2"
                      >
                        {{ category.name }}
                      </v-btn>
                    </div>
                  </v-card-text>

                  <!-- Menu items by category -->
                  <div v-for="category in restaurant.menuCategories" :key="category.id" :id="`category-${category.id}`" class="menu-category mb-8 px-4">
                    <h2 class="text-h5 font-weight-medium mb-4">{{ category.name }}</h2>
                    
                    <v-card v-for="item in filterMenuItems(category.items)" :key="item.id" class="mb-4" variant="outlined">
                      <v-row no-gutters>
                        <v-col cols="8" sm="9" class="pa-4">
                          <div class="d-flex justify-space-between align-start">
                            <div>
                              <h3 class="text-h6 mb-1">{{ item.name }}</h3>
                              <p class="text-body-2 text-grey mb-2">{{ item.description }}</p>
                              <div v-if="item.dietaryLabels && item.dietaryLabels.length" class="mb-2">
                                <v-chip
                                  v-for="label in item.dietaryLabels"
                                  :key="label"
                                  size="x-small"
                                  class="mr-1"
                                  color="green-lighten-5"
                                  text-color="green"
                                >
                                  {{ label }}
                                </v-chip>
                              </div>
                              <div class="text-subtitle-1 font-weight-bold">${{ item.price.toFixed(2) }}</div>
                            </div>
                          </div>
                        </v-col>
                        <v-col cols="4" sm="3" class="d-flex flex-column justify-center align-center pa-4">
                          <v-img
                            v-if="item.image"
                            :src="item.image"
                            height="80"
                            width="80"
                            cover
                            class="rounded mb-2"
                          ></v-img>
                          <v-btn
                            color="primary"
                            variant="outlined"
                            size="small"
                            @click="openItemDialog(item)"
                            :disabled="!restaurant.isOpen"
                          >
                            Add to Cart
                          </v-btn>
                        </v-col>
                      </v-row>
                    </v-card>
                    
                    <v-divider v-if="category.id !== restaurant.menuCategories[restaurant.menuCategories.length - 1].id" class="my-6"></v-divider>
                  </div>
                </v-window-item>
                
                <!-- Reviews Tab -->
                <v-window-item value="reviews">
                  <v-card-text>
                    <RestaurantReviews :id="restaurantId" />
                  </v-card-text>
                </v-window-item>
                
                <!-- Info Tab -->
                <v-window-item value="info">
                  <v-card-text>
                    <h3 class="text-h6 mb-3">Location & Hours</h3>
                    <div class="d-flex flex-column flex-md-row mb-6">
                      <div class="flex-grow-1 mb-4 mb-md-0 mr-md-6">
                        <v-img
                          src="https://maps.googleapis.com/maps/api/staticmap?center=40.7128,-74.0060&zoom=13&size=600x300&maptype=roadmap&markers=color:red%7C40.7128,-74.0060&key=YOUR_API_KEY"
                          height="250"
                          class="rounded mb-2"
                        ></v-img>
                        <p class="text-body-1">
                          <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                          {{ restaurant.address }}
                        </p>
                        <p class="text-body-1">
                          <v-icon size="small" class="mr-1">mdi-phone</v-icon>
                          {{ restaurant.phone }}
                        </p>
                      </div>
                      
                      <div>
                        <h4 class="text-subtitle-1 font-weight-bold mb-2">Hours</h4>
                        <table class="hours-table">
                          <tr v-for="(hours, day) in restaurant.hours" :key="day">
                            <td class="text-body-1 font-weight-medium pr-4">{{ day }}</td>
                            <td class="text-body-1">{{ hours }}</td>
                          </tr>
                        </table>
                      </div>
                    </div>
                    
                    <v-divider class="my-4"></v-divider>
                    
                    <h3 class="text-h6 mb-3">About {{ restaurant.name }}</h3>
                    <p class="text-body-1 mb-4">{{ restaurant.description }}</p>
                    
                    <v-chip-group>
                      <v-chip
                        v-for="feature in restaurant.features"
                        :key="feature"
                        color="primary"
                        variant="outlined"
                        class="mr-2 mb-2"
                      >
                        {{ feature }}
                      </v-chip>
                    </v-chip-group>
                  </v-card-text>
                </v-window-item>
              </v-window>
            </v-card>
          </v-col>

          <!-- Cart sidebar (right) -->
          <v-col cols="12" md="4">
            <v-card class="cart-sidebar pa-4" variant="outlined">
              <h2 class="text-h5 mb-4">Your Order</h2>

              <div v-if="cart.items.length === 0" class="text-center py-6">
                <v-icon size="64" color="grey">mdi-cart-outline</v-icon>
                <p class="mt-4 text-body-1">Your cart is empty</p>
              </div>

              <div v-else>
                <div class="cart-items mb-4">
                  <div v-for="(item, index) in cart.items" :key="index" class="cart-item mb-3 pa-2">
                    <div class="d-flex justify-space-between">
                      <div class="d-flex">
                        <div class="item-quantity mr-2">{{ item.quantity }}×</div>
                        <div>
                          <div class="text-subtitle-1">{{ item.name }}</div>
                          <div v-if="item.options && item.options.length" class="text-caption text-grey">
                            {{ item.options.join(', ') }}
                          </div>
                        </div>
                      </div>
                      <div class="d-flex align-center">
                        <div class="text-subtitle-2 mr-2">${{ (item.price * item.quantity).toFixed(2) }}</div>
                        <v-btn
                          icon="mdi-delete-outline"
                          size="small"
                          variant="text"
                          color="grey"
                          @click="removeFromCart(index)"
                        ></v-btn>
                      </div>
                    </div>
                  </div>
                </div>

                <v-divider class="mb-4"></v-divider>

                <div class="cart-summary mb-6">
                  <div class="d-flex justify-space-between mb-2">
                    <span>Subtotal</span>
                    <span>${{ cart.subtotal.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Delivery Fee</span>
                    <span>${{ cart.deliveryFee.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span>Tax</span>
                    <span>${{ cart.tax.toFixed(2) }}</span>
                  </div>
                  <div class="d-flex justify-space-between font-weight-bold text-subtitle-1 mt-4">
                    <span>Total</span>
                    <span>${{ cart.total.toFixed(2) }}</span>
                  </div>
                </div>

                <v-btn
                  color="primary"
                  block
                  size="large"
                  :to="{ name: 'Cart' }"
                  :disabled="!restaurant.isOpen"
                >
                  Checkout
                </v-btn>
                <div v-if="!restaurant.isOpen" class="text-caption text-center mt-2 text-red">
                  This restaurant is currently closed
                </div>
              </div>
            </v-card>

            <!-- Restaurant Info -->
            <v-card class="mt-4 pa-4" variant="outlined">
              <h3 class="text-h6 mb-2">Restaurant Info</h3>
              
              <div class="mb-4">
                <v-icon size="small" class="mr-2">mdi-map-marker</v-icon>
                <span>{{ restaurant.address }}</span>
              </div>
              
              <div class="mb-4">
                <v-icon size="small" class="mr-2">mdi-phone</v-icon>
                <span>{{ restaurant.phone }}</span>
              </div>
              
              <div class="mb-4">
                <v-icon size="small" class="mr-2">mdi-clock-outline</v-icon>
                <div class="ml-6">
                  <div v-for="(hours, day) in restaurant.hours" :key="day" class="d-flex justify-space-between">
                    <span>{{ day }}</span>
                    <span>{{ hours }}</span>
                  </div>
                </div>
              </div>
              
              <v-divider class="my-4"></v-divider>
              
              <div>
                <h4 class="text-subtitle-1 mb-2">Dietary Options</h4>
                <div class="d-flex flex-wrap">
                  <v-chip
                    v-for="option in restaurant.dietaryOptions"
                    :key="option"
                    size="small"
                    color="green-lighten-5"
                    text-color="green"
                    class="mr-1 mb-1"
                  >
                    {{ option }}
                  </v-chip>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Item Dialog -->
    <v-dialog v-model="itemDialog" max-width="500">
      <!-- ... item dialog content ... -->
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import RestaurantReviews from '@/views/restaurant/Reviews.vue';

export default {
  name: 'RestaurantDetail',
  
  components: {
    RestaurantReviews
  },
  
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    
    // Restaurant and menu state
    const restaurant = ref({});
    const isLoading = ref(true);
    const menuSearch = ref('');
    const activeTab = ref('menu');
    const activeCategoryId = ref(null);
    
    // Cart state
    const cart = computed(() => store.state.cart);
    
    // Item dialog
    const itemDialog = ref(false);
    const selectedItem = ref(null);
    const itemQuantity = ref(1);
    const selectedOptions = ref({});
    const specialInstructions = ref('');
    
    // Review state
    const reviewForm = ref(null);
    const isReviewFormValid = ref(false);
    const userReview = reactive({
      rating: 0,
      comment: ''
    });
    const isSubmittingReview = ref(false);
    const reviewPage = ref(1);
    const reviewsPerPage = 5;
    const reviewFilters = reactive({
      sort: 'newest',
      rating: 'all',
      search: ''
    });
    const sortOptions = [
      { title: 'Newest First', value: 'newest' },
      { title: 'Oldest First', value: 'oldest' },
      { title: 'Highest Rated', value: 'highest' },
      { title: 'Lowest Rated', value: 'lowest' },
      { title: 'Most Helpful', value: 'helpful' }
    ];
    
    // Validation rules
    const reviewRules = [
      v => !!v || 'Review comment is required',
      v => v.length >= 10 || 'Review must be at least 10 characters',
      v => v.length <= 500 || 'Review cannot exceed 500 characters'
    ];
    
    // Fetch restaurant data
    onMounted(async () => {
      const restaurantId = route.params.id;
      isLoading.value = true;
      
      try {
        const restaurantData = await store.dispatch('fetchRestaurantDetails', restaurantId);
        restaurant.value = restaurantData;
        
        // Set active category to first category
        if (restaurant.value.menuCategories && restaurant.value.menuCategories.length > 0) {
          activeCategoryId.value = restaurant.value.menuCategories[0].id;
        }
        
        isLoading.value = false;
      } catch (error) {
        console.error('Failed to load restaurant:', error);
        // Handle error, perhaps redirect to restaurants page
        router.push('/restaurants');
      }
    });
    
    // Filter menu items based on search
    const filterMenuItems = (items) => {
      if (!menuSearch.value.trim()) return items;
      
      const search = menuSearch.value.toLowerCase();
      return items.filter(item => 
        item.name.toLowerCase().includes(search) || 
        item.description.toLowerCase().includes(search)
      );
    };
    
    // Scroll to category section
    const scrollToCategory = (categoryId) => {
      activeCategoryId.value = categoryId;
      
      const element = document.getElementById(`category-${categoryId}`);
      if (element) {
        const topOffset = 120; // Account for header/navbar
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - topOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    };
    
    // Open item dialog
    const openItemDialog = (item) => {
      selectedItem.value = item;
      itemQuantity.value = 1;
      selectedOptions.value = {};
      specialInstructions.value = '';
      
      // Initialize default options
      if (item.options) {
        item.options.forEach(optionGroup => {
          if (optionGroup.required && optionGroup.choices.length > 0) {
            selectedOptions.value[optionGroup.id] = optionGroup.choices[0].id;
          }
        });
      }
      
      itemDialog.value = true;
    };
    
    // Add item to cart
    const addToCart = () => {
      const item = selectedItem.value;
      
      const cartItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: itemQuantity.value,
        options: [],
        specialInstructions: specialInstructions.value,
        restaurantId: restaurant.value.id
      };
      
      // Add selected options
      if (item.options) {
        item.options.forEach(optionGroup => {
          const selectedOptionId = selectedOptions.value[optionGroup.id];
          if (selectedOptionId) {
            const selectedChoice = optionGroup.choices.find(c => c.id === selectedOptionId);
            if (selectedChoice) {
              cartItem.options.push({
                groupId: optionGroup.id,
                groupName: optionGroup.name,
                choiceId: selectedChoice.id,
                choiceName: selectedChoice.name,
                price: selectedChoice.price || 0
              });
            }
          }
        });
      }
      
      store.dispatch('addToCart', {
        item: cartItem,
        restaurantId: restaurant.value.id
      });
      
      itemDialog.value = false;
    };
    
    // Calculate total price of item with options
    const calculateItemTotal = computed(() => {
      if (!selectedItem.value) return 0;
      
      let total = selectedItem.value.price;
      
      // Add option prices
      if (selectedItem.value.options) {
        selectedItem.value.options.forEach(optionGroup => {
          const selectedOptionId = selectedOptions.value[optionGroup.id];
          if (selectedOptionId) {
            const selectedChoice = optionGroup.choices.find(c => c.id === selectedOptionId);
            if (selectedChoice && selectedChoice.price) {
              total += selectedChoice.price;
            }
          }
        });
      }
      
      // Multiply by quantity
      return total * itemQuantity.value;
    });
    
    // Check if user can review (has ordered from this restaurant)
    const canReview = computed(() => {
      // In a real app, check if user has ordered from this restaurant
      // For now, just check if user is logged in
      return store.getters.isAuthenticated;
    });
    
    // Submit review
    const submitReview = async () => {
      const isValid = await reviewForm.value.validate();
      if (!isValid.valid) return;
      
      isSubmittingReview.value = true;
      
      try {
        await store.dispatch('submitReview', {
          restaurantId: restaurant.value.id,
          rating: userReview.rating,
          comment: userReview.comment
        });
        
        // Reset form
        userReview.rating = 0;
        userReview.comment = '';
        
        // Refresh reviews
        restaurant.value.reviews = await store.dispatch('fetchRestaurantReviews', restaurant.value.id);
        
        // Update restaurant rating
        const ratingSum = restaurant.value.reviews.reduce((sum, review) => sum + review.rating, 0);
        restaurant.value.rating = ratingSum / restaurant.value.reviews.length;
        restaurant.value.reviewCount = restaurant.value.reviews.length;
        
        isSubmittingReview.value = false;
      } catch (error) {
        console.error('Failed to submit review:', error);
        isSubmittingReview.value = false;
      }
    };
    
    // Filter reviews based on filters
    const filteredReviews = computed(() => {
      if (!restaurant.value.reviews) return [];
      
      let filtered = [...restaurant.value.reviews];
      
      // Filter by rating
      if (reviewFilters.rating === 'positive') {
        filtered = filtered.filter(review => review.rating >= 4);
      } else if (reviewFilters.rating === 'critical') {
        filtered = filtered.filter(review => review.rating < 4);
      }
      
      // Filter by search term
      if (reviewFilters.search.trim()) {
        const search = reviewFilters.search.toLowerCase();
        filtered = filtered.filter(review => 
          review.comment.toLowerCase().includes(search) ||
          review.userName.toLowerCase().includes(search)
        );
      }
      
      // Sort reviews
      switch (reviewFilters.sort) {
        case 'newest':
          filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
          break;
        case 'oldest':
          filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
          break;
        case 'highest':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'lowest':
          filtered.sort((a, b) => a.rating - b.rating);
          break;
        case 'helpful':
          filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          break;
      }
      
      return filtered;
    });
    
    // Pagination for reviews
    const paginatedReviews = computed(() => {
      const start = (reviewPage.value - 1) * reviewsPerPage;
      const end = start + reviewsPerPage;
      return filteredReviews.value.slice(start, end);
    });
    
    // Get counts for rating percentages
    const getRatingCount = (rating) => {
      if (!restaurant.value.reviews) return 0;
      return restaurant.value.reviews.filter(review => Math.floor(review.rating) === rating).length;
    };
    
    const getRatingPercentage = (rating) => {
      if (!restaurant.value.reviews || restaurant.value.reviews.length === 0) return 0;
      return (getRatingCount(rating) / restaurant.value.reviews.length) * 100;
    };
    
    // Like/dislike a review
    const likeReview = async (review) => {
      if (!store.getters.isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      
      try {
        const action = review.userLiked ? 'removeLike' : 'addLike';
        await store.dispatch(`${action}Review`, {
          reviewId: review.id,
          restaurantId: restaurant.value.id
        });
        
        // Update UI immediately
        review.userLiked = !review.userLiked;
        if (review.userLiked) {
          review.likes = (review.likes || 0) + 1;
          if (review.userDisliked) {
            review.userDisliked = false;
            review.dislikes = Math.max(0, (review.dislikes || 0) - 1);
          }
        } else {
          review.likes = Math.max(0, (review.likes || 0) - 1);
        }
      } catch (error) {
        console.error('Failed to like review:', error);
      }
    };
    
    const dislikeReview = async (review) => {
      if (!store.getters.isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      
      try {
        const action = review.userDisliked ? 'removeDislike' : 'addDislike';
        await store.dispatch(`${action}Review`, {
          reviewId: review.id,
          restaurantId: restaurant.value.id
        });
        
        // Update UI immediately
        review.userDisliked = !review.userDisliked;
        if (review.userDisliked) {
          review.dislikes = (review.dislikes || 0) + 1;
          if (review.userLiked) {
            review.userLiked = false;
            review.likes = Math.max(0, (review.likes || 0) - 1);
          }
        } else {
          review.dislikes = Math.max(0, (review.dislikes || 0) - 1);
        }
      } catch (error) {
        console.error('Failed to dislike review:', error);
      }
    };
    
    // Format date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    // Watch for route changes to reload restaurant data
    watch(() => route.params.id, async (newId) => {
      if (newId) {
        isLoading.value = true;
        try {
          const restaurantData = await store.dispatch('fetchRestaurantDetails', newId);
          restaurant.value = restaurantData;
          isLoading.value = false;
        } catch (error) {
          console.error('Failed to load restaurant:', error);
          router.push('/restaurants');
        }
      }
    });
    
    return {
      restaurant,
      isLoading,
      menuSearch,
      activeTab,
      activeCategoryId,
      cart,
      itemDialog,
      selectedItem,
      itemQuantity,
      selectedOptions,
      specialInstructions,
      userReview,
      reviewForm,
      isReviewFormValid,
      isSubmittingReview,
      reviewPage,
      reviewFilters,
      sortOptions,
      reviewRules,
      canReview,
      filterMenuItems,
      scrollToCategory,
      openItemDialog,
      addToCart,
      calculateItemTotal,
      submitReview,
      filteredReviews,
      paginatedReviews,
      getRatingCount,
      getRatingPercentage,
      likeReview,
      dislikeReview,
      formatDate
    };
  }
};
</script>

<style scoped>
.restaurant-detail {
  padding-bottom: 60px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
}

.restaurant-header-content {
  padding-bottom: 20px;
}

.category-nav {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 8px;
}

.menu-category {
  scroll-margin-top: 120px;
}

.cart-sidebar {
  position: sticky;
  top: 80px;
}

.hours-table td {
  padding: 4px 0;
}

@media (max-width: 960px) {
  .cart-sidebar {
    position: static;
  }
}
</style>
