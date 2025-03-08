<template>
  <div>
    <!-- Performance Summary -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Overall Rating</div>
            <div class="d-flex align-center">
              <div class="text-h4 mr-2">{{ metrics.rating.toFixed(1) }}</div>
              <v-rating
                :model-value="metrics.rating"
                color="amber"
                density="compact"
                half-increments
                readonly
              ></v-rating>
            </div>
            <div class="text-caption">Based on {{ metrics.totalRatings }} ratings</div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Acceptance Rate</div>
            <div class="text-h4">{{ metrics.acceptanceRate }}%</div>
            <v-progress-linear
              :model-value="metrics.acceptanceRate"
              :color="getAcceptanceRateColor"
              height="4"
              class="mt-1"
            ></v-progress-linear>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">Completion Rate</div>
            <div class="text-h4">{{ metrics.completionRate }}%</div>
            <v-progress-linear
              :model-value="metrics.completionRate"
              :color="getCompletionRateColor"
              height="4"
              class="mt-1"
            ></v-progress-linear>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card>
          <v-card-text>
            <div class="text-subtitle-1">On-Time Rate</div>
            <div class="text-h4">{{ metrics.onTimeRate }}%</div>
            <v-progress-linear
              :model-value="metrics.onTimeRate"
              :color="getOnTimeRateColor"
              height="4"
              class="mt-1"
            ></v-progress-linear>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Performance Charts -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Rating Distribution</v-card-title>
          <v-card-text>
            <v-chart class="rating-chart" :option="ratingChartOption" autoresize></v-chart>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>Delivery Times</v-card-title>
          <v-card-text>
            <v-chart class="delivery-chart" :option="deliveryChartOption" autoresize></v-chart>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Performance Trends -->
    <v-card class="mb-6">
      <v-card-title>Performance Trends</v-card-title>
      <v-card-text>
        <v-chart class="trends-chart" :option="trendsChartOption" autoresize></v-chart>
      </v-card-text>
    </v-card>

    <!-- Customer Feedback -->
    <v-card>
      <v-card-title class="d-flex align-center">
        Customer Reviews
        <v-chip class="ml-2">{{ feedback.length }}</v-chip>
        <v-spacer></v-spacer>
        <v-select
          v-model="feedbackFilter"
          :items="feedbackFilterOptions"
          density="compact"
          hide-details
          style="max-width: 200px"
        ></v-select>
      </v-card-title>

      <v-divider></v-divider>

      <v-container>
        <v-timeline density="comfortable" align="start">
          <v-timeline-item
            v-for="review in filteredFeedback"
            :key="review.id"
            :dot-color="getReviewColor(review.rating)"
            size="small"
          >
            <template v-slot:opposite>
              {{ formatDate(review.date) }}
            </template>

            <v-card>
              <v-card-text>
                <v-row no-gutters>
                  <v-col cols="12">
                    <v-rating
                      :model-value="review.rating"
                      color="amber"
                      density="compact"
                      half-increments
                      readonly
                      size="small"
                    ></v-rating>
                    <div class="text-body-2 mt-2">{{ review.comment }}</div>
                  </v-col>
                </v-row>

                <!-- Tags -->
                <div class="mt-2">
                  <v-chip
                    v-for="tag in review.tags"
                    :key="tag"
                    size="small"
                    class="mr-1"
                    color="primary"
                    variant="outlined"
                  >
                    {{ tag }}
                  </v-chip>
                </div>

                <!-- Order Details -->
                <div class="mt-2 text-caption text-medium-emphasis">
                  Order #{{ review.orderId }} • {{ review.restaurant }}
                </div>
              </v-card-text>
            </v-card>
          </v-timeline-item>
        </v-timeline>
      </v-container>

      <!-- Load More -->
      <v-card-actions class="justify-center">
        <v-btn
          v-if="hasMoreFeedback"
          variant="text"
          color="primary"
          :loading="loadingMore"
          @click="loadMoreFeedback"
        >
          Load More
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart, LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import VChart from 'vue-echarts'

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent
])

