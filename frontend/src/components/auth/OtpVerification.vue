<template>
  <v-form @submit.prevent="handleSubmit">
    <v-container>
      <v-card class="mb-4">
        <v-card-title class="text-center">Verify Your Account</v-card-title>
        <v-card-text>
          <p class="text-body-1 mb-4">
            Please enter the verification codes sent to your {{ verificationMethods }}.
          </p>

          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="mb-4"
            closable
            @click:close="error = null"
          >
            {{ error }}
          </v-alert>

          <template v-if="shouldVerifyEmail">
            <p class="text-subtitle-2 mb-2">
              <v-icon icon="mdi-email-outline" class="mr-1" />
              Email Code
              <span class="text-caption text-medium-emphasis">
                (sent to {{ maskedEmail }})
              </span>
            </p>
            <v-otp-input
              v-model="emailOtp"
              length="6"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              class="mb-4"
            ></v-otp-input>
          </template>

          <template v-if="shouldVerifyPhone">
            <p class="text-subtitle-2 mb-2">
              <v-icon icon="mdi-phone-outline" class="mr-1" />
              SMS Code
              <span class="text-caption text-medium-emphasis">
                (sent to {{ maskedPhone }})
              </span>
            </p>
            <v-otp-input
              v-model="phoneOtp"
              length="6"
              :loading="isSubmitting"
              :disabled="isSubmitting"
              class="mb-4"
            ></v-otp-input>
          </template>

          <div class="d-flex justify-space-between align-center mt-6">
            <v-btn
              variant="text"
              :disabled="resendDisabled"
              @click="handleResendOtp"
              :loading="isResending"
            >
              Resend Codes
            </v-btn>
            <span v-if="resendDisabled" class="text-caption">
              Resend available in {{ resendCountdown }}s
            </span>
          </div>
        </v-card-text>
      </v-card>

      <v-btn
        type="submit"
        color="primary"
        block
        size="large"
        :loading="isSubmitting"
        :disabled="isSubmitting || !isFormValid"
      >
        Verify
      </v-btn>
    </v-container>
  </v-form>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

const store = useStore();
const router = useRouter();

// Form data
const emailOtp = ref('');
const phoneOtp = ref('');
const isSubmitting = ref(false);
const isResending = ref(false);
const error = ref(null);

// Resend countdown
const resendDisabled = ref(true);
const resendCountdown = ref(60);
let countdownInterval = null;

// Computed properties
const registrationData = computed(() => store.getters['auth/registrationData']);

const shouldVerifyEmail = computed(() => 
  registrationData.value && 
  registrationData.value.email && 
  registrationData.value.emailVerificationId
);

const shouldVerifyPhone = computed(() => 
  registrationData.value && 
  registrationData.value.phone && 
  registrationData.value.phoneVerificationId
);

const maskedEmail = computed(() => {
  if (!registrationData.value?.email) return '';
  const email = registrationData.value.email;
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
});

const maskedPhone = computed(() => {
  if (!registrationData.value?.phone) return '';
  const phone = registrationData.value.phone;
  return phone.slice(0, 3) + '*'.repeat(phone.length - 7) + phone.slice(-4);
});

const verificationMethods = computed(() => {
  if (shouldVerifyEmail.value && shouldVerifyPhone.value) {
    return 'email and phone';
  } else if (shouldVerifyEmail.value) {
    return 'email';
  } else if (shouldVerifyPhone.value) {
    return 'phone';
  }
  return '';
});

const isFormValid = computed(() => {
  if (shouldVerifyEmail.value && (!emailOtp.value || emailOtp.value.length !== 6)) {
    return false;
  }
  
  if (shouldVerifyPhone.value && (!phoneOtp.value || phoneOtp.value.length !== 6)) {
    return false;
  }
  
  return true;
});

// Methods
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

const handleSubmit = async () => {
  if (!isFormValid.value) return;
  
  isSubmitting.value = true;
  error.value = null;
  
  try {
    const otpData = {
      emailOtp: emailOtp.value,
      phoneOtp: phoneOtp.value
    };
    
    await store.dispatch('auth/completeRegistration', otpData);
    
    // Redirect to home page or confirmation page
    router.push('/');
  } catch (err) {
    console.error('OTP verification error:', err);
    error.value = err.message || 'Failed to verify OTP codes';
  } finally {
    isSubmitting.value = false;
  }
};

const handleResendOtp = async () => {
  if (resendDisabled.value) return;
  
  isResending.value = true;
  error.value = null;
  
  try {
    await store.dispatch('auth/resendOTP');
    startResendCountdown();
  } catch (err) {
    console.error('Error resending OTP:', err);
    error.value = err.message || 'Failed to resend verification codes';
  } finally {
    isResending.value = false;
  }
};

// Lifecycle hooks
onMounted(() => {
  // Check if we have registration data
  if (!registrationData.value) {
    // If no registration data, redirect to registration page
    router.replace('/auth/register');
    return;
  }
  
  startResendCountdown();
});

onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});

// Watch for verification step changes
watch(
  () => store.getters['auth/verificationStep'],
  (step) => {
    if (step === 3) {
      // Registration complete, redirect to home or success page
      router.push('/');
    }
  }
);
</script>

<style scoped>
.v-card {
  border-radius: 8px;
}

.v-card-title {
  font-size: 1.5rem;
  padding: 16px;
}

.v-card-text {
  padding: 16px;
}
</style>