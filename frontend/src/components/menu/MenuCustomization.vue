<template>
  <div class="menu-customization">
    <v-card>
      <v-img
        v-if="item.image"
        :src="item.image"
        height="200"
        cover
        class="product-image"
      ></v-img>
      
      <v-card-title class="text-h5 font-weight-bold">{{ item.name }}</v-card-title>
      
      <v-card-text>
        <p class="mb-4 text-body-1">{{ item.description }}</p>
        
        <!-- Size selection -->
        <div v-if="item.sizes && item.sizes.length > 0" class="mb-6">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Select Size</h3>
          <v-radio-group v-model="selectedSize" class="mt-0">
            <v-radio
              v-for="size in item.sizes"
              :key="size.id"
              :label="`${size.name} ${size.priceAdjustment > 0 ? '(+$' + size.priceAdjustment.toFixed(2) + ')' : ''}`"
              :value="size"
              color="primary"
              hide-details
            ></v-radio>
          </v-radio-group>
        </div>
        
        <!-- Ingredient customization -->
        <div v-if="item.ingredients && item.ingredients.length > 0" class="mb-6">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Customize Ingredients</h3>
          <v-checkbox
            v-for="ingredient in item.ingredients"
            :key="ingredient"
            v-model="selectedIngredients"
            :label="ingredient"
            :value="ingredient"
            color="primary"
            hide-details
            density="compact"
            class="my-1"
          ></v-checkbox>
        </div>
        
        <!-- Toppings -->
        <div v-if="item.toppings && item.toppings.length > 0" class="mb-6">
          <h3 class="text-subtitle-1 font-weight-bold d-flex align-center mb-2">
            Add Toppings
            <v-chip v-if="maxToppingsAllowed" size="small" class="ml-2" color="primary" variant="outlined">
              Up to {{ maxToppingsAllowed }}
            </v-chip>
          </h3>
          
          <v-row>
            <v-col
              v-for="topping in item.toppings"
              :key="topping.id"
              cols="12"
              sm="6"
            >
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div>{{ topping.name }} <span class="text-caption text-medium-emphasis">+${{ topping.price.toFixed(2) }}</span></div>
                </div>
                <v-btn-toggle 
                  v-model="toppingQuantities[topping.id]" 
                  density="comfortable" 
                  color="primary" 
                  mandatory
                  class="topping-quantity"
                >
                  <v-btn :value="0">0</v-btn>
                  <v-btn 
                    v-for="n in Math.min(topping.maxQuantity || 3, 3)" 
                    :key="n" 
                    :value="n"
                    :disabled="isToppingDisabled(topping, n)"
                  >
                    {{ n }}
                  </v-btn>
                </v-btn-toggle>
              </div>
            </v-col>
          </v-row>
        </div>
        
        <!-- Extra options -->
        <div v-if="item.extras && item.extras.length > 0" class="mb-6">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Extras</h3>
          <v-checkbox
            v-for="extra in item.extras"
            :key="extra.id"
            v-model="selectedExtras"
            :label="`${extra.name} (+$${extra.price.toFixed(2)})`"
            :value="extra"
            color="primary"
            hide-details
            density="compact"
            class="my-1"
          ></v-checkbox>
        </div>
        
        <!-- Special instructions -->
        <div class="mb-4">
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Special Instructions</h3>
          <v-textarea
            v-model="specialInstructions"
            placeholder="Add any special requests (e.g., no onions, extra spicy, etc.)"
            rows="2"
            auto-grow
            variant="outlined"
            hide-details
          ></v-textarea>
        </div>
        
        <!-- Quantity and Price -->
        <div class="d-flex align-center justify-space-between my-4">
          <div class="quantity-control">
            <v-btn
              icon="mdi-minus"
              density="comfortable"
              variant="outlined"
              :disabled="quantity <= 1"
              @click="quantity--"
            ></v-btn>
            <span class="mx-4 text-h6">{{ quantity }}</span>
            <v-btn
              icon="mdi-plus"
              density="comfortable"
              variant="outlined"
              @click="quantity++"
            ></v-btn>
          </div>
          <div class="text-h5 font-weight-bold">${{ totalPrice.toFixed(2) }}</div>
        </div>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-4">
        <v-btn
          color="secondary"
          variant="outlined"
          @click="$emit('cancelled')"
        >
          Cancel
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          size="large"
          @click="addToCart"
          :loading="isAddingToCart"
        >
          Add to Cart • ${{ totalPrice.toFixed(2) }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from '@/composables/useToast';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  ingredients?: string[];
  sizes?: Array<{
    id: string;
    name: string;
    priceAdjustment: number;
  }>;
  toppings?: Array<{
    id: string;
    name: string;
    price: number;
    maxQuantity: number;
  }>;
  extras?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
}

