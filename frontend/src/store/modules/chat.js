// Chat module for Vuex store
import { api } from '@/services/api';

const state = {
  chatDialogOpen: false,
  activeChat: null,
  chatMessages: {},
  unreadMessages: {}
};

const mutations = {
  SET_CHAT_DIALOG_OPEN(state, isOpen) {
    state.chatDialogOpen = isOpen;
  },
  SET_ACTIVE_CHAT(state, chatInfo) {
    state.activeChat = chatInfo;
  },
  SET_CHAT_MESSAGES(state, { orderId, messages }) {
    state.chatMessages = {
      ...state.chatMessages,
      [orderId]: messages
    };
  },
  ADD_CHAT_MESSAGE(state, { orderId, message }) {
    if (!state.chatMessages[orderId]) {
      state.chatMessages[orderId] = [];
    }
    state.chatMessages[orderId].push(message);
  },
  UPDATE_MESSAGE_STATUS(state, { orderId, messageId, status }) {
    const messages = state.chatMessages[orderId];
    if (messages) {
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex !== -1) {
        messages[messageIndex].status = status;
      }
    }
  },
  INCREMENT_UNREAD_MESSAGES(state, orderId) {
    if (!state.unreadMessages[orderId]) {
      state.unreadMessages[orderId] = 0;
    }
    state.unreadMessages[orderId] += 1;
  },
  CLEAR_UNREAD_MESSAGES(state, orderId) {
    state.unreadMessages[orderId] = 0;
  }
};

const actions = {
  openChatWithDriver({ commit }, driverInfo) {
    commit('SET_ACTIVE_CHAT', driverInfo);
    commit('SET_CHAT_DIALOG_OPEN', true);
    commit('CLEAR_UNREAD_MESSAGES', driverInfo.orderId);
  },
  
  closeChatDialog({ commit }) {
    commit('SET_CHAT_DIALOG_OPEN', false);
  },
  
  async getChatHistory({ commit }, { orderId, driverId }) {
    try {
      // In a real app, this would fetch from your API
      // For now, we'll return mock data
      const response = await api.get(`/orders/${orderId}/chat`);
      const messages = response.data || []; // Mock data if API not implemented yet
      
      commit('SET_CHAT_MESSAGES', { orderId, messages });
      return messages;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  },
  
  async sendMessage({ commit }, { orderId, driverId, message }) {
    try {
      // In a real app, this would send to your API
      // For now, we'll simulate a response
      const response = await api.post(`/orders/${orderId}/chat`, {
        driverId,
        message
      });
      
      const sentMessage = response.data;
      commit('ADD_CHAT_MESSAGE', { orderId, message: sentMessage });
      return sentMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },
  
  receiveMessage({ commit, state }, { orderId, message }) {
    commit('ADD_CHAT_MESSAGE', { orderId, message });
    
    // If chat is not active or is for a different order, increment unread
    if (!state.chatDialogOpen || state.activeChat?.orderId !== orderId) {
      commit('INCREMENT_UNREAD_MESSAGES', orderId);
    }
  },
  
  updateMessageStatus({ commit }, { orderId, messageId, status }) {
    commit('UPDATE_MESSAGE_STATUS', { orderId, messageId, status });
  }
};

const getters = {
  isChatOpen: state => state.chatDialogOpen,
  activeChat: state => state.activeChat,
  getChatMessages: state => orderId => state.chatMessages[orderId] || [],
  getUnreadMessageCount: state => orderId => state.unreadMessages[orderId] || 0,
  getTotalUnreadMessageCount: state => {
    return Object.values(state.unreadMessages).reduce((total, count) => total + count, 0);
  }
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};