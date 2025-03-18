<template>
  <v-dialog
    v-model="isOpen"
    max-width="500px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-avatar size="40" color="primary" class="mr-3">
          <v-icon color="white">mdi-bike</v-icon>
        </v-avatar>
        {{ driverName }}
        <v-spacer></v-spacer>
        <v-btn icon @click="closeChat">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="pa-0">
        <div class="chat-container">
          <div class="chat-messages" ref="messagesContainer">
            <div v-if="loading" class="text-center py-4">
              <v-progress-circular indeterminate size="24" color="primary"></v-progress-circular>
              <div class="text-body-2 mt-2">Loading messages...</div>
            </div>
            
            <div v-else-if="messages.length === 0" class="text-center py-8">
              <v-icon size="64" color="grey-lighten-2">mdi-message-outline</v-icon>
              <div class="text-body-1 mt-2">No messages yet</div>
              <div class="text-caption">Send a message to start the conversation</div>
            </div>
            
            <template v-else>
              <div 
                v-for="(message, index) in messages"
                :key="index"
                :class="[
                  'message-bubble',
                  message.sender === 'user' ? 'user-message' : 'driver-message'
                ]"
              >
                <div class="message-content">
                  {{ message.text }}
                </div>
                <div class="message-time">
                  {{ formatMessageTime(message.timestamp) }}
                </div>
                <div v-if="message.status" class="message-status">
                  <v-icon size="x-small" v-if="message.status === 'sent'">mdi-check</v-icon>
                  <v-icon size="x-small" v-else-if="message.status === 'delivered'">mdi-check-all</v-icon>
                  <v-icon size="x-small" color="primary" v-else-if="message.status === 'read'">mdi-check-all</v-icon>
                </div>
              </div>
              
              <div v-if="isTyping" class="typing-indicator">
                <div class="typing-bubble"></div>
                <div class="typing-bubble"></div>
                <div class="typing-bubble"></div>
                <span class="ml-2">{{ driverName }} is typing...</span>
              </div>
            </template>
          </div>
        </div>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions class="pa-3">
        <v-text-field
          v-model="messageInput"
          placeholder="Type a message..."
          variant="outlined"
          density="compact"
          hide-details
          @keyup.enter="sendMessage"
          :disabled="isSending"
        >
          <template v-slot:append-inner>
            <v-btn
              icon
              variant="text"
              color="primary"
              size="small"
              @click="sendMessage"
              :disabled="!messageInput.trim() || isSending"
              :loading="isSending"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </template>
        </v-text-field>
      </v-card-actions>
      
      <v-card-text class="pt-0 pb-3 px-3">
        <div class="d-flex align-center">
          <v-btn
            variant="text"
            density="comfortable"
            size="small"
            color="primary"
            class="mr-2"
            @click="sendQuickMessage('I can\'t find your location')"
          >
            I can't find your location
          </v-btn>
          
          <v-btn
            variant="text"
            density="comfortable"
            size="small"
            color="primary"
            @click="sendQuickMessage('How long until you arrive?')"
          >
            How long until you arrive?
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, onMounted, watch, nextTick, computed } from 'vue';
import { useStore } from 'vuex';
import { useSocket } from '@/composables/useSocket';

