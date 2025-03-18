<template>
  <div class="order-notifications">
    <!-- Notification Center -->
    <v-menu
      v-model="showNotifications"
      :close-on-content-click="false"
      location="bottom end"
      min-width="320"
      offset="10"
    >
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          icon
          variant="text"
          class="position-relative"
        >
          <v-icon>mdi-bell</v-icon>
          <v-badge
            v-if="unreadCount > 0"
            color="error"
            :content="unreadCount > 9 ? '9+' : unreadCount"
            floating
          ></v-badge>
        </v-btn>
      </template>
      
      <v-card>
        <v-card-title class="d-flex align-center px-4 py-3">
          <span class="text-h6">Notifications</span>
          <v-spacer></v-spacer>
          <v-btn
            v-if="unreadCount > 0"
            variant="text"
            size="small"
            @click="markAllAsRead"
          >
            Mark all as read
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <div class="pa-0">
          <v-list
            v-if="notifications && notifications.length > 0"
            class="notification-list"
            lines="two"
          >
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              :class="{ 'unread': !notification.read }"
              :ripple="false"
              @click="openNotification(notification)"
            >
              <template v-slot:prepend>
                <v-avatar
                  :color="getNotificationColor(notification.type)"
                  variant="tonal"
                  size="40"
                >
                  <v-icon :icon="getNotificationIcon(notification.type)" color="white"></v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title class="font-weight-medium">
                {{ notification.title }}
              </v-list-item-title>
              
              <v-list-item-subtitle>
                {{ notification.message }}
              </v-list-item-subtitle>
              
              <template v-slot:append>
                <div class="text-caption text-grey">
                  {{ formatTimeAgo(notification.timestamp) }}
                </div>
              </template>
            </v-list-item>
          </v-list>
          
          <div v-else class="pa-4 text-center">
            <v-icon
              icon="mdi-bell-off-outline"
              size="64"
              color="grey-lighten-2"
              class="mb-3"
            ></v-icon>
            <div class="text-subtitle-1 mb-2">No notifications</div>
            <div class="text-caption text-grey">
              You'll see updates on your orders here
            </div>
          </div>
        </div>
      </v-card>
    </v-menu>

    <!-- New Order Status Snackbar -->
    <v-snackbar
      v-model="showStatusSnackbar"
      :color="statusSnackbarColor"
      timeout="6000"
      location="top"
    >
      <div class="d-flex align-center">
        <div>
          <div class="text-subtitle-2 mb-1">{{ statusSnackbarTitle }}</div>
          <div class="text-caption">{{ statusSnackbarMessage }}</div>
        </div>
        
        <v-spacer></v-spacer>
        
        <v-btn
          v-if="currentUpdatedOrder"
          color="white"
          variant="text"
          @click="viewUpdatedOrder"
        >
          View
        </v-btn>
      </div>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'OrderNotifications',
  
  emits: ['notification-clicked'],
  
  setup(props, { emit }) {
    const store = useStore();
    const router = useRouter();
    
    // State
    const showNotifications = ref(false);
    const showStatusSnackbar = ref(false);
    const statusSnackbarTitle = ref('');
    const statusSnackbarMessage = ref('');
    const statusSnackbarColor = ref('success');
    const currentUpdatedOrder = ref(null);
    
    // Get notifications from store
    const notifications = computed(() => {
      return store.state.orderTracking.notifications || [];
    });
    
    // Count unread notifications
    const unreadCount = computed(() => {
      return notifications.value.filter(n => !n.read).length;
    });
    
    // Format time ago
    const formatTimeAgo = (timestamp) => {
      if (!timestamp) return '';
      
      const now = new Date();
      const date = new Date(timestamp);
      const diff = Math.floor((now - date) / 1000); // seconds
      
      if (diff < 60) {
        return 'Just now';
      } else if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        return `${mins} minute${mins > 1 ? 's' : ''} ago`;
      } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else {
        const days = Math.floor(diff / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
      }
    };
    
    // Get notification color based on type
    const getNotificationColor = (type) => {
      const colors = {
        order_status: 'primary',
        order_delivered: 'success',
        order_cancelled: 'error',
        order_delayed: 'warning',
        promotion: 'purple',
        payment: 'green',
        system: 'grey'
      };
      
      return colors[type] || 'primary';
    };
    
    // Get notification icon based on type
    const getNotificationIcon = (type) => {
      const icons = {
        order_status: 'mdi-food',
        order_delivered: 'mdi-check-circle',
        order_cancelled: 'mdi-cancel',
        order_delayed: 'mdi-clock-alert',
        promotion: 'mdi-tag',
        payment: 'mdi-credit-card',
        system: 'mdi-information'
      };
      
      return icons[type] || 'mdi-bell';
    };
    
    // Mark notification as read
    const markAsRead = (notification) => {
      if (!notification.read) {
        store.dispatch('orderTracking/markNotificationRead', notification.id);
      }
    };
    
    // Mark all notifications as read
    const markAllAsRead = () => {
      store.dispatch('orderTracking/markAllNotificationsRead');
    };
    
    // Open notification
    const openNotification = (notification) => {
      markAsRead(notification);
      showNotifications.value = false;
      
      // Handle based on notification type
      if (notification.orderId) {
        router.push(`/orders/${notification.orderId}`);
      }
      
      emit('notification-clicked', notification);
    };
    
    // View updated order
    const viewUpdatedOrder = () => {
      showStatusSnackbar.value = false;
      
      if (currentUpdatedOrder.value) {
        router.push(`/orders/${currentUpdatedOrder.value.id}`);
      }
    };
    
    // Socket event listeners
    const setupEventListeners = () => {
      // Listen for order status updates
      store.subscribe((mutation, state) => {
        if (mutation.type === 'orderTracking/ADD_NOTIFICATION') {
          // Show snackbar for new notifications
          const notification = mutation.payload;
          
          if (notification && notification.type === 'order_status') {
            statusSnackbarTitle.value = notification.title;
            statusSnackbarMessage.value = notification.message;
            statusSnackbarColor.value = getNotificationColor(notification.type);
            showStatusSnackbar.value = true;
            
            if (notification.orderId) {
              currentUpdatedOrder.value = { id: notification.orderId };
            }
          }
        }
      });
    };
    
    // Lifecycle hooks
    onMounted(() => {
      setupEventListeners();
      store.dispatch('orderTracking/loadNotifications');
    });
    
    return {
      showNotifications,
      notifications,
      unreadCount,
      showStatusSnackbar,
      statusSnackbarTitle,
      statusSnackbarMessage,
      statusSnackbarColor,
      currentUpdatedOrder,
      
      formatTimeAgo,
      getNotificationColor,
      getNotificationIcon,
      markAsRead,
      markAllAsRead,
      openNotification,
      viewUpdatedOrder
    };
  }
};
</script>

<style scoped>
.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.unread {
  background-color: var(--v-primary-lighten-5, rgba(25, 118, 210, 0.05));
}

.v-list-item__prepend {
  align-self: flex-start;
  margin-top: 8px;
}
</style>