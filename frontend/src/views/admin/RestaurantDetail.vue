<template>
  <v-container fluid>
    <div v-if="loading" class="d-flex justify-center align-center" style="height: 400px;">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <template v-else-if="restaurant">
      <!-- Header with restaurant info -->
      <v-card class="mb-6">
        <v-img
          :src="restaurant.coverImage || '/img/restaurant-cover-placeholder.jpg'"
          height="200"
          cover
          class="restaurant-cover"
        >
          <template v-slot:placeholder>
            <v-row class="fill-height ma-0" align="center" justify="center">
              <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
            </v-row>
          </template>
        </v-img>

        <v-card-text class="pb-0">
          <div class="d-flex flex-wrap">
            <v-avatar size="120" class="mt-n10 border-avatar">
              <v-img :src="restaurant.logo || '/img/restaurant-placeholder.jpg'" cover></v-img>
            </v-avatar>

            <div class="ml-4 flex-grow-1">
              <div class="d-flex align-center flex-wrap">
                <h1 class="text-h4 mr-2">{{ restaurant.name }}</h1>
                <v-chip
                  :color="getStatusColor(restaurant.status)"
                  class="mr-2"
                >
                  {{ formatStatus(restaurant.status) }}
                </v-chip>
                <v-rating
                  :model-value="restaurant.rating || 0"
                  color="amber"
                  half-increments
                  readonly
                  size="small"
                  class="mr-2"
                ></v-rating>
                <span class="text-subtitle-1">({{ restaurant.reviewCount || 0 }} đánh giá)</span>
              </div>

              <div class="text-subtitle-1 mt-1">{{ restaurant.cuisine }}</div>
              <div class="text-body-1 mt-1">
                <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                {{ restaurant.address }}
              </div>
            </div>

            <div class="d-flex align-center">
              <v-btn
                v-if="restaurant.status === 'pending'"
                color="success"
                class="mr-2"
                @click="approveRestaurant"
              >
                Phê duyệt
              </v-btn>

              <v-btn
                v-if="restaurant.status === 'pending'"
                color="error"
                class="mr-2"
                @click="rejectRestaurant"
              >
                Từ chối
              </v-btn>

              <v-btn
                v-if="restaurant.status === 'active'"
                color="warning"
                class="mr-2"
                @click="suspendRestaurant"
              >
                Tạm ngưng
              </v-btn>

              <v-btn
                v-if="restaurant.status === 'suspended'"
                color="success"
                class="mr-2"
                @click="activateRestaurant"
              >
                Kích hoạt
              </v-btn>

              <v-btn
                color="primary"
                class="mr-2"
                @click="editRestaurant"
              >
                Chỉnh sửa
              </v-btn>
            </div>
          </div>
        </v-card-text>

        <v-tabs v-model="activeTab" class="mt-4">
          <v-tab value="overview">Tổng quan</v-tab>
          <v-tab value="menu">Thực đơn</v-tab>
          <v-tab value="orders">Đơn hàng</v-tab>
          <v-tab value="reviews">Đánh giá</v-tab>
          <v-tab value="settings">Cài đặt</v-tab>
        </v-tabs>
      </v-card>

      <!-- Tab Content -->
      <v-window v-model="activeTab">
        <!-- Overview Tab -->
        <v-window-item value="overview">
          <v-row>
            <!-- Stats Cards -->
            <v-col cols="12" md="3">
              <v-card class="mb-4">
                <v-card-text class="text-center">
                  <div class="text-h4 font-weight-bold">{{ restaurant.totalOrders || 0 }}</div>
                  <div class="text-subtitle-1">Tổng đơn hàng</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="3">
              <v-card class="mb-4">
                <v-card-text class="text-center">
                  <div class="text-h4 font-weight-bold">{{ formatPrice(restaurant.totalRevenue || 0) }}</div>
                  <div class="text-subtitle-1">Doanh thu</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="3">
              <v-card class="mb-4">
                <v-card-text class="text-center">
                  <div class="text-h4 font-weight-bold">{{ restaurant.rating || 0 }}/5</div>
                  <div class="text-subtitle-1">Đánh giá trung bình</div>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="3">
              <v-card class="mb-4">
                <v-card-text class="text-center">
                  <div class="text-h4 font-weight-bold">{{ restaurant.totalProducts || 0 }}</div>
                  <div class="text-subtitle-1">Số món ăn</div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Restaurant Info -->
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title>Thông tin nhà hàng</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-account</v-icon>
                      </template>
                      <v-list-item-title>Chủ nhà hàng</v-list-item-title>
                      <v-list-item-subtitle>{{ restaurant.ownerName }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-email</v-icon>
                      </template>
                      <v-list-item-title>Email</v-list-item-title>
                      <v-list-item-subtitle>{{ restaurant.email }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-phone</v-icon>
                      </template>
                      <v-list-item-title>Số điện thoại</v-list-item-title>
                      <v-list-item-subtitle>{{ restaurant.phone }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-map-marker</v-icon>
                      </template>
                      <v-list-item-title>Địa chỉ</v-list-item-title>
                      <v-list-item-subtitle>{{ restaurant.address }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-food</v-icon>
                      </template>
                      <v-list-item-title>Loại ẩm thực</v-list-item-title>
                      <v-list-item-subtitle>{{ restaurant.cuisine }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-currency-usd</v-icon>
                      </template>
                      <v-list-item-title>Mức giá</v-list-item-title>
                      <v-list-item-subtitle>{{ restaurant.priceRange }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-calendar</v-icon>
                      </template>
                      <v-list-item-title>Ngày tham gia</v-list-item-title>
                      <v-list-item-subtitle>{{ formatDate(restaurant.createdAt) }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Recent Orders -->
            <v-col cols="12" md="6">
              <v-card>
                <v-card-title class="d-flex justify-space-between align-center">
                  <span>Đơn hàng gần đây</span>
                  <v-btn
                    variant="text"
                    color="primary"
                    @click="activeTab = 'orders'"
                  >
                    Xem tất cả
                  </v-btn>
                </v-card-title>
                <v-card-text class="pa-0">
                  <v-list v-if="recentOrders.length > 0">
                    <v-list-item
                      v-for="order in recentOrders"
                      :key="order.id"
                      :to="`/admin/orders/${order.id}`"
                    >
                      <template v-slot:prepend>
                        <v-avatar color="grey-lighten-3" size="36">
                          <span class="text-caption">#{{ order.orderNumber }}</span>
                        </v-avatar>
                      </template>

                      <v-list-item-title>{{ order.customerName }}</v-list-item-title>
                      <v-list-item-subtitle>{{ formatDate(order.createdAt) }}</v-list-item-subtitle>

                      <template v-slot:append>
                        <div class="d-flex align-center">
                          <v-chip
                            :color="getOrderStatusColor(order.status)"
                            size="small"
                            class="mr-2"
                          >
                            {{ formatOrderStatus(order.status) }}
                          </v-chip>
                          <span class="font-weight-bold">{{ formatPrice(order.totalAmount) }}</span>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                  <div v-else class="pa-4 text-center">
                    <v-icon size="large" color="grey-lighten-1">mdi-receipt-text-outline</v-icon>
                    <div class="text-body-1 mt-2">Chưa có đơn hàng nào</div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Menu Tab -->
        <v-window-item value="menu">
          <restaurant-menu-management :restaurant-id="restaurantId" />
        </v-window-item>

        <!-- Orders Tab -->
        <v-window-item value="orders">
          <restaurant-orders :restaurant-id="restaurantId" />
        </v-window-item>

        <!-- Reviews Tab -->
        <v-window-item value="reviews">
          <restaurant-reviews :restaurant-id="restaurantId" />
        </v-window-item>

        <!-- Settings Tab -->
        <v-window-item value="settings">
          <restaurant-settings :restaurant="restaurant" @updated="loadRestaurantData" />
        </v-window-item>
      </v-window>
    </template>

    <div v-else-if="!loading" class="text-center py-12">
      <v-icon size="64" color="grey-lighten-1">mdi-store-off</v-icon>
      <h2 class="text-h5 mt-4">Không tìm thấy nhà hàng</h2>
      <p class="text-body-1 mt-2">Nhà hàng không tồn tại hoặc đã bị xóa</p>
      <v-btn color="primary" class="mt-4" to="/admin/restaurants">
        Quay lại danh sách nhà hàng
      </v-btn>
    </div>

    <!-- Confirm Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="400">
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmDialog.show = false">Hủy</v-btn>
          <v-btn :color="confirmDialog.color" @click="confirmDialog.action">Xác nhận</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Restaurant Dialog -->
    <v-dialog v-model="editDialog.show" max-width="800">
      <v-card>
        <v-card-title>
          Chỉnh sửa nhà hàng
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="editDialog.show = false"></v-btn>
        </v-card-title>

        <v-card-text>
          <v-form ref="restaurantForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.restaurant.name"
                  label="Tên nhà hàng"
                  variant="outlined"
                  :rules="[v => !!v || 'Tên nhà hàng là bắt buộc']"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="editDialog.restaurant.cuisine"
                  :items="cuisineTypes"
                  label="Loại ẩm thực"
                  variant="outlined"
                  :rules="[v => !!v || 'Loại ẩm thực là bắt buộc']"
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.restaurant.email"
                  label="Email"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Email là bắt buộc',
                    v => /.+@.+\..+/.test(v) || 'Email không hợp lệ'
                  ]"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="editDialog.restaurant.phone"
                  label="Số điện thoại"
                  variant="outlined"
                  :rules="[v => !!v || 'Số điện thoại là bắt buộc']"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="editDialog.restaurant.address"
                  label="Địa chỉ"
                  variant="outlined"
                  :rules="[v => !!v || 'Địa chỉ là bắt buộc']"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="editDialog.restaurant.priceRange"
                  :items="priceRangeOptions"
                  label="Mức giá"
                  variant="outlined"
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-select
                  v-model="editDialog.restaurant.status"
                  :items="statusOptions"
                  label="Trạng thái"
                  variant="outlined"
                ></v-select>
              </v-col>

              <v-col cols="12" md="6">
                <v-file-input
                  v-model="editDialog.restaurant.logoFile"
                  label="Logo nhà hàng"
                  accept="image/*"
                  variant="outlined"
                  prepend-icon="mdi-camera"
                ></v-file-input>
              </v-col>

              <v-col cols="12" md="6">
                <v-file-input
                  v-model="editDialog.restaurant.coverImageFile"
                  label="Ảnh bìa"
                  accept="image/*"
                  variant="outlined"
                  prepend-icon="mdi-image"
                ></v-file-input>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="editDialog.restaurant.description"
                  label="Mô tả"
                  variant="outlined"
                  rows="3"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editDialog.show = false">Hủy</v-btn>
          <v-btn color="primary" @click="saveRestaurant">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { adminAPI } from '@/services/api.service'

// Import components (these will be created later)
import RestaurantMenuManagement from '@/components/admin/restaurant/RestaurantMenuManagement.vue'
import RestaurantOrders from '@/components/admin/restaurant/RestaurantOrders.vue'
import RestaurantReviews from '@/components/admin/restaurant/RestaurantReviews.vue'
import RestaurantSettings from '@/components/admin/restaurant/RestaurantSettings.vue'

export default {
  name: 'RestaurantDetail',
  
  components: {
    RestaurantMenuManagement,
    RestaurantOrders,
    RestaurantReviews,
    RestaurantSettings
  },
  
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const toast = useToast()
    
    // State
    const loading = ref(true)
    const restaurant = ref(null)
    const activeTab = ref('overview')
    const recentOrders = ref([])
    const restaurantId = computed(() => route.params.id)
    
    // Dialog states
    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      action: null,
      color: 'primary'
    })
    
    const editDialog = ref({
      show: false,
      restaurant: null
    })
    
    // Options
    const cuisineTypes = [
      'Italian',
      'Chinese',
      'Mexican',
      'Japanese',
      'Thai',
      'Vietnamese',
      'Indian',
      'American',
      'French',
      'Korean',
      'Other'
    ]
    
    const statusOptions = [
      { title: 'Hoạt động', value: 'active' },
      { title: 'Đang chờ duyệt', value: 'pending' },
      { title: 'Tạm ngưng', value: 'suspended' }
    ]
    
    const priceRangeOptions = [
      { title: '$', value: '$' },
      { title: '$$', value: '$$' },
      { title: '$$$', value: '$$$' },
      { title: '$$$$', value: '$$$$' }
    ]
    
    // Methods
    const loadRestaurantData = async () => {
      loading.value = true
      try {
        const response = await adminAPI.getRestaurantById(restaurantId.value)
        restaurant.value = response.data.restaurant
        
        // Load recent orders
        const ordersResponse = await adminAPI.getRestaurantOrders(restaurantId.value, { limit: 5 })
        recentOrders.value = ordersResponse.data.orders
      } catch (error) {
        toast.error('Không thể tải thông tin nhà hàng')
        console.error('Failed to load restaurant data:', error)
      } finally {
        loading.value = false
      }
    }
    
    const editRestaurant = () => {
      editDialog.value = {
        show: true,
        restaurant: { 
          ...restaurant.value,
          logoFile: null,
          coverImageFile: null
        }
      }
    }
    
    const saveRestaurant = async () => {
      try {
        const formData = new FormData()
        const restaurantData = editDialog.value.restaurant
        
        // Add all text fields
        for (const key in restaurantData) {
          if (!['logoFile', 'coverImageFile', 'logo', 'coverImage'].includes(key) && 
              restaurantData[key] !== null) {
            formData.append(key, restaurantData[key])
          }
        }
        
        // Add logo file if provided
        if (restaurantData.logoFile) {
          formData.append('logo', restaurantData.logoFile)
        }
        
        // Add cover image file if provided
        if (restaurantData.coverImageFile) {
          formData.append('coverImage', restaurantData.coverImageFile)
        }
        
        await adminAPI.updateRestaurant(restaurantId.value, formData)
        toast.success('Cập nhật nhà hàng thành công')
        
        editDialog.value.show = false
        loadRestaurantData()
      } catch (error) {
        toast.error('Không thể cập nhật nhà hàng')
        console.error('Failed to save restaurant:', error)
      }
    }
    
    const approveRestaurant = () => {
      confirmDialog.value = {
        show: true,
        title: 'Phê duyệt nhà hàng',
        message: `Bạn có chắc chắn muốn phê duyệt nhà hàng ${restaurant.value.name}?`,
        action: confirmApproveRestaurant,
        color: 'success'
      }
    }
    
    const confirmApproveRestaurant = async () => {
      try {
        await adminAPI.approveRestaurant(restaurantId.value)
        toast.success('Phê duyệt nhà hàng thành công')
        confirmDialog.value.show = false
        loadRestaurantData()
      } catch (error) {
        toast.error('Không thể phê duyệt nhà hàng')
        console.error('Failed to approve restaurant:', error)
      }
    }
    
    const rejectRestaurant = () => {
      confirmDialog.value = {
        show: true,
        title: 'Từ chối nhà hàng',
        message: `Bạn có chắc chắn muốn từ chối nhà hàng ${restaurant.value.name}?`,
        action: confirmRejectRestaurant,
        color: 'error'
      }
    }
    
    const confirmRejectRestaurant = async () => {
      try {
        await adminAPI.rejectRestaurant(restaurantId.value)
        toast.success('Từ chối nhà hàng thành công')
        confirmDialog.value.show = false
        loadRestaurantData()
      } catch (error) {
        toast.error('Không thể từ chối nhà hàng')
        console.error('Failed to reject restaurant:', error)
      }
    }
    
    const suspendRestaurant = () => {
      confirmDialog.value = {
        show: true,
        title: 'Tạm ngưng nhà hàng',
        message: `Bạn có chắc chắn muốn tạm ngưng hoạt động của nhà hàng ${restaurant.value.name}?`,
        action: confirmSuspendRestaurant,
        color: 'warning'
      }
    }
    
    const confirmSuspendRestaurant = async () => {
      try {
        await adminAPI.updateRestaurant(restaurantId.value, { status: 'suspended' })
        toast.success('Tạm ngưng nhà hàng thành công')
        confirmDialog.value.show = false
        loadRestaurantData()
      } catch (error) {
        toast.error('Không thể tạm ngưng nhà hàng')
        console.error('Failed to suspend restaurant:', error)
      }
    }
    
    const activateRestaurant = () => {
      confirmDialog.value = {
        show: true,
        title: 'Kích hoạt nhà hàng',
        message: `Bạn có chắc chắn muốn kích hoạt nhà hàng ${restaurant.value.name}?`,
        action: confirmActivateRestaurant,
        color: 'success'
      }
    }
    
    const confirmActivateRestaurant = async () => {
      try {
        await adminAPI.updateRestaurant(restaurantId.value, { status: 'active' })
        toast.success('Kích hoạt nhà hàng thành công')
        confirmDialog.value.show = false
        loadRestaurantData()
      } catch (error) {
        toast.error('Không thể kích hoạt nhà hàng')
        console.error('Failed to activate restaurant:', error)
      }
    }
    
    // Utility functions
    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'success'
        case 'suspended': return 'error'
        case 'pending': return 'warning'
        default: return 'grey'
      }
    }
    
    const formatStatus = (status) => {
      const statusMap = {
        active: 'Hoạt động',
        suspended: 'Tạm ngưng',
        pending: 'Đang chờ duyệt'
      }
      return statusMap[status] || status
    }
    
    const getOrderStatusColor = (status) => {
      switch (status) {
        case 'completed': return 'success'
        case 'processing': return 'info'
        case 'pending': return 'warning'
        case 'cancelled': return 'error'
        default: return 'grey'
      }
    }
    
    const formatOrderStatus = (status) => {
      const statusMap = {
        completed: 'Hoàn thành',
        processing: 'Đang xử lý',
        pending: 'Chờ xác nhận',
        cancelled: 'Đã hủy'
      }
      return statusMap[status] || status
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
    }
    
    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }
    
    // Initialize
    onMounted(() => {
      loadRestaurantData()
    })
    
    return {
      loading,
      restaurant,
      restaurantId,
      activeTab,
      recentOrders,
      confirmDialog,
      editDialog,
      cuisineTypes,
      statusOptions,
      priceRangeOptions,
      loadRestaurantData,
      editRestaurant,
      saveRestaurant,
      approveRestaurant,
      rejectRestaurant,
      suspendRestaurant,
      activateRestaurant,
      getStatusColor,
      formatStatus,
      getOrderStatusColor,
      formatOrderStatus,
      formatDate,
      formatPrice
    }
  }
}
</script>

<style scoped>
.border-avatar {
  border: 4px solid white;
}

.restaurant-cover {
  position: relative;
}

.restaurant-cover::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
}
</style>
