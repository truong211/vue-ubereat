<template>
  <v-container class="cart-page py-8">
    <h1 class="text-h4 font-weight-bold mb-6">Your Cart</h1>

    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading your cart...</p>
    </div>

    <div v-else-if="cartItems.length === 0" class="empty-cart-container text-center py-12">
      <v-icon size="100" color="grey">mdi-cart-outline</v-icon>
      <h2 class="text-h5 mt-6 mb-2">Your cart is empty</h2>
      <p class="text-body-1 mb-8">Add items from restaurants to start your order</p>
      <v-btn
        color="primary"
        size="large"
        to="/"
        prepend-icon="mdi-food"
      >
        Browse Restaurants
      </v-btn>
    </div>

    <v-row v-else>
      <!-- Cart items (left side) -->
      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-avatar size="40" class="mr-3">
              <v-img :src="restaurant.image" alt="Restaurant"></v-img>
            </v-avatar>
            <div>
              <div class="text-h6">{{ restaurant.name }}</div>
              <div class="text-caption text-medium-emphasis">
                <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                {{ restaurant.address }}
              </div>
            </div>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text class="pa-0">
            <!-- Cart items list -->
            <v-list>
              <v-list-item
                v-for="(item, index) in cartItems"
                :key="index"
                class="py-4"
              >
                <template v-slot:prepend>
                  <div class="d-flex align-center">
                    <v-btn
                      icon="mdi-minus"
                      size="small"
                      variant="text"
                      :disabled="item.quantity <= 1"
                      @click="decreaseQuantity(index)"
                    ></v-btn>
                    <span class="mx-2">{{ item.quantity }}</span>
                    <v-btn
                      icon="mdi-plus"
                      size="small"
                      variant="text"
                      @click="increaseQuantity(index)"
                    ></v-btn>
                  </div>
                </template>
                
                <v-list-item-title class="text-subtitle-1 font-weight-medium">
                  {{ item.name }}
                </v-list-item-title>
                
                <div v-if="item.options && item.options.length" class="text-caption text-medium-emphasis">
                  {{ item.options.join(', ') }}
                </div>
                
                <template v-slot:append>
                  <div class="d-flex align-center">
                    <span class="text-subtitle-1 font-weight-bold mr-4">
                      ${{ (item.price * item.quantity).toFixed(2) }}
                    </span>
                    <v-btn
                      icon="mdi-delete-outline"
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeItem(index)"
                    ></v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <v-card-actions class="pa-4">
            <v-btn
              prepend-icon="mdi-plus"
              variant="text"
              to="/restaurants"
            >
              Add more items
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="error"
              variant="text"
              prepend-icon="mdi-delete"
              @click="confirmClearCart"
            >
              Clear cart
            </v-btn>
          </v-card-actions>
        </v-card>
        
        <!-- Special instructions -->
        <v-card class="mb-4">
          <v-card-title>Special Instructions</v-card-title>
          <v-card-text>
            <v-textarea
              v-model="specialInstructions"
              placeholder="Add special instructions for the restaurant (e.g., allergies, dietary restrictions, etc.)"
              variant="outlined"
              rows="3"
              auto-grow
              hide-details
            ></v-textarea>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Order summary (right side) -->
      <v-col cols="12" md="4">
        <v-card class="order-summary">
          <v-card-title>Order Summary</v-card-title>
          
          <v-card-text>
            <!-- Promo code -->
            <div class="mb-4">
              <v-text-field
                v-model="promoCode"
                label="Promo Code"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="isApplyingPromo"
                :error="promoError"
                class="mb-2"
              >
                <template v-slot:append>
                  <v-btn
                    color="primary"
                    :disabled="!promoCode || isApplyingPromo"
                    :loading="isApplyingPromo"
                    size="small"
                    @click="applyPromoCode"
                  >
                    Apply
                  </v-btn>
                </template>
              </v-text-field>
              <div v-if="promoError" class="text-error text-caption">
                {{ promoError }}
              </div>
              <div v-if="appliedPromo" class="d-flex align-center">
                <v-chip
                  color="success"
                  size="small"
                  class="mr-2"
                  closable
                  @click:close="removePromoCode"
                >
                  {{ appliedPromo.code }}: {{ appliedPromo.description }}
                </v-chip>
              </div>
            </div>
            
            <v-divider class="mb-4"></v-divider>
            
            <!-- Price breakdown -->
            <div class="d-flex justify-space-between mb-3">
              <span class="text-body-1">Subtotal</span>
              <span class="text-body-1">${{ subtotal.toFixed(2) }}</span>
            </div>
            
            <div v-if="discount > 0" class="d-flex justify-space-between mb-3 text-success">
              <span class="text-body-1">Discount</span>
              <span class="text-body-1">-${{ discount.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between mb-3">
              <span class="text-body-1">Delivery Fee</span>
              <span class="text-body-1">${{ deliveryFee.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-1">Tax (8%)</span>
              <span class="text-body-1">${{ tax.toFixed(2) }}</span>
            </div>
            
            <v-divider class="mb-4"></v-divider>
            
            <!-- Total -->
            <div class="d-flex justify-space-between mb-6">
              <span class="text-h6 font-weight-bold">Total</span>
              <span class="text-h6 font-weight-bold">${{ total.toFixed(2) }}</span>
            </div>
            
            <!-- Checkout button -->
            <v-btn
              color="primary"
              size="large"
              block
              :to="{ name: 'Checkout' }"
              :disabled="cartItems.length === 0"
            >
              Proceed to Checkout
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Clear cart confirmation dialog -->
    <v-dialog v-model="showClearCartDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Clear your cart?</v-card-title>
        <v-card-text>
          Are you sure you want to remove all items from your cart? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showClearCartDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="clearCart"
          >
            Clear Cart
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  name: 'CartView',
  data() {
    return {
      isLoading: true,
      cartItems: [],
      specialInstructions: '',
      promoCode: '',
      appliedPromo: null,
      promoError: '',
      isApplyingPromo: false,
      showClearCartDialog: false,
      
      // Restaurant info (would come from store/API in real app)
      restaurant: {
        id: 1,
        name: 'Burger Palace',
        image: '/images/restaurants/burger-logo.jpg',
        address: '123 Main St, New York, NY 10001'
      }
    };
  },
  computed: {
    subtotal() {
      return this.cartItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);
    },
    discount() {
      if (!this.appliedPromo) {
        return 0;
      }
      
      if (this.appliedPromo.type === 'percentage') {
        return this.subtotal * (this.appliedPromo.value / 100);
      } else if (this.appliedPromo.type === 'fixed') {
        return Math.min(this.appliedPromo.value, this.subtotal);
      }
      
      return 0;
    },
    discountedSubtotal() {
      return this.subtotal - this.discount;
    },
    deliveryFee() {
      // Free delivery if order is over $20 or if promotion is applied
      if (this.subtotal >= 20 || (this.appliedPromo && this.appliedPromo.freeDelivery)) {
        return 0;
      }
      
      return 2.99;
    },
    tax() {
      // Calculate tax based on discounted subtotal
      return this.discountedSubtotal * 0.08;
    },
    total() {
      return this.discountedSubtotal + this.deliveryFee + this.tax;
    }
  },
  created() {
    this.loadCartItems();
  },
  methods: {
    loadCartItems() {
      // In a real app, this would fetch cart items from Vuex store or API
      setTimeout(() => {
        // For demo, use mock data
        this.cartItems = [
          {
            id: 101,
            name: 'Classic Cheeseburger',
            price: 8.99,
            quantity: 2,
            options: ['Regular', 'Extra Cheese']
          },
          {
            id: 301,
            name: 'French Fries',
            price: 3.99,
            quantity: 1,
            options: ['Large']
          },
          {
            id: 401,
            name: 'Soft Drink',
            price: 2.49,
            quantity: 2,
            options: ['Medium', 'Coca-Cola']
          }
        ];
        
        this.isLoading = false;
      }, 1000);
    },
    
    increaseQuantity(index) {
      this.cartItems[index].quantity += 1;
    },
    
    decreaseQuantity(index) {
      if (this.cartItems[index].quantity > 1) {
        this.cartItems[index].quantity -= 1;
      }
    },
    
    removeItem(index) {
      this.cartItems.splice(index, 1);
    },
    
    confirmClearCart() {
      this.showClearCartDialog = true;
    },
    
    clearCart() {
      this.cartItems = [];
      this.showClearCartDialog = false;
    },
    
    applyPromoCode() {
      this.isApplyingPromo = true;
      this.promoError = '';
      
      // In a real app, this would validate the promo code against an API
      setTimeout(() => {
        // Mock promo codes for demo
        const validPromos = {
          'WELCOME50': {
            code: 'WELCOME50',
            type: 'percentage',
            value: 50,
            freeDelivery: true,
            description: '50% off your order'
          },
          'FREEDEL': {
            code: 'FREEDEL',
            type: 'fixed',
            value: 0,
            freeDelivery: true,
            description: 'Free delivery'
          },
          '10OFF': {
            code: '10OFF',
            type: 'fixed',
            value: 10,
            freeDelivery: false,
            description: '$10 off your order'
          }
        };
        
        const code = this.promoCode.trim().toUpperCase();
        
        if (validPromos[code]) {
          this.appliedPromo = validPromos[code];
          this.promoCode = '';
        } else {
          this.promoError = 'Invalid promo code';
        }
        
        this.isApplyingPromo = false;
      }, 1000);
    },
    
    removePromoCode() {
      this.appliedPromo = null;
    }
  }
};
</script>

<style scoped>
.order-summary {
  position: sticky;
  top: 20px;
}

@media (max-width: 960px) {
  .order-summary {
    position: static;
  }
}
</style>
