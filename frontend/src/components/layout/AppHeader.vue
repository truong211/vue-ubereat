<template>
  <v-app-bar v-if="!isAuthRoute" color="white" elevation="1" app>
    <v-container class="d-flex align-center py-0">
      <!-- Logo and Brand -->
      <router-link to="/" class="text-decoration-none d-flex align-center">
        <v-img
          src="/images/logo.png"
          alt="UberEat"
          width="36"
          height="36"
          class="mr-2"
        ></v-img>
        <div class="text-h6 font-weight-bold primary--text">UberEat</div>
      </router-link>

      <v-spacer></v-spacer>

      <!-- Authentication Actions -->
      <template v-if="isLoggedIn">
        <!-- User Menu -->
        <v-menu offset-y>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="text"
              class="text-none"
            >
              {{ getUserDisplayName }}
              <v-icon right>mdi-chevron-down</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item to="/profile">
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>
            <v-list-item to="/orders">
              <v-list-item-title>My Orders</v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleLogout">
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>

      <template v-else>
        <v-btn to="/login" variant="text" class="mr-2">Login</v-btn>
        <v-btn to="/register" color="primary">Register</v-btn>
      </template>

      <!-- Mobile Menu Button -->
      <v-app-bar-nav-icon class="d-flex d-md-none" @click="$emit('toggle-drawer')"></v-app-bar-nav-icon>
    </v-container>
  </v-app-bar>
</template>

<script>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

export default {
  name: 'AppHeader',

  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()

    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const user = computed(() => authStore.user)
    
    // Check if current route is an auth route to avoid showing duplicate headers
    const isAuthRoute = computed(() => {
      return route.path.includes('/auth/') || 
             route.path === '/login' || 
             route.path === '/register' || 
             route.path.includes('/forgot-password') ||
             route.path.includes('/verify-email');
    })

    const getUserDisplayName = computed(() => {
      if (!user.value) return ''
      if (user.value.firstName && user.value.lastName) {
        return `${user.value.firstName} ${user.value.lastName}`
      }
      return user.value.email
    })

    const menuItems = [
      { title: 'Trang chủ', to: '/' },
      { title: 'Nhà hàng', to: '/restaurants' },
      { title: 'Món ăn', to: '/foods' }
    ]

    const handleLogout = async () => {
      try {
        await authStore.logout()
        router.push('/login')
      } catch (error) {
        console.error('Logout error:', error)
      }
    }

    return {
      isLoggedIn,
      user,
      menuItems,
      getUserDisplayName,
      handleLogout,
      isAuthRoute
    }
  }
}
</script>

<style scoped>
.v-app-bar {
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

/* Responsive Styles */
@media (max-width: 600px) {
  .v-app-bar {
    padding-left: 8px;
    padding-right: 8px;
  }
}

/* Ensure proper spacing between elements */
.v-app-bar :deep(.v-btn) {
  margin-left: 4px;
  margin-right: 4px;
}

.d-flex.align-center {
  gap: 8px;
}
</style>
