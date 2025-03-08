<template>
  <v-container>
    <v-row justify="center" align="center" class="min-vh-100">
      <v-col cols="12" sm="8" md="6" lg="5">
        <v-card class="mx-auto" elevation="4">
          <v-card-title class="text-center py-4 text-h5 primary white--text">
            Reset Your Password
          </v-card-title>
          
          <v-card-text class="pa-4">
            <v-stepper v-model="currentStep" class="elevation-0">
              <v-stepper-header class="elevation-0">
                <v-stepper-item :value="1" :complete="currentStep > 1">
                  Request
                </v-stepper-item>
                <v-divider></v-divider>
                <v-stepper-item :value="2" :complete="currentStep > 2">
                  Verify
                </v-stepper-item>
                <v-divider></v-divider>
                <v-stepper-item :value="3" :complete="currentStep > 3">
                  Reset
                </v-stepper-item>
              </v-stepper-header>

              <v-stepper-window>
                <!-- Step 1: Request Password Reset -->
                <v-stepper-window-item :value="1">
                  <p class="text-body-1 mb-4">
                    Enter your email address or phone number to receive a verification code.
                  </p>
                  
                  <v-alert v-if="error" type="error" class="mb-4" variant="tonal" closable @click:close="error = null">
                    {{ error }}
                  </v-alert>
                  
                  <v-form ref="requestForm" @submit.prevent="sendVerificationCode">
                    <v-tabs v-model="resetMethod" grow class="mb-4">
                      <v-tab value="email">Email</v-tab>
                      <v-tab value="phone">Phone</v-tab>
                    </v-tabs>
                    
                    <v-window v-model="resetMethod">
                      <v-window-item value="email">
                        <v-text-field
                          v-model="email"
                          label="Email Address"
                          type="email"
                          :rules="emailRules"
                          variant="outlined"
                          prepend-inner-icon="mdi-email"
                          required
                        ></v-text-field>
                      </v-window-item>
                      
                      <v-window-item value="phone">
                        <v-text-field
                          v-model="phone"
                          label="Phone Number"
                          type="tel"
                          :rules="phoneRules"
                          variant="outlined"
                          prepend-inner-icon="mdi-phone"
                          required
                        ></v-text-field>
                      </v-window-item>
                    </v-window>
                    
                    <v-btn
                      type="submit"
                      color="primary"
                      block
                      :loading="loading"
                      class="mt-4"
                    >
                      Send Verification Code
                    </v-btn>
                  </v-form>
                </v-stepper-window-item>
                
                <!-- Step 2: Verify OTP -->
                <v-stepper-window-item :value="2">
                  <p class="text-body-1 mb-4">
                    Enter the 6-digit verification code sent to 
                    <strong>{{ resetMethod === 'email' ? email : phone }}</strong>
                  </p>
                  
                  <v-alert v-if="error" type="error" class="mb-4" variant="tonal" closable @click:close="error = null">
                    {{ error }}
                  </v-alert>
                  
                  <v-form ref="otpForm" @submit.prevent="verifyCode">
                    <v-otp-input
                      v-model="otp"
                      length="6"
                      :loading="loading"
                      :disabled="loading"
                      class="mb-4"
                    ></v-otp-input>
                    
                    <div class="d-flex justify-space-between align-center mb-4">
                      <v-btn
                        variant="text"
                        @click="resendCode"
                        :disabled="resendDisabled"
                      >
                        Resend Code
                      </v-btn>
                      <span v-if="resendDisabled" class="text-caption">
                        Resend in {{ resendCountdown }}s
                      </span>
                    </div>
                    
                    <v-btn
                      type="submit"
                      color="primary"
                      block
                      :loading="loading"
                      :disabled="otp.length !== 6"
                    >
                      Verify Code
                    </v-btn>
                  </v-form>
                </v-stepper-window-item>
                
                <!-- Step 3: Reset Password -->
                <v-stepper-window-item :value="3">
                  <p class="text-body-1 mb-4">
                    Create a new password for your account
                  </p>
                  
                  <v-alert v-if="error" type="error" class="mb-4" variant="tonal" closable @click:close="error = null">
                    {{ error }}
                  </v-alert>
                  
                  <v-form ref="passwordForm" @submit.prevent="resetPassword">
                    <v-text-field
                      v-model="newPassword"
                      label="New Password"
                      :type="showPassword ? 'text' : 'password'"
                      :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                      :rules="passwordRules"
                      variant="outlined"
                      prepend-inner-icon="mdi-lock"
                      required
                      @click:append-inner="showPassword = !showPassword"
                      class="mb-4"
                    ></v-text-field>
                    
                    <v-text-field
                      v-model="confirmPassword"
                      label="Confirm Password"
                      :type="showPassword ? 'text' : 'password'"
                      :rules="confirmPasswordRules"
                      variant="outlined"
                      prepend-inner-icon="mdi-lock-check"
                      required
                      class="mb-4"
                    ></v-text-field>
                    
                    <v-btn
                      type="submit"
                      color="primary"
                      block
                      :loading="loading"
                    >
                      Reset Password
                    </v-btn>
                  </v-form>
                </v-stepper-window-item>
                
                <!-- Step 4: Success -->
                <v-stepper-window-item :value="4">
                  <div class="text-center py-4">
                    <v-icon icon="mdi-check-circle" color="success" size="64" class="mb-4"></v-icon>
                    <h3 class="text-h5 mb-2">Password Reset Successful!</h3>
                    <p class="text-body-1 mb-6">Your password has been updated successfully.</p>
                    <v-btn color="primary" to="/auth/login">
                      Go to Login
                    </v-btn>
                  </div>
                </v-stepper-window-item>
              </v-stepper-window>
            </v-stepper>
          </v-card-text>
          
          <v-card-actions v-if="currentStep < 4" class="pa-4 pt-0">
            <v-btn variant="text" to="/auth/login" class="text-decoration-none">
              Back to Login
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn v-if="currentStep > 1" variant="text" @click="currentStep--">
              Back
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import otpAuth from '@/services/otp-auth';

