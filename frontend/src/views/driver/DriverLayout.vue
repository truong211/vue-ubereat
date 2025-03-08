<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      app
      :rail="rail"
      :mobile-breakpoint="960"
      @click="rail = false"
    >
      <v-list>
        <!-- Driver Info -->
        <v-list-item
          :prepend-avatar="user?.avatar"
          :title="user?.name"
          :subtitle="user?.vehicle?.type || 'Driver'"
        >
          <template v-slot:append>
            <v-btn
              variant="text"
              icon="mdi-chevron-left"
              @click.stop="rail = !rail"
            ></v-btn>
          </template>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <!-- Status Toggle -->
        <v-list-item>
          <v-switch
            v-model="isOnline"
            color="success"
            :label="isOnline ? 'Online' : 'Offline'"
            hide-details
            @change="toggleStatus"
          >
            <template v-slot:prepend>
              <v-icon
                :color="isOnline ? 'success' : 'grey'"
                :icon="isOnline ? 'mdi-circle' : 'mdi-circle-outline'"
              ></v-icon>
            </template>
          </v-switch>
        </v-list-item>

        <v-divider class="my-2"></v-divider>

        <!-- Navigation Items -->
        <v-list-item
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
          :value="item.path"
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

      <!-- Bottom Actions -->
      <template v-slot:bottom>
        <v-list>
          <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
            to="/driver/settings"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-logout"
            title="Logout"
            @click="logout"
          ></v-list-item>
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- Top App Bar -->
    <v-app-bar 
      app 
      elevation="1"
      :color="isOnline ? 'success' : undefined"
      :theme="isOnline ? 'dark' : undefined"
    >
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      
      <v-toolbar-title>{{ pageTitle }}</v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Current Earnings -->
      <v-btn
        prepend-icon="mdi-cash"
        class="mr-2"
        :text="todayEarnings"
        variant="tonal"
        to="/driver/earnings"
      ></v-btn>

      <!-- Current Order Info -->
      <v-btn
        v-if="currentOrder"
        :prepend-icon="getOrderIcon(currentOrder.status)"
        :color="getOrderColor(currentOrder.status)"
        class="mr-2"
        @click="showOrderDetails"
      >
        Order #{{ currentOrder.id }}
      </v-btn>

      <!-- Notifications -->
      <v-btn icon class="mr-2" @click="showNotifications = !showNotifications">
        <v-badge
          :content="unreadNotifications.length.toString()"
          :model-value="unreadNotifications.length > 0"
          color="error"
        >
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>

      <!-- Profile Menu -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-avatar color="primary" size="32">
              <v-img
                v-if="user?.avatar"
                :src="user.avatar"
                alt="Driver Avatar"
              ></v-img>
              <span v-else class="text-h6 white--text">
                {{ user?.name?.charAt(0) }}
              </span>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <v-list-item
            prepend-icon="mdi-account"
            title="Profile"
            to="/driver/profile"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
            to="/driver/settings"
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

    <!-- Notifications Panel -->
    <v-navigation-drawer
      v-model="showNotifications"
      location="right"
      temporary
      width="400"
    >
      <v-toolbar title="Notifications">
        <v-spacer></v-spacer>
        <v-btn
          v-if="unreadNotifications.length"
          variant="text"
          size="small"
          @click="markAllAsRead"
        >
          Mark all as read
        </v-btn>
      </v-toolbar>

      <v-list lines="three">
        <template v-if="notifications.length">
          <v-list-item
            v-for="notification in notifications"
            :key="notification.id"
            :title="notification.title"
            :subtitle="notification.message"
            :class="{ 'bg-grey-lighten-4': !notification.read }"
          >
            <template v-slot:prepend>
              <v-avatar
                :color="getNotificationColor(notification.type)"
                size="36"
              >
                <v-icon color="white">
                  {{ getNotificationIcon(notification.type) }}
                </v-icon>
              </v-avatar>
            </template>

            <template v-slot:append>
              <div class="text-caption">
                {{ formatTime(notification.timestamp) }}
              </div>
            </template>
          </v-list-item>
        </template>

        <v-list-item v-else>
          <div class="text-center pa-4">
            <v-icon
              size="48"
              color="grey"
              icon="mdi-bell-outline"
            ></v-icon>
            <div class="text-body-1 mt-2">No notifications</div>
          </div>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content -->
    <v-main>
      <v-container fluid class="fill-height">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Order Details Dialog -->
    <v-dialog
      v-model="orderDialog.show"
      max-width="500"
    >
      <v-card v-if="currentOrder">
        <v-toolbar
          :color="getOrderColor(currentOrder.status)"
          :theme="isDarkOrderStatus(currentOrder.status) ? 'dark' : undefined"
        >
          <v-toolbar-title>Order #{{ currentOrder.id }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="orderDialog.show = false"
          ></v-btn>
        </v-toolbar>

        <v-card-text class="pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-2">Restaurant</div>
          <div class="mb-4">
            <div>{{ currentOrder.restaurant.name }}</div>
            <div class="text-caption">{{ currentOrder.restaurant.address }}</div>
          </div>

          <div class="text-subtitle-1 font-weight-bold mb-2">Customer</div>
          <div class="mb-4">
            <div>{{ currentOrder.customer.name }}</div>
            <div class="text-caption">{{ currentOrder.customer.address }}</div>
            <div class="text-caption">{{ currentOrder.customer.phone }}</div>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="text-subtitle-1 font-weight-bold mb-2">Order Items</div>
          <v-list density="compact">
            <v-list-item
              v-for="item in currentOrder.items"
              :key="item.id"
              :title="item.name"
              :subtitle="`Quantity: ${item.quantity}`"
            >
              <template v-slot:append>
                {{ formatPrice(item.price * item.quantity) }}
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <div class="d-flex justify-space-between mb-2">
            <div>Subtotal</div>
            <div>{{ formatPrice(currentOrder.subtotal) }}</div>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <div>Delivery Fee</div>
            <div>{{ formatPrice(currentOrder.deliveryFee) }}</div>
          </div>
          <div class="d-flex justify-space-between font-weight-bold">
            <div>Total</div>
            <div>{{ formatPrice(currentOrder.total) }}</div>
          </div>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <template v-if="currentOrder.status === 'assigned'">
            <v-btn
              color="error"
              variant="text"
              @click="rejectOrder"
            >
              Reject
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="success"
              @click="acceptOrder"
            >
              Accept Order
            </v-btn>
          </template>

          <template v-else>
            <v-btn
              color="primary"
              block
              :to="`/driver/orders/${currentOrder.id}`"
            >
              View Details
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'DriverLayout',

  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()

    // Navigation
    const drawer = ref(true)
    const rail = ref(false)
    const showNotifications = ref(false)

    // State
    const isOnline = ref(false)
    const locationWatcher = ref(null)
    const orderDialog = ref({
      show: false
    })

    // User data
    const user = computed(() => store.state.auth.user)
    const currentOrder = computed(() => store.state.driver.currentOrder)
    const todayEarnings = computed(() => 
      formatPrice(store.state.driver.todayEarnings)
    )

    // Navigation menu
    const menuItems = computed(() => [
      {
        title: 'Dashboard',
        icon: 'mdi-view-dashboard',
        path: '/driver/dashboard'
      },
      {
        title: 'Orders',
        icon: 'mdi-receipt',
        path: '/driver/orders',
        badge: store.state.driver.activeOrders.length,
        badgeColor: 'primary'
      },
      {
        title: 'Earnings',
        icon: 'mdi-cash-multiple',
        path: '/driver/earnings'
      },
      {
        title: 'Performance',
        icon: 'mdi-chart-line',
        path: '/driver/performance'
      }
    ])

    // Page title based on route
    const pageTitle = computed(() => {
      const currentRoute = menuItems.value.find(item => item.path === route.path)
      return currentRoute?.title || 'Driver Dashboard'
    })

    // Notifications
    const notifications = computed(() => store.state.driver.notifications)
    const unreadNotifications = computed(() => 
      notifications.value.filter(n => !n.read)
    )

    // Methods
    const toggleStatus = async (value) => {
      try {
        await store.dispatch('driver/updateStatus', { online: value })
        if (value) {
          startLocationTracking()
        } else {
          stopLocationTracking()
        }
      } catch (error) {
        console.error('Failed to update status:', error)
        isOnline.value = !value // Revert on failure
      }
    }

    const startLocationTracking = () => {
      if ('geolocation' in navigator) {
        locationWatcher.value = navigator.geolocation.watchPosition(
          (position) => {
            store.dispatch('driver/updateLocation', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          },
          (error) => {
            console.error('Location error:', error)
            store.dispatch('setError', 'Unable to track location')
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          }
        )
      }
    }

    const stopLocationTracking = () => {
      if (locationWatcher.value) {
        navigator.geolocation.clearWatch(locationWatcher.value)
        locationWatcher.value = null
      }
    }

    const showOrderDetails = () => {
      if (currentOrder.value) {
        orderDialog.value.show = true
      }
    }

    const acceptOrder = async () => {
      try {
        await store.dispatch('driver/acceptOrder', currentOrder.value.id)
        orderDialog.value.show = false
        router.push(`/driver/orders/${currentOrder.value.id}`)
      } catch (error) {
        console.error('Failed to accept order:', error)
      }
    }

    const rejectOrder = async () => {
      try {
        await store.dispatch('driver/rejectOrder', currentOrder.value.id)
        orderDialog.value.show = false
      } catch (error) {
        console.error('Failed to reject order:', error)
      }
    }

    const markAllAsRead = () => {
      store.dispatch('driver/markAllNotificationsAsRead')
    }

    const logout = async () => {
      stopLocationTracking()
      await store.dispatch('auth/logout')
      router.push('/auth/login')
    }

    // Utility functions
    const getNotificationColor = (type) => {
      switch (type) {
        case 'order': return 'success'
        case 'warning': return 'warning'
        case 'info': return 'info'
        default: return 'grey'
      }
    }

    const getNotificationIcon = (type) => {
      switch (type) {
        case 'order': return 'mdi-receipt'
        case 'warning': return 'mdi-alert'
        case 'info': return 'mdi-information'
        default: return 'mdi-bell'
      }
    }

    const getOrderColor = (status) => {
      switch (status) {
        case 'assigned': return 'warning'
        case 'accepted': return 'primary'
        case 'picked_up': return 'info'
        case 'completed': return 'success'
        default: return undefined
      }
    }

    const getOrderIcon = (status) => {
      switch (status) {
        case 'assigned': return 'mdi-bell-ring'
        case 'accepted': return 'mdi-bike-fast'
        case 'picked_up': return 'mdi-shopping'
        case 'completed': return 'mdi-check-circle'
        default: return 'mdi-receipt'
      }
    }

    const isDarkOrderStatus = (status) => {
      return ['assigned', 'accepted', 'picked_up'].includes(status)
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    }

    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }

    // Lifecycle
    onMounted(() => {
      if (store.state.driver.status === 'online') {
        isOnline.value = true
        startLocationTracking()
      }
    })

    onUnmounted(() => {
      stopLocationTracking()
    })

    return {
      drawer,
      rail,
      isOnline,
      orderDialog,
      showNotifications,
      user,
      currentOrder,
      todayEarnings,
      menuItems,
      pageTitle,
      notifications,
      unreadNotifications,
      toggleStatus,
      showOrderDetails,
      acceptOrder,
      rejectOrder,
      markAllAsRead,
      logout,
      getNotificationColor,
      getNotificationIcon,
      getOrderColor,
      getOrderIcon,
      isDarkOrderStatus,
      formatTime,
      formatPrice
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
