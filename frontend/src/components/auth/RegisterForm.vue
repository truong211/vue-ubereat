<template>
  <v-form @submit.prevent="handleSubmit">
    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="firstName"
            :error-messages="errors.firstName"
            label="First Name"
            required
            @input="handleChange('firstName', $event)"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            v-model="lastName"
            :error-messages="errors.lastName"
            label="Last Name"
            required
            @input="handleChange('lastName', $event)"
          />
        </v-col>
      </v-row>

      <v-text-field
        v-model="email"
        :error-messages="errors.email"
        label="Email"
        type="email"
        required
        @input="handleChange('email', $event)"
      />

      <v-text-field
        v-model="phone"
        :error-messages="errors.phone"
        label="Phone Number"
        required
        @input="handleChange('phone', $event)"
      />

      <v-text-field
        v-model="password"
        :error-messages="errors.password"
        :append-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showPassword ? 'text' : 'password'"
        label="Password"
        required
        @click:append="showPassword = !showPassword"
        @input="handleChange('password', $event)"
      />

      <v-text-field
        v-model="confirmPassword"
        :error-messages="errors.confirmPassword"
        :append-icon="showConfirmPassword ? 'mdi-eye' : 'mdi-eye-off'"
        :type="showConfirmPassword ? 'text' : 'password'"
        label="Confirm Password"
        required
        @click:append="showConfirmPassword = !showConfirmPassword"
        @input="handleChange('confirmPassword', $event)"
      />

      <v-checkbox
        v-model="agreeTerms"
        :error-messages="errors.agreeTerms"
        label="I agree to the Terms and Conditions"
        required
        @change="handleChange('agreeTerms', $event)"
      />

      <v-btn
        type="submit"
        color="primary"
        block
        :loading="isSubmitting"
        class="mb-4"
      >
        Register
      </v-btn>

      <v-divider class="mb-4">
        <span class="text-body-2">or continue with</span>
      </v-divider>

      <v-row class="mb-4">
        <v-col cols="12" md="6">
          <v-btn
            block
            color="#DB4437"
            variant="elevated"
            @click="handleGoogleSignIn"
            :loading="isGoogleLoading"
          >
            <v-icon start>mdi-google</v-icon>
            Google
          </v-btn>
        </v-col>
        <v-col cols="12" md="6">
          <v-btn
            block
            color="#4267B2"
            variant="elevated"
            @click="handleFacebookSignIn"
            :loading="isFacebookLoading"
          >
            <v-icon start>mdi-facebook</v-icon>
            Facebook
          </v-btn>
        </v-col>
      </v-row>

      <div id="recaptcha-container"></div>
    </v-container>
  </v-form>
</template>

<script setup>
import { ref } from 'vue';
import { useForm } from 'vee-validate';
import { registerSchema } from '@/validations/auth';
import { signInWithGoogle, signInWithFacebook } from '@/services/social-auth';
import otpAuth from '@/services/otp-auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isGoogleLoading = ref(false);
const isFacebookLoading = ref(false);

const { handleSubmit, errors, values, handleChange, isSubmitting } = useForm({
  validationSchema: registerSchema,
  initialValues: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  }
});

const handleGoogleSignIn = async () => {
  try {
    isGoogleLoading.value = true;
    const result = await signInWithGoogle();
    // Handle successful Google sign-in
    console.log('Google sign-in successful:', result);
    router.push('/verify-otp');
  } catch (error) {
    console.error('Google sign-in error:', error);
  } finally {
    isGoogleLoading.value = false;
  }
};

const handleFacebookSignIn = async () => {
  try {
    isFacebookLoading.value = true;
    const result = await signInWithFacebook();
    // Handle successful Facebook sign-in
    console.log('Facebook sign-in successful:', result);
    router.push('/verify-otp');
  } catch (error) {
    console.error('Facebook sign-in error:', error);
  } finally {
    isFacebookLoading.value = false;
  }
};

const onSubmit = handleSubmit(async (values) => {
  try {
    // Initialize reCAPTCHA for phone verification
    otpAuth.initRecaptcha();

    // Send OTP to email
    const emailVerificationId = await otpAuth.sendEmailOTP(values.email);
    
    // Send OTP to phone
    const phoneVerificationId = await otpAuth.sendPhoneOTP(values.phone);

    // Store verification IDs and form data in Vuex or localStorage for OTP verification
    localStorage.setItem('registrationData', JSON.stringify({
      ...values,
      emailVerificationId,
      phoneVerificationId
    }));

    // Redirect to OTP verification page
    router.push('/verify-otp');
  } catch (error) {
    console.error('Registration error:', error);
  }
});
</script>

<style scoped>
.v-divider {
  margin: 24px 0;
  position: relative;
}

.v-divider span {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: white;
  padding: 0 12px;
}
</style>