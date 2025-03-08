<template>
  <v-card class="notification-preferences">
    <v-card-title class="text-h6">
      Notification Settings
      <v-spacer></v-spacer>
      <v-switch
        v-model="pushEnabled"
        color="primary"
        label="Enable Push Notifications"
        @change="togglePushNotifications"
        :disabled="!isPushSupported"
      ></v-switch>
    </v-card-title>

    <v-card-text>
      <v-alert
        v-if="!isPushSupported"
        type="warning"
        text="Push notifications are not supported in your browser."
        class="mb-4"
      ></v-alert>

      <v-list>
        <v-list-subheader>Notification Preferences</v-list-subheader>
        
        <v-list-item>
          <v-checkbox
            v-model="preferences.orderUpdates"
            label="Order Updates"
            hint="Receive notifications about your order status"
            @change="updatePreferences"
            :disabled="!pushEnabled"
          ></v-checkbox>
        </v-list-item>

        <v-list-item>
          <v-checkbox
            v-model="preferences.promotions"
            label="Promotions"
            hint="Get notified about special offers and discounts"
            @change="updatePreferences"
            :disabled="!pushEnabled"
          ></v-checkbox>
        </v-list-item>

        <v-list-item>
          <v-checkbox
            v-model="preferences.restaurantUpdates"
            label="Restaurant Updates"
            hint="Stay informed about your favorite restaurants"
            @change="updatePreferences"
            :disabled="!pushEnabled"
          ></v-checkbox>
        </v-list-item>
      </v-list>
    </v-card-text>
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'NotificationPreferences',

  data() {
    return {
      isPushSupported: 'serviceWorker' in navigator && 'PushManager' in window
    }
  },

  computed: {
    ...mapState('notifications', {
      pushEnabled: state => state.pushEnabled,
      preferences: state => state.preferences
    })
  },

  methods: {
    ...mapActions('notifications', [
      'initializePushNotifications',
      'subscribeToPush',
      'unsubscribeFromPush',
      'updatePreferences'
    ]),

    async togglePushNotifications(enabled) {
      if (enabled) {
        const success = await this.subscribeToPush()
        if (!success) {
          this.$emit('error', 'Failed to enable push notifications')
        }
      } else {
        const success = await this.unsubscribeFromPush()
        if (!success) {
          this.$emit('error', 'Failed to disable push notifications')
        }
      }
    }
  },

  async mounted() {
    if (this.isPushSupported) {
      await this.initializePushNotifications()
    }
  }
}
</script>

<style scoped>
.notification-preferences {
  max-width: 600px;
  margin: 0 auto;
}
</style>