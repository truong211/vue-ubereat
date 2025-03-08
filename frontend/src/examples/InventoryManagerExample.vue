<template>
  <div class="inventory-examples">
    <h2 class="text-h5 mb-4">Inventory Management Examples</h2>

    <!-- Example 1: Basic Inventory Management -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Inventory Management</h3>
      <v-card>
        <v-card-text>
          <inventory-manager
            restaurant-id="123"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Multi-Location Inventory -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Multi-Location Inventory</h3>
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
                      {{ location.itemCount }} items
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-card>
            </v-col>

            <!-- Location Inventory -->
            <v-col cols="12" md="9">
              <div v-if="selectedLocation">
                <inventory-manager
                  :restaurant-id="selectedLocation.id"
                  @inventory-updated="handleInventoryUpdate"
                />
              </div>
              <div v-else class="text-center py-8">
                <v-icon size="64" color="grey-lighten-1">mdi-store</v-icon>
                <div class="text-h6 mt-4">Select a Location</div>
                <div class="text-body-1 text-medium-emphasis">
                  Choose a location to manage its inventory
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

    <!-- Example 3: Inventory Analytics -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Inventory Analytics</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Analytics Dashboard -->
            <v-col cols="12" md="8">
              <inventory-manager
                restaurant-id="123"
                @inventory-updated="handleAnalytics"
              />
            </v-col>

            <!-- Analytics Panel -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title>Insights</v-card-title>
                
                <!-- Value Distribution -->
                <v-card-text>
                  <div class="text-subtitle-1 mb-2">Inventory Value Distribution</div>
                  <v-chart
                    :option="pieChartOptions"
                    autoresize
                    style="width: 100%; height: 200px;"
                  />
                </v-card-text>

                <v-divider></v-divider>

                <!-- Key Metrics -->
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-currency-usd</v-icon>
                    </template>
                    <v-list-item-title>Total Value</v-list-item-title>
                    <v-list-item-subtitle>
                      ${{ formatNumber(analytics.totalValue) }}
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="warning">mdi-chart-line</v-icon>
                    </template>
                    <v-list-item-title>Monthly Turnover</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ analytics.turnoverRate.toFixed(2) }}x
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="error">mdi-chart-timeline-variant</v-icon>
                    </template>
                    <v-list-item-title>Stockout Rate</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ (analytics.stockoutRate * 100).toFixed(1) }}%
                    </v-list-item-subtitle>
                  </v-list-item>

                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="success">mdi-chart-bell-curve</v-icon>
                    </template>
                    <v-list-item-title>Fill Rate</v-list-item-title>
                    <v-list-item-subtitle>
                      {{ (analytics.fillRate * 100).toFixed(1) }}%
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>

                <v-divider></v-divider>

                <!-- Recommendations -->
                <v-card-text>
                  <div class="text-subtitle-1 mb-2">Recommendations</div>
                  <v-list>
                    <v-list-item
                      v-for="(rec, index) in analytics.recommendations"
                      :key="index"
                      :value="rec"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="rec.priority">
                          {{ getRecommendationIcon(rec.type) }}
                        </v-icon>
                      </template>
                      <v-list-item-title>{{ rec.title }}</v-list-item-title>
                      <v-list-item-subtitle>{{ rec.description }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
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

<script>
import { ref, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import InventoryManager from '@/components/restaurant/InventoryManager.vue'

// Register ECharts components
use([
  CanvasRenderer,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent
])

export default {
  name: 'InventoryManagerExample',
  
  components: {
    InventoryManager,
    VChart
  },
  
  setup() {
    // State
    const selectedLocation = ref(null)
    const analytics = ref({
      totalValue: 125000,
      turnoverRate: 2.5,
      stockoutRate: 0.03,
      fillRate: 0.97,
      valueDistribution: [
        { value: 45000, name: 'Fresh Ingredients' },
        { value: 35000, name: 'Packaged Goods' },
        { value: 25000, name: 'Beverages' },
        { value: 20000, name: 'Supplies' }
      ],
      recommendations: [
        {
          type: 'reorder',
          priority: 'error',
          title: 'Critical Reorder Required',
          description: '5 items below safety stock level'
        },
        {
          type: 'optimize',
          priority: 'warning',
          title: 'Optimize Order Quantities',
          description: 'High holding costs for beverages'
        },
        {
          type: 'supplier',
          priority: 'success',
          title: 'Supplier Opportunity',
          description: 'Bulk discount available for fresh ingredients'
        }
      ]
    })
    
    // Mock data
    const locations = ref([
      {
        id: '123',
        name: 'Main Kitchen',
        itemCount: 156
      },
      {
        id: '124',
        name: 'Bar Storage',
        itemCount: 89
      },
      {
        id: '125',
        name: 'Dry Storage',
        itemCount: 234
      }
    ])
    
    // Chart options
    const pieChartOptions = computed(() => ({
      tooltip: {
        trigger: 'item',
        formatter: '{b}: ${c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 10,
        data: analytics.value.valueDistribution.map(item => item.name)
      },
      series: [
        {
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              formatter: '{b}\n${c}\n{d}%'
            }
          },
          data: analytics.value.valueDistribution
        }
      ]
    }))
    
    // Methods
    const selectLocation = (location) => {
      selectedLocation.value = location
    }
    
    const handleInventoryUpdate = (data) => {
      console.log('Inventory updated:', data)
    }
    
    const handleAnalytics = (data) => {
      console.log('Analytics updated:', data)
    }
    
    const formatNumber = (value) => {
      return new Intl.NumberFormat().format(value)
    }
    
    const getRecommendationIcon = (type) => {
      const icons = {
        reorder: 'mdi-truck',
        optimize: 'mdi-chart-bell-curve',
        supplier: 'mdi-handshake'
      }
      return icons[type] || 'mdi-information'
    }
    
    // Code examples
    const basicExample = computed(() => {
      return `<inventory-manager
  restaurant-id="123"
/>`
    })
    
    const multiLocationExample = computed(() => {
      return `<div v-if="selectedLocation">
  <inventory-manager
    :restaurant-id="selectedLocation.id"
    @inventory-updated="handleInventoryUpdate"
  />
</div>`
    })
    
    const analyticsExample = computed(() => {
      return `<inventory-manager
  restaurant-id="123"
  @inventory-updated="handleAnalytics"
/>`
    })
    
    return {
      selectedLocation,
      locations,
      analytics,
      pieChartOptions,
      selectLocation,
      handleInventoryUpdate,
      handleAnalytics,
      formatNumber,
      getRecommendationIcon,
      basicExample,
      multiLocationExample,
      analyticsExample
    }
  }
}
</script>

<style scoped>
.inventory-examples {
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