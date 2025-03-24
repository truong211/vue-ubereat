<template>
  <div class="order-notifications">
    <!-- Notification Center -->
    <v-menu
      v-model="showNotifications"
      :close-on-content-click="false"
      location="bottom end"
      min-width="360"
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
                  :color="getNotificationColor(notification.type, notification.status)"
                  variant="tonal"
                  size="40"
                >
                  <v-icon :icon="getNotificationIcon(notification.type, notification.status)" color="white"></v-icon>
                </v-avatar>
              </template>
              
              <v-list-item-title class="font-weight-medium">
                {{ notification.title }}
              </v-list-item-title>
              
              <v-list-item-subtitle class="d-flex flex-column">
                <span>{{ notification.message }}</span>
                
                <!-- Action buttons for driver notifications -->
                <div v-if="notification.type === 'order_status' && notification.status === 'on_the_way' && notification.driverId" 
                     class="d-flex mt-1 notification-actions">
                  <v-btn
                    color="primary"
                    variant="text"
                    size="small"
                    density="compact"
                    @click.stop="contactDriver(notification.driverId, 'chat')"
                    class="px-2"
                  >
                    <v-icon size="small" class="mr-1">mdi-chat</v-icon>
                    Chat
                  </v-btn>
                  
                  <v-btn
                    color="success"
                    variant="text"
                    size="small"
                    density="compact"
                    @click.stop="contactDriver(notification.driverId, 'call')"
                    class="px-2"
                  >
                    <v-icon size="small" class="mr-1">mdi-phone</v-icon>
                    Call
                  </v-btn>
                </div>
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
        
        <div class="d-flex">
          <!-- Driver contact buttons when appropriate -->
          <template v-if="currentOrderStatus === 'on_the_way' && currentDriverId">
            <v-btn
              color="white"
              variant="text"
              size="small"
              @click="contactDriver(currentDriverId, 'chat')"
              class="mr-2"
            >
              <v-icon size="small" class="mr-1">mdi-chat</v-icon>
              Chat
            </v-btn>
          </template>
          
          <v-btn
            color="white"
            variant="text"
            @click="viewUpdatedOrder"
          >
            View
          </v-btn>
        </div>
      </div>
    </v-snackbar>
    
    <!-- Chat Dialog -->
    <v-dialog v-model="showChatDialog" width="400">
      <v-card v-if="selectedDriverId">
        <v-card-title class="d-flex align-center">
          <span>Chat with Driver</span>
          <v-spacer></v-spacer>
          <v-btn icon size="small" @click="showChatDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text class="chat-container pa-0">
          <order-chat-dialog
            :driver-id="selectedDriverId"
            :order-id="currentUpdatedOrder?.id"
            @close="showChatDialog = false"
          ></order-chat-dialog>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <!-- Call Dialog -->
    <v-dialog v-model="showCallDialog" width="300">
      <v-card v-if="selectedDriverId">
        <v-card-title class="text-center py-4">
          <v-icon size="large" color="success" class="mb-2">mdi-phone-in-talk</v-icon>
          <div class="text-h6 d-block w-100">Calling Driver...</div>
        </v-card-title>
        
        <v-card-text class="text-center pb-0">
          <v-btn color="error" @click="showCallDialog = false">
            <v-icon class="mr-1">mdi-phone-hangup</v-icon>
            End Call
          </v-btn>
        </v-card-text>
        
        <v-card-text class="text-center pt-0 text-caption text-grey">
          This is a simulated call feature
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import OrderChatDialog from './OrderChatDialog.vue';

