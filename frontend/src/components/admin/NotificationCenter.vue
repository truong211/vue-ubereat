<!-- Admin notification center -->
<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :nudge-width="300"
    offset-y
    left
  >
    <template v-slot:activator="{ on, attrs }">
      <v-btn
        icon
        v-bind="attrs"
        v-on="on"
        :class="{ 'has-notifications': unreadCount > 0 }"
      >
        <v-badge
          :content="unreadCount"
          :value="unreadCount"
          color="error"
          overlap
        >
          <v-icon>mdi-bell</v-icon>
        </v-badge>
      </v-btn>
    </template>

    <v-card min-width="300" max-width="400">
      <v-card-title class="d-flex justify-space-between align-center">
        Notifications
        <v-btn
          small
          text
          color="primary"
          @click="markAllAsRead"
          :disabled="!hasUnread"
        >
          Mark all read
        </v-btn>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-0">
        <v-list two-line dense>
          <template v-if="notifications.length > 0">
            <template v-for="(notification, index) in notifications">
              <v-list-item
                :key="notification.id"
                :class="{ 'unread': !notification.read }"
                @click="handleNotificationClick(notification)"
              >
                <v-list-item-avatar>
                  <v-icon :color="getNotificationColor(notification.type)">
                    {{ getNotificationIcon(notification.type) }}
                  </v-icon>
                </v-list-item-avatar>

                <v-list-item-content>
                  <v-list-item-title>{{ notification.title }}</v-list-item-title>
                  <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>
                  <v-list-item-subtitle class="text-caption">
                    {{ formatTimestamp(notification.timestamp) }}
                  </v-list-item-subtitle>
                </v-list-item-content>

                <v-list-item-action>
                  <v-btn
                    icon
                    x-small
                    @click.stop="markAsRead(notification.id)"
                    v-if="!notification.read"
                  >
                    <v-icon small>mdi-check</v-icon>
                  </v-btn>
                </v-list-item-action>
              </v-list-item>

              <v-divider
                v-if="index < notifications.length - 1"
                :key="'div-' + notification.id"
              ></v-divider>
            </template>
          </template>
          
          <v-list-item v-else>
            <v-list-item-content>
              <v-list-item-title class="text-center grey--text">
                No notifications
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-card-actions class="justify-center">
        <v-btn
          text
          small
          color="primary"
          :loading="loading"
          @click="loadMore"
          v-if="hasMoreNotifications"
        >
          Load more
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-menu>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import { formatDistanceToNow } from 'date-fns';

export default {
  name: 'NotificationCenter',

  data() {
    return {
      menu: false,
      loading: false,
      page: 1,
      limit: 10,
      hasMoreNotifications: true
    };
  },

  computed: {
    ...mapState('admin', ['notifications']),
    ...mapGetters('admin', ['unreadNotifications']),
    
    unreadCount() {
      return this.unreadNotifications.length;
    },
    
    hasUnread() {
      return this.unreadCount > 0;
    }
  },

  methods: {
    ...mapActions('admin', [
      'markNotificationAsRead',
      'markAllNotificationsAsRead',
      'fetchNotifications'
    ]),

    getNotificationColor(type) {
      const colors = {
        RESTAURANT_APPLICATION: 'primary',
        RESTAURANT_STATUS: 'info',
        USER_REPORT: 'warning',
        ORDER_ISSUE: 'error',
        DELIVERY_ISSUE: 'orange',
        SYSTEM_ALERT: 'deep-purple'
      };
      return colors[type] || 'grey';
    },

    getNotificationIcon(type) {
      const icons = {
        RESTAURANT_APPLICATION: 'mdi-store-plus',
        RESTAURANT_STATUS: 'mdi-store',
        USER_REPORT: 'mdi-account-alert',
        ORDER_ISSUE: 'mdi-alert-circle',
        DELIVERY_ISSUE: 'mdi-truck-alert',
        SYSTEM_ALERT: 'mdi-server-alert'
      };
      return icons[type] || 'mdi-bell';
    },

    formatTimestamp(timestamp) {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    },

    async markAsRead(notificationId) {
      await this.markNotificationAsRead(notificationId);
    },

    async markAllAsRead() {
      await this.markAllNotificationsAsRead();
    },

    handleNotificationClick(notification) {
      // Mark as read
      if (!notification.read) {
        this.markAsRead(notification.id);
      }

      // Handle navigation based on notification type
      switch (notification.type) {
        case 'RESTAURANT_APPLICATION':
          this.$router.push(`/admin/restaurants/${notification.data.restaurantId}`);
          break;

        case 'USER_REPORT':
          this.$router.push(`/admin/users/${notification.data.reportedUserId}`);
          break;

        case 'ORDER_ISSUE':
        case 'DELIVERY_ISSUE':
          this.$router.push(`/admin/orders/${notification.data.orderId}`);
          break;

        case 'SYSTEM_ALERT':
          this.$router.push('/admin/system');
          break;
      }

      this.menu = false;
    },

    async loadMore() {
      this.loading = true;
      try {
        const { notifications, hasMore } = await this.fetchNotifications({
          page: this.page + 1,
          limit: this.limit
        });
        this.page++;
        this.hasMoreNotifications = hasMore;
      } catch (error) {
        console.error('Error loading more notifications:', error);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.has-notifications {
  animation: shake 0.82s cubic-bezier(.36,.07,.19,.97) both;
}

.unread {
  background-color: var(--v-primary-lighten5);
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}
</style>