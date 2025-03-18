<template>
  <div class="saved-items-manager">
    <h2 class="text-h6 mb-4">Saved Items</h2>
    
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    
    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>
    
    <!-- Empty State -->
    <v-card
      v-else-if="savedItems.length === 0"
      variant="outlined"
      class="text-center py-8 px-4"
    >
      <v-icon size="64" color="grey-lighten-1" icon="mdi-food-variant-off"></v-icon>
      <h3 class="text-h6 mt-4 mb-2">No Saved Items Yet</h3>
      <p class="text-medium-emphasis mb-6">
        Save your favorite menu items for quick reordering
      </p>
      <v-btn
        color="primary"
        to="/restaurants"
        prepend-icon="mdi-silverware-fork-knife"
      >
        Browse Menus
      </v-btn>
    </v-card>
    
    <!-- Content -->
    <div v-else>
      <!-- Filter by Restaurant Toggle -->
      <div class="d-flex align-center mb-4">
        <v-switch
          v-model="groupByRestaurant"
          hide-details
          label="Group by restaurant"
          color="primary"
          class="mb-0"
        ></v-switch>
        
        <v-spacer></v-spacer>
        
        <!-- Search -->
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search saved items"
          density="compact"
          hide-details
          variant="outlined"
          class="max-width-200"
        ></v-text-field>
      </div>
      
      <!-- Grouped by Restaurant -->
      <template v-if="groupByRestaurant">
        <v-expansion-panels v-model="expandedPanels" multiple>
          <v-expansion-panel
            v-for="(group, restaurantId) in groupedItems"
            :key="restaurantId"
            :value="restaurantId"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-avatar size="32" class="mr-3">
                  <v-img :src="group.restaurant.image || '/img/restaurant-placeholder.jpg'" alt="Restaurant"></v-img>
                </v-avatar>
                {{ group.restaurant.name }}
                <v-chip size="small" class="ml-2" color="primary" variant="tonal">
                  {{ group.items.length }} items
                </v-chip>
              </div>
            </v-expansion-panel-title>
            
            <v-expansion-panel-text>
              <v-list>
                <v-list-item
                  v-for="item in group.items"
                  :key="item.id"
                  :title="item.name"
                  :subtitle="`$${item.price.toFixed(2)} • ${item.description.substring(0, 60)}${item.description.length > 60 ? '...' : ''}`"
                >
                  <template v-slot:prepend>
                    <v-avatar rounded size="48">
                      <v-img :src="item.image || '/img/food-placeholder.jpg'" alt="Food item"></v-img>
                    </v-avatar>
                  </template>
                  
                  <template v-slot:append>
                    <v-btn
                      icon="mdi-cart-plus"
                      variant="text"
                      color="primary"
                      @click="addToCart(item)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-heart-remove"
                      variant="text"
                      color="error"
                      @click="removeItem(item.id)"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
              
              <v-btn
                block
                variant="tonal"
                color="primary"
                class="mt-2"
                :to="`/restaurant/${restaurantId}`"
              >
                Visit Restaurant
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </template>
      
      <!-- List View -->
      <template v-else>
        <v-row>
          <v-col
            v-for="item in filteredItems"
            :key="item.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card>
              <div class="d-flex">
                <v-img
                  :src="item.image || '/img/food-placeholder.jpg'"
                  width="120"
                  height="120"
                  cover
                ></v-img>
                <v-card-text class="flex-grow-1">
                  <div class="d-flex justify-space-between">
                    <h3 class="text-subtitle-1 font-weight-medium">{{ item.name }}</h3>
                    <span class="text-subtitle-1 font-weight-bold">${{ item.price.toFixed(2) }}</span>
                  </div>
                  <p class="text-body-2 text-truncate-2 mt-1">{{ item.description }}</p>
                  <div class="d-flex align-center mt-1">
                    <v-avatar size="20" class="mr-2">
                      <v-img :src="item.restaurantImage || '/img/restaurant-placeholder.jpg'"></v-img>
                    </v-avatar>
                    <span class="text-caption">{{ item.restaurantName }}</span>
                  </div>
                </v-card-text>
              </div>
              
              <v-divider></v-divider>
              
              <v-card-actions>
                <v-btn
                  variant="text"
                  prepend-icon="mdi-cart-plus"
                  @click="addToCart(item)"
                >
                  Add to Cart
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  icon="mdi-heart-remove"
                  variant="text"
                  color="error"
                  @click="removeItem(item.id)"
                ></v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';

export default {
  name: 'SavedItemsManager',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    
    const savedItems = ref([]);
    const loading = ref(true);
    const error = ref(null);
    const search = ref('');
    const groupByRestaurant = ref(true);
    const expandedPanels = ref([]);
    
    const fetchSavedItems = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await store.dispatch('user/fetchSavedItems');
        savedItems.value = response?.data || [];
        
        // Auto-expand the first panel
        if (savedItems.value.length > 0 && groupByRestaurant.value) {
          const firstRestaurantId = Object.keys(groupedItems.value)[0];
          if (firstRestaurantId) {
            expandedPanels.value = [firstRestaurantId];
          }
        }
      } catch (err) {
        console.error('Error fetching saved items:', err);
        error.value = 'Unable to load your saved items';
      } finally {
        loading.value = false;
      }
    };
    
    const removeItem = async (itemId) => {
      try {
        await store.dispatch('user/removeSavedItem', itemId);
        
        // Update local list
        savedItems.value = savedItems.value.filter(item => item.id !== itemId);
        
        toast.success('Item removed from saved items');
      } catch (err) {
        console.error('Error removing saved item:', err);
        toast.error('Failed to remove item');
      }
    };
    
    const addToCart = async (item) => {
      try {
        await store.dispatch('cart/addItem', {
          productId: item.id,
          quantity: 1
        });
        
        toast.success(`${item.name} added to cart`);
      } catch (err) {
        console.error('Error adding item to cart:', err);
        toast.error('Failed to add item to cart');
      }
    };
    
    const filteredItems = computed(() => {
      if (!search.value) return savedItems.value;
      
      const searchTerm = search.value.toLowerCase();
      return savedItems.value.filter(item => 
        item.name.toLowerCase().includes(searchTerm) || 
        item.restaurantName.toLowerCase().includes(searchTerm)
      );
    });
    
    const groupedItems = computed(() => {
      const groups = {};
      
      for (const item of filteredItems.value) {
        const restaurantId = item.restaurantId;
        
        if (!groups[restaurantId]) {
          groups[restaurantId] = {
            restaurant: {
              id: restaurantId,
              name: item.restaurantName,
              image: item.restaurantImage
            },
            items: []
          };
        }
        
        groups[restaurantId].items.push(item);
      }
      
      return groups;
    });
    
    onMounted(fetchSavedItems);
    
    return {
      savedItems,
      loading,
      error,
      search,
      groupByRestaurant,
      expandedPanels,
      filteredItems,
      groupedItems,
      removeItem,
      addToCart
    };
  }
};
</script>

<style scoped>
.max-width-200 {
  max-width: 200px;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>