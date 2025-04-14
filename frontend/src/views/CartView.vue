<template>
  <v-container class="cart-page py-8">
    <h1 class="text-h4 mb-6">Your Cart</h1>
    
    <!-- Empty Cart Message -->
    <v-card v-if="!cartStore.hasItems" class="mb-6 pa-6 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-cart-outline</v-icon>
      <h2 class="text-h5 mb-4">Your cart is empty</h2>
      <p class="text-body-1 mb-6">Looks like you haven't added any items to your cart yet.</p>
      <v-btn 
        size="large" 
        color="primary" 
        :to="{ name: 'restaurants' }" 
        class="mb-2 hover-scale"
      >
        Browse Restaurants
      </v-btn>
    </v-card>

    <!-- Cart Content -->
    <template v-else>
      <v-row>
        <!-- Cart Items -->
        <v-col cols="12" md="8">
          <!-- Group items by restaurant -->
          <v-card v-for="(group, index) in cartStore.restaurantGroups" :key="index" class="mb-6">
            <v-card-title class="d-flex justify-space-between align-center">
              <span>{{ group.restaurantName }}</span>
              <v-chip size="small" color="primary" variant="flat">{{ group.items.length }} items</v-chip>
            </v-card-title>
            
            <v-divider></v-divider>
            
            <v-list>
              <v-list-item
                v-for="(item, itemIndex) in group.items"
                :key="itemIndex"
                :title="item.name"
              >
                <template v-slot:prepend>
                  <v-avatar rounded size="56">
                    <v-img :src="item.image || '/img/product-placeholder.jpg'" cover></v-img>
                  </v-avatar>
                </template>
                
                <template v-slot:subtitle>
                  <div>
                    <div>Unit Price: ${{ item.price.toFixed(2) }}</div>
                    <div v-if="Object.keys(item.options).length > 0" class="text-caption mt-1">
                      Options: {{ formatOptions(item.options) }}
                    </div>
                  </div>
                </template>
                
                <template v-slot:append>
                  <div class="text-right">
                    <div class="font-weight-bold mb-2">${{ (item.price * item.quantity).toFixed(2) }}</div>
                    <div class="d-flex align-center justify-end">
                      <v-btn
                        icon="mdi-minus"
                        size="small"
                        variant="text"
                        @click="decrementQuantity(item)"
                        :disabled="item.quantity <= 1"
                      ></v-btn>
                      <v-text-field
                        v-model.number="item.quantity"
                        type="number"
                        min="1"
                        max="99"
                        hide-details
                        density="compact"
                        class="quantity-input mx-2"
                        @change="updateQuantity(item)"
                      ></v-text-field>
                      <v-btn
                        icon="mdi-plus"
                        size="small"
                        variant="text"
                        @click="incrementQuantity(item)"
                      ></v-btn>
                      <v-btn
                        icon="mdi-delete"
                        size="small"
                        variant="text"
                        color="error"
                        @click="removeItem(item)"
                        class="ml-2"
                      ></v-btn>
                    </div>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        
        <!-- Order Summary -->
        <v-col cols="12" md="4">
          <v-card class="order-summary" sticky>
            <v-card-title>Order Summary</v-card-title>
            
            <v-card-text>
              <div class="d-flex justify-space-between mb-3">
                <span>Subtotal</span>
                <span>${{ cartStore.itemsSubtotal.toFixed(2) }}</span>
              </div>
              
              <div v-if="cartStore.discount > 0" class="d-flex justify-space-between mb-3">
                <span>Discount</span>
                <span class="text-error">-${{ cartStore.discountTotal.toFixed(2) }}</span>
              </div>
              
              <div class="d-flex justify-space-between mb-3">
                <span>Delivery Fee</span>
                <span>${{ cartStore.deliveryFee.toFixed(2) }}</span>
              </div>
              
              <div class="d-flex justify-space-between mb-4">
                <span>Estimated Tax</span>
                <span>${{ cartStore.taxTotal.toFixed(2) }}</span>
              </div>
              
              <v-divider class="mb-4"></v-divider>
              
              <div class="d-flex justify-space-between mb-6 text-h6 font-weight-bold">
                <span>Total</span>
                <span>${{ cartStore.orderTotal.toFixed(2) }}</span>
              </div>
              
              <!-- Coupon Input -->
              <div v-if="!cartStore.appliedCoupon" class="mb-4">
                <v-text-field
                  v-model="couponCode"
                  label="Promo Code"
                  placeholder="Enter promo code"
                  hide-details
                  density="compact"
                  class="mb-2"
                  :error-messages="couponError"
                ></v-text-field>
                <v-btn
                  block
                  variant="outlined"
                  @click="applyCoupon"
                  :loading="applyingCoupon"
                >
                  Apply
                </v-btn>
              </div>
              
              <!-- Applied Coupon -->
              <v-alert
                v-else
                color="success"
                variant="tonal"
                class="mb-4"
                closable
                @click:close="cartStore.removeCoupon"
              >
                <div class="d-flex justify-space-between align-center">
                  <div>
                    <div class="font-weight-bold">{{ cartStore.appliedCoupon }}</div>
                    <div class="text-caption">{{ cartStore.discount * 100 }}% discount applied</div>
                  </div>
                  <v-btn icon="mdi-refresh" size="small" variant="text" @click="cartStore.removeCoupon"></v-btn>
                </div>
              </v-alert>
              
              <v-btn
                block
                size="large"
                color="primary"
                class="mb-3"
                :to="{ name: 'checkout' }"
              >
                Proceed to Checkout
              </v-btn>
              
              <v-btn
                block
                variant="outlined"
                :to="{ name: 'restaurants' }"
              >
                Continue Shopping
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { ref } from 'vue';
import { useCartStore } from '@/store/modules/cart';
import { useToast } from '@/composables/useToast';

