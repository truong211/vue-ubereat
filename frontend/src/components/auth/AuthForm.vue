<template>
  <div class="auth-form">
    <!-- Form Stepper -->
    <v-stepper v-model="currentStep" alt-labels>
      <v-stepper-header>
        <v-stepper-item :value="1" :complete="currentStep > 1">
          Credentials
        </v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item :value="2" :complete="currentStep > 2">
          Verification
        </v-stepper-item>

        <v-divider></v-divider>

        <v-stepper-item :value="3">
          Profile
        </v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <!-- Step 1: Credentials -->
        <v-stepper-window-item :value="1">
          <v-card>
            <v-card-text>
              <v-form
                ref="credentialsForm"
                v-model="forms.credentials.valid"
                @submit.prevent="validateCredentials"
              >
                <!-- Email -->
                <v-text-field
                  v-model="forms.credentials.email"
                  label="Email"
                  type="email"
                  :rules="[rules.required, rules.email]"
                  :error-messages="errors.email"
                ></v-text-field>

                <!-- Password -->
                <v-text-field
                  v-model="forms.credentials.password"
                  label="Password"
                  :type="showPassword ? 'text' : 'password'"
                  :rules="[rules.required, rules.password]"
                  :error-messages="errors.password"
                  :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append="showPassword = !showPassword"
                ></v-text-field>

                <!-- Confirm Password (Register only) -->
                <v-text-field
                  v-if="isRegistration"
                  v-model="forms.credentials.confirmPassword"
                  label="Confirm Password"
                  :type="showPassword ? 'text' : 'password'"
                  :rules="[
                    rules.required,
                    rules.passwordMatch(forms.credentials.password)
                  ]"
                  :error-messages="errors.confirmPassword"
                ></v-text-field>

                <!-- Forgot Password (Login only) -->
                <div v-if="!isRegistration" class="text-right mb-4">
                  <router-link 
                    to="/auth/forgot-password"
                    class="text-primary text-decoration-none"
                  >
                    Forgot Password?
                  </router-link>
                </div>

                <!-- Social Login Options -->
                <div class="text-center my-4">
                  <v-divider class="my-4">
                    <span class="text-caption">or continue with</span>
                  </v-divider>

                  <v-btn
                    color="error"
                    variant="outlined"
                    class="mx-2"
                    prepend-icon="mdi-google"
                    :loading="socialLoading.google"
                    @click="socialLogin('google')"
                  >
                    Google
                  </v-btn>

                  <v-btn
                    color="primary"
                    variant="outlined"
                    class="mx-2"
                    prepend-icon="mdi-facebook"
                    :loading="socialLoading.facebook"
                    @click="socialLogin('facebook')"
                  >
                    Facebook
                  </v-btn>
                </div>

                <v-btn
                  block
                  color="primary"
                  size="large"
                  type="submit"
                  :loading="loading.credentials"
                >
                  {{ isRegistration ? 'Create Account' : 'Sign In' }}
                </v-btn>

                <div class="text-center mt-4">
                  <a href="#" @click.prevent="toggleAuthMode">
                    {{ isRegistration ? 'Already have an account? Sign in' : 'Need an account? Register' }}
                  </a>
                </div>
              </v-form>
            </v-card-text>
          </v-card>
        </v-stepper-window-item>

        <!-- Step 2: Verification -->
        <v-stepper-window-item :value="2">
          <v-card>
            <v-card-text>
              <v-form
                ref="verificationForm"
                v-model="forms.verification.valid"
                @submit.prevent="verifyOTP"
              >
                <!-- Verification Method Selection -->
                <v-btn-group v-model="selectedVerificationMethod" class="d-flex mb-4">
                  <v-btn
                    value="email"
                    prepend-icon="mdi-email"
                    :disabled="!forms.credentials.email"
                  >
                    Email
                  </v-btn>
                  <v-btn
                    value="sms"
                    prepend-icon="mdi-phone"
                    :disabled="!forms.profile.phone"
                  >
                    SMS
                  </v-btn>
                </v-btn-group>

                <!-- OTP Input -->
                <div class="otp-inputs d-flex justify-space-between mb-4">
                  <v-text-field
                    v-for="i in 6"
                    :key="i"
                    v-model="otpDigits[i-1]"
                    type="tel"
                    maxlength="1"
                    class="mx-1"
                    density="compact"
                    hide-details
                    :data-index="i"
                    @input="(e: Event) => handleOtpInput(e, i)"
                    @keydown.delete="(e: KeyboardEvent) => handleOtpDelete(e, i)"
                  ></v-text-field>
                </div>

                <div class="text-center mb-4">
                  <v-btn
                    variant="text"
                    :disabled="resendCountdown > 0"
                    @click="resendOTP"
                  >
                    {{ resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code' }}
                  </v-btn>
                </div>

                <v-btn
                  block
                  color="primary"
                  size="large"
                  type="submit"
                  :loading="loading.verification"
                  :disabled="!isOtpComplete"
                >
                  Verify
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-stepper-window-item>

        <!-- Step 3: Profile -->
        <v-stepper-window-item :value="3">
          <v-card>
            <v-card-text>
              <v-form
                ref="profileForm"
                v-model="forms.profile.valid"
                @submit.prevent="completeRegistration"
              >
                <v-row>
                  <!-- First Name -->
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="forms.profile.firstName"
                      label="First Name"
                      :rules="[rules.required]"
                      :error-messages="errors.firstName"
                    ></v-text-field>
                  </v-col>

                  <!-- Last Name -->
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="forms.profile.lastName"
                      label="Last Name"
                      :rules="[rules.required]"
                      :error-messages="errors.lastName"
                    ></v-text-field>
                  </v-col>

                  <!-- Phone -->
                  <v-col cols="12">
                    <v-text-field
                      v-model="forms.profile.phone"
                      label="Phone Number"
                      :rules="[rules.required, rules.phone]"
                      :error-messages="errors.phone"
                      prepend-inner-icon="mdi-phone"
                    ></v-text-field>
                  </v-col>

                  <!-- Date of Birth -->
                  <v-col cols="12">
                    <v-text-field
                      v-model="forms.profile.dateOfBirth"
                      label="Date of Birth"
                      type="date"
                      :rules="[rules.required, rules.age]"
                      :error-messages="errors.dateOfBirth"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <v-btn
                  block
                  color="primary"
                  size="large"
                  type="submit"
                  :loading="loading.profile"
                >
                  Complete Registration
                </v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue'
import type { Ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import jwtAuth from '@/services/jwt-auth'
import socialAuth from '@/services/social-auth'
// Import OTP auth with fallback handling
import otpAuthService from '@/services/otp-auth'
// Create a wrapper with fallback methods in case of import errors
const otpAuth = {
  sendEmailOTP: async (...args) => {
    try {
      return await otpAuthService.sendEmailOTP(...args);
    } catch (error) {
      console.error('Error in sendEmailOTP:', error);
      return Promise.reject(new Error('OTP service not available'));
    }
  },
  verifyEmailOTP: async (...args) => {
    try {
      return await otpAuthService.verifyEmailOTP(...args);
    } catch (error) {
      console.error('Error in verifyEmailOTP:', error);
      return Promise.reject(new Error('OTP service not available'));
    }
  },
  sendPhoneOTP: async (...args) => {
    try {
      return await otpAuthService.sendPhoneOTP(...args);
    } catch (error) {
      console.error('Error in sendPhoneOTP:', error);
      return Promise.reject(new Error('OTP service not available'));
    }
  },
  verifyPhoneOTP: async (...args) => {
    try {
      return await otpAuthService.verifyPhoneOTP(...args);
    } catch (error) {
      console.error('Error in verifyPhoneOTP:', error);
      return Promise.reject(new Error('OTP service not available'));
    }
  },
  initRecaptcha: () => {
    try {
      return otpAuthService.initRecaptcha();
    } catch (error) {
      console.error('Error in initRecaptcha:', error);
    }
  }
};
import { validateEmail, validatePassword, validatePhone } from '@/validations/auth'
import type { VForm } from 'vuetify/components'

type SocialProvider = 'google' | 'facebook'

export default defineComponent({
  name: 'AuthForm',

  props: {
    mode: {
      type: String,
      default: 'login',
      validator: (value: string) => ['login', 'register'].includes(value)
    }
  },

  emits: ['auth-success'],

  setup(props, { emit }) {
    const store = useStore()
    const router = useRouter()
    const { showToast } = useToast()

    // Form refs
    const credentialsForm = ref<VForm>()
    const verificationForm = ref<VForm>()
    const profileForm = ref<VForm>()

    // State
    const currentStep = ref<number>(1)
    const showPassword = ref<boolean>(false)
    const selectedVerificationMethod = ref('email')
    const otpDigits = ref<string[]>(['', '', '', '', '', ''])
    const resendCountdown = ref<number>(0)
    const authMode = ref<string>(props.mode)

    // Loading states
    const loading = ref({
      credentials: false,
      verification: false,
      profile: false
    })

    const socialLoading = ref({
      google: false,
      facebook: false
    })

    // Form state
    const forms = ref({
      credentials: {
        valid: false,
        email: '',
        password: '',
        confirmPassword: ''
      },
      verification: {
        valid: false
      },
      profile: {
        valid: false,
        firstName: '',
        lastName: '',
        phone: '',
        dateOfBirth: ''
      }
    })

    // Error messages
    const errors = ref({
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      dateOfBirth: ''
    })

    // Validation rules
    const rules = {
      required: (v: any) => !!v || 'Required',
      email: (v: string) => validateEmail(v) || 'Invalid email address',
      password: (v: string) => validatePassword(v) || 'Password must be at least 8 characters with numbers and letters',
      passwordMatch: (password: string) => (v: string) => v === password || 'Passwords do not match',
      phone: (v: string) => validatePhone(v) || 'Invalid phone number',
      age: (v: string) => {
        const age = new Date().getFullYear() - new Date(v).getFullYear()
        return age >= 18 || 'Must be at least 18 years old'
      }
    }

    // Computed
    const isRegistration = computed(() => authMode.value === 'register')
    const isOtpComplete = computed(() => otpDigits.value.every(digit => digit !== ''))

    // Methods
    const toggleAuthMode = () => {
      authMode.value = authMode.value === 'login' ? 'register' : 'login'
      resetErrors()
    }

    const resetErrors = () => {
      Object.keys(errors.value).forEach(key => {
        errors.value[key] = ''
      })
    }

    const validateCredentials = async () => {
      const valid = await credentialsForm.value?.validate()
      if (!valid) return

      loading.value.credentials = true
      try {
        if (isRegistration.value) {
          await startRegistration()
        } else {
          await login()
        }
      } catch (error: any) {
        console.error('Authentication error:', error)
        showToast(error.message || 'Authentication failed', 'error')
      } finally {
        loading.value.credentials = false
      }
    }

    const startRegistration = async () => {
      // Send initial registration request
      await store.dispatch('auth/startRegistration', {
        email: forms.value.credentials.email,
        password: forms.value.credentials.password
      })
      
      // Move to verification step
      currentStep.value = 2
      startResendCountdown()
    }

    const login = async () => {
      const { accessToken, refreshToken } = await jwtAuth.login({
        email: forms.value.credentials.email,
        password: forms.value.credentials.password
      })

      await handleAuthSuccess({ accessToken, refreshToken })
    }

    const socialLogin = async (provider: SocialProvider) => {
      socialLoading.value[provider] = true
      try {
        const result = await socialAuth.login(provider)
        await handleAuthSuccess(result)
      } catch (error: any) {
        console.error('Social login error:', error)
        showToast(error.message || 'Social login failed', 'error')
      } finally {
        socialLoading.value[provider] = false
      }
    }

    const handleOtpInput = (event: Event, index: number) => {
      const input = event.target as HTMLInputElement
      const value = input.value

      // Only allow numbers
      if (!/^\d*$/.test(value)) {
        otpDigits.value[index - 1] = ''
        return
      }

      // Auto-focus next input
      if (value && index < 6) {
        const nextInput = document.querySelector(`input[data-index="${index + 1}"]`) as HTMLInputElement
        if (nextInput) nextInput.focus()
      }
    }

    const handleOtpDelete = (event: KeyboardEvent, index: number) => {
      if (event.key === 'Backspace' && !otpDigits.value[index - 1] && index > 1) {
        const prevInput = document.querySelector(`input[data-index="${index - 1}"]`) as HTMLInputElement
        if (prevInput) prevInput.focus()
      }
    }

    const verifyOTP = async () => {
      const otp = otpDigits.value.join('')
      if (otp.length !== 6) return

      loading.value.verification = true
      try {
        await otpAuth.verify({
          email: forms.value.credentials.email,
          otp,
          method: selectedVerificationMethod.value
        })

        if (isRegistration.value) {
          currentStep.value = 3
        } else {
          // For login, complete the process
          await login()
        }
      } catch (error: any) {
        console.error('OTP verification error:', error)
        showToast(error.message || 'Verification failed', 'error')
      } finally {
        loading.value.verification = false
      }
    }

    const resendOTP = async () => {
      try {
        await otpAuth.resend({
          email: forms.value.credentials.email,
          method: selectedVerificationMethod.value
        })
        startResendCountdown()
        showToast('Verification code resent', 'success')
      } catch (error: any) {
        console.error('Resend OTP error:', error)
        showToast(error.message || 'Failed to resend code', 'error')
      }
    }

    const startResendCountdown = () => {
      resendCountdown.value = 30
      const timer = setInterval(() => {
        if (resendCountdown.value > 0) {
          resendCountdown.value--
        } else {
          clearInterval(timer)
        }
      }, 1000)
    }

    const completeRegistration = async () => {
      const valid = await profileForm.value?.validate()
      if (!valid) return

      loading.value.profile = true
      try {
        const { accessToken, refreshToken } = await store.dispatch('auth/completeRegistration', {
          email: forms.value.credentials.email,
          profile: forms.value.profile
        })

        await handleAuthSuccess({ accessToken, refreshToken })
      } catch (error: any) {
        console.error('Registration completion error:', error)
        showToast(error.message || 'Registration failed', 'error')
      } finally {
        loading.value.profile = false
      }
    }

    const handleAuthSuccess = async ({ accessToken, refreshToken }: { accessToken: string, refreshToken: string }) => {
      // Store tokens
      await store.dispatch('auth/setTokens', { accessToken, refreshToken })
      
      // Load user profile
      await store.dispatch('auth/loadUser')
      
      // Emit success event
      emit('auth-success')
      
      // Redirect to home or intended route
      const redirect = router.currentRoute.value.query.redirect as string
      await router.push(redirect || '/')
    }

    return {
      currentStep,
      showPassword,
      selectedVerificationMethod,
      otpDigits,
      resendCountdown,
      loading,
      socialLoading,
      forms,
      errors,
      rules,
      credentialsForm,
      verificationForm,
      profileForm,
      isRegistration,
      isOtpComplete,
      toggleAuthMode,
      validateCredentials,
      socialLogin,
      handleOtpInput,
      handleOtpDelete,
      verifyOTP,
      resendOTP,
      completeRegistration
    }
  }
})
</script>

<style scoped>
.auth-form {
  max-width: 500px;
  margin: 0 auto;
}

.otp-inputs :deep(.v-field__input) {
  text-align: center;
  font-size: 1.5rem;
  letter-spacing: 0.5rem;
}
</style>