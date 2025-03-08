<template>
  <v-container>
    <v-row>
      <!-- Profile Header -->
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-text class="d-flex align-center">
            <!-- Avatar Upload -->
            <avatar-upload
              v-model="profile.avatar"
              :current-avatar="profile.avatar"
              class="mr-4"
            />
            <div>
              <h2 class="text-h5 mb-2">{{ profile.name }}</h2>
              <p class="text-subtitle-1 text-medium-emphasis">
                {{ profile.email }}
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Main Content -->
      <v-col cols="12" md="8">
        <!-- Personal Information -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center justify-space-between">
            Thông tin cá nhân
            <v-btn
              v-if="!editing"
              color="primary"
              variant="text"
              @click="startEditing"
            >
              Chỉnh sửa
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-form
              ref="form"
              v-model="isValid"
              @submit.prevent="handleSubmit"
            >
              <!-- Name -->
              <v-text-field
                v-model="profile.name"
                label="Họ tên"
                :readonly="!editing"
                :rules="[rules.required]"
                hide-details="auto"
                class="mb-4"
              ></v-text-field>

              <!-- Email -->
              <v-text-field
                v-model="profile.email"
                label="Email"
                readonly
                hide-details="auto"
                class="mb-4"
              ></v-text-field>

              <!-- Phone -->
              <v-text-field
                v-model="profile.phone"
                label="Số điện thoại"
                :readonly="!editing"
                :rules="[rules.phone]"
                hide-details="auto"
                class="mb-4"
              ></v-text-field>

              <!-- Save/Cancel Buttons -->
              <div v-if="editing" class="d-flex justify-end">
                <v-btn
                  variant="outlined"
                  class="mr-2"
                  @click="cancelEditing"
                >
                  Hủy
                </v-btn>
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="loading"
                  :disabled="!isValid"
                >
                  Lưu thay đổi
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>

        <!-- Password Change -->
        <v-card class="mb-4">
          <v-card-title>Đổi mật khẩu</v-card-title>
          <v-card-text>
            <v-form
              ref="passwordForm"
              v-model="passwordValid"
              @submit.prevent="handlePasswordChange"
            >
              <v-text-field
                v-model="passwordData.currentPassword"
                label="Mật khẩu hiện tại"
                type="password"
                :rules="[rules.required]"
                hide-details="auto"
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-model="passwordData.newPassword"
                label="Mật khẩu mới"
                type="password"
                :rules="[rules.required, rules.password]"
                hide-details="auto"
                class="mb-4"
              ></v-text-field>

              <v-text-field
                v-model="passwordData.confirmPassword"
                label="Xác nhận mật khẩu mới"
                type="password"
                :rules="[
                  rules.required,
                  rules.passwordMatch(passwordData.newPassword)
                ]"
                hide-details="auto"
                class="mb-4"
              ></v-text-field>

              <div class="d-flex justify-end">
                <v-btn
                  color="primary"
                  type="submit"
                  :loading="passwordLoading"
                  :disabled="!passwordValid"
                >
                  Đổi mật khẩu
                </v-btn>
              </div>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Delivery Addresses -->
      <v-col cols="12" md="4">
        <delivery-addresses />
      </v-col>
    </v-row>

    <!-- Success Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="3000"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { validatePhone, validatePassword } from '@/validations/auth'
import AvatarUpload from '@/components/user/AvatarUpload.vue'
import DeliveryAddresses from '@/components/user/DeliveryAddresses.vue'
import type { VForm } from 'vuetify/components'

const store = useStore()
const form = ref<VForm | null>(null)
const passwordForm = ref<VForm | null>(null)

// Form states
const isValid = ref(false)
const passwordValid = ref(false)
const editing = ref(false)
const loading = ref(false)
const passwordLoading = ref(false)

// Profile data
const profile = reactive({
  name: '',
  email: '',
  phone: '',
  avatar: ''
})

// Password change data
const passwordData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Snackbar state
const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
})

// Validation rules
const rules = {
  required: (v: any) => !!v || 'Trường này là bắt buộc',
  phone: (v: string) => !v || validatePhone(v) || 'Số điện thoại không hợp lệ',
  password: (v: string) => validatePassword(v) || 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số',
  passwordMatch: (password: string) => (v: string) => 
    v === password || 'Mật khẩu xác nhận không khớp'
}

// Methods
const startEditing = () => {
  editing.value = true
}

const cancelEditing = () => {
  editing.value = false
  // Reset form data
  loadUserProfile()
}

const handleSubmit = async () => {
  if (!form.value?.validate()) return

  loading.value = true
  try {
    await store.dispatch('user/updateProfile', {
      name: profile.name,
      phone: profile.phone
    })

    editing.value = false
    showSuccessMessage('Cập nhật thông tin thành công')
  } catch (error: any) {
    showErrorMessage(error.message || 'Không thể cập nhật thông tin')
  } finally {
    loading.value = false
  }
}

const handlePasswordChange = async () => {
  if (!passwordForm.value?.validate()) return

  passwordLoading.value = true
  try {
    await store.dispatch('user/changePassword', {
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword
    })

    // Clear form
    passwordData.currentPassword = ''
    passwordData.newPassword = ''
    passwordData.confirmPassword = ''
    passwordForm.value.reset()

    showSuccessMessage('Đổi mật khẩu thành công')
  } catch (error: any) {
    showErrorMessage(error.message || 'Không thể đổi mật khẩu')
  } finally {
    passwordLoading.value = false
  }
}

const showSuccessMessage = (text: string) => {
  snackbar.color = 'success'
  snackbar.text = text
  snackbar.show = true
}

const showErrorMessage = (text: string) => {
  snackbar.color = 'error'
  snackbar.text = text
  snackbar.show = true
}

const loadUserProfile = () => {
  const user = store.state.auth.user
  if (user) {
    profile.name = user.name
    profile.email = user.email
    profile.phone = user.phone || ''
    profile.avatar = user.avatar || ''
  }
}

// Load user profile on mount
onMounted(() => {
  loadUserProfile()
})
</script>