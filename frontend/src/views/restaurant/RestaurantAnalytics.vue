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
                  <v-btn value="day">Ngày</v-btn>
                  <v-btn value="week">Tuần</v-btn>
                  <v-btn value="month">Tháng</v-btn>
                  <v-btn value="year">Năm</v-btn>
                </v-btn-toggle>
              </v-col>
              
              <v-col cols="12" sm="auto">
                <v-btn
                  prepend-icon="mdi-calendar"
                  @click="showDatePicker = true"
                >
                  Tùy chỉnh
                </v-btn>
              </v-col>
              
              <v-col cols="12" sm="auto">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-file-download"
                  @click="downloadReport"
                >
                  Xuất báo cáo
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        
        <!-- Revenue Report Section -->
        <v-card class="mb-6">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Báo Cáo Doanh Thu</span>
            <v-select
              v-model="revenueGrouping"
              :items="[
                {text: 'Theo ngày', value: 'day'}, 
                {text: 'Theo tuần', value: 'week'}, 
                {text: 'Theo tháng', value: 'month'}
              ]"
              density="compact"
              style="max-width: 150px"
              hide-details
            ></v-select>
          </v-card-title>
          
          <v-card-text>
            <v-row>
              <!-- Revenue Summary Cards -->
              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="text-overline">Tổng doanh thu</div>
                    <div class="text-h4 mb-1">{{ formatCurrency(revenueData.total) }}</div>
                    <div :class="['text-caption', revenueData.growth >= 0 ? 'text-success' : 'text-error']">
                      <v-icon size="small">{{ revenueData.growth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
                      {{ Math.abs(revenueData.growth) }}% so với kỳ trước
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="text-overline">Số đơn hàng</div>
                    <div class="text-h4 mb-1">{{ revenueData.orderCount }}</div>
                    <div :class="['text-caption', revenueData.orderGrowth >= 0 ? 'text-success' : 'text-error']">
                      <v-icon size="small">{{ revenueData.orderGrowth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
                      {{ Math.abs(revenueData.orderGrowth) }}% so với kỳ trước
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <v-col cols="12" md="4">
                <v-card variant="outlined">
                  <v-card-text>
                    <div class="text-overline">Giá trị trung bình</div>
                    <div class="text-h4 mb-1">{{ formatCurrency(revenueData.avgOrder) }}</div>
                    <div :class="['text-caption', revenueData.avgOrderGrowth >= 0 ? 'text-success' : 'text-error']">
                      <v-icon size="small">{{ revenueData.avgOrderGrowth >= 0 ? 'mdi-arrow-up' : 'mdi-arrow-down' }}</v-icon>
                      {{ Math.abs(revenueData.avgOrderGrowth) }}% so với kỳ trước
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
              
              <!-- Revenue Chart -->
              <v-col cols="12">
                <v-chart class="chart" :option="revenueChartOption" autoresize />
              </v-col>
              
              <!-- Revenue Breakdown Table -->
              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">Chi tiết doanh thu</div>
                <v-data-table
                  :headers="revenueTableHeaders"
                  :items="revenueTableData"
                  :items-per-page="5"
                  density="comfortable"
                >
                  <template v-slot:item.period="{ item }">
                    <span>{{ item.period }}</span>
                  </template>
                  <template v-slot:item.revenue="{ item }">
                    <span>{{ formatCurrency(item.revenue) }}</span>
                  </template>
                  <template v-slot:item.orderCount="{ item }">
                    <span>{{ item.orderCount }}</span>
                  </template>
                  <template v-slot:item.avgOrderValue="{ item }">
                    <span>{{ formatCurrency(item.avgOrderValue) }}</span>
                  </template>
                  <template v-slot:item.growth="{ item }">
                    <span :class="item.growth >= 0 ? 'text-success' : 'text-error'">
                      {{ item.growth >= 0 ? '+' : '' }}{{ item.growth }}%
                    </span>
                  </template>
                </v-data-table>
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
import { subDays, format, parseISO, startOfDay, startOfWeek, startOfMonth } from 'date-fns';
import { vi } from 'date-fns/locale';
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
    const revenueGrouping = ref('day');
    
    // Revenue data
    const revenueData = ref({
      total: 85400000,
      growth: 12.5,
      orderCount: 256,
      orderGrowth: 8.2,
      avgOrder: 333594,
      avgOrderGrowth: 4.3
    });
    
    // Revenue table
    const revenueTableHeaders = [
      { title: 'Kỳ', key: 'period' },
      { title: 'Doanh thu', key: 'revenue' },
      { title: 'Số đơn', key: 'orderCount' },
      { title: 'Trung bình/đơn', key: 'avgOrderValue' },
      { title: 'Tăng trưởng', key: 'growth' }
    ];
    
    const revenueTableData = ref([]);
    
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
    
    // Revenue chart option
    const revenueChartOption = computed(() => {
      // Different x-axis labels based on the grouping
      let xAxisData = [];
      
      switch(revenueGrouping.value) {
        case 'day':
          xAxisData = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
          break;
        case 'week':
          xAxisData = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
          break;
        case 'month':
          xAxisData = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
          break;
      }
      
      // Generate some sample data
      const generateSampleData = (base, variance) => {
        return xAxisData.map(() => base + Math.floor(Math.random() * variance));
      };
      
      return {
        tooltip: {
          trigger: 'axis',
          formatter: function(params) {
            const revenue = params[0].value;
            const formattedRevenue = new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND'
            }).format(revenue);
            return `${params[0].name}: ${formattedRevenue}`;
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: xAxisData
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: function(value) {
              if (value >= 1000000) {
                return (value / 1000000).toFixed(1) + 'M';
              } else {
                return (value / 1000).toFixed(0) + 'K';
              }
            }
          }
        },
        series: [
          {
            name: 'Doanh thu',
            type: 'bar',
            data: generateSampleData(5000000, 7000000),
            itemStyle: {
              color: '#4CAF50'
            },
            emphasis: {
              itemStyle: {
                color: '#2E7D32'
              }
            }
          }
        ]
      };
    });

    // Methods
    const loadAnalytics = async () => {
      isLoading.value = true;
      try {
        const response = await store.dispatch('restaurant/getAnalytics', {
          restaurantId: props.restaurantId,
          startDate: startDate.value,
          endDate: endDate.value
        });
        metrics.value = { ...metrics.value, ...response };
        
        // Update revenue table data based on the current grouping
        updateRevenueTableData();
      } catch (error) {
        console.error('Failed to load analytics:', error);
      } finally {
        isLoading.value = false;
      }
    };
    
    // Format currency in VND
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };
    
    // Generate sample data for the revenue table
    const updateRevenueTableData = () => {
      const result = [];
      let periods;
      
      switch(revenueGrouping.value) {
        case 'day':
          periods = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
          break;
        case 'week':
          periods = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
          break;
        case 'month':
          periods = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6'];
          break;
      }
      
      periods.forEach(period => {
        const revenue = Math.floor(Math.random() * 50000000) + 5000000;
        const orderCount = Math.floor(Math.random() * 100) + 10;
        result.push({
          period,
          revenue,
          orderCount,
          avgOrderValue: Math.floor(revenue / orderCount),
          growth: Math.floor(Math.random() * 30) - 10 // Range from -10% to +20%
        });
      });
      
      revenueTableData.value = result;
    };
    
    // Download the current report
    const downloadReport = () => {
      // This would be implemented to generate a report in PDF or Excel format
      alert(`Báo cáo ${revenueGrouping.value === 'day' ? 'theo ngày' : 
           revenueGrouping.value === 'week' ? 'theo tuần' : 'theo tháng'} sẽ được tải xuống`);
    };

    // Watch for date changes
    watch([timeRange, dateRange, revenueGrouping], () => {
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
      salesChartOption,
      revenueGrouping,
      revenueData,
      revenueChartOption,
      revenueTableHeaders,
      revenueTableData,
      formatCurrency,
      downloadReport
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