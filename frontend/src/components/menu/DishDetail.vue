<template>
  <div class="dish-detail-container" v-if="dish">
    <div class="dish-image-container">
      <img :src="dish.imageUrl || '/img/placeholder-dish.jpg'" :alt="dish.name" class="dish-image">
    </div>
    <div class="dish-info">
      <h2 class="dish-name">{{ dish.name }}</h2>
      <p class="dish-description">{{ dish.description }}</p>
      <p class="dish-price">{{ formatPrice(dish.price) }}</p>

      <div class="quantity-selector">
        <button @click="decreaseQuantity" :disabled="quantity <= 1" class="quantity-btn">−</button>
        <span class="quantity">{{ quantity }}</span>
        <button @click="increaseQuantity" class="quantity-btn">+</button>
      </div>

      <div class="dish-options" v-if="dish.options && dish.options.length">
        <h3>{{ $t('common.options') }}</h3>
        <div v-for="optionGroup in dish.options" :key="optionGroup.id" class="option-group">
          <h4>{{ optionGroup.name }}</h4>
          <div v-for="option in optionGroup.items" :key="option.id" class="option-item">
            <input
              :type="optionGroup.multiple ? 'checkbox' : 'radio'"
              :name="optionGroup.id"
              :id="option.id"
              :value="option.id"
              v-model="selectedOptions[optionGroup.id]"
            >
            <label :for="option.id">
              {{ option.name }}
              <span v-if="option.price" class="option-price">(+{{ formatPrice(option.price) }})</span>
            </label>
          </div>
        </div>
      </div>

      <div class="dish-special-instructions">
        <h3>{{ $t('common.specialInstructions') }}</h3>
        <textarea
          v-model="specialInstructions"
          :placeholder="$t('restaurant.foodItem.instructionsPlaceholder')"
          class="special-instructions"
        ></textarea>
      </div>

      <button @click="addToCart" class="add-to-cart-btn">
        {{ $t('common.addToCart') }} - {{ formatPrice(calculateTotalPrice()) }}
      </button>
    </div>
  </div>
  <div v-else class="dish-detail-loading">
    {{ $t('common.loading') }}
  </div>
</template>

<script>
export default {
  name: 'DishDetail',
  props: {
    dishId: {
      type: [String, Number],
      required: true
    },
    restaurantId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      dish: null,
      quantity: 1,
      selectedOptions: {},
      specialInstructions: '',
      loading: false
    }
  },
  created() {
    this.fetchDishDetails();
  },
  methods: {
    fetchDishDetails() {
      this.loading = true;
      // Replace with actual API call to fetch dish details
      // Example: this.$store.dispatch('fetchDishById', { restaurantId: this.restaurantId, dishId: this.dishId })

      // Placeholder for demo purposes
      setTimeout(() => {
        this.dish = {
          id: this.dishId,
          name: 'Sample Dish',
          description: 'Delicious sample dish description with fresh ingredients.',
          price: 12.99,
          imageUrl: null,
          options: [
            {
              id: 'size',
              name: 'Size',
              multiple: false,
              items: [
                { id: 'small', name: 'Small', price: 0 },
                { id: 'medium', name: 'Medium', price: 2 },
                { id: 'large', name: 'Large', price: 4 }
              ]
            },
            {
              id: 'toppings',
              name: 'Toppings',
              multiple: true,
              items: [
                { id: 'cheese', name: 'Extra Cheese', price: 1.5 },
                { id: 'mushrooms', name: 'Mushrooms', price: 1 },
                { id: 'pepperoni', name: 'Pepperoni', price: 1.5 }
              ]
            }
          ]
        };
        this.loading = false;
        // Initialize selected options
        this.dish.options.forEach(group => {
          if (group.multiple) {
            this.selectedOptions[group.id] = [];
          } else {
            this.selectedOptions[group.id] = group.items[0].id;
          }
        });
      }, 500);
    },
    increaseQuantity() {
      this.quantity++;
    },
    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },
    formatPrice(price) {
      const locale = this.$i18n.locale;
      return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: locale === 'vi' ? 'VND' : 'USD'
      }).format(price);
    },
    calculateTotalPrice() {
      if (!this.dish) return 0;

      let total = this.dish.price * this.quantity;

      // Add option prices
      if (this.dish.options) {
        this.dish.options.forEach(group => {
          if (group.multiple) {
            // For checkboxes (multiple selection)
            const selectedIds = this.selectedOptions[group.id] || [];
            group.items
              .filter(item => selectedIds.includes(item.id))
              .forEach(item => {
                total += (item.price || 0) * this.quantity;
              });
          } else {
            // For radio buttons (single selection)
            const selectedId = this.selectedOptions[group.id];
            if (selectedId) {
              const selectedItem = group.items.find(item => item.id === selectedId);
              if (selectedItem) {
                total += (selectedItem.price || 0) * this.quantity;
              }
            }
          }
        });
      }

      return total;
    },
    addToCart() {
      const cartItem = {
        dishId: this.dish.id,
        name: this.dish.name,
        price: this.dish.price,
        quantity: this.quantity,
        selectedOptions: this.selectedOptions,
        specialInstructions: this.specialInstructions,
        totalPrice: this.calculateTotalPrice(),
        restaurantId: this.restaurantId
      };

      // Dispatch to store or emit to parent
      this.$emit('add-to-cart', cartItem);

      // You can also show a confirmation message
      this.$emit('close-dish-detail');
    }
  }
}
</script>

<style scoped>
.dish-detail-container {
  display: flex;
  flex-direction: column;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .dish-detail-container {
    flex-direction: row;
    gap: 30px;
  }
}

.dish-image-container {
  flex: 1;
  max-width: 400px;
}

.dish-image {
  width: 100%;
  height: auto;
  aspect-ratio: 4/3;
  object-fit: cover;
  border-radius: 8px;
}

.dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.dish-name {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
}

.dish-description {
  font-size: 16px;
  color: #666;
  margin: 10px 0;
}

.dish-price {
  font-size: 20px;
  font-weight: 600;
  color: #e74c3c;
  margin: 0;
}

.quantity-selector {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 15px 0;
}

.quantity-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid #ddd;
  background-color: #f8f8f8;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.quantity-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.quantity {
  font-size: 18px;
  font-weight: 600;
}

.dish-options {
  margin-top: 20px;
}

.option-group {
  margin-bottom: 15px;
}

.option-group h4 {
  margin: 10px 0;
  font-weight: 600;
}

.option-item {
  margin: 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-price {
  font-size: 14px;
  color: #e74c3c;
}

.dish-special-instructions {
  margin-top: 20px;
}

.special-instructions {
  width: 100%;
  min-height: 80px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  resize: vertical;
  font-family: inherit;
}

.add-to-cart-btn {
  margin-top: 20px;
  padding: 12px 20px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.add-to-cart-btn:hover {
  background-color: #c0392b;
}

.dish-detail-loading {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
}
</style>