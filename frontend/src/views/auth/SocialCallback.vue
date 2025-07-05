<template>
  <div class="social-callback-container">
    <div class="loader">
      <div class="spinner"></div>
      <p>Finishing login, please wait...</p>
    </div>
  </div>
</template>

<script>
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { onMounted } from 'vue';

export default {
  name: 'SocialCallback',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();

    onMounted(async () => {
      try {
        // Get the token from URL parameters
        const token = route.query.token;
        const error = route.query.error;

        if (error) {
          throw new Error(error);
        }

        if (!token) {
          throw new Error('Missing authentication token');
        }

        // The token should be processed by the login action
        // Set the token in local storage and axios headers
        localStorage.setItem('token', token);
        
        // Load user data using the token
        await store.dispatch('auth/loadUser');
        
        // Redirect to home or dashboard based on user role
        const user = store.getters['auth/user'];
        if (user?.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (user?.role === 'restaurant') {
          router.push('/restaurant/dashboard');
        } else if (user?.role === 'driver') {
          router.push('/driver/dashboard');
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Social login error:', error);
        // Redirect to login with error
        router.push({ 
          path: '/auth/login',
          query: { error: 'Authentication failed. Please try again.' }
        });
      }
    });

    return {};
  }
}
</script>

<style scoped>
.social-callback-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  text-align: center;
}

.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 4px solid #3498db;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

p {
  font-size: 18px;
  color: #666;
}
</style>