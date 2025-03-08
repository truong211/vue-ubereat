<template>
  <div class="restaurant-analytics-examples">
    <h2 class="text-h5 mb-4">Restaurant Analytics Examples</h2>

    <!-- Example 1: Basic Analytics -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Analytics Dashboard</h3>
      <v-card>
        <v-card-text>
          <restaurant-analytics
            restaurant-id="123"
            :refresh-interval="300"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Multi-Restaurant Analytics -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Multi-Restaurant Comparison</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Restaurant Selector -->
            <v-col cols="12" md="3">
              <v-card variant="outlined">
                <v-card-title>Locations</v-card-title>
                <v-list>
                  <v-list-item
                    v-for="restaurant in restaurants"
                    :key="restaurant.id"
                    :value="restaurant"
                    :active="selectedRestaurant?.id === restaurant.id"
                    @click="selectRestaurant(restaurant)"
                  >
                    <v-list-item-title>{{ restaurant.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ restaurant.location }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Selected Restaurant Analytics -->
            <v-col cols="12" md="9">
              <div v-if="selectedRestaurant">
                <restaurant-analytics
                  :restaurant-id="selectedRestaurant.id"
                  :refresh-interval="300"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-store</v-icon>
                <div class="text-h6 mt-4">Select a Restaurant</div>
                <div class="text-body-1 text-medium-emphasis">
                  Choose a location to view its analytics
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ multiRestaurantExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Real-time Monitoring -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Real-time Monitoring</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Analytics Dashboard -->
            <v-col cols="12" md="8">
              <restaurant-analytics
                restaurant-id="123"
                :refresh-interval="30"
                @metrics-updated="handleMetricsUpdate"
              />
            </v-col>

            <!-- Alert Panel -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title class="d-flex justify-space-between align-center">
                  Alerts
                  <v-btn
                    icon="mdi-bell-off"
                    variant="text"
                    @click="clearAlerts"
                  >
                    <v-tooltip activator="parent" location="left">
                      Clear Alerts
                    </v-tooltip>
                  </v-btn>
                </v-card-title>

                <v-list v-if="alerts.length > 0">
                  <v-list-item
                    v-for="(alert, index) in alerts"
                    :key="index"
                    :value="alert"
                  >
                    <template v-slot:prepend>
                      <v-icon :color="alert.severity">
                        {{ getAlertIcon(alert.severity) }}
                      </v-icon>
                    </template>

                    <v-list-item-title>{{ alert.title }}</v-list-item-title>
                    <v-list-item-subtitle>{{ alert.message }}</v-list-item-subtitle>

                    <template v-slot:append>
                      <div class="text-caption">{{ formatAlertTime(alert.time) }}</div>
                    </template>
                  </v-list-item>
                </v-list>

                <div v-else class="pa-4 text-center">
                  <v-icon size="48" color="success">mdi-check-circle</v-icon>
                  <div class="text-h6 mt-2">All Systems Normal</div>
                  <div class="text-body-2 text-medium-emphasis">
                    No active alerts
                  </div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ realtimeExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import RestaurantAnalytics from '@/components/restaurant/RestaurantAnalytics.vue'
import { formatDistanceToNow } from 'date-fns'

export default {
  name: 'RestaurantAnalyticsExample',
  
  components: {
    RestaurantAnalytics
  },
  
  setup() {
    // Mock data
    const restaurants = ref([
      {
        id: '123',
        name: 'Downtown Location',
        location: 'Main St, City Center'
      },
      {
        id: '124',
        name: 'West Side Branch',
        location: 'West Mall, Suburb'
      },
      {
        id: '125',
        name: 'Airport Terminal',
        location: 'Terminal 2, Airport'
      }
    ])
    
    const selectedRestaurant = ref(null)
    const alerts = ref([])
    
    // Event handlers
    const selectRestaurant = (restaurant) => {
      selectedRestaurant.value = restaurant
    }
    
    const handleMetricsUpdate = (metrics) => {
      // Check for alert conditions
      if (metrics.queueTime > 30) {
        addAlert({
          severity: 'error',
          title: 'High Queue Time',
          message: `Current queue time is ${metrics.queueTime} minutes`,
          time: new Date()
        })
      }
      
      if (metrics.staffUtilization > 90) {
        addAlert({
          severity: 'warning',
          title: 'High Staff Utilization',
          message: `Staff utilization at ${metrics.staffUtilization}%`,
          time: new Date()
        })
      }
    }
    
    const addAlert = (alert) => {
      alerts.value.unshift(alert)
      // Keep only last 10 alerts
      if (alerts.value.length > 10) {
        alerts.value.pop()
      }
    }
    
    const clearAlerts = () => {
      alerts.value = []
    }
    
    const getAlertIcon = (severity) => {
      const icons = {
        error: 'mdi-alert-circle',
        warning: 'mdi-alert',
        info: 'mdi-information'
      }
      return icons[severity] || 'mdi-information'
    }
    
    const formatAlertTime = (time) => {
      return formatDistanceToNow(time, { addSuffix: true })
    }
    
    // Code examples
    const basicExample = computed(() => {
      return `<restaurant-analytics
  restaurant-id="123"
  :refresh-interval="300"
/>`
    })
    
    const multiRestaurantExample = computed(() => {
      return `<div v-if="selectedRestaurant">
  <restaurant-analytics
    :restaurant-id="selectedRestaurant.id"
    :refresh-interval="300"
  />
</div>`
    })
    
    const realtimeExample = computed(() => {
      return `<restaurant-analytics
  restaurant-id="123"
  :refresh-interval="30"
  @metrics-updated="handleMetricsUpdate"
/>`
    })
    
    return {
      restaurants,
      selectedRestaurant,
      alerts,
      selectRestaurant,
      handleMetricsUpdate,
      clearAlerts,
      getAlertIcon,
      formatAlertTime,
      basicExample,
      multiRestaurantExample,
      realtimeExample
    }
  }
}
</script>

<style scoped>
.restaurant-analytics-examples {
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