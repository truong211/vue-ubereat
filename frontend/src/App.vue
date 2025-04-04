<template>
  <v-app>
    <!-- Remove the entire app bar since it's redundant with MainLayout -->

    <!-- Main content -->
    <v-main>
      <main-layout>
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
        
        <!-- Toast Notifications -->
        <v-snackbar
          v-model="toast.show"
          :color="toast.color"
          :timeout="toast.timeout"
          location="top"
        >
          {{ toast.text }}
          
          <template v-slot:actions>
            <v-btn
              variant="text"
              icon="mdi-close"
              @click="toast.show = false"
            ></v-btn>
          </template>
        </v-snackbar>
        
        <!-- Order Chat Dialog -->
        <order-chat-dialog
          v-if="isChatOpen"
          :order-id="activeChatOrderId"
          :driver-id="activeChatDriverId"
          :driver-name="activeChatDriverName"
          :is-open="isChatOpen"
          @close="closeChat"
        />
      </main-layout>
    </v-main>

    <!-- Support Chat -->
    <support-chat></support-chat>

    <!-- Toast Notifications -->
    <notification-toast
      v-model="showNotification"
      :notification="currentNotification"
      v-if="currentNotification"
    ></notification-toast>
  </v-app>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue';
import OrderChatDialog from '@/components/order/OrderChatDialog.vue';
import NotificationCenter from '@/components/notifications/NotificationCenter.vue'
import NotificationToast from '@/components/notifications/NotificationToast.vue'
import SupportChat from '@/components/support/SupportChat.vue'
import { computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'App',
  
  components: {
    MainLayout,
    OrderChatDialog,
    NotificationCenter,
    NotificationToast,
    SupportChat
  },
  
  data() {
    return {
      toast: {
        show: false,
        text: '',
        color: 'success',
        timeout: 3000
      }
    };
  },
  
  created() {
    // Initialize toast notification system
    this.$toast = {
      success: (text) => this.showToast(text, 'success'),
      error: (text) => this.showToast(text, 'error'),
      info: (text) => this.showToast(text, 'info'),
      warning: (text) => this.showToast(text, 'warning')
    };
    
    // Make toast available globally
    this.$root.$toast = this.$toast;
  },
  
  setup() {
    const store = useStore();
    
    // Chat state
    const isChatOpen = computed(() => store.getters['chat/isChatOpen']);
    const activeChat = computed(() => store.getters['chat/activeChat']);
    const activeChatOrderId = computed(() => activeChat.value?.orderId || '');
    const activeChatDriverId = computed(() => activeChat.value?.driverId || '');
    const activeChatDriverName = computed(() => activeChat.value?.driverName || 'Driver');
    
    const closeChat = () => {
      store.dispatch('chat/closeChatDialog');
    };

    // Initialize notifications system
    onMounted(async () => {
      await store.dispatch('notifications/init')
    })

    // Computed properties for toast notifications
    const showNotification = computed({
      get: () => store.state.notifications.showNotification,
      set: (value) => store.commit('notifications/SET_SHOW_NOTIFICATION', value)
    })

    const currentNotification = computed(() => store.state.notifications.currentNotification)
    
    return {
      isChatOpen,
      activeChatOrderId,
      activeChatDriverId,
      activeChatDriverName,
      closeChat,
      showNotification,
      currentNotification
    };
  },
  
  methods: {
    showToast(text, color = 'success', timeout = 3000) {
      this.toast.show = true;
      this.toast.text = text;
      this.toast.color = color;
      this.toast.timeout = timeout;
    }
  }
};
</script>

<style>
/* Global styles */
:root {
  --primary-color: #4CAF50;
  --secondary-color: #FF5722;
  --accent-color: #FFC107;
  --error-color: #F44336;
  --success-color: #4CAF50;
  --info-color: #2196F3;
  --warning-color: #FF9800;
}

/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #aaa;
}
</style>