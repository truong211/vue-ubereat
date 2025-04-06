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
              <v-btn
                variant="outlined"
                color="primary"
                size="small"
                :to="{ name: 'AccountSettings' }"
                prepend-icon="mdi-cog"
                class="mt-2"
              >
                Account Settings
              </v-btn>
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

        <!-- Quick Links -->
        <v-card class="mb-4">
          <v-card-title>Quản lý tài khoản</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6" sm="4">
                <v-card variant="outlined" height="100%" class="quick-link-card">
                  <router-link :to="{ name: 'Addresses' }" class="text-decoration-none">
                    <v-card-text class="d-flex flex-column align-center text-center">
                      <v-icon size="42" color="primary" class="mb-2">mdi-map-marker</v-icon>
                      <span class="text-body-1">Địa chỉ giao hàng</span>
                    </v-card-text>
                  </router-link>
                </v-card>
              </v-col>
              
              <v-col cols="6" sm="4">
                <v-card variant="outlined" height="100%" class="quick-link-card">
                  <router-link :to="{ name: 'PaymentMethods' }" class="text-decoration-none">
                    <v-card-text class="d-flex flex-column align-center text-center">
                      <v-icon size="42" color="primary" class="mb-2">mdi-credit-card</v-icon>
                      <span class="text-body-1">Phương thức thanh toán</span>
                    </v-card-text>
                  </router-link>
                </v-card>
              </v-col>
              
              <v-col cols="6" sm="4">
                <v-card variant="outlined" height="100%" class="quick-link-card">
                  <router-link :to="{ name: 'Vouchers' }" class="text-decoration-none">
                    <v-card-text class="d-flex flex-column align-center text-center">
                      <v-icon size="42" color="primary" class="mb-2">mdi-ticket-percent</v-icon>
                      <span class="text-body-1">Mã giảm giá</span>
                    </v-card-text>
                  </router-link>
                </v-card>
              </v-col>
              
              <v-col cols="6" sm="4">
                <v-card variant="outlined" height="100%" class="quick-link-card">
                  <router-link :to="{ name: 'Orders' }" class="text-decoration-none">
                    <v-card-text class="d-flex flex-column align-center text-center">
                      <v-icon size="42" color="primary" class="mb-2">mdi-clipboard-list</v-icon>
                      <span class="text-body-1">Đơn hàng</span>
                    </v-card-text>
                  </router-link>
                </v-card>
              </v-col>
              
              <v-col cols="6" sm="4">
                <v-card variant="outlined" height="100%" class="quick-link-card">
                  <router-link :to="{ name: 'UserReviews' }" class="text-decoration-none">
                    <v-card-text class="d-flex flex-column align-center text-center">
                      <v-icon size="42" color="primary" class="mb-2">mdi-star</v-icon>
                      <span class="text-body-1">Đánh giá</span>
                    </v-card-text>
                  </router-link>
                </v-card>
              </v-col>
              
              <v-col cols="6" sm="4">
                <v-card variant="outlined" height="100%" class="quick-link-card">
                  <router-link :to="{ name: 'AccountSettings' }" class="text-decoration-none">
                    <v-card-text class="d-flex flex-column align-center text-center">
                      <v-icon size="42" color="primary" class="mb-2">mdi-cog</v-icon>
                      <span class="text-body-1">Cài đặt tài khoản</span>
                    </v-card-text>
                  </router-link>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>

        <!-- Social Account Link -->
        <v-card class="mb-4">
          <v-card-title>Tài khoản mạng xã hội</v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-3">
              Liên kết tài khoản của bạn với mạng xã hội để đăng nhập nhanh hơn.
            </p>
            <v-btn
              to="/account-settings?tab=linked-accounts"
              color="primary"
              variant="outlined"
              class="mb-2"
              prepend-icon="mdi-link-variant"
            >
              Quản lý tài khoản liên kết
            </v-btn>
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

        <!-- Notification Settings -->
        <v-card class="mb-4">
          <v-card-title>Notification Settings</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item :to="{ name: 'settings-notifications' }" prepend-icon="mdi-bell-outline">
                <v-list-item-title>Notification Settings</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Delivery Addresses -->
      <v-col cols="12" md="4">
        <delivery-addresses v-if="profile && profile.name" />
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

<script>
import { ref, reactive, onMounted } from 'vue'
import { useStore } from 'vuex'
import { mapState, mapActions } from 'vuex'
import { validatePhone, validatePassword } from '@/validations/auth.ts'
import AvatarUpload from '@/components/user/AvatarUpload.vue'
import DeliveryAddresses from '@/components/user/DeliveryAddresses.vue'

export default {
  name: 'UserProfile',
  
  components: {
    AvatarUpload,
    DeliveryAddresses
  },
  
  setup() {
    const store = useStore()
    const form = ref(null)
    const passwordForm = ref(null)

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
      required: (v) => !!v || 'Trường này là bắt buộc',
      phone: (v) => !v || validatePhone(v) || 'Số điện thoại không hợp lệ',
      password: (v) => validatePassword(v) || 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ và số',
      passwordMatch: (password) => (v) => 
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
        // Ensure we're sending the exact fields expected by the backend
        const userData = {
          fullName: profile.name,
          phone: profile.phone || '',
          address: profile.address || ''
        }

        await store.dispatch('user/updateProfile', userData)

        editing.value = false
        showSuccessMessage('Cập nhật thông tin thành công')
      } catch (error) {
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
      } catch (error) {
        showErrorMessage(error.message || 'Không thể đổi mật khẩu')
      } finally {
        passwordLoading.value = false
      }
    }

    const showSuccessMessage = (text) => {
      snackbar.color = 'success'
      snackbar.text = text
      snackbar.show = true
    }

    const showErrorMessage = (text) => {
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

    return {
      form,
      passwordForm,
      isValid,
      passwordValid,
      editing,
      loading,
      passwordLoading,
      profile,
      passwordData,
      snackbar,
      rules,
      startEditing,
      cancelEditing,
      handleSubmit,
      handlePasswordChange
    }
  }
}
</script>

<style scoped>
/* Add this style section if it doesn't exist */
.quick-link-card {
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.quick-link-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
</style>