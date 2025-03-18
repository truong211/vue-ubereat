<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar color="primary" app elevation="2">
      <v-app-bar-nav-icon @click="drawer = !drawer" color="white"></v-app-bar-nav-icon>
      <v-toolbar-title class="text-white">Admin Dashboard</v-toolbar-title>
      <v-spacer></v-spacer>
      
      <!-- Notifications -->
      <v-menu location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-badge
              :content="unreadNotifications.length.toString()"
              :model-value="unreadNotifications.length > 0"
              color="error"
            >
              <v-icon color="white">mdi-bell</v-icon>
            </v-badge>
          </v-btn>
        </template>

        <v-list width="400">
          <v-list-subheader>
            Notifications
            <v-spacer></v-spacer>
            <v-btn
              v-if="unreadNotifications.length"
              variant="text"
              size="small"
              @click="markAllAsRead"
            >
              Mark all as read
            </v-btn>
          </v-list-subheader>

          <v-list-item
            v-for="notification in notifications"
            :key="notification.id"
            :class="{ 'unread': !notification.read }"
          >
            <template v-slot:prepend>
              <v-avatar :color="notification.color" size="36">
                <v-icon color="white">{{ notification.icon }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title>{{ notification.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>
            <v-list-item-subtitle class="text-caption">
              {{ formatTime(notification.createdAt) }}
            </v-list-item-subtitle>
          </v-list-item>

          <v-divider v-if="notifications.length"></v-divider>
          
          <v-list-item v-if="!notifications.length">
            <v-list-item-subtitle class="text-center">
              No new notifications
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Admin Profile -->
      <v-menu location="bottom end">
        <template v-slot:activator="{ props }">
          <v-btn v-bind="props" class="ml-2">
            <v-avatar size="32" class="mr-2">
              <v-img v-if="user.avatar" :src="user.avatar"></v-img>
              <span v-else class="text-h6">{{ user.initials }}</span>
            </v-avatar>
            <span class="text-white d-none d-sm-inline">{{ user.name }}</span>
            <v-icon color="white">mdi-chevron-down</v-icon>
          </v-btn>
        </template>

        <v-list>
          <v-list-item
            prepend-icon="mdi-account"
            title="Profile"
            @click="goToProfile"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
            @click="goToSettings"
          ></v-list-item>
          <v-divider></v-divider>
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            @click="logout"
          ></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" app>
      <!-- App Logo -->
      <v-list-item class="pa-4">
        <template v-slot:prepend>
          <v-avatar size="40">
            <v-img src="/images/logo.png" alt="Logo"></v-img>
          </v-avatar>
        </template>
        <v-list-item-title class="text-h6">UberEat</v-list-item-title>
        <v-list-item-subtitle>Admin Panel</v-list-item-subtitle>
      </v-list-item>

      <v-divider></v-divider>

      <!-- Navigation Menu -->
      <v-list nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
        >
          <template v-slot:append v-if="item.badge">
            <v-badge
              :content="item.badge"
              :color="item.badgeColor || 'error'"
              floating
            ></v-badge>
          </template>
        </v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-4">
          <v-btn
            block
            color="primary"
            prepend-icon="mdi-home"
            @click="goToFrontend"
          >
            View Website
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="pa-6">
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import WebSocketService from '@/services/websocket.service'

export default {
  name: 'AdminLayout',

  setup() {
    const store = useStore()
    const router = useRouter()
    const drawer = ref(true)

    // User data
    const user = computed(() => store.state.auth.user)

    // Navigation menu
    const menuItems = [
      {
        title: 'Dashboard',
        icon: 'mdi-view-dashboard',
        to: '/admin/dashboard'
      },
      {
        title: 'Restaurants',
        icon: 'mdi-store',
        to: '/admin/restaurants',
        badge: computed(() => store.state.admin.pendingRestaurants),
        badgeColor: 'warning'
      },
      {
        title: 'Users',
        icon: 'mdi-account-group',
        to: '/admin/users'
      },
      {
        title: 'Drivers',
        icon: 'mdi-bike',
        to: '/admin/drivers'
      },
      {
        title: 'Orders',
        icon: 'mdi-receipt',
        to: '/admin/orders'
      },
      {
        title: 'Categories',
        icon: 'mdi-shape',
        to: '/admin/categories'
      },
      {
        title: 'Content',
        icon: 'mdi-file-document-multiple',
        to: '/admin/content'
      },
      {
        title: 'Promotions',
        icon: 'mdi-ticket-percent',
        to: '/admin/promotions'
      },
      {
        title: 'Reports',
        icon: 'mdi-chart-bar',
        to: '/admin/reports'
      },
      {
        title: 'Settings',
        icon: 'mdi-cog',
        to: '/admin/settings'
      }
    ]

    // Notifications
    const notifications = computed(() => store.state.admin.notifications)
    const unreadNotifications = computed(() => 
      notifications.value.filter(n => !n.read)
    )

    // Actions
    const markAllAsRead = () => {
      store.dispatch('admin/markNotificationsAsRead')
    }

    const goToProfile = () => {
      router.push('/admin/profile')
    }

    const goToSettings = () => {
      router.push('/admin/settings')
    }

    const goToFrontend = () => {
      router.push('/')
    }

    const logout = async () => {
      await store.dispatch('auth/logout')
      router.push('/login')
    }

    const formatTime = (date) => {
      const now = new Date()
      const diff = now - new Date(date)
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(minutes / 60)
      const days = Math.floor(hours / 24)

      if (days > 0) {
        return `${days}d ago`
      } else if (hours > 0) {
        return `${hours}h ago`
      } else if (minutes > 0) {
        return `${minutes}m ago`
      } else {
        return 'Just now'
      }
    }

    // Initialize WebSocket connection
    onMounted(() => {
      WebSocketService.connect()
      store.dispatch('admin/fetchDashboardData')
    })

    // Cleanup WebSocket connection
    onUnmounted(() => {
      WebSocketService.disconnect()
    })

    return {
      drawer,
      user,
      menuItems,
      notifications,
      unreadNotifications,
      markAllAsRead,
      goToProfile,
      goToSettings,
      goToFrontend,
      logout,
      formatTime
    }
  }
}
</script>

<style scoped>
.unread {
  background-color: var(--v-primary-lighten5);
}

.v-list-item.unread:hover {
  background-color: var(--v-primary-lighten4);
}
</style>
