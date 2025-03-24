<template>
  <div class="personalized-recommendations" v-if="hasRecommendations || isLoadingRecommendations">
    <div class="section-header">
      <h2 class="section-title">{{ $t('recommendations.title') }}</h2>
      <p class="section-description">{{ $t('recommendations.subtitle') }}</p>
    </div>

    <!-- Loading state -->
    <div v-if="isLoadingRecommendations" class="recommendations-loading">
      <div class="shimmer-cards">
        <div v-for="i in 4" :key="i" class="shimmer-card">
          <div class="shimmer-image"></div>
          <div class="shimmer-content">
            <div class="shimmer-title"></div>
            <div class="shimmer-text"></div>
            <div class="shimmer-text-short"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recommendations content -->
    <div v-else class="recommendations-content">
      <swiper
        :slidesPerView="1.2"
        :spaceBetween="16"
        :grabCursor="true"
        :breakpoints="{
          '640': { slidesPerView: 2.2, spaceBetween: 20 },
          '768': { slidesPerView: 3.2, spaceBetween: 24 },
          '1024': { slidesPerView: 4.2, spaceBetween: 24 }
        }"
        class="recommendations-swiper"
      >
        <swiper-slide v-for="item in recommendations" :key="item.id" class="recommendation-slide">
          <div class="recommendation-card">
            <div class="card-image-container">
              <img 
                :src="item.image" 
                :alt="item.name" 
                class="card-image"
                @error="handleImageError"
              >
              <div class="card-badges">
                <span v-if="item.discount" class="discount-badge">{{ item.discount }}% OFF</span>
              </div>
              <div class="card-actions">
                <button 
                  class="action-btn favorite-btn" 
                  :class="{ 'is-favorite': isFavoriteFood(item.id) }"
                  @click="toggleFavorite(item)"
                  aria-label="Toggle favorite"
                >
                  <i class="mdi" :class="isFavoriteFood(item.id) ? 'mdi-heart' : 'mdi-heart-outline'"></i>
                </button>
                <button 
                  class="action-btn share-btn" 
                  @click="shareItem(item)"
                  aria-label="Share"
                >
                  <i class="mdi mdi-share-variant"></i>
                </button>
              </div>
            </div>
            <div class="card-content">
              <h3 class="card-title">{{ item.name }}</h3>
              <div class="card-restaurant">
                <i class="mdi mdi-store"></i>
                {{ item.restaurant.name }}
              </div>
              <div class="card-rating" v-if="item.rating">
                <i class="mdi mdi-star"></i>
                <span>{{ item.rating.toFixed(1) }}</span>
                <span class="rating-count">({{ item.ratingCount || 0 }})</span>
              </div>
              <div class="card-footer">
                <div class="card-price">{{ formatPrice(item.price) }}</div>
                <button 
                  class="add-to-cart-btn" 
                  @click="addToCart(item)"
                >
                  <i class="mdi mdi-cart-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </swiper-slide>
      </swiper>
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
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import { socialSharingService } from '@/services/social-sharing.service';

export default {
  name: 'PersonalizedRecommendations',
  
  components: {
    Swiper,
    SwiperSlide
  },
  
  data() {
    return {
      showShareDialog: false,
      shareItem: null,
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
      recommendations: state => state.favorites.recommendations,
      favoriteFoods: state => state.favorites.favoriteFoods,
      isLoadingRecommendations: state => state.favorites.loadingRecommendations,
    }),
    
    hasRecommendations() {
      return this.recommendations && this.recommendations.length > 0;
    },
    
    shareDialogText() {
      if (!this.shareItem) return '';
      
      return this.$t('social.shareFoodText', {
        name: this.shareItem.name,
        restaurant: this.shareItem.restaurant.name
      });
    }
  },
  
  created() {
    this.loadRecommendations();
  },
  
  methods: {
    ...mapActions({
      getPersonalizedRecommendations: 'favorites/getPersonalizedRecommendations',
      toggleFavoriteFood: 'favorites/toggleFavoriteFood',
      fetchFavoriteFoods: 'favorites/fetchFavoriteFoods',
      addToCartAction: 'cart/addToCart'
    }),
    
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    },
    
    async loadRecommendations() {
      try {
        // Load favorite foods if not already loaded
        if (!this.favoriteFoods.length) {
          await this.fetchFavoriteFoods();
        }
        
        await this.getPersonalizedRecommendations();
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      }
    },
    
    handleImageError(event) {
      event.target.src = '/images/placeholder-food.png';
    },
    
    isFavoriteFood(foodId) {
      return this.favoriteFoods.some(food => food.id === foodId);
    },
    
    async toggleFavorite(food) {
      try {
        const result = await this.toggleFavoriteFood(food);
        if (result) {
          this.$toast.success(this.$t('favorites.addedSuccess'));
        } else {
          this.$toast.success(this.$t('favorites.removedSuccess'));
        }
      } catch (error) {
        this.$toast.error(this.$t('favorites.toggleError'));
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
    
    shareItem(item) {
      this.shareItem = item;
      this.showShareDialog = true;
    },
    
    async shareOn(platform) {
      try {
        await socialSharingService.shareFood(platform, this.shareItem, this.shareItem.restaurant);
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
.personalized-recommendations {
  width: 100%;
  margin: 2rem 0;
  padding: 0 1rem;
}

.section-header {
  margin-bottom: 1.5rem;
  text-align: left;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #333);
}

.section-description {
  font-size: 1rem;
  color: var(--text-muted, #666);
}

/* Shimmer loading effect */
.recommendations-loading {
  width: 100%;
}

.shimmer-cards {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.shimmer-cards::-webkit-scrollbar {
  display: none;
}

.shimmer-card {
  flex: 0 0 280px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.shimmer-image {
  height: 180px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.shimmer-content {
  padding: 1rem;
}

.shimmer-title {
  height: 24px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 0.75rem;
  border-radius: 4px;
}

.shimmer-text {
  height: 16px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  margin-bottom: 0.5rem;
  border-radius: 4px;
}

.shimmer-text-short {
  height: 16px;
  width: 60%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Recommendation Cards */
.recommendations-swiper {
  width: 100%;
  padding: 10px 0;
}

.recommendation-slide {
  height: auto;
}

.recommendation-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.recommendation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.card-image-container {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.recommendation-card:hover .card-image {
  transform: scale(1.05);
}

.card-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.discount-badge {
  background-color: var(--primary-color, #ff5a5f);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
}

.card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: white;
  border: none;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.favorite-btn.is-favorite {
  background-color: var(--primary-color, #ff5a5f);
  color: white;
}

.favorite-btn:hover:not(.is-favorite) {
  background-color: var(--primary-light, #fff1f2);
  color: var(--primary-color, #ff5a5f);
}

.share-btn:hover {
  background-color: var(--hover-color, #f5f5f5);
}

.card-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #333);
}

.card-restaurant {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  color: var(--text-muted, #666);
  margin-bottom: 0.5rem;
}

.card-rating {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin-bottom: 0.5rem;
}

.card-rating .mdi-star {
  color: var(--rating-color, #ffb100);
}

.rating-count {
  color: var(--text-muted, #666);
  font-size: 0.85rem;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  padding-top: 0.5rem;
}

.card-price {
  font-weight: 600;
  color: var(--primary-color, #ff5a5f);
}

.add-to-cart-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--primary-color, #ff5a5f);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.add-to-cart-btn:hover {
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
@media (max-width: 480px) {
  .personalized-recommendations {
    padding: 0 0.5rem;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
}
</style> 