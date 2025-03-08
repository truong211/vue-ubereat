<template>
  <div class="social-sharing">
    <!-- Share Button -->
    <v-btn
      v-if="!showShareOptions"
      prepend-icon="mdi-share-variant"
      :color="color"
      :variant="variant"
      @click="showShareOptions = true"
    >
      {{ label || 'Share' }}
    </v-btn>

    <!-- Share Options Dialog -->
    <v-dialog
      v-model="showShareOptions"
      max-width="300"
    >
      <v-card>
        <v-card-title class="text-center">
          Share {{ title }}
        </v-card-title>

        <v-card-text>
          <v-list>
            <!-- Native Web Share API -->
            <v-list-item
              v-if="hasWebShare"
              prepend-icon="mdi-share"
              title="Share"
              subtitle="Use device sharing"
              @click="shareNative"
            ></v-list-item>

            <v-divider v-if="hasWebShare"></v-divider>

            <!-- Social Media Options -->
            <v-list-item
              v-for="platform in platforms"
              :key="platform.name"
              :prepend-icon="platform.icon"
              :title="platform.title"
              :href="getSharingUrl(platform.name)"
              target="_blank"
              rel="noopener noreferrer"
              @click="trackShare(platform.name)"
            ></v-list-item>

            <!-- Copy Link -->
            <v-list-item
              prepend-icon="mdi-content-copy"
              title="Copy Link"
              @click="copyLink"
            ></v-list-item>
          </v-list>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showShareOptions = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Copy Success Snackbar -->
    <v-snackbar
      v-model="showCopySuccess"
      :timeout="2000"
      color="success"
    >
      Link copied to clipboard!
    </v-snackbar>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'SocialSharing',

  props: {
    // Content to share
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    url: {
      type: String,
      required: true
    },
    image: {
      type: String,
      default: ''
    },

    // Button customization
    label: {
      type: String,
      default: ''
    },
    color: {
      type: String,
      default: 'primary'
    },
    variant: {
      type: String,
      default: 'text'
    },

    // Platform options
    enabledPlatforms: {
      type: Array,
      default: () => ['facebook', 'twitter', 'whatsapp', 'telegram', 'email']
    }
  },

  setup(props) {
    const store = useStore()
    
    // State
    const showShareOptions = ref(false)
    const showCopySuccess = ref(false)
    
    // Check for Web Share API support
    const hasWebShare = computed(() => {
      return typeof navigator !== 'undefined' && navigator.share
    })
    
    // Available sharing platforms
    const platforms = computed(() => {
      const allPlatforms = [
        {
          name: 'facebook',
          title: 'Facebook',
          icon: 'mdi-facebook',
          url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(props.url)}`
        },
        {
          name: 'twitter',
          title: 'Twitter',
          icon: 'mdi-twitter',
          url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(props.title)}&url=${encodeURIComponent(props.url)}`
        },
        {
          name: 'whatsapp',
          title: 'WhatsApp',
          icon: 'mdi-whatsapp',
          url: `whatsapp://send?text=${encodeURIComponent(`${props.title}\n${props.url}`)}`
        },
        {
          name: 'telegram',
          title: 'Telegram',
          icon: 'mdi-telegram',
          url: `https://t.me/share/url?url=${encodeURIComponent(props.url)}&text=${encodeURIComponent(props.title)}`
        },
        {
          name: 'email',
          title: 'Email',
          icon: 'mdi-email',
          url: `mailto:?subject=${encodeURIComponent(props.title)}&body=${encodeURIComponent(`${props.description}\n\n${props.url}`)}`
        }
      ]

      return allPlatforms.filter(platform => 
        props.enabledPlatforms.includes(platform.name)
      )
    })
    
    // Methods
    const getSharingUrl = (platform) => {
      return platforms.value.find(p => p.name === platform)?.url || '#'
    }
    
    const shareNative = async () => {
      try {
        await navigator.share({
          title: props.title,
          text: props.description,
          url: props.url,
          ...(props.image ? { files: [props.image] } : {})
        })
        trackShare('native')
      } catch (error) {
        console.error('Error sharing:', error)
      } finally {
        showShareOptions.value = false
      }
    }
    
    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(props.url)
        showCopySuccess.value = true
        trackShare('copy')
      } catch (error) {
        console.error('Failed to copy link:', error)
        // Fallback for clipboard API
        const textarea = document.createElement('textarea')
        textarea.value = props.url
        textarea.style.position = 'fixed'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        try {
          document.execCommand('copy')
          showCopySuccess.value = true
          trackShare('copy')
        } catch (err) {
          console.error('Fallback copy failed:', err)
        }
        document.body.removeChild(textarea)
      } finally {
        showShareOptions.value = false
      }
    }
    
    const trackShare = (platform) => {
      store.dispatch('analytics/trackEvent', {
        category: 'Social',
        action: 'Share',
        label: platform,
        value: props.url
      })
    }
    
    return {
      showShareOptions,
      showCopySuccess,
      hasWebShare,
      platforms,
      getSharingUrl,
      shareNative,
      copyLink,
      trackShare
    }
  }
}
</script>

<style scoped>
.social-sharing {
  display: inline-block;
}
</style>