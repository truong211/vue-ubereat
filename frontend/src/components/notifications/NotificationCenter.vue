<template>
  <div class="notification-center">
    <v-menu
      v-model="showMenu"
      :close-on-content-click="false"
      location="bottom end"
      max-width="400"
      offset="4"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="text"
          :color="unreadCount > 0 ? 'primary' : undefined"
        >
          <v-badge
            :content="unreadCount"
            :model-value="unreadCount > 0"
            color="error"
          >
            <v-icon>mdi-bell-outline</v-icon>
          </v-badge>
        </v-btn>
      </template>

      <v-card elevation="4" class="notification-dropdown">
        <v-card-title class="py-3 px-4 d-flex align-center bg-grey-lighten-4">
          <span class="text-subtitle-1">Notifications</span>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            size="small"
            :disabled="!hasUnread"
            @click="markAllAsRead"
            class="text-caption"
          >
            Mark all as read
          </v-btn>
        </v-card-title>

        <v-card-text class="pa-0">
          <!-- Loading State -->
          <div v-if="loading" class="pa-4 text-center">
            <v-progress-circular indeterminate color="primary" size="24" class="mb-2"></v-progress-circular>
            <div class="text-body-2">Loading notifications...</div>
          </div>
          
          <!-- Empty State -->
          <div v-else-if="!hasNotifications" class="pa-6 text-center">
            <v-icon icon="mdi-bell-sleep-outline" size="36" color="grey-lighten-1" class="mb-2"></v-icon>
            <div class="text-subtitle-1 font-weight-medium mb-1">No notifications</div>
            <div class="text-body-2 text-medium-emphasis">
              You don't have any notifications yet.
            </div>
          </div>
          
          <!-- Notification List -->
          <v-list v-else density="compact" class="notification-list">
            <template v-for="(notification, index) in recentNotifications" :key="notification.id">
              <v-list-item
                :class="{ 'unread': !notification.read }"
                @click="openNotification(notification)"
                :ripple="true"
                class="notification-item py-2"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getNotificationColor(notification.type)" size="36" class="mr-3">
                    <v-icon :icon="getNotificationIcon(notification.type)" color="white" size="small"></v-icon>
                  </v-avatar>
                </template>
                
                <v-list-item-title class="text-body-2 font-weight-medium mb-1">
                  {{ notification.title }}
                </v-list-item-title>
                
                <v-list-item-subtitle class="text-caption mb-1">
                  {{ notification.message }}
                </v-list-item-subtitle>
                
                <v-list-item-subtitle class="text-caption text-grey">
                  {{ formatNotificationTime(notification.createdAt) }}
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <v-btn
                    v-if="!notification.read"
                    icon="mdi-email-open-outline"
                    variant="text"
                    size="x-small"
                    color="primary"
                    @click.stop="markAsRead(notification.id)"
                    title="Mark as read"
                  ></v-btn>
                </template>
              </v-list-item>
              
              <v-divider v-if="index < recentNotifications.length - 1"></v-divider>
            </template>
          </v-list>
        </v-card-text>
        
        <v-divider v-if="hasNotifications"></v-divider>
        
        <v-card-actions v-if="hasNotifications" class="justify-center py-2 bg-grey-lighten-4">
          <v-btn
            variant="text"
            color="primary"
            to="/profile/notifications"
            @click="showMenu = false"
            size="small"
          >
            View All Notifications
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';

export default {
  name: 'NotificationCenter',
  
  data() {
    return {
      showMenu: false,
      maxNotificationsToShow: 5
    };
  },
  
  computed: {
    ...mapState('notifications', ['notifications', 'loading']),
    ...mapGetters('notifications', ['unreadCount']),
    
    hasNotifications() {
      return this.notifications && this.notifications.length > 0;
    },
    
    hasUnread() {
      return this.unreadCount > 0;
    },
    
    recentNotifications() {
      if (!this.notifications) return [];
      return this.notifications.slice(0, this.maxNotificationsToShow);
    }
  },
  
  methods: {
    ...mapActions('notifications', [
      'fetchNotifications', 
      'markAsRead', 
      'markAllAsRead'
    ]),
    
    openNotification(notification) {
      // Mark as read
      if (!notification.read) {
        this.markAsRead(notification.id);
      }
      
      // Close the menu
      this.showMenu = false;
      
      // Navigate based on notification type
      if (!notification.data) return;
      
      switch (notification.type) {
        case 'order_status':
          if (notification.data.orderId) {
            this.$router.push(`/orders/${notification.data.orderId}`);
          }
          break;
          
        case 'driver_location':
          if (notification.data.orderId) {
            this.$router.push(`/orders/${notification.data.orderId}/tracking`);
          }
          break;
          
        case 'promotion':
          if (notification.data.promotionId) {
            this.$router.push(`/promotions/${notification.data.promotionId}`);
          }
          break;
          
        case 'marketing':
          if (notification.data.url) {
            if (notification.data.url.startsWith('http')) {
              window.open(notification.data.url, '_blank');
            } else {
              this.$router.push(notification.data.url);
            }
          }
          break;
      }
    },
    
    getNotificationIcon(type) {
      switch (type) {
        case 'order_status':
          return 'mdi-food';
        case 'driver_location':
          return 'mdi-map-marker';
        case 'promotion':
          return 'mdi-tag-outline';
        case 'marketing':
          return 'mdi-bullhorn';
        case 'system':
          return 'mdi-information-outline';
        default:
          return 'mdi-bell-outline';
      }
    },
    
    getNotificationColor(type) {
      switch (type) {
        case 'order_status':
          return 'success';
        case 'driver_location':
          return 'info';
        case 'promotion':
          return 'warning';
        case 'marketing':
          return 'purple';
        case 'system':
          return 'grey';
        default:
          return 'primary';
      }
    },
    
    formatNotificationTime(timestamp) {
      if (!timestamp) return '';
      
      const now = new Date();
      const notificationDate = new Date(timestamp);
      const diffInMs = now - notificationDate;
      const diffInMinutes = Math.floor(diffInMs / 60000);
      const diffInHours = Math.floor(diffInMinutes / 60);
      const diffInDays = Math.floor(diffInHours / 24);
      
      if (diffInMinutes < 1) {
        return 'Just now';
      } else if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
      } else if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
      } else if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return notificationDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  },
  
  async mounted() {
    // Load notifications when component mounts
    if (!this.notifications || this.notifications.length === 0) {
      await this.fetchNotifications({
        page: 1,
        limit: this.maxNotificationsToShow
      });
    }
  },
  
  watch: {
    // Fetch notifications when dropdown is opened
    showMenu(isOpen) {
      if (isOpen) {
        this.fetchNotifications({
          page: 1,
          limit: this.maxNotificationsToShow
        });
      }
    }
  }
};
</script>

<style scoped>
.notification-dropdown {
  max-height: 80vh;
  overflow-y: auto;
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.notification-item.unread {
  background-color: rgba(var(--v-theme-primary), 0.08);
}
</style>