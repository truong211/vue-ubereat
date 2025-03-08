<template>
  <div class="delivery-optimizer">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h6">Delivery Queue</h2>
        <div class="text-subtitle-2">
          {{ activeOrders.length }} orders • {{ totalDistance }}km • ~{{ totalDuration }}
        </div>
      </div>
      
      <div class="d-flex align-center">
        <v-switch
          v-model="autoBatching"
          label="Auto-batch orders"
          density="compact"
          hide-details
          class="mr-4"
        ></v-switch>
        
        <v-btn
          color="primary"
          :loading="isOptimizing"
          @click="optimizeRoute"
          prepend-icon="mdi-route"
        >
          Optimize Route
        </v-btn>
      </div>
    </div>

    <v-row>
      <!-- Order Queue -->
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            Orders
            <v-menu v-if="activeOrders.length > 0">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-dots-vertical"
                  variant="text"
                  v-bind="props"
                ></v-btn>
              </template>
              <v-list>
                <v-list-item
                  prepend-icon="mdi-refresh"
                  title="Reset Queue"
                  @click="resetQueue"
                ></v-list-item>
                <v-list-item
                  prepend-icon="mdi-sort"
                  title="Sort by Priority"
                  @click="sortByPriority"
                ></v-list-item>
              </v-list>
            </v-menu>
          </v-card-title>

          <v-divider></v-divider>

          <!-- Order List -->
          <v-list class="delivery-queue">
            <draggable
              v-model="activeOrders"
              handle=".drag-handle"
              @end="handleDragEnd"
            >
              <template #item="{ element: order }">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-btn
                      icon="mdi-drag"
                      variant="text"
                      size="small"
                      class="drag-handle"
                    ></v-btn>
                  </template>

                  <v-list-item-title>
                    Order #{{ order.id }}
                    <v-chip
                      v-if="order.priority > 1"
                      color="error"
                      size="x-small"
                      class="ml-2"
                    >
                      High Priority
                    </v-chip>
                  </v-list-item-title>

                  <v-list-item-subtitle>
                    <div class="d-flex align-center">
                      <v-icon size="small" class="mr-1">mdi-store</v-icon>
                      {{ order.restaurant.name }}
                    </div>
                    <div class="d-flex align-center">
                      <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                      {{ formatDistance(order.distance) }} away
                    </div>
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="text-right">
                      <div class="text-caption">ETA</div>
                      <div :class="getETAColor(order.estimatedDeliveryTime)">
                        {{ formatETA(order.estimatedDeliveryTime) }}
                      </div>
                    </div>
                  </template>
                </v-list-item>
              </template>
            </draggable>
          </v-list>

          <v-divider></v-divider>

          <!-- Queue Stats -->
          <v-card-text v-if="activeOrders.length > 0">
            <div class="d-flex justify-space-between mb-2">
              <span>Total Value</span>
              <span>${{ totalOrderValue.toFixed(2) }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span>Avg. Time per Order</span>
              <span>{{ avgTimePerOrder }} min</span>
            </div>
          </v-card-text>
        </v-card>

        <!-- Batch Groups -->
        <div v-if="autoBatching && batchedOrders.length > 0" class="mt-4">
          <h3 class="text-subtitle-1 mb-2">Suggested Batches</h3>
          <v-expansion-panels>
            <v-expansion-panel
              v-for="(batch, index) in batchedOrders"
              :key="index"
            >
              <v-expansion-panel-title>
                Batch #{{ index + 1 }} ({{ batch.length }} orders)
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list density="compact">
                  <v-list-item
                    v-for="order in batch"
                    :key="order.id"
                    :title="`Order #${order.id}`"
                    :subtitle="order.restaurant.name"
                  >
                    <template v-slot:append>
                      ${{ order.total.toFixed(2) }}
                    </template>
                  </v-list-item>
                </v-list>
                <v-divider class="my-2"></v-divider>
                <div class="d-flex justify-space-between">
                  <span>Batch Total</span>
                  <span>${{ calculateBatchTotal(batch).toFixed(2) }}</span>
                </div>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </v-col>

      <!-- Route Map -->
      <v-col cols="12" md="8">
        <v-card>
          <div class="route-map" style="height: 600px;">
            <delivery-map
              ref="deliveryMap"
              :orders="activeOrders"
              :optimized-route="optimizedRoute"
              :show-traffic="true"
              @marker-click="handleMarkerClick"
            />
          </div>
          
          <!-- Route Details -->
          <v-expand-transition>
            <div v-if="optimizedRoute" class="pa-4">
              <div class="d-flex align-center mb-4">
                <v-icon color="primary" class="mr-2">mdi-information</v-icon>
                <span>Optimal route calculated with {{ activeOrders.length }} stops</span>
              </div>
              
              <v-timeline density="compact">
                <v-timeline-item
                  v-for="(stop, index) in optimizedRoute.sequence"
                  :key="index"
                  :dot-color="getStopColor(stop.type)"
                  size="small"
                >
                  <div class="d-flex justify-space-between align-center">
                    <div>
                      <div class="text-subtitle-2">
                        {{ getStopTitle(stop) }}
                      </div>
                      <div class="text-caption">
                        {{ getStopSubtitle(stop) }}
                      </div>
                    </div>
                    <div class="text-caption">
                      {{ formatDuration(stop.eta) }}
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </div>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>

    <!-- Order Details Dialog -->
    <v-dialog v-model="showOrderDetails" max-width="500">
      <v-card v-if="selectedOrder">
        <v-card-title>
          Order #{{ selectedOrder.id }}
          <v-chip
            v-if="selectedOrder.priority > 1"
            color="error"
            size="small"
            class="ml-2"
          >
            High Priority
          </v-chip>
        </v-card-title>
        
        <v-card-text>
          <div class="mb-4">
            <div class="text-subtitle-1 mb-2">Restaurant</div>
            <div class="d-flex align-center">
              <v-avatar :image="selectedOrder.restaurant.image" size="40" class="mr-3">
                <v-icon>mdi-store</v-icon>
              </v-avatar>
              <div>
                <div>{{ selectedOrder.restaurant.name }}</div>
                <div class="text-caption">{{ selectedOrder.restaurant.address }}</div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <div class="text-subtitle-1 mb-2">Delivery Address</div>
            <div class="d-flex align-center">
              <v-icon size="40" class="mr-3">mdi-map-marker</v-icon>
              <div>
                <div>{{ selectedOrder.deliveryAddress }}</div>
                <div class="text-caption" v-if="selectedOrder.instructions">
                  Note: {{ selectedOrder.instructions }}
                </div>
              </div>
            </div>
          </div>

          <div class="mb-4">
            <div class="text-subtitle-1 mb-2">Items</div>
            <v-list density="compact">
              <v-list-item
                v-for="item in selectedOrder.items"
                :key="item.id"
                :title="item.name"
                :subtitle="`Quantity: ${item.quantity}`"
              >
                <template v-slot:append>
                  ${{ (item.price * item.quantity).toFixed(2) }}
                </template>
              </v-list-item>
            </v-list>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div class="d-flex justify-space-between text-subtitle-1">
            <span>Total</span>
            <span>${{ selectedOrder.total.toFixed(2) }}</span>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showOrderDetails = false"
          >
            Close
          </v-btn>
          <v-btn
            color="primary"
            :to="{ name: 'OrderDetail', params: { id: selectedOrder.id }}"
          >
            View Full Details
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import orderOptimizer from '@/services/order-optimizer.service'
import DeliveryMap from '@/components/common/DeliveryMap.vue'
import draggable from 'vuedraggable'
import { formatDistanceToNow, formatDistance } from 'date-fns'

export default {
  name: 'DeliveryOptimizer',
  
  components: {
    DeliveryMap,
    draggable
  },
  
  setup() {
    const store = useStore()
    const deliveryMap = ref(null)
    
    // State
    const activeOrders = ref([])
    const optimizedRoute = ref(null)
    const isOptimizing = ref(false)
    const autoBatching = ref(true)
    const showOrderDetails = ref(false)
    const selectedOrder = ref(null)
    const driverLocation = ref(null)
    
    // Load active orders
    const loadActiveOrders = async () => {
      try {
        const orders = await store.dispatch('driver/fetchActiveOrders')
        activeOrders.value = orders
      } catch (error) {
        console.error('Failed to load active orders:', error)
      }
    }
    
    // Optimize route
    const optimizeRoute = async () => {
      if (activeOrders.value.length === 0) return
      
      isOptimizing.value = true
      try {
        const result = await orderOptimizer.calculateOptimalRoute(
          activeOrders.value,
          driverLocation.value
        )
        optimizedRoute.value = result
        
        // Update map
        if (deliveryMap.value) {
          deliveryMap.value.updateRoute(result.route)
        }
      } catch (error) {
        console.error('Failed to optimize route:', error)
      } finally {
        isOptimizing.value = false
      }
    }
    
    // Calculate batches
    const batchedOrders = computed(() => {
      if (!autoBatching.value || activeOrders.value.length === 0) return []
      
      return orderOptimizer.batchOrders(activeOrders.value, {
        maxItems: 6,
        maxOrders: 3,
        maxValue: 100
      })
    })
    
    // Computed values
    const totalOrderValue = computed(() => 
      activeOrders.value.reduce((sum, order) => sum + order.total, 0)
    )
    
    const totalDistance = computed(() => 
      optimizedRoute.value ? 
        (optimizedRoute.value.distance / 1000).toFixed(1) : 
        '0'
    )
    
    const totalDuration = computed(() => {
      if (!optimizedRoute.value) return '0 min'
      const minutes = Math.round(optimizedRoute.value.duration / 60)
      return `${minutes} min`
    })
    
    const avgTimePerOrder = computed(() => {
      if (!optimizedRoute.value || activeOrders.value.length === 0) return '0'
      return Math.round(optimizedRoute.value.duration / 60 / activeOrders.value.length)
    })
    
    // Event handlers
    const handleDragEnd = () => {
      // Recalculate route when order sequence changes
      optimizeRoute()
    }
    
    const handleMarkerClick = (marker) => {
      if (marker.orderId) {
        selectedOrder.value = activeOrders.value.find(o => o.id === marker.orderId)
        showOrderDetails.value = true
      }
    }
    
    const resetQueue = () => {
      activeOrders.value = []
      optimizedRoute.value = null
    }
    
    const sortByPriority = () => {
      activeOrders.value.sort((a, b) => b.priority - a.priority)
      optimizeRoute()
    }
    
    // Utility methods
    const formatETA = (date) => {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    }
    
    const getETAColor = (date) => {
      const minutes = (new Date(date) - new Date()) / 60000
      if (minutes < 0) return 'text-error'
      if (minutes < 15) return 'text-warning'
      return 'text-success'
    }
    
    const formatDistance = (meters) => {
      return `${(meters / 1000).toFixed(1)}km`
    }
    
    const formatDuration = (seconds) => {
      const minutes = Math.round(seconds / 60)
      return `${minutes} min`
    }
    
    const calculateBatchTotal = (batch) => {
      return batch.reduce((sum, order) => sum + order.total, 0)
    }
    
    const getStopColor = (type) => {
      const colors = {
        pickup: 'primary',
        delivery: 'success',
        current: 'info'
      }
      return colors[type] || 'grey'
    }
    
    const getStopTitle = (stop) => {
      if (stop.type === 'pickup') {
        return `Pickup from ${stop.restaurant.name}`
      }
      if (stop.type === 'delivery') {
        return `Deliver Order #${stop.orderId}`
      }
      return 'Current Location'
    }
    
    const getStopSubtitle = (stop) => {
      if (stop.type === 'pickup') {
        return stop.restaurant.address
      }
      if (stop.type === 'delivery') {
        return stop.address
      }
      return 'Your Location'
    }
    
    // Watch for location updates
    watch(() => store.state.driver.location, (location) => {
      driverLocation.value = location
      if (location && activeOrders.value.length > 0) {
        optimizeRoute()
      }
    })
    
    // Initialize
    onMounted(async () => {
      await loadActiveOrders()
      driverLocation.value = await store.dispatch('driver/getCurrentLocation')
      if (activeOrders.value.length > 0) {
        optimizeRoute()
      }
    })
    
    return {
      activeOrders,
      optimizedRoute,
      isOptimizing,
      autoBatching,
      batchedOrders,
      showOrderDetails,
      selectedOrder,
      deliveryMap,
      totalOrderValue,
      totalDistance,
      totalDuration,
      avgTimePerOrder,
      handleDragEnd,
      handleMarkerClick,
      optimizeRoute,
      resetQueue,
      sortByPriority,
      formatETA,
      getETAColor,
      formatDistance,
      formatDuration,
      calculateBatchTotal,
      getStopColor,
      getStopTitle,
      getStopSubtitle
    }
  }
}
</script>

<style scoped>
.delivery-queue {
  max-height: 400px;
  overflow-y: auto;
}

.drag-handle {
  cursor: move;
}

/* Custom scrollbar for delivery queue */
.delivery-queue::-webkit-scrollbar {
  width: 6px;
}

.delivery-queue::-webkit-scrollbar-track {
  background: transparent;
}

.delivery-queue::-webkit-scrollbar-thumb {
  background: #90a4ae;
  border-radius: 3px;
}

.delivery-queue::-webkit-scrollbar-thumb:hover {
  background: #607d8b;
}
</style>