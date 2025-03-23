import { SupportChat } from '@/services/support.service'

const state = {
  chatOpen: false,
  activeChatId: null,
  messages: {},
  supportAgentTyping: false,
  unreadMessages: 0,
  activeTickets: []
}

const mutations = {
  SET_CHAT_OPEN(state, isOpen) {
    state.chatOpen = isOpen
  },
  SET_ACTIVE_CHAT(state, chatId) {
    state.activeChatId = chatId
  },
  ADD_MESSAGE(state, { chatId, message }) {
    if (!state.messages[chatId]) {
      state.messages[chatId] = []
    }
    state.messages[chatId].push(message)
  },
  SET_AGENT_TYPING(state, isTyping) {
    state.supportAgentTyping = isTyping
  },
  INCREMENT_UNREAD(state) {
    state.unreadMessages++
  },
  CLEAR_UNREAD(state) {
    state.unreadMessages = 0
  },
  SET_ACTIVE_TICKETS(state, tickets) {
    state.activeTickets = tickets
  },
  UPDATE_TICKET_STATUS(state, { ticketId, status }) {
    const ticket = state.activeTickets.find(t => t.id === ticketId)
    if (ticket) {
      ticket.status = status
    }
  }
}

const actions = {
  openChat({ commit, state }, { ticketId = null } = {}) {
    commit('SET_CHAT_OPEN', true)
    if (ticketId) {
      commit('SET_ACTIVE_CHAT', ticketId)
    }
  },
  
  closeChat({ commit }) {
    commit('SET_CHAT_OPEN', false)
    commit('SET_ACTIVE_CHAT', null)
  },
  
  async sendMessage({ commit, state }, { chatId, message }) {
    try {
      const supportChat = new SupportChat()
      const response = await supportChat.sendMessage(chatId, message)
      commit('ADD_MESSAGE', { chatId, message: response })
      return response
    } catch (error) {
      console.error('Failed to send message:', error)
      throw error
    }
  },

  async createSupportTicket({ commit }, { type, description, orderId = null }) {
    try {
      const supportChat = new SupportChat()
      const ticket = await supportChat.createTicket({
        type,
        description,
        orderId
      })
      commit('SET_ACTIVE_CHAT', ticket.chatId)
      return ticket
    } catch (error) {
      console.error('Failed to create support ticket:', error)
      throw error
    }
  },

  handleAgentMessage({ commit, state }, { chatId, message }) {
    commit('ADD_MESSAGE', { chatId, message })
    if (!state.chatOpen || state.activeChatId !== chatId) {
      commit('INCREMENT_UNREAD')
    }
  },
  
  handleAgentTyping({ commit }, isTyping) {
    commit('SET_AGENT_TYPING', isTyping)
  }
}

const getters = {
  isChatOpen: state => state.chatOpen,
  activeChatId: state => state.activeChatId,
  activeChatMessages: state => {
    return state.activeChatId ? state.messages[state.activeChatId] || [] : []
  },
  isAgentTyping: state => state.supportAgentTyping,
  unreadMessageCount: state => state.unreadMessages,
  activeTickets: state => state.activeTickets
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}