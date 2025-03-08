<template>
  <div class="cart-examples">
    <h2 class="text-h5 mb-4">Cart Widget Examples</h2>
    
    <!-- Example 1: Basic Cart -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Cart</h3>
      <v-row>
        <v-col cols="12" md="8">
          <v-card>
            <v-card-text>
              <cart-widget 
                v-model:items="cartItems"
                :restaurant="restaurant"
                :delivery-fee="5.99"
                @update-quantity="handleUpdateQuantity"
                @remove-item="handleRemoveItem"
                @clear-cart="handleClearCart"
              />
            </v-card-text>
            <v-card-text class="bg-grey-lighten-4">
              <pre class="code-example">{{ basicExample }}</pre>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Add Items (Demo)</v-card-title>
            <v-card-text>
              <v-btn
                v-for="item in menuItems"
                :key="item.id"
                block
                class="mb-2"
                @click="addToCart(item)"
              >
                Add {{ item.name }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
    
    <!-- Example 2: Mini Cart -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Mini Cart (Compact View)</h3>
      <v-card>
        <v-card-text style="max-width: 300px;">
          <cart-widget 
            v-model:items="miniCartItems"
            :show-images="false"
            empty-cart-message="Cart is empty"
            checkout-button-text="View Cart"
            :show-browse-button="false"
            :min-order-amount="15"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ miniExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 3: Cart with Discounts -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Cart with Discounts</h3>
      <v-card>
        <v-card-text>
          <cart-widget 
            v-model:items="discountCartItems"
            :restaurant="restaurant"
            :delivery-fee="3.99"
            :discount="discountAmount"
            :tax-rate="0.08"
          >
            <template v-slot:checkout-button>
              <div class="mb-4">
                <v-text-field
                  v-model="promoCode"
                  label="Promo Code"
                  append-inner-icon="mdi-ticket-percent"
                  density="compact"
                  hide-details
                  class="mb-2"
                ></v-text-field>
                <v-btn 
                  color="primary" 
                  size="large" 
                  block
                  :disabled="!discountCartItems.length"
                >
                  Checkout (${{ calculateTotal(discountCartItems).toFixed(2) }})
                </v-btn>
              </div>
            </template>
          </cart-widget>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ discountExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 4: Cart with Custom Empty State -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Custom Empty State</h3>
      <v-card>
        <v-card-text>
          <cart-widget 
            v-model:items="emptyCartItems"
            :show-browse-button="false"
          >
            <template v-slot:empty-cart-action>
              <div class="text-center">
                <p class="text-body-2 mb-4">
                  Sign in to sync your cart across devices
                </p>
                <v-btn
                  color="primary"
                  class="mr-2"
                  prepend-icon="mdi-login"
                >
                  Sign In
                </v-btn>
                <v-btn
                  variant="outlined"
                  to="/restaurants"
                  prepend-icon="mdi-food"
                >
                  Browse Menu
                </v-btn>
              </div>
            </template>
          </cart-widget>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ emptyStateExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import CartWidget from '@/components/cart/CartWidget.vue'

export default {
  name: 'CartExample',
  
  components: {
    CartWidget
  },
  
  setup() {
    // Restaurant data
    const restaurant = ref({
      id: 1,
      name: 'Burger Palace',
      image: '/images/restaurants/burger-palace.jpg'
    });
    
    // Menu items for demo
    const menuItems = [
      {
        id: 1,
        name: 'Classic Burger',
        price: 12.99,
        image: '/images/products/classic-burger.jpg',
        description: 'Beef patty with lettuce, tomato, and cheese'
      },
      {
        id: 2,
        name: 'French Fries',
        price: 4.99,
        image: '/images/products/fries.jpg',
        description: 'Crispy golden fries'
      },
      {
        id: 3,
        name: 'Milkshake',
        price: 5.99,
        image: '/images/products/milkshake.jpg',
        description: 'Vanilla milkshake'
      }
    ];
    
    // Cart states for different examples
    const cartItems = ref([]);
    const miniCartItems = ref([]);
    const discountCartItems = ref([]);
    const emptyCartItems = ref([]);
    
    // Promo code demo
    const promoCode = ref('');
    const discountAmount = computed(() => 
      promoCode.value === 'SAVE10' ? 10 : 0
    );
    
    // Cart actions
    const addToCart = (menuItem) => {
      const existingItem = cartItems.value.find(item => item.id === menuItem.id);
      
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        cartItems.value.push({
          ...menuItem,
          quantity: 1
        });
      }
    };
    
    const handleUpdateQuantity = ({ index, quantity }) => {
      console.log(`Updated quantity for item ${index} to ${quantity}`);
    };
    
    const handleRemoveItem = (index) => {
      console.log(`Removed item at index ${index}`);
    };
    
    const handleClearCart = () => {
      console.log('Cart cleared');
    };
    
    const calculateTotal = (items) => {
      const subtotal = items.reduce((total, item) => 
        total + (item.price * item.quantity), 0
      );
      return subtotal + 3.99 - discountAmount.value;
    };
    
    // Example code snippets
    const basicExample = computed(() => {
      return `<cart-widget 
  v-model:items="cartItems"
  :restaurant="restaurant"
  :delivery-fee="5.99"
  @update-quantity="handleUpdateQuantity"
  @remove-item="handleRemoveItem"
  @clear-cart="handleClearCart"
/>`;
    });
    
    const miniExample = computed(() => {
      return `<cart-widget 
  v-model:items="cartItems"
  :show-images="false"
  empty-cart-message="Cart is empty"
  checkout-button-text="View Cart"
  :show-browse-button="false"
  :min-order-amount="15"
/>`;
    });
    
    const discountExample = computed(() => {
      return `<cart-widget 
  v-model:items="cartItems"
  :restaurant="restaurant"
  :delivery-fee="3.99"
  :discount="discountAmount"
  :tax-rate="0.08"
>
  <template v-slot:checkout-button>
    <div class="mb-4">
      <v-text-field
        v-model="promoCode"
        label="Promo Code"
        append-inner-icon="mdi-ticket-percent"
      ></v-text-field>
      <v-btn color="primary" block>
        Checkout
      </v-btn>
    </div>
  </template>
</cart-widget>`;
    });
    
    const emptyStateExample = computed(() => {
      return `<cart-widget 
  v-model:items="cartItems"
  :show-browse-button="false"
>
  <template v-slot:empty-cart-action>
    <div class="text-center">
      <p class="text-body-2 mb-4">
        Sign in to sync your cart across devices
      </p>
      <v-btn color="primary" prepend-icon="mdi-login">
        Sign In
      </v-btn>
      <v-btn variant="outlined" to="/restaurants">
        Browse Menu
      </v-btn>
    </div>
  </template>
</cart-widget>`;
    });
    
    return {
      restaurant,
      menuItems,
      cartItems,
      miniCartItems,
      discountCartItems,
      emptyCartItems,
      promoCode,
      discountAmount,
      addToCart,
      handleUpdateQuantity,
      handleRemoveItem,
      handleClearCart,
      calculateTotal,
      basicExample,
      miniExample,
      discountExample,
      emptyStateExample
    };
  }
};
</script>

<style scoped>
.cart-examples {
  padding: 16px;
}

.code-example {
  font-family: monospace;
  white-space: pre-wrap;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}
</style>