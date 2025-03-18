`<template>
  <div class="verify-email">
    <div class="verification-container">
      <div v-if="loading" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Verifying your email...</p>
      </div>

      <div v-else-if="error" class="alert alert-danger" role="alert">
        {{ error }}
        <div class="mt-3">
          <router-link to="/login" class="btn btn-primary">Go to Login</router-link>
        </div>
      </div>

      <div v-else class="alert alert-success" role="alert">
        <h4 class="alert-heading">Email Verified!</h4>
        <p>Your email has been successfully verified. You can now proceed to login.</p>
        <div class="mt-3">
          <router-link to="/login" class="btn btn-primary">Go to Login</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

export default defineComponent({
  name: 'VerifyEmail',
  setup() {
    const route = useRoute();
    const router = useRouter();

    const verifyEmail = async (token) => {
      try {
        await axios.get(`/api/auth/verify-email/${token}`);
        return { success: true };
      } catch (error) {
        return { 
          success: false, 
          error: error.response?.data?.message || 'Verification failed'
        };
      }
    };

    return {
      route,
      router,
      verifyEmail
    };
  },
  data() {
    return {
      loading: true,
      error: null
    };
  },
  async mounted() {
    const token = this.route.params.token;
    if (!token) {
      this.error = 'Invalid verification link';
      this.loading = false;
      return;
    }

    const { success, error } = await this.verifyEmail(token);
    this.loading = false;
    if (!success) {
      this.error = error;
    }
  }
});
</script>

<style scoped>
.verify-email {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
}

.verification-container {
  max-width: 500px;
  width: 90%;
  padding: 2rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>`