<template>
  <div class="batch-orders">
    <!-- Batch Overview -->
    <v-card class="mb-6">
      <v-card-text class="d-flex align-center">
        <div class="flex-grow-1">
          <div class="text-h5 mb-1">
            Batch Orders ({{ currentBatch.length }}/{{ maxBatchSize }})
          </div>
          <div class="text-subtitle-1">
            {{ formatDuration(totalDuration) }} • {{ formatDistance(totalDistance) }}
          </div>
        </div>
        <div class="text-right">
          <div class="text-h5 text-primary">${{ estimatedEarnings }}</div>
          <div class="text-caption">Estimated Earnings</div>
        </div>
      </v-card-text>
    </v-card>

    <!-- Route Map -->
    <v-card class="mb-6">
      <v-card-text class="pa-0">
        <DeliveryMap
          ref="deliveryMap"
          :center="currentLocation"
          :points="mapPoints"
          :route="routeInfo"
          :show-current-location="true"
          class="batch-map"
          @location-update="handleLocationUpdate"
          @eta-update="handleEtaUpdate"
        />
      </v-card-text>
    </v-card>

    <!-- Route Instructions -->
    <v-card class="mb-6">
      <v-card-title>Route Instructions</v-card-title>
      <v-timeline density="compact">
        <v-timeline-item
          v-for="(instruction, index) in routeInstructions"
          :key="index"
          :dot-color="getStatusColor(instruction.type, instruction.completed)"
          :size="currentStep === index ? 'large' : 'small'"
        >
          <div class="d-flex justify-space-between align-center">
            <div>
              <div :class="{ 'font-weight-bold': currentStep === index }">
                {{ instruction.text }}
              </div>
              <div v-if="instruction.eta" class="text-caption">
                ETA: {{ formatTime(instruction.eta) }}
              </div>
            </div>
            <div v-if="currentStep === index">
              <v-btn
                v-if="instruction.type === 'pickup'"
                color="primary"
                size="small"
                :loading="updating"
                @click="confirmPickup(instruction)"
              >
                Confirm Pickup
              </v-btn>
              <v-btn
                v-else-if="instruction.type === 'delivery'"
                color="success"
                size="small"
                :loading="updating"
                @click="confirmDelivery(instruction)"
              >
                Deliver
              </v-btn>
            </div>
          </div>
        </v-timeline-item>
      </v-timeline>
    </v-card>

    <!-- Order Cards -->
    <div class="order-cards">
      <v-expansion-panels v-model="expandedOrder">
        <v-expansion-panel
          v-for="order in currentBatch"
          :key="order.id"
          :class="{ 'completed': order.status === 'completed' }"
        >
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-badge
                :color="getOrderStatusColor(order.status)"
                dot
                class="me-3"
              >
                <v-avatar size="40" color="grey-lighten-2">
                  <v-img
                    :src="order.restaurant.logo"
                    :alt="order.restaurant.name"
                  ></v-img>
                </v-avatar>
              </v-badge>
              <div>
                <div class="text-subtitle-1">Order #{{ order.id }}</div>
                <div class="text-caption">{{ order.restaurant.name }}</div>
              </div>
              <v-spacer></v-spacer>
              <div class="text-right">
                <div class="text-subtitle-2">${{ order.total }}</div>
                <div class="text-caption">{{ formatDistance(order.distance) }}</div>
              </div>
            </div>
          </v-expansion-panel-title>

          <v-expansion-panel-text>
            <!-- Order Items -->
            <v-list density="compact">
              <v-list-item
                v-for="item in order.items"
                :key="item.id"
                :title="`${item.quantity}x ${item.name}`"
                :subtitle="item.notes"
              ></v-list-item>
            </v-list>

            <v-divider class="my-2"></v-divider>

            <!-- Customer Info -->
            <div class="d-flex align-center justify-space-between mb-2">
              <div class="text-body-2">{{ order.customer.name }}</div>
              <v-btn
                density="comfortable"
                icon="mdi-phone"
                variant="text"
                :href="`tel:${order.customer.phone}`"
              ></v-btn>
            </div>
            <div class="text-caption">{{ order.customer.address }}</div>

            <div v-if="order.customer.note" class="text-caption mt-2">
              Note: {{ order.customer.note }}
            </div>

            <!-- Actions -->
            <v-card-actions>
              <v-btn
                color="primary"
                variant="text"
                prepend-icon="mdi-message"
                @click="openChat(order)"
              >
                Message
              </v-btn>
              <v-btn
                color="primary"
                variant="text"
                prepend-icon="mdi-navigation"
                :href="getNavigationUrl(order)"
                target="_blank"
              >
                Navigate
              </v-btn>
            </v-card-actions>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <!-- Chat Drawer -->
    <v-navigation-drawer
      v-model="showChat"
      location="right"
      temporary
      width="400"
    >
      <OrderChat
        v-if="showChat"
        :order-id="activeChatOrder?.id"
        :type="activeChatType"
        :participant="activeChatParticipant"
        @close="showChat = false"
      />
    </v-navigation-drawer>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import DeliveryMap from '@/components/common/DeliveryMap.vue'
import OrderChat from '@/components/driver/OrderChat.vue'
import routeOptimizer from '@/services/routeOptimizer'
import mapService from '@/services/map'

