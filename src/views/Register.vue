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
        </div>
        
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="formData.email"
            class="form-control"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="phone">Số điện thoại</label>
          <input 
            type="tel" 
            id="phone" 
            v-model="formData.phone"
            class="form-control"
            required
          />
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
          <p class="mt-2">Vui lòng kiểm tra email và nhập mã OTP được gửi đến số điện thoại của bạn để xác thực tài khoản.</p>
        </div>
        
        <div class="form-group">
          <label for="otp">Mã OTP</label>
          <input 
            type="text" 
            id="otp" 
            v-model="otpData.code"
            class="form-control text-center text-2xl tracking-widest"
            placeholder="Nhập mã 6 số"
            maxlength="6"
            required
          />
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-full mt-4"
          :disabled="isLoading"
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
          <button class="btn btn-google" @click="googleLogin">
            <span class="icon">G</span> Google
          </button>
          <button class="btn btn-facebook" @click="facebookLogin">
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
import { ref, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'Register',
  
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    const formData = ref({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: ''
    });
    
    const otpData = ref({
      code: '',
      phone: ''
    });
    
    const isLoading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const showVerificationForm = ref(false);
    const registrationSuccess = ref(false);
    const resendCountdown = ref(0);
    let countdownTimer = null;
    
    // Register function
    const register = async () => {
      try {
        // Validate form
        if (formData.value.password !== formData.value.confirmPassword) {
          message.value = 'Mật khẩu không khớp';
          messageType.value = 'error';
          return;
        }
        
        isLoading.value = true;
        message.value = '';
        
        // Register via store
        await authStore.register({
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
        message.value = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      } finally {
        isLoading.value = false;
      }
    };
    
    // Verify OTP function
    const verifyOTP = async () => {
      try {
        isLoading.value = true;
        message.value = '';
        
        // Verify OTP via store
        await authStore.verifyPhoneOTP(otpData.value.phone, otpData.value.code);
        
        // Show success message
        registrationSuccess.value = true;
        showVerificationForm.value = false;
        
        // Clear forms
        formData.value = {
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: ''
        };
        
        otpData.value = {
          code: '',
          phone: ''
        };
      } catch (error) {
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
        await authStore.resendPhoneOTP(otpData.value.phone);
        
        // Reset countdown
        startResendCountdown();
        
        message.value = 'Mã OTP mới đã được gửi đến điện thoại của bạn.';
        messageType.value = 'success';
      } catch (error) {
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
        // Load Google Sign-In API
        await loadGoogleApi();
        
        // Initialize Google Sign-In
        const auth2 = window.gapi.auth2.getAuthInstance();
        const googleUser = await auth2.signIn();
        
        // Get ID token
        const idToken = googleUser.getAuthResponse().id_token;
        
        // Login with Google
        await authStore.loginWithGoogle(idToken);
        
        // Redirect to home page
        router.push('/');
      } catch (error) {
        message.value = 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      }
    };
    
    const loadGoogleApi = () => {
      return new Promise((resolve) => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: process.env.VUE_APP_GOOGLE_CLIENT_ID
          }).then(resolve);
        });
      });
    };
    
    const facebookLogin = async () => {
      try {
        // Initialize Facebook Login
        await new Promise((resolve) => {
          window.FB.getLoginStatus((response) => {
            if (response.status === 'connected') {
              resolve(response.authResponse.accessToken);
            } else {
              window.FB.login((loginResponse) => {
                if (loginResponse.authResponse) {
                  resolve(loginResponse.authResponse.accessToken);
                } else {
                  throw new Error('Facebook login failed');
                }
              }, { scope: 'email,public_profile' });
            }
          });
        });
        
        // Get access token
        const accessToken = window.FB.getAuthResponse().accessToken;
        
        // Login with Facebook
        await authStore.loginWithFacebook(accessToken);
        
        // Redirect to home page
        router.push('/');
      } catch (error) {
        message.value = 'Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
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
      otpData,
      isLoading,
      message,
      messageType,
      showVerificationForm,
      registrationSuccess,
      resendCountdown,
      register,
      verifyOTP,
      resendOTP,
      googleLogin,
      facebookLogin
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

.tracking-widest {
  letter-spacing: 0.25em;
}
</style>
