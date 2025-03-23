<template>
  <div class="reset-password-container">
    <div class="reset-password-form">
      <h1 class="text-2xl font-bold mb-6">Đặt lại mật khẩu</h1>
      
      <div v-if="message" :class="['alert', messageType === 'error' ? 'alert-error' : 'alert-success']">
        {{ message }}
      </div>
      
      <!-- Token Verification / Error State -->
      <div v-if="tokenError" class="text-center">
        <div class="error-icon mb-4">!</div>
        <h2 class="text-xl font-bold mb-2">Liên kết không hợp lệ</h2>
        <p class="mb-4">Liên kết đặt lại mật khẩu của bạn đã hết hạn hoặc không hợp lệ.</p>
        <router-link to="/forgot-password" class="btn btn-primary">Yêu cầu đặt lại mật khẩu mới</router-link>
      </div>
      
      <!-- Reset Password Form -->
      <form v-if="!resetSuccess && !tokenError" @submit.prevent="resetPassword">
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
          <label for="confirmPassword">Xác nhận mật khẩu mới</label>
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
      
      <!-- Reset Success State -->
      <div v-if="resetSuccess" class="text-center">
        <div class="success-icon mb-4">✓</div>
        <h2 class="text-xl font-bold mb-2">Đặt lại mật khẩu thành công!</h2>
        <p class="mb-4">Mật khẩu của bạn đã được đặt lại. Bạn có thể đăng nhập ngay bây giờ.</p>
        <router-link to="/login" class="btn btn-primary">Đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'ResetPassword',
  
  setup() {
    const route = useRoute();
    const authStore = useAuthStore();
    
    const password = ref('');
    const confirmPassword = ref('');
    const isLoading = ref(false);
    const message = ref('');
    const messageType = ref('');
    const tokenError = ref(false);
    const resetSuccess = ref(false);
    const resetToken = ref('');
    
    // Get token from URL
    onMounted(() => {
      resetToken.value = route.params.token;
      
      if (!resetToken.value) {
        tokenError.value = true;
      }
    });
    
    const resetPassword = async () => {
      try {
        // Check if passwords match
        if (password.value !== confirmPassword.value) {
          message.value = 'Mật khẩu không khớp';
          messageType.value = 'error';
          return;
        }
        
        // Check password strength
        if (password.value.length < 6) {
          message.value = 'Mật khẩu phải có ít nhất 6 ký tự';
          messageType.value = 'error';
          return;
        }
        
        isLoading.value = true;
        message.value = '';
        
        // Reset password via store
        await authStore.resetPassword(resetToken.value, password.value);
        
        // Show success message
        resetSuccess.value = true;
      } catch (error) {
        if (error.response?.status === 400) {
          // Token is invalid or expired
          tokenError.value = true;
        } else {
          message.value = error.response?.data?.message || 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.';
          messageType.value = 'error';
        }
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
      tokenError,
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

.error-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto;
  background-color: #FECACA;
  color: #B91C1C;
  font-size: 32px;
  font-weight: bold;
  border-radius: 50%;
}
</style>