import { ref, readonly } from 'vue';

// Create a reactive state that will be shared across all instances
const toastState = ref({
  show: false,
  text: '',
  color: 'info',
  timeout: 5000
});

/**
 * Composable for showing toast notifications
 * @returns {Object} - Toast methods and state
 */
export function useToast() {
  /**
   * Show a toast notification
   * @param {Object|string} options - Toast options or message string
   * @param {string} options.text - The toast message
   * @param {string} options.color - The toast color (success, error, info, warning)
   * @param {number} options.timeout - The toast timeout in milliseconds
   */
  const show = (options) => {
    // If options is a string, convert it to an object
    if (typeof options === 'string') {
      options = { text: options };
    }
    
    // Update toast state
    toastState.value = {
      show: true,
      text: options.text || '',
      color: options.color || 'info',
      timeout: options.timeout || 5000
    };
  };
  
  /**
   * Show a success toast
   * @param {string} message - The toast message
   * @param {number} timeout - The toast timeout in milliseconds
   */
  const success = (message, timeout = 5000) => {
    show({
      text: message,
      color: 'success',
      timeout
    });
  };
  
  /**
   * Show an error toast
   * @param {string} message - The toast message
   * @param {number} timeout - The toast timeout in milliseconds
   */
  const error = (message, timeout = 5000) => {
    show({
      text: message,
      color: 'error',
      timeout
    });
  };
  
  /**
   * Show an info toast
   * @param {string} message - The toast message
   * @param {number} timeout - The toast timeout in milliseconds
   */
  const info = (message, timeout = 5000) => {
    show({
      text: message,
      color: 'info',
      timeout
    });
  };
  
  /**
   * Show a warning toast
   * @param {string} message - The toast message
   * @param {number} timeout - The toast timeout in milliseconds
   */
  const warning = (message, timeout = 5000) => {
    show({
      text: message,
      color: 'warning',
      timeout
    });
  };
  
  /**
   * Hide the toast
   */
  const hide = () => {
    toastState.value.show = false;
  };
  
  return {
    // Expose the state as readonly to prevent direct modification
    state: readonly(toastState),
    
    // Expose methods
    show,
    success,
    error,
    info,
    warning,
    hide
  };
}
