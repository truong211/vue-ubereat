<template>
  <v-app>
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>

    <!-- Global components outside the main layout flow -->

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
import OrderChatDialog from '@/components/order/OrderChatDialog.vue';
import NotificationCenter from '@/components/notifications/NotificationCenter.vue'
import NotificationToast from '@/components/notifications/NotificationToast.vue'
import SupportChat from '@/components/support/SupportChat.vue'
import { computed, onMounted } from 'vue';
import { useToast } from '@/composables/useToast';
import { useChatStore } from '@/stores/chat.js';
import { useNotificationStore } from '@/stores/notifications.js';

export default {
  name: 'App',

  components: {
    OrderChatDialog,
    NotificationCenter,
    NotificationToast,
    SupportChat,
  },

  setup() {
    const chatStore = useChatStore();
    const notificationStore = useNotificationStore();

    // Get toast state from our composable
    const { state: toastState } = useToast();

    // Chat state using Pinia store
    const isChatOpen = computed(() => chatStore.isChatOpen);
    const activeChat = computed(() => chatStore.activeChat);
    const activeChatOrderId = computed(() => activeChat.value?.orderId || '');
    const activeChatDriverId = computed(() => activeChat.value?.driverId || '');
    const activeChatDriverName = computed(() => activeChat.value?.driverName || 'Driver');

    const closeChat = () => {
      chatStore.closeChatDialog();
    };

    // Initialize notifications system
    onMounted(async () => {
      await notificationStore.initNotifications();
    });

    // Computed properties for notifications using Pinia store
    const showNotification = computed({
      get: () => notificationStore.showNotification,
      set: (value) => notificationStore.setShowNotification(value)
    });

    const currentNotification = computed(() => notificationStore.currentNotification);

    return {
      toast: toastState,
      isChatOpen,
      activeChatOrderId,
      activeChatDriverId,
      activeChatDriverName,
      closeChat,
      showNotification,
      currentNotification
    };
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
