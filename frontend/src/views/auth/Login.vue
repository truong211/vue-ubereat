<template>
  <div class="login-container">
    <div class="login-form">
      <v-card class="pa-6 rounded-lg elevation-3">
        <div class="text-center mb-6">
          <v-avatar size="80" color="primary" class="mb-4">
            <v-icon size="40" color="white">mdi-account</v-icon>
          </v-avatar>
          <h1 class="text-h5 font-weight-bold">Đăng nhập</h1>
          <p class="text-subtitle-1 text-medium-emphasis mt-2">
            Chào mừng bạn trở lại! Hãy đăng nhập để tiếp tục.
          </p>
        </div>

        <v-alert
          v-if="message"
          :type="messageType"
          variant="tonal"
          class="mb-4"
          closable
          @click:close="message = ''"
        >
          {{ message }}
        </v-alert>

        <v-form ref="form" @submit.prevent="login" v-model="isFormValid">
          <!-- Email Field -->
          <v-text-field
            v-model="formData.email"
            label="Email"
            type="email"
            variant="outlined"
            prepend-inner-icon="mdi-email"
            :rules="[v => !!v || 'Email là bắt buộc', v => /.+@.+\..+/.test(v) || 'Email không hợp lệ']"
            required
            class="mb-3"
          ></v-text-field>

          <!-- Password Field -->
          <v-text-field
            v-model="formData.password"
            label="Mật khẩu"
            :type="showPassword ? 'text' : 'password'"
            variant="outlined"
            prepend-inner-icon="mdi-lock"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
            :rules="[v => !!v || 'Mật khẩu là bắt buộc']"
            required
            class="mb-2"
          ></v-text-field>

          <!-- Remember Me & Forgot Password -->
          <div class="d-flex align-center justify-space-between mb-6">
            <v-checkbox
              v-model="rememberMe"
              label="Nhớ đăng nhập"
              hide-details
              density="compact"
            ></v-checkbox>

            <router-link to="/auth/forgot-password" class="text-primary text-decoration-none">
              Quên mật khẩu?
            </router-link>
          </div>

          <!-- Login Button -->
          <v-btn
            type="submit"
            color="primary"
            block
            size="large"
            :loading="isLoading"
            :disabled="!isFormValid || isLoading"
            class="mb-6 login-btn"
          >
            Đăng nhập
          </v-btn>

          <!-- Social Login Divider -->
          <div class="text-center my-4 position-relative">
            <span class="divider-text">hoặc đăng nhập với</span>
          </div>

          <!-- Social Login Buttons -->
          <div class="d-flex flex-column gap-2 mb-4">
            <v-btn
              color="#DB4437"
              block
              variant="elevated"
              :loading="socialLoading.google"
              @click="googleLogin"
            >
              <v-icon start>mdi-google</v-icon>
              Google
            </v-btn>

            <v-btn
              color="#4267B2"
              block
              variant="elevated"
              :loading="socialLoading.facebook"
              @click="facebookLogin"
            >
              <v-icon start>mdi-facebook</v-icon>
              Facebook
            </v-btn>
          </div>

          <!-- Register Link -->
          <div class="text-center">
            <p class="text-body-2 mb-1">Chưa có tài khoản?</p>
            <router-link
              to="/register"
              class="text-decoration-none font-weight-medium"
            >
              Đăng ký ngay
            </router-link>
          </div>
        </v-form>

        <!-- Return Home Link -->
        <div class="text-center mt-6">
          <v-btn
            to="/"
            variant="text"
            prepend-icon="mdi-arrow-left"
            class="back-home-link"
            size="small"
          >
            Quay lại trang chủ
          </v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import socialAuth from '@/services/social-auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Form refs
const form = ref(null);
const isFormValid = ref(false);
const showPassword = ref(false);

// Form data
const formData = ref({
  email: '',
  password: '',
});

// UI state
const rememberMe = ref(false);
const message = ref('');
const messageType = ref('info');
const isLoading = ref(false);
const socialLoading = ref({
  google: false,
  facebook: false
});

// Computed
const redirectPath = computed(() => route.query.redirect || '/');

// Handle form validation errors
const handleValidationError = (error) => {
  message.value = error.message || 'Vui lòng kiểm tra thông tin đăng nhập.';
  messageType.value = 'error';
};

// Handle API errors
const handleApiError = (error) => {
  message.value = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại sau.';
  messageType.value = 'error';
  console.error('API error:', error);
};

// Login function
const login = async () => {
  try {
    isLoading.value = true;
    message.value = '';
    
    // Validate form
    const { valid } = await form.value.validate();
    if (!valid) {
      message.value = 'Vui lòng điền đầy đủ thông tin.';
      messageType.value = 'error';
      return;
    }
    
    // Login with email/password
    await authStore.login(formData.value);
    
    // Redirect to home page or intended path
    router.push(redirectPath.value);
  } catch (error) {
    console.error('Login error:', error);
    message.value = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.';
    messageType.value = 'error';
    
    // Log additional error details for debugging
    if (error.response) {
      console.log('Error response:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  } finally {
    isLoading.value = false;
  }
};

// Social login handler
const handleSocialLogin = async (provider) => {
  const loadingKey = provider.toLowerCase();
  socialLoading.value[loadingKey] = true;
  message.value = '';

  try {
    const result = await socialAuth.loginWithSocial(provider);
    await authStore.loginWithSocial({
      provider,
      ...result
    });
    router.push(redirectPath.value);
  } catch (error) {
    handleApiError(error);
    message.value = `Đăng nhập bằng ${provider} thất bại. Vui lòng thử lại.`;
  } finally {
    socialLoading.value[loadingKey] = false;
  }
};

// Social login functions
const googleLogin = () => handleSocialLogin('google');
const facebookLogin = () => handleSocialLogin('facebook');

// Initialize
onMounted(() => {
  // Check for error message in query params
  if (route.query.error) {
    message.value = route.query.error;
    messageType.value = 'error';
  }

  // Initialize social auth SDKs
  socialAuth.initSocialAuth().catch(error => {
    console.error('Failed to initialize social auth:', error);
  });
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
  background-image: url('/images/auth-bg.jpg');
  background-size: cover;
  background-position: center;
  position: relative;
}

.login-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 0;
}

.login-form {
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 1;
}

.login-btn {
  transition: transform 0.2s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
}

.divider-text {
  position: relative;
  padding: 0 10px;
  background-color: white;
  z-index: 1;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.875rem;
}

.text-center.my-4.position-relative::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
  z-index: 0;
}

.back-home-link {
  opacity: 0.7;
  transition: opacity 0.2s;
}

.back-home-link:hover {
  opacity: 1;
}

@media (max-width: 600px) {
  .login-form {
    padding: 0;
  }
}
</style>
