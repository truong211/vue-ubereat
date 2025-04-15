import { useNotificationStore } from '@/stores/notifications'

export const initNotifications = async () => {
  try {
    const notificationStore = useNotificationStore()
    await notificationStore.initNotifications()
    console.log('Notification system initialized successfully')
  } catch (error) {
    console.warn('Failed to initialize notification system:', error)
  }
} 