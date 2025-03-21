<template>
  <v-container class="notifications-page">
    <v-row>
      <v-col cols="12">
        <v-card class="elevation-1">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-bell-outline" class="mr-2"></v-icon>
            My Notifications
            <v-spacer></v-spacer>
            
            <!-- Filter Button -->
            <v-menu location="bottom end" offset="4">
              <template v-slot:activator="{ props }">
                <v-btn
                  color="primary"
                  variant="text"
                  v-bind="props"
                  prepend-icon="mdi-filter-outline"
                  class="mr-2"
                >
                  Filter
                </v-btn>
              </template>
              
              <v-card min-width="250" class="elevation-5">
                <v-card-text>
                  <div class="text-subtitle-2 mb-2">Notification Type</div>
                  <v-radio-group v-model="filters.type" density="compact">
                    <v-radio value="all" label="All Types"></v-radio>
                    <v-radio value="order_status" label="Order Updates"></v-radio>
                    <v-radio value="driver_location" label="Driver Updates"></v-radio>
                    <v-radio value="promotion" label="Promotions"></v-radio>
                    <v-radio value="marketing" label="Marketing"></v-radio>
                    <v-radio value="system" label="System"></v-radio>
                  </v-radio-group>
                  
                  <v-divider class="my-2"></v-divider>
                  
                  <div class="text-subtitle-2 mb-2">Time Range</div>
                  <v-radio-group v-model="filters.timeRange" density="compact">
                    <v-radio value="all" label="All Time"></v-radio>
                    <v-radio value="today" label="Today"></v-radio>
                    <v-radio value="week" label="This Week"></v-radio>
                    <v-radio value="month" label="This Month"></v-radio>
                  </v-radio-group>
                  
                  <v-divider class="my-2"></v-divider>
                  
                  <div class="text-subtitle-2 mb-2">Read Status</div>
                  <v-radio-group v-model="filters.read" density="compact">
                    <v-radio :value="null" label="All"></v-radio>
                    <v-radio :value="false" label="Unread Only"></v-radio>
                    <v-radio :value="true" label="Read Only"></v-radio>
                  </v-radio-group>
                </v-card-text>
                
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn
                    color="primary"
                    variant="text"
                    @click="applyFilters"
                  >
                    Apply
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>
            
            <!-- Mark All as Read -->
            <v-btn
              color="primary"
              variant="text"
              prepend-icon="mdi-email-open-multiple-outline"
              @click="markAllAsRead"
              :disabled="!hasUnread"
              class="mr-2"
            >
              Mark All as Read
            </v-btn>
            
            <!-- Settings Button -->
            <v-btn
              color="primary"
              variant="text"
              prepend-icon="mdi-cog-outline"
              @click="openSettings"
            >
              Settings
            </v-btn>
          </v-card-title>
          
          <v-divider></v-divider>

          <!-- Loading State -->
          <div v-if="loading" class="pa-5 text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
            <div class="mt-2">Loading your notifications...</div>
          </div>

          <!-- Empty State -->
          <div v-else-if="!hasNotifications" class="pa-10 text-center">
            <v-icon icon="mdi-bell-sleep-outline" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
            <h3 class="text-h5 mb-2">No notifications found</h3>
            <p class="text-body-1 text-medium-emphasis mb-4">
              {{ getEmptyStateMessage() }}
            </p>
            <v-btn
              color="primary"
              variant="outlined"
              @click="resetFilters"
              v-if="hasActiveFilters"
            >
              Clear Filters
            </v-btn>
          </div>

          <!-- Notification List -->
          <v-list v-else three-line class="notification-list pa-0">
            <template v-for="group in notificationGroups" :key="group.date">
              <!-- Date Divider -->
              <v-list-subheader class="d-flex px-4 py-2 bg-grey-lighten-4">
                <span class="text-subtitle-2 font-weight-medium">{{ group.label }}</span>
                <v-spacer></v-spacer>
                <span class="text-caption text-medium-emphasis">{{ group.notifications.length }} notifications</span>
              </v-list-subheader>
              
              <!-- Group Notifications -->
              <v-list-item
                v-for="notification in group.notifications"
                :key="notification.id"
                :class="{ 'unread': !notification.read, 'read': notification.read }"
                @click="openNotification(notification)"
                class="notification-item pa-4"
              >
                <template v-slot:prepend>
                  <v-avatar :color="getNotificationColor(notification.type)" size="42" class="mr-4">
                    <v-icon :icon="getNotificationIcon(notification.type)" color="white"></v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="text-body-1 font-weight-medium mb-1">
                  {{ notification.title }}
                </v-list-item-title>
                
                <v-list-item-subtitle class="text-body-2 mb-1">
                  {{ notification.message }}
                </v-list-item-subtitle>
                
                <v-list-item-subtitle class="d-flex align-center text-caption text-grey">
                  <span>{{ formatTime(notification.createdAt) }}</span>
                  <v-chip
                    size="x-small"
                    :color="getNotificationColor(notification.type)"
                    text-color="white"
                    class="ml-2"
                    variant="flat"
                  >
                    {{ formatNotificationType(notification.type) }}
                  </v-chip>
                </v-list-item-subtitle>

                <template v-slot:append>
                  <div class="d-flex align-center">
                    <v-btn
                      v-if="!notification.read"
                      icon="mdi-email-open-outline"
                      variant="text"
                      size="small"
                      color="primary"
                      @click.stop="markAsRead(notification.id)"
                      title="Mark as read"
                      class="mr-1"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete-outline"
                      variant="text"
                      size="small"
                      color="error"
                      @click.stop="confirmDelete(notification)"
                      title="Delete notification"
                    ></v-btn>
                  </div>
                </template>
              </v-list-item>
              
              <v-divider v-if="group !== notificationGroups[notificationGroups.length - 1]"></v-divider>
            </template>

            <!-- Pagination -->
            <div class="d-flex justify-center pa-4">
              <v-pagination
                v-if="totalPages > 1"
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                @update:model-value="changePage"
              ></v-pagination>
            </div>
          </v-list>
        </v-card>
      </v-col>
      
      <!-- Notification Preferences (on larger screens) -->
      <v-col cols="12" md="4" class="d-none d-md-block">
        <notification-preferences></notification-preferences>
      </v-col>
    </v-row>
    
    <!-- Settings Dialog (on mobile) -->
    <v-dialog v-model="showSettings" fullscreen>
      <v-card>
        <v-toolbar color="primary" title="Notification Settings">
          <v-btn icon="mdi-close" variant="text" @click="showSettings = false"></v-btn>
        </v-toolbar>
        <v-card-text>
          <notification-preferences></notification-preferences>
        </v-card-text>
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
          <v-btn variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            variant="flat" 
            @click="deleteSelectedNotification"
            :loading="deletingNotification"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Status Snackbar -->
    <v-snackbar v-model="showSnackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
      <template v-slot:actions>
        <v-btn variant="text" icon="mdi-close" @click="showSnackbar = false"></v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script>
