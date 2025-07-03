<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="pa-6">
          <v-card-title class="text-h5 mb-4">
            <v-icon start>mdi-clipboard-list</v-icon>
            Lịch sử đơn hàng
          </v-card-title>

          <!-- Filters -->
          <v-card-text>
            <v-row class="mb-4">
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="searchQuery"
                  placeholder="Tìm kiếm đơn hàng..."
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @input="debouncedSearch"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="statusFilter"
                  label="Trạng thái"
                  :items="statusOptions"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:model-value="applyFilters"
                ></v-select>
              </v-col>

              <v-col cols="12" md="3">
                <v-select
                  v-model="timeFilter"
                  label="Thời gian"
                  :items="timeOptions"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  @update:model-value="applyFilters"
                ></v-select>
              </v-col>

              <v-col cols="12" md="2">
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-refresh"
                  @click="refreshOrders"
                  :loading="isLoading"
                  block
                >
                  Làm mới
                </v-btn>
              </v-col>
            </v-row>

            <!-- Order Statistics -->
            <v-row class="mb-6" v-if="orderStats">
              <v-col cols="6" sm="3">
                <v-card variant="outlined" class="text-center pa-4">
                  <v-card-text class="pb-2">
                    <div class="text-h4 font-weight-bold text-primary">{{ orderStats.totalOrders }}</div>
                    <div class="text-body-2 text-medium-emphasis">Tổng đơn hàng</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3">
                <v-card variant="outlined" class="text-center pa-4">
                  <v-card-text class="pb-2">
                    <div class="text-h4 font-weight-bold text-success">{{ formatCurrency(orderStats.totalSpent) }}</div>
                    <div class="text-body-2 text-medium-emphasis">Tổng chi tiêu</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3">
                <v-card variant="outlined" class="text-center pa-4">
                  <v-card-text class="pb-2">
                    <div class="text-h4 font-weight-bold text-warning">{{ getCompletedOrders() }}</div>
                    <div class="text-body-2 text-medium-emphasis">Đã hoàn thành</div>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col cols="6" sm="3">
                <v-card variant="outlined" class="text-center pa-4">
                  <v-card-text class="pb-2">
                    <div class="text-h4 font-weight-bold text-info">{{ getPendingOrders() }}</div>
                    <div class="text-body-2 text-medium-emphasis">Đang xử lý</div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Loading State -->
            <div v-if="isLoading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="mt-4">Đang tải lịch sử đơn hàng...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredOrders.length === 0" class="text-center py-8">
              <v-icon size="80" color="grey-lighten-1">mdi-clipboard-off</v-icon>
              <h3 class="text-h5 mt-4 mb-2">
                {{ hasFilters ? 'Không tìm thấy đơn hàng phù hợp' : 'Chưa có đơn hàng nào' }}
              </h3>
              <p class="mb-4 text-medium-emphasis">
                {{ hasFilters ? 'Thử thay đổi bộ lọc để xem thêm đơn hàng' : 'Bắt đầu đặt hàng từ các nhà hàng yêu thích' }}
              </p>
              <v-btn
                v-if="!hasFilters"
                color="primary"
                prepend-icon="mdi-food"
                to="/"
              >
                Khám phá nhà hàng
              </v-btn>
              <v-btn
                v-else
                color="primary"
                variant="outlined"
                prepend-icon="mdi-filter-off"
                @click="clearFilters"
              >
                Xóa bộ lọc
              </v-btn>
            </div>

            <!-- Orders List -->
            <div v-else>
              <v-card
                v-for="order in paginatedOrders"
                :key="order.id"
                variant="outlined"
                class="mb-4"
              >
                <v-card-text>
                  <v-row>
                    <v-col cols="12" md="8">
                      <div class="d-flex align-center mb-2">
                        <v-avatar size="48" class="me-3">
                          <v-img
                            :src="order.restaurantLogo || '/images/default-restaurant.png'"
                            :alt="order.restaurantName"
                          ></v-img>
                        </v-avatar>
                        <div>
                          <h3 class="text-h6">{{ order.restaurantName }}</h3>
                          <p class="text-body-2 text-medium-emphasis">
                            Đơn hàng #{{ order.orderNumber }} • {{ formatDate(order.createdAt) }}
                          </p>
                        </div>
                      </div>

                      <div class="order-items mb-2">
                        <p class="text-body-2">
                          <strong>{{ order.items?.length || 0 }} món:</strong>
                          {{ getItemsSummary(order.items) }}
                        </p>
                      </div>

                      <div class="d-flex align-center">
                        <v-chip
                          :color="getStatusColor(order.status)"
                          size="small"
                          variant="flat"
                          class="me-2"
                        >
                          {{ getStatusText(order.status) }}
                        </v-chip>
                        <span class="text-h6 font-weight-bold text-primary">
                          {{ formatCurrency(order.totalAmount) }}
                        </span>
                      </div>
                    </v-col>

                    <v-col cols="12" md="4" class="d-flex align-center justify-end">
                      <div class="order-actions">
                        <v-btn
                          variant="outlined"
                          prepend-icon="mdi-eye"
                          @click="viewOrderDetails(order)"
                          class="me-2 mb-2"
                        >
                          Xem chi tiết
                        </v-btn>
                        
                        <v-btn
                          v-if="order.status === 'delivered'"
                          variant="outlined"
                          color="warning"
                          prepend-icon="mdi-star"
                          @click="rateOrder(order)"
                          class="me-2 mb-2"
                        >
                          Đánh giá
                        </v-btn>
                        
                        <v-btn
                          variant="outlined"
                          color="primary"
                          prepend-icon="mdi-repeat"
                          @click="reorder(order)"
                          class="mb-2"
                        >
                          Đặt lại
                        </v-btn>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>

              <!-- Pagination -->
              <div class="text-center mt-6" v-if="totalPages > 1">
                <v-pagination
                  v-model="currentPage"
                  :length="totalPages"
                  :total-visible="7"
                  @update:model-value="loadOrders"
                ></v-pagination>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Order Details Dialog -->
    <v-dialog v-model="showOrderDetails" max-width="800" scrollable>
      <OrderDetailsDialog
        v-if="selectedOrder"
        :order="selectedOrder"
        @close="showOrderDetails = false"
      />
    </v-dialog>

    <!-- Rating Dialog -->
    <v-dialog v-model="showRatingDialog" max-width="500">
      <OrderRatingDialog
        v-if="orderToRate"
        :order="orderToRate"
        @close="showRatingDialog = false"
        @rated="onOrderRated"
      />
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, reactive, computed, inject, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { orderService } from '@/services/order.service';
import OrderDetailsDialog from './dialogs/OrderDetailsDialog.vue';
import OrderRatingDialog from './dialogs/OrderRatingDialog.vue';
import { debounce } from 'lodash-es';

