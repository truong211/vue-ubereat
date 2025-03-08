<template>
  <v-container>
    <h1 class="text-h4 mb-6">Your Notifications</h1>
    
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>All Notifications</span>
        <v-spacer></v-spacer>
        <v-chip
          v-if="unreadCount > 0"
          color="primary"
          size="small"
          class="mr-2"
        >
          {{ unreadCount }} unread
        </v-chip>
        <v-btn
          variant="text"
          color="primary"
          size="small"
          prepend-icon="mdi-check-all"
          @click="markAllAsRead"
          :disabled="unreadCount === 0"
        >
          Mark all as read
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="py-3">
        <!-- Filter Controls -->
        <div class="d-flex flex-wrap align-center mb-4">
          <v-select
            v-model="filterType"
            label="Type"
            :items="typeOptions"
            variant="outlined"
            density="compact"
            hide-details
            class="mr-3 mb-2"
            style="max-width: 200px;"
          ></v-select>
          
          <v-select
            v-model="filterTimeRange"
            label="Time Range"
            :items="timeRangeOptions"
            variant="outlined"
            density="compact"
            hide-details
            class="mr-3 mb-2"
            style="max-width: 150px;"
          ></v-select>
          
          <v-checkbox
            v-model="showReadNotifications"
            label="Show read notifications"
            hide-details
            density="compact"
            class="mr-3 mb-2"
          ></v-checkbox>
          
          <v-btn
            variant="text"
            color="primary"
            size="small"
            @click="resetFilters"
            class="mb-2"
          >
            Reset Filters
          </v-btn>
        </div>
        
        <!-- Notifications List -->
        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="mt-2">Loading notifications...</div>
        </div>
        
        <template v-else>
          <div v-if="filteredNotifications.length === 0" class="text-center py-6">
            <v-icon size="64" color="grey-lighten-2">mdi-bell-outline</v-icon>
            <h3 class="text-h6 mt-4 text-grey-darken-1">No notifications found</h3>
            <p class="text-body-1 mt-2 text-grey-darken-1">
              {{ getEmptyStateMessage() }}
            </p>
          </div>
          
          <div v-else>
            <div 
              v-for="group in groupedNotifications" 
              :key="group.date"
              class="mb-4"
            >
              <div class="text-subtitle-1 font-weight-bold mb-2">{{ group.label }}</div>
              
              <v-card
                v-for="notification in group.notifications"
                :key="notification.id"
                variant="outlined"
                :class="[
                  'mb-3 notification-card', 
                  { 'unread': !notification.read }
                ]"
                @click="openNotification(notification)"
              >
                <v-card-item>
                  <template v-slot:prepend>
                    <v-avatar
                      :color="getNotificationColor(notification.type)"
                      size="40"
                    >
                      <v-icon color="white">{{ getNotificationIcon(notification.type) }}</v-icon>
                    </v-avatar>
                  </template>
                  
                  <v-card-title>
                    {{ notification.title }}
                    <v-icon 
                      v-if="!notification.read" 
                      color="primary" 
                      size="small" 
                      class="ml-2"
                    >
                      mdi-circle-small
                    </v-icon>
                  </v-card-title>
                  
                  <v-card-subtitle>
                    {{ formatTime(notification.timestamp) }}
                  </v-card-subtitle>
                </v-card-item>
                
                <v-card-text class="pt-0">
                  <p>{{ notification.message }}</p>
                </v-card-text>
                
                <v-card-actions>
                  <v-spacer></v-spacer>
                  
                  <v-btn
                    v-if="notification.action"
                    size="small"
                    variant="text"
                    :color="getNotificationColor(notification.type)"
                    @click.stop="handleAction(notification)"
                  >
                    {{ notification.action.text }}
                  </v-btn>
                  
                  <v-btn
                    v-if="!notification.read"
                    size="small"
                    variant="text"
                    color="primary"
                    @click.stop="markAsRead(notification.id)"
                  >
                    Mark as read
                  </v-btn>
                  
                  <v-btn
                    size="small"
                    variant="text"
                    color="grey"
                    icon
                    @click.stop="deleteNotification(notification.id)"
                  >
                    <v-icon>mdi-delete-outline</v-icon>
                  </v-btn>
                </v-card-actions>
              </v-card>
            </div>
            
            <div class="text-center mt-4" v-if="hasMoreNotifications">
              <v-btn
                variant="outlined"
                color="primary"
                @click="loadMoreNotifications"
                :loading="loadingMore"
              >
                Load More
              </v-btn>
            </div>
          </div>
        </template>
      </v-card-text>
    </v-card>
    
    <!-- Notification Settings Dialog -->
    <v-dialog v-model="showSettingsDialog" max-width="500">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          color="primary"
          variant="outlined"
          class="mt-6"
          prepend-icon="mdi-cog"
        >
          Notification Settings
        </v-btn>
      </template>
      
      <v-card>
        <v-card-title>Notification Settings</v-card-title>
        <v-card-text>
          <h3 class="text-subtitle-1 mb-3">Delivery Updates</h3>
          
          <v-checkbox
            v-model="settings.orderStatus"
            label="Order status changes"
            hide-details
            class="mb-2"
          ></v-checkbox>
          
          <v-checkbox
            v-model="settings.driverLocation"
            label="Driver location updates"
            hide-details
            class="mb-2"
          ></v-checkbox>
          
          <v-divider class="my-4"></v-divider>
          
          <h3 class="text-subtitle-1 mb-3">Marketing</h3>
          
          <v-checkbox
            v-model="settings.promotions"
            label="Promotions and offers"
            hide-details
            class="mb-2"
          ></v-checkbox>
          
          <v-checkbox
            v-model="settings.newRestaurants"
            label="New restaurants in your area"
            hide-details
            class="mb-2"
          ></v-checkbox>
          
          <v-divider class="my-4"></v-divider>
          
          <h3 class="text-subtitle-1 mb-3">Notification Methods</h3>
          
          <v-checkbox
            v-model="settings.email"
            label="Email notifications"
            hide-details
            class="mb-2"
          ></v-checkbox>
          
          <v-checkbox
            v-model="settings.push"
            label="Browser notifications"
            hide-details
            class="mb-2"
          ></v-checkbox>
          
          <v-checkbox
            v-model="settings.sms"
            label="SMS notifications"
            hide-details
            class="mb-2"
          ></v-checkbox>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showSettingsDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveSettings"
          >
            Save Settings
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Notification</v-card-title>
        <v-card-text>
          Are you sure you want to delete this notification? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';

