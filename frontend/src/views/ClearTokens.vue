<template>
  <div class="clear-tokens-page">
    <div class="container py-10">
      <div class="card mx-auto max-w-lg p-6 shadow-lg rounded-lg">
        <h1 class="text-3xl font-bold mb-4 text-center">Authentication Reset Required</h1>
        
        <div class="alert mb-6 p-4 bg-orange-100 text-orange-800 rounded-lg">
          <p class="mb-2">
            <strong>Your authentication has been reset because:</strong>
          </p>
          <ul class="list-disc pl-6 mb-2">
            <li>The server's security keys have been updated</li>
            <li>Your authentication token is invalid or expired</li>
            <li>There was a system update that requires re-login</li>
          </ul>
          <p>This is a security measure to protect your account. Click the button below to log in again.</p>
        </div>
        
        <div class="text-center">
          <button @click="clearTokens" class="btn btn-primary px-6 py-3 rounded-lg bg-primary text-white font-bold">
            Clear Auth Data & Login Again
          </button>
        </div>
        
        <div v-if="cleared" class="mt-4 alert p-3 bg-green-100 text-green-800 rounded-lg">
          Authentication data cleared successfully. Redirecting to login...
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { clearAuthStorage } from '@/config';
import { useStore } from 'vuex';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'ClearTokensPage',
  setup() {
    const store = useStore();
    const router = useRouter();
    const cleared = ref(false);
    
    onMounted(() => {
      // Clear tokens automatically when the page loads
      clearTokens();
    });
    
    const clearTokens = () => {
      // Clear all auth data from store
      store.commit('auth/CLEAR_AUTH');
      
      // Clear all auth tokens and storage
      clearAuthStorage();
      
      // Set cleared flag
      cleared.value = true;
      
      // Redirect to login page after a delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    };
    
    return {
      cleared,
      clearTokens
    };
  }
};
</script>

<style scoped>
.clear-tokens-page {
  min-height: 80vh;
  display: flex;
  align-items: center;
}

.btn-primary {
  background-color: var(--primary-color, #ff5252);
  transition: background-color 0.3s;
}

.btn-primary:hover {
  background-color: var(--primary-dark, #e04646);
}
</style> 