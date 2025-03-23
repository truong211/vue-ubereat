<template>
  <div class="support-chat">
    <!-- Chat Widget Button -->
    <v-btn
      v-if="!isOpen"
      class="chat-button"
      color="primary"
      icon="mdi-message"
      size="large"
      @click="openChat"
    >
      <v-tooltip activator="parent" location="left">
        Need help? Chat with us
      </v-tooltip>
    </v-btn>

    <!-- Chat Window -->
    <v-card
      v-else
      class="chat-window"
      :class="{ 'chat-window--minimized': isMinimized }"
    >
      <!-- Chat Header -->
      <v-app-bar
        color="primary"
        density="compact"
      >
        <v-avatar size="32" class="mr-3" color="white">
          <v-icon color="primary">{{ isConnected ? 'mdi-headset' : 'mdi-headset-off' }}</v-icon>
        </v-avatar>
        
        <v-app-bar-title class="text-white">
          {{ isConnected ? 'Customer Support' : 'Connecting...' }}
        </v-app-bar-title>

        <template v-slot:append>
          <v-btn
            icon
            variant="text"
            color="white"
            size="small"
            @click="minimizeChat"
          >
            <v-icon>{{ isMinimized ? 'mdi-window-maximize' : 'mdi-window-minimize' }}</v-icon>
          </v-btn>
          
          <v-btn
            icon
            variant="text"
            color="white"
            size="small"
            @click="closeChat"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-app-bar>

      <div v-show="!isMinimized" class="chat-content">
        <!-- Chat Messages -->
        <div class="messages" ref="messagesContainer">
          <div
            v-for="(message, index) in messages"
            :key="index"
            class="message-wrapper"
            :class="{ 'message-wrapper--user': message.isUser }"
          >
            <div 
              class="message"
              :class="{ 'message--user': message.isUser }"
            >
              <div v-if="message.type === 'text'" class="message-text">
                {{ message.content }}
              </div>
              
              <div v-else-if="message.type === 'image'" class="message-image">
                <v-img
                  :src="message.content"
                  :alt="message.alt || 'Image'"
                  width="200"
                  class="rounded"
                  @click="openImagePreview(message.content)"
                ></v-img>
              </div>
              
              <div v-else-if="message.type === 'order'" class="message-order">
                <div class="order-preview pa-2">
                  <div class="text-subtitle-2">Order #{{ message.content.id }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ message.content.items.length }} items • ${{ message.content.total.toFixed(2) }}
                  </div>
                  <v-btn
                    variant="text"
                    density="compact"
                    size="small"
                    color="primary"
                    class="mt-1"
                    :to="`/orders/${message.content.id}`"
                  >
                    View Order
                  </v-btn>
                </div>
              </div>
              
              <div class="message-time text-caption">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
          
          <div v-if="isTyping" class="message-wrapper">
            <div class="message typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div v-if="showQuickActions && messages.length === 0" class="quick-actions pa-4">
          <div class="text-subtitle-1 mb-3">How can we help you?</div>
          <v-btn
            v-for="action in quickActions"
            :key="action.text"
            variant="outlined"
            block
            class="mb-2"
            @click="handleQuickAction(action)"
          >
            {{ action.text }}
          </v-btn>
        </div>

        <!-- Input Area -->
        <div class="chat-input pa-4">
          <v-form @submit.prevent="sendMessage" ref="form">
            <div class="d-flex align-center">
              <!-- File Upload -->
              <v-menu v-if="allowAttachments">
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon
                    variant="text"
                    v-bind="props"
                    :disabled="isUploading"
                  >
                    <v-icon>mdi-paperclip</v-icon>
                  </v-btn>
                </template>
                <v-list density="compact">
                  <v-list-item
                    prepend-icon="mdi-image"
                    title="Send Image"
                    @click="triggerImageUpload"
                  ></v-list-item>
                  <v-list-item
                    prepend-icon="mdi-file-document"
                    title="Send File"
                    @click="triggerFileUpload"
                  ></v-list-item>
                </v-list>
              </v-menu>
              
              <!-- Message Input -->
              <v-text-field
                v-model="messageText"
                placeholder="Type a message..."
                hide-details
                density="comfortable"
                variant="outlined"
                class="mx-2"
                :disabled="!isConnected"
                @keydown.enter.prevent="sendMessage"
              ></v-text-field>
              
              <!-- Send Button -->
              <v-btn
                icon
                color="primary"
                :disabled="!canSendMessage"
                @click="sendMessage"
              >
                <v-icon>mdi-send</v-icon>
              </v-btn>
            </div>
          </v-form>
          
          <!-- File Upload Inputs -->
          <input
            type="file"
            ref="imageInput"
            accept="image/*"
            class="d-none"
            @change="handleImageUpload"
          >
          <input
            type="file"
            ref="fileInput"
            class="d-none"
            @change="handleFileUpload"
          >
        </div>
      </div>
    </v-card>

    <!-- Image Preview Dialog -->
    <v-dialog v-model="showImagePreview" max-width="90vw">
      <v-card>
        <v-card-text class="pa-0">
          <v-img
            :src="previewImage"
            max-height="90vh"
            contain
          ></v-img>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showImagePreview = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'SupportChat',
  
  props: {
    // Initial state
    initiallyOpen: {
      type: Boolean,
      default: false
    },
    
    initiallyMinimized: {
      type: Boolean,
      default: false
    },
    
    // Configuration
    allowAttachments: {
      type: Boolean,
      default: true
    },
    
    showQuickActions: {
      type: Boolean,
      default: true
    },
    
    position: {
      type: String,
      default: 'bottom-right',
      validator: value => ['bottom-right', 'bottom-left'].includes(value)
    }
  },
  
  setup(props) {
    const store = useStore();
    
    // State
    const isOpen = ref(props.initiallyOpen);
    const isMinimized = ref(props.initiallyMinimized);
    const isConnected = ref(false);
    const isTyping = ref(false);
    const messages = ref([]);
    const messageText = ref('');
    const isUploading = ref(false);
    
    // Refs
    const form = ref(null);
    const messagesContainer = ref(null);
    const imageInput = ref(null);
    const fileInput = ref(null);
    
    // Image preview
    const showImagePreview = ref(false);
    const previewImage = ref('');
    
    // Quick actions
    const quickActions = ref([
      {
        text: 'Track my order',
        action: 'track_order'
      },
      {
        text: 'Report an issue',
        action: 'report_issue'
      },
      {
        text: 'Request a refund',
        action: 'request_refund'
      },
      {
        text: 'View FAQs',
        action: 'view_faq'
      },
      {
        text: 'Speak to an agent',
        action: 'speak_agent'
      }
    ]);

    const faqCategories = ref([
      {
        title: 'Delivery',
        questions: [
          { q: 'How long will my delivery take?', a: 'Delivery times typically range from 30-45 minutes depending on your location and restaurant preparation time.' },
          { q: 'Can I track my delivery?', a: 'Yes! Once your order is confirmed, you can track it in real-time through the app.' }
        ]
      },
      {
        title: 'Orders',
        questions: [
          { q: 'How do I cancel my order?', a: 'You can cancel your order through the app within 5 minutes of placing it. After that, please contact support.' },
          { q: 'What if my order is wrong?', a: 'Please report it immediately through the app or contact our support team.' }
        ]
      },
      {
        title: 'Payment',
        questions: [
          { q: 'What payment methods are accepted?', a: 'We accept credit/debit cards, e-wallets, and cash on delivery.' },
          { q: 'How do I request a refund?', a: 'You can request a refund through the app within 24 hours of delivery.' }
        ]
      }
    ]);

    // Computed
    const canSendMessage = computed(() => {
      return isConnected.value && messageText.value.trim().length > 0;
    });

    // Methods
    const openChat = () => {
      isOpen.value = true;
      isMinimized.value = false;
      connectToSupport();
    };

    const closeChat = () => {
      isOpen.value = false;
      disconnectFromSupport();
    };

    const minimizeChat = () => {
      isMinimized.value = !isMinimized.value;
    };

    const connectToSupport = async () => {
      try {
        // In a real app, this would connect to a support service
        isConnected.value = false;
        await new Promise(resolve => setTimeout(resolve, 1500));
        isConnected.value = true;
        
        // Add welcome message
        addMessage({
          type: 'text',
          content: 'Hi! How can we help you today?',
          isUser: false,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Failed to connect to support:', error);
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to connect to support. Please try again.',
          color: 'error'
        });
      }
    };

    const disconnectFromSupport = () => {
      isConnected.value = false;
      messages.value = [];
    };

    const sendMessage = async () => {
      if (!canSendMessage.value) return;
      
      const text = messageText.value.trim();
      messageText.value = '';
      
      // Add user message
      addMessage({
        type: 'text',
        content: text,
        isUser: true,
        timestamp: new Date()
      });
      
      // Simulate support response
      simulateSupportResponse(text);
    };

    const simulateSupportResponse = async (userMessage) => {
      isTyping.value = true;
      await new Promise(resolve => setTimeout(resolve, 2000));
      isTyping.value = false;
      
      // Simple response logic
      let response = {
        type: 'text',
        content: 'Thank you for your message. How else can I assist you?'
      };

      if (userMessage.toLowerCase().includes('order')) {
        response.content = 'I can help you with your order. Could you please provide your order number?';
      } else if (userMessage.toLowerCase().includes('refund')) {
        response.content = 'For refund requests, we will need to review your order first. Please provide your order number and reason for the refund.';
      }
      
      addMessage({
        ...response,
        isUser: false,
        timestamp: new Date()
      });
    };

    const handleQuickAction = (action) => {
      switch (action.action) {
        case 'track_order':
          addMessage({
            type: 'text',
            content: 'Please provide your order number to track its status.',
            isUser: false,
            timestamp: new Date()
          });
          break;
          
        case 'report_issue':
          addMessage({
            type: 'text',
            content: 'I am sorry you are experiencing an issue. Could you please describe what is wrong?',
            isUser: false,
            timestamp: new Date()
          });
          break;
          
        case 'request_refund':
          addMessage({
            type: 'text',
            content: 'For refund requests, please provide your order number and the reason for the refund.',
            isUser: false,
            timestamp: new Date()
          });
          break;
          
        case 'speak_agent':
          addMessage({
            type: 'text',
            content: 'Connecting you to a support agent. Please describe your issue while I find someone to assist you.',
            isUser: false,
            timestamp: new Date()
          });
          break;
      }
    };

    const addMessage = (message) => {
      messages.value.push(message);
      scrollToBottom();
    };

    const scrollToBottom = async () => {
      await nextTick();
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    };

    // File handling
    const triggerImageUpload = () => {
      imageInput.value?.click();
    };

    const triggerFileUpload = () => {
      fileInput.value?.click();
    };

    const handleImageUpload = async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      
      try {
        isUploading.value = true;
        
        // In a real app, you would upload the file to a server
        // Here we just create a local URL
        const reader = new FileReader();
        reader.onload = (e) => {
          addMessage({
            type: 'image',
            content: e.target.result,
            isUser: true,
            timestamp: new Date()
          });
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Failed to upload image:', error);
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to upload image. Please try again.',
          color: 'error'
        });
      } finally {
        isUploading.value = false;
        if (imageInput.value) {
          imageInput.value.value = '';
        }
      }
    };

    const handleFileUpload = (event) => {
      // Implement file upload logic
      console.log('File upload not implemented');
    };

    const openImagePreview = (imageUrl) => {
      previewImage.value = imageUrl;
      showImagePreview.value = true;
    };

    const formatTime = (date) => {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    };

    // Cleanup
    onUnmounted(() => {
      disconnectFromSupport();
    });

    return {
      isOpen,
      isMinimized,
      isConnected,
      isTyping,
      messages,
      messageText,
      isUploading,
      form,
      messagesContainer,
      imageInput,
      fileInput,
      showImagePreview,
      previewImage,
      quickActions,
      faqCategories,
      canSendMessage,
      openChat,
      closeChat,
      minimizeChat,
      sendMessage,
      handleQuickAction,
      triggerImageUpload,
      triggerFileUpload,
      handleImageUpload,
      handleFileUpload,
      openImagePreview,
      formatTime
    };
  }
};
</script>

