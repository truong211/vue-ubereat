<template>
  <div class="forgot-password-form">
    <v-form ref="form" @submit.prevent="sendResetLink" v-model="isFormValid">
      <!-- Step 1: Enter Email -->
      <div v-if="currentStep === 1">
        <h2 class="text-h4 font-weight-bold text-center mb-4">Forgot Password</h2>
        <p class="text-body-1 text-center mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
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
        
        <!-- Success Alert -->
        <v-alert
          v-if="successMessage"
          type="success"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="successMessage = ''"
        >
          {{ successMessage }}
        </v-alert>
        
        <!-- Email Field -->
        <v-text-field
          v-model="email"
          label="Email Address"
          type="email"
          variant="outlined"
          prepend-inner-icon="mdi-email"
          :rules="[rules.required, rules.email]"
          :disabled="loading"
          required
          class="mb-6"
        ></v-text-field>
        
        <!-- Submit Button -->
        <v-btn
          type="submit"
          color="primary"
          block
          size="large"
          :loading="loading"
          :disabled="!isFormValid || loading"
          class="mb-6"
        >
          Send Reset Link
        </v-btn>
        
        <!-- Back to Login -->
        <div class="text-center">
          <v-btn
            variant="text"
            color="primary"
            :to="{ name: 'Login' }"
            :disabled="loading"
          >
            Back to Login
          </v-btn>
        </div>
      </div>
      
      <!-- Step 2: Check Email -->
      <div v-if="currentStep === 2" class="text-center">
        <v-icon
          icon="mdi-email-check"
          color="primary"
          size="64"
          class="mb-4"
        ></v-icon>
        
        <h2 class="text-h4 font-weight-bold mb-4">Check Your Email</h2>
        <p class="text-body-1 mb-2">
          We've sent a password reset link to:
        </p>
        <p class="text-body-1 font-weight-bold mb-6">{{ email }}</p>
        
        <p class="text-body-2 mb-6">
          Click the link in the email to reset your password. If you don't see the email, check your spam folder.
        </p>
        
        <v-btn
          color="primary"
          variant="outlined"
          @click="resendEmail"
          :loading="resendLoading"
          :disabled="resendLoading"
          class="mb-4"
        >
          Resend Email
        </v-btn>
        
        <p class="text-body-2 mb-6">
          Didn't receive the email? Check your spam folder or try another email address.
        </p>
        
        <v-btn
          variant="text"
          color="primary"
          @click="currentStep = 1"
          :disabled="resendLoading"
        >
          Try Another Email
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'ForgotPassword',
  
  data() {
    return {
      email: '',
      loading: false,
      resendLoading: false,
      error: '',
      successMessage: '',
      isFormValid: false,
      currentStep: 1,
      rules: {
        required: v => !!v || 'This field is required',
        email: v => /.+@.+\..+/.test(v) || 'Please enter a valid email'
      }
    };
  },
  
  methods: {
    ...mapActions({
      forgotPasswordAction: 'auth/forgotPassword'
    }),
    
    async sendResetLink() {
      if (!this.$refs.form.validate()) return;
      
      this.loading = true;
      this.error = '';
      this.successMessage = '';
      
      try {
        await this.forgotPasswordAction({ email: this.email });
        
        // Move to step 2
        this.currentStep = 2;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to send reset link. Please try again.';
        console.error('Password reset error:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async resendEmail() {
      this.resendLoading = true;
      this.error = '';
      
      try {
        await this.forgotPasswordAction({ email: this.email });
        this.successMessage = 'Reset link has been resent to your email.';
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to resend reset link. Please try again.';
        console.error('Password reset error:', error);
      } finally {
        this.resendLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.forgot-password-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}
</style>