export default {
  name: 'CartView',
  
  setup() {
    const cartStore = useCartStore();
    const toast = useToast();
    
    const couponCode = ref('');
    const couponError = ref('');
    const applyingCoupon = ref(false);
    
    // Make sure cart is loaded
    cartStore.loadCart();
    
    const incrementQuantity = (item) => {
      cartStore.updateItemQuantity(item.id, item.options, item.quantity + 1);
    };
    
    const decrementQuantity = (item) => {
      if (item.quantity > 1) {
        cartStore.updateItemQuantity(item.id, item.options, item.quantity - 1);
      }
    };
    
    const updateQuantity = (item) => {
      const quantity = parseInt(item.quantity);
      if (isNaN(quantity) || quantity < 1) {
        item.quantity = 1;
      } else if (quantity > 99) {
        item.quantity = 99;
      }
      
      cartStore.updateItemQuantity(item.id, item.options, item.quantity);
    };
    
    const removeItem = (item) => {
      cartStore.removeFromCart(item.id, item.options);
      toast.success('Item removed from cart');
    };
    
    const applyCoupon = async () => {
      if (!couponCode.value) {
        couponError.value = 'Please enter a promo code';
        return;
      }
      
      couponError.value = '';
      applyingCoupon.value = true;
      
      try {
        const success = cartStore.applyCoupon(couponCode.value);
        
        if (success) {
          toast.success('Coupon applied successfully!');
          couponCode.value = '';
        } else {
          couponError.value = 'Invalid or expired promo code';
          toast.error('Invalid or expired promo code');
        }
      } catch (error) {
        console.error(error);
        couponError.value = 'An error occurred, please try again';
        toast.error('Failed to apply coupon');
      } finally {
        applyingCoupon.value = false;
      }
    };
    
    const formatOptions = (options) => {
      if (!options || Object.keys(options).length === 0) return '';
      
      return Object.entries(options)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
    };
    
    return {
      cartStore,
      couponCode,
      couponError,
      applyingCoupon,
      incrementQuantity,
      decrementQuantity,
      updateQuantity,
      removeItem,
      applyCoupon,
      formatOptions
    };
  }
};
</script>

<style scoped>
.order-summary {
  position: sticky;
  top: 80px;
}

.quantity-input {
  width: 60px;
}

.quantity-input :deep(input) {
  text-align: center;
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}
</style>
