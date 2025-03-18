import { io } from 'socket.io-client';
import store from '../store';

class AdminWebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  connect() {
    if (this.connected) return;

    const token = store.state.auth.token;
    if (!token) {
      console.error('Cannot connect to Admin WebSocket: Not authenticated');
      return;
    }

    const socketOptions = {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectInterval,
    };

    try {
      this.socket = io(`${this.baseUrl}/admin`, socketOptions);
      this.setupEventListeners();
    } catch (error) {
      console.error('Admin WebSocket connection error:', error);
      store.dispatch('setWebSocketStatus', 'error');
    }
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Admin WebSocket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      store.dispatch('setWebSocketStatus', 'connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Admin WebSocket disconnected:', reason);
      this.connected = false;
      store.dispatch('setWebSocketStatus', 'disconnected');
      
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.attemptReconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('Admin WebSocket error:', error);
      store.dispatch('setWebSocketStatus', 'error');
    });

    // Restaurant events
    this.socket.on('new_restaurant_application', (data) => {
      store.dispatch('admin/handleNewRestaurantApplication', data);
      this.playNotificationSound();
    });

    this.socket.on('restaurant_status_changed', (data) => {
      store.dispatch('admin/handleRestaurantStatusChange', data);
    });

    // User events
    this.socket.on('user_reported', (data) => {
      store.dispatch('admin/handleUserReport', data);
      this.playNotificationSound();
    });

    this.socket.on('user_status_changed', (data) => {
      store.dispatch('admin/handleUserStatusChange', data);
    });

    // Order events
    this.socket.on('order_issue_reported', (data) => {
      store.dispatch('admin/handleOrderIssue', data);
      this.playNotificationSound();
    });

    this.socket.on('delivery_issue', (data) => {
      store.dispatch('admin/handleDeliveryIssue', data);
      this.playNotificationSound();
    });

    // System events
    this.socket.on('system_alert', (data) => {
      store.dispatch('admin/handleSystemAlert', data);
      this.playNotificationSound();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      store.dispatch('ui/showSnackbar', {
        text: 'Connection lost. Please refresh the page.',
        color: 'error',
        timeout: -1
      });
      return;
    }

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, this.reconnectInterval);
  }

  // Admin actions
  monitorRestaurant(restaurantId) {
    if (this.socket && this.connected) {
      this.socket.emit('monitor_restaurant', restaurantId);
    }
  }

  stopMonitoringRestaurant(restaurantId) {
    if (this.socket && this.connected) {
      this.socket.emit('stop_monitoring_restaurant', restaurantId);
    }
  }

  monitorUser(userId) {
    if (this.socket && this.connected) {
      this.socket.emit('monitor_user', userId);
    }
  }

  stopMonitoringUser(userId) {
    if (this.socket && this.connected) {
      this.socket.emit('stop_monitoring_user', userId);
    }
  }

  restaurantAction(restaurantId, action, reason) {
    if (this.socket && this.connected) {
      this.socket.emit('restaurant_action', { restaurantId, action, reason });
    }
  }

  userAction(userId, action, reason) {
    if (this.socket && this.connected) {
      this.socket.emit('user_action', { userId, action, reason });
    }
  }

  emitSystemAlert(alert) {
    if (this.socket && this.connected) {
      this.socket.emit('system_alert', alert);
    }
  }

  playNotificationSound() {
    // Only play sound if enabled in user preferences
    if (store.state.admin.preferences?.notificationSound) {
      const audio = new Audio('/sounds/admin-notification.mp3');
      audio.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    }
  }
}

export const adminWebSocket = new AdminWebSocketService();
export default adminWebSocket;