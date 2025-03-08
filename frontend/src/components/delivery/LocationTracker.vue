<template>
  <div class="location-tracker">
    <!-- Map Container -->
    <div class="map-container" ref="mapContainer">
      <div class="tracking-map" ref="mapElement"></div>
      
      <!-- Tracking Info Panel -->
      <v-card
        v-if="trackingInfo"
        class="tracking-info"
        :class="{ 'tracking-info--expanded': showDetails }"
      >
        <v-card-text>
          <div class="d-flex align-center">
            <v-avatar
              :image="trackingInfo.driver.avatar"
              size="48"
              class="mr-4"
            >
              <v-icon v-if="!trackingInfo.driver.avatar">
                mdi-account
              </v-icon>
            </v-avatar>

            <div class="flex-grow-1">
              <div class="text-subtitle-1">{{ trackingInfo.driver.name }}</div>
              <div class="text-caption">{{ trackingInfo.status }}</div>
            </div>

            <v-btn
              icon="mdi-chevron-down"
              variant="text"
              :class="{ 'rotate-180': showDetails }"
              @click="showDetails = !showDetails"
            ></v-btn>
          </div>

          <!-- ETA -->
          <div class="mt-4">
            <div class="d-flex align-center mb-2">
              <v-icon color="primary" class="mr-2">mdi-clock</v-icon>
              <span class="text-h6">{{ formatTime(trackingInfo.eta) }}</span>
            </div>
            <v-progress-linear
              :model-value="progressPercentage"
              color="primary"
              height="6"
              rounded
            ></v-progress-linear>
          </div>

          <!-- Expanded Details -->
          <div v-if="showDetails" class="mt-4">
            <v-list density="compact">
              <!-- Current Location -->
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-map-marker</v-icon>
                </template>
                <v-list-item-title>Current Location</v-list-item-title>
                <v-list-item-subtitle>{{ trackingInfo.currentLocation }}</v-list-item-subtitle>
              </v-list-item>

              <!-- Next Stop -->
              <v-list-item v-if="trackingInfo.nextStop">
                <template v-slot:prepend>
                  <v-icon color="info">mdi-flag</v-icon>
                </template>
                <v-list-item-title>Next Stop</v-list-item-title>
                <v-list-item-subtitle>{{ trackingInfo.nextStop }}</v-list-item-subtitle>
              </v-list-item>

              <!-- Contact Button -->
              <v-list-item>
                <div class="d-flex justify-space-between align-center">
                  <v-btn
                    prepend-icon="mdi-phone"
                    @click="contactDriver"
                  >
                    Contact Driver
                  </v-btn>
                  <v-btn
                    prepend-icon="mdi-message"
                    @click="messageDriver"
                  >
                    Message
                  </v-btn>
                </div>
              </v-list-item>
            </v-list>

            <!-- Delivery Instructions -->
            <v-alert
              v-if="trackingInfo.instructions"
              type="info"
              variant="outlined"
              class="mt-4"
            >
              <template v-slot:prepend>
                <v-icon>mdi-information</v-icon>
              </template>
              {{ trackingInfo.instructions }}
            </v-alert>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Message Dialog -->
    <v-dialog v-model="showMessageDialog" max-width="400">
      <v-card>
        <v-card-title>Message Driver</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="messageText"
            label="Type your message"
            :rules="[rules.required]"
            @keyup.enter="sendMessage"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showMessageDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!messageText"
            :loading="sendingMessage"
            @click="sendMessage"
          >
            Send
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useStore } from 'vuex'
import { useToast } from '@/composables/useToast'
import mapService from '@/services/map.service'

