<template>
  <v-card class="order-summary">
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Order Summary</span>
      <v-chip v-if="itemCount" size="small" color="primary">{{ itemCount }} items</v-chip>
    </v-card-title>
    
    <v-divider></v-divider>
    
    <v-card-text v-if="loading" class="text-center py-6">
      <v-progress-circular indeterminate color="primary" size="32"></v-progress-circular>
      <div class="mt-2">Calculating...</div>
    </v-card-text>
    
    <template v-else>
      <!-- Empty Cart -->
      <v-card-text v-if="!items || items.length === 0" class="text-center py-6">
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-cart-outline</v-icon>
        <p class="text-body-1 mb-2">Your cart is empty</p>
        <p class="text-caption text-grey">Add some items to place an order</p>
      </v-card-text>
      
      <!-- Order Items List -->
      <div v-else>
        <div class="order-items px-4 py-2">
          <div
            v-for="(item, index) in items"
            :key="index"
            class="order-item d-flex align-start py-2"
          >
            <div class="flex-grow-1">
              <div class="d-flex align-center">
                <span class="text-body-1">{{ item.quantity }} × </span>
                <span class="text-body-1 font-weight-medium ml-2">{{ item.name }}</span>
              </div>
              
              <div v-if="item.options && item.options.length > 0" class="mt-1">
                <div
                  v-for="(option, optionIndex) in item.options"
                  :key="optionIndex"
                  class="text-caption text-grey-darken-1 ml-5"
                >
                  {{ option.name }}: {{ option.value }}
                </div>
              </div>
              
              <div v-if="item.notes" class="text-caption font-italic text-grey-darken-1 ml-5 mt-1">
                {{ item.notes }}
              </div>
            </div>
            
            <div class="text-body-1 text-right ml-4">${{ formatPrice(item.price * item.quantity) }}</div>
          </div>
        </div>
        
        <v-divider></v-divider>
        
        <!-- Minimum Order Warning -->
        <div 
          v-if="subtotal < minOrderAmount" 
          class="px-4 py-2 bg-warning-lighten-5"
        >
          <div class="d-flex align-center">
            <v-icon color="warning" class="mr-2">mdi-alert-circle</v-icon>
            <div>
              <div class="text-warning text-body-2">Minimum order amount not met</div>
              <div class="text-caption">
                Add ${{ formatPrice(minOrderAmount - subtotal) }} more to place your order
              </div>
            </div>
          </div>
        </div>
        
        <!-- Cost Breakdown -->
        <div class="cost-breakdown px-4 py-2">
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Subtotal</span>
            <span class="text-body-2">${{ formatPrice(subtotal) }}</span>
          </div>
          
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Delivery Fee</span>
            <span class="text-body-2" :class="{ 'text-success': deliveryFee === 0 }">
              {{ deliveryFee === 0 ? 'Free' : '$' + formatPrice(deliveryFee) }}
            </span>
          </div>
          
          <div class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Tax</span>
            <span class="text-body-2">${{ formatPrice(tax) }}</span>
          </div>
          
          <div v-if="tip > 0" class="d-flex justify-space-between mb-2">
            <span class="text-body-2">Driver Tip</span>
            <span class="text-body-2">${{ formatPrice(tip) }}</span>
          </div>
          
          <div v-if="discount > 0" class="d-flex justify-space-between mb-2">
            <span class="text-body-2 text-success">Discount</span>
            <span class="text-body-2 text-success">-${{ formatPrice(discount) }}</span>
          </div>
          
          <div v-if="promoCode" class="d-flex justify-space-between mb-2 text-success">
            <span class="text-body-2">
              Promo Code: {{ promoCode }}
              <v-btn
                density="compact"
                size="small"
                variant="text"
                icon="mdi-close"
                color="error"
                @click="removePromo"
              ></v-btn>
            </span>
            <span class="text-body-2">-${{ formatPrice(promoDiscount) }}</span>
          </div>
          
          <v-divider class="my-2"></v-divider>
          
          <div class="d-flex justify-space-between mt-2 font-weight-bold">
            <span class="text-subtitle-1">Total</span>
            <span class="text-subtitle-1">${{ formatPrice(total) }}</span>
          </div>
        </div>
        
        <!-- Promo Code Input -->
        <div v-if="showPromoCodeInput" class="px-4 py-2">
          <div v-if="!promoCode" class="d-flex align-center">
            <v-text-field
              v-model="promoInput"
              label="Promo Code"
              placeholder="Enter promo code"
              variant="outlined"
              density="compact"
              hide-details
              :error="promoError !== null"
              :disabled="applyingPromo"
              class="mr-2"
            ></v-text-field>
            <v-btn 
              color="primary" 
              variant="text" 
              :loading="applyingPromo" 
              :disabled="!promoInput || applyingPromo"
              @click="applyPromoCode"
            >
              Apply
            </v-btn>
          </div>
          <div v-if="promoError" class="text-caption text-error mt-1">{{ promoError }}</div>
        </div>
        
        <!-- Fulfillment Time Estimate -->
        <div v-if="estimatedTime" class="px-4 py-2 bg-grey-lighten-4">
          <div class="d-flex align-center">
            <v-icon color="primary" class="mr-2">mdi-clock-outline</v-icon>
            <span class="text-body-2">Estimated delivery time: {{ estimatedTime }} min</span>
          </div>
        </div>
        
        <!-- Delivery Instructions -->
        <div v-if="showDeliveryInstructions" class="px-4 py-2">
          <v-text-field
            v-model="specialInstructions"
            label="Delivery Instructions (optional)"
            placeholder="E.g., 'Please leave at door', 'Ring doorbell', etc."
            variant="outlined"
            density="compact"
            hint="Special instructions for the delivery driver"
            @input="updateInstructions"
          ></v-text-field>
        </div>
        
        <!-- Action Button -->
        <v-card-actions v-if="showActions">
          <v-btn
            block
            color="primary"
            size="large"
            :disabled="isButtonDisabled || loading"
            :loading="processing"
            @click="placeOrder"
          >
            {{ actionButtonText }}
          </v-btn>
        </v-card-actions>
      </div>
    </template>
  </v-card>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'OrderSummary',
  
  props: {
    items: {
      type: Array,
      default: () => []
    },
    restaurantId: {
      type: [String, Number],
      default: null
    },
    minOrderAmount: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    taxRate: {
      type: Number,
      default: 0.08 // Default 8% tax
    },
    discount: {
      type: Number,
      default: 0
    },
    promoDiscount: {
      type: Number,
      default: 0
    },
    promoCode: {
      type: String,
      default: ''
    },
    tip: {
      type: Number,
      default: 0
    },
    estimatedTime: {
      type: [String, Number],
      default: null
    },
    showPromoCodeInput: {
      type: Boolean,
      default: true
    },
    showDeliveryInstructions: {
      type: Boolean,
      default: true
    },
    showActions: {
      type: Boolean,
      default: true
    },
    actionButtonText: {
      type: String,
      default: 'Place Order'
    },
    loading: {
      type: Boolean,
      default: false
    },
    processing: {
      type: Boolean,
      default: false
    }
  },
  
  emits: [
    'apply-promo',
    'remove-promo',
    'update-instructions',
    'place-order'
  ],
  
  setup(props, { emit }) {
    // Local state
    const promoInput = ref('');
    const promoError = ref(null);
    const applyingPromo = ref(false);
    const specialInstructions = ref('');
    
    // Computed properties
    const itemCount = computed(() => {
      return props.items.reduce((count, item) => count + item.quantity, 0);
    });
    
    const subtotal = computed(() => {
      return props.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    });
    
    const tax = computed(() => {
      return subtotal.value * props.taxRate;
    });
    
    const total = computed(() => {
      return subtotal.value + props.deliveryFee + tax.value + props.tip - props.discount - props.promoDiscount;
    });
    
    const isButtonDisabled = computed(() => {
      // Check if subtotal is less than minimum order amount
      if (subtotal.value < props.minOrderAmount) {
        return true;
      }
      
      // Check if cart is empty
      if (!props.items || props.items.length === 0) {
        return true;
      }
      
      return false;
    });
    
    // Methods
    const formatPrice = (price) => {
      return price.toFixed(2);
    };
    
    const applyPromoCode = async () => {
      if (!promoInput.value) return;
      
      applyingPromo.value = true;
      promoError.value = null;
      
      try {
        emit('apply-promo', promoInput.value);
        promoInput.value = ''; // Clear input on success
      } catch (error) {
        promoError.value = error.message || 'Invalid promo code';
      } finally {
        applyingPromo.value = false;
      }
    };
    
    const removePromo = () => {
      emit('remove-promo');
      promoInput.value = '';
      promoError.value = null;
    };
    
    const updateInstructions = () => {
      emit('update-instructions', specialInstructions.value);
    };
    
    const placeOrder = () => {
      if (isButtonDisabled.value) return;
      
      emit('place-order', {
        items: props.items,
        subtotal: subtotal.value,
        deliveryFee: props.deliveryFee,
        tax: tax.value,
        tip: props.tip,
        total: total.value,
        specialInstructions: specialInstructions.value,
        promoCode: props.promoCode
      });
    };
    
    return {
      promoInput,
      promoError,
      applyingPromo,
      specialInstructions,
      itemCount,
      subtotal,
      tax,
      total,
      isButtonDisabled,
      
      formatPrice,
      applyPromoCode,
      removePromo,
      updateInstructions,
      placeOrder
    };
  }
};
</script>

<style scoped>
.order-summary {
  border-radius: 8px;
  overflow: hidden;
}

.order-items {
  max-height: 300px;
  overflow-y: auto;
}

.order-item {
  border-bottom: 1px dashed rgba(0, 0, 0, 0.06);
}

.order-item:last-child {
  border-bottom: none;
}
</style>