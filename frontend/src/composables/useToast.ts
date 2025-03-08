import { ref } from 'vue'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  message: string
  type: ToastType
  show: boolean
}

export function useToast() {
  const toast = ref<Toast>({
    message: '',
    type: 'info',
    show: false
  })

  const showToast = (message: string, type: ToastType = 'info') => {
    toast.value = {
      message,
      type,
      show: true
    }

    setTimeout(() => {
      toast.value.show = false
    }, 3000)
  }

  return {
    toast,
    showToast
  }
}