export default {
  name: 'BatchOrders',

  components: {
    DeliveryMap,
    OrderChat
  },

  setup() {
    const store = useStore()
    const router = useRouter()
    const deliveryMap = ref(null)
    const expandedOrder = ref(null)
    const updating = ref(false)
    const currentLocation = ref(null)
    const currentStep = ref(0)

    // Chat state
    const showChat = ref(false)
    const activeChatOrder = ref(null)
    const activeChatType = ref(null)
    const activeChatParticipant = ref(null)

    // Computed properties
    const currentBatch = computed(() => store.state.driver.currentBatch)
    const maxBatchSize = computed(() => routeOptimizer.maxBatchSize)
    const routeInfo = computed(() => store.state.driver.currentRoute)

    const totalDuration = computed(() => 
      routeInfo.value?.duration || 0
    )

    const totalDistance = computed(() => 
      routeInfo.value?.distance || 0
    )

    const estimatedEarnings = computed(() => {
      if (!routeInfo.value) return 0
      const earnings = routeOptimizer.estimateEarnings(routeInfo.value)
      return earnings.total.toFixed(2)
    })

    const routeInstructions = computed(() =>
      routeInfo.value ? routeOptimizer.generateRouteInstructions(routeInfo.value) : []
    )

    const mapPoints = computed(() => {
      if (!currentBatch.value.length) return []
      
      const points = []

      // Add restaurant points
      currentBatch.value.forEach(order => {
        if (order.status !== 'completed') {
          points.push({
            id: `restaurant-${order.restaurant.id}`,
            position: order.restaurant.location,
            title: order.restaurant.name,
            type: 'restaurant',
            icon: {
              url: '/img/icons/restaurant-marker.png',
              scaledSize: { width: 32, height: 32 }
            }
          })
        }
      })

      // Add delivery points
      currentBatch.value.forEach(order => {
        if (order.status !== 'completed') {
          points.push({
            id: `delivery-${order.id}`,
            position: order.customer.location,
            title: order.customer.name,
            type: 'delivery',
            icon: {
              url: '/img/icons/customer-marker.png',
              scaledSize: { width: 32, height: 32 }
            }
          })
        }
      })

      return points
    })

    // Methods
    const handleLocationUpdate = (position) => {
      currentLocation.value = position
      store.dispatch('driver/updateLocation', {
        batchId: currentBatch.value[0]?.batchId,
        position
      })
    }

    const handleEtaUpdate = (eta) => {
      store.dispatch('driver/updateBatchEta', {
        batchId: currentBatch.value[0]?.batchId,
        eta
      })
    }

    const confirmPickup = async (instruction) => {
      updating.value = true
      try {
        await store.dispatch('driver/confirmBatchPickup', {
          orders: instruction.orders
        })
        currentStep.value++
      } catch (error) {
        console.error('Failed to confirm pickup:', error)
      } finally {
        updating.value = false
      }
    }

    const confirmDelivery = async (instruction) => {
      updating.value = true
      try {
        await store.dispatch('driver/confirmDelivery', {
          orderId: instruction.orderId
        })
        currentStep.value++

        // Check if batch is completed
        if (currentStep.value >= routeInstructions.value.length) {
          await store.dispatch('driver/completeBatch', {
            batchId: currentBatch.value[0].batchId
          })
          router.push('/driver/dashboard')
        }
      } catch (error) {
        console.error('Failed to confirm delivery:', error)
      } finally {
        updating.value = false
      }
    }

    const openChat = (order) => {
      activeChatOrder.value = order
      activeChatType.value = 'customer'
      activeChatParticipant.value = order.customer
      showChat.value = true
    }

    const getNavigationUrl = (order) => {
      return mapService.getNavigationUrl(order.customer.location)
    }

    const formatDistance = (distance) => {
      return `${distance.toFixed(1)} km`
    }

    const formatDuration = (minutes) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    const getStatusColor = (type, completed) => {
      if (completed) return 'success'
      switch (type) {
        case 'pickup': return 'primary'
        case 'delivery': return 'info'
        default: return 'grey'
      }
    }

    const getOrderStatusColor = (status) => {
      switch (status) {
        case 'accepted': return 'warning'
        case 'picked_up': return 'info'
        case 'completed': return 'success'
        default: return 'grey'
      }
    }

    // Lifecycle hooks
    onMounted(async () => {
      if (!currentBatch.value.length) {
        router.push('/driver/dashboard')
        return
      }

      // Start location tracking
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          position => {
            currentLocation.value = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            }
          },
          error => console.error('Geolocation error:', error)
        )
      }
    })

    onUnmounted(() => {
      // Clean up any subscriptions or intervals
    })

    return {
      deliveryMap,
      expandedOrder,
      updating,
      currentStep,
      showChat,
      activeChatOrder,
      activeChatType,
      activeChatParticipant,
      currentBatch,
      maxBatchSize,
      routeInfo,
      totalDuration,
      totalDistance,
      estimatedEarnings,
      routeInstructions,
      mapPoints,
      currentLocation,
      handleLocationUpdate,
      handleEtaUpdate,
      confirmPickup,
      confirmDelivery,
      openChat,
      getNavigationUrl,
      formatDistance,
      formatDuration,
      formatTime,
      getStatusColor,
      getOrderStatusColor
    }
  }
}
</script>

<style scoped>
.batch-orders {
  padding: 20px;
}

.batch-map {
  height: 400px;
  width: 100%;
}

.order-cards {
  margin-top: 20px;
}

.completed {
  opacity: 0.7;
}

/* Timeline customization */
:deep(.v-timeline-item__body) {
  flex: 1;
}
</style>
