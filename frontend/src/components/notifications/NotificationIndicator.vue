<template>
  <div class="notification-indicator">
    <v-badge
      :content="unreadCount.toString()"
      :model-value="unreadCount > 0"
      color="error"
      dot-color="error"
      offset-x="3"
      offset-y="3"
    >
      <v-btn
        icon
        variant="text"
        @click="toggleNotifications"
      >
        <v-icon>mdi-bell</v-icon>
      </v-btn>
    </v-badge>

    <v-navigation-drawer
      v-model="showNotifications"
      location="right"
      temporary
      width="400"
    >
      <v-toolbar class="pt-3 pb-3" color="primary" flat>
        <v-toolbar-title class="text-white">
          Notifications
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          v-if="unreadCount > 0"
          variant="text"
          class="text-white"
          size="small"
          @click="markAllAsRead"
        >
          Mark all as read
        </v-btn>
      </v-toolbar>

      <div 
        v-if="loading"
        class="d-flex justify-center align-center"
        style="height: 100px;"
      >
        <v-progress-circular indeterminate></v-progress-circular>
      </div>

      <div v-else-if="notifications.length === 0" class="text-center py-8">
        <v-icon icon="mdi-bell-off" size="64" color="grey-lighten-1"></v-icon>
        <div class="text-h6 mt-4">No notifications</div>
        <div class="text-subtitle-2 text-grey">
          You don't have any notifications at the moment
        </div>
      </div>

      <v-list v-else lines="three">
        <template v-for="(notification, index) in notifications" :key="notification.id">
          <v-list-item
            :class="{ 'unread': !notification.read }"
            @click="openNotification(notification)"
          >
            <template v-slot:prepend>
              <v-avatar :color="getNotificationColor(notification.type)" class="mr-3">
                <v-icon color="white">{{ getNotificationIcon(notification.type) }}</v-icon>
              </v-avatar>
            </template>

            <v-list-item-title>
              {{ notification.title }}
            </v-list-item-title>

            <v-list-item-subtitle class="text-wrap mt-1">
              {{ notification.message }}
              <div class="text-caption text-grey mt-1">
                {{ formatTime(notification.createdAt) }}
              </div>
            </v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                @click.stop="showMenu(notification, $event)"
              ></v-btn>
            </template>
          </v-list-item>

          <v-divider v-if="index < notifications.length - 1"></v-divider>
        </template>
      </v-list>

      <template v-slot:append>
        <div class="pa-2 d-flex justify-center">
          <v-btn
            variant="text"
            block
            to="/notifications"
            @click="showNotifications = false"
          >
            View All Notifications
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Context menu for notification actions -->
    <v-menu
      v-model="showContextMenu"
      :position-x="menuX"
      :position-y="menuY"
      absolute
    >
      <v-list density="compact">
        <v-list-item 
          v-if="selectedNotification && !selectedNotification.read"
          @click="markAsRead(selectedNotification.id); closeMenu()"
        >
          <template v-slot:prepend>
            <v-icon>mdi-check</v-icon>
          </template>
          <v-list-item-title>Mark as read</v-list-item-title>
        </v-list-item>

        <v-list-item 
          v-if="selectedNotification && selectedNotification.read"
          @click="markAsUnread(selectedNotification.id); closeMenu()"
        >
          <template v-slot:prepend>
            <v-icon>mdi-email-mark-as-unread</v-icon>
          </template>
          <v-list-item-title>Mark as unread</v-list-item-title>
        </v-list-item>

        <v-list-item @click="removeNotification(selectedNotification.id); closeMenu()">
          <template v-slot:prepend>
            <v-icon>mdi-delete</v-icon>
          </template>
          <v-list-item-title>Remove</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default {
  name: 'NotificationIndicator',
  
  data() {
    return {
      loading: false,
      showNotifications: false,
      showContextMenu: false,
      selectedNotification: null,
      menuX: 0,
      menuY: 0,
      limit: 5
    };
  },
  
  computed: {
    ...mapState('notifications', [
      'notifications',
      'unreadCount'
    ])
  },
  
  watch: {
    showNotifications(val) {
      if (val && this.notifications.length === 0) {
        this.loadNotifications();
      }
    }
  },
  
  methods: {
    ...mapActions('notifications', [
      'fetchNotifications',
      'markAsRead',
      'markAsUnread',
      'markAllAsRead',
      'removeNotification'
    ]),
    
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
      
      if (this.showNotifications) {
        this.loadNotifications();
      }
    },
    
    async loadNotifications() {
      this.loading = true;
      try {
        await this.fetchNotifications({ limit: this.limit });
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        this.loading = false;
      }
    },
    
    openNotification(notification) {
      // Mark as read
      if (!notification.read) {
        this.markAsRead(notification.id);
      }
      
      this.showNotifications = false;
      
      // Navigate based on notification type
      switch (notification.type) {
        case 'order_update':
          this.$router.push(`/orders/${notification.data.orderId}`);
          break;
          
        case 'delivery_update':
          this.$router.push(`/order-tracking/${notification.data.orderId}`);
          break;
          
        case 'promotion':
          this.$router.push(`/promotions/${notification.data.promotionId}`);
          break;
          
        case 'restaurant_update':
          this.$router.push(`/restaurants/${notification.data.restaurantId}`);
          break;
          
        case 'chat_message':
          this.$router.push(`/chat/${notification.data.chatId}`);
          break;
          
        default:
          if (notification.data && notification.data.url) {
            window.location = notification.data.url;
          }
      }
    },
    
    showMenu(notification, event) {
      this.selectedNotification = notification;
      this.menuX = event.clientX;
      this.menuY = event.clientY;
      this.showContextMenu = true;
    },
    
    closeMenu() {
      this.showContextMenu = false;
      this.selectedNotification = null;
    },
    
    formatTime(timestamp) {
      try {
        return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
      } catch (error) {
        return '';
      }
    },
    
    getNotificationColor(type) {
      switch (type) {
        case 'order_update':
          return 'success';
        case 'delivery_update':
          return 'primary';
        case 'promotion':
          return 'purple';
        case 'chat_message':
          return 'blue';
        case 'restaurant_update':
          return 'amber';
        default:
          return 'grey';
      }
    },
    
    getNotificationIcon(type) {
      switch (type) {
        case 'order_update':
          return 'mdi-receipt';
        case 'delivery_update':
          return 'mdi-truck-delivery';
        case 'promotion':
          return 'mdi-tag';
        case 'chat_message':
          return 'mdi-message';
        case 'restaurant_update':
          return 'mdi-store';
        default:
          return 'mdi-bell';
      }
    }
  }
};
</script>

<style scoped>
.notification-indicator {
  position: relative;
}

.unread {
  background-color: rgba(25, 118, 210, 0.05);
}
</style>