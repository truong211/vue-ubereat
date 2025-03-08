<template>
  <div class="social-login">
    <v-btn
      block
      color="#DB4437"
      variant="elevated"
      class="mb-4"
      :loading="loading.google"
      @click="handleGoogleLogin"
      prepend-icon="mdi-google"
    >
      Đăng nhập bằng Google
    </v-btn>

    <v-btn
      block
      color="#4267B2"
      variant="elevated"
      :loading="loading.facebook"
      @click="handleFacebookLogin"
      prepend-icon="mdi-facebook"
    >
      Đăng nhập bằng Facebook
    </v-btn>

    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      closable
      class="mt-4"
      @click:close="error = null"
    >
      {{ error }}
    </v-alert>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Store, useStore } from 'vuex'
import socialAuth from '@/services/social-auth'

interface State {
  auth: {
    user: {
      role: string;
    } | null;
  };
}

const store: Store<State> = useStore()
const router = useRouter()

const loading = ref({
  google: false,
  facebook: false
})

const error = ref<string | null>(null)

const handleSocialLogin = async (provider: 'google' | 'facebook') => {
  loading.value[provider] = true
  error.value = null

  try {
    // Get social auth response
    const response = await socialAuth.login(provider)
    
    // Send to backend to complete authentication
    await store.dispatch('auth/loginWithSocial', {
      provider,
      accessToken: response.accessToken,
      profile: response.profile
    })

    // Redirect based on user role
    const role = store.state.auth.user?.role
    if (role === 'restaurant') {
      router.push('/restaurant/dashboard')
    } else if (role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/')
    }
  } catch (err: any) {
    console.error(`${provider} login error:`, err)
    error.value = err.message || `Failed to login with ${provider}`
  } finally {
    loading.value[provider] = false
  }
}

const handleGoogleLogin = () => handleSocialLogin('google')
const handleFacebookLogin = () => handleSocialLogin('facebook')
</script>

<style scoped>
.social-login {
  width: 100%;
}
</style>