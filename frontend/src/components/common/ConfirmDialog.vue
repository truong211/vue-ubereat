<template>
  <v-dialog
    v-model="dialog"
    max-width="500"
    :persistent="persistent"
  >
    <v-card>
      <v-card-title class="text-h5">
        {{ title }}
      </v-card-title>

      <v-card-text>
        {{ message }}
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="onCancel"
          :disabled="loading"
        >
          {{ cancelText }}
        </v-btn>
        <v-btn
          :color="confirmColor"
          :loading="loading"
          @click="onConfirm"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'ConfirmDialog',
  
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Confirm Action'
    },
    message: {
      type: String,
      default: 'Are you sure you want to proceed with this action?'
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    confirmColor: {
      type: String,
      default: 'primary'
    },
    persistent: {
      type: Boolean,
      default: false
    }
  },
  
  emits: ['update:modelValue', 'confirm', 'cancel'],
  
  setup(props, { emit }) {
    const store = useStore()
    const dialog = ref(props.modelValue)
    const loading = ref(false)
    
    watch(() => props.modelValue, (newValue) => {
      dialog.value = newValue
    })
    
    watch(dialog, (newValue) => {
      emit('update:modelValue', newValue)
    })
    
    const onConfirm = async () => {
      loading.value = true
      emit('confirm')
      
      try {
        // Allow time for any async operations to complete
        await new Promise(resolve => setTimeout(resolve, 100))
      } finally {
        loading.value = false
        dialog.value = false
      }
    }
    
    const onCancel = () => {
      emit('cancel')
      dialog.value = false
    }
    
    return {
      dialog,
      loading,
      onConfirm,
      onCancel
    }
  }
}
</script>
