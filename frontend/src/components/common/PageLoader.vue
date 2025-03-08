<template>
  <div 
    v-if="show" 
    class="page-loader"
    :class="{ 'with-overlay': overlay, 'centered': centered }"
  >
    <v-progress-circular
      v-if="type === 'circular'"
      :size="size"
      :width="width"
      :color="color"
      indeterminate
    ></v-progress-circular>
    
    <v-progress-linear
      v-else-if="type === 'linear'"
      :height="height"
      :color="color"
      indeterminate
      rounded
    ></v-progress-linear>
    
    <v-skeleton-loader
      v-else-if="type === 'skeleton'"
      :type="skeletonType"
      :loading="true"
    ></v-skeleton-loader>
    
    <div v-if="text" class="loader-text">
      {{ text }}
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'PageLoader',
  
  props: {
    // Force showing the loader regardless of store state
    modelValue: {
      type: Boolean,
      default: false
    },
    
    // Show overlay behind the loader
    overlay: {
      type: Boolean,
      default: true
    },
    
    // Center in the container
    centered: {
      type: Boolean,
      default: true
    },
    
    // Type of loader
    type: {
      type: String,
      default: 'circular',
      validator(value) {
        return ['circular', 'linear', 'skeleton'].includes(value)
      }
    },
    
    // Skeleton loader type
    skeletonType: {
      type: String,
      default: 'card'
    },
    
    // Circular size
    size: {
      type: [Number, String],
      default: 64
    },
    
    // Circular width
    width: {
      type: [Number, String],
      default: 4
    },
    
    // Linear height
    height: {
      type: [Number, String],
      default: 4
    },
    
    // Loader color
    color: {
      type: String,
      default: 'primary'
    },
    
    // Optional text to display
    text: {
      type: String,
      default: ''
    },
    
    // Component name to track loading state in the store
    component: {
      type: String,
      default: ''
    }
  },
  
  setup(props) {
    const store = useStore()
    
    // Determine whether to show the loader
    const show = computed(() => {
      // If explicitly set via v-model, use that value
      if (props.modelValue !== false) {
        return props.modelValue
      }
      
      // If component name is provided, check component loading state
      if (props.component) {
        return store.getters['ui/isComponentLoading'](props.component)
      }
      
      // Otherwise check global page loading state
      return store.getters['ui/isPageLoading']
    })
    
    return {
      show
    }
  }
}
</script>

<style scoped>
.page-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 100;
}

.page-loader.with-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
}

.page-loader.with-overlay.centered {
  position: fixed;
}

.loader-text {
  margin-top: 20px;
  color: rgba(0, 0, 0, 0.6);
  font-size: 1rem;
}

/* Dark theme adjustments */
:deep([data-theme="dark"]) .page-loader.with-overlay {
  background: rgba(33, 33, 33, 0.8);
}

:deep([data-theme="dark"]) .loader-text {
  color: rgba(255, 255, 255, 0.7);
}
</style>
