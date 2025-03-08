import axios from 'axios'

export default {
  namespaced: true,

  state: {
    pushEnabled: false,
    subscription: null,
    preferences: {
      orderUpdates: true,
      promotions: true,
      restaurantUpdates: true
    },
    vapidPublicKey: process.env.VITE_VAPID_PUBLIC_KEY
  },

  mutations: {
    setPushEnabled(state, enabled) {
      state.pushEnabled = enabled
    },
    setSubscription(state, subscription) {
      state.subscription = subscription
    },
    setPreferences(state, preferences) {
      state.preferences = { ...state.preferences, ...preferences }
    }
  },

  actions: {
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
    },

    async updatePreferences({ commit, state }, preferences) {
      try {
        await axios.post('/api/notifications/preferences', preferences)
        commit('setPreferences', preferences)
        return true
      } catch (error) {
        console.error('Error updating notification preferences:', error)
        return false
      }
    }
  },

  getters: {
    isEnabled: state => state.pushEnabled,
    preferences: state => state.preferences
  }
}