<template>
  <div class="driver-performance-examples">
    <h2 class="text-h5 mb-4">Driver Performance Examples</h2>

    <!-- Example 1: Basic Performance View -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Performance</h3>
      <v-card>
        <v-card-text>
          <driver-performance
            driver-id="123"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Multi-Driver Comparison -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Driver Comparison</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Driver Selection -->
            <v-col cols="12" md="3">
              <v-card variant="outlined">
                <v-card-title>Drivers</v-card-title>
                <v-list>
                  <v-list-item
                    v-for="driver in drivers"
                    :key="driver.id"
                    :value="driver"
                    :active="selectedDriver?.id === driver.id"
                    @click="selectDriver(driver)"
                  >
                    <template v-slot:prepend>
                      <v-avatar :image="driver.avatar">
                        <v-icon>mdi-account</v-icon>
                      </v-avatar>
                    </template>

                    <v-list-item-title>{{ driver.name }}</v-list-item-title>
                    <v-list-item-subtitle>
                      Rating: {{ driver.rating }} ★
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Performance Display -->
            <v-col cols="12" md="9">
              <div v-if="selectedDriver">
                <driver-performance
                  :driver-id="selectedDriver.id"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-account</v-icon>
                <div class="text-h6 mt-4">Select a Driver</div>
                <div class="text-body-1 text-medium-emphasis">
                  Choose a driver to view their performance
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ comparisonExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Performance Dashboard -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Fleet Dashboard</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Summary Stats -->
            <v-col cols="12" class="mb-4">
              <v-row>
                <v-col
                  v-for="stat in fleetStats"
                  :key="stat.id"
                  cols="12"
                  sm="6"
                  md="3"
                >
                  <v-card variant="outlined">
                    <v-card-text class="text-center">
                      <div class="text-h4 mb-1">{{ formatStat(stat) }}</div>
                      <div class="text-subtitle-2">{{ stat.name }}</div>
                      <div
                        class="text-caption"
                        :class="stat.trend === 'up' ? 'text-success' : 'text-error'"
                      >
                        {{ stat.trend === 'up' ? '↑' : '↓' }} {{ stat.change }}% vs last week
                      </div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-col>

            <!-- Top Performers -->
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Top Performers</v-card-title>
                <v-card-text>
                  <v-list>
                    <v-list-item
                      v-for="driver in topPerformers"
                      :key="driver.id"
                      :value="driver"
                    >
                      <template v-slot:prepend>
                        <v-avatar :image="driver.avatar">
                          <v-icon>mdi-account</v-icon>
                        </v-avatar>
                      </template>

                      <v-list-item-title>{{ driver.name }}</v-list-item-title>
                      <v-list-item-subtitle>
                        {{ driver.deliveries }} deliveries • {{ driver.rating }}★
                      </v-list-item-subtitle>

                      <template v-slot:append>
                        <div class="text-right">
                          <div>${{ formatNumber(driver.earnings) }}</div>
                          <v-chip
                            size="small"
                            color="success"
                          >
                            Top {{ driver.rank }}%
                          </v-chip>
                        </div>
                      </template>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Performance Distribution -->
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Performance Distribution</v-card-title>
                <v-card-text>
                  <v-chart
                    :option="distributionChartOptions"
                    autoresize
                    style="width: 100%; height: 300px;"
                  />
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ dashboardExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import DriverPerformance from '@/components/driver/DriverPerformance.vue'

// Register ECharts components
use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent
])

