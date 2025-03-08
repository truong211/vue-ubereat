<template>
  <div class="analytics-insights-examples">
    <h2 class="text-h5 mb-4">Restaurant Analytics Examples</h2>

    <!-- Example 1: Basic Analytics -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Analytics</h3>
      <v-card>
        <v-card-text>
          <analytics-insights
            restaurant-id="123"
            :date-range="defaultDateRange"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Multi-Location Analytics -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Multi-Location Analytics</h3>
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
                    <v-list-item-subtitle>
                      {{ formatCurrency(location.revenue) }} / month
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Analytics Display -->
            <v-col cols="12" md="9">
              <div v-if="selectedLocation">
                <analytics-insights
                  :restaurant-id="selectedLocation.id"
                  :date-range="defaultDateRange"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-store</v-icon>
                <div class="text-h6 mt-4">Select a Location</div>
                <div class="text-body-1 text-medium-emphasis">
                  Choose a location to view its analytics
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

    <!-- Example 3: Comparative Analysis -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Comparative Analysis</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Date Range Selection -->
            <v-col cols="12" class="mb-4">
              <v-btn-group>
                <v-btn
                  v-for="range in dateRanges"
                  :key="range.value"
                  :variant="selectedRange === range.value ? 'elevated' : 'text'"
                  @click="selectedRange = range.value"
                >
                  {{ range.label }}
                </v-btn>
              </v-btn-group>
            </v-col>

            <!-- Period Comparison -->
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <div class="text-subtitle-1 mb-4">Current Period</div>
                <analytics-insights
                  restaurant-id="123"
                  :date-range="currentPeriod"
                />
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="pa-4">
                <div class="text-subtitle-1 mb-4">Previous Period</div>
                <analytics-insights
                  restaurant-id="123"
                  :date-range="previousPeriod"
                />
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ comparativeExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import AnalyticsInsights from '@/components/restaurant/AnalyticsInsights.vue'

export default {
  name: 'AnalyticsInsightsExample',

  components: {
    AnalyticsInsights
  },

  setup() {
    // Date ranges
    const defaultDateRange = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }

    // Locations
    const locations = ref([
      {
        id: '123',
        name: 'Downtown Location',
        revenue: 52500
      },
      {
        id: '124',
        name: 'Shopping Mall Branch',
        revenue: 48200
      },
      {
        id: '125',
        name: 'Business District',
        revenue: 63800
      }
    ])

    const selectedLocation = ref(null)

    // Date range selection
    const selectedRange = ref('month')
    const dateRanges = [
      { label: 'Week', value: 'week' },
      { label: 'Month', value: 'month' },
      { label: 'Quarter', value: 'quarter' }
    ]

    // Computed periods
    const currentPeriod = computed(() => {
      const end = new Date()
      const start = new Date()
      
      switch (selectedRange.value) {
        case 'week':
          start.setDate(end.getDate() - 7)
          break
        case 'month':
          start.setMonth(end.getMonth() - 1)
          break
        case 'quarter':
          start.setMonth(end.getMonth() - 3)
          break
      }

      return { start, end }
    })

    const previousPeriod = computed(() => {
      const end = new Date(currentPeriod.value.start)
      const start = new Date(end)
      
      switch (selectedRange.value) {
        case 'week':
          start.setDate(end.getDate() - 7)
          break
        case 'month':
          start.setMonth(end.getMonth() - 1)
          break
        case 'quarter':
          start.setMonth(end.getMonth() - 3)
          break
      }

      return { start, end }
    })

    // Methods
    const selectLocation = (location: any) => {
      selectedLocation.value = location
    }

    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value)
    }

    // Code examples
    const basicExample = `<analytics-insights
  restaurant-id="123"
  :date-range="{
    start: new Date('2025-01-25'),
    end: new Date('2025-02-25')
  }"
/>`

    const multiLocationExample = `<!-- Location Selection -->
<v-list v-model="selectedLocation">
  <v-list-item
    v-for="location in locations"
    :key="location.id"
    :value="location"
  >
    <!-- Location details -->
  </v-list-item>
</v-list>

<!-- Analytics Display -->
<analytics-insights
  v-if="selectedLocation"
  :restaurant-id="selectedLocation.id"
  :date-range="dateRange"
/>`

    const comparativeExample = `<!-- Current Period -->
<analytics-insights
  restaurant-id="123"
  :date-range="currentPeriod"
/>

<!-- Previous Period -->
<analytics-insights
  restaurant-id="123"
  :date-range="previousPeriod"
/>`

    return {
      defaultDateRange,
      locations,
      selectedLocation,
      selectedRange,
      dateRanges,
      currentPeriod,
      previousPeriod,
      selectLocation,
      formatCurrency,
      basicExample,
      multiLocationExample,
      comparativeExample
    }
  }
}
</script>

<style scoped>
.analytics-insights-examples {
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