export default {
  name: 'UserNotifications',
  
  setup() {
    const store = useStore();
    const router = useRouter();
    
    // State
    const loading = ref(true);
    const loadingMore = ref(false);
    const notifications = ref([]);
    const showSettingsDialog = ref(false);
    const showDeleteDialog = ref(false);
    const notificationToDelete = ref(null);
    const page = ref(1);
    const hasMoreNotifications = ref(false);
    
    // Filters
    const filterType = ref('all');
    const filterTimeRange = ref('all');
    const showReadNotifications = ref(true);
    
    const typeOptions = [
      { title: 'All Types', value: 'all' },
      { title: 'Order Updates', value: 'order_status' },
      { title: 'Promotions', value: 'promo' },
      { title: 'Account', value: 'account' }
    ];
    
    const timeRangeOptions = [
      { title: 'All Time', value: 'all' },
      { title: 'Today', value: 'today' },
      { title: 'This Week', value: 'week' },
      { title: 'This Month', value: 'month' }
    ];
    
    // Settings
    const settings = ref({
      orderStatus: true,
      driverLocation: true,
      promotions: true,
      newRestaurants: true,
      email: true,
      push: true,
      sms: false
    });
    
    // Get notifications from store
    const fetchNotifications = async () => {
      loading.value = true;
      
      try {
        // In a real app, this would be an API call
        // const response = await axios.get('/api/notifications');
        // notifications.value = response.data.notifications;
        
        // For demo purposes, use mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        notifications.value = generateMockNotifications();
        
        // Store notification settings
        await loadSettings();
        
        // Check if we have more notifications (for pagination)
        hasMoreNotifications.value = notifications.value.length > 10;
        
        // Initial page shows 10 notifications
        if (hasMoreNotifications.value) {
          notifications.value = notifications.value.slice(0, 10);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Load more notifications (pagination)
    const loadMoreNotifications = async () => {
      loadingMore.value = true;
      
      try {
        page.value++;
        
        // In a real app, this would be an API call with pagination
        // const response = await axios.get(`/api/notifications?page=${page.value}`);
        
        // For demo purposes, use mock data
        await new Promise(resolve => setTimeout(resolve, 800));
        const moreNotifications = generateMockNotifications(5); // Generate 5 more
        
        // Add to existing notifications
        notifications.value = [...notifications.value, ...moreNotifications];
        
        // Check if we have more to load
        hasMoreNotifications.value = page.value < 3; // Simulate 3 pages
      } catch (error) {
        console.error('Error loading more notifications:', error);
      } finally {
        loadingMore.value = false;
      }
    };
    
    // Apply filters to notifications
    const filteredNotifications = computed(() => {
      return notifications.value.filter(notification => {
        // Filter by read status
        if (!showReadNotifications.value && notification.read) {
          return false;
        }
        
        // Filter by type
        if (filterType.value !== 'all' && notification.type !== filterType.value) {
          return false;
        }
        
        // Filter by time range
        if (filterTimeRange.value !== 'all') {
          const now = new Date();
          const notificationDate = new Date(notification.timestamp);
          
          if (filterTimeRange.value === 'today') {
            // Check if same day
            return (
              notificationDate.getDate() === now.getDate() &&
              notificationDate.getMonth() === now.getMonth() &&
              notificationDate.getFullYear() === now.getFullYear()
            );
          } else if (filterTimeRange.value === 'week') {
            // Check if within last 7 days
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return notificationDate >= weekAgo;
          } else if (filterTimeRange.value === 'month') {
            // Check if same month
            return (
              notificationDate.getMonth() === now.getMonth() &&
              notificationDate.getFullYear() === now.getFullYear()
            );
          }
        }
        
        return true;
      });
    });
    
    // Group notifications by date
    const groupedNotifications = computed(() => {
      const groups = {};
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      // Sort notifications by timestamp (newest first)
      const sorted = [...filteredNotifications.value].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      sorted.forEach(notification => {
        const date = new Date(notification.timestamp);
        const dateWithoutTime = new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        );
        
        let groupKey;
        let groupLabel;
        
        if (dateWithoutTime.getTime() === today.getTime()) {
          groupKey = 'today';
          groupLabel = 'Today';
        } else if (dateWithoutTime.getTime() === yesterday.getTime()) {
          groupKey = 'yesterday';
          groupLabel = 'Yesterday';
        } else {
          const options = { month: 'long', day: 'numeric', year: 'numeric' };
          groupKey = date.toISOString().split('T')[0];
          groupLabel = date.toLocaleDateString(undefined, options);
        }
        
        if (!groups[groupKey]) {
          groups[groupKey] = {
            date: groupKey,
            label: groupLabel,
            notifications: []
          };
        }
        
        groups[groupKey].notifications.push(notification);
      });
      
      // Convert to array and sort by date
      return Object.values(groups).sort((a, b) => {
        if (a.date === 'today') return -1;
        if (b.date === 'today') return 1;
        if (a.date === 'yesterday') return -1;
        if (b.date === 'yesterday') return 1;
        return new Date(b.date) - new Date(a.date);
      });
    });
    
    // Count unread notifications
    const unreadCount = computed(() => {
      return notifications.value.filter(notification => !notification.read).length;
    });
    
    // Format timestamp to relative time
    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hr ago`;
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString();
    };
    
    // Get notification icon based on type
    const getNotificationIcon = (type) => {
      switch (type) {
        case 'order_status':
          return 'mdi-food';
        case 'promo':
          return 'mdi-tag-outline';
        case 'account':
          return 'mdi-account';
        default:
          return 'mdi-bell';
      }
    };
    
    // Get notification color based on type
    const getNotificationColor = (type) => {
      switch (type) {
        case 'order_status':
          return 'primary';
        case 'promo':
          return 'purple';
        case 'account':
          return 'indigo';
        default:
          return 'grey';
      }
    };
    
    // Get empty state message based on filters
    const getEmptyStateMessage = () => {
      if (filterType.value !== 'all' || filterTimeRange.value !== 'all' || !showReadNotifications.value) {
        return 'Try adjusting your filters to see more notifications';
      }
      return 'You have no notifications yet';
    };
    
    // Mark a notification as read
    const markAsRead = async (id) => {
      try {
        // In a real app, this would be an API call
        // await axios.patch(`/api/notifications/${id}/read`);
        
        // Update local state
        const notification = notifications.value.find(n => n.id === id);
        if (notification) {
          notification.read = true;
        }
        
        // For demo purposes, simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Update Vuex store
        store.dispatch('orderTracking/markNotificationRead', id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    };
    
    // Mark all notifications as read
    const markAllAsRead = async () => {
      try {
        // In a real app, this would be an API call
        // await axios.patch('/api/notifications/read-all');
        
        // Update local state
        notifications.value.forEach(notification => {
          notification.read = true;
        });
        
        // For demo purposes, simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update Vuex store
        store.dispatch('orderTracking/markAllNotificationsRead');
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    };
    
    // Delete a notification
    const deleteNotification = (id) => {
      notificationToDelete.value = id;
      showDeleteDialog.value = true;
    };
    
    // Confirm notification deletion
    const confirmDelete = async () => {
      try {
        if (!notificationToDelete.value) return;
        
        // In a real app, this would be an API call
        // await axios.delete(`/api/notifications/${notificationToDelete.value}`);
        
        // Update local state
        notifications.value = notifications.value.filter(
          n => n.id !== notificationToDelete.value
        );
        
        // For demo purposes, simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showDeleteDialog.value = false;
        notificationToDelete.value = null;
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    };
    
    // Open a notification
    const openNotification = async (notification) => {
      // Mark as read
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      
      // Navigate based on type
      if (notification.type === 'order_status' && notification.orderId) {
        router.push(`/orders/${notification.orderId}/tracking`);
      } else if (notification.type === 'promo' && notification.promoId) {
        router.push(`/promotions/${notification.promoId}`);
      } else if (notification.link) {
        router.push(notification.link);
      }
    };
    
    // Handle notification action button
    const handleAction = (notification) => {
      if (notification.action && notification.action.link) {
        router.push(notification.action.link);
      }
    };
    
    // Reset all filters
    const resetFilters = () => {
      filterType.value = 'all';
      filterTimeRange.value = 'all';
      showReadNotifications.value = true;
    };
    
    // Load notification settings
    const loadSettings = async () => {
      try {
        // In a real app, this would be an API call
        // const response = await axios.get('/api/notifications/settings');
        // settings.value = response.data;
        
        // For demo purposes, use mock data
        await new Promise(resolve => setTimeout(resolve, 300));
        settings.value = {
          orderStatus: true,
          driverLocation: true,
          promotions: true,
          newRestaurants: true,
          email: true,
          push: true,
          sms: false
        };
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    };
    
    // Save notification settings
    const saveSettings = async () => {
      try {
        // In a real app, this would be an API call
        // await axios.put('/api/notifications/settings', settings.value);
        
        // For demo purposes, simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        showSettingsDialog.value = false;
        
        // Show success message
        store.dispatch('ui/showSnackbar', {
          text: 'Notification settings saved',
          color: 'success'
        });
      } catch (error) {
        console.error('Error saving notification settings:', error);
      }
    };
    
    // Generate mock notifications for demo
    const generateMockNotifications = (count = 20) => {
      const types = ['order_status', 'promo', 'account'];
      const now = new Date();
      const notifications = [];
      
      for (let i = 0; i < count; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const timestamp = new Date(now);
        timestamp.setHours(timestamp.getHours() - Math.floor(Math.random() * 48));
        
        let notification = {
          id: Date.now() - i,
          type,
          timestamp: timestamp.toISOString(),
          read: Math.random() > 0.3 // 70% chance of being read
        };
        
        if (type === 'order_status') {
          const statuses = ['confirmed', 'preparing', 'on_the_way', 'delivered'];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const orderId = 1000 + Math.floor(Math.random() * 1000);
          
          notification = {
            ...notification,
            title: `Order #${orderId} Update`,
            message: getOrderStatusMessage(status),
            orderId,
            action: {
              text: 'Track Order',
              link: `/orders/${orderId}/tracking`
            }
          };
        } else if (type === 'promo') {
          const promos = [
            {
              title: 'Special Offer',
              message: 'Get 20% off on your next order! Use code FOOD20 at checkout.',
              promoId: 'FOOD20'
            },
            {
              title: 'New Restaurant',
              message: 'Check out the new Thai restaurant in your area! Free delivery on your first order.',
              promoId: null
            },
            {
              title: 'Weekend Discount',
              message: 'Enjoy free delivery all weekend! Order now.',
              promoId: 'WEEKEND'
            }
          ];
          
          const promo = promos[Math.floor(Math.random() * promos.length)];
          
          notification = {
            ...notification,
            title: promo.title,
            message: promo.message,
            promoId: promo.promoId,
            action: {
              text: 'Order Now',
              link: '/restaurants'
            }
          };
        } else if (type === 'account') {
          const messages = [
            {
              title: 'Profile Updated',
              message: 'Your profile information has been updated successfully.'
            },
            {
              title: 'New Address Added',
              message: 'A new delivery address has been added to your account.'
            },
            {
              title: 'Password Changed',
              message: 'Your password has been changed successfully.'
            }
          ];
          
          const message = messages[Math.floor(Math.random() * messages.length)];
          
          notification = {
            ...notification,
            title: message.title,
            message: message.message,
            link: '/profile'
          };
        }
        
        notifications.push(notification);
      }
      
      return notifications;
    };
    
    // Get order status message
    const getOrderStatusMessage = (status) => {
      switch (status) {
        case 'confirmed':
          return 'Your order has been confirmed by the restaurant.';
        case 'preparing':
          return 'The restaurant is now preparing your food.';
        case 'on_the_way':
          return 'Your order is on the way! Track your delivery.';
        case 'delivered':
          return 'Your order has been delivered. Enjoy your meal!';
        default:
          return 'Your order status has been updated.';
      }
    };
    
    // Fetch notifications when component is mounted
    onMounted(() => {
      fetchNotifications();
    });
    
    return {
      loading,
      loadingMore,
      notifications,
      filteredNotifications,
      groupedNotifications,
      unreadCount,
      filterType,
      filterTimeRange,
      showReadNotifications,
      hasMoreNotifications,
      typeOptions,
      timeRangeOptions,
      settings,
      showSettingsDialog,
      showDeleteDialog,
      formatTime,
      getNotificationIcon,
      getNotificationColor,
      getEmptyStateMessage,
      markAsRead,
      markAllAsRead,
      openNotification,
      handleAction,
      resetFilters,
      loadMoreNotifications,
      saveSettings,
      deleteNotification,
      confirmDelete
    };
  }
};
</script>

<style scoped>
.notification-card {
  transition: all 0.2s ease;
}

.notification-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.notification-card.unread {
  border-left: 3px solid var(--v-primary-base);
  background-color: rgba(var(--v-primary-base), 0.05);
}
</style> 