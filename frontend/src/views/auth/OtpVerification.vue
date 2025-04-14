<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="mx-auto pa-6" elevation="8">
          <div class="text-center mb-6">
            <h1 class="text-h4 font-weight-bold">Verify Your Account</h1>
            <p class="text-body-1 text-medium-emphasis">
              Please enter the verification code sent to your {{ verificationType }}
            </p>
          </div>

          <v-form ref="form" v-model="isFormValid" @submit.prevent="handleSubmit">
            <!-- OTP Input -->
            <v-text-field
              v-model="otp"
              label="Verification Code"
              variant="outlined"
              :rules="otpRules"
              maxlength="6"
              class="mb-4"
              required
              prepend-inner-icon="mdi-lock-outline"
            ></v-text-field>

            <!-- Verify button -->
            <v-btn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="isLoading"
              :disabled="!isFormValid || isLoading"
              class="mb-4"
            >
              Verify
            </v-btn>

            <!-- Error message -->
            <v-alert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mb-4"
              closable
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </v-alert>

            <!-- Resend code -->
            <div class="text-center">
              <p class="text-medium-emphasis mb-2">
                Didn't receive the code?
                <v-btn
                  variant="text"
                  :disabled="resendCountdown > 0 || isResending"
                  @click="handleResendOtp"
                  class="pa-0"
                >
                  {{ resendButtonText }}
                </v-btn>
              </p>
            </div>
          </v-form>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { defineComponent } from 'vue';
import { useAuthStore } from '@/stores/auth'; // Import Pinia auth store

export default defineComponent({ // Use defineComponent
  name: 'OtpVerification',
  setup() {
    const authStore = useAuthStore();
    return { authStore }; // Expose store instance
  },

  data() {
    return {
      otp: '',
      isFormValid: false,
      isLoading: false,
      isResending: false,
      errorMessage: '',
      resendCountdown: 0,
      resendTimer: null,

      otpRules: [
        v => !!v || 'Verification code is required',
        v => /^[0-9]{6}$/.test(v) || 'Verification code must be 6 digits'
      ]
    };
  },
  computed: {
    verificationType() {
      return this.$route.query.type === 'sms' ? 'phone number' : 'email';
    },
    resendButtonText() {
      return this.resendCountdown > 0
        ? `Resend code in ${this.resendCountdown}s`
        : 'Resend code';
    }
  },
  methods: {
    // Removed mapActions block. Methods will call store actions directly.

    startResendTimer() {
      this.resendCountdown = 60;
      this.resendTimer = setInterval(() => {
        if (this.resendCountdown > 0) {
          this.resendCountdown--;
        } else {
          clearInterval(this.resendTimer);
        }
      }, 1000);
    },

    async handleSubmit() {
      if (!this.$refs.form.validate()) return;

      this.isLoading = true;
      this.errorMessage = '';

      try {
        // Call action on authStore instance
        await this.authStore.verifyOTP({
          email: this.$route.query.email,
          otp: this.otp,
          type: this.$route.query.type || 'email'
        });

        // Redirect to login page after successful verification
        this.$router.push('/auth/login?verified=true');
      } catch (error) {
        console.error('OTP verification error:', error);
        this.errorMessage = error.response?.data?.message || 'Failed to verify code. Please try again.';
      } finally {
        this.isLoading = false;
      }
    },

    async handleResendOtp() {
      this.isResending = true;
      this.errorMessage = '';

      try {
        // Call action on authStore instance
        await this.authStore.resendOTP({
          email: this.$route.query.email,
          type: this.$route.query.type || 'email'
        });

        this.startResendTimer();
      } catch (error) {
        console.error('Resend OTP error:', error);
        this.errorMessage = error.response?.data?.message || 'Failed to resend code. Please try again.';
      } finally {
        this.isResending = false;
      }
    }
  },
  created() {
    // Start the resend timer when component is created
    this.startResendTimer();
  },
  beforeDestroy() {
    // Clean up the timer when component is destroyed
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }
}); // Close defineComponent
</script>