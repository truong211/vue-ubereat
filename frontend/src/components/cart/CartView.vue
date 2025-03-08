<template>
  <div class="cart-view">
    <v-container>
      <h1 class="text-h4 font-weight-bold mb-6">Your Cart</h1>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        <p class="mt-4">Loading your cart...</p>
      </div>

      <!-- Empty Cart -->
      <div v-else-if="cartItems.length === 0" class="empty-cart-container text-center py-12">
        <v-icon size="100" color="grey">mdi-cart-outline</v-icon>
        <h2 class="text-h5 mt-6 mb-2">Your cart is empty</h2>
        <p class="text-body-1 mb-8">Add items from restaurants to start your order</p>
        <v-btn
          color="primary"
          size="large"
          to="/restaurants"
          prepend-icon="mdi-food"
        >
          Browse Restaurants
        </v-btn>
      </div>

      <!-- Cart Content -->
      <div v-else>
        <v-row>
          <!-- Cart Items -->
          <v-col cols="12" md="8">
            <v-card class="mb-4">
              <v-card-title class="d-flex justify-space-between align-center">
                <span>
                  {{ restaurantName ? `Order from ${restaurantName}` : 'Your Items' }}
                  <span class="text-subtitle-1 ml-2">({{ totalItems }} items)</span>
                </span>
                <v-btn
                  variant="text"
                  color="error"
                  density="comfortable"
                  prepend-icon="mdi-delete"
                  @click="confirmClearCart"
                >
                  Clear Cart
                </v-btn>
              </v-card-title>
              
              <v-divider></v-divider>
              
              <v-card-text class="pa-0">
                <v-list>
                  <v-list-item
                    v-for="(item, index) in cartItems"
                    :key="item.id || index"
                    class="cart-item py-4"
                  >
                    <template v-slot:prepend>
                      <v-img
                        v-if="item.image"
                        :src="item.image"
                        width="80"
                        height="80"
                        cover
                        class="rounded mr-4"
                      ></v-img>
                      <v-avatar v-else color="grey-lighten-2" size="80" class="mr-4">
                        <v-icon size="40" color="grey">mdi-food</v-icon>
                      </v-avatar>
                    </template>
                    
                    <v-list-item-title class="text-subtitle-1 font-weight-bold mb-1">
                      {{ item.name }}
                    </v-list-item-title>
                    
                    <v-list-item-subtitle v-if="item.description" class="mb-2">
                      {{ item.description }}
                    </v-list-item-subtitle>
                    
                    <!-- Item Options -->
                    <div v-if="item.options && item.options.length" class="options-list mt-1 mb-2">
                      <div
                        v-for="(option, optIndex) in item.options"
                        :key="optIndex"
                        class="text-caption d-flex justify-space-between"
                      >
                        <span>+ {{ option.name }}</span>
                        <span v-if="option.price > 0" class="ml-auto">
                          ${{ option.price.toFixed(2) }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Item Actions -->
                    <div class="d-flex justify-space-between align-center mt-2">
                      <div class="d-flex align-center">
                        <v-btn
                          icon="mdi-minus"
                          variant="outlined"
                          density="comfortable"
                          size="small"
                          color="primary"
                          @click="decreaseQuantity(index)"
                          :disabled="item.quantity <= 1"
                        ></v-btn>
                        <v-text-field
                          v-model.number="item.quantity"
                          type="number"
                          density="compact"
                          hide-details
                          class="quantity-input mx-2"
                          min="1"
                          :max="99"
                          @change="onQuantityChange(index, $event)"
                          style="width: 50px"
                        ></v-text-field>
                        <v-btn
                          icon="mdi-plus"
                          variant="outlined"
                          density="comfortable"
                          size="small"
                          color="primary"
                          @click="increaseQuantity(index)"
                          :disabled="item.quantity >= 99"
                        ></v-btn>
                      </div>
                      
                      <div class="d-flex align-center">
                        <div class="text-subtitle-1 font-weight-medium mr-4">
                          ${{ (item.price * item.quantity).toFixed(2) }}
                        </div>
                        <v-btn
                          icon="mdi-pencil"
                          variant="text"
                          density="comfortable"
                          size="small"
                          class="mr-2"
                          color="primary"
                          @click="editItem(item, index)"
                        >
                          <v-tooltip activator="parent" location="top">Edit Item</v-tooltip>
                        </v-btn>
                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          density="comfortable"
                          size="small"
                          color="error"
                          @click="removeItem(index)"
                        >
                          <v-tooltip activator="parent" location="top">Remove Item</v-tooltip>
                        </v-btn>
                      </div>
                    </div>
                    
                    <template v-slot:append>
                      <div class="text-right">
                        
                      </div>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Order Summary -->
          <v-col cols="12" md="4">
            <v-card class="order-summary">
              <v-card-title>Order Summary</v-card-title>
              <v-divider></v-divider>
              <v-card-text>
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-1">Subtotal</span>
                  <span class="text-body-1">${{ subtotal.toFixed(2) }}</span>
                </div>
                
                <div v-if="deliveryFee > 0" class="d-flex justify-space-between mb-2">
                  <span class="text-body-1">Delivery Fee</span>
                  <span class="text-body-1">${{ deliveryFee.toFixed(2) }}</span>
                </div>
                
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-1">Tax ({{ (taxRate * 100).toFixed(0) }}%)</span>
                  <span class="text-body-1">${{ tax.toFixed(2) }}</span>
                </div>
                
                <div v-if="discount > 0" class="d-flex justify-space-between mb-2">
                  <span class="text-success">Discount</span>
                  <span class="text-success">-${{ discount.toFixed(2) }}</span>
                </div>
                
                <v-divider class="my-3"></v-divider>
                
                <div class="d-flex justify-space-between mb-4">
                  <span class="text-h6 font-weight-bold">Total</span>
                  <span class="text-h6 font-weight-bold">${{ total.toFixed(2) }}</span>
                </div>
                
                <!-- Promo Code -->
                <v-text-field
                  v-model="promoCode"
                  label="Promo Code"
                  variant="outlined"
                  density="compact"
                  append-inner-icon="mdi-check"
                  @click:append-inner="applyPromoCode"
                  class="mb-4"
                ></v-text-field>
                
                <!-- Checkout Button -->
                <v-btn
                  color="primary"
                  size="large"
                  block
                  :to="'/checkout'"
                  :disabled="cartItems.length === 0"
                  class="mt-2"
                >
                  Proceed to Checkout
                </v-btn>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
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
      
      <!-- Edit Item Dialog -->
      <v-dialog v-model="showEditDialog" max-width="500">
        <v-card v-if="editingItem">
          <v-card-title class="text-h6">Edit Item</v-card-title>
          <v-card-text>
            <h3 class="text-subtitle-1 font-weight-bold mb-2">{{ editingItem.name }}</h3>
            
            <v-divider class="mb-4"></v-divider>
            
            <!-- Options -->
            <div v-if="editingItem.availableOptions && editingItem.availableOptions.length">
              <h4 class="text-subtitle-2 font-weight-medium mb-2">Options</h4>
              <v-checkbox
                v-for="(option, index) in editingItem.availableOptions"
                :key="index"
                v-model="selectedOptions"
                :label="`${option.name} ${option.price > 0 ? '(+$' + option.price.toFixed(2) + ')' : ''}`"
                :value="option"
                hide-details
                class="mb-2"
              ></v-checkbox>
            </div>
            
            <!-- Special Instructions -->
            <h4 class="text-subtitle-2 font-weight-medium mt-4 mb-2">Special Instructions</h4>
            <v-textarea
              v-model="specialInstructions"
              variant="outlined"
              density="compact"
              rows="2"
              placeholder="Any special requests?"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" @click="showEditDialog = false">Cancel</v-btn>
            <v-btn color="primary" @click="saveItemChanges">Save Changes</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'CartView',
  
  setup() {
    const store = useStore()
    const isLoading = ref(false)
    const showClearCartDialog = ref(false)
    const showEditDialog = ref(false)
    const editingItem = ref(null)
    const editingItemIndex = ref(-1)
    const selectedOptions = ref([])
    const specialInstructions = ref('')
    const promoCode = ref('')
    
    // Cart data
    const cartItems = computed(() => store.getters['cart/cartItems'])
    const restaurantName = computed(() => store.state.cart.restaurantName || '')
    const deliveryFee = computed(() => store.state.cart.deliveryFee || 0)
    const taxRate = ref(0.1) // 10%
    const discount = ref(0)
    
    // Computed properties
    const totalItems = computed(() => 
      cartItems.value.reduce((total, item) => total + item.quantity, 0)
    )
    
    const subtotal = computed(() => {
      return cartItems.value.reduce((total, item) => {
        const itemTotal = item.price * item.quantity
        const optionsTotal = item.options?.reduce(
          (sum, opt) => sum + (opt.price || 0), 0
        ) || 0
        return total + itemTotal + (optionsTotal * item.quantity)
      }, 0)
    })
    
    const tax = computed(() => subtotal.value * taxRate.value)
    
    const total = computed(() => 
      subtotal.value + deliveryFee.value + tax.value - discount.value
    )
    
    // Methods
    const loadCart = async () => {
      isLoading.value = true
      try {
        await store.dispatch('cart/initializeCart')
      } catch (error) {
        console.error('Error loading cart:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    const increaseQuantity = (index) => {
      const item = cartItems.value[index]
      if (item.quantity < 99) {
        updateItemQuantity(item.id, item.quantity + 1)
      }
    }
    
    const decreaseQuantity = (index) => {
      const item = cartItems.value[index]
      if (item.quantity > 1) {
        updateItemQuantity(item.id, item.quantity - 1)
      }
    }
    
    const onQuantityChange = (index, event) => {
      const value = parseInt(event.target.value)
      const item = cartItems.value[index]
      
      if (isNaN(value) || value < 1) {
        updateItemQuantity(item.id, 1)
      } else if (value > 99) {
        updateItemQuantity(item.id, 99)
      } else {
        updateItemQuantity(item.id, value)
      }
    }
    
    const updateItemQuantity = (itemId, quantity) => {
      store.commit('cart/updateItemQuantity', { itemId, quantity })
      store.dispatch('cart/saveCart')
    }
    
    const removeItem = (index) => {
      const item = cartItems.value[index]
      store.commit('cart/updateItemQuantity', { itemId: item.id, quantity: 0 })
      store.dispatch('cart/saveCart')
    }
    
    const confirmClearCart = () => {
      showClearCartDialog.value = true
    }
    
    const clearCart = () => {
      store.commit('cart/clearCart')
      store.dispatch('cart/saveCart')
      showClearCartDialog.value = false
    }
    
    const editItem = (item, index) => {
      editingItem.value = { ...item }
      editingItemIndex.value = index
      selectedOptions.value = [...(item.options || [])]
      specialInstructions.value = item.specialInstructions || ''
      showEditDialog.value = true
    }
    
    const saveItemChanges = () => {
      if (editingItem.value && editingItemIndex.value >= 0) {
        const itemId = editingItem.value.id
        
        // Update options
        store.commit('cart/updateItemOptions', { 
          itemId, 
          options: selectedOptions.value 
        })
        
        // Update special instructions
        store.commit('cart/updateSpecialInstructions', { 
          itemId, 
          instructions: specialInstructions.value 
        })
        
        // Save changes to localStorage
        store.dispatch('cart/saveCart')
        
        // Close dialog
        showEditDialog.value = false
      }
    }
    
    const applyPromoCode = () => {
      if (promoCode.value.toUpperCase() === 'SAVE10') {
        discount.value = 10
      } else {
        discount.value = 0
      }
    }
    
    // Load cart on component mount
    onMounted(() => {
      loadCart()
    })
    
    return {
      isLoading,
      cartItems,
      restaurantName,
      deliveryFee,
      taxRate,
      discount,
      totalItems,
      subtotal,
      tax,
      total,
      showClearCartDialog,
      showEditDialog,
      editingItem,
      selectedOptions,
      specialInstructions,
      promoCode,
      increaseQuantity,
      decreaseQuantity,
      onQuantityChange,
      removeItem,
      confirmClearCart,
      clearCart,
      editItem,
      saveItemChanges,
      applyPromoCode
    }
  }
}
</script>

<style scoped>
.cart-view {
  min-height: 80vh;
}

.cart-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.cart-item:last-child {
  border-bottom: none;
}

.quantity-input :deep(input) {
  text-align: center;
}

.order-summary {
  position: sticky;
  top: 24px;
}
</style>
