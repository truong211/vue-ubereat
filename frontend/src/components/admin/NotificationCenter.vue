<template>
  <div class="notification-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom end"
      max-width="400"
      :disabled="connectionError"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          icon
          v-bind="props"
          :color="hasUnread ? 'error' : undefined"
        >
          <v-badge
            :content="unreadCount"
            :model-value="unreadCount > 0"
            color="error"
          >
            <v-icon>{{ connectionError ? 'mdi-bell-off' : 'mdi-bell' }}</v-icon>
          </v-badge>
        </v-btn>
      </template>

      <v-card v-if="!isDestroyed" key="notification-menu">
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <span>Notifications</span>
          <v-btn
            v-if="hasUnread"
            variant="text"
            density="comfortable"
            @click="markAllRead"
          >
            Mark all read
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-0">
          <v-list lines="three">
            <template v-if="loading">
              <v-list-item>
                <template v-slot:prepend>
                  <v-skeleton-loader type="avatar" />
                </template>
                <v-skeleton-loader type="text" />
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-skeleton-loader type="avatar" />
                </template>
                <v-skeleton-loader type="text" />
              </v-list-item>
            </template>
            <template v-else-if="notifications.length">
              <v-list-item
                v-for="notification in notifications"
                :key="notification.id"
                :class="{ 'unread': !notification.read }"
                @click="handleNotificationClick(notification)"
              >
                <template v-slot:prepend>
                  <v-icon :color="getNotificationColor(notification)">
                    {{ getNotificationIcon(notification) }}
                  </v-icon>
                </template>

                <v-list-item-title>{{ notification.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>
                <v-list-item-subtitle class="text-caption">
                  {{ formatDate(notification.timestamp) }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-btn
                    v-if="!notification.read"
                    icon="mdi-check"
                    variant="text"
                    size="small"
                    @click.stop="markAsRead(notification.id)"
                  ></v-btn>
                </template>
              </v-list-item>
            </template>
            <v-list-item v-else>
              <v-list-item-title class="text-center text-medium-emphasis">
                No notifications
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { format } from 'date-fns';
import { useToast } from 'vue-toastification';
import axios from 'axios';
import { WS_URL, ENABLE_NOTIFICATIONS } from '@/config';

export default {
  name: 'NotificationCenter',
  emits: ['error'],

  setup(props, { emit }) {
    const router = useRouter();
    const toast = useToast();
    const menu = ref(false);
    const notifications = ref([]);
    const socket = ref(null);
    const loading = ref(true);
    const connectionError = ref(false);
    const isDestroyed = ref(false);

    const unreadCount = computed(() => 
      notifications.value.filter(n => !n.read).length
    );

    const hasUnread = computed(() => unreadCount.value > 0);

    const addNotification = (notification) => {
      if (isDestroyed.value) return;
      
      notifications.value.unshift({
        id: Date.now(),
        read: false,
        timestamp: new Date(),
        ...notification
      });

      // Show toast for important notifications
      if (notification.priority === 'high') {
        toast.info(notification.message, {
          timeout: 5000
        });
      }
    };

    const handleSocketMessage = (event, data) => {
      if (isDestroyed.value) return;
      
      let notification = {
        timestamp: new Date(),
        read: false
      };

      switch (event) {
        case 'promotion_alert':
          notification = {
            ...notification,
            type: 'promotion',
            title: 'Promotion Alert',
            message: data.message,
            icon: 'mdi-tag-alert',
            color: 'warning',
            priority: data.type === 'usage_limit' ? 'high' : 'normal',
            data: {
              promotionId: data.promotionId,
              code: data.code
            }
          };
          break;

        case 'campaign_alert':
          notification = {
            ...notification,
            type: 'campaign',
            title: 'Campaign Alert',
            message: data.message,
            icon: 'mdi-calendar-alert',
            color: data.type === 'budget_limit' ? 'error' : 'warning',
            priority: data.type === 'budget_limit' ? 'high' : 'normal',
            data: {
              campaignId: data.campaignId,
              name: data.name
            }
          };
          break;

        // ... handle other notification types ...
      }

      if (notification.type) {
        addNotification(notification);
      }
    };

    const handleNotificationClick = (notification) => {
      // Close menu first to prevent DOM manipulation issues during navigation
      menu.value = false;
      
      // Mark as read
      markAsRead(notification.id);

      // Use timeout to ensure menu is closed before navigation
      setTimeout(() => {
        // Navigate based on notification type
        try {
          if (isDestroyed.value) return;
          
          switch (notification.type) {
            case 'promotion':
              if (router && typeof router.push === 'function') {
              router.push({
                name: 'admin-promotions',
                  query: { highlight: notification.data?.promotionId }
                }).catch(err => console.error('Navigation error (handled):', err));
              }
              break;

            case 'campaign':
              if (router && typeof router.push === 'function') {
              router.push({
                name: 'admin-promotion-campaigns',
                  query: { highlight: notification.data?.campaignId }
                }).catch(err => console.error('Navigation error (handled):', err));
              }
              break;
            
            // Default fallback - no navigation
            default:
              console.log('No navigation for notification type:', notification.type);
          }
        } catch (error) {
          console.error('Navigation error:', error);
        }
      }, 100); // Longer delay to ensure DOM is settled
    };

    const markAsRead = async (id) => {
      if (isDestroyed.value) return;
      
      const notification = notifications.value.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
    };

    const markAllRead = () => {
      if (isDestroyed.value) return;
      
      notifications.value.forEach(notification => {
        notification.read = true;
      });
    };

    const getNotificationIcon = (notification) => {
      return notification.icon || 'mdi-bell';
    };

    const getNotificationColor = (notification) => {
      return notification.color || 'primary';
    };

    const formatDate = (date) => {
      try {
        return format(new Date(date), 'MMM d, h:mm a');
      } catch (error) {
        console.error('Error formatting date:', error);
        return '';
      }
    };

    const safeDisconnect = () => {
      try {
        if (socket.value && socket.value.readyState !== WebSocket.CLOSED) {
          socket.value.onclose = null; // Remove event handlers to prevent callbacks after component is unmounted
          socket.value.onerror = null;
          socket.value.onmessage = null;
          socket.value.onopen = null;
          socket.value.close();
        }
      } catch (err) {
        console.error('Error safely closing WebSocket:', err);
      } finally {
        socket.value = null;
      }
    };

    // Socket connection
    onMounted(() => {
      // Set isDestroyed to false when mounting
      isDestroyed.value = false;
      
      // Skip socket connection if notifications are disabled
      if (!ENABLE_NOTIFICATIONS) {
        console.info('Notifications are disabled. Skipping WebSocket connection.');
        // Load initial notifications anyway
        loadNotifications();
        return;
      }
      
      // Load initial notifications first
      loadNotifications();
      
      // Check if store has WebSocket connection
      try {
        // Try to use existing WebSocket from store instead of creating a new one
        const store = window.$store || inject('store');
        if (store && store.state.admin && store.state.admin.wsConnected) {
          console.log('Using existing WebSocket connection from store');
          connectionError.value = false;
          return;
        }
      } catch (err) {
        console.warn('Failed to check store for WebSocket connection:', err);
      }
      
      // Use a more resilient approach with try/catch and timeout
      const connectWebSocket = () => {
        try {
          // Connect to WebSocket - Fixed to use WS_URL from config
          socket.value = new WebSocket(WS_URL);
          
          socket.value.onopen = () => {
            if (isDestroyed.value) {
              safeDisconnect();
              return;
            }
            console.log('WebSocket connected');
            connectionError.value = false;
          };
          
          socket.value.onmessage = (event) => {
            if (isDestroyed.value) return;
            
            try {
              const { type, data } = JSON.parse(event.data);
              handleSocketMessage(type, data);
            } catch (err) {
              console.error('Error parsing WebSocket message:', err);
              // Continue operation even when error occurs - don't propagate errors that could break navigation
              emit('error', 'Failed to parse WebSocket message');
            }
          };
          
          socket.value.onerror = (error) => {
            if (isDestroyed.value) return;
            
            console.error('WebSocket error:', error);
            connectionError.value = true;
            emit('error', 'WebSocket connection error');
            
            // Attempt to safely close the socket to prevent further errors
            safeDisconnect();
          };
          
          socket.value.onclose = () => {
            if (isDestroyed.value) return;
            
            console.log('WebSocket connection closed');
            connectionError.value = true;
          };
        } catch (err) {
          console.error('Failed to connect to WebSocket:', err);
          connectionError.value = true;
          emit('error', 'Failed to establish WebSocket connection');
        }
      };
      
      // Delay WebSocket connection to avoid competing with other initialization processes
      setTimeout(() => {
        // Skip if component is destroyed or we have a store connection
        if (!isDestroyed.value && !connectionError.value) {
          try {
            const store = window.$store || inject('store');
            if (!(store && store.state.admin && store.state.admin.wsConnected)) {
              connectWebSocket();
            }
          } catch (err) {
            connectWebSocket();
          }
        }
      }, 1000);
    });

    onBeforeUnmount(() => {
      // Mark component as destroyed before cleaning up
      isDestroyed.value = true;
      // Clean up WebSocket connection
      safeDisconnect();
    });

    const loadNotifications = async () => {
      if (isDestroyed.value) return;
      
      try {
        loading.value = true;
        // Use axios instead of fetch for consistency
        const response = await axios.get('/api/admin/notifications');
        
        if (isDestroyed.value) return;
        
        // Check if the response has the expected structure
        if (response.data && Array.isArray(response.data.notifications)) {
          notifications.value = response.data.notifications.map(n => ({
            ...n,
            timestamp: new Date(n.timestamp)
          }));
        } else {
          // Fallback to empty array if no notifications or unexpected format
          notifications.value = [];
          console.warn('No notifications found or unexpected response format');
        }
      } catch (error) {
        if (isDestroyed.value) return;
        
        console.error('Failed to load notifications:', error);
        // Emit error to parent component
        emit('error', error.message || 'Failed to load notifications');
        
        // Add a default system notification about the error
        notifications.value = [{
          id: Date.now(),
          title: 'Notification Service',
          message: 'Unable to load notifications from server',
          type: 'system',
          priority: 'low',
          read: false,
          timestamp: new Date(),
          icon: 'mdi-bell-off',
          color: 'warning'
        }];
      } finally {
        if (!isDestroyed.value) {
          loading.value = false;
        }
      }
    };

    return {
      menu,
      notifications,
      loading,
      connectionError,
      unreadCount,
      hasUnread,
      handleNotificationClick,
      markAsRead,
      markAllRead,
      getNotificationIcon,
      getNotificationColor,
      formatDate
    };
  }
};
</script>

<style scoped>
.notification-center {
  position: relative;
}

.unread {
  background-color: var(--v-primary-lighten-5);
}

.v-list-item.unread:hover {
  background-color: var(--v-primary-lighten-4);
}

.v-list {
  max-height: 400px;
  overflow-y: auto;
}
</style>