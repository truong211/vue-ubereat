import axios from 'axios'

// Notification store module for managing notification state
const state = {
  notifications: [],
  unreadCount: 0,
  totalCount: 0,
  isSubscribed: false,
  permissionStatus: null, // 'granted', 'denied', 'default'
  preferences: {
    orderUpdates: true,
    deliveryUpdates: true,
    promotions: true,
    restaurantUpdates: false,
    chatNotifications: true,
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false
  },
  loading: false,
  error: null,
  pushEnabled: false,
  subscription: null,
  vapidPublicKey: process.env.VITE_VAPID_PUBLIC_KEY
}

const mutations = {
  SET_NOTIFICATIONS(state, notifications) {
    state.notifications = notifications
  },
  
  ADD_NOTIFICATION(state, notification) {
    state.notifications.unshift(notification)
    state.totalCount++
    if (!notification.read) {
      state.unreadCount++
    }
  },
  
  MARK_AS_READ(state, notificationId) {
    const notification = state.notifications.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      notification.readAt = new Date().toISOString()
      state.unreadCount = Math.max(0, state.unreadCount - 1)
    }
  },
  
  MARK_ALL_AS_READ(state) {
    state.notifications.forEach(notification => {
      notification.read = true
      notification.readAt = new Date().toISOString()
    })
    state.unreadCount = 0
  },
  
  REMOVE_NOTIFICATION(state, notificationId) {
    const index = state.notifications.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      const notification = state.notifications[index]
      state.notifications.splice(index, 1)
      state.totalCount--
      if (!notification.read) {
        state.unreadCount = Math.max(0, state.unreadCount - 1)
      }
    }
  },
  
  SET_NOTIFICATION_COUNTS(state, { unread, total }) {
    state.unreadCount = unread
    state.totalCount = total
  },
  
  SET_SUBSCRIPTION_STATUS(state, isSubscribed) {
    state.isSubscribed = isSubscribed
  },
  
  SET_PERMISSION_STATUS(state, status) {
    state.permissionStatus = status
  },
  
  SET_PREFERENCES(state, preferences) {
    state.preferences = { ...state.preferences, ...preferences }
  },
  
  SET_LOADING(state, loading) {
    state.loading = loading
  },
  
  SET_ERROR(state, error) {
    state.error = error
  },
  
  setPushEnabled(state, enabled) {
    state.pushEnabled = enabled
  },
  setSubscription(state, subscription) {
    state.subscription = subscription
  }
}

const actions = {
  async fetchNotifications({ commit }, { page = 1, limit = 20 } = {}) {
    commit('SET_LOADING', true)
    try {
      const { data } = await this.$axios.get(`/api/notifications?page=${page}&limit=${limit}`)
      commit('SET_NOTIFICATIONS', data.notifications)
      commit('SET_NOTIFICATION_COUNTS', { 
        unread: data.unreadCount,
        total: data.totalCount
      })
      commit('SET_ERROR', null)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      commit('SET_ERROR', 'Failed to load notifications')
    } finally {
      commit('SET_LOADING', false)
    }
  },
  
  async markAsRead({ commit }, notificationId) {
    try {
      await this.$axios.put(`/api/notifications/read/${notificationId}`)
      commit('MARK_AS_READ', notificationId)
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  },
  
  async markAllAsRead({ commit }) {
    try {
      await this.$axios.put('/api/notifications/read-all')
      commit('MARK_ALL_AS_READ')
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  },
  
  async removeNotification({ commit }, notificationId) {
    try {
      await this.$axios.delete(`/api/notifications/${notificationId}`)
      commit('REMOVE_NOTIFICATION', notificationId)
    } catch (error) {
      console.error('Error removing notification:', error)
    }
  },
  
  async initializeNotifications({ commit, dispatch }) {
    // Check permission status
    if ('Notification' in window) {
      commit('SET_PERMISSION_STATUS', Notification.permission)
    }
    
    // Check current subscription
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          commit('SET_SUBSCRIPTION_STATUS', !!subscription)
        }
      }
    } catch (error) {
      console.error('Error checking subscription status:', error)
    }
    
    // Load preferences
    await dispatch('loadPreferences')
    
    // Fetch notifications
    await dispatch('fetchNotifications')
  },
  
  async subscribe({ commit }) {
    // Request permission
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      commit('SET_PERMISSION_STATUS', permission)
      
      if (permission !== 'granted') {
        return false
      }
    }
    
    // Subscribe to push
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          // Get the VAPID public key from the environment
          const convertedVapidKey = this._vm.$notificationService.urlBase64ToUint8Array(
            process.env.VUE_APP_VAPID_PUBLIC_KEY
          )
          
          // Create a new subscription
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
          })
          
          // Send the subscription to the server
          await this.$axios.post('/api/notifications/subscribe', {
            subscription: subscription.toJSON()
          })
          
          commit('SET_SUBSCRIPTION_STATUS', true)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return false
    }
  },
  
  async unsubscribe({ commit }) {
    try {
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration) {
          const subscription = await registration.pushManager.getSubscription()
          
          if (subscription) {
            // Send unsubscribe request to the server
            await this.$axios.post('/api/notifications/unsubscribe', {
              subscription: subscription.toJSON()
            })
            
            // Unsubscribe locally
            await subscription.unsubscribe()
          }
          
          commit('SET_SUBSCRIPTION_STATUS', false)
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      return false
    }
  },
  
  async updatePreferences({ commit }, preferences) {
    try {
      await this.$axios.put('/api/notifications/preferences', { preferences })
      commit('SET_PREFERENCES', preferences)
    } catch (error) {
      console.error('Error updating notification preferences:', error)
    }
  },
  
  async loadPreferences({ commit }) {
    try {
      const { data } = await this.$axios.get('/api/notifications/preferences')
      commit('SET_PREFERENCES', data.preferences)
    } catch (error) {
      console.error('Error loading notification preferences:', error)
    }
  },

  async initializePushNotifications({ commit, state }) {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.log('Push notifications not supported')
        return false
      }

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        commit('setSubscription', subscription)
        commit('setPushEnabled', true)
        return true
      }

      return false
    } catch (error) {
      console.error('Error initializing push notifications:', error)
      return false
    }
  },

  async subscribeToPush({ commit, state }) {
    try {
      const registration = await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: state.vapidPublicKey
      })

      commit('setSubscription', subscription)
      commit('setPushEnabled', true)

      // Send subscription to backend
      await axios.post('/api/notifications/subscribe', {
        subscription,
        preferences: state.preferences
      })

      return true
    } catch (error) {
      console.error('Error subscribing to push notifications:', error)
      return false
    }
  },

  async unsubscribeFromPush({ commit, state }) {
    try {
      if (state.subscription) {
        await state.subscription.unsubscribe()
        await axios.post('/api/notifications/unsubscribe')

        commit('setSubscription', null)
        commit('setPushEnabled', false)
      }
      return true
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error)
      return false
    }
  }
}

const getters = {
  unreadCount: state => state.unreadCount,
  totalCount: state => state.totalCount,
  allNotifications: state => state.notifications,
  unreadNotifications: state => state.notifications.filter(n => !n.read),
  isSubscribed: state => state.isSubscribed,
  permissionStatus: state => state.permissionStatus,
  preferences: state => state.preferences,
  hasPermission: state => state.permissionStatus === 'granted',
  canSubscribe: state => state.permissionStatus !== 'denied',
  loading: state => state.loading,
  error: state => state.error,
  
  notificationsByType: state => type => {
    return state.notifications.filter(notification => notification.type === type)
  },
  isEnabled: state => state.pushEnabled
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}