const store = useStore();
const router = useRouter();

// State
const currentStep = ref(1);
const resetMethod = ref('email');
const loading = ref(false);
const error = ref(null);
const showPassword = ref(false);
const verificationId = ref('');

// Form fields
const email = ref('');
const phone = ref('');
const otp = ref('');
const newPassword = ref('');
const confirmPassword = ref('');

// Resend code functionality
const resendDisabled = ref(false);
const resendCountdown = ref(60);
let countdownInterval = null;

// Form references
const requestForm = ref(null);
const otpForm = ref(null);
const passwordForm = ref(null);

// Validation rules
const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
];

const phoneRules = [
  v => !!v || 'Phone number is required',
  v => /^\+?[1-9]\d{9,14}$/.test(v) || 'Enter a valid phone number'
];

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 8 || 'Password must be at least 8 characters',
  v => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
  v => /[0-9]/.test(v) || 'Password must contain at least one number'
];

const confirmPasswordRules = [
  v => !!v || 'Please confirm your password',
  v => v === newPassword.value || 'Passwords do not match'
];

// Start resend countdown
const startResendCountdown = () => {
  resendDisabled.value = true;
  resendCountdown.value = 60;
  
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
  
  countdownInterval = setInterval(() => {
    if (resendCountdown.value > 0) {
      resendCountdown.value--;
    } else {
      resendDisabled.value = false;
      clearInterval(countdownInterval);
    }
  }, 1000);
};

// Send verification code
const sendVerificationCode = async () => {
  const { valid } = await requestForm.value.validate();
  if (!valid) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    let result;
    
    if (resetMethod.value === 'email') {
      result = await otpAuth.requestPasswordResetOTP(email.value);
    } else {
      result = await otpAuth.sendPhoneOTP(phone.value);
    }
    
    verificationId.value = result.verificationId;
    currentStep.value = 2;
    startResendCountdown();
  } catch (err) {
    error.value = err.message || 'Failed to send verification code';
  } finally {
    loading.value = false;
  }
};

// Verify code
const verifyCode = async () => {
  if (otp.value.length !== 6) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    await otpAuth.verifyOTP({
      verificationId: verificationId.value,
      otp: otp.value
    });
    
    currentStep.value = 3;
  } catch (err) {
    error.value = err.message || 'Invalid verification code';
  } finally {
    loading.value = false;
  }
};

// Resend code
const resendCode = async () => {
  if (resendDisabled.value) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    let result;
    
    if (resetMethod.value === 'email') {
      result = await otpAuth.requestPasswordResetOTP(email.value);
    } else {
      result = await otpAuth.sendPhoneOTP(phone.value);
    }
    
    verificationId.value = result.verificationId;
    startResendCountdown();
  } catch (err) {
    error.value = err.message || 'Failed to resend verification code';
  } finally {
    loading.value = false;
  }
};

// Reset password
const resetPassword = async () => {
  const { valid } = await passwordForm.value.validate();
  if (!valid) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    await store.dispatch('auth/resetPasswordWithOTP', {
      verificationId: verificationId.value,
      otp: otp.value,
      newPassword: newPassword.value
    });
    
    currentStep.value = 4;
  } catch (err) {
    error.value = err.message || 'Failed to reset password';
  } finally {
    loading.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  // Clean up any previous state
  verificationId.value = '';
  otp.value = '';
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
</script>

<style scoped>
.min-vh-100 {
  min-height: 100vh;
}

.v-card-title.primary {
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
</style>
