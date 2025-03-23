<template>
  <div class="verify-otp-container">
    <div class="verify-otp-box">
      <h1 class="text-2xl font-bold mb-6">Xác thực số điện thoại</h1>
      
      <div v-if="message" :class="['alert', messageType === 'error' ? 'alert-error' : 'alert-success']">
        {{ message }}
      </div>
      
      <form v-if="!verificationSuccess" @submit.prevent="verifyOTP">
        <div class="text-center mb-6">
          <p>Mã xác thực đã được gửi đến số điện thoại {{ maskedPhone }}</p>
        </div>
        
        <div class="form-group">
          <label for="otp">Nhập mã xác thực OTP</label>
          <input 
            type="text" 
            id="otp" 
            v-model="otpCode"
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
              :disabled="isResending || resendCountdown > 0"
            >
              {{ resendCountdown > 0 ? `Gửi lại sau ${resendCountdown}s` : 'Gửi lại' }}
            </button>
          </p>
        </div>
      </form>
      
      <div v-else class="text-center">
        <div class="success-icon mb-4">✓</div>
        <h2 class="text-xl font-bold mb-2">Xác thực thành công!</h2>
        <p class="mb-4">Số điện thoại của bạn đã được xác thực thành công.</p>
        <router-link to="/login" class="btn btn-primary">Đăng nhập</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

export default {
  name: 'VerifyOTP',
  
  setup() {
    const route = useRoute();
    const authStore = useAuthStore();
    
    const otpCode = ref('');
    const phone = ref('');
    const isLoading = ref(false);
    const isResending = ref(false);
    const message = ref('');
    const messageType = ref('');
    const verificationSuccess = ref(false);
    const resendCountdown = ref(0);
    let countdownTimer = null;
    
    // Format phone to display only last 4 digits
    const maskedPhone = computed(() => {
      if (!phone.value) return '';
      const digits = phone.value.replace(/\D/g, '');
      const lastFour = digits.slice(-4);
      return `xxxx-xxx-${lastFour}`;
    });
    
    // Get phone number from URL params
    onMounted(() => {
      if (route.query.phone) {
        phone.value = route.query.phone;
        startResendCountdown();
      }
    });
    
    const verifyOTP = async () => {
      if (!otpCode.value || !phone.value) {
        message.value = 'Vui lòng nhập mã OTP';
        messageType.value = 'error';
        return;
      }
      
      isLoading.value = true;
      message.value = '';
      
      try {
        // Call API to verify OTP
        await authStore.verifyPhoneOTP(phone.value, otpCode.value);
        
        // Show success message
        verificationSuccess.value = true;
      } catch (error) {
        message.value = error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn';
        messageType.value = 'error';
      } finally {
        isLoading.value = false;
      }
    };
    
    const resendOTP = async () => {
      if (!phone.value) {
        message.value = 'Không thể xác định số điện thoại';
        messageType.value = 'error';
        return;
      }
      
      isResending.value = true;
      
      try {
        // Call API to resend OTP
        await authStore.resendPhoneOTP(phone.value);
        
        message.value = 'Mã OTP mới đã được gửi đến số điện thoại của bạn';
        messageType.value = 'success';
        
        // Reset countdown
        startResendCountdown();
      } catch (error) {
        message.value = error.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại sau.';
        messageType.value = 'error';
      } finally {
        isResending.value = false;
      }
    };
    
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
    
    // Clean up on component unmount
    onUnmounted(() => {
      if (countdownTimer) {
        clearInterval(countdownTimer);
      }
    });
    
    return {
      otpCode,
      maskedPhone,
      isLoading,
      isResending,
      message,
      messageType,
      verificationSuccess,
      resendCountdown,
      verifyOTP,
      resendOTP
    };
  }
};
</script>

<style scoped>
.verify-otp-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.verify-otp-box {
  width: 100%;
  max-width: 450px;
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