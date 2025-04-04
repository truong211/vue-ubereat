import { createStore } from 'vuex'
import auth from './modules/auth'
import cart from './modules/cart'
import orders from './modules/orders'
import order from './modules/order'
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
import restaurantOrders from './modules/restaurantOrders'
import analytics from './modules/analytics'
import users from './modules/users'
import disputes from './modules/disputes'
import favorites from './modules/favorites'
import user from './modules/user'

// Create a new store instance.
const store = createStore({
  state: {
    loading: false,
    error: null,
    webSocket: {
      status: 'disconnected', // 'connected', 'disconnected', 'error'
      lastMessage: null
    },
    systemNotifications: []
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
      state.systemNotifications.unshift({
        id: Date.now(),
        timestamp: new Date(),
        read: false,
        ...notification
      })
    },
    markNotificationAsRead(state, notificationId) {
      const notification = state.systemNotifications.find(n => n.id === notificationId)
      if (notification) {
        notification.read = true
      }
    },
    markAllNotificationsAsRead(state) {
      state.systemNotifications.forEach(n => n.read = true)
    },
    clearNotifications(state) {
      state.systemNotifications = []
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
    initWebSocket({ commit, dispatch, state }) {
      // Initialize WebSocket service
      websocketService.init(this)

      // Watch for auth state changes manually instead of using this.watch
      let prevUser = state.auth.user;
      this.subscribe((mutation, state) => {
        if (mutation.type.startsWith('auth/') && state.auth.user !== prevUser) {
          prevUser = state.auth.user;
          if (state.auth.user) {
            websocketService.connect();
          } else {
            websocketService.disconnect();
            commit('setWebSocketStatus', 'disconnected');
          }
        }
      });
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
    unreadNotifications: state => state.systemNotifications.filter(n => !n.read),
    allNotifications: state => state.systemNotifications
  },

  modules: {
    auth,
    cart,
    orders,
    order,
    restaurantAdmin,
    admin,
    ui,
    reviews,
    orderTracking,
    categories,
    restaurants,
    chat,
    notifications,
    restaurantOrders,
    analytics,
    users,
    disputes,
    favorites,
    user
  }
})

// Provide useStore composable for Composition API
export function useStore() {
  return store
}

export default store
