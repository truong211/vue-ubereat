<template>
  <v-card class="order-tracking-widget" :loading="isLoading">
    <v-card-title class="d-flex justify-space-between align-center py-3">
      <span class="text-subtitle-1">
        Order #{{ orderId }} Status
      </span>
      <v-chip
        :color="getStatusColor(orderStatus)"
        size="small"
      >
        {{ getStatusText(orderStatus) }}
      </v-chip>
    </v-card-title>
    
    <v-divider></v-divider>
    
    <v-card-text class="pa-0">
      <!-- Tracking Timeline -->
      <v-timeline align="start" density="compact" class="pa-3">
        <v-timeline-item
          v-for="(step, index) in orderSteps"
          :key="index"
          :dot-color="getCurrentStepColor(step, orderStatus)"
          size="small"
          :fill-dot="isStepCompleted(step, orderStatus)"
        >
          <div class="d-flex justify-space-between">
            <span 
              class="text-body-2"
              :class="{'font-weight-bold': isCurrentStep(step, orderStatus)}"
            >
              {{ step.label }}
            </span>
            <span v-if="step.time" class="text-caption text-medium-emphasis ml-2">
              {{ formatTime(step.time) }}
            </span>
          </div>
          
          <!-- ETA for "On the Way" step -->
          <div v-if="isCurrentStep(step, orderStatus) && step.id === 'on_the_way' && order?.estimatedDeliveryTime" class="mt-1">
            <div class="d-flex align-center">
              <v-icon size="x-small" color="primary" class="mr-1">mdi-clock-outline</v-icon>
              <span class="text-caption">
                ETA: {{ formatETA(order.estimatedDeliveryTime) }}
              </span>
            </div>
          </div>
        </v-timeline-item>
      </v-timeline>
      
      <!-- Driver Info (when order is on the way) -->
      <div v-if="driverInfo && orderStatus === 'on_the_way'" class="driver-info pa-3 pt-0">
        <v-card variant="outlined" class="mb-3">
          <v-card-item>
            <template v-slot:prepend>
              <v-avatar color="primary" size="42">
                <v-icon color="white">mdi-account</v-icon>
              </v-avatar>
            </template>
            
            <v-card-title>{{ driverInfo.name }}</v-card-title>
            <v-card-subtitle>{{ driverInfo.vehicle || 'Delivery Vehicle' }}</v-card-subtitle>
            
            <template v-slot:append>
              <div class="d-flex flex-column align-end justify-center text-caption">
                <div>{{ driverInfo.rating }} ★</div>
                <div>{{ driverInfo.totalDeliveries || 0 }} deliveries</div>
              </div>
            </template>
          </v-card-item>
          
          <v-card-text class="d-flex justify-space-between pt-0">
            <v-btn
              prepend-icon="mdi-chat-outline"
              variant="tonal"
              color="primary"
              size="small"
              @click="onContactDriver('chat')"
            >
              Chat
            </v-btn>
            
            <v-btn
              prepend-icon="mdi-phone"
              variant="tonal"
              color="success"
              size="small"
              @click="onContactDriver('call')"
            >
              Call
            </v-btn>
          </v-card-text>
        </v-card>
        
        <!-- Real-time updates section -->
        <v-alert
          v-if="lastUpdate"
          density="compact"
          type="info"
          variant="tonal"
          class="mb-3"
          border="start"
        >
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-body-2 font-weight-medium">Latest Update</div>
              <div class="text-caption">{{ lastUpdate }}</div>
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ formatTimeAgo(order?.lastUpdatedAt) }}
            </div>
          </div>
        </v-alert>
      </div>
      
      <!-- Connection Status (if enabled) -->
      <div v-if="showConnectionStatus && orderStatus !== 'delivered' && orderStatus !== 'cancelled'" class="px-3 pb-3">
        <div class="d-flex align-center">
          <v-icon
            size="small"
            :color="isConnected ? 'success' : 'warning'"
            class="mr-2"
          >
            {{ isConnected ? 'mdi-wifi' : 'mdi-wifi-strength-1-alert' }}
          </v-icon>
          <span class="text-caption text-medium-emphasis">
            {{ isConnected ? 'Receiving live updates' : 'Reconnecting...' }}
          </span>
        </div>
      </div>
    </v-card-text>
    
    <!-- Tracking Details Button -->
    <v-divider></v-divider>
    
    <v-card-actions>
      <v-btn
        block
        variant="text"
        color="primary"
        :to="`/orders/${orderId}/tracking`"
      >
        Detailed Tracking View
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'OrderTrackingWidget',
  
  props: {
    orderId: {
      type: [String, Number],
      required: true
    },
    showConnectionStatus: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['contact-driver'],
  
  setup(props, { emit }) {
    const store = useStore();
    const isLoading = ref(true);
    
    // Load order data
    const fetchOrderData = async () => {
      isLoading.value = true;
      
      try {
        const orderData = await store.dispatch('orders/fetchOrderDetails', props.orderId);
        
        // Start tracking if not already tracking this order
        const currentOrder = store.getters['orderTracking/getCurrentOrder'];
        
        if (!currentOrder || currentOrder.id !== props.orderId) {
          if (['confirmed', 'preparing', 'ready', 'on_the_way'].includes(orderData.status)) {
            store.dispatch('orderTracking/startTracking', orderData);
          }
        }
        
        isLoading.value = false;
      } catch (error) {
        console.error('Failed to load order for tracking widget:', error);
        isLoading.value = false;
      }
    };
    
    // Access order data from tracking store
    const order = computed(() => {
      const currentOrder = store.getters['orderTracking/getCurrentOrder'];
      
      if (currentOrder && currentOrder.id === props.orderId) {
        return currentOrder;
      }
      
      return store.getters['orders/getOrderById'](props.orderId);
    });
    
    // Get order status
    const orderStatus = computed(() => order.value?.status || 'pending');
    
    // Get driver info
    const driverInfo = computed(() => order.value?.driver || null);
    
    // Get tracking status
    const trackingStatus = computed(() => store.state.orderTracking.trackingStatus);
    
    // Check if connected
    const isConnected = computed(() => 
      trackingStatus.value === 'connected' || trackingStatus.value === 'tracking'
    );
    
    // Get latest update message
    const lastUpdate = computed(() => {
      if (!order.value || !order.value.status) return null;
      
      const statusMessages = {
        preparing: 'The restaurant is preparing your food',
        ready: 'Your order is ready for pickup',
        on_the_way: order.value.estimatedDeliveryTime ? 
          `Arriving in approximately ${formatETA(order.value.estimatedDeliveryTime)}` : 
          'Your driver is on the way'
      };
      
      // If we have a custom message in the updates, use that instead
      if (order.value.updates && order.value.updates.length > 0) {
        return order.value.updates[order.value.updates.length - 1].message;
      }
      
      return statusMessages[order.value.status] || null;
    });
    
    // Create order steps
    const orderSteps = computed(() => [
      { 
        id: 'placed', 
        label: 'Order Placed', 
        time: order.value?.createdAt 
      },
      { 
        id: 'confirmed', 
        label: 'Confirmed', 
        time: order.value?.confirmedAt 
      },
      { 
        id: 'preparing', 
        label: 'Preparing', 
        time: order.value?.preparingAt 
      },
      { 
        id: 'ready', 
        label: 'Ready for Pickup', 
        time: order.value?.readyAt 
      },
      { 
        id: 'on_the_way', 
        label: 'On the Way', 
        time: order.value?.pickedUpAt 
      },
      { 
        id: 'delivered', 
        label: 'Delivered', 
        time: order.value?.deliveredAt 
      }
    ]);
    
    // Status and step utility functions
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
        ready: 'Ready',
        on_the_way: 'On the Way',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      };
      
      return statusText[status] || 'Unknown';
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
    
    const formatETA = (minutes) => {
      if (!minutes) return 'unknown time';
      
      if (minutes < 1) return 'less than a minute';
      
      const roundedMinutes = Math.round(minutes);
      return `${roundedMinutes} ${roundedMinutes === 1 ? 'minute' : 'minutes'}`;
    };
    
    const formatTimeAgo = (timestamp) => {
      if (!timestamp) return '';
      
      const now = new Date();
      const date = new Date(timestamp);
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    };
    
    const getCurrentStepColor = (step, currentStatus) => {
      // If order is cancelled, everything should be grey
      if (currentStatus === 'cancelled') {
        return 'grey';
      }
      
      const statusOrder = ['placed', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered'];
      const stepIndex = statusOrder.indexOf(step.id);
      const currentIndex = statusOrder.indexOf(currentStatus);
      
      if (stepIndex === currentIndex) return 'primary';
      if (stepIndex < currentIndex) return 'success';
      return 'grey';
    };
    
    const isStepCompleted = (step, currentStatus) => {
      if (currentStatus === 'cancelled') return false;
      
      const statusOrder = ['placed', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered'];
      const stepIndex = statusOrder.indexOf(step.id);
      const currentIndex = statusOrder.indexOf(currentStatus);
      
      return stepIndex <= currentIndex;
    };
    
    const isCurrentStep = (step, currentStatus) => {
      return step.id === currentStatus;
    };
    
    // Handle driver contact
    const onContactDriver = (method) => {
      if (!driverInfo.value) return;
      
      emit('contact-driver', {
        driverId: driverInfo.value.id,
        orderId: props.orderId,
        method
      });
      
      // Also dispatch to global event bus via store
      store.dispatch('orderTracking/contactDriver', {
        driverId: driverInfo.value.id,
        orderId: props.orderId,
        method
      });
    };
    
    // Setup and cleanup
    onMounted(() => {
      fetchOrderData();
      
      // Refresh order data periodically
      const refreshInterval = setInterval(() => {
        if (['delivered', 'cancelled'].includes(orderStatus.value)) {
          clearInterval(refreshInterval);
        } else {
          fetchOrderData();
        }
      }, 60000); // Refresh every minute
      
      return () => {
        clearInterval(refreshInterval);
      };
    });
    
    // Watch for order status changes to start/stop tracking
    watch(() => orderStatus.value, (newStatus) => {
      if (['delivered', 'cancelled'].includes(newStatus)) {
        store.dispatch('orderTracking/stopTracking', props.orderId);
      }
    });
    
    return {
      isLoading,
      order,
      orderStatus,
      driverInfo,
      isConnected,
      orderSteps,
      lastUpdate,
      getStatusColor,
      getStatusText,
      formatTime,
      formatETA,
      formatTimeAgo,
      getCurrentStepColor,
      isStepCompleted,
      isCurrentStep,
      onContactDriver
    };
  }
};
</script>

<style scoped>
.order-tracking-widget {
  width: 100%;
  overflow: hidden;
}

.driver-info {
  border-top: 1px solid var(--v-border-opacity-var, rgba(0, 0, 0, 0.12));
}
</style> 