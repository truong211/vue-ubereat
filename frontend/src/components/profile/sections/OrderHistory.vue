<template>
  <div class="order-history">
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Lịch sử đơn hàng</span>
        
        <!-- Filters -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              variant="outlined"
              v-bind="props"
              prepend-icon="mdi-filter-variant"
              size="small"
            >
              Lọc
            </v-btn>
          </template>

          <v-card min-width="300">
            <v-card-text>
              <v-select
                v-model="filters.status"
                label="Trạng thái đơn hàng"
                :items="orderStatuses"
                item-title="text"
                item-value="value"
                clearable
                variant="outlined"
                density="comfortable"
                @update:modelValue="filterOrders"
              ></v-select>

              <v-select
                v-model="filters.timeRange"
                label="Thời gian"
                :items="timeRanges"
                item-title="text"
                item-value="value"
                clearable
                variant="outlined"
                density="comfortable"
                @update:modelValue="filterOrders"
              ></v-select>

              <div class="d-flex justify-end mt-2">
                <v-btn
                  variant="text"
                  @click="resetFilters"
                >
                  Đặt lại
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-menu>
      </v-card-title>

      <v-card-text>
        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-center my-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <!-- Error Alert -->
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>

        <!-- No Orders -->
        <v-card
          v-else-if="filteredOrders.length === 0"
          variant="outlined"
          class="text-center py-8 px-4"
        >
          <v-icon size="64" color="grey-lighten-1" icon="mdi-receipt-text-remove"></v-icon>
          <h3 class="text-h6 mt-4 mb-2">
            {{ orders.length === 0 ? 'Chưa có đơn hàng nào' : 'Không tìm thấy đơn hàng phù hợp' }}
          </h3>
          <p class="text-medium-emphasis">
            {{ orders.length === 0 ? 'Hãy đặt món ngay để thưởng thức những món ăn ngon!' : 'Thử thay đổi bộ lọc để tìm đơn hàng khác' }}
          </p>
        </v-card>

        <!-- Order List -->
        <div v-else>
          <v-card
            v-for="order in filteredOrders"
            :key="order.id"
            variant="outlined"
            class="mb-4"
          >
            <v-card-text>
              <!-- Order Header -->
              <div class="d-flex justify-space-between align-center mb-4">
                <div class="d-flex align-center">
                  <v-avatar size="40" class="mr-3">
                    <v-img
                      :src="order.restaurant.image || '/img/restaurant-placeholder.jpg'"
                      alt="Restaurant"
                    ></v-img>
                  </v-avatar>
                  <div>
                    <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ order.restaurant.name }}</h3>
                    <p class="text-caption text-medium-emphasis mb-0">{{ order.restaurant.address }}</p>
                  </div>
                </div>

                <v-chip
                  :color="getOrderStatusColor(order.status)"
                  size="small"
                >
                  {{ formatOrderStatus(order.status) }}
                </v-chip>
              </div>

              <!-- Order Items -->
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item
                  v-for="(item, index) in order.items"
                  :key="index"
                  class="px-0"
                >
                  <template v-slot:prepend>
                    <span class="text-body-2 mr-2">{{ item.quantity }}×</span>
                  </template>
                  <v-list-item-title class="text-body-2">
                    {{ item.name }}
                  </v-list-item-title>
                  <template v-slot:append>
                    <span class="text-body-2">{{ formatPrice(item.price * item.quantity) }}</span>
                  </template>
                </v-list-item>
              </v-list>

              <!-- Order Summary -->
              <v-divider class="my-3"></v-divider>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Tổng tiền món:</span>
                <span class="text-body-2">{{ formatPrice(order.subtotal) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Phí giao hàng:</span>
                <span class="text-body-2">{{ formatPrice(order.deliveryFee) }}</span>
              </div>
              <div v-if="order.discount" class="d-flex justify-space-between mb-2">
                <span class="text-body-2">Giảm giá:</span>
                <span class="text-body-2 text-error">-{{ formatPrice(order.discount) }}</span>
              </div>
              <div class="d-flex justify-space-between font-weight-bold">
                <span>Tổng cộng:</span>
                <span>{{ formatPrice(order.total) }}</span>
              </div>

              <!-- Actions -->
              <v-divider class="my-3"></v-divider>
              <div class="d-flex justify-space-between align-center">
                <div class="text-caption text-medium-emphasis">
                  {{ formatDate(order.createdAt) }}
                </div>
                <div class="d-flex gap-2">
                  <v-btn
                    v-if="canTrackOrder(order.status)"
                    variant="text"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-map-marker"
                    :to="`/orders/${order.id}/track`"
                  >
                    Theo dõi
                  </v-btn>
                  <v-btn
                    v-if="canReviewOrder(order.status) && !order.reviewed"
                    variant="text"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-star-outline"
                    @click="openReviewDialog(order)"
                  >
                    Đánh giá
                  </v-btn>
                  <v-btn
                    v-if="canReorderItems(order.status)"
                    variant="text"
                    color="primary"
                    size="small"
                    prepend-icon="mdi-repeat"
                    @click="reorderItems(order)"
                  >
                    Đặt lại
                  </v-btn>
                  <v-btn
                    v-if="canCancelOrder(order.status)"
                    variant="text"
                    color="error"
                    size="small"
                    prepend-icon="mdi-close"
                    @click="openCancelDialog(order)"
                  >
                    Hủy đơn
                  </v-btn>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Load More -->
          <div v-if="hasMoreOrders" class="text-center mt-4">
            <v-btn
              variant="outlined"
              :loading="loadingMore"
              @click="loadMoreOrders"
            >
              Xem thêm
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Review Dialog -->
    <v-dialog v-model="reviewDialog.show" max-width="500">
      <v-card>
        <v-card-title>Đánh giá đơn hàng</v-card-title>
        
        <v-card-text>
          <v-textarea
            v-model="reviewDialog.comment"
            label="Nhận xét của bạn"
            variant="outlined"
            counter="500"
            :rules="[v => !v || v.length <= 500 || 'Tối đa 500 ký tự']"
            rows="4"
            auto-grow
          ></v-textarea>
          
          <!-- Food Rating Section -->
          <h3 class="text-subtitle-1 font-weight-medium mb-2">Chất lượng món ăn</h3>
          <v-rating
            v-model="reviewDialog.foodRating"
            color="amber"
            hover
            length="5"
            size="small"
          ></v-rating>
          
          <!-- Delivery Rating Section -->
          <h3 class="text-subtitle-1 font-weight-medium mb-2">Dịch vụ giao hàng</h3>
          <v-rating
            v-model="reviewDialog.deliveryRating"
            color="amber"
            hover
            length="5"
            size="small"
          ></v-rating>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="reviewDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="reviewDialog.loading"
            :disabled="!isReviewValid"
            @click="submitReview"
          >
            Gửi đánh giá
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Cancel Order Dialog -->
    <v-dialog v-model="cancelDialog.show" max-width="400">
      <v-card>
        <v-card-title>Xác nhận hủy đơn</v-card-title>
        
        <v-card-text>
          <p class="mb-4">Bạn có chắc chắn muốn hủy đơn hàng này?</p>
          <v-select
            v-model="cancelDialog.reason"
            label="Lý do hủy đơn"
            :items="cancelReasons"
            variant="outlined"
            :rules="[v => !!v || 'Vui lòng chọn lý do hủy đơn']"
            required
          ></v-select>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="cancelDialog.show = false"
          >
            Không
          </v-btn>
          <v-btn
            color="error"
            :loading="cancelDialog.loading"
            :disabled="!cancelDialog.reason"
            @click="confirmCancelOrder"
          >
            Hủy đơn
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export default {
  name: 'OrderHistory',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    
    // State
    const loading = ref(true);
    const loadingMore = ref(false);
    const error = ref(null);
    const orders = ref([]);
    const page = ref(1);
    const perPage = ref(10);
    const hasMoreOrders = ref(false);
    
    // Filters
    const filters = reactive({
      status: null,
      timeRange: null
    });
    
    // Options
    const orderStatuses = [
      { text: 'Đang xử lý', value: 'pending' },
      { text: 'Đang chuẩn bị', value: 'preparing' },
      { text: 'Đang giao', value: 'delivering' },
      { text: 'Đã giao', value: 'delivered' },
      { text: 'Đã hủy', value: 'cancelled' }
    ];
    
    const timeRanges = [
      { text: '7 ngày qua', value: '7days' },
      { text: '30 ngày qua', value: '30days' },
      { text: '3 tháng qua', value: '3months' },
      { text: '6 tháng qua', value: '6months' }
    ];
    
    const cancelReasons = [
      'Thay đổi địa chỉ giao hàng',
      'Thời gian giao hàng quá lâu',
      'Muốn thay đổi món',
      'Đặt nhầm món',
      'Lý do khác'
    ];
    
    // Dialogs
    const reviewDialog = reactive({
      show: false,
      orderId: null,
      comment: '',
      foodRating: 5,
      deliveryRating: 5,
      loading: false
    });
    
    const cancelDialog = reactive({
      show: false,
      orderId: null,
      reason: '',
      loading: false
    });
    
    // Computed
    const filteredOrders = computed(() => {
      let result = [...orders.value];
      
      if (filters.status) {
        result = result.filter(order => order.status === filters.status);
      }
      
      if (filters.timeRange) {
        const now = new Date();
        let cutoff = new Date();
        
        switch (filters.timeRange) {
          case '7days':
            cutoff.setDate(now.getDate() - 7);
            break;
          case '30days':
            cutoff.setDate(now.getDate() - 30);
            break;
          case '3months':
            cutoff.setMonth(now.getMonth() - 3);
            break;
          case '6months':
            cutoff.setMonth(now.getMonth() - 6);
            break;
        }
        
        result = result.filter(order => new Date(order.createdAt) >= cutoff);
      }
      
      return result;
    });
    
    const isReviewValid = computed(() => {
      return reviewDialog.foodRating > 0 && reviewDialog.deliveryRating > 0;
    });
    
    // Methods
    const fetchOrders = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await store.dispatch('user/fetchOrders', {
          page: page.value,
          limit: perPage.value
        });
        
        orders.value = response?.data || [];
        hasMoreOrders.value = response?.meta?.hasNextPage || false;
      } catch (err) {
        console.error('Error fetching orders:', err);
        error.value = 'Không thể tải lịch sử đơn hàng';
      } finally {
        loading.value = false;
      }
    };
    
    const loadMoreOrders = async () => {
      if (loadingMore.value) return;
      
      loadingMore.value = true;
      
      try {
        page.value++;
        
        const response = await store.dispatch('user/fetchOrders', {
          page: page.value,
          limit: perPage.value
        });
        
        const newOrders = response?.data || [];
        orders.value = [...orders.value, ...newOrders];
        hasMoreOrders.value = response?.meta?.hasNextPage || false;
      } catch (err) {
        console.error('Error loading more orders:', err);
        toast.error('Không thể tải thêm đơn hàng');
      } finally {
        loadingMore.value = false;
      }
    };
    
    const filterOrders = () => {
      // Filtering is handled by the computed property
    };
    
    const resetFilters = () => {
      filters.status = null;
      filters.timeRange = null;
    };
    
    // Order Actions
    const canTrackOrder = (status) => {
      return ['preparing', 'delivering'].includes(status);
    };
    
    const canReviewOrder = (status) => {
      return status === 'delivered';
    };
    
    const canReorderItems = (status) => {
      return ['delivered', 'cancelled'].includes(status);
    };
    
    const canCancelOrder = (status) => {
      return ['pending', 'preparing'].includes(status);
    };
    
    const openReviewDialog = (order) => {
      reviewDialog.orderId = order.id;
      reviewDialog.comment = '';
      reviewDialog.foodRating = 5;
      reviewDialog.deliveryRating = 5;
      reviewDialog.show = true;
    };
    
    const submitReview = async () => {
      if (!isReviewValid.value) return;
      
      reviewDialog.loading = true;
      
      try {
        await store.dispatch('user/submitOrderReview', {
          orderId: reviewDialog.orderId,
          comment: reviewDialog.comment,
          foodRating: reviewDialog.foodRating,
          deliveryRating: reviewDialog.deliveryRating
        });
        
        // Update local state
        const orderIndex = orders.value.findIndex(o => o.id === reviewDialog.orderId);
        if (orderIndex !== -1) {
          orders.value[orderIndex].reviewed = true;
        }
        
        reviewDialog.show = false;
        toast.success('Cảm ơn bạn đã đánh giá!');
      } catch (err) {
        console.error('Error submitting review:', err);
        toast.error('Không thể gửi đánh giá');
      } finally {
        reviewDialog.loading = false;
      }
    };
    
    const openCancelDialog = (order) => {
      cancelDialog.orderId = order.id;
      cancelDialog.reason = '';
      cancelDialog.show = true;
    };
    
    const confirmCancelOrder = async () => {
      if (!cancelDialog.reason) return;
      
      cancelDialog.loading = true;
      
      try {
        await store.dispatch('user/cancelOrder', {
          orderId: cancelDialog.orderId,
          reason: cancelDialog.reason
        });
        
        // Update local state
        const orderIndex = orders.value.findIndex(o => o.id === cancelDialog.orderId);
        if (orderIndex !== -1) {
          orders.value[orderIndex].status = 'cancelled';
        }
        
        cancelDialog.show = false;
        toast.success('Đã hủy đơn hàng');
      } catch (err) {
        console.error('Error cancelling order:', err);
        toast.error('Không thể hủy đơn hàng');
      } finally {
        cancelDialog.loading = false;
      }
    };
    
    const reorderItems = async (order) => {
      try {
        await store.dispatch('cart/reorderItems', {
          items: order.items
        });
        
        toast.success('Đã thêm món vào giỏ hàng');
      } catch (err) {
        console.error('Error reordering items:', err);
        toast.error('Không thể thêm món vào giỏ hàng');
      }
    };
    
    // Helpers
    const formatDate = (date) => {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
    };
    
    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    };
    
    const getOrderStatusColor = (status) => {
      const colors = {
        pending: 'warning',
        preparing: 'info',
        delivering: 'primary',
        delivered: 'success',
        cancelled: 'error'
      };
      return colors[status] || 'grey';
    };
    
    const formatOrderStatus = (status) => {
      const statuses = {
        pending: 'Đang xử lý',
        preparing: 'Đang chuẩn bị',
        delivering: 'Đang giao',
        delivered: 'Đã giao',
        cancelled: 'Đã hủy'
      };
      return statuses[status] || status;
    };
    
    onMounted(fetchOrders);
    
    return {
      loading,
      loadingMore,
      error,
      orders,
      filters,
      orderStatuses,
      timeRanges,
      cancelReasons,
      reviewDialog,
      cancelDialog,
      filteredOrders,
      hasMoreOrders,
      isReviewValid,
      filterOrders,
      resetFilters,
      loadMoreOrders,
      canTrackOrder,
      canReviewOrder,
      canReorderItems,
      canCancelOrder,
      openReviewDialog,
      submitReview,
      openCancelDialog,
      confirmCancelOrder,
      reorderItems,
      formatDate,
      formatPrice,
      getOrderStatusColor,
      formatOrderStatus
    };
  }
};
</script>