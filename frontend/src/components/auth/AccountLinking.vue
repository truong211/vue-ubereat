<template>
  <div class="account-linking">
    <v-card class="mb-6">
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-link-variant" class="mr-2" />
        Connected Accounts
        <v-spacer></v-spacer>
        <v-tooltip text="Link your social accounts to enable faster login">
          <template v-slot:activator="{ props }">
            <v-icon icon="mdi-information-outline" v-bind="props" size="small" />
          </template>
        </v-tooltip>
      </v-card-title>
      
      <v-card-text>
        <p class="text-body-2 mb-4">
          Link your social media accounts to enable faster login and account recovery.
        </p>
        
        <v-alert v-if="message" :type="messageType" class="mb-4" variant="tonal" density="compact">
          {{ message }}
        </v-alert>
        
        <!-- Loading state -->
        <div v-if="loading" class="d-flex justify-center py-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
        
        <!-- Linked accounts list -->
        <v-list v-else>
          <!-- Email Account -->
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar color="grey-lighten-1" size="36">
                <v-icon icon="mdi-email" size="small" />
              </v-avatar>
            </template>
            <v-list-item-title>Email</v-list-item-title>
            <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
            <template v-slot:append>
              <v-chip color="success" size="small" variant="outlined">
                Primary
              </v-chip>
            </template>
          </v-list-item>
          
          <!-- Phone Number -->
          <v-list-item v-if="user.phone">
            <template v-slot:prepend>
              <v-avatar color="grey-lighten-1" size="36">
                <v-icon icon="mdi-phone" size="small" />
              </v-avatar>
            </template>
            <v-list-item-title>Phone</v-list-item-title>
            <v-list-item-subtitle>{{ user.phone }}</v-list-item-subtitle>
            <template v-slot:append>
              <v-chip color="success" size="small" variant="outlined">
                Verified
              </v-chip>
            </template>
          </v-list-item>
          
          <!-- Phone Number Verification if not verified -->
          <v-list-item v-else>
            <template v-slot:prepend>
              <v-avatar color="grey-lighten-1" size="36">
                <v-icon icon="mdi-phone" size="small" />
              </v-avatar>
            </template>
            <v-list-item-title>Phone</v-list-item-title>
            <v-list-item-subtitle class="text-grey">Not verified</v-list-item-subtitle>
            <template v-slot:append>
              <v-btn 
                size="small" 
                variant="text" 
                color="primary"
                @click="showPhoneVerification = true"
              >
                Verify
              </v-btn>
            </template>
          </v-list-item>
          
          <!-- Google Account -->
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar color="red-lighten-4" size="36">
                <v-icon icon="mdi-google" color="error" size="small" />
              </v-avatar>
            </template>
            <v-list-item-title>Google</v-list-item-title>
            <v-list-item-subtitle v-if="linkedAccounts.google">
              {{ linkedAccounts.google.email }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-else class="text-grey">
              Not connected
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-btn 
                v-if="linkedAccounts.google"
                size="small" 
                variant="text" 
                color="error"
                @click="unlinkAccount('google')"
                :loading="unlinkLoading.google"
              >
                Unlink
              </v-btn>
              <v-btn 
                v-else
                size="small" 
                variant="outlined" 
                color="primary"
                prepend-icon="mdi-google"
                @click="linkAccount('google')"
                :loading="linkLoading.google"
              >
                Connect
              </v-btn>
            </template>
          </v-list-item>
          
          <!-- Facebook Account -->
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar color="blue-lighten-4" size="36">
                <v-icon icon="mdi-facebook" color="primary" size="small" />
              </v-avatar>
            </template>
            <v-list-item-title>Facebook</v-list-item-title>
            <v-list-item-subtitle v-if="linkedAccounts.facebook">
              {{ linkedAccounts.facebook.email || linkedAccounts.facebook.name }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-else class="text-grey">
              Not connected
            </v-list-item-subtitle>
            <template v-slot:append>
              <v-btn 
                v-if="linkedAccounts.facebook"
                size="small" 
                variant="text" 
                color="error"
                @click="unlinkAccount('facebook')"
                :loading="unlinkLoading.facebook"
              >
                Unlink
              </v-btn>
              <v-btn 
                v-else
                size="small" 
                variant="outlined" 
                color="primary"
                prepend-icon="mdi-facebook"
                @click="linkAccount('facebook')"
                :loading="linkLoading.facebook"
              >
                Connect
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
    
    <!-- Phone Verification Dialog -->
    <v-dialog v-model="showPhoneVerification" max-width="500">
      <v-card>
        <v-card-title>Verify Phone Number</v-card-title>
        <v-card-text>
          <v-stepper v-model="verificationStep">
            <!-- Step 1: Enter Phone Number -->
            <v-stepper-window-item :value="1">
              <v-form ref="phoneForm" @submit.prevent="sendPhoneOTP">
                <v-text-field
                  v-model="phoneNumber"
                  label="Phone Number"
                  hint="Include country code, e.g. +1 for US"
                  :rules="[v => !!v || 'Phone number is required', validatePhone]"
                  prepend-inner-icon="mdi-phone"
                  variant="outlined"
                  class="mb-4"
                ></v-text-field>
                
                <v-btn
                  block
                  color="primary"
                  :loading="phoneVerificationLoading"
                  type="submit"
                >
                  Send Verification Code
                </v-btn>
              </v-form>
            </v-stepper-window-item>
            
            <!-- Step 2: Enter OTP -->
            <v-stepper-window-item :value="2">
              <p class="text-body-1 mb-4">
                A verification code has been sent to {{ phoneNumber }}.
                <v-btn variant="text" size="small" @click="verificationStep = 1">
                  Change
                </v-btn>
              </p>
              
              <v-otp-input
                v-model="otpValue"
                :length="6"
                variant="outlined"
                class="mb-4"
              ></v-otp-input>
              
              <div class="d-flex align-center mb-4">
                <span class="text-caption mr-2">Didn't receive code?</span>
                <v-btn
                  variant="text"
                  size="small"
                  :disabled="resendDisabled || phoneVerificationLoading" 
                  @click="sendPhoneOTP"
                >
                  {{ resendDisabled ? `Resend in ${resendCountdown}s` : 'Resend' }}
                </v-btn>
              </div>
              
              <v-btn
                block
                color="primary"
                :loading="phoneVerificationLoading"
                :disabled="otpValue.length < 6"
                @click="verifyPhoneOTP"
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
import { defineComponent, ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from '@/composables/useToast';
import socialAuth from '@/services/social-auth';
import otpAuth from '@/services/otp-auth';

export default defineComponent({
  name: 'AccountLinking',
  
  setup() {
    const store = useStore();
    const { showToast } = useToast();
    
    // User info
    const user = computed(() => store.state.auth.user || {});
    
    // Linked accounts
    const linkedAccounts = reactive({
      google: null,
      facebook: null
    });
    
    // Loading states
    const loading = ref(false);
    const linkLoading = reactive({
      google: false,
      facebook: false
    });
    const unlinkLoading = reactive({
      google: false,
      facebook: false
    });
    
    // Phone verification
    const showPhoneVerification = ref(false);
    const verificationStep = ref(1);
    const phoneNumber = ref('');
    const otpValue = ref('');
    const phoneVerificationLoading = ref(false);
    const phoneVerificationId = ref(null);
    const phoneVerificationProvider = ref('custom');
    const resendDisabled = ref(false);
    const resendCountdown = ref(0);
    
    // Alert message
    const message = ref('');
    const messageType = ref('info');
    
    // Phone validation
    const validatePhone = (v) => {
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      return phoneRegex.test(v) || 'Please enter a valid phone number with country code (e.g. +1...)';
    };
    
    // Load linked accounts
    const loadLinkedAccounts = async () => {
      loading.value = true;
      try {
        const accounts = await socialAuth.getLinkedAccounts();
        accounts.forEach(account => {
          if (account.provider === 'google') {
            linkedAccounts.google = account;
          } else if (account.provider === 'facebook') {
            linkedAccounts.facebook = account;
          }
        });
      } catch (error) {
        console.error('Error loading linked accounts:', error);
        showToast('Failed to load linked accounts', 'error');
      } finally {
        loading.value = false;
      }
    };
    
    // Link account
    const linkAccount = async (provider) => {
      linkLoading[provider] = true;
      try {
        await socialAuth.linkSocialAccount(provider);
        showToast(`Successfully linked ${provider} account`, 'success');
        await loadLinkedAccounts();
      } catch (error) {
        console.error(`Error linking ${provider} account:`, error);
        showToast(error.message || `Failed to link ${provider} account`, 'error');
      } finally {
        linkLoading[provider] = false;
      }
    };
    
    // Unlink account
    const unlinkAccount = async (provider) => {
      unlinkLoading[provider] = true;
      try {
        await socialAuth.unlinkSocialAccount(provider);
        showToast(`Successfully unlinked ${provider} account`, 'success');
        linkedAccounts[provider] = null;
      } catch (error) {
        console.error(`Error unlinking ${provider} account:`, error);
        showToast(error.message || `Failed to unlink ${provider} account`, 'error');
      } finally {
        unlinkLoading[provider] = false;
      }
    };
    
    // Phone verification
    const sendPhoneOTP = async () => {
      if (verificationStep.value === 1) {
        if (!validatePhone(phoneNumber.value)) {
          return;
        }
      }
      
      phoneVerificationLoading.value = true;
      try {
        // Get reCAPTCHA token for verification
        const recaptchaToken = await otpAuth.getRecaptchaToken();
        
        const result = await otpAuth.sendPhoneOTP(phoneNumber.value, recaptchaToken);
        phoneVerificationId.value = result.verificationId;
        phoneVerificationProvider.value = result.provider;
        
        // Move to OTP step
        verificationStep.value = 2;
        
        // Start resend countdown
        startResendCountdown();
        
        showToast('Verification code sent successfully', 'success');
      } catch (error) {
        console.error('Error sending phone OTP:', error);
        showToast(error.message || 'Failed to send verification code', 'error');
      } finally {
        phoneVerificationLoading.value = false;
      }
    };
    
    const verifyPhoneOTP = async () => {
      if (otpValue.value.length !== 6) {
        return;
      }
      
      phoneVerificationLoading.value = true;
      try {
        await otpAuth.verifyPhoneForAccount(
          phoneNumber.value,
          otpValue.value,
          phoneVerificationId.value
        );
        
        showToast('Phone number verified successfully', 'success');
        
        // Update user info
        await store.dispatch('auth/updateUser', { 
          phone: phoneNumber.value, 
          phoneVerified: true 
        });
        
        // Close dialog
        showPhoneVerification.value = false;
        resetPhoneVerification();
      } catch (error) {
        console.error('Error verifying phone OTP:', error);
        showToast(error.message || 'Failed to verify phone number', 'error');
      } finally {
        phoneVerificationLoading.value = false;
      }
    };
    
    const startResendCountdown = () => {
      resendDisabled.value = true;
      resendCountdown.value = 60;
      
      const interval = setInterval(() => {
        resendCountdown.value--;
        if (resendCountdown.value <= 0) {
          clearInterval(interval);
          resendDisabled.value = false;
        }
      }, 1000);
    };
    
    const resetPhoneVerification = () => {
      verificationStep.value = 1;
      phoneNumber.value = '';
      otpValue.value = '';
      phoneVerificationId.value = null;
      resendDisabled.value = false;
    };
    
    // Init
    onMounted(() => {
      socialAuth.initSocialAuth();
      loadLinkedAccounts();
    });
    
    return {
      user,
      linkedAccounts,
      loading,
      linkLoading,
      unlinkLoading,
      message,
      messageType,
      showPhoneVerification,
      verificationStep,
      phoneNumber,
      otpValue,
      phoneVerificationLoading,
      resendDisabled,
      resendCountdown,
      validatePhone,
      linkAccount,
      unlinkAccount,
      sendPhoneOTP,
      verifyPhoneOTP,
    };
  }
});
</script>

<style scoped>
.account-linking {
  max-width: 100%;
}
</style> 