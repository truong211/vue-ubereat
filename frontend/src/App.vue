<template>
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
  </main-layout>
</template>

<script>
import MainLayout from '@/components/layout/MainLayout.vue';

export default {
  name: 'App',
  
  components: {
    MainLayout
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