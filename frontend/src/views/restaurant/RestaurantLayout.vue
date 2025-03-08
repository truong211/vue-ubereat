<template>
  <v-app>
    <!-- Navigation Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      app
      :rail="rail"
      @click="rail = false"
    >
      <v-list>
        <!-- Restaurant Info -->
        <v-list-item
          :prepend-avatar="restaurant?.logo"
          :title="restaurant?.name"
          :subtitle="restaurant?.status || 'Loading...'"
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
              color="error"
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
            to="/restaurant-admin/settings"
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
    <v-app-bar app elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      
      <v-toolbar-title>{{ pageTitle }}</v-toolbar-title>

      <v-spacer></v-spacer>

      <!-- Restaurant Status Toggle -->
      <v-switch
        v-model="isOpen"
        color="success"
        hide-details
        inset
        :label="isOpen ? 'Open' : 'Closed'"
        class="mr-4"
        @change="updateRestaurantStatus"
      ></v-switch>

      <!-- Notifications -->
      <v-btn icon class="mr-2" @click="showNotifications = !showNotifications">
        <v-badge
          :content="unreadNotifications.length"
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
                v-if="restaurant?.logo"
                :src="restaurant.logo"
                alt="Restaurant Logo"
              ></v-img>
              <span v-else class="text-h6 white--text">
                {{ restaurant?.name?.charAt(0) }}
              </span>
            </v-avatar>
          </v-btn>
        </template>

        <v-list>
          <v-list-item
            prepend-icon="mdi-account"
            title="Profile"
            to="/restaurant-admin/profile"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-cog"
            title="Settings"
            to="/restaurant-admin/settings"
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
                {{ formatNotificationTime(notification.createdAt) }}
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
      <v-container fluid>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- New Order Alert -->
    <v-snackbar
      v-model="showNewOrderAlert"
      color="success"
      timeout="-1"
      location="bottom"
    >
      <div class="d-flex align-center">
        <v-icon class="mr-2">mdi-bell-ring</v-icon>
        <span>New order received! (#{{ newOrder?.id }})</span>
        <v-btn
          class="ml-4"
          color="white"
          variant="outlined"
          size="small"
          @click="viewNewOrder"
        >
          View Order
        </v-btn>
      </div>
    </v-snackbar>
  </v-app>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'RestaurantLayout',

  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()

    // Navigation
    const drawer = ref(true)
    const rail = ref(false)
    const showNotifications = ref(false)

    // Restaurant data
    const restaurant = computed(() => store.state.restaurantAdmin.restaurant)
    const isOpen = ref(restaurant.value?.isOpen || false)

    // Page title based on route
    const pageTitle = computed(() => {
      const currentRoute = menuItems.value.find(item => item.path === route.path)
      return currentRoute?.title || 'Restaurant Admin'
    })

    // Navigation menu items
    const menuItems = computed(() => [
      {
        title: 'Dashboard',
        icon: 'mdi-view-dashboard',
        path: '/restaurant-admin/dashboard'
      },
      {
        title: 'Orders',
        icon: 'mdi-receipt',
        path: '/restaurant-admin/orders',
        badge: store.state.restaurantAdmin.pendingOrders.length
      },
      {
        title: 'Menu',
        icon: 'mdi-food',
        path: '/restaurant-admin/menu'
      },
      {
        title: 'Reviews',
        icon: 'mdi-star',
        path: '/restaurant-admin/reviews'
      },
      {
        title: 'Analytics',
        icon: 'mdi-chart-line',
        path: '/restaurant-admin/analytics'
      },
      {
        title: 'Promotions',
        icon: 'mdi-ticket-percent',
        path: '/restaurant-admin/promotions'
      }
    ])

    // Notifications
    const notifications = computed(() => store.state.restaurantAdmin.notifications)
    const unreadNotifications = computed(() => 
      notifications.value.filter(n => !n.read)
    )
    const showNewOrderAlert = ref(false)
    const newOrder = ref(null)

    // WebSocket connection
    const wsConnection = ref(null)

    const connectToWebSocket = () => {
      wsConnection.value = new WebSocket(
        `ws://api.example.com/restaurant/${restaurant.value.id}`
      )

      wsConnection.value.onmessage = (event) => {
        const data = JSON.parse(event.data)
        switch (data.type) {
          case 'new_order':
            handleNewOrder(data.order)
            break
          case 'order_status_update':
            handleOrderStatusUpdate(data)
            break
          case 'notification':
            handleNotification(data)
            break
        }
      }
    }

    const handleNewOrder = (order) => {
      store.commit('restaurantAdmin/addPendingOrder', order)
      newOrder.value = order
      showNewOrderAlert.value = true
      // Play notification sound
      new Audio('/assets/sounds/new-order.mp3').play()
    }

    const viewNewOrder = () => {
      router.push(`/restaurant-admin/orders/${newOrder.value.id}`)
      showNewOrderAlert.value = false
    }

    const handleOrderStatusUpdate = (data) => {
      store.commit('restaurantAdmin/updateOrderStatus', data)
    }

    const handleNotification = (notification) => {
      store.commit('restaurantAdmin/addNotification', notification)
    }

    // Methods
    const updateRestaurantStatus = async () => {
      try {
        await store.dispatch('restaurantAdmin/updateStatus', isOpen.value)
      } catch (error) {
        console.error('Failed to update status:', error)
        isOpen.value = !isOpen.value // Revert on failure
      }
    }

    const markAllAsRead = () => {
      store.commit('restaurantAdmin/markAllNotificationsAsRead')
    }

    const getNotificationColor = (type) => {
      switch (type) {
        case 'order': return 'success'
        case 'alert': return 'error'
        case 'info': return 'info'
        default: return 'primary'
      }
    }

    const getNotificationIcon = (type) => {
      switch (type) {
        case 'order': return 'mdi-receipt'
        case 'alert': return 'mdi-alert'
        case 'info': return 'mdi-information'
        default: return 'mdi-bell'
      }
    }

    const formatNotificationTime = (timestamp) => {
      const date = new Date(timestamp)
      const now = new Date()
      const diff = now - date

      // Show relative time if less than 24 hours
      if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        })
      }

      // Show date otherwise
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }

    const logout = async () => {
      await store.dispatch('logout')
      router.push('/auth/login')
    }

    // Lifecycle hooks
    onMounted(async () => {
      await store.dispatch('restaurantAdmin/fetchRestaurantDetails')
      connectToWebSocket()
    })

    onUnmounted(() => {
      if (wsConnection.value) {
        wsConnection.value.close()
      }
    })

    return {
      // State
      drawer,
      rail,
      restaurant,
      isOpen,
      menuItems,
      pageTitle,
      showNotifications,
      notifications,
      unreadNotifications,
      showNewOrderAlert,
      newOrder,

      // Methods
      updateRestaurantStatus,
      markAllAsRead,
      getNotificationColor,
      getNotificationIcon,
      formatNotificationTime,
      viewNewOrder,
      logout
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
