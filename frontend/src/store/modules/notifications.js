import axios from 'axios';
import { pushNotificationService } from '@/services/push-notification.service'
import { ref } from 'vue'
import { API_URL } from '@/config'

const state = {
  notifications: [],
  unreadCount: 0,
  preferences: {
    push: false,
    email: true,
    sms: false,
    enabledTypes: [
      'order_status',
      'driver_location',
      'chat',
      'system'
    ]
  },
  pushSupported: false,
  pushPermission: 'default',
  isSubscribing: false,
  loading: false,
  error: null,
  totalCount: 0,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 0
  },
  pushNotificationsEnabled: false,
  pushPermissionStatus: 'default', // 'default', 'granted', 'denied', 'unsupported'
  showNotification: false,
  currentNotification: null
}

const getters = {
  // Get count of unread notifications
  unreadCount(state) {
    if (!state.notifications) return 0;
    return state.notifications.filter(n => !n.read).length;
  },

  // Get notification by ID
  getNotificationById: (state) => (id) => {
    return state.notifications?.find(n => n.id === id);
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
  },

  // Group notifications by date
  notificationsByDate(state) {
    if (!state.notifications || state.notifications.length === 0) {
      return [];
    }

    // Helper function to get date string
    const getDateString = (dateStr) => {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    // Group notifications by date
    const groups = {};
    state.notifications.forEach(notification => {
      const dateStr = getDateString(notification.createdAt);
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          notifications: []
        };
      }
      groups[dateStr].notifications.push(notification);
    });

    // Convert to array and sort by date (newest first)
    const result = Object.values(groups).sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    // Add user-friendly labels
    result.forEach(group => {
      const date = new Date(group.date);
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      if (getDateString(now) === group.date) {
        group.label = 'Today';
      } else if (getDateString(yesterday) === group.date) {
        group.label = 'Yesterday';
      } else {
        group.label = date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
        });
      }
    });

    return result;
  },

  // Additional getters
  allNotifications: state => state.notifications || [],
  currentNotification: state => state.currentNotification,
  isShowingNotification: state => state.showNotification,
  unreadNotifications: state => state.notifications ? state.notifications.filter(n => !n.read) : [],
  notificationsByType: state => type => state.notifications ? state.notifications.filter(n => n.type === type) : [],
  isPushEnabled: state => state.preferences.push && state.pushPermission === 'granted',
  canEnablePush: state => state.pushSupported && !state.isSubscribing
}

const mutations = {
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
    // Keep only last 50 notifications
    if (state.notifications.length > 50) {
      state.notifications.pop()
    }
    if (!notification.read) {
      state.unreadCount++
    }
  },

  MARK_AS_READ(state, notificationId) {
    const notification = state.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
    if (notification && !notification.read) {
      notification.read = true
      state.unreadCount = Math.max(0, state.unreadCount - 1)
    }
  },

  MARK_ALL_AS_READ(state) {
    state.notifications.forEach(notification => {
      notification.read = true;
    });
    state.notifications.forEach(n => { n.read = true })
    state.unreadCount = 0
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
  },

  SET_SHOW_NOTIFICATION(state, value) {
    state.showNotification = value
  },

  SET_CURRENT_NOTIFICATION(state, notification) {
    state.currentNotification = notification
  },

  UPDATE_PREFERENCES(state, preferences) {
    state.preferences = { ...state.preferences, ...preferences }
  },
  SET_PUSH_SUPPORTED(state, supported) {
    state.pushSupported = supported
  },
  SET_PUSH_PERMISSION(state, permission) {
    state.pushPermission = permission
  },
  SET_IS_SUBSCRIBING(state, isSubscribing) {
    state.isSubscribing = isSubscribing
  }
}

