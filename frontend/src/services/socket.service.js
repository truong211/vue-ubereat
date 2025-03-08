import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
  }

  // Initialize socket connection
  init() {
    if (this.socket) return

    this.socket = io(process.env.VUE_APP_SOCKET_URL, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts
    })

    this.setupEventListeners()
  }

  // Setup socket event listeners
  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected')
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
        this.socket.disconnect()
      }
    })

    // Handle authentication errors
    this.socket.on('auth_error', (error) => {
      console.error('Socket authentication error:', error)
      this.disconnect()
    })
  }

  // Connect with authentication token
  connect(token) {
    if (!this.socket) {
      this.init()
    }

    this.socket.auth = { token }
    this.socket.connect()
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
    }
  }

  // Join order tracking room
  joinOrder(orderId) {
    if (this.isConnected) {
      this.socket.emit('join_order', orderId)
    }
  }

  // Leave order tracking room
  leaveOrder(orderId) {
    if (this.isConnected) {
      this.socket.emit('leave_order', orderId)
    }
  }

  // Subscribe to driver location updates
  onDriverLocation(callback) {
    this.socket.on('driver_location', callback)
  }

  // Subscribe to order status updates
  onOrderStatus(callback) {
    this.socket.on('order_status', callback)
  }

  // Subscribe to new messages
  onNewMessage(callback) {
    this.socket.on('new_message', callback)
  }

  // Subscribe to ETA updates
  onETAUpdate(callback) {
    this.socket.on('eta_update', callback)
  }

  // Send message to driver
  sendMessage(message) {
    if (this.isConnected) {
      this.socket.emit('send_message', message)
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket
  }

  // Check connection status
  isSocketConnected() {
    return this.isConnected
  }

  // Remove event listeners
  removeListener(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback)
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.setupEventListeners() // Maintain core event listeners
    }
  }
}

// Create and export socket service instance
const socketService = new SocketService()
export default socketService

// Export socket instance for direct use
export const socket = socketService.getSocket()

// Helper function to ensure socket is initialized
export const ensureSocketConnected = async (token) => {
  if (!socketService.isSocketConnected()) {
    socketService.connect(token)
    
    // Wait for connection
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Socket connection timeout'))
      }, 5000)

      socketService.getSocket().once('connect', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
  }
  return socketService.getSocket()
}