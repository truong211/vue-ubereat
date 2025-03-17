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

      <!-- Status message -->
      <v-alert
        v-if="statusMessage"
        :type="statusType"
        :text="statusMessage"
        class="mb-4"
        dismissible
        @click:close="statusMessage = ''"
      ></v-alert>

      <!-- Notification Channels -->
      <v-expansion-panels v-model="activePanel">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-bell</v-icon>
              <span>Push Notifications</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list>
              <v-list-subheader>Choose what you want to receive:</v-list-subheader>
              
              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="preferences.orderUpdates"
                    hide-details
                    :disabled="!pushEnabled"
                    @change="updatePreferences"
                  ></v-checkbox>
                </template>
                <v-list-item-title>Order Updates</v-list-item-title>
                <v-list-item-subtitle>
                  Receive notifications about your order status
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="preferences.deliveryUpdates"
                    hide-details
                    :disabled="!pushEnabled"
                    @change="updatePreferences"
                  ></v-checkbox>
                </template>
                <v-list-item-title>Delivery Updates</v-list-item-title>
                <v-list-item-subtitle>
                  Get notified about driver location and ETA changes
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="preferences.promotions"
                    hide-details
                    :disabled="!pushEnabled"
                    @change="updatePreferences"
                  ></v-checkbox>
                </template>
                <v-list-item-title>Promotions</v-list-item-title>
                <v-list-item-subtitle>
                  Get notified about special offers and discounts
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="preferences.restaurantUpdates"
                    hide-details
                    :disabled="!pushEnabled"
                    @change="updatePreferences"
                  ></v-checkbox>
                </template>
                <v-list-item-title>Restaurant Updates</v-list-item-title>
                <v-list-item-subtitle>
                  Stay informed about your favorite restaurants
                </v-list-item-subtitle>
              </v-list-item>

              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="preferences.chatNotifications"
                    hide-details
                    :disabled="!pushEnabled"
                    @change="updatePreferences"
                  ></v-checkbox>
                </template>
                <v-list-item-title>Chat Messages</v-list-item-title>
                <v-list-item-subtitle>
                  Get notified about new chat messages
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-email</v-icon>
              <span>Email Notifications</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list>
              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="preferences.emailNotifications"
                    hide-details
                    @change="updatePreferences"
                  ></v-checkbox>
                </template>
                <v-list-item-title>Enable Email Notifications</v-list-item-title>
              </v-list-item>

              <v-divider class="my-2" v-if="preferences.emailNotifications"></v-divider>

              <template v-if="preferences.emailNotifications">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-checkbox
                      v-model="preferences.emailOrderConfirmation"
                      hide-details
                      @change="updatePreferences"
                    ></v-checkbox>
                  </template>
                  <v-list-item-title>Order Confirmation</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-checkbox
                      v-model="preferences.emailOrderDelivered"
                      hide-details
                      @change="updatePreferences"
                    ></v-checkbox>
                  </template>
                  <v-list-item-title>Order Delivered</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-checkbox
                      v-model="preferences.emailPromotions"
                      hide-details
                      @change="updatePreferences"
                    ></v-checkbox>
                  </template>
                  <v-list-item-title>Promotional Emails</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-checkbox
                      v-model="preferences.emailNewsletter"
                      hide-details
                      @change="updatePreferences"
                    ></v-checkbox>
                  </template>
                  <v-list-item-title>Weekly Newsletter</v-list-item-title>
                </v-list-item>
              </template>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-cellphone</v-icon>
              <span>SMS Notifications</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-alert
              v-if="!user.phoneVerified"
              type="warning"
              density="compact"
              variant="tonal"
              class="mb-4"
            >
              You need to <a @click.prevent="verifyPhone">verify your phone number</a> to receive SMS notifications.
            </v-alert>

            <v-list v-if="user.phoneVerified">
              <v-list-item>
                <template v-slot:prepend>
                  <v-checkbox
                    v-model="preferences.smsNotifications"
                    hide-details
                    @change="updatePreferences"
                  ></v-checkbox>
                </template>
                <v-list-item-title>Enable SMS Notifications</v-list-item-title>
              </v-list-item>

              <v-divider class="my-2" v-if="preferences.smsNotifications"></v-divider>

              <template v-if="preferences.smsNotifications">
                <v-list-item>
                  <template v-slot:prepend>
                    <v-checkbox
                      v-model="preferences.smsOrderConfirmation"
                      hide-details
                      @change="updatePreferences"
                    ></v-checkbox>
                  </template>
                  <v-list-item-title>Order Confirmation</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-checkbox
                      v-model="preferences.smsDeliveryUpdates"
                      hide-details
                      @change="updatePreferences"
                    ></v-checkbox>
                  </template>
                  <v-list-item-title>Delivery Updates</v-list-item-title>
                </v-list-item>

                <v-list-item>
                  <template v-slot:prepend>
                    <v-checkbox
                      v-model="preferences.smsPromotions"
                      hide-details
                      @change="updatePreferences"
                    ></v-checkbox>
                  </template>
                  <v-list-item-title>Exclusive Offers</v-list-item-title>
                </v-list-item>
              </template>
            </v-list>
            
            <v-btn 
              v-if="!user.phoneVerified"
              color="primary"
              block
              class="mt-2"
              @click="verifyPhone"
            >
              Verify Phone Number
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-cog</v-icon>
              <span>Advanced Settings</span>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <!-- Sound settings -->
            <h3 class="text-subtitle-1 mb-2">Notification Sounds</h3>
            <v-select
              v-model="preferences.notificationSound"
              :items="notificationSounds"
              label="Notification Sound"
              class="mb-4"
              @update:model-value="playSound"
              :disabled="!preferences.pushNotifications"
            ></v-select>

            <!-- Quiet Hours -->
            <h3 class="text-subtitle-1 mb-2">Quiet Hours</h3>
            <v-switch
              v-model="preferences.quietHours.enabled"
              label="Enable Quiet Hours"
              class="mb-2"
              @change="updatePreferences"
            ></v-switch>

            <v-row v-if="preferences.quietHours.enabled">
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="preferences.quietHours.start"
                  label="Start Time"
                  type="time"
                  @change="updatePreferences"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="preferences.quietHours.end"
                  label="End Time"
                  type="time"
                  @change="updatePreferences"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Device Management -->
            <h3 class="text-subtitle-1 mb-2">Device Management</h3>
            <v-btn
              color="error"
              variant="outlined"
              class="mb-4"
              @click="showDeviceManagement = true"
              :disabled="!pushEnabled"
            >
              Manage Registered Devices
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>

    <!-- Device Management Dialog -->
    <v-dialog v-model="showDeviceManagement" max-width="600">
      <v-card>
        <v-card-title>Registered Devices</v-card-title>
        <v-card-text>
          <v-data-table
            :headers="deviceHeaders"
            :items="registeredDevices"
            :loading="loadingDevices"
            loading-text="Loading registered devices..."
            no-data-text="No registered devices found"
          >
            <template v-slot:item.lastUsed="{ item }">
              {{ formatDate(item.lastUsed) }}
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                size="small"
                @click="removeDevice(item.id)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="showDeviceManagement = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Phone Verification Dialog -->
    <v-dialog v-model="showPhoneVerification" max-width="500">
      <v-card>
        <v-card-title>Verify Phone Number</v-card-title>
        <v-card-text>
          <v-form ref="phoneForm" @submit.prevent="sendVerificationCode">
            <v-text-field
              v-model="phoneNumber"
              label="Phone Number"
              placeholder="+12345678901"
              :rules="phoneRules"
              hint="Include country code (e.g., +1 for US)"
              persistent-hint
            ></v-text-field>
            
            <template v-if="verificationSent">
              <v-text-field
                v-model="verificationCode"
                label="Verification Code"
                :rules="codeRules"
                class="mt-4"
              ></v-text-field>
            </template>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showPhoneVerification = false"
          >
            Cancel
          </v-btn>
          <v-btn
            v-if="!verificationSent"
            color="primary"
            :loading="sendingCode"
            :disabled="!isPhoneValid"
            @click="sendVerificationCode"
          >
            Send Code
          </v-btn>
          <v-btn
            v-else
            color="success"
            :loading="verifying"
            :disabled="!isCodeValid"
            @click="submitVerificationCode"
          >
            Verify
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import { format } from 'date-fns'

