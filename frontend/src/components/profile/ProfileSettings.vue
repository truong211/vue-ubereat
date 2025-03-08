<template>
  <div class="profile-settings">
    <!-- Profile Form -->
    <v-form ref="profileForm" v-model="isProfileValid" @submit.prevent="updateProfile">
      <v-row>
        <!-- Avatar Upload Section -->
        <v-col cols="12" class="d-flex justify-center">
          <div class="profile-avatar-container">
            <v-avatar size="120" :color="avatar ? undefined : 'primary'" class="profile-avatar">
              <v-img v-if="avatar" :src="avatar" alt="User avatar"></v-img>
              <span v-else class="text-h4">{{ userInitials }}</span>
            </v-avatar>
            
            <v-menu location="bottom">
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-camera"
                  variant="tonal"
                  color="primary"
                  size="small"
                  class="avatar-edit-button"
                ></v-btn>
              </template>
              <v-list>
                <v-list-item @click="triggerFileInput">
                  <v-list-item-title>Upload Photo</v-list-item-title>
                </v-list-item>
                <v-list-item v-if="avatar" @click="removeAvatar">
                  <v-list-item-title>Remove Photo</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            
            <!-- Hidden file input -->
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              class="d-none"
              @change="handleFileUpload"
            />
          </div>
        </v-col>
        
        <!-- Name & Email -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.name"
            label="Full Name"
            variant="outlined"
            :rules="[v => !!v || 'Name is required']"
            autocomplete="name"
            required
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.email"
            label="Email"
            variant="outlined"
            :rules="[
              v => !!v || 'Email is required',
              v => /.+@.+\..+/.test(v) || 'Email must be valid'
            ]"
            autocomplete="email"
            required
          ></v-text-field>
        </v-col>
        
        <!-- Phone -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.phone"
            label="Phone"
            variant="outlined"
            :rules="[
              v => !!v || 'Phone number is required',
              v => /^(\+\d{1,3}[- ]?)?\d{10,14}$/.test(v.replace(/\s/g, '')) || 'Phone number must be valid'
            ]"
            autocomplete="tel"
            required
          ></v-text-field>
        </v-col>
        
        <!-- Date of Birth -->
        <v-col cols="12" md="6">
          <v-text-field
            v-model="formData.dateOfBirth"
            label="Date of Birth"
            variant="outlined"
            type="date"
            autocomplete="bday"
          ></v-text-field>
        </v-col>
        
        <!-- Gender -->
        <v-col cols="12">
          <v-radio-group
            v-model="formData.gender"
            label="Gender"
            inline
            hide-details
          >
            <v-radio value="male" label="Male"></v-radio>
            <v-radio value="female" label="Female"></v-radio>
            <v-radio value="other" label="Other"></v-radio>
            <v-radio value="prefer_not_to_say" label="Prefer not to say"></v-radio>
          </v-radio-group>
        </v-col>
        
        <!-- Action Buttons -->
        <v-col cols="12" class="d-flex justify-end">
          <v-btn
            variant="text"
            class="mr-2"
            @click="resetForm"
          >
            Cancel
          </v-btn>
          
          <v-btn
            type="submit"
            color="primary"
            :disabled="!isProfileValid || profileLoading"
            :loading="profileLoading"
          >
            Save Changes
          </v-btn>
        </v-col>
      </v-row>
    </v-form>
    
    <!-- Notification Preferences Section -->
    <v-sheet class="mt-6 pa-4" rounded border>
      <div class="d-flex align-center mb-4">
        <div>
          <h3 class="text-h6 mb-1">Notification Preferences</h3>
          <p class="text-body-2 text-medium-emphasis">Control how you receive notifications</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          color="primary"
          :loading="preferencesLoading"
          @click="saveNotificationPreferences"
          :disabled="preferencesLoading"
        >
          Save Preferences
        </v-btn>
      </div>
      
      <v-list>
        <v-list-item class="px-0">
          <template v-slot:prepend>
            <v-icon icon="mdi-email" class="mr-2"></v-icon>
            <div>
              <div class="text-subtitle-1">Email Notifications</div>
              <div class="text-caption text-medium-emphasis">Receive updates via email</div>
            </div>
          </template>
          
          <template v-slot:append>
            <v-switch
              v-model="notificationPrefs.email"
              color="primary"
              hide-details
            ></v-switch>
          </template>
        </v-list-item>
        
        <v-list-item class="px-0">
          <template v-slot:prepend>
            <v-icon icon="mdi-bell" class="mr-2"></v-icon>
            <div>
              <div class="text-subtitle-1">Push Notifications</div>
              <div class="text-caption text-medium-emphasis">Receive updates on your device</div>
            </div>
          </template>
          
          <template v-slot:append>
            <v-switch
              v-model="notificationPrefs.push"
              color="primary"
              hide-details
            ></v-switch>
          </template>
        </v-list-item>
        
        <v-list-item class="px-0">
          <template v-slot:prepend>
            <v-icon icon="mdi-message" class="mr-2"></v-icon>
            <div>
              <div class="text-subtitle-1">SMS Notifications</div>
              <div class="text-caption text-medium-emphasis">Receive updates via SMS</div>
            </div>
          </template>
          
          <template v-slot:append>
            <v-switch
              v-model="notificationPrefs.sms"
              color="primary"
              hide-details
            ></v-switch>
          </template>
        </v-list-item>
        
        <v-divider class="my-2"></v-divider>
        
        <v-list-item class="px-0">
          <template v-slot:prepend>
            <v-icon icon="mdi-food" class="mr-2"></v-icon>
            <div>
              <div class="text-subtitle-1">Order Updates</div>
              <div class="text-caption text-medium-emphasis">Order confirmations, delivery updates</div>
            </div>
          </template>
          
          <template v-slot:append>
            <v-switch
              v-model="notificationPrefs.orderUpdates"
              color="primary"
              hide-details
            ></v-switch>
          </template>
        </v-list-item>
        
        <v-list-item class="px-0">
          <template v-slot:prepend>
            <v-icon icon="mdi-tag" class="mr-2"></v-icon>
            <div>
              <div class="text-subtitle-1">Promotions & Offers</div>
              <div class="text-caption text-medium-emphasis">Special deals, promotions</div>
            </div>
          </template>
          
          <template v-slot:append>
            <v-switch
              v-model="notificationPrefs.promotions"
              color="primary"
              hide-details
            ></v-switch>
          </template>
        </v-list-item>
        
        <v-list-item class="px-0">
          <template v-slot:prepend>
            <v-icon icon="mdi-email-newsletter" class="mr-2"></v-icon>
            <div>
              <div class="text-subtitle-1">Newsletters</div>
              <div class="text-caption text-medium-emphasis">Product updates, news</div>
            </div>
          </template>
          
          <template v-slot:append>
            <v-switch
              v-model="notificationPrefs.newsletters"
              color="primary"
              hide-details
            ></v-switch>
          </template>
        </v-list-item>
      </v-list>
    </v-sheet>
    
    <!-- Dietary Preferences Section -->
    <v-sheet class="mt-6 pa-4" rounded border>
      <div class="d-flex align-center mb-4">
        <div>
          <h3 class="text-h6 mb-1">Dietary Preferences</h3>
          <p class="text-body-2 text-medium-emphasis">Set your food preferences</p>
        </div>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          color="primary"
          :loading="dietaryLoading"
          @click="saveDietaryPreferences"
          :disabled="dietaryLoading"
        >
          Save Preferences
        </v-btn>
      </div>
      
      <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-switch
            v-model="dietaryPrefs.vegetarian"
            color="success"
            label="Vegetarian"
          ></v-switch>
        </v-col>
        
        <v-col cols="12" sm="6" md="4">
          <v-switch
            v-model="dietaryPrefs.vegan"
            color="success"
            label="Vegan"
          ></v-switch>
        </v-col>
        
        <v-col cols="12" sm="6" md="4">
          <v-switch
            v-model="dietaryPrefs.glutenFree"
            color="success"
            label="Gluten Free"
          ></v-switch>
        </v-col>
        
        <v-col cols="12" sm="6" md="4">
          <v-switch
            v-model="dietaryPrefs.nutFree"
            color="success"
            label="Nut Free"
          ></v-switch>
        </v-col>
        
        <v-col cols="12" sm="6" md="4">
          <v-switch
            v-model="dietaryPrefs.dairyFree"
            color="success"
            label="Dairy Free"
          ></v-switch>
        </v-col>
      </v-row>
    </v-sheet>
    
    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mt-4"
      closable
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ProfileSettings',
  
  setup() {
    const store = useStore()
    const profileForm = ref(null)
    const fileInput = ref(null)
    const isProfileValid = ref(false)
    const error = ref('')
    
    // Form Data
    const formData = ref({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'prefer_not_to_say'
    })
    
    // Avatar
    const avatar = computed(() => store.getters['profile/getAvatar'] || '')
    
    // User initials (for avatar fallback)
    const userInitials = computed(() => {
      const name = formData.value.name || ''
      return name.split(' ')
        .map(part => part.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    })
    
    // Notification preferences
    const notificationPrefs = ref({
      email: true,
      push: true,
      sms: false,
      orderUpdates: true,
      promotions: true,
      newsletters: false
    })
    
    // Dietary preferences
    const dietaryPrefs = ref({
      vegetarian: false,
      vegan: false,
      glutenFree: false,
      nutFree: false,
      dairyFree: false
    })
    
    // Loading states
    const profileLoading = computed(() => store.getters['profile/isLoading']('profile'))
    const preferencesLoading = ref(false)
    const dietaryLoading = ref(false)
    
    // Initialize component
    onMounted(async () => {
      try {
        // Load profile data
        const profile = await store.dispatch('profile/fetchProfile')
        
        // Fill form with profile data
        formData.value = {
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          dateOfBirth: profile.dateOfBirth || '',
          gender: profile.gender || 'prefer_not_to_say'
        }
        
        // Load preferences
        await store.dispatch('profile/fetchPreferences')
        
        // Fill notification preferences
        const notificationSettings = store.getters['profile/getNotificationPreferences']
        if (notificationSettings) {
          notificationPrefs.value = { ...notificationPrefs.value, ...notificationSettings }
        }
        
        // Fill dietary preferences
        const dietarySettings = store.getters['profile/getDietaryPreferences']
        if (dietarySettings) {
          dietaryPrefs.value = { ...dietaryPrefs.value, ...dietarySettings }
        }
      } catch (err) {
        error.value = err.message || 'Failed to load profile data'
      }
    })
    
    // Methods
    
    // Trigger file input click
    const triggerFileInput = () => {
      fileInput.value.click()
    }
    
    // Handle file upload
    const handleFileUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return
      
      // Check file type
      if (!file.type.match('image.*')) {
        error.value = 'Please select an image file'
        return
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        error.value = 'Image file size should be less than 5MB'
        return
      }
      
      try {
        await store.dispatch('profile/updateAvatar', file)
      } catch (err) {
        error.value = err.message || 'Failed to upload avatar'
      } finally {
        // Reset file input
        event.target.value = ''
      }
    }
    
    // Remove avatar
    const removeAvatar = async () => {
      try {
        await store.dispatch('profile/updateProfile', { avatar: '' })
      } catch (err) {
        error.value = err.message || 'Failed to remove avatar'
      }
    }
    
    // Update profile
    const updateProfile = async () => {
      if (!isProfileValid.value) return
      
      error.value = ''
      
      try {
        await store.dispatch('profile/updateProfile', formData.value)
      } catch (err) {
        error.value = err.message || 'Failed to update profile'
      }
    }
    
    // Reset form
    const resetForm = () => {
      profileForm.value.reset()
      
      // Reload profile data
      const profile = store.getters['profile/getProfile']
      if (profile) {
        formData.value = {
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          dateOfBirth: profile.dateOfBirth || '',
          gender: profile.gender || 'prefer_not_to_say'
        }
      }
    }
    
    // Save notification preferences
    const saveNotificationPreferences = async () => {
      preferencesLoading.value = true
      error.value = ''
      
      try {
        await store.dispatch('profile/updateNotificationPreferences', notificationPrefs.value)
      } catch (err) {
        error.value = err.message || 'Failed to update notification preferences'
      } finally {
        preferencesLoading.value = false
      }
    }
    
    // Save dietary preferences
    const saveDietaryPreferences = async () => {
      dietaryLoading.value = true
      error.value = ''
      
      try {
        await store.dispatch('profile/updateDietaryPreferences', dietaryPrefs.value)
      } catch (err) {
        error.value = err.message || 'Failed to update dietary preferences'
      } finally {
        dietaryLoading.value = false
      }
    }
    
    return {
      profileForm,
      fileInput,
      isProfileValid,
      formData,
      avatar,
      userInitials,
      notificationPrefs,
      dietaryPrefs,
      profileLoading,
      preferencesLoading,
      dietaryLoading,
      error,
      triggerFileInput,
      handleFileUpload,
      removeAvatar,
      updateProfile,
      resetForm,
      saveNotificationPreferences,
      saveDietaryPreferences
    }
  }
}
</script>

<style scoped>
.profile-avatar-container {
  position: relative;
  margin-bottom: 24px;
}

.profile-avatar {
  border: 3px solid white;
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.6);
}

.avatar-edit-button {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 1;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.success-text {
  color: rgb(var(--v-theme-success));
}

.error-text {
  color: rgb(var(--v-theme-error));
}
</style>
