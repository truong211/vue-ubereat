<template>
  <div class="reset-password-container">
    <div class="reset-password-form">
      <h1 class="text-2xl font-bold mb-6">Đặt lại mật khẩu</h1>
      
      <div v-if="message" :class="['alert', messageType === 'error' ? 'alert-error' : 'alert-success']">
        {{ message }}
      </div>
      
      <form @submit.prevent="resetPassword" v-if="!resetSuccess">
        <div class="form-group">
          <label for="password">Mật khẩu mới</label>
          <input 
            type="password" 
            id="password" 
            v-model="password"
            class="form-control"
            required
            minlength="6"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Xác nhận mật khẩu</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword"
            class="form-control"
            required
          />
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-full mt-4"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu' }}
        </button>
      </form>
      
      <div v-if="resetSuccess" class="text-center">
        <div class="success-icon mb-4">✓</div>
        <p class="mb-4">Mật khẩu của bạn đã được đặt lại thành công.</p>
        <router-link to="/login" class="btn btn-primary">Đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

export default {
  name: 'ResetPassword',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    
    const token = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    const isLoading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const resetSuccess = ref(false);
    
    onMounted(() => {
      // Get token from URL
      token.value = route.params.token;
      
      if (!token.value) {
        message.value = 'Token không hợp lệ hoặc đã hết hạn.';
        messageType.value = 'error';
      }
    });
    
    const resetPassword = async () => {
      try {
        // Validate passwords match
        if (password.value !== confirmPassword.value) {
          message.value = 'Mật khẩu không khớp.';
          messageType.value = 'error';
          return;
        }
        
        isLoading.value = true;
        message.value = '';
        
        // Send reset password request
        const response = await axios.post(`/api/auth/reset-password/${token.value}`, {
          password: password.value
        });
        
        // Mark reset as successful
        resetSuccess.value = true;
        messageType.value = 'success';
        message.value = response.data.message || 'Mật khẩu đã được đặt lại thành công.';
        
        // Optionally store tokens if returned
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          
          // Auto-redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (error) {
        message.value = error.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      } finally {
        isLoading.value = false;
      }
    };
    
    return {
      password,
      confirmPassword,
      isLoading,
      message,
      messageType,
      resetSuccess,
      resetPassword
    };
  }
};
</script>

<style scoped>
.reset-password-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.reset-password-form {
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
  font-size: 64px;
  color: #047857;
}
</style>