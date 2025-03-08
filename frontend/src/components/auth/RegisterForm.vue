<template>
  <div class="register-form">
    <v-form ref="form" @submit.prevent="register" v-model="isFormValid">
      <h2 class="text-h4 font-weight-bold text-center mb-6">Create Account</h2>
      
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
      
      <!-- Name Fields -->
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="firstName"
            label="First Name"
            variant="outlined"
            prepend-inner-icon="mdi-account"
            :rules="[rules.required]"
            :disabled="loading"
            required
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="lastName"
            label="Last Name"
            variant="outlined"
            :rules="[rules.required]"
            :disabled="loading"
            required
          ></v-text-field>
        </v-col>
      </v-row>
      
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
      
      <!-- Phone Field -->
      <v-text-field
        v-model="phone"
        label="Phone Number"
        variant="outlined"
        prepend-inner-icon="mdi-phone"
        :rules="[rules.required, rules.phone]"
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
        :rules="[rules.required, rules.minLength, rules.password]"
        :disabled="loading"
        required
        class="mb-3"
      ></v-text-field>
      
      <!-- Confirm Password Field -->
      <v-text-field
        v-model="confirmPassword"
        label="Confirm Password"
        :type="showConfirmPassword ? 'text' : 'password'"
        variant="outlined"
        prepend-inner-icon="mdi-lock-check"
        :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showConfirmPassword = !showConfirmPassword"
        :rules="[rules.required, rules.passwordMatch]"
        :disabled="loading"
        required
        class="mb-4"
      ></v-text-field>
      
      <!-- Terms and Conditions -->
      <v-checkbox
        v-model="agreeTerms"
        :rules="[rules.agreeTerms]"
        :disabled="loading"
        class="mb-4"
      >
        <template v-slot:label>
          <div>
            I agree to the 
            <a href="#" @click.prevent="showTerms = true" class="text-primary">Terms of Service</a>
            and
            <a href="#" @click.prevent="showPrivacy = true" class="text-primary">Privacy Policy</a>
          </div>
        </template>
      </v-checkbox>
      
      <!-- Register Button -->
      <v-btn
        type="submit"
        color="primary"
        block
        size="large"
        :loading="loading"
        :disabled="!isFormValid || loading"
        class="mb-6"
      >
        Create Account
      </v-btn>
      
      <!-- Social Login Divider -->
      <div class="text-center mb-4 position-relative">
        <span class="divider-text">or sign up with</span>
      </div>
      
      <!-- Social Login Buttons -->
      <div class="d-flex justify-space-between mb-6">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-google"
          width="48%"
          :loading="socialLoading.google"
          :disabled="loading"
          @click="socialRegister('google')"
        >
          Google
        </v-btn>
        
        <v-btn
          variant="outlined"
          prepend-icon="mdi-facebook"
          width="48%"
          :loading="socialLoading.facebook"
          :disabled="loading"
          @click="socialRegister('facebook')"
        >
          Facebook
        </v-btn>
      </div>
      
      <!-- Login Link -->
      <div class="text-center">
        <span class="text-body-2">Already have an account?</span>
        <v-btn
          variant="text"
          color="primary"
          :to="{ name: 'Login' }"
          :disabled="loading"
        >
          Log In
        </v-btn>
      </div>
    </v-form>
    
    <!-- Terms of Service Dialog -->
    <v-dialog v-model="showTerms" max-width="700">
      <v-card>
        <v-card-title class="text-h5">Terms of Service</v-card-title>
        <v-card-text>
          <div class="terms-content">
            <h3>1. Acceptance of Terms</h3>
            <p>By accessing and using our food delivery service, you agree to be bound by these Terms of Service.</p>
            
            <h3>2. User Accounts</h3>
            <p>You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.</p>
            
            <h3>3. Ordering and Payment</h3>
            <p>All orders are subject to availability. Payment must be made at the time of ordering.</p>
            
            <h3>4. Delivery</h3>
            <p>Delivery times are estimates and may vary based on traffic, weather, and other factors.</p>
            
            <h3>5. Cancellation Policy</h3>
            <p>Orders can be cancelled before they are confirmed by the restaurant. Once confirmed, cancellation may be subject to fees.</p>
            
            <h3>6. User Conduct</h3>
            <p>Users agree not to use the service for any unlawful purpose or in any way that could damage or impair the service.</p>
            
            <h3>7. Modifications to Terms</h3>
            <p>We reserve the right to modify these terms at any time. Continued use of the service after such modifications constitutes acceptance of the new terms.</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showTerms = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Privacy Policy Dialog -->
    <v-dialog v-model="showPrivacy" max-width="700">
      <v-card>
        <v-card-title class="text-h5">Privacy Policy</v-card-title>
        <v-card-text>
          <div class="terms-content">
            <h3>1. Information We Collect</h3>
            <p>We collect personal information such as name, email, phone number, and delivery address to provide our services.</p>
            
            <h3>2. How We Use Your Information</h3>
            <p>We use your information to process orders, provide customer support, and improve our services.</p>
            
            <h3>3. Information Sharing</h3>
            <p>We share your information with restaurants and delivery partners to fulfill your orders.</p>
            
            <h3>4. Data Security</h3>
            <p>We implement appropriate security measures to protect your personal information.</p>
            
            <h3>5. Cookies</h3>
            <p>We use cookies to enhance your experience and analyze usage patterns.</p>
            
            <h3>6. Third-Party Services</h3>
            <p>We may use third-party services for payment processing, analytics, and marketing.</p>
            
            <h3>7. Your Rights</h3>
            <p>You have the right to access, correct, or delete your personal information.</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="showPrivacy = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'RegisterForm',
  
  data() {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      showPassword: false,
      showConfirmPassword: false,
      agreeTerms: false,
      loading: false,
      error: '',
      isFormValid: false,
      showTerms: false,
      showPrivacy: false,
      socialLoading: {
        google: false,
        facebook: false
      },
      rules: {
        required: v => !!v || 'This field is required',
        email: v => /.+@.+\..+/.test(v) || 'Please enter a valid email',
        phone: v => /^\+?[\d\s-]{10,}$/.test(v) || 'Please enter a valid phone number',
        minLength: v => v.length >= 8 || 'Password must be at least 8 characters',
        password: v => {
          const hasUppercase = /[A-Z]/.test(v);
          const hasLowercase = /[a-z]/.test(v);
          const hasNumber = /\d/.test(v);
          
          if (!hasUppercase) return 'Password must contain at least one uppercase letter';
          if (!hasLowercase) return 'Password must contain at least one lowercase letter';
          if (!hasNumber) return 'Password must contain at least one number';
          
          return true;
        },
        passwordMatch: v => v === this.password || 'Passwords do not match',
        agreeTerms: v => v || 'You must agree to the terms and conditions'
      }
    };
  },
  
  methods: {
    ...mapActions({
      registerAction: 'auth/register',
      socialLoginAction: 'auth/socialLogin'
    }),
    
    async register() {
      if (!this.$refs.form.validate()) return;
      
      this.loading = true;
      this.error = '';
      
      try {
        await this.registerAction({
          firstName: this.firstName,
          lastName: this.lastName,
          email: this.email,
          phone: this.phone,
          password: this.password
        });
        
        // Redirect to home or verification page
        this.$router.push({ name: 'VerifyEmail' });
      } catch (error) {
        this.error = error.response?.data?.message || 'Registration failed. Please try again.';
        console.error('Registration error:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async socialRegister(provider) {
      this.socialLoading[provider] = true;
      this.error = '';
      
      try {
        await this.socialLoginAction({ provider, isRegistration: true });
        
        // Redirect to home or profile completion page
        this.$router.push({ name: 'CompleteProfile' });
      } catch (error) {
        this.error = `${provider.charAt(0).toUpperCase() + provider.slice(1)} registration failed. Please try again.`;
        console.error(`${provider} registration error:`, error);
      } finally {
        this.socialLoading[provider] = false;
      }
    }
  }
};
</script>

<style scoped>
.register-form {
  max-width: 600px;
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

.terms-content {
  max-height: 400px;
  overflow-y: auto;
}

.terms-content h3 {
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 1.1rem;
  font-weight: 500;
}

.terms-content p {
  margin-bottom: 12px;
}
</style>