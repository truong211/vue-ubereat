<template>
  <div class="login-container">
    <div class="login-form">
      <h1 class="text-2xl font-bold mb-6">Đăng nhập</h1>
      
      <div v-if="message" :class="['alert', messageType === 'error' ? 'alert-error' : 'alert-success']">
        {{ message }}
      </div>
      
      <form @submit.prevent="login">
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
          <label for="password">Mật khẩu</label>
          <input 
            type="password" 
            id="password" 
            v-model="formData.password"
            class="form-control"
            required
          />
          <div class="text-right mt-1">
            <router-link to="/forgot-password" class="text-sm text-primary">Quên mật khẩu?</router-link>
          </div>
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-full mt-4"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Đang xử lý...' : 'Đăng nhập' }}
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <p>Hoặc đăng nhập với</p>
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
        <p>Chưa có tài khoản? <router-link to="/register" class="text-primary">Đăng ký</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

export default {
  name: 'Login',
  
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const { loading: isLoading } = storeToRefs(authStore);
    
    const formData = ref({
      email: '',
      password: '',
    });
    
    const message = ref('');
    const messageType = ref('');
    
    const login = async () => {
      if (isLoading.value) return;
      
      try {
        message.value = '';
        messageType.value = '';
        
        // Login with email/password
        await authStore.login(formData.value.email, formData.value.password);
        
        // Redirect to home page
        router.push('/');
      } catch (error) {
        message.value = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.';
        messageType.value = 'error';
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
      login,
      googleLogin,
      facebookLogin
    };
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.login-form {
  width: 100%;
  max-width: 400px;
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
