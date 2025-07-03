<template>
  <div class="cart-page">
    <div class="container">
      <h1 class="page-title">Your Cart</h1>
      
      <!-- Empty Cart -->
      <div v-if="isEmpty" class="empty-cart-container">
        <v-icon size="100" color="grey-lighten-1">mdi-cart-outline</v-icon>
        <h2>Your cart is empty</h2>
        <p>Looks like you haven't added any items to your cart yet.</p>
        <v-btn
          color="primary"
          size="large"
          :to="{ name: 'Restaurants' }"
          class="mt-4"
        >
          Browse Restaurants
        </v-btn>
      </div>
      
      <!-- Cart Items -->
      <div v-else class="cart-content">
        <v-row>
          <!-- Left Side - Cart Items -->
          <v-col cols="12" md="8">
            <v-card class="cart-items-card">
              <v-card-title class="d-flex align-center">
                <div>
                  <span class="restaurant-name">{{ restaurantName }}</span>
                  <span class="items-count">({{ totalItems }} items)</span>
                </div>
                <v-spacer></v-spacer>
                <v-btn
                  variant="text"
                  color="error"
                  prepend-icon="mdi-delete"
                  @click="clearCart"
                >
                  Clear Cart
                </v-btn>
              </v-card-title>
              
              <v-divider></v-divider>
              
              <v-card-text class="pb-0">
                <!-- Cart Item List -->
                <div class="cart-item" v-for="(item, index) in cartItems" :key="index">
                  <div class="item-details">
                    <div class="item-name-section">
                      <h3 class="item-name">{{ item.name }}</h3>
                      <p v-if="item.notes" class="item-notes">{{ item.notes }}</p>
                    </div>
                    
                    <div class="item-controls">
                      <div class="quantity-control">
                        <v-btn
                          icon="mdi-minus"
                          variant="text"
                          density="comfortable"
                          @click="decreaseQuantity(index)"
                        ></v-btn>
                        <span class="quantity-value">{{ item.quantity }}</span>
                        <v-btn
                          icon="mdi-plus"
                          variant="text"
                          density="comfortable"
                          @click="increaseQuantity(index)"
                        ></v-btn>
                      </div>
                      
                      <div class="item-price">${{ (item.price * item.quantity).toFixed(2) }}</div>
                      
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        color="error"
                        density="comfortable"
                        @click="removeItem(index)"
                      ></v-btn>
                    </div>
                  </div>
                  
                  <v-divider class="my-4"></v-divider>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Right Side - Order Summary -->
          <v-col cols="12" md="4">
            <v-card class="order-summary-card">
              <v-card-title>Order Summary</v-card-title>
              
              <v-card-text>
                <div class="summary-content">
                  <div class="summary-row">
                    <span>Subtotal</span>
                    <span>${{ subtotal.toFixed(2) }}</span>
                  </div>
                  
                  <div class="summary-row">
                    <span>Delivery Fee</span>
                    <span>${{ deliveryFee.toFixed(2) }}</span>
                  </div>
                  
                  <div class="summary-row">
                    <span>Tax</span>
                    <span>${{ taxAmount.toFixed(2) }}</span>
                  </div>
                  
                  <div class="promo-code">
                    <PromoCodeForm />
                  </div>
                  
                  <v-divider class="my-4"></v-divider>
                  
                  <div class="summary-row total-row">
                    <span>Total</span>
                    <span>${{ total.toFixed(2) }}</span>
                  </div>
                </div>
              </v-card-text>
              
              <v-card-actions>
                <v-btn
                  block
                  color="primary"
                  size="large"
                  :to="{ name: 'Checkout' }"
                  :disabled="!cartItems.length"
                >
                  Proceed to Checkout
                </v-btn>
              </v-card-actions>
              
              <v-card-text class="pt-0">
                <div class="checkout-options">
                  <v-btn
                    variant="text"
                    :to="{ name: 'Restaurants' }"
                    prepend-icon="mdi-arrow-left"
                    block
                  >
                    Continue Shopping
                  </v-btn>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>
  </div>
</template>

<script>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import DeliveryTimeSelector from '@/components/cart/DeliveryTimeSelector.vue';
import PromoCodeForm from '@/components/cart/PromoCodeForm.vue';
import promotionService from '@/services/promotion.service';

