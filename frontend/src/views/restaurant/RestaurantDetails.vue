<template>
  <div class="restaurant-details">
    <v-container>
      <!-- Loading State -->
      <div v-if="loading" class="d-flex justify-center my-8">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>

      <template v-else-if="restaurant">
        <!-- Restaurant Header -->
        <v-row class="mb-6">
          <v-col cols="12" md="8">
            <div class="d-flex align-center mb-2">
              <v-btn icon variant="text" @click="goBack" class="mr-2">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <h1 class="text-h4">{{ restaurant.name }}</h1>
              <v-btn icon variant="text" @click="toggleFavorite" class="ml-2">
                <v-icon :color="restaurant.isFavorite ? 'red' : ''">
                  {{ restaurant.isFavorite ? 'mdi-heart' : 'mdi-heart-outline' }}
                </v-icon>
              </v-btn>
            </div>
            
            <div class="d-flex flex-wrap align-center mb-3">
              <v-rating
                :model-value="restaurant.rating"
                color="amber"
                density="compact"
                size="small"
                readonly
                half-increments
                class="mr-2"
              ></v-rating>
              <span class="text-body-2 mr-3">{{ restaurant.rating.toFixed(1) }} ({{ restaurant.reviewCount }})</span>
              
              <v-chip size="small" class="mr-2">
                <v-icon size="small" start>mdi-clock-outline</v-icon>
                {{ restaurant.deliveryTime }} phút
              </v-chip>
              
              <v-chip v-if="restaurant.distance" size="small" class="mr-2">
                <v-icon size="small" start>mdi-map-marker</v-icon>
                {{ formatDistance(restaurant.distance) }}
              </v-chip>
              
              <v-chip
                :color="restaurant.isOpen ? 'success' : 'error'"
                size="small"
                class="mr-2"
              >
                {{ restaurant.isOpen ? 'Mở cửa' : 'Đóng cửa' }}
              </v-chip>
            </div>
            
            <p class="text-body-1 mb-4">{{ restaurant.description }}</p>
            
            <div class="d-flex flex-wrap">
              <v-chip
                v-for="(cuisine, index) in restaurant.cuisines"
                :key="index"
                class="mr-2 mb-2"
                size="small"
                variant="outlined"
              >
                {{ cuisine }}
              </v-chip>
            </div>
          </v-col>
          
          <v-col cols="12" md="4">
            <v-card elevation="2" class="h-100">
              <v-img
                :src="restaurant.image"
                height="200"
                cover
                class="restaurant-image"
              ></v-img>
            </v-card>
          </v-col>
        </v-row>

        <!-- Action Buttons -->
        <v-row class="mb-8">
          <v-col cols="12">
            <v-card>
              <v-card-text>
                <v-row>
                  <v-col cols="6" sm="3">
                    <v-btn
                      block
                      color="primary"
                      variant="elevated"
                      :to="`/restaurant/${restaurantId}/menu`"
                      prepend-icon="mdi-food-fork-drink"
                    >
                      Xem thực đơn
                    </v-btn>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-btn
                      block
                      variant="tonal"
                      :to="`/restaurant/${restaurantId}/reviews`"
                      prepend-icon="mdi-star"
                    >
                      Đánh giá
                    </v-btn>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-btn
                      block
                      variant="tonal"
                      @click="shareRestaurant"
                      prepend-icon="mdi-share-variant"
                    >
                      Chia sẻ
                    </v-btn>
                  </v-col>
                  <v-col cols="6" sm="3">
                    <v-btn
                      block
                      variant="tonal"
                      @click="reportRestaurant"
                      prepend-icon="mdi-flag"
                    >
                      Báo cáo
                    </v-btn>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Basic Info Card -->
        <v-row>
          <v-col cols="12">
            <v-card>
              <v-card-title class="text-h6">
                <v-icon start class="mr-2">mdi-information-outline</v-icon>
                Thông tin nhà hàng
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="d-flex mb-3">
                      <v-icon class="mr-3 text-primary">mdi-map-marker</v-icon>
                      <div>
                        <div class="font-weight-bold mb-1">Địa chỉ</div>
                        <div>{{ restaurant.address }}</div>
                      </div>
                    </div>

                    <div class="d-flex mb-3">
                      <v-icon class="mr-3 text-primary">mdi-phone</v-icon>
                      <div>
                        <div class="font-weight-bold mb-1">Số điện thoại</div>
                        <div>{{ restaurant.phone }}</div>
                      </div>
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <div class="d-flex mb-3">
                      <v-icon class="mr-3 text-primary">mdi-clock-outline</v-icon>
                      <div>
                        <div class="font-weight-bold mb-1">Giờ mở cửa</div>
                        <div>{{ restaurant.openingHours }}</div>
                      </div>
                    </div>

                    <div class="d-flex">
                      <v-icon class="mr-3 text-primary">mdi-currency-usd</v-icon>
                      <div>
                        <div class="font-weight-bold mb-1">Mức giá</div>
                        <div>{{ getPriceRange(restaurant.priceLevel) }}</div>
                      </div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- Reviews Section -->
        <section id="reviews" class="mt-8">
          <v-container>
            <ReviewComponentVi
              :restaurantId="restaurantId"
              @review-submitted="handleReviewSubmitted"
            />
          </v-container>
        </section>
      </template>

      <!-- Not Found State -->
      <div v-else class="text-center my-8">
        <v-icon size="64" color="grey-lighten-1">mdi-alert-circle-outline</v-icon>
        <h2 class="text-h5 mt-4">Không tìm thấy nhà hàng</h2>
        <p class="mt-2">Nhà hàng bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
        <v-btn color="primary" class="mt-4" to="/">Quay lại trang chủ</v-btn>
      </div>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useNotification } from '@/composables/useNotification'
