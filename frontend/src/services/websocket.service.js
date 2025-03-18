import store from '../store'

class WebSocketService {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectTimeout = 5000
  }

  connect() {
    const token = localStorage.getItem('token')
    if (!token) return

    this.ws = new WebSocket(`${process.env.VUE_APP_WS_URL}?token=${token}`)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      this.handleWebSocketMessage(data)
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.attemptReconnect()
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }

  handleWebSocketMessage(data) {
    switch (data.type) {
      case 'RESTAURANT_APPLICATION':
        store.commit('admin/ADD_NOTIFICATION', {
          id: Date.now(),
          title: 'New Restaurant Application',
          message: `${data.restaurantName} has applied for registration`,
          color: 'warning',
          icon: 'mdi-store',
          read: false,
          createdAt: new Date()
        })
        store.dispatch('admin/fetchDashboardData')
        break

      case 'NEW_USER':
        store.commit('admin/ADD_NOTIFICATION', {
          id: Date.now(),
          title: 'New User Registration',
          message: `${data.userName} has joined the platform`,
          color: 'info',
          icon: 'mdi-account',
          read: false,
          createdAt: new Date()
        })
        break

      case 'ORDER_ISSUE':
        store.commit('admin/ADD_NOTIFICATION', {
          id: Date.now(),
          title: 'Order Issue Reported',
          message: `Issue reported for order #${data.orderId}`,
          color: 'error',
          icon: 'mdi-alert',
          read: false,
          createdAt: new Date()
        })
        break

      case 'SYSTEM_ALERT':
        store.commit('admin/ADD_NOTIFICATION', {
          id: Date.now(),
          title: 'System Alert',
          message: data.message,
          color: 'error',
          icon: 'mdi-alert-circle',
          read: false,
          createdAt: new Date()
        })
        break
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    setTimeout(() => {
      this.reconnectAttempts++
      this.connect()
    }, this.reconnectTimeout)
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  sendMessage(type, data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }))
    }
  }
}

export default new WebSocketService()