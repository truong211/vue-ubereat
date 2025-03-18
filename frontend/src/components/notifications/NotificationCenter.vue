<template>
  <div class="notification-center">
    <v-menu
      v-model="showMenu"
      :close-on-content-click="false"
      location="bottom end"
      min-width="350"
      max-width="400"
      offset="5"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          icon
          v-bind="props"
          variant="text"
          class="notification-btn"
          :color="unreadCount > 0 ? 'primary' : undefined"
          @click="loadNotifications"
        >
          <v-badge
            :content="unreadCount"
            :model-value="unreadCount > 0"
            color="error"
            dot
          >
            <v-icon>mdi-bell</v-icon>
          </v-badge>
        </v-btn>
      </template>

      <v-card class="notification-panel">
        <v-card-title class="d-flex align-center">
          <span>Notifications</span>
          <v-spacer></v-spacer>
          <v-btn
            v-if="unreadCount > 0"
            size="small"
            variant="text"
            color="primary"
            :disabled="isLoading"
            @click="markAllAsRead"
          >
            Mark all read
          </v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text class="pa-0">
          <div v-if="isLoading" class="d-flex justify-center py-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>

          <div v-else-if="!notifications || notifications.length === 0" class="empty-state pa-4 text-center">
            <v-icon size="50" color="grey-lighten-1" icon="mdi-bell-off" class="mb-2"></v-icon>
            <div class="text-body-1">No notifications yet</div>
            <div class="text-caption text-medium-emphasis">
              We'll notify you of important updates
            </div>
          </div>

          <v-list v-else>
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              :class="{ 'unread': !notification.read }"
              @click="handleNotificationClick(notification)"
            >
              <!-- Notification Icon -->
              <template v-slot:prepend>
                <v-icon
                  :icon="getNotificationIcon(notification)"
                  :color="getNotificationColor(notification)"
                  size="24"
                  class="notification-icon"
                ></v-icon>
              </template>

              <!-- Notification Content -->
              <v-list-item-title>{{ notification.title }}</v-list-item-title>
              <v-list-item-subtitle class="text-wrap">
                {{ notification.message || notification.body }}
              </v-list-item-subtitle>
              
              <!-- Notification Time -->
              <template v-slot:append>
                <div class="d-flex flex-column align-end">
                  <div class="text-caption text-grey">{{ formatTime(notification.createdAt) }}</div>
                  <div class="mt-2 d-flex">
                    <v-btn
                      v-if="!notification.read"
                      icon
                      size="small"
                      variant="text"
                      color="primary"
                      @click.stop="markAsRead(notification.id)"
                    >
                      <v-icon>mdi-check</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      size="small"
                      variant="text"
                      color="grey"
                      class="ml-1"
                      @click.stop="removeNotification(notification.id)"
                    >
                      <v-icon>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="d-flex justify-space-between">
          <v-btn
            size="small"
            color="grey"
            variant="text"
            @click="clearAllNotifications"
          >
            Clear All
          </v-btn>
          <v-btn
            size="small"
            color="primary"
            variant="text"
            to="/notifications/settings"
            @click="showMenu = false"
          >
            Settings
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>

    <!-- Toast notification for important notifications -->
    <v-snackbar
      v-model="showToast"
      :timeout="5000"
      :color="toastColor"
      class="notification-toast"
      location="top"
    >
      {{ toastMessage }}
      <template v-slot:actions>
        <v-btn
          size="small"
          icon="mdi-close"
          variant="text"
          @click="showToast = false"
        ></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import { formatDistanceToNow } from 'date-fns';

