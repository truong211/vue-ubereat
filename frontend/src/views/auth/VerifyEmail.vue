<template>
  <div class="verify-email-container">
    <div class="verify-email-card">
      <v-card class="pa-6 rounded-lg elevation-3">
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="mt-4 text-body-1">Đang xác thực email của bạn...</p>
        </div>

        <div v-else-if="verified" class="text-center py-6">
          <v-icon
            icon="mdi-email-check"
            color="success"
            size="64"
            class="mb-4"
          ></v-icon>
          
          <h2 class="text-h4 font-weight-bold mb-2">Email đã được xác thực!</h2>
          <p class="text-body-1 mb-6">
            Địa chỉ email của bạn đã được xác thực thành công. Bạn có thể đăng nhập ngay bây giờ.
          </p>
          
          <v-btn
            color="primary"
            size="large"
            @click="goToLogin"
          >
            Đăng nhập
          </v-btn>
        </div>

        <div v-else class="text-center py-6">
          <v-icon
            icon="mdi-email-alert"
            color="error"
            size="64"
            class="mb-4"
          ></v-icon>
          
          <h2 class="text-h4 font-weight-bold mb-2">Xác thực thất bại</h2>
          <p class="text-body-1 mb-2">
            {{ errorMessage || 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.' }}
          </p>
          <p class="text-body-1 mb-6">
            Vui lòng yêu cầu gửi lại email xác thực hoặc liên hệ với bộ phận hỗ trợ.
          </p>
          
          <div class="d-flex flex-column gap-3">
            <v-btn
              color="primary"
              variant="outlined"
              size="large"
              :loading="resendLoading"
              :disabled="resendLoading"
              @click="resendVerification"
              class="mb-2"
            >
              Gửi lại email xác thực
            </v-btn>
            
            <v-btn
              color="primary"
              size="large"
              @click="goToLogin"
            >
              Đăng nhập
            </v-btn>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'VerifyEmail',
  
  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();
    
    // State
    const loading = ref(true);
    const verified = ref(false);
    const errorMessage = ref('');
    const email = ref('');
    const resendLoading = ref(false);
    
    // Methods
    const verifyEmail = async (token) => {
      try {
        loading.value = true;
        
        // Call API to verify email
        await store.dispatch('auth/verifyEmail', { token });
        
        verified.value = true;
      } catch (error) {
        verified.value = false;
        errorMessage.value = error || 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.';
      } finally {
        loading.value = false;
      }
    };
    
    const resendVerification = async () => {
      if (!email.value) {
        errorMessage.value = 'Không thể gửi lại email xác thực. Vui lòng đăng nhập để yêu cầu gửi lại.';
        return;
      }
      
      try {
        resendLoading.value = true;
        
        // Call API to resend verification email
        await store.dispatch('auth/resendVerificationEmail', { email: email.value });
        
        errorMessage.value = '';
        alert('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư của bạn.');
      } catch (error) {
        errorMessage.value = error || 'Không thể gửi lại email xác thực. Vui lòng thử lại sau.';
      } finally {
        resendLoading.value = false;
      }
    };
    
    const goToLogin = () => {
      router.push('/auth/login');
    };
    
    // Initialize
    onMounted(async () => {
      const token = route.query.token;
      email.value = route.query.email || '';
      
      if (token) {
        await verifyEmail(token);
      } else {
        loading.value = false;
        verified.value = false;
        errorMessage.value = 'Không tìm thấy token xác thực trong URL.';
      }
    });
    
    return {
      loading,
      verified,
      errorMessage,
      resendLoading,
      resendVerification,
      goToLogin
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

.verify-email-card {
  width: 100%;
  max-width: 500px;
}
</style>