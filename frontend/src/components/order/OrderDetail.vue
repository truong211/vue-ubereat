<template>
  <div class="order-detail">
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <span>Order Details</span>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          prepend-icon="mdi-arrow-left"
          @click="$router.back()"
        >
          Back
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
          <div class="mt-2">Loading order details...</div>
        </div>
        
        <div v-else-if="error" class="text-center py-4">
          <v-alert
            type="error"
            :text="error"
          ></v-alert>
          <v-btn
            color="primary"
            class="mt-4"
            @click="loadOrderDetails"
          >
            Try Again
          </v-btn>
        </div>
        
        <div v-else-if="order">
          <!-- Order Info -->
          <v-row>
            <v-col cols="12" md="6">
              <v-list>
                <v-list-subheader>Order Information</v-list-subheader>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-pound"></v-icon>
                  </template>
                  <v-list-item-title>Order ID</v-list-item-title>
                  <v-list-item-subtitle>#{{ order.id }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-calendar"></v-icon>
                  </template>
                  <v-list-item-title>Date & Time</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ formatDate(order.created_at) }} at {{ formatTime(order.created_at) }}
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-credit-card"></v-icon>
                  </template>
                  <v-list-item-title>Payment Method</v-list-item-title>
                  <v-list-item-subtitle class="text-capitalize">
                    {{ order.payment_method }}
                    <v-chip
                      size="x-small"
                      :color="getPaymentStatusColor(order.payment_status)"
                      class="text-capitalize ml-2"
                    >
                      {{ order.payment_status }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-tag"></v-icon>
                  </template>
                  <v-list-item-title>Status</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip
                      :color="getStatusColor(order.status)"
                      size="small"
                      class="text-capitalize"
                    >
                      {{ order.status }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
            
            <!-- Delivery Info -->
            <v-col cols="12" md="6">
              <v-list>
                <v-list-subheader>Delivery Information</v-list-subheader>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon icon="mdi-map-marker"></v-icon>
                  </template>
                  <v-list-item-title>Delivery Address</v-list-item-title>
                  <v-list-item-subtitle>{{ order.delivery_address }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="order.estimated_delivery_time">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-clock-outline"></v-icon>
                  </template>
                  <v-list-item-title>Estimated Delivery</v-list-item-title>
                  <v-list-item-subtitle>{{ formatTime(order.estimated_delivery_time) }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="order.delivery_notes">
                  <template v-slot:prepend>
                    <v-icon icon="mdi-note-text"></v-icon>
                  </template>
                  <v-list-item-title>Delivery Notes</v-list-item-title>
                  <v-list-item-subtitle>{{ order.delivery_notes }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
          
          <!-- Order Items -->
          <v-divider class="my-3"></v-divider>
          <h3 class="text-subtitle-1 font-weight-bold mb-3">Order Items</h3>
          
          <v-list lines="two">
            <v-list-item
              v-for="(item, index) in order.order_details"
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
            <div>{{ formatPrice(getSubtotal(order)) }}</div>
          </div>
          
          <div v-if="order.delivery_fee" class="d-flex justify-space-between align-center mb-2">
            <div class="text-subtitle-1">Delivery Fee</div>
            <div>{{ formatPrice(order.delivery_fee) }}</div>
          </div>
          
          <div v-if="order.discount" class="d-flex justify-space-between align-center mb-2">
            <div class="text-subtitle-1">Discount</div>
            <div class="text-success">-{{ formatPrice(order.discount) }}</div>
          </div>
          
          <div class="d-flex justify-space-between align-center mb-2">
            <div class="text-h6 font-weight-bold">Total</div>
            <div class="text-h6 font-weight-bold">{{ formatPrice(order.total_amount) }}</div>
          </div>
        </div>
        
        <div v-else class="text-center py-4">
          <v-alert
            type="warning"
            text="Order not found"
          ></v-alert>
        </div>
      </v-card-text>
      
      <v-card-actions v-if="order">
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
          color="primary"
          variant="outlined"
          :to="`/order/${order.id}/tracking`"
          v-if="canTrackOrder(order)"
        >
          Track Order
        </v-btn>
        <v-btn
          color="error"
          variant="outlined"
          @click="cancelOrder"
          v-if="canCancelOrder(order)"
        >
          Cancel Order
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Cancel Order Confirmation Dialog -->
    <v-dialog
      v-model="cancelDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-h5">
          Cancel Order
        </v-card-title>
        
        <v-card-text>
          <p>Are you sure you want to cancel this order?</p>
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
import { mapActions } from 'vuex';

export default {
  name: 'OrderDetail',
  
  props: {
    id: {
      type: [Number, String],
      required: true
    }
  },
  
  data() {
    return {
      loading: false,
      error: null,
      order: null,
      cancelDialog: false,
      cancelReason: '',
      cancelling: false
    };
  },
  
  methods: {
    ...mapActions({
      fetchOrder: 'orders/fetchOrderDetails',
      cancelOrderAction: 'orders/cancelOrder'
    }),
    
    async loadOrderDetails() {
      this.loading = true;
      this.error = null;
      
      try {
        this.order = await this.fetchOrder(this.id);
      } catch (error) {
        this.error = 'Failed to load order details. Please try again.';
        console.error('Error loading order details:', error);
      } finally {
        this.loading = false;
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date);
    },
    
    formatTime(dateString) {
      if (!dateString) return '';
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
    
    canTrackOrder(order) {
      const trackableStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'];
      return trackableStatuses.includes(order.status);
    },
    
    canCancelOrder(order) {
      const cancellableStatuses = ['pending', 'confirmed'];
      return cancellableStatuses.includes(order.status);
    },
    
    printOrder() {
      window.print();
    },
    
    cancelOrder() {
      this.cancelDialog = true;
      this.cancelReason = '';
    },
    
    async confirmCancelOrder() {
      if (!this.cancelReason) return;
      
      this.cancelling = true;
      
      try {
        await this.cancelOrderAction({
          orderId: this.order.id,
          reason: this.cancelReason
        });
        
        this.$toast.success('Order cancelled successfully');
        this.cancelDialog = false;
        
        // Refresh order details
        await this.loadOrderDetails();
      } catch (error) {
        this.$toast.error('Failed to cancel order');
        console.error('Error cancelling order:', error);
      } finally {
        this.cancelling = false;
      }
    }
  },
  
  mounted() {
    this.loadOrderDetails();
  }
};
</script>

<style scoped>
.order-detail {
  max-width: 1200px;
  margin: 0 auto;
}

@media print {
  .v-btn,
  .v-card-actions {
    display: none !important;
  }
}
</style> 