export default {
  name: 'NotificationCenter',
  
  data() {
    return {
      showMenu: false,
      showToast: false,
      toastMessage: '',
      toastColor: 'primary',
      refreshInterval: null
    };
  },
  
  computed: {
    ...mapState('notifications', ['notifications', 'loading']),
    ...mapGetters('notifications', ['unreadNotifications', 'unreadCount']),
    
    isLoading() {
      return this.loading;
    }
  },
  
  methods: {
    ...mapActions('notifications', [
      'fetchNotifications',
      'markAsRead',
      'markAllAsRead',
      'deleteNotification',
      'handlePushNotification'
    ]),
    
    loadNotifications() {
      this.fetchNotifications();
    },
    
    handleNotificationClick(notification) {
      // Mark as read
      if (!notification.read) {
        this.markAsRead(notification.id);
      }
      
      // Navigate to appropriate page based on notification type
      let targetRoute = null;
      
      switch(notification.type) {
        case 'order_status':
          targetRoute = { name: 'OrderDetails', params: { id: notification.data.orderId } };
          break;
          
        case 'delivery_update':
          targetRoute = { name: 'OrderTracking', params: { id: notification.data.orderId } };
          break;
          
        case 'promotion':
          targetRoute = { name: 'Promotion', params: { id: notification.data.promotionId } };
          break;
          
        case 'restaurant_update':
          targetRoute = { name: 'RestaurantDetail', params: { id: notification.data.restaurantId } };
          break;
          
        case 'chat_message':
          targetRoute = { name: 'Chat', params: { id: notification.data.chatId } };
          break;
          
        default:
          // If notification has a custom URL
          if (notification.data && notification.data.url) {
            if (notification.data.url.startsWith('http')) {
              // External link
              window.open(notification.data.url, '_blank');
            } else {
              // Internal route
              this.$router.push(notification.data.url);
            }
          }
      }
      
      if (targetRoute) {
        this.$router.push(targetRoute);
      }
      
      this.showMenu = false;
    },
    
    removeNotification(id) {
      this.deleteNotification(id);
    },
    
    clearAllNotifications() {
      // Show confirmation dialog
      if (this.notifications && this.notifications.length > 0) {
        if (confirm('Are you sure you want to clear all notifications?')) {
          this.notifications.forEach(notification => {
            this.deleteNotification(notification.id);
          });
        }
      }
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      try {
        return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
      } catch (e) {
        console.error('Error formatting notification time:', e);
        return 'recently';
      }
    },
    
    getNotificationIcon(notification) {
      switch (notification.type) {
        case 'order_status':
          return 'mdi-food';
        case 'delivery_update':
          return 'mdi-truck-delivery';
        case 'promotion':
          return 'mdi-sale';
        case 'payment':
          return 'mdi-credit-card';
        case 'chat_message':
          return 'mdi-chat';
        case 'restaurant_update':
          return 'mdi-store';
        default:
          return 'mdi-bell';
      }
    },
    
    getNotificationColor(notification) {
      if (!notification.read) {
        switch (notification.type) {
          case 'order_status':
            return 'success';
          case 'delivery_update':
            return 'info';
          case 'promotion':
            return 'purple';
          case 'payment':
            return 'blue';
          case 'chat_message':
            return 'pink';
          default:
            return 'primary';
        }
      }
      return 'grey';
    },
    
    // Show toast notification for important notifications
    showToastNotification(notification) {
      this.toastMessage = `${notification.title}: ${notification.message || notification.body}`;
      this.toastColor = this.getNotificationColor(notification);
      this.showToast = true;
    },
    
    // Setup WebSocket and other event listeners for real-time notifications
    setupRealTimeListeners() {
      // Listen for notification events from WebSocket
      this.$root.$on('ws:notification', this.handleRealtimeNotification);
      
      // Listen for push messages
      navigator.serviceWorker?.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'notification') {
          this.handleRealtimeNotification(event.data.notification);
        }
      });
    },
    
    handleRealtimeNotification(notification) {
      // Process notification in store
      this.handlePushNotification(notification);
      
      // Show toast for important notifications
      const importantTypes = ['order_status', 'delivery_update', 'payment'];
      if (importantTypes.includes(notification.type)) {
        this.showToastNotification(notification);
      }
    }
  },
  
  mounted() {
    // Initial fetch of notifications
    this.loadNotifications();
    
    // Set up real-time notification listeners
    this.setupRealTimeListeners();
    
    // Refresh notifications every 5 minutes when app is active
    this.refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.loadNotifications();
      }
    }, 5 * 60 * 1000);
  },
  
  beforeUnmount() {
    // Clear refresh interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Remove event listeners
    this.$root.$off('ws:notification', this.handleRealtimeNotification);
  }
};
</script>

<style scoped>
.notification-panel {
  max-height: 80vh;
  overflow-y: auto;
}

.notification-icon {
  border-radius: 50%;
  padding: 8px;
  background-color: var(--v-surface-variant);
}

.unread {
  background-color: var(--v-primary-lighten-5);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.text-wrap {
  white-space: normal;
  word-break: break-word;
}

/* Animation for new notifications */
@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.notification-btn.new-notification {
  animation: pulse 1s ease-in-out;
}
</style>