<template>
  <div class="forgot-password-container">
    <div class="forgot-password-form">
      <v-card class="pa-6 rounded-lg elevation-3">
        <v-stepper v-model="currentStep" class="elevation-0">
          <v-stepper-header class="mb-4">
            <v-stepper-item value="1" title="Xác nhận"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item value="2" title="Xác thực"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item value="3" title="Đặt lại mật khẩu"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item value="4" title="Hoàn tất"></v-stepper-item>
          </v-stepper-header>
          
          <v-stepper-window>
            <!-- Step 1: Enter Email -->
            <v-stepper-window-item value="1">
              <h2 class="text-h5 font-weight-bold text-center mb-4">Quên mật khẩu</h2>
              
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
              
              <p class="text-body-1 mb-6 text-center">
                Vui lòng nhập địa chỉ email hoặc số điện thoại bạn đã đăng ký. Chúng tôi sẽ gửi mã xác thực để đặt lại mật khẩu.
              </p>
              
              <v-form ref="emailForm" @submit.prevent="requestReset" v-model="isEmailFormValid">
                <!-- Contact method selection -->
                <v-btn-toggle
                  v-model="contactMethod"
                  mandatory
                  class="d-flex mb-4"
                >
                  <v-btn value="email" prepend-icon="mdi-email" class="flex-grow-1">Email</v-btn>
                  <v-btn value="phone" prepend-icon="mdi-phone" class="flex-grow-1">Điện thoại</v-btn>
                </v-btn-toggle>
                
                <!-- Email input -->
                <v-text-field
                  v-if="contactMethod === 'email'"
                  v-model="contactInfo"
                  label="Email"
                  type="email"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Vui lòng nhập email',
                    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email không hợp lệ'
                  ]"
                  prepend-inner-icon="mdi-email"
                  required
                  class="mb-6"
                ></v-text-field>
                
                <!-- Phone input -->
                <v-text-field
                  v-if="contactMethod === 'phone'"
                  v-model="contactInfo"
                  label="Số điện thoại"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Vui lòng nhập số điện thoại',
                    v => /^\+?[0-9]{10,12}$/.test(v) || 'Số điện thoại không hợp lệ'
                  ]"
                  prepend-inner-icon="mdi-phone"
                  required
                  class="mb-6"
                ></v-text-field>
                
                <v-btn
                  type="submit"
                  color="primary"
                  block
                  size="large"
                  :loading="isLoading"
                  :disabled="!isEmailFormValid || isLoading"
                  class="mb-6"
                >
                  Tiếp tục
                </v-btn>
                
                <div class="text-center">
                  <router-link to="/auth/login" class="text-decoration-none">
                    Quay lại trang đăng nhập
                  </router-link>
                </div>
              </v-form>
            </v-stepper-window-item>
            
            <!-- Step 2: Enter OTP -->
            <v-stepper-window-item value="2">
              <h2 class="text-h5 font-weight-bold text-center mb-4">Nhập mã xác thực</h2>
              
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
              
              <div class="text-center mb-6">
                <p class="mb-2">Chúng tôi đã gửi mã xác thực đến</p>
                <p class="font-weight-bold" v-if="contactMethod === 'email'">
                  {{ maskEmail(contactInfo) }}
                </p>
                <p class="font-weight-bold" v-else>
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
            </v-stepper-window-item>
            
            <!-- Step 3: Reset Password -->
            <v-stepper-window-item value="3">
              <h2 class="text-h5 font-weight-bold text-center mb-4">Đặt lại mật khẩu</h2>
              
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
              
              <v-form ref="passwordForm" @submit.prevent="resetPassword" v-model="isPasswordFormValid">
                <v-text-field
                  v-model="formData.password"
                  label="Mật khẩu mới"
                  :type="showPassword ? 'text' : 'password'"
                  :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showPassword = !showPassword"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Vui lòng nhập mật khẩu',
                    v => v.length >= 8 || 'Mật khẩu phải có ít nhất 8 ký tự',
                    v => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v) || 
                        'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
                  ]"
                  prepend-inner-icon="mdi-lock"
                  required
                  class="mb-4"
                ></v-text-field>
                
                <v-text-field
                  v-model="formData.confirmPassword"
                  label="Xác nhận mật khẩu mới"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showConfirmPassword = !showConfirmPassword"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Vui lòng xác nhận mật khẩu',
                    v => v === formData.password || 'Mật khẩu không khớp'
                  ]"
                  prepend-inner-icon="mdi-lock-check"
                  required
                  class="mb-6"
                ></v-text-field>
                
                <v-btn
                  type="submit"
                  color="primary"
                  block
                  size="large"
                  :loading="isLoading"
                  :disabled="!isPasswordFormValid || isLoading"
                >
                  Xác nhận
                </v-btn>
              </v-form>
            </v-stepper-window-item>
            
            <!-- Step 4: Success -->
            <v-stepper-window-item value="4">
              <div class="text-center py-6">
                <v-icon
                  icon="mdi-check-circle"
                  color="success"
                  size="64"
                  class="mb-4"
                ></v-icon>
                
                <h2 class="text-h4 font-weight-bold mb-2">Đặt lại mật khẩu thành công!</h2>
                <p class="text-body-1 mb-6">
                  Mật khẩu của bạn đã được cập nhật. Bạn có thể sử dụng mật khẩu mới để đăng nhập vào tài khoản.
                </p>
                
                <v-btn
                  color="primary"
                  size="large"
                  @click="goToLogin"
                >
                  Đăng nhập
                </v-btn>
              </div>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card>
    </div>
  </div>
