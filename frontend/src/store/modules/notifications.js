import { notificationService } from '@/services/notifications.service';

export default {
  namespaced: true,
  
  state: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    preferences: {
      orderUpdates: true,
      promotions: true,
      accountActivity: true,
      pushEnabled: false,
      emailEnabled: true
    },
    deviceToken: null
  },
  
  mutations: {
    SET_NOTIFICATIONS(state, notifications) {
      state.notifications = notifications;
    },
    
    ADD_NOTIFICATION(state, notification) {
      state.notifications.unshift(notification);
      if (!notification.read) {
        state.unreadCount++;
      }
    },
    
    MARK_AS_READ(state, id) {
      const notification = state.notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    MARK_ALL_AS_READ(state) {
      state.notifications.forEach(n => {
        n.read = true;
      });
      state.unreadCount = 0;
    },
    
    DELETE_NOTIFICATION(state, id) {
      const index = state.notifications.findIndex(n => n.id === id);
      if (index !== -1) {
        const notification = state.notifications[index];
        if (!notification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        state.notifications.splice(index, 1);
      }
    },
    
    SET_UNREAD_COUNT(state, count) {
      state.unreadCount = count;
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading;
    },
    
    SET_PREFERENCES(state, preferences) {
      state.preferences = { ...state.preferences, ...preferences };
    },
    
    SET_DEVICE_TOKEN(state, token) {
      state.deviceToken = token;
    }
  },
  
  actions: {
    async fetchNotifications({ commit, state }) {
      if (state.loading) return;
      
      commit('SET_LOADING', true);
      
      try {
        const response = await notificationService.getNotifications();
        const notifications = response.data.data;
        
        commit('SET_NOTIFICATIONS', notifications);
        commit('SET_UNREAD_COUNT', notifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    async markAsRead({ commit }, id) {
      try {
        await notificationService.markAsRead(id);
        commit('MARK_AS_READ', id);
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    },
    
    async markAllAsRead({ commit }) {
      try {
        await notificationService.markAllAsRead();
        commit('MARK_ALL_AS_READ');
      } catch (error) {
        console.error('Failed to mark all notifications as read:', error);
      }
    },
    
    async deleteNotification({ commit }, id) {
      try {
        await notificationService.deleteNotification(id);
        commit('DELETE_NOTIFICATION', id);
      } catch (error) {
        console.error('Failed to delete notification:', error);
      }
    },
    
    async getPreferences({ commit }) {
      try {
        const response = await notificationService.getPreferences();
        commit('SET_PREFERENCES', response.data.data);
      } catch (error) {
        console.error('Failed to get notification preferences:', error);
      }
    },
    
    async updatePreferences({ commit }, preferences) {
      try {
        await notificationService.updatePreferences(preferences);
        commit('SET_PREFERENCES', preferences);
      } catch (error) {
        console.error('Failed to update notification preferences:', error);
      }
    },
    
    async registerDevice({ commit, state }, token) {
      if (state.deviceToken === token) return;
      
      try {
        await notificationService.registerDevice(token);
        commit('SET_DEVICE_TOKEN', token);
        commit('SET_PREFERENCES', { pushEnabled: true });
      } catch (error) {
        console.error('Failed to register device for push notifications:', error);
      }
    },
    
    async unregisterDevice({ commit, state }) {
      if (!state.deviceToken) return;
      
      try {
        await notificationService.unregisterDevice(state.deviceToken);
        commit('SET_DEVICE_TOKEN', null);
        commit('SET_PREFERENCES', { pushEnabled: false });
      } catch (error) {
        console.error('Failed to unregister device for push notifications:', error);
      }
    },

    // Handle new push notification received
    handlePushNotification({ commit, dispatch }, notification) {
      // Add to notifications list
      commit('ADD_NOTIFICATION', notification);
      
      // Perform specific actions based on notification type
      switch (notification.type) {
        case 'order_status':
          // Update order status in store if relevant order is loaded
          dispatch('orders/updateOrderStatus', {
            orderId: notification.data.orderId,
            status: notification.data.status
          }, { root: true });
          break;
          
        case 'promotion':
          // No specific action needed, notification display is enough
          break;
      }
    }
  },
  
  getters: {
    allNotifications: state => state.notifications,
    
    unreadNotifications: state => state.notifications.filter(n => !n.read),
    
    unreadCount: state => state.unreadCount,
    
    isLoading: state => state.loading,
    
    preferences: state => state.preferences,
    
    isPushEnabled: state => state.preferences.pushEnabled
  }
};