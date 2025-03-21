<template>
  <div class="forgot-password-container">
    <div class="forgot-password-form">
      <h1 class="text-2xl font-bold mb-6">Quên mật khẩu</h1>
      
      <div v-if="message" :class="['alert', messageType === 'error' ? 'alert-error' : 'alert-success']">
        {{ message }}
      </div>
      
      <p class="mb-4">Nhập địa chỉ email của bạn để nhận liên kết đặt lại mật khẩu.</p>
      
      <form @submit.prevent="sendResetLink">
        <div class="form-group">
          <label for="email">Email</label>
          <input 
            type="email" 
            id="email" 
            v-model="email"
            class="form-control"
            required
          />
        </div>
        
        <button 
          type="submit" 
          class="btn btn-primary w-full mt-4"
          :disabled="isLoading"
        >
          {{ isLoading ? 'Đang xử lý...' : 'Gửi liên kết đặt lại' }}
        </button>
      </form>
      
      <div class="mt-6 text-center">
        <p>Đã nhớ mật khẩu? <router-link to="/login" class="text-primary">Đăng nhập</router-link></p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import axios from 'axios';

export default {
  name: 'ForgotPassword',
  
  setup() {
    const email = ref('');
    const isLoading = ref(false);
    const message = ref('');
    const messageType = ref('');
    
    const sendResetLink = async () => {
      try {
        isLoading.value = true;
        message.value = '';
        
        // Send forgot password request
        const response = await axios.post('/api/auth/forgot-password', { email: email.value });
        
        message.value = response.data.message || 'Hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.';
        messageType.value = 'success';
        
        // Clear form
        email.value = '';
      } catch (error) {
        message.value = error.response?.data?.message || 'Gửi yêu cầu đặt lại mật khẩu thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
      } finally {
        isLoading.value = false;
      }
    };
    
    return {
      email,
      isLoading,
      message,
      messageType,
      sendResetLink
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
</style>