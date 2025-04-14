const notifications = {
  namespaced: true,
  state: {
    notifications: [],
    showNotification: false,
    currentNotification: null,
    hasPermission: false
  },
  mutations: {
    SET_NOTIFICATIONS(state, notifications) {
      state.notifications = notifications;
    },
    ADD_NOTIFICATION(state, notification) {
      state.notifications.push(notification);
    },
    REMOVE_NOTIFICATION(state, id) {
      state.notifications = state.notifications.filter(n => n.id !== id);
    },
    SET_SHOW_NOTIFICATION(state, value) {
      state.showNotification = value;
    },
    SET_CURRENT_NOTIFICATION(state, notification) {
      state.currentNotification = notification;
    },
    SET_HAS_PERMISSION(state, value) {
      state.hasPermission = value;
    }
  },
  actions: {
    async initNotifications({ commit }) {
      try {
        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          commit('SET_HAS_PERMISSION', permission === 'granted');
        } else {
          commit('SET_HAS_PERMISSION', Notification.permission === 'granted');
        }
      } catch (error) {
        console.error('Failed to initialize notifications:', error);
        commit('SET_HAS_PERMISSION', false);
      }
    },

    addNotification({ commit, dispatch }, notification) {
      commit('ADD_NOTIFICATION', notification);
      dispatch('showLatestNotification');
    },

    removeNotification({ commit, state }, id) {
      commit('REMOVE_NOTIFICATION', id);
      if (state.currentNotification?.id === id) {
        commit('SET_CURRENT_NOTIFICATION', null);
        commit('SET_SHOW_NOTIFICATION', false);
      }
    },

    showLatestNotification({ commit, state }) {
      if (state.notifications.length > 0) {
        commit('SET_CURRENT_NOTIFICATION', state.notifications[state.notifications.length - 1]);
        commit('SET_SHOW_NOTIFICATION', true);
      }
    },

    setShowNotification({ commit }, value) {
      commit('SET_SHOW_NOTIFICATION', value);
      if (!value) {
        commit('SET_CURRENT_NOTIFICATION', null);
      }
    },

    clearNotifications({ commit }) {
      commit('SET_NOTIFICATIONS', []);
      commit('SET_CURRENT_NOTIFICATION', null);
      commit('SET_SHOW_NOTIFICATION', false);
    }
  }
};

export default notifications;
