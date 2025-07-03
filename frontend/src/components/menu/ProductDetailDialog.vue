<template>
  <v-dialog
    v-model="dialogVisible"
    max-width="700"
    scrollable
    @click:outside="closeDialog"
  >
    <v-card class="product-detail-card">
      <!-- Close button -->
      <div class="close-button">
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        ></v-btn>
      </div>
    
      <div class="product-detail-layout">
        <!-- Product Image -->
        <div class="product-image-container">
          <v-img
            :src="product.image_url || '/img/icons/food-placeholder.jpg'"
            :alt="product.name"
            cover
            class="product-image"
          ></v-img>
        </div>
        
        <!-- Product Information -->
        <v-card-item>
          <v-card-title class="text-h5">{{ product.name }}</v-card-title>
          <div class="d-flex align-center mb-2">
            <v-rating
              :model-value="product.rating || 0"
              color="amber"
              density="compact"
              half-increments
              readonly
              size="small"
            ></v-rating>
            <span class="ml-2 text-subtitle-2" v-if="product.rating">
              {{ product.rating.toFixed(1) }}
              <span class="text-caption text-grey">({{ product.review_count || 0 }})</span>
            </span>
          </div>
          <v-card-subtitle>{{ formatPrice(product.price) }}</v-card-subtitle>
          <v-card-text>
            <p class="text-body-1 mb-4">{{ product.description }}</p>
            
            <!-- Nutritional info button -->
            <v-btn
              v-if="product.nutritional_info"
              variant="text"
              prepend-icon="mdi-food-apple-outline"
              class="mb-4 px-0"
              @click="showNutritionalInfo = !showNutritionalInfo"
            >
              {{ showNutritionalInfo ? 'Hide' : 'Show' }} nutritional information
            </v-btn>
            
            <!-- Nutritional information -->
            <v-expand-transition>
              <v-card
                v-if="showNutritionalInfo && product.nutritional_info"
                variant="outlined"
                class="mb-4"
              >
                <v-card-text>
                  <div class="d-flex justify-space-between mb-1">
                    <span>Calories:</span>
                    <span>{{ product.nutritional_info.calories || 0 }} kcal</span>
                  </div>
                  <div class="d-flex justify-space-between mb-1">
                    <span>Protein:</span>
                    <span>{{ product.nutritional_info.protein || 0 }}g</span>
                  </div>
                  <div class="d-flex justify-space-between mb-1">
                    <span>Carbs:</span>
                    <span>{{ product.nutritional_info.carbs || 0 }}g</span>
                  </div>
                  <div class="d-flex justify-space-between mb-1">
                    <span>Fat:</span>
                    <span>{{ product.nutritional_info.fat || 0 }}g</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span>Sodium:</span>
                    <span>{{ product.nutritional_info.sodium || 0 }}mg</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-expand-transition>
            
            <!-- Diet & Allergen Tags -->
            <div v-if="product.tags && product.tags.length" class="mb-4">
              <v-chip-group>
                <v-chip
                  v-for="tag in product.tags"
                  :key="tag"
                  size="small"
                  color="primary"
                  variant="outlined"
                >
                  {{ tag }}
                </v-chip>
              </v-chip-group>
            </div>
            
            <!-- Divider -->
            <v-divider class="mb-4"></v-divider>
            
            <!-- Size Options -->
            <div v-if="product.size_options && product.size_options.length" class="mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Size</h3>
              <v-radio-group
                v-model="selectedOptions.size"
                mandatory
              >
                <v-radio
                  v-for="option in product.size_options"
                  :key="option.id"
                  :label="`${option.name} ${option.price_adjustment > 0 ? '(+' + formatPrice(option.price_adjustment) + ')' : ''}`"
                  :value="option.id"
                ></v-radio>
              </v-radio-group>
            </div>
            
            <!-- Additional Options -->
            <div v-if="product.options && product.options.length" class="mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Options</h3>
              <v-checkbox
                v-for="option in product.options"
                :key="option.id"
                v-model="selectedOptions.options"
                :label="`${option.name} ${option.price_adjustment > 0 ? '(+' + formatPrice(option.price_adjustment) + ')' : ''}`"
                :value="option.id"
              ></v-checkbox>
            </div>
            
            <!-- Special instructions -->
            <div class="mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Special instructions</h3>
              <v-textarea
                v-model="selectedOptions.instructions"
                variant="outlined"
                rows="2"
                placeholder="Any special requests? (e.g. allergies, spice level)"
                counter="255"
                maxlength="255"
              ></v-textarea>
            </div>
          </v-card-text>
          
          <!-- Add to cart controls -->
          <v-card-actions>
            <div class="d-flex w-100 justify-space-between align-center">
              <v-btn-group divided>
                <v-btn
                  icon="mdi-minus"
                  @click="decrementQuantity"
                  :disabled="selectedOptions.quantity <= 1"
                  density="compact"
                  variant="outlined"
                ></v-btn>
                <v-btn
                  variant="text"
                  class="px-4 quantity-display"
                  density="compact"
                  min-width="50"
                >
                  {{ selectedOptions.quantity }}
                </v-btn>
                <v-btn
                  icon="mdi-plus"
                  @click="incrementQuantity"
                  density="compact"
                  variant="outlined"
                ></v-btn>
              </v-btn-group>
              
              <v-btn
                color="primary"
                class="ml-4"
                size="large"
                prepend-icon="mdi-cart-outline"
                :loading="addingToCart"
                :disabled="!product.in_stock"
                @click="addToCart"
              >
                Add to cart - {{ formatPrice(calculateTotalPrice()) }}
              </v-btn>
            </div>
          </v-card-actions>
        </v-card-item>
      </div>

      <!-- Related products section -->
      <v-divider v-if="relatedProducts.length > 0" class="my-4"></v-divider>
      <v-card-item v-if="relatedProducts.length > 0">
        <v-card-title class="text-h6">You might also like</v-card-title>
        <v-sheet class="d-flex flex-nowrap overflow-x-auto py-2" elevation="0">
          <v-card
            v-for="relatedProduct in relatedProducts"
            :key="relatedProduct.id"
            class="ma-2 related-product-card"
            width="160"
            @click="selectRelatedProduct(relatedProduct)"
          >
            <v-img
              :src="relatedProduct.image_url || '/img/icons/food-placeholder.jpg'"
              height="100"
              cover
              class="related-product-image"
            ></v-img>
            <v-card-title class="px-2 py-1 text-subtitle-2 text-truncate">
              {{ relatedProduct.name }}
            </v-card-title>
            <v-card-subtitle class="px-2 py-1 text-caption">
              {{ formatPrice(relatedProduct.price) }}
            </v-card-subtitle>
          </v-card>
        </v-sheet>
      </v-card-item>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapActions } from 'vuex';
