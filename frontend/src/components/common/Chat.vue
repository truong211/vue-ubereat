<template>
  <div class="chat">
    <!-- Chat Header -->
    <div class="chat-header">
      <v-toolbar
        density="comfortable"
        color="primary"
        theme="dark"
      >
        <v-btn
          v-if="showBackButton"
          icon="mdi-arrow-left"
          variant="text"
          @click="$emit('close')"
        ></v-btn>

        <v-toolbar-title class="text-truncate">
          {{ title }}
        </v-toolbar-title>

        <template v-if="showParticipantStatus">
          <v-divider vertical class="mx-2"></v-divider>
          <div class="text-caption">{{ participantStatus }}</div>
        </template>

        <v-spacer></v-spacer>

        <v-menu v-if="showOptions">
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              variant="text"
              v-bind="props"
            ></v-btn>
          </template>

          <v-list>
            <v-list-item
              v-for="option in menuOptions"
              :key="option.value"
              :value="option.value"
              @click="option.action"
            >
              <template v-slot:prepend>
                <v-icon :icon="option.icon"></v-icon>
              </template>
              <v-list-item-title>{{ option.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-toolbar>
    </div>

    <!-- Chat Messages -->
    <div
      ref="messageContainer"
      class="chat-messages"
      @scroll="handleScroll"
    >
      <!-- Loading -->
      <div v-if="loading" class="d-flex justify-center pa-4">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </div>

      <!-- Messages -->
      <div v-else>
        <!-- Load More -->
        <div
          v-if="hasMoreMessages"
          class="text-center pa-2"
        >
          <v-btn
            variant="text"
            size="small"
            :loading="loadingMore"
            @click="loadMoreMessages"
          >
            Load More
          </v-btn>
        </div>

        <!-- Message Groups -->
        <div
          v-for="group in messageGroups"
          :key="group.date"
          class="message-group"
        >
          <!-- Date Divider -->
          <div class="date-divider">
            <span class="date-text">{{ group.date }}</span>
          </div>

          <!-- Messages -->
          <div
            v-for="message in group.messages"
            :key="message.id"
            :class="[
              'message',
              `message-${message.sender === userId ? 'sent' : 'received'}`
            ]"
          >
            <div class="message-content">
              <div class="message-text">{{ message.content }}</div>
              <div class="message-meta">
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                <template v-if="message.sender === userId">
                  <v-icon
                    :icon="getStatusIcon(message.status)"
                    :color="getStatusColor(message.status)"
                    size="small"
                    class="ml-1"
                  ></v-icon>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="typing-indicator">
          <span>{{ typingText }}</span>
          <v-progress-circular
            indeterminate
            size="16"
            width="2"
            color="grey"
          ></v-progress-circular>
        </div>
      </div>
    </div>

    <!-- Chat Input -->
    <div class="chat-input">
      <v-form
        ref="form"
        @submit.prevent="sendMessage"
        class="d-flex align-center pa-2"
      >
        <v-text-field
          v-model="newMessage"
          placeholder="Type a message"
          :loading="sending"
          :readonly="sending"
          hide-details
          density="comfortable"
          variant="outlined"
          @input="handleTyping"
          @keydown.enter.prevent="sendMessage"
        >
          <template v-slot:prepend>
            <v-btn
              icon="mdi-paperclip"
              variant="text"
              @click="$refs.fileInput.click()"
            ></v-btn>
            <input
              ref="fileInput"
              type="file"
              class="d-none"
              accept="image/*"
              @change="handleFileUpload"
            >
          </template>
        </v-text-field>

        <v-btn
          icon="mdi-send"
          color="primary"
          class="ml-2"
          :disabled="!canSend"
          :loading="sending"
          @click="sendMessage"
        ></v-btn>
      </v-form>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import chatService from '@/services/chat'
import { debounce } from 'lodash'

export default {
  name: 'Chat',

  props: {
    // Conversation ID
    conversationId: {
      type: String,
      required: true
    },
    // Current user ID
    userId: {
      type: String,
      required: true
    },
    // Chat title
    title: {
      type: String,
      required: true
    },
    // Show back button
    showBackButton: {
      type: Boolean,
      default: true
    },
    // Show participant status
    showParticipantStatus: {
      type: Boolean,
      default: true
    },
    // Show options menu
    showOptions: {
      type: Boolean,
      default: true
    },
    // Menu options
    menuOptions: {
      type: Array,
      default: () => []
    }
  },

  emits: ['close', 'message-sent', 'error'],

  setup(props, { emit }) {
    // Refs
    const messageContainer = ref(null)
    const form = ref(null)
    const fileInput = ref(null)
    const newMessage = ref('')
    const loading = ref(true)
    const loadingMore = ref(false)
    const sending = ref(false)
    const typingTimeout = ref(null)

    // State
    const conversation = ref(null)
    const hasMoreMessages = ref(false)
    const isTyping = ref(false)

    // Computed
    const messageGroups = computed(() => {
      if (!conversation.value) return []

      const groups = {}
      conversation.value.messages.forEach(message => {
        const date = new Date(message.timestamp).toLocaleDateString()
        if (!groups[date]) {
          groups[date] = {
            date,
            messages: []
          }
        }
        groups[date].messages.push(message)
      })

      return Object.values(groups)
    })

    const participantStatus = computed(() => {
      if (!conversation.value) return ''
      const typingUsers = Array.from(conversation.value.typingUsers)
      if (typingUsers.length > 0) {
        return 'Typing...'
      }
      return 'Online' // Could be more sophisticated with actual online status
    })

    const canSend = computed(() => {
      return newMessage.value.trim().length > 0 && !sending.value
    })

    const typingText = computed(() => {
      if (!conversation.value) return ''
      const typingUsers = Array.from(conversation.value.typingUsers)
      if (typingUsers.length === 0) return ''
      if (typingUsers.length === 1) return `${typingUsers[0]} is typing...`
      return 'Multiple people are typing...'
    })

    // Methods
    const initializeChat = async () => {
      try {
        conversation.value = await chatService.getConversation(props.conversationId)
        loading.value = false
        scrollToBottom()
      } catch (error) {
        emit('error', error)
      }
    }

    const sendMessage = async () => {
      if (!canSend.value) return

      const content = newMessage.value.trim()
      sending.value = true

      try {
        const message = await chatService.sendMessage(
          props.conversationId,
          content
        )
        newMessage.value = ''
        emit('message-sent', message)
        scrollToBottom()
      } catch (error) {
        emit('error', error)
      } finally {
        sending.value = false
      }
    }

    const handleTyping = debounce(() => {
      chatService.sendTypingStatus(props.conversationId, true)
      clearTimeout(typingTimeout.value)
      typingTimeout.value = setTimeout(() => {
        chatService.sendTypingStatus(props.conversationId, false)
      }, 3000)
    }, 300)

    const handleFileUpload = async (event) => {
      const file = event.target.files[0]
      if (!file) return

      sending.value = true
      try {
        // Implement file upload logic
        // await chatService.sendFile(props.conversationId, file)
      } catch (error) {
        emit('error', error)
      } finally {
        sending.value = false
        fileInput.value.value = ''
      }
    }

    const loadMoreMessages = async () => {
      if (loadingMore.value) return

      loadingMore.value = true
      try {
        // Implement pagination logic
      } catch (error) {
        emit('error', error)
      } finally {
        loadingMore.value = false
      }
    }

    const handleScroll = () => {
      if (!messageContainer.value) return

      const { scrollTop } = messageContainer.value
      if (scrollTop === 0) {
        loadMoreMessages()
      }
    }

    const scrollToBottom = () => {
      setTimeout(() => {
        if (messageContainer.value) {
          messageContainer.value.scrollTop = messageContainer.value.scrollHeight
        }
      }, 100)
    }

    const formatTime = (timestamp) => {
      return chatService.formatTimestamp(timestamp)
    }

    const getStatusIcon = (status) => {
      switch (status) {
        case 'sent': return 'mdi-check'
        case 'delivered': return 'mdi-check-all'
        case 'read': return 'mdi-check-all'
        case 'failed': return 'mdi-alert-circle'
        default: return 'mdi-clock-outline'
      }
    }

    const getStatusColor = (status) => {
      switch (status) {
        case 'read': return 'success'
        case 'failed': return 'error'
        default: return undefined
      }
    }

    // Lifecycle
    onMounted(() => {
      initializeChat()
      chatService.setActiveConversation(props.conversationId)
    })

    onUnmounted(() => {
      chatService.setActiveConversation(null)
      clearTimeout(typingTimeout.value)
    })

    // Watch
    watch(() => props.conversationId, () => {
      initializeChat()
    })

    return {
      messageContainer,
      form,
      fileInput,
      newMessage,
      loading,
      loadingMore,
      sending,
      conversation,
      hasMoreMessages,
      isTyping,
      messageGroups,
      participantStatus,
      canSend,
      typingText,
      sendMessage,
      handleTyping,
      handleFileUpload,
      loadMoreMessages,
      handleScroll,
      formatTime,
      getStatusIcon,
      getStatusColor
    }
  }
}
</script>

<style scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: #f5f5f5;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.message-group {
  margin-bottom: 20px;
}

.date-divider {
  text-align: center;
  margin: 20px 0;
  position: relative;
}

.date-text {
  background: #f5f5f5;
  padding: 0 10px;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.85em;
}

.message {
  margin-bottom: 8px;
  display: flex;
}

.message-sent {
  justify-content: flex-end;
}

.message-content {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  position: relative;
}

.message-sent .message-content {
  background-color: var(--v-primary-base);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-received .message-content {
  background-color: white;
  border-bottom-left-radius: 4px;
}

.message-text {
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.message-meta {
  display: flex;
  align-items: center;
  font-size: 0.75em;
  opacity: 0.7;
}

.typing-indicator {
  display: flex;
  align-items: center;
  padding: 8px;
  color: rgba(0, 0, 0, 0.6);
  font-size: 0.9em;
}

.chat-input {
  background-color: white;
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style>
