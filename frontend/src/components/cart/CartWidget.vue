<template>
  <div class="cart-widget">
    <!-- Cart Header -->
    <div class="d-flex justify-space-between align-center mb-4">
      <h3 class="text-h6 font-weight-bold">
        {{ restaurant ? `Order from ${restaurant.name}` : 'Your Cart' }}
      </h3>
      <v-btn
        v-if="items.length > 0"
        variant="text"
        color="error"
        density="comfortable"
        size="small"
        prepend-icon="mdi-delete"
        @click="confirmClearCart"
      >
        Clear
      </v-btn>
    </div>

    <!-- Empty Cart -->
    <div v-if="items.length === 0" class="empty-cart text-center py-8">
      <v-icon size="80" color="grey-lighten-1">mdi-cart-outline</v-icon>
      <p class="text-body-1 mt-4">{{ emptyCartMessage }}</p>
      <slot name="empty-cart-action">
        <v-btn
          color="primary"
          class="mt-4"
          :to="browseLink"
          v-if="showBrowseButton"
        >
          Browse Restaurants
        </v-btn>
      </slot>
    </div>

    <!-- Cart Items -->
    <div v-else>
      <div class="cart-items">
        <v-card
          v-for="(item, index) in items"
          :key="item.id || index"
          class="cart-item mb-4 elevation-1"
          variant="outlined"
        >
          <!-- Item Header -->
          <div class="d-flex pa-3">
            <!-- Item Image -->
            <v-img
              v-if="showImages && item.image"
              :src="item.image"
              :width="imageSize"
              :height="imageSize"
              cover
              class="rounded mr-3"
            ></v-img>
            
            <!-- Item Details -->
            <div class="flex-grow-1">
              <div class="d-flex justify-space-between align-center">
                <div class="flex-grow-1">
                  <div class="text-subtitle-1 font-weight-medium">{{ item.name }}</div>
                  <div v-if="item.description" class="text-caption text-medium-emphasis">
                    {{ item.description }}
                  </div>
                </div>
                <div class="text-subtitle-1 font-weight-medium ml-4">${{ (item.price * item.quantity).toFixed(2) }}</div>
              </div>
              
              <!-- Item Options -->
              <div v-if="item.options && item.options.length" class="mt-2">
                <div
                  v-for="(option, optIndex) in item.options"
                  :key="optIndex"
                  class="text-caption text-medium-emphasis d-flex justify-space-between"
                >
                  <span>+ {{ option.name }}</span>
                  <span v-if="option.price > 0" class="ml-2">
                    ${{ option.price.toFixed(2) }}
                  </span>
                </div>
              </div>

              <!-- Quantity Controls -->
              <div class="d-flex align-center mt-3">
                <v-btn
                  icon="mdi-minus"
                  size="small"
                  variant="outlined"
                  density="comfortable"
                  :disabled="item.quantity <= 1"
                  @click="updateQuantity(index, item.quantity - 1)"
                ></v-btn>
                
                <v-text-field
                  v-model="item.quantity"
                  type="number"
                  min="1"
                  :max="maxQuantity"
                  density="compact"
                  hide-details
                  class="quantity-input mx-2"
                  style="width: 60px"
                  @change="onQuantityInputChange(index, $event)"
                ></v-text-field>
                
                <v-btn
                  icon="mdi-plus"
                  size="small"
                  variant="outlined"
                  density="comfortable"
                  :disabled="item.quantity >= maxQuantity"
                  @click="updateQuantity(index, item.quantity + 1)"
                ></v-btn>

                <v-spacer></v-spacer>

                <v-btn
                  v-if="allowEdit"
                  icon="mdi-pencil"
                  size="small"
                  variant="text"
                  density="comfortable"
                  class="mr-2"
                  @click="$emit('edit-item', index)"
                ></v-btn>

                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  density="comfortable"
                  @click="removeItem(index)"
                ></v-btn>
              </div>

              <!-- Special Instructions -->
              <div v-if="item.specialInstructions" class="mt-2">
                <div class="text-caption text-grey">Special Instructions:</div>
                <div class="text-caption">{{ item.specialInstructions }}</div>
              </div>
            </div>
          </div>
        </v-card>
      </div>

      <!-- Order Summary -->
      <v-card class="mt-4" variant="outlined">
        <v-card-text>
          <div class="text-subtitle-1 font-weight-bold mb-3">Order Summary</div>
          
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Subtotal</span>
            <span class="text-body-2">${{ subtotal.toFixed(2) }}</span>
          </div>
          
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Delivery Fee</span>
            <span class="text-body-2">${{ deliveryFee.toFixed(2) }}</span>
          </div>
          
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Tax ({{ (taxRate * 100).toFixed() }}%)</span>
            <span class="text-body-2">${{ tax.toFixed(2) }}</span>
          </div>
          
          <template v-if="discount > 0">
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-2 text-success">Discount</span>
              <span class="text-body-2 text-success">-${{ discount.toFixed(2) }}</span>
            </div>
          </template>
          
          <v-divider class="my-3"></v-divider>
          
          <div class="d-flex justify-space-between">
            <span class="text-subtitle-1 font-weight-bold">Total</span>
            <span class="text-subtitle-1 font-weight-bold">${{ total.toFixed(2) }}</span>
          </div>

          <!-- Promo Code Input -->
          <div class="mt-4">
            <v-text-field
              v-model="promoCodeInput"
              label="Promo Code"
              density="compact"
              hide-details
              class="mb-2"
              append-inner-icon="mdi-check"
              @click:append-inner="applyPromoCode"
            ></v-text-field>
          </div>

          <v-btn
            block
            color="primary"
            size="large"
            class="mt-4"
            :to="checkoutLink"
            :disabled="!isCheckoutEnabled"
          >
            {{ checkoutButtonText }}
          </v-btn>

          <div v-if="minOrderAmount > 0 && total < minOrderAmount" class="text-caption text-center mt-2">
            Add ${{ (minOrderAmount - total).toFixed(2) }} more to reach minimum order amount
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Clear Cart Confirmation Dialog -->
    <v-dialog v-model="showClearCartDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Clear Cart?</v-card-title>
        <v-card-text>
          Are you sure you want to remove all items from your cart? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showClearCartDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="clearCart">Clear Cart</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>

  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    location="bottom end"
    max-width="400"
    offset="8"
    transition="slide-y-transition"
  >
    <template v-slot:activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        variant="text"
        class="position-relative"
      >
        <v-badge
          v-if="cartItemCount > 0"
          :content="cartItemCount.toString()"
          color="primary"
        >
          <v-icon>mdi-cart</v-icon>
        </v-badge>
        <v-icon v-else>mdi-cart-outline</v-icon>
      </v-btn>
    </template>

    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Your Cart</span>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          icon="mdi-close"
          size="small"
          @click="menu = false"
        ></v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <div v-if="isLoading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
        <p class="mt-2">Loading cart...</p>
      </div>

      <div v-else-if="!cart || !cart.items || cart.items.length === 0" class="text-center py-8">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-cart-outline</v-icon>
        <p class="text-body-1 mb-4">Your cart is empty</p>
        <v-btn
          color="primary"
          variant="outlined"
          size="small"
          to="/"
          prepend-icon="mdi-food"
          @click="menu = false"
        >
          Browse Restaurants
        </v-btn>
      </div>

      <div v-else class="cart-content">
        <!-- Restaurant info -->
        <div class="d-flex align-center px-4 py-2">
          <v-avatar size="36" class="mr-2">
            <v-img :src="cart.restaurant?.logo || '/img/placeholder-restaurant.png'" alt="Restaurant"></v-img>
          </v-avatar>
          <div>
            <div class="text-subtitle-2">{{ cart.restaurant?.name }}</div>
            <div class="text-caption">{{ cart.items.length }} item{{ cart.items.length > 1 ? 's' : '' }}</div>
          </div>
        </div>

        <v-divider></v-divider>

        <!-- Cart items list -->
        <v-list class="cart-items-list" max-height="300" density="compact">
          <v-list-item
            v-for="item in cart.items"
            :key="item.id"
            class="py-2"
          >
            <template v-slot:prepend>
              <div class="font-weight-medium">{{ item.quantity }}×</div>
            </template>

            <v-list-item-title class="text-body-2">{{ item.product.name }}</v-list-item-title>
            <v-list-item-subtitle v-if="hasOptions(item)" class="text-caption">
              {{ getOptionsText(item) }}
            </v-list-item-subtitle>

            <template v-slot:append>
              <div class="text-right">
                <div class="text-body-2 font-weight-medium">${{ item.itemTotal.toFixed(2) }}</div>
                <div class="d-flex mt-1">
                  <v-btn
                    icon="mdi-minus"
                    size="x-small"
                    variant="text"
                    density="comfortable"
                    :disabled="item.quantity <= 1"
                    @click="updateQuantity(item.id, item.quantity - 1)"
                  ></v-btn>

                  <v-btn
                    icon="mdi-plus"
                    size="x-small"
                    variant="text"
                    density="comfortable"
                    @click="updateQuantity(item.id, item.quantity + 1)"
                  ></v-btn>

                  <v-btn
                    icon="mdi-delete-outline"
                    size="x-small"
                    variant="text"
                    color="error"
                    density="comfortable"
                    @click="removeItem(item.id)"
                  ></v-btn>
                </div>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <!-- Price summary -->
        <div class="px-4 py-2">
          <div class="d-flex justify-space-between mb-1">
            <span class="text-caption">Subtotal</span>
            <span class="text-caption">${{ cart.subtotal?.toFixed(2) }}</span>
          </div>

          <div v-if="cart.discountAmount > 0" class="d-flex justify-space-between mb-1 text-success">
            <span class="text-caption">Discount</span>
            <span class="text-caption">-${{ cart.discountAmount?.toFixed(2) }}</span>
          </div>

          <div class="d-flex justify-space-between mb-1">
            <span class="text-caption">Delivery Fee</span>
            <span class="text-caption">${{ cart.deliveryFee?.toFixed(2) }}</span>
          </div>

          <div class="d-flex justify-space-between">
            <span class="text-caption">Tax</span>
            <span class="text-caption">${{ cart.taxAmount?.toFixed(2) }}</span>
          </div>

          <v-divider class="my-2"></v-divider>

          <div class="d-flex justify-space-between font-weight-bold">
            <span>Total</span>
            <span>${{ cart.total?.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Action buttons -->
        <v-card-actions>
          <v-btn
            block
            color="primary"
            to="/cart"
            @click="menu = false"
          >
            View Cart
          </v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </v-menu>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'CartWidget',

  props: {
    items: {
      type: Array,
      default: () => []
    },
    restaurant: {
      type: Object,
      default: null
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    taxRate: {
      type: Number,
      default: 0.1 // 10%
    },
    discount: {
      type: Number,
      default: 0
    },
    showImages: {
      type: Boolean,
      default: true
    },
    imageSize: {
      type: Number,
      default: 60
    },
    emptyCartMessage: {
      type: String,
      default: 'Your cart is empty'
    },
    showBrowseButton: {
      type: Boolean,
      default: true
    },
    browseLink: {
      type: String,
      default: '/restaurants'
    },
    checkoutLink: {
      type: String,
      default: '/checkout'
    },
    checkoutButtonText: {
      type: String,
      default: 'Proceed to Checkout'
    },
    allowEdit: {
      type: Boolean,
      default: true
    },
    maxQuantity: {
      type: Number,
      default: 99
    },
    minOrderAmount: {
      type: Number,
      default: 0
    }
  },

  emits: [
    'update:items',
    'edit-item',
    'remove-item',
    'clear-cart',
    'update-quantity',
    'apply-promo'
  ],

  setup(props, { emit }) {
    const showClearCartDialog = ref(false)
    const promoCodeInput = ref('')

    // Computed properties for cart totals
    const subtotal = computed(() => {
      return props.items.reduce((total, item) => {
        const itemTotal = item.price * item.quantity
        const optionsTotal = item.options?.reduce(
          (sum, opt) => sum + (opt.price || 0),
          0
        ) || 0
        return total + itemTotal + (optionsTotal * item.quantity)
      }, 0)
    })

    const tax = computed(() => subtotal.value * props.taxRate)

    const total = computed(() => 
      subtotal.value + props.deliveryFee + tax.value - props.discount
    )

    const isCheckoutEnabled = computed(() => 
      props.items.length > 0 && total.value >= props.minOrderAmount
    )

    // Cart actions
    const updateQuantity = (index, newQuantity) => {
      if (newQuantity < 1 || newQuantity > props.maxQuantity) return

      const updatedItems = [...props.items]
      updatedItems[index] = {
        ...updatedItems[index],
        quantity: newQuantity
      }

      emit('update:items', updatedItems)
      emit('update-quantity', { index, quantity: newQuantity })
    }

    const onQuantityInputChange = (index, event) => {
      const value = parseInt(event.target.value)
      if (isNaN(value) || value < 1) {
        updateQuantity(index, 1)
      } else if (value > props.maxQuantity) {
        updateQuantity(index, props.maxQuantity)
      } else {
        updateQuantity(index, value)
      }
    }

    const removeItem = (index) => {
      const updatedItems = props.items.filter((_, i) => i !== index)
      emit('update:items', updatedItems)
      emit('remove-item', index)
    }

    const confirmClearCart = () => {
      showClearCartDialog.value = true
    }

    const clearCart = () => {
      emit('update:items', [])
      emit('clear-cart')
      showClearCartDialog.value = false
    }

    const applyPromoCode = () => {
      emit('apply-promo', promoCodeInput.value)
      promoCodeInput.value = ''
    }

    return {
      showClearCartDialog,
      promoCodeInput,
      subtotal,
      tax,
      total,
      isCheckoutEnabled,
      updateQuantity,
      onQuantityInputChange,
      removeItem,
      confirmClearCart,
      clearCart,
      applyPromoCode
    }
  }
}
</script>

<script>
import { computed, ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'CartWidget',
  setup() {
    const store = useStore();
    const router = useRouter();
    const menu = ref(false);
    const isLoading = ref(false);

    const cart = computed(() => store.state.cart.cart);
    const cartItemCount = computed(() => {
      if (!cart.value || !cart.value.items) return 0;
      return cart.value.items.reduce((total, item) => total + item.quantity, 0);
    });

    // Load cart data when the widget is opened
    watch(menu, async (isOpen) => {
      if (isOpen && (!cart.value || !cart.value.items)) {
        await loadCart();
      }
    });

    // Load cart data when the component is mounted
    onMounted(async () => {
      await loadCart();
    });

    const loadCart = async () => {
      if (!store.getters['auth/isAuthenticated']) return;
      
      try {
        isLoading.value = true;
        await store.dispatch('cart/fetchCart');
      } catch (error) {
        console.error('Failed to load cart:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const updateQuantity = async (itemId, quantity) => {
      try {
        await store.dispatch('cart/updateCartItem', {
          id: itemId,
          quantity
        });
      } catch (error) {
        console.error('Failed to update quantity:', error);
      }
    };

    const removeItem = async (itemId) => {
      try {
        await store.dispatch('cart/removeCartItem', itemId);
      } catch (error) {
        console.error('Failed to remove item:', error);
      }
    };

    const hasOptions = (item) => {
      return item.options && Object.keys(item.options).length > 0;
    };

    const getOptionsText = (item) => {
      if (!item.options) return '';

      const options = [];

      if (item.options.size) {
        options.push(`Size: ${item.options.size.name}`);
      }

      if (item.options.toppings && item.options.toppings.length) {
        const toppingsText = item.options.toppings
          .map(t => `${t.quantity}× ${t.name}`)
          .join(', ');
        options.push(`Toppings: ${toppingsText}`);
      }

      if (item.options.extras && item.options.extras.length) {
        const extrasText = item.options.extras
          .map(e => e.name)
          .join(', ');
        options.push(`Extras: ${extrasText}`);
      }

      return options.join(' • ');
    };

    return {
      menu,
      cart,
      cartItemCount,
      isLoading,
      updateQuantity,
      removeItem,
      hasOptions,
      getOptionsText
    };
  }
};
</script>

<style scoped>
.cart-widget {
  width: 100%;
}

.cart-items {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 8px;
}

.cart-item {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cart-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1) !important;
}

.quantity-input :deep(input) {
  text-align: center;
}

/* Custom scrollbar for cart items */
.cart-items::-webkit-scrollbar {
  width: 6px;
}

.cart-items::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.cart-items::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.cart-items::-webkit-scrollbar-thumb:hover {
  background: #666;
}

.cart-items-list {
  max-height: 300px;
  overflow-y: auto;
}

.position-relative {
  position: relative;
}
</style>