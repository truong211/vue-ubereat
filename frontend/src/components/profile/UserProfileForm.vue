<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="pa-6">
          <v-card-title class="text-h5 mb-4">
            <v-icon start>mdi-account-edit</v-icon>
            Chỉnh sửa thông tin cá nhân
          </v-card-title>

          <v-card-text>
            <v-form ref="profileForm" v-model="isFormValid" @submit.prevent="updateProfile">
              <v-row>
                <!-- Avatar Section -->
                <v-col cols="12" class="text-center mb-6">
                  <div class="avatar-section">
                    <v-avatar
                      size="120"
                      class="mb-4"
                      :image="profileData.profileImage ? getImageUrl(profileData.profileImage) : undefined"
                    >
                      <v-icon v-if="!profileData.profileImage" size="60">mdi-account</v-icon>
                    </v-avatar>
                    
                    <div class="avatar-actions">
                      <input
                        ref="avatarInput"
                        type="file"
                        accept="image/*"
                        style="display: none"
                        @change="handleAvatarChange"
                      />
                      
                      <v-btn
                        color="primary"
                        variant="outlined"
                        prepend-icon="mdi-camera"
                        @click="$refs.avatarInput.click()"
                        :loading="avatarUploading"
                        class="me-2"
                      >
                        Đổi ảnh đại diện
                      </v-btn>
                      
                      <v-btn
                        v-if="profileData.profileImage"
                        color="error"
                        variant="outlined"
                        prepend-icon="mdi-delete"
                        @click="removeAvatar"
                        :loading="avatarRemoving"
                      >
                        Xóa ảnh
                      </v-btn>
                    </div>
                  </div>
                </v-col>

                <!-- Personal Information -->
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileData.fullName"
                    label="Họ và tên *"
                    :rules="[rules.required]"
                    prepend-icon="mdi-account"
                    variant="outlined"
                    density="comfortable"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileData.email"
                    label="Email *"
                    :rules="[rules.required, rules.email]"
                    prepend-icon="mdi-email"
                    variant="outlined"
                    density="comfortable"
                    type="email"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="profileData.phone"
                    label="Số điện thoại"
                    :rules="[rules.phone]"
                    prepend-icon="mdi-phone"
                    variant="outlined"
                    density="comfortable"
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="profileData.preferredLanguage"
                    label="Ngôn ngữ ưa thích"
                    :items="languageOptions"
                    prepend-icon="mdi-translate"
                    variant="outlined"
                    density="comfortable"
                  ></v-select>
                </v-col>

                <v-col cols="12">
                  <v-textarea
                    v-model="profileData.address"
                    label="Địa chỉ"
                    prepend-icon="mdi-map-marker"
                    variant="outlined"
                    density="comfortable"
                    rows="3"
                    auto-grow
                  ></v-textarea>
                </v-col>

                <!-- Notification Preferences -->
                <v-col cols="12">
                  <v-card variant="outlined" class="pa-4">
                    <v-card-title class="text-h6 pa-0 mb-3">
                      <v-icon start>mdi-bell</v-icon>
                      Tùy chọn thông báo
                    </v-card-title>
                    
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-checkbox
                          v-model="notificationPreferences.email"
                          label="Nhận thông báo qua Email"
                          density="comfortable"
                        ></v-checkbox>
                        
                        <v-checkbox
                          v-model="notificationPreferences.sms"
                          label="Nhận thông báo qua SMS"
                          density="comfortable"
                        ></v-checkbox>
                      </v-col>
                      
                      <v-col cols="12" sm="6">
                        <v-checkbox
                          v-model="notificationPreferences.orderUpdates"
                          label="Cập nhật đơn hàng"
                          density="comfortable"
                        ></v-checkbox>
                        
                        <v-checkbox
                          v-model="notificationPreferences.promotions"
                          label="Khuyến mãi và ưu đãi"
                          density="comfortable"
                        ></v-checkbox>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>

              <!-- Action Buttons -->
              <v-row class="mt-4">
                <v-col cols="12" class="text-center">
                  <v-btn
                    color="primary"
                    size="large"
                    type="submit"
                    :disabled="!isFormValid"
                    :loading="isUpdating"
                    prepend-icon="mdi-content-save"
                    class="me-3"
                  >
                    Cập nhật thông tin
                  </v-btn>
                  
                  <v-btn
                    variant="outlined"
                    size="large"
                    @click="resetForm"
                    :disabled="isUpdating"
                  >
                    Hủy bỏ
                  </v-btn>
                </v-col>
              </v-row>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, reactive, computed, inject, onMounted } from 'vue';
import { useStore } from 'vuex';
import { userProfileService } from '@/services/userProfile.service';

