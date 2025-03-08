<template>
  <div class="earnings">
    <!-- Period Selection -->
    <v-card class="mb-6">
      <v-card-text>
        <div class="d-flex flex-wrap align-center justify-space-between gap-4">
          <div class="d-flex align-center">
            <v-btn-group>
              <v-btn
                v-for="period in periods"
                :key="period.value"
                :color="selectedPeriod === period.value ? 'primary' : undefined"
                variant="tonal"
                @click="handlePeriodChange(period.value)"
              >
                {{ period.label }}
              </v-btn>
            </v-btn-group>

            <v-btn
              :icon="customRange ? 'mdi-check' : 'mdi-calendar'"
              variant="text"
              class="ms-4"
              @click="showDatePicker = !showDatePicker"
            ></v-btn>
          </div>

          <div class="flex-grow-1 text-right">
            <v-btn
              prepend-icon="mdi-download"
              variant="outlined"
              :loading="downloading"
              @click="downloadReport"
            >
              Download Report
            </v-btn>
          </div>
        </div>

        <!-- Date Range Picker -->
        <v-expand-transition>
          <div v-if="showDatePicker" class="mt-4">
            <v-row>
              <v-col cols="12" sm="6" md="4">
                <v-date-picker
                  v-model="dateRange"
                  range
                  :max="maxDate"
                  elevation="0"
                  color="primary"
                ></v-date-picker>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center my-12">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
      ></v-progress-circular>
    </div>

    <template v-else>
      <!-- Key Metrics -->
      <div class="metrics-grid mb-6">
        <v-card
          v-for="metric in keyMetrics"
          :key="metric.label"
          :color="metric.color"
          theme="dark"
        >
          <v-card-text>
            <div class="text-overline">{{ metric.label }}</div>
            <div class="text-h4">{{ metric.value }}</div>
            <div
              v-if="metric.trend"
              class="d-flex align-center mt-2"
              :class="getTrendClass(metric.trend)"
            >
              <v-icon
                :icon="getTrendIcon(metric.trend)"
                size="small"
                class="me-1"
              ></v-icon>
              {{ formatPercentage(Math.abs(metric.trend)) }}
              vs last period
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Earnings Chart -->
      <EarningsChart
        :data="chartData"
        :stats="earningsStats"
        :loading="loading"
        :error="error"
        :selected-period="selectedPeriod"
        class="mb-6"
        @period-change="handlePeriodChange"
        @retry="fetchData"
      />

      <!-- Additional Analytics -->
      <v-row>
        <v-col cols="12" md="6">
          <!-- Peak Hours -->
          <v-card class="mb-6">
            <v-card-title>Peak Hours</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="hour in peakHours"
                  :key="hour.hour"
                >
                  <template v-slot:prepend>
                    <v-icon
                      :icon="getHourIcon(hour.hour)"
                      :color="getHourColor(hour.earnings)"
                    ></v-icon>
                  </template>
                  <v-list-item-title>
                    {{ formatHourRange(hour.hour) }}
                  </v-list-item-title>
                  <template v-slot:append>
                    <div class="text-right">
                      <div class="text-body-1">{{ formatCurrency(hour.earnings) }}</div>
                      <div class="text-caption">{{ hour.deliveries }} deliveries</div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Popular Areas -->
          <v-card>
            <v-card-title>Popular Areas</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="area in popularAreas"
                  :key="area.name"
                >
                  <template v-slot:prepend>
                    <v-icon icon="mdi-map-marker"></v-icon>
                  </template>
                  <v-list-item-title>{{ area.name }}</v-list-item-title>
                  <template v-slot:append>
                    <div class="text-right">
                      <div class="text-body-1">{{ formatCurrency(area.earnings) }}</div>
                      <div class="text-caption">{{ area.deliveries }} deliveries</div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <!-- Earnings Breakdown -->
          <v-card class="mb-6">
            <v-card-title>Earnings Breakdown</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" icon="mdi-bike"></v-icon>
                  </template>
                  <v-list-item-title>Base Earnings</v-list-item-title>
                  <template v-slot:append>
                    {{ formatCurrency(breakdown.base) }}
                  </template>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="success" icon="mdi-cash"></v-icon>
                  </template>
                  <v-list-item-title>Tips</v-list-item-title>
                  <template v-slot:append>
                    {{ formatCurrency(breakdown.tips) }}
                  </template>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="warning" icon="mdi-star"></v-icon>
                  </template>
                  <v-list-item-title>Bonuses</v-list-item-title>
                  <template v-slot:append>
                    {{ formatCurrency(breakdown.bonus) }}
                  </template>
                </v-list-item>

                <v-divider class="my-2"></v-divider>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-icon color="primary" icon="mdi-cash-multiple"></v-icon>
                  </template>
                  <v-list-item-title class="text-h6">Total</v-list-item-title>
                  <template v-slot:append>
                    <span class="text-h6">{{ formatCurrency(breakdown.total) }}</span>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Projections -->
          <v-card>
            <v-card-title>Earnings Projections</v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item
                  v-for="(amount, period) in projections"
                  :key="period"
                >
                  <v-list-item-title>{{ formatProjectionPeriod(period) }}</v-list-item-title>
                  <template v-slot:append>
                    {{ formatCurrency(amount) }}
                  </template>
                </v-list-item>
              </v-list>

              <v-alert
                v-if="projections.trend > 0"
                color="success"
                variant="tonal"
                class="mt-4"
              >
                Your earnings are trending up by {{ formatPercentage(projections.trend) }}
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import EarningsChart from '@/components/driver/analytics/EarningsChart.vue'
import analyticsService from '@/services/analytics'

