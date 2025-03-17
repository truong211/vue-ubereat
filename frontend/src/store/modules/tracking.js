/**
 * Vuex module for tracking orders in real-time
 */
const state = {
  // Map of order IDs to tracking data
  trackingData: {},
  
  // Current active tracking order ID
  currentOrderId: null,
  
  // Map of driver IDs to current locations
  driverLocations: {},
  
  // Map of order IDs to status updates
  orderStatuses: {},
  
  // Map of order IDs to ETAs
  orderEtas: {},
  
  // Map of order IDs to delivery routes
  deliveryRoutes: {},
  
  // Socket connection status
  socketConnected: false,
  
  // Tracking error message
  error: null,
  
  // Loading state
  loading: false
}

const mutations = {
  SET_CURRENT_ORDER_ID(state, orderId) {
    state.currentOrderId = orderId;
  },
  
  SET_ORDER_TRACKING(state, { orderId, data }) {
    state.trackingData = {
      ...state.trackingData,
      [orderId]: {
        ...state.trackingData[orderId],
        ...data,
        lastUpdated: new Date().toISOString()
      }
    };
  },
  
  UPDATE_DRIVER_LOCATION(state, { driverId, orderId, location }) {
    // Update driver location
    state.driverLocations = {
      ...state.driverLocations,
      [driverId]: {
        ...location,
        timestamp: new Date().toISOString()
      }
    };
    
    // Update tracking data for the order if exists
    if (orderId && state.trackingData[orderId]) {
      state.trackingData = {
        ...state.trackingData,
        [orderId]: {
          ...state.trackingData[orderId],
          driverLocation: location,
          lastUpdated: new Date().toISOString()
        }
      };
    }
  },
  
  UPDATE_ORDER_STATUS(state, { orderId, status, timestamp }) {
    // Update order status
    state.orderStatuses = {
      ...state.orderStatuses,
      [orderId]: {
        status,
        timestamp: timestamp || new Date().toISOString()
      }
    };
    
    // Update tracking data for the order if exists
    if (state.trackingData[orderId]) {
      state.trackingData = {
        ...state.trackingData,
        [orderId]: {
          ...state.trackingData[orderId],
          status,
          statusTimestamp: timestamp || new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };
    }
  },
  
  UPDATE_ORDER_ETA(state, { orderId, eta, timestamp }) {
    // Update order ETA
    state.orderEtas = {
      ...state.orderEtas,
      [orderId]: {
        eta,
        timestamp: timestamp || new Date().toISOString()
      }
    };
    
    // Update tracking data for the order if exists
    if (state.trackingData[orderId]) {
      state.trackingData = {
        ...state.trackingData,
        [orderId]: {
          ...state.trackingData[orderId],
          eta,
          etaTimestamp: timestamp || new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };
    }
  },
  
  SET_DELIVERY_ROUTE(state, { orderId, route }) {
    state.deliveryRoutes = {
      ...state.deliveryRoutes,
      [orderId]: route
    };
    
    // Update tracking data for the order if exists
    if (state.trackingData[orderId]) {
      state.trackingData = {
        ...state.trackingData,
        [orderId]: {
          ...state.trackingData[orderId],
          route,
          lastUpdated: new Date().toISOString()
        }
      };
    }
  },
  
  SET_SOCKET_CONNECTED(state, connected) {
    state.socketConnected = connected;
  },
  
  SET_ERROR(state, error) {
    state.error = error;
  },
  
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  
  CLEAR_ORDER_TRACKING(state, orderId) {
    const { [orderId]: _, ...remainingTrackingData } = state.trackingData;
    state.trackingData = remainingTrackingData;
    
    // If current order ID is being cleared, reset it
    if (state.currentOrderId === orderId) {
      state.currentOrderId = null;
    }
  },
  
  RESET_TRACKING(state) {
    state.trackingData = {};
    state.currentOrderId = null;
    state.driverLocations = {};
    state.orderStatuses = {};
    state.orderEtas = {};
    state.deliveryRoutes = {};
    state.error = null;
  }
}

const actions = {
  /**
   * Start tracking an order
   * @param {Object} context - Vuex action context
   * @param {String} orderId - Order ID to track
   */
  async startTracking({ commit, dispatch }, orderId) {
    try {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      commit('SET_CURRENT_ORDER_ID', orderId);
      
      // Import dynamically to prevent circular dependencies
      const { trackingService } = await import('@/services/tracking.service');
      
      // Register callbacks
      trackingService.registerCallbacks({
        onConnect: () => commit('SET_SOCKET_CONNECTED', true),
        onDisconnect: () => commit('SET_SOCKET_CONNECTED', false),
        onReconnectFailed: () => commit('SET_ERROR', 'Failed to reconnect to tracking server')
      });
      
      // Start tracking
      const trackingData = await trackingService.startTracking(orderId);
      
      // Store tracking data
      commit('SET_ORDER_TRACKING', { orderId, data: trackingData });
      
      // Fetch delivery route
      dispatch('fetchDeliveryRoute', orderId);
      
      return trackingData;
    } catch (error) {
      console.error('Error starting order tracking:', error);
      commit('SET_ERROR', error.message || 'Failed to start tracking');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  /**
   * Stop tracking an order
   * @param {Object} context - Vuex action context
   * @param {String} orderId - Order ID to stop tracking
   */
  async stopTracking({ commit }, orderId) {
    try {
      // Import dynamically to prevent circular dependencies
      const { trackingService } = await import('@/services/tracking.service');
      
      // Stop tracking
      trackingService.stopTracking(orderId);
      
      // Clear tracking data
      commit('CLEAR_ORDER_TRACKING', orderId);
    } catch (error) {
      console.error('Error stopping order tracking:', error);
    }
  },
  
  /**
   * Fetch order tracking data
   * @param {Object} context - Vuex action context
   * @param {String} orderId - Order ID to fetch tracking data for
   */
  async fetchTrackingData({ commit }, orderId) {
    try {
      commit('SET_LOADING', true);
      
      // Import dynamically to prevent circular dependencies
      const { trackingService } = await import('@/services/tracking.service');
      
      // Get tracking data
      const trackingData = await trackingService.getOrderTrackingData(orderId);
      
      // Store tracking data
      commit('SET_ORDER_TRACKING', { orderId, data: trackingData });
      
      return trackingData;
    } catch (error) {
      console.error('Error fetching order tracking data:', error);
      commit('SET_ERROR', error.message || 'Failed to fetch tracking data');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  /**
   * Fetch delivery route
   * @param {Object} context - Vuex action context
   * @param {String} orderId - Order ID to fetch route for
   */
  async fetchDeliveryRoute({ commit, state }, orderId) {
    try {
      // Only fetch if we have tracking data for this order
      if (!state.trackingData[orderId]) {
        return;
      }
      
      const trackingData = state.trackingData[orderId];
      
      // Only fetch if we have driver and delivery location
      if (!trackingData.driverLocation || !trackingData.deliveryLocation) {
        return;
      }
      
      // Import dynamically to prevent circular dependencies
      const { mapService } = await import('@/services/map.service');
      
      // Get route between driver and delivery location
      const route = await mapService.getRoute(
        trackingData.driverLocation,
        trackingData.deliveryLocation
      );
      
      // Store route
      commit('SET_DELIVERY_ROUTE', { orderId, route });
      
      return route;
    } catch (error) {
      console.error('Error fetching delivery route:', error);
      return null;
    }
  },
  
  /**
   * Reset tracking state
   * @param {Object} context - Vuex action context
   */
  resetTracking({ commit }) {
    commit('RESET_TRACKING');
  }
}

const getters = {
  /**
   * Get current tracking data
   */
  currentTrackingData: state => {
    if (!state.currentOrderId) return null;
    return state.trackingData[state.currentOrderId] || null;
  },
  
  /**
   * Get current driver location
   */
  currentDriverLocation: (state, getters) => {
    const trackingData = getters.currentTrackingData;
    if (!trackingData || !trackingData.driverId) return null;
    
    return state.driverLocations[trackingData.driverId] || trackingData.driverLocation || null;
  },
  
  /**
   * Get current order status
   */
  currentOrderStatus: (state, getters) => {
    const trackingData = getters.currentTrackingData;
    if (!trackingData) return null;
    
    const orderId = state.currentOrderId;
    const orderStatus = state.orderStatuses[orderId];
    
    return orderStatus ? orderStatus.status : trackingData.status;
  },
  
  /**
   * Get current order ETA
   */
  currentOrderEta: (state, getters) => {
    const trackingData = getters.currentTrackingData;
    if (!trackingData) return null;
    
    const orderId = state.currentOrderId;
    const orderEta = state.orderEtas[orderId];
    
    return orderEta ? orderEta.eta : trackingData.eta;
  },
  
  /**
   * Get current delivery route
   */
  currentDeliveryRoute: state => {
    if (!state.currentOrderId) return null;
    return state.deliveryRoutes[state.currentOrderId] || null;
  },
  
  /**
   * Get tracking data for a specific order
   */
  getTrackingData: state => orderId => {
    return state.trackingData[orderId] || null;
  },
  
  /**
   * Check if socket is connected
   */
  isSocketConnected: state => state.socketConnected,
  
  /**
   * Get tracking error
   */
  trackingError: state => state.error,
  
  /**
   * Check if tracking is loading
   */
  isLoading: state => state.loading
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}