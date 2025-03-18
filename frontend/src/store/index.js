import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'
import orders from './modules/orders'
import restaurantAdmin from './modules/restaurantAdmin'
import admin from './modules/admin'
import ui from './modules/ui'
import reviews from './modules/reviews'
import orderTracking from './modules/orderTracking'
import categories from './modules/categories'
import restaurants from './modules/restaurants'
import websocketService from '@/services/websocket'
import chat from './modules/chat'
import notifications from './modules/notifications'

// Create a new store instance.
export default createStore({
  state: {
    loading: false,
    error: null,
    webSocket: {
      status: 'disconnected', // 'connected', 'disconnected', 'error'
      lastMessage: null
    },
    notifications: []
  },

  mutations: {
    setLoading(state, loading) {
      state.loading = loading
    },
    setError(state, error) {
      state.error = error
    },
    clearError(state) {
      state.error = null
    },
    setWebSocketStatus(state, status) {
      state.webSocket.status = status
    },
    setLastMessage(state, message) {
      state.webSocket.lastMessage = message
    },
    addNotification(state, notification) {
      state.notifications.unshift({
        id: Date.now(),
        timestamp: new Date(),
        read: false,
        ...notification
      })
    },
    markNotificationAsRead(state, notificationId) {
      const notification = state.notifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    },
    markAllNotificationsAsRead(state) {
      state.notifications.forEach(n => n.read = true)
    },
    clearNotifications(state) {
      state.notifications = []
    }
  },

  actions: {
    setLoading({ commit }, loading) {
      commit('setLoading', loading)
    },
    setError({ commit }, error) {
      commit('setError', error)
    },
    clearError({ commit }) {
      commit('clearError')
    },
    initWebSocket({ commit, dispatch }) {
      // Initialize WebSocket service
      websocketService.init(this)

      // Set up auth change listener to reconnect WebSocket
      this.watch(
        (state) => state.auth.user,
        (newUser) => {
          if (newUser) {
            websocketService.connect()
          } else {
            websocketService.disconnect()
            commit('setWebSocketStatus', 'disconnected')
          }
        }
      )
    },
    setWebSocketStatus({ commit }, status) {
      commit('setWebSocketStatus', status)
    },
    addNotification({ commit }, notification) {
      commit('addNotification', notification)
      // Play notification sound if enabled
      if (notification.sound !== false) {
        const audio = new Audio('/sounds/notification.mp3')
        audio.play().catch(error => {
          console.error('Failed to play notification sound:', error)
        })
      }
    },
    markNotificationAsRead({ commit }, notificationId) {
      commit('markNotificationAsRead', notificationId)
    },
    markAllNotificationsAsRead({ commit }) {
      commit('markAllNotificationsAsRead')
    },
    clearNotifications({ commit }) {
      commit('clearNotifications')
    },
    // Generic WebSocket message sender
    sendWebSocketMessage(_, { type, payload }) {
      websocketService.send(type, payload)
    },
    
    // Handle incoming push notification
    handlePushNotification({ dispatch }, notification) {
      // Add to notifications module
      dispatch('notifications/handlePushNotification', notification);
      
      // Play notification sound if enabled
      if (notification.sound !== false) {
        const audio = new Audio('/sounds/notification.mp3');
        audio.play().catch(error => {
          console.error('Failed to play notification sound:', error);
        });
      }
    }
  },

  getters: {
    isLoading: state => state.loading,
    getError: state => state.error,
    isWebSocketConnected: state => state.webSocket.status === 'connected',
    webSocketStatus: state => state.webSocket.status,
    unreadNotifications: state => state.notifications.filter(n => !n.read),
    allNotifications: state => state.notifications
  },

  modules: {
    auth,
    cart,
    orders,
    restaurantAdmin,
    admin,
    ui,
    reviews,
    orderTracking,
    categories,
    restaurants,
    chat,
    notifications
  }
})
