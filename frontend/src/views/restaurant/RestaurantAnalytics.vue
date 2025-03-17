<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Restaurant Analytics</h1>
        
        <!-- Time Range Selection -->
        <v-card class="mb-4">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" sm="auto">
                <v-btn-toggle
                  v-model="timeRange"
                  mandatory
                  rounded="pill"
                  color="primary"
                >
                  <v-btn value="day">Day</v-btn>
                  <v-btn value="week">Week</v-btn>
                  <v-btn value="month">Month</v-btn>
                  <v-btn value="year">Year</v-btn>
                </v-btn-toggle>
              </v-col>
              
              <v-col cols="12" sm="auto">
                <v-btn
                  prepend-icon="mdi-calendar"
                  @click="showDatePicker = true"
                >
                  Custom Range
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        
        <!-- Performance Metrics -->
        <v-row class="mb-6">
          <!-- Revenue Metrics -->
          <v-col cols="12" md="4">
            <v-card>
              <v-card-text>
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-1">Revenue</span>
                  <span class="text-h5">${{ metrics.revenue.toFixed(2) }}</span>
                </div>
                <v-progress-linear
                  :model-value="metrics.revenueTrend"
                  color="success"
                  height="4"
                ></v-progress-linear>
                <div class="text-caption mt-1">
                  {{ metrics.revenueTrend }}% growth
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Customer Metrics -->
          <v-col cols="12" md="4">
            <v-card>
              <v-card-text>
                <div class="text-subtitle-1 mb-2">Customer Overview</div>
                <v-row>
                  <v-col cols="6">
                    <div class="text-caption">New Customers</div>
                    <div class="text-h6">{{ metrics.newCustomers }}</div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-caption">Returning</div>
                    <div class="text-h6">{{ metrics.returningCustomers }}</div>
                  </v-col>
                </v-row>
                <div class="text-caption mt-2">
                  Avg. Customer LTV: ${{ metrics.customerLtv.toFixed(2) }}
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          
          <!-- Operational Metrics -->
          <v-col cols="12" md="4">
            <v-card>
              <v-card-text>
                <div class="text-subtitle-1 mb-2">Operations</div>
                <v-row>
                  <v-col cols="6">
                    <div class="text-caption">Prep Time</div>
                    <div class="d-flex align-center">
                      <div class="text-h6 mr-2">{{ metrics.avgPrepTime }}m</div>
                      <v-chip
                        size="x-small"
                        :color="metrics.avgPrepTime <= metrics.targetPrepTime ? 'success' : 'warning'"
                      >
                        Target: {{ metrics.targetPrepTime }}m
                      </v-chip>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="text-caption">Delivery Time</div>
                    <div class="d-flex align-center">
                      <div class="text-h6 mr-2">{{ metrics.avgDeliveryTime }}m</div>
                      <v-chip
                        size="x-small"
                        :color="metrics.avgDeliveryTime <= metrics.targetDeliveryTime ? 'success' : 'warning'"
                      >
                        Target: {{ metrics.targetDeliveryTime }}m
                      </v-chip>
                    </div>
                  </v-col>
                </v-row>
                <div class="text-caption mt-2">
                  Order Accuracy: {{ metrics.orderAccuracy }}%
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        
        <!-- Charts -->
        <v-row>
          <v-col cols="12" lg="8">
            <v-card>
              <v-card-title class="d-flex align-center">
                Sales Analytics
                <v-spacer></v-spacer>
                <v-select
                  v-model="salesMetric"
                  :items="[{text: 'Revenue', value: 'revenue'}, {text: 'Orders', value: 'orders'}]"
                  density="compact"
                  hide-details
                ></v-select>
              </v-card-title>
              <v-card-text>
                <v-chart class="chart" :option="salesChartOption" autoresize />
              </v-card-text>
            </v-card>
          </v-col>
          
          <v-col cols="12" lg="4">
            <v-card>
              <v-card-title>Real-time Status</v-card-title>
              <v-card-text>
                <div class="d-flex flex-column gap-4">
                  <!-- Active Orders -->
                  <div>
                    <div class="text-subtitle-2 mb-1">Active Orders</div>
                    <div class="d-flex align-center">
                      <v-progress-circular
                        :model-value="(metrics.activeOrders / 20) * 100"
                        :color="metrics.status === 'busy' ? 'warning' : 'success'"
                        size="64"
                      >
                        {{ metrics.activeOrders }}
                      </v-progress-circular>
                      <div class="ml-4">
                        <div class="text-caption">Current Status</div>
                        <v-chip
                          :color="metrics.status === 'busy' ? 'warning' : 'success'"
                          size="small"
                        >
                          {{ metrics.status === 'busy' ? 'High Volume' : 'Normal' }}
                        </v-chip>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Queue Time -->
                  <div>
                    <div class="text-subtitle-2 mb-1">Average Queue Time</div>
                    <div class="text-h6">{{ metrics.queueTime }} minutes</div>
                  </div>
                  
                  <!-- Staff Utilization -->
                  <div>
                    <div class="text-subtitle-2 mb-1">Staff Utilization</div>
                    <v-progress-linear
                      :model-value="metrics.staffUtilization"
                      color="primary"
                      height="8"
                      rounded
                    ></v-progress-linear>
                    <div class="text-caption mt-1">
                      {{ metrics.staffUtilization }}% of capacity
                    </div>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    
    <!-- Date Range Picker Dialog -->
    <v-dialog v-model="showDatePicker" max-width="300">
      <v-card>
        <v-card-title>Select Date Range</v-card-title>
        <v-card-text>
          <v-date-picker
            v-model="dateRange"
            range
            :max="new Date().toISOString().substr(0, 10)"
          ></v-date-picker>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="showDatePicker = false"
          >
            Apply
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { subDays } from 'date-fns';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import {
  LineChart,
  BarChart,
  PieChart
} from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent
]);

