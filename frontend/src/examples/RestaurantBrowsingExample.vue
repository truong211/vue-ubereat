<template>
  <div class="restaurant-browsing-examples">
    <h2 class="text-h5 mb-4">Restaurant Browsing Examples</h2>
    
    <!-- Example 1: Basic Restaurant Search -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Restaurant Search</h3>
      <v-card>
        <v-card-text>
          <restaurant-search
            @restaurant-selected="handleRestaurantSelected"
            @update:search="handleSearchUpdate"
            @update:filters="handleFilterUpdate"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ searchExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 2: Restaurant Menu Browser -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Menu Browser</h3>
      <v-card>
        <v-card-text>
          <div v-if="selectedRestaurant" class="mb-4">
            <div class="d-flex align-center">
              <v-btn
                variant="text"
                prepend-icon="mdi-arrow-left"
                @click="selectedRestaurant = null"
              >
                Back to Search
              </v-btn>
              <v-divider vertical class="mx-4"></v-divider>
              <div>
                <div class="text-h6">{{ selectedRestaurant.name }}</div>
                <div class="text-subtitle-2 text-medium-emphasis">
                  {{ selectedRestaurant.cuisines.join(', ') }}
                </div>
              </div>
            </div>
          </div>
          
          <menu-browser
            v-if="selectedRestaurant"
            :categories="menuCategories"
            :items="menuItems"
            @add-to-cart="handleAddToCart"
          />
          
          <div v-else class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-store-search</v-icon>
            <h3 class="text-h6 mt-4">Select a Restaurant</h3>
            <p class="text-body-1 text-medium-emphasis">
              Use the restaurant search above to view menus
            </p>
          </div>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ menuExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 3: Combined Search and Cart -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Integrated Experience</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Main Content -->
            <v-col cols="12" md="8">
              <restaurant-search
                v-if="!selectedRestaurant"
                @restaurant-selected="handleRestaurantSelected"
              />
              
              <menu-browser
                v-else
                :categories="menuCategories"
                :items="menuItems"
                @add-to-cart="handleAddToCart"
              />
            </v-col>
            
            <!-- Cart Sidebar -->
            <v-col cols="12" md="4">
              <cart-widget
                v-model:items="cartItems"
                :restaurant="selectedRestaurant"
                :delivery-fee="3.99"
                @update:items="handleCartUpdate"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ integratedExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import RestaurantSearch from '@/components/restaurant/RestaurantSearch.vue'
import MenuBrowser from '@/components/restaurant/MenuBrowser.vue'
import CartWidget from '@/components/cart/CartWidget.vue'

export default {
  name: 'RestaurantBrowsingExample',
  
  components: {
    RestaurantSearch,
    MenuBrowser,
    CartWidget
  },
  
  setup() {
    // State
    const selectedRestaurant = ref(null)
    const cartItems = ref([])
    
    // Mock menu data
    const menuCategories = [
      { id: 'starters', name: 'Starters', icon: 'mdi-silverware' },
      { id: 'mains', name: 'Main Courses', icon: 'mdi-food' },
      { id: 'desserts', name: 'Desserts', icon: 'mdi-cake' },
      { id: 'drinks', name: 'Drinks', icon: 'mdi-cup' }
    ]
    
    const menuItems = [
      {
        id: 1,
        categoryId: 'starters',
        name: 'Spring Rolls',
        description: 'Crispy vegetable spring rolls with sweet chili sauce',
        price: 6.99,
        image: '/images/menu/spring-rolls.jpg',
        available: true,
        dietaryTags: ['vegetarian'],
        popular: true
      },
      {
        id: 2,
        categoryId: 'mains',
        name: 'Pad Thai',
        description: 'Traditional Thai stir-fried rice noodles with tofu',
        price: 12.99,
        image: '/images/menu/pad-thai.jpg',
        available: true,
        dietaryTags: ['vegetarian'],
        customizable: true,
        spicy: true
      },
      // Add more items...
    ]
    
    // Event handlers
    const handleRestaurantSelected = (restaurant) => {
      selectedRestaurant.value = restaurant
    }
    
    const handleSearchUpdate = (query) => {
      console.log('Search query:', query)
    }
    
    const handleFilterUpdate = (filters) => {
      console.log('Filters updated:', filters)
    }
    
    const handleAddToCart = (item) => {
      cartItems.value.push(item)
    }
    
    const handleCartUpdate = (items) => {
      cartItems.value = items
    }
    
    // Code examples
    const searchExample = computed(() => {
      return `<restaurant-search
  @restaurant-selected="handleRestaurantSelected"
  @update:search="handleSearchUpdate"
  @update:filters="handleFilterUpdate"
/>`
    })
    
    const menuExample = computed(() => {
      return `<menu-browser
  :categories="menuCategories"
  :items="menuItems"
  @add-to-cart="handleAddToCart"
/>`
    })
    
    const integratedExample = computed(() => {
      return `<v-row>
  <!-- Main Content -->
  <v-col cols="12" md="8">
    <restaurant-search
      v-if="!selectedRestaurant"
      @restaurant-selected="handleRestaurantSelected"
    />
    
    <menu-browser
      v-else
      :categories="menuCategories"
      :items="menuItems"
      @add-to-cart="handleAddToCart"
    />
  </v-col>
  
  <!-- Cart Sidebar -->
  <v-col cols="12" md="4">
    <cart-widget
      v-model:items="cartItems"
      :restaurant="selectedRestaurant"
      :delivery-fee="3.99"
      @update:items="handleCartUpdate"
    />
  </v-col>
</v-row>`
    })
    
    return {
      selectedRestaurant,
      cartItems,
      menuCategories,
      menuItems,
      handleRestaurantSelected,
      handleSearchUpdate,
      handleFilterUpdate,
      handleAddToCart,
      handleCartUpdate,
      searchExample,
      menuExample,
      integratedExample
    }
  }
}
</script>

<style scoped>
.restaurant-browsing-examples {
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