export default {
  name: 'OrderHistoryView',
  
  components: {
    OrderDetailsDialog,
    OrderRatingDialog
  },
  
  setup() {
    const store = useStore();
    const showNotification = inject('showNotification');
    
    const isLoading = ref(false);
    const searchQuery = ref('');
    const statusFilter = ref('');
    const timeFilter = ref('');
    const currentPage = ref(1);
    const pageSize = ref(10);
    const totalOrders = ref(0);
    const orders = ref([]);
    const orderStats = ref(null);
    const showOrderDetails = ref(false);
    const showRatingDialog = ref(false);
    const selectedOrder = ref(null);
    const orderToRate = ref(null);

    // Filter options
    const statusOptions = [
      { title: 'Tất cả', value: '' },
      { title: 'Chờ xác nhận', value: 'pending' },
      { title: 'Đã xác nhận', value: 'confirmed' },
      { title: 'Đang chuẩn bị', value: 'preparing' },
      { title: 'Sẵn sàng', value: 'ready' },
      { title: 'Đang giao', value: 'out_for_delivery' },
      { title: 'Đã giao', value: 'delivered' },
      { title: 'Đã hủy', value: 'cancelled' }
    ];

    const timeOptions = [
      { title: 'Tất cả', value: '' },
      { title: '7 ngày qua', value: '7days' },
      { title: '30 ngày qua', value: '30days' },
      { title: '3 tháng qua', value: '3months' },
      { title: '6 tháng qua', value: '6months' },
      { title: '1 năm qua', value: '1year' }
    ];

    // Computed properties
    const filteredOrders = computed(() => orders.value);
    const paginatedOrders = computed(() => filteredOrders.value);
    const totalPages = computed(() => Math.ceil(totalOrders.value / pageSize.value));
    const hasFilters = computed(() => 
      searchQuery.value || statusFilter.value || timeFilter.value
    );

    /**
     * Format currency
     */
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };

    /**
     * Format date
     */
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    /**
     * Get status color
     */
    const getStatusColor = (status) => {
      const colorMap = {
        'pending': 'orange',
        'confirmed': 'blue',
        'preparing': 'purple',
        'ready': 'teal',
        'out_for_delivery': 'indigo',
        'delivered': 'green',
        'cancelled': 'red'
      };
      return colorMap[status] || 'grey';
    };

    /**
     * Get status text
     */
    const getStatusText = (status) => {
      const textMap = {
        'pending': 'Chờ xác nhận',
        'confirmed': 'Đã xác nhận',
        'preparing': 'Đang chuẩn bị',
        'ready': 'Sẵn sàng',
        'out_for_delivery': 'Đang giao',
        'delivered': 'Đã giao',
        'cancelled': 'Đã hủy'
      };
      return textMap[status] || status;
    };

    /**
     * Get items summary
     */
    const getItemsSummary = (items) => {
      if (!items || items.length === 0) return 'Không có sản phẩm';
      
      const summary = items.slice(0, 2).map(item => 
        `${item.name} (x${item.quantity})`
      ).join(', ');
      
      if (items.length > 2) {
        return `${summary}, +${items.length - 2} món khác`;
      }
      
      return summary;
    };

    /**
     * Get completed orders count
     */
    const getCompletedOrders = () => {
      if (!orderStats.value?.statusStats) return 0;
      return orderStats.value.statusStats.find(s => s.status === 'delivered')?.count || 0;
    };

    /**
     * Get pending orders count
     */
    const getPendingOrders = () => {
      if (!orderStats.value?.statusStats) return 0;
      const pendingStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'];
      return orderStats.value.statusStats
        .filter(s => pendingStatuses.includes(s.status))
        .reduce((total, s) => total + s.count, 0);
    };

    /**
     * Load orders from API
     */
    const loadOrders = async () => {
      isLoading.value = true;
      try {
        const params = {
          page: currentPage.value,
          limit: pageSize.value,
          status: statusFilter.value || undefined,
          search: searchQuery.value || undefined
        };

        // Add time filter
        if (timeFilter.value) {
          const now = new Date();
          const timeRanges = {
            '7days': 7,
            '30days': 30,
            '3months': 90,
            '6months': 180,
            '1year': 365
          };
          
          if (timeRanges[timeFilter.value]) {
            const startDate = new Date(now - timeRanges[timeFilter.value] * 24 * 60 * 60 * 1000);
            params.startDate = startDate.toISOString().split('T')[0];
          }
        }

        const response = await orderService.getUserOrders(params);
        orders.value = response.data.orders;
        totalOrders.value = response.data.pagination.total;
      } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Không thể tải danh sách đơn hàng', 'error');
      } finally {
        isLoading.value = false;
      }
    };

    /**
     * Load order statistics
     */
    const loadOrderStats = async () => {
      try {
        const response = await orderService.getOrderStatistics();
        orderStats.value = response.data;
      } catch (error) {
        console.error('Error loading order statistics:', error);
      }
    };

    /**
     * Apply filters
     */
    const applyFilters = () => {
      currentPage.value = 1;
      loadOrders();
    };

    /**
     * Clear all filters
     */
    const clearFilters = () => {
      searchQuery.value = '';
      statusFilter.value = '';
      timeFilter.value = '';
      currentPage.value = 1;
      loadOrders();
    };

    /**
     * Refresh orders
     */
    const refreshOrders = async () => {
      await Promise.all([loadOrders(), loadOrderStats()]);
    };

    /**
     * View order details
     */
    const viewOrderDetails = async (order) => {
      try {
        const response = await orderService.getOrder(order.id);
        selectedOrder.value = response.data.order;
        showOrderDetails.value = true;
      } catch (error) {
        console.error('Error loading order details:', error);
        showNotification('Không thể tải chi tiết đơn hàng', 'error');
      }
    };

    /**
     * Rate order
     */
    const rateOrder = (order) => {
      orderToRate.value = order;
      showRatingDialog.value = true;
    };

    /**
     * Handle order rated
     */
    const onOrderRated = () => {
      showRatingDialog.value = false;
      showNotification('Đánh giá đơn hàng thành công', 'success');
      loadOrders(); // Refresh to update rating status
    };

    /**
     * Reorder items
     */
    const reorder = async (order) => {
      try {
        // Add order items to cart
        for (const item of order.items) {
          await store.dispatch('cart/addItem', {
            productId: item.productId,
            quantity: item.quantity,
            options: item.options
          });
        }
        
        showNotification('Đã thêm các món vào giỏ hàng', 'success');
        // Optionally navigate to cart or restaurant page
      } catch (error) {
        console.error('Error reordering:', error);
        showNotification('Không thể đặt lại đơn hàng', 'error');
      }
    };

    // Debounced search
    const debouncedSearch = debounce(() => {
      currentPage.value = 1;
      loadOrders();
    }, 500);

    // Watch for page changes
    watch(currentPage, () => {
      loadOrders();
    });

    onMounted(() => {
      Promise.all([loadOrders(), loadOrderStats()]);
    });

    return {
      isLoading,
      searchQuery,
      statusFilter,
      timeFilter,
      currentPage,
      totalPages,
      filteredOrders,
      paginatedOrders,
      orderStats,
      showOrderDetails,
      showRatingDialog,
      selectedOrder,
      orderToRate,
      statusOptions,
      timeOptions,
      hasFilters,
      formatCurrency,
      formatDate,
      getStatusColor,
      getStatusText,
      getItemsSummary,
      getCompletedOrders,
      getPendingOrders,
      applyFilters,
      clearFilters,
      refreshOrders,
      viewOrderDetails,
      rateOrder,
      onOrderRated,
      reorder,
      debouncedSearch
    };
  }
};
</script>

<style scoped>
.order-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

@media (min-width: 960px) {
  .order-actions {
    flex-direction: row;
    align-items: center;
  }
}

.order-items {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>