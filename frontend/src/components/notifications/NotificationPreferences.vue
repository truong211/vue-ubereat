<template>
  <v-card class="notification-preferences-card elevation-2 my-4">
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-bell-outline" class="mr-2" />
      Notification Preferences
      <v-spacer></v-spacer>
      
      <!-- Push Toggle Switch -->
      <v-switch
        v-model="pushEnabled"
        color="primary"
        hide-details
        :disabled="!isPushSupported || isProcessing"
        :loading="isProcessing"
        @change="togglePushNotifications"
        label="Push Notifications"
      ></v-switch>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Loading State -->
    <div v-if="loading" class="pa-4 text-center">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <div class="mt-2">Loading preferences...</div>
    </div>

    <!-- Content -->
    <v-card-text v-else>
      <!-- Status Messages -->
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

      <!-- Push Not Supported -->
      <v-alert
        v-if="!isPushSupported"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Push notifications are not supported in your browser. Try using Chrome, Firefox, Edge, or Safari.
      </v-alert>

      <!-- Push Permission Denied -->
      <v-alert
        v-else-if="permissionDenied"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Notification permission was denied. Please update your browser settings to enable notifications.
      </v-alert>
      
      <!-- Notification Types -->
      <div class="notification-types">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">Notification Categories</h3>
        
        <v-list density="compact">
          <v-list-item>
            <template v-slot:prepend>
              <v-checkbox
                v-model="preferences.orderUpdates"
                hide-details
                :disabled="!pushEnabled && !preferences.email && !preferences.sms"
                @change="updatePreferences"
              ></v-checkbox>
            </template>
            <v-list-item-title>Order Updates</v-list-item-title>
            <v-list-item-subtitle>
              Notifications about your order status (confirmation, preparation, delivery)
            </v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item>
            <template v-slot:prepend>
              <v-checkbox
                v-model="preferences.driverLocation"
                hide-details
                :disabled="!pushEnabled && !preferences.email && !preferences.sms"
                @change="updatePreferences"
              ></v-checkbox>
            </template>
            <v-list-item-title>Driver Location Updates</v-list-item-title>
            <v-list-item-subtitle>
              Notifications about your driver's location and estimated arrival time
            </v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item>
            <template v-slot:prepend>
              <v-checkbox
                v-model="preferences.promotions"
                hide-details
                :disabled="!pushEnabled && !preferences.email && !preferences.sms"
                @change="updatePreferences"
              ></v-checkbox>
            </template>
            <v-list-item-title>Promotions</v-list-item-title>
            <v-list-item-subtitle>
              Special offers, discounts, and deals from restaurants
            </v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item>
            <template v-slot:prepend>
              <v-checkbox
                v-model="preferences.marketing"
                hide-details
                :disabled="!pushEnabled && !preferences.email && !preferences.sms"
                @change="updatePreferences"
              ></v-checkbox>
            </template>
            <v-list-item-title>Marketing Messages</v-list-item-title>
            <v-list-item-subtitle>
              Updates about new features, restaurants, and personalized recommendations
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
      
      <v-divider class="my-4"></v-divider>
      
      <!-- Notification Channels -->
      <div class="notification-channels">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">Notification Channels</h3>
        
        <v-list density="compact">
          <v-list-item>
            <template v-slot:prepend>
              <v-checkbox
                v-model="preferences.push"
                hide-details
                :disabled="!isPushSupported || permissionDenied"
                @change="updatePreferences"
              ></v-checkbox>
            </template>
            <v-list-item-title>Browser Push Notifications</v-list-item-title>
            <v-list-item-subtitle>
              Receive notifications even when the site is not open
            </v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item>
            <template v-slot:prepend>
              <v-checkbox
                v-model="preferences.email"
                hide-details
                @change="updatePreferences"
              ></v-checkbox>
            </template>
            <v-list-item-title>Email Notifications</v-list-item-title>
            <v-list-item-subtitle>
              Receive notifications via email
            </v-list-item-subtitle>
          </v-list-item>
          
          <v-list-item>
            <template v-slot:prepend>
              <v-checkbox
                v-model="preferences.sms"
                hide-details
                :disabled="!phoneVerified"
                @change="updatePhonePreferences"
              ></v-checkbox>
            </template>
            <v-list-item-title>SMS Notifications</v-list-item-title>
            <v-list-item-subtitle>
              <template v-if="!phoneVerified">
                You need to <a href="#" @click.prevent="verifyPhone" class="text-primary">verify your phone number</a> to receive SMS notifications
              </template>
              <template v-else>
                Receive text messages for important updates
              </template>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </div>
      
      <v-divider class="my-4"></v-divider>
      
      <!-- Quiet Hours -->
      <div class="quiet-hours">
        <h3 class="text-subtitle-1 font-weight-bold mb-3">Quiet Hours</h3>
        
        <div class="d-flex align-center mb-2">
          <v-checkbox
            v-model="preferences.quietHoursEnabled"
            hide-details
            label="Enable Quiet Hours"
            @change="updatePreferences"
          ></v-checkbox>
        </div>
        
        <div class="d-flex flex-wrap align-center" v-if="preferences.quietHoursEnabled">
          <div class="mr-4 mb-2">
            <v-label class="text-caption mb-1">Start Time</v-label>
            <v-text-field
              v-model="preferences.quietHoursStart"
              type="time"
              hide-details
              density="compact"
              class="quiet-hours-time"
              @change="updatePreferences"
            ></v-text-field>
          </div>
          <div class="mb-2">
            <v-label class="text-caption mb-1">End Time</v-label>
            <v-text-field
              v-model="preferences.quietHoursEnd"
              type="time"
              hide-details
              density="compact"
              class="quiet-hours-time"
              @change="updatePreferences"
            ></v-text-field>
          </div>
        </div>
        
        <div class="text-caption text-grey mt-1" v-if="preferences.quietHoursEnabled">
          You won't receive push notifications during these hours.
        </div>
      </div>
    </v-card-text>
    
    <!-- Phone Verification Dialog -->
    <v-dialog v-model="showPhoneVerification" max-width="400">
      <v-card>
        <v-card-title>Verify Phone Number</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="sendVerificationCode">
            <v-text-field
              v-model="phoneNumber"
              label="Phone Number"
              placeholder="+1234567890"
              :rules="[v => !!v || 'Phone number is required']"
              hint="Include country code"
              persistent-hint
              prepend-icon="mdi-phone"
              :disabled="verificationSent"
            ></v-text-field>
            
            <div v-if="verificationSent" class="mt-4">
              <v-text-field
                v-model="verificationCode"
                label="Verification Code"
                :rules="[v => !!v || 'Code is required']"
                placeholder="Enter 6-digit code"
                prepend-icon="mdi-key"
                type="number"
              ></v-text-field>
            </div>
            
            <v-alert
              v-if="verificationError"
              type="error"
              variant="tonal"
              density="compact"
              class="mt-4"
            >
              {{ verificationError }}
            </v-alert>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showPhoneVerification = false"
          >
            Cancel
          </v-btn>
          <v-btn
            v-if="!verificationSent"
            color="primary"
            :loading="sendingCode"
            @click="sendVerificationCode"
          >
            Send Code
          </v-btn>
          <v-btn
            v-else
            color="primary"
            :loading="verifying"
            @click="verifyCode"
          >
            Verify
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import { pushNotificationService } from '@/services/push-notification.service';

