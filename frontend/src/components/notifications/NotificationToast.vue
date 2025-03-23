<template>
  <v-snackbar
    v-model="show"
    :timeout="timeout"
    :color="color"
    :location="location"
    class="notification-toast"
    @update:model-value="onClose"
  >
    <div class="d-flex align-center">
      <!-- Icon based on notification type -->
      <v-icon
        v-if="icon"
        :icon="icon"
        size="24"
        class="mr-3"
      ></v-icon>

      <div class="flex-grow-1">
        <div v-if="title" class="text-subtitle-2 font-weight-medium">
          {{ title }}
        </div>
        <div :class="{ 'mt-1': title }">
          {{ message }}
        </div>
      </div>

      <!-- Action buttons -->
      <div v-if="actions" class="ml-4 d-flex">
        <v-btn
          v-for="action in actions"
          :key="action.text"
          variant="text"
          density="comfortable"
          class="ml-2"
          @click="handleAction(action)"
        >
          {{ action.text }}
        </v-btn>
      </div>
    </div>

    <!-- Close button -->
    <template v-slot:actions>
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        @click="onClose"
      ></v-btn>
    </template>
  </v-snackbar>
</template>

<script>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'NotificationToast',

  props: {
    modelValue: Boolean,
    notification: {
      type: Object,
      required: true
    },
    timeout: {
      type: Number,
      default: 5000
    },
    location: {
      type: String,
      default: 'bottom'
    }
  },

  emits: ['update:modelValue', 'action'],

  setup(props, { emit }) {
    const router = useRouter()

    const show = computed({
      get: () => props.modelValue,
      set: (value) => emit('update:modelValue', value)
    })

    const title = computed(() => props.notification.title)
    const message = computed(() => props.notification.message)
    const actions = computed(() => props.notification.actions)

    const color = computed(() => {
      switch (props.notification.type) {
        case 'success':
          return 'success'
        case 'error':
          return 'error'
        case 'warning':
          return 'warning'
        default:
          return 'info'
      }
    })

    const icon = computed(() => {
      switch (props.notification.type) {
        case 'success':
          return 'mdi-check-circle'
        case 'error':
          return 'mdi-alert-circle'
        case 'warning':
          return 'mdi-alert'
        case 'order_status':
          return 'mdi-food'
        case 'driver_location':
          return 'mdi-map-marker'
        case 'chat':
          return 'mdi-message'
        case 'promotion':
          return 'mdi-tag'
        default:
          return 'mdi-information'
      }
    })

    const handleAction = (action) => {
      if (action.route) {
        router.push(action.route)
      }
      emit('action', action)
      onClose()
    }

    const onClose = () => {
      show.value = false
    }

    return {
      show,
      title,
      message,
      actions,
      color,
      icon,
      handleAction,
      onClose
    }
  }
}
</script>

<style scoped>
.notification-toast {
  max-width: 600px;
}

.notification-toast :deep(.v-snackbar__content) {
  padding: 12px;
}

.notification-toast :deep(.v-snackbar__wrapper) {
  min-height: auto;
}
</style>