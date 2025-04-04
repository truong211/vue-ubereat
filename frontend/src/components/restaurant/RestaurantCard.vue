<template>
  <div class="restaurant-card" @click="navigateToRestaurant">
    <div class="restaurant-image">
      <img :src="restaurant.image || '/img/placeholder-restaurant.jpg'" :alt="restaurant.name">
      <div v-if="restaurant.promotions && restaurant.promotions.length" class="promotion-badge">
        {{ $t('restaurant.promo') }}
      </div>
      <div v-if="isNew" class="new-badge">{{ $t('restaurant.new') }}</div>
    </div>
    <div class="restaurant-info">
      <div class="restaurant-header">
        <h3 class="restaurant-name">{{ restaurant.name }}</h3>
        <div class="rating">
          <span class="rating-value">{{ restaurant.rating.toFixed(1) }}</span>
          <i class="fas fa-star"></i>
        </div>
      </div>
      <div class="restaurant-categories">
        <span v-for="(category, index) in restaurant.categories" :key="index">
          {{ category }}{{ index < restaurant.categories.length - 1 ? ', ' : '' }}
        </span>
      </div>
      <div class="restaurant-meta">
        <div class="delivery-info">
          <i class="fas fa-clock"></i>
          <span>{{ formatDeliveryTime(restaurant.deliveryTime) }}</span>
        </div>
        <div class="delivery-fee">
          <i class="fas fa-truck"></i>
          <span>{{ formatPrice(restaurant.deliveryFee) }}</span>
        </div>
        <div v-if="restaurant.minOrder" class="min-order">
          <i class="fas fa-shopping-basket"></i>
          <span>{{ $t('restaurant.minOrder') }}: {{ formatPrice(restaurant.minOrder) }}</span>
        </div>
      </div>
      <div v-if="restaurant.distance" class="distance">
        <i class="fas fa-map-marker-alt"></i>
        <span>{{ formatDistance(restaurant.distance) }}</span>
      </div>
    </div>
    <div class="favorite-button" @click.stop="toggleFavorite">
      <i class="fas" :class="isFavorite ? 'fa-heart' : 'fa-heart-o'"></i>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RestaurantCard',
  
  props: {
    restaurant: {
      type: Object,
      required: true
    },
    isFavorite: {
      type: Boolean,
      default: false
    }
  },
  
  computed: {
    isNew() {
      if (!this.restaurant.createdAt) return false;
      const creationDate = new Date(this.restaurant.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now - creationDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30; // Consider as new if less than 30 days old
    }
  },
  
  methods: {
    navigateToRestaurant() {
      this.$router.push({ 
        name: 'RestaurantDetail', 
        params: { id: this.restaurant.id } 
      });
    },
    
    toggleFavorite() {
      this.$emit('toggle-favorite', this.restaurant.id);
    },
    
    formatDeliveryTime(minutes) {
      if (!minutes) return this.$t('restaurant.deliveryTimeUnknown');
      return `${minutes} ${this.$t('common.min')}`;
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat(this.$i18n.locale, {
        style: 'currency',
        currency: 'USD'
      }).format(price);
    },
    
    formatDistance(distance) {
      if (typeof distance !== 'number') return '';
      return `${distance.toFixed(1)} ${this.$t('common.km')}`;
    }
  }
}
</script>

<style scoped>
.restaurant-card {
  position: relative;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  overflow: hidden;
  cursor: pointer;
  background-color: white;
  height: 100%;
}

.restaurant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.restaurant-image {
  position: relative;
  width: 100%;
  height: 160px;
  overflow: hidden;
}

.restaurant-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.promotion-badge, .new-badge {
  position: absolute;
  top: 10px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
}

.promotion-badge {
  left: 10px;
  background-color: #FF5722;
}

.new-badge {
  right: 10px;
  background-color: #4CAF50;
}

.restaurant-info {
  padding: 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.restaurant-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.restaurant-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.rating {
  display: flex;
  align-items: center;
  color: #FFC107;
  font-weight: 600;
}

.rating-value {
  margin-right: 3px;
}

.restaurant-categories {
  color: #6c757d;
  font-size: 0.9rem;
  margin-bottom: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
}

.restaurant-meta, .distance {
  font-size: 0.85rem;
  color: #6c757d;
  display: flex;
  gap: 12px;
  margin-top: auto;
}

.delivery-info, .delivery-fee, .min-order, .distance {
  display: flex;
  align-items: center;
}

.restaurant-meta i, .distance i {
  margin-right: 5px;
  font-size: 0.9rem;
}

.distance {
  margin-top: 8px;
}

.favorite-button {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.favorite-button:hover {
  transform: scale(1.1);
}

.favorite-button i {
  color: #FF5252;
  font-size: 1.2rem;
}
</style> 