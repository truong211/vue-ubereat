<template>
  <v-app>
    <!-- Content only - No header -->
    <v-main>
      <!-- Slot for page content -->
      <slot></slot>
    </v-main>
  </v-app>
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
                  <v-list-item
                    v-if="isLoggedIn"
                    :prepend-avatar="userAvatar || '/images/default-avatar.png'"
                    :title="userName"
                    :subtitle="userName !== userEmail ? userEmail : undefined"
                  ></v-list-item>

                  <v-divider></v-divider>

                  <!-- Admin Panel Link for admin users (in dropdown) -->
                  <v-list-item
                    v-if="isAdmin"
                    to="/admin"
                    prepend-icon="mdi-shield-account"
                    title="Admin Panel"
                    @click="userMenu = false"
                  ></v-list-item>

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
                    prepend-icon="mdi-account-edit"
                    title="Update Profile Info"
                    @click="updateUserProfile"
                  ></v-list-item>

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

        <!-- Mobile Navigation Button and Mobile Notification Center -->
        <div class="d-flex d-md-none align-center">
          <!-- Mobile Notification Center -->
          <notification-center v-if="isLoggedIn" class="mr-2"></notification-center>

          <!-- Mobile Profile Button - Moved before cart button -->
          <v-btn
            v-if="isLoggedIn"
            to="/profile"
            color="primary"
            variant="tonal"
            class="mr-2"
            density="comfortable"
            prepend-icon="mdi-account"
          >
            <span class="d-inline">{{ userName }}</span>
          </v-btn>

          <!-- Mobile Cart Button -->
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

          <!-- Mobile Menu Button -->
          <v-btn
            icon
            variant="text"
            @click="drawer = !drawer"
          >
            <v-icon>mdi-menu</v-icon>
          </v-btn>
        </div>
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
          :subtitle="userName !== userEmail ? userEmail : undefined"
        ></v-list-item>

        <v-divider v-if="isLoggedIn" class="mb-2"></v-divider>

        <v-list-item
          v-for="item in navigationItems"
          :key="item.title"
          :to="item.to"
          :title="item.title"
          @click="drawer = false"
        ></v-list-item>

        <!-- Admin Button in mobile menu (only for admin users) -->
        <v-list-item
          v-if="isAdmin"
          to="/admin"
          prepend-icon="mdi-shield-account"
          title="Admin Panel"
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
            prepend-icon="mdi-account-edit"
            title="Update Profile Info"
            @click="updateUserProfile"
          ></v-list-item>
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
    <v-footer
      class="bg-primary text-white"
      app
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
              <span class="text-h5 font-weight-bold white--text">UberEat</span>
            </div>
            <p class="text-body-2 mb-4 white--text">
              Order food from your favorite restaurants and get it delivered right to your doorstep.
            </p>
            <div class="d-flex">
              <v-btn
                v-for="(social, index) in socialLinks"
                :key="index"
                :icon="social.icon"
                variant="text"
                color="white"
                href="#"
                target="_blank"
                class="mr-2"
              ></v-btn>
            </div>
          </v-col>

          <!-- Quick Links -->
          <v-col cols="6" md="2">
            <h3 class="text-subtitle-1 font-weight-bold mb-4 white--text">Quick Links</h3>
            <v-list density="compact" bg-color="transparent" class="pa-0 white--text">
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
            <h3 class="text-subtitle-1 font-weight-bold mb-4 white--text">Categories</h3>
            <v-list density="compact" bg-color="transparent" class="pa-0 white--text">
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
            <h3 class="text-subtitle-1 font-weight-bold mb-4 white--text">Contact Us</h3>
            <v-list density="compact" bg-color="transparent" class="pa-0 white--text">
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

            <h3 class="text-subtitle-1 font-weight-bold mt-4 mb-2 white--text">Download App</h3>
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

        <v-divider class="my-4" color="white"></v-divider>

        <!-- Copyright -->
        <div class="d-flex flex-wrap justify-space-between align-center">
          <div class="text-caption white--text">
            &copy; {{ new Date().getFullYear() }} UberEat. All rights reserved.
          </div>
          <div>
            <v-btn
              v-for="(link, index) in legalLinks"
              :key="index"
              :to="link.to"
              variant="text"
              density="compact"
              class="text-caption white--text"
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useCartStore } from '@/stores/cart';
import { useNotificationStore } from '@/stores/notifications.js';
import NotificationCenter from '@/components/notifications/NotificationCenter.vue';

