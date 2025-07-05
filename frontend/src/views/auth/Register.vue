<template>
  <div class="register-container">
    <div class="register-form">
      <v-card class="pa-6 rounded-lg elevation-3">
        <!-- Stepper for registration flow -->
        <v-stepper v-model="currentStep" class="elevation-0">
          <v-stepper-header class="mb-4">
            <v-stepper-item value="1" title="Đăng ký"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item value="2" title="Xác thực"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item value="3" title="Hoàn tất"></v-stepper-item>
          </v-stepper-header>

          <v-stepper-window>
            <!-- Step 1: Registration Form -->
            <v-stepper-window-item value="1">
              <div class="text-center mb-6">
                <v-avatar size="80" color="primary" class="mb-4">
                  <v-icon size="40" color="white">mdi-account-plus</v-icon>
                </v-avatar>
                <h2 class="text-h5 font-weight-bold">Tạo tài khoản</h2>
              </div>

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

              <v-form ref="form" @submit.prevent="register" v-model="isFormValid">
                <!-- Name Field -->
                <v-text-field
                  v-model="formData.name"
                  label="Họ và tên"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Vui lòng nhập họ tên',
                    v => v.length >= 2 || 'Tên phải có ít nhất 2 ký tự'
                  ]"
                  prepend-inner-icon="mdi-account"
                  required
                  class="mb-3"
                ></v-text-field>

                <!-- Email Field -->
                <v-text-field
                  v-model="formData.email"
                  label="Email"
                  type="email"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Vui lòng nhập email',
                    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email không hợp lệ'
                  ]"
                  prepend-inner-icon="mdi-email"
                  required
                  class="mb-3"
                ></v-text-field>

                <!-- Phone Field -->
                <v-text-field
                  v-model="formData.phone"
                  label="Số điện thoại"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Vui lòng nhập số điện thoại',
                    v => /^\+?[0-9]{10,12}$/.test(v) || 'Số điện thoại không hợp lệ'
                  ]"
                  prepend-inner-icon="mdi-phone"
                  required
                  class="mb-3"
                ></v-text-field>

                <!-- Password Field -->
                <v-text-field
                  v-model="formData.password"
                  label="Mật khẩu"
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
                  class="mb-3"
                ></v-text-field>

                <!-- Confirm Password Field -->
                <v-text-field
                  v-model="formData.confirmPassword"
                  label="Xác nhận mật khẩu"
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
                  class="mb-4"
                ></v-text-field>

                <!-- Terms and Conditions -->
                <v-checkbox
                  v-model="formData.agreeTerms"
                  label="Tôi đồng ý với các điều khoản và điều kiện"
                  :rules="[v => !!v || 'Bạn phải đồng ý với điều khoản để tiếp tục']"
                  required
                  class="mb-4"
                ></v-checkbox>

                <!-- Register Button -->
                <v-btn
                  type="submit"
                  color="primary"
                  block
                  size="large"
                  :loading="isLoading"
                  :disabled="!isFormValid || isLoading"
                  class="mb-6"
                >
                  Đăng ký
                </v-btn>

                <!-- Social Login Divider -->
                <div class="text-center my-4 position-relative">
                  <span class="divider-text">hoặc đăng ký với</span>
                </div>

                <!-- Social Registration Buttons -->
                <div class="d-flex gap-2 mb-4">
                  <v-btn
                    variant="outlined"
                    color="error"
                    prepend-icon="mdi-google"
                    block
                    @click="googleLogin"
                    :loading="socialLoading.google"
                    :disabled="isLoading"
                  >
                    Google
                  </v-btn>

                  <v-btn
                    variant="outlined"
                    color="primary"
                    prepend-icon="mdi-facebook"
                    block
                    @click="facebookLogin"
                    :loading="socialLoading.facebook"
                    :disabled="isLoading"
                  >
                    Facebook
                  </v-btn>
                </div>

                <!-- Login Link -->
                <div class="text-center mt-4">
                  <span class="text-medium-emphasis">Đã có tài khoản?</span>
                  <router-link to="/auth/login" class="ml-1 text-primary text-decoration-none">Đăng nhập</router-link>
                </div>
              </v-form>
            </v-stepper-window-item>

            <!-- Step 2: OTP Verification -->
            <v-stepper-window-item value="2">
              <div class="text-center mb-6">
                <v-avatar size="80" color="primary" class="mb-4">
                  <v-icon size="40" color="white">mdi-shield-check</v-icon>
                </v-avatar>
                <h2 class="text-h5 font-weight-bold">Xác thực tài khoản</h2>
              </div>

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

              <div class="text-center mb-4">
                <p class="mb-1">Chúng tôi đã gửi mã xác thực đến</p>
                <p class="font-weight-bold" v-if="otpData.email">Email: {{ maskEmail(otpData.email) }}</p>
                <p class="font-weight-bold" v-if="otpData.phone">Điện thoại: {{ maskPhone(otpData.phone) }}</p>
                <p class="mt-2">Vui lòng nhập mã để hoàn tất đăng ký</p>
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

              <!-- Action Buttons -->
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

            <!-- Step 3: Registration Success -->
            <v-stepper-window-item value="3">
              <div class="text-center py-6">
                <v-icon
                  icon="mdi-check-circle"
                  color="success"
                  size="64"
                  class="mb-4"
                ></v-icon>

                <h2 class="text-h4 font-weight-bold mb-2">Đăng ký thành công!</h2>
                <p class="text-body-1 mb-6">
                  Cảm ơn bạn đã đăng ký. Tài khoản của bạn đã được tạo thành công.
                </p>

                <v-btn
                  color="primary"
                  size="large"
                  @click="goToHome"
                >
                  Tiếp tục
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { loginWithSocial, initSocialAuth } from '@/services/social-auth';

