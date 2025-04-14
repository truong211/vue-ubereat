<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Admin Dashboard</v-toolbar-title>
      <v-spacer></v-spacer>

      <!-- Notification Center -->
      <notification-center />
      <!-- Error handling is now managed via Vuex state and globalError -->

      <!-- User Menu -->
      <v-menu offset-y>
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="props"
          >
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
        </template>
        <v-list>
          <v-list-item @click="logout">
            <v-list-item-icon>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-title>Logout</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      app
      clipped
    >
      <v-list>
        <!-- Single menu items -->
        <v-list-item
          v-for="(item, index) in menuItems.filter(item => !item.items)"
          :key="index"
          :to="item.to"
          exact
        >
          <template v-slot:prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>

          <div class="d-flex align-center">
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </div>
        </v-list-item>

        <!-- Menu groups with sub-items -->
        <v-list-group
          v-for="(group, index) in menuItems.filter(item => item.items)"
          :key="'group-' + index"
          :value="false"
        >
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <v-icon>{{ group.icon }}</v-icon>
              </template>

              <div class="d-flex align-center">
                <v-list-item-title>{{ group.title }}</v-list-item-title>
              </div>
            </v-list-item>
          </template>

          <v-list-item
            v-for="(subItem, subIndex) in group.items"
            :key="'subitem-' + subIndex"
            :to="subItem.to"
          >
            <template v-slot:prepend>
              <v-icon>{{ subItem.icon }}</v-icon>
            </template>

            <div class="d-flex align-center">
              <v-list-item-title>{{ subItem.title }}</v-list-item-title>
            </div>
          </v-list-item>
        </v-list-group>

        <!-- Hardcoded Promotions group -->
        <v-list-group value="promotions">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <v-icon>mdi-tag-multiple</v-icon>
              </template>

              <div class="d-flex align-center">
                <v-list-item-title>Promotions</v-list-item-title>
              </div>
            </v-list-item>
          </template>

          <v-list-item
            to="/admin/promotions"
          >
            <template v-slot:prepend>
              <v-icon>mdi-ticket-percent</v-icon>
            </template>

            <div class="d-flex align-center">
              <v-list-item-title>Manage Promotions</v-list-item-title>
            </div>
          </v-list-item>

          <v-list-item
            to="/admin/promotion-campaigns"
          >
            <template v-slot:prepend>
              <v-icon>mdi-calendar-star</v-icon>
            </template>

            <div class="d-flex align-center">
              <v-list-item-title>Campaigns</v-list-item-title>
            </div>
          </v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid>
        <v-row v-if="globalError">
          <v-col cols="12">
            <v-alert
              type="warning"
              variant="tonal"
              dismissible
              @click:close="globalError = null"
            >
              {{ globalError }}
            </v-alert>
          </v-col>
        </v-row>
        <router-view @error="setGlobalError"></router-view>
      </v-container>
    </v-main>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.text }}
      <template v-slot:action="{ attrs }">
        <v-btn
          text
          v-bind="attrs"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import { defineComponent } from 'vue';
import { useUiStore } from '@/stores/ui';
import { useNotificationsStore } from '@/stores/notifications';
import { useAuthStore } from '@/stores/auth';
import NotificationCenter from '@/components/admin/NotificationCenter.vue';
// Note: Using admin-specific NotificationCenter

const menuItems = [
  {
    title: 'Dashboard',
    icon: 'mdi-view-dashboard',
    to: '/admin/dashboard'
  },
  {
    title: 'User Management',
    icon: 'mdi-account-group',
    items: [
      {
        title: 'All Users',
        to: '/admin/users',
        icon: 'mdi-account-multiple'
      },
      {
        title: 'Restaurants',
        to: '/admin/users?role=restaurant',
        icon: 'mdi-store'
      },
      {
        title: 'Drivers',
        to: '/admin/users?role=driver',
        icon: 'mdi-truck-delivery'
      },
      {
        title: 'Customers',
        to: '/admin/customer-accounts',
        icon: 'mdi-account'
      },
      {
        title: 'Staff Permissions',
        to: '/admin/staff-management',
        icon: 'mdi-shield-account'
      }
    ]
  },
  {
    title: 'Restaurant Management',
    icon: 'mdi-store',
    items: [
      {
        title: 'All Restaurants',
        to: '/admin/restaurants',
        icon: 'mdi-store-outline'
      },
      {
        title: 'Pending Approvals',
        to: '/admin/restaurants/pending',
        icon: 'mdi-clock-outline'
      }
    ]
  },
  {
    title: 'Menu Management',
    icon: 'mdi-food-fork-drink',
    items: [
      {
        title: 'Products',
        to: '/admin/products',
        icon: 'mdi-food-apple'
      },
      {
        title: 'Categories',
        to: '/admin/categories',
        icon: 'mdi-shape'
      }
    ]
  },
  {
    title: 'Order Management',
    icon: 'mdi-clipboard-list',
    to: '/admin/orders'
  },
  {
    title: 'Delivery Management',
    icon: 'mdi-truck-delivery-outline',
    items: [
      {
        title: 'Delivery Settings',
        to: '/admin/delivery-settings',
        icon: 'mdi-map-marker-distance'
      },
      {
        title: 'Active Deliveries',
        to: '/admin/deliveries',
        icon: 'mdi-truck-fast'
      }
    ]
  },
  {
    title: 'Analytics',
    icon: 'mdi-chart-bar',
    to: '/admin/analytics',
    exact: true
  },
  {
    title: 'Customer Support',
    icon: 'mdi-headset',
    to: '/admin/support',
    exact: true
  },
  // ...other menu items...
]

