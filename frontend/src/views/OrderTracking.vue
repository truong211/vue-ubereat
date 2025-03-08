<template>
  <v-container class="order-tracking-page py-8">
    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading order details...</p>
    </div>

    <div v-else>
      <!-- Order Status Header -->
      <v-card class="mb-6">
        <v-card-text class="pa-4">
          <v-row>
            <v-col cols="12" md="8">
              <div class="d-flex align-center mb-2">
                <h1 class="text-h5 font-weight-bold">Order #{{ order.id }}</h1>
                <v-chip
                  :color="getStatusColor(order.status)"
                  class="ml-4"
                  size="small"
                >
                  {{ getStatusText(order.status) }}
                </v-chip>
              </div>
              <p class="text-subtitle-1 mb-1">
                <v-icon size="small" class="mr-1">mdi-store</v-icon>
                {{ order.restaurant.name }}
              </p>
              <p class="text-body-2 text-medium-emphasis mb-4">
                <v-icon size="small" class="mr-1">mdi-calendar-clock</v-icon>
                Placed on {{ formatDate(order.createdAt) }} at {{ formatTime(order.createdAt) }}
              </p>
              
              <div v-if="order.status === 'delivered'" class="success-message pa-4 rounded mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon color="success" class="mr-2">mdi-check-circle</v-icon>
                  <span class="text-h6 font-weight-bold">Order Delivered!</span>
                </div>
                <p>Your order was delivered at {{ formatTime(order.deliveredAt) }}. Enjoy your meal!</p>
                <v-btn class="mt-2" variant="text" color="primary" @click="rateOrder">
                  Rate Your Order
                </v-btn>
              </div>
              
              <div v-else-if="order.status === 'cancelled'" class="error-message pa-4 rounded mb-4">
                <div class="d-flex align-center mb-2">
                  <v-icon color="error" class="mr-2">mdi-close-circle</v-icon>
                  <span class="text-h6 font-weight-bold">Order Cancelled</span>
                </div>
                <p>{{ order.cancellationReason }}</p>
                <v-btn class="mt-2" color="primary" to="/restaurants">
                  Order Again
                </v-btn>
              </div>
              
              <div v-else>
                <p class="text-body-1 mb-1">
                  <strong>Estimated delivery:</strong> {{ order.estimatedDeliveryTime }}
                </p>
                <p v-if="order.status === 'on_the_way'" class="text-body-2 text-medium-emphasis">
                  Your order is on the way! Track your driver on the map.
                </p>
              </div>
            </v-col>
            
            <v-col cols="12" md="4" class="d-flex justify-end align-start">
              <div>
                <v-btn 
                  variant="outlined" 
                  class="mb-2 ml-auto d-block"
                  prepend-icon="mdi-chat"
                  :href="`tel:${order.driver?.phone || order.restaurant.phone}`"
                  v-if="order.status === 'on_the_way' || order.status === 'preparing'"
                >
                  Contact {{ order.status === 'on_the_way' ? 'Driver' : 'Restaurant' }}
                </v-btn>
                <v-btn 
                  variant="outlined"
                  color="error"
                  class="ml-auto d-block"
                  prepend-icon="mdi-cancel"
                  @click="showCancelDialog = true"
                  v-if="['pending', 'confirmed', 'preparing'].includes(order.status)"
                >
                  Cancel Order
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-row>
        <!-- Order Progress and Map (left) -->
        <v-col cols="12" md="8">
          <!-- Order Progress -->
          <v-card class="mb-6" v-if="order.status !== 'cancelled'">
            <v-card-title>Order Progress</v-card-title>
            <v-card-text>
              <v-timeline align="start">
                <v-timeline-item
                  dot-color="primary"
                  size="small"
                  fill-dot
                >
                  <div class="d-flex justify-space-between">
                    <div>
                      <div class="text-subtitle-1 font-weight-bold">Order Placed</div>
                      <div class="text-caption">Your order has been received by the restaurant</div>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatTime(order.createdAt) }}
                    </div>
                  </div>
                </v-timeline-item>
                
                <v-timeline-item
                  dot-color="primary"
                  size="small"
                  :fill-dot="order.status !== 'pending'"
                >
                  <div class="d-flex justify-space-between">
                    <div>
                      <div class="text-subtitle-1" :class="{ 'font-weight-bold': order.status !== 'pending' }">
                        Order Confirmed
                      </div>
                      <div class="text-caption">Restaurant has confirmed your order</div>
                    </div>
                    <div v-if="order.confirmedAt" class="text-caption text-medium-emphasis">
                      {{ formatTime(order.confirmedAt) }}
                    </div>
                  </div>
                </v-timeline-item>
                
                <v-timeline-item
                  dot-color="primary"
                  size="small"
                  :fill-dot="['preparing', 'ready', 'on_the_way', 'delivered'].includes(order.status)"
                >
                  <div class="d-flex justify-space-between">
                    <div>
                      <div class="text-subtitle-1" :class="{ 'font-weight-bold': ['preparing', 'ready', 'on_the_way', 'delivered'].includes(order.status) }">
                        Preparing Order
                      </div>
                      <div class="text-caption">Your food is being prepared</div>
                    </div>
                    <div v-if="order.preparingAt" class="text-caption text-medium-emphasis">
                      {{ formatTime(order.preparingAt) }}
                    </div>
                  </div>
                </v-timeline-item>
                
                <v-timeline-item
                  dot-color="primary"
                  size="small"
                  :fill-dot="['ready', 'on_the_way', 'delivered'].includes(order.status)"
                >
                  <div class="d-flex justify-space-between">
                    <div>
                      <div class="text-subtitle-1" :class="{ 'font-weight-bold': ['ready', 'on_the_way', 'delivered'].includes(order.status) }">
                        Ready for Pickup
                      </div>
                      <div class="text-caption">Your order is ready and waiting for the driver</div>
                    </div>
                    <div v-if="order.readyAt" class="text-caption text-medium-emphasis">
                      {{ formatTime(order.readyAt) }}
                    </div>
                  </div>
                </v-timeline-item>
                
                <v-timeline-item
                  dot-color="primary"
                  size="small"
                  :fill-dot="['on_the_way', 'delivered'].includes(order.status)"
                >
                  <div class="d-flex justify-space-between">
                    <div>
                      <div class="text-subtitle-1" :class="{ 'font-weight-bold': ['on_the_way', 'delivered'].includes(order.status) }">
                        On the Way
                      </div>
                      <div v-if="order.driver && ['on_the_way', 'delivered'].includes(order.status)" class="text-caption">
                        {{ order.driver.name }} is delivering your order
                      </div>
                      <div v-else class="text-caption">
                        Your order will be picked up by a driver
                      </div>
                    </div>
                    <div v-if="order.pickedUpAt" class="text-caption text-medium-emphasis">
                      {{ formatTime(order.pickedUpAt) }}
                    </div>
                  </div>
                </v-timeline-item>
                
                <v-timeline-item
                  dot-color="success"
                  size="small"
                  :fill-dot="order.status === 'delivered'"
                >
                  <div class="d-flex justify-space-between">
                    <div>
                      <div class="text-subtitle-1" :class="{ 'font-weight-bold': order.status === 'delivered' }">
                        Delivered
                      </div>
                      <div class="text-caption">Your order has been delivered</div>
                    </div>
                    <div v-if="order.deliveredAt" class="text-caption text-medium-emphasis">
                      {{ formatTime(order.deliveredAt) }}
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>

          <!-- Map -->
          <v-card class="mb-6 d-flex flex-column" v-if="['on_the_way', 'preparing', 'ready'].includes(order.status)">
            <v-card-title class="d-flex justify-space-between align-center">
              <div class="d-flex align-center">
                <span>Live Tracking</span>
                <v-chip 
                  v-if="trackingStatus !== 'active'" 
                  size="small" 
                  :color="trackingStatus === 'connecting' ? 'warning' : 'error'"
                  class="ml-2"
                >
                  {{ trackingStatus === 'connecting' ? 'Connecting...' : 'Connection lost' }}
                </v-chip>
              </div>
              <div>
                <v-btn
                  v-if="trackingStatus === 'error'"
                  size="small"
                  color="error"
                  variant="text"
                  prepend-icon="mdi-refresh"
                  @click="retryConnection"
                  class="mr-2"
                >
                  Retry
                </v-btn>
                <v-chip v-if="driverInfo.eta" color="primary" size="small">
                  <v-icon start size="small">mdi-clock-outline</v-icon>
                  Arriving in {{ driverInfo.eta }} mins
                </v-chip>
              </div>
            </v-card-title>
            <v-card-text class="pa-0 flex-grow-1" style="min-height: 400px;">
              <delivery-map
                v-if="mapReady && trackingStatus !== 'error'"
                :restaurant-location="restaurantLocation"
                :delivery-location="deliveryLocation"
                :driver-location="driverLocation"
                :restaurant-name="order.restaurant?.name || 'Restaurant'"
                :delivery-address="order.deliveryAddress || 'Delivery Address'"
                :driver-info="driverInfo"
                :height="400"
                show-location-details
                @map-loaded="onMapLoaded"
                @map-error="onMapError"
              ></delivery-map>
              <div v-else-if="trackingStatus === 'error'" class="map-placeholder d-flex flex-column justify-center align-center" style="height: 400px;">
                <v-icon size="64" color="error" class="mb-4">mdi-access-point-network-off</v-icon>
                <p class="text-h6 mb-2">Connection Error</p>
                <p class="text-body-2 text-center mb-4" style="max-width: 300px;">
                  {{ trackingError || 'Unable to connect to tracking service. Please try again.' }}
                </p>
                <v-btn color="primary" prepend-icon="mdi-refresh" @click="retryConnection">
                  Retry Connection
                </v-btn>
              </div>
              <div v-else class="map-placeholder d-flex flex-column justify-center align-center" style="height: 400px;">
                <v-progress-circular indeterminate color="primary" size="48" class="mb-4"></v-progress-circular>
                <p>{{ trackingStatus === 'connecting' ? 'Connecting to tracking service...' : 'Loading map...' }}</p>
              </div>
            </v-card-text>
          </v-card>

          <!-- Driver Information -->
          <v-card v-if="order.driver && order.status === 'on_the_way'">
            <v-card-title>Your Driver</v-card-title>
            <v-card-text>
              <div class="d-flex align-center">
                <v-avatar size="64" class="mr-4">
                  <v-img v-if="order.driver.avatar" :src="order.driver.avatar" alt="Driver" cover></v-img>
                  <v-icon v-else size="32" color="primary">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h6">{{ order.driver.name }}</div>
                  <div class="d-flex align-center">
                    <v-rating
                      :model-value="order.driver.rating"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="small"
                    ></v-rating>
                    <span class="ml-2 text-caption">{{ order.driver.rating }} ({{ order.driver.totalDeliveries }}+ deliveries)</span>
                  </div>
                </div>
                <v-spacer></v-spacer>
                <v-btn 
                  color="primary" 
                  prepend-icon="mdi-phone" 
                  variant="outlined"
                  :href="`tel:${order.driver.phone}`"
                >
                  Call
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Order Details (right) -->
        <v-col cols="12" md="4">
          <v-card class="mb-6">
            <v-card-title>Order Details</v-card-title>
            <v-card-text>
              <div v-for="(item, index) in order.items" :key="index" class="mb-3 pb-3" :class="{'border-bottom': index < order.items.length - 1}">
                <div class="d-flex justify-space-between">
                  <div>
                    <div class="text-subtitle-1">{{ item.quantity }}× {{ item.name }}</div>
                    <div v-if="item.options && item.options.length" class="text-caption text-grey">
                      {{ item.options.join(', ') }}
                    </div>
                  </div>
                  <div class="text-subtitle-1">${{ (item.price * item.quantity).toFixed(2) }}</div>
                </div>
              </div>
              
              <v-divider class="my-4"></v-divider>
              
              <div class="d-flex justify-space-between mb-2">
                <span>Subtotal</span>
                <span>${{ order.subtotal.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Delivery Fee</span>
                <span>${{ order.deliveryFee.toFixed(2) }}</span>
              </div>
              <div v-if="order.tip" class="d-flex justify-space-between mb-2">
                <span>Driver Tip</span>
                <span>${{ order.tip.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Tax</span>
                <span>${{ order.tax.toFixed(2) }}</span>
              </div>
              <div v-if="order.discount" class="d-flex justify-space-between mb-2 text-success">
                <span>Discount</span>
                <span>-${{ order.discount.toFixed(2) }}</span>
              </div>
              
              <div class="d-flex justify-space-between font-weight-bold text-subtitle-1 mt-4">
                <span>Total</span>
                <span>${{ order.total.toFixed(2) }}</span>
              </div>
            </v-card-text>
          </v-card>
          
          <v-card class="mb-6">
            <v-card-title>Delivery Information</v-card-title>
            <v-card-text>
              <div class="mb-4">
                <div class="text-subtitle-2 font-weight-bold mb-1">Delivery Address</div>
                <p class="text-body-2">{{ order.deliveryAddress }}</p>
                <p v-if="order.deliveryInstructions" class="text-caption text-medium-emphasis mt-1">
                  <strong>Instructions:</strong> {{ order.deliveryInstructions }}
                </p>
              </div>
              
              <div>
                <div class="text-subtitle-2 font-weight-bold mb-1">Contact</div>
                <p class="text-body-2">{{ order.customerName }}</p>
                <p class="text-body-2">{{ order.customerPhone }}</p>
              </div>
            </v-card-text>
          </v-card>
          
          <v-card v-if="order.status === 'delivered'">
            <v-card-title>Need Help?</v-card-title>
            <v-card-text>
              <p class="text-body-2 mb-4">Something wrong with your order?</p>
              <v-btn 
                color="primary" 
                variant="outlined" 
                prepend-icon="mdi-help-circle" 
                block
                @click="reportIssue"
              >
                Report an Issue
              </v-btn>
            </v-card-text>
          </v-card>
          
          <v-card v-else-if="['pending', 'confirmed', 'preparing'].includes(order.status)">
            <v-card-title>Delivery Updates</v-card-title>
            <v-card-text>
              <p class="text-body-2 mb-4">We'll send you notifications about your order status.</p>
              <div class="d-flex align-center mb-3">
                <v-switch 
                  v-model="notificationPrefs.sms" 
                  color="primary" 
                  hide-details
                  class="mr-2"
                ></v-switch>
                <span>Receive SMS updates</span>
              </div>
              <div class="d-flex align-center">
                <v-switch 
                  v-model="notificationPrefs.email" 
                  color="primary" 
                  hide-details
                  class="mr-2"
                ></v-switch>
                <span>Receive email updates</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Cancel Order Dialog -->
    <v-dialog v-model="showCancelDialog" max-width="500">
      <v-card>
        <v-card-title>Cancel Order</v-card-title>
        <v-card-text>
          <p class="mb-4">Are you sure you want to cancel your order? Cancellation fees may apply.</p>
          <v-select
            v-model="cancellationReason"
            label="Reason for cancellation"
            :items="cancellationReasons"
            variant="outlined"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showCancelDialog = false">
            Keep Order
          </v-btn>
          <v-btn 
            color="error" 
            @click="cancelOrder" 
            :loading="isCancelling"
          >
            Cancel Order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Rate Order Dialog -->
    <v-dialog v-model="showRatingDialog" max-width="500">
      <v-card>
        <v-card-title>Rate Your Order</v-card-title>
        <v-card-text>
          <div class="text-center py-4">
            <div class="text-subtitle-1 mb-2">Food Quality</div>
            <v-rating
              v-model="rating.food"
              color="amber"
              hover
              half-increments
              size="large"
            ></v-rating>
          </div>
          
          <div class="text-center py-4">
            <div class="text-subtitle-1 mb-2">Delivery Experience</div>
            <v-rating
              v-model="rating.delivery"
              color="amber"
              hover
              half-increments
              size="large"
            ></v-rating>
          </div>
          
          <v-text-field
            v-model="rating.comment"
            label="Comments (optional)"
            variant="outlined"
            counter="250"
            rows="3"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showRatingDialog = false">
            Skip
          </v-btn>
          <v-btn 
            color="primary" 
            @click="submitRating" 
            :loading="isSubmittingRating"
            :disabled="!canSubmitRating"
          >
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Issue Reporting Dialog -->
    <v-dialog v-model="showIssueDialog" max-width="500">
      <v-card>
        <v-card-title>Report an Issue</v-card-title>
        <v-card-text>
          <v-select
            v-model="issue.type"
            label="What went wrong?"
            :items="issueTypes"
            variant="outlined"
            class="mb-4"
          ></v-select>
          
          <v-textarea
            v-model="issue.description"
            label="Please provide details"
            variant="outlined"
            counter="500"
            rows="4"
            :rules="[v => !!v || 'Please describe the issue']"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showIssueDialog = false">
            Cancel
          </v-btn>
          <v-btn 
            color="primary" 
            @click="submitIssue" 
            :loading="isSubmittingIssue"
            :disabled="!issue.description"
          >
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import DeliveryMap from '@/components/common/DeliveryMap.vue';
import websocketService from '@/services/websocket';
import L from 'leaflet';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';

export default {
  name: 'OrderTracking',
  components: {
    DeliveryMap
  },
  
  setup() {
    const store = useStore();
    const route = useRoute();
    const router = useRouter();
    
    // Order state - use the orderTracking module instead of local state
    const isLoading = ref(true);
    const socket = ref(null);
    const map = ref(null);
    const driverMarker = ref(null);
    
    // Map and location state
    const mapReady = ref(false);
    const restaurantLocation = ref({ lat: 0, lng: 0 });
    const deliveryLocation = ref({ lat: 0, lng: 0 });
    
    // Cancel order
    const showCancelDialog = ref(false);
    const cancellationReason = ref('');
    const cancellationReasons = [
      'Changed my mind',
      'Ordered by mistake',
      'Delivery taking too long',
      'Want to change my order',
      'Restaurant taking too long',
      'Other'
    ];
    const isCancelling = ref(false);
    
    // Rating
    const showRatingDialog = ref(false);
    const rating = ref({
      food: 0,
      delivery: 0,
      comment: ''
    });
    const isSubmittingRating = ref(false);
    
    // Issue reporting
    const showIssueDialog = ref(false);
    const issue = ref({
      type: '',
      description: ''
    });
    const issueTypes = [
      'Missing items',
      'Incorrect items',
      'Food quality issue',
      'Late delivery',
      'Delivery driver issue',
      'Damaged items',
      'Other'
    ];
    const isSubmittingIssue = ref(false);
    
    // Notification preferences
    const notificationPrefs = ref({
      sms: true,
      email: true
    });
    
    // Computed properties to access orderTracking store state
    const order = computed(() => store.getters['orderTracking/getCurrentOrder'] || {});
    const driverLocation = computed(() => store.getters['orderTracking/getDriverLocation']);
    const trackingStatus = computed(() => store.state.orderTracking.trackingStatus);
    const trackingError = computed(() => store.getters['orderTracking/getError']);
    const orderUpdates = computed(() => store.getters['orderTracking/getOrderUpdates']);
    const eta = computed(() => store.getters['orderTracking/getEta']);
    
    // Computed driver info
    const driverInfo = computed(() => {
      if (!order.value || !order.value.driver) return {};
      
      return {
        name: order.value.driver.name,
        phone: order.value.driver.phone,
        avatar: order.value.driver.avatar,
        rating: order.value.driver.rating,
        eta: eta.value || order.value.driverTimeAway,
        status: order.value.status
      };
    });
    
    // Fetch order data
    const fetchOrder = async () => {
      isLoading.value = true;
      
      try {
        const orderId = route.params.id;
        const orderData = await store.dispatch('orders/fetchOrderDetails', orderId);
        
        // Setup map locations
        if (orderData.restaurant && orderData.restaurant.location) {
          restaurantLocation.value = orderData.restaurant.location;
        }
        
        if (orderData.deliveryLocationCoordinates) {
          deliveryLocation.value = orderData.deliveryLocationCoordinates;
        }
        
        // Start tracking with the orderTracking module
        if (['confirmed', 'preparing', 'ready', 'on_the_way'].includes(orderData.status)) {
          store.dispatch('orderTracking/startTracking', orderData);
        }
        
        isLoading.value = false;
      } catch (error) {
        console.error('Failed to load order:', error);
        isLoading.value = false;
        
        // Show error notification
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to load order details. Please try again.',
          color: 'error'
        });
        
        // Redirect to orders page
        router.push('/orders');
      }
    };
    
    // Format date and time helpers
    const formatDate = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };
    
    const formatTime = (dateString) => {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
    };
    
    // Get status color and text
    const getStatusColor = (status) => {
      const statusColors = {
        pending: 'warning',
        confirmed: 'info',
        preparing: 'info',
        ready: 'info',
        on_the_way: 'primary',
        delivered: 'success',
        cancelled: 'error'
      };
      
      return statusColors[status] || 'grey';
    };
    
    const getStatusText = (status) => {
      const statusText = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        preparing: 'Preparing',
        ready: 'Ready for pickup',
        on_the_way: 'On the way',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      };
      
      return statusText[status] || 'Unknown';
    };
    
    // Map event handlers
    const onMapLoaded = (mapInstance) => {
      mapReady.value = true;
      console.log('Map loaded successfully');
    };
    
    const onMapError = (error) => {
      console.error('Map error:', error);
      
      // Show error notification
      store.dispatch('ui/showSnackbar', {
        text: 'Failed to load map. Please refresh the page.',
        color: 'error'
      });
    };
    
    // Retry connection when websocket has error
    const retryConnection = () => {
      store.dispatch('orderTracking/retryConnection');
    };
    
    // Cancel order
    const cancelOrder = async () => {
      if (!cancellationReason.value) {
        store.dispatch('ui/showSnackbar', {
          text: 'Please select a reason for cancellation',
          color: 'error'
        });
        return;
      }
      
      isCancelling.value = true;
      
      try {
        await store.dispatch('orders/cancelOrder', {
          orderId: order.value.id,
          reason: cancellationReason.value
        });
        
        // Update order in tracking store
        store.dispatch('orderTracking/updateOrderInfo', {
          ...order.value,
          status: 'cancelled',
          cancellationReason: cancellationReason.value
        });
        
        // Close dialog
        showCancelDialog.value = false;
        
        // Show success notification
        store.dispatch('ui/showSnackbar', {
          text: 'Order cancelled successfully',
          color: 'success'
        });
        
        // Stop tracking
        store.dispatch('orderTracking/stopTracking');
      } catch (error) {
        console.error('Failed to cancel order:', error);
        
        // Show error notification
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to cancel order. Please try again.',
          color: 'error'
        });
      } finally {
        isCancelling.value = false;
      }
    };
    
    // Rating
    const rateOrder = () => {
      showRatingDialog.value = true;
    };
    
    const canSubmitRating = computed(() => {
      return rating.value.food > 0 && rating.value.delivery > 0;
    });
    
    const submitRating = async () => {
      if (!canSubmitRating.value) return;
      
      isSubmittingRating.value = true;
      
      try {
        await store.dispatch('orders/rateOrder', {
          orderId: order.value.id,
          restaurantId: order.value.restaurant.id,
          foodRating: rating.value.food,
          deliveryRating: rating.value.delivery,
          comment: rating.value.comment
        });
        
        // Update order in tracking store
        store.dispatch('orderTracking/updateOrderInfo', {
          ...order.value,
          isRated: true
        });
        
        // Close dialog
        showRatingDialog.value = false;
        
        // Show success notification
        store.dispatch('ui/showSnackbar', {
          text: 'Thank you for your feedback!',
          color: 'success'
        });
      } catch (error) {
        console.error('Failed to submit rating:', error);
        
        // Show error notification
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to submit rating. Please try again.',
          color: 'error'
        });
      } finally {
        isSubmittingRating.value = false;
      }
    };
    
    // Issue reporting
    const reportIssue = () => {
      showIssueDialog.value = true;
    };
    
    const submitIssue = async () => {
      if (!issue.value.type || !issue.value.description) {
        store.dispatch('ui/showSnackbar', {
          text: 'Please fill in all fields',
          color: 'error'
        });
        return;
      }
      
      isSubmittingIssue.value = true;
      
      try {
        await store.dispatch('orders/reportIssue', {
          orderId: order.value.id,
          issueType: issue.value.type,
          description: issue.value.description
        });
        
        // Close dialog
        showIssueDialog.value = false;
        
        // Reset form
        issue.value = {
          type: '',
          description: ''
        };
        
        // Show success notification
        store.dispatch('ui/showSnackbar', {
          text: 'Your issue has been reported. Our team will contact you shortly.',
          color: 'success'
        });
      } catch (error) {
        console.error('Failed to submit issue:', error);
        
        // Show error notification
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to submit issue. Please try again.',
          color: 'error'
        });
      } finally {
        isSubmittingIssue.value = false;
      }
    };
    
    // Notification preferences
    const updateNotificationPrefs = async () => {
      try {
        await store.dispatch('user/updateNotificationPreferences', {
          orderId: order.value.id,
          preferences: {
            sms: notificationPrefs.value.sms,
            email: notificationPrefs.value.email
          }
        });
      } catch (error) {
        console.error('Failed to update notification preferences:', error);
      }
    };
    
    // Watch for changes to notification preferences
    watch(notificationPrefs, () => {
      updateNotificationPrefs();
    }, { deep: true });
    
    // Watch for order status changes to prompt for rating
    watch(() => order.value.status, (newStatus, oldStatus) => {
      if (newStatus === 'delivered' && oldStatus !== 'delivered' && !order.value.isRated) {
        // Delay the rating dialog to give the user time to see the delivery notification
        setTimeout(() => {
          showRatingDialog.value = true;
        }, 2000);
      }
    });
    
    const initializeMap = () => {
      if (!map.value && order.value.status === 'on_the_way') {
        map.value = L.map('map').setView([0, 0], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map.value);

        driverMarker.value = L.marker([0, 0])
          .addTo(map.value)
          .bindPopup('Driver Location');
      }
    };

    const updateDriverLocation = (location) => {
      if (map.value && driverMarker.value) {
        const { latitude, longitude } = location;
        const newLatLng = [latitude, longitude];
        
        driverMarker.value.setLatLng(newLatLng);
        map.value.setView(newLatLng);
      }
    };

    // Lifecycle hooks
    onMounted(() => {
      fetchOrder();

      // Initialize Socket.IO connection
      socket.value = io(import.meta.env.VITE_API_URL);
      socket.value.emit('join-order', order.value.id);

      socket.value.on('driver-location', updateDriverLocation);
      socket.value.on('order-status', (status) => {
        order.value.status = status.status;
        if (status.status === 'on_the_way') {
          initializeMap();
        }
      });

      // Initialize map if order is already on the way
      if (order.value.status === 'on_the_way') {
        initializeMap();
      };
    });
    
    onUnmounted(() => {
      // Stop tracking when component is unmounted
      store.dispatch('orderTracking/stopTracking');
      
      if (socket.value) {
        socket.value.disconnect();
      }
      if (map.value) {
        map.value.remove();
      }
    });
    
    return {
      order,
      isLoading,
      mapReady,
      restaurantLocation,
      deliveryLocation,
      driverLocation,
      driverInfo,
      trackingStatus,
      trackingError,
      showCancelDialog,
      cancellationReason,
      cancellationReasons,
      isCancelling,
      showRatingDialog,
      rating,
      isSubmittingRating,
      showIssueDialog,
      issue,
      issueTypes,
      isSubmittingIssue,
      notificationPrefs,
      formatDate,
      formatTime,
      getStatusColor,
      getStatusText,
      retryConnection,
      cancelOrder,
      rateOrder,
      canSubmitRating,
      submitRating,
      reportIssue,
      submitIssue,
      onMapLoaded,
      onMapError
    };
  }
};
</script>

<style scoped>
.order-tracking-page {
  min-height: calc(100vh - 200px);
}

.success-message {
  background-color: rgb(232, 245, 233);
  border-left: 4px solid #4CAF50;
}

.error-message {
  background-color: rgb(253, 236, 234);
  border-left: 4px solid #F44336;
}

.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

.map-placeholder {
  background-color: #f5f5f5;
  border-radius: 0 0 8px 8px;
}
</style>
