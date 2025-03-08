<template>
  <div class="delivery-optimizer-examples">
    <h2 class="text-h5 mb-4">Delivery Optimization Examples</h2>

    <!-- Example 1: Basic Route Optimization -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Route Optimization</h3>
      <v-card>
        <v-card-text>
          <div class="mb-4">
            <div class="d-flex justify-space-between align-center">
              <div class="text-subtitle-1">Current Orders</div>
              <v-btn
                prepend-icon="mdi-plus"
                @click="addMockOrder"
              >
                Add Test Order
              </v-btn>
            </div>
          </div>
          
          <delivery-optimizer
            :initial-orders="mockOrders"
            @route-optimized="handleRouteOptimized"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Batch Delivery -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Batch Delivery Management</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Batch Controls -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title>Batch Settings</v-card-title>
                <v-card-text>
                  <v-slider
                    v-model="batchSettings.maxItems"
                    label="Max Items per Batch"
                    min="1"
                    max="10"
                    step="1"
                    thumb-label
                  ></v-slider>
                  
                  <v-slider
                    v-model="batchSettings.maxOrders"
                    label="Max Orders per Batch"
                    min="1"
                    max="5"
                    step="1"
                    thumb-label
                  ></v-slider>
                  
                  <v-slider
                    v-model="batchSettings.maxValue"
                    label="Max Batch Value ($)"
                    min="50"
                    max="200"
                    step="10"
                    thumb-label
                  ></v-slider>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Batch Results -->
            <v-col cols="12" md="8">
              <delivery-optimizer
                :initial-orders="batchOrders"
                :batch-settings="batchSettings"
                auto-batch
                @batches-created="handleBatchesCreated"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ batchExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Real-time Order Assignment -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Real-time Order Assignment</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Driver List -->
            <v-col cols="12" md="4">
              <v-list>
                <v-list-item
                  v-for="driver in mockDrivers"
                  :key="driver.id"
                  :value="driver"
                  :active="selectedDriver?.id === driver.id"
                  @click="selectDriver(driver)"
                >
                  <template v-slot:prepend>
                    <v-avatar :color="driver.active ? 'success' : 'grey'">
                      <v-icon color="white">
                        {{ driver.active ? 'mdi-bike' : 'mdi-bike-off' }}
                      </v-icon>
                    </v-avatar>
                  </template>
                  
                  <v-list-item-title>{{ driver.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ driver.activeOrders }} active orders
                  </v-list-item-subtitle>
                  
                  <template v-slot:append>
                    <v-chip
                      :color="getDriverStatusColor(driver.status)"
                      size="small"
                    >
                      {{ driver.status }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-col>

            <!-- Driver Orders -->
            <v-col cols="12" md="8">
              <div v-if="selectedDriver">
                <delivery-optimizer
                  :initial-orders="getDriverOrders(selectedDriver.id)"
                  :driver-location="selectedDriver.location"
                  @order-assigned="handleOrderAssigned"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-account-arrow-left</v-icon>
                <div class="text-h6 mt-4">Select a Driver</div>
                <div class="text-body-1 text-medium-emphasis">
                  Choose a driver to view and optimize their orders
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ realTimeExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import DeliveryOptimizer from '@/components/driver/DeliveryOptimizer.vue'

export default {
  name: 'DeliveryOptimizerExample',
  
  components: {
    DeliveryOptimizer
  },
  
  setup() {
    // Mock Data
    const mockOrders = ref([])
    const batchOrders = ref([])
    const selectedDriver = ref(null)
    
    const mockDrivers = ref([
      {
        id: 1,
        name: 'John Doe',
        active: true,
        status: 'available',
        activeOrders: 2,
        location: { lat: 40.7128, lng: -74.0060 }
      },
      {
        id: 2,
        name: 'Jane Smith',
        active: true,
        status: 'delivering',
        activeOrders: 3,
        location: { lat: 40.7589, lng: -73.9851 }
      },
      {
        id: 3,
        name: 'Mike Johnson',
        active: false,
        status: 'offline',
        activeOrders: 0,
        location: null
      }
    ])
    
    // Batch Settings
    const batchSettings = ref({
      maxItems: 6,
      maxOrders: 3,
      maxValue: 100
    })
    
    // Mock order generator
    const addMockOrder = () => {
      const order = {
        id: Math.random().toString(36).substr(2, 9),
        restaurant: {
          id: Math.floor(Math.random() * 5) + 1,
          name: `Restaurant ${Math.floor(Math.random() * 5) + 1}`,
          location: {
            lat: 40.7128 + (Math.random() - 0.5) * 0.1,
            lng: -74.0060 + (Math.random() - 0.5) * 0.1
          }
        },
        deliveryLocation: {
          lat: 40.7128 + (Math.random() - 0.5) * 0.1,
          lng: -74.0060 + (Math.random() - 0.5) * 0.1
        },
        items: [
          {
            name: 'Item 1',
            quantity: Math.floor(Math.random() * 3) + 1,
            price: 9.99
          }
        ],
        total: Math.floor(Math.random() * 50) + 20,
        priority: Math.random() > 0.8 ? 2 : 1
      }
      
      mockOrders.value.push(order)
      batchOrders.value.push({ ...order })
    }
    
    // Initialize with some orders
    for (let i = 0; i < 5; i++) {
      addMockOrder()
    }
    
    // Event Handlers
    const handleRouteOptimized = (result) => {
      console.log('Route optimized:', result)
    }
    
    const handleBatchesCreated = (batches) => {
      console.log('Batches created:', batches)
    }
    
    const handleOrderAssigned = (order, driverId) => {
      console.log('Order assigned:', order, 'to driver:', driverId)
    }
    
    const selectDriver = (driver) => {
      selectedDriver.value = driver
    }
    
    // Utility Methods
    const getDriverStatusColor = (status) => {
      const colors = {
        available: 'success',
        delivering: 'primary',
        offline: 'grey'
      }
      return colors[status] || 'grey'
    }
    
    const getDriverOrders = (driverId) => {
      // In a real app, this would fetch orders from the store
      return mockOrders.value.slice(0, 3)
    }
    
    // Code Examples
    const basicExample = computed(() => {
      return `<delivery-optimizer
  :initial-orders="orders"
  @route-optimized="handleRouteOptimized"
/>`
    })
    
    const batchExample = computed(() => {
      return `<delivery-optimizer
  :initial-orders="orders"
  :batch-settings="{
    maxItems: 6,
    maxOrders: 3,
    maxValue: 100
  }"
  auto-batch
  @batches-created="handleBatchesCreated"
/>`
    })
    
    const realTimeExample = computed(() => {
      return `<delivery-optimizer
  :initial-orders="driverOrders"
  :driver-location="selectedDriver.location"
  @order-assigned="handleOrderAssigned"
/>`
    })
    
    return {
      mockOrders,
      batchOrders,
      batchSettings,
      mockDrivers,
      selectedDriver,
      addMockOrder,
      handleRouteOptimized,
      handleBatchesCreated,
      handleOrderAssigned,
      selectDriver,
      getDriverStatusColor,
      getDriverOrders,
      basicExample,
      batchExample,
      realTimeExample
    }
  }
}
</script>

<style scoped>
.delivery-optimizer-examples {
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