<template>
  <div class="register-container">
    <div class="register-form">
      <h1 class="text-2xl font-bold mb-6">Đăng ký tài khoản</h1>
      
      <div v-if="message" :class="['alert', messageType === 'error' ? 'alert-error' : 'alert-success']">
        {{ message }}
      </div>
      
      <form @submit.prevent="register">
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
      
      <div class="mt-6 text-center">
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
      
      <div class="mt-6 text-center">
        <p>Đã có tài khoản? <router-link to="/login" class="text-primary">Đăng nhập</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
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
    
    const isLoading = ref(false);
    const message = ref('');
    const messageType = ref('');
    
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
        
        // Send registration request
        const response = await axios.post('/api/auth/register', {
          name: formData.value.name,
          email: formData.value.email,
          phone: formData.value.phone,
          password: formData.value.password
        });
        
        message.value = response.data.message;
        messageType.value = 'success';
        
        // Clear form
        formData.value = {
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: ''
        };
        
        // Redirect to verification page or login
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } catch (error) {
        message.value = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      } finally {
        isLoading.value = false;
      }
    };
    
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
    
    return {
      formData,
      isLoading,
      message,
      messageType,
      register,
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
</style>
