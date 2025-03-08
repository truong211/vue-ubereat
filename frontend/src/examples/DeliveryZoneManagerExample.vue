<template>
  <div class="delivery-zone-examples">
    <h2 class="text-h5 mb-4">Delivery Zone Management Examples</h2>

    <!-- Example 1: Basic Zone Management -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Zone Management</h3>
      <v-card>
        <v-card-text>
          <delivery-zone-manager
            restaurant-id="123"
            :initial-location="restaurantLocation"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Multiple Locations -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Multiple Locations</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Location Selection -->
            <v-col cols="12" md="3">
              <v-card variant="outlined">
                <v-card-title>Locations</v-card-title>
                <v-list>
                  <v-list-item
                    v-for="location in locations"
                    :key="location.id"
                    :value="location"
                    :active="selectedLocation?.id === location.id"
                    @click="selectLocation(location)"
                  >
                    <v-list-item-title>{{ location.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ location.address }}</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Zone Manager -->
            <v-col cols="12" md="9">
              <div v-if="selectedLocation">
                <delivery-zone-manager
                  :restaurant-id="selectedLocation.id"
                  :initial-location="selectedLocation.coordinates"
                  @settings-updated="handleSettingsUpdate"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-map-marker</v-icon>
                <div class="text-h6 mt-4">Select a Location</div>
                <div class="text-body-1 text-medium-emphasis">
                  Choose a location to manage its delivery zones
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ multiLocationExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Delivery Analytics -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Delivery Analytics</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Zone Manager -->
            <v-col cols="12" md="8">
              <delivery-zone-manager
                restaurant-id="123"
                :initial-location="restaurantLocation"
                @settings-updated="handleSettingsUpdate"
              />
            </v-col>

            <!-- Analytics Panel -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title>Zone Performance</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item
                      v-for="zone in zoneAnalytics"
                      :key="zone.id"
                    >
                      <template v-slot:prepend>
                        <v-avatar :color="zone.color" size="32"></v-avatar>
                      </template>
                      
                      <v-list-item-title>{{ zone.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ zone.deliveries }} deliveries
                      </v-list-item-subtitle>

                      <template v-slot:append>
                        <div class="text-right">
                          <div>${{ zone.revenue }}</div>
                          <div class="text-caption">
                            Avg. {{ zone.avgTime }}min
                          </div>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>

                  <v-divider class="my-4"></v-divider>

                  <div class="text-subtitle-1 mb-2">Popular Times</div>
                  <v-chart
                    :option="chartOptions"
                    autoresize
                    style="width: 100%; height: 200px;"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ analyticsExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import DeliveryZoneManager from '@/components/restaurant/DeliveryZoneManager.vue'

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent
])

export default {
  name: 'DeliveryZoneManagerExample',

  components: {
    DeliveryZoneManager,
    VChart
  },

  setup() {
    // Restaurant location
    const restaurantLocation = {
      lat: 13.7563,
      lng: 100.5018
    }

    // Multiple locations
    const locations = ref([
      {
        id: '123',
        name: 'Downtown Location',
        address: '123 Main St, City Center',
        coordinates: { lat: 13.7563, lng: 100.5018 }
      },
      {
        id: '124',
        name: 'Shopping Mall Branch',
        address: 'Central Mall, 4th Floor',
        coordinates: { lat: 13.7469, lng: 100.5389 }
      },
      {
        id: '125',
        name: 'Business District',
        address: '789 Office Tower',
        coordinates: { lat: 13.7450, lng: 100.5320 }
      }
    ])

    const selectedLocation = ref(null)

    // Analytics data
    const zoneAnalytics = ref([
      {
        id: '1',
        name: 'Zone A',
        color: 'red-lighten-3',
        deliveries: 128,
        revenue: 3240,
        avgTime: 25
      },
      {
        id: '2',
        name: 'Zone B',
        color: 'blue-lighten-3',
        deliveries: 85,
        revenue: 2125,
        avgTime: 30
      },
      {
        id: '3',
        name: 'Zone C',
        color: 'green-lighten-3',
        deliveries: 64,
        revenue: 1600,
        avgTime: 35
      }
    ])

    // Chart options
    const chartOptions = computed(() => ({
      tooltip: {
        trigger: 'axis'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['10am', '12pm', '2pm', '4pm', '6pm', '8pm']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: 'Deliveries',
          type: 'line',
          smooth: true,
          data: [10, 15, 25, 20, 30, 25]
        }
      ]
    }))

    // Methods
    const selectLocation = (location) => {
      selectedLocation.value = location
    }

    const handleSettingsUpdate = (settings) => {
      console.log('Delivery settings updated:', settings)
    }

    // Code examples
    const basicExample = `<delivery-zone-manager
  restaurant-id="123"
  :initial-location="{
    lat: 13.7563,
    lng: 100.5018
  }"
/>`

    const multiLocationExample = `<!-- Location List -->
<v-list v-model="selectedLocation">
  <v-list-item
    v-for="location in locations"
    :key="location.id"
    :value="location"
  >
    <!-- Location details -->
  </v-list-item>
</v-list>

<!-- Zone Manager -->
<delivery-zone-manager
  v-if="selectedLocation"
  :restaurant-id="selectedLocation.id"
  :initial-location="selectedLocation.coordinates"
  @settings-updated="handleSettingsUpdate"
/>`

    const analyticsExample = `<delivery-zone-manager
  restaurant-id="123"
  :initial-location="location"
  @settings-updated="handleSettingsUpdate"
/>

<!-- Analytics Panel -->
<v-card>
  <v-list>
    <v-list-item v-for="zone in zoneAnalytics">
      <!-- Zone performance data -->
    </v-list-item>
  </v-list>
  
  <v-chart
    :option="chartOptions"
    autoresize
  />
</v-card>`

    return {
      restaurantLocation,
      locations,
      selectedLocation,
      zoneAnalytics,
      chartOptions,
      selectLocation,
      handleSettingsUpdate,
      basicExample,
      multiLocationExample,
      analyticsExample
    }
  }
}
</script>

<style scoped>
.delivery-zone-examples {
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