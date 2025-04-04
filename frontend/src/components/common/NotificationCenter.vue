<template>
  <div class="notification-center">
    <!-- Notification Button -->
    <v-btn
      icon
      variant="text"
      :badge="unreadCount || undefined"
      :badge-color="unreadCount ? 'error' : undefined"
      @click="toggleNotifications"
    >
      <v-icon>mdi-bell</v-icon>
    </v-btn>

    <!-- Notifications Menu -->
    <v-menu
      v-model="showNotifications"
      :close-on-content-click="false"
      location="bottom end"
      min-width="360"
    >
      <v-card class="notification-panel">
        <!-- Header -->
        <v-card-title class="d-flex justify-space-between align-center py-2 px-4">
          <span class="text-subtitle-1">Thông báo</span>
          <div class="d-flex align-center">
            <v-btn
              v-if="unreadCount > 0"
              variant="text"
              density="comfortable"
              size="small"
              class="text-caption"
              @click="markAllRead"
            >
              Đánh dấu tất cả là đã đọc
            </v-btn>
            <v-btn
              icon="mdi-cog"
              variant="text"
              size="small"
              @click="showSettings = true"
            >
              <v-tooltip activator="parent" location="bottom">
                Cài đặt thông báo
              </v-tooltip>
            </v-btn>
          </div>
        </v-card-title>

        <v-divider></v-divider>

        <!-- Notifications List -->
        <v-card-text class="notifications-list pa-0">
          <div v-if="notifications.length === 0" class="text-center py-8">
            <v-icon size="48" color="grey-lighten-1">mdi-bell-off</v-icon>
            <div class="text-body-1 mt-2">Không có thông báo</div>
            <div class="text-caption text-medium-emphasis">
              Chúng tôi sẽ thông báo khi có tin tức quan trọng
            </div>
          </div>

          <v-list v-else lines="two">
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              :active="!notification.read"
              @click="handleNotificationClick(notification)"
            >
              <template v-slot:prepend>
                <v-avatar :color="getNotificationColor(notification.type)" size="40">
                  <v-icon color="white">{{ getNotificationIcon(notification.type) }}</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title>{{ notification.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ notification.message }}</v-list-item-subtitle>

              <template v-slot:append>
                <div class="d-flex flex-column align-end">
                  <div class="text-caption text-medium-emphasis">
                    {{ formatTime(notification.timestamp) }}
                  </div>
                  <v-btn
                    v-if="!notification.read"
                    variant="text"
                    density="comfortable"
                    size="x-small"
                    color="primary"
                    class="mt-1"
                    @click.stop="markAsRead(notification.id)"
                  >
                    Đánh dấu đã đọc
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>

        <!-- Load More -->
        <div
          v-if="hasMoreNotifications"
          class="text-center py-2"
        >
          <v-btn
            variant="text"
            block
            :loading="isLoadingMore"
            @click="loadMoreNotifications"
          >
            Tải thêm
          </v-btn>
        </div>
      </v-card>
    </v-menu>

    <!-- Settings Dialog -->
    <v-dialog v-model="showSettings" max-width="500">
      <v-card>
        <v-card-title>Cài đặt thông báo</v-card-title>
        
        <v-card-text>
          <!-- Push Notifications -->
          <div class="mb-4">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-1">Thông báo đẩy</div>
              <v-spacer></v-spacer>
              <v-switch
                v-model="pushEnabled"
                :loading="isTogglingPush"
                :disabled="!pushSupported || isTogglingPush"
                hide-details
                density="comfortable"
                @update:model-value="togglePushNotifications"
              ></v-switch>
            </div>
            <div v-if="!pushSupported" class="text-caption text-error">
              Trình duyệt của bạn không hỗ trợ thông báo đẩy
            </div>
          </div>

          <!-- SMS Notifications -->
          <div class="mb-4">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-1">Thông báo qua SMS</div>
              <v-spacer></v-spacer>
              <v-switch
                v-model="smsEnabled"
                :loading="isTogglingSms"
                hide-details
                density="comfortable"
                @update:model-value="toggleSmsNotifications"
              ></v-switch>
            </div>
            <div v-if="smsEnabled && !phoneVerified" class="text-caption text-error">
              Vui lòng xác thực số điện thoại để nhận SMS
              <v-btn
                variant="text"
                color="primary"
                size="x-small"
                class="ml-2"
                @click="verifyPhone"
              >
                Xác thực ngay
              </v-btn>
            </div>
          </div>

          <!-- Email Notifications -->
          <div class="mb-4">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-1">Thông báo qua Email</div>
              <v-spacer></v-spacer>
              <v-switch
                v-model="emailEnabled"
                :loading="isTogglingEmail"
                hide-details
                density="comfortable"
                @update:model-value="toggleEmailNotifications"
              ></v-switch>
            </div>
          </div>

          <!-- Notification Types -->
          <div class="text-subtitle-1 mb-2">Loại thông báo</div>
          <v-list>
            <v-list-item
              v-for="type in notificationTypes"
              :key="type.value"
            >
              <template v-slot:prepend>
                <v-checkbox
                  v-model="enabledTypes"
                  :value="type.value"
                  hide-details
                  density="comfortable"
                ></v-checkbox>
              </template>
              
              <v-list-item-title>{{ type.label }}</v-list-item-title>
              <v-list-item-subtitle>{{ type.description }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showSettings = false"
          >
            Đóng
          </v-btn>
          <v-btn
            color="primary"
            @click="saveSettings"
            :loading="isSavingSettings"
          >
            Lưu cài đặt
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { pushNotificationService } from '@/services/push-notification.service'

export default {
  name: 'NotificationCenter',
  
  setup() {
    const store = useStore()
    
    // State
    const showNotifications = ref(false)
    const showSettings = ref(false)
    const pushEnabled = ref(false)
    const pushSupported = ref(false)
    const smsEnabled = ref(false)
    const emailEnabled = ref(false)
    const phoneVerified = ref(false)
    const isTogglingPush = ref(false)
    const isTogglingSms = ref(false)
    const isTogglingEmail = ref(false)
    const isSavingSettings = ref(false)
    const isLoadingMore = ref(false)
    const enabledTypes = ref([])
    
    // Computed
    const notifications = computed(() => 
      store.state.notifications.notifications || []
    )
    
    const unreadCount = computed(() => 
      store.getters['notifications/unreadCount']
    )
    
    const hasMoreNotifications = computed(() => {
      const pagination = store.state.notifications.pagination || {}
      return pagination.page < pagination.totalPages
    })
    
    // Notification types
    const notificationTypes = [
      {
        value: 'order_status',
        label: 'Cập nhật đơn hàng',
        description: 'Thông báo về trạng thái đơn hàng',
        icon: 'mdi-package-variant',
        color: 'primary'
      },
      {
        value: 'chat_message',
        label: 'Tin nhắn',
        description: 'Tin nhắn từ hỗ trợ hoặc tài xế',
        icon: 'mdi-message',
        color: 'success'
      },
      {
        value: 'promotion',
        label: 'Khuyến mãi',
        description: 'Ưu đãi và giảm giá đặc biệt',
        icon: 'mdi-tag',
        color: 'warning'
      },
      {
        value: 'system',
        label: 'Hệ thống',
        description: 'Thông báo bảo trì và cập nhật hệ thống',
        icon: 'mdi-cog',
        color: 'info'
      },
      {
        value: 'account',
        label: 'Tài khoản',
        description: 'Đăng nhập và hoạt động tài khoản',
        icon: 'mdi-account',
        color: 'secondary'
      }
    ]
    
    // Methods
    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value
      if (showNotifications.value) {
        store.dispatch('notifications/markAllAsRead')
      }
    }
    
    const handleNotificationClick = (notification) => {
      markAsRead(notification.id)
      showNotifications.value = false
      
      // Handle click based on notification type
      switch (notification.type) {
        case 'order_status':
          store.dispatch('orders/viewOrder', notification.data.orderId)
          break
          
        case 'chat_message':
          store.dispatch('support/openChat', notification.data.chatId)
          break
          
        case 'promotion':
          store.dispatch('promotions/viewPromotion', notification.data.promotionId)
          break

        case 'system':
          // Handle system notifications
          if (notification.data.action === 'update') {
            window.location.reload()
          }
          break

        case 'account':
          // Handle account notifications
          if (notification.data.action === 'verify_email') {
            store.dispatch('auth/resendVerificationEmail')
          }
          break
      }
    }
    
    const markAsRead = async (id) => {
      try {
        await store.dispatch('notifications/markAsRead', id)
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    }
    
    const markAllRead = async () => {
      try {
        await store.dispatch('notifications/markAllAsRead')
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error)
      }
    }
    
    const loadMoreNotifications = async () => {
      if (isLoadingMore.value) return
      
      isLoadingMore.value = true
      try {
        await store.dispatch('notifications/fetchNotifications')
      } catch (error) {
        console.error('Failed to load more notifications:', error)
      } finally {
        isLoadingMore.value = false
      }
    }
    
    // Notification settings methods
    const initializeNotificationSettings = async () => {
      try {
        // Initialize push notifications
        await pushNotificationService.init()
        pushSupported.value = true
        const permission = pushNotificationService.getPermissionStatus()
        pushEnabled.value = permission === 'granted'
        
        // Load other notification settings
        const settings = await store.dispatch('notifications/loadPreferences')
        enabledTypes.value = settings.enabledTypes || []
        smsEnabled.value = settings.sms || false
        emailEnabled.value = settings.email || false
        
        // Check phone verification status
        const user = store.state.auth.user
        phoneVerified.value = user?.phoneVerified || false
      } catch (error) {
        console.error('Failed to initialize notification settings:', error)
        pushSupported.value = false
      }
    }
    
    const togglePushNotifications = async () => {
      isTogglingPush.value = true
      try {
        if (pushEnabled.value) {
          const permission = await pushNotificationService.requestPermission()
          pushEnabled.value = permission === 'granted'
        } else {
          await pushNotificationService.unsubscribe()
          pushEnabled.value = false
        }
      } catch (error) {
        console.error('Failed to toggle push notifications:', error)
        pushEnabled.value = false
      } finally {
        isTogglingPush.value = false
      }
    }

    const toggleSmsNotifications = async () => {
      isTogglingSms.value = true
      try {
        if (smsEnabled.value && !phoneVerified.value) {
          smsEnabled.value = false
          showSettings.value = false
          await verifyPhone()
        }
      } catch (error) {
        console.error('Failed to toggle SMS notifications:', error)
        smsEnabled.value = false
      } finally {
        isTogglingSms.value = false
      }
    }

    const toggleEmailNotifications = async () => {
      isTogglingEmail.value = true
      try {
        await store.dispatch('notifications/updatePreferences', { email: emailEnabled.value })
      } catch (error) {
        console.error('Failed to toggle email notifications:', error)
        emailEnabled.value = !emailEnabled.value
      } finally {
        isTogglingEmail.value = false
      }
    }

    const verifyPhone = async () => {
      try {
        await store.dispatch('auth/initiatePhoneVerification')
      } catch (error) {
        console.error('Failed to initiate phone verification:', error)
      }
    }
    
    const saveSettings = async () => {
      isSavingSettings.value = true
      
      try {
        await store.dispatch('notifications/updatePreferences', {
          push: pushEnabled.value,
          sms: smsEnabled.value,
          email: emailEnabled.value,
          enabledTypes: enabledTypes.value
        })
        
        showSettings.value = false
      } catch (error) {
        console.error('Failed to save notification settings:', error)
      } finally {
        isSavingSettings.value = false
      }
    }
    
    // Utility methods
    const getNotificationIcon = (type) => {
      const notificationType = notificationTypes.find(t => t.value === type)
      return notificationType?.icon || 'mdi-bell'
    }
    
    const getNotificationColor = (type) => {
      const notificationType = notificationTypes.find(t => t.value === type)
      return notificationType?.color || 'grey'
    }
    
    const formatTime = (timestamp) => {
      return formatDistanceToNow(new Date(timestamp), { 
        addSuffix: true,
        locale: vi 
      })
    }
    
    // Initialize
    onMounted(() => {
      initializeNotificationSettings()
    })
    
    return {
      showNotifications,
      showSettings,
      notifications,
      unreadCount,
      hasMoreNotifications,
      pushEnabled,
      pushSupported,
      smsEnabled,
      emailEnabled,
      phoneVerified,
      isTogglingPush,
      isTogglingSms,
      isTogglingEmail,
      isSavingSettings,
      isLoadingMore,
      enabledTypes,
      notificationTypes,
      toggleNotifications,
      handleNotificationClick,
      markAsRead,
      markAllRead,
      loadMoreNotifications,
      togglePushNotifications,
      toggleSmsNotifications,
      toggleEmailNotifications,
      verifyPhone,
      saveSettings,
      getNotificationIcon,
      getNotificationColor,
      formatTime
    }
  }
}
</script>

<style scoped>
.notification-panel {
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.notifications-list {
  flex: 1;
  overflow-y: auto;
  max-height: 400px;
}

/* Custom scrollbar */
.notifications-list::-webkit-scrollbar {
  width: 6px;
}

.notifications-list::-webkit-scrollbar-track {
  background: transparent;
}

.notifications-list::-webkit-scrollbar-thumb {
  background: #90a4ae;
  border-radius: 3px;
}

.notifications-list::-webkit-scrollbar-thumb:hover {
  background: #607d8b;
}
</style>