export default {
  name: 'NotificationPreferences',
  
  data() {
    return {
      loading: true,
      isProcessing: false,
      statusMessage: '',
      statusType: 'info',
      pushEnabled: false,
      permissionDenied: false,
      
      // Phone verification
      showPhoneVerification: false,
      phoneNumber: '',
      verificationCode: '',
      verificationSent: false,
      sendingCode: false,
      verifying: false,
      verificationError: '',
      
      // Default preferences (will be overridden by those from store)
      preferences: {
        orderUpdates: true,
        driverLocation: true,
        promotions: true,
        marketing: false,
        push: false,
        email: true,
        sms: false,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00'
      }
    };
  },
  
  computed: {
    ...mapState({
      user: state => state.auth.user,
    }),
    
    ...mapGetters('notifications', [
      'isPushSupported',
      'preferences'
    ]),
    
    phoneVerified() {
      return this.user && this.user.phoneVerified;
    }
  },
  
  methods: {
    ...mapActions('notifications', [
      'getPreferences',
      'updatePreferences',
      'subscribeToPush',
      'unsubscribeFromPush',
      'requestPushPermission'
    ]),
    
    ...mapActions('auth', [
      'sendPhoneVerificationCode',
      'verifyPhoneVerificationCode',
      'updateUserProfile'
    ]),
    
    async loadPreferences() {
      try {
        this.loading = true;
        await this.getPreferences();
        
        // Copy preferences from store
        this.preferences = { ...this.preferences, ...this.$store.state.notifications.preferences };
        
        // Check if push is enabled
        this.pushEnabled = await pushNotificationService.checkSubscriptionStatus();
        
        // Check if permission is denied
        this.permissionDenied = Notification.permission === 'denied';
        
      } catch (error) {
        console.error('Error loading preferences:', error);
        this.showStatus('Failed to load notification preferences', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    async togglePushNotifications(enabled) {
      if (!this.isPushSupported) {
        return;
      }
      
      this.isProcessing = true;
      
      try {
        if (enabled) {
          // Request permission and subscribe
          const granted = await this.requestPushPermission();
          
          if (granted) {
            this.showStatus('Push notifications enabled', 'success');
            this.preferences.push = true;
            await this.updatePreferences(this.preferences);
          } else {
            this.pushEnabled = false;
            this.permissionDenied = Notification.permission === 'denied';
            
            if (this.permissionDenied) {
              this.showStatus('Notification permission denied. Please update your browser settings.', 'warning');
            }
          }
        } else {
          // Unsubscribe
          await this.unsubscribeFromPush();
          this.showStatus('Push notifications disabled', 'info');
          this.preferences.push = false;
          await this.updatePreferences(this.preferences);
        }
      } catch (error) {
        console.error('Error toggling push notifications:', error);
        this.pushEnabled = false;
        this.showStatus('Failed to update push notification settings', 'error');
      } finally {
        this.isProcessing = false;
      }
    },
    
    async updatePhonePreferences() {
      // If trying to enable SMS without verified phone
      if (this.preferences.sms && !this.phoneVerified) {
        this.preferences.sms = false;
        this.verifyPhone();
        return;
      }
      
      // Otherwise update normally
      await this.updatePreferences(this.preferences);
    },
    
    showStatus(message, type = 'info') {
      this.statusMessage = message;
      this.statusType = type;
      
      // Auto clear success/info messages
      if (type === 'success' || type === 'info') {
        setTimeout(() => {
          if (this.statusMessage === message) {
            this.statusMessage = '';
          }
        }, 5000);
      }
    },
    
    // Phone verification methods
    verifyPhone() {
      this.phoneNumber = this.user.phone || '';
      this.verificationCode = '';
      this.verificationSent = false;
      this.verificationError = '';
      this.showPhoneVerification = true;
    },
    
    async sendVerificationCode() {
      if (!this.phoneNumber) {
        this.verificationError = 'Please enter a valid phone number';
        return;
      }
      
      this.sendingCode = true;
      this.verificationError = '';
      
      try {
        await this.sendPhoneVerificationCode(this.phoneNumber);
        this.verificationSent = true;
      } catch (error) {
        console.error('Error sending verification code:', error);
        this.verificationError = error.message || 'Failed to send verification code';
      } finally {
        this.sendingCode = false;
      }
    },
    
    async verifyCode() {
      if (!this.verificationCode) {
        this.verificationError = 'Please enter the verification code';
        return;
      }
      
      this.verifying = true;
      this.verificationError = '';
      
      try {
        await this.verifyPhoneVerificationCode({
          phone: this.phoneNumber,
          code: this.verificationCode
        });
        
        // Update user profile with verified phone
        await this.updateUserProfile({ phone: this.phoneNumber, phoneVerified: true });
        
        // Enable SMS notifications
        this.preferences.sms = true;
        await this.updatePreferences(this.preferences);
        
        // Close dialog
        this.showPhoneVerification = false;
        
        // Show success
        this.showStatus('Phone verified successfully. SMS notifications enabled.', 'success');
      } catch (error) {
        console.error('Error verifying code:', error);
        this.verificationError = error.message || 'Failed to verify code';
      } finally {
        this.verifying = false;
      }
    }
  },
  
  async mounted() {
    await this.loadPreferences();
  }
};
</script>

<style scoped>
.notification-preferences-card {
  max-width: 800px;
  margin: 0 auto;
}

.quiet-hours-time {
  max-width: 120px;
}
</style>