import { ref } from 'vue'
import { useWebSocket } from '@/services/websocket'

class ChatService {
  constructor() {
    this.conversations = ref(new Map())
    this.activeConversation = ref(null)
    this.unreadCounts = ref(new Map())
    this.ws = useWebSocket()
    this.handlers = new Map()

    // Initialize WebSocket handlers
    this.initWebSocket()
  }

  initWebSocket() {
    this.ws.on('chat:message', this.handleNewMessage.bind(this))
    this.ws.on('chat:typing', this.handleTypingStatus.bind(this))
    this.ws.on('chat:read', this.handleReadReceipt.bind(this))
  }

  // Create or get a conversation
  async getConversation(conversationId) {
    if (!this.conversations.value.has(conversationId)) {
      try {
        // Fetch conversation history from API
        const response = await fetch(`/api/chat/conversations/${conversationId}/messages`)
        const data = await response.json()
        
        this.conversations.value.set(conversationId, {
          id: conversationId,
          messages: data.messages || [],
          participants: data.participants || [],
          typingUsers: new Set(),
          lastRead: new Map()
        })
      } catch (error) {
        console.error('Failed to fetch conversation:', error)
        throw error
      }
    }

    return this.conversations.value.get(conversationId)
  }

  // Send a message
  async sendMessage(conversationId, content, metadata = {}) {
    const conversation = await this.getConversation(conversationId)
    const message = {
      id: `temp-${Date.now()}`,
      content,
      sender: 'driver', // Current user type
      timestamp: new Date().toISOString(),
      status: 'sending',
      metadata
    }

    // Add to local conversation
    conversation.messages.push(message)

    try {
      // Send via WebSocket
      this.ws.send('chat:message', {
        conversationId,
        content,
        metadata
      })

      // Mark as sent
      message.status = 'sent'
    } catch (error) {
      message.status = 'failed'
      console.error('Failed to send message:', error)
      throw error
    }

    return message
  }

  // Mark messages as read
  async markAsRead(conversationId) {
    const conversation = await this.getConversation(conversationId)
    if (!conversation) return

    try {
      await this.ws.send('chat:read', { conversationId })
      this.unreadCounts.value.set(conversationId, 0)
      
      // Update last read timestamp
      conversation.lastRead.set('driver', new Date().toISOString())
    } catch (error) {
      console.error('Failed to mark messages as read:', error)
      throw error
    }
  }

  // Send typing status
  sendTypingStatus(conversationId, isTyping) {
    this.ws.send('chat:typing', {
      conversationId,
      isTyping
    })
  }

  // Handle incoming message
  handleNewMessage(data) {
    const { conversationId, message } = data
    const conversation = this.conversations.value.get(conversationId)
    
    if (conversation) {
      conversation.messages.push(message)

      // Update unread count if not the active conversation
      if (this.activeConversation.value !== conversationId) {
        const currentCount = this.unreadCounts.value.get(conversationId) || 0
        this.unreadCounts.value.set(conversationId, currentCount + 1)
      }

      // Notify handlers
      this.notifyHandlers(conversationId, 'message', message)
    }
  }

  // Handle typing status
  handleTypingStatus(data) {
    const { conversationId, userId, isTyping } = data
    const conversation = this.conversations.value.get(conversationId)
    
    if (conversation) {
      if (isTyping) {
        conversation.typingUsers.add(userId)
      } else {
        conversation.typingUsers.delete(userId)
      }

      this.notifyHandlers(conversationId, 'typing', {
        userId,
        isTyping
      })
    }
  }

  // Handle read receipts
  handleReadReceipt(data) {
    const { conversationId, userId, timestamp } = data
    const conversation = this.conversations.value.get(conversationId)
    
    if (conversation) {
      conversation.lastRead.set(userId, timestamp)
      this.notifyHandlers(conversationId, 'read', {
        userId,
        timestamp
      })
    }
  }

  // Subscribe to conversation updates
  subscribe(conversationId, handler) {
    if (!this.handlers.has(conversationId)) {
      this.handlers.set(conversationId, new Set())
    }
    this.handlers.get(conversationId).add(handler)
  }

  // Unsubscribe from conversation updates
  unsubscribe(conversationId, handler) {
    const handlers = this.handlers.get(conversationId)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  // Notify handlers of updates
  notifyHandlers(conversationId, event, data) {
    const handlers = this.handlers.get(conversationId)
    if (handlers) {
      handlers.forEach(handler => handler(event, data))
    }
  }

  // Set active conversation
  setActiveConversation(conversationId) {
    this.activeConversation.value = conversationId
    if (conversationId) {
      this.markAsRead(conversationId)
    }
  }

  // Get unread count for a conversation
  getUnreadCount(conversationId) {
    return this.unreadCounts.value.get(conversationId) || 0
  }

  // Get total unread count
  getTotalUnreadCount() {
    let total = 0
    this.unreadCounts.value.forEach(count => {
      total += count
    })
    return total
  }

  // Format timestamp for display
  formatTimestamp(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit'
      })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long' })
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }
}

export default new ChatService()
