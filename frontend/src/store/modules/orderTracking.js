import websocketService from '@/services/websocket'
import axios from 'axios'
import { api } from '@/services/api';

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
      commit('SET_ERROR', null);
      
      try {
        // For demo purposes, we'll return mock data
        const mockOrder = generateMockOrder(orderId);
        commit('SET_CURRENT_ORDER', mockOrder);
        commit('SET_LOADING', false);
        return mockOrder;
      } catch (error) {
        console.error('Error fetching order details:', error);
        commit('SET_ERROR', 'Failed to load order details');
        commit('SET_LOADING', false);
        throw error;
      }
    },
    
    // Get order updates (for polling)
    async getOrderUpdates({ commit, state }, orderId) {
      try {
        // For demo purposes, we'll simulate an update
        if (!state.currentOrder) return null;
        
        const updatedOrder = {...state.currentOrder};
        
        // Simulate movement of driver (if applicable)
        if (updatedOrder.driver && updatedOrder.driver.location) {
          // Move driver closer to the delivery address
          const driverLoc = updatedOrder.driver.location;
          const destLoc = updatedOrder.deliveryAddress;
          
          // Move 20% closer to destination
          updatedOrder.driver.location = {
            lat: driverLoc.lat + (destLoc.lat - driverLoc.lat) * 0.2,
            lng: driverLoc.lng + (destLoc.lng - driverLoc.lng) * 0.2
          };
          
          // Reduce ETA
          if (updatedOrder.estimatedDeliveryTime > 5) {
            updatedOrder.estimatedDeliveryTime -= 5;
          }
        }
        
        // Simulate status progression based on a random chance
        const randomChance = Math.random();
        if (randomChance > 0.7) {
          const statusOrder = [
            'pending',
            'confirmed',
            'preparing',
            'ready_for_pickup',
            'out_for_delivery',
            'delivered'
          ];
          
          const currentStatusIndex = statusOrder.indexOf(updatedOrder.status);
          
          // Only progress if not at the end
          if (currentStatusIndex < statusOrder.length - 1) {
            const newStatus = statusOrder[currentStatusIndex + 1];
            updatedOrder.status = newStatus;
            
            // Add to status history
            if (!updatedOrder.statusHistory) {
              updatedOrder.statusHistory = [];
            }
            
            updatedOrder.statusHistory.push({
              status: newStatus,
              timestamp: new Date().toISOString()
            });
            
            // If status changed to out_for_delivery and no driver yet, add a driver
            if (newStatus === 'out_for_delivery' && !updatedOrder.driver) {
              updatedOrder.driver = generateMockDriver(updatedOrder.restaurant.location);
            }
            
            // Create a notification for the status change
            const notification = {
              id: Date.now(),
              type: 'order_status',
              title: 'Order Status Update',
              message: `Your order #${updatedOrder.orderNumber} is now ${getStatusText(newStatus)}`,
              orderId: updatedOrder.id,
              status: newStatus,
              timestamp: new Date().toISOString(),
              read: false
            };
            
            commit('ADD_NOTIFICATION', notification);
          }
        }
        
        commit('SET_CURRENT_ORDER', updatedOrder);
        return updatedOrder;
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
      
      // Save to localStorage
      try {
        localStorage.setItem('foodDelivery_notifications', JSON.stringify(state.notifications));
      } catch (error) {
        console.error('Error saving notifications to localStorage', error);
      }
    },
    
    // Mark all notifications as read
    markAllNotificationsRead({ commit, state }) {
      commit('MARK_ALL_NOTIFICATIONS_READ');
      
      // Save to localStorage
      try {
        localStorage.setItem('foodDelivery_notifications', JSON.stringify(state.notifications));
      } catch (error) {
        console.error('Error saving notifications to localStorage', error);
      }
    },
    
    // Receive order status update (for websocket events)
    receiveOrderStatusUpdate({ commit, state }, { orderId, status, estimatedTime }) {
      // Update current order if it matches
      if (state.currentOrder && state.currentOrder.id === orderId) {
        const updatedOrder = {...state.currentOrder, status};
        
        if (estimatedTime) {
          updatedOrder.estimatedDeliveryTime = estimatedTime;
        }
        
        commit('SET_CURRENT_ORDER', updatedOrder);
      }
      
      // Create notification
      const notification = {
        id: Date.now(),
        type: 'order_status',
        title: 'Order Status Update',
        message: `Your order #${orderId} is now ${getStatusText(status)}`,
        orderId: orderId,
        status: status,
        timestamp: new Date().toISOString(),
        read: false
      };
      
      commit('ADD_NOTIFICATION', notification);
      
      // Show browser notification
      showBrowserNotification(notification.title, notification.message);
      
      // Save to localStorage
      try {
        localStorage.setItem('foodDelivery_notifications', JSON.stringify(state.notifications));
      } catch (error) {
        console.error('Error saving notifications to localStorage', error);
      }
    },

    // Fetch details for a specific order
    async getOrderDetails({ commit }, orderId) {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      try {
        const response = await api.get(`/orders/${orderId}`);
        const order = response.data;
        
        commit('SET_CURRENT_ORDER', order);
        commit('ADD_TO_ORDER_HISTORY', order);
        commit('SET_LOADING', false);
        
        return order;
      } catch (error) {
        console.error('Error fetching order details:', error);
        commit('SET_ERROR', 'Failed to load order details');
        commit('SET_LOADING', false);
        throw error;
      }
    },
    
    // Fetch updates for the current order
    async getOrderUpdates({ commit, state }, orderId) {
      try {
        const response = await api.get(`/orders/${orderId}/updates`);
        const updatedOrder = response.data;
        
        if (updatedOrder) {
          commit('SET_CURRENT_ORDER', updatedOrder);
          return updatedOrder;
        }
        
        return state.currentOrder;
      } catch (error) {
        console.error('Error fetching order updates:', error);
        return state.currentOrder;
      }
    },
    
    // Fetch order history for the current user
    async getOrderHistory({ commit }) {
      commit('SET_LOADING', true);
      
      try {
        const response = await api.get('/orders/history');
        const orders = response.data;
        
        commit('SET_ORDER_HISTORY', orders);
        commit('SET_LOADING', false);
        
        return orders;
      } catch (error) {
        console.error('Error fetching order history:', error);
        commit('SET_ERROR', 'Failed to load order history');
        commit('SET_LOADING', false);
        return [];
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
    },
    
    // Mock data for demonstration purposes
    // In a real app, this would be replaced by WebSocket events
    startMockOrderUpdates({ commit, state, dispatch }, orderId) {
      if (!state.currentOrder || state.currentOrder.id !== orderId) {
        return;
      }
      
      // Mock status progression
      const statusSequence = [
        { status: 'confirmed', delay: 5000 },
        { status: 'preparing', delay: 15000 },
        { status: 'ready_for_pickup', delay: 20000 },
        { status: 'out_for_delivery', delay: 10000 },
        { status: 'delivered', delay: 30000 }
      ];
      
      // Find current status index
      const currentStatus = state.currentOrder.status;
      let startIndex = statusSequence.findIndex(s => s.status === currentStatus);
      if (startIndex === -1) startIndex = 0;
      
      // Process each status update in sequence
      let cumulativeDelay = 0;
      for (let i = startIndex; i < statusSequence.length; i++) {
        cumulativeDelay += statusSequence[i].delay;
        
        setTimeout(() => {
          dispatch('updateOrderStatus', {
            orderId,
            status: statusSequence[i].status,
            timestamp: new Date()
          });
          
          // If we're starting delivery, add driver
          if (statusSequence[i].status === 'out_for_delivery' && state.currentOrder) {
            // Mock driver data
            const driverData = {
              id: 'driver-123',
              name: 'John Driver',
              phone: '+1234567890',
              rating: 4.8,
              totalRatings: 243,
              avatarUrl: null,
              location: {
                lat: state.currentOrder.restaurant.location.lat - 0.01,
                lng: state.currentOrder.restaurant.location.lng - 0.01
              }
            };
            
            // Update order with driver info
            commit('SET_CURRENT_ORDER', {
              ...state.currentOrder,
              driver: driverData
            });
            
            // Start mock driver location updates
            dispatch('startMockDriverLocationUpdates', orderId);
          }
        }, cumulativeDelay);
      }
    },
    
    // Mock driver location updates
    startMockDriverLocationUpdates({ commit, state }, orderId) {
      if (!state.currentOrder || !state.currentOrder.driver || state.currentOrder.status === 'delivered') {
        return;
      }
      
      // Get start and end coordinates
      const startLat = state.currentOrder.restaurant.location.lat;
      const startLng = state.currentOrder.restaurant.location.lng;
      const endLat = state.currentOrder.deliveryAddress.lat;
      const endLng = state.currentOrder.deliveryAddress.lng;
      
      // Calculate movement step values
      const steps = 10;
      const latStep = (endLat - startLat) / steps;
      const lngStep = (endLng - startLng) / steps;
      
      // Get initial driver position (or use from state)
      let currentLat = state.currentOrder.driver.location.lat;
      let currentLng = state.currentOrder.driver.location.lng;
      
      const intervalId = setInterval(() => {
        // Move driver closer to destination
        currentLat += latStep;
        currentLng += lngStep;
        
        // Update driver location
        commit('UPDATE_DRIVER_LOCATION', {
          orderId,
          location: { lat: currentLat, lng: currentLng },
          trafficCondition: Math.random() > 0.8 ? 'heavy' : 'normal' // Randomly simulate traffic changes
        });
        
        // Check if driver has reached destination or order is delivered
        const distanceRemaining = Math.sqrt(
          Math.pow(endLat - currentLat, 2) + Math.pow(endLng - currentLng, 2)
        );
        
        if (distanceRemaining < 0.001 || state.currentOrder.status === 'delivered') {
          clearInterval(intervalId);
        }
      }, 3000); // Update every 3 seconds
      
      // Store interval ID to clear later if needed
      return intervalId;
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

function generateMockOrder(orderId) {
  // Restaurant location (Manhattan)
  const restaurantLat = 40.7128 + (Math.random() * 0.02 - 0.01);
  const restaurantLng = -74.006 + (Math.random() * 0.02 - 0.01);
  
  // Customer location (slightly north - within delivery radius)
  const customerLat = restaurantLat + (Math.random() * 0.01 + 0.005);
  const customerLng = restaurantLng + (Math.random() * 0.01 - 0.005);
  
  // Driver location (between restaurant and customer)
  const driverLat = restaurantLat + (customerLat - restaurantLat) * 0.4;
  const driverLng = restaurantLng + (customerLng - restaurantLng) * 0.4;
  
  // Generate mock items
  const menuItems = [
    { id: 1, name: 'Margherita Pizza', price: 12.99, imageUrl: 'https://example.com/pizza.jpg' },
    { id: 2, name: 'Chicken Wings', price: 9.99, imageUrl: 'https://example.com/wings.jpg' },
    { id: 3, name: 'Caesar Salad', price: 8.99, imageUrl: 'https://example.com/salad.jpg' },
    { id: 4, name: 'Cheeseburger', price: 11.99, imageUrl: 'https://example.com/burger.jpg' },
    { id: 5, name: 'Pasta Carbonara', price: 14.99, imageUrl: 'https://example.com/pasta.jpg' },
    { id: 6, name: 'French Fries', price: 4.99, imageUrl: 'https://example.com/fries.jpg' },
    { id: 7, name: 'Ice Cream', price: 6.99, imageUrl: 'https://example.com/icecream.jpg' },
    { id: 8, name: 'Soda', price: 2.99, imageUrl: 'https://example.com/soda.jpg' }
  ];
  
  // Randomly select 1-4 items
  const numItems = Math.floor(Math.random() * 4) + 1;
  const orderItems = [];
  
  for (let i = 0; i < numItems; i++) {
    const randomItemIndex = Math.floor(Math.random() * menuItems.length);
    const item = menuItems[randomItemIndex];
    const quantity = Math.floor(Math.random() * 2) + 1;
    
    orderItems.push({
      ...item,
      quantity,
      options: []
    });
  }
  
  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 3.99;
  const tax = subtotal * 0.08;
  const tip = subtotal * 0.15;
  const total = subtotal + deliveryFee + tax + tip;
  
  // Random order status
  const statuses = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'out_for_delivery'];
  const randomStatusIndex = Math.floor(Math.random() * statuses.length);
  const orderStatus = statuses[randomStatusIndex];
  
  // Include driver only for certain statuses
  let driver = null;
  if (orderStatus === 'out_for_delivery') {
    driver = generateMockDriver({ lat: driverLat, lng: driverLng });
  }
  
  // Generate status history
  const statusHistory = [];
  for (let i = 0; i <= randomStatusIndex; i++) {
    // Create timestamps with appropriate spacing
    const timestamp = new Date();
    timestamp.setMinutes(timestamp.getMinutes() - (randomStatusIndex - i) * 10);
    
    statusHistory.push({
      status: statuses[i],
      timestamp: timestamp.toISOString()
    });
  }
  
  return {
    id: orderId,
    orderNumber: 'FD' + Math.floor(10000 + Math.random() * 90000),
    status: orderStatus,
    createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 60000)).toISOString(), // 0-90 mins ago
    estimatedDeliveryTime: 20 + Math.floor(Math.random() * 40), // 20-60 mins
    paymentMethod: Math.random() > 0.5 ? 'Credit Card' : 'PayPal',
    subtotal: subtotal,
    deliveryFee: deliveryFee,
    tax: tax,
    tip: tip,
    total: total,
    items: orderItems,
    restaurant: {
      id: Math.floor(1000 + Math.random() * 9000),
      name: 'Delicious Eats Restaurant',
      address: '123 Food Street, New York, NY',
      phone: '+1 (555) 123-4567',
      location: { lat: restaurantLat, lng: restaurantLng }
    },
    driver: driver,
    deliveryAddress: {
      address: '456 Hungry Avenue, New York, NY',
      lat: customerLat,
      lng: customerLng
    },
    statusHistory: statusHistory
  };
}

function generateMockDriver(nearLocation) {
  // Slightly offset from the given location
  const lat = nearLocation.lat + (Math.random() * 0.01 - 0.005);
  const lng = nearLocation.lng + (Math.random() * 0.01 - 0.005);
  
  const names = [
    'John Smith', 
    'Maria Garcia', 
    'David Lee', 
    'Sarah Johnson', 
    'Michael Brown', 
    'Emma Wilson'
  ];
  
  return {
    id: Math.floor(1000 + Math.random() * 9000),
    name: names[Math.floor(Math.random() * names.length)],
    phone: '+1 (555) ' + Math.floor(100 + Math.random() * 900) + '-' + 
           Math.floor(1000 + Math.random() * 9000),
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
    totalRatings: Math.floor(10 + Math.random() * 490),
    location: { lat, lng },
    avatarUrl: null
  };
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