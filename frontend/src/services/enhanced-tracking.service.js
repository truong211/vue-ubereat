import { io } from 'socket.io-client';
import axios from 'axios';
import mapService from './map.service';
import { store } from '@/store';
import { API_URL } from '@/config';

class EnhancedTrackingService {
  constructor() {
    this.socket = null;
    this.apiUrl = API_URL;
    this.connected = false;
    this.trackingOrders = new Map();
    this.driverPositions = new Map();
    this.etaCalculationInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.callbacks = {};
    this.watchPositions = new Map();
    this.routeUpdateInterval = 30000; // 30 seconds
  }

  /**
   * Khởi tạo service tracking
   */
  async initialize() {
    try {
      if (!this.socket) {
        this.socket = io(this.apiUrl, {
          path: '/socket.io',
          transports: ['websocket', 'polling'],
          autoConnect: false,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 3000
        });

        this.setupSocketListeners();
      }

      await this.connect();
      return true;
    } catch (error) {
      console.error('Error initializing tracking service:', error);
      throw error;
    }
  }

  /**
   * Thiết lập socket listeners
   */
  setupSocketListeners() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Enhanced tracking connected');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Rejoin all active tracking sessions
      this.trackingOrders.forEach((order, orderId) => {
        this.socket.emit('track_order', { orderId });
      });

