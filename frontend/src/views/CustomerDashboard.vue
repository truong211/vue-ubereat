<template>
  <v-container class="customer-dashboard">
    <!-- Welcome Section -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="welcome-card gradient-bg" color="primary">
          <v-card-text class="white--text">
            <div class="d-flex align-center">
              <v-avatar size="64" class="mr-4">
                <v-img
                  v-if="user.avatar"
                  :src="user.avatar"
                  alt="User avatar"
                ></v-img>
                <v-icon v-else size="32" color="white">mdi-account</v-icon>
              </v-avatar>
              
              <div class="flex-grow-1">
                <h2 class="text-h5 mb-1">Chào mừng trở lại!</h2>
                <h1 class="text-h4 font-weight-bold">{{ user.name || 'Khách hàng' }}</h1>
                <p class="mb-0 opacity-90">{{ user.email }}</p>
                
                <!-- Social Login Status -->
                <div class="mt-2 d-flex align-center gap-2" v-if="socialStatus.hasLinkedAccounts">
                  <v-chip 
                    v-if="socialStatus.google" 
                    size="small" 
                    color="white" 
                    text-color="primary"
                    prepend-icon="mdi-google"
                  >
                    Google
                  </v-chip>
                  <v-chip 
                    v-if="socialStatus.facebook" 
                    size="small" 
                    color="white" 
                    text-color="primary"
                    prepend-icon="mdi-facebook"
                  >
                    Facebook
                  </v-chip>
                </div>
              </div>
              
              <v-btn
                variant="outlined"
                color="white"
                size="large"
                prepend-icon="mdi-account-edit"
                @click="$router.push('/profile')"
              >
                Chỉnh sửa hồ sơ
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Stats -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="48" color="primary" class="mb-2">mdi-cart</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ userStats.totalOrders }}</h3>
            <p class="text-medium-emphasis">Đơn hàng</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="48" color="success" class="mb-2">mdi-currency-usd</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ formatCurrency(userStats.totalSpent) }}</h3>
            <p class="text-medium-emphasis">Tổng chi tiêu</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="48" color="warning" class="mb-2">mdi-star</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ userStats.favoriteRestaurants }}</h3>
            <p class="text-medium-emphasis">Nhà hàng yêu thích</p>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center">
          <v-card-text>
            <v-icon size="48" color="info" class="mb-2">mdi-percent</v-icon>
            <h3 class="text-h4 font-weight-bold">{{ userStats.loyaltyPoints }}</h3>
            <p class="text-medium-emphasis">Điểm tích lũy</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h2 class="text-h6 mb-4">Thao tác nhanh</h2>
        <div class="d-flex flex-wrap gap-3">
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-magnify"
            @click="$router.push('/restaurants')"
          >
            Tìm nhà hàng
          </v-btn>
          
          <v-btn
            color="secondary"
            variant="outlined"
            size="large"
            prepend-icon="mdi-history"
            @click="$router.push('/orders')"
          >
            Lịch sử đơn hàng
          </v-btn>
          
          <v-btn
            color="success"
            variant="outlined"
            size="large"
            prepend-icon="mdi-heart"
            @click="$router.push('/favorites')"
          >
            Món ăn yêu thích
          </v-btn>
          
          <v-btn
            color="info"
            variant="outlined"
            size="large"
            prepend-icon="mdi-map-marker"
            @click="$router.push('/profile?tab=addresses')"
          >
            Quản lý địa chỉ
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Recent Orders -->
    <v-row class="mb-6">
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-clock-outline</v-icon>
            Đơn hàng gần đây
          </v-card-title>
          
          <v-card-text v-if="recentOrders.length === 0">
            <div class="text-center py-8">
              <v-icon size="64" color="grey" class="mb-4">mdi-cart-outline</v-icon>
              <h3 class="text-h6 mb-2">Chưa có đơn hàng nào</h3>
              <p class="text-medium-emphasis mb-4">Bắt đầu đặt món ngay bây giờ!</p>
              <v-btn color="primary" @click="$router.push('/restaurants')">
                Khám phá nhà hàng
              </v-btn>
            </div>
          </v-card-text>
          
          <v-list v-else>
            <v-list-item
              v-for="order in recentOrders"
              :key="order.id"
              @click="$router.push(`/orders/${order.id}`)"
              class="cursor-pointer"
            >
              <template #prepend>
                <v-avatar>
                  <v-img
                    v-if="order.restaurant.image"
                    :src="order.restaurant.image"
                    :alt="order.restaurant.name"
                  ></v-img>
                  <v-icon v-else>mdi-store</v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title>{{ order.restaurant.name }}</v-list-item-title>
              <v-list-item-subtitle>
                {{ order.items.length }} món - {{ formatCurrency(order.total) }}
              </v-list-item-subtitle>
              
              <template #append>
                <div class="text-right">
                  <v-chip
                    :color="getStatusColor(order.status)"
                    size="small"
                    class="mb-1"
                  >
                    {{ getStatusText(order.status) }}
                  </v-chip>
                  <div class="text-caption text-medium-emphasis">
                    {{ formatDate(order.createdAt) }}
                  </div>
                </div>
              </template>
            </v-list-item>
          </v-list>
          
          <v-card-actions v-if="recentOrders.length > 0">
            <v-spacer></v-spacer>
            <v-btn text @click="$router.push('/orders')">
              Xem tất cả
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <!-- Account Security -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2">mdi-shield-check</v-icon>
            Bảo mật tài khoản
          </v-card-title>
          
          <v-card-text>
            <!-- Email Verification -->
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <h4>Email</h4>
                <p class="text-medium-emphasis mb-0">{{ user.email }}</p>
              </div>
              <v-icon 
                :color="user.isEmailVerified ? 'success' : 'warning'"
                :icon="user.isEmailVerified ? 'mdi-check-circle' : 'mdi-alert-circle'"
              ></v-icon>
            </div>
            
            <!-- Social Accounts -->
            <div class="mb-4">
              <h4 class="mb-2">Tài khoản liên kết</h4>
              <div v-if="!socialStatus.hasLinkedAccounts" class="text-medium-emphasis">
                Chưa liên kết tài khoản nào
              </div>
              <div v-else class="d-flex flex-column gap-2">
                <div v-if="socialStatus.google" class="d-flex align-center">
                  <v-icon color="error" class="mr-2">mdi-google</v-icon>
                  <span>Google</span>
                  <v-spacer></v-spacer>
                  <v-icon color="success">mdi-check</v-icon>
                </div>
                <div v-if="socialStatus.facebook" class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-facebook</v-icon>
                  <span>Facebook</span>
                  <v-spacer></v-spacer>
                  <v-icon color="success">mdi-check</v-icon>
                </div>
              </div>
            </div>
            
            <!-- Two-Factor Authentication -->
            <div class="d-flex align-center justify-space-between mb-4">
              <div>
                <h4>Xác thực 2 bước</h4>
                <p class="text-medium-emphasis mb-0">
                  {{ user.twoFactorEnabled ? 'Đã bật' : 'Chưa bật' }}
                </p>
              </div>
              <v-icon 
                :color="user.twoFactorEnabled ? 'success' : 'grey'"
                :icon="user.twoFactorEnabled ? 'mdi-check-circle' : 'mdi-circle-outline'"
              ></v-icon>
            </div>
          </v-card-text>
          
          <v-card-actions>
            <v-btn 
              color="primary" 
              variant="outlined" 
              block
              @click="$router.push('/profile?tab=settings')"
            >
              Cài đặt bảo mật
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { getLinkedAccounts } from '@/services/social-auth';

