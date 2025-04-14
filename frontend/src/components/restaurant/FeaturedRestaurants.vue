<template>
  <div class="featured-restaurants">
    <div class="d-flex justify-space-between align-center mb-6">
      <h2 class="text-h4">{{ title || 'Nhà hàng nổi bật' }}</h2>
      <v-btn variant="text" color="primary" :to="viewAllLink" class="hover-scale">
        {{ viewAllText || 'Xem tất cả' }}
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>

    <div v-if="loading" class="d-flex justify-center my-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <v-row v-else-if="restaurants.length > 0">
      <v-col v-for="restaurant in restaurants" :key="restaurant.id" cols="12" sm="6" md="4">
        <v-card class="h-100 restaurant-card" @click="viewRestaurantDetails(restaurant.id)" hover>
          <v-img
            :src="restaurant.image || '/images/restaurants/default.jpg'"
            height="200"
            cover
            class="restaurant-image"
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-row>
            </template>

            <!-- Rating badge -->
            <div class="rating-badge">
              <v-icon color="amber-darken-2" size="small">mdi-star</v-icon>
              <span>{{ restaurant.rating.toFixed(1) }}</span>
            </div>

            <!-- Favorite button -->
            <v-btn
              icon
              variant="flat"
              color="white"
              size="small"
              class="favorite-btn"
              :class="{ 'is-favorite': restaurant.isFavorite }"
              @click.stop="toggleFavorite(restaurant)"
            >
              <v-icon>{{ restaurant.isFavorite ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
            </v-btn>
          </v-img>

          <v-card-title class="text-truncate">{{ restaurant.name }}</v-card-title>

          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-icon size="small" color="grey-darken-1" class="mr-1">mdi-map-marker</v-icon>
              <span class="text-caption text-truncate">{{ restaurant.address }}</span>
            </div>

            <div class="d-flex align-center mb-2">
              <v-icon size="small" color="grey-darken-1" class="mr-1">mdi-clock-outline</v-icon>
              <span class="text-caption">{{ restaurant.deliveryTime }} phút</span>
              
              <v-spacer></v-spacer>
              
              <v-chip
                v-if="restaurant.priceLevel"
                size="x-small"
                color="grey"
                class="ml-2"
              >
                {{ getPriceLevel(restaurant.priceLevel) }}
              </v-chip>
            </div>

            <div class="text-truncate">
              <v-chip
                v-for="(cuisine, index) in restaurant.cuisines.slice(0, 3)"
                :key="index"
                size="small"
                class="mr-1 mb-1"
                variant="flat"
                color="grey-lighten-3"
              >
                {{ cuisine }}
              </v-chip>
              <span v-if="restaurant.cuisines.length > 3" class="text-caption">+{{ restaurant.cuisines.length - 3 }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <div v-else class="text-center my-8">
      <v-icon size="64" color="grey-lighten-1">mdi-store-off</v-icon>
      <p class="text-h6 mt-4">Không tìm thấy nhà hàng</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useRestaurantStore } from '@/stores/restaurant';
import { useNotification } from '@/composables/useNotification';
import restaurantService from '@/services/restaurant.service';

export default {
  name: 'FeaturedRestaurants',

  props: {
    maxItems: {
      type: Number,
      default: 6
    },
    title: {
      type: String,
      default: ''
    },
    viewAllText: {
      type: String,
      default: ''
    },
    viewAllLink: {
      type: String,
      default: '/restaurants'
    }
  },

  emits: ['favorite-toggled'],

  setup(props, { emit }) {
    const router = useRouter();
    const authStore = useAuthStore();
    const restaurantStore = useRestaurantStore();
    const { notify } = useNotification();

    const restaurants = ref([]);
    const loading = ref(false);

    const fetchFeaturedRestaurants = async () => {
      loading.value = true;
      try {
        const params = {
          featured: true,
          limit: props.maxItems,
          sort: 'rating'
        };

        const response = await restaurantService.getRestaurants(params);
        restaurants.value = response.data.data || [];
      } catch (error) {
        console.error('Error fetching featured restaurants:', error);
        notify('Không thể tải nhà hàng nổi bật. Vui lòng thử lại sau.', 'error');
      } finally {
        loading.value = false;
      }
    };

    const viewRestaurantDetails = (restaurantId) => {
      router.push(`/restaurant/${restaurantId}`);
    };

    const toggleFavorite = async (restaurant) => {
      try {
        const isLoggedIn = authStore.isLoggedIn;
        
        if (!isLoggedIn) {
          router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath));
          return;
        }
        
        await restaurantStore.toggleFavorite(restaurant.id);
        
        // Update local state
        restaurant.isFavorite = !restaurant.isFavorite;
        
        notify(
          restaurant.isFavorite 
            ? `Đã thêm ${restaurant.name} vào danh sách yêu thích` 
            : `Đã xóa ${restaurant.name} khỏi danh sách yêu thích`, 
          'success'
        );

        emit('favorite-toggled', restaurant);
      } catch (error) {
        console.error('Error toggling favorite:', error);
        notify('Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại.', 'error');
      }
    };

    const getPriceLevel = (level) => {
      switch (level) {
        case 1:
          return '$';
        case 2:
          return '$$';
        case 3:
          return '$$$';
        case 4:
          return '$$$$';
        default:
          return '$';
      }
    };

    onMounted(() => {
      fetchFeaturedRestaurants();
    });

    return {
      restaurants,
      loading,
      viewRestaurantDetails,
      toggleFavorite,
      getPriceLevel
    };
  }
};
</script>

<style scoped>
.restaurant-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  will-change: transform;
  overflow: hidden;
  animation: fadeIn 0.5s ease forwards;
  opacity: 0;
}

.restaurant-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.restaurant-card:hover .restaurant-image {
  transform: scale(1.05);
}

.restaurant-image {
  position: relative;
  transition: transform 0.5s ease;
  overflow: hidden;
}

.rating-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: white;
  color: black;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.favorite-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  transition: transform 0.2s ease;
  z-index: 1;
}

.favorite-btn:hover {
  transform: scale(1.1);
}

.favorite-btn.is-favorite {
  color: #ff5252 !important;
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger animation for cards */
.featured-restaurants .v-col:nth-child(1) .restaurant-card { animation-delay: 0.1s; }
.featured-restaurants .v-col:nth-child(2) .restaurant-card { animation-delay: 0.2s; }
.featured-restaurants .v-col:nth-child(3) .restaurant-card { animation-delay: 0.3s; }
.featured-restaurants .v-col:nth-child(4) .restaurant-card { animation-delay: 0.4s; }
.featured-restaurants .v-col:nth-child(5) .restaurant-card { animation-delay: 0.5s; }
.featured-restaurants .v-col:nth-child(6) .restaurant-card { animation-delay: 0.6s; }
</style> 