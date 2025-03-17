<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title class="d-flex justify-space-between">
            <div>
              <h2 class="text-h5">Order #{{ orderId }}</h2>
              <span class="text-subtitle-1 text-grey">{{ formatDate(order.created_at) }}</span>
            </div>
            <v-chip
              :color="getStatusColor(order.status)"
              text-color="white"
              pill
            >
              {{ formatStatus(order.status) }}
            </v-chip>
          </v-card-title>
          
          <v-card-text>
            <v-timeline density="compact" align="start">
              <v-timeline-item
                v-for="(step, index) in orderSteps"
                :key="index"
                :dot-color="getStepColor(step, order.status)"
                :icon="step.icon"
              >
                <div class="d-flex justify-space-between">
                  <div>
                    <div class="text-h6">{{ step.title }}</div>
                    <div class="text-subtitle-2 text-grey">{{ step.description }}</div>
                  </div>
                  <div v-if="step.time" class="text-caption text-grey">
                    {{ step.time }}
                  </div>
                </div>
              </v-timeline-item>
            </v-timeline>
            
            <div class="mt-4">
              <div class="text-h6">Estimated Delivery Time</div>
              <div class="text-h4 font-weight-bold">{{ order.eta || 'Calculating...' }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col cols="12" md="7">
        <v-card height="400px">
          <v-card-title>Live Tracking</v-card-title>
          <v-card-text class="pa-0">
            <div class="map-container" ref="mapContainer" style="width: 100%; height: 350px;"></div>
          </v-card-text>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="5">
        <v-card>
          <v-card-title>Order Details</v-card-title>
          <v-card-text>
            <div v-if="order.restaurant" class="mb-4">
              <div class="text-h6">{{ order.restaurant.name }}</div>
              <div class="text-body-2">{{ order.restaurant.address }}</div>
              <div class="text-body-2">{{ order.restaurant.phone }}</div>
            </div>
            
            <v-divider></v-divider>
            
            <div class="my-4">
              <div class="text-h6 mb-2">Items</div>
              <v-list density="compact">
                <v-list-item 
                  v-for="item in order.items" 
                  :key="item.id"
                  :title="`${item.quantity}x ${item.product.name}`"
                  :subtitle="item.options ? formatOptions(item.options) : ''"
                >
                  <template v-slot:append>
                    <div class="text-body-2">{{ formatPrice(item.price * item.quantity) }}</div>
                  </template>
                </v-list-item>
              </v-list>
            </div>
            
            <v-divider></v-divider>
            
            <div class="mt-4">
              <div class="d-flex justify-space-between mb-1">
                <div>Subtotal</div>
                <div>{{ formatPrice(order.subtotal) }}</div>
              </div>
              <div class="d-flex justify-space-between mb-1">
                <div>Delivery Fee</div>
                <div>{{ formatPrice(order.delivery_fee) }}</div>
              </div>
              <div v-if="order.discount" class="d-flex justify-space-between mb-1">
                <div>Discount</div>
                <div class="text-success">-{{ formatPrice(order.discount) }}</div>
              </div>
              <div v-if="order.tax" class="d-flex justify-space-between mb-1">
                <div>Tax</div>
                <div>{{ formatPrice(order.tax) }}</div>
              </div>
              <div class="d-flex justify-space-between font-weight-bold text-h6 mt-2">
                <div>Total</div>
                <div>{{ formatPrice(order.total) }}</div>
              </div>
            </div>
            
            <v-divider class="my-4"></v-divider>
            
            <div>
              <div class="text-h6 mb-2">Delivery Information</div>
              <div class="text-body-1">{{ order.delivery_address?.recipient_name }}</div>
              <div class="text-body-2">{{ formatFullAddress(order.delivery_address) }}</div>
              <div class="text-body-2">{{ order.delivery_address?.phone }}</div>
            </div>
            
            <v-divider class="my-4"></v-divider>
            
            <div v-if="order.shipper">
              <div class="text-h6 mb-2">Delivery Driver</div>
              <div class="d-flex align-center">
                <v-avatar class="mr-2" color="grey-lighten-1">
                  <v-img 
                    v-if="order.shipper.avatar" 
                    :src="order.shipper.avatar"
                    alt="Driver avatar"
                  ></v-img>
                  <v-icon v-else icon="mdi-account"></v-icon>
                </v-avatar>
                <div>
                  <div class="text-body-1">{{ order.shipper.name }}</div>
                  <div class="d-flex align-center">
                    <v-rating
                      :model-value="order.shipper.rating || 0"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="small"
                    ></v-rating>
                    <span class="text-caption ml-1">
                      {{ order.shipper.rating || '0' }} ({{ order.shipper.rating_count || '0' }} ratings)
                    </span>
                  </div>
                </div>
              </div>
              <v-btn
                class="mt-2"
                prepend-icon="mdi-phone"
                variant="tonal"
                color="primary"
                @click="contactDriver"
              >
                Contact Driver
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <v-row v-if="showReviewPrompt">
      <v-col cols="12">
        <v-card class="mt-4">
          <v-card-title>How was your order?</v-card-title>
          <v-card-text>
            <div class="text-center mb-4">
              <v-rating
                v-model="reviewData.rating"
                color="amber"
                half-increments
                hover
                size="large"
              ></v-rating>
            </div>
            <v-textarea
              v-model="reviewData.comment"
              label="Leave a comment (optional)"
              placeholder="Tell us about your experience..."
              rows="3"
              counter="500"
              maxlength="500"
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              @click="showReviewPrompt = false"
            >
              Skip
            </v-btn>
            <v-btn
              color="primary"
              :disabled="reviewData.rating === 0"
              :loading="isSubmittingReview"
              @click="submitReview"
            >
              Submit Review
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
    <v-dialog v-model="contactDialog" max-width="400">
      <v-card>
        <v-card-title>Contact Driver</v-card-title>
        <v-card-text>
          <div class="text-body-1 mb-4">
            You can contact your driver through our app or call directly:
          </div>
          <v-list>
            <v-list-item
              prepend-icon="mdi-message-text"
              title="Send a message"
              @click="sendMessage"
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-phone"
              title="Call driver"
              :subtitle="order.shipper?.phone"
              @click="callDriver"
            ></v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="contactDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { useMapService } from '@/composables/useMapService';
import { useToast } from '@/composables/useToast';
import axios from 'axios';

export default {
  name: 'OrderTracking',
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  
  setup() {
    const { initMap, addMarker, addRoute, updateMarkerPosition } = useMapService();
    const { showSuccess, showError } = useToast();
    
    return {
      initMap,
      addMarker,
      addRoute,
      updateMarkerPosition,
      showSuccess,
      showError
    };
  },
  
  data() {
    return {
      orderId: this.id,
      order: {
        status: 'pending',
        created_at: new Date(),
        items: [],
        subtotal: 0,
        delivery_fee: 0,
        tax: 0,
        discount: 0,
        total: 0,
        eta: null,
        restaurant: null,
        shipper: null,
        delivery_address: null
      },
      orderSteps: [
        { 
          status: 'pending', 
          title: 'Order Placed', 
          description: 'We\'ve received your order', 
          icon: 'mdi-receipt',
          time: null
        },
        { 
          status: 'confirmed', 
          title: 'Order Confirmed', 
          description: 'Restaurant is preparing your food', 
          icon: 'mdi-check-circle',
          time: null
        },
        { 
          status: 'preparing', 
          title: 'Preparing', 
          description: 'Your food is being prepared', 
          icon: 'mdi-food',
          time: null
        },
        { 
          status: 'ready_for_pickup', 
          title: 'Ready for Pickup', 
          description: 'Food is ready, waiting for driver', 
          icon: 'mdi-package-variant',
          time: null
        },
        { 
          status: 'picked_up', 
          title: 'Picked Up', 
          description: 'Driver has picked up your order', 
          icon: 'mdi-shopping',
          time: null
        },
        { 
          status: 'on_the_way', 
          title: 'On the Way', 
          description: 'Driver is heading to your location', 
          icon: 'mdi-truck-delivery',
          time: null
        },
        { 
          status: 'delivered', 
          title: 'Delivered', 
          description: 'Enjoy your meal!', 
          icon: 'mdi-check-decagram',
          time: null
        }
      ],
      map: null,
      driverMarker: null,
      restaurantMarker: null,
      destinationMarker: null,
      pollingInterval: null,
      websocket: null,
      contactDialog: false,
      showReviewPrompt: false,
      isSubmittingReview: false,
      reviewData: {
        rating: 0,
        comment: ''
      }
    };
  },
  
  computed: {
    isOrderCompleted() {
      return this.order.status === 'delivered' || this.order.status === 'canceled';
    }
  },
  
  created() {
    this.fetchOrderDetails();
  },
  
  async mounted() {
    await this.$nextTick();
    this.initializeMap();
    this.setupRealtimeUpdates();
  },
  
  beforeUnmount() {
    // Clean up interval and websocket
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    if (this.websocket) {
      this.websocket.close();
    }
  },
  
  methods: {
    async fetchOrderDetails() {
      try {
        const response = await axios.get(`/api/orders/${this.orderId}`);
        this.order = response.data;
        
        // Update timeline with actual timestamps from status history
        if (this.order.status_history) {
          this.orderSteps.forEach(step => {
            const statusEntry = this.order.status_history.find(
              history => history.status === step.status
            );
            if (statusEntry) {
              step.time = this.formatTime(new Date(statusEntry.timestamp));
            }
          });
        }
        
        // If order is delivered and not yet reviewed, show review prompt
        if (this.order.status === 'delivered' && !this.order.is_reviewed) {
          this.showReviewPrompt = true;
        }
        
        // Update map with latest locations
        this.updateMap();
      } catch (error) {
        console.error('Error fetching order details:', error);
        this.showError('Failed to load order details');
      }
    },
    
    initializeMap() {
      if (!this.$refs.mapContainer) return;
      
      this.map = this.initMap(this.$refs.mapContainer, {
        zoom: 14,
        center: { lat: 10.8231, lng: 106.6297 } // Default center (HCMC)
      });
    },
    
    updateMap() {
      if (!this.map || !this.order.restaurant) return;
      
      const restaurantLocation = {
        lat: parseFloat(this.order.restaurant.latitude),
        lng: parseFloat(this.order.restaurant.longitude)
      };
      
      const deliveryLocation = {
        lat: parseFloat(this.order.delivery_address.latitude),
        lng: parseFloat(this.order.delivery_address.longitude)
      };
      
      // Add restaurant marker
      this.restaurantMarker = this.addMarker(this.map, restaurantLocation, {
        title: this.order.restaurant.name,
        icon: 'restaurant'
      });
      
      // Add destination marker
      this.destinationMarker = this.addMarker(this.map, deliveryLocation, {
        title: 'Delivery Address',
        icon: 'destination'
      });
      
      // Add driver marker if available
      if (this.order.shipper && this.order.shipper.latitude && this.order.shipper.longitude) {
        const driverLocation = {
          lat: parseFloat(this.order.shipper.latitude),
          lng: parseFloat(this.order.shipper.longitude)
        };
        
        this.driverMarker = this.addMarker(this.map, driverLocation, {
          title: 'Driver Location',
          icon: 'driver'
        });
        
        // Draw route if order is on the way
        if (this.order.status === 'on_the_way') {
          this.addRoute(this.map, driverLocation, deliveryLocation);
        } else if (this.order.status === 'picked_up') {
          this.addRoute(this.map, restaurantLocation, driverLocation);
        }
      }
      
      // Center map to show all markers
      this.fitMapBounds();
    },
    
    fitMapBounds() {
      // Logic to adjust map bounds to show all markers
      // This would be implemented in the useMapService composable
    },
    
    setupRealtimeUpdates() {
      // Set up websocket connection for real-time updates
      try {
        this.websocket = new WebSocket(`ws://${window.location.host}/api/ws/order/${this.orderId}`);
        
        this.websocket.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleRealtimeUpdate(data);
        };
        
        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.startPolling(); // Fallback to polling if WebSocket fails
        };
      } catch (error) {
        console.warn('WebSocket not supported, falling back to polling');
        this.startPolling();
      }
    },
    
    startPolling() {
      // Fallback to polling if WebSockets are not available
      this.pollingInterval = setInterval(() => {
        this.fetchOrderDetails();
      }, 15000); // Poll every 15 seconds
    },
    
    handleRealtimeUpdate(data) {
      // Handle different types of updates
      if (data.type === 'status_update') {
        this.order.status = data.status;
        
        // Update the timestamp for this status step
        const stepIndex = this.orderSteps.findIndex(step => step.status === data.status);
        if (stepIndex >= 0) {
          this.orderSteps[stepIndex].time = this.formatTime(new Date());
        }
        
        this.showSuccess(`Order status updated to: ${this.formatStatus(data.status)}`);
        
        // Show review prompt if order is delivered
        if (data.status === 'delivered') {
          this.showReviewPrompt = true;
        }
      } else if (data.type === 'location_update' && data.role === 'driver') {
        // Update driver location on map
        const driverLocation = {
          lat: parseFloat(data.latitude),
          lng: parseFloat(data.longitude)
        };
        
        if (this.driverMarker) {
          this.updateMarkerPosition(this.driverMarker, driverLocation);
        } else {
          this.driverMarker = this.addMarker(this.map, driverLocation, {
            title: 'Driver Location',
            icon: 'driver'
          });
        }
        
        // Update ETA if provided
        if (data.eta) {
          this.order.eta = data.eta;
        }
      }
    },
    
    contactDriver() {
      this.contactDialog = true;
    },
    
    sendMessage() {
      // Implementation would depend on your messaging system
      this.showSuccess('Message feature will be implemented soon');
      this.contactDialog = false;
    },
    
    callDriver() {
      // Implement phone call functionality
      if (this.order.shipper?.phone) {
        window.location.href = `tel:${this.order.shipper.phone}`;
      }
      this.contactDialog = false;
    },
    
    async submitReview() {
      if (this.reviewData.rating === 0) return;
      
      try {
        this.isSubmittingReview = true;
        
        await axios.post(`/api/reviews`, {
          order_id: this.orderId,
          restaurant_id: this.order.restaurant.id,
          rating: this.reviewData.rating,
          comment: this.reviewData.comment
        });
        
        this.showSuccess('Thank you for your feedback!');
        this.showReviewPrompt = false;
        this.order.is_reviewed = true;
      } catch (error) {
        console.error('Error submitting review:', error);
        this.showError('Failed to submit review. Please try again.');
      } finally {
        this.isSubmittingReview = false;
      }
    },
    
    // Helper methods
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    
    formatTime(date) {
      return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    
    formatStatus(status) {
      const statusMap = {
        'pending': 'Order Placed',
        'confirmed': 'Confirmed',
        'preparing': 'Preparing',
        'ready_for_pickup': 'Ready for Pickup',
        'picked_up': 'Picked Up',
        'on_the_way': 'On the Way',
        'delivered': 'Delivered',
        'canceled': 'Canceled'
      };
      
      return statusMap[status] || status;
    },
    
    getStatusColor(status) {
      const colorMap = {
        'pending': 'grey',
        'confirmed': 'blue',
        'preparing': 'amber',
        'ready_for_pickup': 'deep-orange',
        'picked_up': 'indigo',
        'on_the_way': 'primary',
        'delivered': 'success',
        'canceled': 'error'
      };
      
      return colorMap[status] || 'grey';
    },
    
    getStepColor(step, currentStatus) {
      // Find the current status index in the steps array
      const currentStepIndex = this.orderSteps.findIndex(s => s.status === currentStatus);
      const stepIndex = this.orderSteps.findIndex(s => s.status === step.status);
      
      if (stepIndex < currentStepIndex) {
        return 'success'; // Completed step
      } else if (stepIndex === currentStepIndex) {
        return 'primary'; // Current step
      } else {
        return 'grey'; // Future step
      }
    },
    
    formatPrice(price) {
      if (price == null) return '$0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price);
    },
    
    formatOptions(options) {
      if (!options) return '';
      try {
        const optionsObj = typeof options === 'string' ? JSON.parse(options) : options;
        return Object.entries(optionsObj)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ');
      } catch (e) {
        return options;
      }
    },
    
    formatFullAddress(address) {
      if (!address) return '';
      return [
        address.street_address,
        address.city,
        address.state,
        address.postal_code,
        address.country
      ].filter(Boolean).join(', ');
    }
  }
};
</script>

<style scoped>
.v-timeline-item {
  margin-bottom: 8px;
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 350px;
}
</style>
