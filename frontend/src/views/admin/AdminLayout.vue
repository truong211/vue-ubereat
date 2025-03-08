<template>
  <div class="admin-layout">
    <!-- App Bar -->
    <v-app-bar color="primary" elevation="2">
      <v-app-bar-nav-icon @click="drawer = !drawer" color="white"></v-app-bar-nav-icon>
      <v-app-bar-title class="text-white">Admin Dashboard</v-app-bar-title>
      <v-spacer></v-spacer>
      
      <!-- Notifications -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-badge
              :content="notifications.length"
              :model-value="notifications.length > 0"
              color="error"
            >
              <v-icon color="white">mdi-bell</v-icon>
            </v-badge>
          </v-btn>
        </template>
        <v-card min-width="300" max-width="400">
          <v-list>
            <v-list-subheader>Notifications</v-list-subheader>
            <v-list-item
              v-for="(notification, index) in notifications"
              :key="index"
              :value="notification"
              class="py-3"
            >
              <template v-slot:prepend>
                <v-avatar :color="notification.color" size="36">
                  <v-icon dark>{{ notification.icon }}</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>{{ notification.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>
              <template v-slot:append>
                <div class="text-caption text-medium-emphasis">{{ formatNotificationTime(notification.time) }}</div>
              </template>
            </v-list-item>
            
            <v-divider></v-divider>
            
            <v-list-item
              v-if="notifications.length > 0"
              @click="clearNotifications"
              class="text-center"
              color="primary"
            >
              <v-list-item-title>Clear All</v-list-item-title>
            </v-list-item>
            
            <v-list-item v-else>
              <v-list-item-title class="text-center text-medium-emphasis">No new notifications</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
      
      <!-- Admin profile -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn class="ml-2" v-bind="props">
            <v-avatar size="32" class="mr-2">
              <v-img
                v-if="admin.avatar"
                :src="admin.avatar"
                alt="Admin"
              ></v-img>
              <v-icon v-else color="white">mdi-account</v-icon>
            </v-avatar>
            <span class="text-white d-none d-sm-inline">{{ admin.name }}</span>
            <v-icon color="white">mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        <v-card min-width="200">
          <v-list>
            <v-list-item
              prepend-icon="mdi-account-outline"
              title="My Profile"
              @click="goToProfile"
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-cog-outline"
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
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer v-model="drawer" app class="admin-drawer">
      <v-list-item class="pa-4">
        <template v-slot:prepend>
          <v-avatar size="40">
            <v-img src="/images/logo.png" alt="Logo"></v-img>
          </v-avatar>
        </template>
        <v-list-item-title class="text-h6">Uber Eats</v-list-item-title>
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
          :active="isActive(item.to)"
        >
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
      
      <template v-slot:append>
        <div class="pa-4">
          <v-btn block color="primary" @click="goToFrontend">
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
  </div>
</template>

<script>
export default {
  name: 'AdminLayout',
  data() {
    return {
      drawer: true,
      admin: {
        name: 'Admin User',
        avatar: null
      },
      menuItems: [
        { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/admin' },
        { title: 'Restaurants', icon: 'mdi-store', to: '/admin/restaurants' },
        { title: 'Users', icon: 'mdi-account-group', to: '/admin/users' },
        { title: 'Drivers', icon: 'mdi-account-hard-hat', to: '/admin/drivers' },
        { title: 'Orders', icon: 'mdi-receipt', to: '/admin/orders' },
        { title: 'Categories', icon: 'mdi-shape', to: '/admin/categories' },
        { title: 'Promotions', icon: 'mdi-tag-multiple', to: '/admin/promotions' },
        { title: 'Reports', icon: 'mdi-chart-bar', to: '/admin/reports' },
        { title: 'Settings', icon: 'mdi-cog', to: '/admin/settings' }
      ],
      notifications: [
        {
          title: 'New Order',
          message: 'Order #12345 has been placed',
          time: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
          color: 'success',
          icon: 'mdi-food'
        },
        {
          title: 'New Restaurant',
          message: 'Pizza Hut has registered',
          time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          color: 'primary',
          icon: 'mdi-store'
        },
        {
          title: 'Driver Report',
          message: 'Customer complained about delivery',
          time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          color: 'warning',
          icon: 'mdi-alert'
        }
      ]
    };
  },
  methods: {
    isActive(path) {
      return this.$route.path === path || this.$route.path.startsWith(path + '/');
    },
    
    formatNotificationTime(time) {
      const now = new Date();
      const diffMs = now - new Date(time);
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 0) {
        return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
      } else if (diffHour > 0) {
        return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffMin > 0) {
        return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
      } else {
        return 'Just now';
      }
    },
    
    clearNotifications() {
      this.notifications = [];
    },
    
    goToProfile() {
      // Navigate to admin profile
      this.$router.push('/admin/profile');
    },
    
    goToSettings() {
      // Navigate to admin settings
      this.$router.push('/admin/settings');
    },
    
    goToFrontend() {
      // Navigate to frontend website
      this.$router.push('/');
    },
    
    logout() {
      // In a real app, this would call an API to logout and clear session
      this.$router.push('/auth/login');
    }
  }
};
</script>

<style scoped>
.admin-drawer {
  background-color: #f5f5f5;
}
</style>
