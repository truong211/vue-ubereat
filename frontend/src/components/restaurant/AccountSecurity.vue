<template>
  <v-card>
    <v-card-text>
      <h2 class="text-h5 mb-6">Account Security Settings</h2>
      
      <!-- Password Change Section -->
      <div class="mb-8">
        <h3 class="text-h6 mb-4">Change Password</h3>
        <v-form ref="passwordForm" v-model="passwordFormValid">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="passwordForm.currentPassword"
                label="Current Password"
                type="password"
                :rules="[rules.required]"
                variant="outlined"
                autocomplete="current-password"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="passwordForm.newPassword"
                label="New Password"
                type="password"
                :rules="[rules.required, rules.password]"
                variant="outlined"
                autocomplete="new-password"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="passwordForm.confirmPassword"
                label="Confirm New Password"
                type="password"
                :rules="[rules.required, rules.passwordMatch]"
                variant="outlined"
                autocomplete="new-password"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <v-alert
            v-if="passwordError"
            type="error"
            density="compact"
            class="mb-4"
          >
            {{ passwordError }}
          </v-alert>
          
          <v-btn
            color="primary"
            :loading="passwordLoading"
            :disabled="!passwordFormValid"
            @click="changePassword"
          >
            Update Password
          </v-btn>
        </v-form>
      </div>

      <!-- Security Notifications -->
      <div class="mb-8">
        <h3 class="text-h6 mb-4">Security Notifications</h3>
        <v-list>
          <v-list-item>
            <template v-slot:prepend>
              <v-checkbox
                v-model="securitySettings.emailAlerts"
                hide-details
              ></v-checkbox>
            </template>
            <v-list-item-title>Email alerts for new sign-ins</v-list-item-title>
            <v-list-item-subtitle>
              Get notified when someone signs in from a new device
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-item>
            <template v-slot:prepend>
              <v-checkbox
                v-model="securitySettings.twoFactorAuth"
                hide-details
              ></v-checkbox>
            </template>
            <v-list-item-title>Two-factor authentication</v-list-item-title>
            <v-list-item-subtitle>
              Add an extra layer of security to your account
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-btn
          color="primary"
          class="mt-4"
          :loading="securityLoading"
          @click="updateSecuritySettings"
        >
          Save Security Settings
        </v-btn>
      </div>

      <!-- Active Sessions -->
      <div>
        <h3 class="text-h6 mb-4">Active Sessions</h3>
        <v-list lines="two">
          <v-list-item
            v-for="session in activeSessions"
            :key="session.id"
            :subtitle="formatSessionInfo(session)"
          >
            <template v-slot:prepend>
              <v-icon :icon="getDeviceIcon(session.deviceType)"></v-icon>
            </template>
            
            <template v-slot:title>
              {{ session.deviceName }}
              <v-chip
                v-if="session.isCurrent"
                size="small"
                color="primary"
                class="ml-2"
              >
                Current
              </v-chip>
            </template>

            <template v-slot:append>
              <v-btn
                v-if="!session.isCurrent"
                variant="text"
                color="error"
                size="small"
                @click="terminateSession(session.id)"
              >
                End Session
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'AccountSecurity',

  setup() {
    const store = useStore()
    
    // Password change form
    const passwordForm = ref({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    const passwordFormValid = ref(false)
    const passwordLoading = ref(false)
    const passwordError = ref(null)
    const passwordForm = ref(null)

    // Security settings
    const securitySettings = ref({
      emailAlerts: true,
      twoFactorAuth: false
    })
    const securityLoading = ref(false)

    // Active sessions
    const activeSessions = ref([
      {
        id: 1,
        deviceName: 'Chrome on Windows',
        deviceType: 'desktop',
        location: 'Ho Chi Minh City, Vietnam',
        lastActive: new Date(),
        isCurrent: true
      },
      // More sessions...
    ])

    // Validation rules
    const rules = {
      required: v => !!v || 'Required',
      password: v => {
        const hasMinLength = v.length >= 8
        const hasUpperCase = /[A-Z]/.test(v)
        const hasLowerCase = /[a-z]/.test(v)
        const hasNumber = /\d/.test(v)
        
        if (!hasMinLength) return 'Password must be at least 8 characters'
        if (!hasUpperCase) return 'Password must contain an uppercase letter'
        if (!hasLowerCase) return 'Password must contain a lowercase letter'
        if (!hasNumber) return 'Password must contain a number'
        
        return true
      },
      passwordMatch: v => v === passwordForm.value.newPassword || 'Passwords must match'
    }

    // Methods
    const changePassword = async () => {
      try {
        passwordLoading.value = true
        passwordError.value = null
        
        await store.dispatch('restaurantAdmin/updatePassword', {
          currentPassword: passwordForm.value.currentPassword,
          newPassword: passwordForm.value.newPassword
        })
        
        // Clear form after successful update
        passwordForm.value.currentPassword = ''
        passwordForm.value.newPassword = ''
        passwordForm.value.confirmPassword = ''
        
      } catch (error) {
        passwordError.value = error.response?.data?.message || 'Failed to update password'
      } finally {
        passwordLoading.value = false
      }
    }

    const updateSecuritySettings = async () => {
      try {
        securityLoading.value = true
        await store.dispatch('restaurantAdmin/updateSecuritySettings', securitySettings.value)
      } catch (error) {
        console.error('Failed to update security settings:', error)
      } finally {
        securityLoading.value = false
      }
    }

    const terminateSession = async (sessionId) => {
      try {
        await store.dispatch('restaurantAdmin/terminateSession', sessionId)
        activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId)
      } catch (error) {
        console.error('Failed to terminate session:', error)
      }
    }

    // Helper functions
    const formatSessionInfo = (session) => {
      const timeAgo = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
      const minutesAgo = Math.round((Date.now() - new Date(session.lastActive)) / (1000 * 60))
      const timeString = timeAgo.format(-minutesAgo, 'minute')
      
      return `${session.location} • Last active ${timeString}`
    }

    const getDeviceIcon = (deviceType) => {
      switch (deviceType) {
        case 'desktop': return 'mdi-desktop-mac'
        case 'mobile': return 'mdi-cellphone'
        case 'tablet': return 'mdi-tablet'
        default: return 'mdi-devices'
      }
    }

    return {
      passwordForm,
      passwordFormValid,
      passwordLoading,
      passwordError,
      securitySettings,
      securityLoading,
      activeSessions,
      rules,
      changePassword,
      updateSecuritySettings,
      terminateSession,
      formatSessionInfo,
      getDeviceIcon
    }
  }
}
</script>