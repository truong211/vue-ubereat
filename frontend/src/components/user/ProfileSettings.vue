<template>
  <div class="profile-settings">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-account" class="mr-2" />
        Profile Information
      </v-card-title>
      
      <v-card-text>
        <v-form ref="profileForm" @submit.prevent="updateProfile">
          <!-- User Avatar -->
          <div class="d-flex justify-center mb-6">
            <div class="position-relative">
              <v-avatar size="120">
                <v-img v-if="profileData.avatar" :src="profileData.avatar" alt="User avatar"></v-img>
                <v-icon v-else icon="mdi-account" size="64"></v-icon>
              </v-avatar>
              <v-btn
                icon="mdi-camera"
                size="small"
                variant="tonal"
                color="primary"
                class="avatar-edit-button"
                @click="openFileDialog"
              ></v-btn>
              <input type="file" ref="fileInput" accept="image/*" class="d-none" @change="onFileSelected" />
            </div>
          </div>
          
          <v-row>
            <!-- Full Name -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profileData.name"
                label="Full Name"
                :rules="[rules.required]"
                variant="outlined"
                hide-details="auto"
                class="mb-4"
              ></v-text-field>
            </v-col>
            
            <!-- Email -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profileData.email"
                label="Email"
                :rules="[rules.required, rules.email]"
                variant="outlined"
                readonly
                hide-details="auto"
                class="mb-4"
              ></v-text-field>
            </v-col>
            
            <!-- Phone Number -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profileData.phone"
                label="Phone Number"
                :rules="[rules.phone]"
                variant="outlined"
                hide-details="auto"
                class="mb-4"
              ></v-text-field>
            </v-col>
            
            <!-- Date of Birth -->
            <v-col cols="12" md="6">
              <v-text-field
                v-model="profileData.dateOfBirth"
                label="Date of Birth"
                type="date"
                variant="outlined"
                hide-details="auto"
                class="mb-4"
              ></v-text-field>
            </v-col>
            
            <!-- Gender -->
            <v-col cols="12" md="6">
              <v-select
                v-model="profileData.gender"
                label="Gender"
                :items="genderOptions"
                variant="outlined"
                hide-details="auto"
                class="mb-4"
              ></v-select>
            </v-col>
          </v-row>
          
          <v-alert
            v-if="error"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ error }}
          </v-alert>
          
          <div class="d-flex justify-end">
            <v-btn
              type="submit"
              color="primary"
              :loading="loading"
            >
              Save Changes
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';

export default {
  name: 'ProfileSettings',
  
  setup() {
    const profileForm = ref(null);
    const fileInput = ref(null);
    const loading = ref(false);
    const error = ref('');
    
    // Profile data
    const profileData = reactive({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'prefer_not_to_say',
      avatar: ''
    });
    
    // Gender options
    const genderOptions = [
      { title: 'Male', value: 'male' },
      { title: 'Female', value: 'female' },
      { title: 'Prefer not to say', value: 'prefer_not_to_say' }
    ];
    
    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      email: v => /.+@.+\..+/.test(v) || 'Email must be valid',
      phone: v => !v || /^\+?[0-9]{10,15}$/.test(v) || 'Phone number must be valid'
    };
    
    // Open file dialog
    const openFileDialog = () => {
      fileInput.value.click();
    };
    
    // Handle file selection
    const onFileSelected = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          profileData.avatar = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    };
    
    // Update profile
    const updateProfile = async () => {
      if (!profileForm.value.validate()) return;
      
      loading.value = true;
      error.value = '';
      
      try {
        // Call your API here to update profile
        // Example: await axios.put('/api/user/profile', profileData);
        
        // Show success message
        // ...
      } catch (err) {
        error.value = err.message || 'Failed to update profile';
      } finally {
        loading.value = false;
      }
    };
    
    // Load profile data
    const loadProfileData = () => {
      // Replace with your actual data loading
      const user = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        avatar: ''
      };
      
      // Update profile data
      Object.assign(profileData, user);
    };
    
    // Load profile data on mount
    onMounted(() => {
      loadProfileData();
    });
    
    return {
      profileForm,
      fileInput,
      profileData,
      genderOptions,
      loading,
      error,
      rules,
      openFileDialog,
      onFileSelected,
      updateProfile
    };
  }
};
</script>

<style scoped>
.avatar-edit-button {
  position: absolute;
  bottom: 0;
  right: 0;
}

.position-relative {
  position: relative;
}
</style> 