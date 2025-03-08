<template>
  <div class="verify-email-container">
    <!-- Loading State -->
    <div v-if="loading" class="text-center">
      <v-progress-circular
        indeterminate
        color="primary"
        size="64"
        class="mb-4"
      ></v-progress-circular>
      <h2 class="text-h5 font-weight-medium">Verifying your email...</h2>
    </div>
    
    <!-- Auto Verification (when token is in URL) -->
    <div v-else-if="isTokenVerification" class="text-center">
      <template v-if="verificationSuccess">
        <v-icon
          icon="mdi-check-circle"
          color="success"
          size="64"
          class="mb-4"
        ></v-icon>
        <h2 class="text-h4 font-weight-bold mb-4">Email Verified!</h2>
        <p class="text-body-1 mb-6">
          Your email has been successfully verified. You can now access all features of your account.
        </p>
        <v-btn
          color="primary"
          :to="{ name: 'Home' }"
          size="large"
        >
          Continue to Homepage
        </v-btn>
      </template>
      
      <template v-else>
        <v-icon
          icon="mdi-alert-circle"
          color="error"
          size="64"
          class="mb-4"
        ></v-icon>
        <h2 class="text-h4 font-weight-bold mb-4">Verification Failed</h2>
        <p class="text-body-1 mb-2">
          {{ error || "We couldn't verify your email. The verification link may have expired or is invalid." }}
        </p>
        <p class="text-body-1 mb-6">
          Please request a new verification link.
        </p>
        <v-btn
          color="primary"
          @click="resendVerification"
          :loading="resendLoading"
          :disabled="resendLoading"
          class="mb-4"
        >
          Resend Verification Email
        </v-btn>
      </template>
    </div>
    
    <!-- Manual Verification Page (when user is redirected after registration) -->
    <v-card v-else class="verify-email-card">
      <v-card-text class="text-center pa-6">
        <v-icon
          icon="mdi-email-check"
          color="primary"
          size="64"
          class="mb-4"
        ></v-icon>
        
        <h2 class="text-h4 font-weight-bold mb-4">Verify Your Email</h2>
        
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
        
        <p class="text-body-1 mb-2">
          We've sent a verification email to:
        </p>
        <p class="text-body-1 font-weight-bold mb-6">{{ userEmail }}</p>
        
        <p class="text-body-2 mb-6">
          Please check your email and click the verification link to activate your account.
          If you don't see the email, check your spam folder.
        </p>
        
        <v-btn
          color="primary"
          @click="resendVerification"
          :loading="resendLoading"
          :disabled="resendLoading"
          class="mb-6"
        >
          Resend Verification Email
        </v-btn>
        
        <div class="d-flex justify-space-between">
          <v-btn
            variant="text"
            :to="{ name: 'Login' }"
          >
            Back to Login
          </v-btn>
          
          <v-btn
            variant="text"
            color="primary"
            @click="showUpdateEmailDialog = true"
          >
            Change Email
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Update Email Dialog -->
    <v-dialog v-model="showUpdateEmailDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 pa-4">
          Update Email Address
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-form ref="emailForm" @submit.prevent="updateEmail" v-model="isEmailFormValid">
            <v-text-field
              v-model="newEmail"
              label="New Email Address"
              type="email"
              variant="outlined"
              :rules="[rules.required, rules.email]"
              :disabled="updateEmailLoading"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showUpdateEmailDialog = false"
            :disabled="updateEmailLoading"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="updateEmail"
            :loading="updateEmailLoading"
            :disabled="!isEmailFormValid || updateEmailLoading"
          >
            Update Email
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'VerifyEmail',
  
  data() {
    return {
      loading: false,
      error: '',
      successMessage: '',
      verificationSuccess: false,
      resendLoading: false,
      showUpdateEmailDialog: false,
      newEmail: '',
      isEmailFormValid: false,
      updateEmailLoading: false,
      rules: {
        required: v => !!v || 'This field is required',
        email: v => /.+@.+\..+/.test(v) || 'Please enter a valid email'
      }
    };
  },
  
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    
    userEmail() {
      return this.user?.email || localStorage.getItem('pendingVerificationEmail') || '';
    },
    
    isTokenVerification() {
      return !!this.$route.query.token;
    }
  },
  
  created() {
    // If there's a token in the URL, verify it automatically
    if (this.isTokenVerification) {
      this.verifyToken(this.$route.query.token);
    }
  },
  
  methods: {
    ...mapActions({
      verifyEmailAction: 'auth/verifyEmail',
      resendVerificationAction: 'auth/resendVerification',
      updateEmailAction: 'auth/updateEmail'
    }),
    
    async verifyToken(token) {
      this.loading = true;
      this.error = '';
      
      try {
        await this.verifyEmailAction({ token });
        this.verificationSuccess = true;
      } catch (error) {
        this.error = error.response?.data?.message || 'Email verification failed. Please try again.';
        console.error('Email verification error:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async resendVerification() {
      this.resendLoading = true;
      this.error = '';
      this.successMessage = '';
      
      try {
        await this.resendVerificationAction({ email: this.userEmail });
        this.successMessage = 'Verification email has been resent. Please check your inbox.';
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to resend verification email. Please try again.';
        console.error('Resend verification error:', error);
      } finally {
        this.resendLoading = false;
      }
    },
    
    async updateEmail() {
      if (!this.$refs.emailForm.validate()) return;
      
      this.updateEmailLoading = true;
      this.error = '';
      
      try {
        await this.updateEmailAction({ email: this.newEmail });
        
        // Update local storage with new email
        localStorage.setItem('pendingVerificationEmail', this.newEmail);
        
        this.successMessage = 'Email updated successfully. A verification email has been sent to your new address.';
        this.showUpdateEmailDialog = false;
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to update email. Please try again.';
        console.error('Update email error:', error);
      } finally {
        this.updateEmailLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.verify-email-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 0 20px;
}

.verify-email-card {
  border-radius: 8px;
}
</style> 