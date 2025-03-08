import socketService from './socket.service'
import { useNotification } from '@kyvg/vue3-notification'

class NotificationService {
  constructor() {
    this.notification = useNotification()
    this.statusMessages = {
      pending: 'Đơn hàng đang chờ xác nhận',
      accepted: 'Nhà hàng đã xác nhận đơn hàng',
      preparing: 'Nhà hàng đang chuẩn bị món ăn',
      picked_up: 'Tài xế đã lấy đơn hàng',
      on_the_way: 'Tài xế đang trên đường giao hàng',
      delivered: 'Đơn hàng đã được giao thành công',
      cancelled: 'Đơn hàng đã bị hủy'
    }
  }

  init() {
    // Listen for order status changes
    socketService.onOrderStatus(this.handleStatusUpdate.bind(this))
    
    // Listen for ETA updates
    socketService.onETAUpdate(this.handleETAUpdate.bind(this))
    
    // Listen for new driver messages
    socketService.onNewMessage(this.handleNewMessage.bind(this))
  }

  handleStatusUpdate(data) {
    const { status, orderId } = data
    if (this.statusMessages[status]) {
      this.showNotification({
        title: 'Cập nhật trạng thái đơn hàng',
        text: this.statusMessages[status],
        type: this.getNotificationType(status),
        duration: 5000,
        data: { orderId, type: 'status_update' }
      })
    }
  }

  handleETAUpdate(data) {
    const { eta, orderId } = data
    const etaTime = new Date(eta).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    this.showNotification({
      title: 'Cập nhật thời gian giao hàng',
      text: `Thời gian giao hàng dự kiến: ${etaTime}`,
      type: 'info',
      duration: 5000,
      data: { orderId, type: 'eta_update' }
    })
  }

  handleNewMessage(message) {
    if (message.from === 'driver') {
      this.showNotification({
        title: 'Tin nhắn mới từ tài xế',
        text: message.text,
        type: 'info',
        duration: 5000,
        data: { orderId: message.orderId, type: 'new_message' }
      })
    }
  }

  getNotificationType(status) {
    switch (status) {
      case 'delivered':
        return 'success'
      case 'cancelled':
        return 'error'
      case 'accepted':
      case 'picked_up':
        return 'success'
      default:
        return 'info'
    }
  }

  showNotification(options) {
    this.notification.notify({
      ...options,
      group: 'order-updates'
    })
  }
}

const notificationService = new NotificationService()
export default notificationService
