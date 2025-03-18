# Admin preferences component
<template>
  <v-card>
    <v-card-title>Preferences</v-card-title>
    <v-card-text>
      <v-form ref="form">
        <!-- Notification settings -->
        <v-subheader>Notifications</v-subheader>
        <v-switch
          v-model="preferences.notificationSound"
          label="Enable notification sounds"
          @change="savePreferences"
        ></v-switch>
        <v-switch
          v-model="preferences.emailNotifications"
          label="Enable email notifications"
          @change="savePreferences"
        ></v-switch>

        <!-- Monitored restaurants -->
        <v-subheader class="mt-4">Monitored Restaurants</v-subheader>
        <v-autocomplete
          v-model="preferences.monitoredRestaurants"
          :items="availableRestaurants"
          item-text="name"
          item-value="id"
          chips
          multiple
          small-chips
          label="Select restaurants to monitor"
          @change="handleMonitoredRestaurantsChange"
        >
          <template v-slot:selection="{ item, index }">
            <v-chip
              v-if="index < 3"
              small
              close
              @click:close="stopMonitoringRestaurant(item.id)"
            >
              {{ item.name }}
            </v-chip>
            <span v-else-if="index === 3" class="grey--text text-caption">
              (+{{ preferences.monitoredRestaurants.length - 3 }} others)
            </span>
          </template>
        </v-autocomplete>

        <!-- Monitored users -->
        <v-subheader class="mt-4">Monitored Users</v-subheader>
        <v-autocomplete
          v-model="preferences.monitoredUsers"
          :items="availableUsers"
          item-text="email"
          item-value="id"
          chips
          multiple
          small-chips
          label="Select users to monitor"
          @change="handleMonitoredUsersChange"
        >
          <template v-slot:selection="{ item, index }">
            <v-chip
              v-if="index < 3"
              small
              close
              @click:close="stopMonitoringUser(item.id)"
            >
              {{ item.email }}
            </v-chip>
            <span v-else-if="index === 3" class="grey--text text-caption">
              (+{{ preferences.monitoredUsers.length - 3 }} others)
            </span>
          </template>
        </v-autocomplete>

        <!-- Alert thresholds -->
        <v-subheader class="mt-4">Alert Thresholds</v-subheader>
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="preferences.alertThresholds.orderIssues"
              type="number"
              label="Order issues threshold"
              hint="Alert when order issues exceed this number"
              min="1"
              @change="savePreferences"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model.number="preferences.alertThresholds.userReports"
              type="number"
              label="User reports threshold"
              hint="Alert when user reports exceed this number"
              min="1"
              @change="savePreferences"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'AdminPreferences',

  data() {
    return {
      availableRestaurants: [],
      availableUsers: [],
      preferences: {
        notificationSound: true,
        emailNotifications: true,
        monitoredRestaurants: [],
        monitoredUsers: [],
        alertThresholds: {
          orderIssues: 5,
          userReports: 3
        }
      }
    };
  },

  computed: {
    ...mapState('admin', ['preferences'])
  },

  async created() {
    await this.loadPreferences();
    await this.loadAvailableEntities();
  },

  methods: {
    ...mapActions('admin', [
      'updatePreferences',
      'monitorRestaurant',
      'stopMonitoringRestaurant',
      'monitorUser',
      'stopMonitoringUser'
    ]),

    async loadPreferences() {
      // Load preferences from store
      this.preferences = {
        ...this.preferences,
        ...this.$store.state.admin.preferences
      };
    },

    async loadAvailableEntities() {
      try {
        // Load restaurants and users that can be monitored
        const [restaurantsRes, usersRes] = await Promise.all([
          this.$axios.get('/api/admin/restaurants'),
          this.$axios.get('/api/admin/users')
        ]);

        this.availableRestaurants = restaurantsRes.data;
        this.availableUsers = usersRes.data;
      } catch (error) {
        console.error('Error loading available entities:', error);
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Error loading preferences data',
          color: 'error'
        });
      }
    },

    async savePreferences() {
      try {
        await this.updatePreferences(this.preferences);
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Preferences saved successfully',
          color: 'success'
        });
      } catch (error) {
        console.error('Error saving preferences:', error);
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Error saving preferences',
          color: 'error'
        });
      }
    },

    async handleMonitoredRestaurantsChange(restaurants) {
      const currentlyMonitored = new Set(this.preferences.monitoredRestaurants);
      const newlyMonitored = new Set(restaurants);

      // Start monitoring new restaurants
      for (const restaurantId of newlyMonitored) {
        if (!currentlyMonitored.has(restaurantId)) {
          await this.monitorRestaurant(restaurantId);
        }
      }

      // Stop monitoring removed restaurants
      for (const restaurantId of currentlyMonitored) {
        if (!newlyMonitored.has(restaurantId)) {
          await this.stopMonitoringRestaurant(restaurantId);
        }
      }

      await this.savePreferences();
    },

    async handleMonitoredUsersChange(users) {
      const currentlyMonitored = new Set(this.preferences.monitoredUsers);
      const newlyMonitored = new Set(users);

      // Start monitoring new users
      for (const userId of newlyMonitored) {
        if (!currentlyMonitored.has(userId)) {
          await this.monitorUser(userId);
        }
      }

      // Stop monitoring removed users
      for (const userId of currentlyMonitored) {
        if (!newlyMonitored.has(userId)) {
          await this.stopMonitoringUser(userId);
        }
      }

      await this.savePreferences();
    }
  }
};
</script>