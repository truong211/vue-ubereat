<template>
  <v-app>
    <v-navigation-drawer
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
      class="admin-drawer"
    >
      <v-list-item
        prepend-avatar="/img/logo.png"
        title="Admin Dashboard"
      >
        <template v-slot:append>
          <v-btn
            variant="text"
            icon="mdi-chevron-left"
            @click.stop="rail = !rail"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

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
              dot
            ></v-badge>
          </template>
        </v-list-item>

        <v-list-group value="system">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-monitor-dashboard"
              title="System"
            ></v-list-item>
          </template>

          <v-list-item
            to="/admin/system"
            prepend-icon="mdi-chart-areaspline"
            title="Monitoring"
          ></v-list-item>
          
          <v-list-item
            to="/admin/system/logs"
            prepend-icon="mdi-text-box-search"
            title="Activity Logs"
          >
            <template v-slot:append>
              <v-badge
                :content="recentLogs"
                :color="'info'"
                v-if="recentLogs > 0"
              ></v-badge>
            </template>
          </v-list-item>

          <v-list-item
            to="/admin/system/performance"
            prepend-icon="mdi-speedometer"
            title="Performance"
          ></v-list-item>
        </v-list-group>
      </v-list>

      <template v-slot:append>
        <v-list>
          <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
            to="/admin/settings"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            @click="logout"
          ></v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar elevation="1">
      <v-app-bar-nav-icon @click.stop="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>{{ currentPage }}</v-toolbar-title>
      <v-spacer></v-spacer>

      <v-btn icon @click="showNotifications">
        <v-badge
          :content="notificationCount"
          :color="'error'"
          v-if="notificationCount > 0"
        >
          <v-icon>mdi-bell</v-icon>
        </v-badge>
        <v-icon v-else>mdi-bell</v-icon>
      </v-btn>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar size="32">
              <v-img :src="userAvatar" alt="Avatar"></v-img>
            </v-avatar>
          </v-btn>
        </template>
        <v-list>
          <v-list-item
            title="Profile"
            prepend-icon="mdi-account"
            @click="goToProfile"
          ></v-list-item>
          <v-list-item
            title="Logout"
            prepend-icon="mdi-logout"
            @click="logout"
          ></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <router-view></router-view>
    </v-main>

    <!-- Notifications Dialog -->
    <v-dialog v-model="notificationsDialog" max-width="400">
      <v-card>
        <v-card-title class="d-flex align-center">
          Notifications
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            icon="mdi-close"
            @click="notificationsDialog = false"
          ></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-0">
          <v-list lines="two">
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              :subtitle="notification.message"
              :prepend-icon="getNotificationIcon(notification.type)"
            >
              <template v-slot:append>
                <v-btn
                  icon="mdi-close"
                  variant="text"
                  size="small"
                  @click="dismissNotification(notification.id)"
                ></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="markAllAsRead"
          >
            Mark All as Read
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'

export default {
  name: 'AdminLayout',

  setup() {
    const store = useStore()
    const router = useRouter()
    const drawer = ref(true)
    const rail = ref(false)
    const notificationsDialog = ref(false)
    const recentLogs = ref(0)

    const userAvatar = computed(() => store.state.auth.user?.avatar || '/img/default-avatar.png')
    const notifications = computed(() => store.state.admin.notifications)
    const notificationCount = computed(() => notifications.value.filter(n => !n.read).length)
    const currentPage = computed(() => router.currentRoute.value.meta.title || 'Admin Dashboard')

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
        badge: computed(() => store.state.admin.pendingRestaurants)
      },
      {
        title: 'Users',
        icon: 'mdi-account-group',
        to: '/admin/users'
      },
      {
        title: 'Orders',
        icon: 'mdi-receipt',
        to: '/admin/orders'
      },
      {
        title: 'Content',
        icon: 'mdi-file-document-multiple',
        to: '/admin/content'
      },
      {
        title: 'Marketing',
        icon: 'mdi-bullhorn',
        to: '/admin/marketing'
      },
      {
        title: 'Reports',
        icon: 'mdi-chart-box',
        to: '/admin/reports'
      }
    ]

    const showNotifications = () => {
      notificationsDialog.value = true
    }

    const dismissNotification = (id) => {
      store.dispatch('admin/dismissNotification', id)
    }

    const markAllAsRead = () => {
      store.dispatch('admin/markAllNotificationsAsRead')
      notificationsDialog.value = false
    }

    const getNotificationIcon = (type) => {
      const icons = {
        error: 'mdi-alert-circle',
        warning: 'mdi-alert',
        success: 'mdi-check-circle',
        info: 'mdi-information'
      }
      return icons[type] || 'mdi-bell'
    }

    const logout = async () => {
      await store.dispatch('auth/logout')
      router.push('/login')
    }

    const goToProfile = () => {
      router.push('/admin/profile')
    }

    // Fetch recent activity logs count
    const fetchRecentLogs = async () => {
      try {
        const response = await store.dispatch('admin/getRecentLogsCount')
        recentLogs.value = response
      } catch (error) {
        console.error('Error fetching recent logs:', error)
      }
    }

    onMounted(() => {
      // Initialize websocket connection for real-time updates
      store.dispatch('admin/initWebSocket')
      
      // Fetch initial data
      fetchRecentLogs()
      
      // Set up periodic polling for logs
      setInterval(fetchRecentLogs, 60000) // Check every minute
    })

    return {
      drawer,
      rail,
      menuItems,
      notifications,
      notificationCount,
      notificationsDialog,
      recentLogs,
      currentPage,
      userAvatar,
      showNotifications,
      dismissNotification,
      markAllAsRead,
      getNotificationIcon,
      logout,
      goToProfile
    }
  }
}
</script>

<style scoped>
.admin-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.v-navigation-drawer--rail :deep(.v-list-item) {
  .v-list-item-title {
    opacity: 0;
  }
}
</style>
