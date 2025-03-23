<template>
  <div class="verify-otp-container">
    <div class="verify-otp-form">
      <v-card class="pa-6 rounded-lg elevation-3">
        <h2 class="text-h5 font-weight-bold text-center mb-4">Xác thực OTP</h2>
        
        <v-alert
          v-if="message"
          :type="messageType"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="message = ''"
        >
          {{ message }}
        </v-alert>
        
        <div v-if="!verified">
          <div class="text-center mb-4">
            <p class="mb-2">Vui lòng nhập mã xác thực đã được gửi đến</p>
            <p class="font-weight-bold" v-if="verificationType === 'email'">
              {{ maskEmail(contactInfo) }}
            </p>
            <p class="font-weight-bold" v-else-if="verificationType === 'phone'">
              {{ maskPhone(contactInfo) }}
            </p>
          </div>
          
          <!-- OTP Input -->
          <div class="d-flex justify-center gap-2 mb-6">
            <v-text-field
              v-for="(digit, index) in otpDigits"
              :key="index"
              v-model="otpDigits[index]"
              variant="outlined"
              hide-details
              class="otp-input"
              maxlength="1"
              type="text"
              @input="onOtpDigitInput(index)"
              @keydown="onOtpKeyDown($event, index)"
              @paste="onOtpPaste"
              :ref="el => { if (el) otpRefs[index] = el }"
            ></v-text-field>
          </div>
          
          <div class="d-flex flex-column gap-4">
            <v-btn
              color="primary"
              block
              size="large"
              :loading="isLoading"
              :disabled="!isOtpComplete || isLoading"
              @click="verifyOTP"
            >
              Xác thực
            </v-btn>
            
            <v-btn
              variant="text"
              block
              :disabled="resendCountdown > 0 || isLoading"
              @click="resendOTP"
            >
              {{ resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : 'Gửi lại mã' }}
            </v-btn>
          </div>
        </div>
        
        <div v-else class="text-center py-4">
          <v-icon
            icon="mdi-check-circle"
            color="success"
            size="64"
            class="mb-4"
          ></v-icon>
          
          <h3 class="text-h5 font-weight-bold mb-2">Xác thực thành công!</h3>
          <p class="text-body-1 mb-6">
            OTP đã được xác thực thành công.
          </p>
          
          <v-btn
            color="primary"
            size="large"
            @click="goToNext"
          >
            Tiếp tục
          </v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'VerifyOTP',
  
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    
    // OTP data
    const verificationType = ref(''); // 'email' or 'phone'
    const contactInfo = ref('');
    const verificationId = ref('');
    const redirectPath = ref('');
    const verified = ref(false);
    
    // OTP input
    const otpDigits = ref(['', '', '', '', '', '']);
    const otpRefs = ref([]);
    
    // UI state
    const message = ref('');
    const messageType = ref('info');
    const resendCountdown = ref(0);
    let countdownTimer = null;
    
    // Computed
    const isLoading = computed(() => store.getters['auth/loading']);
    const isOtpComplete = computed(() => otpDigits.value.every(digit => digit !== ''));
    
    // Methods
    const verifyOTP = async () => {
      if (!isOtpComplete.value) return;
      
      try {
        message.value = '';
        
        // Combine OTP digits
        const otp = otpDigits.value.join('');
        
        // Create payload based on verification type
        const payload = {
          otp,
          verificationId: verificationId.value
        };
        
        if (verificationType.value === 'email') {
          payload.email = contactInfo.value;
          await store.dispatch('auth/verifyEmailOTP', otp);
        } else if (verificationType.value === 'phone') {
          payload.phone = contactInfo.value;
          await store.dispatch('auth/verifyPhoneOTP', otp);
        }
        
        // Mark as verified
        verified.value = true;
        
      } catch (error) {
        message.value = error || 'Mã xác thực không hợp lệ. Vui lòng thử lại.';
        messageType.value = 'error';
      }
    };
    
    const resendOTP = async () => {
      if (resendCountdown.value > 0) return;
      
      try {
        message.value = '';
        
        // Resend OTP based on verification type
        if (verificationType.value === 'email') {
          await store.dispatch('auth/resendEmailOTP');
        } else if (verificationType.value === 'phone') {
          await store.dispatch('auth/resendPhoneOTP');
        }
        
        // Start resend countdown
        startResendCountdown();
        
        message.value = 'Mã xác thực đã được gửi lại';
        messageType.value = 'success';
        
      } catch (error) {
        message.value = error || 'Không thể gửi lại mã. Vui lòng thử lại.';
        messageType.value = 'error';
      }
    };
    
    const goToNext = () => {
      if (redirectPath.value) {
        router.push(redirectPath.value);
      } else {
        router.push('/');
      }
    };
    
    const startResendCountdown = () => {
      resendCountdown.value = 30;
      
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
      
      countdownTimer = setInterval(() => {
        if (resendCountdown.value > 0) {
          resendCountdown.value -= 1;
        } else {
          clearInterval(countdownTimer);
        }
      }, 1000);
    };
    
    // Helper methods
    const maskEmail = (email) => {
      if (!email) return '';
      const [username, domain] = email.split('@');
      const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
      return `${maskedUsername}@${domain}`;
    };
    
    const maskPhone = (phone) => {
      if (!phone) return '';
      return phone.slice(0, 3) + '*'.repeat(phone.length - 7) + phone.slice(-4);
    };
    
    const onOtpDigitInput = (index) => {
      // Auto focus next input on digit entry
      if (otpDigits.value[index] && index < 5) {
        otpRefs.value[index + 1]?.focus();
      }
    };
    
    const onOtpKeyDown = (event, index) => {
      // Handle backspace navigation
      if (event.key === 'Backspace') {
        if (!otpDigits.value[index] && index > 0) {
          otpDigits.value[index - 1] = '';
          otpRefs.value[index - 1]?.focus();
        }
      }
    };
    
    const onOtpPaste = (event) => {
      event.preventDefault();
      
      // Get clipboard data
      const pasteData = event.clipboardData.getData('text/plain').trim();
      
      // Try to extract digits
      const digits = pasteData.replace(/\D/g, '').split('').slice(0, 6);
      
      // Fill in digits
      digits.forEach((digit, index) => {
        if (index < 6) {
          otpDigits.value[index] = digit;
        }
      });
      
      // Focus on the appropriate input
      if (digits.length < 6) {
        otpRefs.value[digits.length]?.focus();
      }
    };
    
    // Initialization
    onMounted(() => {
      // Get verification data from route params or query
      verificationType.value = route.query.type || '';
      contactInfo.value = route.query.contact || '';
      verificationId.value = route.query.id || '';
      redirectPath.value = route.query.redirect || '';
      
      // Validate that we have the required data
      if (!verificationType.value || !contactInfo.value) {
        message.value = 'Thông tin xác thực không hợp lệ. Vui lòng thử lại.';
        messageType.value = 'error';
      } else {
        // Start resend countdown
        startResendCountdown();
      }
    });
    
    // Cleanup
    onUnmounted(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    });
    
    return {
      verificationType,
      contactInfo,
      otpDigits,
      otpRefs,
      message,
      messageType,
      isLoading,
      isOtpComplete,
      resendCountdown,
      verified,
      verifyOTP,
      resendOTP,
      goToNext,
      maskEmail,
      maskPhone,
      onOtpDigitInput,
      onOtpKeyDown,
      onOtpPaste
    };
  }
};
</script>

<style scoped>
.verify-otp-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.verify-otp-form {
  width: 100%;
  max-width: 500px;
}

.otp-input {
  width: 50px !important;
  text-align: center;
}

/* Hide spin buttons for number inputs */
.otp-input :deep(input[type=number]) {
  -moz-appearance: textfield;
}

.otp-input :deep(input[type=number]::-webkit-outer-spin-button),
.otp-input :deep(input[type=number]::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}
</style>