export default {
  name: 'DriverPerformanceExample',

  components: {
    DriverPerformance,
    VChart
  },

  setup() {
    // Drivers list
    const drivers = ref([
      {
        id: '123',
        name: 'John Smith',
        avatar: '/images/avatars/driver1.jpg',
        rating: 4.8
      },
      {
        id: '124',
        name: 'Sarah Johnson',
        avatar: '/images/avatars/driver2.jpg',
        rating: 4.9
      },
      {
        id: '125',
        name: 'Mike Wilson',
        avatar: '/images/avatars/driver3.jpg',
        rating: 4.7
      }
    ])

    const selectedDriver = ref(null)

    // Fleet stats
    const fleetStats = ref([
      {
        id: 1,
        name: 'Total Deliveries',
        value: 1285,
        format: 'number',
        trend: 'up',
        change: 15
      },
      {
        id: 2,
        name: 'Average Rating',
        value: 4.8,
        format: 'rating',
        trend: 'up',
        change: 3
      },
      {
        id: 3,
        name: 'Total Revenue',
        value: 25800,
        format: 'currency',
        trend: 'up',
        change: 12
      },
      {
        id: 4,
        name: 'Active Drivers',
        value: 85,
        format: 'percentage',
        trend: 'down',
        change: 2
      }
    ])

    // Top performers
    const topPerformers = ref([
      {
        id: '123',
        name: 'John Smith',
        avatar: '/images/avatars/driver1.jpg',
        deliveries: 245,
        rating: 4.8,
        earnings: 3850,
        rank: 5
      },
      {
        id: '124',
        name: 'Sarah Johnson',
        avatar: '/images/avatars/driver2.jpg',
        deliveries: 238,
        rating: 4.9,
        earnings: 3720,
        rank: 8
      },
      {
        id: '125',
        name: 'Mike Wilson',
        avatar: '/images/avatars/driver3.jpg',
        deliveries: 226,
        rating: 4.7,
        earnings: 3540,
        rank: 12
      }
    ])

    // Chart options
    const distributionChartOptions = computed(() => ({
      tooltip: {
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        data: ['<2', '2-3', '3-4', '4-4.5', '4.5-5']
      },
      yAxis: {
        type: 'value',
        name: 'Drivers'
      },
      series: [
        {
          name: 'Rating Distribution',
          type: 'bar',
          data: [2, 5, 15, 35, 43],
          itemStyle: {
            color: function(params: any) {
              const colors = ['#F44336', '#FB8C00', '#FDD835', '#66BB6A', '#26A69A']
              return colors[params.dataIndex]
            }
          }
        }
      ]
    }))

    // Methods
    const selectDriver = (driver: any) => {
      selectedDriver.value = driver
    }

    const formatStat = (stat: any) => {
      switch (stat.format) {
        case 'currency':
          return `$${formatNumber(stat.value)}`
        case 'percentage':
          return `${stat.value}%`
        case 'rating':
          return `${stat.value}★`
        default:
          return formatNumber(stat.value)
      }
    }

    const formatNumber = (value: number) => {
      return new Intl.NumberFormat().format(value)
    }

    // Code examples
    const basicExample = `<driver-performance
  driver-id="123"
/>`

    const comparisonExample = `<!-- Driver List -->
<v-list v-model="selectedDriver">
  <v-list-item
    v-for="driver in drivers"
    :key="driver.id"
    :value="driver"
  >
    <!-- Driver details -->
  </v-list-item>
</v-list>

<!-- Performance View -->
<driver-performance
  v-if="selectedDriver"
  :driver-id="selectedDriver.id"
/>`

    const dashboardExample = `<!-- Fleet Stats -->
<v-row>
  <v-col v-for="stat in fleetStats">
    <div class="text-h4">{{ formatStat(stat) }}</div>
    <div class="text-subtitle-2">{{ stat.name }}</div>
  </v-col>
</v-row>

<!-- Top Performers -->
<v-list>
  <v-list-item v-for="driver in topPerformers">
    <!-- Driver performance details -->
  </v-list-item>
</v-list>

<!-- Distribution Chart -->
<v-chart :option="distributionChartOptions" />`

    return {
      drivers,
      selectedDriver,
      fleetStats,
      topPerformers,
      distributionChartOptions,
      selectDriver,
      formatStat,
      formatNumber,
      basicExample,
      comparisonExample,
      dashboardExample
    }
  }
}
</script>

<style scoped>
.driver-performance-examples {
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