export default {
  name: 'MainLayout',

  components: {
    NotificationCenter
  },

  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const cartStore = useCartStore();
    const notificationStore = useNotificationStore();

    const userMenu = ref(false);
    const drawer = ref(false);
    const staticPages = ref([]);

    // Social links
    const socialLinks = [
      { icon: 'mdi-facebook', url: '#' },
      { icon: 'mdi-twitter', url: '#' },
      { icon: 'mdi-instagram', url: '#' },
      { icon: 'mdi-youtube', url: '#' }
    ];

    // Quick links
    const quickLinks = [
      { title: 'Home', to: '/' },
      { title: 'Restaurants', to: '/restaurants' },
      { title: 'Search', to: '/search' },
      { title: 'About Us', to: '/about' },
      { title: 'Contact', to: '/contact' },
      { title: 'Become a Partner', to: '/partner' }
    ];

    // Footer categories
    const footerCategories = [
      { title: 'Vietnamese', to: '/restaurants?category=vietnamese' },
      { title: 'Japanese', to: '/restaurants?category=japanese' },
      { title: 'Italian', to: '/restaurants?category=italian' },
      { title: 'American', to: '/restaurants?category=american' },
      { title: 'Thai', to: '/restaurants?category=thai' },
      { title: 'Indian', to: '/restaurants?category=indian' }
    ];

    // Legal links
    const legalLinks = [
      { title: 'Terms of Service', to: '/terms' },
      { title: 'Privacy Policy', to: '/privacy' },
      { title: 'Cookie Policy', to: '/cookies' }
    ];

    // Auth computed properties
    const isLoggedIn = computed(() => authStore.isLoggedIn);
    const isAdmin = computed(() => authStore.userRole === 'admin');
    const userName = computed(() => authStore.currentUser?.fullName || 'User');
    const userEmail = computed(() => authStore.currentUser?.email || '');
    const userAvatar = computed(() => authStore.currentUser?.avatar || null);

    // Cart computed property
    const cartItemCount = computed(() => cartStore.itemCount);

    // Navigation items
    const navigationItems = [
      { title: 'Home', to: '/' },
      { title: 'Restaurants', to: '/restaurants' },
      { title: 'About', to: '/about' }
    ];

    // User menu items
    const userMenuItems = [
      { title: 'My Profile', to: '/profile', icon: 'mdi-account' },
      { title: 'My Orders', to: '/orders', icon: 'mdi-package' },
      { title: 'Favorites', to: '/favorites', icon: 'mdi-heart' },
      { title: 'Settings', to: '/settings', icon: 'mdi-cog' }
    ];

    // Methods
    const logout = async () => {
      try {
        await authStore.logout();
        userMenu.value = false;
        drawer.value = false;
        router.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    const updateUserProfile = () => {
      userMenu.value = false;
      drawer.value = false;
      router.push('/profile/edit');
    };

    // Initialize
    onMounted(async () => {
      if (isLoggedIn.value) {
        await notificationStore.initPushNotifications();
      }
    });

    // Watch for auth state changes
    watch(isLoggedIn, (newValue) => {
      if (!newValue) {
        userMenu.value = false;
        drawer.value = false;
      }
    });

    watch(authStore.currentUser, (newUser) => {
      if (newUser) {
        notificationStore.initPushNotifications();
      }
    });

    return {
      userMenu,
      drawer,
      staticPages,
      isLoggedIn,
      isAdmin,
      userName,
      userEmail,
      userAvatar,
      cartItemCount,
      navigationItems,
      userMenuItems,
      logout,
      updateUserProfile,
      socialLinks,
      quickLinks,
      footerCategories,
      legalLinks,
      unreadNotificationCount: notificationStore.unreadCount
    };
  }
};
</script>

<style scoped>
.v-list-item--density-compact {
  min-height: 32px;
}

.footer-border {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
