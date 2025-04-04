import axios from 'axios';
import { io } from 'socket.io-client';
import { store } from '@/store';
import { API_URL } from '@/config';

class TrackingService {
  constructor() {
    this.socket = null;
    this.trackingInterval = null;
    this.etaUpdateInterval = null;
    this.connected = false;
    this.apiUrl = API_URL;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000; // 3 seconds
    this.trackingOrders = new Set();
    this.callbacks = {};
  }

  /**
   * Initialize the tracking service
   */
  initialize() {
    if (!this.socket) {
      this.socket = io(this.apiUrl, {
        path: '/tracking',
        transports: ['websocket', 'polling'],
        autoConnect: false
      });

      this.setupSocketListeners();
    }
  }

  /**
   * Set up socket.io event listeners
   */
  setupSocketListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Tracking socket connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Re-join tracking rooms for any active orders
      this.trackingOrders.forEach(orderId => {
        this.socket.emit('join_order_room', { orderId });
      });
      
      if (this.callbacks.onConnect) {
        this.callbacks.onConnect();
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Tracking socket disconnected');
      this.connected = false;
      
      if (this.callbacks.onDisconnect) {
        this.callbacks.onDisconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Tracking socket connection error:', error);
      this.handleReconnect();
    });

    // Tracking events
    this.socket.on('driver_location', (data) => {
      store.commit('tracking/UPDATE_DRIVER_LOCATION', data);
      
      if (this.callbacks.onDriverLocationUpdate) {
        this.callbacks.onDriverLocationUpdate(data);
      }
    });

    this.socket.on('order_status', (data) => {
      store.commit('tracking/UPDATE_ORDER_STATUS', data);
      
      if (this.callbacks.onOrderStatusUpdate) {
        this.callbacks.onOrderStatusUpdate(data);
      }
    });

