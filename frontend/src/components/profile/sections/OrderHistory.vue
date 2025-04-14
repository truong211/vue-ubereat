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
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-4">Đang tải đơn hàng...</p>
        </div>

        <div v-else-if="error" class="text-center py-8">
          <v-icon size="48" color="error" class="mb-4">mdi-alert-circle</v-icon>
          <p class="text-body-1">{{ error }}</p>
          <v-btn color="primary" class="mt-4" @click="loadOrders">
            Thử lại
          </v-btn>
        </div>

        <div v-else-if="!orders.length" class="text-center py-8">
          <v-icon size="48" color="grey" class="mb-4">mdi-clipboard-text</v-icon>
          <p class="text-body-1">Bạn chưa có đơn hàng nào</p>
          <v-btn color="primary" class="mt-4" to="/restaurants">
            Đặt món ngay
          </v-btn>
        </div>

        <v-list v-else>
          <template v-for="(order, index) in orders" :key="order.id">
            <v-list-item>
              <template v-slot:prepend>
                <v-avatar color="grey-lighten-3" size="48">
                  <v-icon size="24">mdi-shopping</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold mb-1">
                Đơn hàng #{{ order.id }}
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ new Date(order.createdAt).toLocaleDateString('vi-VN') }} - 
                {{ formatPrice(order.total) }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-chip
                  :color="getStatusColor(order.status)"
                  size="small"
                >
                  {{ getStatusText(order.status) }}
                </v-chip>
              </template>
            </v-list-item>

            <v-divider v-if="index < orders.length - 1"></v-divider>
          </template>
        </v-list>
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
import axios from 'axios';

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
    const loadOrders = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const response = await axios.get('/api/orders');
        orders.value = response.data;
      } catch (err) {
        console.error('Error loading orders:', err);
        error.value = 'Không thể tải danh sách đơn hàng';
      } finally {
        loading.value = false;
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
    
    const getStatusColor = (status) => {
      const colors = {
        pending: 'warning',
        confirmed: 'info',
        preparing: 'info',
        delivering: 'primary',
        completed: 'success',
        cancelled: 'error'
      };
      return colors[status] || 'grey';
    };
    
    const getStatusText = (status) => {
      const texts = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        preparing: 'Đang chuẩn bị',
        delivering: 'Đang giao',
        completed: 'Đã hoàn thành',
        cancelled: 'Đã hủy'
      };
      return texts[status] || status;
    };
    
    onMounted(loadOrders);
    
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
      loadOrders,
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
      getStatusColor,
      getStatusText
    };
  }
};
</script>