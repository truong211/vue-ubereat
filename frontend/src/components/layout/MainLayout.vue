<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar
      color="white"
      elevation="1"
      class="px-2"
    >
      <v-container class="d-flex align-center py-0 px-2">
        <!-- Logo -->
        <router-link to="/" class="text-decoration-none d-flex align-center">
          <v-img
            src="/images/logo.png"
            alt="UberEat Logo"
            width="40"
            height="40"
            class="mr-2"
          ></v-img>
          <span class="text-h5 font-weight-bold primary--text">UberEat</span>
        </router-link>

        <!-- Quick Search Button -->
        <v-btn
          to="/search"
          icon
          variant="text"
          class="ml-4"
          title="Search"
        >
          <v-icon>mdi-magnify</v-icon>
        </v-btn>

        <v-spacer></v-spacer>

        <!-- Desktop Navigation -->
        <div class="d-none d-md-flex align-center">
          <v-btn
            v-for="item in navigationItems"
            :key="item.title"
            :to="item.to"
            variant="text"
            class="mx-1"
          >
            {{ item.title }}
          </v-btn>

          <v-divider vertical class="mx-4"></v-divider>

          <!-- Notifications Center (Desktop) -->
          <notification-center v-if="isLoggedIn" class="mr-2"></notification-center>

          <!-- Cart Button -->
          <v-btn
            to="/cart"
            icon
            variant="text"
            class="mr-2"
          >
            <v-badge
              :content="cartItemCount"
              :model-value="cartItemCount > 0"
              color="primary"
            >
              <v-icon>mdi-cart</v-icon>
            </v-badge>
          </v-btn>

          <!-- User Menu -->
          <div v-if="isLoggedIn">
            <v-menu
              v-model="userMenu"
              :close-on-content-click="false"
              location="bottom end"
              min-width="200"
            >
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="text"
                  class="ml-2"
                >
                  <v-avatar size="32" class="mr-2">
                    <v-img
                      :src="userAvatar || '/images/default-avatar.png'"
                      alt="User Avatar"
                    ></v-img>
                  </v-avatar>
                  <span class="d-none d-lg-inline">{{ userName }}</span>
                  <v-icon end>mdi-chevron-down</v-icon>
                </v-btn>
              </template>

              <v-card>
                <v-list>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-avatar size="40">
                        <v-img
                          :src="userAvatar || '/images/default-avatar.png'"
                          alt="User Avatar"
                        ></v-img>
                      </v-avatar>
                    </template>
                    <v-list-item-title>{{ userName }}</v-list-item-title>
                    <v-list-item-subtitle>{{ userEmail }}</v-list-item-subtitle>
                  </v-list-item>

                  <v-divider></v-divider>

                  <v-list-item
                    v-for="item in userMenuItems"
                    :key="item.title"
                    :to="item.to"
                    :prepend-icon="item.icon"
                    :title="item.title"
                    @click="userMenu = false"
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
          </div>

          <!-- Login/Register Buttons -->
          <div v-else class="d-flex">
            <v-btn
              to="/login"
              variant="text"
              class="mr-2"
            >
              Login
            </v-btn>
            <v-btn
              to="/register"
              color="primary"
            >
              Register
            </v-btn>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <v-btn
          icon
          variant="text"
          class="d-md-none"
          @click="drawer = !drawer"
        >
          <v-icon>mdi-menu</v-icon>
        </v-btn>
      </v-container>
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
      location="right"
    >
      <v-list>
        <v-list-item
          v-if="isLoggedIn"
          :prepend-avatar="userAvatar || '/images/default-avatar.png'"
          :title="userName"
          :subtitle="userEmail"
        ></v-list-item>

        <v-divider v-if="isLoggedIn" class="mb-2"></v-divider>

        <v-list-item
          v-for="item in navigationItems"
          :key="item.title"
          :to="item.to"
          :title="item.title"
          @click="drawer = false"
        ></v-list-item>

        <v-divider class="my-2"></v-divider>

        <v-list-item
          v-if="isLoggedIn"
          v-for="item in userMenuItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          @click="drawer = false"
        ></v-list-item>

        <template v-if="isLoggedIn">
          <v-divider class="my-2"></v-divider>
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            @click="logout"
          ></v-list-item>
        </template>

        <template v-else>
          <v-list-item
            to="/login"
            title="Login"
            prepend-icon="mdi-login"
            @click="drawer = false"
          ></v-list-item>
          <v-list-item
            to="/register"
            title="Register"
            prepend-icon="mdi-account-plus"
            @click="drawer = false"
          ></v-list-item>
        </template>

        <v-divider class="my-2"></v-divider>

        <!-- Notifications (Mobile) -->
        <v-list-item
          v-if="isLoggedIn"
          to="/profile/notifications"
          title="Notifications"
          prepend-icon="mdi-bell-outline"
          @click="drawer = false"
        >
          <template v-slot:append>
            <v-badge
              :content="unreadNotificationCount"
              :model-value="unreadNotificationCount > 0"
              color="error"
            ></v-badge>
          </template>
        </v-list-item>

        <v-list-item
          to="/cart"
          title="Cart"
          prepend-icon="mdi-cart"
          @click="drawer = false"
        >
          <template v-slot:append>
            <v-badge
              :content="cartItemCount"
              :model-value="cartItemCount > 0"
              color="primary"
            ></v-badge>
          </template>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <slot></slot>
    </v-main>

    <!-- Footer -->
    <v-footer class="bg-primary text-white" app>
      <v-container>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <h3 class="text-h6 mb-4">About Us</h3>
            <v-list density="compact" bg-color="transparent" class="pa-0">
              <v-list-item v-for="page in staticPages" :key="page.slug"
                :to="`/pages/${page.slug}`"
                :title="page.title"
                class="px-0 text-white"
                variant="plain"
              ></v-list-item>
            </v-list>
          </v-col>
          <!-- ...rest of footer columns... -->
        </v-row>
      </v-container>
    </v-footer>

    <v-footer
      class="bg-grey-lighten-3"
    >
      <v-container>
        <v-row>
          <!-- Company Info -->
          <v-col cols="12" md="4" class="mb-6 mb-md-0">
            <div class="d-flex align-center mb-4">
              <v-img
                src="/images/logo.png"
                alt="UberEat Logo"
                width="40"
                height="40"
                class="mr-2"
              ></v-img>
              <span class="text-h5 font-weight-bold primary--text">UberEat</span>
            </div>
            <p class="text-body-2 mb-4">
              Order food from your favorite restaurants and get it delivered right to your doorstep.
            </p>
            <div class="d-flex">
              <v-btn
                v-for="(social, index) in socialLinks"
                :key="index"
                :icon="social.icon"
                variant="text"
                color="primary"
                href="#"
                target="_blank"
                class="mr-2"
              ></v-btn>
            </div>
          </v-col>

          <!-- Quick Links -->
          <v-col cols="6" md="2">
            <h3 class="text-subtitle-1 font-weight-bold mb-4">Quick Links</h3>
            <v-list density="compact" bg-color="transparent" class="pa-0">
              <v-list-item
                v-for="link in quickLinks"
                :key="link.title"
                :to="link.to"
                :title="link.title"
                density="compact"
                class="px-0"
                rounded="0"
              ></v-list-item>
            </v-list>
          </v-col>

          <!-- Categories -->
          <v-col cols="6" md="2">
            <h3 class="text-subtitle-1 font-weight-bold mb-4">Categories</h3>
            <v-list density="compact" bg-color="transparent" class="pa-0">
              <v-list-item
                v-for="category in footerCategories"
                :key="category.title"
                :to="category.to"
                :title="category.title"
                density="compact"
                class="px-0"
                rounded="0"
              ></v-list-item>
            </v-list>
          </v-col>

          <!-- Contact Info -->
          <v-col cols="12" md="4">
            <h3 class="text-subtitle-1 font-weight-bold mb-4">Contact Us</h3>
            <v-list density="compact" bg-color="transparent" class="pa-0">
              <v-list-item
                prepend-icon="mdi-map-marker"
                title="123 Nguyen Hue, District 1, HCMC"
                density="compact"
                class="px-0"
                rounded="0"
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-phone"
                title="+84 123 456 789"
                density="compact"
                class="px-0"
                rounded="0"
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-email"
                title="support@ubereat.com"
                density="compact"
                class="px-0"
                rounded="0"
              ></v-list-item>
            </v-list>

            <h3 class="text-subtitle-1 font-weight-bold mt-4 mb-2">Download App</h3>
            <div class="d-flex flex-wrap">
              <v-img
                src="/images/app-store.png"
                alt="App Store"
                width="120"
                class="mr-2 mb-2"
              ></v-img>
              <v-img
                src="/images/google-play.png"
                alt="Google Play"
                width="120"
                class="mb-2"
              ></v-img>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-4"></v-divider>

        <!-- Copyright -->
        <div class="d-flex flex-wrap justify-space-between align-center">
          <div class="text-caption text-medium-emphasis">
            &copy; {{ new Date().getFullYear() }} UberEat. All rights reserved.
          </div>
          <div>
            <v-btn
              v-for="(link, index) in legalLinks"
              :key="index"
              :to="link.to"
              variant="text"
              density="compact"
              class="text-caption"
            >
              {{ link.title }}
            </v-btn>
          </div>
        </div>
      </v-container>
    </v-footer>
  </v-app>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import axios from 'axios';
