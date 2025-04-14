import { SupportChat } from '@/services/support.service'
import axios from 'axios'

const state = {
  // Customer support chat state
  chatOpen: false,
  activeChatId: null,
  messages: {},
  supportAgentTyping: false,
  unreadMessages: 0,
  activeTickets: [],

  // Admin support management state
  adminTickets: [],
  activeAdminTicket: null,
  ticketMessages: {},
  ticketStats: {
    statusCounts: {
      open: 0,
      inProgress: 0,
      resolved: 0,
      closed: 0
    },
    priorityCounts: {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    },
    categoryCounts: {
      account: 0,
      order: 0,
      payment: 0,
      delivery: 0,
      restaurant: 0,
      app: 0,
      other: 0
    },
    unassigned: 0,
    total: 0
  },
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0
  },
  filters: {
    status: null,
    priority: null,
    category: null,
    search: ''
  },
  supportChat: null
}

const mutations = {
  // Customer support chat mutations
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
  },

  // Admin support management mutations
  SET_ADMIN_TICKETS(state, tickets) {
    state.adminTickets = tickets
  },

  SET_ACTIVE_ADMIN_TICKET(state, ticket) {
    state.activeAdminTicket = ticket
  },

  SET_TICKET_MESSAGES(state, { ticketId, messages }) {
    state.ticketMessages = {
      ...state.ticketMessages,
      [ticketId]: messages
    }
  },

  ADD_TICKET_MESSAGE(state, { ticketId, message }) {
    if (!state.ticketMessages[ticketId]) {
      state.ticketMessages[ticketId] = []
    }

    state.ticketMessages[ticketId].push(message)
  },

  SET_TICKET_STATS(state, stats) {
    state.ticketStats = stats
  },

  UPDATE_ADMIN_TICKET(state, { ticketId, ticket }) {
    state.adminTickets = state.adminTickets.map(t =>
      t.id === ticketId ? { ...t, ...ticket } : t
    )

    if (state.activeAdminTicket && state.activeAdminTicket.id === ticketId) {
      state.activeAdminTicket = { ...state.activeAdminTicket, ...ticket }
    }
  },

  SET_LOADING(state, loading) {
    state.loading = loading
  },

  SET_ERROR(state, error) {
    state.error = error
  },

  SET_PAGINATION(state, { totalPages, totalItems }) {
    state.pagination = {
      ...state.pagination,
      totalPages,
      totalItems
    }
  },

  SET_PAGE(state, page) {
    state.pagination.page = page
  },

  SET_FILTERS(state, filters) {
    state.filters = { ...state.filters, ...filters }
  },

  SET_SUPPORT_CHAT(state, supportChat) {
    state.supportChat = supportChat
  }
}

const actions = {
  // Customer support chat actions
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
  },

  // Admin support management actions
  async fetchAdminTickets({ commit, state }) {
    try {
      commit('SET_LOADING', true)

      const { page, limit } = state.pagination
      const { status, priority, category, search } = state.filters

      let url = `/api/support?page=${page}&limit=${limit}`
      if (status) url += `&status=${status}`
      if (priority) url += `&priority=${priority}`
      if (category) url += `&category=${category}`
      if (search) url += `&search=${search}`

      const response = await axios.get(url)

      commit('SET_ADMIN_TICKETS', response.data.data.tickets)
      commit('SET_PAGINATION', {
        totalPages: response.data.totalPages,
        totalItems: response.data.results
      })

      return response.data
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to fetch tickets')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchTicketById({ commit }, ticketId) {
    try {
      commit('SET_LOADING', true)

      const response = await axios.get(`/api/support/${ticketId}`)

      commit('SET_ACTIVE_ADMIN_TICKET', response.data.data.ticket)

      return response.data.data.ticket
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to fetch ticket')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchTicketMessages({ commit }, ticketId) {
    try {
      commit('SET_LOADING', true)

      const response = await axios.get(`/api/support/${ticketId}/messages`)

      commit('SET_TICKET_MESSAGES', {
        ticketId,
        messages: response.data.data.messages
      })

      return response.data.data.messages
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to fetch ticket messages')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async fetchTicketStats({ commit }) {
    try {
      commit('SET_LOADING', true)

      const response = await axios.get('/api/support/stats')

      commit('SET_TICKET_STATS', response.data.data)

      return response.data.data
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to fetch ticket statistics')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateTicket({ commit }, { ticketId, data }) {
    try {
      commit('SET_LOADING', true)

      const response = await axios.patch(`/api/support/${ticketId}`, data)

      commit('UPDATE_ADMIN_TICKET', {
        ticketId,
        ticket: response.data.data.ticket
      })

      return response.data.data.ticket
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to update ticket')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async addTicketMessage({ commit }, { ticketId, content, isInternal = false }) {
    try {
      commit('SET_LOADING', true)

      const response = await axios.post(`/api/support/${ticketId}/messages`, {
        content,
        isInternal
      })

      commit('ADD_TICKET_MESSAGE', {
        ticketId,
        message: response.data.data.message
      })

      return response.data.data.message
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to add message')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async assignTicket({ commit, dispatch }, { ticketId, adminId }) {
    try {
      commit('SET_LOADING', true)

      await dispatch('updateTicket', {
        ticketId,
        data: {
          assignedTo: adminId
        }
      })

      // If the ticket is open, also set it to in_progress
      const ticket = state.adminTickets.find(t => t.id === ticketId)
      if (ticket && ticket.status === 'open') {
        await dispatch('updateTicket', {
          ticketId,
          data: {
            status: 'in_progress'
          }
        })
      }

      return true
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to assign ticket')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  async updateTicketStatus({ commit, dispatch }, { ticketId, status }) {
    try {
      commit('SET_LOADING', true)

      await dispatch('updateTicket', {
        ticketId,
        data: { status }
      })

      return true
    } catch (error) {
      commit('SET_ERROR', error.message || 'Failed to update ticket status')
      throw error
    } finally {
      commit('SET_LOADING', false)
    }
  },

  setFilters({ commit }, filters) {
    commit('SET_FILTERS', filters)
  },

  setPage({ commit }, page) {
    commit('SET_PAGE', page)
  },

  initSupportChat({ commit }) {
    const supportChat = new SupportChat()
    supportChat.connect()
    commit('SET_SUPPORT_CHAT', supportChat)
  },

  clearActiveTicket({ commit }) {
    commit('SET_ACTIVE_ADMIN_TICKET', null)
  }
}

const getters = {
  // Customer support chat getters
  isChatOpen: state => state.chatOpen,
  activeChatId: state => state.activeChatId,
  activeChatMessages: state => {
    return state.activeChatId ? state.messages[state.activeChatId] || [] : []
  },
  isAgentTyping: state => state.supportAgentTyping,
  unreadMessageCount: state => state.unreadMessages,
  activeTickets: state => state.activeTickets,

  // Admin support management getters
  getTicketById: (state) => (id) => {
    return state.adminTickets.find(ticket => ticket.id === id)
  },
  getTicketMessages: (state) => (ticketId) => {
    return state.ticketMessages[ticketId] || []
  },
  getUnassignedCount: (state) => {
    return state.ticketStats.unassigned
  },
  getOpenTicketsCount: (state) => {
    return state.ticketStats.statusCounts.open + state.ticketStats.statusCounts.inProgress
  },
  getUrgentTicketsCount: (state) => {
    return state.ticketStats.priorityCounts.urgent + state.ticketStats.priorityCounts.high
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}