export default {
  name: 'CartView',
  components: { DeliveryTimeSelector, PromoCodeForm },
  
  setup() {
    const store = useStore();
    const promoCode = ref('');
    const promoMessage = ref('');
    const promoSuccess = ref(false);
    const applyingPromo = ref(false);
    const discount = ref(0);
    
    // Get cart items from Vuex store
    const cartItems = computed(() => store.state.cart.items || []);
    
    const isEmpty = computed(() => cartItems.value.length === 0);
    
    // Calculate totals
    const subtotal = computed(() => {
      return cartItems.value.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    });
    
    const deliveryFee = computed(() => {
      return cartItems.value.length > 0 ? 2.99 : 0;
    });
    
    const taxAmount = computed(() => {
      return subtotal.value * 0.0875; // 8.75% tax rate
    });
    
    const total = computed(() => {
      return subtotal.value + deliveryFee.value + taxAmount.value - discount.value;
    });
    
    const totalItems = computed(() => {
      return cartItems.value.reduce((count, item) => count + item.quantity, 0);
    });
    
    // Get restaurant name (assuming all items are from the same restaurant)
    const restaurantName = computed(() => {
      // In a real app, this would come from the restaurant data
      return cartItems.value.length > 0 ? 'Restaurant Name' : '';
    });
    
    // Methods
    const increaseQuantity = (index) => {
      store.dispatch('cart/updateQuantity', { index, change: 1 });
    };
    
    const decreaseQuantity = (index) => {
      if (cartItems.value[index].quantity <= 1) {
        removeItem(index);
      } else {
        store.dispatch('cart/updateQuantity', { index, change: -1 });
      }
    };
    
    const removeItem = (index) => {
      store.dispatch('cart/removeFromCart', index);
    };
    
    const clearCart = () => {
      store.dispatch('cart/clearCart');
    };
    
    const applyPromoCode = async () => {
      if (!promoCode.value.trim()) {
        promoMessage.value = 'Please enter a promo code';
        promoSuccess.value = false;
        return;
      }
      
      applyingPromo.value = true;
      
      try {
        const response = await promotionService.applyPromo(promoCode.value);
        if (response.data.valid) {
          promoSuccess.value = true;
          promoMessage.value = response.data.message || 'Promo code applied successfully!';
          discount.value = calculateDiscount(response.data.discount);
        } else {
          promoSuccess.value = false;
          promoMessage.value = response.data.message || 'Invalid promo code';
          discount.value = 0;
        }
      } catch (error) {
        promoSuccess.value = false;
        promoMessage.value = 'Error applying promo code. Please try again.';
        discount.value = 0;
      } finally {
        applyingPromo.value = false;
      }
    };
    
    const calculateDiscount = (discountInfo) => {
      if (discountInfo.type === 'percentage') {
        return subtotal.value * (discountInfo.value / 100);
      } else if (discountInfo.type === 'fixed_amount') {
        return discountInfo.value;
      }
      return 0;
    };
    
    return {
      cartItems,
      isEmpty,
      subtotal,
      deliveryFee,
      taxAmount,
      total,
      totalItems,
      restaurantName,
      promoCode,
      promoMessage,
      promoSuccess,
      applyingPromo,
      discount,
      increaseQuantity,
      decreaseQuantity,
      removeItem,
      clearCart,
      applyPromoCode
    };
  }
};
</script>

<style scoped>
.cart-page {
  padding: 2rem 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 2rem;
}

.empty-cart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 4rem 0;
}

.empty-cart-container h2 {
  margin: 1.5rem 0 0.5rem;
  font-size: 1.5rem;
}

.empty-cart-container p {
  color: rgba(0, 0, 0, 0.6);
  margin-bottom: 1rem;
}

.cart-content {
  margin-bottom: 2rem;
}

.cart-items-card, .order-summary-card {
  border-radius: 8px;
  height: 100%;
}

.restaurant-name {
  font-weight: 500;
}

.items-count {
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
  margin-left: 0.5rem;
}

.cart-item {
  padding: 0.5rem 0;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-name {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
}

.item-notes {
  font-size: 0.9rem;
  color: rgba(0, 0, 0, 0.6);
  font-style: italic;
  margin: 0.25rem 0 0;
}

.item-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.quantity-value {
  display: inline-block;
  text-align: center;
  width: 1.5rem;
}

.item-price {
  font-weight: 500;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
}

.discount-row {
  color: green;
}

.total-row {
  font-size: 1.2rem;
  font-weight: bold;
}

.promo-code {
  margin: 1.5rem 0 0.5rem;
}

.promo-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.promo-input .v-text-field {
  flex: 1;
}

.checkout-options {
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .promo-input {
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .promo-input .v-btn {
    width: 100%;
  }
  
  .cart-items-card {
    margin-bottom: 1.5rem;
  }
}
</style>
