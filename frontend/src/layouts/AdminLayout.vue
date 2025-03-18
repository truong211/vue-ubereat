<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar app color="primary" dark>
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-toolbar-title>Admin Dashboard</v-toolbar-title>
      <v-spacer></v-spacer>
      
      <!-- Notification Center -->
      <notification-center />
      
      <!-- User Menu -->
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            v-bind="attrs"
            v-on="on"
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
        <!-- Dashboard -->
        <v-list-item
          :to="{ name: 'AdminDashboard' }"
          exact
        >
          <v-list-item-icon>
            <v-icon>mdi-view-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Dashboard</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <!-- System Monitoring -->
        <v-list-item
          :to="{ name: 'SystemMonitoring' }"
          exact
        >
          <v-list-item-icon>
            <v-icon>mdi-monitor-dashboard</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>System Monitoring</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <!-- Restaurants -->
        <v-list-group
          prepend-icon="mdi-store"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>Restaurants</v-list-item-title>
          </template>

          <v-list-item :to="{ name: 'RestaurantList' }">
            <v-list-item-icon>
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>All Restaurants</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'PendingRestaurants' }">
            <v-list-item-icon>
              <v-icon>mdi-clock-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Pending Approval</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Users -->
        <v-list-group
          prepend-icon="mdi-account-group"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>Users</v-list-item-title>
          </template>

          <v-list-item :to="{ name: 'UserList' }">
            <v-list-item-icon>
              <v-icon>mdi-account-multiple</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>All Users</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'ReportedUsers' }">
            <v-list-item-icon>
              <v-icon>mdi-alert-circle</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Reported Users</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Orders -->
        <v-list-group
          prepend-icon="mdi-cart"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>Orders</v-list-item-title>
          </template>

          <v-list-item :to="{ name: 'OrderList' }">
            <v-list-item-icon>
              <v-icon>mdi-format-list-bulleted</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>All Orders</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'DisputedOrders' }">
            <v-list-item-icon>
              <v-icon>mdi-alert</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Disputed Orders</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Content -->
        <v-list-group
          prepend-icon="mdi-text-box"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>Content</v-list-item-title>
          </template>

          <v-list-item :to="{ name: 'Banners' }">
            <v-list-item-icon>
              <v-icon>mdi-image</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Banners</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'StaticPages' }">
            <v-list-item-icon>
              <v-icon>mdi-file-document</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Static Pages</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <!-- Settings -->
        <v-list-item :to="{ name: 'Settings' }">
          <v-list-item-icon>
            <v-icon>mdi-cog</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <router-view></router-view>
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
import { mapState } from 'vuex';
import NotificationCenter from '@/components/admin/NotificationCenter.vue';

export default {
  name: 'AdminLayout',

  components: {
    NotificationCenter
  },

  data() {
    return {
      drawer: true
    };
  },

  computed: {
    ...mapState('ui', ['snackbar'])
  },

  methods: {
    async logout() {
      await this.$store.dispatch('auth/logout');
      this.$router.push({ name: 'Login' });
    }
  },

  mounted() {
    // Initialize WebSocket connection for real-time updates
    this.$store.dispatch('admin/initWebSocket');
  }
};
</script>

<style scoped>
.v-main {
  background-color: #f5f5f5;
}
</style>