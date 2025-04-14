<template>
  <v-menu
    v-model="showMenu"
    :close-on-content-click="false"
    location="bottom end"
    offset="8"
  >
    <!-- Notification Bell Icon -->
    <template v-slot:activator="{ props }">
      <v-btn
        icon
        variant="text"
        v-bind="props"
      >
        <v-badge
          :content="unreadCount"
          :model-value="unreadCount > 0"
          color="error"
          overlap
        >
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <!-- Notification Panel -->
    <v-card
      min-width="360"
      max-width="400"
      class="notification-center"
    >
      <!-- Header -->
      <v-card-title class="d-flex align-center py-3">
        <span class="text-subtitle-1">Notifications</span>
        <v-spacer></v-spacer>
        <v-btn
          v-if="hasUnread"
          variant="text"
          density="comfortable"
          @click="markAllAsRead"
        >
          Mark all as read
        </v-btn>
      </v-card-title>

      <!-- Filter Tabs -->
      <v-tabs
        v-model="activeTab"
        density="comfortable"
        color="primary"
      >
        <v-tab value="all">All</v-tab>
        <v-tab value="unread">Unread</v-tab>
        <v-tab value="orders">Orders</v-tab>
        <v-tab value="promotions">Promotions</v-tab>
      </v-tabs>

      <!-- Notifications List -->
      <v-card-text class="notifications-container pa-0">
        <v-list v-if="filteredNotifications.length" lines="two">
          <template
            v-for="notification in filteredNotifications"
            :key="notification.id"
          >
            <v-list-item
              :value="notification"
              :class="{ 'unread': !notification.read && !notification.isRead }"
              @click="handleNotificationClick(notification)"
            >
              <!-- Icon -->
              <template v-slot:prepend>
                <v-icon :icon="getNotificationIcon(notification)" color="primary"></v-icon>
              </template>

              <!-- Content -->
              <v-list-item-title>{{ notification.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>

              <!-- Time -->
              <v-list-item-subtitle class="text-caption text-right">
                {{ formatTime(notification.timestamp) }}
              </v-list-item-subtitle>

              <!-- Actions -->
              <template v-slot:append>
                <v-menu location="bottom end">
                  <template v-slot:activator="{ props }">
                    <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      density="comfortable"
                      size="small"
                      v-bind="props"
                    ></v-btn>
                  </template>

                  <v-list density="compact">
                    <v-list-item
                      v-if="!notification.read && !notification.isRead"
                      prepend-icon="mdi-check"
                      title="Mark as read"
                      @click="markAsRead(notification.id)"
                    ></v-list-item>
                    <v-list-item
                      prepend-icon="mdi-delete"
                      title="Remove"
                      @click="removeNotification(notification.id)"
                    ></v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-list-item>

            <v-divider></v-divider>
          </template>
        </v-list>

        <!-- Empty State -->
        <div
          v-else
          class="d-flex flex-column align-center justify-center pa-8"
        >
          <v-icon
            icon="mdi-bell-off"
            size="48"
            color="grey-lighten-1"
            class="mb-2"
          ></v-icon>
          <div class="text-grey">No notifications</div>
        </div>
      </v-card-text>

      <!-- Footer -->
      <v-card-actions class="justify-center pa-3">
        <v-btn
          variant="text"
          prepend-icon="mdi-cog"
          to="/settings/notifications"
          @click="showMenu = false"
        >
          Notification Settings
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'
import { useNotificationStore } from '@/stores/notifications'

export default {
  name: 'NotificationCenter',

  setup() {
    const notificationsStore = useNotificationStore()
    const router = useRouter()
    const showMenu = ref(false)
    const activeTab = ref('all')

    // Computed
    const notifications = computed(() => notificationsStore.notifications || [])
    const unreadCount = computed(() => notificationsStore.unreadCount)
    const hasUnread = computed(() => notificationsStore.hasUnread)

    const filteredNotifications = computed(() => {
      if (!notifications.value) return []

      let filtered = [...notifications.value]

      switch (activeTab.value) {
        case 'unread':
          filtered = filtered.filter(n => !n.read && !n.isRead)
          break
        case 'orders':
          filtered = filtered.filter(n => n.type === 'order_status')
          break
        case 'promotions':
          filtered = filtered.filter(n => n.type === 'promotion')
          break
      }

      return filtered
    })

    // Methods
    const getNotificationIcon = (notification) => {
      switch (notification.type) {
        case 'order_status':
          return 'mdi-food'
        case 'driver_location':
          return 'mdi-map-marker'
        case 'chat':
          return 'mdi-message'
        case 'promotion':
          return 'mdi-tag'
        default:
          return 'mdi-bell'
      }
    }

    const formatTime = (timestamp) => {
      if (!timestamp) return ''
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    }

    const handleNotificationClick = (notification) => {
      if (!notification.read) {
        notificationsStore.markAsRead(notification.id)
      }

      // Handle navigation based on notification type
      switch (notification.type) {
        case 'order_status':
          if (notification.orderId) {
            router.push(`/orders/${notification.orderId}`)
          }
          break
        case 'chat':
          if (notification.chatId) {
            router.push(`/chat/${notification.chatId}`)
          }
          break
        case 'promotion':
          if (notification.promotionId) {
            router.push(`/promotions/${notification.promotionId}`)
          }
          break
      }

      showMenu.value = false
    }

    const markAsRead = (notificationId) => {
      notificationsStore.markAsRead(notificationId)
    }

    const markAllAsRead = () => {
      notificationsStore.markAllAsRead()
    }

    const removeNotification = (notificationId) => {
      notificationsStore.deleteNotification(notificationId)
    }

    return {
      showMenu,
      activeTab,
      notifications,
      unreadCount,
      hasUnread,
      filteredNotifications,
      getNotificationIcon,
      formatTime,
      handleNotificationClick,
      markAsRead,
      markAllAsRead,
      removeNotification
    }
  }
}
</script>

<style scoped>
.notification-center {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.notifications-container {
  max-height: 400px;
  overflow-y: auto;
}

.unread {
  background-color: rgb(var(--v-theme-primary), 0.05);
}

/* Custom scrollbar */
.notifications-container::-webkit-scrollbar {
  width: 6px;
}

.notifications-container::-webkit-scrollbar-track {
  background: transparent;
}

.notifications-container::-webkit-scrollbar-thumb {
  background: #90a4ae;
  border-radius: 3px;
}

.notifications-container::-webkit-scrollbar-thumb:hover {
  background: #607d8b;
}
</style>