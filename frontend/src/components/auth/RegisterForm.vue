<template>
  <div class="register-container">
    <div class="register-form">
      <h1 class="text-2xl font-bold mb-6">Đăng ký tài khoản</h1>
      
      <div v-if="message" :class="['alert', messageType === 'error' ? 'alert-error' : 'alert-success']">
        {{ message }}
      </div>
      
      <!-- Registration Form -->
      <form v-if="!registrationSuccess && !showVerificationForm" @submit.prevent="register">
        <div class="form-group">
          <label for="name">Họ và tên</label>
          <input 
            type="text" 
            id="name" 
            v-model="formData.name"
            class="form-control"
            required
          />
          <small v-if="validationErrors.name" class="text-error">{{ validationErrors.name }}</small>
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="formData.email"
            class="form-control"
            @blur="checkEmailExists"
            required
          />
          <small v-if="validationErrors.email" class="text-error">{{ validationErrors.email }}</small>
        </div>
        
        <div class="form-group">
          <label for="phone">Số điện thoại</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="formData.phone"
            class="form-control"
            @blur="checkPhoneExists"
            placeholder="+84xxxxxxxxxx"
            required
          />
          <small class="text-muted">Vui lòng nhập số điện thoại bắt đầu bằng +84 (Việt Nam).</small>
          <small v-if="validationErrors.phone" class="text-error">{{ validationErrors.phone }}</small>
        </div>
        
        <div class="form-group">
          <label for="password">Mật khẩu</label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password"
            class="form-control"
            required
          />
          <small class="text-muted">Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</small>
          <small v-if="validationErrors.password" class="text-error">{{ validationErrors.password }}</small>
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Xác nhận mật khẩu</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="formData.confirmPassword"
            class="form-control"
            required
          />
          <small v-if="validationErrors.confirmPassword" class="text-error">{{ validationErrors.confirmPassword }}</small>
        </div>
        
        <div class="form-check mb-4">
          <input 
            type="checkbox" 
            id="terms" 
            v-model="formData.agreeTerms"
            class="form-check-input"
            required
          />
          <label for="terms" class="form-check-label ml-2">
            Tôi đồng ý với <a href="#" class="text-primary">Điều khoản dịch vụ</a> và <a href="#" class="text-primary">Chính sách bảo mật</a>
          </label>
          <small v-if="validationErrors.agreeTerms" class="d-block text-error">{{ validationErrors.agreeTerms }}</small>
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-full mt-4"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Đang xử lý...' : 'Đăng ký' }}
        </button>
      </form>
      
      <!-- OTP Verification Form -->
      <form v-if="showVerificationForm" @submit.prevent="verifyOTP">
        <div class="text-center mb-6">
          <h2 class="text-xl font-bold">Xác thực tài khoản</h2>
          <p class="mt-2">Chúng tôi đã gửi mã xác thực đến số điện thoại của bạn. Vui lòng kiểm tra và nhập mã OTP để hoàn tất đăng ký.</p>
          <p class="text-muted">Mã xác thực được gửi đến số: <span class="font-medium">{{ maskedPhone }}</span></p>
        </div>
        
        <div class="otp-input-container">
          <div class="form-group">
            <label for="otp">Mã OTP</label>
            <div class="otp-input-group">
              <input 
                v-for="(digit, index) in otpDigits" 
                :key="index"
                type="text" 
                v-model="otpDigits[index]"
                maxlength="1"
                class="otp-digit"
                @input="onOtpDigitInput(index)"
                @keydown="onOtpKeyDown($event, index)"
                :ref="el => otpInputRefs[index] = el"
              />
            </div>
          </div>
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-full mt-4"
          :disabled="isLoading || !isOtpComplete"
        >
          {{ isLoading ? 'Đang xử lý...' : 'Xác thực' }}
        </button>
        
        <div class="mt-4 text-center">
          <p>Không nhận được mã? 
            <button 
              type="button" 
              class="text-primary"
              @click="resendOTP"
              :disabled="isLoading || resendCountdown > 0"
            >
              {{ resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : 'Gửi lại' }}
            </button>
          </p>
        </div>
      </form>
      
      <!-- Registration Success Message -->
      <div v-if="registrationSuccess" class="text-center">
        <div class="success-icon mb-4">✓</div>
        <h2 class="text-xl font-bold mb-2">Đăng ký thành công!</h2>
        <p class="mb-4">Tài khoản của bạn đã được tạo và xác thực.</p>
        <router-link to="/login" class="btn btn-primary">Đăng nhập ngay</router-link>
      </div>
      
      <!-- Social Login Options (only on initial registration form) -->
      <div v-if="!showVerificationForm && !registrationSuccess" class="mt-6 text-center">
        <p>Hoặc đăng ký với</p>
        <div class="social-login mt-3">
          <button class="btn btn-google" @click.prevent="googleLogin" :disabled="isLoading">
            <span class="icon">G</span> Google
          </button>
          <button class="btn btn-facebook" @click.prevent="facebookLogin" :disabled="isLoading">
            <span class="icon">f</span> Facebook
          </button>
        </div>
      </div>
      
      <div class="mt-6 text-center" v-if="!registrationSuccess">
        <p>Đã có tài khoản? <router-link to="/login" class="text-primary">Đăng nhập</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import axios from 'axios';

