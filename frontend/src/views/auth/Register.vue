<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <v-stepper v-model="currentStep" class="elevation-2">
          <!-- Stepper Header -->
          <v-stepper-header>
            <v-stepper-item value="1" title="Account Details"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item value="2" title="Verification"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item value="3" title="Complete"></v-stepper-item>
          </v-stepper-header>

          <!-- Stepper Windows -->
          <v-stepper-window>
            <!-- Step 1: Registration Form -->
            <v-stepper-window-item value="1">
              <v-card flat>
                <v-card-title class="text-center text-h5 pt-4 pb-0">Create Account</v-card-title>
                
                <v-card-text>
                  <v-alert
                    v-if="error"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                    closable
                    @click:close="error = null"
                  >
                    {{ error }}
                  </v-alert>

                  <v-form ref="form" v-model="isFormValid" @submit.prevent="handleSubmit">
                    <!-- Name Field -->
                    <v-text-field
                      v-model="formData.name"
                      label="Full Name"
                      prepend-inner-icon="mdi-account"
                      variant="outlined"
                      :rules="nameRules"
                      required
                      class="mb-2"
                    ></v-text-field>

                    <!-- Email Field -->
                    <v-text-field
                      v-model="formData.email"
                      label="Email"
                      prepend-inner-icon="mdi-email"
                      variant="outlined"
                      :rules="emailRules"
                      required
                      class="mb-2"
                    ></v-text-field>

                    <!-- Phone Field -->
                    <v-text-field
                      v-model="formData.phone"
                      label="Phone Number"
                      prepend-inner-icon="mdi-phone"
                      variant="outlined"
                      :rules="phoneRules"
                      class="mb-2"
                    ></v-text-field>

                    <!-- Password Field -->
                    <v-text-field
                      v-model="formData.password"
                      label="Password"
                      prepend-inner-icon="mdi-lock"
                      variant="outlined"
                      :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                      :type="showPassword ? 'text' : 'password'"
                      @click:append-inner="showPassword = !showPassword"
                      :rules="passwordRules"
                      required
                      class="mb-2"
                    ></v-text-field>

                    <!-- Confirm Password Field -->
                    <v-text-field
                      v-model="formData.confirmPassword"
                      label="Confirm Password"
                      prepend-inner-icon="mdi-lock-check"
                      variant="outlined"
                      :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
                      :type="showConfirmPassword ? 'text' : 'password'"
                      @click:append-inner="showConfirmPassword = !showConfirmPassword"
                      :rules="confirmPasswordRules"
                      required
                      class="mb-4"
                    ></v-text-field>

                    <!-- Terms Checkbox -->
                    <v-checkbox
                      v-model="formData.agreeTerms"
                      :rules="termsRules"
                      required
                      class="mb-4"
                    >
                      <template v-slot:label>
                        <div>
                          I agree to the 
                          <a href="#" @click.prevent="showTerms = true">Terms and Conditions</a>
                          and 
                          <a href="#" @click.prevent="showPrivacy = true">Privacy Policy</a>
                        </div>
                      </template>
                    </v-checkbox>

                    <!-- Submit Button -->
                    <v-btn
                      type="submit"
                      color="primary"
                      size="large"
                      block
                      :loading="isLoading"
                      :disabled="!isFormValid || isLoading"
                    >
                      Register
                    </v-btn>

                    <!-- Social Login Divider -->
                    <div class="my-4 text-center">
                      <span class="text-medium-emphasis">or continue with</span>
                    </div>

                    <!-- Social Login Buttons -->
                    <div class="d-flex gap-2 mb-4">
                      <v-btn
                        variant="outlined"
                        color="error"
                        prepend-icon="mdi-google"
                        block
                        @click="loginWithSocial('google')"
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
                        @click="loginWithSocial('facebook')"
                        :loading="socialLoading.facebook"
                        :disabled="isLoading"
                      >
                        Facebook
                      </v-btn>
                    </div>

                    <!-- Login Link -->
                    <div class="text-center">
                      <span class="text-medium-emphasis">Already have an account?</span>
                      <v-btn variant="text" @click="goToLogin">Login</v-btn>
                    </div>
                  </v-form>
                </v-card-text>
              </v-card>
            </v-stepper-window-item>

            <!-- Step 2: Verification -->
            <v-stepper-window-item value="2">
              <otp-verification />
            </v-stepper-window-item>

            <!-- Step 3: Complete -->
            <v-stepper-window-item value="3">
              <v-card flat class="text-center pa-8">
                <v-icon
                  icon="mdi-check-circle"
                  color="success"
                  size="x-large"
                  class="mb-4"
                ></v-icon>
                <h2 class="text-h4 mb-4">Registration Complete!</h2>
                <p class="text-body-1 mb-6">
                  Thank you for registering. Your account has been created successfully.
                </p>
                <v-btn
                  color="primary"
                  size="large"
                  @click="goToHome"
                >
                  Continue to Home
                </v-btn>
              </v-card>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>

        <!-- Terms Dialog -->
        <v-dialog v-model="showTerms" max-width="600px">
          <v-card>
            <v-card-title>Terms and Conditions</v-card-title>
            <v-card-text>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
              <!-- Terms content goes here -->
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="text" @click="showTerms = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <!-- Privacy Dialog -->
        <v-dialog v-model="showPrivacy" max-width="600px">
          <v-card>
            <v-card-title>Privacy Policy</v-card-title>
            <v-card-text>
              <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit...</p>
              <!-- Privacy content goes here -->
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn color="primary" variant="text" @click="showPrivacy = false">Close</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import OtpVerification from '@/components/auth/OtpVerification.vue'