import { useToast } from '@/composables/useToast';

export default {
  name: 'ProductDetailDialog',
  
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    product: {
      type: Object,
      required: true
    },
    relatedProducts: {
      type: Array,
      default: () => []
    }
  },
  
  setup() {
    const { showSuccess, showError } = useToast();
    
    return {
      showSuccess,
      showError
    };
  },
  
  data() {
    return {
      dialogVisible: this.visible,
      selectedOptions: {
        size: null,
        options: [],
        instructions: '',
        quantity: 1
      },
      showNutritionalInfo: false,
      addingToCart: false
    };
  },
  
  watch: {
    visible(newVal) {
      this.dialogVisible = newVal;
    },
    
    dialogVisible(newVal) {
      this.$emit('update:visible', newVal);
      
      if (newVal) {
        // Initialize selected size to first option when dialog opens
        if (this.product.size_options && this.product.size_options.length > 0) {
          this.selectedOptions.size = this.product.size_options[0].id;
        }
      }
    },
    
    product: {
      handler(newProduct) {
        // Reset options when product changes
        this.selectedOptions = {
          size: null,
          options: [],
          instructions: '',
          quantity: 1
        };
        
        this.showNutritionalInfo = false;
        
        // Initialize selected size to first option
        if (newProduct.size_options && newProduct.size_options.length > 0) {
          this.selectedOptions.size = newProduct.size_options[0].id;
        }
      },
      deep: true
    }
  },
  
  methods: {
    ...mapActions({
      addToCartAction: 'cart/addToCart'
    }),
    
    closeDialog() {
      this.dialogVisible = false;
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price);
    },
    
    incrementQuantity() {
      this.selectedOptions.quantity += 1;
    },
    
    decrementQuantity() {
      if (this.selectedOptions.quantity > 1) {
        this.selectedOptions.quantity -= 1;
      }
    },
    
    calculateTotalPrice() {
      if (!this.product) return 0;
      
      let total = this.product.price;
      
      // Add size option price adjustment
      if (this.selectedOptions.size && this.product.size_options) {
        const selectedSize = this.product.size_options.find(
          option => option.id === this.selectedOptions.size
        );
        
        if (selectedSize) {
          total += selectedSize.price_adjustment;
        }
      }
      
      // Add additional options price adjustments
      if (this.selectedOptions.options.length > 0 && this.product.options) {
        this.selectedOptions.options.forEach(optionId => {
          const selectedOption = this.product.options.find(
            option => option.id === optionId
          );
          
          if (selectedOption) {
            total += selectedOption.price_adjustment;
          }
        });
      }
      
      // Multiply by quantity
      total *= this.selectedOptions.quantity;
      
      return total;
    },
    
    async addToCart() {
      if (!this.product.in_stock) {
        this.showError('This item is currently not available');
        return;
      }
      
      this.addingToCart = true;
      
      try {
        // Prepare selected options
        const options = [];
        
        // Add size option
        if (this.selectedOptions.size && this.product.size_options) {
          const selectedSize = this.product.size_options.find(
            option => option.id === this.selectedOptions.size
          );
          
          if (selectedSize) {
            options.push(selectedSize);
          }
        }
        
        // Add additional options
        if (this.selectedOptions.options.length > 0 && this.product.options) {
          this.selectedOptions.options.forEach(optionId => {
            const selectedOption = this.product.options.find(
              option => option.id === optionId
            );
            
            if (selectedOption) {
              options.push(selectedOption);
            }
          });
        }
        
        // Build payload expected by cart/addToCart
        await this.addToCartAction({
          productId: this.product.id,
          name: this.product.name,
          price: this.product.price,
          image: this.product.image_url,
          restaurantId: this.product.restaurant_id,
          restaurantName: this.product.restaurant_name,
          quantity: this.selectedOptions.quantity,
          options,
          notes: this.selectedOptions.instructions
        });
        
        this.showSuccess(`${this.product.name} added to cart`);
        this.closeDialog();
      } catch (error) {
        this.showError('Failed to add item to cart. Please try again.');
        console.error('Error adding to cart:', error);
      } finally {
        this.addingToCart = false;
      }
    },
    
    selectRelatedProduct(product) {
      // Emit event to parent to change the current product
      this.$emit('select-product', product);
    }
  }
};
</script>

<style scoped>
.product-detail-card {
  position: relative;
  overflow: hidden;
}

.close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.product-image-container {
  height: 250px;
  width: 100%;
  overflow: hidden;
}

.product-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.quantity-display {
  user-select: none;
}

.related-product-card {
  transition: transform 0.2s;
  cursor: pointer;
}

.related-product-card:hover {
  transform: translateY(-3px);
}

@media (min-width: 600px) {
  .product-detail-layout {
    display: grid;
    grid-template-columns: 40% 60%;
  }
  
  .product-image-container {
    height: 100%;
  }
}
</style>