</template>

<script>
import { ref, computed, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'ForgotPassword',
  
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    
    // Form refs
    const emailForm = ref(null);
    const passwordForm = ref(null);
    const isEmailFormValid = ref(false);
    const isPasswordFormValid = ref(false);
    
    // Form data
    const contactMethod = ref('email');
    const contactInfo = ref('');
    const formData = ref({
      password: '',
      confirmPassword: ''
    });
    
    // UI state
    const currentStep = ref('1');
    const showPassword = ref(false);
    const showConfirmPassword = ref(false);
    const message = ref('');
    const messageType = ref('info');
    const resetToken = ref('');
    
    // OTP state
    const otpDigits = ref(['', '', '', '', '', '']);
    const otpRefs = ref([]);
    const resendCountdown = ref(0);
    let countdownTimer = null;
    
    // Computed
    const isLoading = computed(() => store.getters['auth/loading']);
    const isOtpComplete = computed(() => otpDigits.value.every(digit => digit !== ''));
    
    // Methods
    const requestReset = async () => {
      if (!isEmailFormValid.value) return;
      
      try {
        message.value = '';
        
        const payload = {};
        if (contactMethod.value === 'email') {
          payload.email = contactInfo.value;
        } else {
          payload.phone = contactInfo.value;
        }
        
        await store.dispatch('auth/requestPasswordReset', payload);
        
        // Move to next step and start resend countdown
        currentStep.value = '2';
        startResendCountdown();
        
        message.value = `Mã xác thực đã được gửi đến ${contactMethod.value === 'email' ? 'email' : 'điện thoại'} của bạn`;
        messageType.value = 'success';
      } catch (error) {
        message.value = error || 'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.';
        messageType.value = 'error';
      }
    };
    
    const verifyOTP = async () => {
      if (!isOtpComplete.value) return;
      
      try {
        message.value = '';
        
        // Combine OTP digits
        const otp = otpDigits.value.join('');
        
        const payload = { otp };
        if (contactMethod.value === 'email') {
          payload.email = contactInfo.value;
        } else {
          payload.phone = contactInfo.value;
        }
        
        // Verify OTP
        const response = await store.dispatch('auth/verifyResetToken', payload);
        
        // Store token for password reset
        resetToken.value = response.token;
        
        // Move to password reset step
        currentStep.value = '3';
        
      } catch (error) {
        message.value = error || 'Mã xác thực không hợp lệ. Vui lòng thử lại.';
        messageType.value = 'error';
      }
    };
    
    const resendOTP = async () => {
      if (resendCountdown.value > 0) return;
      
      try {
        message.value = '';
        
        const payload = {};
        if (contactMethod.value === 'email') {
          payload.email = contactInfo.value;
        } else {
          payload.phone = contactInfo.value;
        }
        
        // Resend OTP
        await store.dispatch('auth/requestPasswordReset', payload);
        
        // Restart countdown
        startResendCountdown();
        
        message.value = 'Mã xác thực đã được gửi lại';
        messageType.value = 'success';
      } catch (error) {
        message.value = error || 'Không thể gửi lại mã. Vui lòng thử lại.';
        messageType.value = 'error';
      }
    };
    
    const resetPassword = async () => {
      if (!isPasswordFormValid.value) return;
      
      try {
        message.value = '';
        
        // Validate passwords match
        if (formData.value.password !== formData.value.confirmPassword) {
          message.value = 'Mật khẩu không khớp';
          messageType.value = 'error';
          return;
        }
        
        // Get the OTP from previous step
        const otp = otpDigits.value.join('');
        
        // Reset password
        await store.dispatch('auth/resetPassword', {
          token: resetToken.value,
          otp,
          newPassword: formData.value.password
        });
        
        // Move to success step
        currentStep.value = '4';
        
      } catch (error) {
        message.value = error || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.';
        messageType.value = 'error';
      }
    };
    
    const goToLogin = () => {
      router.push('/auth/login');
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
    
    // OTP helpers
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
    
    // Check for token in URL (from email link)
    if (route.query.token) {
      resetToken.value = route.query.token;
      currentStep.value = '3';
    }
    
    // Cleanup
    onUnmounted(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    });
    
    return {
      emailForm,
      passwordForm,
      isEmailFormValid,
      isPasswordFormValid,
      contactMethod,
      contactInfo,
      formData,
      currentStep,
      showPassword,
      showConfirmPassword,
      message,
      messageType,
      otpDigits,
      otpRefs,
      resendCountdown,
      isLoading,
      isOtpComplete,
      requestReset,
      verifyOTP,
      resendOTP,
      resetPassword,
      goToLogin,
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
.forgot-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.forgot-password-form {
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
