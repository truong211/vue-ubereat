const chat = {
  namespaced: true,
  state: {
    isChatOpen: false,
    activeChat: null
  },
  mutations: {
    SET_CHAT_OPEN(state, isOpen) {
      state.isChatOpen = isOpen;
    },
    SET_ACTIVE_CHAT(state, chat) {
      state.activeChat = chat;
    }
  },
  actions: {
    openChatDialog({ commit }, chatInfo) {
      commit('SET_ACTIVE_CHAT', chatInfo);
      commit('SET_CHAT_OPEN', true);
    },
    closeChatDialog({ commit }) {
      commit('SET_CHAT_OPEN', false);
      commit('SET_ACTIVE_CHAT', null);
    }
  }
};

export default chat;
