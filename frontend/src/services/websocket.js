import { io } from 'socket.io-client';
import store from '../store';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.customerSocket = null;
    this.restaurantSocket = null;
    this.driverSocket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  }

  /**
   * Initialize the WebSocket service
   * @param {Object} store - Vuex store
   */
  init(store) {
    this.store = store;
  }

  /**
   * Connect to the appropriate WebSocket based on user role
   */
  connect() {
    if (this.connected) return;
    
    const user = store.getters['user'];
    const token = store.getters['token'];
    
    if (!user || !token) {
      console.error('Cannot connect to WebSocket: User not authenticated');
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
      // Connect to the appropriate namespace based on user role
      if (user.role === 'customer') {
        this.customerSocket = io(`${this.baseUrl}/customer`, socketOptions);
        this.setupCustomerEvents(this.customerSocket);
      } else if (user.role === 'restaurant') {
        this.restaurantSocket = io(`${this.baseUrl}/restaurant`, socketOptions);
        this.setupRestaurantEvents(this.restaurantSocket);
      } else if (user.role === 'driver') {
        this.driverSocket = io(`${this.baseUrl}/driver`, socketOptions);
        this.setupDriverEvents(this.driverSocket);
      }

      this.connected = true;
      this.reconnectAttempts = 0;
      store.dispatch('setWebSocketStatus', 'connected');
      console.log(`WebSocket connected for user role: ${user.role}`);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      store.dispatch('setWebSocketStatus', 'error');
      this.attemptReconnect();
    }
  }

  /**
   * Setup events for customer socket
   * @param {Object} socket - Socket.io socket
   */
  setupCustomerEvents(socket) {
    // Connection events
    socket.on('connect', () => {
      store.dispatch('setWebSocketStatus', 'connected');
      console.log('Customer WebSocket connected');
    });

    socket.on('disconnect', (reason) => {
      store.dispatch('setWebSocketStatus', 'disconnected');
      console.log('Customer WebSocket disconnected:', reason);
      this.connected = false;
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.attemptReconnect();
      }
    });

    socket.on('error', (error) => {
      store.dispatch('setWebSocketStatus', 'error');
      console.error('Customer WebSocket error:', error);
    });

    // Order events
    socket.on('order_status_updated', (data) => {
      console.log('Order status updated:', data);
      store.dispatch('orders/handleOrderStatusUpdate', data);
      
      // Show notification for important status changes
      const importantStatuses = ['confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery', 'delivered'];
      if (importantStatuses.includes(data.status)) {
        const statusMessages = {
          confirmed: 'Your order has been confirmed!',
          preparing: 'The restaurant is preparing your order',
          ready_for_pickup: 'Your order is ready for pickup',
          out_for_delivery: 'Your order is on the way!',
          delivered: 'Your order has been delivered'
        };
        
        store.dispatch('ui/showSnackbar', {
          text: statusMessages[data.status] || `Order status: ${data.status}`,
          color: 'info',
          timeout: 5000
        });
      }
    });

    socket.on('driver_location_updated', (data) => {
      console.log('Driver location updated:', data);
      store.dispatch('orders/handleDriverLocationUpdate', data);
    });

    socket.on('new_order', (data) => {
      console.log('New order created:', data);
      store.dispatch('addNotification', {
        type: 'order_created',
        title: 'New Order Created',
        message: `Your order #${data.orderNumber} has been created`,
        data: data
      });
    });

    socket.on('order_cancelled', (data) => {
      console.log('Order cancelled:', data);
      store.dispatch('orders/handleOrderStatusUpdate', {
        orderId: data.orderId,
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });
      
      store.dispatch('ui/showSnackbar', {
        text: 'Your order has been cancelled',
        color: 'error',
        timeout: 5000
      });
    });

    // Chat messages
    socket.on('chat_message', (data) => {
      console.log('Chat message received:', data);
      store.dispatch('addNotification', {
        type: 'chat_message',
        title: 'New Message',
        message: data.message,
        data: data
      });
    });
  }

  /**
   * Setup events for restaurant socket
   * @param {Object} socket - Socket.io socket
   */
  setupRestaurantEvents(socket) {
    // Connection events
    socket.on('connect', () => {
      store.dispatch('setWebSocketStatus', 'connected');
      console.log('Restaurant WebSocket connected');
    });

    socket.on('disconnect', (reason) => {
      store.dispatch('setWebSocketStatus', 'disconnected');
      console.log('Restaurant WebSocket disconnected:', reason);
      this.connected = false;
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.attemptReconnect();
      }
    });

    socket.on('error', (error) => {
      store.dispatch('setWebSocketStatus', 'error');
      console.error('Restaurant WebSocket error:', error);
    });

    // Order events
    socket.on('new_order', (data) => {
      console.log('New order received:', data);
      // Play sound for new order
      const audio = new Audio('/sounds/new-order.mp3');
      audio.play().catch(err => console.warn('Could not play audio:', err));
      
      // Add order to pending orders
      store.commit('restaurantAdmin/addPendingOrder', data);
      
      // Add notification
      store.dispatch('addNotification', {
        type: 'new_order',
        title: 'New Order Received',
        message: `Order #${data.orderNumber} received`,
        data: data
      });
    });

    socket.on('order_status_updated', (data) => {
      console.log('Order status updated:', data);
      store.commit('restaurantAdmin/updateOrderStatus', {
        orderId: data.orderId,
        status: data.status,
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    });

    socket.on('order_cancelled', (data) => {
      console.log('Order cancelled:', data);
      store.commit('restaurantAdmin/updateOrderStatus', {
        orderId: data.orderId,
        status: 'cancelled',
        updatedAt: new Date().toISOString()
      });
    });

    socket.on('driver_location_updated', (data) => {
      console.log('Driver location updated:', data);
      // Update driver location on order tracking map if applicable
    });

    // Chat messages
    socket.on('chat_message', (data) => {
      console.log('Chat message received:', data);
      store.dispatch('addNotification', {
        type: 'chat_message',
        title: 'New Message',
        message: data.message,
        data: data
      });
    });
  }

  /**
   * Setup events for driver socket
   * @param {Object} socket - Socket.io socket
   */
  setupDriverEvents(socket) {
    // Connection events
    socket.on('connect', () => {
      store.dispatch('setWebSocketStatus', 'connected');
      console.log('Driver WebSocket connected');
    });

    socket.on('disconnect', (reason) => {
      store.dispatch('setWebSocketStatus', 'disconnected');
      console.log('Driver WebSocket disconnected:', reason);
      this.connected = false;
      if (reason === 'io server disconnect' || reason === 'transport close') {
        this.attemptReconnect();
      }
    });

    socket.on('error', (error) => {
      store.dispatch('setWebSocketStatus', 'error');
      console.error('Driver WebSocket error:', error);
    });

    // Order events
    socket.on('order_assigned', (data) => {
      console.log('Order assigned:', data);
      // Play sound for new assignment
      const audio = new Audio('/sounds/new-assignment.mp3');
      audio.play().catch(err => console.warn('Could not play audio:', err));
      
      // Add order to active orders
      store.commit('driver/addActiveOrder', data);
      
      // Add notification
      store.dispatch('addNotification', {
        type: 'order_assigned',
        title: 'New Order Assigned',
        message: `Order #${data.orderNumber} has been assigned to you`,
        data: data
      });
    });

    socket.on('order_status_updated', (data) => {
      console.log('Order status updated:', data);
      store.commit('driver/updateActiveOrder', {
        orderId: data.orderId,
        updates: {
          status: data.status,
          updatedAt: data.updatedAt || new Date().toISOString()
        }
      });
    });

    socket.on('order_cancelled', (data) => {
      console.log('Order cancelled:', data);
      store.dispatch('driver/handleOrderCancelled', data.orderId);
      
      store.dispatch('ui/showSnackbar', {
        text: 'Order has been cancelled',
        color: 'error',
        timeout: 5000
      });
    });

    // New order available for pickup
    socket.on('new_order_available', (data) => {
      console.log('New order available:', data);
      store.dispatch('driver/handleNewOrder', data);
    });

    // Chat messages
    socket.on('chat_message', (data) => {
      console.log('Chat message received:', data);
      store.dispatch('addNotification', {
        type: 'chat_message',
        title: 'New Message',
        message: data.message,
        data: data
      });
    });
  }

  /**
   * Attempt to reconnect to WebSocket server
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum WebSocket reconnection attempts reached');
      store.dispatch('ui/showSnackbar', {
        text: 'Failed to reconnect to server. Please refresh the page.',
        color: 'error',
        timeout: -1,
        action: {
          text: 'REFRESH',
          callback: () => window.location.reload()
        }
      });
      return;
    }
    
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    console.log('Disconnecting WebSocket...');
    
    if (this.customerSocket) {
      this.customerSocket.disconnect();
      this.customerSocket = null;
    }
    
    if (this.restaurantSocket) {
      this.restaurantSocket.disconnect();
      this.restaurantSocket = null;
    }
    
    if (this.driverSocket) {
      this.driverSocket.disconnect();
      this.driverSocket = null;
    }
    
    this.connected = false;
  }

  /**
   * Track order updates by joining the order room
   * @param {number|string} orderId - Order ID
   */
  trackOrder(orderId) {
    if (this.customerSocket) {
      this.customerSocket.emit('track_order', orderId);
      console.log(`Tracking order ${orderId}`);
    }
  }

  /**
   * Stop tracking order updates
   * @param {number|string} orderId - Order ID
   */
  stopTrackingOrder(orderId) {
    if (this.customerSocket) {
      this.customerSocket.emit('stop_tracking_order', orderId);
      console.log(`Stopped tracking order ${orderId}`);
    }
  }

  /**
   * Update order status (for restaurant and driver)
   * @param {number|string} orderId - Order ID
   * @param {string} status - New status
   */
  updateOrderStatus(orderId, status) {
    if (this.restaurantSocket) {
      this.restaurantSocket.emit('update_order_status', { orderId, status });
      console.log(`Updating order ${orderId} status to ${status}`);
    } else if (this.driverSocket) {
      this.driverSocket.emit('update_order_status', { orderId, status });
      console.log(`Updating order ${orderId} status to ${status}`);
    }
  }

  /**
   * Update driver location (for drivers only)
   * @param {number|string} orderId - Order ID
   * @param {Object} location - Location coordinates { lat, lng }
   */
  updateDriverLocation(orderId, location) {
    if (this.driverSocket) {
      this.driverSocket.emit('update_location', { orderId, location });
    }
  }

  /**
   * Send a chat message
   * @param {number|string} orderId - Order ID
   * @param {string} message - Message text
   * @param {string} senderType - Sender type ('customer', 'restaurant', 'driver')
   */
  sendChatMessage(orderId, message, senderType) {
    const messageData = {
      orderId,
      message,
      senderType,
      timestamp: new Date().toISOString()
    };
    
    if (this.customerSocket) {
      this.customerSocket.emit('chat_message', messageData);
    } else if (this.restaurantSocket) {
      this.restaurantSocket.emit('chat_message', messageData);
    } else if (this.driverSocket) {
      this.driverSocket.emit('chat_message', messageData);
    }
  }

  /**
   * Get connection status
   * @returns {boolean} True if connected
   */
  isConnected() {
    return this.connected;
  }
}

export default new WebSocketService();
