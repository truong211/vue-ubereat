<template>
  <div class="notification-center">
    <v-card>
      <v-card-title class="d-flex align-center">
        Notifications
        <v-spacer></v-spacer>
        <v-btn
          v-if="unreadCount > 0"
          variant="text"
          density="comfortable"
          size="small"
          @click="markAllAsRead"
        >
          Mark all as read
        </v-btn>
        <v-btn
          icon="mdi-cog"
          variant="text"
          size="small"
          @click="showSettings"
          class="ml-2"
        ></v-btn>
      </v-card-title>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>

      <!-- Empty State -->
      <v-card-text v-else-if="notifications.length === 0" class="text-center py-6">
        <v-icon icon="mdi-bell-off-outline" size="64" color="grey-lighten-1"></v-icon>
        <div class="text-h6 mt-4">No notifications</div>
        <div class="text-body-2 text-grey">
          You don't have any notifications at the moment.
        </div>
      </v-card-text>

      <!-- Notification Filters -->
      <v-card-text v-else class="pt-0 pb-0">
        <v-chip-group
          v-model="activeFilter"
          selected-class="primary"
          class="mb-2"
        >
          <v-chip
            value="all"
            variant="outlined"
            filter
          >
            All
          </v-chip>
          <v-chip
            value="order_update"
            variant="outlined"
            filter
          >
            Orders
          </v-chip>
          <v-chip
            value="delivery_update"
            variant="outlined"
            filter
          >
            Delivery
          </v-chip>
          <v-chip
            value="promotion"
            variant="outlined"
            filter
          >
            Promotions
          </v-chip>
          <v-chip
            value="chat_message"
            variant="outlined"
            filter
          >
            Messages
          </v-chip>
        </v-chip-group>

        <!-- Notifications List -->
        <v-list class="notification-list">
          <template v-for="(notification, index) in filteredNotifications" :key="notification.id">
            <v-list-item
              :class="[
                'notification-item',
                { 'unread': !notification.read }
              ]"
              @click="openNotification(notification)"
            >
              <template v-slot:prepend>
                <v-avatar
                  :color="getNotificationColor(notification.type)"
                  class="mr-3"
                  size="40"
                >
                  <v-icon color="white" :icon="getNotificationIcon(notification.type)"></v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="text-subtitle-1 font-weight-medium">
                {{ notification.title }}
              </v-list-item-title>

              <v-list-item-subtitle class="text-body-2 mt-1">
                {{ notification.message }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="text-caption text-grey">
                  {{ formatTime(notification.createdAt) }}
                </div>
                <v-btn
                  icon="mdi-dots-vertical"
                  variant="text"
                  size="small"
                  @click.stop="showNotificationMenu(notification, $event)"
                ></v-btn>
              </template>
            </v-list-item>

            <v-divider
              v-if="index < filteredNotifications.length - 1"
              :key="`divider-${notification.id}`"
            ></v-divider>
          </template>
        </v-list>
      </v-card-text>

      <!-- Pagination -->
      <v-card-actions v-if="notifications.length > 0">
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          :disabled="loading || page === 1"
          @click="loadPreviousPage"
        >
          Previous
        </v-btn>
        <span class="text-body-2">Page {{ page }} of {{ totalPages }}</span>
        <v-btn
          variant="text"
          :disabled="loading || page === totalPages || totalPages === 0"
          @click="loadNextPage"
        >
          Next
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>

    <!-- Notification Menu -->
    <v-menu
      v-model="showMenu"
      :position-x="menuX"
      :position-y="menuY"
      absolute
    >
      <v-list>
        <v-list-item @click="markAsRead(selectedNotification)" v-if="selectedNotification && !selectedNotification.read">
          <template v-slot:prepend>
            <v-icon icon="mdi-check"></v-icon>
          </template>
          <v-list-item-title>Mark as read</v-list-item-title>
        </v-list-item>

        <v-list-item @click="markAsUnread(selectedNotification)" v-if="selectedNotification && selectedNotification.read">
          <template v-slot:prepend>
            <v-icon icon="mdi-email-mark-as-unread"></v-icon>
          </template>
          <v-list-item-title>Mark as unread</v-list-item-title>
        </v-list-item>

        <v-list-item @click="deleteNotification(selectedNotification)" v-if="selectedNotification">
          <template v-slot:prepend>
            <v-icon icon="mdi-delete"></v-icon>
          </template>
          <v-list-item-title>Delete</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default {
  name: 'NotificationCenter',
  
  props: {
    limit: {
      type: Number,
      default: 10
    }
  },
  
  data() {
    return {
      loading: false,
      page: 1,
      totalPages: 0,
      activeFilter: 'all',
      showMenu: false,
      menuX: 0,
      menuY: 0,
      selectedNotification: null
    };
  },
  
  computed: {
    ...mapState('notifications', [
      'notifications',
      'unreadCount',
      'totalCount'
    ]),
    
    filteredNotifications() {
      if (this.activeFilter === 'all') {
        return this.notifications;
      }
      
      return this.notifications.filter(notification => 
        notification.type === this.activeFilter
      );
    }
  },
  
  methods: {
    ...mapActions('notifications', [
      'fetchNotifications', 
      'markAsRead',
      'markAsUnread',
      'markAllAsRead',
      'deleteNotification'
    ]),
    
    async loadNotifications() {
      this.loading = true;
      try {
        const result = await this.fetchNotifications({
          page: this.page,
          limit: this.limit
        });
        this.totalPages = Math.ceil(result.totalCount / this.limit);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadNextPage() {
      if (this.page < this.totalPages) {
        this.page += 1;
        await this.loadNotifications();
      }
    },
    
    async loadPreviousPage() {
      if (this.page > 1) {
        this.page -= 1;
        await this.loadNotifications();
      }
    },
    
    openNotification(notification) {
      // If notification is unread, mark it as read
      if (!notification.read) {
        this.markAsRead(notification.id);
      }
      
      // Handle different notification types
      switch (notification.type) {
        case 'order_update':
          this.$router.push(`/orders/${notification.data.orderId}`);
          break;
          
        case 'delivery_update':
          this.$router.push(`/order-tracking/${notification.data.orderId}`);
          break;
          
        case 'promotion':
          this.$router.push(`/promotions/${notification.data.promoId}`);
          break;
          
        case 'chat_message':
          this.$router.push(`/chat/${notification.data.chatId}`);
          break;
          
        case 'restaurant_update':
          this.$router.push(`/restaurants/${notification.data.restaurantId}`);
          break;
          
        default:
          // If we have a URL in the notification data, navigate to it
          if (notification.data && notification.data.url) {
            window.open(notification.data.url, '_blank');
          }
      }
    },
    
    showNotificationMenu(notification, event) {
      this.selectedNotification = notification;
      this.menuX = event.clientX;
      this.menuY = event.clientY;
      this.showMenu = true;
    },
    
    formatTime(timestamp) {
      try {
        return formatDistanceToNow(parseISO(timestamp), { addSuffix: true });
      } catch (error) {
        return 'Unknown time';
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
    },
    
    showSettings() {
      this.$router.push('/account/notifications');
    }
  },
  
  async created() {
    await this.loadNotifications();
  }
}
</script>

<style scoped>
.notification-center {
  max-width: 600px;
  margin: 0 auto;
}

.notification-item {
  padding: 12px 16px;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.notification-item.unread {
  background-color: rgba(25, 118, 210, 0.05);
}

.notification-list {
  max-height: 500px;
  overflow-y: auto;
}
</style>