export default {
  name: 'OrderNotifications',
  
  components: {
    OrderChatDialog
  },
  
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
    const currentOrderStatus = ref(null);
    const currentDriverId = ref(null);
    
    // Contact driver state
    const showChatDialog = ref(false);
    const showCallDialog = ref(false);
    const selectedDriverId = ref(null);
    
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
    
    // Get notification color based on type and status
    const getNotificationColor = (type, status) => {
      if (type === 'order_status') {
        const statusColors = {
          pending: 'warning',
          confirmed: 'info',
          preparing: 'info',
          ready: 'info',
          on_the_way: 'primary',
          delivered: 'success',
          cancelled: 'error'
        };
        return statusColors[status] || 'primary';
      }
      
      const colors = {
        order_delivered: 'success',
        order_cancelled: 'error',
        order_delayed: 'warning',
        promotion: 'purple',
        payment: 'green',
        system: 'grey'
      };
      
      return colors[type] || 'primary';
    };
    
    // Get notification icon based on type and status
    const getNotificationIcon = (type, status) => {
      if (type === 'order_status') {
        const statusIcons = {
          pending: 'mdi-clock-outline',
          confirmed: 'mdi-clipboard-check',
          preparing: 'mdi-food-outline',
          ready: 'mdi-food',
          on_the_way: 'mdi-bike-fast',
          delivered: 'mdi-check-circle',
          cancelled: 'mdi-cancel'
        };
        return statusIcons[status] || 'mdi-food';
      }
      
      const icons = {
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
      
      // Keep dialog open if interacting with contact buttons
      if (notification.type === 'order_status' && 
          notification.status === 'on_the_way' && 
          (showChatDialog.value || showCallDialog.value)) {
        return;
      }
      
      showNotifications.value = false;
      
      // Handle based on notification type
      if (notification.orderId) {
        router.push(`/orders/${notification.orderId}/tracking`);
      }
      
      emit('notification-clicked', notification);
    };
    
    // Contact driver
    const contactDriver = (driverId, method) => {
      selectedDriverId.value = driverId;
      
      if (method === 'chat') {
        showChatDialog.value = true;
        showCallDialog.value = false;
      } else if (method === 'call') {
        showCallDialog.value = true;
        showChatDialog.value = false;
      }
    };
    
    // View updated order
    const viewUpdatedOrder = () => {
      showStatusSnackbar.value = false;
      
      if (currentUpdatedOrder.value) {
        router.push(`/orders/${currentUpdatedOrder.value.id}/tracking`);
      }
    };
    
    // Helper to get detailed status message
    const getDetailedStatusMessage = (status, data) => {
      const statusMessages = {
        pending: 'Your order is awaiting confirmation from the restaurant.',
        confirmed: 'Great news! The restaurant has confirmed your order.',
        preparing: 'The restaurant is now preparing your delicious meal.',
        ready: 'Your food is ready for pickup! The driver will be on their way soon.',
        on_the_way: data && data.eta ? 
          `Your food is on the way! Estimated delivery in ${Math.round(data.eta)} minutes.` : 
          'Your food is on the way!',
        delivered: 'Your order has been delivered. Enjoy your meal!',
        cancelled: data && data.reason ? 
          `Your order has been cancelled. Reason: ${data.reason}` : 
          'Your order has been cancelled.'
      };
      
      return statusMessages[status] || 'Your order status has been updated.';
    };
    
    // Socket event listeners
    const setupEventListeners = () => {
      // Listen for order status updates
      store.subscribe((mutation, state) => {
        if (mutation.type === 'orderTracking/ADD_NOTIFICATION') {
          const notification = mutation.payload;
          
          // Show snackbar for order status updates
          if (notification.type === 'order_status') {
            statusSnackbarTitle.value = notification.title;
            statusSnackbarMessage.value = notification.message;
            statusSnackbarColor.value = getNotificationColor(notification.type, notification.status);
            currentUpdatedOrder.value = { id: notification.orderId };
            currentOrderStatus.value = notification.status;
            currentDriverId.value = notification.driverId;
            showStatusSnackbar.value = true;
            
            // Request permission and show browser notification
            if (Notification.permission === 'granted') {
              const browserNotification = new Notification(notification.title, {
                body: notification.message,
                icon: '/icons/icon-192x192.png'
              });
              
              browserNotification.onclick = () => {
                window.focus();
                router.push(`/orders/${notification.orderId}/tracking`);
              };
            } else if (Notification.permission !== 'denied') {
              Notification.requestPermission();
            }
          }
        }
      });
    };
    
    // Lifecycle hooks
    onMounted(() => {
      setupEventListeners();
    });
    
    onBeforeUnmount(() => {
      showStatusSnackbar.value = false;
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
      currentOrderStatus,
      currentDriverId,
      showChatDialog,
      showCallDialog,
      selectedDriverId,
      formatTimeAgo,
      getNotificationColor,
      getNotificationIcon,
      markAllAsRead,
      openNotification,
      viewUpdatedOrder,
      contactDriver
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
  background-color: var(--v-theme-surface-bright);
}

.notification-actions {
  margin-top: 4px;
}

.chat-container {
  height: 400px;
}
</style>