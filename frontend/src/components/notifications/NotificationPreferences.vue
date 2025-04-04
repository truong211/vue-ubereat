<template>
  <v-card class="notification-preferences">
    <v-card-title class="text-h6">Notification Settings</v-card-title>
    
    <v-card-text>
      <v-alert
        v-if="statusMessage"
        :type="statusType"
        variant="tonal"
        density="compact"
        class="mb-4"
        closable
        @click:close="statusMessage = ''"
      >
        {{ statusMessage }}
      </v-alert>

      <!-- Push Notifications -->
      <div class="setting-group mb-4">
        <div class="d-flex align-center mb-2">
          <div class="text-subtitle-1">Push Notifications</div>
          <v-spacer></v-spacer>
          <v-switch
            v-model="pushEnabled"
            :loading="isTogglingPush"
            :disabled="!pushSupported"
            hide-details
            density="comfortable"
            @update:model-value="togglePushNotifications"
          ></v-switch>
        </div>
        <div v-if="!pushSupported" class="text-caption text-error">
          Push notifications are not supported in your browser
        </div>
      </div>

      <!-- Email Notifications -->
      <div class="setting-group mb-4">
        <div class="d-flex align-center mb-2">
          <div class="text-subtitle-1">Email Notifications</div>
          <v-spacer></v-spacer>
          <v-switch
            v-model="emailEnabled"
            :loading="isTogglingEmail"
            hide-details
            density="comfortable"
            @update:model-value="toggleEmailNotifications"
          ></v-switch>
        </div>
      </div>

      <!-- SMS Notifications -->
      <div class="setting-group mb-4">
        <div class="d-flex align-center mb-2">
          <div class="text-subtitle-1">SMS Notifications</div>
          <v-spacer></v-spacer>
          <v-switch
            v-model="smsEnabled"
            :loading="isTogglingSms"
            :disabled="!phoneVerified"
            hide-details
            density="comfortable"
            @update:model-value="toggleSmsNotifications"
          ></v-switch>
        </div>
        <div v-if="!phoneVerified" class="text-caption text-error">
          Please verify your phone number to enable SMS notifications
        </div>
      </div>

      <!-- Notification Types -->
      <v-divider class="my-4"></v-divider>
      
      <div class="text-subtitle-1 mb-3">Receive notifications for:</div>
      <v-list density="compact">
        <v-list-item v-for="type in notificationTypes" :key="type.value">
          <template v-slot:prepend>
            <v-checkbox
              v-model="enabledTypes"
              :value="type.value"
              hide-details
              density="comfortable"
            ></v-checkbox>
          </template>
          <v-list-item-title>{{ type.label }}</v-list-item-title>
          <v-list-item-subtitle>{{ type.description }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        :loading="isSavingSettings"
        @click="saveSettings"
      >
        Save Changes
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'NotificationPreferences',

  setup() {
    const store = useStore()

    // State
    const pushEnabled = ref(false)
    const pushSupported = ref(false)
    const emailEnabled = ref(false)
    const smsEnabled = ref(false)
    const phoneVerified = ref(false)
    const enabledTypes = ref([])
    const statusMessage = ref('')
    const statusType = ref('info')

    // Loading states
    const isTogglingPush = ref(false)
    const isTogglingEmail = ref(false)
    const isTogglingSms = ref(false)
    const isSavingSettings = ref(false)

    // Notification types
    const notificationTypes = [
      {
        value: 'order_status',
        label: 'Order Status Updates',
        description: 'Get notified about your order status changes'
      },
      {
        value: 'driver_location',
        label: 'Driver Location Updates',
        description: 'Track your delivery in real-time'
      },
      {
        value: 'promotions',
        label: 'Promotions & Offers',
        description: 'Stay updated with latest deals and offers'
      },
      {
        value: 'chat',
        label: 'Chat Messages',
        description: 'Messages from drivers and support'
      },
      {
        value: 'system',
        label: 'System Updates',
        description: 'Important updates about your account'
      }
    ]

    // Methods
    const initializeSettings = async () => {
      try {
        // Check push notification support
        pushSupported.value = 'Notification' in window && 'serviceWorker' in navigator

        // Get current notification settings
        const settings = await store.dispatch('notifications/getPreferences') || {}
        pushEnabled.value = settings?.push || false
        emailEnabled.value = settings?.email || false
        smsEnabled.value = settings?.sms || false
        enabledTypes.value = settings?.enabledTypes || []

        // Check phone verification status
        const user = store.state.auth.user
        phoneVerified.value = user?.phoneVerified || false
      } catch (error) {
        console.error('Failed to load notification settings:', error)
        showStatus('Failed to load settings', 'error')
      }
    }

    const togglePushNotifications = async () => {
      if (!pushSupported.value) return

      isTogglingPush.value = true
      try {
        if (pushEnabled.value) {
          await store.dispatch('notifications/requestPushPermission')
        } else {
          await store.dispatch('notifications/unsubscribeFromPush')
        }
      } catch (error) {
        console.error('Failed to toggle push notifications:', error)
        pushEnabled.value = !pushEnabled.value
        showStatus('Failed to update push notification settings', 'error')
      } finally {
        isTogglingPush.value = false
      }
    }

    const toggleEmailNotifications = async () => {
      isTogglingEmail.value = true
      try {
        await store.dispatch('notifications/updatePreferences', {
          email: emailEnabled.value
        })
      } catch (error) {
        console.error('Failed to toggle email notifications:', error)
        emailEnabled.value = !emailEnabled.value
        showStatus('Failed to update email notification settings', 'error')
      } finally {
        isTogglingEmail.value = false
      }
    }

    const toggleSmsNotifications = async () => {
      if (!phoneVerified.value) return

      isTogglingSms.value = true
      try {
        await store.dispatch('notifications/updatePreferences', {
          sms: smsEnabled.value
        })
      } catch (error) {
        console.error('Failed to toggle SMS notifications:', error)
        smsEnabled.value = !smsEnabled.value
        showStatus('Failed to update SMS notification settings', 'error')
      } finally {
        isTogglingSms.value = false
      }
    }

    const saveSettings = async () => {
      isSavingSettings.value = true
      try {
        await store.dispatch('notifications/updatePreferences', {
          push: pushEnabled.value,
          email: emailEnabled.value,
          sms: smsEnabled.value,
          enabledTypes: enabledTypes.value
        })
        showStatus('Settings saved successfully', 'success')
      } catch (error) {
        console.error('Failed to save notification settings:', error)
        showStatus('Failed to save settings', 'error')
      } finally {
        isSavingSettings.value = false
      }
    }

    const showStatus = (message, type = 'info') => {
      statusMessage.value = message
      statusType.value = type
    }

    // Initialize
    onMounted(() => {
      initializeSettings()
    })

    return {
      // State
      pushEnabled,
      pushSupported,
      emailEnabled,
      smsEnabled,
      phoneVerified,
      enabledTypes,
      statusMessage,
      statusType,
      
      // Loading states
      isTogglingPush,
      isTogglingEmail,
      isTogglingSms,
      isSavingSettings,
      
      // Data
      notificationTypes,
      
      // Methods
      togglePushNotifications,
      toggleEmailNotifications,
      toggleSmsNotifications,
      saveSettings
    }
  }
}
</script>

<style scoped>
.notification-preferences {
  max-width: 600px;
  margin: 0 auto;
}

.setting-group {
  padding: 8px 0;
}
</style>