import ReviewComponentVi from '@/components/review/ReviewComponentVi.vue'
import restaurantService from '@/services/restaurant.service'

const route = useRoute()
const router = useRouter()
const store = useStore()
const { notify } = useNotification()

// State
const loading = ref(true)
const restaurant = ref(null)
const restaurantId = ref(null)

// Fetch restaurant details
const fetchRestaurantDetails = async () => {
  loading.value = true
  try {
    restaurantId.value = parseInt(route.params.id)
    const response = await restaurantService.getRestaurantById(restaurantId.value)
    restaurant.value = response.data
  } catch (error) {
    console.error('Error fetching restaurant details:', error)
    notify('Không thể tải thông tin nhà hàng. Vui lòng thử lại sau.', 'error')
  } finally {
    loading.value = false
  }
}

// Format distance
const formatDistance = (distance) => {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)}m`
  }
  return `${distance.toFixed(1)}km`
}

// Get price range
const getPriceRange = (priceLevel) => {
  const levels = {
    1: 'Rẻ (dưới 50,000đ)',
    2: 'Vừa phải (50,000đ - 150,000đ)',
    3: 'Cao cấp (150,000đ - 300,000đ)',
    4: 'Đắt đỏ (trên 300,000đ)'
  }
  
  return levels[priceLevel] || 'Không có thông tin'
}

// Toggle favorite
const toggleFavorite = async () => {
  try {
    await restaurantService.toggleFavorite(restaurantId.value)
    restaurant.value.isFavorite = !restaurant.value.isFavorite
    const message = restaurant.value.isFavorite 
      ? 'Đã thêm nhà hàng vào danh sách yêu thích' 
      : 'Đã xóa nhà hàng khỏi danh sách yêu thích'
    notify(message, 'success')
  } catch (error) {
    console.error('Error toggling favorite:', error)
    notify('Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại.', 'error')
  }
}

// Share restaurant
const shareRestaurant = () => {
  // Share functionality would be implemented here
  notify('Tính năng chia sẻ sẽ được triển khai trong tương lai', 'info')
}

// Report restaurant
const reportRestaurant = () => {
  // Report functionality would be implemented here
  notify('Tính năng báo cáo sẽ được triển khai trong tương lai', 'info')
}

// Navigate back
const goBack = () => {
  router.go(-1)
}

// Handle new review submission
const handleReviewSubmitted = () => {
  // Refresh restaurant data to update rating
  fetchRestaurantDetails()
}

// Fetch data when component is mounted
onMounted(() => {
  fetchRestaurantDetails()
})
</script>

<style scoped>
.restaurant-details {
  padding-bottom: 60px;
}

.restaurant-image {
  border-radius: 8px;
  transition: transform 0.3s ease;
}

.restaurant-image:hover {
  transform: scale(1.02);
}
</style>