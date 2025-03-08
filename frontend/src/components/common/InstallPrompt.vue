<template>
  <v-snackbar
    v-model="showPrompt"
    :timeout="-1"
    location="bottom"
    class="install-prompt"
  >
    <div class="d-flex align-center">
      <v-icon
        icon="mdi-cellphone-arrow-down"
        size="24"
        class="me-3"
      ></v-icon>
      <span>Install Driver App for better experience</span>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        variant="text"
        @click="installApp"
      >
        Install
      </v-btn>
      <v-btn
        variant="text"
        @click="dismissPrompt"
      >
        Later
      </v-btn>
    </div>
  </v-snackbar>

  <!-- iOS Install Instructions -->
  <v-dialog v-model="showIOSInstructions" max-width="400">
    <v-card>
      <v-card-title>Install on iOS</v-card-title>
      <v-card-text>
        <ol class="ios-instructions">
          <li>
            Tap the Share button
            <v-icon icon="mdi-export-variant" size="small"></v-icon>
            in Safari
          </li>
          <li>
            Scroll down and tap "Add to Home Screen"
            <v-icon icon="mdi-plus-box-outline" size="small"></v-icon>
          </li>
          <li>
            Tap "Add" to install
            <v-icon icon="mdi-plus" size="small"></v-icon>
          </li>
        </ol>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          variant="text"
          @click="dismissIOSInstructions"
        >
          Got it
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { ref, onMounted } from 'vue'

export default {
  name: 'InstallPrompt',

  setup() {
    const showPrompt = ref(false)
    const showIOSInstructions = ref(false)
    const deferredPrompt = ref(null)

    // Check if already installed
    const isInstalled = () => {
      return window.matchMedia('(display-mode: standalone)').matches ||
             window.navigator.standalone ||
             document.referrer.includes('android-app://')
    }

    // Check if should show prompt based on user preferences
    const shouldShowPrompt = () => {
      const lastPrompt = localStorage.getItem('installPromptDismissed')
      if (!lastPrompt) return true

      // Show again after 7 days
      const lastPromptDate = new Date(parseInt(lastPrompt))
      const now = new Date()
      const daysSinceLastPrompt = (now - lastPromptDate) / (1000 * 60 * 60 * 24)
      return daysSinceLastPrompt >= 7
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      deferredPrompt.value = e

      // Show prompt if conditions met
      if (!isInstalled() && shouldShowPrompt()) {
        showPrompt.value = true
      }
    }

    // Install app
    const installApp = async () => {
      if (deferredPrompt.value) {
        try {
          await deferredPrompt.value.prompt()
          const choiceResult = await deferredPrompt.value.userChoice
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted app install')
            showPrompt.value = false
          }
        } catch (error) {
          console.error('Install failed:', error)
        } finally {
          deferredPrompt.value = null
        }
      } else {
        // Show iOS instructions if on iOS
        if (
          /iPad|iPhone|iPod/.test(navigator.userAgent) &&
          !window.MSStream
        ) {
          showIOSInstructions.value = true
        }
      }
    }

    // Dismiss prompt
    const dismissPrompt = () => {
      showPrompt.value = false
      // Remember dismissal timestamp
      localStorage.setItem('installPromptDismissed', Date.now().toString())
    }

    // Dismiss iOS instructions
    const dismissIOSInstructions = () => {
      showIOSInstructions.value = false
      dismissPrompt()
    }

    // Handle platform-specific logic
    const handlePlatformSpecifics = () => {
      // iOS specific handling
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        if (
          !isInstalled() &&
          shouldShowPrompt() &&
          !navigator.standalone
        ) {
          showPrompt.value = true
        }
      }

      // Android Chrome specific handling
      if (/Android/.test(navigator.userAgent) && /Chrome/.test(navigator.userAgent)) {
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      }
    }

    // Lifecycle hooks
    onMounted(() => {
      handlePlatformSpecifics()

      // Listen for app-installable event from main.js
      window.addEventListener('app-installable', (e) => {
        if (!isInstalled() && shouldShowPrompt()) {
          showPrompt.value = true
        }
      })
    })

    return {
      showPrompt,
      showIOSInstructions,
      installApp,
      dismissPrompt,
      dismissIOSInstructions
    }
  }
}
</script>

<style scoped>
.install-prompt {
  max-width: none !important;
}

.ios-instructions {
  padding-left: 20px;
  margin: 16px 0;
}

.ios-instructions li {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ios-instructions .v-icon {
  color: #666;
}
</style>
