<template>
  <div class="order-history">
    <h2 class="text-h6 mb-4">Order History</h2>
    
    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="search"
              density="compact"
              label="Search orders"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              hide-details
              @update:modelValue="filterOrders"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterStatus"
              :items="statusOptions"
              label="Status"
              density="compact"
              variant="outlined"
              hide-details
              @update:modelValue="filterOrders"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="3">
            <v-select
              v-model="filterTimeframe"
              :items="timeframeOptions"
              label="Timeframe"
              density="compact"
              variant="outlined"
              hide-details
              @update:modelValue="filterOrders"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="2">
            <v-btn
              color="primary"
              variant="tonal"
              block
              @click="resetFilters"
            >
              Reset
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    
    <!-- Error State -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>
    
    <!-- Empty State -->
    <v-card
      v-else-if="filteredOrders.length === 0"
      variant="outlined"
      class="text-center py-8 px-4"
    >
      <v-icon size="64" color="grey-lighten-1" icon="mdi-receipt-text-outline"></v-icon>
      <h3 class="text-h6 mt-4 mb-2">
        {{ orders.length === 0 ? 'No Order History' : 'No Orders Match Your Filters' }}
      </h3>
      <p class="text-medium-emphasis mb-6">
        {{ orders.length === 0 ? 'You haven\'t placed any orders yet' : 'Try adjusting your search or filter criteria' }}
      </p>
      <v-btn
        v-if="orders.length === 0"
        color="primary"
        to="/restaurants"
        prepend-icon="mdi-silverware-fork-knife"
      >
        Browse Restaurants
      </v-btn>
      <v-btn
        v-else
        color="primary"
        variant="tonal"
        @click="resetFilters"
      >
        Clear Filters
      </v-btn>
    </v-card>
    
    <!-- Order List -->
    <div v-else>
      <v-card
        v-for="order in filteredOrders"
        :key="order.id"
        class="mb-4"
        :class="{ 'border-primary': isActiveOrder(order.status) }"
      >
        <v-card-item>
          <v-card-title class="d-flex justify-space-between align-center flex-wrap">
            <div class="d-flex align-center">
              <span>Order #{{ order.orderNumber }}</span>
              <v-chip
                size="small"
                :color="getStatusColor(order.status)"
                class="ml-2"
              >
                {{ getStatusText(order.status) }}
              </v-chip>
            </div>
            
            <span class="text-caption text-medium-emphasis">{{ formatDate(order.date) }}</span>
          </v-card-title>
        </v-card-item>
        
        <v-divider></v-divider>
        
        <v-card-text>
          <div class="d-flex align-start mb-4">
            <v-avatar size="48" class="mr-4">
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
                <span class="text-body-2">${{ (item.price * item.quantity).toFixed(2) }}</span>
              </template>
            </v-list-item>
          </v-list>
          
          <v-divider class="my-3"></v-divider>
          
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span>Subtotal</span>
            <span>${{ order.subtotal.toFixed(2) }}</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span>Delivery Fee</span>
            <span>${{ order.deliveryFee.toFixed(2) }}</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span>Tax</span>
            <span>${{ order.tax.toFixed(2) }}</span>
          </div>
          <div class="d-flex justify-space-between text-subtitle-1 font-weight-bold mt-2">
            <span>Total</span>
            <span>${{ order.total.toFixed(2) }}</span>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-btn
            variant="text"
            prepend-icon="mdi-receipt"
            @click="viewOrderDetails(order)"
          >
            View Details
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            v-if="canTrackOrder(order.status)"
            variant="text"
            color="primary"
            prepend-icon="mdi-map-marker"
            :to="`/orders/${order.id}/track`"
          >
            Track Order
          </v-btn>
          <v-btn
            v-if="canReviewOrder(order.status) && !order.reviewed"
            variant="text"
            color="primary"
            prepend-icon="mdi-star-outline"
            @click="openReviewDialog(order)"
          >
            Leave Review
          </v-btn>
          <v-btn
            v-if="canReorderItems(order.status)"
            variant="text"
            color="primary"
            prepend-icon="mdi-repeat"
            @click="reorderItems(order)"
          >
            Reorder
          </v-btn>
          <v-btn
            v-if="canCancelOrder(order.status)"
            variant="text"
            color="error"
            prepend-icon="mdi-close"
            @click="confirmCancelOrder(order)"
          >
            Cancel Order
          </v-btn>
        </v-card-actions>
      </v-card>
      
      <!-- Load More Button -->
      <div v-if="hasMoreOrders" class="text-center mt-4">
        <v-btn
          variant="outlined"
          :loading="loadingMore"
          @click="loadMoreOrders"
        >
          Load More Orders
        </v-btn>
      </div>
    </div>
    
    <!-- Order Details Dialog -->
    <v-dialog v-model="orderDetailsDialog.show" max-width="700">
      <v-card v-if="orderDetailsDialog.order">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Order #{{ orderDetailsDialog.order.orderNumber }}</span>
          <v-chip
            size="small"
            :color="getStatusColor(orderDetailsDialog.order.status)"
          >
            {{ getStatusText(orderDetailsDialog.order.status) }}
          </v-chip>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <h3 class="text-subtitle-1 font-weight-medium mb-2">Order Details</h3>
              <div class="text-body-2 mb-1">
                <strong>Date:</strong> {{ formatDate(orderDetailsDialog.order.date) }}
              </div>
              <div class="text-body-2 mb-1">
                <strong>Restaurant:</strong> {{ orderDetailsDialog.order.restaurant.name }}
              </div>
              <div class="text-body-2 mb-1">
                <strong>Payment Method:</strong> {{ orderDetailsDialog.order.paymentMethod }}
              </div>
            </v-col>
            
            <v-col cols="12" sm="6">
              <h3 class="text-subtitle-1 font-weight-medium mb-2">Delivery Details</h3>
              <div class="text-body-2 mb-1">
                <strong>Address:</strong> {{ orderDetailsDialog.order.deliveryAddress }}
              </div>
              <div v-if="orderDetailsDialog.order.deliveryInstructions" class="text-body-2 mb-1">
                <strong>Instructions:</strong> {{ orderDetailsDialog.order.deliveryInstructions }}
              </div>
              <div v-if="orderDetailsDialog.order.deliveryTime" class="text-body-2 mb-1">
                <strong>Delivered:</strong> {{ formatTime(orderDetailsDialog.order.deliveryTime) }}
              </div>
            </v-col>
            
            <v-col cols="12">
              <h3 class="text-subtitle-1 font-weight-medium mb-2">Items</h3>
              <v-list density="compact">
                <v-list-item
                  v-for="(item, index) in orderDetailsDialog.order.items"
                  :key="index"
                >
                  <v-list-item-title>
                    {{ item.quantity }}× {{ item.name }}
                  </v-list-item-title>
                  
                  <template v-slot:append>
                    <span>${{ (item.price * item.quantity).toFixed(2) }}</span>
                  </template>
                </v-list-item>
              </v-list>
              
              <v-divider class="my-3"></v-divider>
              
              <div class="d-flex justify-space-between text-body-2 mb-1">
                <span>Subtotal</span>
                <span>${{ orderDetailsDialog.order.subtotal.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between text-body-2 mb-1">
                <span>Delivery Fee</span>
                <span>${{ orderDetailsDialog.order.deliveryFee.toFixed(2) }}</span>
              </div>
              <div v-if="orderDetailsDialog.order.discount" class="d-flex justify-space-between text-body-2 mb-1">
                <span>Discount</span>
                <span>-${{ orderDetailsDialog.order.discount.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between text-body-2 mb-1">
                <span>Tax</span>
                <span>${{ orderDetailsDialog.order.tax.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between text-subtitle-1 font-weight-bold mt-2">
                <span>Total</span>
                <span>${{ orderDetailsDialog.order.total.toFixed(2) }}</span>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-btn
            variant="text"
            @click="downloadReceipt(orderDetailsDialog.order)"
          >
            Download Receipt
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="orderDetailsDialog.show = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Review Dialog -->
    <v-dialog v-model="reviewDialog.show" max-width="500">
      <v-card v-if="reviewDialog.order">
        <v-card-title>
          Rate your order from {{ reviewDialog.order.restaurant.name }}
        </v-card-title>
        
        <v-card-text>
          <div class="text-center mb-4">
            <v-rating
              v-model="reviewDialog.rating"
              color="amber"
              hover
              length="5"
              size="large"
            ></v-rating>
          </div>
          
          <v-textarea
            v-model="reviewDialog.comment"
            label="Write your review (optional)"
            counter="500"
            :rules="[v => !v || v.length <= 500 || 'Max 500 characters']"
            rows="4"
            auto-grow
          ></v-textarea>
          
          <!-- Food Rating Section -->
          <h3 class="text-subtitle-1 font-weight-medium mb-2">Food Quality</h3>
          <v-rating
            v-model="reviewDialog.foodRating"
            color="amber"
            hover
            length="5"
            size="small"
          ></v-rating>
          
          <!-- Delivery Rating Section -->
          <h3 class="text-subtitle-1 font-weight-medium mb-2">Delivery</h3>
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
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="reviewDialog.rating === 0"
            :loading="reviewDialog.loading"
            @click="submitReview"
          >
            Submit Review
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Cancel Order Dialog -->
    <v-dialog v-model="cancelDialog.show" max-width="500">
      <v-card v-if="cancelDialog.order">
        <v-card-title>
          Cancel Order #{{ cancelDialog.order.orderNumber }}?
        </v-card-title>
        
        <v-card-text>
          <p>Are you sure you want to cancel this order? This action cannot be undone.</p>
          <v-radio-group
            v-model="cancelDialog.reason"
            label="Reason for cancellation"
            hide-details
          >
            <v-radio
              v-for="reason in cancellationReasons"
              :key="reason.value"
              :label="reason.label"
              :value="reason.value"
            ></v-radio>
          </v-radio-group>
          
          <v-textarea
            v-if="cancelDialog.reason === 'other'"
            v-model="cancelDialog.otherReason"
            label="Please specify"
            class="mt-3"
            rows="2"
            auto-grow
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="cancelDialog.show = false"
          >
            No, Keep Order
          </v-btn>
          <v-btn
            color="error"
            :loading="cancelDialog.loading"
            @click="cancelOrder"
          >
            Yes, Cancel Order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import { format } from 'date-fns';

export default {
  name: 'OrderHistory',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    
    const orders = ref([]);
    const filteredOrders = ref([]);
    const loading = ref(true);
    const loadingMore = ref(false);
    const error = ref(null);
    const search = ref('');
    const filterStatus = ref('all');
    const filterTimeframe = ref('all');
    const page = ref(1);
    const perPage = ref(5);
    const hasMoreOrders = ref(false);
    
    const statusOptions = [
      { title: 'All Orders', value: 'all' },
      { title: 'Active', value: 'active' },
      { title: 'Delivered', value: 'delivered' },
      { title: 'Cancelled', value: 'cancelled' }
    ];
    
    const timeframeOptions = [
      { title: 'All Time', value: 'all' },
      { title: 'Last 30 Days', value: '30days' },
      { title: '3 Months', value: '3months' },
      { title: '6 Months', value: '6months' },
      { title: 'This Year', value: 'year' }
    ];
    
    const cancellationReasons = [
      { label: 'Changed my mind', value: 'changed_mind' },
      { label: 'Ordered by mistake', value: 'mistake' },
      { label: 'Taking too long', value: 'too_long' },
      { label: 'Duplicate order', value: 'duplicate' },
      { label: 'Other reason', value: 'other' }
    ];
    
    // Dialogs
    const orderDetailsDialog = ref({ show: false, order: null });
    const reviewDialog = ref({ 
      show: false, 
      order: null,
      rating: 0,
      foodRating: 0,
      deliveryRating: 0,
      comment: '',
      loading: false
    });
    const cancelDialog = ref({
      show: false,
      order: null,
      reason: 'changed_mind',
      otherReason: '',
      loading: false
    });
    
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
        
        // Initialize filtered orders
        filterOrders();
      } catch (err) {
        console.error('Error fetching orders:', err);
        error.value = 'Unable to load your order history';
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
        
        // Apply current filters to all orders
        filterOrders();
      } catch (err) {
        console.error('Error loading more orders:', err);
        toast.error('Failed to load more orders');
      } finally {
        loadingMore.value = false;
      }
    };
    
    const filterOrders = () => {
      let result = [...orders.value];
      
      // Apply search
      if (search.value) {
        const searchTerm = search.value.toLowerCase();
        result = result.filter(order => {
          // Search in order number and restaurant name
          return (
            order.orderNumber.toString().includes(searchTerm) ||
            order.restaurant.name.toLowerCase().includes(searchTerm) ||
            order.items.some(item => item.name.toLowerCase().includes(searchTerm))
          );
        });
      }
      
      // Apply status filter
      if (filterStatus.value !== 'all') {
        result = result.filter(order => order.status === filterStatus.value);
      }
      
      // Apply timeframe filter
      if (filterTimeframe.value !== 'all') {
        const now = new Date();
        let cutoffDate;
        
        switch (filterTimeframe.value) {
          case '30days':
            cutoffDate = new Date(now.setDate(now.getDate() - 30));
            break;
          case '3months':
            cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          case '6months':
            cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
            break;
          case 'year':
            cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            cutoffDate = null;
        }
        
        if (cutoffDate) {
          result = result.filter(order => new Date(order.date) >= cutoffDate);
        }
      }
      
      filteredOrders.value = result;
    };
    
    const resetFilters = () => {
      search.value = '';
      filterStatus.value = 'all';
      filterTimeframe.value = 'all';
      filterOrders();
    };
    
    const viewOrderDetails = (order) => {
      orderDetailsDialog.value = {
        show: true,
        order
      };
    };
    
    const openReviewDialog = (order) => {
      reviewDialog.value = {
        show: true,
        order,
        rating: 0,
        foodRating: 0,
        deliveryRating: 0,
        comment: '',
        loading: false
      };
    };
    
    const submitReview = async () => {
      if (reviewDialog.value.rating === 0) return;
      
      reviewDialog.value.loading = true;
      
      try {
        await store.dispatch('review/submitReview', {
          orderId: reviewDialog.value.order.id,
          restaurantId: reviewDialog.value.order.restaurant.id,
          rating: reviewDialog.value.rating,
          foodRating: reviewDialog.value.foodRating,
          deliveryRating: reviewDialog.value.deliveryRating,
          comment: reviewDialog.value.comment
        });
        
        // Update local state
        const index = orders.value.findIndex(o => o.id === reviewDialog.value.order.id);
        if (index !== -1) {
          orders.value[index].reviewed = true;
        }
        
        toast.success('Review submitted successfully!');
        reviewDialog.value.show = false;
      } catch (err) {
        console.error('Error submitting review:', err);
        toast.error('Failed to submit review');
      } finally {
        reviewDialog.value.loading = false;
      }
    };
    
    const confirmCancelOrder = (order) => {
      cancelDialog.value = {
        show: true,
        order,
        reason: 'changed_mind',
        otherReason: '',
        loading: false
      };
    };
    
    const cancelOrder = async () => {
      cancelDialog.value.loading = true;
      
      const reason = cancelDialog.value.reason === 'other'
        ? cancelDialog.value.otherReason
        : cancelDialog.value.reason;
      
      try {
        await store.dispatch('order/cancelOrder', {
          orderId: cancelDialog.value.order.id,
          reason
        });
        
        // Update local state
        const index = orders.value.findIndex(o => o.id === cancelDialog.value.order.id);
        if (index !== -1) {
          orders.value[index].status = 'cancelled';
        }
        
        // Update filtered orders
        filterOrders();
        
        toast.success('Order cancelled successfully');
        cancelDialog.value.show = false;
      } catch (err) {
        console.error('Error cancelling order:', err);
        toast.error(err.response?.data?.message || 'Failed to cancel order');
      } finally {
        cancelDialog.value.loading = false;
      }
    };
    
    const reorderItems = async (order) => {
      try {
        await store.dispatch('cart/reorder', { orderId: order.id });
        toast.success('Items added to cart');
      } catch (err) {
        console.error('Error reordering items:', err);
        toast.error('Failed to add items to cart');
      }
    };
    
    const downloadReceipt = (order) => {
      // This would be implemented to generate a PDF receipt
      toast.info('Downloading receipt...');
    };
    
    const formatDate = (dateString) => {
      return format(new Date(dateString), 'MMM d, yyyy • h:mm a');
    };
    
    const formatTime = (dateString) => {
      return format(new Date(dateString), 'h:mm a');
    };
    
    const getStatusColor = (status) => {
      const colors = {
        pending: 'grey',
        confirmed: 'info',
        preparing: 'info',
        ready: 'info',
        picked_up: 'warning',
        on_the_way: 'warning',
        delivered: 'success',
        cancelled: 'error'
      };
      return colors[status] || 'grey';
    };
    
    const getStatusText = (status) => {
      const texts = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        preparing: 'Preparing',
        ready: 'Ready',
        picked_up: 'Picked Up',
        on_the_way: 'On the Way',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      };
      return texts[status] || 'Unknown';
    };
    
    const isActiveOrder = (status) => {
      return ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'].includes(status);
    };
    
    const canTrackOrder = (status) => {
      return ['confirmed', 'preparing', 'ready', 'picked_up', 'on_the_way'].includes(status);
    };
    
    const canCancelOrder = (status) => {
      return ['pending', 'confirmed'].includes(status);
    };
    
    const canReviewOrder = (status) => {
      return status === 'delivered';
    };
    
    const canReorderItems = (status) => {
      return ['delivered', 'cancelled'].includes(status);
    };
    
    onMounted(fetchOrders);
    
    return {
      orders,
      filteredOrders,
      loading,
      loadingMore,
      error,
      search,
      filterStatus,
      filterTimeframe,
      statusOptions,
      timeframeOptions,
      hasMoreOrders,
      orderDetailsDialog,
      reviewDialog,
      cancelDialog,
      cancellationReasons,
      fetchOrders,
      loadMoreOrders,
      filterOrders,
      resetFilters,
      viewOrderDetails,
      openReviewDialog,
      submitReview,
      confirmCancelOrder,
      cancelOrder,
      reorderItems,
      downloadReceipt,
      formatDate,
      formatTime,
      getStatusColor,
      getStatusText,
      isActiveOrder,
      canTrackOrder,
      canCancelOrder,
      canReviewOrder,
      canReorderItems
    };
  }
};
</script>

<style scoped>
.max-width-200 {
  max-width: 200px;
}

.border-primary {
  border: 2px solid rgb(var(--v-theme-primary));
}
</style>