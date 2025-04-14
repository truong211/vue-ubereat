import { defineStore } from 'pinia'
import apiService from '@/services/apiService'
import { pushNotificationService } from '@/services/push-notification.service'

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    notifications: [],
    unreadCount: 0,
    loading: false,
    error: null,
    pushNotificationsEnabled: false
  }),

  getters: {
    hasUnread: (state) => state.unreadCount > 0,
    sortedNotifications: (state) => [...(state.notifications || [])].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
  },

  actions: {
    async initPushNotifications() {
      try {
        // Initialize push notification service
        await pushNotificationService.init()
        
        // Check if notifications are supported and permission is granted
        if ('Notification' in window) {
          this.pushNotificationsEnabled = Notification.permission === 'granted'
        }
        
        return true
      } catch (error) {
        console.error('Failed to initialize push notifications:', error)
        this.pushNotificationsEnabled = false
        return false
      }
    },

    async initNotifications() {
      try {
        // Initialize notifications as empty array
        this.notifications = []
        this.unreadCount = 0
        
        // Load existing notifications from localStorage
        const savedNotifications = localStorage.getItem('notifications')
        if (savedNotifications) {
          const parsed = JSON.parse(savedNotifications)
          if (Array.isArray(parsed)) {
            this.notifications = parsed
            this.unreadCount = this.notifications.filter(n => !n.read).length
          }
        }
        
        // Initialize push notifications
        await this.initPushNotifications()

        // Fetch latest notifications from server
        await this.fetchNotifications()
      } catch (error) {
        console.error('Failed to initialize notifications:', error)
        // Ensure notifications is always an array even on error
        this.notifications = []
        this.unreadCount = 0
      }
    },

    async fetchNotifications() {
      this.loading = true
      try {
        const response = await apiService.get('/api/notifications')
        // Ensure response.data is an array
        this.notifications = Array.isArray(response.data) ? response.data : []
        this.unreadCount = this.notifications.filter(n => !n.read).length
        this.error = null
        this.saveToLocalStorage()
      } catch (error) {
        this.error = error.message
        console.error('Error fetching notifications:', error)
        // Ensure notifications is always an array even on error
        this.notifications = []
        this.unreadCount = 0
      } finally {
        this.loading = false
      }
    },

    async markAsRead(notificationId) {
      try {
        await apiService.put(`/api/notifications/${notificationId}/read`)
        const notification = this.notifications.find(n => n.id === notificationId)
        if (notification && !notification.read) {
          notification.read = true
          this.unreadCount--
        }
        this.error = null
        this.saveToLocalStorage()
      } catch (error) {
        this.error = error.message
        console.error('Error marking notification as read:', error)
      }
    },

    async markAllAsRead() {
      try {
        await apiService.put('/api/notifications/read-all')
        this.notifications.forEach(notification => {
          notification.read = true
        })
        this.unreadCount = 0
        this.error = null
        this.saveToLocalStorage()
      } catch (error) {
        this.error = error.message
        console.error('Error marking all notifications as read:', error)
      }
    },

    async deleteNotification(notificationId) {
      try {
        await apiService.delete(`/api/notifications/${notificationId}`)
        const index = this.notifications.findIndex(n => n.id === notificationId)
        if (index !== -1) {
          const notification = this.notifications[index]
          if (!notification.read) {
            this.unreadCount--
          }
          this.notifications.splice(index, 1)
        }
        this.error = null
        this.saveToLocalStorage()
      } catch (error) {
        this.error = error.message
        console.error('Error deleting notification:', error)
      }
    },

    addNotification(notification) {
      this.notifications.unshift({
        ...notification,
        read: false,
        createdAt: new Date().toISOString()
      })
      this.unreadCount++
      this.saveToLocalStorage()
    },

    saveToLocalStorage() {
      localStorage.setItem('notifications', JSON.stringify(this.notifications))
    },

    clearError() {
      this.error = null
    }
  }
})

// Export both versions for compatibility, but make useNotificationStore the primary export
export const useNotificationsStore = useNotificationStore