export default {
  name: 'DriverEarnings',

  components: {
    EarningsChart
  },

  setup() {
    const store = useStore()
    const loading = ref(false)
    const error = ref(null)
    const downloading = ref(false)
    const selectedPeriod = ref('week')
    const showDatePicker = ref(false)
    const dateRange = ref([])
    const customRange = ref(false)

    // Data
    const chartData = ref([])
    const breakdown = ref({
      base: 0,
      tips: 0,
      bonus: 0,
      total: 0
    })
    const peakHours = ref([])
    const popularAreas = ref([])
    const projections = ref({
      daily: 0,
      weekly: 0,
      monthly: 0,
      yearly: 0,
      trend: 0
    })

    // Computed
    const maxDate = computed(() => new Date().toISOString().split('T')[0])

    const periods = [
      { label: 'Day', value: 'day' },
      { label: 'Week', value: 'week' },
      { label: 'Month', value: 'month' }
    ]

    const keyMetrics = computed(() => [
      {
        label: 'Total Earnings',
        value: formatCurrency(breakdown.value.total),
        color: 'primary',
        trend: 0.12
      },
      {
        label: 'Avg. Per Delivery',
        value: formatCurrency(breakdown.value.total / totalDeliveries.value),
        color: 'success',
        trend: 0.05
      },
      {
        label: 'Tip Rate',
        value: formatPercentage(tipRate.value),
        color: 'info',
        trend: -0.02
      }
    ])

    const earningsStats = computed(() => [
      {
        label: 'Total Deliveries',
        value: totalDeliveries.value,
        prefix: '',
        suffix: '',
        color: 'text-primary'
      },
      {
        label: 'Tips',
        value: formatCurrency(breakdown.value.tips),
        prefix: '',
        suffix: '',
        color: 'text-success',
        trend: 0.08
      }
    ])

    const totalDeliveries = computed(() => chartData.value.reduce((sum, day) => sum + day.deliveries, 0))
    const tipRate = computed(() => breakdown.value.tips / breakdown.value.total)

    // Methods
    const fetchData = async () => {
      loading.value = true
      error.value = null

      try {
        const data = await analyticsService.getEarningsAnalytics(
          selectedPeriod.value,
          customRange.value ? new Date(dateRange.value[0]) : new Date()
        )

        chartData.value = data.chart
        breakdown.value = {
          base: data.summary.total - data.summary.tips - data.summary.bonus,
          tips: data.summary.tips,
          bonus: data.summary.bonus,
          total: data.summary.total
        }
        peakHours.value = data.peakHours
        popularAreas.value = data.areas
        projections.value = analyticsService.calculateProjections(data.chart)
      } catch (e) {
        error.value = 'Failed to load earnings data'
        console.error('Error fetching earnings:', e)
      } finally {
        loading.value = false
      }
    }

    const handlePeriodChange = (period) => {
      selectedPeriod.value = period
      customRange.value = false
      fetchData()
    }

    const downloadReport = async () => {
      downloading.value = true
      try {
        // Implement report download
        await new Promise(resolve => setTimeout(resolve, 1000))
      } finally {
        downloading.value = false
      }
    }

    // Format helpers
    const formatCurrency = (amount) => analyticsService.formatCurrency(amount)
    const formatPercentage = (value) => analyticsService.formatPercentage(value)

    const formatHourRange = (hour) => {
      const start = `${hour}:00`
      const end = `${hour + 1}:00`
      return `${start} - ${end}`
    }

    const formatProjectionPeriod = (period) => {
      const labels = {
        daily: 'Daily Average',
        weekly: 'Weekly Projection',
        monthly: 'Monthly Projection',
        yearly: 'Yearly Projection'
      }
      return labels[period] || period
    }

    const getHourIcon = (hour) => {
      if (hour < 12) return 'mdi-weather-sunny'
      if (hour < 17) return 'mdi-weather-cloudy'
      return 'mdi-weather-night'
    }

    const getHourColor = (earnings) => {
      const average = breakdown.value.total / peakHours.value.length
      if (earnings > average * 1.5) return 'success'
      if (earnings > average) return 'primary'
      return undefined
    }

    const getTrendIcon = (trend) => {
      if (trend > 0) return 'mdi-arrow-up'
      if (trend < 0) return 'mdi-arrow-down'
      return 'mdi-minus'
    }

    const getTrendClass = (trend) => {
      if (trend > 0) return 'trend-positive'
      if (trend < 0) return 'trend-negative'
      return 'trend-neutral'
    }

    // Lifecycle
    onMounted(() => {
      fetchData()
    })

    return {
      loading,
      error,
      downloading,
      selectedPeriod,
      showDatePicker,
      dateRange,
      customRange,
      maxDate,
      periods,
      chartData,
      keyMetrics,
      earningsStats,
      breakdown,
      peakHours,
      popularAreas,
      projections,
      handlePeriodChange,
      downloadReport,
      formatCurrency,
      formatPercentage,
      formatHourRange,
      formatProjectionPeriod,
      getHourIcon,
      getHourColor,
      getTrendIcon,
      getTrendClass
    }
  }
}
</script>

<style scoped>
.earnings {
  padding: 20px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.trend-positive {
  color: var(--v-success-base);
}

.trend-negative {
  color: var(--v-error-base);
}

.trend-neutral {
  color: var(--v-secondary-base);
}

/* Custom scrollbar for better UX */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
