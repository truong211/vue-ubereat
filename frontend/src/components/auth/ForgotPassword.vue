<template>
  <v-card class="pa-4">
    <v-card-title class="text-center text-h5 mb-4">
      Khôi phục mật khẩu
    </v-card-title>

    <v-card-text>
      <p class="mb-4">
        Nhập địa chỉ email của bạn để nhận hướng dẫn đặt lại mật khẩu.
      </p>

      <v-form
        ref="form"
        v-model="isValid"
        @submit.prevent="handleSubmit"
      >
        <v-text-field
          v-model="email"
          label="Email"
          type="email"
          :rules="[rules.required, rules.email]"
          :error-messages="error"
          :loading="loading"
          hide-details="auto"
        ></v-text-field>

        <v-alert
          v-if="successMessage"
          type="success"
          variant="tonal"
          class="mt-4"
        >
          {{ successMessage }}
        </v-alert>

        <div class="d-flex justify-space-between align-center mt-6">
          <v-btn
            variant="text"
            :to="{ name: 'Login' }"
            :disabled="loading"
          >
            Quay lại đăng nhập
          </v-btn>

          <v-btn
            color="primary"
            type="submit"
            :loading="loading"
            :disabled="!isValid"
          >
            Gửi yêu cầu
          </v-btn>
        </div>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from 'vuex'
import { validateEmail } from '@/validations/auth'
import type { VForm } from 'vuetify/components'

const store = useStore()
const form = ref<VForm | null>(null)
const email = ref('')
const isValid = ref(false)
const loading = ref(false)
const error = ref('')
const successMessage = ref('')

const rules = {
  required: (v: string) => !!v || 'Email là bắt buộc',
  email: (v: string) => validateEmail(v) || 'Email không hợp lệ'
}

const handleSubmit = async () => {
  if (!form.value?.validate()) return

  loading.value = true
  error.value = ''
  successMessage.value = ''

  try {
    await store.dispatch('auth/requestPasswordReset', email.value)
    successMessage.value = 'Link đặt lại mật khẩu đã được gửi đến email của bạn'
    email.value = ''
  } catch (err: any) {
    error.value = err.message || 'Không thể gửi yêu cầu đặt lại mật khẩu'
  } finally {
    loading.value = false
  }
}
</script>