export default {
  name: 'UserProfileForm',
  
  setup() {
    const store = useStore();
    const showNotification = inject('showNotification');
    const setLoading = inject('setLoading');
    
    const profileForm = ref(null);
    const avatarInput = ref(null);
    const isFormValid = ref(false);
    const isUpdating = ref(false);
    const avatarUploading = ref(false);
    const avatarRemoving = ref(false);

    // Get user profile from store
    const userProfile = computed(() => store.getters['user/profile']);
    
    // Form data
    const profileData = reactive({
      fullName: '',
      email: '',
      phone: '',
      address: '',
      preferredLanguage: 'vi'
    });

    const notificationPreferences = reactive({
      email: true,
      sms: false,
      orderUpdates: true,
      promotions: true
    });

    // Language options
    const languageOptions = [
      { title: 'Tiếng Việt', value: 'vi' },
      { title: 'English', value: 'en' }
    ];

    // Validation rules
    const rules = {
      required: value => !!value || 'Trường này là bắt buộc',
      email: value => {
        const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return pattern.test(value) || 'Email không hợp lệ';
      },
      phone: value => {
        if (!value) return true; // Optional field
        const pattern = /^[0-9+\-\s()]+$/;
        return pattern.test(value) || 'Số điện thoại không hợp lệ';
      }
    };

    /**
     * Load profile data into form
     */
    const loadProfileData = () => {
      if (userProfile.value) {
        profileData.fullName = userProfile.value.fullName || '';
        profileData.email = userProfile.value.email || '';
        profileData.phone = userProfile.value.phone || '';
        profileData.address = userProfile.value.address || '';
        profileData.preferredLanguage = userProfile.value.preferredLanguage || 'vi';
        profileData.profileImage = userProfile.value.profileImage;

        // Load notification preferences
        const prefs = userProfile.value.notificationPreferences;
        if (prefs && typeof prefs === 'object') {
          Object.assign(notificationPreferences, prefs);
        }
      }
    };

    /**
     * Get full image URL
     */
    const getImageUrl = (imagePath) => {
      if (!imagePath) return null;
      if (imagePath.startsWith('http')) return imagePath;
      return `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'}${imagePath}`;
    };

    /**
     * Handle avatar file change
     */
    const handleAvatarChange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        showNotification('Kích thước ảnh không được vượt quá 5MB', 'error');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        showNotification('Vui lòng chọn file ảnh', 'error');
        return;
      }

      avatarUploading.value = true;
      try {
        const response = await userProfileService.uploadAvatar(file);
        profileData.profileImage = response.data.profileImage;
        await store.dispatch('user/fetchProfile');
        showNotification('Tải lên ảnh đại diện thành công', 'success');
      } catch (error) {
        console.error('Error uploading avatar:', error);
        showNotification('Không thể tải lên ảnh đại diện', 'error');
      } finally {
        avatarUploading.value = false;
        // Reset input
        event.target.value = '';
      }
    };

    /**
     * Remove avatar
     */
    const removeAvatar = async () => {
      avatarRemoving.value = true;
      try {
        await userProfileService.removeAvatar();
        profileData.profileImage = null;
        await store.dispatch('user/fetchProfile');
        showNotification('Xóa ảnh đại diện thành công', 'success');
      } catch (error) {
        console.error('Error removing avatar:', error);
        showNotification('Không thể xóa ảnh đại diện', 'error');
      } finally {
        avatarRemoving.value = false;
      }
    };

    /**
     * Update user profile
     */
    const updateProfile = async () => {
      if (!isFormValid.value) return;

      isUpdating.value = true;
      try {
        const updateData = {
          ...profileData,
          notificationPreferences
        };
        
        await userProfileService.updateProfile(updateData);
        await store.dispatch('user/fetchProfile');
        showNotification('Cập nhật thông tin thành công', 'success');
      } catch (error) {
        console.error('Error updating profile:', error);
        const message = error.response?.data?.message || 'Không thể cập nhật thông tin';
        showNotification(message, 'error');
      } finally {
        isUpdating.value = false;
      }
    };

    /**
     * Reset form to original values
     */
    const resetForm = () => {
      loadProfileData();
      if (profileForm.value) {
        profileForm.value.resetValidation();
      }
    };

    onMounted(() => {
      loadProfileData();
    });

    return {
      profileForm,
      avatarInput,
      isFormValid,
      isUpdating,
      avatarUploading,
      avatarRemoving,
      profileData,
      notificationPreferences,
      languageOptions,
      rules,
      getImageUrl,
      handleAvatarChange,
      removeAvatar,
      updateProfile,
      resetForm
    };
  }
};
</script>

<style scoped>
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.avatar-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.v-card {
  border-radius: 12px;
}

.v-avatar {
  border: 3px solid rgba(var(--v-theme-primary), 0.2);
}

@media (max-width: 600px) {
  .avatar-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .avatar-actions .v-btn {
    width: 200px;
  }
}
</style>