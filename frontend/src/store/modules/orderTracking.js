import websocketService from '@/services/websocket'
import { apiClient } from '@/services/api.service';

export default {
  namespaced: true,
  
  state: {
    trackingStatus: 'inactive', // 'inactive', 'connecting', 'active', 'error'
    currentOrder: null,
    driverLocation: null,
    orderUpdates: [],
    eta: null,
    lastUpdateTime: null,
    error: null,
    notifications: [],
    loading: false,
    orderHistory: [],
    driverLocationUpdates: {}
  },
  
  mutations: {
    SET_TRACKING_STATUS(state, status) {
      state.trackingStatus = status
    },
    
    SET_CURRENT_ORDER(state, order) {
      state.currentOrder = order
    },
    
    UPDATE_ORDER_STATUS(state, { status, timestamp, ...updates }) {
      if (state.currentOrder) {
        // Update order status
        state.currentOrder.status = status
        
        // Set relevant timestamps based on status
        const statusTimestamps = {
          confirmed: 'confirmedAt',
          preparing: 'preparingAt',
          ready: 'readyAt',
          on_the_way: 'pickedUpAt',
          delivered: 'deliveredAt'
        }
        
        if (statusTimestamps[status] && !state.currentOrder[statusTimestamps[status]]) {
          state.currentOrder[statusTimestamps[status]] = timestamp || new Date().toISOString()
        }
        
        // Apply other updates
        Object.keys(updates).forEach(key => {
          state.currentOrder[key] = updates[key]
        })
        
        // Add to order updates log
        state.orderUpdates.push({
          status,
          timestamp: timestamp || new Date().toISOString(),
          message: `Order status changed to ${status}`
        })
        
        // Update last update time
        state.lastUpdateTime = new Date().toISOString()
      }
    },
    
    UPDATE_DRIVER_LOCATION(state, { location, eta }) {
      state.driverLocation = location
      if (eta) {
        state.eta = eta
      }
      
      // Update last update time
      state.lastUpdateTime = new Date().toISOString()
      
      // If order is being tracked, update the driver's location in the order
      if (state.currentOrder) {
        state.currentOrder.driverLocation = location
        if (eta) {
          state.currentOrder.driverTimeAway = eta
        }
      }
    },
    
    ADD_ORDER_UPDATE(state, update) {
      state.orderUpdates.push({
        ...update,
        timestamp: update.timestamp || new Date().toISOString()
      })
      
      // Update last update time
      state.lastUpdateTime = new Date().toISOString()
    },
    
    SET_ERROR(state, error) {
      state.error = error
      state.trackingStatus = 'error'
    },
    
    CLEAR_ERROR(state) {
      state.error = null
    },
    
    RESET_TRACKING(state) {
      state.trackingStatus = 'inactive'
      state.driverLocation = null
      state.orderUpdates = []
      state.eta = null
      state.lastUpdateTime = null
      state.error = null
    },
    
    SET_NOTIFICATIONS(state, notifications) {
      state.notifications = notifications;
    },
    
    ADD_NOTIFICATION(state, notification) {
      state.notifications = [notification, ...state.notifications].slice(0, 10);
    },
    
    MARK_NOTIFICATION_READ(state, notificationId) {
      const index = state.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        state.notifications[index].read = true;
      }
    },
    
    MARK_ALL_NOTIFICATIONS_READ(state) {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading;
    },

    SET_ORDER_HISTORY(state, orders) {
      state.orderHistory = orders;
    },
    ADD_TO_ORDER_HISTORY(state, order) {
      // Add only if not already in history
      if (!state.orderHistory.some(o => o.id === order.id)) {
        state.orderHistory.push(order);
      }
    },
    UPDATE_ORDER_STATUS(state, { orderId, status, timestamp }) {
      if (state.currentOrder && state.currentOrder.id === orderId) {
        state.currentOrder.status = status;
        
        // Update status history
        if (!state.currentOrder.statusHistory) {
          state.currentOrder.statusHistory = [];
        }
        
        // Add to status history if not already there
        if (!state.currentOrder.statusHistory.some(s => s.status === status)) {
          state.currentOrder.statusHistory.push({
            status,
            timestamp: timestamp || new Date()
          });
        }
      }
      
      // Also update in order history
      const orderIndex = state.orderHistory.findIndex(o => o.id === orderId);
      if (orderIndex !== -1) {
        state.orderHistory[orderIndex].status = status;
      }
    },
    UPDATE_DRIVER_LOCATION(state, { orderId, location, trafficCondition }) {
      // Update in current order
      if (state.currentOrder && state.currentOrder.id === orderId && state.currentOrder.driver) {
        state.currentOrder.driver.location = location;
        if (trafficCondition) {
          state.currentOrder.trafficCondition = trafficCondition;
        }
      }
      
      // Store latest update in driverLocationUpdates
      state.driverLocationUpdates[orderId] = {
        location,
        timestamp: new Date(),
        trafficCondition
      };
    },
    UPDATE_ETA(state, { orderId, eta }) {
      if (state.currentOrder && state.currentOrder.id === orderId) {
        state.currentOrder.estimatedDeliveryTime = eta;
      }
      
      // Also update in order history
      const orderIndex = state.orderHistory.findIndex(o => o.id === orderId);
      if (orderIndex !== -1) {
        state.orderHistory[orderIndex].estimatedDeliveryTime = eta;
      }
    }
  },
  
  actions: {
    /**
     * Start tracking an order
     * @param {Object} context - Vuex context
     * @param {Object} order - Order to track
     */
    startTracking({ commit, dispatch }, order) {
      // Set tracking status to connecting
      commit('SET_TRACKING_STATUS', 'connecting')
      commit('SET_CURRENT_ORDER', order)
      
      // Setup event listeners for tracking events
      dispatch('setupEventListeners')
      
      // Try to connect to WebSocket and track order
      websocketService.connect()
        .then(() => {
          // Start tracking the order
          websocketService.trackOrder(order.id)
          commit('SET_TRACKING_STATUS', 'active')
          
          // Add initial update
          commit('ADD_ORDER_UPDATE', {
            status: order.status,
            message: 'Started tracking order'
          })
        })
        .catch(error => {
          console.error('Failed to start order tracking:', error)
          commit('SET_ERROR', 'Failed to connect to tracking service')
        })
    },
    
    /**
     * Stop tracking the current order
     */
    stopTracking({ commit, dispatch }) {
      // Clean up event listeners
      dispatch('removeEventListeners')
      
      // Reset tracking state
      commit('RESET_TRACKING')
    },
    
    /**
     * Set up WebSocket event listeners
     */
    setupEventListeners({ commit, state, dispatch }) {
      // Clean up any existing listeners first
      dispatch('removeEventListeners')
      
      // Add order update listener
      document.addEventListener('order_update', e => {
        const { orderId, status, timestamp, ...updates } = e.detail
        
        // Verify this is for the current order
        if (state.currentOrder && orderId.toString() === state.currentOrder.id.toString()) {
          commit('UPDATE_ORDER_STATUS', { status, timestamp, ...updates })
        }
      })
      
      // Add driver location update listener
      document.addEventListener('driver_location_update', e => {
        const { orderId, location, eta } = e.detail
        
        // Verify this is for the current order
        if (state.currentOrder && orderId.toString() === state.currentOrder.id.toString()) {
          commit('UPDATE_DRIVER_LOCATION', { location, eta })
        }
      })
      
      // Add WebSocket error listener
      document.addEventListener('websocket_error', e => {
        const { error } = e.detail
        commit('SET_ERROR', error || 'Connection error')
      })
      
      // Add WebSocket reconnect listener
      document.addEventListener('websocket_reconnect', () => {
        // If we're tracking an order, try to resume tracking
        if (state.currentOrder) {
          websocketService.trackOrder(state.currentOrder.id)
          commit('SET_TRACKING_STATUS', 'active')
          commit('ADD_ORDER_UPDATE', {
            message: 'Reconnected to tracking service'
          })
        }
      })
    },
    
    /**
     * Remove WebSocket event listeners
     */
    removeEventListeners() {
      document.removeEventListener('order_update', () => {})
      document.removeEventListener('driver_location_update', () => {})
      document.removeEventListener('websocket_error', () => {})
      document.removeEventListener('websocket_reconnect', () => {})
    },
    
    /**
     * Update order info
     * @param {Object} context - Vuex context
     * @param {Object} orderData - Updated order data
     */
    updateOrderInfo({ commit, state }, orderData) {
      if (state.currentOrder && orderData.id === state.currentOrder.id) {
        commit('SET_CURRENT_ORDER', {
          ...state.currentOrder,
          ...orderData
        })
      }
    },
    
    /**
     * Manually retry connection when in error state
     */
    retryConnection({ commit, state }) {
      if (state.trackingStatus === 'error' && state.currentOrder) {
        commit('SET_TRACKING_STATUS', 'connecting')
        commit('CLEAR_ERROR')
        
        // Try to reconnect
        websocketService.connect()
          .then(() => {
            // Resume tracking
            websocketService.trackOrder(state.currentOrder.id)
            commit('SET_TRACKING_STATUS', 'active')
            commit('ADD_ORDER_UPDATE', {
              message: 'Reconnected to tracking service'
            })
          })
          .catch(error => {
            console.error('Failed to reconnect:', error)
            commit('SET_ERROR', 'Failed to reconnect to tracking service')
          })
      }
    },
    
    receiveOrderStatusUpdate({ commit, dispatch, rootGetters }, { orderId, status, data }) {
      // Update order status in state
      commit('UPDATE_ORDER_STATUS', { orderId, status, data });
      
      // Get user preferences for notifications
      const notificationPreferences = rootGetters['user/notificationPreferences'] || {
        email: true,
        push: true,
        sms: false
      };
      
      // Create notification object
      const notification = {
        id: Date.now(),
        type: 'order_status',
        orderId,
        title: `Order #${orderId} Update`,
        message: getStatusMessage(status),
        read: false,
        timestamp: new Date().toISOString()
      };
      
      // Add notification to the store
      commit('ADD_NOTIFICATION', notification);
      
      // Show snackbar notification
      dispatch('ui/showSnackbar', {
        text: notification.message,
        color: getStatusColor(status),
        timeout: 6000,
        action: {
          text: 'View',
          callback: () => {
            router.push(`/orders/${orderId}/tracking`);
          }
        }
      }, { root: true });
      
      // Trigger browser notification if enabled
      if (notificationPreferences.push && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          showBrowserNotification(notification.title, notification.message);
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              showBrowserNotification(notification.title, notification.message);
            }
          });
        }
      }
    },
    
    loadNotifications({ commit }) {
      // Here you would typically fetch notifications from the API
      // For now, we'll use local storage as a temporary solution
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      commit('SET_NOTIFICATIONS', notifications);
    },
    
    markNotificationRead({ commit, state }, notificationId) {
      commit('MARK_NOTIFICATION_READ', notificationId);
      
      // Save to local storage
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    
    markAllNotificationsRead({ commit, state }) {
      commit('MARK_ALL_NOTIFICATIONS_READ');
      
      // Save to local storage
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    
    // Get order details
    async getOrderDetails({ commit }, orderId) {
      commit('SET_LOADING', true);
      
      try {
        // Call the backend API to get order details
        const response = await apiClient.get(`/api/orders/${orderId}`);
        const order = response.data;
        
        // Set the current order
        commit('SET_CURRENT_ORDER', order);
        
        // Add to order history for quick access
        commit('ADD_TO_ORDER_HISTORY', order);
        
        commit('SET_LOADING', false);
        return order;
      } catch (error) {
        console.error('Error fetching order details:', error);
        commit('SET_ERROR', 'Could not load order details');
        commit('SET_LOADING', false);
        throw error;
      }
    },
    
    // Get order updates (for polling)
    async getOrderUpdates({ commit, state }, orderId) {
      try {
        const response = await apiClient.get(`/api/orders/${orderId}/updates`);
        
        if (response.data && Array.isArray(response.data.updates)) {
          // Add updates to the order
          response.data.updates.forEach(update => {
            commit('ADD_ORDER_UPDATE', update);
          });
        }
        
        // If order status has changed, update it
        if (response.data.currentStatus && 
            (!state.currentOrder || state.currentOrder.status !== response.data.currentStatus)) {
          commit('UPDATE_ORDER_STATUS', { 
            orderId, 
            status: response.data.currentStatus,
            timestamp: new Date()
          });
        }
        
        return response.data;
      } catch (error) {
        console.error('Error fetching order updates:', error);
        return null;
      }
    },
    
    // Load notifications from localStorage
    loadNotifications({ commit }) {
      try {
        const savedNotifications = localStorage.getItem('foodDelivery_notifications');
        if (savedNotifications) {
          commit('SET_NOTIFICATIONS', JSON.parse(savedNotifications));
        }
      } catch (error) {
        console.error('Error loading notifications from localStorage', error);
      }
    },
    
    // Mark a notification as read
    markNotificationRead({ commit, state }, notificationId) {
      commit('MARK_NOTIFICATION_READ', notificationId);
      
      // Save to local storage
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    
    // Mark all notifications as read
    markAllNotificationsRead({ commit, state }) {
      commit('MARK_ALL_NOTIFICATIONS_READ');
      
      // Save to localStorage
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    
    // Fetch order history for the current user
    async getOrderHistory({ commit }) {
      commit('SET_LOADING', true);
      
      try {
        const response = await apiClient.get('/api/orders');
        commit('SET_ORDER_HISTORY', response.data.orders);
        return response.data.orders;
      } catch (error) {
        console.error('Error fetching order history:', error);
        return [];
      } finally {
        commit('SET_LOADING', false);
      }
    },
    
    // Handle real-time order status update
    updateOrderStatus({ commit }, { orderId, status, timestamp }) {
      commit('UPDATE_ORDER_STATUS', { orderId, status, timestamp });
    },
    
    // Handle real-time driver location update
    updateDriverLocation({ commit }, { orderId, location, trafficCondition }) {
      commit('UPDATE_DRIVER_LOCATION', { orderId, location, trafficCondition });
    },
    
    // Update estimated delivery time
    updateETA({ commit }, { orderId, eta }) {
      commit('UPDATE_ETA', { orderId, eta });
    }
  },
  
  getters: {
    isTracking: state => state.trackingStatus === 'active',
    
    isConnecting: state => state.trackingStatus === 'connecting',
    
    hasError: state => state.trackingStatus === 'error',
    
    getError: state => state.error,
    
    getCurrentOrder: state => state.currentOrder,
    
    getDriverLocation: state => state.driverLocation,
    
    getOrderUpdates: state => state.orderUpdates,
    
    getEta: state => state.eta,
    
    getLastUpdateTime: state => state.lastUpdateTime,
    
    getNotifications: state => state.notifications,
    
    loading: state => state.loading,
    
    unreadNotificationsCount: state => state.notifications.filter(n => !n.read).length,

    currentOrder: state => state.currentOrder,
    orderHistory: state => state.orderHistory,
    isLoading: state => state.loading,
    orderError: state => state.error,
    getOrderById: state => id => {
      // Check in current order
      if (state.currentOrder && state.currentOrder.id === id) {
        return state.currentOrder;
      }
      
      // Check in order history
      return state.orderHistory.find(order => order.id === id);
    },
    getDriverLocation: state => orderId => {
      const update = state.driverLocationUpdates[orderId];
      if (update) {
        return update.location;
      }
      
      return null;
    }
  }
}

// Helper functions
function getStatusMessage(status) {
  switch (status) {
    case 'pending':
      return 'Your order has been received and is pending restaurant confirmation.';
    case 'confirmed':
      return 'Good news! The restaurant has confirmed your order.';
    case 'preparing':
      return 'The restaurant is now preparing your food.';
    case 'ready_for_pickup':
      return 'Your food is ready! A driver will pick it up soon.';
    case 'out_for_delivery':
      return 'Your food is on the way! Track your driver in real-time.';
    case 'delivered':
      return 'Your order has been delivered. Enjoy your meal!';
    case 'cancelled':
      return 'Your order has been cancelled.';
    default:
      return 'Your order status has been updated.';
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'delivered':
      return 'success';
    case 'cancelled':
      return 'error';
    case 'out_for_delivery':
      return 'info';
    default:
      return 'primary';
  }
}

function showBrowserNotification(title, message) {
  // Check if browser supports notifications
  if ('Notification' in window) {
    // Check if permission has been granted
    if (Notification.permission === 'granted') {
      // Create and show notification
      new Notification(title, {
        body: message,
        icon: '/favicon.ico'
      });
    } 
    // Otherwise, ask for permission if not denied
    else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/favicon.ico'
          });
        }
      });
    }
  }
}

function getStatusText(status) {
  const statusMap = {
    'pending': 'Order Placed',
    'confirmed': 'Confirmed',
    'preparing': 'Preparing',
    'ready_for_pickup': 'Ready for Pickup',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled'
  };
  
  return statusMap[status] || status;
}