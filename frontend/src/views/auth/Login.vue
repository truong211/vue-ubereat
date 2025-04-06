<template>
  <div class="login-container">
    <div class="login-form">
      <v-card class="pa-6 rounded-lg elevation-3">
        <div class="text-center mb-6">
          <v-avatar size="80" color="primary" class="mb-4">
            <v-icon size="40" color="white">mdi-account</v-icon>
          </v-avatar>
          <h1 class="text-h5 font-weight-bold">Đăng nhập</h1>
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
            :rules="[
              v => !!v || 'Vui lòng nhập email',
              v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email không hợp lệ'
            ]"
            prepend-inner-icon="mdi-email"
            required
            class="mb-4"
          ></v-text-field>

          <!-- Password Field -->
          <v-text-field
            v-model="formData.password"
            label="Mật khẩu"
            :type="showPassword ? 'text' : 'password'"
            :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showPassword = !showPassword"
            variant="outlined"
            :rules="[
              v => !!v || 'Vui lòng nhập mật khẩu',
              v => v.length >= 6 || 'Mật khẩu phải có ít nhất 6 ký tự'
            ]"
            prepend-inner-icon="mdi-lock"
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
            class="mb-6"
          >
            Đăng nhập
          </v-btn>

          <!-- Social Login Divider -->
          <div class="text-center my-4 position-relative">
            <span class="divider-text">hoặc đăng nhập với</span>
          </div>

          <!-- Social Login Buttons -->
          <div class="d-flex gap-2 mb-4">
            <v-btn
              variant="outlined"
              color="error"
              prepend-icon="mdi-google"
              block
              @click="googleLogin"
              :loading="socialLoading.google"
              :disabled="isLoading"
            >
              Google
            </v-btn>

            <v-btn
              variant="outlined"
              color="primary"
              prepend-icon="mdi-facebook"
              block
              @click="facebookLogin"
              :loading="socialLoading.facebook"
              :disabled="isLoading"
            >
              Facebook
            </v-btn>
          </div>

          <!-- Register Link -->
          <div class="text-center mt-4">
            <span class="text-medium-emphasis">Chưa có tài khoản?</span>
            <router-link to="/auth/register" class="ml-1 text-primary text-decoration-none">Đăng ký</router-link>
          </div>
        </v-form>
      </v-card>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

export default {
  name: 'Login',

  setup() {
    const store = useStore();
    const router = useRouter();
    const route = useRoute();

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
    const socialLoading = ref({
      google: false,
      facebook: false
    });

    // Computed
    const isLoading = computed(() => store.getters['auth/loading']);

    // Check for redirects
    const redirectPath = computed(() => route.query.redirect || '/');

    // Methods
    const login = async () => {
      if (!isFormValid.value) return;

      try {
        message.value = '';
        await store.dispatch('auth/login', {
          email: formData.value.email,
          password: formData.value.password
        });

        // Redirect after successful login
        router.push(redirectPath.value);
      } catch (error) {
        message.value = error || 'Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.';
        messageType.value = 'error';
      }
    };

    const googleLogin = async () => {
      try {
        socialLoading.value.google = true;
        message.value = '';

        // Your implementation will depend on how you set up Google Auth
        // This is a placeholder - you'll need to implement the actual OAuth flow
        const result = await window.gapi.auth2.getAuthInstance().signIn();
        const accessToken = result.getAuthResponse().id_token;

        await store.dispatch('auth/loginWithSocial', {
          provider: 'google',
          accessToken
        });

        // Redirect after successful login
        router.push(redirectPath.value);
      } catch (error) {
        message.value = 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
        console.error('Google login error:', error);
      } finally {
        socialLoading.value.google = false;
      }
    };

    const facebookLogin = async () => {
      try {
        socialLoading.value.facebook = true;
        message.value = '';

        // Your implementation will depend on how you set up Facebook Auth
        // This is a placeholder - you'll need to implement the actual OAuth flow
        const response = await new Promise((resolve) => {
          window.FB.login((response) => {
            resolve(response);
          }, { scope: 'email,public_profile' });
        });

        if (response.status === 'connected') {
          const accessToken = response.authResponse.accessToken;

          await store.dispatch('auth/loginWithSocial', {
            provider: 'facebook',
            accessToken
          });

          // Redirect after successful login
          router.push(redirectPath.value);
        } else {
          throw new Error('Facebook login failed');
        }
      } catch (error) {
        message.value = 'Đăng nhập bằng Facebook thất bại. Vui lòng thử lại.';
        messageType.value = 'error';
        console.error('Facebook login error:', error);
      } finally {
        socialLoading.value.facebook = false;
      }
    };

    // Check for error message in query params (e.g., from callback failures)
    if (route.query.error) {
      message.value = route.query.error;
      messageType.value = 'error';
    }

    return {
      form,
      isFormValid,
      formData,
      rememberMe,
      showPassword,
      message,
      messageType,
      isLoading,
      socialLoading,
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

.divider-text {
  position: relative;
  padding: 0 10px;
  background: white;
  z-index: 1;
  color: rgba(0, 0, 0, 0.6);
}

.divider-text::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -40%;
  right: -40%;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
  z-index: -1;
}

/* Animation for the login form */
.login-form {
  animation: fadeInUp 0.5s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
