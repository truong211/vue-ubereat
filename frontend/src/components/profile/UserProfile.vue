<template>
  <div class="profile-page">
    <div class="container py-5">
      <div class="row">
        <div class="col-lg-4">
          <div class="profile-sidebar card">
            <div class="text-center p-3">
              <div class="avatar-wrapper mb-3">
                <img 
                  :src="userAvatar" 
                  :alt="user?.fullName"
                  class="rounded-circle profile-avatar"
                >
                <div class="avatar-overlay">
                  <label class="upload-button">
                    <input 
                      type="file" 
                      accept="image/*"
                      @change="handleAvatarUpload"
                      class="d-none"
                    >
                    <i class="fas fa-camera"></i>
                  </label>
                </div>
              </div>
              <h4>{{ displayName }}</h4>
              <p class="text-muted">{{ user?.email }}</p>
            </div>
          </div>
        </div>
        
        <div class="col-lg-8">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title mb-4">Profile Information</h5>
              <form @submit.prevent="updateProfile">
                <div class="mb-3">
                  <label class="form-label">Full Name</label>
                  <input 
                    v-model="formData.fullName"
                    type="text"
                    class="form-control"
                    :class="{ 'is-invalid': errors.fullName }"
                  >
                  <div class="invalid-feedback">{{ errors.fullName }}</div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Phone Number</label>
                  <input 
                    v-model="formData.phone"
                    type="tel"
                    class="form-control"
                    :class="{ 'is-invalid': errors.phone }"
                  >
                  <div class="invalid-feedback">{{ errors.phone }}</div>
                </div>

                <div class="mb-3">
                  <label class="form-label">Address</label>
                  <textarea 
                    v-model="formData.address"
                    class="form-control"
                    rows="3"
                    :class="{ 'is-invalid': errors.address }"
                  ></textarea>
                  <div class="invalid-feedback">{{ errors.address }}</div>
                </div>

                <div class="d-flex justify-content-between align-items-center">
                  <button 
                    type="submit" 
                    class="btn btn-primary"
                    :disabled="loading"
                  >
                    <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
                    Save Changes
                  </button>

                  <button 
                    type="button" 
                    class="btn btn-outline-secondary"
                    @click="showChangePasswordModal = true"
                  >
                    Change Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Change Password Modal -->
    <div 
      class="modal fade" 
      :class="{ 'show': showChangePasswordModal }"
      tabindex="-1"
      v-if="showChangePasswordModal"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Change Password</h5>
            <button 
              type="button" 
              class="btn-close" 
              @click="showChangePasswordModal = false"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="changePassword">
              <div class="mb-3">
                <label class="form-label">Current Password</label>
                <input 
                  v-model="passwordData.currentPassword"
                  type="password"
                  class="form-control"
                  :class="{ 'is-invalid': passwordErrors.currentPassword }"
                >
                <div class="invalid-feedback">{{ passwordErrors.currentPassword }}</div>
              </div>

              <div class="mb-3">
                <label class="form-label">New Password</label>
                <input 
                  v-model="passwordData.newPassword"
                  type="password"
                  class="form-control"
                  :class="{ 'is-invalid': passwordErrors.newPassword }"
                >
                <div class="invalid-feedback">{{ passwordErrors.newPassword }}</div>
              </div>

              <div class="mb-3">
                <label class="form-label">Confirm New Password</label>
                <input 
                  v-model="passwordData.confirmPassword"
                  type="password"
                  class="form-control"
                  :class="{ 'is-invalid': passwordErrors.confirmPassword }"
                >
                <div class="invalid-feedback">{{ passwordErrors.confirmPassword }}</div>
              </div>

              <div class="d-grid">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="passwordLoading"
                >
                  <span v-if="passwordLoading" class="spinner-border spinner-border-sm me-2"></span>
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useStore } from 'vuex';
import { computed, ref } from 'vue';
import axios from 'axios';