import { mapState, mapGetters, mapActions } from 'vuex';
import NotificationPreferences from '@/components/notifications/NotificationPreferences.vue';

export default {
  name: 'UserNotifications',
  
  components: {
    NotificationPreferences
  },
  
  data() {
    return {
      // Filters
      filters: {
        type: 'all',
        timeRange: 'all',
        read: null
      },
      
      // Pagination
      currentPage: 1,
      totalPages: 1,
      
      // UI states
      showSettings: false,
      showDeleteDialog: false,
      showSnackbar: false,
      snackbarText: '',
      snackbarColor: 'success',
      
      // Currently selected notification for delete
      selectedNotification: null,
      deletingNotification: false
    };
  },
  
  computed: {
    ...mapState('notifications', [
      'notifications',
      'loading'
    ]),
    
    ...mapGetters('notifications', [
      'unreadCount',
      'notificationsByDate'
    ]),
    
    hasNotifications() {
      return this.notifications && this.notifications.length > 0;
    },
    
    hasUnread() {
      return this.unreadCount > 0;
    },
    
    notificationGroups() {
      return this.notificationsByDate;
    },
    
    hasActiveFilters() {
      return (
        this.filters.type !== 'all' ||
        this.filters.timeRange !== 'all' ||
        this.filters.read !== null
      );
    }
  },
  
  methods: {
    ...mapActions('notifications', [
      'fetchNotifications',
      'markAsRead',
      'markAllAsRead',
      'deleteNotification'
    ]),
    
    async loadNotifications() {
      try {
        const response = await this.fetchNotifications({
          page: this.currentPage,
          reset: true,
          filters: {
            type: this.filters.type === 'all' ? null : this.filters.type,
            timeRange: this.filters.timeRange === 'all' ? null : this.filters.timeRange,
            read: this.filters.read
          }
        });
        
        if (response) {
          this.totalPages = response.totalPages || 1;
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
        this.showSnackbarMessage('Failed to load notifications', 'error');
      }
    },
    
    async changePage(page) {
      this.currentPage = page;
      await this.loadNotifications();
      
      // Scroll to top of list
      const list = document.querySelector('.notification-list');
      if (list) {
        list.scrollTop = 0;
      }
    },
    
    applyFilters() {
      this.currentPage = 1;
      this.loadNotifications();
    },
    
    resetFilters() {
      this.filters = {
        type: 'all',
        timeRange: 'all',
        read: null
      };
      
      this.currentPage = 1;
      this.loadNotifications();
    },
    
    openSettings() {
      // Only show the dialog on mobile
      if (window.innerWidth < 960) {
        this.showSettings = true;
      } else {
        // On desktop, scroll to the preferences panel
        const preferencesEl = document.querySelector('.notification-preferences-card');
        if (preferencesEl) {
          preferencesEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    },
    
    openNotification(notification) {
      // Mark as read
      if (!notification.read) {
        this.markAsRead(notification.id);
      }
      
      // Handle navigation based on notification type
      switch (notification.type) {
        case 'order_status':
          if (notification.data?.orderId) {
            this.$router.push(`/orders/${notification.data.orderId}`);
          }
          break;
          
        case 'driver_location':
          if (notification.data?.orderId) {
            this.$router.push(`/orders/${notification.data.orderId}/tracking`);
          }
          break;
          
        case 'promotion':
          if (notification.data?.promotionId) {
            this.$router.push(`/promotions/${notification.data.promotionId}`);
          }
          break;
          
        case 'marketing':
          if (notification.data?.url) {
            if (notification.data.url.startsWith('http')) {
              window.open(notification.data.url, '_blank');
            } else {
              this.$router.push(notification.data.url);
            }
          }
          break;
      }
    },
    
    confirmDelete(notification) {
      this.selectedNotification = notification;
      this.showDeleteDialog = true;
    },
    
    async deleteSelectedNotification() {
      if (!this.selectedNotification) {
        this.showDeleteDialog = false;
        return;
      }
      
      this.deletingNotification = true;
      
      try {
        await this.deleteNotification(this.selectedNotification.id);
        this.showSnackbarMessage('Notification deleted successfully');
      } catch (error) {
        console.error('Error deleting notification:', error);
        this.showSnackbarMessage('Failed to delete notification', 'error');
      } finally {
        this.deletingNotification = false;
        this.showDeleteDialog = false;
        this.selectedNotification = null;
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
    
    formatNotificationType(type) {
      switch (type) {
        case 'order_status':
          return 'Order Update';
        case 'driver_location':
          return 'Driver Update';
        case 'promotion':
          return 'Promotion';
        case 'marketing':
          return 'Marketing';
        case 'system':
          return 'System';
        default:
          return type.replace('_', ' ');
      }
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      
      // Format date: Jan 5, 2023
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      // Format time: 3:45 PM
      const timeStr = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      });
      
      return `${dateStr} at ${timeStr}`;
    },
    
    getEmptyStateMessage() {
      if (this.hasActiveFilters) {
        return 'No notifications match your current filters. Try changing your filters to see more results.';
      } else {
        return 'You don\'t have any notifications yet. Check back later for updates on your orders, promotions, and more.';
      }
    },
    
    showSnackbarMessage(text, color = 'success') {
      this.snackbarText = text;
      this.snackbarColor = color;
      this.showSnackbar = true;
    }
  },
  
  async mounted() {
    // Load notifications with default filters
    await this.loadNotifications();
    
    // Set page title
    document.title = 'My Notifications | UberEat';
  },
  
  beforeUnmount() {
    // Reset page title
    document.title = 'UberEat';
  }
};
</script>

<style scoped>
.notifications-page {
  padding-top: 24px;
  padding-bottom: 32px;
}

.notification-list {
  max-height: none;
}

.notification-item {
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.notification-item.unread {
  background-color: rgba(var(--v-theme-primary), 0.07);
}

.notification-item.read {
  opacity: 0.8;
}

@media (max-width: 600px) {
  .notifications-page {
    padding-top: 16px;
    padding-bottom: 16px;
  }
}
</style>