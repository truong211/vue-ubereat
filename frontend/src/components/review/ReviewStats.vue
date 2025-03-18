<template>
  <div class="review-stats">
    <v-row>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-text>
            <div class="d-flex flex-column align-center mb-4">
              <div class="text-h2 font-weight-bold">{{ stats.average }}</div>
              <v-rating
                :model-value="parseFloat(stats.average)"
                color="amber"
                half-increments
                readonly
                size="large"
              ></v-rating>
              <div class="text-subtitle-1">Based on {{ stats.total }} reviews</div>
            </div>

            <div class="rating-distribution">
              <div v-for="n in 5" :key="n" class="d-flex align-center mb-2">
                <div class="text-body-2 mr-4" style="width: 20px">{{ 6-n }}</div>
                <v-progress-linear
                  :model-value="getRatingPercentage(6-n)"
                  color="amber"
                  height="8"
                  class="flex-grow-1 mr-4"
                  rounded
                ></v-progress-linear>
                <div class="text-body-2" style="width: 40px">{{ getRatingCount(6-n) }}</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-4">
              <div class="text-h6">Review Trends</div>
              <v-select
                v-model="trendMetric"
                :items="trendMetrics"
                density="compact"
                hide-details
              ></v-select>
            </div>

            <v-chart class="trend-chart" :option="chartOptions" autoresize />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12">
        <v-card>
          <v-card-title>Rating Summary</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <div class="metric-card pa-4 rounded">
                  <div class="text-overline">Overall Rating</div>
                  <div class="d-flex align-center">
                    <span class="text-h4 mr-2">{{ stats.average }}</span>
                    <v-rating
                      :model-value="parseFloat(stats.average)"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="x-small"
                    ></v-rating>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <div class="metric-card pa-4 rounded">
                  <div class="text-overline">Food Quality</div>
                  <div class="d-flex align-center">
                    <span class="text-h4 mr-2">{{ metrics.foodQuality }}</span>
                    <v-rating
                      :model-value="metrics.foodQuality"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="x-small"
                    ></v-rating>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <div class="metric-card pa-4 rounded">
                  <div class="text-overline">Service</div>
                  <div class="d-flex align-center">
                    <span class="text-h4 mr-2">{{ metrics.service }}</span>
                    <v-rating
                      :model-value="metrics.service"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="x-small"
                    ></v-rating>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="6" md="3">
                <div class="metric-card pa-4 rounded">
                  <div class="text-overline">Value</div>
                  <div class="d-flex align-center">
                    <span class="text-h4 mr-2">{{ metrics.value }}</span>
                    <v-rating
                      :model-value="metrics.value"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="x-small"
                    ></v-rating>
                  </div>
                </div>
              </v-col>
            </v-row>

            <v-row class="mt-4">
              <v-col cols="12" sm="6" md="4">
                <div class="satisfaction-metric">
                  <div class="text-subtitle-2 mb-2">Would Recommend</div>
                  <v-progress-linear
                    :model-value="metrics.recommendationRate"
                    color="success"
                    height="20"
                    rounded
                  >
                    <template v-slot:default="{ value }">
                      <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                  </v-progress-linear>
                </div>
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <div class="satisfaction-metric">
                  <div class="text-subtitle-2 mb-2">Return Rate</div>
                  <v-progress-linear
                    :model-value="metrics.returnRate"
                    color="info"
                    height="20"
                    rounded
                  >
                    <template v-slot:default="{ value }">
                      <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                  </v-progress-linear>
                </div>
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <div class="satisfaction-metric">
                  <div class="text-subtitle-2 mb-2">Order Satisfaction</div>
                  <v-progress-linear
                    :model-value="metrics.orderSatisfaction"
                    color="primary"
                    height="20"
                    rounded
                  >
                    <template v-slot:default="{ value }">
                      <strong>{{ Math.ceil(value) }}%</strong>
                    </template>
                  </v-progress-linear>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components';
import VChart from 'vue-echarts';
import { format, parseISO } from 'date-fns';

// Register ECharts components
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
]);

export default {
  name: 'ReviewStats',

  components: {
    VChart
  },

  props: {
    stats: {
      type: Object,
      required: true,
      default: () => ({
        average: 0,
        total: 0,
        distribution: []
      })
    },
    metrics: {
      type: Object,
      default: () => ({
        foodQuality: 0,
        service: 0,
        value: 0,
        recommendationRate: 0,
        returnRate: 0,
        orderSatisfaction: 0
      })
    },
    monthlyStats: {
      type: Array,
      default: () => []
    }
  },

  data() {
    return {
      trendMetric: 'rating',
      trendMetrics: [
        { title: 'Average Rating', value: 'rating' },
        { title: 'Number of Reviews', value: 'count' }
      ]
    };
  },

  computed: {
    chartOptions() {
      const dates = this.monthlyStats.map(stat => 
        format(parseISO(stat.date), 'MMM yyyy')
      );

      const series = [{
        name: this.trendMetric === 'rating' ? 'Average Rating' : 'Number of Reviews',
        type: 'line',
        data: this.monthlyStats.map(stat => 
          this.trendMetric === 'rating' ? stat.averageRating : stat.count
        ),
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3
        }
      }];

      return {
        tooltip: {
          trigger: 'axis',
          formatter: (params) => {
            const [param] = params;
            if (this.trendMetric === 'rating') {
              return `${param.name}<br/>${param.seriesName}: ${param.value.toFixed(1)}`;
            }
            return `${param.name}<br/>${param.seriesName}: ${param.value}`;
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
          data: dates,
          boundaryGap: false
        },
        yAxis: {
          type: 'value',
          min: this.trendMetric === 'rating' ? 0 : undefined,
          max: this.trendMetric === 'rating' ? 5 : undefined,
          interval: this.trendMetric === 'rating' ? 1 : undefined
        },
        series
      };
    }
  },

  methods: {
    getRatingCount(rating) {
      const found = this.stats.distribution.find(d => d.rating === rating);
      return found ? found.count : 0;
    },

    getRatingPercentage(rating) {
      if (this.stats.total === 0) return 0;
      return (this.getRatingCount(rating) / this.stats.total) * 100;
    }
  }
};
</script>

<style scoped>
.review-stats {
  max-width: 1200px;
  margin: 0 auto;
}

.trend-chart {
  height: 300px;
}

.metric-card {
  background-color: var(--v-surface-variant);
}

.satisfaction-metric {
  background-color: var(--v-surface-variant);
  padding: 16px;
  border-radius: 8px;
}
</style>