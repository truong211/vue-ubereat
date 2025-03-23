<template>
  <div class="verify-email-container">
    <div class="verify-email-box">
      <h1 class="text-2xl font-bold mb-6">Xác thực Email</h1>
      
      <div v-if="isLoading" class="loading">
        <div class="spinner"></div>
        <p>Đang xác thực email của bạn...</p>
      </div>
      
      <div v-else-if="verificationSuccess" class="text-center">
        <div class="success-icon mb-4">✓</div>
        <h2 class="text-xl font-bold mb-2">Xác thực thành công!</h2>
        <p class="mb-4">Email của bạn đã được xác thực. Bạn có thể đăng nhập ngay bây giờ.</p>
        <router-link to="/login" class="btn btn-primary">Đăng nhập</router-link>
      </div>
      
      <div v-else-if="verificationError" class="text-center">
        <div class="error-icon mb-4">!</div>
        <h2 class="text-xl font-bold mb-2">Xác thực thất bại</h2>
        <p class="mb-4">{{ errorMessage || 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.' }}</p>
        <button 
          @click="resendVerification" 
          class="btn btn-primary"
          :disabled="isResending"
        >
          {{ isResending ? 'Đang gửi...' : 'Gửi lại liên kết xác thực' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'VerifyEmail',
  
  setup() {
    const route = useRoute();
    const authStore = useAuthStore();
    
    const isLoading = ref(true);
    const isResending = ref(false);
    const verificationSuccess = ref(false);
    const verificationError = ref(false);
    const errorMessage = ref('');
    const userEmail = ref('');
    
    onMounted(async () => {
      const token = route.params.token;
      
      if (!token) {
        isLoading.value = false;
        verificationError.value = true;
        errorMessage.value = 'Liên kết xác thực không hợp lệ. Thiếu token xác thực.';
        return;
      }
      
      try {
        // Verify email with token
        const response = await authStore.verifyEmail(token);
        verificationSuccess.value = true;
      } catch (error) {
        verificationError.value = true;
        errorMessage.value = error.response?.data?.message || 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.';
        
        // Try to extract email from JWT token for resend functionality
        try {
          const tokenData = JSON.parse(atob(token.split('.')[1]));
          if (tokenData.email) {
            userEmail.value = tokenData.email;
          }
        } catch (e) {
          // Unable to extract email from token
        }
      } finally {
        isLoading.value = false;
      }
    });
    
    const resendVerification = async () => {
      if (!userEmail.value) {
        errorMessage.value = 'Không thể xác định địa chỉ email của bạn. Vui lòng đăng nhập và yêu cầu gửi lại email xác thực.';
        return;
      }
      
      isResending.value = true;
      
      try {
        await authStore.resendVerificationEmail(userEmail.value);
        errorMessage.value = 'Email xác thực mới đã được gửi. Vui lòng kiểm tra hộp thư của bạn.';
      } catch (error) {
        errorMessage.value = error.response?.data?.message || 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.';
      } finally {
        isResending.value = false;
      }
    };
    
    return {
      isLoading,
      isResending,
      verificationSuccess,
      verificationError,
      errorMessage,
      resendVerification
    };
  }
};
</script>

<style scoped>
.verify-email-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.verify-email-box {
  width: 100%;
  max-width: 500px;
  padding: 30px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 0;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 90, 95, 0.2);
  border-radius: 50%;
  border-top-color: #FF5A5F;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: inline-block;
}

.btn-primary {
  background-color: #FF5A5F;
  color: white;
}

.btn-primary:hover {
  background-color: #FF2D55;
}

.btn:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
</style>