<template>
  <div class="alerts-panel">
    <v-card v-if="alerts.length > 0">
      <v-card-title class="d-flex align-center">
        System Alerts
        <v-spacer></v-spacer>
        <v-btn
          icon
          @click="dismissAll"
          title="Dismiss all alerts"
        >
          <v-icon>mdi-close-circle-multiple</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-list>
        <v-list-item
          v-for="(alert, index) in alerts"
          :key="index"
          :class="{'high-priority': alert.priority === 'high'}"
        >
          <template v-slot:prepend>
            <v-avatar :color="getAlertColor(alert.type)" size="36">
              <v-icon>{{ getAlertIcon(alert.type) }}</v-icon>
            </v-avatar>
          </template>
          
          <v-list-item-title class="font-weight-bold">{{ alert.title }}</v-list-item-title>
          <v-list-item-subtitle>{{ alert.message }}</v-list-item-subtitle>
          
          <template v-slot:append>
            <div class="d-flex align-center">
              <span class="text-caption text-grey mr-4">{{ formatDate(alert.timestamp) }}</span>
              <v-btn 
                icon 
                size="small" 
                @click="dismissAlert(index)"
                title="Dismiss alert"
              >
                <v-icon>mdi-close</v-icon>
              </v-btn>
            </div>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { format } from 'date-fns';
import axios from 'axios';

export default {
  name: 'AlertsPanel',
  
  setup() {
    const alerts = ref([]);
    
    // Mock alerts for development environment
    const mockAlerts = [
      {
        id: 1,
        type: 'warning',
        title: 'Server Performance',
        message: 'API response times are above threshold',
        timestamp: new Date(),
        priority: 'medium'
      },
      {
        id: 2,
        type: 'info',
        title: 'System Update',
        message: 'A new update will be deployed in 24 hours',
        timestamp: new Date(),
        priority: 'low'
      }
    ];
    
    const getAlertColor = (type) => {
      const colors = {
        error: 'error',
        warning: 'warning',
        info: 'info',
        success: 'success'
      };
      return colors[type] || 'primary';
    };
    
    const getAlertIcon = (type) => {
      const icons = {
        error: 'mdi-alert-circle',
        warning: 'mdi-alert',
        info: 'mdi-information',
        success: 'mdi-check-circle'
      };
      return icons[type] || 'mdi-bell';
    };
    
    const formatDate = (date) => {
      try {
        return format(new Date(date), 'MMM d, h:mm a');
      } catch (error) {
        return '';
      }
    };
    
    const dismissAlert = (index) => {
      // In a real app, you would send a request to mark the alert as dismissed
      alerts.value.splice(index, 1);
    };
    
    const dismissAll = () => {
      // In a real app, you would send a request to mark all alerts as dismissed
      alerts.value = [];
    };
    
    const loadAlerts = async () => {
      try {
        // In development, use mock data
        if (import.meta.env.DEV) {
          alerts.value = mockAlerts;
          return;
        }
        
        // In production, fetch real alerts
        const response = await axios.get('/api/admin/alerts');
        if (response.data && Array.isArray(response.data.alerts)) {
          alerts.value = response.data.alerts;
        }
      } catch (error) {
        console.error('Failed to load alerts:', error);
        // Use mock data as fallback in case of error
        alerts.value = mockAlerts;
      }
    };
    
    onMounted(() => {
      loadAlerts();
    });
    
    return {
      alerts,
      getAlertColor,
      getAlertIcon,
      formatDate,
      dismissAlert,
      dismissAll
    };
  }
};
</script>

<style scoped>
.alerts-panel {
  margin-bottom: 24px;
}

.high-priority {
  border-left: 4px solid var(--v-error-base);
}
</style>