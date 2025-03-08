<template>
  <div class="delivery-route">
    <!-- Map -->
    <DeliveryMap
      ref="deliveryMap"
      :center="initialCenter"
      :points="mapPoints"
      :route="routeInfo"
      :show-current-location="true"
      :show-center-button="true"
      :show-zoom-controls="true"
      class="delivery-map"
      @location-update="handleLocationUpdate"
      @eta-update="handleEtaUpdate"
      @error="handleMapError"
    />

    <!-- Route Info -->
    <v-card class="route-info">
      <v-card-text>
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-subtitle-2">{{ currentPhase }}</div>
            <div class="text-caption">{{ currentDestination }}</div>
          </div>
          <div class="text-right">
            <div class="text-h6">{{ formattedEta }}</div>
            <div class="text-caption">{{ formattedDistance }}</div>
          </div>
        </div>

        <!-- Progress Steps -->
        <v-timeline density="compact" class="mt-4">
          <v-timeline-item
            v-for="(step, index) in deliverySteps"
            :key="index"
            :dot-color="getStepColor(step.status)"
            :size="currentStep === index ? 'small' : 'x-small'"
          >
            <div class="d-flex justify-space-between">
              <div>
                <div :class="{'font-weight-bold': currentStep === index}">
                  {{ step.title }}
                </div>
                <div class="text-caption">{{ step.description }}</div>
              </div>
              <div v-if="step.time" class="text-caption">
                {{ formatTime(step.time) }}
              </div>
            </div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>

      <!-- Navigation Actions -->
      <v-card-actions>
        <v-btn
          v-if="showNavigationButton"
          color="primary"
          block
          prepend-icon="mdi-navigation"
          :href="navigationUrl"
          target="_blank"
        >
          Start Navigation
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import DeliveryMap from '@/components/common/DeliveryMap.vue'
import mapService from '@/services/map'

export default {
  name: 'DeliveryRoute',

  components: {
    DeliveryMap
  },

  props: {
    // Order data
    order: {
      type: Object,
      required: true
    },
    // Current step in delivery process
    currentStep: {
      type: Number,
      default: 0
    },
    // Show navigation button
    showNavigationButton: {
      type: Boolean,
      default: true
    }
  },

  emits: [
    'location-update',
    'eta-update',
    'error'
  ],

  setup(props, { emit }) {
    const deliveryMap = ref(null)
    const eta = ref(null)
    const distance = ref(null)
    const currentLocation = ref(null)

    // Computed map points and route
    const mapPoints = computed(() => {
      const points = []

      // Restaurant point
      points.push({
        id: 'restaurant',
        position: props.order.restaurant.location,
        title: props.order.restaurant.name,
        icon: {
          url: '/icons/restaurant-marker.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      })

      // Customer point
      points.push({
        id: 'customer',
        position: props.order.customer.location,
        title: props.order.customer.name,
        icon: {
          url: '/icons/customer-marker.png',
          scaledSize: new google.maps.Size(32, 32)
        }
      })

      return points
    })

    const routeInfo = computed(() => {
      if (props.currentStep === 0) {
        // Route to restaurant
        return {
          origin: currentLocation.value || props.order.driver.location,
          destination: props.order.restaurant.location
        }
      } else {
        // Route to customer
        return {
          origin: currentLocation.value || props.order.restaurant.location,
          destination: props.order.customer.location
        }
      }
    })

    const initialCenter = computed(() => {
      return currentLocation.value || props.order.restaurant.location
    })

    // Delivery steps
    const deliverySteps = computed(() => [
      {
        title: 'Pick Up Order',
        description: `from ${props.order.restaurant.name}`,
        status: props.currentStep > 0 ? 'completed' : 'current',
        time: props.order.pickupTime
      },
      {
        title: 'Deliver Order',
        description: `to ${props.order.customer.name}`,
        status: props.currentStep > 1 ? 'completed' : 
                props.currentStep === 1 ? 'current' : 'pending',
        time: props.order.deliveryTime
      }
    ])

    // Current phase text
    const currentPhase = computed(() => {
      return props.currentStep === 0 ? 
        'Picking up order' : 'Delivering to customer'
    })

    const currentDestination = computed(() => {
      return props.currentStep === 0 ?
        props.order.restaurant.name : props.order.customer.name
    })

    // Navigation URL
    const navigationUrl = computed(() => {
      const destination = props.currentStep === 0 ?
        props.order.restaurant.location :
        props.order.customer.location
      return mapService.getNavigationUrl(destination)
    })

    // Format ETA and distance
    const formattedEta = computed(() => {
      if (!eta.value) return '--'
      return `${eta.value} min`
    })

    const formattedDistance = computed(() => {
      if (!distance.value) return '--'
      return `${distance.value.toFixed(1)} km`
    })

    // Event handlers
    const handleLocationUpdate = (position) => {
      currentLocation.value = position
      emit('location-update', position)

      // Calculate distance
      const destination = props.currentStep === 0 ?
        props.order.restaurant.location :
        props.order.customer.location
      distance.value = mapService.calculateDistance(position, destination)
    }

    const handleEtaUpdate = (newEta) => {
      eta.value = newEta
      emit('eta-update', newEta)
    }

    const handleMapError = (error) => {
      emit('error', error)
    }

    // Utility functions
    const getStepColor = (status) => {
      switch (status) {
        case 'completed': return 'success'
        case 'current': return 'primary'
        default: return 'grey'
      }
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    // Watch for step changes to update route
    watch(() => props.currentStep, () => {
      if (deliveryMap.value) {
        deliveryMap.value.updateRoute()
      }
    })

    return {
      deliveryMap,
      mapPoints,
      routeInfo,
      initialCenter,
      deliverySteps,
      currentPhase,
      currentDestination,
      navigationUrl,
      formattedEta,
      formattedDistance,
      handleLocationUpdate,
      handleEtaUpdate,
      handleMapError,
      getStepColor,
      formatTime
    }
  }
}
</script>

<style scoped>
.delivery-route {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.delivery-map {
  flex: 1;
  min-height: 300px;
}

.route-info {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  margin-top: -16px;
  z-index: 1;
}
</style>
