<template>
  <div class="support-chat-examples">
    <h2 class="text-h5 mb-4">Support Chat Component Examples</h2>

    <!-- Example 1: Basic Support Chat -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Support Chat</h3>
      <v-card>
        <v-card-text class="demo-area">
          <v-btn
            color="primary"
            prepend-icon="mdi-chat"
            @click="toggleBasicChat"
          >
            Toggle Support Chat
          </v-btn>
          
          <support-chat
            :initially-open="showBasicChat"
            @message-sent="handleMessage"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Pre-populated Support Chat -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Pre-populated Support Chat</h3>
      <v-card>
        <v-card-text class="demo-area">
          <v-btn
            color="primary"
            prepend-icon="mdi-help-circle"
            @click="toggleOrderChat"
          >
            Get Help with Order
          </v-btn>
          
          <support-chat
            :initially-open="showOrderChat"
            :show-quick-actions="false"
            position="bottom-left"
            @message-sent="handleMessage"
          >
            <!-- Pre-populate with order context -->
            <template #initial-message>
              <p>Hi! I need help with order #123456.</p>
            </template>
          </support-chat>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ orderExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Minimal Support Chat -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Minimal Support Chat</h3>
      <v-card>
        <v-card-text class="demo-area">
          <v-btn
            color="primary"
            prepend-icon="mdi-message"
            @click="toggleMinimalChat"
          >
            Quick Support
          </v-btn>
          
          <support-chat
            :initially-open="showMinimalChat"
            :allow-attachments="false"
            :show-quick-actions="false"
            @message-sent="handleMessage"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ minimalExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 4: Custom Support Chat -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Custom Support Chat</h3>
      <v-card>
        <v-card-text class="demo-area">
          <v-btn
            color="primary"
            prepend-icon="mdi-face-agent"
            @click="toggleCustomChat"
          >
            Premium Support
          </v-btn>
          
          <support-chat
            :initially-open="showCustomChat"
            :show-quick-actions="true"
            @message-sent="handleMessage"
          >
            <template #quick-actions>
              <v-btn
                v-for="action in customActions"
                :key="action.text"
                variant="outlined"
                block
                class="mb-2"
                @click="handleCustomAction(action)"
              >
                <v-icon :icon="action.icon" class="mr-2"></v-icon>
                {{ action.text }}
              </v-btn>
            </template>
          </support-chat>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ customExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import SupportChat from '@/components/support/SupportChat.vue'

export default {
  name: 'SupportChatExample',
  
  components: {
    SupportChat
  },
  
  setup() {
    // Toggle states for each example
    const showBasicChat = ref(false);
    const showOrderChat = ref(false);
    const showMinimalChat = ref(false);
    const showCustomChat = ref(false);
    
    // Custom actions for Example 4
    const customActions = [
      { text: 'VIP Support', icon: 'mdi-star', action: 'vip_support' },
      { text: 'Technical Help', icon: 'mdi-tools', action: 'tech_help' },
      { text: 'Billing Issues', icon: 'mdi-currency-usd', action: 'billing' },
      { text: 'Feedback', icon: 'mdi-message-draw', action: 'feedback' }
    ];
    
    // Toggle functions
    const toggleBasicChat = () => {
      showBasicChat.value = !showBasicChat.value;
    };
    
    const toggleOrderChat = () => {
      showOrderChat.value = !showOrderChat.value;
    };
    
    const toggleMinimalChat = () => {
      showMinimalChat.value = !showMinimalChat.value;
    };
    
    const toggleCustomChat = () => {
      showCustomChat.value = !showCustomChat.value;
    };
    
    // Event handlers
    const handleMessage = (message) => {
      console.log('Message sent:', message);
    };
    
    const handleCustomAction = (action) => {
      console.log('Custom action:', action);
    };
    
    // Example code snippets
    const basicExample = computed(() => {
      return `<support-chat
  :initially-open="false"
  @message-sent="handleMessage"
/>`;
    });
    
    const orderExample = computed(() => {
      return `<support-chat
  :initially-open="true"
  :show-quick-actions="false"
  position="bottom-left"
  @message-sent="handleMessage"
>
  <!-- Pre-populate with order context -->
  <template #initial-message>
    <p>Hi! I need help with order #123456.</p>
  </template>
</support-chat>`;
    });
    
    const minimalExample = computed(() => {
      return `<support-chat
  :initially-open="false"
  :allow-attachments="false"
  :show-quick-actions="false"
  @message-sent="handleMessage"
/>`;
    });
    
    const customExample = computed(() => {
      return `<support-chat
  :initially-open="false"
  :show-quick-actions="true"
  @message-sent="handleMessage"
>
  <template #quick-actions>
    <v-btn
      v-for="action in customActions"
      :key="action.text"
      variant="outlined"
      block
      class="mb-2"
      @click="handleCustomAction(action)"
    >
      <v-icon :icon="action.icon" class="mr-2"></v-icon>
      {{ action.text }}
    </v-btn>
  </template>
</support-chat>`;
    });
    
    return {
      showBasicChat,
      showOrderChat,
      showMinimalChat,
      showCustomChat,
      customActions,
      toggleBasicChat,
      toggleOrderChat,
      toggleMinimalChat,
      toggleCustomChat,
      handleMessage,
      handleCustomAction,
      basicExample,
      orderExample,
      minimalExample,
      customExample
    };
  }
};
</script>

<style scoped>
.support-chat-examples {
  padding: 16px;
}

.demo-area {
  min-height: 100px;
  position: relative;
}

.code-example {
  font-family: monospace;
  white-space: pre-wrap;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}
</style>