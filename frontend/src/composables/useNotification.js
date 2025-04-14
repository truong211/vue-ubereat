import { useToast } from 'vue-toastification';

/**
 * Composable for showing notifications
 * @returns {Object} - Notification methods
 */
export function useNotification() {
  const toast = useToast();
  
  /**
   * Show a notification
   * @param {string} message - The notification message
   * @param {string} type - The notification type (success, error, info, warning)
   * @param {Object} options - Additional options for the notification
   */
  const notify = (message, type = 'default', options = {}) => {
    const defaultOptions = {
      position: 'top-right',
      timeout: 5000,
      closeOnClick: true,
      pauseOnFocusLoss: true,
      pauseOnHover: true,
      draggable: true,
      draggablePercent: 0.6,
      showCloseButtonOnHover: false,
      hideProgressBar: false,
      closeButton: 'button',
      icon: true,
      rtl: false
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    switch (type) {
      case 'success':
        toast.success(message, mergedOptions);
        break;
      case 'error':
        toast.error(message, mergedOptions);
        break;
      case 'warning':
        toast.warning(message, mergedOptions);
        break;
      case 'info':
        toast.info(message, mergedOptions);
        break;
      default:
        toast(message, mergedOptions);
        break;
    }
  };
  
  /**
   * Get the color for a notification type
   * @param {string} type - The notification type
   * @returns {string} - The color for the notification type
   */
  const getColorForType = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };
  
  return {
    notify
  };
}
