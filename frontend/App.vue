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
          mode="out-in"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </v-layout>

    <!-- Global Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      :location="snackbar.location"
    >
      {{ snackbar.text }}
      
      <template v-slot:actions v-if="snackbar.action">
        <v-btn
          variant="text"
          @click="handleSnackbarAction"
        >
          {{ snackbar.action.text }}
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
import { useStore } from 'vuex'
import offlineService from '@/services/offline'
import InstallPrompt from '@/components/common/InstallPrompt.vue'

export default {
  name: 'App',

  components: {
    InstallPrompt
  },

  setup() {
    const store = useStore()
    const loading = ref(false)
    const updateAvailable = ref(false)
    const isOnline = computed(() => offlineService.isNetworkAvailable())

    // Snackbar state
    const snackbar = computed(() => store.state.ui.snackbar)
    const dialog = computed(() => store.state.ui.dialog)

    // Handle network status
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        store.dispatch('ui/showSnackbar', {
          text: 'You are back online',
          color: 'success',
          timeout: 3000
        })
      } else {
        store.dispatch('ui/showSnackbar', {
          text: 'You are offline. Changes will be saved when connection is restored.',
          color: 'warning',
          timeout: -1
        })
      }
    }

    // Handle service worker updates
    const handleServiceWorkerUpdate = () => {
      updateAvailable.value = true
    }

    // Refresh app
    const refreshApp = () => {
      updateAvailable.value = false
      window.location.reload()
    }

    // Handle snackbar action
    const handleSnackbarAction = () => {
      if (snackbar.value.action?.callback) {
        snackbar.value.action.callback()
      }
      store.dispatch('ui/hideSnackbar')
    }

    // Handle dialog action
    const handleDialogAction = (button) => {
      if (button.action) {
        button.action()
      }
      store.dispatch('ui/hideDialog')
    }

    // Global error handler
    const handleError = (error) => {
      console.error('Global error:', error)
      
      // Network errors
      if (error.name === 'NetworkError' || !navigator.onLine) {
        store.dispatch('ui/showSnackbar', {
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

      // Other errors
      store.dispatch('ui/showSnackbar', {
        text: error.message || 'An unexpected error occurred',
        color: 'error',
        timeout: 5000
      })
    }

    // Route loading handler
    const handleRouteLoading = (isLoading) => {
      loading.value = isLoading
    }

    onMounted(() => {
      // Initialize offline service
      offlineService.init(store)

      // Add event listeners
      window.addEventListener('online', handleOnlineStatus)
      window.addEventListener('offline', handleOnlineStatus)
      window.addEventListener('sw-update-available', handleServiceWorkerUpdate)
      window.addEventListener('error', handleError)
      window.addEventListener('unhandledrejection', (event) => handleError(event.reason))

      // Handle route loading
      store.subscribe((mutation) => {
        if (mutation.type === 'route/SET_LOADING') {
          handleRouteLoading(mutation.payload)
        }
      })
    })

    return {
      loading,
      snackbar,
      dialog,
      updateAvailable,
      isOnline,
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