export default {
  name: 'RegisterForm',
  
  setup() {
    const router = useRouter();
    const store = useStore();
    
    const formData = ref({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false
    });
    
    const validationErrors = ref({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeTerms: ''
    });
    
    const otpDigits = ref(['', '', '', '', '', '']);
    const otpInputRefs = ref([]);
    
    const isLoading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const showVerificationForm = ref(false);
    const registrationSuccess = ref(false);
    const resendCountdown = ref(0);
    let countdownTimer = null;
    
    // Computed properties
    const isOtpComplete = computed(() => {
      return otpDigits.value.every(digit => digit !== '');
    });
    
    const maskedPhone = computed(() => {
      if (!formData.value.phone) return '';
      const phone = formData.value.phone;
      return phone.slice(0, 3) + '***' + phone.slice(-4);
    });
    
    // OTP input handlers
    const onOtpDigitInput = (index) => {
      // Auto-focus next input
      if (otpDigits.value[index] && index < 5) {
        otpInputRefs.value[index + 1]?.focus();
      }
      
      // Combine digits for submission
      otpData.value.code = otpDigits.value.join('');
    };
    
    const onOtpKeyDown = (event, index) => {
      // On backspace, move to previous input if empty
      if (event.key === 'Backspace' && !otpDigits.value[index] && index > 0) {
        otpInputRefs.value[index - 1]?.focus();
      }
    };
    
    // Store combined OTP for submission
    const otpData = ref({
      code: '',
      phone: ''
    });
    
    // Validate registration form
    const validateForm = () => {
      let isValid = true;
      
      // Reset errors
      Object.keys(validationErrors.value).forEach(key => {
        validationErrors.value[key] = '';
      });
      
      // Name validation
      if (!formData.value.name.trim()) {
        validationErrors.value.name = 'Vui lòng nhập họ và tên';
        isValid = false;
      }
      
      // Email validation
      if (!formData.value.email) {
        validationErrors.value.email = 'Vui lòng nhập email';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
        validationErrors.value.email = 'Email không hợp lệ';
        isValid = false;
      }
      
      // Phone validation
      if (!formData.value.phone) {
        validationErrors.value.phone = 'Vui lòng nhập số điện thoại';
        isValid = false;
      } else if (!/^\+84\d{9,10}$/.test(formData.value.phone)) {
        validationErrors.value.phone = 'Số điện thoại không hợp lệ (phải bắt đầu bằng +84)';
        isValid = false;
      }
      
      // Password validation
      if (!formData.value.password) {
        validationErrors.value.password = 'Vui lòng nhập mật khẩu';
        isValid = false;
      } else if (formData.value.password.length < 8) {
        validationErrors.value.password = 'Mật khẩu phải có ít nhất 8 ký tự';
        isValid = false;
      } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.value.password)) {
        validationErrors.value.password = 'Mật khẩu phải có ít nhất một chữ hoa, một chữ thường, một số và một ký tự đặc biệt';
        isValid = false;
      }
      
      // Confirm password validation
      if (formData.value.password !== formData.value.confirmPassword) {
        validationErrors.value.confirmPassword = 'Mật khẩu không khớp';
        isValid = false;
      }
      
      // Terms agreement validation
      if (!formData.value.agreeTerms) {
        validationErrors.value.agreeTerms = 'Bạn phải đồng ý với điều khoản dịch vụ';
        isValid = false;
      }
      
      return isValid;
    };
    
    // Register function
    const register = async () => {
      try {
        // Validate form
        if (!validateForm()) {
          return;
        }
        
        isLoading.value = true;
        message.value = '';
        
        // Register via store
        await store.dispatch('auth/register', {
          name: formData.value.name,
          email: formData.value.email,
          phone: formData.value.phone,
          password: formData.value.password
        });
        
        // Store phone for verification
        otpData.value.phone = formData.value.phone;
        
        // Show verification form
        message.value = 'Đăng ký thành công. Vui lòng xác thực tài khoản qua mã OTP.';
        messageType.value = 'success';
        showVerificationForm.value = true;
        
        // Start countdown for resend
        startResendCountdown();
      } catch (error) {
        console.error('Registration error:', error);
        
        // Hiển thị thông báo lỗi cụ thể từ server
        if (error.response?.data?.message) {
          // Kiểm tra các trường hợp lỗi phổ biến và hiển thị thông báo thân thiện
          if (error.response.data.message.includes('Email already registered')) {
            validationErrors.value.email = 'Email đã được đăng ký. Vui lòng sử dụng email khác.';
            message.value = 'Email đã được đăng ký. Vui lòng sử dụng email khác.';
          } else if (error.response.data.message.includes('Phone number already registered')) {
            validationErrors.value.phone = 'Số điện thoại đã được đăng ký. Vui lòng sử dụng số điện thoại khác.';
            message.value = 'Số điện thoại đã được đăng ký. Vui lòng sử dụng số điện thoại khác.';
          } else {
            message.value = error.response.data.message;
          }
        } else {
          message.value = 'Đăng ký thất bại. Vui lòng thử lại.';
        }
        
        messageType.value = 'error';
      } finally {
        isLoading.value = false;
      }
    };
    
    // Verify OTP function
    const verifyOTP = async () => {
      try {
        if (!isOtpComplete.value) {
          message.value = 'Vui lòng nhập đầy đủ mã OTP gồm 6 chữ số';
          messageType.value = 'error';
          return;
        }
        
        isLoading.value = true;
        message.value = '';
        
        // Verify OTP via store
        await store.dispatch('auth/verifyPhoneOTP', {
          phone: otpData.value.phone,
          otp: otpData.value.code
        });
        
        // Show success message
        registrationSuccess.value = true;
        showVerificationForm.value = false;
        
        // Clear forms
        formData.value = {
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          agreeTerms: false
        };
        
        otpData.value = {
          code: '',
          phone: ''
        };
      } catch (error) {
        console.error('OTP verification error:', error);
        message.value = error.response?.data?.message || 'Xác thực thất bại. Vui lòng kiểm tra lại mã OTP.';
        messageType.value = 'error';
      } finally {
        isLoading.value = false;
      }
    };
    
    // Resend OTP function
    const resendOTP = async () => {
      try {
        isLoading.value = true;
        message.value = '';
        
        // Resend OTP via store
        await store.dispatch('auth/resendPhoneOTP', otpData.value.phone);
        
        // Reset countdown
        startResendCountdown();
        
        message.value = 'Mã OTP mới đã được gửi đến điện thoại của bạn.';
        messageType.value = 'success';
      } catch (error) {
        console.error('Resend OTP error:', error);
        message.value = error.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
        messageType.value = 'error';
      } finally {
        isLoading.value = false;
      }
    };
    
    // Start countdown for resend button
    const startResendCountdown = () => {
      resendCountdown.value = 60; // 60 seconds cooldown
      
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
    
    // Social login functions
    const googleLogin = async () => {
      try {
        isLoading.value = true;
        // Use the socialAuth service from the frontend
        await store.dispatch('auth/loginWithGoogle');
        router.push('/');
      } catch (error) {
        console.error('Google login error:', error);
        message.value = 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      } finally {
        isLoading.value = false;
      }
    };
    
    const facebookLogin = async () => {
      try {
        isLoading.value = true;
        // Use the socialAuth service from the frontend
        await store.dispatch('auth/loginWithFacebook');
        router.push('/');
      } catch (error) {
        console.error('Facebook login error:', error);
        message.value = 'Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      } finally {
        isLoading.value = false;
      }
    };
    
    // Thêm phương thức checkEmailExists và checkPhoneExists
    const checkEmailExists = async () => {
      try {
        if (!formData.value.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
          return; // Không kiểm tra nếu email không hợp lệ
        }
        
        const response = await axios.post('/api/auth/check-email', {
          email: formData.value.email
        });
        
        if (response.data.exists) {
          validationErrors.value.email = 'Email đã được đăng ký. Vui lòng sử dụng email khác.';
        } else {
          validationErrors.value.email = '';
        }
      } catch (error) {
        console.error('Email check error:', error);
        // Không hiển thị lỗi nếu API kiểm tra không thành công
      }
    };

    const checkPhoneExists = async () => {
      try {
        if (!formData.value.phone || !/^\+84\d{9,10}$/.test(formData.value.phone)) {
          return; // Không kiểm tra nếu số điện thoại không hợp lệ
        }
        
        const response = await axios.post('/api/auth/check-phone', {
          phone: formData.value.phone
        });
        
        if (response.data.exists) {
          validationErrors.value.phone = 'Số điện thoại đã được đăng ký. Vui lòng sử dụng số điện thoại khác.';
        } else {
          validationErrors.value.phone = '';
        }
      } catch (error) {
        console.error('Phone check error:', error);
        // Không hiển thị lỗi nếu API kiểm tra không thành công
      }
    };
    
    // Clean up on component unmount
    onUnmounted(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    });
    
    return {
      formData,
      validationErrors,
      otpDigits,
      otpInputRefs,
      otpData,
      isLoading,
      message,
      messageType,
      showVerificationForm,
      registrationSuccess,
      resendCountdown,
      isOtpComplete,
      maskedPhone,
      register,
      verifyOTP,
      resendOTP,
      googleLogin,
      facebookLogin,
      onOtpDigitInput,
      onOtpKeyDown,
      checkEmailExists,
      checkPhoneExists
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
}

