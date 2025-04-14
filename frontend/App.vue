<template>
  <v-app>
    <!-- Global Progress Bar -->
    <v-fade-transition>
      <div
        v-if="loading"
        class="global-progress"
      >
        <v-progress-linear
          indeterminate
          color="primary"
        ></v-progress-linear>
      </div>
    </v-fade-transition>

    <!-- Main Content -->
    <v-layout class="rounded rounded-md">
      <router-view v-slot="{ Component }">
        <transition
          name="fade"
          :duration="200"
        >
          <component
            :is="Component"
            :key="$route.fullPath"
          />
        </transition>
      </router-view>
    </v-layout>

    <!-- Global Snackbar -->
    <v-snackbar
      v-model="uiStore.snackbar.show"
      :color="uiStore.snackbar.color"
      :timeout="uiStore.snackbar.timeout"
      :location="uiStore.snackbar.location"
    >
      {{ uiStore.snackbar.text }}
      
      <template v-slot:actions v-if="uiStore.snackbar.action">
        <v-btn
          variant="text"
          @click="handleSnackbarAction"
        >
          {{ uiStore.snackbar.action.text }}
        </v-btn>
      </template>
    </v-snackbar>

    <!-- Global Dialog -->
    <v-dialog
      v-model="dialog.show"
      :max-width="dialog.maxWidth"
      :persistent="dialog.persistent"
    >
      <v-card>
        <v-card-title>{{ dialog.title }}</v-card-title>
        <v-card-text>{{ dialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <template v-for="button in dialog.buttons" :key="button.text">
            <v-btn
              :color="button.color"
              :variant="button.variant || 'text'"
              @click="handleDialogAction(button)"
            >
              {{ button.text }}
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Network Status Indicator -->
    <v-fade-transition>
      <div
        v-if="!isOnline"
        class="network-status"
      >
        <v-icon icon="mdi-wifi-off" class="me-2"></v-icon>
        You are offline. Some features may be limited.
      </div>
    </v-fade-transition>

    <!-- Install Prompt -->
    <install-prompt />

    <!-- Update Available Notification -->
    <v-snackbar
      v-model="updateAvailable"
      :timeout="-1"
      color="info"
      location="top"
    >
      A new version is available.
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="refreshApp"
        >
          Update Now
        </v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useUiStore } from '@/stores/ui.js'
import offlineService from '@/services/offline'
import InstallPrompt from '@/components/common/InstallPrompt.vue'

export default {
  name: 'App',

  components: {
    InstallPrompt
  },

  setup() {
    const authStore = useAuthStore()
    const uiStore = useUiStore()
    const loading = ref(false)
    const updateAvailable = ref(false)
    const isOnline = computed(() => offlineService.isNetworkAvailable())

    // State for dialog
    const dialog = ref({
      show: false,
      title: '',
      message: '',
      maxWidth: 500,
      persistent: false,
      buttons: []
    })

    // Initialize auth store
    const initAuth = async () => {
      try {
        await authStore.initialize()
      } catch (error) {
        console.error('Failed to initialize auth:', error)
        uiStore.showSnackbar({
          text: 'Authentication initialization failed',
          color: 'error',
          timeout: 5000
        })
      }
    }

    // Methods
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        uiStore.showSnackbar({
          text: 'You are back online',
          color: 'success',
          timeout: 3000
        })
      } else {
        uiStore.showSnackbar({
          text: 'You are offline. Changes will be saved when connection is restored.',
          color: 'warning',
          timeout: -1
        })
      }
    }

    const handleServiceWorkerUpdate = () => {
      updateAvailable.value = true
    }

    const refreshApp = () => {
      updateAvailable.value = false
      window.location.reload()
    }

    const handleSnackbarAction = () => {
      if (uiStore.snackbar.action?.callback) {
        uiStore.snackbar.action.callback()
      }
      uiStore.hideSnackbar()
    }

    const handleDialogAction = (button) => {
      if (button.action) {
        button.action()
      }
      dialog.value.show = false
    }

    const handleError = (error) => {
      console.error('Global error:', error)
      
      if (error.name === 'NetworkError' || !navigator.onLine) {
        uiStore.showSnackbar({
          text: 'Network error. Please check your connection.',
          color: 'error',
          timeout: -1,
          action: {
            text: 'RETRY',
            callback: () => window.location.reload()
          }
        })
        return
      }

      uiStore.showSnackbar({
        text: error.message || 'An unexpected error occurred',
        color: 'error',
        timeout: 5000
      })
    }

    const handleRouteLoading = (isLoading) => {
      loading.value = isLoading
    }

    onMounted(async () => {
      // Initialize auth first before other services
      await initAuth()

      // Initialize offline service
      offlineService.init({ commit: () => {} }) // Pass empty store since we're not using Vuex

      // Add event listeners
      window.addEventListener('online', handleOnlineStatus)
      window.addEventListener('offline', handleOnlineStatus)
      window.addEventListener('sw-update-available', handleServiceWorkerUpdate)
      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', (event) => handleError(event.reason))
    })

    return {
      loading,
      dialog,
      updateAvailable,
      isOnline,
      uiStore,
      refreshApp,
      handleSnackbarAction,
      handleDialogAction
    }
  }
}
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.global-progress {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}

.network-status {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 8px 16px;
  background-color: #ff9800;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

/* Hide scrollbar when dialog is open */
.v-dialog-active {
  overflow: hidden !important;
}

/* Prevent pull-to-refresh on mobile */
html,
body {
  overscroll-behavior-y: contain;
}

/* iOS safe area support */
.v-application {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Touch action improvements for mobile */
.v-btn {
  touch-action: manipulation;
}

/* Disable text selection on interactive elements */
.v-btn,
.v-list-item {
  user-select: none;
  -webkit-user-select: none;
}
</style>