const actions = {
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
  async fetchNotifications({ commit, state }) {
    commit('SET_LOADING', true);
    
    try {
      const response = await axios.get(`${API_URL}/api/notifications`, {
        params: {
          page: state.pagination.page,
          limit: state.pagination.limit
        }
      });
      
      if (response.data && response.data.data) {
        const { notifications, totalPages, currentPage, totalCount } = response.data.data;
        
        commit('SET_NOTIFICATIONS', notifications || []);
        commit('SET_PAGINATION', {
          page: currentPage || 1,
          limit: state.pagination.limit,
          totalPages: totalPages || 1,
          totalCount: totalCount || 0
        });
        
        return response.data.data;
      }
      
      return { notifications: [], totalPages: 0, totalCount: 0 };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set empty notifications and reset pagination on error
      commit('SET_NOTIFICATIONS', []);
      commit('SET_PAGINATION', {
        page: 1,
        limit: state.pagination.limit,
        totalPages: 0,
        totalCount: 0
      });
      
      return { notifications: [], totalPages: 0, totalCount: 0 };
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
      await axios.patch(`${API_URL}/api/notifications/read`, {
        notificationIds: [notificationId]
      });
      commit('MARK_AS_READ', notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  // Mark all notifications as read
  async markAllAsRead({ commit }) {
    try {
      await axios.patch(`${API_URL}/api/notifications/read-all`);
      commit('MARK_ALL_AS_READ');
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
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

  // Get notification preferences from the backend
  async getPreferences({ commit, state }) {
    try {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      const response = await axios.get(`${API_URL}/api/notifications/preferences`);
      
      // Make sure we have a preferences object with default values in case anything is missing
      const preferences = response.data.data || {};
      
      // Update the preferences in the state
      commit('UPDATE_PREFERENCES', preferences);
      
      // Return the preferences for the component to use
      return {
        push: preferences.push || false,
        email: preferences.email || false,
        sms: preferences.sms || false,
        enabledTypes: preferences.enabledTypes || []
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      commit('SET_ERROR', 'Failed to load notification preferences');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  // Update notification preferences in the backend
  async updateNotificationPreferences({ commit }, preferences) {
    try {
      const response = await axios.put(`${API_URL}/api/notifications/preferences`, preferences);
      commit('UPDATE_PREFERENCES', preferences);
      return response.data;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  showOrderNotification({ commit }, { title, message, type = 'info' }) {
    const notification = {
      id: Date.now(),
      title,
      message,
      type,
      timestamp: new Date(),
      read: false
    }
    
    commit('ADD_NOTIFICATION', notification)
    commit('SET_CURRENT_NOTIFICATION', notification)
    commit('SET_SHOW_NOTIFICATION', true)
    
    // Show browser notification if permitted
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body: message,
        icon: '/img/icons/android-chrome-192x192.png'
      })
    }
    
    return notification
  },
  
  closeNotification({ commit }) {
    commit('SET_SHOW_NOTIFICATION', false)
    commit('SET_CURRENT_NOTIFICATION', null)
  },

  // Initialize notifications system
  async init({ dispatch, commit }) {
    try {
      const supported = pushNotificationService.isPushSupported();
      commit('SET_PUSH_SUPPORTED', supported);
    if (supported) {
        await pushNotificationService.init();
        commit('SET_PUSH_PERMISSION', pushNotificationService.getPermissionStatus());
      }
      await dispatch('loadPreferences');
      await dispatch('fetchNotifications');
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  },

  // Load user's notification preferences
  async loadPreferences({ commit }) {
    try {
      // Get user notification preferences from API
      const response = await axios.get(`${API_URL}/api/notifications/preferences`);
      
      if (response.data) {
        // Update state with preferences from API
        commit('UPDATE_PREFERENCES', response.data);
      }
      
      return response.data;
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      
      // Default preferences in case of error
      const defaultPreferences = {
        push: false,
        email: true,
        sms: false,
        enabledTypes: [
          'order_status',
          'driver_location',
          'chat',
          'system'
        ]
      };
      
      commit('UPDATE_PREFERENCES', defaultPreferences);
      return defaultPreferences;
    }
  },

  // Update notification preferences
  async updatePreferences({ commit }, preferences) {
    try {
      const response = await axios.put(`${API_URL}/api/notifications/preferences`, preferences);
      
      if (response.data && response.data.data) {
        commit('UPDATE_PREFERENCES', response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
      throw error;
    }
  },

  // Request push notification permission
  async requestPushPermission({ commit, state }) {
    if (!state.pushSupported) return false

    commit('SET_IS_SUBSCRIBING', true)
    try {
      await pushNotificationService.requestPermission()
      commit('SET_PUSH_PERMISSION', 'granted')
      commit('UPDATE_PREFERENCES', { push: true })
      return true
    } catch (error) {
      console.error('Failed to request push permission:', error)
      return false
    } finally {
      commit('SET_IS_SUBSCRIBING', false)
    }
  },

  // Unsubscribe from push notifications
  async unsubscribeFromPush({ commit }) {
    try {
      await pushNotificationService.unsubscribe()
      commit('UPDATE_PREFERENCES', { push: false })
      return true
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error)
      return false
    }
  },

  // Handle incoming push notification
  handlePushNotification({ commit, state }, notification) {
    // Add to notifications list if not already present
    const exists = state.notifications.some(n => n.id === notification.id)
    if (!exists) {
      commit('ADD_NOTIFICATION', {
        ...notification,
        read: false,
        receivedAt: new Date().toISOString()
      })
    }
  },

  // Delete a notification
  async deleteNotification({ commit, state }, notificationId) {
    try {
      await axios.delete(`${API_URL}/api/notifications/${notificationId}`);
      
      // Remove from local state
      const updatedNotifications = state.notifications.filter(n => n.id !== notificationId);
      commit('SET_NOTIFICATIONS', updatedNotifications);
      
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Add these actions inside the actions object
  async fetchSettings({ commit, state }) {
    commit('SET_LOADING', true);
    try {
      // Use existing preferences if we already have them loaded
      if (state.preferences) {
        return { ...state.preferences };
      }
      
      const response = await axios.get(`${API_URL}/notifications/settings`);
      const settings = response.data.data || response.data;
      
      commit('UPDATE_PREFERENCES', settings);
      return settings;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      commit('SET_ERROR', error.message || 'Failed to fetch notification settings');
      
      // Return default settings if there's an error
      return { ...state.preferences };
    } finally {
      commit('SET_LOADING', false);
    }
  },

  async updateSettings({ commit }, settings) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.put(`${API_URL}/notifications/settings`, settings);
      const updatedSettings = response.data.data || response.data;
      
      commit('UPDATE_PREFERENCES', updatedSettings);
      return updatedSettings;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      commit('SET_ERROR', error.message || 'Failed to update notification settings');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}