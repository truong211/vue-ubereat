<template>
  <div class="favorites-manager">
    <h2 class="text-h6 mb-4">Favorite Restaurants</h2>
    
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
      v-else-if="favorites.length === 0"
      variant="outlined"
      class="text-center py-8 px-4"
    >
      <v-icon size="64" color="grey-lighten-1" icon="mdi-heart-off"></v-icon>
      <h3 class="text-h6 mt-4 mb-2">No Favorite Restaurants Yet</h3>
      <p class="text-medium-emphasis mb-6">
        Save your favorite restaurants for quick access
      </p>
      <v-btn
        color="primary"
        to="/restaurants"
        prepend-icon="mdi-store-search"
      >
        Browse Restaurants
      </v-btn>
    </v-card>
    
    <!-- Content -->
    <v-row v-else>
      <v-col
        v-for="restaurant in favorites"
        :key="restaurant.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card>
          <v-img
            :src="restaurant.image || '/img/restaurant-placeholder.jpg'"
            height="160"
            cover
            class="align-end"
          >
            <v-card-title class="text-white pb-1 pt-5 bg-black-opacity">
              {{ restaurant.name }}
            </v-card-title>
          </v-img>
          
          <v-card-text>
            <div class="d-flex align-center justify-space-between">
              <div class="d-flex align-center">
                <v-rating
                  :model-value="restaurant.rating"
                  color="amber"
                  density="compact"
                  size="small"
                  readonly
                ></v-rating>
                <span class="text-body-2 ml-2">
                  {{ restaurant.rating.toFixed(1) }} ({{ restaurant.reviewCount }})
                </span>
              </div>
              <v-chip size="small" color="primary" variant="tonal">
                {{ restaurant.category }}
              </v-chip>
            </div>
            
            <div class="mt-2 d-flex align-center">
              <v-icon size="small" icon="mdi-map-marker" class="me-1"></v-icon>
              <span class="text-body-2 text-truncate">{{ restaurant.address }}</span>
            </div>
            
            <div class="mt-2 d-flex align-center">
              <v-icon size="small" icon="mdi-clock-outline" class="me-1"></v-icon>
              <span class="text-body-2">
                {{ restaurant.deliveryTime }} min • ${{ restaurant.deliveryFee.toFixed(2) }} delivery
              </span>
            </div>
          </v-card-text>
          
          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              :to="`/restaurant/${restaurant.id}`"
            >
              Order Now
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-heart"
              variant="text"
              color="error"
              @click="removeFavorite(restaurant.id)"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';

export default {
  name: 'FavoritesManager',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    
    const favorites = ref([]);
    const loading = ref(true);
    const error = ref(null);
    
    const fetchFavorites = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await store.dispatch('user/fetchFavorites');
        favorites.value = response?.data || [];
      } catch (err) {
        console.error('Error fetching favorite restaurants:', err);
        error.value = 'Unable to load your favorite restaurants';
      } finally {
        loading.value = false;
      }
    };
    
    const removeFavorite = async (restaurantId) => {
      try {
        await store.dispatch('user/removeFavorite', restaurantId);
        
        // Update the local list
        favorites.value = favorites.value.filter(r => r.id !== restaurantId);
        
        toast.success('Restaurant removed from favorites');
      } catch (err) {
        console.error('Error removing restaurant from favorites:', err);
        toast.error('Failed to remove from favorites');
      }
    };
    
    onMounted(fetchFavorites);
    
    return {
      favorites,
      loading,
      error,
      removeFavorite
    };
  }
};
</script>

<style scoped>
.bg-black-opacity {
  background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));
}
</style>