export default {
  name: 'CustomerDashboard',
  
  setup() {
    const store = useStore();
    const router = useRouter();
    
    // Reactive state
    const recentOrders = ref([]);
    const userStats = ref({
      totalOrders: 0,
      totalSpent: 0,
      favoriteRestaurants: 0,
      loyaltyPoints: 0
    });
    const socialStatus = ref({
      google: false,
      facebook: false,
      hasLinkedAccounts: false
    });
    
    // Computed
    const user = computed(() => store.getters['auth/user'] || {});
    
    // Methods
    const loadUserData = async () => {
      try {
        // Load user statistics
        // await store.dispatch('user/loadStats');
        
        // Load recent orders
        // const orders = await store.dispatch('orders/loadRecent');
        // recentOrders.value = orders;
        
        // Mock data for demonstration
        userStats.value = {
          totalOrders: 24,
          totalSpent: 2450000,
          favoriteRestaurants: 8,
          loyaltyPoints: 1250
        };
        
        recentOrders.value = [
          {
            id: 1,
            restaurant: {
              name: 'Phở Hà Nội',
              image: '/images/restaurants/pho-hanoi.jpg'
            },
            items: [{ name: 'Phở bò' }, { name: 'Chả cá' }],
            total: 85000,
            status: 'delivered',
            createdAt: new Date(Date.now() - 86400000) // 1 day ago
          },
          {
            id: 2,
            restaurant: {
              name: 'Pizza Palace',
              image: '/images/restaurants/pizza-palace.jpg'
            },
            items: [{ name: 'Pizza Margherita' }],
            total: 250000,
            status: 'preparing',
            createdAt: new Date(Date.now() - 3600000) // 1 hour ago
          }
        ];
        
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    };
    
    const loadSocialStatus = async () => {
      try {
        const linkedAccounts = await getLinkedAccounts();
        socialStatus.value = {
          google: linkedAccounts.some(acc => acc.provider === 'google'),
          facebook: linkedAccounts.some(acc => acc.provider === 'facebook'),
          hasLinkedAccounts: linkedAccounts.length > 0
        };
      } catch (error) {
        console.error('Failed to load social status:', error);
      }
    };
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };
    
    const formatDate = (date) => {
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(date));
    };
    
    const getStatusColor = (status) => {
      const colors = {
        pending: 'warning',
        confirmed: 'info', 
        preparing: 'primary',
        ready: 'success',
        delivering: 'info',
        delivered: 'success',
        cancelled: 'error'
      };
      return colors[status] || 'grey';
    };
    
    const getStatusText = (status) => {
      const texts = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        preparing: 'Đang chuẩn bị',
        ready: 'Sẵn sàng',
        delivering: 'Đang giao',
        delivered: 'Đã giao',
        cancelled: 'Đã hủy'
      };
      return texts[status] || 'Không xác định';
    };
    
    // Lifecycle
    onMounted(async () => {
      await loadUserData();
      await loadSocialStatus();
    });
    
    return {
      user,
      recentOrders,
      userStats,
      socialStatus,
      formatCurrency,
      formatDate,
      getStatusColor,
      getStatusText
    };
  }
};
</script>

<style scoped>
.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.cursor-pointer {
  cursor: pointer;
}

.welcome-card {
  overflow: hidden;
  position: relative;
}

.welcome-card::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  transform: translate(50%, -50%);
}
</style>