export default {
  name: 'NotificationPreferences',

  data() {
    return {
      isPushSupported: 'serviceWorker' in navigator && 'PushManager' in window,
      activePanel: [0],
      statusMessage: '',
      statusType: 'info',
      showDeviceManagement: false,
      showPhoneVerification: false,
      loadingDevices: false,
      registeredDevices: [],
      phoneNumber: '',
      verificationCode: '',
      verificationSent: false,
      sendingCode: false,
      verifying: false,
      deviceHeaders: [
        { title: 'Device', key: 'name', align: 'start' },
        { title: 'Browser', key: 'browser', align: 'start' },
        { title: 'Last Used', key: 'lastUsed', align: 'start' },
        { title: 'Actions', key: 'actions', align: 'end', sortable: false }
      ],
      notificationSounds: [
        { title: 'Default', value: 'default' },
        { title: 'Chime', value: 'chime' },
        { title: 'Bell', value: 'bell' },
        { title: 'Ping', value: 'ping' },
        { title: 'None', value: 'none' }
      ],
      phoneRules: [
        v => !!v || 'Phone number is required',
        v => /^\+[1-9]\d{1,14}$/.test(v) || 'Phone number must be in international format'
      ],
      codeRules: [
        v => !!v || 'Verification code is required',
        v => /^\d{6}$/.test(v) || 'Verification code must be 6 digits'
      ]
    }
  },

  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    ...mapState('notifications', {
      pushEnabled: state => state.pushEnabled,
      preferences: state => state.preferences
    }),
    isPhoneValid() {
      return this.phoneNumber && /^\+[1-9]\d{1,14}$/.test(this.phoneNumber);
    },
    isCodeValid() {
      return this.verificationCode && /^\d{6}$/.test(this.verificationCode);
    }
  },

  methods: {
    ...mapActions('notifications', [
      'initializePushNotifications',
      'subscribeToPush',
      'unsubscribeFromPush',
      'updatePreferences',
      'loadPreferences'
    ]),
    ...mapActions('auth', [
      'sendPhoneVerification',
      'verifyPhoneNumber',
      'updateUserProfile'
    ]),

    async togglePushNotifications(enabled) {
      try {
        if (enabled) {
          const success = await this.subscribeToPush();
          if (success) {
            this.showStatus('Push notifications enabled successfully', 'success');
          } else {
            this.showStatus('Failed to enable push notifications. Please check your browser settings.', 'error');
          }
        } else {
          const success = await this.unsubscribeFromPush();
          if (success) {
            this.showStatus('Push notifications disabled', 'info');
          } else {
            this.showStatus('Failed to disable push notifications', 'error');
          }
        }
      } catch (error) {
        console.error('Error toggling push notifications:', error);
        this.showStatus('An error occurred while updating notification settings', 'error');
      }
    },

    showStatus(message, type = 'info') {
      this.statusMessage = message;
      this.statusType = type;
      
      // Auto-dismiss success/info messages
      if (type === 'success' || type === 'info') {
        setTimeout(() => {
          if (this.statusMessage === message) {
            this.statusMessage = '';
          }
        }, 5000);
      }
    },

    async loadRegisteredDevices() {
      try {
        this.loadingDevices = true;
        const response = await this.$axios.get('/api/notifications/devices');
        this.registeredDevices = response.data.devices;
      } catch (error) {
        console.error('Error loading devices:', error);
        this.showStatus('Failed to load registered devices', 'error');
      } finally {
        this.loadingDevices = false;
      }
    },

    async removeDevice(deviceId) {
      try {
        await this.$axios.delete(`/api/notifications/devices/${deviceId}`);
        this.registeredDevices = this.registeredDevices.filter(device => device.id !== deviceId);
        this.showStatus('Device removed successfully', 'success');
      } catch (error) {
        console.error('Error removing device:', error);
        this.showStatus('Failed to remove device', 'error');
      }
    },

    verifyPhone() {
      this.phoneNumber = this.user.phone || '';
      this.verificationCode = '';
      this.verificationSent = false;
      this.showPhoneVerification = true;
    },

    async sendVerificationCode() {
      if (!this.isPhoneValid) {
        return;
      }

      try {
        this.sendingCode = true;
        await this.sendPhoneVerification(this.phoneNumber);
        this.verificationSent = true;
        this.showStatus('Verification code sent to your phone', 'success');
      } catch (error) {
        console.error('Error sending verification code:', error);
        this.showStatus('Failed to send verification code', 'error');
      } finally {
        this.sendingCode = false;
      }
    },

    async submitVerificationCode() {
      if (!this.isCodeValid) {
        return;
      }

      try {
        this.verifying = true;
        await this.verifyPhoneNumber({
          phone: this.phoneNumber,
          code: this.verificationCode
        });
        
        // Update user profile
        await this.updateUserProfile({
          phone: this.phoneNumber,
          phoneVerified: true
        });
        
        this.showPhoneVerification = false;
        this.showStatus('Phone number verified successfully', 'success');
      } catch (error) {
        console.error('Error verifying code:', error);
        this.showStatus('Failed to verify code. Please try again.', 'error');
      } finally {
        this.verifying = false;
      }
    },

    formatDate(dateString) {
      return format(new Date(dateString), 'MMM d, yyyy HH:mm');
    },

    async playSound() {
      if (this.preferences.notificationSound === 'none') {
        return;
      }

      try {
        const audio = new Audio(`/sounds/${this.preferences.notificationSound}.mp3`);
        await audio.play();
      } catch (error) {
        console.error('Error playing sound:', error);
      }
    }
  },

  watch: {
    showDeviceManagement(val) {
      if (val) {
        this.loadRegisteredDevices();
      }
    }
  },

  async created() {
    // Set default preferences for email notifications if they don't exist
    if (!this.preferences.emailOrderConfirmation) {
      const updatedPreferences = {
        ...this.preferences,
        emailOrderConfirmation: true,
        emailOrderDelivered: true,
        emailPromotions: false,
        emailNewsletter: false,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        },
        notificationSound: 'default',
        smsOrderConfirmation: true,
        smsDeliveryUpdates: true,
        smsPromotions: false
      };
      await this.updatePreferences(updatedPreferences);
    }
  },

  async mounted() {
    // Initialize push notifications
    if (this.isPushSupported) {
      await this.initializePushNotifications();
      await this.loadPreferences();
    }
  }
}
</script>

<style scoped>
.notification-preferences {
  max-width: 800px;
  margin: 0 auto;
}

.v-expansion-panels {
  margin-top: 16px;
}
</style>