<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="pa-4 elevation-10 rounded-lg">
          <v-card-title class="text-center text-h4 pb-2">
            Reset Password
          </v-card-title>
          
          <v-card-text>
            <v-alert v-if="tokenError" type="error" class="mb-4">
              {{ tokenError }}
              <div class="mt-2">
                <router-link to="/auth/forgot-password">
                  Request a new password reset
                </router-link>
              </div>
            </v-alert>

            <v-form v-if="!tokenError && !resetComplete" @submit.prevent="resetPassword" ref="form">
              <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
                {{ error }}
              </v-alert>

              <v-text-field
                v-model="password"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                :type="showPassword ? 'text' : 'password'"
                :rules="passwordRules"
                label="New Password"
                variant="outlined"
                required
                @click:append-inner="showPassword = !showPassword"
              ></v-text-field>

              <v-text-field
                v-model="confirmPassword"
                :type="showPassword ? 'text' : 'password'"
                :rules="confirmPasswordRules"
                label="Confirm New Password"
                variant="outlined"
                required
              ></v-text-field>

              <v-btn
                type="submit"
                color="primary"
                block
                :loading="loading"
              >
                Reset Password
              </v-btn>
            </v-form>

            <v-alert v-if="resetComplete" type="success" class="mt-4">
              Password reset complete! You can now <router-link to="/auth/login">log in</router-link> with your new password.
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter, useRoute } from 'vue-router';

const store = useStore();
const router = useRouter();
const route = useRoute();

// Form data
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const form = ref(null);
const token = ref('');

// Component state
const loading = ref(false);
const error = ref(null);
const tokenError = ref(null);
const resetComplete = ref(false);

// Form validation
const passwordRules = [
  v => !!v || 'Password is required',
  v => v.length >= 8 || 'Password must be at least 8 characters'
];

const confirmPasswordRules = [
  v => !!v || 'Please confirm your password',
  v => v === password.value || 'Passwords do not match'
];

// Reset password
const resetPassword = async () => {
  const { valid } = await form.value.validate();
  
  if (!valid) return;
  
  loading.value = true;
  error.value = null;
  
  try {
    await store.dispatch('auth/resetPassword', {
      token: token.value,
      newPassword: password.value
    });
    
    resetComplete.value = true;
  } catch (err) {
    error.value = err.message || 'Failed to reset password. Please try again.';
  } finally {
    loading.value = false;
  }
};

// Validate token on load
onMounted(() => {
  // Get token from route params
  token.value = route.params.token;
  
  if (!token.value) {
    tokenError.value = 'Invalid or expired password reset link.';
  }
});
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}
</style>