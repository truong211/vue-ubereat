<template>
  <div class="order-list">
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <span>Orders</span>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-refresh"
          @click="refreshOrders"
          :loading="loading"
        >
          Refresh
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <!-- Search and Filter -->
        <v-row class="mb-4">
          <v-col cols="12" sm="3">
            <v-text-field
              v-model="filters.search"
              label="Search orders"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              @input="applyFilters"
              placeholder="Order ID or customer name"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="applyFilters"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.timeRange"
              :items="timeRangeOptions"
              label="Time Range"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="applyFilters"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="3">
            <v-btn
              color="primary"
              block
              @click="applyFilters"
              :loading="loading"
            >
              Filter
            </v-btn>
          </v-col>
        </v-row>
        
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
          <div class="mt-2">Loading orders...</div>
        </div>
        
        <!-- Empty State -->
        <v-alert
          v-else-if="filteredOrders.length === 0"
          type="info"
          text="No orders found. Adjust your filters or wait for new orders."
          class="mb-0"
        ></v-alert>
        
        <!-- Order Table -->
        <v-table v-else>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date & Time</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id" :class="{'new-order': order.isNew}">
              <td>
                <div class="font-weight-medium">#{{ order.id }}</div>
                <div class="text-caption">{{ order.payment_method }}</div>
              </td>
              <td>
                <div class="font-weight-medium">{{ order.user.full_name }}</div>
                <div class="text-caption">{{ order.user.phone || 'No phone' }}</div>
              </td>
              <td>
                <div>{{ formatDate(order.created_at) }}</div>
                <div class="text-caption">{{ formatTime(order.created_at) }}</div>
              </td>
              <td>
                <div>{{ getItemCount(order) }} items</div>
                <div class="text-caption text-truncate" style="max-width: 150px;">
                  {{ getItemSummary(order) }}
                </div>
              </td>
              <td>
                <div class="font-weight-medium">{{ formatPrice(order.total_amount) }}</div>
                <v-chip
                  v-if="order.payment_status"
                  size="x-small"
                  :color="getPaymentStatusColor(order.payment_status)"
                  class="text-capitalize"
                >
                  {{ order.payment_status }}
                </v-chip>
              </td>
              <td>
                <v-chip
                  :color="getStatusColor(order.status)"
                  size="small"
                  class="text-capitalize"
                >
                  {{ order.status }}
                </v-chip>
              </td>
              <td>
                <div class="d-flex">
                  <v-btn
                    icon
                    variant="text"
                    color="primary"
                    @click="viewOrderDetails(order)"
                  >
                    <v-icon>mdi-eye</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="text"
                    color="success"
                    @click="updateOrderStatus(order)"
                    :disabled="!canUpdateStatus(order)"
                  >
                    <v-icon>mdi-arrow-right-bold-circle</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="text"
                    color="error"
                    @click="cancelOrder(order)"
                    :disabled="!canCancel(order)"
                  >
                    <v-icon>mdi-cancel</v-icon>
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
        
        <!-- Pagination -->
        <div v-if="filteredOrders.length > 0" class="text-center mt-4">
          <v-pagination
            v-model="pagination.page"
            :length="pagination.totalPages"
            @update:model-value="changePage"
            rounded="circle"
          ></v-pagination>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Order Details Dialog -->
    <v-dialog
      v-model="detailsDialog"
      max-width="800"
    >
      <v-card v-if="selectedOrder">
        <v-card-title class="d-flex align-center">
          <span>Order #{{ selectedOrder.id }}</span>
          <v-chip
            :color="getStatusColor(selectedOrder.status)"
            class="text-capitalize ml-2"
          >
            {{ selectedOrder.status }}
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn
            icon
            variant="text"
            @click="detailsDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <!-- Order Info -->
            <v-col cols="12" md="6">
              <v-list>
                <v-list-subheader>Order Information</v-list-subheader>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-calendar"></v-icon>
                  </template>
                  <v-list-item-title>Date & Time</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(selectedOrder.created_at) }} at {{ formatTime(selectedOrder.created_at) }}
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-credit-card"></v-icon>
                  </template>
                  <v-list-item-title>Payment Method</v-list-item-title>
                  <v-list-item-subtitle class="text-capitalize">
                    {{ selectedOrder.payment_method }}
                    <v-chip
                      size="x-small"
                      :color="getPaymentStatusColor(selectedOrder.payment_status)"
                      class="text-capitalize ml-2"
                    >
                      {{ selectedOrder.payment_status }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="selectedOrder.notes">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-note-text"></v-icon>
                  </template>
                  <v-list-item-title>Order Notes</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedOrder.notes }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            
            <!-- Customer Info -->
            <v-col cols="12" md="6">
              <v-list>
                <v-list-subheader>Customer Information</v-list-subheader>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-account"></v-icon>
                  </template>
                  <v-list-item-title>Customer</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedOrder.user.full_name }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="selectedOrder.user.phone">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-phone"></v-icon>
                  </template>
                  <v-list-item-title>Phone</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedOrder.user.phone }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-map-marker"></v-icon>
                  </template>
                  <v-list-item-title>Delivery Address</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedOrder.delivery_address }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
          
          <!-- Order Items -->
          <v-divider class="my-3"></v-divider>
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Order Items</h3>
          
          <v-list lines="two">
            <v-list-item
              v-for="(item, index) in selectedOrder.order_details"
              :key="index"
            >
              <template v-slot:prepend>
                <v-avatar size="48" rounded>
                  <v-img
                    :src="item.product.image_url || '/images/food-placeholder.jpg'"
                    cover
                  ></v-img>
                </v-avatar>
              </template>
              
              <v-list-item-title>
                {{ item.quantity }}x {{ item.product.name }}
              </v-list-item-title>
              
              <v-list-item-subtitle>
                <div v-if="item.options && item.options.length > 0">
                  Options: {{ formatOptions(item.options) }}
                </div>
                <div v-if="item.notes">Notes: {{ item.notes }}</div>
              </v-list-item-subtitle>
              
              <template v-slot:append>
                <div class="text-right">
                  <div>{{ formatPrice(item.price * item.quantity) }}</div>
                  <div class="text-caption">{{ formatPrice(item.price) }} each</div>
                </div>
              </template>
            </v-list-item>
          </v-list>
          
          <!-- Order Summary -->
          <v-divider class="my-3"></v-divider>
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-subtitle-1">Subtotal</div>
            <div>{{ formatPrice(getSubtotal(selectedOrder)) }}</div>
          </div>
          
          <div v-if="selectedOrder.delivery_fee" class="d-flex justify-space-between align-center mb-2">
            <div class="text-subtitle-1">Delivery Fee</div>
            <div>{{ formatPrice(selectedOrder.delivery_fee) }}</div>
          </div>
          
          <div v-if="selectedOrder.discount" class="d-flex justify-space-between align-center mb-2">
            <div class="text-subtitle-1">Discount</div>
            <div class="text-success">-{{ formatPrice(selectedOrder.discount) }}</div>
          </div>
          
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-h6 font-weight-bold">Total</div>
            <div class="text-h6 font-weight-bold">{{ formatPrice(selectedOrder.total_amount) }}</div>
          </div>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-btn
            color="primary"
            variant="text"
            prepend-icon="mdi-printer"
            @click="printOrder"
          >
            Print
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="outlined"
            @click="cancelOrder(selectedOrder)"
            :disabled="!canCancel(selectedOrder)"
          >
            Cancel Order
          </v-btn>
          <v-btn
            color="success"
            @click="updateOrderStatus(selectedOrder)"
            :disabled="!canUpdateStatus(selectedOrder)"
          >
            {{ getNextStatusLabel(selectedOrder) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Status Update Confirmation Dialog -->
    <v-dialog
      v-model="statusDialog"
      max-width="400"
    >
      <v-card v-if="selectedOrder">
        <v-card-title class="text-h5">
          Update Order Status
        </v-card-title>
        
        <v-card-text>
          <p>Are you sure you want to update the status of order #{{ selectedOrder.id }} from <strong>{{ selectedOrder.status }}</strong> to <strong>{{ getNextStatus(selectedOrder) }}</strong>?</p>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="statusDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="success"
            @click="confirmStatusUpdate"
            :loading="updating"
          >
            Update Status
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Cancel Order Confirmation Dialog -->
    <v-dialog
      v-model="cancelDialog"
      max-width="400"
    >
      <v-card v-if="selectedOrder">
        <v-card-title class="text-h5">
          Cancel Order
        </v-card-title>
        
        <v-card-text>
          <p>Are you sure you want to cancel order #{{ selectedOrder.id }}?</p>
          <p class="text-caption">This action cannot be undone.</p>
          
          <v-textarea
            v-model="cancelReason"
            label="Reason for cancellation"
            rows="3"
            variant="outlined"
            class="mt-3"
            placeholder="Please provide a reason for cancellation"
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="cancelDialog = false"
          >
            Back
          </v-btn>
          <v-btn
            color="error"
            @click="confirmCancelOrder"
            :loading="cancelling"
            :disabled="!cancelReason"
          >
            Cancel Order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'OrderList',
  
  props: {
    restaurantId: {
      type: [Number, String],
      required: true
    }
  },
  
  data() {
    return {
      loading: false,
      updating: false,
      cancelling: false,
      detailsDialog: false,
      statusDialog: false,
      cancelDialog: false,
      selectedOrder: null,
      cancelReason: '',
      filters: {
        search: '',
        status: null,
        timeRange: 'today'
      },
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 1
      },
      statusOptions: [
        { title: 'All Statuses', value: null },
        { title: 'Pending', value: 'pending' },
        { title: 'Confirmed', value: 'confirmed' },
        { title: 'Preparing', value: 'preparing' },
        { title: 'Ready for Pickup', value: 'ready_for_pickup' },
        { title: 'Out for Delivery', value: 'out_for_delivery' },
        { title: 'Delivered', value: 'delivered' },
        { title: 'Cancelled', value: 'cancelled' }
      ],
      timeRangeOptions: [
        { title: 'Today', value: 'today' },
        { title: 'Yesterday', value: 'yesterday' },
        { title: 'Last 7 Days', value: 'week' },
        { title: 'Last 30 Days', value: 'month' },
        { title: 'All Time', value: 'all' }
      ]
    };
  },
  
  computed: {
    ...mapState({
      orders: state => state.restaurantAdmin.orders,
      totalOrders: state => state.restaurantAdmin.totalOrders
    }),
    
    filteredOrders() {
      return this.orders;
    }
  },
  
  methods: {
    ...mapActions({
      fetchOrders: 'restaurantAdmin/fetchOrders',
      updateOrder: 'restaurantAdmin/updateOrderStatus',
      cancelOrderAction: 'restaurantAdmin/cancelOrder'
    }),
    
    async loadOrders() {
      this.loading = true;
      
      try {
        await this.fetchOrders({
          restaurantId: this.restaurantId,
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.filters
        });
        
        this.pagination.totalPages = Math.ceil(this.totalOrders / this.pagination.limit);
      } catch (error) {
        this.$toast.error('Failed to load orders');
        console.error('Error loading orders:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async refreshOrders() {
      await this.loadOrders();
      this.$toast.success('Orders refreshed');
    },
    
    async applyFilters() {
      this.pagination.page = 1;
      await this.loadOrders();
    },
    
    async changePage(page) {
      this.pagination.page = page;
      await this.loadOrders();
    },
    
    viewOrderDetails(order) {
      this.selectedOrder = order;
      this.detailsDialog = true;
    },
    
    updateOrderStatus(order) {
      this.selectedOrder = order;
      this.statusDialog = true;
    },
    
    async confirmStatusUpdate() {
      if (!this.selectedOrder) return;
      
      this.updating = true;
      
      try {
        const nextStatus = this.getNextStatus(this.selectedOrder);
        
        await this.updateOrder({
          orderId: this.selectedOrder.id,
          status: nextStatus
        });
        
        this.$toast.success(`Order status updated to ${nextStatus}`);
        this.statusDialog = false;
        
        // Update the selected order status in the details dialog
        if (this.detailsDialog) {
          this.selectedOrder.status = nextStatus;
        }
        
        // Refresh orders
        await this.loadOrders();
      } catch (error) {
        this.$toast.error('Failed to update order status');
        console.error('Error updating order status:', error);
      } finally {
        this.updating = false;
      }
    },
    
    cancelOrder(order) {
      this.selectedOrder = order;
      this.cancelReason = '';
      this.cancelDialog = true;
    },
    
    async confirmCancelOrder() {
      if (!this.selectedOrder || !this.cancelReason) return;
      
      this.cancelling = true;
      
      try {
        await this.cancelOrderAction({
          orderId: this.selectedOrder.id,
          reason: this.cancelReason
        });
        
        this.$toast.success('Order cancelled successfully');
        this.cancelDialog = false;
        this.detailsDialog = false;
        
        // Refresh orders
        await this.loadOrders();
      } catch (error) {
        this.$toast.error('Failed to cancel order');
        console.error('Error cancelling order:', error);
      } finally {
        this.cancelling = false;
      }
    },
    
    printOrder() {
      // Implementation would depend on your printing solution
      this.$toast.info('Print functionality would be implemented here');
    },
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    },
    
    formatTime(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    },
    
    getItemCount(order) {
      return order.order_details ? order.order_details.reduce((total, item) => total + item.quantity, 0) : 0;
    },
    
    getItemSummary(order) {
      if (!order.order_details || order.order_details.length === 0) return 'No items';
      
      return order.order_details
        .slice(0, 2)
        .map(item => `${item.quantity}x ${item.product.name}`)
        .join(', ') + (order.order_details.length > 2 ? '...' : '');
    },
    
    formatOptions(options) {
      if (!options || options.length === 0) return '';
      
      return options.map(option => option.name).join(', ');
    },
    
    getSubtotal(order) {
      if (!order.order_details) return 0;
      
      return order.order_details.reduce((total, item) => total + (item.price * item.quantity), 0);
    },
    
    getStatusColor(status) {
      switch (status) {
        case 'pending':
          return 'grey';
        case 'confirmed':
          return 'info';
        case 'preparing':
          return 'primary';
        case 'ready_for_pickup':
          return 'amber-darken-2';
        case 'out_for_delivery':
          return 'deep-purple';
        case 'delivered':
          return 'success';
        case 'cancelled':
          return 'error';
        default:
          return 'grey';
      }
    },
    
    getPaymentStatusColor(status) {
      switch (status) {
        case 'paid':
          return 'success';
        case 'pending':
          return 'warning';
        case 'failed':
          return 'error';
        default:
          return 'grey';
      }
    },
    
    getNextStatus(order) {
      switch (order.status) {
        case 'pending':
          return 'confirmed';
        case 'confirmed':
          return 'preparing';
        case 'preparing':
          return 'ready_for_pickup';
        case 'ready_for_pickup':
          return 'out_for_delivery';
        case 'out_for_delivery':
          return 'delivered';
        default:
          return order.status;
      }
    },
    
    getNextStatusLabel(order) {
      const nextStatus = this.getNextStatus(order);
      
      switch (nextStatus) {
        case 'confirmed':
          return 'Confirm Order';
        case 'preparing':
          return 'Start Preparing';
        case 'ready_for_pickup':
          return 'Mark as Ready';
        case 'out_for_delivery':
          return 'Send for Delivery';
        case 'delivered':
          return 'Mark as Delivered';
        default:
          return 'Update Status';
      }
    },
    
    canUpdateStatus(order) {
      return !['delivered', 'cancelled'].includes(order.status);
    },
    
    canCancel(order) {
      return !['delivered', 'cancelled'].includes(order.status);
    }
  },
  
  async mounted() {
    await this.loadOrders();
    
    // Set up polling for new orders (every 30 seconds)
    this.pollingInterval = setInterval(() => {
      this.loadOrders();
    }, 30000);
  },
  
  beforeUnmount() {
    // Clear polling interval when component is destroyed
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
};
</script>

<style scoped>
.new-order {
  background-color: rgba(76, 175, 80, 0.1);
  animation: highlight 2s ease-out;
}

@keyframes highlight {
  0% {
    background-color: rgba(76, 175, 80, 0.3);
  }
  100% {
    background-color: rgba(76, 175, 80, 0);
  }
}

.v-table {
  border-radius: 8px;
}
</style> 