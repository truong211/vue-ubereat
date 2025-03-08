<template>
  <div class="reset-password-form">
    <v-form ref="form" @submit.prevent="resetPassword" v-model="isFormValid">
      <!-- Step 1: Reset Password Form -->
      <div v-if="currentStep === 1">
        <h2 class="text-h4 font-weight-bold text-center mb-4">Reset Password</h2>
        <p class="text-body-1 text-center mb-6">
          Create a new password for your account
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
        
        <!-- Password Field -->
        <v-text-field
          v-model="password"
          label="New Password"
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
          label="Confirm New Password"
          :type="showConfirmPassword ? 'text' : 'password'"
          variant="outlined"
          prepend-inner-icon="mdi-lock-check"
          :append-inner-icon="showConfirmPassword ? 'mdi-eye-off' : 'mdi-eye'"
          @click:append-inner="showConfirmPassword = !showConfirmPassword"
          :rules="[rules.required, rules.passwordMatch]"
          :disabled="loading"
          required
          class="mb-6"
        ></v-text-field>
        
        <!-- Password Requirements -->
        <v-card variant="outlined" class="mb-6 pa-3">
          <div class="text-subtitle-2 mb-2">Password Requirements:</div>
          <div class="d-flex align-center" :class="passwordHasUppercase ? 'text-success' : 'text-medium-emphasis'">
            <v-icon :color="passwordHasUppercase ? 'success' : undefined" size="small" class="mr-2">
              {{ passwordHasUppercase ? 'mdi-check-circle' : 'mdi-circle-outline' }}
            </v-icon>
            <span>At least one uppercase letter</span>
          </div>
          <div class="d-flex align-center" :class="passwordHasLowercase ? 'text-success' : 'text-medium-emphasis'">
            <v-icon :color="passwordHasLowercase ? 'success' : undefined" size="small" class="mr-2">
              {{ passwordHasLowercase ? 'mdi-check-circle' : 'mdi-circle-outline' }}
            </v-icon>
            <span>At least one lowercase letter</span>
          </div>
          <div class="d-flex align-center" :class="passwordHasNumber ? 'text-success' : 'text-medium-emphasis'">
            <v-icon :color="passwordHasNumber ? 'success' : undefined" size="small" class="mr-2">
              {{ passwordHasNumber ? 'mdi-check-circle' : 'mdi-circle-outline' }}
            </v-icon>
            <span>At least one number</span>
          </div>
          <div class="d-flex align-center" :class="passwordHasMinLength ? 'text-success' : 'text-medium-emphasis'">
            <v-icon :color="passwordHasMinLength ? 'success' : undefined" size="small" class="mr-2">
              {{ passwordHasMinLength ? 'mdi-check-circle' : 'mdi-circle-outline' }}
            </v-icon>
            <span>Minimum 8 characters</span>
          </div>
        </v-card>
        
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
          Reset Password
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
      
      <!-- Step 2: Success Message -->
      <div v-if="currentStep === 2" class="text-center">
        <v-icon
          icon="mdi-check-circle"
          color="success"
          size="64"
          class="mb-4"
        ></v-icon>
        
        <h2 class="text-h4 font-weight-bold mb-4">Password Reset Successful</h2>
        <p class="text-body-1 mb-6">
          Your password has been successfully reset. You can now log in with your new password.
        </p>
        
        <v-btn
          color="primary"
          :to="{ name: 'Login' }"
          size="large"
        >
          Log In
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import { validatePassword } from '@/validations/auth'
import type { VForm } from 'vuetify/components'

const store = useStore()
const router = useRouter()
const route = useRoute()
const form = ref<VForm | null>(null)

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isValid = ref(false)
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const errors = ref({
  password: '',
  confirmPassword: ''
})
const currentStep = ref(1)
const token = ref('')

const rules = {
  required: (v: string) => !!v || 'Trường này là bắt buộc',
  minLength: (v: string) => v.length >= 8 || 'Mật khẩu phải có ít nhất 8 ký tự',
  password: (v: string) => validatePassword(v) || 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số',
  passwordMatch: (v: string) => v === password.value || 'Mật khẩu xác nhận không khớp'
}

onMounted(async () => {
  // Verify reset token
  token.value = route.params.token as string
  if (!token.value) {
    error.value = 'Token không hợp lệ'
    return
  }

  loading.value = true
  try {
    await store.dispatch('auth/verifyResetToken', token.value)
  } catch (err: any) {
    error.value = 'Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ'
    setTimeout(() => {
      router.push('/auth/forgot-password')
    }, 3000)
  } finally {
    loading.value = false
  }
})

const handleSubmit = async () => {
  if (!form.value?.validate()) return

  const token = route.params.token as string
  loading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    await store.dispatch('auth/resetPassword', {
      token,
      newPassword: password.value
    })

    successMessage.value = 'Mật khẩu đã được đặt lại thành công'
    setTimeout(() => {
      router.push('/auth/login')
    }, 2000)
  } catch (err: any) {
    error.value = err.message || 'Không thể đặt lại mật khẩu'
  } finally {
    loading.value = false
  }
}

const passwordHasUppercase = computed(() => /[A-Z]/.test(password.value))
const passwordHasLowercase = computed(() => /[a-z]/.test(password.value))
const passwordHasNumber = computed(() => /\d/.test(password.value))
const passwordHasMinLength = computed(() => password.value.length >= 8)

const resetPassword = async () => {
  if (!form.value?.validate()) return

  loading.value = true
  error.value = ''

  try {
    await store.dispatch('auth/resetPassword', {
      token: token.value,
      password: password.value
    })

    currentStep.value = 2
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Không thể đặt lại mật khẩu'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-password-form {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}
</style>