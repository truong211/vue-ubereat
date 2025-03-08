<template>
  <div class="tracking-examples">
    <h2 class="text-h5 mb-4">Order Tracking Examples</h2>
    
    <!-- Example 1: Basic usage with just orderId -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Usage (orderId only)</h3>
      <v-card>
        <v-card-text>
          <order-tracking 
            :order-id="123"
            @order-loaded="onOrderLoaded"
            @order-update="onOrderUpdate"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 2: Using with a complete order object -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">With Complete Order Object</h3>
      <v-card>
        <v-card-text>
          <order-tracking 
            :order-data="sampleOrder"
            @driver-location-update="onDriverLocationUpdate"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ completeOrderExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
    
    <!-- Example 3: Customizing the component -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Customized Display Options</h3>
      <v-card>
        <v-card-text>
          <order-tracking 
            :order-data="sampleOrder"
            :show-timeline="false"
            :map-height="250"
            :show-driver-info="showDriverInfo"
            :show-map-details="false"
          />
          <div class="d-flex justify-end mt-2">
            <v-switch v-model="showDriverInfo" label="Show Driver Info" hide-details density="compact"></v-switch>
          </div>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ customizedExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import OrderTracking from '@/components/order/OrderTracking.vue'

export default {
  name: 'TrackingExample',
  
  components: {
    OrderTracking
  },
  
  setup() {
    const showDriverInfo = ref(true);
    
    // Sample order data for examples
    const sampleOrder = ref({
      id: 456,
      status: 'on_the_way',
      createdAt: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
      confirmedAt: new Date(Date.now() - 40 * 60000).toISOString(), // 40 minutes ago
      preparingAt: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
      readyAt: new Date(Date.now() - 20 * 60000).toISOString(), // 20 minutes ago
      pickedUpAt: new Date(Date.now() - 10 * 60000).toISOString(), // 10 minutes ago
      estimatedDeliveryTime: '15-25 min',
      deliveryAddress: '123 Main St, Anytown, CA 91234',
      restaurant: {
        id: 789,
        name: 'Best Burger Place',
        location: { lat: 34.052235, lng: -118.243683 },
        phone: '555-123-4567'
      },
      deliveryLocationCoordinates: { lat: 34.047360, lng: -118.291460 },
      driver: {
        name: 'John Driver',
        phone: '555-987-6543',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        rating: 4.8,
        totalDeliveries: 342
      },
      driverLocation: { lat: 34.049320, lng: -118.267620 },
      driverTimeAway: '12',
      items: [
        { name: 'Deluxe Burger', quantity: 2, price: 12.99 },
        { name: 'Fries', quantity: 1, price: 3.99 },
        { name: 'Soda', quantity: 2, price: 1.99 }
      ]
    });
    
    // Event handlers
    const onOrderLoaded = (order) => {
      console.log('Order loaded:', order);
    };
    
    const onOrderUpdate = ({ status, order }) => {
      console.log(`Order status updated to ${status}`, order);
    };
    
    const onDriverLocationUpdate = ({ location, eta }) => {
      console.log('Driver location updated:', location, 'ETA:', eta);
    };
    
    // Code examples for display
    const basicExample = computed(() => {
      return `<order-tracking 
  :order-id="123"
  @order-loaded="onOrderLoaded"
  @order-update="onOrderUpdate"
/>`;
    });
    
    const completeOrderExample = computed(() => {
      return `<order-tracking 
  :order-data="orderObject"
  @driver-location-update="onDriverLocationUpdate"
/>`;
    });
    
    const customizedExample = computed(() => {
      return `<order-tracking 
  :order-data="orderObject"
  :show-timeline="false"
  :map-height="250"
  :show-driver-info="${showDriverInfo.value}"
  :show-map-details="false"
/>`;
    });
    
    return {
      sampleOrder,
      showDriverInfo,
      onOrderLoaded,
      onOrderUpdate,
      onDriverLocationUpdate,
      basicExample,
      completeOrderExample,
      customizedExample
    };
  }
}
</script>

<style scoped>
.tracking-examples {
  padding: 16px;
}

.code-example {
  font-family: monospace;
  white-space: pre-wrap;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}
</style>