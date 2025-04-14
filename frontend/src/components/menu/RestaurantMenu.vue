<template>
  <div class="restaurant-menu-container">
    <div class="menu-categories" v-if="categories.length">
      <button 
        v-for="category in categories" 
        :key="category.id"
        class="category-btn"
        :class="{ 'active': selectedCategory === category.id }"
        @click="selectCategory(category.id)"
      >
        {{ category.name }}
      </button>
    </div>
    
    <div class="menu-dishes">
      <div v-if="loading" class="dishes-loading">
        <p>Loading menu...</p>
      </div>
      
      <div v-else-if="!filteredDishes.length" class="no-dishes">
        <p>No dishes available in this category.</p>
      </div>
      
      <div v-else class="dishes-grid">
        <div 
          v-for="dish in filteredDishes" 
          :key="dish.id"
          class="dish-card"
          @click="showDishDetail(dish.id)"
        >
          <div class="dish-image-wrapper">
            <img :src="dish.imageUrl || '/img/placeholder-dish.jpg'" :alt="dish.name" class="dish-image">
          </div>
          <div class="dish-content">
            <h3 class="dish-name">{{ dish.name }}</h3>
            <p class="dish-description">{{ dish.description }}</p>
            <p class="dish-price">{{ formatPrice(dish.price) }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Dish detail modal -->
    <div v-if="selectedDishId" class="dish-detail-modal">
      <div class="dish-detail-overlay" @click="closeDishDetail"></div>
      <div class="dish-detail-wrapper">
        <button class="close-btn" @click="closeDishDetail">&times;</button>
        <DishDetail 
          :dish-id="selectedDishId" 
          :restaurant-id="restaurantId"
          @add-to-cart="handleAddToCart"
          @close-dish-detail="closeDishDetail"
        />
      </div>
    </div>
  </div>
</template>

<script>
import DishDetail from './DishDetail.vue';

export default {
  name: 'RestaurantMenu',
  components: {
    DishDetail
  },
  props: {
    restaurantId: {
      type: [String, Number],
      required: true
    }
  },
  data() {
    return {
      loading: true,
      categories: [],
      dishes: [],
      selectedCategory: null,
      selectedDishId: null
    }
  },
  computed: {
    filteredDishes() {
      if (!this.selectedCategory) {
        return this.dishes;
      }
      return this.dishes.filter(dish => dish.categoryId === this.selectedCategory);
    }
  },
  created() {
    this.fetchMenuData();
  },
  methods: {
    fetchMenuData() {
      this.loading = true;
      
      // Replace with actual API calls
      // Example: this.$store.dispatch('fetchRestaurantMenu', this.restaurantId)
      
      // Placeholder for demo purposes
      setTimeout(() => {
        this.categories = [
          { id: 'appetizers', name: 'Appetizers' },
          { id: 'main', name: 'Main Courses' },
          { id: 'desserts', name: 'Desserts' },
          { id: 'drinks', name: 'Drinks' }
        ];
        
        this.dishes = [
          {
            id: 1,
            categoryId: 'appetizers',
            name: 'Garlic Bread',
            description: 'Freshly baked bread with garlic butter.',
            price: 4.99,
            imageUrl: null
          },
          {
            id: 2,
            categoryId: 'appetizers',
            name: 'Chicken Wings',
            description: 'Spicy chicken wings with blue cheese dip.',
            price: 8.99,
            imageUrl: null
          },
          {
            id: 3,
            categoryId: 'main',
            name: 'Margherita Pizza',
            description: 'Classic pizza with tomato sauce, mozzarella, and basil.',
            price: 12.99,
            imageUrl: null
          },
          {
            id: 4,
            categoryId: 'main',
            name: 'Grilled Salmon',
            description: 'Fresh salmon with lemon and herbs, served with vegetables.',
            price: 16.99,
            imageUrl: null
          },
          {
            id: 5,
            categoryId: 'desserts',
            name: 'Chocolate Cake',
            description: 'Rich chocolate cake with vanilla ice cream.',
            price: 6.99,
            imageUrl: null
          },
          {
            id: 6,
            categoryId: 'drinks',
            name: 'Fresh Lemonade',
            description: 'Homemade lemonade with mint.',
            price: 3.99,
            imageUrl: null
          }
        ];
        
        // Set initial category
        if (this.categories.length && !this.selectedCategory) {
          this.selectedCategory = this.categories[0].id;
        }
        
        this.loading = false;
      }, 1000);
    },
    selectCategory(categoryId) {
      this.selectedCategory = categoryId;
    },
    showDishDetail(dishId) {
      this.selectedDishId = dishId;
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    },
    closeDishDetail() {
      this.selectedDishId = null;
      document.body.style.overflow = ''; // Restore scrolling
    },
    formatPrice(price) {
      return `$${parseFloat(price).toFixed(2)}`;
    },
    handleAddToCart(cartItem) {
      // Add to cart logic
      // Example: this.$store.dispatch('addToCart', cartItem);
      console.log('Adding to cart:', cartItem);
      
      // Show success message
      alert(`Added ${cartItem.quantity} ${cartItem.name} to cart!`);
      
      // Close the detail modal
      this.closeDishDetail();
    }
  }
}
</script>

<style scoped>
.restaurant-menu-container {
  display: flex;
  flex-direction: column;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.menu-categories {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  padding-bottom: 15px;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
  gap: 10px;
}

.category-btn {
  padding: 10px 20px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 20px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn.active {
  background-color: #e74c3c;
  color: white;
  border-color: #e74c3c;
}

.dishes-loading, .no-dishes {
  text-align: center;
  padding: 40px;
  color: #666;
}

.dishes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
}

.dish-card {
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s;
  background-color: white;
}

.dish-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dish-image-wrapper {
  height: 180px;
  overflow: hidden;
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dish-content {
  padding: 15px;
}

.dish-name {
  margin: 0 0 10px;
  font-size: 18px;
  font-weight: 600;
}

.dish-description {
  color: #666;
  margin: 0 0 10px;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.dish-price {
  color: #e74c3c;
  font-weight: 600;
  margin: 0;
}

/* Modal styles */
.dish-detail-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dish-detail-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.dish-detail-wrapper {
  position: relative;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  z-index: 1001;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: white;
  border: none;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1002;
}

/* Mobile optimizations */
@media (max-width: 767px) {
  .dishes-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 15px;
  }
  
  .dish-image-wrapper {
    height: 120px;
  }
  
  .dish-content {
    padding: 10px;
  }
  
  .dish-name {
    font-size: 16px;
  }
  
  .dish-description {
    font-size: 12px;
  }
}
</style>