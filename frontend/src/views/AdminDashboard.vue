<template>
  <div class="admin-dashboard">
    <v-app>
      <!-- Admin Navigation Drawer -->
      <v-navigation-drawer
        v-model="drawer"
        :rail="rail"
        permanent
        @click="rail = false"
        :width="280"
        class="admin-drawer"
      >
        <v-list-item
          prepend-avatar="/img/logo.png"
          title="UberEats Admin"
          nav
          @click="goToDashboard"
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

        <v-list density="compact" nav>
          <v-list-item
            v-for="(item, i) in menuItems"
            :key="i"
            :value="item.value"
            :prepend-icon="item.icon"
            :title="item.title"
            :to="item.to"
            :active="currentPath === item.to"
            @click="currentPath = item.to"
          ></v-list-item>
        </v-list>

        <template v-slot:append>
          <v-divider></v-divider>
          <div class="pa-2">
            <v-btn
              block
              variant="tonal"
              color="error"
              @click="logout"
              prepend-icon="mdi-logout"
            >
              Logout
            </v-btn>
          </div>
        </template>
      </v-navigation-drawer>

      <!-- Main Content -->
      <v-main>
        <v-app-bar color="primary" density="compact">
          <v-app-bar-nav-icon @click.stop="drawer = !drawer" class="d-md-none"></v-app-bar-nav-icon>
          <v-toolbar-title>{{ pageTitle }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-bell" @click="showNotifications">
            <v-badge color="error" :content="notifications.length" :model-value="notifications.length > 0"></v-badge>
          </v-btn>
          <v-menu>
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-account-circle" v-bind="props"></v-btn>
            </template>
            <v-list>
              <v-list-item title="Profile" prepend-icon="mdi-account" @click="goToProfile"></v-list-item>
              <v-list-item title="Settings" prepend-icon="mdi-cog" @click="goToSettings"></v-list-item>
              <v-divider></v-divider>
              <v-list-item title="Logout" prepend-icon="mdi-logout" @click="logout"></v-list-item>
            </v-list>
          </v-menu>
        </v-app-bar>

        <v-container fluid class="py-8">
          <router-view></router-view>
        </v-container>
      </v-main>

      <!-- Notifications Menu -->
      <v-dialog v-model="notificationsDialog" max-width="400">
        <v-card>
          <v-card-title>
            Notifications
            <v-spacer></v-spacer>
            <v-btn icon="mdi-close" variant="text" @click="notificationsDialog = false"></v-btn>
          </v-card-title>
          <v-divider></v-divider>
          <v-list v-if="notifications.length > 0">
            <v-list-item
              v-for="(notification, index) in notifications"
              :key="index"
              :title="notification.title"
              :subtitle="notification.message"
              lines="two"
            >
              <template v-slot:prepend>
                <v-avatar :color="getNotificationColor(notification.type)" size="36">
                  <v-icon :icon="getNotificationIcon(notification.type)" color="white"></v-icon>
                </v-avatar>
              </template>
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
          <v-card-text v-else class="text-center py-4">
            <v-icon icon="mdi-bell-off" size="64" color="grey-lighten-1" class="mb-3"></v-icon>
            <p>No new notifications</p>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              color="primary"
              @click="dismissAllNotifications"
              :disabled="notifications.length === 0"
            >
              Clear All
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-app>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useStore } from 'vuex';

export default {
  name: 'AdminDashboard',
  
  setup() {
    const router = useRouter();
    const route = useRoute();
    const store = useStore();
    
    // Navigation drawer state
    const drawer = ref(true);
    const rail = ref(false);
    const currentPath = ref(route.path);
    
    // Notifications
    const notifications = ref([]);
    const notificationsDialog = ref(false);
    
    const menuItems = [
      { title: 'Dashboard', icon: 'mdi-view-dashboard', value: 'dashboard', to: '/admin/dashboard' },
      { title: 'User Management', icon: 'mdi-account-group', value: 'users', to: '/admin/users' },
      { title: 'Restaurant Management', icon: 'mdi-store', value: 'restaurants', to: '/admin/restaurants' },
      { title: 'Restaurant Approval', icon: 'mdi-checkbox-marked-circle', value: 'approval', to: '/admin/restaurant-approval' },
      { title: 'Orders', icon: 'mdi-receipt', value: 'orders', to: '/admin/orders' },
      { title: 'Analytics', icon: 'mdi-chart-bar', value: 'analytics', to: '/admin/analytics' },
      { title: 'Content Management', icon: 'mdi-file-document-edit', value: 'content', to: '/admin/content' },
      { title: 'Promotions', icon: 'mdi-tag-multiple', value: 'promotions', to: '/admin/promotions' },
      { title: 'Settings', icon: 'mdi-cog', value: 'settings', to: '/admin/settings' },
    ];
    
    const pageTitle = computed(() => {
      const currentItem = menuItems.find(item => item.to === currentPath.value);
      return currentItem ? currentItem.title : 'Admin Dashboard';
    });
    
    // Watch for route changes to update currentPath
    watch(
      () => route.path,
      (newPath) => {
        currentPath.value = newPath;
      }
    );
    
    const fetchAdminNotifications = async () => {
      try {
        const response = await store.dispatch('admin/fetchNotifications');
        notifications.value = response.data || [];
      } catch (error) {
        console.error('Failed to fetch admin notifications:', error);
      }
    };
    
    const dismissNotification = async (id) => {
      try {
        await store.dispatch('admin/dismissNotification', id);
        notifications.value = notifications.value.filter(n => n.id !== id);
      } catch (error) {
        console.error('Failed to dismiss notification:', error);
      }
    };
    
    const dismissAllNotifications = async () => {
      try {
        await store.dispatch('admin/dismissAllNotifications');
        notifications.value = [];
        notificationsDialog.value = false;
      } catch (error) {
        console.error('Failed to dismiss all notifications:', error);
      }
    };
    
    const showNotifications = () => {
      notificationsDialog.value = true;
    };
    
    const getNotificationColor = (type) => {
      switch (type) {
        case 'error': return 'error';
        case 'warning': return 'warning';
        case 'success': return 'success';
        default: return 'primary';
      }
    };
    
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'error': return 'mdi-alert-circle';
        case 'warning': return 'mdi-alert';
        case 'success': return 'mdi-check-circle';
        default: return 'mdi-bell';
      }
    };
    
    const goToDashboard = () => {
      router.push('/admin/dashboard');
    };
    
    const goToProfile = () => {
      router.push('/admin/profile');
    };
    
    const goToSettings = () => {
      router.push('/admin/settings');
    };
    
    const logout = async () => {
      try {
        await store.dispatch('auth/logout');
        router.push('/login');
      } catch (error) {
        console.error('Logout failed:', error);
      }
    };
    
    onMounted(() => {
      fetchAdminNotifications();
      
      // Check if user has admin role, otherwise redirect
      const user = store.state.auth.user;
      if (!user || user.role !== 'admin') {
        router.push('/login');
      }
    });
    
    return {
      drawer,
      rail,
      currentPath,
      menuItems,
      pageTitle,
      notifications,
      notificationsDialog,
      showNotifications,
      dismissNotification,
      dismissAllNotifications,
      getNotificationColor,
      getNotificationIcon,
      goToDashboard,
      goToProfile,
      goToSettings,
      logout
    };
  }
};
</script>

<style scoped>
.admin-dashboard {
  height: 100vh;
  width: 100%;
}

.admin-drawer {
  z-index: 1000;
}

@media (max-width: 960px) {
  .admin-drawer {
    z-index: 1001;
  }
}
</style>