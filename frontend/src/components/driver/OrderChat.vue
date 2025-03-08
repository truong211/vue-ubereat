<template>
  <div class="order-chat">
    <Chat
      :conversation-id="conversationId"
      :user-id="userId"
      :title="title"
      :show-back-button="true"
      :show-participant-status="true"
      :show-options="true"
      :menu-options="menuOptions"
      @close="$emit('close')"
      @message-sent="handleMessageSent"
      @error="handleError"
    />
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'
import Chat from '@/components/common/Chat.vue'

export default {
  name: 'OrderChat',

  components: {
    Chat
  },

  props: {
    // Order ID
    orderId: {
      type: String,
      required: true
    },
    // Chat type: 'restaurant' or 'customer'
    type: {
      type: String,
      required: true,
      validator: value => ['restaurant', 'customer'].includes(value)
    },
    // Participant info
    participant: {
      type: Object,
      required: true
    }
  },

  emits: ['close', 'error'],

  setup(props) {
    const store = useStore()

    // Generate conversation ID
    const conversationId = computed(() => {
      return `order_${props.orderId}_${props.type}`
    })

    // Get current user ID from store
    const userId = computed(() => store.state.user.id)

    // Chat title based on participant
    const title = computed(() => {
      if (props.type === 'restaurant') {
        return props.participant.name
      } else {
        return `${props.participant.name} (Customer)`
      }
    })

    // Menu options based on chat type
    const menuOptions = computed(() => {
      const options = [
        {
          title: 'View Order Details',
          icon: 'mdi-clipboard-text',
          value: 'view_order',
          action: () => {
            // Implement order details view
          }
        }
      ]

      // Add type-specific options
      if (props.type === 'restaurant') {
        options.push({
          title: 'Call Restaurant',
          icon: 'mdi-phone',
          value: 'call',
          action: () => window.location.href = `tel:${props.participant.phone}`
        })
      } else {
        options.push({
          title: 'Call Customer',
          icon: 'mdi-phone',
          value: 'call',
          action: () => window.location.href = `tel:${props.participant.phone}`
        })
      }

      // Add shared options
      options.push(
        {
          title: 'View Location',
          icon: 'mdi-map-marker',
          value: 'location',
          action: () => {
            window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.participant.address)}`, '_blank')
          }
        },
        {
          title: 'Clear Chat',
          icon: 'mdi-delete',
          value: 'clear',
          action: () => {
            // Implement clear chat
          }
        }
      )

      return options
    })

    // Message handlers
    const handleMessageSent = (message) => {
      // Add order context to message metadata
      message.metadata = {
        ...message.metadata,
        orderId: props.orderId,
        chatType: props.type
      }

      // Store in order history
      store.dispatch('driver/addChatMessage', {
        orderId: props.orderId,
        type: props.type,
        message
      })
    }

    const handleError = (error) => {
      console.error('Chat error:', error)
      store.dispatch('ui/showError', {
        title: 'Chat Error',
        message: error.message || 'Failed to send message'
      })
    }

    return {
      conversationId,
      userId,
      title,
      menuOptions,
      handleMessageSent,
      handleError
    }
  }
}
</script>

<style scoped>
.order-chat {
  height: 100%;
  display: flex;
  flex-direction: column;
}
</style>
