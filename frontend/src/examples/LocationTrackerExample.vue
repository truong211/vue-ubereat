<template>
  <div class="location-tracker-examples">
    <h2 class="text-h5 mb-4">Location Tracking Examples</h2>

    <!-- Example 1: Basic Delivery Tracking -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Delivery Tracking</h3>
      <v-card>
        <v-card-text>
          <div class="tracking-container">
            <location-tracker
              :order-id="'12345'"
              :origin="restaurantLocation"
              :destination="deliveryLocation"
              @location-update="handleLocationUpdate"
              @eta-update="handleEtaUpdate"
              @delivery-complete="handleDeliveryComplete"
            />
          </div>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Multi-Order Tracking -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Multi-Order Tracking</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Order Selection -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title>Active Orders</v-card-title>
                <v-list select-strategy="single-select" v-model="selectedOrder">
                  <v-list-item
                    v-for="order in activeOrders"
                    :key="order.id"
                    :value="order"
                  >
                    <template v-slot:prepend>
                      <v-avatar :image="order.restaurant.image" size="36">
                        <v-icon>mdi-store</v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title>{{ order.restaurant.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      Order #{{ order.id }}
                    </v-list-item-subtitle>

                    <template v-slot:append>
                      <v-chip
                        :color="getStatusColor(order.status)"
                        size="small"
                      >
                        {{ order.status }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Tracking Map -->
            <v-col cols="12" md="8">
              <div v-if="selectedOrder" class="tracking-container">
                <location-tracker
                  :order-id="selectedOrder.id"
                  :origin="selectedOrder.restaurant.location"
                  :destination="selectedOrder.deliveryLocation"
                  @location-update="handleLocationUpdate"
                  @eta-update="handleEtaUpdate"
                  @delivery-complete="handleDeliveryComplete"
                />
              </div>
              <div v-else class="d-flex justify-center align-center" style="height: 400px;">
                <div class="text-center">
                  <v-icon size="64" color="grey-lighten-1">mdi-map-marker</v-icon>
                  <div class="text-h6 mt-4">Select an Order</div>
                  <div class="text-body-1 text-medium-emphasis">
                    Choose an order to track its delivery
                  </div>
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ multiOrderExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Driver's View -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Driver's View</h3>
      <v-card>
        <v-card-text>
          <div class="tracking-container">
            <location-tracker
              :order-id="currentBatch.id"
              :origin="currentLocation"
              :destination="nextDestination"
              mode="driver"
              :waypoints="remainingStops"
              @location-update="updateDriverLocation"
              @stop-reached="handleStopReached"
            />
          </div>

          <!-- Batch Progress -->
          <v-card variant="outlined" class="mt-4">
            <v-list>
              <template v-for="(stop, index) in batchStops" :key="index">
                <v-list-item :value="stop">
                  <template v-slot:prepend>
                    <v-avatar 
                      :color="getStopColor(stop.status)"
                      size="36"
                    >
                      {{ index + 1 }}
                    </v-avatar>
                  </template>

                  <v-list-item-title>{{ stop.address }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Order #{{ stop.orderId }} • {{ stop.instructions }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <v-btn
                      v-if="stop.status === 'next'"
                      color="primary"
                      @click="completeStop(stop)"
                    >
                      Complete
                    </v-btn>
                    <v-icon
                      v-else-if="stop.status === 'completed'"
                      color="success"
                    >
                      mdi-check
                    </v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-list>
          </v-card>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ driverExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import LocationTracker from '@/components/delivery/LocationTracker.vue'

export default {
  name: 'LocationTrackerExample',

  components: {
    LocationTracker
  },

  setup() {
    // Basic example data
    const restaurantLocation = {
      lat: 13.7563,
      lng: 100.5018
    }

    const deliveryLocation = {
      lat: 13.7469,
      lng: 100.5389
    }

    // Multi-order example data
    const selectedOrder = ref(null)
    const activeOrders = ref([
      {
        id: '12345',
        restaurant: {
          name: 'Pizza Paradise',
          image: '/images/sample/restaurant1.jpg',
          location: { lat: 13.7563, lng: 100.5018 }
        },
        deliveryLocation: { lat: 13.7469, lng: 100.5389 },
        status: 'preparing'
      },
      {
        id: '12346',
        restaurant: {
          name: 'Burger Barn',
          image: '/images/sample/restaurant2.jpg',
          location: { lat: 13.7450, lng: 100.5320 }
        },
        deliveryLocation: { lat: 13.7550, lng: 100.5280 },
        status: 'on_the_way'
      }
    ])

    // Driver example data
    const currentLocation = ref({
      lat: 13.7563,
      lng: 100.5018
    })

    const currentBatch = ref({
      id: 'batch_123',
      stops: [
        {
          orderId: '12345',
          address: '123 Main St.',
          location: { lat: 13.7469, lng: 100.5389 },
          instructions: 'Leave at door',
          status: 'completed'
        },
        {
          orderId: '12346',
          address: '456 Park Ave.',
          location: { lat: 13.7550, lng: 100.5280 },
          instructions: 'Call upon arrival',
          status: 'next'
        },
        {
          orderId: '12347',
          address: '789 Oak St.',
          location: { lat: 13.7450, lng: 100.5320 },
          instructions: 'Ring doorbell',
          status: 'pending'
        }
      ]
    })

    // Computed properties
    const nextDestination = computed(() => {
      const nextStop = currentBatch.value.stops.find(stop => stop.status === 'next')
      return nextStop?.location
    })

    const remainingStops = computed(() => {
      return currentBatch.value.stops
        .filter(stop => stop.status !== 'completed')
        .map(stop => stop.location)
    })

    const batchStops = computed(() => currentBatch.value.stops)

    // Event handlers
    const handleLocationUpdate = (location) => {
      console.log('Location updated:', location)
    }

    const handleEtaUpdate = (eta) => {
      console.log('ETA updated:', eta)
    }

    const handleDeliveryComplete = () => {
      console.log('Delivery completed')
    }

    const updateDriverLocation = (location) => {
      currentLocation.value = location
    }

    const handleStopReached = (stopId) => {
      console.log('Reached stop:', stopId)
    }

    const completeStop = (stop) => {
      const index = currentBatch.value.stops.findIndex(s => s.orderId === stop.orderId)
      if (index !== -1) {
        currentBatch.value.stops[index].status = 'completed'
        const nextIndex = currentBatch.value.stops.findIndex(s => s.status === 'pending')
        if (nextIndex !== -1) {
          currentBatch.value.stops[nextIndex].status = 'next'
        }
      }
    }

    // Utility functions
    const getStatusColor = (status) => {
      const colors = {
        preparing: 'info',
        on_the_way: 'primary',
        delivered: 'success'
      }
      return colors[status] || 'grey'
    }

    const getStopColor = (status) => {
      const colors = {
        completed: 'success',
        next: 'primary',
        pending: 'grey'
      }
      return colors[status]
    }

    // Code examples
    const basicExample = computed(() => `<location-tracker
  :order-id="'12345'"
  :origin="restaurantLocation"
  :destination="deliveryLocation"
  @location-update="handleLocationUpdate"
  @eta-update="handleEtaUpdate"
  @delivery-complete="handleDeliveryComplete"
/>`)

    const multiOrderExample = computed(() => `<!-- Orders List -->
<v-list v-model="selectedOrder">
  <v-list-item
    v-for="order in activeOrders"
    :key="order.id"
    :value="order"
  >
    <!-- Order details -->
  </v-list-item>
</v-list>

<!-- Tracking Map -->
<location-tracker
  v-if="selectedOrder"
  :order-id="selectedOrder.id"
  :origin="selectedOrder.restaurant.location"
  :destination="selectedOrder.deliveryLocation"
/>`)

    const driverExample = computed(() => `<location-tracker
  :order-id="currentBatch.id"
  :origin="currentLocation"
  :destination="nextDestination"
  mode="driver"
  :waypoints="remainingStops"
  @location-update="updateDriverLocation"
  @stop-reached="handleStopReached"
/>`)

    return {
      // Basic example
      restaurantLocation,
      deliveryLocation,

      // Multi-order example
      selectedOrder,
      activeOrders,

      // Driver example
      currentLocation,
      currentBatch,
      nextDestination,
      remainingStops,
      batchStops,

      // Event handlers
      handleLocationUpdate,
      handleEtaUpdate,
      handleDeliveryComplete,
      updateDriverLocation,
      handleStopReached,
      completeStop,

      // Utility functions
      getStatusColor,
      getStopColor,

      // Code examples
      basicExample,
      multiOrderExample,
      driverExample
    }
  }
}
</script>

<style scoped>
.location-tracker-examples {
  padding: 16px;
}

.tracking-container {
  height: 400px;
  width: 100%;
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