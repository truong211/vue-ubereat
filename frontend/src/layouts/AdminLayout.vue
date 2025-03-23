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
        <v-list-item
          v-for="(item, index) in menuItems"
          :key="index"
          :to="item.to"
          exact
        >
          <v-list-item-icon>
            <v-icon>{{ item.icon }}</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>{{ item.title }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-group
          v-for="(group, index) in menuItems.filter(item => item.items)"
          :key="index"
          :prepend-icon="group.icon"
          :value="false"
        >
          <template v-slot:activator>
            <v-list-item-title>{{ group.title }}</v-list-item-title>
          </template>

          <v-list-item
            v-for="(subItem, subIndex) in group.items"
            :key="subIndex"
            :to="subItem.to"
          >
            <v-list-item-icon>
              <v-icon>{{ subItem.icon }}</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ subItem.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-group>

        <v-list-group value="promotions">
          <template v-slot:activator="{ props }">
            <v-list-item
              v-bind="props"
              prepend-icon="mdi-tag-multiple"
              title="Promotions"
            ></v-list-item>
          </template>

          <v-list-item
            to="/admin/promotions"
            prepend-icon="mdi-ticket-percent"
            title="Manage Promotions"
          ></v-list-item>

          <v-list-item
            to="/admin/promotion-campaigns"
            prepend-icon="mdi-calendar-star"
            title="Campaigns"
          ></v-list-item>
        </v-list-group>
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
        to: '/admin/users?role=customer',
        icon: 'mdi-account'
      }
    ]
  },
  {
    title: 'Analytics',
    icon: 'mdi-chart-bar',
    to: '/admin/analytics',
    exact: true
  },
  // ...other menu items...
]

export default {
  name: 'AdminLayout',

  components: {
    NotificationCenter
  },

  data() {
    return {
      drawer: true,
      menuItems
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