<template>
  <v-card class="pa-4">
    <v-card-title class="text-center text-h5 mb-4">
      Đặt lại mật khẩu
    </v-card-title>

    <v-card-text>
      <v-form
        ref="form"
        v-model="isValid"
        @submit.prevent="handleSubmit"
      >
        <v-text-field
          v-model="password"
          label="Mật khẩu mới"
          :type="showPassword ? 'text' : 'password'"
          :rules="[rules.required, rules.password]"
          :error-messages="errors.password"
          :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
          :loading="loading"
          @click:append="showPassword = !showPassword"
          hide-details="auto"
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="confirmPassword"
          label="Xác nhận mật khẩu"
          :type="showPassword ? 'text' : 'password'"
          :rules="[
            rules.required,
            rules.passwordMatch(password)
          ]"
          :error-messages="errors.confirmPassword"
          :loading="loading"
          hide-details="auto"
        ></v-text-field>

        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          class="mt-4"
        >
          {{ error }}
        </v-alert>

        <v-alert
          v-if="successMessage"
          type="success"
          variant="tonal"
          class="mt-4"
        >
          {{ successMessage }}
        </v-alert>

        <div class="d-flex justify-end mt-6">
          <v-btn
            color="primary"
            type="submit"
            :loading="loading"
            :disabled="!isValid"
          >
            Đặt lại mật khẩu
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
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
const isValid = ref(false)
const loading = ref(false)
const error = ref('')
const successMessage = ref('')
const errors = ref({
  password: '',
  confirmPassword: ''
})

const rules = {
  required: (v: string) => !!v || 'Trường này là bắt buộc',
  password: (v: string) => validatePassword(v) || 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số',
  passwordMatch: (password: string) => (v: string) => 
    v === password || 'Mật khẩu xác nhận không khớp'
}

onMounted(async () => {
  // Verify reset token
  const token = route.params.token as string
  if (!token) {
    error.value = 'Token không hợp lệ'
    return
  }

  loading.value = true
  try {
    await store.dispatch('auth/verifyResetToken', token)
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
</script>