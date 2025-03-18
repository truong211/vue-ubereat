<template>
  <div class="personal-info">
    <h2 class="text-h6 mb-4">Personal Information</h2>
    
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    
    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>
    
    <!-- Success Alert -->
    <v-alert
      v-if="successMessage"
      type="success"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="successMessage = ''"
    >
      {{ successMessage }}
    </v-alert>
    
    <!-- Form -->
    <v-form
      ref="form"
      v-model="isValid"
      @submit.prevent="updateProfile"
    >
      <v-card>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.firstName"
                label="First Name"
                :rules="[rules.required]"
                required
                variant="outlined"
                hint="Your legal first name"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.lastName"
                label="Last Name"
                :rules="[rules.required]"
                required
                variant="outlined"
                hint="Your legal last name"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="formData.email"
                label="Email Address"
                type="email"
                :rules="[rules.required, rules.email]"
                required
                variant="outlined"
                readonly
                disabled
                hint="To change your email, please contact support"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="formData.phone"
                label="Phone Number"
                type="tel"
                :rules="[rules.required, rules.phone]"
                variant="outlined"
                hint="We'll use this for delivery updates"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.dateOfBirth"
                label="Date of Birth"
                type="date"
                variant="outlined"
                hint="Must be 18+ to order alcohol"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.language"
                label="Preferred Language"
                :items="languageOptions"
                item-title="name"
                item-value="code"
                variant="outlined"
                hint="For notifications and emails"
              ></v-select>
            </v-col>
            
            <v-col cols="12">
              <v-textarea
                v-model="formData.bio"
                label="About Me"
                variant="outlined"
                hint="Tell us a bit about yourself (optional)"
                counter="200"
                rows="3"
                auto-grow
              ></v-textarea>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            type="submit"
            color="primary"
            :loading="loading"
            :disabled="!isValid || loading"
          >
            Save Changes
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-form>
    
    <v-card class="mt-6">
      <v-card-title class="text-error">Change Password</v-card-title>
      <v-card-text>
        <v-form
          ref="passwordForm"
          v-model="isPasswordFormValid"
          @submit.prevent="updatePassword"
        >
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="passwordData.currentPassword"
                label="Current Password"
                :type="showPassword.current ? 'text' : 'password'"
                :rules="[rules.required]"
                variant="outlined"
                required
                :append-inner-icon="showPassword.current ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword.current = !showPassword.current"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="passwordData.newPassword"
                label="New Password"
                :type="showPassword.new ? 'text' : 'password'"
                :rules="[rules.required, rules.password]"
                variant="outlined"
                required
                :append-inner-icon="showPassword.new ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword.new = !showPassword.new"
                hint="At least 8 characters with letters, numbers, and symbols"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12">
              <v-text-field
                v-model="passwordData.confirmPassword"
                label="Confirm New Password"
                :type="showPassword.confirm ? 'text' : 'password'"
                :rules="[rules.required, passwordMatchRule]"
                variant="outlined"
                required
                :append-inner-icon="showPassword.confirm ? 'mdi-eye-off' : 'mdi-eye'"
                @click:append-inner="showPassword.confirm = !showPassword.confirm"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <div class="d-flex justify-end mt-2">
            <v-btn
              type="submit"
              color="primary"
              :loading="passwordLoading"
              :disabled="!isPasswordFormValid || passwordLoading"
            >
              Update Password
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ref, computed, reactive, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';

export default {
  name: 'PersonalInfo',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    const form = ref(null);
    const passwordForm = ref(null);
    
    const isValid = ref(false);
    const isPasswordFormValid = ref(false);
    const loading = ref(false);
    const passwordLoading = ref(false);
    const error = ref('');
    const successMessage = ref('');
    
    // Form data
    const formData = reactive({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      language: 'en',
      bio: ''
    });
    
    const passwordData = reactive({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    const showPassword = reactive({
      current: false,
      new: false,
      confirm: false
    });
    
    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      email: v => /.+@.+\..+/.test(v) || 'Email must be valid',
      phone: v => /^\+?[\d\s-]{10,}$/.test(v) || 'Phone number must be valid',
      password: v => /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(v) || 
        'Password must be at least 8 characters with letters, numbers, and symbols'
    };
    
    const passwordMatchRule = v => v === passwordData.newPassword || 'Passwords must match';
    
    const languageOptions = [
      { name: 'English', code: 'en' },
      { name: 'Spanish', code: 'es' },
      { name: 'French', code: 'fr' },
      { name: 'Chinese', code: 'zh' },
      { name: 'Arabic', code: 'ar' },
      { name: 'Hindi', code: 'hi' }
    ];
    
    // Load user profile data
    const loadProfile = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const userData = await store.dispatch('user/fetchProfile');
        
        // Fill form data
        formData.firstName = userData.firstName || '';
        formData.lastName = userData.lastName || '';
        formData.email = userData.email || '';
        formData.phone = userData.phone || '';
        formData.dateOfBirth = userData.dateOfBirth || '';
        formData.language = userData.language || 'en';
        formData.bio = userData.bio || '';
      } catch (err) {
        console.error('Error loading profile:', err);
        error.value = 'Failed to load your profile. Please try refreshing the page.';
      } finally {
        loading.value = false;
      }
    };
    
    // Update profile info
    const updateProfile = async () => {
      if (!isValid.value) return;
      
      loading.value = true;
      error.value = '';
      successMessage.value = '';
      
      try {
        await store.dispatch('user/updateProfile', formData);
        successMessage.value = 'Your profile has been updated successfully!';
        toast.success('Profile updated successfully');
      } catch (err) {
        console.error('Error updating profile:', err);
        error.value = err.response?.data?.message || 'Failed to update profile. Please try again later.';
        toast.error('Failed to update profile');
      } finally {
        loading.value = false;
      }
    };
    
    // Update password
    const updatePassword = async () => {
      if (!isPasswordFormValid.value) return;
      
      passwordLoading.value = true;
      error.value = '';
      successMessage.value = '';
      
      try {
        await store.dispatch('user/updatePassword', {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        });
        
        // Reset form
        passwordData.currentPassword = '';
        passwordData.newPassword = '';
        passwordData.confirmPassword = '';
        passwordForm.value.reset();
        
        successMessage.value = 'Your password has been changed successfully!';
        toast.success('Password changed successfully');
      } catch (err) {
        console.error('Error updating password:', err);
        error.value = err.response?.data?.message || 'Failed to update password. Please check your current password.';
        toast.error('Failed to update password');
      } finally {
        passwordLoading.value = false;
      }
    };
    
    onMounted(loadProfile);
    
    return {
      form,
      passwordForm,
      isValid,
      isPasswordFormValid,
      loading,
      passwordLoading,
      error,
      successMessage,
      formData,
      passwordData,
      showPassword,
      rules,
      passwordMatchRule,
      languageOptions,
      updateProfile,
      updatePassword
    };
  }
};
</script>