export default {
  name: 'DriverPerformance',

  components: {
    VChart
  },

  setup() {
    const store = useStore()
    const feedbackFilter = ref('all')
    const loadingMore = ref(false)

    // Options
    const feedbackFilterOptions = [
      { title: 'All Reviews', value: 'all' },
      { title: '5 Stars', value: '5' },
      { title: '4 Stars', value: '4' },
      { title: '3 Stars', value: '3' },
      { title: '2 Stars', value: '2' },
      { title: '1 Star', value: '1' }
    ]

    // Data
    const metrics = computed(() => store.state.driver.metrics)
    const feedback = computed(() => store.state.driver.feedback)

    const filteredFeedback = computed(() => {
      if (feedbackFilter.value === 'all') return feedback.value
      return feedback.value.filter(review => 
        review.rating === Number(feedbackFilter.value)
      )
    })

    const hasMoreFeedback = computed(() => 
      store.state.driver.hasMoreFeedback
    )

    // Computed Colors
    const getAcceptanceRateColor = computed(() => {
      const rate = metrics.value.acceptanceRate
      if (rate >= 90) return 'success'
      if (rate >= 70) return 'warning'
      return 'error'
    })

    const getCompletionRateColor = computed(() => {
      const rate = metrics.value.completionRate
      if (rate >= 95) return 'success'
      if (rate >= 85) return 'warning'
      return 'error'
    })

    const getOnTimeRateColor = computed(() => {
      const rate = metrics.value.onTimeRate
      if (rate >= 95) return 'success'
      if (rate >= 85) return 'warning'
      return 'error'
    })

    // Chart Options
    const ratingChartOption = computed(() => ({
      tooltip: {
        trigger: 'item'
      },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'center'
      },
      series: [
        {
          name: 'Ratings',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: '20',
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: metrics.value.ratings?.[5] || 0, name: '5 Stars' },
            { value: metrics.value.ratings?.[4] || 0, name: '4 Stars' },
            { value: metrics.value.ratings?.[3] || 0, name: '3 Stars' },
            { value: metrics.value.ratings?.[2] || 0, name: '2 Stars' },
            { value: metrics.value.ratings?.[1] || 0, name: '1 Star' }
          ]
        }
      ]
    }))

    const deliveryChartOption = computed(() => ({
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
        data: metrics.value.deliveryTimes?.labels || []
      },
      yAxis: {
        type: 'value',
        name: 'Deliveries'
      },
      series: [
        {
          name: 'Delivery Time Distribution',
          type: 'bar',
          data: metrics.value.deliveryTimes?.data || []
        }
      ]
    }))

    const trendsChartOption = computed(() => ({
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['Rating', 'Acceptance Rate', 'On-Time Rate']
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: metrics.value.trends?.dates || []
      },
      yAxis: {
        type: 'value',
        max: 100
      },
      series: [
        {
          name: 'Rating',
          type: 'line',
          data: metrics.value.trends?.ratings || []
        },
        {
          name: 'Acceptance Rate',
          type: 'line',
          data: metrics.value.trends?.acceptanceRates || []
        },
        {
          name: 'On-Time Rate',
          type: 'line',
          data: metrics.value.trends?.onTimeRates || []
        }
      ]
    }))

    // Methods
    const loadMoreFeedback = async () => {
      loadingMore.value = true
      try {
        await store.dispatch('driver/loadMoreFeedback')
      } finally {
        loadingMore.value = false
      }
    }

    const getReviewColor = (rating) => {
      if (rating >= 4.5) return 'success'
      if (rating >= 3.5) return 'primary'
      if (rating >= 2.5) return 'warning'
      return 'error'
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    // Lifecycle
    onMounted(async () => {
      await Promise.all([
        store.dispatch('driver/fetchMetrics'),
        store.dispatch('driver/fetchFeedback')
      ])
    })

    return {
      feedbackFilter,
      feedbackFilterOptions,
      metrics,
      feedback,
      filteredFeedback,
      hasMoreFeedback,
      loadingMore,
      getAcceptanceRateColor,
      getCompletionRateColor,
      getOnTimeRateColor,
      ratingChartOption,
      deliveryChartOption,
      trendsChartOption,
      loadMoreFeedback,
      getReviewColor,
      formatDate
    }
  }
}
</script>

<style scoped>
.rating-chart,
.delivery-chart,
.trends-chart {
  height: 300px;
}

.v-timeline {
  max-height: 600px;
  overflow-y: auto;
}

.v-card {
  border-radius: 12px;
}
</style>