    this.socket.on('eta_update', (data) => {
      store.commit('tracking/UPDATE_ORDER_ETA', data);
      
      if (this.callbacks.onEtaUpdate) {
        this.callbacks.onEtaUpdate(data);
      }
    });
  }

  /**
   * Connect to the tracking socket
   */
  connect() {
    if (this.socket && !this.connected) {
      this.socket.connect();
    }
  }

  /**
   * Disconnect from the tracking socket
   */
  disconnect() {
    if (this.socket && this.connected) {
      this.trackingOrders.clear();
      this.socket.disconnect();
    }
  }

  /**
   * Handle reconnection attempts
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.connect();
      }, this.reconnectDelay * this.reconnectAttempts);
    } else {
      console.error('Max reconnection attempts reached');
      if (this.callbacks.onReconnectFailed) {
        this.callbacks.onReconnectFailed();
      }
    }
  }

  /**
   * Start tracking an order
   * @param {String} orderId - The order ID to track
   * @returns {Promise<Object>} - Initial tracking data
   */
  async startTracking(orderId) {
    if (!orderId) {
      throw new Error('Order ID is required');
    }

    try {
      // Initialize the socket if needed
      if (!this.socket) {
        this.initialize();
      }

      // Connect if not connected
      if (!this.connected) {
        this.connect();
      }

      // Add order to tracking set
      this.trackingOrders.add(orderId);

      // Join order tracking room
      this.socket.emit('join_order_room', { orderId });

      // Get initial tracking data
      const initialData = await this.getOrderTrackingData(orderId);

      // Update store with initial data
      store.commit('tracking/SET_ORDER_TRACKING', {
        orderId,
        data: initialData
      });

      // Start continuous ETA updates for active deliveries
      if (initialData.status === 'on_the_way' && initialData.driverLocation) {
        this.startContinuousEtaUpdates(orderId);
      }

      return initialData;
    } catch (error) {
      console.error('Error starting order tracking:', error);
      throw error;
    }
  }

  /**
   * Stop tracking an order
   * @param {String} orderId - The order ID to stop tracking
   */
  stopTracking(orderId) {
    if (!orderId || !this.trackingOrders.has(orderId)) {
      return;
    }

    // Leave order tracking room
    if (this.socket && this.connected) {
      this.socket.emit('leave_order_room', { orderId });
    }

    // Stop continuous ETA updates
    this.stopContinuousEtaUpdates();

    // Remove order from tracking set
    this.trackingOrders.delete(orderId);

    // If no more orders are being tracked, disconnect
    if (this.trackingOrders.size === 0) {
      this.disconnect();
    }
  }

  /**
   * Get order tracking data
   * @param {String} orderId - The order ID to get tracking data for
   * @returns {Promise<Object>} - Order tracking data
   */
  async getOrderTrackingData(orderId) {
    try {
      const response = await axios.get(`/api/orders/${orderId}/tracking`);
      return response.data;
    } catch (error) {
      console.error('Error getting order tracking data:', error);
      throw error;
    }
  }

  /**
   * Get driver location
   * @param {String} driverId - The driver ID
   * @returns {Promise<Object>} - Driver location
   */
  async getDriverLocation(driverId) {
    try {
      const response = await axios.get(`/api/drivers/${driverId}/location`);
      return response.data;
    } catch (error) {
      console.error('Error getting driver location:', error);
      throw error;
    }
  }

  /**
   * Get estimated delivery time
   * @param {String} orderId - The order ID
   * @returns {Promise<Object>} - ETA data
   */
  async getEstimatedDeliveryTime(orderId) {
    try {
      const response = await axios.get(`/api/orders/${orderId}/eta`);
      return response.data;
    } catch (error) {
      console.error('Error getting estimated delivery time:', error);
      throw error;
    }
  }

  /**
   * Register event callbacks
   * @param {Object} callbacks - Object containing callback functions
   */
  registerCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get restaurant location
   * @param {String} restaurantId - The restaurant ID
   * @returns {Promise<Object>} - Restaurant location
   */
  async getRestaurantLocation(restaurantId) {
    try {
      const response = await axios.get(`/api/restaurants/${restaurantId}/location`);
      return response.data;
    } catch (error) {
      console.error('Error getting restaurant location:', error);
      throw error;
    }
  }

  /**
   * Get delivery address location
   * @param {String} orderId - The order ID
   * @returns {Promise<Object>} - Delivery address location
   */
  async getDeliveryLocation(orderId) {
    try {
      const response = await axios.get(`/api/orders/${orderId}/delivery-location`);
      return response.data;
    } catch (error) {
      console.error('Error getting delivery location:', error);
      throw error;
    }
  }

  /**
   * Check if an order is trackable
   * @param {Object} order - The order object
   * @returns {Boolean} - Whether the order is trackable
   */
  isOrderTrackable(order) {
    if (!order) return false;

    const trackableStatuses = [
      'accepted',
      'preparing',
      'ready_for_pickup',
      'picked_up',
      'in_transit',
      'arriving'
    ];

    return trackableStatuses.includes(order.status);
  }

  /**
   * Start continuous ETA updates
   * @param {String} orderId - The order ID to update ETA for
   */
  startContinuousEtaUpdates(orderId) {
    // Clear any existing interval
    this.stopContinuousEtaUpdates();
    
    // Set interval to update ETA every 30 seconds
    this.etaUpdateInterval = setInterval(async () => {
      try {
        const etaData = await this.getEstimatedDeliveryTime(orderId);
        
        // Update store with new ETA
        store.commit('tracking/UPDATE_ORDER_ETA', {
          orderId,
          eta: etaData.estimatedTime,
          trafficConditions: etaData.trafficConditions
        });
        
        // Trigger callback if registered
        if (this.callbacks.onEtaUpdate) {
          this.callbacks.onEtaUpdate(etaData);
        }
      } catch (error) {
        console.error('Error updating ETA:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  /**
   * Stop continuous ETA updates
   */
  stopContinuousEtaUpdates() {
    if (this.etaUpdateInterval) {
      clearInterval(this.etaUpdateInterval);
      this.etaUpdateInterval = null;
    }
  }
}

export const trackingService = new TrackingService();
export default trackingService;