import axios from 'axios'
import { io } from 'socket.io-client'

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
      const response = await axios.post('/api/support/tickets', data)
      return response.data
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
}