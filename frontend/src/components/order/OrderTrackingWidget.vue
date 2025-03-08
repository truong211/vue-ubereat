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
        </v-timeline-item>
      </v-timeline>
      
      <!-- Driver Info (when order is on the way) -->
      <div v-if="orderStatus === 'on_the_way' && driverInfo" class="driver-info pa-3 pb-0">
        <div class="d-flex align-center">
          <v-avatar size="28" class="mr-2">
            <v-img v-if="driverInfo.avatar" :src="driverInfo.avatar" alt="Driver"></v-img>
            <v-icon v-else color="primary">mdi-account</v-icon>
          </v-avatar>
          <div>
            <span class="text-body-2">{{ driverInfo.name }}</span>
            <span v-if="driverInfo.eta" class="text-caption d-block">
              <v-icon size="x-small" class="mr-1">mdi-clock-outline</v-icon>
              {{ driverInfo.eta }} min away
            </span>
          </div>
        </div>
      </div>
      
      <!-- Connection Status -->
      <div v-if="showConnectionStatus && trackingStatus !== 'active'" class="connection-status px-3 pb-3">
        <v-alert
          :type="trackingStatus === 'connecting' ? 'warning' : 'error'"
          variant="tonal"
          density="compact"
          class="mb-0 mt-2"
        >
          {{ 
            trackingStatus === 'connecting' 
              ? 'Connecting to tracking service...' 
              : 'Connection lost. Live updates paused.' 
          }}
          <template v-if="trackingStatus === 'error'" v-slot:append>
            <v-btn
              size="small"
              color="error"
              variant="text"
              @click="retryConnection"
            >
              Retry
            </v-btn>
          </template>
        </v-alert>
      </div>
    </v-card-text>
    
    <!-- Actions -->
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn 
        variant="text" 
        color="primary" 
        :to="`/order-tracking/${orderId}`"
        prepend-icon="mdi-map-marker-path"
      >
        Live Tracking
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
  
  setup(props) {
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
    
    // Step status helpers
    const isStepCompleted = (step, currentStatus) => {
      const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'on_the_way', 'delivered'];
      const stepIndex = statusOrder.indexOf(step.id);
      const currentIndex = statusOrder.indexOf(currentStatus);
      
      return stepIndex <= currentIndex;
    };
    
    const isCurrentStep = (step, currentStatus) => {
      return step.id === currentStatus;
    };
    
    const getCurrentStepColor = (step, currentStatus) => {
      if (currentStatus === 'cancelled') {
        return isStepCompleted(step, currentStatus) ? 'grey' : 'grey-lighten-2';
      }
      
      if (step.id === 'delivered' && currentStatus === 'delivered') {
        return 'success';
      }
      
      return isStepCompleted(step, currentStatus) ? 'primary' : 'grey-lighten-2';
    };
    
    // Connection management
    const retryConnection = () => {
      store.dispatch('orderTracking/retryConnection');
    };
    
    // Lifecycle
    onMounted(() => {
      fetchOrderData();
    });
    
    onUnmounted(() => {
      // Don't stop tracking on unmount, as other components may need it
    });
    
    return {
      isLoading,
      order,
      orderStatus,
      driverInfo,
      trackingStatus,
      orderSteps,
      getStatusColor,
      getStatusText,
      formatTime,
      isStepCompleted,
      isCurrentStep,
      getCurrentStepColor,
      retryConnection
    };
  }
};
</script>

<style scoped>
.order-tracking-widget {
  max-width: 100%;
}

.connection-status {
  font-size: 0.875rem;
}

.driver-info {
  background-color: #f5f5f5;
  border-radius: 4px;
  margin: 0 12px;
  padding: 8px 12px;
}
</style> 