import NotificationCenter from '@/components/notifications/NotificationCenter.vue';

export default {
  name: 'MainLayout',
  
  components: {
    NotificationCenter
  },
  
  data() {
    return {
      drawer: false,
      userMenu: false,
      
      navigationItems: [
        { title: 'Home', to: '/' },
        { title: 'Restaurants', to: '/restaurants' },
        { title: 'Search', to: '/search' },
        { title: 'Promotions', to: '/promotions' },
        { title: 'About Us', to: '/about' },
        { title: 'Contact', to: '/contact' }
      ],
      
      userMenuItems: [
        { title: 'My Profile', to: '/profile', icon: 'mdi-account' },
        { title: 'My Orders', to: '/orders', icon: 'mdi-receipt' },
        { title: 'Favorites', to: '/profile/favorites', icon: 'mdi-heart' },
        { title: 'Notifications', to: '/profile/notifications', icon: 'mdi-bell-outline' },
        { title: 'Addresses', to: '/profile/addresses', icon: 'mdi-map-marker' },
        { title: 'Payment Methods', to: '/profile/payment-methods', icon: 'mdi-credit-card' }
      ],
      
      socialLinks: [
        { icon: 'mdi-facebook', url: '#' },
        { icon: 'mdi-twitter', url: '#' },
        { icon: 'mdi-instagram', url: '#' },
        { icon: 'mdi-youtube', url: '#' }
      ],
      
      quickLinks: [
        { title: 'Home', to: '/' },
        { title: 'Restaurants', to: '/restaurants' },
        { title: 'Search', to: '/search' },
        { title: 'Promotions', to: '/promotions' },
        { title: 'About Us', to: '/about' },
        { title: 'Contact', to: '/contact' },
        { title: 'Become a Partner', to: '/partner' }
      ],
      
      footerCategories: [
        { title: 'Vietnamese', to: '/restaurants?category=vietnamese' },
        { title: 'Japanese', to: '/restaurants?category=japanese' },
        { title: 'Italian', to: '/restaurants?category=italian' },
        { title: 'American', to: '/restaurants?category=american' },
        { title: 'Thai', to: '/restaurants?category=thai' },
        { title: 'Indian', to: '/restaurants?category=indian' }
      ],
      
      legalLinks: [
        { title: 'Terms of Service', to: '/terms' },
        { title: 'Privacy Policy', to: '/privacy' },
        { title: 'Cookie Policy', to: '/cookies' }
      ],

      staticPages: [],
    };
  },

  async created() {
    try {
      const response = await axios.get('/api/pages');
      this.staticPages = response.data.data.pages.filter(page => page.published);
    } catch (error) {
      console.error('Error fetching static pages:', error);
    }

    // Initialize push notifications if user is logged in
    if (this.isLoggedIn) {
      this.initPushNotifications();
    }
  },
  
  computed: {
    ...mapState({
      user: state => state.auth.user,
      cart: state => state.cart.items
    }),
    
    ...mapGetters('notifications', [
      'unreadCount'
    ]),
    
    isLoggedIn() {
      return !!this.user;
    },
    
    userName() {
      if (!this.user) return '';
      return `${this.user.firstName} ${this.user.lastName}`;
    },
    
    userEmail() {
      return this.user?.email || '';
    },
    
    userAvatar() {
      return this.user?.photo || null;
    },
    
    cartItemCount() {
      if (!this.cart) return 0;
      return this.cart.reduce((total, item) => total + item.quantity, 0);
    },

    unreadNotificationCount() {
      return this.unreadCount;
    }
  },
  
  methods: {
    ...mapActions({
      logoutAction: 'auth/logout'
    }),
    
    ...mapActions('notifications', [
      'initPushNotifications'
    ]),
    
    async logout() {
      try {
        await this.logoutAction();
        this.userMenu = false;
        this.drawer = false;
        this.$router.push('/login');
        this.$toast.success('Logged out successfully');
      } catch (error) {
        this.$toast.error('Failed to logout');
        console.error('Logout error:', error);
      }
    }
  },

  watch: {
    // Initialize push notifications when user logs in
    user(newUser) {
      if (newUser) {
        this.initPushNotifications();
      }
    }
  }
};
</script>

<style scoped>
.v-list-item--density-compact {
  min-height: 32px;
}
</style>