const router = useRouter()
const store = useStore()

// Form data
const formData = ref({
  name: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  agreeTerms: false
})

// Form state
const form = ref(null)
const isFormValid = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const error = ref(null)

// Social login loading state
const socialLoading = ref({
  google: false,
  facebook: false
})

// UI state
const showTerms = ref(false)
const showPrivacy = ref(false)

// Computed properties
const isLoading = computed(() => store.getters['auth/isLoading'])
const currentStep = computed({
  get: () => String(store.getters['auth/verificationStep']),
  set: (val) => {
    // Only allow step changes when appropriate
    if (Number(val) < store.getters['auth/verificationStep']) {
      store.commit('auth/SET_VERIFICATION_STEP', Number(val))
    }
  }
})

// Form validation rules
const nameRules = [
  v => !!v || 'Name is required',
  v => v.length >= 3 || 'Name must be at least 3 characters'
]

const emailRules = [
  v => !!v || 'Email is required',
  v => /.+@.+\..+/.test(v) || 'Email must be valid'
]

const phoneRules = [
  v => !v || /^\+?[1-9]\d{9,14}$/.test(v) || 'Phone number must be valid'
]

const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 8 || 'Password must be at least 8 characters',
  v => /[A-Z]/.test(v) || 'Password must contain at least one uppercase letter',
  v => /[0-9]/.test(v) || 'Password must contain at least one number'
]

const confirmPasswordRules = [
  v => !!v || 'Please confirm your password',
  v => v === formData.value.password || 'Passwords do not match'
]

const termsRules = [
  v => !!v || 'You must agree to the terms and conditions'
]

// Methods
const handleSubmit = async () => {
  if (!isFormValid.value) return
  
  error.value = null
  
  try {
    // Start registration process
    await store.dispatch('auth/startRegistration', {
      name: formData.value.name,
      email: formData.value.email,
      phone: formData.value.phone,
      password: formData.value.password
    })
  } catch (err) {
    console.error('Registration error:', err)
    error.value = err.message || 'Failed to register'
  }
}

const loginWithSocial = async (provider) => {
  error.value = null
  socialLoading.value[provider] = true
  
  try {
    await store.dispatch('auth/loginWithSocial', { provider })
    router.push('/')
  } catch (err) {
    console.error(`${provider} login error:`, err)
    error.value = err.message || `Failed to login with ${provider}`
  } finally {
    socialLoading.value[provider] = false
  }
}

const goToLogin = () => {
  router.push('/auth/login')
}

const goToHome = () => {
  router.push('/')
}

// Initialize
onMounted(() => {
  // Initialize social login SDKs
  store.dispatch('auth/initSocialAuth')
  
  // Reset verification step
  store.commit('auth/SET_VERIFICATION_STEP', 1)
  
  // Clear any existing registration data
  store.commit('auth/SET_REGISTRATION_DATA', null)
})

// Watch for verification step changes
watch(
  () => store.getters['auth/verificationStep'],
  (step) => {
    // Update stepper step when verification step changes
    currentStep.value = String(step)
  }
)
</script>

<style scoped>
.v-stepper {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  border-radius: 8px !important;
}
</style>
