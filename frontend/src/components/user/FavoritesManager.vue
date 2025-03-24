<template>
  <div class="favorites-manager">
    <div class="header">
      <h1 class="title">{{ $t('favorites.title') }}</h1>
      <p class="subtitle">{{ $t('favorites.subtitle') }}</p>
    </div>

    <!-- Tabs for toggling between favorite foods and favorite restaurants -->
    <div class="tabs-container">
      <div 
        class="tab" 
        :class="{ active: activeTab === 'foods' }" 
        @click="activeTab = 'foods'"
      >
        <i class="mdi mdi-food"></i> {{ $t('favorites.foods') }}
      </div>
      <div 
        class="tab" 
        :class="{ active: activeTab === 'restaurants' }" 
        @click="activeTab = 'restaurants'"
      >
        <i class="mdi mdi-store"></i> {{ $t('favorites.restaurants') }}
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>{{ $t('common.loading') }}</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-state">
      <i class="mdi mdi-alert-circle"></i>
      <p>{{ error }}</p>
      <button @click="refresh" class="retry-button">
        {{ $t('common.retry') }}
      </button>
    </div>

    <!-- Empty state -->
    <div v-else-if="isCurrentTabEmpty" class="empty-state">
      <i :class="activeTab === 'foods' ? 'mdi mdi-food-off' : 'mdi mdi-store-off'"></i>
      <p>{{ 
        activeTab === 'foods' 
          ? $t('favorites.noFavoriteFood') 
          : $t('favorites.noFavoriteRestaurant') 
      }}</p>
      <button @click="navigateToDiscover" class="discover-button">
        {{ $t('favorites.discoverButton') }}
      </button>
    </div>

    <!-- Favorite Foods Tab -->
    <div v-else-if="activeTab === 'foods'" class="favorites-grid foods-grid">
      <div 
        v-for="food in favoriteFoods" 
        :key="food.id" 
        class="favorite-item food-item"
      >
        <div class="item-image-container">
          <img 
            :src="food.image" 
            :alt="food.name" 
            class="item-image"
            @error="handleImageError"
          >
          <div class="item-actions">
            <button 
              class="action-button remove-button" 
              @click="removeFromFavorites('food', food)"
              aria-label="Remove from favorites"
            >
              <i class="mdi mdi-heart-off"></i>
            </button>
            <button 
              class="action-button share-button" 
              @click="openShareDialog('food', food)"
              aria-label="Share food"
            >
              <i class="mdi mdi-share-variant"></i>
            </button>
          </div>
        </div>
        <div class="item-details">
          <div class="item-name">{{ food.name }}</div>
          <div class="item-restaurant">{{ food.restaurant.name }}</div>
          <div class="item-price">{{ formatPrice(food.price) }}</div>
        </div>
        <button 
          class="order-button" 
          @click="addToCart(food)"
        >
          {{ $t('common.addToCart') }}
        </button>
      </div>
    </div>

    <!-- Favorite Restaurants Tab -->
    <div v-else class="favorites-grid restaurants-grid">
      <div 
        v-for="restaurant in favoriteRestaurants" 
        :key="restaurant.id" 
        class="favorite-item restaurant-item"
      >
        <div class="item-image-container">
          <img 
            :src="restaurant.image" 
            :alt="restaurant.name" 
            class="item-image"
            @error="handleImageError"
          >
          <div class="item-actions">
            <button 
              class="action-button remove-button" 
              @click="removeFromFavorites('restaurant', restaurant)"
              aria-label="Remove from favorites"
            >
              <i class="mdi mdi-heart-off"></i>
            </button>
            <button 
              class="action-button share-button" 
              @click="openShareDialog('restaurant', restaurant)"
              aria-label="Share restaurant"
            >
              <i class="mdi mdi-share-variant"></i>
            </button>
          </div>
        </div>
        <div class="item-details">
          <div class="item-name">{{ restaurant.name }}</div>
          <div class="item-category">{{ restaurant.category }}</div>
          <div class="item-rating">
            <i class="mdi mdi-star"></i>
            {{ restaurant.rating.toFixed(1) }}
            <span class="rating-count">({{ restaurant.ratingCount }})</span>
          </div>
          <div class="item-delivery-info">
            <i class="mdi mdi-bike-fast"></i>
            {{ restaurant.deliveryTime }} {{ $t('common.min') }}
            <span class="delivery-fee">{{ formatPrice(restaurant.deliveryFee) }}</span>
          </div>
        </div>
        <button 
          class="view-button" 
          @click="viewRestaurant(restaurant)"
        >
          {{ $t('common.view') }}
        </button>
      </div>
    </div>

    <!-- Share Dialog -->
    <div v-if="showShareDialog" class="share-dialog-overlay" @click="showShareDialog = false">
      <div class="share-dialog" @click.stop>
        <div class="share-dialog-header">
          <h3>{{ $t('social.shareTitle') }}</h3>
          <button class="close-button" @click="showShareDialog = false">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        <div class="share-dialog-content">
          <p>{{ shareDialogText }}</p>
          <div class="share-platforms">
            <button 
              v-for="platform in sharePlatforms" 
              :key="platform.id"
              class="platform-button"
              :class="platform.id"
              @click="shareOn(platform.id)"
              :aria-label="`Share on ${platform.name}`"
            >
              <i :class="`mdi ${platform.icon}`"></i>
              <span>{{ platform.name }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import { socialSharingService } from '@/services/social-sharing.service';

export default {
  name: 'FavoritesManager',
  
  data() {
    return {
      activeTab: 'foods',
      showShareDialog: false,
      shareItem: null,
      shareType: null,
      sharePlatforms: [
        { id: 'facebook', name: 'Facebook', icon: 'mdi-facebook' },
        { id: 'twitter', name: 'Twitter', icon: 'mdi-twitter' },
        { id: 'telegram', name: 'Telegram', icon: 'mdi-telegram' },
        { id: 'whatsapp', name: 'WhatsApp', icon: 'mdi-whatsapp' },
        { id: 'email', name: 'Email', icon: 'mdi-email' }
      ]
    };
  },
  
  computed: {
    ...mapState({
      favoriteFoods: state => state.favorites.favoriteFoods,
      favoriteRestaurants: state => state.favorites.favoriteRestaurants,
      isLoading: state => state.favorites.loading,
      error: state => state.favorites.error
    }),
    
    isCurrentTabEmpty() {
      if (this.activeTab === 'foods') {
        return this.favoriteFoods.length === 0;
      } else {
        return this.favoriteRestaurants.length === 0;
      }
    },
    
    shareDialogText() {
      if (!this.shareItem) return '';
      
      if (this.shareType === 'food') {
        return this.$t('social.shareFoodText', {
          name: this.shareItem.name,
          restaurant: this.shareItem.restaurant.name
        });
      } else {
        return this.$t('social.shareRestaurantText', {
          name: this.shareItem.name
        });
      }
    }
  },
  
  created() {
    this.loadFavorites();
  },
  
  methods: {
    ...mapActions({
      fetchFavoriteFoods: 'favorites/fetchFavoriteFoods',
      fetchFavoriteRestaurants: 'favorites/fetchFavoriteRestaurants',
      toggleFavoriteFood: 'favorites/toggleFavoriteFood',
      toggleFavoriteRestaurant: 'favorites/toggleFavoriteRestaurant',
      addToCartAction: 'cart/addToCart'
    }),
    
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    },
    
    loadFavorites() {
      this.fetchFavoriteFoods();
      this.fetchFavoriteRestaurants();
    },
    
    refresh() {
      this.loadFavorites();
    },
    
    handleImageError(event) {
      event.target.src = '/images/placeholder-food.png';
    },
    
    async removeFromFavorites(type, item) {
      try {
        if (type === 'food') {
          await this.toggleFavoriteFood(item);
        } else {
          await this.toggleFavoriteRestaurant(item);
        }
        this.$toast.success(this.$t('favorites.removedSuccess'));
      } catch (error) {
        this.$toast.error(this.$t('favorites.removeError'));
      }
    },
    
    navigateToDiscover() {
      if (this.activeTab === 'foods') {
        this.$router.push('/discover');
      } else {
        this.$router.push('/restaurants');
      }
    },
    
    addToCart(food) {
      this.addToCartAction({
        foodId: food.id,
        quantity: 1,
        restaurantId: food.restaurant.id
      });
      this.$toast.success(this.$t('cart.addedToCart'));
    },
    
    viewRestaurant(restaurant) {
      this.$router.push(`/restaurant/${restaurant.id}`);
    },
    
    openShareDialog(type, item) {
      this.shareType = type;
      this.shareItem = item;
      this.showShareDialog = true;
    },
    
    async shareOn(platform) {
      try {
        if (this.shareType === 'food') {
          await socialSharingService.shareFood(platform, this.shareItem, this.shareItem.restaurant);
        } else {
          await socialSharingService.shareRestaurant(platform, this.shareItem);
        }
        this.showShareDialog = false;
        this.$toast.success(this.$t('social.shareSuccess'));
      } catch (error) {
        this.$toast.error(this.$t('social.shareError'));
      }
    }
  }
};
</script>

