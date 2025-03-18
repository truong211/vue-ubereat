<!-- System metrics dashboard for administrators -->
<template>
  <v-card class="system-metrics">
    <v-card-title class="d-flex justify-space-between align-center">
      System Metrics
      <v-chip
        :color="isConnected ? 'success' : 'error'"
        small
      >
        {{ isConnected ? 'Connected' : 'Disconnected' }}
      </v-chip>
    </v-card-title>

    <v-card-text>
      <v-row>
        <!-- Connection metrics -->
        <v-col cols="12" md="6">
          <v-card outlined>
            <v-card-subtitle>Active Connections</v-card-subtitle>
            <v-list dense>
              <v-list-item v-for="(count, type) in metrics.connections" :key="type">
                <v-list-item-content>
                  <v-list-item-title>{{ formatLabel(type) }}</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-chip small>{{ count }}</v-chip>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Room metrics -->
        <v-col cols="12" md="6">
          <v-card outlined>
            <v-card-subtitle>Active Rooms</v-card-subtitle>
            <v-list dense>
              <v-list-item v-for="(count, type) in metrics.rooms" :key="type">
                <v-list-item-content>
                  <v-list-item-title>{{ formatLabel(type) }}</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-chip small>{{ count }}</v-chip>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- Event metrics -->
        <v-col cols="12" md="6">
          <v-card outlined>
            <v-card-subtitle>Event Statistics</v-card-subtitle>
            <v-list dense>
              <v-list-item v-for="(count, type) in metrics.events" :key="type">
                <v-list-item-content>
                  <v-list-item-title>{{ formatLabel(type) }}</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-chip small>{{ count }}</v-chip>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <!-- System stats -->
        <v-col cols="12" md="6">
          <v-card outlined>
            <v-card-subtitle>System Status</v-card-subtitle>
            <v-list dense>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>Uptime</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-chip small>{{ formatUptime(metrics.uptime) }}</v-chip>
                </v-list-item-action>
              </v-list-item>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>Last Update</v-list-item-title>
                </v-list-item-content>
                <v-list-item-action>
                  <v-chip small>{{ formatTimestamp(lastUpdate) }}</v-chip>
                </v-list-item-action>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- System alerts -->
      <v-expand-transition>
        <div v-if="activeAlerts.length > 0" class="mt-4">
          <v-alert
            v-for="alert in activeAlerts"
            :key="alert.id"
            :type="alert.type"
            dismissible
            @input="clearAlert(alert.id)"
          >
            {{ alert.message }}
          </v-alert>
        </div>
      </v-expand-transition>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import { format, formatDistanceToNow } from 'date-fns';

export default {
  name: 'SystemMetricsDashboard',

  data() {
    return {
      metrics: {
        connections: {
          total: 0,
          customers: 0,
          restaurants: 0,
          drivers: 0,
          admins: 0
        },
        rooms: {
          orders: 0,
          restaurants: 0,
          users: 0
        },
        events: {
          sent: 0,
          received: 0
        },
        uptime: 0
      },
      lastUpdate: null
    };
  },

  computed: {
    ...mapState({
      isConnected: state => state.webSocket.status === 'connected'
    }),
    ...mapGetters('admin', ['activeSystemAlerts'])
  },

  mounted() {
    // Listen for system metrics updates
    this.$root.$on('ws:system_metrics', this.handleMetricsUpdate);
  },

  beforeDestroy() {
    this.$root.$off('ws:system_metrics', this.handleMetricsUpdate);
  },

  methods: {
    ...mapActions('admin', ['clearSystemAlert']),

    handleMetricsUpdate(data) {
      this.metrics = data.metrics;
      this.lastUpdate = new Date();
    },

    formatLabel(key) {
      return key
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },

    formatUptime(seconds) {
      if (!seconds) return '0s';
      
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      const parts = [];
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0) parts.push(`${hours}h`);
      if (minutes > 0) parts.push(`${minutes}m`);
      if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

      return parts.join(' ');
    },

    formatTimestamp(date) {
      if (!date) return 'Never';
      return formatDistanceToNow(date, { addSuffix: true });
    },

    clearAlert(alertId) {
      this.clearSystemAlert(alertId);
    }
  }
};
</script>

<style scoped>
.system-metrics {
  height: 100%;
}
</style>