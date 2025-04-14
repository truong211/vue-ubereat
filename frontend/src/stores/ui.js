import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', {
  state: () => ({
    snackbar: {
      show: false,
      text: '',
      color: 'success',
      timeout: 3000
    }
  }),

  actions: {
    showSnackbar({ text, color = 'success', timeout = 3000 }) {
      this.snackbar = {
        show: true,
        text,
        color,
        timeout
      }
    },

    hideSnackbar() {
      this.snackbar.show = false
    }
  }
})
