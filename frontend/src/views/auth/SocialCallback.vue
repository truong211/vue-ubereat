<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="text-center pa-6">
          <v-progress-circular
            v-if="loading"
            indeterminate
            color="primary"
            size="64"
            class="mb-4"
          ></v-progress-circular>
          
          <v-icon
            v-else-if="success"
            icon="mdi-check-circle"
            color="success"
            size="64"
            class="mb-4"
          ></v-icon>
          
          <v-icon
            v-else
            icon="mdi-alert-circle"
            color="error"
            size="64"
            class="mb-4"
          ></v-icon>
          
          <h2 class="text-h5 mb-2">{{ statusTitle }}</h2>
          <p class="text-body-1 mb-6">{{ statusMessage }}</p>
          
          <v-btn
            v-if="!loading"
            color="primary"
            block
            @click="redirectToHome"
          >
            Continue
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';

const router = useRouter();
const route = useRoute();
const store = useStore();

// Status state
const loading = ref(true);
const success = ref(false);
const error = ref(null);

// Computed properties
const provider = computed(() => route.meta.provider || '');

const statusTitle = computed(() => {
  if (loading.value) return 'Processing Login';
  if (success.value) return 'Login Successful';
  return 'Login Failed';
});

const statusMessage = computed(() => {
  if (loading.value) return `Please wait while we complete your ${provider.value} login...`;
  if (success.value) return 'You have been successfully logged in.';
  return error.value || 'We encountered an error processing your login. Please try again.';
});

// Methods
const processCallback = async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    
    if (provider.value === 'google') {
      // Handle Google callback
      const code = params.get('code');
      if (!code) throw new Error('Authorization code missing');
      
      // Exchange code for tokens - in a real app this would call your backend
      // For this demo, we're mocking it
      const result = await mockExchangeCodeForTokens(code, provider.value);
      
      // Complete login
      await store.dispatch('auth/loginWithSocial', { 
        provider: provider.value,
        token: result.access_token
      });
      
      success.value = true;
    } 
    else if (provider.value === 'facebook') {
      // Handle Facebook callback
      const accessToken = params.get('access_token');
      if (!accessToken) throw new Error('Access token missing');
      
      // Complete login
      await store.dispatch('auth/loginWithSocial', { 
        provider: provider.value,
        token: accessToken
      });
      
      success.value = true;
    }
    else {
      throw new Error(`Unsupported provider: ${provider.value}`);
    }
  } catch (err) {
    console.error('Social login callback error:', err);
    error.value = err.message || 'Authentication failed';
    success.value = false;
  } finally {
    loading.value = false;
  }
};

// Mock function to simulate token exchange - in a real app, this would make a backend call
const mockExchangeCodeForTokens = async (code, provider) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock tokens
  return {
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    provider
  };
};

const redirectToHome = () => {
  router.push('/');
};

// Process callback when component mounts
onMounted(() => {
  processCallback();
});
</script> 