interface CartCustomizations {
  size?: {
    id: string;
    name: string;
    priceAdjustment: number;
  };
  ingredients?: string[];
  toppings?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  extras?: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  specialInstructions?: string;
}

export default defineComponent({
  name: 'MenuCustomization',

  props: {
    item: {
      type: Object as () => MenuItem,
      required: true,
      validator: (item: MenuItem) => {
        return Boolean(item.id && item.name && typeof item.price === 'number')
      }
    },
    cartItemId: {
      type: String,
      default: null
    }
  },

  emits: ['added-to-cart', 'cancelled'],

  setup(props, { emit }) {
    const store = useStore();
    const { showToast } = useToast();

    // State
    const quantity = ref(1);
    const selectedSize = ref(props.item.sizes?.[0] || null);
    const selectedIngredients = ref(props.item.ingredients || []);
    const selectedExtras = ref<any[]>([]);
    const specialInstructions = ref('');
    const isAddingToCart = ref(false);
    
    // Track topping quantities with a reactive object
    const toppingQuantities = ref<Record<string, number>>({});
    const maxToppingsAllowed = ref(props.item.maxToppings || null);
    
    // Initialize topping quantities to 0
    onMounted(() => {
      if (props.item.toppings) {
        props.item.toppings.forEach(topping => {
          toppingQuantities.value[topping.id] = 0;
        });
      }
      
      // If editing existing cart item, pre-fill the form
      if (props.cartItemId) {
        loadCartItemData();
      }
    });
    
    // Load existing cart item data if editing
    const loadCartItemData = async () => {
      try {
        const cartItem = await store.dispatch('cart/getCartItem', props.cartItemId);
        if (cartItem) {
          // Set quantity
          quantity.value = cartItem.quantity;
          
          // Set options based on saved customizations
          if (cartItem.options) {
            // Set size
            if (cartItem.options.size && props.item.sizes) {
              selectedSize.value = props.item.sizes.find(s => s.id === cartItem.options.size.id) || props.item.sizes[0];
            }
            
            // Set ingredients
            if (cartItem.options.ingredients) {
              selectedIngredients.value = cartItem.options.ingredients;
            }
            
            // Set toppings
            if (cartItem.options.toppings && props.item.toppings) {
              cartItem.options.toppings.forEach((topping: any) => {
                toppingQuantities.value[topping.id] = topping.quantity;
              });
            }
            
            // Set extras
            if (cartItem.options.extras && props.item.extras) {
              selectedExtras.value = cartItem.options.extras.map((extra: any) => {
                return props.item.extras?.find(e => e.id === extra.id) || null;
              }).filter(Boolean);
            }
            
            // Set special instructions
            if (cartItem.options.specialInstructions) {
              specialInstructions.value = cartItem.options.specialInstructions;
            }
          }
        }
      } catch (error) {
        console.error('Failed to load cart item data:', error);
      }
    };
    
    // Check if topping selection should be disabled (based on max toppings allowed)
    const isToppingDisabled = (topping: any, quantity: number) => {
      if (quantity === 0) return false;
      
      if (maxToppingsAllowed.value) {
        const currentToppingsCount = Object.values(toppingQuantities.value).reduce((sum: number, qty: number) => sum + (qty > 0 ? 1 : 0), 0);
        const thisItemSelected = toppingQuantities.value[topping.id] > 0;
        
        // Disable if would exceed max toppings
        if (!thisItemSelected && currentToppingsCount >= maxToppingsAllowed.value) {
          return true;
        }
      }
      
      return false;
    };

    // Calculate the total price
    const totalPrice = computed(() => {
      let price = props.item.price;
      
      // Add size price adjustment
      if (selectedSize.value) {
        price += selectedSize.value.priceAdjustment;
      }
      
      // Add toppings price
      if (props.item.toppings) {
        props.item.toppings.forEach(topping => {
          const qty = toppingQuantities.value[topping.id] || 0;
          price += topping.price * qty;
        });
      }
      
      // Add extras price
      selectedExtras.value.forEach(extra => {
        price += extra.price;
      });
      
      return price * quantity.value;
    });

    // Add to cart function
    const addToCart = async () => {
      try {
        isAddingToCart.value = true;
        
        // Create customizations object for the cart
        const customizations: CartCustomizations = {};
        
        // Add size if available
        if (selectedSize.value) {
          customizations.size = {
            id: selectedSize.value.id,
            name: selectedSize.value.name,
            priceAdjustment: selectedSize.value.priceAdjustment
          };
        }
        
        // Add ingredients if modified
        if (selectedIngredients.value.length !== props.item.ingredients?.length) {
          customizations.ingredients = selectedIngredients.value;
        }
        
        // Add selected toppings
        const selectedToppings = [];
        if (props.item.toppings) {
          for (const topping of props.item.toppings) {
            const qty = toppingQuantities.value[topping.id] || 0;
            if (qty > 0) {
              selectedToppings.push({
                id: topping.id,
                name: topping.name,
                price: topping.price,
                quantity: qty
              });
            }
          }
          
          if (selectedToppings.length > 0) {
            customizations.toppings = selectedToppings;
          }
        }
        
        // Add selected extras
        if (selectedExtras.value.length > 0) {
          customizations.extras = selectedExtras.value.map(extra => ({
            id: extra.id,
            name: extra.name,
            price: extra.price
          }));
        }
        
        // Add special instructions if provided
        if (specialInstructions.value.trim()) {
          customizations.specialInstructions = specialInstructions.value.trim();
        }
        
        // Prepare the payload for the cart
        const payload = {
          productId: props.item.id,
          quantity: quantity.value,
          options: Object.keys(customizations).length > 0 ? customizations : undefined,
          notes: specialInstructions.value.trim() || undefined
        };
        
        // If editing existing cart item, update it; otherwise add new item
        if (props.cartItemId) {
          await store.dispatch('cart/updateCartItem', {
            id: props.cartItemId,
            ...payload
          });
          showToast('Cart item updated successfully', 'success');
        } else {
          await store.dispatch('cart/addToCart', payload);
          showToast(`${props.item.name} added to cart`, 'success');
        }
        
        // Emit event
        emit('added-to-cart');
      } catch (error) {
        console.error('Failed to add item to cart:', error);
        showToast('Failed to add item to cart. Please try again.', 'error');
      } finally {
        isAddingToCart.value = false;
      }
    };

    return {
      quantity,
      selectedSize,
      selectedIngredients,
      selectedExtras,
      specialInstructions,
      toppingQuantities,
      totalPrice,
      isAddingToCart,
      maxToppingsAllowed,
      isToppingDisabled,
      addToCart
    };
  }
});
</script>

<style scoped>
.menu-customization {
  max-width: 800px;
  margin: 0 auto;
}

.product-image {
  object-fit: cover;
  width: 100%;
}

.topping-quantity {
  height: 36px;
}

.topping-quantity :deep(.v-btn) {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
}
</style>