<style scoped>
.favorites-manager {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1.5rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--primary-color, #ff5a5f);
}

.subtitle {
  font-size: 1.1rem;
  color: var(--text-muted, #666);
}

.tabs-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, #eee);
}

.tab {
  padding: 1rem 1.5rem;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-bottom: 3px solid transparent;
  transition: all 0.2s ease;
}

.tab.active {
  color: var(--primary-color, #ff5a5f);
  border-bottom: 3px solid var(--primary-color, #ff5a5f);
  font-weight: 500;
}

.tab:hover:not(.active) {
  background-color: var(--hover-color, #f9f9f9);
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  padding: 2rem;
}

.loading-state .spinner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 4px solid rgba(255, 90, 95, 0.2);
  border-top-color: var(--primary-color, #ff5a5f);
  animation: spin 1s infinite linear;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state i,
.empty-state i {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--error-color, #d9534f);
}

.empty-state i {
  color: var(--text-muted, #999);
}

.retry-button,
.discover-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  border-radius: 20px;
  background-color: var(--primary-color, #ff5a5f);
  color: white;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s ease;
}

.retry-button:hover,
.discover-button:hover {
  background-color: var(--primary-dark, #e04a4f);
}

.favorites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.favorite-item {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.favorite-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.item-image-container {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.item-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.favorite-item:hover .item-image {
  transform: scale(1.05);
}

.item-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.favorite-item:hover .item-actions {
  opacity: 1;
}

.action-button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.remove-button:hover {
  background-color: var(--error-light, #ffebee);
  color: var(--error-color, #d9534f);
}

.share-button:hover {
  background-color: var(--primary-light, #fff1f2);
  color: var(--primary-color, #ff5a5f);
}

.item-details {
  padding: 1rem;
}

.item-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: 0.3rem;
}

.item-restaurant,
.item-category {
  color: var(--text-muted, #666);
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.item-price {
  font-weight: 600;
  color: var(--primary-color, #ff5a5f);
  margin-top: 0.5rem;
}

.item-rating {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.item-rating .mdi-star {
  color: var(--rating-color, #ffb100);
}

.rating-count {
  color: var(--text-muted, #666);
  font-size: 0.85rem;
}

.item-delivery-info {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  color: var(--text-muted, #666);
}

.delivery-fee {
  margin-left: auto;
}

.order-button,
.view-button {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--primary-color, #ff5a5f);
  color: white;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.order-button:hover,
.view-button:hover {
  background-color: var(--primary-dark, #e04a4f);
}

/* Share Dialog */
.share-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.share-dialog {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15);
}

.share-dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color, #eee);
}

.share-dialog-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.close-button {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--text-muted, #666);
}

.share-dialog-content {
  padding: 1.5rem;
}

.share-dialog-content p {
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.share-platforms {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
}

.platform-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  background-color: var(--hover-color, #f9f9f9);
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.platform-button i {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.platform-button.facebook {
  color: #3b5998;
}

.platform-button.twitter {
  color: #1da1f2;
}

.platform-button.telegram {
  color: #0088cc;
}

.platform-button.whatsapp {
  color: #25d366;
}

.platform-button.email {
  color: #ea4335;
}

.platform-button:hover {
  background-color: var(--hover-dark, #f0f0f0);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .favorites-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
  
  .item-image-container {
    height: 150px;
  }
  
  .share-platforms {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }
}

@media (max-width: 480px) {
  .favorites-manager {
    padding: 1rem;
  }
  
  .tabs-container {
    flex-direction: column;
    align-items: center;
  }
  
  .tab {
    width: 100%;
    justify-content: center;
  }
  
  .favorites-grid {
    grid-template-columns: 1fr;
  }
}
</style> 