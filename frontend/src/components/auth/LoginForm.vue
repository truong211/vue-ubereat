<template>
  <div class="login-form">
    <v-form ref="form" @submit.prevent="login" v-model="isFormValid">
      <h2 class="text-h4 font-weight-bold text-center mb-6">Welcome Back</h2>
      
      <!-- Error Alert -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mb-4"
        @click:close="error = ''"
      >
        {{ error }}
      </v-alert>
      
      <!-- Email Field -->
      <v-text-field
        v-model="email"
        label="Email"
        type="email"
        variant="outlined"
        prepend-inner-icon="mdi-email"
        :rules="[rules.required, rules.email]"
        :disabled="loading"
        required
        class="mb-3"
      ></v-text-field>
      
      <!-- Password Field -->
      <v-text-field
        v-model="password"
        label="Password"
        :type="showPassword ? 'text' : 'password'"
        variant="outlined"
        prepend-inner-icon="mdi-lock"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showPassword = !showPassword"
        :rules="[rules.required, rules.minLength]"
        :disabled="loading"
        required
        class="mb-2"
      ></v-text-field>
      
      <!-- Remember Me & Forgot Password -->
      <div class="d-flex align-center justify-space-between mb-6">
        <v-checkbox
          v-model="rememberMe"
          label="Remember me"
          hide-details
          :disabled="loading"
          density="compact"
        ></v-checkbox>
        
        <v-btn
          variant="text"
          color="primary"
          :disabled="loading"
          :to="{ name: 'ForgotPassword' }"
          size="small"
        >
          Forgot Password?
        </v-btn>
      </div>
      
      <!-- Login Button -->
      <v-btn
        type="submit"
        color="primary"
        block
        size="large"
        :loading="loading"
        :disabled="!isFormValid || loading"
        class="mb-6"
      >
        Log In
      </v-btn>
      
      <!-- Social Login Divider -->
      <div class="text-center mb-4 position-relative">
        <span class="divider-text">or continue with</span>
      </div>
      
      <!-- Social Login Buttons -->
      <div class="d-flex justify-space-between mb-6">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-google"
          width="48%"
          :loading="socialLoading.google"
          :disabled="loading"
          @click="socialLogin('google')"
        >
          Google
        </v-btn>
        
        <v-btn
          variant="outlined"
          prepend-icon="mdi-facebook"
          width="48%"
          :loading="socialLoading.facebook"
          :disabled="loading"
          @click="socialLogin('facebook')"
        >
          Facebook
        </v-btn>
      </div>
      
      <!-- Register Link -->
      <div class="text-center">
        <span class="text-body-2">Don't have an account?</span>
        <v-btn
          variant="text"
          color="primary"
          :to="{ name: 'Register' }"
          :disabled="loading"
        >
          Sign Up
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'LoginForm',
  
  data() {
    return {
      email: '',
      password: '',
      rememberMe: false,
      showPassword: false,
      loading: false,
      error: '',
      isFormValid: false,
      socialLoading: {
        google: false,
        facebook: false
      },
      rules: {
        required: v => !!v || 'This field is required',
        email: v => /.+@.+\..+/.test(v) || 'Please enter a valid email',
        minLength: v => v.length >= 6 || 'Password must be at least 6 characters'
      }
    };
  },
  
  methods: {
    ...mapActions({
      loginAction: 'auth/login',
      socialLoginAction: 'auth/socialLogin'
    }),
    
    async login() {
      if (!this.$refs.form.validate()) return;
      
      this.loading = true;
      this.error = '';
      
      try {
        await this.loginAction({
          email: this.email,
          password: this.password,
          rememberMe: this.rememberMe
        });
        
        // Redirect to home or previous page
        const redirectPath = this.$route.query.redirect || '/';
        this.$router.push(redirectPath);
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed. Please check your credentials.';
        console.error('Login error:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async socialLogin(provider) {
      this.socialLoading[provider] = true;
      this.error = '';
      
      try {
        await this.socialLoginAction({ provider });
        
        // Redirect to home or previous page
        const redirectPath = this.$route.query.redirect || '/';
        this.$router.push(redirectPath);
      } catch (error) {
        this.error = `${provider.charAt(0).toUpperCase() + provider.slice(1)} login failed. Please try again.`;
        console.error(`${provider} login error:`, error);
      } finally {
        this.socialLoading[provider] = false;
      }
    }
  }
};
</script>

<style scoped>
.login-form {
  max-width: 450px;
  margin: 0 auto;
  padding: 20px;
}

.divider-text {
  background-color: white;
  padding: 0 10px;
  position: relative;
  z-index: 1;
}

.text-center.mb-4.position-relative::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: rgba(0, 0, 0, 0.12);
  z-index: 0;
}
</style>