export default defineComponent({ // Use defineComponent
  name: 'AdminLayout',

  components: {
    NotificationCenter
  },

  setup() {
    const uiStore = useUiStore();
    const notificationsStore = useNotificationsStore();
    const authStore = useAuthStore();
    return { uiStore, notificationsStore, authStore }; // Expose store instances
  },

  data() {
    return {
      drawer: true,
      menuItems,
      // showNotifications: true, // Removed - Notification center always shown
      globalError: null,
      // notificationRetries: 0, // Removed - Retry logic is in Vuex store
      disabledComponents: [] // Track components that have errors
    };
  },

  computed: {
    // Access state/getters from Pinia stores
    snackbar() {
      return this.uiStore.snackbar;
    },
    notificationError() {
      return this.notificationsStore.error; // Assuming 'error' getter/state
    },
    isNotificationsLoading() {
      return this.notificationsStore.isLoading; // Assuming 'isLoading' getter/state
    }
  },

  methods: {
    async logout() {
      try {
        await this.authStore.logout(); // Call action on authStore
        this.$router.push({ name: 'Login' });
      } catch (error) {
        console.error('Logout error:', error);
        this.setGlobalError('Logout failed. Please try again.');
      }
    },

    // Removed retryLoadNotifications - Handled by Vuex store action
    // Removed handleNotificationError - Error state is now watched

    setGlobalError(error) {
      if (!error) return;

      if (typeof error === 'string') {
        this.globalError = error;
      } else if (error && error.message) {
        this.globalError = error.message;
      } else {
        this.globalError = 'An unexpected error occurred';
      }

      // Auto-dismiss after 10 seconds
      setTimeout(() => {
        if (this.globalError) {
          this.globalError = null;
        }
      }, 10000);
    },

    // Safe initialization of WebSocket to prevent navigation issues
    initWebSocket() {
      try {
        // Try to use the useSocket composable if available
        import('@/composables/useSocket').then((module) => {
          const { useSocket } = module;
          const socket = useSocket();
          socket.connect();
        }).catch(err => {
          console.warn('WebSocket composable not available, skipping connection', err);
        });
      } catch (error) {
        console.error('Failed to initialize WebSocket (handled):', error);
        // Don't show global error as this is not critical
      }
    }
  },

  watch: {
    notificationError(newError) {
      if (newError) {
        // Display notification errors using the global error display
        this.setGlobalError(`Notifications Error: ${newError}`);
        // Clear the error in the store after displaying it
        // to prevent it showing again on next load if not cleared by a successful fetch
        this.notificationsStore.clearError(); // Assuming a 'clearError' action/mutation exists
      }
    }
  },

  mounted() {
    // Initialize WebSocket connection with delay to avoid competing with other init processes
    setTimeout(() => {
      this.initWebSocket();
    }, 1000);

    // Add navigation guard to prevent errors during navigation
    this.$router.beforeEach((to, from, next) => {
      // Clear any error states that might be present
      this.globalError = null;

      // If we're navigating away from admin area
      if (from.path.startsWith('/admin') && !to.path.startsWith('/admin')) {
        // No longer need to manage showNotifications state
        // this.showNotifications = false;
      }

      next();
    });
  },

  errorCaptured(err, vm, info) {
    // Handle errors in child components
    console.error('Error captured in AdminLayout:', err, info);

    // If the error is from NotificationCenter, log it but let the watcher handle UI
    if (vm.$options && (vm.$options.name === 'NotificationCenter' || vm.$options.name === 'AdminNotificationCenter')) { // Check both possible names
       console.error('Error originating from NotificationCenter:', err);
       // Don't set global error here directly, let the watcher handle store errors
       // this.showNotifications = false; // Removed
       return false; // Prevent error from propagating further
    }

    // Track which component had an error
    if (vm.$options && vm.$options.name) {
      if (!this.disabledComponents.includes(vm.$options.name)) {
        this.disabledComponents.push(vm.$options.name);
      }
    }

    // Generic error handling for other components
    this.setGlobalError(err.message || 'An unexpected error occurred');

    // Return false to stop error propagation which can cause UI issues
    return false;
  },

  // Safe cleanup when layout is destroyed
  beforeUnmount() {
    // Clear any pending timeouts
    if (this.globalErrorTimeout) {
      clearTimeout(this.globalErrorTimeout);
    }
  }
}); // Close defineComponent
</script>

<style scoped>
.v-main {
  background-color: #f5f5f5;
}

/* Navigation drawer styling */
.v-list-item {
  min-height: 48px;
  padding: 0 16px;
}

.v-list-item-title {
  font-size: 0.9375rem;
  font-weight: 500;
}

/* Ensure content properly aligned */
.v-list-item .d-flex.align-center {
  flex: 1;
  min-width: 0;
  padding: 8px 0;
}

/* List group styling */
.v-list-group__items .v-list-item {
  padding-left: 32px; /* Indent sub-items */
}

/* Active item styling */
.v-list-item--active {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.v-list-item--active .v-list-item-title {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.v-list-item--active .v-icon {
  color: rgb(var(--v-theme-primary));
}
</style>