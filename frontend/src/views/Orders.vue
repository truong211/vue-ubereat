<template>
  <v-container class="orders-page py-8">
    <h1 class="text-h4 font-weight-bold mb-6">My Orders</h1>
    
    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading your orders...</p>
    </div>
    
    <div v-else-if="orders.length === 0" class="empty-orders-container text-center py-12">
      <v-icon size="100" color="grey">mdi-receipt</v-icon>
      <h2 class="text-h5 mt-6 mb-2">No Orders Yet</h2>
      <p class="text-body-1 mb-8">You haven't placed any orders yet</p>
      <v-btn
        color="primary"
        size="large"
        to="/"
        prepend-icon="mdi-food"
      >
        Browse Restaurants
      </v-btn>
    </div>
    
    <div v-else>
      <!-- Filter tabs -->
      <v-card class="mb-6">
        <v-tabs v-model="activeTab" bg-color="primary" centered>
          <v-tab value="all">All Orders</v-tab>
          <v-tab value="active">Active</v-tab>
          <v-tab value="completed">Completed</v-tab>
          <v-tab value="cancelled">Cancelled</v-tab>
        </v-tabs>
      </v-card>
      
      <!-- Orders list -->
      <v-row>
        <v-col 
          v-for="order in filteredOrders" 
          :key="order.id" 
          cols="12"
        >
          <v-card :class="{'border-accent': isActiveOrder(order)}" class="order-card">
            <v-card-title class="d-flex align-center">
              <div>
                Order #{{ order.orderNumber }}
              </div>
              <v-spacer></v-spacer>
              <v-chip
                :color="getStatusColor(order.status)"
                size="small"
              >
                {{ formatStatus(order.status) }}
              </v-chip>
            </v-card-title>
            
            <v-card-text>
              <v-row>
                <!-- Restaurant info -->
                <v-col cols="12" sm="3" class="d-flex align-center">
                  <v-avatar size="40" class="mr-3">
                    <v-img :src="order.restaurant.logo || '/img/placeholder-restaurant.png'" alt="Restaurant"></v-img>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">{{ order.restaurant.name }}</div>
                    <div class="text-caption text-medium-emphasis">
                      {{ order.orderItems.length }} item{{ order.orderItems.length > 1 ? 's' : '' }}
                    </div>
                  </div>
                </v-col>
                
                <!-- Date and total -->
                <v-col cols="12" sm="3" class="d-flex flex-column justify-center">
                  <div class="text-caption text-medium-emphasis">
                    <v-icon size="small">mdi-calendar</v-icon>
                    {{ formatDate(order.createdAt) }}
                  </div>
                  <div class="text-caption text-medium-emphasis mt-1">
                    <v-icon size="small">mdi-clock-outline</v-icon>
                    {{ formatTime(order.createdAt) }}
                  </div>
                </v-col>
                
                <v-col cols="12" sm="3" class="d-flex flex-column justify-center">
                  <div class="font-weight-medium">${{ order.totalAmount.toFixed(2) }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ getPaymentMethodName(order.paymentMethod) }}
                  </div>
                </v-col>
                
                <!-- Actions -->
                <v-col cols="12" sm="3" class="d-flex justify-end align-center">
                  <div>
                    <v-btn
                      color="primary"
                      variant="text"
                      :to="`/orders/${order.id}`"
                      class="ml-2"
                    >
                      View Details
                    </v-btn>
                    
                    <div v-if="order.status === 'delivered'" class="d-flex mt-2 justify-end">
                      <v-rating
                        v-if="order.rating"
                        :model-value="order.rating"
                        color="amber"
                        density="compact"
                        size="small"
                        readonly
                        half-increments
                      ></v-rating>
                      <v-btn
                        v-else
                        size="small"
                        variant="text"
                        color="amber-darken-2"
                        :to="`/orders/${order.id}`"
                        prepend-icon="mdi-star-outline"
                      >
                        Rate Order
                      </v-btn>
                    </div>
                  </div>
                </v-col>
              </v-row>
              
              <!-- Order tracking for active orders -->
              <v-expand-transition>
                <div v-if="isActiveOrder(order)" class="mt-4">
                  <v-divider class="mb-4"></v-divider>
                  
                  <div class="tracking-container">
                    <v-timeline align="start" direction="horizontal" density="compact">
                      <v-timeline-item
                        v-for="(status, index) in orderStatusFlow"
                        :key="status.value"
                        :dot-color="getTimelineColor(status.value, order.status)"
                        :size="getTimelineSize(status.value, order.status)"
                        :icon="isCurrentStatus(status.value, order.status) ? status.icon : undefined"
                      >
                        <template v-slot:opposite>
                          <div 
                            class="status-label"
                            :class="{ 
                              'font-weight-bold': isCurrentStatus(status.value, order.status),
                              'text-disabled': !isStatusReached(status.value, order.status)
                            }"
                          >
                            {{ status.label }}
                          </div>
                        </template>
                      </v-timeline-item>
                    </v-timeline>
                  </div>
                  
                  <!-- Order actions -->
                  <div v-if="order.status === 'pending' || order.status === 'confirmed'" class="d-flex justify-end mt-2">
                    <v-btn
                      color="error"
                      variant="text"
                      size="small"
                      @click="showCancelDialog(order)"
                    >
                      Cancel Order
                    </v-btn>
                  </div>
                </div>
              </v-expand-transition>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Pagination -->
      <div class="text-center mt-6" v-if="totalPages > 1">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          total-visible="7"
          @update:model-value="changePage"
        ></v-pagination>
      </div>
    </div>
    
    <!-- Cancel Order Dialog -->
    <v-dialog v-model="showCancelOrderDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Cancel Your Order</v-card-title>
        <v-card-text>
          <p class="mb-4">Are you sure you want to cancel this order? This action cannot be undone.</p>
          
          <v-textarea
            v-model="cancellationReason"
            label="Reason for Cancellation"
            placeholder="Please tell us why you're cancelling this order..."
            variant="outlined"
            rows="3"
            :rules="[v => !!v || 'Reason is required']"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showCancelOrderDialog = false"
          >
            Keep Order
          </v-btn>
          <v-btn
            color="error"
            :loading="isCancelling"
            :disabled="!cancellationReason"
            @click="cancelOrder"
          >
            Cancel Order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { format, parseISO } from 'date-fns';