      this.triggerCallback('onConnect');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Enhanced tracking disconnected:', reason);
      this.connected = false;
      this.triggerCallback('onDisconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Tracking connection error:', error);
      this.handleReconnect();
    });

    // Real-time tracking events
    this.socket.on('driver_location_update', (data) => {
      this.handleDriverLocationUpdate(data);
    });

    this.socket.on('order_status_changed', (data) => {
      this.handleOrderStatusChange(data);
    });

    this.socket.on('eta_updated', (data) => {
      this.handleEtaUpdate(data);
    });

    this.socket.on('delivery_milestone', (data) => {
      this.handleDeliveryMilestone(data);
    });

    this.socket.on('driver_arrived', (data) => {
      this.handleDriverArrival(data);
    });

    this.socket.on('traffic_update', (data) => {
      this.handleTrafficUpdate(data);
    });
  }

  /**
   * Kết nối socket
   */
  async connect() {
    return new Promise((resolve, reject) => {
      if (this.connected) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.socket.once('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.once('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.socket.connect();
    });
  }

  /**
   * Ngắt kết nối
   */
  disconnect() {
    if (this.socket && this.connected) {
      this.socket.disconnect();
      this.connected = false;
    }
    
    this.clearAllIntervals();
    this.trackingOrders.clear();
    this.driverPositions.clear();
  }

  /**
   * Bắt đầu theo dõi đơn hàng
   * @param {String} orderId - ID đơn hàng
   * @param {Object} options - Tùy chọn tracking
   */
  async startOrderTracking(orderId, options = {}) {
    try {
      if (!this.connected) {
        await this.initialize();
      }

      // Lấy thông tin đơn hàng
      const orderData = await this.getOrderTrackingData(orderId);
      
      // Lưu thông tin tracking
      this.trackingOrders.set(orderId, {
        ...orderData,
        startTime: Date.now(),
        options
      });

      // Join tracking room
      this.socket.emit('track_order', { 
        orderId,
        userId: options.userId,
        userType: options.userType || 'customer'
      });

      // Bắt đầu tính toán ETA real-time
      if (orderData.driverId && orderData.status !== 'delivered') {
        this.startEtaCalculation(orderId);
      }

      // Update store
      store.commit('tracking/SET_ORDER_TRACKING', {
        orderId,
        data: orderData
      });

      this.triggerCallback('onTrackingStarted', { orderId, data: orderData });
      
      return orderData;
    } catch (error) {
      console.error('Error starting order tracking:', error);
      throw error;
    }
  }

  /**
   * Dừng theo dõi đơn hàng
   * @param {String} orderId - ID đơn hàng
   */
  stopOrderTracking(orderId) {
    if (!this.trackingOrders.has(orderId)) return;

    // Leave tracking room
    if (this.socket && this.connected) {
      this.socket.emit('untrack_order', { orderId });
    }

    // Remove from local storage
    this.trackingOrders.delete(orderId);
    this.driverPositions.delete(orderId);

    // Clear intervals
    this.clearOrderIntervals(orderId);

    // Update store
    store.commit('tracking/REMOVE_ORDER_TRACKING', orderId);

    this.triggerCallback('onTrackingStopped', { orderId });
  }

  /**
   * Lấy dữ liệu tracking của đơn hàng
   * @param {String} orderId - ID đơn hàng
   */
  async getOrderTrackingData(orderId) {
    try {
      const response = await axios.get(`${this.apiUrl}/api/orders/${orderId}/tracking`);
      return response.data;
    } catch (error) {
      console.error('Error getting order tracking data:', error);
      throw error;
    }
  }

  /**
   * Bắt đầu tính toán ETA real-time
   * @param {String} orderId - ID đơn hàng
   */
  startEtaCalculation(orderId) {
    const intervalId = setInterval(async () => {
      try {
        await this.updateOrderEta(orderId);
      } catch (error) {
        console.error('Error updating ETA:', error);
      }
    }, this.routeUpdateInterval);

    // Store interval ID for cleanup
    if (!this.watchPositions.has(orderId)) {
      this.watchPositions.set(orderId, new Set());
    }
    this.watchPositions.get(orderId).add(intervalId);
  }

  /**
   * Cập nhật ETA của đơn hàng
   * @param {String} orderId - ID đơn hàng
   */
  async updateOrderEta(orderId) {
    const orderData = this.trackingOrders.get(orderId);
    if (!orderData || !orderData.driverId) return;

    try {
      // Lấy vị trí hiện tại của driver
      const driverPosition = this.driverPositions.get(orderData.driverId);
      if (!driverPosition) return;

      let destination;
      if (orderData.status === 'preparing' || orderData.status === 'ready_for_pickup') {
        // Driver đang đến nhà hàng
        destination = {
          lat: orderData.restaurant.latitude,
          lng: orderData.restaurant.longitude
        };
      } else {
        // Driver đang giao hàng
        destination = {
          lat: orderData.deliveryAddress.latitude,
          lng: orderData.deliveryAddress.longitude
        };
      }

      // Tính toán route mới
      const route = await mapService.getRoute(driverPosition, destination, {
        mode: 'driving'
      });

      // Tính ETA với traffic conditions
      const currentTime = new Date();
      const estimatedDuration = route.duration; // seconds
      const eta = new Date(currentTime.getTime() + estimatedDuration * 1000);

      // Cập nhật store
      store.commit('tracking/UPDATE_ORDER_ETA', {
        orderId,
        eta: eta.toISOString(),
        route,
        lastUpdated: currentTime.toISOString()
      });

      this.triggerCallback('onEtaUpdated', {
        orderId,
        eta,
        route,
        driverPosition
      });

    } catch (error) {
      console.error('Error calculating ETA:', error);
    }
  }

  /**
   * Xử lý cập nhật vị trí driver
   * @param {Object} data - Dữ liệu vị trí
   */
  async handleDriverLocationUpdate(data) {
    const { driverId, location, orderId, heading, speed } = data;

    // Cập nhật vị trí driver
    this.driverPositions.set(driverId, {
      ...location,
      heading,
      speed,
      timestamp: Date.now()
    });

    // Cập nhật store
    store.commit('tracking/UPDATE_DRIVER_LOCATION', {
      driverId,
      orderId,
      location: {
        ...location,
        heading,
        speed
      }
    });

    // Trigger callback for real-time updates
    this.triggerCallback('onDriverLocationUpdate', {
      driverId,
      orderId,
      location,
      heading,
      speed
    });

    // Tự động cập nhật ETA nếu có thay đổi đáng kể
    if (orderId && this.shouldUpdateEta(driverId, location)) {
      await this.updateOrderEta(orderId);
    }
  }

  /**
   * Xử lý thay đổi trạng thái đơn hàng
   * @param {Object} data - Dữ liệu trạng thái
   */
  handleOrderStatusChange(data) {
    const { orderId, status, timestamp, metadata } = data;

    // Cập nhật store
    store.commit('tracking/UPDATE_ORDER_STATUS', {
      orderId,
      status,
      timestamp,
      metadata
    });

    // Cập nhật local tracking data
    if (this.trackingOrders.has(orderId)) {
      const orderData = this.trackingOrders.get(orderId);
      orderData.status = status;
      orderData.lastStatusUpdate = timestamp;
    }

    // Xử lý theo trạng thái cụ thể
    switch (status) {
      case 'preparing':
        this.handlePreparingStatus(orderId, metadata);
        break;
      case 'ready_for_pickup':
        this.handleReadyForPickupStatus(orderId, metadata);
        break;
      case 'picked_up':
        this.handlePickedUpStatus(orderId, metadata);
        break;
      case 'on_the_way':
        this.handleOnTheWayStatus(orderId, metadata);
        break;
      case 'arriving':
        this.handleArrivingStatus(orderId, metadata);
        break;
      case 'delivered':
        this.handleDeliveredStatus(orderId, metadata);
        break;
    }

    this.triggerCallback('onOrderStatusChange', {
      orderId,
      status,
      timestamp,
      metadata
    });
  }

  /**
   * Xử lý cập nhật ETA
   * @param {Object} data - Dữ liệu ETA
   */
  handleEtaUpdate(data) {
    const { orderId, eta, factors } = data;

    store.commit('tracking/UPDATE_ORDER_ETA', {
      orderId,
      eta,
      factors,
      lastUpdated: Date.now()
    });

    this.triggerCallback('onEtaUpdate', data);
  }

  /**
   * Xử lý milestone giao hàng
   * @param {Object} data - Dữ liệu milestone
   */
  handleDeliveryMilestone(data) {
    const { orderId, milestone, location, timestamp } = data;

    store.commit('tracking/ADD_DELIVERY_MILESTONE', {
      orderId,
      milestone: {
        type: milestone,
        location,
        timestamp
      }
    });

    this.triggerCallback('onDeliveryMilestone', data);
  }

  /**
   * Xử lý driver đã đến
   * @param {Object} data - Dữ liệu arrival
   */
  handleDriverArrival(data) {
    const { orderId, location, arrivalType } = data; // 'restaurant' hoặc 'customer'

    this.triggerCallback('onDriverArrived', {
      orderId,
      location,
      arrivalType
    });
  }

  /**
   * Xử lý cập nhật traffic
   * @param {Object} data - Dữ liệu traffic
   */
  handleTrafficUpdate(data) {
    const { orderId, trafficConditions, delayMinutes } = data;

    if (delayMinutes > 5) {
      // Thông báo delay đáng kể
      this.triggerCallback('onSignificantDelay', {
        orderId,
        delayMinutes,
        trafficConditions
      });
    }

    this.triggerCallback('onTrafficUpdate', data);
  }

  /**
   * Kiểm tra có nên cập nhật ETA không
   * @param {String} driverId - ID driver
   * @param {Object} newLocation - Vị trí mới
   */
  shouldUpdateEta(driverId, newLocation) {
    const lastPosition = this.driverPositions.get(driverId);
    if (!lastPosition) return true;

    // Tính khoảng cách di chuyển
    const distance = this.calculateDistance(lastPosition, newLocation);
    
    // Cập nhật nếu di chuyển > 100m hoặc đã 30s kể từ lần cập nhật cuối
    return distance > 0.1 || (Date.now() - lastPosition.timestamp) > 30000;
  }

  /**
   * Tính khoảng cách giữa 2 điểm
   * @param {Object} point1 - Điểm 1
   * @param {Object} point2 - Điểm 2
   */
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLon = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(point1.lat)) * 
              Math.cos(this.toRadians(point2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI/180);
  }

  /**
   * Các handlers cho từng trạng thái
   */
  handlePreparingStatus(orderId, metadata) {
    // Bắt đầu countdown thời gian chuẩn bị
    const preparationTime = metadata?.estimatedPrepTime || 20;
    this.triggerCallback('onPreparationStarted', {
      orderId,
      estimatedPrepTime: preparationTime
    });
  }

  handleReadyForPickupStatus(orderId, metadata) {
    this.triggerCallback('onReadyForPickup', { orderId, metadata });
  }

  handlePickedUpStatus(orderId, metadata) {
    // Bắt đầu tracking route đến customer
    this.triggerCallback('onPickedUp', { orderId, metadata });
  }

  handleOnTheWayStatus(orderId, metadata) {
    this.triggerCallback('onOnTheWay', { orderId, metadata });
  }

  handleArrivingStatus(orderId, metadata) {
    // Driver sắp đến (trong vòng 2-3 phút)
    this.triggerCallback('onArriving', { orderId, metadata });
  }

  handleDeliveredStatus(orderId, metadata) {
    // Hoàn thành giao hàng
    this.stopOrderTracking(orderId);
    this.triggerCallback('onDelivered', { orderId, metadata });
  }

  /**
   * Xử lý reconnect
   */
  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (!this.connected) {
          this.socket.connect();
        }
      }, Math.pow(2, this.reconnectAttempts) * 1000); // Exponential backoff
    } else {
      console.error('Max reconnection attempts reached');
      this.triggerCallback('onReconnectFailed');
    }
  }

  /**
   * Đăng ký callbacks
   * @param {Object} callbacks - Object chứa các callback functions
   */
  registerCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Trigger callback
   * @param {String} event - Tên event
   * @param {*} data - Dữ liệu
   */
  triggerCallback(event, data = null) {
    if (this.callbacks[event] && typeof this.callbacks[event] === 'function') {
      try {
        this.callbacks[event](data);
      } catch (error) {
        console.error(`Error in callback ${event}:`, error);
      }
    }
  }

  /**
   * Dọn dẹp intervals
   */
  clearAllIntervals() {
    this.watchPositions.forEach((intervals, orderId) => {
      intervals.forEach(intervalId => clearInterval(intervalId));
    });
    this.watchPositions.clear();
  }

  clearOrderIntervals(orderId) {
    if (this.watchPositions.has(orderId)) {
      const intervals = this.watchPositions.get(orderId);
      intervals.forEach(intervalId => clearInterval(intervalId));
      this.watchPositions.delete(orderId);
    }
  }

  /**
   * Lấy thông tin tracking của tất cả đơn hàng đang theo dõi
   */
  getAllTrackingData() {
    return Array.from(this.trackingOrders.entries()).map(([orderId, data]) => ({
      orderId,
      ...data,
      driverPosition: this.driverPositions.get(data.driverId)
    }));
  }

  /**
   * Lấy vị trí hiện tại của driver
   * @param {String} driverId - ID driver
   */
  getDriverPosition(driverId) {
    return this.driverPositions.get(driverId);
  }

  /**
   * Kiểm tra trạng thái kết nối
   */
  isConnected() {
    return this.connected;
  }
}

export const enhancedTrackingService = new EnhancedTrackingService();
export default enhancedTrackingService;