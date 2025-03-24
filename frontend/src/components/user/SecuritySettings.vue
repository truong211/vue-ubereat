<template>
  <div class="security-settings">
    <v-card class="mb-6">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-shield-lock" class="mr-2" />
        Password
      </v-card-title>
      
      <v-card-text>
        <v-form ref="passwordForm" @submit.prevent="changePassword" v-model="isPasswordFormValid">
          <v-text-field
            v-model="passwordData.currentPassword"
            label="Current Password"
            type="password"
            :rules="[rules.required]"
            variant="outlined"
            hide-details="auto"
            class="mb-4"
          ></v-text-field>
          
          <v-text-field
            v-model="passwordData.newPassword"
            label="New Password"
            type="password"
            :rules="[rules.required, rules.password]"
            variant="outlined"
            hide-details="auto"
            class="mb-4"
          ></v-text-field>
          
          <v-text-field
            v-model="passwordData.confirmPassword"
            label="Confirm New Password"
            type="password"
            :rules="[rules.required, rules.passwordMatch(passwordData.newPassword)]"
            variant="outlined"
            hide-details="auto"
            class="mb-4"
          ></v-text-field>
          
          <v-alert
            v-if="passwordError"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ passwordError }}
          </v-alert>
          
          <div class="d-flex justify-end">
            <v-btn
              type="submit"
              color="primary"
              :loading="passwordLoading"
              :disabled="!isPasswordFormValid"
            >
              Change Password
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
    
    <v-card class="mb-6">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-two-factor-authentication" class="mr-2" />
        Two-Factor Authentication
      </v-card-title>
      
      <v-card-text>
        <p class="text-body-2 mb-4">
          Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to sign in.
        </p>
        
        <v-list>
          <v-list-item>
            <template v-slot:prepend>
              <v-icon icon="mdi-cellphone" color="primary"></v-icon>
            </template>
            <v-list-item-title>Text Message (SMS)</v-list-item-title>
            <v-list-item-subtitle v-if="twoFactorMethods.sms">
              Enabled for {{ twoFactorMethods.sms }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-else>
              Not enabled
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-btn
                v-if="twoFactorMethods.sms"
                variant="text"
                color="error"
                @click="disableTwoFactor('sms')"
                :loading="twoFactorLoading.sms"
              >
                Disable
              </v-btn>
              <v-btn
                v-else
                variant="outlined"
                color="primary"
                @click="enableTwoFactor('sms')"
                :loading="twoFactorLoading.sms"
              >
                Enable
              </v-btn>
            </template>
          </v-list-item>
          
          <v-list-item>
            <template v-slot:prepend>
              <v-icon icon="mdi-email" color="primary"></v-icon>
            </template>
            <v-list-item-title>Email</v-list-item-title>
            <v-list-item-subtitle v-if="twoFactorMethods.email">
              Enabled for {{ twoFactorMethods.email }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-else>
              Not enabled
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-btn
                v-if="twoFactorMethods.email"
                variant="text"
                color="error"
                @click="disableTwoFactor('email')"
                :loading="twoFactorLoading.email"
              >
                Disable
              </v-btn>
              <v-btn
                v-else
                variant="outlined"
                color="primary"
                @click="enableTwoFactor('email')"
                :loading="twoFactorLoading.email"
              >
                Enable
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-account-lock" class="mr-2" />
        Login Sessions
      </v-card-title>
      
      <v-card-text>
        <p class="text-body-2 mb-4">
          These are the devices where you're currently logged in. You can log out of any session that you don't recognize.
        </p>
        
        <v-list>
          <v-list-item v-for="(session, index) in sessions" :key="index">
            <template v-slot:prepend>
              <v-icon :icon="getDeviceIcon(session.device)" color="primary"></v-icon>
            </template>
            <v-list-item-title>{{ session.device }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ session.location }} • {{ session.lastActive }}
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-chip v-if="session.current" color="primary" size="small" variant="outlined">
                Current
              </v-chip>
              <v-btn
                v-else
                variant="text"
                color="error"
                @click="logoutSession(session.id)"
                :loading="session.loading"
              >
                Logout
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    
    <!-- 2FA Dialogs -->
    <v-dialog v-model="showSMSVerification" max-width="500">
      <v-card>
        <v-card-title>Enable SMS Authentication</v-card-title>
        <v-card-text>
          <v-stepper v-model="smsStep">
            <v-stepper-window-item :value="1">
              <v-form ref="smsPhoneForm" @submit.prevent="sendSmsCode">
                <v-text-field
                  v-model="smsPhone"
                  label="Phone Number"
                  hint="Include country code, e.g. +1 for US"
                  :rules="[rules.required, rules.phone]"
                  variant="outlined"
                  class="mb-4"
                ></v-text-field>
                
                <v-btn
                  block
                  color="primary"
                  type="submit"
                  :loading="smsVerificationLoading"
                >
                  Send Verification Code
                </v-btn>
              </v-form>
            </v-stepper-window-item>
            
            <v-stepper-window-item :value="2">
              <p class="text-body-1 mb-4">
                A verification code has been sent to {{ smsPhone }}
              </p>
              
              <v-otp-input
                v-model="smsOtpValue"
                :length="6"
                variant="outlined"
                class="mb-4"
              ></v-otp-input>
              
              <v-btn
                block
                color="primary"
                :loading="smsVerificationLoading"
                :disabled="smsOtpValue.length < 6"
                @click="verifySmsCode"
              >
                Verify
              </v-btn>
            </v-stepper-window-item>
          </v-stepper>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';

export default {
  name: 'SecuritySettings',
  
  setup() {
    const passwordForm = ref(null);
    const isPasswordFormValid = ref(false);
    const passwordLoading = ref(false);
    const passwordError = ref('');
    
    // Password data
    const passwordData = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    // Two-factor authentication methods
    const twoFactorMethods = reactive({
      sms: null,
      email: null
    });
    
    const twoFactorLoading = reactive({
      sms: false,
      email: false
    });
    
    // SMS verification
    const showSMSVerification = ref(false);
    const smsStep = ref(1);
    const smsPhone = ref('');
    const smsOtpValue = ref('');
    const smsVerificationLoading = ref(false);
    
    // Login sessions
    const sessions = ref([
      { 
        id: '1',
        device: 'Chrome on Windows',
        location: 'Ho Chi Minh City, Vietnam',
        lastActive: 'Now',
        current: true,
        loading: false
      },
      {
        id: '2',
        device: 'Firefox on Mac',
        location: 'Hanoi, Vietnam',
        lastActive: '2 days ago',
        current: false,
        loading: false
      },
      {
        id: '3',
        device: 'Safari on iPhone',
        location: 'Ho Chi Minh City, Vietnam',
        lastActive: '5 days ago',
        current: false,
        loading: false
      }
    ]);
    
    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      password: v => v.length >= 8 || 'Password must be at least 8 characters',
      passwordMatch: (password) => (v) => v === password || 'Passwords do not match',
      phone: v => /^\+[0-9]{10,15}$/.test(v) || 'Valid phone number with country code required (e.g. +1...)'
    };
    
    // Change password
    const changePassword = async () => {
      if (!passwordForm.value.validate()) return;
      
      passwordLoading.value = true;
      passwordError.value = '';
      
      try {
        // Call your API here to change password
        // Example: await axios.post('/api/user/change-password', passwordData);
        
        // Reset form
        passwordData.currentPassword = '';
        passwordData.newPassword = '';
        passwordData.confirmPassword = '';
        passwordForm.value.reset();
        
        // Show success message
        alert('Password changed successfully');
      } catch (err) {
        passwordError.value = err.message || 'Failed to change password';
      } finally {
        passwordLoading.value = false;
      }
    };
    
    // Enable 2FA
    const enableTwoFactor = (method) => {
      twoFactorLoading[method] = true;
      
      if (method === 'sms') {
        showSMSVerification.value = true;
        smsStep.value = 1;
      } else if (method === 'email') {
        // Handle email 2FA setup
        // ...
        
        // For demo purposes
        setTimeout(() => {
          twoFactorMethods.email = 'user@example.com';
          twoFactorLoading.email = false;
        }, 1500);
      }
    };
    
    // Disable 2FA
    const disableTwoFactor = async (method) => {
      twoFactorLoading[method] = true;
      
      try {
        // Call your API here to disable 2FA
        // Example: await axios.post('/api/user/2fa/disable', { method });
        
        // For demo purposes
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        twoFactorMethods[method] = null;
      } catch (err) {
        alert('Failed to disable 2FA: ' + (err.message || 'Unknown error'));
      } finally {
        twoFactorLoading[method] = false;
      }
    };
    
    // Send SMS verification code
    const sendSmsCode = async () => {
      smsVerificationLoading.value = true;
      
      try {
        // Call your API here to send SMS code
        // Example: await axios.post('/api/user/2fa/sms/send', { phone: smsPhone.value });
        
        // For demo purposes
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        smsStep.value = 2;
      } catch (err) {
        alert('Failed to send verification code: ' + (err.message || 'Unknown error'));
      } finally {
        smsVerificationLoading.value = false;
      }
    };
    
    // Verify SMS code
    const verifySmsCode = async () => {
      smsVerificationLoading.value = true;
      
      try {
        // Call your API here to verify SMS code
        // Example: await axios.post('/api/user/2fa/sms/verify', { phone: smsPhone.value, code: smsOtpValue.value });
        
        // For demo purposes
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        twoFactorMethods.sms = smsPhone.value;
        showSMSVerification.value = false;
        smsOtpValue.value = '';
      } catch (err) {
        alert('Failed to verify code: ' + (err.message || 'Unknown error'));
      } finally {
        smsVerificationLoading.value = false;
        twoFactorLoading.sms = false;
      }
    };
    
    // Logout session
    const logoutSession = async (sessionId) => {
      const session = sessions.value.find(s => s.id === sessionId);
      if (session) {
        session.loading = true;
        
        try {
          // Call your API here to logout session
          // Example: await axios.post('/api/user/sessions/logout', { sessionId });
          
          // For demo purposes
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          sessions.value = sessions.value.filter(s => s.id !== sessionId);
        } catch (err) {
          alert('Failed to logout session: ' + (err.message || 'Unknown error'));
          session.loading = false;
        }
      }
    };
    
    // Get device icon
    const getDeviceIcon = (device) => {
      if (device.includes('iPhone') || device.includes('Android')) {
        return 'mdi-cellphone';
      } else if (device.includes('iPad') || device.includes('Tablet')) {
        return 'mdi-tablet';
      } else {
        return 'mdi-laptop';
      }
    };
    
    // Load security settings
    const loadSecuritySettings = async () => {
      try {
        // Call your API here to load security settings
        // Example: const response = await axios.get('/api/user/security');
        
        // For demo purposes - you would normally load this from your API
        // ...
      } catch (err) {
        console.error('Failed to load security settings:', err);
      }
    };
    
    // Load data on mount
    onMounted(() => {
      loadSecuritySettings();
    });
    
    return {
      passwordForm,
      isPasswordFormValid,
      passwordLoading,
      passwordError,
      passwordData,
      twoFactorMethods,
      twoFactorLoading,
      showSMSVerification,
      smsStep,
      smsPhone,
      smsOtpValue,
      smsVerificationLoading,
      sessions,
      rules,
      changePassword,
      enableTwoFactor,
      disableTwoFactor,
      sendSmsCode,
      verifySmsCode,
      logoutSession,
      getDeviceIcon
    };
  }
};
</script>

<style scoped>
.security-settings {
  max-width: 100%;
}
</style> 