<style scoped>
.support-chat {
  position: fixed;
  z-index: 1000;
}

.chat-button {
  position: fixed;
  bottom: 24px;
  right: 24px;
}

.chat-window {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 360px;
  height: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.chat-window--minimized {
  height: 48px;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.message-wrapper {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.message-wrapper--user {
  align-items: flex-end;
}

.message {
  max-width: 80%;
  padding: 8px 12px;
  border-radius: 12px;
  background-color: #f5f5f5;
}

.message--user {
  background-color: #e3f2fd;
  color: #1565c0;
}

.message-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.message-time {
  margin-top: 4px;
  opacity: 0.7;
}

.message-order {
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}

.typing-indicator {
  display: flex;
  align-items: center;
  padding: 8px 12px;
}

.typing-indicator span {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 4px;
  background-color: #90a4ae;
  border-radius: 50%;
  animation: typing 1s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
  margin-right: 0;
}

@keyframes typing {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* Custom scrollbar for messages */
.messages::-webkit-scrollbar {
  width: 6px;
}

.messages::-webkit-scrollbar-track {
  background: transparent;
}

.messages::-webkit-scrollbar-thumb {
  background: #90a4ae;
  border-radius: 3px;
}

.messages::-webkit-scrollbar-thumb:hover {
  background: #607d8b;
}
</style>