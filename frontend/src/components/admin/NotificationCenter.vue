<template>
  <div class="notification-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom end"
      max-width="400"
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
            <v-icon>mdi-bell</v-icon>
          </v-badge>
        </v-btn>
      </template>

      <v-card>
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
            <template v-if="notifications.length">
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

export default {
  name: 'NotificationCenter',

  setup() {
    const router = useRouter();
    const toast = useToast();
    const menu = ref(false);
    const notifications = ref([]);
    const socket = ref(null);

    const unreadCount = computed(() => 
      notifications.value.filter(n => !n.read).length
    );

    const hasUnread = computed(() => unreadCount.value > 0);

    const addNotification = (notification) => {
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
      // Mark as read
      markAsRead(notification.id);

      // Navigate based on notification type
      switch (notification.type) {
        case 'promotion':
          router.push({
            name: 'admin-promotions',
            query: { highlight: notification.data.promotionId }
          });
          break;

        case 'campaign':
          router.push({
            name: 'admin-promotion-campaigns',
            query: { highlight: notification.data.campaignId }
          });
          break;
      }

      menu.value = false;
    };

    const markAsRead = async (id) => {
      const notification = notifications.value.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
    };

    const markAllRead = () => {
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
      return format(new Date(date), 'MMM d, h:mm a');
    };

    // Socket connection
    onMounted(() => {
      // Connect to WebSocket
      socket.value = new WebSocket(process.env.VUE_APP_WS_URL);
      
      socket.value.onmessage = (event) => {
        const { type, data } = JSON.parse(event.data);
        handleSocketMessage(type, data);
      };

      // Load initial notifications
      loadNotifications();
    });

    onBeforeUnmount(() => {
      if (socket.value) {
        socket.value.close();
      }
    });

    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/admin/notifications');
        const data = await response.json();
        notifications.value = data.notifications.map(n => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
      } catch (error) {
        console.error('Failed to load notifications:', error);
      }
    };

    return {
      menu,
      notifications,
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