export default {
  name: 'Register',

  setup() {
    const store = useStore();
    const router = useRouter();

    // Form refs
    const form = ref(null);
    const isFormValid = ref(false);
    const showPassword = ref(false);
    const showConfirmPassword = ref(false);

    // OTP refs
    const otpRefs = ref([]);

    // Form data
    const formData = ref({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    });

    // OTP data
    const otpDigits = ref(['', '', '', '', '', '']);

    // UI state
    const message = ref('');
    const messageType = ref('info');
    const socialLoading = ref({
      google: false,
      facebook: false
    });
    const resendCountdown = ref(0);
    let countdownTimer = null;

    // Stepper
    const currentStep = computed({
      get: () => String(store.getters['auth/verificationStep']),
      set: (val) => {
        // Only allow step changes when appropriate
        if (Number(val) < store.getters['auth/verificationStep']) {
          store.commit('auth/SET_VERIFICATION_STEP', Number(val));
        }
      }
    });

    // Computed
    const isLoading = computed(() => store.getters['auth/loading']);
    const otpData = computed(() => store.getters['auth/otpData']);
    const isOtpComplete = computed(() => otpDigits.value.every(digit => digit !== ''));

    // Methods
    const register = async () => {
      if (!isFormValid.value) return;

      try {
        message.value = '';

        // Validate passwords match
        if (formData.value.password !== formData.value.confirmPassword) {
          message.value = 'Mật khẩu không khớp';
          messageType.value = 'error';
          return;
        }

        // Register user
        const response = await store.dispatch('auth/register', {
          name: formData.value.name,
          email: formData.value.email,
          phone: formData.value.phone,
          password: formData.value.password
        });

        if (response.success) {
          // Display success message
          message.value = response.message || 'Đăng ký thành công!';
          messageType.value = 'success';

          // If verification is needed, set up OTP verification
          if (response.verificationRequired) {
            // Start resend countdown
            startResendCountdown();
          } else {
            // If no verification needed, redirect to login after 2 seconds
            setTimeout(() => {
              router.push('/auth/login');
            }, 2000);
          }
        }

      } catch (error) {
        message.value = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      }
    };

    const verifyOTP = async () => {
      if (!isOtpComplete.value) return;

      try {
        message.value = '';

        // Combine OTP digits
        const otp = otpDigits.value.join('');

        // Verify OTP
        if (otpData.value.email) {
          await store.dispatch('auth/verifyEmailOTP', otp);
        } else if (otpData.value.phone) {
          await store.dispatch('auth/verifyPhoneOTP', otp);
        }

      } catch (error) {
        message.value = error || 'Xác thực thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      }
    };

    const resendOTP = async () => {
      if (resendCountdown.value > 0) return;

      try {
        message.value = '';

        // Resend OTP
        if (otpData.value.email) {
          await store.dispatch('auth/resendEmailOTP');
        } else if (otpData.value.phone) {
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

    const googleLogin = async () => {
      try {
        socialLoading.value.google = true;
        message.value = '';

        // Use the social auth service
        const result = await loginWithSocial('google');
        
        // Store the tokens and user data
        await store.dispatch('auth/loginWithSocial', {
          provider: 'google',
          accessToken: result.token
        });

        // Redirect after successful login
        router.push('/');
      } catch (error) {
        message.value = 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
        console.error('Google login error:', error);
      } finally {
        socialLoading.value.google = false;
      }
    };

    const facebookLogin = async () => {
      try {
        socialLoading.value.facebook = true;
        message.value = '';

        // Use the social auth service
        const result = await loginWithSocial('facebook');
        
        // Store the tokens and user data
        await store.dispatch('auth/loginWithSocial', {
          provider: 'facebook',
          accessToken: result.token
        });

        // Redirect after successful login
        router.push('/');
      } catch (error) {
        message.value = 'Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
        console.error('Facebook login error:', error);
      } finally {
        socialLoading.value.facebook = false;
      }
    };

    const goToHome = () => {
      router.push('/');
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

    // Lifecycle hooks
    onMounted(async () => {
      // Reset verification step
      store.commit('auth/SET_VERIFICATION_STEP', 1);
      
      // Initialize social auth
      try {
        await initSocialAuth();
      } catch (error) {
        console.warn('Failed to initialize social auth:', error);
      }
    });

    onUnmounted(() => {
      // Clear timers
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    });

    return {
      form,
      isFormValid,
      formData,
      showPassword,
      showConfirmPassword,
      message,
      messageType,
      currentStep,
      isLoading,
      socialLoading,
      otpDigits,
      otpRefs,
      otpData,
      isOtpComplete,
      resendCountdown,
      register,
      verifyOTP,
      resendOTP,
      googleLogin,
      facebookLogin,
      goToHome,
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
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
  background-image: url('/images/auth-bg.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
}

.register-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 0;
}

.register-form {
  width: 100%;
  max-width: 550px;
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.5s ease-out;
}

.divider-text {
  position: relative;
  padding: 0 10px;
  background: white;
  z-index: 1;
  color: rgba(0, 0, 0, 0.6);
}

.divider-text::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -40%;
  right: -40%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
  z-index: -1;
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

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Step transitions */
.v-stepper-window-item {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