export default {
  name: 'OrdersView',
  
  data() {
    return {
      isLoading: true,
      activeTab: 'all',
      currentPage: 1,
      perPage: 5,
      totalOrders: 0,
      showCancelOrderDialog: false,
      selectedOrderId: null,
      cancellationReason: '',
      isCancelling: false,
      
      // Order status flow (same as in OrderDetails view)
      orderStatusFlow: [
        { value: 'pending', label: 'Pending', icon: 'mdi-clock-outline' },
        { value: 'confirmed', label: 'Confirmed', icon: 'mdi-check-circle-outline' },
        { value: 'preparing', label: 'Preparing', icon: 'mdi-food-outline' },
        { value: 'ready_for_pickup', label: 'Ready', icon: 'mdi-package-variant-closed' },
        { value: 'out_for_delivery', label: 'On the Way', icon: 'mdi-truck-delivery-outline' },
        { value: 'delivered', label: 'Delivered', icon: 'mdi-check-circle' }
      ]
    };
  },
  
  computed: {
    ...mapState({
      orders: state => state.order.orders,
      error: state => state.order.error
    }),
    
    totalPages() {
      return Math.ceil(this.totalOrders / this.perPage);
    },
    
    filteredOrders() {
      if (this.activeTab === 'all') {
        return this.orders;
      }
      
      if (this.activeTab === 'active') {
        return this.orders.filter(order => 
          ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(order.status)
        );
      }
      
      if (this.activeTab === 'completed') {
        return this.orders.filter(order => order.status === 'delivered');
      }
      
      if (this.activeTab === 'cancelled') {
        return this.orders.filter(order => order.status === 'cancelled');
      }
      
      return this.orders;
    }
  },
  
  watch: {
    activeTab() {
      this.currentPage = 1;
      this.loadOrders();
    }
  },
  
  created() {
    this.loadOrders();
  },
  
  methods: {
    ...mapActions({
      fetchOrders: 'order/fetchOrders',
      cancelOrderAction: 'order/cancelOrder'
    }),
    
    async loadOrders() {
      try {
        this.isLoading = true;
        
        // Convert tab to status filter
        let statusFilter = null;
        if (this.activeTab === 'active') {
          statusFilter = 'active';
        } else if (this.activeTab !== 'all') {
          statusFilter = this.activeTab;
        }
        
        const response = await this.fetchOrders({
          page: this.currentPage,
          limit: this.perPage,
          status: statusFilter
        });
        
        this.totalOrders = response.meta.total;
      } catch (error) {
        console.error('Failed to load orders:', error);
        this.$toast.error('Failed to load your orders. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    
    async changePage(page) {
      this.currentPage = page;
      await this.loadOrders();
      // Scroll to top when page changes
      window.scrollTo(0, 0);
    },
    
    formatDate(dateTime) {
      if (!dateTime) return 'N/A';
      
      const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
      return format(date, 'MMM d, yyyy');
    },
    
    formatTime(dateTime) {
      if (!dateTime) return 'N/A';
      
      const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
      return format(date, 'h:mm a');
    },
    
    formatStatus(status) {
      return status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    },
    
    isActiveOrder(order) {
      return ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'].includes(order.status);
    },
    
    getStatusColor(status) {
      const statusColors = {
        pending: 'blue',
        confirmed: 'indigo',
        preparing: 'deep-purple',
        ready_for_pickup: 'deep-orange',
        out_for_delivery: 'amber-darken-2',
        delivered: 'success',
        cancelled: 'error'
      };
      
      return statusColors[status] || 'grey';
    },
    
    getPaymentMethodName(method) {
      const names = {
        cash: 'Cash on Delivery',
        credit_card: 'Credit Card',
        debit_card: 'Debit Card',
        e_wallet: 'E-Wallet'
      };
      
      return names[method] || 'Unknown Payment Method';
    },
    
    // Timeline status helpers (same as in OrderDetails view)
    getTimelineColor(statusValue, currentStatus) {
      if (this.isStatusReached(statusValue, currentStatus)) {
        return this.isCurrentStatus(statusValue, currentStatus) ? this.getStatusColor(currentStatus) : 'success';
      }
      return 'grey';
    },
    
    getTimelineSize(statusValue, currentStatus) {
      return this.isCurrentStatus(statusValue, currentStatus) ? 'small' : 'x-small';
    },
    
    isCurrentStatus(statusValue, currentStatus) {
      return statusValue === currentStatus;
    },
    
    isStatusReached(statusValue, currentStatus) {
      const statusOrder = {
        pending: 0,
        confirmed: 1,
        preparing: 2,
        ready_for_pickup: 3,
        out_for_delivery: 4,
        delivered: 5,
        cancelled: -1
      };
      
      // Special handling for cancelled status
      if (currentStatus === 'cancelled') {
        return statusValue === 'cancelled';
      }
      
      return statusOrder[statusValue] <= statusOrder[currentStatus];
    },
    
    showCancelDialog(order) {
      this.selectedOrderId = order.id;
      this.showCancelOrderDialog = true;
    },
    
    async cancelOrder() {
      if (!this.cancellationReason || !this.selectedOrderId) return;
      
      try {
        this.isCancelling = true;
        
        await this.cancelOrderAction({
          id: this.selectedOrderId,
          cancellationReason: this.cancellationReason
        });
        
        this.showCancelOrderDialog = false;
        this.$toast.success('Your order has been cancelled');
        
        // Reset form and reload orders
        this.cancellationReason = '';
        this.selectedOrderId = null;
        await this.loadOrders();
      } catch (error) {
        console.error('Failed to cancel order:', error);
        this.$toast.error('Failed to cancel your order. Please try again.');
      } finally {
        this.isCancelling = false;
      }
    }
  }
};
</script>

<style scoped>
.order-card {
  transition: all 0.3s ease;
}

.order-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.border-accent {
  border-left: 4px solid var(--v-primary-base);
}

.tracking-container {
  overflow-x: auto;
}

.status-label {
  font-size: 0.7rem;
  text-align: center;
  max-width: 60px;
  white-space: normal;
  word-break: break-word;
}

.text-disabled {
  color: rgba(0, 0, 0, 0.38);
}
</style>