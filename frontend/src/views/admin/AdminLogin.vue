<template>
  <div class="admin-login-container">
    <v-card class="admin-login-card mx-auto" max-width="500">
      <v-card-title class="text-center text-h4 font-weight-bold pt-8">
        Admin Login
      </v-card-title>

      <v-card-text>
        <v-alert
          v-if="error"
          type="error"
          variant="tonal"
          closable
          class="mb-4"
          @click:close="error = ''"
        >
          {{ error }}
        </v-alert>

        <v-form ref="form" @submit.prevent="login" v-model="isFormValid">
          <v-text-field
            v-model="email"
            label="Email"
            type="email"
            variant="outlined"
            prepend-inner-icon="mdi-email"
            :rules="[rules.required, rules.email]"
            :disabled="loading"
            required
            class="mb-3"
          ></v-text-field>

          <v-text-field
            v-model="password"
            label="Password"
            type="password"
            variant="outlined"
            prepend-inner-icon="mdi-lock"
            :rules="[rules.required]"
            :disabled="loading"
            required
            class="mb-5"
          ></v-text-field>

          <v-btn
            block
            color="primary"
            size="large"
            type="submit"
            :loading="loading"
            :disabled="!isFormValid || loading"
          >
            Login
          </v-btn>
        </v-form>
      </v-card-text>
    </v-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default {
  name: 'AdminLogin',

  setup() {
    const router = useRouter();
    const store = useStore();
    const form = ref(null);
    const isFormValid = ref(false);
    const email = ref('');
    const password = ref('');
    const loading = ref(false);
    const error = ref('');

    // Process any error reasons from URL query parameters
    onMounted(() => {
      const route = router.currentRoute.value;
      const reason = route.query.reason;

      if (reason === 'auth_required') {
        error.value = 'Please log in to access the admin area';
      } else if (reason === 'auth_failed') {
        error.value = 'Your session has expired or is invalid. Please log in again.';
      } else if (reason === 'error') {
        error.value = 'An error occurred. Please log in again.';
      }

      // Clear any invalid tokens from localStorage to ensure clean login
      if (reason) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    });

    const rules = {
      required: v => !!v || 'This field is required',
      email: v => /.+@.+\..+/.test(v) || 'Please enter a valid email'
    };

    const login = async () => {
      if (!isFormValid.value) return;

      loading.value = true;
      error.value = '';

      try {
        console.log('Attempting admin login with email:', email.value);

        // Use the regular login action but check for admin role
        const result = await store.dispatch('auth/login', {
          email: email.value,
          password: password.value
        });

        // Check if user is admin
        if (!result.user || result.user.role !== 'admin') {
          throw new Error('Access denied. Admin privileges required.');
        }

        console.log('Admin login successful, user ID:', result.user.id);

        // Get the redirect path from the query parameters or default to admin
        const redirectPath = router.currentRoute.value.query.redirect || '/admin';

        // Redirect to the specified path or admin panel
        router.push(redirectPath);
      } catch (err) {
        console.error('Admin login error:', err);

        // Provide more helpful error messages based on the specific error
        if (err.response?.status === 404 || err.message?.includes('not found')) {
          error.value = 'User not found. Please check your email.';
        } else if (err.response?.status === 401 || err.message?.includes('invalid')) {
          error.value = 'Invalid credentials. Please check your email and password.';
        } else if (err.message?.includes('admin')) {
          error.value = 'This account does not have administrator privileges.';
        } else {
          error.value = err.message || 'Login failed. Please check your credentials.';
        }
      } finally {
        loading.value = false;
      }
    };

    return {
      form,
      isFormValid,
      email,
      password,
      loading,
      error,
      rules,
      login
    };
  }
};
</script>

<style scoped>
.admin-login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 20px;
}

.admin-login-card {
  width: 100%;
  padding: 20px;
}
</style>
