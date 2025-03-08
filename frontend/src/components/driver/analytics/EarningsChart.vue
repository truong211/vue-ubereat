<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      {{ title }}
      <v-btn-group v-if="showControls">
        <v-btn
          v-for="period in periods"
          :key="period.value"
          :color="selectedPeriod === period.value ? 'primary' : undefined"
          variant="tonal"
          @click="$emit('period-change', period.value)"
        >
          {{ period.label }}
        </v-btn>
      </v-btn-group>
    </v-card-title>

    <v-card-text>
      <div class="chart-container">
        <!-- Loading State -->
        <div v-if="loading" class="chart-loading">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="chart-error">
          <v-icon color="error" size="large">mdi-alert-circle</v-icon>
          <div class="text-body-1">{{ error }}</div>
          <v-btn
            variant="text"
            color="primary"
            @click="$emit('retry')"
          >
            Retry
          </v-btn>
        </div>

        <!-- Chart -->
        <div v-else ref="chartContainer" class="chart"></div>
      </div>

      <!-- Summary Stats -->
      <div class="summary-stats mt-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="stat-item"
        >
          <div class="stat-value" :class="stat.color">
            {{ stat.prefix }}{{ stat.value }}{{ stat.suffix }}
          </div>
          <div class="stat-label">{{ stat.label }}</div>
          <div
            v-if="stat.trend"
            class="stat-trend"
            :class="getTrendClass(stat.trend)"
          >
            <v-icon :icon="getTrendIcon(stat.trend)" size="small"></v-icon>
            {{ Math.abs(stat.trend) }}%
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Chart } from 'chart.js/auto'

export default {
  name: 'EarningsChart',

  props: {
    title: {
      type: String,
      default: 'Earnings'
    },
    data: {
      type: Array,
      required: true
    },
    stats: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    error: {
      type: String,
      default: ''
    },
    showControls: {
      type: Boolean,
      default: true
    },
    selectedPeriod: {
      type: String,
      default: 'week'
    }
  },

  emits: ['period-change', 'retry'],

  setup(props) {
    const chartContainer = ref(null)
    const chart = ref(null)
    const periods = [
      { label: 'Day', value: 'day' },
      { label: 'Week', value: 'week' },
      { label: 'Month', value: 'month' }
    ]

    // Initialize chart
    const initChart = () => {
      if (chart.value) {
        chart.value.destroy()
      }

      const ctx = chartContainer.value

      chart.value = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: props.data.map(d => new Date(d.date).toLocaleDateString()),
          datasets: [
            {
              label: 'Earnings',
              data: props.data.map(d => d.total),
              backgroundColor: 'rgba(25, 118, 210, 0.2)',
              borderColor: 'rgba(25, 118, 210, 1)',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Tips',
              data: props.data.map(d => d.tips),
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              borderColor: 'rgba(76, 175, 80, 1)',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Bonus',
              data: props.data.map(d => d.bonus),
              backgroundColor: 'rgba(255, 152, 0, 0.2)',
              borderColor: 'rgba(255, 152, 0, 1)',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom'
            },
            tooltip: {
              mode: 'index',
              intersect: false,
              callbacks: {
                label: (context) => {
                  let label = context.dataset.label || ''
                  if (label) {
                    label += ': '
                  }
                  label += new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  }).format(context.parsed.y)
                  return label
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value) => {
                  return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                  }).format(value)
                }
              }
            }
          }
        }
      })
    }

    // Update chart data
    const updateChart = () => {
      if (!chart.value) return

      chart.value.data.labels = props.data.map(d => 
        new Date(d.date).toLocaleDateString()
      )

      chart.value.data.datasets[0].data = props.data.map(d => d.total)
      chart.value.data.datasets[1].data = props.data.map(d => d.tips)
      chart.value.data.datasets[2].data = props.data.map(d => d.bonus)

      chart.value.update()
    }

    // Get trend icon and class
    const getTrendIcon = (trend) => {
      if (trend > 0) return 'mdi-arrow-up'
      if (trend < 0) return 'mdi-arrow-down'
      return 'mdi-minus'
    }

    const getTrendClass = (trend) => {
      if (trend > 0) return 'trend-up'
      if (trend < 0) return 'trend-down'
      return 'trend-neutral'
    }

    // Lifecycle hooks
    onMounted(() => {
      if (!props.loading && !props.error && props.data.length > 0) {
        initChart()
      }
    })

    onUnmounted(() => {
      if (chart.value) {
        chart.value.destroy()
      }
    })

    // Watch for data changes
    watch(() => props.data, () => {
      if (!props.loading && !props.error && props.data.length > 0) {
        if (!chart.value) {
          initChart()
        } else {
          updateChart()
        }
      }
    }, { deep: true })

    return {
      chartContainer,
      periods,
      getTrendIcon,
      getTrendClass
    }
  }
}
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
}

.chart-loading,
.chart-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background-color: rgba(255, 255, 255, 0.9);
}

.chart {
  width: 100%;
  height: 100%;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 500;
}

.stat-label {
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
}

.stat-trend {
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.trend-up {
  color: #4caf50;
}

.trend-down {
  color: #f44336;
}

.trend-neutral {
  color: #9e9e9e;
}

.text-primary {
  color: var(--v-primary-base);
}

.text-success {
  color: var(--v-success-base);
}

.text-warning {
  color: var(--v-warning-base);
}
</style>
