import { defineStore } from 'pinia'
import { apiClient } from '@/services/api.service'

export const useChatStore = defineStore('chat', {
  state: () => ({
    chatDialogOpen: false,
    activeChat: null,
    chatMessages: {},
    unreadMessages: {}
  }),

  getters: {
    isChatOpen: (state) => state.chatDialogOpen,
    getChatMessages: (state) => (orderId) => state.chatMessages[orderId] || [],
    getUnreadMessageCount: (state) => (orderId) => state.unreadMessages[orderId] || 0,
    getTotalUnreadMessageCount: (state) => {
      return Object.values(state.unreadMessages).reduce((total, count) => total + count, 0)
    }
  },

  actions: {
    openChatWithDriver(driverInfo) {
      this.activeChat = driverInfo
      this.chatDialogOpen = true
      this.clearUnreadMessages(driverInfo.orderId)
    },

    closeChatDialog() {
      this.chatDialogOpen = false
    },

    async getChatHistory({ orderId, driverId }) {
      try {
        const response = await apiClient.get(`/api/orders/${orderId}/chat`)
        const messages = response.data || []
        this.chatMessages[orderId] = messages
        return messages
      } catch (error) {
        console.error('Error fetching chat history:', error)
        return []
      }
    },

    async sendMessage({ orderId, driverId, message }) {
      try {
        const response = await apiClient.post(`/api/orders/${orderId}/chat`, {
          driverId,
          message
        })
        
        const sentMessage = response.data
        if (!this.chatMessages[orderId]) {
          this.chatMessages[orderId] = []
        }
        this.chatMessages[orderId].push(sentMessage)
        return sentMessage
      } catch (error) {
        console.error('Error sending message:', error)
        throw error
      }
    },

    receiveMessage({ orderId, message }) {
      if (!this.chatMessages[orderId]) {
        this.chatMessages[orderId] = []
      }
      this.chatMessages[orderId].push(message)

      if (!this.chatDialogOpen || this.activeChat?.orderId !== orderId) {
        if (!this.unreadMessages[orderId]) {
          this.unreadMessages[orderId] = 0
        }
        this.unreadMessages[orderId]++
      }
    },

    updateMessageStatus({ orderId, messageId, status }) {
      const messages = this.chatMessages[orderId]
      if (messages) {
        const messageIndex = messages.findIndex(m => m.id === messageId)
        if (messageIndex !== -1) {
          messages[messageIndex].status = status
        }
      }
    },

    clearUnreadMessages(orderId) {
      this.unreadMessages[orderId] = 0
    }
  }
}) 