<template>
  <div class="order-tracking">
    <v-container>
      <!-- Loading State -->
      <v-row v-if="loading" class="py-12">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <div class="mt-4">Loading your order details...</div>
        </v-col>
      </v-row>

      <!-- Error State -->
      <v-row v-else-if="error">
        <v-col cols="12">
          <v-alert type="error" title="Error loading order" :text="error"></v-alert>
          <div class="text-center mt-4">
            <v-btn color="primary" @click="$router.push('/orders')">
              View All Orders
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Order Details -->
      <template v-else-if="order">
        <v-row>
          <v-col cols="12">
            <v-card class="mb-4">
              <v-card-title class="d-flex justify-space-between align-center">
                <div>
                  Order #{{ order.order_number }}
                  <v-chip
                    :color="getStatusColor(order.status)"
                    class="ml-2"
                    size="small"
                  >
                    {{ formatStatus(order.status) }}
                  </v-chip>
                </div>
                <div class="text-subtitle-2">
                  {{ formatDate(order.created_at) }}
                </div>
              </v-card-title>
              
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="6">
                    <div class="text-h6 mb-2">Estimated Delivery Time</div>
                    <div class="d-flex align-center">
                      <v-icon color="primary" class="mr-2">mdi-clock-outline</v-icon>
                      <div class="text-h5">
                        {{ order.status === 'delivered' ? 'Delivered' : formatETA(order.estimated_delivery_time) }}
                      </div>
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="6">
                    <div class="text-h6 mb-2">Delivery Address</div>
                    <div class="d-flex align-center">
                      <v-icon color="primary" class="mr-2">mdi-map-marker</v-icon>
                      <div>{{ order.delivery_address }}</div>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row>
          <!-- Left Column: Map and Shipper -->
          <v-col cols="12" lg="8">
            <!-- Live Map Tracking -->
            <v-card class="mb-4">
              <v-card-title>Live Order Tracking</v-card-title>
              <v-card-text class="pa-0">
                <div class="tracking-map" style="height: 400px; position: relative;">
                  <!-- Map Component -->
                  <MapView
                    v-if="userLocation && driverLocation"
                    :userLocation="userLocation"
                    :driverLocation="driverLocation"
                    :restaurantLocation="restaurantLocation"
                    :orderStatus="order.status"
                  />
                  <div v-else class="d-flex justify-center align-center fill-height">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                  </div>

                  <!-- Map Legend -->
                  <div class="map-legend pa-2">
                    <div class="d-flex align-center mb-2">
                      <v-icon color="red" size="small" class="mr-2">mdi-map-marker</v-icon>
                      <span class="text-caption">Restaurant</span>
                    </div>
                    <div class="d-flex align-center mb-2">
                      <v-icon color="green" size="small" class="mr-2">mdi-map-marker</v-icon>
                      <span class="text-caption">Delivery Address</span>
                    </div>
                    <div class="d-flex align-center">
                      <v-icon color="blue" size="small" class="mr-2">mdi-motorbike</v-icon>
                      <span class="text-caption">Delivery Driver</span>
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Shipper Information -->
            <v-card v-if="order.status !== 'pending' && order.status !== 'preparing' && order.shipper">
              <v-card-title>Your Delivery Driver</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="4" sm="3" class="text-center">
                    <v-avatar size="80" color="grey-lighten-2" class="mb-2">
                      <v-img
                        v-if="order.shipper.image"
                        :src="`${baseUrl}/uploads/profiles/${order.shipper.image}`"
                        alt="Driver Photo"
                      ></v-img>
                      <span v-else class="text-h4">{{ getInitials(order.shipper.name) }}</span>
                    </v-avatar>
                  </v-col>
                  
                  <v-col cols="8" sm="9">
                    <div class="text-h6">{{ order.shipper.name }}</div>
                    <div class="d-flex align-center mb-2">
                      <v-rating
                        :model-value="order.shipper.rating || 0"
                        color="amber"
                        density="compact"
                        half-increments
                        readonly
                        size="small"
                      ></v-rating>
                      <span class="ml-1 text-caption">
                        {{ order.shipper.rating ? order.shipper.rating.toFixed(1) : '0.0' }}
                      </span>
                    </div>
                    
                    <div class="d-flex justify-space-between mt-4">
                      <v-btn
                        prepend-icon="mdi-phone"
                        color="primary"
                        variant="outlined"
                        @click="callDriver(order.shipper.phone)"
                        class="flex-grow-1 mr-2"
                      >
                        Call Driver
                      </v-btn>
                      
                      <v-btn
                        prepend-icon="mdi-message-text"
                        color="secondary"
                        variant="outlined"
                        @click="showChatDialog = true"
                        class="flex-grow-1"
                      >
                        Message
                      </v-btn>
                    </div>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Right Column: Status Timeline and Order Details -->
          <v-col cols="12" lg="4">
            <!-- Order Status Timeline -->
            <v-card class="mb-4">
              <v-card-title>Order Status</v-card-title>
              <v-card-text class="pb-0">
                <v-timeline side="end">
                  <v-timeline-item
                    dot-color="green"
                    size="small"
                    :icon="getStatusIcon('pending')"
                    :complete="order.status !== 'pending'"
                    :icon-color="getStatusTimelineColor('pending', order.status)"
                  >
                    <div class="d-flex justify-space-between">
                      <div>
                        <div class="text-subtitle-2">Order Placed</div>
                        <div class="text-caption">Your order has been received</div>
                      </div>
                      <div v-if="order.status_timestamps?.pending" class="text-caption">
                        {{ formatTimeOnly(order.status_timestamps.pending) }}
                      </div>
                    </div>
                  </v-timeline-item>
                  
                  <v-timeline-item
                    dot-color="amber"
                    size="small"
                    :icon="getStatusIcon('preparing')"
                    :complete="['preparing', 'ready', 'picking_up', 'on_the_way', 'delivered'].includes(order.status)"
                    :icon-color="getStatusTimelineColor('preparing', order.status)"
                  >
                    <div class="d-flex justify-space-between">
                      <div>
                        <div class="text-subtitle-2">Preparing</div>
                        <div class="text-caption">Restaurant is preparing your food</div>
                      </div>
                      <div v-if="order.status_timestamps?.preparing" class="text-caption">
                        {{ formatTimeOnly(order.status_timestamps.preparing) }}
                      </div>
                    </div>
                  </v-timeline-item>
                  
                  <v-timeline-item
                    dot-color="amber"
                    size="small"
                    :icon="getStatusIcon('ready')"
                    :complete="['ready', 'picking_up', 'on_the_way', 'delivered'].includes(order.status)"
                    :icon-color="getStatusTimelineColor('ready', order.status)"
                  >
                    <div class="d-flex justify-space-between">
                      <div>
                        <div class="text-subtitle-2">Ready for Pickup</div>
                        <div class="text-caption">Your food is ready</div>
                      </div>
                      <div v-if="order.status_timestamps?.ready" class="text-caption">
                        {{ formatTimeOnly(order.status_timestamps.ready) }}
                      </div>
                    </div>
                  </v-timeline-item>
                  
                  <v-timeline-item
                    dot-color="primary"
                    size="small"
                    :icon="getStatusIcon('picking_up')"
                    :complete="['picking_up', 'on_the_way', 'delivered'].includes(order.status)"
                    :icon-color="getStatusTimelineColor('picking_up', order.status)"
                  >
                    <div class="d-flex justify-space-between">
                      <div>
                        <div class="text-subtitle-2">Driver Pickup</div>
                        <div class="text-caption">Driver is picking up your order</div>
                      </div>
                      <div v-if="order.status_timestamps?.picking_up" class="text-caption">
                        {{ formatTimeOnly(order.status_timestamps.picking_up) }}
                      </div>
                    </div>
                  </v-timeline-item>
                  
                  <v-timeline-item
                    dot-color="primary"
                    size="small"
                    :icon="getStatusIcon('on_the_way')"
                    :complete="['on_the_way', 'delivered'].includes(order.status)"
                    :icon-color="getStatusTimelineColor('on_the_way', order.status)"
                  >
                    <div class="d-flex justify-space-between">
                      <div>
                        <div class="text-subtitle-2">On The Way</div>
                        <div class="text-caption">Driver is on the way to you</div>
                      </div>
                      <div v-if="order.status_timestamps?.on_the_way" class="text-caption">
                        {{ formatTimeOnly(order.status_timestamps.on_the_way) }}
                      </div>
                    </div>
                  </v-timeline-item>
                  
                  <v-timeline-item
                    dot-color="success"
                    size="small"
                    :icon="getStatusIcon('delivered')"
                    :complete="order.status === 'delivered'"
                    :icon-color="getStatusTimelineColor('delivered', order.status)"
                  >
                    <div class="d-flex justify-space-between">
                      <div>
                        <div class="text-subtitle-2">Delivered</div>
                        <div class="text-caption">Enjoy your meal!</div>
                      </div>
                      <div v-if="order.status_timestamps?.delivered" class="text-caption">
                        {{ formatTimeOnly(order.status_timestamps.delivered) }}
                      </div>
                    </div>
                  </v-timeline-item>
                </v-timeline>
              </v-card-text>
            </v-card>

            <!-- Order Items -->
            <v-card class="mb-4">
              <v-card-title class="d-flex justify-space-between align-center">
                <div>Order Items</div>
                <div class="text-caption">from {{ order.restaurant?.name }}</div>
              </v-card-title>
              
              <v-card-text class="pb-0">
                <div v-for="(item, index) in order.items" :key="index" class="mb-4">
                  <div class="d-flex justify-space-between">
                    <div class="d-flex">
                      <div class="mr-2 font-weight-medium">{{ item.quantity }}x</div>
                      <div>
                        <div class="font-weight-medium">{{ item.product.name }}</div>
                        <div class="text-caption" v-if="item.options && item.options.length">
                          <span v-for="(option, i) in item.options" :key="i">
                            {{ option.name }}{{ i < item.options.length - 1 ? ', ' : '' }}
                          </span>
                        </div>
                        <div class="text-caption" v-if="item.notes">
                          Note: {{ item.notes }}
                        </div>
                      </div>
                    </div>
                    <div class="text-subtitle-2">{{ formatPrice(item.subtotal) }}</div>
                  </div>
                </div>
                
                <v-divider class="my-3"></v-divider>
                
                <div class="d-flex justify-space-between mb-2">
                  <div>Subtotal</div>
                  <div>{{ formatPrice(order.subtotal) }}</div>
                </div>
                
                <div class="d-flex justify-space-between mb-2">
                  <div>Delivery Fee</div>
                  <div>{{ formatPrice(order.delivery_fee) }}</div>
                </div>
                
                <div v-if="order.discount_amount > 0" class="d-flex justify-space-between mb-2">
                  <div>Discount</div>
                  <div class="text-success">-{{ formatPrice(order.discount_amount) }}</div>
                </div>
                
                <div class="d-flex justify-space-between mb-2">
                  <div>Tax</div>
                  <div>{{ formatPrice(order.tax_amount) }}</div>
                </div>
                
                <v-divider class="my-3"></v-divider>
                
                <div class="d-flex justify-space-between font-weight-bold">
                  <div class="text-subtitle-1">Total</div>
                  <div class="text-subtitle-1">{{ formatPrice(order.total_amount) }}</div>
                </div>
              </v-card-text>
              
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-receipt"
                  @click="downloadReceipt"
                >
                  Download Receipt
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- Driver Chat Dialog -->
        <v-dialog v-model="showChatDialog" max-width="500">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <div>Message Driver</div>
              <v-btn icon="mdi-close" variant="text" @click="showChatDialog = false"></v-btn>
            </v-card-title>
            
            <v-card-text>
              <div class="chat-messages pa-2" ref="chatContainer">
                <div v-for="(message, index) in chatMessages" :key="index" class="mb-3">
                  <div :class="`message-bubble ${message.sender === 'user' ? 'user-message' : 'driver-message'}`">
                    {{ message.text }}
                    <div class="message-time">{{ formatTimeOnly(message.timestamp) }}</div>
                  </div>
                </div>
              </div>
              
              <v-textarea
                v-model="newMessage"
                rows="2"
                label="Type your message"
                append-inner-icon="mdi-send"
                @click:append-inner="sendMessage"
                @keyup.enter="sendMessage"
                auto-grow
                hide-details
                class="mt-3"
              ></v-textarea>
            </v-card-text>
          </v-card>
        </v-dialog>
      </template>
    </v-container>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import MapView from '@/components/MapView.vue';
