<template>
  <div class="system-monitoring">
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-4">System Monitoring</h1>
        </v-col>
      </v-row>

      <v-row>
        <!-- System Metrics -->
        <v-col cols="12" lg="8">
          <system-metrics-dashboard />
        </v-col>

        <!-- Quick Actions -->
        <v-col cols="12" lg="4">
          <v-card>
            <v-card-title>Quick Actions</v-card-title>
            <v-card-text>
              <v-btn
                block
                color="primary"
                class="mb-2"
                @click="refreshMetrics"
                :loading="refreshing"
              >
                <v-icon left>mdi-refresh</v-icon>
                Refresh Metrics
              </v-btn>

              <v-btn
                block
                color="warning"
                class="mb-2"
                @click="broadcastMaintenanceDialog = true"
              >
                <v-icon left>mdi-wrench</v-icon>
                Broadcast Maintenance
              </v-btn>

              <v-btn
                block
                color="error"
                @click="systemAlertDialog = true"
              >
                <v-icon left>mdi-alert</v-icon>
                Send System Alert
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Preferences Card -->
          <admin-preferences class="mt-4" />
        </v-col>
      </v-row>
    </v-container>

    <!-- Maintenance Dialog -->
    <v-dialog
      v-model="broadcastMaintenanceDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>Broadcast Maintenance Notice</v-card-title>
        <v-card-text>
          <v-form ref="maintenanceForm" v-model="maintenanceFormValid">
            <v-text-field
              v-model="maintenanceMessage"
              label="Maintenance Message"
              required
              :rules="[v => !!v || 'Message is required']"
            ></v-text-field>
            
            <v-menu
              ref="startMenu"
              v-model="startMenu"
              :close-on-content-click="false"
              :return-value.sync="maintenanceStart"
              transition="scale-transition"
              offset-y
              min-width="290px"
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-model="maintenanceStart"
                  label="Start Time"
                  prepend-icon="mdi-clock-outline"
                  readonly
                  v-bind="attrs"
                  v-on="on"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="maintenanceStart"
                type="datetime"
                :min="new Date().toISOString()"
                @input="$refs.startMenu.save(maintenanceStart)"
              ></v-date-picker>
            </v-menu>

            <v-text-field
              v-model="maintenanceDuration"
              label="Duration (minutes)"
              type="number"
              min="1"
              :rules="[v => !!v || 'Duration is required']"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="broadcastMaintenanceDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!maintenanceFormValid"
            @click="broadcastMaintenance"
          >
            Broadcast
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- System Alert Dialog -->
    <v-dialog
      v-model="systemAlertDialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>Send System Alert</v-card-title>
        <v-card-text>
          <v-form ref="alertForm" v-model="alertFormValid">
            <v-select
              v-model="alertType"
              :items="alertTypes"
              label="Alert Type"
              required
              :rules="[v => !!v || 'Alert type is required']"
            ></v-select>

            <v-text-field
              v-model="alertMessage"
              label="Alert Message"
              required
              :rules="[v => !!v || 'Message is required']"
            ></v-text-field>

            <v-checkbox
              v-model="alertPersistent"
              label="Persistent Alert"
            ></v-checkbox>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="systemAlertDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :disabled="!alertFormValid"
            @click="sendSystemAlert"
          >
            Send Alert
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import SystemMetricsDashboard from '@/components/admin/SystemMetricsDashboard.vue';
import AdminPreferences from '@/components/admin/AdminPreferences.vue';
import { mapActions } from 'vuex';

export default {
  name: 'SystemMonitoring',

  components: {
    SystemMetricsDashboard,
    AdminPreferences
  },

  data() {
    return {
      refreshing: false,
      broadcastMaintenanceDialog: false,
      systemAlertDialog: false,
      maintenanceFormValid: false,
      alertFormValid: false,
      
      // Maintenance form
      maintenanceMessage: '',
      maintenanceStart: new Date().toISOString(),
      maintenanceDuration: 30,
      startMenu: false,

      // Alert form
      alertType: 'info',
      alertMessage: '',
      alertPersistent: false,
      alertTypes: [
        { text: 'Information', value: 'info' },
        { text: 'Warning', value: 'warning' },
        { text: 'Error', value: 'error' },
        { text: 'Critical', value: 'critical' }
      ]
    };
  },

  methods: {
    ...mapActions('admin', ['emitSystemAlert']),

    async refreshMetrics() {
      this.refreshing = true;
      try {
        await this.$root.$emit('refresh_metrics');
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Metrics refreshed',
          color: 'success'
        });
      } catch (error) {
        console.error('Error refreshing metrics:', error);
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Error refreshing metrics',
          color: 'error'
        });
      } finally {
        this.refreshing = false;
      }
    },

    async broadcastMaintenance() {
      if (!this.$refs.maintenanceForm.validate()) return;

      try {
        await this.emitSystemAlert({
          type: 'maintenance',
          message: this.maintenanceMessage,
          data: {
            startTime: this.maintenanceStart,
            duration: parseInt(this.maintenanceDuration)
          }
        });

        this.$store.dispatch('ui/showSnackbar', {
          text: 'Maintenance notice broadcasted',
          color: 'success'
        });
        this.broadcastMaintenanceDialog = false;
      } catch (error) {
        console.error('Error broadcasting maintenance:', error);
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Error broadcasting maintenance notice',
          color: 'error'
        });
      }
    },

    async sendSystemAlert() {
      if (!this.$refs.alertForm.validate()) return;

      try {
        await this.emitSystemAlert({
          type: this.alertType,
          message: this.alertMessage,
          persistent: this.alertPersistent
        });

        this.$store.dispatch('ui/showSnackbar', {
          text: 'System alert sent',
          color: 'success'
        });
        this.systemAlertDialog = false;
      } catch (error) {
        console.error('Error sending system alert:', error);
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Error sending system alert',
          color: 'error'
        });
      }
    }
  }
};
</script>

<style scoped>
.system-monitoring {
  height: 100%;
}</style>