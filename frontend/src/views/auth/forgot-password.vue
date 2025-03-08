<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center text-h5 py-4">
            Reset Password
          </v-card-title>

          <v-card-text>
            <v-stepper v-model="currentStep" alt-labels>
              <v-stepper-header>
                <v-stepper-item :value="1" :complete="currentStep > 1">
                  Email
                </v-stepper-item>

                <v-divider></v-divider>

                <v-stepper-item :value="2" :complete="currentStep > 2">
                  Verify
                </v-stepper-item>

                <v-divider></v-divider>

                <v-stepper-item :value="3">
                  Reset
                </v-stepper-item>
              </v-stepper-header>

              <v-stepper-window>
                <!-- Step 1: Enter Email -->
                <v-stepper-window-item :value="1">
                  <v-form @submit.prevent="handleEmailSubmit">
                    <v-text-field
                      v-model="email"
                      label="Email"
                      type="email"
                      :rules="[rules.required, rules.email]"
                      :error-messages="emailError"
                      required
                    ></v-text-field>

                    <v-btn
                      type="submit"
                      color="primary"
                      block
                      :loading="loading"
                    >
                      Send Reset Link
                    </v-btn>
                  </v-form>
                </v-stepper-window-item>

                <!-- Step 2: Verify Code -->
                <v-stepper-window-item :value="2">
                  <v-form @submit.prevent="handleVerifySubmit">
                    <v-text-field
                      v-model="verificationCode"
                      label="Verification Code"
                      :rules="[rules.required]"
                      :error-messages="verificationError"
                      required
                    ></v-text-field>

                    <v-btn
                      type="submit"
                      color="primary"
                      block
                      :loading="loading"
                    >
                      Verify Code
                    </v-btn>
                  </v-form>
                </v-stepper-window-item>

                <!-- Step 3: New Password -->
                <v-stepper-window-item :value="3">
                  <v-form @submit.prevent="handlePasswordSubmit">
                    <v-text-field
                      v-model="newPassword"
                      label="New Password"
                      :type="showPassword ? 'text' : 'password'"
                      :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                      :rules="[rules.required, rules.password]"
                      :error-messages="passwordError"
                      @click:append="showPassword = !showPassword"
                      required
                    ></v-text-field>

                    <v-text-field
                      v-model="confirmPassword"
                      label="Confirm Password"
                      :type="showPassword ? 'text' : 'password'"
                      :rules="[rules.required, rules.passwordMatch]"
                      :error-messages="confirmPasswordError"
                      required
                    ></v-text-field>

                    <v-btn
                      type="submit"
                      color="primary"
                      block
                      :loading="loading"
                    >
                      Reset Password
                    </v-btn>
                  </v-form>
                </v-stepper-window-item>
              </v-stepper-window>
            </v-stepper>
          </v-card-text>

          <v-card-actions class="justify-center pb-4">
            <v-btn
              variant="text"
              @click="$router.push('/auth')"
            >
              Back to Login
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useForm } from 'vee-validate'

const router = useRouter()
const currentStep = ref(1)
const loading = ref(false)
const showPassword = ref(false)

// Form fields
const email = ref('')
const verificationCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

// Error messages
const emailError = ref('')
const verificationError = ref('')
const passwordError = ref('')
const confirmPasswordError = ref('')

// Validation rules
const rules = {
  required: value => !!value || 'This field is required',
  email: value => {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return pattern.test(value) || 'Invalid email format'
  },
  password: value => {
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    return pattern.test(value) || 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
  },
  passwordMatch: value => value === newPassword.value || 'Passwords do not match'
}

// Form handlers
const handleEmailSubmit = async () => {
  try {
    loading.value = true
    // TODO: Implement email submission logic
    currentStep.value = 2
  } catch (error) {
    emailError.value = error.message
  } finally {
    loading.value = false
  }
}

const handleVerifySubmit = async () => {
  try {
    loading.value = true
    // TODO: Implement verification logic
    currentStep.value = 3
  } catch (error) {
    verificationError.value = error.message
  } finally {
    loading.value = false
  }
}

const handlePasswordSubmit = async () => {
  try {
    loading.value = true
    // TODO: Implement password reset logic
    router.push('/auth')
  } catch (error) {
    passwordError.value = error.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-card-title {
  background: linear-gradient(to right, #1867c0, #5cbbf6);
  color: white;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
</style>