export default {
  name: 'LocationTracker',

  props: {
    orderId: {
      type: String,
      required: true
    },
    origin: {
      type: Object,
      required: true,
      validator: (value) => {
        return value.lat !== undefined && value.lng !== undefined
      }
    },
    destination: {
      type: Object,
      required: true,
      validator: (value) => {
        return value.lat !== undefined && value.lng !== undefined
      }
    }
  },

  emits: [
    'location-update',
    'eta-update',
    'delivery-complete'
  ],

  setup(props, { emit }) {
    const store = useStore()
    const { showToast } = useToast()

    // Refs
    const mapContainer = ref(null)
    const mapElement = ref(null)
    const map = ref(null)
    const locationUpdateInterval = ref(null)

    // State
    const showDetails = ref(false)
    const showMessageDialog = ref(false)
    const messageText = ref('')
    const sendingMessage = ref(false)
    const trackingInfo = ref(null)

    // Rules
    const rules = {
      required: v => !!v || 'Required'
    }

    // Initialize map
    const initializeMap = async () => {
      try {
        map.value = await mapService.createMap(mapElement.value, {
          center: props.origin,
          zoom: 15
        })

        // Add markers for origin and destination
        await mapService.addMarker(map.value, props.origin, {
          title: 'Restaurant',
          icon: 'restaurant'
        })

        await mapService.addMarker(map.value, props.destination, {
          title: 'Delivery Location',
          icon: 'destination'
        })

        // Draw initial route
        await updateRoute()
      } catch (error) {
        console.error('Failed to initialize map:', error)
        showToast('Failed to load map', 'error')
      }
    }

    // Update route on map
    const updateRoute = async () => {
      if (!map.value || !trackingInfo.value?.location) return

      try {
        const route = await mapService.getRoute({
          origin: trackingInfo.value.location,
          destination: props.destination
        })

        await mapService.drawRoute(map.value, route)
        await mapService.updateDriverMarker(map.value, trackingInfo.value.location)
        
        // Update ETA
        if (route.eta !== trackingInfo.value.eta) {
          trackingInfo.value.eta = route.eta
          emit('eta-update', route.eta)
        }
      } catch (error) {
        console.error('Failed to update route:', error)
      }
    }

    // Start location tracking
    const startTracking = async () => {
      try {
        // Get initial tracking info
        trackingInfo.value = await store.dispatch('delivery/getTrackingInfo', props.orderId)
        
        // Setup real-time updates
        locationUpdateInterval.value = setInterval(async () => {
          const updates = await store.dispatch('delivery/getLocationUpdate', props.orderId)
          
          if (updates.location) {
            trackingInfo.value = {
              ...trackingInfo.value,
              ...updates
            }
            emit('location-update', updates.location)
            updateRoute()
          }

          // Check if delivery is complete
          if (updates.status === 'delivered') {
            emit('delivery-complete')
            clearInterval(locationUpdateInterval.value)
          }
        }, 10000) // Update every 10 seconds
      } catch (error) {
        console.error('Failed to start tracking:', error)
        showToast('Failed to start location tracking', 'error')
      }
    }

    // Progress percentage for the progress bar
    const progressPercentage = computed(() => {
      if (!trackingInfo.value?.progress) return 0
      return Math.min(Math.max(trackingInfo.value.progress, 0), 100)
    })

    // Format time for display
    const formatTime = (date) => {
      if (!date) return ''
      return new Date(date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    }

    // Contact methods
    const contactDriver = () => {
      if (trackingInfo.value?.driver?.phone) {
        window.location.href = `tel:${trackingInfo.value.driver.phone}`
      }
    }

    const messageDriver = () => {
      showMessageDialog.value = true
    }

    const sendMessage = async () => {
      if (!messageText.value) return

      sendingMessage.value = true
      try {
        await store.dispatch('delivery/sendDriverMessage', {
          orderId: props.orderId,
          message: messageText.value
        })
        showMessageDialog.value = false
        messageText.value = ''
        showToast('Message sent successfully', 'success')
      } catch (error) {
        console.error('Failed to send message:', error)
        showToast('Failed to send message', 'error')
      } finally {
        sendingMessage.value = false
      }
    }

    // Lifecycle hooks
    onMounted(async () => {
      await initializeMap()
      await startTracking()
    })

    onUnmounted(() => {
      if (locationUpdateInterval.value) {
        clearInterval(locationUpdateInterval.value)
      }
    })

    // Watch for prop changes
    watch(() => props.origin, updateRoute)
    watch(() => props.destination, updateRoute)

    return {
      mapContainer,
      mapElement,
      showDetails,
      showMessageDialog,
      messageText,
      sendingMessage,
      trackingInfo,
      rules,
      progressPercentage,
      formatTime,
      contactDriver,
      messageDriver,
      sendMessage
    }
  }
}
</script>

<style scoped>
.location-tracker {
  width: 100%;
  height: 100%;
  min-height: 400px;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.tracking-map {
  width: 100%;
  height: 100%;
}

.tracking-info {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  margin: 16px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  transition: all 0.3s ease;
}

.tracking-info--expanded {
  max-height: 80%;
  overflow-y: auto;
}

.rotate-180 {
  transform: rotate(180deg);
}

@media (max-width: 600px) {
  .tracking-info {
    margin: 8px;
  }
}
</style>