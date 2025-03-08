<template>
  <v-layout class="auth-layout">
    <v-main>
      <v-container fluid class="pa-0">
        <v-row>
          <!-- Auth Content Side -->
          <v-col cols="12" md="6" class="auth-content d-flex align-center justify-center">
            <v-sheet class="auth-form-container" max-width="480">
              <!-- Logo -->
              <div class="text-center mb-8">
                <router-link to="/" class="text-decoration-none">
                  <v-img
                    src="@/assets/logo.png"
                    alt="Logo"
                    width="160"
                    class="mx-auto"
                  />
                </router-link>
              </div>

              <!-- Auth Form Content -->
              <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in">
                  <component :is="Component" />
                </transition>
              </router-view>
            </v-sheet>
          </v-col>

          <!-- Image Side -->
          <v-col 
            cols="12" 
            md="6" 
            class="auth-image d-none d-md-flex"
            :style="{
              backgroundImage: `url(${backgroundImage})`
            }"
          >
            <div class="overlay"></div>
            <div class="content">
              <h1 class="text-h3 font-weight-bold text-white mb-4">
                {{ getHeadline }}
              </h1>
              <p class="text-h6 text-white">
                {{ getSubheadline }}
              </p>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-layout>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'AuthLayout',

  setup() {
    const route = useRoute()

    const backgroundImage = computed(() => {
      switch (route.name) {
        case 'Login':
          return new URL('@/assets/images/auth/login-bg.jpg', import.meta.url).href
        case 'Register':
          return new URL('@/assets/images/auth/register-bg.jpg', import.meta.url).href
        case 'ForgotPassword':
          return new URL('@/assets/images/auth/forgot-password-bg.jpg', import.meta.url).href
        default:
          return new URL('@/assets/images/auth/default-bg.jpg', import.meta.url).href
      }
    })

    const getHeadline = computed(() => {
      switch (route.name) {
        case 'Login':
          return 'Welcome Back!'
        case 'Register':
          return 'Join Our Community'
        case 'ForgotPassword':
          return 'Reset Your Password'
        default:
          return 'Welcome'
      }
    })

    const getSubheadline = computed(() => {
      switch (route.name) {
        case 'Login':
          return 'Sign in to continue to your account'
        case 'Register':
          return 'Create an account to get started'
        case 'ForgotPassword':
          return "We'll help you get back to your account"
        default:
          return 'Discover amazing food near you'
      }
    })

    return {
      backgroundImage,
      getHeadline,
      getSubheadline
    }
  }
})
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
}

.auth-content {
  min-height: 100vh;
  padding: 2rem;
}

.auth-form-container {
  width: 100%;
  padding: 2rem;
}

.auth-image {
  position: relative;
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-image .overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.auth-image .content {
  position: relative;
  z-index: 1;
  padding: 2rem;
  text-align: center;
  max-width: 480px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>