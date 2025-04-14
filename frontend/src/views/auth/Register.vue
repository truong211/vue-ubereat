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
                <p class="text-subtitle-1 text-medium-emphasis mt-2">
                  Đăng ký để khám phá ẩm thực ngay hôm nay!
                </p>
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
                    v => v.length >= 8 || 'Mật khẩu phải có ít nhất 8 ký tự'
                    // Temporarily removing complex password requirements for testing
                    // v => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(v) ||
                    //    'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt'
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
                  class="mb-6 register-btn"
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
                    class="social-btn"
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
                    class="social-btn"
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
                <p class="font-weight-bold" v-if="otpData && otpData.email">Email: {{ maskEmail(otpData.email) }}</p>
                <p class="font-weight-bold" v-if="otpData && otpData.phone">Điện thoại: {{ maskPhone(otpData.phone) }}</p>
              </div>

              <!-- OTP Input -->
              <div class="otp-container my-8">
                <v-otp-input
                  v-model="otpInputValue"
                  :length="6"
                  type="number"
                  @finish="verifyOTP"
                ></v-otp-input>
              </div>

              <div class="d-flex justify-center mb-6">
                <v-btn
                  color="primary"
                  size="large"
                  :loading="verifyingOtp"
                  :disabled="!otpInputValue || otpInputValue.length < 6 || verifyingOtp"
                  @click="verifyOTP"
                  class="px-8 verify-btn"
                >
                  Xác nhận
                </v-btn>
              </div>

              <div class="text-center">
                <p class="mb-2">Bạn chưa nhận được mã?</p>
                <v-btn
                  variant="text"
                  color="primary"
                  :disabled="resendCountdown > 0 || resendingOtp"
                  :loading="resendingOtp"
                  @click="resendOTP"
                  class="resend-btn"
                >
                  Gửi lại mã {{ resendCountdown > 0 ? `(${resendCountdown}s)` : '' }}
                </v-btn>
              </div>
            </v-stepper-window-item>

            <!-- Step 3: Registration Success -->
            <v-stepper-window-item value="3">
              <div class="text-center py-8">
                <v-avatar size="96" color="success" class="mb-4">
                  <v-icon size="64" color="white">mdi-check</v-icon>
                </v-avatar>
                <h2 class="text-h4 font-weight-bold mb-4">Đăng ký thành công!</h2>
                <p class="text-body-1 mb-8">Cảm ơn bạn đã đăng ký tài khoản. Bây giờ bạn có thể bắt đầu trải nghiệm dịch vụ của chúng tôi.</p>
                
                <v-btn
                  color="primary"
                  size="large"
                  @click="goToHome"
                  class="px-8 continue-btn"
                >
                  Bắt đầu ngay
                </v-btn>
              </div>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card>

      <!-- Back to Home Button -->
      <div class="text-center mt-4">
        <v-btn
          to="/"
          variant="text"
          prepend-icon="mdi-arrow-left"
          class="back-home-link"
          size="small"
        >
          Quay lại trang chủ
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

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
    const verifyingOtp = ref(false);
    const resendingOtp = ref(false);
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
    
    // Computed property for OTP input with getter and setter
    const otpInputValue = computed({
      get: () => {
        return otpData.value && otpData.value.code ? otpData.value.code : '';
      },
      set: (value) => {
        if (otpData.value) {
          store.commit('auth/SET_OTP_DATA', {
            ...otpData.value,
            code: value
          });
        }
      }
    });

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

        // Format data properly
        const registerData = {
          name: formData.value.name.trim(),
          email: formData.value.email.trim(),
          phone: formData.value.phone.trim(),
          password: formData.value.password
        };

        // Debug the data being sent to API
        console.log('Sending registration data:', registerData);

        // Register user
        const response = await store.dispatch('auth/register', registerData);

        // Display success message
        message.value = response.message || 'Đăng ký thành công!';
        messageType.value = 'success';

        // Clear form data
        formData.value = {
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          agreeTerms: false
        };

      } catch (error) {
        console.error('Registration error details:', error.response?.data);
        message.value = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      }
    };

    const verifyOTP = async () => {
      if (!otpInputValue.value || otpInputValue.value.length < 6) return;

      try {
        message.value = '';
        verifyingOtp.value = true;

        // Verify OTP
        if (otpData.value && otpData.value.email) {
          await store.dispatch('auth/verifyEmailOTP', otpInputValue.value);
        } else if (otpData.value && otpData.value.phone) {
          await store.dispatch('auth/verifyPhoneOTP', otpInputValue.value);
        } else {
          throw new Error('Missing verification data');
        }

      } catch (error) {
        console.error('OTP verification error:', error);
        message.value = error.message || 'Xác thực thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      } finally {
        verifyingOtp.value = false;
      }
    };

    const resendOTP = async () => {
      if (resendCountdown.value > 0) return;

      try {
        message.value = '';
        resendingOtp.value = true;

        // Resend OTP
        if (otpData.value && otpData.value.email) {
          await store.dispatch('auth/resendEmailOTP');
        } else if (otpData.value && otpData.value.phone) {
          await store.dispatch('auth/resendPhoneOTP');
        } else {
          throw new Error('Missing verification data');
        }

        // Start resend countdown
        startResendCountdown();

        message.value = 'Mã xác thực đã được gửi lại';
        messageType.value = 'success';

      } catch (error) {
        console.error('Resend OTP error:', error);
        message.value = error.message || 'Không thể gửi lại mã. Vui lòng thử lại.';
        messageType.value = 'error';
      } finally {
        resendingOtp.value = false;
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

        // Your implementation will depend on how you set up Google Auth
        // This is a placeholder - you'll need to implement the actual OAuth flow
        const result = await window.gapi.auth2.getAuthInstance().signIn();
        const accessToken = result.getAuthResponse().id_token;

        await store.dispatch('auth/loginWithSocial', {
          provider: 'google',
          accessToken
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

        // Your implementation will depend on how you set up Facebook Auth
        // This is a placeholder - you'll need to implement the actual OAuth flow
        const response = await new Promise((resolve) => {
          window.FB.login((response) => {
            resolve(response);
          }, { scope: 'email,public_profile' });
        });

        if (response.status === 'connected') {
          const accessToken = response.authResponse.accessToken;

          await store.dispatch('auth/loginWithSocial', {
            provider: 'facebook',
            accessToken
          });

          // Redirect after successful login
          router.push('/');
        } else {
          throw new Error('Facebook login failed');
        }
      } catch (error) {
        message.value = 'Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
        console.error('Facebook login error:', error);
      } finally {
        socialLoading.value.facebook = false;
      }
    };

    const goToHome = () => {
      // Clear any registration state
      store.commit('auth/SET_VERIFICATION_STEP', 1);
      
      // Navigate to home
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
    onMounted(() => {
      // Reset verification step if not already in success state
      if (store.getters['auth/verificationStep'] !== 3) {
        // store.commit('auth/SET_VERIFICATION_STEP', 1); // Temporarily removed as per task
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
      otpInputValue,
      isOtpComplete,
      resendCountdown,
      verifyingOtp,
      resendingOtp,
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
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%);
}

.register-form {
  width: 100%;
  max-width: 600px;
}

.divider-text {
  position: relative;
  z-index: 1;
  padding: 0 10px;
  background-color: white;
}

.divider-text::before {
  content: "";
  position: absolute;
  top: 50%;
  left: -30%;
  right: -30%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
  z-index: -1;
}

.register-btn, .verify-btn, .continue-btn {
  transition: transform 0.2s ease;
}

.register-btn:hover:not(:disabled),
.verify-btn:hover:not(:disabled),
.continue-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.social-btn {
  transition: all 0.2s ease;
}

.social-btn:hover {
  transform: translateY(-2px);
}

.back-home-link {
  transition: color 0.2s ease;
}

.back-home-link:hover {
  color: var(--primary-color);
}

.otp-container {
  display: flex;
  justify-content: center;
}

.resend-btn {
  transition: opacity 0.2s ease;
}

.resend-btn:disabled {
  opacity: 0.7;
}
</style>