export default defineComponent({
  name: 'UserProfile',
  
  setup() {
    const store = useStore();
    const user = computed(() => store.state.auth.user);
    
    return {
      user
    };
  },

  data() {
    return {
      formData: {
        fullName: '',
        phone: '',
        address: ''
      },
      passwordData: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      loading: false,
      passwordLoading: false,
      errors: {},
      passwordErrors: {},
      showChangePasswordModal: false
    };
  },

  computed: {
    userAvatar() {
      if (this.user?.profileImage) {
        return `/uploads/profiles/${this.user.profileImage}`;
      }
      return '/img/default-avatar.png';
    },
    
    displayName() {
      return this.user?.fullName || this.user?.name || 'User';
    }
  },

  created() {
    this.initializeFormData();
  },

  methods: {
    initializeFormData() {
      if (this.user) {
        this.formData = {
          fullName: this.user.fullName || this.user.name || '',
          phone: this.user.phone || '',
          address: this.user.address || ''
        };
      }
    },

    async handleAvatarUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        this.$toast.error('Please upload an image file (JPEG, PNG, or GIF)');
        return;
      }

      if (file.size > maxSize) {
        this.$toast.error('Image size should be less than 5MB');
        return;
      }

      try {
        const formData = new FormData();
        formData.append('image', file);

        const response = await axios.post('/api/users/profile/image', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        // Get the user data from response
        const userData = response.data.data?.user || response.data.user;
        
        if (userData) {
          // Ensure the user object has the correct fullName property
          const updatedUser = {
            ...userData,
            fullName: userData.fullName || userData.name || ''
          };
          
          // Update the user in store
          await this.$store.dispatch('auth/updateUser', updatedUser);
        }
        
        this.$toast.success('Profile image updated successfully');
      } catch (error) {
        this.$toast.error(error.response?.data?.message || 'Failed to upload image');
      }
    },

    async updateProfile() {
      this.loading = true;
      this.errors = {};

      try {
        // Make sure we're sending the correct field names
        const formDataToSend = {
          name: this.formData.fullName, // Backend might expect 'name' instead of 'fullName'
          phone: this.formData.phone,
          address: this.formData.address
        };

        const response = await axios.patch('/api/users/profile', formDataToSend);
        
        // Get the user data from response
        const userData = response.data.data?.user || response.data.user;
        
        if (userData) {
          // Ensure the user object has the correct fullName property
          const updatedUser = {
            ...userData,
            fullName: userData.fullName || userData.name || ''
          };
          
          // Update the user in store
          await this.$store.dispatch('auth/updateUser', updatedUser);
        }
        
        this.$toast.success('Profile updated successfully');
      } catch (error) {
        if (error.response?.data?.errors) {
          this.errors = error.response.data.errors;
        } else {
          this.$toast.error(error.response?.data?.message || 'Failed to update profile');
        }
      } finally {
        this.loading = false;
      }
    },

    async changePassword() {
      if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
        this.passwordErrors.confirmPassword = 'Passwords do not match';
        return;
      }

      this.passwordLoading = true;
      this.passwordErrors = {};

      try {
        await axios.patch('/api/auth/update-password', {
          currentPassword: this.passwordData.currentPassword,
          newPassword: this.passwordData.newPassword
        });

        this.showChangePasswordModal = false;
        this.passwordData = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.$toast.success('Password updated successfully');
      } catch (error) {
        if (error.response?.data?.errors) {
          this.passwordErrors = error.response.data.errors;
        } else {
          this.$toast.error(error.response?.data?.message || 'Failed to update password');
        }
      } finally {
        this.passwordLoading = false;
      }
    }
  }
});
</script>

<style scoped>
.profile-page {
  background-color: #f8f9fa;
  min-height: 100vh;
}

.profile-avatar {
  width: 150px;
  height: 150px;
  object-fit: cover;
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  width: 35px;
  height: 35px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.3s;
}

.avatar-overlay:hover {
  background: rgba(0, 0, 0, 0.7);
}

.upload-button {
  color: white;
  cursor: pointer;
  margin: 0;
}

.modal.show {
  display: block;
  background-color: rgba(0, 0, 0, 0.5);
}
</style>