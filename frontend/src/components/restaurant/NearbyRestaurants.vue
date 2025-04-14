<template>
  <div class="nearby-restaurants">
    <div class="d-flex justify-space-between align-center mb-6">
      <h2 class="text-h4">Nhà hàng gần bạn</h2>
      <v-btn variant="text" color="primary" to="/restaurants" class="hover-scale">
        Xem tất cả
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>

    <div v-if="loading" class="d-flex justify-center my-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="userLocation.latitude && restaurants.length > 0">
      <v-row>
        <v-col v-for="restaurant in restaurants" :key="restaurant.id" cols="12" sm="6" md="3">
          <v-card class="h-100 restaurant-card" @click="viewRestaurantDetails(restaurant.id)" hover>
            <v-img
              :src="restaurant.image || '/images/restaurants/default.jpg'"
              height="180"
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
                <v-chip
                  v-if="restaurant.distance"
                  size="x-small"
                  color="primary"
                  class="ml-2"
                  variant="outlined"
                >
                  {{ formatDistance(restaurant.distance) }}
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
    </div>

    <div v-else-if="!userLocation.latitude" class="text-center my-6">
      <v-icon size="64" color="grey-lighten-1">mdi-map-marker-off</v-icon>
      <h3 class="text-h6 mt-4 mb-2">Không thể tìm thấy vị trí của bạn</h3>
      <p class="text-body-1 mb-4">Vui lòng chia sẻ vị trí để xem nhà hàng gần bạn</p>
      <v-btn color="primary" @click="requestLocation">Chia sẻ vị trí</v-btn>
    </div>

    <div v-else class="text-center my-6">
      <v-icon size="64" color="grey-lighten-1">mdi-store-off</v-icon>
      <h3 class="text-h6 mt-4">Không tìm thấy nhà hàng nào gần bạn</h3>
      <p class="text-body-1">Thử tìm kiếm ở một khu vực khác</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRestaurantStore } from '@/stores/restaurant'
import { useNotification } from '@/composables/useNotification'
import apiService from '@/services/apiService'

export default {
  name: 'NearbyRestaurants',

  props: {
    userLocation: {
      type: Object,
      default: () => ({
        latitude: null,
        longitude: null,
        address: ''
      })
    },
    maxResults: {
      type: Number,
      default: 4
    }
  },

  emits: ['update-location'],

  setup(props, { emit }) {
    const router = useRouter()
    const authStore = useAuthStore()
    const restaurantStore = useRestaurantStore()
    const { notify } = useNotification()

    const restaurants = ref([])
    const loading = ref(false)
    const isLoggedIn = computed(() => authStore.isAuthenticated)

    const fetchNearbyRestaurants = async () => {
      if (!props.userLocation.latitude || !props.userLocation.longitude) return

      loading.value = true
      try {
        const response = await apiService.get('/restaurants/nearby', {
          params: {
            latitude: props.userLocation.latitude,
            longitude: props.userLocation.longitude,
            radius: 10, // 10km radius
            limit: props.maxResults
          }
        })
        restaurants.value = response.data || []
      } catch (error) {
        console.error('Error fetching nearby restaurants:', error)
        notify('Không thể tải nhà hàng gần bạn. Vui lòng thử lại sau.', 'error')
      } finally {
        loading.value = false
      }
    }

    const viewRestaurantDetails = (restaurantId) => {
      router.push(`/restaurant/${restaurantId}`)
    }

    const formatDistance = (distance) => {
      if (distance < 1) {
        return `${(distance * 1000).toFixed(0)}m`
      }
      return `${distance.toFixed(1)}km`
    }

    const requestLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              address: 'Vị trí hiện tại của bạn'
            }
            emit('update-location', location)
          },
          (error) => {
            console.error('Geolocation error:', error)
            notify('Không thể lấy vị trí của bạn. Vui lòng cho phép truy cập vị trí.', 'error')
          }
        )
      } else {
        notify('Trình duyệt của bạn không hỗ trợ định vị.', 'error')
      }
    }

    // Watch for changes in user location
    watch(() => props.userLocation, (newLocation) => {
      if (newLocation.latitude && newLocation.longitude) {
        fetchNearbyRestaurants()
      }
    }, { deep: true })

    // Initial fetch if location is available
    onMounted(() => {
      if (props.userLocation.latitude && props.userLocation.longitude) {
        fetchNearbyRestaurants()
      }
    })

    const toggleFavorite = async (restaurant) => {
      try {
        if (!isLoggedIn.value) {
          router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath))
          return
        }
        
        await restaurantStore.toggleFavorite(restaurant.id)
        
        // Update local state
        restaurant.isFavorite = !restaurant.isFavorite
        
        notify(
          restaurant.isFavorite 
            ? `Đã thêm ${restaurant.name} vào danh sách yêu thích` 
            : `Đã xóa ${restaurant.name} khỏi danh sách yêu thích`, 
          'success'
        )
      } catch (error) {
        console.error('Error toggling favorite:', error)
        notify('Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại.', 'error')
      }
    }

    return {
      restaurants,
      loading,
      isLoggedIn,
      viewRestaurantDetails,
      formatDistance,
      requestLocation,
      toggleFavorite
    }
  }
}
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
.nearby-restaurants .v-col:nth-child(1) .restaurant-card { animation-delay: 0.1s; }
.nearby-restaurants .v-col:nth-child(2) .restaurant-card { animation-delay: 0.2s; }
.nearby-restaurants .v-col:nth-child(3) .restaurant-card { animation-delay: 0.3s; }
.nearby-restaurants .v-col:nth-child(4) .restaurant-card { animation-delay: 0.4s; }
</style>
