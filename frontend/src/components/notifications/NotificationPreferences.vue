<template>
  <div class="notification-preferences">
    <div class="notification-section">
      <div class="notification-toggle">
        <h3>{{ $t('notifications.push.title') }}</h3>
        <p>{{ $t('notifications.push.description') }}</p>
        <v-switch
          v-model="pushEnabled"
          :disabled="!pushSupported || loading.push"
          @change="togglePushNotifications"
        />
        <p v-if="!pushSupported" class="error-text">
          {{ $t('notifications.push.notSupported') }}
        </p>
      </div>

      <div class="notification-toggle">
        <h3>{{ $t('notifications.email.title') }}</h3>
        <p>{{ $t('notifications.email.description') }}</p>
        <v-switch
          v-model="emailEnabled"
          :disabled="loading.email"
          @change="toggleEmailNotifications"
        />
      </div>

      <div class="notification-toggle">
        <h3>{{ $t('notifications.sms.title') }}</h3>
        <p>{{ $t('notifications.sms.description') }}</p>
        <v-switch
          v-model="smsEnabled"
          :disabled="!phoneVerified || loading.sms"
          @change="toggleSmsNotifications"
        />
        <p v-if="!phoneVerified" class="error-text">
          {{ $t('notifications.sms.verifyPhone') }}
        </p>
      </div>
    </div>

    <div class="notification-types" v-if="showNotificationTypes">
      <h3>{{ $t('notifications.types.title') }}</h3>
      <v-checkbox
        v-for="type in notificationTypes"
        :key="type.id"
        v-model="selectedTypes"
        :label="$t(type.label)"
        :value="type.id"
        @change="updateNotificationTypes"
      />
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

export default {
  name: 'NotificationPreferences',
  
  setup() {
    const notificationStore = useNotificationStore()
    const authStore = useAuthStore()
    const uiStore = useUiStore()

    const pushEnabled = ref(false)
    const emailEnabled = ref(false)
    const smsEnabled = ref(false)
    const pushSupported = ref(false)
    const phoneVerified = ref(false)
    const selectedTypes = ref([])
    const loading = ref({
      push: false,
      email: false,
      sms: false
    })

    const notificationTypes = [
      { id: 'orders', label: 'notifications.types.orders' },
      { id: 'promotions', label: 'notifications.types.promotions' },
      { id: 'account', label: 'notifications.types.account' },
      { id: 'delivery', label: 'notifications.types.delivery' }
    ]

    const showNotificationTypes = computed(() => 
      pushEnabled.value || emailEnabled.value || smsEnabled.value
    )

    const initializeSettings = async () => {
      try {
        const settings = await notificationStore.getNotificationSettings()
        pushEnabled.value = settings.push
        emailEnabled.value = settings.email
        smsEnabled.value = settings.sms
        selectedTypes.value = settings.types || []
        pushSupported.value = 'Notification' in window
        phoneVerified.value = authStore.user?.phoneVerified || false
      } catch (error) {
        uiStore.showError('Error loading notification settings')
        console.error('Failed to load notification settings:', error)
      }
    }

    const togglePushNotifications = async () => {
      loading.value.push = true
      try {
        await notificationStore.updatePushNotifications(pushEnabled.value)
        uiStore.showSuccess('Push notification settings updated')
      } catch (error) {
        pushEnabled.value = !pushEnabled.value
        uiStore.showError('Failed to update push notifications')
        console.error('Push notification toggle failed:', error)
      } finally {
        loading.value.push = false
      }
    }

    const toggleEmailNotifications = async () => {
      loading.value.email = true
      try {
        await notificationStore.updateEmailNotifications(emailEnabled.value)
        uiStore.showSuccess('Email notification settings updated')
      } catch (error) {
        emailEnabled.value = !emailEnabled.value
        uiStore.showError('Failed to update email notifications')
        console.error('Email notification toggle failed:', error)
      } finally {
        loading.value.email = false
      }
    }

    const toggleSmsNotifications = async () => {
      loading.value.sms = true
      try {
        await notificationStore.updateSmsNotifications(smsEnabled.value)
        uiStore.showSuccess('SMS notification settings updated')
      } catch (error) {
        smsEnabled.value = !smsEnabled.value
        uiStore.showError('Failed to update SMS notifications')
        console.error('SMS notification toggle failed:', error)
      } finally {
        loading.value.sms = false
      }
    }

    const updateNotificationTypes = async () => {
      try {
        await notificationStore.updateNotificationTypes(selectedTypes.value)
        uiStore.showSuccess('Notification types updated')
      } catch (error) {
        uiStore.showError('Failed to update notification types')
        console.error('Notification types update failed:', error)
      }
    }

    onMounted(initializeSettings)

    return {
      pushEnabled,
      emailEnabled,
      smsEnabled,
      pushSupported,
      phoneVerified,
      selectedTypes,
      loading,
      notificationTypes,
      showNotificationTypes,
      togglePushNotifications,
      toggleEmailNotifications,
      toggleSmsNotifications,
      updateNotificationTypes
    }
  }
}
</script>

<style scoped>
.notification-preferences {
  padding: 20px;
}

.notification-section {
  margin-bottom: 30px;
}

.notification-toggle {
  margin-bottom: 24px;
}

.notification-toggle h3 {
  margin-bottom: 8px;
  font-size: 1.1em;
  font-weight: 500;
}

.notification-toggle p {
  margin-bottom: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.error-text {
  color: #ff5252;
  font-size: 0.9em;
  margin-top: 4px;
}

.notification-types {
  border-top: 1px solid #e0e0e0;
  padding-top: 20px;
}

.notification-types h3 {
  margin-bottom: 16px;
  font-size: 1.1em;
  font-weight: 500;
}
</style>
</style>