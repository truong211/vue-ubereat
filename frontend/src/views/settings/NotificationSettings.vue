<template>
  <div class="notification-settings">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-4">Notification Settings</h1>
          <p class="text-body-1 mb-6">
            Manage your notification preferences for the app. Choose how and when you want to be notified.
          </p>
        </v-col>
      </v-row>

      <v-card class="mb-6">
        <v-card-title>Notification Channels</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-switch
                v-model="notificationPreferences.email"
                label="Email Notifications"
                color="primary"
                hide-details
                class="mb-4"
              ></v-switch>
              
              <v-switch
                v-model="notificationPreferences.push"
                label="Push Notifications"
                color="primary"
                hide-details
                class="mb-4"
              ></v-switch>
              
              <v-switch
                v-model="notificationPreferences.sms"
                label="SMS Notifications"
                color="primary"
                hide-details
                :disabled="!userHasPhone"
              ></v-switch>
              
              <div v-if="!userHasPhone" class="text-caption mt-1 text-grey">
                <router-link to="/profile/account-settings">Add a phone number</router-link> to enable SMS notifications
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="mb-6">
        <v-card-title>Notification Types</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-switch
                v-model="notificationPreferences.orderUpdates"
                label="Order Updates"
                color="primary"
                hide-details
                class="mb-4"
              ></v-switch>
              
              <v-switch
                v-model="notificationPreferences.promotions"
                label="Promotions and Deals"
                color="primary"
                hide-details
                class="mb-4"
              ></v-switch>
              
              <v-switch
                v-model="notificationPreferences.accountActivity"
                label="Account Activity"
                color="primary"
                hide-details
                class="mb-4"
              ></v-switch>
              
              <v-switch
                v-model="notificationPreferences.restaurantUpdates"
                label="Restaurant Updates"
                color="primary"
                hide-details
              ></v-switch>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card>
        <v-card-title>Email Frequency</v-card-title>
        <v-card-text>
          <v-radio-group v-model="notificationPreferences.emailFrequency">
            <v-radio
              value="immediate"
              label="Send emails immediately"
            ></v-radio>
            <v-radio
              value="daily"
              label="Daily digest (one email per day)"
            ></v-radio>
            <v-radio
              value="weekly"
              label="Weekly digest (one email per week)"
            ></v-radio>
          </v-radio-group>
        </v-card-text>
      </v-card>

      <div class="d-flex justify-end mt-6">
        <v-btn
          color="primary"
          @click="saveSettings"
          :loading="loading"
        >
          Save Settings
        </v-btn>
      </div>
    </v-container>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';

export default {
  name: 'NotificationSettings',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    const loading = ref(false);
    
    // User data
    const user = computed(() => store.state.auth.user || {});
    const userHasPhone = computed(() => !!user.value.phone);
    
    // Notification preferences
    const notificationPreferences = reactive({
      email: true,
      push: true,
      sms: false,
      orderUpdates: true,
      promotions: true,
      accountActivity: true,
      restaurantUpdates: true,
      emailFrequency: 'immediate'
    });
    
    // Fetch current notification settings from the server
    const fetchNotificationSettings = async () => {
      loading.value = true;
      try {
        const settings = await store.dispatch('notifications/fetchSettings');
        
        // Update local state with fetched settings
        if (settings) {
          Object.keys(settings).forEach(key => {
            if (key in notificationPreferences) {
              notificationPreferences[key] = settings[key];
            }
          });
        }
      } catch (error) {
        console.error('Error fetching notification settings:', error);
        toast.error('Failed to load notification settings');
      } finally {
        loading.value = false;
      }
    };
    
    // Save notification settings
    const saveSettings = async () => {
      loading.value = true;
      try {
        await store.dispatch('notifications/updateSettings', notificationPreferences);
        toast.success('Notification settings saved successfully');
      } catch (error) {
        console.error('Error saving notification settings:', error);
        toast.error('Failed to save notification settings');
      } finally {
        loading.value = false;
      }
    };
    
    // Initialize component
    onMounted(() => {
      fetchNotificationSettings();
    });
    
    return {
      loading,
      user,
      userHasPhone,
      notificationPreferences,
      saveSettings
    };
  }
};
</script>

<style scoped>
.notification-settings {
  max-width: 800px;
  margin: 0 auto;
}
</style> 