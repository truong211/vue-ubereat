<template>
  <v-card>
    <v-card-title>{{ title }}</v-card-title>
    <v-card-text>
      <!-- Ratings -->
      <div class="metrics-grid">
        <div class="rating-section">
          <div class="rating-circle">
            <v-progress-circular
              :model-value="(averageRating / 5) * 100"
              :size="120"
              :width="12"
              :color="getRatingColor(averageRating)"
            >
              <div class="rating-value">
                {{ averageRating.toFixed(1) }}
                <v-icon icon="mdi-star" size="small"></v-icon>
              </div>
            </v-progress-circular>
          </div>
          <div class="rating-details">
            <div class="text-caption mb-2">Rating Distribution</div>
            <div class="rating-bars">
              <div
                v-for="i in 5"
                :key="i"
                class="rating-bar"
              >
                <div class="rating-label">{{ i }}</div>
                <div class="bar-container">
                  <div
                    class="bar-fill"
                    :style="{
                      width: `${(ratingDistribution[i] || 0) * 100}%`,
                      backgroundColor: getRatingColor(i)
                    }"
                  ></div>
                </div>
                <div class="rating-count">{{ getRatingCount(i) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="performance-metrics">
          <div
            v-for="metric in metrics"
            :key="metric.label"
            class="metric-item"
          >
            <v-progress-circular
              :model-value="metric.value * 100"
              :color="getMetricColor(metric.value)"
              :size="80"
              :width="8"
            >
              {{ formatPercentage(metric.value) }}
            </v-progress-circular>
            <div class="metric-label">{{ metric.label }}</div>
            <div
              v-if="metric.trend"
              class="metric-trend"
              :class="getTrendClass(metric.trend)"
            >
              <v-icon :icon="getTrendIcon(metric.trend)" size="small"></v-icon>
              {{ formatPercentage(Math.abs(metric.trend)) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Feedback -->
      <div class="recent-feedback mt-6">
        <div class="text-h6 mb-2">Recent Feedback</div>
        <v-expansion-panels>
          <v-expansion-panel
            v-for="feedback in recentFeedback"
            :key="feedback.id"
          >
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <div class="rating-stars me-3">
                  <v-icon
                    v-for="i in 5"
                    :key="i"
                    :icon="i <= feedback.rating ? 'mdi-star' : 'mdi-star-outline'"
                    :color="i <= feedback.rating ? 'warning' : undefined"
                    size="small"
                  ></v-icon>
                </div>
                <div class="text-truncate">
                  Order #{{ feedback.orderId }}
                </div>
                <div class="text-caption ms-3">
                  {{ formatDate(feedback.date) }}
                </div>
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              {{ feedback.comment }}
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>

      <!-- Issues Summary -->
      <div class="issues-summary mt-6">
        <div class="text-h6 mb-2">Issues Overview</div>
        <div class="d-flex align-center mb-4">
          <v-progress-linear
            :model-value="(issuesResolved / totalIssues) * 100"
            color="success"
            height="20"
          >
            <template v-slot:default="{ value }">
              {{ Math.round(value) }}% Resolved
            </template>
          </v-progress-linear>
          <div class="ms-4">
            {{ issuesResolved }}/{{ totalIssues }}
          </div>
        </div>

        <!-- Issue Categories -->
        <v-chip-group>
          <v-chip
            v-for="category in issueCategories"
            :key="category.name"
            :color="category.color"
            variant="outlined"
          >
            {{ category.name }}: {{ category.count }}
          </v-chip>
        </v-chip-group>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { computed } from 'vue'
import analyticsService from '@/services/analytics'

export default {
  name: 'PerformanceMetrics',

  props: {
    title: {
      type: String,
      default: 'Performance Metrics'
    },
    data: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    // Computed properties
    const averageRating = computed(() => props.data.ratings.average)
    const ratingDistribution = computed(() => props.data.ratings.distribution)
    
    const metrics = computed(() => [
      {
        label: 'Acceptance Rate',
        value: props.data.metrics.acceptanceRate,
        trend: 0.05 // Example trend value
      },
      {
        label: 'Completion Rate',
        value: props.data.metrics.completionRate,
        trend: 0.02
      },
      {
        label: 'On-Time Rate',
        value: props.data.metrics.onTimeRate,
        trend: -0.01
      }
    ])

    const recentFeedback = computed(() => props.data.feedback)

    const totalIssues = computed(() => props.data.issues.total)
    const issuesResolved = computed(() => props.data.issues.resolved)
    const issueCategories = computed(() => 
      Object.entries(props.data.issues.categories).map(([name, count]) => ({
        name,
        count,
        color: getIssueColor(name)
      }))
    )

    // Helper functions
    const getRatingCount = (rating) => {
      return Math.round((ratingDistribution.value[rating] || 0) * props.data.ratings.total)
    }

    const getRatingColor = (rating) => {
      if (rating >= 4.5) return 'success'
      if (rating >= 4.0) return 'primary'
      if (rating >= 3.0) return 'warning'
      return 'error'
    }

    const getMetricColor = (value) => {
      if (value >= 0.9) return 'success'
      if (value >= 0.8) return 'primary'
      if (value >= 0.7) return 'warning'
      return 'error'
    }

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

    const getIssueColor = (category) => {
      const colors = {
        'late_delivery': 'error',
        'wrong_item': 'warning',
        'missing_item': 'warning',
        'damaged': 'error',
        'other': 'grey'
      }
      return colors[category] || 'grey'
    }

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString()
    }

    const formatPercentage = (value) => {
      return analyticsService.formatPercentage(value)
    }

    return {
      averageRating,
      ratingDistribution,
      metrics,
      recentFeedback,
      totalIssues,
      issuesResolved,
      issueCategories,
      getRatingCount,
      getRatingColor,
      getMetricColor,
      getTrendIcon,
      getTrendClass,
      formatDate,
      formatPercentage
    }
  }
}
</script>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.rating-circle {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.rating-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 1.5rem;
  font-weight: 500;
}

.rating-bars {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-container {
  flex: 1;
  height: 8px;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.rating-count {
  min-width: 30px;
  text-align: right;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
}

.performance-metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 16px;
}

.metric-item {
  text-align: center;
}

.metric-label {
  margin-top: 8px;
  font-size: 0.875rem;
  color: rgba(0, 0, 0, 0.6);
}

.metric-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 0.75rem;
  margin-top: 4px;
}

.trend-up { color: #4caf50; }
.trend-down { color: #f44336; }
.trend-neutral { color: #9e9e9e; }

.rating-stars {
  display: flex;
  gap: 2px;
}
</style>
