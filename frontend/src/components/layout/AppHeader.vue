<template>
  <v-toolbar v-if="!isAuthRoute" color="white" elevation="2" app>
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

      <!-- Navigation Links (Desktop Only) -->
      <div class="nav-links d-none d-md-flex ml-4">
        <router-link 
          v-for="item in menuItems" 
          :key="item.title" 
          :to="item.to"
          class="nav-link"
        >
          {{ item.title }}
        </router-link>
      </div>

      <v-spacer></v-spacer>

      <!-- Desktop Actions -->
      <div class="d-none d-md-flex align-center">
        <!-- Cart Button -->
        <v-btn
          icon
          variant="text"
          to="/cart"
          class="mr-2"
        >
          <v-badge
            :content="cartItemsCount"
            :model-value="cartItemsCount > 0"
            color="primary"
          >
            <v-icon>mdi-cart</v-icon>
          </v-badge>
        </v-btn>

        <!-- Authentication Actions -->
        <template v-if="isLoggedIn">
          <!-- Notifications Button -->
          <v-btn
            icon
            variant="text"
            class="mr-2"
            @click="toggleNotifications"
          >
            <v-badge
              :content="unreadNotificationsCount"
              :model-value="unreadNotificationsCount > 0"
              color="error"
            >
              <v-icon>mdi-bell</v-icon>
            </v-badge>
          </v-btn>

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
              <v-list-item to="/profile" prepend-icon="mdi-account">
                <v-list-item-title>Profile</v-list-item-title>
              </v-list-item>
              <v-list-item to="/orders" prepend-icon="mdi-package">
                <v-list-item-title>My Orders</v-list-item-title>
              </v-list-item>
              <v-divider></v-divider>
              <v-list-item @click="handleLogout" prepend-icon="mdi-logout">
                <v-list-item-title>Logout</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>

        <template v-else>
          <v-btn 
            to="/login" 
            variant="text" 
            class="mr-2"
            prepend-icon="mdi-login"
          >
            Login
          </v-btn>
          <v-btn 
            to="/register" 
            color="primary"
            prepend-icon="mdi-account-plus"
          >
            Register
          </v-btn>
        </template>
      </div>

      <!-- Mobile Actions -->
      <div class="d-flex d-md-none align-center">
        <!-- Mobile Cart Button -->
        <v-btn
          icon
          variant="text"
          to="/cart"
          class="mr-2"
        >
          <v-badge
            :content="cartItemsCount"
            :model-value="cartItemsCount > 0"
            color="primary"
          >
            <v-icon>mdi-cart</v-icon>
          </v-badge>
        </v-btn>

        <!-- Mobile Menu Button -->
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      </div>
    </v-container>
  </v-toolbar>

  <!-- Mobile Navigation Drawer -->
  <v-navigation-drawer
    v-model="drawer"
    temporary
    location="right"
  >
    <v-list>
      <v-list-item
        v-if="isLoggedIn"
        :prepend-avatar="user?.avatar || '/images/default-avatar.png'"
        :title="getUserDisplayName"
        :subtitle="user?.email"
      ></v-list-item>

      <v-divider v-if="isLoggedIn" class="mb-2"></v-divider>

      <v-list-item
        v-for="item in menuItems"
        :key="item.title"
        :to="item.to"
        :title="item.title"
        @click="drawer = false"
      ></v-list-item>

      <v-divider class="my-2"></v-divider>

      <template v-if="isLoggedIn">
        <v-list-item
          to="/profile"
          prepend-icon="mdi-account"
          title="Profile"
          @click="drawer = false"
        ></v-list-item>
        <v-list-item
          to="/orders"
          prepend-icon="mdi-package"
          title="My Orders"
          @click="drawer = false"
        ></v-list-item>
        <v-list-item
          to="/cart"
          prepend-icon="mdi-cart"
          title="Cart"
          @click="drawer = false"
        >
          <template v-slot:append>
            <v-badge
              :content="cartItemsCount"
              :model-value="cartItemsCount > 0"
              color="primary"
            ></v-badge>
          </template>
        </v-list-item>
        <v-list-item
          prepend-icon="mdi-bell"
          title="Notifications"
          @click="toggleNotifications"
        >
          <template v-slot:append>
            <v-badge
              :content="unreadNotificationsCount"
              :model-value="unreadNotificationsCount > 0"
              color="error"
            ></v-badge>
          </template>
        </v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item
          prepend-icon="mdi-logout"
          title="Logout"
          @click="handleLogout"
        ></v-list-item>
      </template>

      <template v-else>
        <v-list-item
          to="/login"
          prepend-icon="mdi-login"
          title="Login"
          @click="drawer = false"
        ></v-list-item>
        <v-list-item
          to="/register"
          prepend-icon="mdi-account-plus"
          title="Register"
          @click="drawer = false"
        ></v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { useNotificationStore } from '@/stores/notifications'

export default {
  name: 'AppHeader',
  emits: ['toggle-drawer'],

  setup() {
    const router = useRouter()
    const route = useRoute()
    const authStore = useAuthStore()
    const cartStore = useCartStore()
    const notificationStore = useNotificationStore()

    // State
    const showNotifications = ref(false)
    const drawer = ref(false)

    // Computed properties
    const isLoggedIn = computed(() => authStore.isLoggedIn)
    const user = computed(() => authStore.user)
    const cartItemsCount = computed(() => cartStore.totalItems)
    const unreadNotificationsCount = computed(() => notificationStore.unreadCount)
    
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

    const userInitials = computed(() => {
      if (!user.value) return ''
      if (user.value.firstName && user.value.lastName) {
        return `${user.value.firstName[0]}${user.value.lastName[0]}`.toUpperCase()
      }
      return user.value.email && user.value.email.length > 0 ? user.value.email[0].toUpperCase() : ''
    })

    // Navigation menu items
    const menuItems = [
      { title: 'Home', to: '/' },
      { title: 'Restaurants', to: '/restaurants' },
      { title: 'Dishes', to: '/foods' },
      { title: 'Deals', to: '/promotions' },
      { title: 'About Us', to: '/about' }
    ]

    // Methods
    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value
      notificationStore.markAsRead()
    }

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
      userInitials,
      cartItemsCount,
      unreadNotificationsCount,
      showNotifications,
      toggleNotifications,
      handleLogout,
      isAuthRoute,
      drawer
    }
  }
}
</script>

<style scoped>
.v-toolbar {
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
  z-index: 1000;
}

/* Add spacing below the fixed navbar */
.v-toolbar + * {
  padding-top: 64px; /* Height of the navbar */
}

/* Responsive Styles */
@media (max-width: 600px) {
  .v-toolbar {
    padding-left: 8px;
    padding-right: 8px;
  }
  
  .v-toolbar + * {
    padding-top: 56px; /* Height of the navbar on mobile */
  }
}

/* Ensure proper spacing between elements */
.v-toolbar :deep(.v-btn) {
  margin-left: 4px;
  margin-right: 4px;
}

.d-flex.align-center {
  gap: 8px;
}

/* Navigation Links */
.nav-links {
  display: flex;
  align-items: center;
}

.nav-link {
  text-decoration: none;
  color: inherit;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.nav-link:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
