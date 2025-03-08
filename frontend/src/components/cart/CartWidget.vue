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
</style>