import { API_URL } from '@/config';

export default {
  name: 'OrderTracking',
  
  components: {
    MapView
  },
  
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  
  data() {
    return {
      loading: true,
      error: null,
      refreshInterval: null,
      locationInterval: null,
      userLocation: null,
      driverLocation: null,
      restaurantLocation: null,
      showChatDialog: false,
      newMessage: '',
      chatMessages: [],
      baseUrl: API_URL
    };
  },
  
  computed: {
    ...mapState({
      order: state => state.orders.currentOrder
    })
  },
  
  methods: {
    ...mapActions({
      fetchOrder: 'orders/fetchOrderById',
      updateDriverLocation: 'orders/updateDriverLocation'
    }),
    
    formatDate(dateString) {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    
    formatTimeOnly(dateString) {
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
    
    formatStatus(status) {
      const statusMap = {
        pending: 'Pending',
        preparing: 'Preparing',
        ready: 'Ready for pickup',
        picking_up: 'Driver pickup',
        on_the_way: 'On the way',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      };
      
      return statusMap[status] || status;
    },
    
    getStatusColor(status) {
      const colorMap = {
        pending: 'grey',
        preparing: 'amber',
        ready: 'amber-darken-2',
        picking_up: 'blue',
        on_the_way: 'blue-darken-2',
        delivered: 'success',
        cancelled: 'error'
      };
      
      return colorMap[status] || 'grey';
    },
    
    getStatusIcon(status) {
      const iconMap = {
        pending: 'mdi-receipt',
        preparing: 'mdi-food',
        ready: 'mdi-food-variant',
        picking_up: 'mdi-store',
        on_the_way: 'mdi-motorbike',
        delivered: 'mdi-check-circle',
        cancelled: 'mdi-cancel'
      };
      
      return iconMap[status] || 'mdi-help-circle';
    },
    
    getStatusTimelineColor(stepStatus, currentStatus) {
      const statusOrder = [
        'pending',
        'preparing',
        'ready',
        'picking_up',
        'on_the_way',
        'delivered'
      ];
      
      const currentIndex = statusOrder.indexOf(currentStatus);
      const stepIndex = statusOrder.indexOf(stepStatus);
      
      // If current status is further in the process than this step
      if (currentIndex >= stepIndex) {
        return 'success'; // Completed step
      } else if (currentIndex === stepIndex - 1) {
        return 'primary'; // Next step
      } else {
        return 'grey'; // Future step
      }
    },
    
    formatETA(etaTimestamp) {
      if (!etaTimestamp) return 'Calculating...';
      
      const eta = new Date(etaTimestamp);
      const now = new Date();
      
      if (eta < now) return 'Arriving soon';
      
      const diffMs = eta - now;
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 1) return 'Arriving now';
      if (diffMins === 1) return 'In 1 minute';
      if (diffMins < 60) return `In ${diffMins} minutes`;
      
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `In ${hours}h ${mins}m`;
    },
    
    getInitials(name) {
      if (!name) return '?';
      
      return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    },
    
    callDriver(phone) {
      if (!phone) {
        this.$toast.error('Driver phone number not available');
        return;
      }
      
      window.location.href = `tel:${phone}`;
    },
    
    sendMessage() {
      if (!this.newMessage.trim()) return;
      
      // Add message to chat
      this.chatMessages.push({
        sender: 'user',
        text: this.newMessage.trim(),
        timestamp: new Date().toISOString()
      });
      
      // Clear input
      this.newMessage = '';
      
      // Scroll to bottom of chat
      this.$nextTick(() => {
        if (this.$refs.chatContainer) {
          this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
        }
      });
      
      // In a real application, you would send this message to your backend
      // and it would be forwarded to the driver
      
      // Simulate driver response
      setTimeout(() => {
        this.chatMessages.push({
          sender: 'driver',
          text: 'I got your message. I\'ll be there soon!',
          timestamp: new Date().toISOString()
        });
        
        // Scroll to bottom again
        this.$nextTick(() => {
          if (this.$refs.chatContainer) {
            this.$refs.chatContainer.scrollTop = this.$refs.chatContainer.scrollHeight;
          }
        });
      }, 2000);
    },
    
    downloadReceipt() {
      // In a real application, this would generate a PDF receipt
      this.$toast.info('Receipt download functionality will be implemented soon');
    },
    
    async refreshOrderData() {
      try {
        await this.fetchOrder(this.id);
        
        // Set up locations for map
        if (this.order) {
          // Set restaurant location
          if (this.order.restaurant && 
              this.order.restaurant.latitude && 
              this.order.restaurant.longitude) {
            this.restaurantLocation = {
              lat: parseFloat(this.order.restaurant.latitude),
              lng: parseFloat(this.order.restaurant.longitude)
            };
          }
          
          // Set delivery address location
          if (this.order.delivery_latitude && this.order.delivery_longitude) {
            this.userLocation = {
              lat: parseFloat(this.order.delivery_latitude),
              lng: parseFloat(this.order.delivery_longitude)
            };
          }
          
          // Set driver location
          if (this.order.driver_latitude && this.order.driver_longitude) {
            this.driverLocation = {
              lat: parseFloat(this.order.driver_latitude),
              lng: parseFloat(this.order.driver_longitude)
            };
          }
        }
      } catch (error) {
        console.error('Error refreshing order data:', error);
        // Don't show error to user on refresh, only on initial load
      }
    },
    
    simulateDriverMovement() {
      // This is a simulation of driver movement for demo purposes
      // In a real application, you would get this data from your backend
      if (!this.driverLocation || !this.userLocation || this.order.status === 'delivered') {
        return;
      }
      
      const moveFactor = 0.0001; // Small movement increment
      
      // Calculate direction towards destination
      const latDiff = this.userLocation.lat - this.driverLocation.lat;
      const lngDiff = this.userLocation.lng - this.driverLocation.lng;
      
      // Update driver position
      this.driverLocation = {
        lat: this.driverLocation.lat + (latDiff * moveFactor),
        lng: this.driverLocation.lng + (lngDiff * moveFactor)
      };
      
      // Update in store
      this.updateDriverLocation({
        orderId: this.id,
        latitude: this.driverLocation.lat,
        longitude: this.driverLocation.lng
      });
    }
  },
  
  async mounted() {
    this.loading = true;
    
    try {
      await this.fetchOrder(this.id);
      await this.refreshOrderData();
    } catch (error) {
      console.error('Error loading order:', error);
      this.error = 'Failed to load order details. Please try again later.';
    } finally {
      this.loading = false;
    }
    
    // Set up interval to refresh order data every 15 seconds
    this.refreshInterval = setInterval(this.refreshOrderData, 15000);
    
    // Set up interval to simulate driver movement every 2 seconds
    this.locationInterval = setInterval(this.simulateDriverMovement, 2000);
  },
  
  beforeUnmount() {
    // Clear intervals when component is destroyed
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    if (this.locationInterval) clearInterval(this.locationInterval);
  }
};
</script>

<style scoped>
.order-tracking {
  padding-bottom: 40px;
}

.tracking-map {
  border-radius: 8px;
  overflow: hidden;
}

.map-legend {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  z-index: 10;
}

.chat-messages {
  height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  max-width: 80%;
  position: relative;
  margin-bottom: 4px;
}

.user-message {
  background-color: #E3F2FD;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.driver-message {
  background-color: #F5F5F5;
  margin-right: auto;
  border-bottom-left-radius: 4px;
}

.message-time {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.54);
  text-align: right;
  margin-top: 2px;
}
</style>
