<template>
  <v-app>
    <!-- App Bar -->
    <v-app-bar v-if="!hideAppBar" app color="white" elevation="1">
      <!-- Mobile menu button -->
      <v-app-bar-nav-icon
        v-if="!isRestaurantAdmin && !isDriverAdmin && !isAdmin"
        @click="drawer = !drawer"
        class="d-md-none"
      ></v-app-bar-nav-icon>

      <!-- App logo -->
      <router-link to="/" class="text-decoration-none">
        <v-app-bar-title class="font-weight-bold">
          <span class="text-primary">Food</span>
          <span class="text-secondary">Delivery</span>
        </v-app-bar-title>
      </router-link>

      <v-spacer></v-spacer>
      
      <!-- Navigation for desktop -->
      <div class="d-none d-md-flex" v-if="!isRestaurantAdmin && !isDriverAdmin && !isAdmin">
        <v-btn to="/" variant="text">{{ $t('common.home') }}</v-btn>
        <v-btn to="/restaurants" variant="text">{{ $t('common.restaurants') }}</v-btn>
        <v-btn v-if="isAuthenticated" to="/orders" variant="text">{{ $t('common.orders') }}</v-btn>
      </div>

      <!-- Cart button for customers -->
      <v-btn
        v-if="!isRestaurantAdmin && !isDriverAdmin && !isAdmin"
        to="/cart"
        icon
        class="mr-2"
      >
        <v-badge
          :content="cartItemCount.toString()"
          :value="cartItemCount"
          color="primary"
        >
          <v-icon>mdi-cart-outline</v-icon>
        </v-badge>
      </v-btn>
      
      <!-- Notification Center -->
      <notification-center v-if="isAuthenticated" />
      
      <!-- Driver online/offline toggle -->
      <v-switch
        v-if="isDriverAdmin"
        v-model="isOnline"
        color="success"
        hide-details
        label="Online"
        density="compact"
        class="mr-4"
        @change="toggleDriverStatus"
      ></v-switch>

      <!-- Language switcher -->
      <language-switcher class="mr-4" />
    
      <!-- Authentication buttons -->
      <template v-if="!isAuthenticated">
        <v-btn to="/auth/login" variant="text">{{ $t('common.login') }}</v-btn>
        <v-btn to="/auth/register" color="primary" class="ml-2">{{ $t('common.signup') }}</v-btn>
      </template>
      
      <!-- User menu -->
      <v-menu v-else location="bottom end" transition="slide-y-transition">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            class="text-none"
            variant="text"
          >
            <v-avatar size="32" color="primary" class="mr-2">
              <v-img v-if="user && user.avatar" :src="user.avatar"></v-img>
              <span v-else class="text-h6 text-white">{{ userInitial }}</span>
            </v-avatar>
            {{ userName }}
            <v-icon right>mdi-chevron-down</v-icon>
          </v-btn>
        </template>
        
        <v-card min-width="200">
          <v-list>
            <!-- Admin dashboard link -->
            <v-list-item
              v-if="isAdmin"
              to="/admin"
              prepend-icon="mdi-view-dashboard"
            >
              <v-list-item-title>{{ $t('admin.dashboard') }}</v-list-item-title>
            </v-list-item>
            
            <!-- Restaurant dashboard link -->
            <v-list-item
              v-if="isRestaurantAdmin"
              to="/restaurant"
              prepend-icon="mdi-store"
            >
              <v-list-item-title>Restaurant Dashboard</v-list-item-title>
            </v-list-item>
            
            <!-- Driver dashboard link -->
            <v-list-item
              v-if="isDriverAdmin"
              to="/driver"
              prepend-icon="mdi-bike"
            >
              <v-list-item-title>Driver Dashboard</v-list-item-title>
            </v-list-item>
            
            <!-- Customer links -->
            <template v-if="!isRestaurantAdmin && !isDriverAdmin && !isAdmin">
              <v-list-item
                to="/profile"
                prepend-icon="mdi-account"
              >
                <v-list-item-title>Profile</v-list-item-title>
              </v-list-item>
              
              <v-list-item
                to="/orders"
                prepend-icon="mdi-receipt"
              >
                <v-list-item-title>Orders</v-list-item-title>
              </v-list-item>
              
              <v-list-item
                to="/addresses"
                prepend-icon="mdi-map-marker"
              >
                <v-list-item-title>Addresses</v-list-item-title>
              </v-list-item>
              
              <v-list-item
                to="/rewards"
                prepend-icon="mdi-star-circle"
              >
                <v-list-item-title>Rewards</v-list-item-title>
              </v-list-item>
            </template>
            
            <v-divider></v-divider>
            
            <!-- Dark mode toggle -->
            <v-list-item @click="toggleTheme">
              <template v-slot:prepend>
                <v-icon>{{ isDarkTheme ? 'mdi-white-balance-sunny' : 'mdi-weather-night' }}</v-icon>
              </template>
              <v-list-item-title>{{ isDarkTheme ? 'Light Mode' : 'Dark Mode' }}</v-list-item-title>
            </v-list-item>
            
            <!-- Logout button -->
            <v-list-item @click="logout" prepend-icon="mdi-logout">
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <!-- Navigation drawer (mobile) -->
    <v-navigation-drawer
      v-if="!isRestaurantAdmin && !isDriverAdmin && !isAdmin"
      v-model="drawer"
      temporary
    >
      <v-list-item
        prepend-avatar="logo.png"
        title="Food Delivery"
      ></v-list-item>
      
      <v-divider></v-divider>
      
      <v-list density="compact" nav>
        <v-list-item to="/" prepend-icon="mdi-home" :title="$t('common.home')"></v-list-item>
        <v-list-item to="/restaurants" prepend-icon="mdi-store" :title="$t('common.restaurants')"></v-list-item>
        <v-list-item to="/cart" prepend-icon="mdi-cart" :title="$t('common.cart')"></v-list-item>
        
        <v-divider v-if="isAuthenticated" class="my-2"></v-divider>
        
        <template v-if="isAuthenticated">
          <v-list-item to="/profile" prepend-icon="mdi-account" :title="$t('common.profile')"></v-list-item>
          <v-list-item to="/orders" prepend-icon="mdi-receipt" :title="$t('common.orders')"></v-list-item>
          <v-list-item to="/addresses" prepend-icon="mdi-map-marker" :title="$t('profile.savedAddresses')"></v-list-item>
          <v-list-item to="/rewards" prepend-icon="mdi-star-circle" title="Rewards"></v-list-item>
        </template>
        
        <v-divider class="my-2"></v-divider>
        
        <v-list-item v-if="!isAuthenticated" to="/auth/login" prepend-icon="mdi-login" :title="$t('common.login')"></v-list-item>
        <v-list-item v-if="!isAuthenticated" to="/auth/register" prepend-icon="mdi-account-plus" :title="$t('common.signup')"></v-list-item>
        <v-list-item v-else @click="logout" prepend-icon="mdi-logout" :title="$t('common.logout')"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main content -->
    <v-main>
      <!-- Loading overlay -->
      <v-overlay
        v-model="isPageLoading"
        class="align-center justify-center"
      >
        <v-progress-circular
          indeterminate
          color="primary"
          size="64"
        ></v-progress-circular>
      </v-overlay>
      
      <!-- Page content -->
      <transition name="fade" mode="out-in">
        <router-view></router-view>
      </transition>
    </v-main>

    <!-- Footer -->
    <v-footer v-if="!hideFooter" app class="bg-grey-lighten-3">
      <v-container>
        <v-row>
          <v-col cols="12" md="4" class="text-center text-md-left">
            <h3 class="text-h6 font-weight-bold mb-3">
              <span class="text-primary">Food</span>
              <span class="text-secondary">Delivery</span>
            </h3>
            <p class="text-body-2">{{ $t('footer.description') }}</p>
          </v-col>
          
          <v-col cols="12" md="4" class="text-center">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">{{ $t('footer.quickLinks') }}</h3>
            <div class="d-flex flex-column">
              <router-link to="/" class="text-decoration-none text-body-2 mb-1">{{ $t('common.home') }}</router-link>
              <router-link to="/restaurants" class="text-decoration-none text-body-2 mb-1">{{ $t('common.restaurants') }}</router-link>
              <a href="#" class="text-decoration-none text-body-2 mb-1">{{ $t('footer.about') }}</a>
              <a href="#" class="text-decoration-none text-body-2">{{ $t('footer.contact') }}</a>
            </div>
          </v-col>
          
          <v-col cols="12" md="4" class="text-center text-md-right">
            <h3 class="text-subtitle-1 font-weight-bold mb-3">{{ $t('footer.contactUs') }}</h3>
            <p class="text-body-2 mb-1">{{ $t('footer.email') }}: support@fooddelivery.com</p>
            <p class="text-body-2 mb-1">{{ $t('footer.phone') }}: (123) 456-7890</p>
            <div class="mt-2">
              <v-btn icon class="mx-1" variant="text" aria-label="Facebook">
                <v-icon>mdi-facebook</v-icon>
              </v-btn>
              <v-btn icon class="mx-1" variant="text" aria-label="Twitter">
                <v-icon>mdi-twitter</v-icon>
              </v-btn>
              <v-btn icon class="mx-1" variant="text" aria-label="Instagram">
                <v-icon>mdi-instagram</v-icon>
              </v-btn>
            </div>
          </v-col>
        </v-row>
        
        <v-divider class="mt-4 mb-4"></v-divider>
        
        <div class="text-center text-body-2">
          {{ $t('footer.copyright', { year: new Date().getFullYear() }) }}
        </div>
      </v-container>
    </v-footer>
    
    <!-- Global snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      :location="snackbar.location"
    >
      {{ snackbar.text }}
      
      <template v-slot:actions>
        <v-btn
          v-if="snackbar.action"
          color="white"
          text
          @click="handleSnackbarAction"
        >
          {{ snackbar.action.text }}
        </v-btn>
        <v-btn
          color="white"
          icon="mdi-close"
          @click="snackbar.show = false"
        ></v-btn>
      </template>
    </v-snackbar>
    
    <!-- Global dialog -->
    <v-dialog
      v-model="dialog.show"
      :max-width="dialog.maxWidth"
      :persistent="dialog.persistent"
    >
      <v-card>
        <v-card-title>{{ dialog.title }}</v-card-title>
        
        <v-card-text>{{ dialog.message }}</v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          
          <v-btn
            v-for="(button, index) in dialog.buttons"
            :key="index"
            :color="button.color || 'primary'"
            :variant="button.variant || 'text'"
            @click="handleDialogAction(button)"
          >
            {{ button.text }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import NotificationCenter from './components/common/NotificationCenter.vue';
import LanguageSwitcher from './components/common/LanguageSwitcher.vue';

export default {
  name: 'App',
  
  components: {
    NotificationCenter,
    LanguageSwitcher
  },
  
  setup() {
    const store = useStore();
    const route = useRoute();
    
    // Navigation drawer state
    const drawer = ref(false);
    
    // Get authentication state from store
    const isAuthenticated = computed(() => store.getters['isAuthenticated']);
    const user = computed(() => store.getters['user']);
    const userInitial = computed(() => {
      return user.value && user.value.name ? user.value.name.charAt(0).toUpperCase() : '?';
    });
    const userName = computed(() => {
      return user.value ? user.value.name : '';
    });
    
    // Check user role
    const isRestaurantAdmin = computed(() => user.value && user.value.role === 'restaurant');
    const isDriverAdmin = computed(() => user.value && user.value.role === 'driver');
    const isAdmin = computed(() => user.value && user.value.role === 'admin');
    
    // Layout flags
    const hideAppBar = computed(() => {
      // Hide app bar on specific routes if needed
      return false;
    });
    
    const hideFooter = computed(() => {
      // Hide footer on admin areas, login pages, etc
      return isRestaurantAdmin.value || 
             isDriverAdmin.value || 
             isAdmin.value || 
             route.path.startsWith('/auth/');
    });
    
    // Cart data
    const cartItemCount = computed(() => store.getters['cartItemCount'] || 0);
    
    // Theme toggle
    const isDarkTheme = computed(() => store.getters['ui/isDarkTheme']);
    const toggleTheme = () => {
      store.dispatch('ui/toggleTheme');
    };
    
    // Driver online status
    const isOnline = ref(false);
    if (isDriverAdmin.value && user.value) {
      // Load initial online status from driver store
      isOnline.value = store.getters['driver/isOnline'];
    }
    
    const toggleDriverStatus = () => {
      if (isOnline.value) {
        // Get current location and go online
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              store.dispatch('driver/goOnline', location);
            },
            (error) => {
              console.error('Geolocation error:', error);
              store.dispatch('ui/showSnackbar', {
                text: 'Could not get your location. Please enable location services.',
                color: 'error'
              });
              isOnline.value = false;
            }
          );
        } else {
          store.dispatch('ui/showSnackbar', {
            text: 'Geolocation is not supported by your browser.',
            color: 'error'
          });
          isOnline.value = false;
        }
      } else {
        // Go offline
        store.dispatch('driver/goOffline');
      }
    };
    
    // Logout handler
    const logout = async () => {
      await store.dispatch('logout');
      drawer.value = false;
      store.dispatch('ui/showSnackbar', {
        text: 'You have been logged out.',
        color: 'info'
      });
    };
    
    // Snackbar state
    const snackbar = computed(() => store.getters['ui/getSnackbar']);
    
    const handleSnackbarAction = () => {
      if (snackbar.value.action && typeof snackbar.value.action.callback === 'function') {
        snackbar.value.action.callback();
      }
      snackbar.value.show = false;
    };
    
    // Dialog state
    const dialog = computed(() => store.getters['ui/getDialog']);
    
    const handleDialogAction = (button) => {
      if (button && typeof button.action === 'function') {
        button.action();
      }
      if (button.closeDialog !== false) {
        dialog.value.show = false;
      }
    };
    
    // Page loading state
    const isPageLoading = computed(() => store.getters['ui/isPageLoading']);
    
    // Initialize WebSocket connection
    store.dispatch('initWebSocket');
    
    // Load user data if auth token exists
    if (localStorage.getItem('token')) {
      store.dispatch('loadUser').catch(() => {
        // Clear invalid token
        store.dispatch('logout');
      });
    }
    
    // Load cart data from localStorage
    store.dispatch('loadCart');
    
    // Initialize theme from localStorage
    store.dispatch('ui/initTheme');
    
    // Watch for driver location updates
    if (isDriverAdmin.value) {
      // Set up location tracking if driver is online
      watch(isOnline, (newValue) => {
        if (newValue) {
          // Start tracking location
          navigator.geolocation.watchPosition(
            (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              };
              store.dispatch('driver/updateLocation', location);
            },
            (error) => {
              console.error('Geolocation error:', error);
            },
            {
              enableHighAccuracy: true,
              maximumAge: 30000,
              timeout: 27000
            }
          );
        }
      });
    }
    
    return {
      drawer,
      isAuthenticated,
      user,
      userInitial,
      userName,
      isRestaurantAdmin,
      isDriverAdmin,
      isAdmin,
      hideAppBar,
      hideFooter,
      cartItemCount,
      isDarkTheme,
      toggleTheme,
      isOnline,
      toggleDriverStatus,
      logout,
      snackbar,
      handleSnackbarAction,
      dialog,
      handleDialogAction,
      isPageLoading
    };
  }
};
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>