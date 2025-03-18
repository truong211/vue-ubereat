<template>
  <div class="account-settings">
    <h2 class="text-h6 mb-4">Account Settings</h2>
    
    <!-- Privacy Settings Card -->
    <v-card class="mb-6">
      <v-card-title>Privacy Preferences</v-card-title>
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">Location Sharing</h3>
            <p class="text-caption text-medium-emphasis mb-0">Allow us to access your location for delivery tracking</p>
          </div>
          <v-switch v-model="settings.location" color="primary" hide-details></v-switch>
        </div>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">Order History</h3>
            <p class="text-caption text-medium-emphasis mb-0">Share your order history for personalized recommendations</p>
          </div>
          <v-switch v-model="settings.orderHistory" color="primary" hide-details></v-switch>
        </div>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="d-flex justify-space-between align-center">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">Data Collection</h3>
            <p class="text-caption text-medium-emphasis mb-0">Allow collection of usage data to improve our service</p>
          </div>
          <v-switch v-model="settings.dataCollection" color="primary" hide-details></v-switch>
        </div>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          :loading="saving.privacy"
          @click="savePrivacySettings"
        >
          Save Privacy Settings
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Security Settings Card -->
    <v-card class="mb-6">
      <v-card-title>Security Features</v-card-title>
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">Two-Factor Authentication</h3>
            <p class="text-caption text-medium-emphasis mb-0">Add an extra layer of security to your account</p>
          </div>
          <v-btn
            :color="settings.twoFactorEnabled ? 'error' : 'primary'"
            :variant="settings.twoFactorEnabled ? 'outlined' : 'tonal'"
            @click="toggleTwoFactor"
            :loading="saving.twoFactor"
          >
            {{ settings.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA' }}
          </v-btn>
        </div>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="d-flex justify-space-between align-center">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">Login Activity</h3>
            <p class="text-caption text-medium-emphasis mb-0">View your recent login sessions</p>
          </div>
          <v-btn
            color="primary"
            variant="text"
            @click="viewLoginActivity"
          >
            View
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Account Preferences Card -->
    <v-card class="mb-6">
      <v-card-title>Account Preferences</v-card-title>
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">Order Confirmations</h3>
            <p class="text-caption text-medium-emphasis mb-0">Require confirmation before placing an order</p>
          </div>
          <v-switch v-model="settings.orderConfirmation" color="primary" hide-details></v-switch>
        </div>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">Default Payment Time</h3>
            <p class="text-caption text-medium-emphasis mb-0">Automatically save payment method for faster checkout</p>
          </div>
          <v-switch v-model="settings.savePayment" color="primary" hide-details></v-switch>
        </div>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="d-flex justify-space-between align-center">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">Default Tip Percentage</h3>
            <p class="text-caption text-medium-emphasis mb-0">Set your default tip percentage for orders</p>
          </div>
          <v-select
            v-model="settings.defaultTip"
            :items="tipOptions"
            variant="outlined"
            density="compact"
            hide-details
            class="max-width-120"
          ></v-select>
        </div>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          :loading="saving.preferences"
          @click="saveAccountPreferences"
        >
          Save Preferences
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Export & Delete Card -->
    <v-card>
      <v-card-title class="text-red">Danger Zone</v-card-title>
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-4">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">Export Account Data</h3>
            <p class="text-caption text-medium-emphasis mb-0">Download all your personal data and order history</p>
          </div>
          <v-btn
            color="primary"
            variant="outlined"
            @click="exportData"
            :loading="exporting"
          >
            Export Data
          </v-btn>
        </div>
        
        <v-divider class="my-4"></v-divider>
        
        <div class="d-flex justify-space-between align-center">
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1 text-error">Delete Account</h3>
            <p class="text-caption text-medium-emphasis mb-0">Permanently delete your account and all data</p>
          </div>
          <v-btn
            color="error"
            @click="openDeleteAccountDialog"
          >
            Delete Account
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Two-Factor Authentication Dialog -->
    <v-dialog v-model="dialogs.twoFactor.show" max-width="500">
      <v-card>
        <v-card-title>Two-Factor Authentication</v-card-title>
        
        <v-card-text v-if="dialogs.twoFactor.step === 'setup'">
          <p class="mb-4">Scan the QR code with an authenticator app like Google Authenticator or Authy.</p>
          
          <div class="d-flex justify-center my-4">
            <img 
              v-if="dialogs.twoFactor.qrCode" 
              :src="dialogs.twoFactor.qrCode" 
              alt="2FA QR Code" 
              class="qr-code"
            />
            <v-skeleton-loader
              v-else
              type="image"
              width="200"
              height="200"
            ></v-skeleton-loader>
          </div>
          
          <p class="text-subtitle-1 font-weight-medium mt-2">Verification Code</p>
          <p class="text-caption mb-2">Enter the 6-digit code from your authenticator app</p>
          
          <v-text-field
            v-model="dialogs.twoFactor.code"
            label="Verification Code"
            :rules="[rules.required, rules.sixDigits]"
            maxlength="6"
            variant="outlined"
          ></v-text-field>
        </v-card-text>
        
        <v-card-text v-else-if="dialogs.twoFactor.step === 'disable'">
          <p class="mb-4">Please enter your password to disable two-factor authentication.</p>
          
          <v-text-field
            v-model="dialogs.twoFactor.password"
            label="Current Password"
            type="password"
            :rules="[rules.required]"
            variant="outlined"
          ></v-text-field>
        </v-card-text>
        
        <v-card-text v-else-if="dialogs.twoFactor.step === 'success'">
          <div class="text-center">
            <v-icon icon="mdi-check-circle" color="success" size="64" class="mb-4"></v-icon>
            <h3 class="text-h6 mb-2">Two-Factor Authentication Enabled</h3>
            <p>Your account is now more secure!</p>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="dialogs.twoFactor.show = false"
          >
            {{ dialogs.twoFactor.step === 'success' ? 'Close' : 'Cancel' }}
          </v-btn>
          <v-btn
            v-if="dialogs.twoFactor.step !== 'success'"
            color="primary"
            :loading="dialogs.twoFactor.loading"
            @click="completeTwoFactorSetup"
            :disabled="
              (dialogs.twoFactor.step === 'setup' && !dialogs.twoFactor.code) ||
              (dialogs.twoFactor.step === 'disable' && !dialogs.twoFactor.password)
            "
          >
            {{ dialogs.twoFactor.step === 'disable' ? 'Disable 2FA' : 'Verify' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Login Activity Dialog -->
    <v-dialog v-model="dialogs.loginActivity.show" max-width="700">
      <v-card>
        <v-card-title>Login Activity</v-card-title>
        
        <v-card-text>
          <v-list lines="two">
            <v-list-item
              v-for="(session, index) in dialogs.loginActivity.sessions"
              :key="index"
              :active="session.current"
            >
              <template v-slot:prepend>
                <v-icon :color="session.current ? 'success' : undefined">
                  {{ getDeviceIcon(session.device) }}
                </v-icon>
              </template>
              
              <v-list-item-title>
                {{ session.device }}
                <v-chip v-if="session.current" size="x-small" color="success" class="ml-2">Current</v-chip>
              </v-list-item-title>
              
              <v-list-item-subtitle>
                {{ session.location }} • {{ formatDate(session.date) }}
              </v-list-item-subtitle>
              
              <template v-slot:append>
                <v-btn
                  v-if="!session.current"
                  icon="mdi-logout"
                  variant="text"
                  size="small"
                  color="error"
                  @click="logoutSession(session.id)"
                ></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="logoutAllSessions"
            :loading="dialogs.loginActivity.loading"
          >
            Logout from all devices
          </v-btn>
          <v-btn
            color="primary"
            @click="dialogs.loginActivity.show = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Account Dialog -->
    <v-dialog v-model="dialogs.deleteAccount.show" max-width="500">
      <v-card>
        <v-card-title class="text-error">Delete Your Account</v-card-title>
        
        <v-card-text>
          <p class="mb-4">This action permanently deletes your account and all your data. This cannot be undone.</p>
          
          <v-text-field
            v-model="dialogs.deleteAccount.password"
            label="Enter your password to confirm"
            type="password"
            :rules="[rules.required]"
            variant="outlined"
          ></v-text-field>
          
          <v-checkbox
            v-model="dialogs.deleteAccount.confirm"
            label="I understand that this action cannot be undone"
            :rules="[v => !!v || 'You must confirm to continue']"
          ></v-checkbox>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="dialogs.deleteAccount.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :disabled="!dialogs.deleteAccount.confirm || !dialogs.deleteAccount.password"
            :loading="dialogs.deleteAccount.loading"
            @click="deleteAccount"
          >
            Delete Account
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import { format } from 'date-fns';
import { useRouter } from 'vue-router';

export default {
  name: 'AccountSettings',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    const router = useRouter();
    
    // Settings
    const settings = reactive({
      // Privacy settings
      location: true,
      orderHistory: true,
      dataCollection: true,
      
      // Security settings
      twoFactorEnabled: false,
      
      // Account preferences
      orderConfirmation: true,
      savePayment: false,
      defaultTip: '15%'
    });
    
    // State
    const saving = reactive({
      privacy: false,
      preferences: false,
      twoFactor: false
    });
    
    const exporting = ref(false);
    
    // Dialogs
    const dialogs = reactive({
      twoFactor: {
        show: false,
        step: 'setup',
        loading: false,
        qrCode: null,
        code: '',
        password: '',
        secret: ''
      },
      loginActivity: {
        show: false,
        loading: false,
        sessions: []
      },
      deleteAccount: {
        show: false,
        loading: false,
        password: '',
        confirm: false
      }
    });
    
    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      sixDigits: v => /^\d{6}$/.test(v) || 'Must be 6 digits'
    };
    
    // Options
    const tipOptions = ['0%', '10%', '15%', '18%', '20%', '25%', 'Custom'];
    
    // Load settings
    const loadSettings = async () => {
      try {
        const response = await store.dispatch('user/fetchAccountSettings');
        const data = response?.data || {};
        
        // Update settings
        settings.location = data.privacySettings?.locationSharing ?? true;
        settings.orderHistory = data.privacySettings?.shareOrderHistory ?? true;
        settings.dataCollection = data.privacySettings?.dataCollection ?? true;
        settings.twoFactorEnabled = data.securitySettings?.twoFactorEnabled ?? false;
        settings.orderConfirmation = data.preferences?.orderConfirmation ?? true;
        settings.savePayment = data.preferences?.savePaymentMethods ?? false;
        settings.defaultTip = data.preferences?.defaultTip ?? '15%';
      } catch (err) {
        console.error('Error loading account settings:', err);
        toast.error('Failed to load account settings');
      }
    };
    
    // Save settings
    const savePrivacySettings = async () => {
      saving.privacy = true;
      
      try {
        await store.dispatch('user/updatePrivacySettings', {
          locationSharing: settings.location,
          shareOrderHistory: settings.orderHistory,
          dataCollection: settings.dataCollection
        });
        
        toast.success('Privacy settings updated');
      } catch (err) {
        console.error('Error saving privacy settings:', err);
        toast.error('Failed to update privacy settings');
      } finally {
        saving.privacy = false;
      }
    };
    
    const saveAccountPreferences = async () => {
      saving.preferences = true;
      
      try {
        await store.dispatch('user/updateAccountPreferences', {
          orderConfirmation: settings.orderConfirmation,
          savePaymentMethods: settings.savePayment,
          defaultTip: settings.defaultTip
        });
        
        toast.success('Account preferences updated');
      } catch (err) {
        console.error('Error saving account preferences:', err);
        toast.error('Failed to update account preferences');
      } finally {
        saving.preferences = false;
      }
    };
    
    // Two-factor authentication
    const toggleTwoFactor = async () => {
      saving.twoFactor = true;
      
      try {
        if (settings.twoFactorEnabled) {
          // Show disable dialog
          dialogs.twoFactor.step = 'disable';
          dialogs.twoFactor.show = true;
        } else {
          // Start setup process
          const response = await store.dispatch('user/generateTwoFactorSetup');
          dialogs.twoFactor.qrCode = response.qrCode;
          dialogs.twoFactor.secret = response.secret;
          dialogs.twoFactor.step = 'setup';
          dialogs.twoFactor.show = true;
        }
      } catch (err) {
        console.error('Error with two-factor:', err);
        toast.error('Failed to configure two-factor authentication');
      } finally {
        saving.twoFactor = false;
      }
    };
    
    const completeTwoFactorSetup = async () => {
      dialogs.twoFactor.loading = true;
      
      try {
        if (dialogs.twoFactor.step === 'setup') {
          // Verify the code and enable 2FA
          await store.dispatch('user/enableTwoFactor', {
            code: dialogs.twoFactor.code,
            secret: dialogs.twoFactor.secret
          });
          
          settings.twoFactorEnabled = true;
          dialogs.twoFactor.step = 'success';
          toast.success('Two-factor authentication enabled');
        } else if (dialogs.twoFactor.step === 'disable') {
          // Disable 2FA
          await store.dispatch('user/disableTwoFactor', {
            password: dialogs.twoFactor.password
          });
          
          settings.twoFactorEnabled = false;
          dialogs.twoFactor.show = false;
          toast.success('Two-factor authentication disabled');
        }
      } catch (err) {
        console.error('Error completing two-factor setup:', err);
        toast.error(err.response?.data?.message || 'Failed to configure two-factor authentication');
      } finally {
        dialogs.twoFactor.loading = false;
      }
    };
    
    // Login Activity
    const viewLoginActivity = async () => {
      try {
        const response = await store.dispatch('user/fetchLoginActivity');
        dialogs.loginActivity.sessions = response?.data || [];
        dialogs.loginActivity.show = true;
      } catch (err) {
        console.error('Error fetching login activity:', err);
        toast.error('Failed to load login activity');
      }
    };
    
    const logoutSession = async (sessionId) => {
      try {
        await store.dispatch('user/logoutSession', sessionId);
        
        // Remove from local state
        dialogs.loginActivity.sessions = dialogs.loginActivity.sessions.filter(
          session => session.id !== sessionId
        );
        
        toast.success('Session logged out successfully');
      } catch (err) {
        console.error('Error logging out session:', err);
        toast.error('Failed to logout session');
      }
    };
    
    const logoutAllSessions = async () => {
      dialogs.loginActivity.loading = true;
      
      try {
        await store.dispatch('user/logoutAllSessions');
        
        toast.success('All other devices logged out');
        
        // Keep only current session
        dialogs.loginActivity.sessions = dialogs.loginActivity.sessions.filter(
          session => session.current
        );
      } catch (err) {
        console.error('Error logging out all sessions:', err);
        toast.error('Failed to logout all sessions');
      } finally {
        dialogs.loginActivity.loading = false;
      }
    };
    
    // Export Data
    const exportData = async () => {
      exporting.value = true;
      
      try {
        await store.dispatch('user/exportUserData');
        toast.success('Your data export has been initiated. You will receive an email when it\'s ready');
      } catch (err) {
        console.error('Error exporting data:', err);
        toast.error('Failed to export data');
      } finally {
        exporting.value = false;
      }
    };
    
    // Delete Account
    const openDeleteAccountDialog = () => {
      dialogs.deleteAccount.password = '';
      dialogs.deleteAccount.confirm = false;
      dialogs.deleteAccount.show = true;
    };
    
    const deleteAccount = async () => {
      dialogs.deleteAccount.loading = true;
      
      try {
        await store.dispatch('user/deleteAccount', {
          password: dialogs.deleteAccount.password
        });
        
        // Logout the user
        await store.dispatch('auth/logout');
        
        toast.info('Your account has been deleted');
        dialogs.deleteAccount.show = false;
        
        // Redirect to home
        router.push('/');
      } catch (err) {
        console.error('Error deleting account:', err);
        toast.error(err.response?.data?.message || 'Failed to delete account');
      } finally {
        dialogs.deleteAccount.loading = false;
      }
    };
    
    // Helpers
    const formatDate = (dateString) => {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    };
    
    const getDeviceIcon = (device) => {
      if (device.toLowerCase().includes('iphone') || device.toLowerCase().includes('ios')) {
        return 'mdi-apple';
      } else if (device.toLowerCase().includes('android')) {
        return 'mdi-android';
      } else if (device.toLowerCase().includes('mac')) {
        return 'mdi-laptop-mac';
      } else if (device.toLowerCase().includes('windows')) {
        return 'mdi-microsoft-windows';
      } else if (device.toLowerCase().includes('linux')) {
        return 'mdi-linux';
      }
      return 'mdi-laptop';
    };
    
    onMounted(loadSettings);
    
    return {
      settings,
      saving,
      exporting,
      dialogs,
      rules,
      tipOptions,
      savePrivacySettings,
      saveAccountPreferences,
      toggleTwoFactor,
      completeTwoFactorSetup,
      viewLoginActivity,
      logoutSession,
      logoutAllSessions,
      exportData,
      openDeleteAccountDialog,
      deleteAccount,
      formatDate,
      getDeviceIcon
    };
  }
};
</script>

<style scoped>
.max-width-120 {
  max-width: 120px;
}

.qr-code {
  max-width: 200px;
  max-height: 200px;
}
</style>