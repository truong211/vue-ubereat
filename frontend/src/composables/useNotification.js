import { useToast } from './useToast';

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
   * @param {number} timeout - The notification timeout in milliseconds
   */
  const notify = (message, type = 'info', timeout = 5000) => {
    if (toast && typeof toast.show === 'function') {
      toast.show({
        text: message,
        color: getColorForType(type),
        timeout
      });
    } else {
      // Fallback to console if toast is not available
      console.log(`[${type.toUpperCase()}] ${message}`);
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
