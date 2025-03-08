<template>
  <v-card class="login-form pa-4">
    <v-card-title class="text-center text-h5 mb-4">Login</v-card-title>
    
    <v-form @submit.prevent="handleSubmit" v-model="isValid">
      <v-text-field
        v-model="email"
        label="Email"
        type="email"
        :rules="[rules.required, rules.email]"
        variant="outlined"
        prepend-inner-icon="mdi-email"
        class="mb-4"
      ></v-text-field>

      <v-text-field
        v-model="password"
        label="Password"
        :type="showPassword ? 'text' : 'password'"
        :rules="[rules.required, rules.minLength]"
        variant="outlined"
        prepend-inner-icon="mdi-lock"
        :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
        @click:append-inner="showPassword = !showPassword"
        class="mb-6"
      ></v-text-field>

      <div class="d-flex justify-space-between align-center mb-6">
        <v-checkbox
          v-model="rememberMe"
          label="Remember me"
          hide-details
        ></v-checkbox>
        <router-link
          to="/auth/forgot-password"
          class="text-decoration-none text-primary"
        >
          Forgot Password?
        </router-link>
      </div>

      <v-btn
        type="submit"
        color="primary"
        block
        size="large"
        :loading="loading"
        :disabled="!isValid || loading"
      >
        Login
      </v-btn>

      <div class="text-center mt-6">
        <span class="text-medium-emphasis">Don't have an account? </span>
        <router-link
          to="/auth/register"
          class="text-decoration-none text-primary"
        >
          Sign up
        </router-link>
      </div>

      <v-divider class="my-6"></v-divider>

      <div class="text-center mb-4">
        <span class="text-medium-emphasis">Or continue with</span>
      </div>

      <div class="d-flex justify-space-between">
        <v-btn
          variant="outlined"
          prepend-icon="mdi-google"
          class="flex-grow-1 mr-2"
          @click="handleGoogleLogin"
        >
          Google
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-facebook"
          class="flex-grow-1"
          @click="handleFacebookLogin"
        >
          Facebook
        </v-btn>
      </div>
    </v-form>
  </v-card>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const isValid = ref(false)

const rules = {
  required: v => !!v || 'This field is required',
  email: v => /.+@.+\..+/.test(v) || 'Please enter a valid email',
  minLength: v => v.length >= 6 || 'Password must be at least 6 characters'
}

async function handleSubmit() {
  if (!isValid.value) return
  
  loading.value = true
  try {
    await authStore.login({
      email: email.value,
      password: password.value,
      rememberMe: rememberMe.value
    })
    router.push('/')
  } catch (error) {
    console.error('Login failed:', error)
  } finally {
    loading.value = false
  }
}

async function handleGoogleLogin() {
  try {
    await authStore.loginWithGoogle()
    router.push('/')
  } catch (error) {
    console.error('Google login failed:', error)
  }
}

async function handleFacebookLogin() {
  try {
    await authStore.loginWithFacebook()
    router.push('/')
  } catch (error) {
    console.error('Facebook login failed:', error)
  }
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
}
</style>