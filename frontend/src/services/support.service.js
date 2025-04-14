import axios from 'axios'
import { io } from 'socket.io-client'
import store from '@/store'

export class SupportChat {
  constructor() {
    this.socket = null
    this.handlers = new Map()
    this.typing = {
      timeout: null,
      isTyping: false
    }
  }

  async connect() {
    if (this.socket) return

    this.socket = io('/support', {
      auth: {
        token: localStorage.getItem('token')
      }
    })

    this.setupSocketListeners()
  }

  setupSocketListeners() {
    this.socket.on('agent:message', (data) => {
      this.notifyHandlers('message', data)
    })

    this.socket.on('agent:typing', (data) => {
      this.notifyHandlers('typing', data)
    })

    this.socket.on('ticket:status', (data) => {
      this.notifyHandlers('status', data)
    })

    this.socket.on('disconnect', () => {
      this.notifyHandlers('disconnect')
    })

    this.socket.on('reconnect', () => {
      this.notifyHandlers('reconnect')
    })

    // Admin support management events
    if (store.state.auth.user?.role === 'admin') {
      // Listen for new messages
      this.socket.on('new:message', (data) => {
        store.dispatch('support/handleNewMessage', data)
      })

      // Listen for typing status
      this.socket.on('user:typing', (data) => {
        store.dispatch('support/handleTypingStatus', data)
      })

      // Listen for ticket status updates
      this.socket.on('ticket:status:updated', (data) => {
        store.dispatch('support/handleTicketStatusUpdate', data)
      })

      // Listen for ticket assignments
      this.socket.on('ticket:assigned', (data) => {
        store.dispatch('support/handleTicketAssigned', data)
      })

      // New ticket
      this.socket.on('new:ticket', (data) => {
        store.dispatch('support/handleNewTicket', data)
      })

      // New message in a ticket
      this.socket.on('new:ticket:message', (data) => {
        store.dispatch('support/handleNewTicketMessage', data)
      })

      // Ticket assigned to you
      this.socket.on('ticket:assigned:to:you', (data) => {
        store.dispatch('support/handleTicketAssignedToYou', data)
      })
    }
  }

  async sendMessage(chatId, content) {
    if (!this.socket?.connected) {
      await this.connect()
    }

    return new Promise((resolve, reject) => {
      this.socket.emit('client:message', { chatId, content }, (response) => {
        if (response.error) {
          reject(new Error(response.error))
        } else {
          resolve(response)
        }
      })
    })
  }

  async createTicket(data) {
    try {
      const response = await axios.post('/api/support', {
        subject: `Support request: ${data.type}`,
        description: data.description,
        category: data.type,
        orderId: data.orderId || null
      })
      return {
        id: response.data.data.ticket.id,
        chatId: response.data.data.ticket.id,
        status: response.data.data.ticket.status
      }
    } catch (error) {
      throw new Error('Failed to create support ticket')
    }
  }

  sendTypingStatus(chatId, isTyping) {
    if (!this.socket?.connected) return

    // Debounce typing notifications
    if (this.typing.timeout) {
      clearTimeout(this.typing.timeout)
    }

    if (isTyping !== this.typing.isTyping) {
      this.typing.isTyping = isTyping
      this.socket.emit('client:typing', { chatId, isTyping })
    }

    if (isTyping) {
      this.typing.timeout = setTimeout(() => {
        this.sendTypingStatus(chatId, false)
      }, 3000)
    }
  }

  addHandler(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event).add(handler)
  }

  removeHandler(event, handler) {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  notifyHandlers(event, data) {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
    this.handlers.clear()
    if (this.typing.timeout) {
      clearTimeout(this.typing.timeout)
    }
  }

  // Admin-specific methods

  // Join a ticket room to receive updates
  joinTicket(ticketId) {
    if (!this.socket?.connected) return

    this.socket.emit('join:ticket', ticketId)
  }

  // Leave a ticket room
  leaveTicket(ticketId) {
    if (!this.socket?.connected) return

    this.socket.emit('leave:ticket', ticketId)
  }

  // Admin: Assign a ticket to an admin
  assignTicket(ticketId, adminId) {
    if (!this.socket?.connected) return Promise.reject(new Error('Not connected'))

    return new Promise((resolve, reject) => {
      this.socket.emit('admin:assign', { ticketId, adminId }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error))
        } else {
          resolve(true)
        }
      })
    })
  }

  // Admin: Update ticket status
  updateTicketStatus(ticketId, status) {
    if (!this.socket?.connected) return Promise.reject(new Error('Not connected'))

    return new Promise((resolve, reject) => {
      this.socket.emit('admin:update:status', { ticketId, status }, (response) => {
        if (response && response.error) {
          reject(new Error(response.error))
        } else {
          resolve(true)
        }
      })
    })
  }
}