.register-form {
  width: 100%;
  max-width: 480px;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.btn-primary {
  background-color: #FF5A5F;
  color: white;
}

.btn-primary:hover {
  background-color: #FF2D55;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.social-login {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn-google, .btn-facebook {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 15px;
}

.btn-google {
  background-color: white;
  color: #4285F4;
  border: 1px solid #4285F4;
}

.btn-facebook {
  background-color: #3b5998;
  color: white;
}

.text-error {
  color: #B91C1C;
  font-size: 0.8rem;
  margin-top: 4px;
  display: block;
}

.text-muted {
  color: #6b7280;
  font-size: 0.8rem;
  margin-top: 4px;
}

.alert {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.alert-error {
  background-color: #FECACA;
  color: #B91C1C;
}

.alert-success {
  background-color: #D1FAE5;
  color: #047857;
}

.text-primary {
  color: #FF5A5F;
}

.success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto;
  background-color: #D1FAE5;
  color: #047857;
  font-size: 32px;
  font-weight: bold;
  border-radius: 50%;
}

.otp-input-container {
  margin-bottom: 20px;
}

.otp-input-group {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.otp-digit {
  width: 40px;
  height: 48px;
  text-align: center;
  font-size: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-check {
  display: flex;
  align-items: baseline;
}

.form-check-input {
  margin-right: 8px;
}

.form-check-label {
  font-size: 0.9rem;
}

.tracking-widest {
  letter-spacing: 0.25em;
}

@media (max-width: 576px) {
  .register-form {
    padding: 20px;
  }
  
  .otp-digit {
    width: 36px;
    height: 42px;
    font-size: 18px;
  }
}
</style>