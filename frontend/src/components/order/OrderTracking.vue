<template>
  <div class="order-tracking">
    <v-container>
      <v-row>
        <!-- Order Status Card -->
        <v-col cols="12" md="5" lg="4">
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <span>Order #{{ order?.id || '...' }}</span>
              <v-spacer></v-spacer>
              <v-chip
                v-if="order"
                :color="getStatusColor(order.status)"
                class="text-capitalize"
              >
                {{ order.status }}
              </v-chip>
            </v-card-title>
            
            <v-card-text v-if="loading">
              <div class="text-center py-8">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="64"
                ></v-progress-circular>
                <div class="mt-4">Loading order details...</div>
              </div>
            </v-card-text>
            
            <template v-else-if="order">
              <!-- Order Status Timeline -->
              <v-card-text>
                <v-timeline align="start" direction="vertical" line-thickness="2">
                  <v-timeline-item
                    v-for="(status, index) in orderStatuses"
                    :key="status.value"
                    :dot-color="getTimelineDotColor(status.value, order.status)"
                    :icon="status.icon"
                    :size="getTimelineSize(status.value, order.status)"
                    :line-color="getTimelineLineColor(status.value, order.status, index)"
                  >
                    <div class="d-flex align-center">
                      <div>
                        <div class="text-subtitle-1 font-weight-medium">{{ status.label }}</div>
                        <div v-if="getStatusTime(status.value)" class="text-caption">
                          {{ formatTime(getStatusTime(status.value)) }}
                        </div>
                      </div>
                      <v-spacer></v-spacer>
                      <v-icon
                        v-if="isStatusCompleted(status.value)"
                        color="success"
                        size="small"
                      >
                        mdi-check-circle
                      </v-icon>
                    </div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
              
              <!-- Estimated Delivery Time -->
              <v-card-text v-if="order.status !== 'delivered' && order.status !== 'cancelled'">
                <div class="text-center pa-4 rounded-lg bg-primary-lighten-5">
                  <div class="text-overline">Estimated Delivery Time</div>
                  <div class="text-h5 font-weight-bold">{{ formatEstimatedTime(order.estimatedDeliveryTime) }}</div>
                  <div class="text-caption">{{ getEstimatedTimeDescription() }}</div>
                </div>
              </v-card-text>
              
              <!-- Restaurant Info -->
              <v-divider></v-divider>
              <v-list lines="two">
                <v-list-subheader>Restaurant Information</v-list-subheader>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-avatar size="40" rounded>
                      <v-img
                        :src="order.restaurant.image_url || '/images/restaurant-placeholder.jpg'"
                        cover
                      ></v-img>
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ order.restaurant.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    <div class="d-flex align-center">
                      <v-icon size="small" class="mr-1">mdi-phone</v-icon>
                      <span>{{ order.restaurant.phone || 'No phone available' }}</span>
                    </div>
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              
              <!-- Driver Info (if assigned) -->
              <template v-if="order.driver && order.status !== 'delivered' && order.status !== 'cancelled'">
                <v-divider></v-divider>
                <v-list lines="two">
                  <v-list-subheader>Delivery Driver</v-list-subheader>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-avatar color="primary">
                        <span class="text-h6 text-white">{{ order.driver.name.charAt(0) }}</span>
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ order.driver.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      <div class="d-flex align-center">
                        <v-icon size="small" class="mr-1">mdi-phone</v-icon>
                        <span>{{ order.driver.phone }}</span>
                      </div>
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-btn
                        icon
                        color="primary"
                        variant="text"
                        @click="callDriver"
                      >
                        <v-icon>mdi-phone</v-icon>
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
              </template>
              
              <!-- Order Actions -->
              <v-card-actions>
                <v-btn
                  block
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-food"
                  :to="{ name: 'OrderDetail', params: { id: order.id }}"
                >
                  View Order Details
                </v-btn>
              </v-card-actions>
              
              <!-- Cancel Order Button (if order is still pending) -->
              <v-card-actions v-if="canCancelOrder">
                <v-btn
                  block
                  color="error"
                  variant="outlined"
                  prepend-icon="mdi-cancel"
                  @click="showCancelDialog = true"
                >
                  Cancel Order
                </v-btn>
              </v-card-actions>
            </template>
          </v-card>
        </v-col>
        
        <!-- Map and Delivery Info -->
        <v-col cols="12" md="7" lg="8">
          <v-card class="mb-4">
            <v-card-title>Delivery Tracking</v-card-title>
            
            <v-card-text v-if="loading">
              <div class="text-center py-8">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="64"
                ></v-progress-circular>
              </div>
            </v-card-text>
            
            <v-card-text v-else-if="order">
              <!-- Delivery Map -->
              <div class="map-container">
                <div ref="mapContainer" class="map"></div>
                
                <!-- Map Placeholder (replace with actual map implementation) -->
                <div v-if="!mapInitialized" class="map-placeholder d-flex flex-column align-center justify-center">
                  <v-icon size="64" color="grey-lighten-1">mdi-map</v-icon>
                  <div class="text-body-1 mt-4">Map loading...</div>
                </div>
              </div>
              
              <!-- Delivery Address -->
              <div class="mt-4 pa-4 rounded-lg bg-grey-lighten-4">
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-map-marker</v-icon>
                  <div>
                    <div class="text-subtitle-1 font-weight-medium">Delivery Address</div>
                    <div class="text-body-2">{{ order.delivery_address }}</div>
                  </div>
                </div>
              </div>
              
              <!-- Delivery Instructions (if any) -->
              <div v-if="order.delivery_instructions" class="mt-4 pa-4 rounded-lg bg-grey-lighten-4">
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-information</v-icon>
                  <div>
                    <div class="text-subtitle-1 font-weight-medium">Delivery Instructions</div>
                    <div class="text-body-2">{{ order.delivery_instructions }}</div>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Order Summary Card -->
          <v-card v-if="order">
            <v-card-title>Order Summary</v-card-title>
            
            <v-list lines="two">
              <v-list-item
                v-for="(item, index) in order.order_details"
                :key="index"
              >
                <template v-slot:prepend>
                  <div class="text-subtitle-1 font-weight-medium mr-2">{{ item.quantity }}x</div>
                </template>
                
                <v-list-item-title>{{ item.product.name }}</v-list-item-title>
                
                <v-list-item-subtitle v-if="item.options && item.options.length > 0">
                  Options: {{ formatOptions(item.options) }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ formatPrice(item.price * item.quantity) }}
                  </div>
                </template>
              </v-list-item>
            </v-list>
            
            <v-divider></v-divider>
            
            <!-- Order Totals -->
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <div class="text-body-1">Subtotal</div>
                <div class="text-body-1">{{ formatPrice(getSubtotal()) }}</div>
              </div>
              
              <div v-if="order.delivery_fee" class="d-flex justify-space-between mb-2">
                <div class="text-body-1">Delivery Fee</div>
                <div class="text-body-1">{{ formatPrice(order.delivery_fee) }}</div>
              </div>
              
              <div v-if="order.discount" class="d-flex justify-space-between mb-2">
                <div class="text-body-1">Discount</div>
                <div class="text-body-1 text-success">-{{ formatPrice(order.discount) }}</div>
              </div>
              
              <div class="d-flex justify-space-between mt-4">
                <div class="text-h6 font-weight-bold">Total</div>
                <div class="text-h6 font-weight-bold">{{ formatPrice(order.total_amount) }}</div>
              </div>
              
              <div class="d-flex justify-space-between mt-2">
                <div class="text-caption">Payment Method</div>
                <div class="text-caption text-capitalize">
                  {{ order.payment_method }}
                  <v-chip
                    size="x-small"
                    :color="getPaymentStatusColor(order.payment_status)"
                    class="text-capitalize ml-2"
                  >
                    {{ order.payment_status }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Cancel Order Dialog -->
    <v-dialog v-model="showCancelDialog" max-width="500">
      <v-card>
        <v-card-title>Cancel Order?</v-card-title>
        
        <v-card-text>
          <p>Are you sure you want to cancel your order? This action cannot be undone.</p>
          
          <v-textarea
            v-model="cancelReason"
            label="Reason for cancellation (optional)"
            rows="3"
            variant="outlined"
            class="mt-4"
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showCancelDialog = false"
          >
            Keep Order
          </v-btn>
          <v-btn
            color="error"
            @click="cancelOrder"
            :loading="cancelling"
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
  name: 'OrderTracking',
  
  props: {
    orderId: {
      type: [Number, String],
      required: true
    }
  },
  
  data() {
    return {
      loading: true,
      mapInitialized: false,
      map: null,
      driverMarker: null,
      restaurantMarker: null,
      destinationMarker: null,
      routePath: null,
      showCancelDialog: false,
      cancelling: false,
      cancelReason: '',
      orderStatuses: [
        { value: 'pending', label: 'Order Placed', icon: 'mdi-receipt' },
        { value: 'confirmed', label: 'Order Confirmed', icon: 'mdi-check-circle' },
        { value: 'preparing', label: 'Preparing', icon: 'mdi-food' },
        { value: 'ready_for_pickup', label: 'Ready for Pickup', icon: 'mdi-package-variant-closed' },
        { value: 'out_for_delivery', label: 'Out for Delivery', icon: 'mdi-truck-delivery' },
        { value: 'delivered', label: 'Delivered', icon: 'mdi-home' }
      ],
      statusUpdates: {}
    };
  },
  
  computed: {
    ...mapState({
      order: state => state.orders.currentOrder,
      user: state => state.auth.user
    }),
    
    canCancelOrder() {
      if (!this.order) return false;
      return ['pending', 'confirmed'].includes(this.order.status);
    }
  },
  
  methods: {
    ...mapActions({
      fetchOrder: 'orders/fetchOrderById',
      cancelOrderAction: 'orders/cancelOrder',
      subscribeToOrderUpdates: 'orders/subscribeToOrderUpdates',
      unsubscribeFromOrderUpdates: 'orders/unsubscribeFromOrderUpdates'
    }),
    
    async loadOrderData() {
      this.loading = true;
      
      try {
        await this.fetchOrder(this.orderId);
        
        // Initialize status updates with timestamps from order
        if (this.order && this.order.status_updates) {
          this.statusUpdates = this.order.status_updates;
        }
        
        // Subscribe to real-time updates
        this.subscribeToOrderUpdates(this.orderId);
        
        // Initialize map after order data is loaded
        this.$nextTick(() => {
          this.initMap();
        });
      } catch (error) {
        this.$toast.error('Failed to load order details');
        console.error('Error loading order details:', error);
      } finally {
        this.loading = false;
      }
    },
    
    initMap() {
      // This is a placeholder for actual map implementation
      // You would use Google Maps, Mapbox, or another mapping library here
      
      // Simulate map initialization
      setTimeout(() => {
        this.mapInitialized = true;
        
        // If we have driver location, update the map
        if (this.order && this.order.driver && this.order.driver.location) {
          this.updateDriverLocation(this.order.driver.location);
        }
      }, 1000);
    },
    
    updateDriverLocation(location) {
      // This would update the driver's marker on the map
      // For now, we'll just log the location
      console.log('Driver location updated:', location);
    },
    
    async cancelOrder() {
      if (!this.order) return;
      
      this.cancelling = true;
      
      try {
        await this.cancelOrderAction({
          orderId: this.order.id,
          reason: this.cancelReason
        });
        
        this.$toast.success('Order cancelled successfully');
        this.showCancelDialog = false;
      } catch (error) {
        this.$toast.error('Failed to cancel order');
        console.error('Error cancelling order:', error);
      } finally {
        this.cancelling = false;
      }
    },
    
    callDriver() {
      if (!this.order || !this.order.driver || !this.order.driver.phone) return;
      
      // Open phone dialer
      window.location.href = `tel:${this.order.driver.phone}`;
    },
    
    getStatusTime(status) {
      return this.statusUpdates[status] || null;
    },
    
    isStatusCompleted(status) {
      if (!this.order) return false;
      
      const statusIndex = this.orderStatuses.findIndex(s => s.value === status);
      const currentStatusIndex = this.orderStatuses.findIndex(s => s.value === this.order.status);
      
      return statusIndex <= currentStatusIndex;
    },
    
    getTimelineDotColor(status, currentStatus) {
      if (status === currentStatus) return 'primary';
      if (this.isStatusCompleted(status)) return 'success';
      return 'grey';
    },
    
    getTimelineSize(status, currentStatus) {
      if (status === currentStatus) return 'large';
      return 'small';
    },
    
    getTimelineLineColor(status, currentStatus, index) {
      if (index === this.orderStatuses.length - 1) return 'transparent';
      if (this.isStatusCompleted(status)) return 'success';
      return 'grey';
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
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    
    formatEstimatedTime(timestamp) {
      if (!timestamp) return 'Calculating...';
      
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    
    getEstimatedTimeDescription() {
      if (!this.order || !this.order.estimatedDeliveryTime) return '';
      
      const now = new Date();
      const estimatedTime = new Date(this.order.estimatedDeliveryTime);
      const diffMinutes = Math.round((estimatedTime - now) / (1000 * 60));
      
      if (diffMinutes <= 0) return 'Arriving any moment now';
      return `Arriving in approximately ${diffMinutes} minutes`;
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
    
    getSubtotal() {
      if (!this.order || !this.order.order_details) return 0;
      
      return this.order.order_details.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
  },
  
  async mounted() {
    await this.loadOrderData();
  },
  
  beforeUnmount() {
    // Unsubscribe from real-time updates
    this.unsubscribeFromOrderUpdates(this.orderId);
  }
};
</script>

<style scoped>
.order-tracking {
  max-width: 800px;
  margin: 0 auto;
}

.map-container {
  height: 300px;
  width: 100%;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-container {
  padding: 16px 0;
}

.timeline-item-wrapper {
  transition: all 0.3s ease;
}

.timeline-item-wrapper:hover {
  transform: translateX(4px);
}

.timeline-item.active {
  background-color: var(--v-primary-lighten-5);
  border-radius: 8px;
  padding: 8px;
  margin: -8px;
}

.eta-display {
  background-color: var(--v-primary-lighten-5);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.eta-content {
  position: relative;
  z-index: 1;
}

.progress-bar {
  height: 4px;
  background-color: var(--v-primary-lighten-3);
  border-radius: 2px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: var(--v-primary-base);
  transition: width 0.5s ease-out;
}

.chat-container {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.messages {
  flex-grow: 1;
  overflow-y: auto;
}

.message {
  max-width: 80%;
  margin-bottom: var(--spacing-sm);
}

.message.sent {
  margin-left: auto;
}

.message-bubble {
  background-color: var(--v-primary-lighten-4);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 12px;
  display: inline-block;
}

.message.sent .message-bubble {
  background-color: var(--v-primary-base);
  color: white;
}

.message-time {
  margin-top: 4px;
  opacity: 0.7;
}

.driver-info {
  border-top: 1px solid var(--v-border-base);
  background-color: var(--v-surface-base);
  transition: background-color 0.3s ease;
}

.driver-info:hover {
  background-color: var(--v-surface-lighten-1);
}

.map-info-window {
  padding: 8px;
  max-width: 200px;
}

.map-info-window h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.map-info-window p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

@media (max-width: 600px) {
  .map-container {
    height: 250px;
  }
  
  .message {
    max-width: 90%;
  }
  
  .eta-display {
    margin: 8px;
  }
  
  .timeline-container {
    padding: 8px 0;
  }
}
</style>