export default {
  name: 'OrderChatDialog',
  
  props: {
    orderId: {
      type: [String, Number],
      required: true
    },
    driverId: {
      type: [String, Number],
      required: true
    },
    driverName: {
      type: String,
      default: 'Driver'
    },
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['close'],
  
  setup(props, { emit }) {
    const store = useStore();
    const { socket, isConnected, connect } = useSocket();
    
    const messageInput = ref('');
    const messages = ref([]);
    const loading = ref(true);
    const isSending = ref(false);
    const isTyping = ref(false);
    const messagesContainer = ref(null);
    
    // Current user info
    const userId = computed(() => store.getters['auth/userId']);
    const userName = computed(() => store.getters['auth/userName']);
    
    // Load chat history
    const loadChatHistory = async () => {
      loading.value = true;
      
      try {
        // In a real app, fetch messages from API
        const chatHistory = await store.dispatch('chat/getChatHistory', {
          orderId: props.orderId,
          driverId: props.driverId
        });
        
        messages.value = chatHistory || [];
        
        // Scroll to bottom after messages load
        await nextTick();
        scrollToBottom();
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Send a message to the driver
    const sendMessage = async () => {
      const messageText = messageInput.value.trim();
      if (!messageText || isSending.value) return;
      
      isSending.value = true;
      
      try {
        // Add message to local state immediately
        const newMessage = {
          id: `temp-${Date.now()}`,
          sender: 'user',
          text: messageText,
          timestamp: new Date(),
          status: 'sending'
        };
        
        messages.value.push(newMessage);
        messageInput.value = '';
        
        // Scroll to bottom
        await nextTick();
        scrollToBottom();
        
        // In a real app, send message via WebSocket
        if (socket.value && isConnected.value) {
          socket.value.emit('sendMessage', {
            orderId: props.orderId,
            driverId: props.driverId,
            senderId: userId.value,
            senderName: userName.value,
            message: messageText
          });
          
          // Update message status to sent
          const messageIndex = messages.value.findIndex(m => m.id === newMessage.id);
          if (messageIndex !== -1) {
            messages.value[messageIndex].status = 'sent';
          }
        } else {
          // Fallback to REST API if WebSocket not available
          const sentMessage = await store.dispatch('chat/sendMessage', {
            orderId: props.orderId,
            driverId: props.driverId,
            message: messageText
          });
          
          // Replace temporary message with actual message from server
          const messageIndex = messages.value.findIndex(m => m.id === newMessage.id);
          if (messageIndex !== -1) {
            messages.value[messageIndex] = sentMessage;
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        
        // Mark message as failed
        const messageIndex = messages.value.findIndex(m => m.id === `temp-${Date.now()}`);
        if (messageIndex !== -1) {
          messages.value[messageIndex].status = 'failed';
        }
      } finally {
        isSending.value = false;
      }
    };
    
    // Send a quick pre-defined message
    const sendQuickMessage = (text) => {
      messageInput.value = text;
      sendMessage();
    };
    
    // Format message timestamp
    const formatMessageTime = (timestamp) => {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      
      // If message is from today, show only time
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // If message is from yesterday
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      
      // Otherwise show date and time
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    // Scroll chat to bottom
    const scrollToBottom = () => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };
    
    // Close the chat dialog
    const closeChat = () => {
      emit('close');
    };
    
    // Setup WebSocket listeners
    const setupSocketListeners = () => {
      if (!socket.value || !isConnected.value) {
        connect();
      }
      
      if (socket.value) {
        // Join order chat room
        socket.value.emit('joinOrderChat', {
          orderId: props.orderId,
          userId: userId.value
        });
        
        // Listen for new messages
        socket.value.on('newMessage', (message) => {
          if (message.orderId === props.orderId) {
            // Add message to chat
            messages.value.push({
              id: message.id,
              sender: message.senderId === userId.value ? 'user' : 'driver',
              text: message.text,
              timestamp: new Date(message.timestamp),
              status: 'received'
            });
            
            // Scroll to bottom
            nextTick(() => {
              scrollToBottom();
            });
            
            // Send read receipt if message is from driver
            if (message.senderId !== userId.value) {
              socket.value.emit('messageRead', {
                messageId: message.id,
                orderId: props.orderId,
                userId: userId.value
              });
            }
          }
        });
        
        // Listen for typing indicators
        socket.value.on('typing', (data) => {
          if (data.orderId === props.orderId && data.senderId !== userId.value) {
            isTyping.value = true;
            
            // Clear typing indicator after 3 seconds
            setTimeout(() => {
              isTyping.value = false;
            }, 3000);
          }
        });
        
        // Listen for message status updates
        socket.value.on('messageStatus', (data) => {
          const messageIndex = messages.value.findIndex(m => m.id === data.messageId);
          if (messageIndex !== -1) {
            messages.value[messageIndex].status = data.status;
          }
        });
      }
    };
    
    // Cleanup socket listeners
    const cleanup = () => {
      if (socket.value) {
        socket.value.off('newMessage');
        socket.value.off('typing');
        socket.value.off('messageStatus');
        socket.value.emit('leaveOrderChat', {
          orderId: props.orderId,
          userId: userId.value
        });
      }
    };
    
    // Watch for dialog open/close to load messages
    watch(() => props.isOpen, (newVal) => {
      if (newVal) {
        loadChatHistory();
        setupSocketListeners();
      } else {
        cleanup();
      }
    }, { immediate: true });
    
    // Cleanup on component unmount
    onMounted(() => {
      if (props.isOpen) {
        loadChatHistory();
        setupSocketListeners();
      }
    });
    
    return {
      messageInput,
      messages,
      loading,
      isSending,
      isTyping,
      messagesContainer,
      sendMessage,
      sendQuickMessage,
      formatMessageTime,
      closeChat
    };
  }
};
</script>

<style scoped>
.chat-container {
  height: 350px;
  overflow-y: hidden;
  background-color: #f5f5f5;
}

.chat-messages {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.message-bubble {
  max-width: 80%;
  margin-bottom: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  position: relative;
}

.user-message {
  background-color: #e3f2fd;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.driver-message {
  background-color: white;
  margin-right: auto;
  border-bottom-left-radius: 4px;
}

.message-content {
  word-break: break-word;
}

.message-time {
  font-size: 0.7rem;
  color: rgba(0, 0, 0, 0.6);
  text-align: right;
  margin-top: 4px;
}

.message-status {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.6rem;
}

.typing-indicator {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.85rem;
  color: rgba(0, 0, 0, 0.6);
}

.typing-bubble {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 2px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.3);
  animation: typing 1s infinite ease-in-out;
}

.typing-bubble:nth-child(1) {
  animation-delay: 0.2s;
}

.typing-bubble:nth-child(2) {
  animation-delay: 0.4s;
}

.typing-bubble:nth-child(3) {
  animation-delay: 0.6s;
}

@keyframes typing {
  0%, 70%, 100% { transform: scale(1); }
  35% { transform: scale(1.3); }
}
</style>