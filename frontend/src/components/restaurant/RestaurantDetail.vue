<template>
  <div class="restaurant-detail">
    <!-- Restaurant Header -->
    <section class="restaurant-header">
      <v-img
        :src="restaurant?.image_url || '/img/restaurant-placeholder.jpg'"
        height="300"
        class="restaurant-cover"
      >
        <div class="overlay">
          <div class="container">
            <div class="restaurant-header-content">
              <h1>{{ restaurant?.name || 'Loading...' }}</h1>
              <div class="restaurant-meta">
                <div class="meta-item">
                  <v-icon>mdi-star</v-icon>
                  <span>{{ restaurant?.rating?.toFixed(1) || '0.0' }} ({{ reviewCount || 0 }} reviews)</span>
                </div>
                <div class="meta-item">
                  <v-icon>mdi-map-marker</v-icon>
                  <span>{{ restaurant?.address || 'No address' }}</span>
                </div>
                <div class="meta-item">
                  <v-icon>mdi-phone</v-icon>
                  <span>{{ restaurant?.phone || 'No phone' }}</span>
                </div>
                <div class="meta-item" :class="{'closed': restaurant?.status !== 'active'}">
                  <v-icon>mdi-clock-outline</v-icon>
                  <span>{{ restaurant?.status === 'active' ? 'Open Now' : 'Closed' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-img>
    </section>
    
    <!-- Main Content -->
    <section class="restaurant-content">
      <div class="container">
        <v-row>
          <!-- Left Side - Categories & Menu -->
          <v-col cols="12" md="8">
            <div class="menu-container">
              <!-- Loading State -->
              <div v-if="loading" class="loading-state">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
                <p>Loading menu...</p>
              </div>
              
              <!-- Error State -->
              <v-alert
                v-else-if="error"
                type="error"
                title="Error"
                text="Failed to load menu. Please try again."
                class="mb-4"
              ></v-alert>
              
              <!-- Menu Content -->
              <template v-else>
                <!-- Category Navigation -->
                <div class="category-nav">
                  <div class="scrollable-nav">
                    <v-btn
                      v-for="category in categories"
                      :key="category.id"
                      variant="text"
                      class="category-nav-item"
                      :class="{ 'active': activeCategory === category.id }"
                      @click="scrollToCategory(category.id)"
                    >
                      {{ category.name }}
                    </v-btn>
                  </div>
                </div>
                
                <!-- Menu Sections by Category -->
                <div class="menu-sections">
                  <div
                    v-for="category in categories"
                    :key="category.id"
                    :id="`category-${category.id}`"
                    class="menu-section"
                  >
                    <h2 class="category-title">{{ category.name }}</h2>
                    
                    <div class="menu-items">
                      <div
                        v-for="product in getProductsByCategory(category.id)"
                        :key="product.id"
                        class="menu-item"
                      >
                        <div class="menu-item-content" @click="openProductDetails(product)">
                          <div class="menu-item-details">
                            <h3 class="menu-item-title">{{ product.name }}</h3>
                            <p class="menu-item-description">{{ product.description || 'No description available' }}</p>
                            <p class="menu-item-price">${{ product.price.toFixed(2) }}</p>
                            <div v-if="product.rating" class="item-rating">
                              <v-icon color="amber" size="small">mdi-star</v-icon>
                              <span>{{ product.rating.toFixed(1) }}</span>
                            </div>
                          </div>
                          <div class="menu-item-image">
                            <v-img
                              :src="product.image_url || '/img/product-placeholder.jpg'"
                              width="100"
                              height="100"
                              cover
                            ></v-img>
                          </div>
                        </div>
                        <div class="menu-item-actions">
                          <v-btn
                            color="primary"
                            variant="text"
                            @click="addToCart(product)"
                          >
                            Add to Cart
                          </v-btn>
                        </div>
                      </div>
                      
                      <!-- Empty Category Message -->
                      <v-alert
                        v-if="getProductsByCategory(category.id).length === 0"
                        type="info"
                        text="No items available in this category"
                        class="mb-4"
                      ></v-alert>
                    </div>
                  </div>
                </div>
              </template>
            </div>
          </v-col>
          
          <!-- Right Side - Order Summary -->
          <v-col cols="12" md="4">
            <div class="order-summary">
              <v-card class="order-summary-card">
                <v-card-title>Your Order</v-card-title>
                
                <v-card-text>
                  <div v-if="cartItems.length === 0" class="empty-cart">
                    <v-icon size="48" color="grey">mdi-cart-outline</v-icon>
                    <p>Your cart is empty</p>
                    <p class="hint">Add items from the menu to start your order</p>
                  </div>
                  
                  <div v-else class="cart-items">
                    <div
                      v-for="(item, index) in cartItems"
                      :key="index"
                      class="cart-item"
                    >
                      <div class="item-info">
                        <div class="item-quantity">{{ item.quantity }}×</div>
                        <div class="item-name">{{ item.name }}</div>
                        <div class="item-price">${{ (item.price * item.quantity).toFixed(2) }}</div>
                      </div>
                      
                      <div class="item-actions">
                        <v-btn
                          density="compact"
                          icon="mdi-minus"
                          size="small"
                          variant="text"
                          @click="decreaseQuantity(index)"
                        ></v-btn>
                        <span class="quantity-number">{{ item.quantity }}</span>
                        <v-btn
                          density="compact"
                          icon="mdi-plus"
                          size="small"
                          variant="text"
                          @click="increaseQuantity(index)"
                        ></v-btn>
                        <v-btn
                          density="compact"
                          icon="mdi-delete-outline"
                          size="small"
                          variant="text"
                          color="error"
                          @click="removeCartItem(index)"
                        ></v-btn>
                      </div>
                      
                      <div v-if="item.notes" class="item-notes">
                        Note: {{ item.notes }}
                      </div>
                    </div>
                  </div>
                  
                  <v-divider v-if="cartItems.length > 0" class="my-4"></v-divider>
                  
                  <div v-if="cartItems.length > 0" class="order-totals">
                    <div class="total-row">
                      <span>Subtotal</span>
                      <span>${{ cartSubtotal.toFixed(2) }}</span>
                    </div>
                    <div class="total-row">
                      <span>Delivery Fee</span>
                      <span>${{ deliveryFee.toFixed(2) }}</span>
                    </div>
                    <div class="total-row">
                      <span>Tax</span>
                      <span>${{ taxAmount.toFixed(2) }}</span>
                    </div>
                    <div class="total-row grand-total">
                      <span>Total</span>
                      <span>${{ orderTotal.toFixed(2) }}</span>
                    </div>
                  </div>
                </v-card-text>
                
                <v-card-actions>
                  <v-btn
                    block
                    color="primary"
                    size="large"
                    :disabled="cartItems.length === 0"
                    @click="proceedToCheckout"
                  >
                    Checkout
                  </v-btn>
                </v-card-actions>
              </v-card>
              
              <!-- Restaurant Reviews -->
              <v-card class="reviews-card mt-4">
                <v-card-title class="d-flex justify-space-between">
                  <span>Customer Reviews</span>
                  <span class="rating">
                    <v-icon color="amber">mdi-star</v-icon>
                    {{ restaurant?.rating?.toFixed(1) || '0.0' }}
                  </span>
                </v-card-title>
                
                <v-card-text>
                  <div v-if="reviews.length === 0" class="text-center py-4">
                    <p>No reviews yet</p>
                  </div>
                  
                  <div v-else class="reviews-list">
                    <div
                      v-for="review in reviews.slice(0, 3)"
                      :key="review.id"
                      class="review-item"
                    >
                      <div class="review-header">
                        <span class="reviewer-name">{{ review.user?.full_name || 'Anonymous' }}</span>
                        <div class="review-rating">
                          <v-rating
                            :model-value="review.rating"
                            color="amber"
                            density="compact"
                            size="small"
                            readonly
                          ></v-rating>
                        </div>
                      </div>
                      <p class="review-comment">{{ review.comment }}</p>
                      <p class="review-date">{{ formatDate(review.created_at) }}</p>
                    </div>
                  </div>
                  
                  <div v-if="reviews.length > 3" class="text-center mt-2">
                    <v-btn
                      variant="text"
                      color="primary"
                      @click="showAllReviews = true"
                    >
                      View all {{ reviews.length }} reviews
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-col>
        </v-row>
      </div>
    </section>
    
    <!-- Product Detail Dialog -->
    <v-dialog v-model="productDialog" max-width="500">
      <v-card v-if="selectedProduct">
        <v-img
          :src="selectedProduct.image_url || '/img/product-placeholder.jpg'"
          height="200"
          cover
        ></v-img>
        
        <v-card-title>{{ selectedProduct.name }}</v-card-title>
        
        <v-card-text>
          <p class="product-description">{{ selectedProduct.description }}</p>
          <p class="product-price">${{ selectedProduct.price.toFixed(2) }}</p>
          
          <v-textarea
            v-model="productNotes"
            label="Special instructions"
            placeholder="E.g., no onions, extra spicy"
            rows="2"
            class="mt-4"
          ></v-textarea>
          
          <div class="quantity-selector">
            <span>Quantity:</span>
            <div class="quantity-controls">
              <v-btn icon="mdi-minus" variant="outlined" size="small" @click="decreaseDialogQuantity"></v-btn>
              <span class="quantity-value">{{ productQuantity }}</span>
              <v-btn icon="mdi-plus" variant="outlined" size="small" @click="increaseDialogQuantity"></v-btn>
            </div>
          </div>
          
          <div class="mt-4">
            <p class="total-price">Total: ${{ (selectedProduct.price * productQuantity).toFixed(2) }}</p>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-btn variant="text" @click="productDialog = false">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="addProductToCart">Add to Cart</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Reviews Dialog -->
    <v-dialog v-model="showAllReviews" max-width="600">
      <v-card>
        <v-card-title>
          All Reviews
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="showAllReviews = false"></v-btn>
        </v-card-title>
        
        <v-card-text>
          <div class="reviews-list">
            <div
              v-for="review in reviews"
              :key="review.id"
              class="review-item"
            >
              <div class="review-header">
                <span class="reviewer-name">{{ review.user?.full_name || 'Anonymous' }}</span>
                <div class="review-rating">
                  <v-rating
                    :model-value="review.rating"
                    color="amber"
                    density="compact"
                    size="small"
                    readonly
                  ></v-rating>
                </div>
              </div>
              <p class="review-comment">{{ review.comment }}</p>
              <p class="review-date">{{ formatDate(review.created_at) }}</p>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import restaurantService from '@/services/restaurant.service';
import productService from '@/services/product.service';
import reviewService from '@/services/review.service';

export default {
  name: 'RestaurantDetail',
  
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  
  setup(props) {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    
    // State
    const restaurant = ref(null);
    const products = ref([]);
    const categories = ref([]);
    const reviews = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const activeCategory = ref(null);
    const productDialog = ref(false);
    const selectedProduct = ref(null);
    const productQuantity = ref(1);
    const productNotes = ref('');
    const showAllReviews = ref(false);
    
    // Get cart items from store or local state
    const cartItems = computed(() => {
      return store.state.cart?.items || [];
    });
    
    // Calculate totals
    const cartSubtotal = computed(() => {
      return cartItems.value.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    });
    
    const deliveryFee = computed(() => {
      return cartItems.value.length > 0 ? 2.99 : 0;
    });
    
    const taxAmount = computed(() => {
      return cartSubtotal.value * 0.0875; // 8.75% tax rate example
    });
    
    const orderTotal = computed(() => {
      return cartSubtotal.value + deliveryFee.value + taxAmount.value;
    });
    
    const reviewCount = computed(() => {
      return reviews.value.length;
    });
    
    // Methods
    const fetchRestaurantData = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        // Fetch restaurant details
        const restaurantResponse = await restaurantService.getRestaurantById(props.id);
        restaurant.value = restaurantResponse.data;
        
        // Fetch products for this restaurant
        const productsResponse = await productService.getProductsByRestaurant(props.id);
        products.value = productsResponse.data;
        
        // Fetch categories
        const categoriesResponse = await productService.getCategories();
        categories.value = categoriesResponse.data;
        
        // Set initial active category if products exist
        if (categories.value.length > 0) {
          activeCategory.value = categories.value[0].id;
        }
        
        // Fetch reviews
        const reviewsResponse = await reviewService.getReviewsByRestaurant(props.id);
        reviews.value = reviewsResponse.data;
        
      } catch (err) {
        console.error('Error fetching restaurant data:', err);
        error.value = err.message || 'Failed to load restaurant data';
      } finally {
        loading.value = false;
      }
    };
    
    const getProductsByCategory = (categoryId) => {
      return products.value.filter(product => product.category_id === categoryId);
    };
    
    const scrollToCategory = (categoryId) => {
      activeCategory.value = categoryId;
      const element = document.getElementById(`category-${categoryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    const openProductDetails = (product) => {
      selectedProduct.value = product;
      productQuantity.value = 1;
      productNotes.value = '';
      productDialog.value = true;
    };
    
    const increaseDialogQuantity = () => {
      productQuantity.value++;
    };
    
    const decreaseDialogQuantity = () => {
      if (productQuantity.value > 1) {
        productQuantity.value--;
      }
    };
    
    const addProductToCart = () => {
      const item = {
        id: selectedProduct.value.id,
        restaurant_id: restaurant.value.id,
        name: selectedProduct.value.name,
        price: selectedProduct.value.price,
        quantity: productQuantity.value,
        notes: productNotes.value
      };
      
      store.dispatch('cart/addToCart', item);
      productDialog.value = false;
      
      // Show toast notification
      store.dispatch('notification/show', {
        type: 'success',
        message: `${item.name} added to your cart`
      });
    };
    
    const addToCart = (product) => {
      const item = {
        id: product.id,
        restaurant_id: restaurant.value.id,
        name: product.name,
        price: product.price,
        quantity: 1
      };
      
      store.dispatch('cart/addToCart', item);
      
      // Show toast notification
      store.dispatch('notification/show', {
        type: 'success',
        message: `${item.name} added to your cart`
      });
    };
    
    const increaseQuantity = (index) => {
      store.dispatch('cart/updateQuantity', { index, change: 1 });
    };
    
    const decreaseQuantity = (index) => {
      const item = cartItems.value[index];
      if (item.quantity <= 1) {
        removeCartItem(index);
      } else {
        store.dispatch('cart/updateQuantity', { index, change: -1 });
      }
    };
    
    const removeCartItem = (index) => {
      store.dispatch('cart/removeFromCart', index);
    };
    
    const proceedToCheckout = () => {
      router.push({ name: 'Checkout' });
    };
    
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    };
    
    // Lifecycle hooks
    onMounted(async () => {
      await fetchRestaurantData();
    });
    
    return {
      restaurant,
      products,
      categories,
      reviews,
      loading,
      error,
      activeCategory,
      productDialog,
      selectedProduct,
      productQuantity,
      productNotes,
      showAllReviews,
      cartItems,
      cartSubtotal,
      deliveryFee,
      taxAmount,
      orderTotal,
      reviewCount,
      getProductsByCategory,
      scrollToCategory,
      openProductDetails,
      increaseDialogQuantity,
      decreaseDialogQuantity,
      addProductToCart,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      removeCartItem,
      proceedToCheckout,
      formatDate
    };
  }
};
</script>

<style scoped>
.restaurant-header {
  position: relative;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.7));
  color: white;
  display: flex;
  align-items: flex-end;
}

.restaurant-header-content {
  padding-bottom: 2rem;
}

.restaurant-header-content h1 {
  font-size: 2rem;
  margin: 0 0 0.5rem;
}

.restaurant-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.meta-item.closed {
  color: #f44336;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.restaurant-content {
  padding: 2rem 0;
}

.menu-container {
  position: relative;
}

.category-nav {
  position: sticky;
  top: 0;
  background-color: white;
  padding: 1rem 0;
  z-index: 5;
  border-bottom: 1px solid #eee;
}

.scrollable-nav {
  display: flex;
  overflow-x: auto;
  gap: 1rem;
  padding-bottom: 0.5rem;
}

.category-nav-item {
  white-space: nowrap;
}

.category-nav-item.active {
  background-color: rgba(var(--v-theme-primary), 0.1);
  color: rgb(var(--v-theme-primary));
}

.menu-sections {
  margin-top: 1rem;
}

.menu-section {
  margin-bottom: 2rem;
  scroll-margin-top: 4rem;
}

.category-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #eee;
}

.menu-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-item {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
}

.menu-item-content {
  display: flex;
  padding: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.menu-item-content:hover {
  background-color: #f9f9f9;
}

.menu-item-details {
  flex: 1;
}

.menu-item-title {
  margin: 0 0 0.5rem;
  font-size: 1.2rem;
}

.menu-item-description {
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.menu-item-price {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.item-rating {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.9rem;
}

.menu-item-image {
  width: 100px;
  margin-left: 1rem;
}

.menu-item-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0.5rem 1rem;
  background-color: #f9f9f9;
}

.order-summary {
  position: sticky;
  top: 2rem;
}

.order-summary-card, .reviews-card {
  border-radius: 8px;
}

.empty-cart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem 0;
  color: rgba(0, 0, 0, 0.6);
}

.hint {
  font-size: 0.9rem;
  margin-top: 0.5rem;
}

.cart-items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.item-info {
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.item-quantity {
  font-weight: bold;
  margin-right: 0.5rem;
}

.item-name {
  flex: 1;
}

.item-price {
  font-weight: bold;
}

.item-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.quantity-number {
  width: 24px;
  text-align: center;
}

.item-notes {
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
  font-style: italic;
}

.order-totals {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.total-row {
  display: flex;
  justify-content: space-between;
}

.grand-total {
  font-weight: bold;
  font-size: 1.1rem;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #eee;
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.review-item {
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.reviewer-name {
  font-weight: bold;
}

.review-comment {
  margin: 0 0 0.5rem;
}

.review-date {
  font-size: 0.8rem;
  color: rgba(0, 0, 0, 0.6);
  margin: 0;
}

.product-description {
  margin-bottom: 1rem;
}

.product-price {
  font-size: 1.2rem;
  font-weight: bold;
}

.quantity-selector {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.5rem;
}

.quantity-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.quantity-value {
  font-size: 1.2rem;
  font-weight: bold;
  width: 24px;
  text-align: center;
}

.total-price {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 3rem;
}

@media (max-width: 960px) {
  .order-summary {
    position: static;
    margin-top: 2rem;
  }
  
  .restaurant-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }
}

@media (max-width: 600px) {
  .restaurant-header-content h1 {
    font-size: 1.5rem;
  }
  
  .restaurant-meta {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .menu-item-content {
    flex-direction: column;
  }
  
  .menu-item-image {
    width: 100%;
    height: 150px;
    margin: 1rem 0 0 0;
  }
  
  .review-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