export default {
  name: 'RestaurantAnalytics',

  components: {
    VChart
  },

  props: {
    restaurantId: {
      type: String,
      required: true
    },
    
    refreshInterval: {
      type: Number,
      default: 300 // 5 minutes
    }
  },

  setup(props) {
    const store = useStore();
    
    // State
    const timeRange = ref('week');
    const salesMetric = ref('revenue');
    const showDatePicker = ref(false);
    const dateRange = ref([]);
    const startDate = ref(subDays(new Date(), 7));
    const endDate = ref(new Date());
    const isLoading = ref(false);
    const metrics = ref({
      revenue: 0,
      revenueTrend: 0,
      orders: 0,
      ordersTrend: 0,
      averageOrder: 0,
      avgOrderTrend: 0,
      satisfaction: 0,
      reviewCount: 0,
      newCustomers: 0,
      returningCustomers: 0,
      customerLtv: 0,
      avgPrepTime: 0,
      targetPrepTime: 20,
      avgDeliveryTime: 0,
      targetDeliveryTime: 30,
      orderAccuracy: 0,
      status: 'normal',
      activeOrders: 0,
      queueTime: 0,
      staffUtilization: 0
    });

    // Chart options
    const salesChartOption = computed(() => ({
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
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      yAxis: {
        type: 'value'
      },
      series: [
        {
          name: salesMetric.value === 'revenue' ? 'Revenue' : 'Orders',
          type: 'line',
          smooth: true,
          data: [820, 932, 901, 934, 1290, 1330, 1320]
        }
      ]
    }));

    // Load data
    const loadAnalytics = async () => {
      isLoading.value = true;
      try {
        const response = await store.dispatch('restaurant/getAnalytics', {
          restaurantId: props.restaurantId,
          startDate: startDate.value,
          endDate: endDate.value
        });
        metrics.value = { ...metrics.value, ...response };
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        isLoading.value = false;
      }
    };

    // Watch for date changes
    watch([timeRange, dateRange], () => {
      loadAnalytics();
    });

    // Initial load
    onMounted(() => {
      loadAnalytics();
      
      // Set up refresh interval
      const intervalId = setInterval(loadAnalytics, props.refreshInterval * 1000);
      
      // Clean up on component destroy
      onUnmounted(() => {
        clearInterval(intervalId);
      });
    });

    return {
      timeRange,
      salesMetric,
      showDatePicker,
      dateRange,
      metrics,
      isLoading,
      salesChartOption
    };
  }
};
</script>

<style scoped>
.chart {
  height: 400px;
}

.v-card {
  transition: transform 0.2s;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>