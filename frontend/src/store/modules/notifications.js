import axios from 'axios';
import { pushNotificationService } from '@/services/push-notification.service';

export default {
  namespaced: true,

  state: {
    notifications: [],
    loading: false,
    error: null,
    totalCount: 0,
    pagination: {
      page: 1,
      limit: 10,
      totalPages: 0
    },
    pushNotificationsEnabled: false,
    pushPermissionStatus: 'default' // 'default', 'granted', 'denied', 'unsupported'
  },

  getters: {
    // Get count of unread notifications
    unreadCount(state) {
      if (!state.notifications) return 0;
      return state.notifications.filter(n => !n.read).length;
    },

    // Get notification by ID
    getNotificationById: (state) => (id) => {
      return state.notifications.find(n => n.id === id);
    },

    // Check if push notifications are supported
    isPushSupported() {
      return pushNotificationService.isPushSupported();
    },

    // Get push notification permission status
    pushPermissionStatus(state) {
      return state.pushPermissionStatus;
    },

    // Check if push notifications are enabled
    isPushEnabled(state) {
      return state.pushNotificationsEnabled;
    }
  },

  mutations: {
    SET_LOADING(state, status) {
      state.loading = status;
    },

    SET_ERROR(state, error) {
      state.error = error;
    },

    SET_NOTIFICATIONS(state, notifications) {
      state.notifications = notifications;
    },

    ADD_NOTIFICATION(state, notification) {
      // Insert at the beginning of the array (newest first)
      state.notifications.unshift(notification);
    },

    MARK_AS_READ(state, notificationId) {
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.read = true;
      }
    },

    MARK_ALL_AS_READ(state) {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },

    SET_PAGINATION(state, { page, limit, totalPages, totalCount }) {
      state.pagination.page = page;
      state.pagination.limit = limit;
      state.pagination.totalPages = totalPages;
      state.totalCount = totalCount;
    },

    SET_PUSH_ENABLED(state, status) {
      state.pushNotificationsEnabled = status;
    },

    SET_PUSH_PERMISSION_STATUS(state, status) {
      state.pushPermissionStatus = status;
    }
  },

  actions: {
    // Initialize notifications system
    async initNotifications({ dispatch, commit }) {
      try {
        // Check push notification support
        if (pushNotificationService.isPushSupported()) {
          // Update permission status
          const permissionStatus = pushNotificationService.getPermissionStatus();
          commit('SET_PUSH_PERMISSION_STATUS', permissionStatus);

          // Check if already subscribed
          const isSubscribed = await pushNotificationService.checkSubscriptionStatus();
          commit('SET_PUSH_ENABLED', isSubscribed);
        } else {
          commit('SET_PUSH_PERMISSION_STATUS', 'unsupported');
        }

        // Fetch initial notifications
        await dispatch('fetchNotifications');
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    },

    // Initialize push notifications
    async initPushNotifications({ commit, dispatch }) {
      try {
        if (!pushNotificationService.isPushSupported()) {
          commit('SET_PUSH_PERMISSION_STATUS', 'unsupported');
          return;
        }

        // Initialize push notification service
        await pushNotificationService.init();

        // Check permission status
        const permissionStatus = pushNotificationService.getPermissionStatus();
        commit('SET_PUSH_PERMISSION_STATUS', permissionStatus);

        // If permission is already granted, subscribe
        if (permissionStatus === 'granted') {
          const subscription = await pushNotificationService.subscribe();
          commit('SET_PUSH_ENABLED', !!subscription);
        }

        // Set up event listeners for push notifications
        window.addEventListener('push:received', (event) => {
          if (event.detail) {
            dispatch('addNotification', event.detail);
          }
        });

        window.addEventListener('push:clicked', (event) => {
          if (event.detail) {
            dispatch('handleNotificationClick', event.detail);
          }
        });
      } catch (error) {
        console.error('Error initializing push notifications:', error);
      }
    },

    // Request permission for push notifications
    async requestPushPermission({ commit }) {
      try {
        const granted = await pushNotificationService.requestPermission();
        const permissionStatus = pushNotificationService.getPermissionStatus();
        commit('SET_PUSH_PERMISSION_STATUS', permissionStatus);

        if (granted) {
          const subscription = await pushNotificationService.subscribe();
          commit('SET_PUSH_ENABLED', !!subscription);
        }

        return granted;
      } catch (error) {
        console.error('Error requesting push permission:', error);
        return false;
      }
    },

    // Subscribe to push notifications
    async subscribeToPush({ commit }) {
      try {
        const subscription = await pushNotificationService.subscribe();
        commit('SET_PUSH_ENABLED', !!subscription);
        return !!subscription;
      } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        return false;
      }
    },

    // Unsubscribe from push notifications
    async unsubscribeFromPush({ commit }) {
      try {
        const result = await pushNotificationService.unsubscribe();
        commit('SET_PUSH_ENABLED', !result);
        return result;
      } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return false;
      }
    },

    // Fetch notifications from API
    async fetchNotifications({ commit }, { page = 1, limit = 10 } = {}) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);

      try {
        const response = await axios.get('/api/notifications', {
          params: { page, limit }
        });

        // Extract data from response
        const {
          notifications,
          pagination: { totalPages, totalCount }
        } = response.data.data;

        // Update state
        commit('SET_NOTIFICATIONS', notifications);
        commit('SET_PAGINATION', {
          page,
          limit,
          totalPages,
          totalCount
        });

        return notifications;
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch notifications');
        console.error('Error fetching notifications:', error);
        return [];
      } finally {
        commit('SET_LOADING', false);
      }
    },

    // Add a new notification (typically from push notification service)
    addNotification({ commit, state }, notification) {
      // Check if notification already exists
      const exists = state.notifications.some(n => n.id === notification.id);
      
      if (!exists) {
        commit('ADD_NOTIFICATION', notification);
      }
    },

    // Mark notification as read
    async markAsRead({ commit }, notificationId) {
      try {
        await axios.put(`/api/notifications/${notificationId}/read`);
        commit('MARK_AS_READ', notificationId);
      } catch (error) {
        console.error(`Error marking notification ${notificationId} as read:`, error);
      }
    },

    // Mark all notifications as read
    async markAllAsRead({ commit }) {
      try {
        await axios.put('/api/notifications/read-all');
        commit('MARK_ALL_AS_READ');
      } catch (error) {
        console.error('Error marking all notifications as read:', error);
      }
    },

    // Handle notification click (typically from push notification service)
    async handleNotificationClick({ dispatch, getters }, notification) {
      // If notification has ID, mark it as read
      if (notification.id) {
        await dispatch('markAsRead', notification.id);
      }

      // Additional logic for handling notification click can be added here
    },

    // Update notification preferences
    async updateNotificationPreferences(_, preferences) {
      try {
        await pushNotificationService.updatePreferences(preferences);
        return true;
      } catch (error) {
        console.error('Error updating notification preferences:', error);
        return false;
      }
    },

    // Get notification preferences
    async getNotificationPreferences() {
      try {
        return await pushNotificationService.getPreferences();
      } catch (error) {
        console.error('Error getting notification preferences:', error);
        return null;
      }
    }
  }
};