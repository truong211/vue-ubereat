<template>
  <div class="cart-mini">
    <v-list>
      <v-list-subheader class="d-flex justify-space-between align-center">
        <span>Your Cart ({{ cartStore.itemCount || 0 }} items)</span>
        <v-btn
          v-if="cartStore.hasItems"
          density="comfortable"
          variant="text"
          size="small"
          color="error"
          @click="cartStore.clearCart"
        >
          Clear All
        </v-btn>
      </v-list-subheader>

      <v-divider></v-divider>

      <!-- Empty Cart Message -->
      <div v-if="!cartStore.hasItems" class="pa-4 text-center">
        <v-icon size="64" color="grey-lighten-1" class="mb-2">mdi-cart-outline</v-icon>
        <p class="text-subtitle-1">Your cart is empty</p>
        <v-btn 
          color="primary" 
          variant="text" 
          :to="{ name: 'restaurants' }" 
          class="mt-2"
        >
          Browse Restaurants
        </v-btn>
      </div>

      <!-- Cart Items List -->
      <template v-else>
        <v-list-item
          v-for="(item, index) in cartStore.cartItems"
          :key="index"
          :title="item.name"
          :subtitle="`$${item.price.toFixed(2)} × ${item.quantity}`"
        >
          <template v-slot:prepend>
            <v-avatar size="40" rounded>
              <v-img
                :src="item.image || '/img/product-placeholder.jpg'"
                cover
              ></v-img>
            </v-avatar>
          </template>

          <template v-slot:append>
            <div class="d-flex align-center">
              <v-btn
                icon="mdi-minus"
                size="x-small"
                variant="text"
                @click="decrementQuantity(item)"
              ></v-btn>
              <span class="mx-2">{{ item.quantity }}</span>
              <v-btn
                icon="mdi-plus"
                size="x-small"
                variant="text"
                @click="incrementQuantity(item)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="cartStore.removeFromCart(item.id, item.options)"
                class="ml-2"
              ></v-btn>
            </div>
          </template>
        </v-list-item>

        <v-divider></v-divider>
        
        <!-- Cart Summary -->
        <div class="pa-4">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Subtotal:</span>
            <span class="text-body-2">${{ cartStore.itemsSubtotal.toFixed(2) }}</span>
          </div>
          <div v-if="cartStore.discount > 0" class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Discount:</span>
            <span class="text-body-2 text-error">-${{ cartStore.discountTotal.toFixed(2) }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Delivery Fee:</span>
            <span class="text-body-2">${{ cartStore.deliveryFee.toFixed(2) }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Tax:</span>
            <span class="text-body-2">${{ cartStore.taxTotal.toFixed(2) }}</span>
          </div>
          <v-divider class="my-2"></v-divider>
          <div class="d-flex justify-space-between font-weight-bold">
            <span>Total:</span>
            <span>${{ cartStore.orderTotal.toFixed(2) }}</span>
          </div>
          
          <v-btn
            color="primary"
            variant="flat"
            block
            class="mt-4"
            :to="{ name: 'checkout' }"
            @click="$emit('close')"
          >
            Proceed to Checkout
          </v-btn>
          
          <v-btn
            variant="outlined"
            block
            class="mt-2"
            :to="{ name: 'cart' }"
            @click="$emit('close')"
          >
            View Cart
          </v-btn>
        </div>
      </template>
    </v-list>
  </div>
</template>

<script>
import { useCartStore } from '@/store/modules/cart';

export default {
  name: 'CartMini',
  
  emits: ['close'],
  
  setup() {
    const cartStore = useCartStore();
    
    // Make sure cart is loaded from localStorage
    cartStore.loadCart();
    
    const incrementQuantity = (item) => {
      cartStore.updateItemQuantity(item.id, item.options, item.quantity + 1);
    };
    
    const decrementQuantity = (item) => {
      if (item.quantity > 1) {
        cartStore.updateItemQuantity(item.id, item.options, item.quantity - 1);
      } else {
        cartStore.removeFromCart(item.id, item.options);
      }
    };
    
    return {
      cartStore,
      incrementQuantity,
      decrementQuantity
    };
  }
}
</script>

<style scoped>
.cart-mini {
  width: 100%;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}
</style>
