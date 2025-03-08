<template>
  <v-card class="alerts-panel">
    <v-card-title class="d-flex align-center">
      System Alerts
      <v-spacer></v-spacer>
      <v-chip
        v-if="totalAlerts > 0"
        color="error"
        size="small"
      >
        {{ totalAlerts }} new
      </v-chip>
    </v-card-title>

    <v-card-text>
      <v-tabs v-model="activeTab" grow>
        <v-tab value="delayed">Delayed Orders</v-tab>
        <v-tab value="complaints">Complaints</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="mt-4">
        <!-- Delayed Orders Tab -->
        <v-window-item value="delayed">
          <div v-if="isLoading" class="d-flex justify-center py-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          <template v-else>
            <v-list v-if="delayedOrders.length > 0" class="alerts-list">
              <v-list-item
                v-for="order in delayedOrders"
                :key="order.id"
                :value="order"
                :class="`priority-${order.priority}`"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getPriorityColor(order.priority)" size="36">
                    <v-icon color="white">mdi-clock-alert</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>Order #{{ order.id }}</v-list-item-title>
                <v-list-item-subtitle>
                  {{ order.restaurant }} • {{ order.customer }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <div class="d-flex flex-column align-end">
                    <v-chip
                      :color="getPriorityColor(order.priority)"
                      size="small"
                      text-color="white"
                    >
                      {{ order.currentDelay }}min delay
                    </v-chip>
                    <span class="text-caption text-medium-emphasis mt-1">
                      Expected: {{ formatTime(order.expectedTime) }}
                    </span>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-center py-4">
              <v-icon size="48" color="success">mdi-check-circle</v-icon>
              <div class="text-h6 mt-2">No Delayed Orders</div>
            </div>
          </template>
        </v-window-item>

        <!-- Complaints Tab -->
        <v-window-item value="complaints">
          <div v-if="isLoading" class="d-flex justify-center py-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>
          <template v-else>
            <v-list v-if="complaints.length > 0" class="alerts-list">
              <v-list-item
                v-for="complaint in complaints"
                :key="complaint.id"
                :value="complaint"
                :class="`priority-${complaint.priority}`"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getPriorityColor(complaint.priority)" size="36">
                    <v-icon color="white">mdi-alert</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>
                  {{ getComplaintTypeText(complaint.type) }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Order #{{ complaint.orderId }} • {{ complaint.customer }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <div class="d-flex flex-column align-end">
                    <v-chip
                      :color="getPriorityColor(complaint.priority)"
                      size="small"
                      text-color="white"
                    >
                      {{ complaint.priority }}
                    </v-chip>
                    <span class="text-caption text-medium-emphasis mt-1">
                      {{ formatTimeAgo(complaint.timestamp) }}
                    </span>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-center py-4">
              <v-icon size="48" color="success">mdi-check-circle</v-icon>
              <div class="text-h6 mt-2">No Active Complaints</div>
            </div>
          </template>
        </v-window-item>
      </v-window>
    </v-card-text>
  </v-card>
</template>

<script>
import { format } from 'date-fns'
import alertService from '@/services/alert.service'

export default {
  name: 'AlertsPanel',

  data() {
    return {
      activeTab: 'delayed',
      isLoading: true,
      delayedOrders: [],
      complaints: [],
      refreshInterval: null
    }
  },

  computed: {
    totalAlerts() {
      return this.delayedOrders.length + this.complaints.length
    }
  },

  mounted() {
    this.fetchAlerts()
    // Refresh alerts every minute
    this.refreshInterval = setInterval(this.fetchAlerts, 60000)
  },

  beforeUnmount() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
  },

  methods: {
    async fetchAlerts() {
      try {
        this.isLoading = true
        const [delayedOrders, complaints] = await Promise.all([
          alertService.getDelayedOrders(),
          alertService.getComplaints()
        ])
        this.delayedOrders = delayedOrders
        this.complaints = complaints
      } catch (error) {
        console.error('Failed to fetch alerts:', error)
      } finally {
        this.isLoading = false
      }
    },

    getPriorityColor(priority) {
      const colors = {
        critical: 'error',
        high: 'error',
        medium: 'warning',
        low: 'info'
      }
      return colors[priority] || 'grey'
    },

    getComplaintTypeText(type) {
      const types = {
        food_quality: 'Food Quality Issue',
        delivery_time: 'Delivery Delay',
        missing_items: 'Missing Items',
        wrong_order: 'Wrong Order',
        driver_behavior: 'Driver Behavior',
        app_issues: 'App Technical Issue'
      }
      return types[type] || 'Other Issue'
    },

    formatTime(date) {
      return format(new Date(date), 'HH:mm')
    },

    formatTimeAgo(date) {
      const now = new Date()
      const minutes = Math.floor((now - new Date(date)) / 60000)

      if (minutes < 60) {
        return `${minutes}m ago`
      } else if (minutes < 1440) {
        const hours = Math.floor(minutes / 60)
        return `${hours}h ago`
      } else {
        const days = Math.floor(minutes / 1440)
        return `${days}d ago`
      }
    }
  }
}
</script>

<style scoped>
.alerts-list {
  max-height: 400px;
  overflow-y: auto;
}

.priority-critical {
  background-color: rgba(244, 67, 54, 0.1);
}

.priority-high {
  background-color: rgba(255, 152, 0, 0.1);
}

.priority-medium {
  background-color: rgba(255, 193, 7, 0.1);
}

.priority-low {
  background-color: rgba(33, 150, 243, 0.1);
}
</style>