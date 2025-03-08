<template>
  <v-container>
    <h1 class="text-h4 mb-6">Track Your Order</h1>
    
    <v-row v-if="loading">
      <v-col cols="12" class="d-flex justify-center">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </v-col>
    </v-row>
    
    <v-row v-else-if="error">
      <v-col cols="12">
        <v-alert type="error" class="mb-4">
          {{ error }}
        </v-alert>
        <v-btn color="primary" @click="fetchOrderDetails">Try Again</v-btn>
      </v-col>
    </v-row>
    
    <template v-else>
      <v-row>
        <v-col cols="12" md="8">
          <!-- Map Component -->
          <v-card class="mb-6">
            <v-card-text class="pa-0">
              <live-map
                :delivery-address="deliveryAddress"
                :restaurant-location="restaurantLocation"
                :driver-location="driverLocation"
                :eta="order.estimatedDeliveryTime"
                :path-points="routePoints"
              ></live-map>
            </v-card-text>
          </v-card>
          
          <!-- Order Status Timeline -->
          <v-card>
            <v-card-title class="d-flex">
              <span>Order Status</span>
              <v-spacer></v-spacer>
              <v-chip
                :color="getStatusColor(order.status)"
                text-color="white"
                class="ml-2"
              >
                {{ getStatusText(order.status) }}
              </v-chip>
            </v-card-title>
            
            <v-card-text>
              <v-timeline align="start" dense>
                <v-timeline-item
                  v-for="(step, index) in orderSteps"
                  :key="index"
                  :dot-color="getTimelineDotColor(step, order.status)"
                  :icon="step.icon"
                  :class="{'completed-step': isStepCompleted(step.status, order.status)}"
                >
                  <template v-slot:opposite></template>
                  <div>
                    <div class="d-flex">
                      <div class="text-subtitle-1 font-weight-bold">{{ step.title }}</div>
                      <v-spacer></v-spacer>
                      <div v-if="step.timestamp" class="text-caption text-grey">
                        {{ formatTimestamp(step.timestamp) }}
                      </div>
                    </div>
                    <div class="text-body-2 mt-1">{{ step.description }}</div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <!-- Order Info Card -->
          <v-card class="mb-6">
            <v-card-title>Order #{{ order.orderNumber }}</v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Order Date:</span>
                <span>{{ formatDate(order.createdAt) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Estimated Delivery:</span>
                <span>{{ formatETA(order.estimatedDeliveryTime) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span class="text-subtitle-2">Payment Method:</span>
                <span>{{ order.paymentMethod }}</span>
              </div>
              <div class="d-flex justify-space-between">
                <span class="text-subtitle-2">Total:</span>
                <span class="text-h6 font-weight-bold">${{ order.total.toFixed(2) }}</span>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Restaurant Info Card -->
          <v-card class="mb-6">
            <v-card-title>Restaurant</v-card-title>
            <v-card-text>
              <div class="mb-4">
                <div class="text-h6">{{ order.restaurant.name }}</div>
                <div class="text-body-2">{{ order.restaurant.address }}</div>
                <div class="text-body-2">{{ order.restaurant.phone }}</div>
              </div>
              <v-btn
                color="primary"
                variant="outlined"
                block
                :href="`tel:${order.restaurant.phone}`"
              >
                <v-icon start>mdi-phone</v-icon>
                Call Restaurant
              </v-btn>
            </v-card-text>
          </v-card>
          
          <!-- Driver Info Card -->
          <v-card v-if="order.driver">
            <v-card-title>Your Driver</v-card-title>
            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-avatar size="50" color="grey-lighten-3" class="mr-4">
                  <v-img v-if="order.driver.avatarUrl" :src="order.driver.avatarUrl" alt="Driver"></v-img>
                  <v-icon v-else size="40">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h6">{{ order.driver.name }}</div>
                  <div class="d-flex align-center">
                    <v-icon size="small" color="amber-darken-2">mdi-star</v-icon>
                    <span class="ml-1">{{ order.driver.rating }} ({{ order.driver.totalRatings }})</span>
                  </div>
                </div>
              </div>
              <v-btn
                color="primary"
                variant="outlined"
                block
                class="mb-3"
                :href="`tel:${order.driver.phone}`"
              >
                <v-icon start>mdi-phone</v-icon>
                Call Driver
              </v-btn>
              <v-btn
                color="success"
                block
                :href="`sms:${order.driver.phone}`"
              >
                <v-icon start>mdi-message</v-icon>
                Message Driver
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Order Items -->
      <v-row class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>Order Items</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item v-for="(item, index) in order.items" :key="index">
                  <template v-slot:prepend>
                    <v-avatar size="40" color="grey-lighten-3" class="mr-3">
                      <v-img v-if="item.imageUrl" :src="item.imageUrl" alt="Food"></v-img>
                      <v-icon v-else>mdi-food</v-icon>
                    </v-avatar>
                  </template>
                  
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    <span>Quantity: {{ item.quantity }}</span>
                    <span v-if="item.options && item.options.length" class="ml-2">
                      Options: {{ item.options.join(', ') }}
                    </span>
                  </v-list-item-subtitle>
                  
                  <template v-slot:append>
                    <div class="text-subtitle-1 font-weight-bold">${{ (item.price * item.quantity).toFixed(2) }}</div>
                  </template>
                </v-list-item>
              </v-list>
              
              <v-divider class="my-4"></v-divider>
              
              <div class="d-flex justify-space-between mb-2">
                <span>Subtotal</span>
                <span>${{ order.subtotal.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Delivery Fee</span>
                <span>${{ order.deliveryFee.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Tax</span>
                <span>${{ order.tax.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Tip</span>
                <span>${{ order.tip.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between mt-3">
                <span class="text-h6 font-weight-bold">Total</span>
                <span class="text-h6 font-weight-bold">${{ order.total.toFixed(2) }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import LiveMap from '@/components/order/LiveMap.vue';

export default {
  name: 'OrderTracking',
  
  components: {
    LiveMap
  },
  
  setup() {
    const store = useStore();
    const route = useRoute();
    
    const loading = ref(true);
    const error = ref(null);
    const order = ref({
      id: null,
      orderNumber: '',
      status: 'pending',
      createdAt: new Date(),
      estimatedDeliveryTime: 30,
      paymentMethod: '',
      subtotal: 0,
      deliveryFee: 0,
      tax: 0,
      tip: 0,
      total: 0,
      items: [],
      restaurant: {
        id: null,
        name: '',
        address: '',
        phone: '',
        location: { lat: 0, lng: 0 }
      },
      driver: null,
      deliveryAddress: { 
        address: '',
        lat: 0, 
        lng: 0 
      },
      statusHistory: []
    });
    
    // Polling interval for order updates
    let pollingInterval = null;
    
    // Location data for map
    const deliveryAddress = computed(() => {
      return {
        lat: order.value.deliveryAddress.lat,
        lng: order.value.deliveryAddress.lng,
        address: order.value.deliveryAddress.address
      };
    });
    
    const restaurantLocation = computed(() => {
      return {
        lat: order.value.restaurant.location.lat,
        lng: order.value.restaurant.location.lng,
        address: order.value.restaurant.address
      };
    });
    
    const driverLocation = computed(() => {
      if (!order.value.driver || !order.value.driver.location) {
        return null;
      }
      return {
        lat: order.value.driver.location.lat,
        lng: order.value.driver.location.lng
      };
    });
    
    // Route points (would typically come from API)
    const routePoints = ref([]);
    
    // Order steps for timeline
    const orderSteps = computed(() => {
      const steps = [
        {
          title: 'Order Placed',
          description: 'Your order has been received by the restaurant.',
          status: 'pending',
          icon: 'mdi-receipt',
          timestamp: getStatusTimestamp('pending')
        },
        {
          title: 'Order Confirmed',
          description: 'The restaurant has confirmed your order.',
          status: 'confirmed',
          icon: 'mdi-check-circle',
          timestamp: getStatusTimestamp('confirmed')
        },
        {
          title: 'Preparing Food',
          description: 'Your food is being prepared by the restaurant.',
          status: 'preparing',
          icon: 'mdi-food',
          timestamp: getStatusTimestamp('preparing')
        },
        {
          title: 'Ready for Pickup',
          description: 'Your order is ready for pickup by the driver.',
          status: 'ready_for_pickup',
          icon: 'mdi-package-variant-closed',
          timestamp: getStatusTimestamp('ready_for_pickup')
        },
        {
          title: 'Out for Delivery',
          description: 'Your food is on the way to your location.',
          status: 'out_for_delivery',
          icon: 'mdi-bike',
          timestamp: getStatusTimestamp('out_for_delivery')
        },
        {
          title: 'Delivered',
          description: 'Your food has been delivered. Enjoy!',
          status: 'delivered',
          icon: 'mdi-home',
          timestamp: getStatusTimestamp('delivered')
        }
      ];
      
      return steps;
    });
    
    // Get timestamp for a specific status
    const getStatusTimestamp = (status) => {
      if (!order.value.statusHistory) return null;
      
      const statusEvent = order.value.statusHistory.find(
        event => event.status === status
      );
      
      return statusEvent ? new Date(statusEvent.timestamp) : null;
    };
    
    // Check if a step is completed based on order status
    const isStepCompleted = (stepStatus, orderStatus) => {
      const statusOrder = [
        'pending',
        'confirmed',
        'preparing',
        'ready_for_pickup',
        'out_for_delivery',
        'delivered'
      ];
      
      const stepIndex = statusOrder.indexOf(stepStatus);
      const orderIndex = statusOrder.indexOf(orderStatus);
      
      return stepIndex <= orderIndex;
    };
    
    // Get color for timeline dots
    const getTimelineDotColor = (step, orderStatus) => {
      if (isStepCompleted(step.status, orderStatus)) {
        return 'primary';
      }
      return 'grey';
    };
    
    // Get status text for display
    const getStatusText = (status) => {
      const statusMap = {
        'pending': 'Order Placed',
        'confirmed': 'Confirmed',
        'preparing': 'Preparing',
        'ready_for_pickup': 'Ready for Pickup',
        'out_for_delivery': 'Out for Delivery',
        'delivered': 'Delivered',
        'cancelled': 'Cancelled'
      };
      
      return statusMap[status] || status;
    };
    
    // Get status color for display
    const getStatusColor = (status) => {
      const colorMap = {
        'pending': 'blue',
        'confirmed': 'blue-darken-2',
        'preparing': 'amber',
        'ready_for_pickup': 'amber-darken-2',
        'out_for_delivery': 'purple',
        'delivered': 'success',
        'cancelled': 'error'
      };
      
      return colorMap[status] || 'grey';
    };
    
    // Format date
    const formatDate = (date) => {
      if (!date) return '';
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      };
      return new Date(date).toLocaleDateString(undefined, options);
    };
    
    // Format timestamp
    const formatTimestamp = (timestamp) => {
      if (!timestamp) return '';
      const options = { hour: '2-digit', minute: '2-digit' };
      return new Date(timestamp).toLocaleTimeString(undefined, options);
    };
    
    // Format ETA
    const formatETA = (minutes) => {
      if (!minutes) return 'Unknown';
      
      const now = new Date();
      const eta = new Date(now.getTime() + minutes * 60000);
      
      return formatTimestamp(eta);
    };
    
    // Fetch order details
    const fetchOrderDetails = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        const orderId = route.params.id;
        
        // In a real application, this would fetch from API
        // For now, using mock data from store
        const response = await store.dispatch('orderTracking/getOrderDetails', orderId);
        
        order.value = response;
        
        // Simulate route points - in a real app would be from an API
        if (order.value.driver && order.value.driver.location) {
          generateRoutePoints();
        }
        
        loading.value = false;
        
        // Setup real-time updates
        setupRealtimeUpdates();
      } catch (err) {
        console.error('Error fetching order details:', err);
        error.value = 'Failed to load order details. Please try again.';
        loading.value = false;
      }
    };
    
    // Generate sample route points (for demo)
    const generateRoutePoints = () => {
      // This would be replaced with actual route from API
      const start = [order.value.driver.location.lat, order.value.driver.location.lng];
      const end = [order.value.deliveryAddress.lat, order.value.deliveryAddress.lng];
      
      // Linear interpolation for demo
      const points = [];
      const steps = 5;
      
      for (let i = 0; i <= steps; i++) {
        const factor = i / steps;
        const lat = start[0] + (end[0] - start[0]) * factor;
        const lng = start[1] + (end[1] - start[1]) * factor;
        points.push({ lat, lng });
      }
      
      routePoints.value = points;
    };
    
    // Setup real-time updates (polling for demo, would be websockets in production)
    const setupRealtimeUpdates = () => {
      // Clear existing interval if any
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
      
      // Poll for updates every 30 seconds
      pollingInterval = setInterval(async () => {
        try {
          const orderId = route.params.id;
          const response = await store.dispatch('orderTracking/getOrderUpdates', orderId);
          
          // Update order with new data
          if (response) {
            order.value = response;
            
            // Update route points if driver location has changed
            if (order.value.driver && order.value.driver.location) {
              generateRoutePoints();
            }
            
            // If order is delivered or cancelled, stop polling
            if (order.value.status === 'delivered' || order.value.status === 'cancelled') {
              clearInterval(pollingInterval);
            }
          }
        } catch (err) {
          console.error('Error fetching order updates:', err);
        }
      }, 30000);
    };
    
    // Lifecycle hooks
    onMounted(() => {
      fetchOrderDetails();
    });
    
    onUnmounted(() => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    });
    
    return {
      loading,
      error,
      order,
      orderSteps,
      deliveryAddress,
      restaurantLocation,
      driverLocation,
      routePoints,
      fetchOrderDetails,
      isStepCompleted,
      getTimelineDotColor,
      getStatusText,
      getStatusColor,
      formatDate,
      formatTimestamp,
      formatETA
    };
  }
};
</script>

<style scoped>
.completed-step {
  opacity: 1;
}

:deep(.v-timeline-item.completed-step .v-timeline-divider__dot) {
  background-color: var(--v-primary-base) !important;
}

:deep(.v-timeline-item:not(.completed-step)) {
  opacity: 0.6;
}
</style> 