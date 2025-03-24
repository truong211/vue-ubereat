<template>
  <v-container>
    <h1 class="text-h4 mb-4">Quản Lý Đơn Hàng</h1>

    <!-- Restaurant Status Panel -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4">
            <div class="d-flex align-center">
              <v-avatar color="primary" class="mr-3">
                <v-icon>{{ restaurantStatus.isOpen ? 'mdi-door-open' : 'mdi-door-closed' }}</v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-1">Trạng thái nhà hàng</div>
                <v-chip
                  :color="getStatusColor(restaurantStatus.status)"
                  class="mt-1"
                >
                  {{ formatRestaurantStatus(restaurantStatus.status) }}
                </v-chip>
              </div>
            </div>
          </v-col>
          
          <v-col cols="12" sm="4">
            <v-select
              v-model="restaurantStatus.status"
              :items="restaurantStatusOptions"
              item-title="title"
              item-value="value"
              label="Thay đổi trạng thái"
              @update:model-value="updateRestaurantStatus"
              density="comfortable"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="4">
            <v-text-field
              v-model.number="restaurantStatus.estimatedPrepTime"
              type="number"
              label="Thời gian chuẩn bị (phút)"
              density="comfortable"
              @update:model-value="updatePrepTime"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Order Status Tabs -->
    <v-card class="mb-6">
      <v-tabs v-model="activeTab" grow>
        <v-tab value="new" class="text-body-1">
          Đơn Mới
          <v-badge
            :content="newOrdersCount.toString()"
            :model-value="newOrdersCount > 0"
            color="error"
            class="ml-2"
          ></v-badge>
        </v-tab>
        <v-tab value="preparing" class="text-body-1">Đang Chuẩn Bị</v-tab>
        <v-tab value="ready" class="text-body-1">Sẵn Sàng</v-tab>
        <v-tab value="completed" class="text-body-1">Hoàn Thành</v-tab>
      </v-tabs>

      <!-- Orders List -->
      <v-window v-model="activeTab">
        <v-window-item v-for="status in ['new', 'preparing', 'ready', 'completed']" :key="status">
          <v-list>
            <template v-if="getOrdersByStatus(status).length">
              <v-list-item
                v-for="order in getOrdersByStatus(status)"
                :key="order.id"
                class="mb-2"
              >
                <template v-slot:prepend>
                  <v-avatar color="grey-lighten-3" size="48">
                    <v-icon size="24">mdi-receipt</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="text-h6 mb-1">
                  Đơn #{{ order.orderNumber }}
                  <v-chip
                    :color="getStatusColor(order.status)"
                    size="small"
                    class="ml-2"
                  >
                    {{ formatStatus(order.status) }}
                  </v-chip>
                </v-list-item-title>

                <v-list-item-subtitle>
                  <div class="text-body-2">
                    {{ formatDateTime(order.createdAt) }} • {{ order.items.length }} món • 
                    {{ formatPrice(order.total) }}
                  </div>
                  <div class="text-caption text-grey">
                    Khách hàng: {{ order.customer.name }} • 
                    SĐT: {{ order.customer.phone }}
                  </div>
                  <div v-if="order.prepTime" class="text-caption">
                    <v-icon size="small" color="info">mdi-clock-outline</v-icon>
                    Thời gian chuẩn bị: {{ order.prepTime }} phút
                  </div>
                </v-list-item-subtitle>

                <template v-slot:append>
                  <div class="d-flex align-center">
                    <!-- Action buttons based on status -->
                    <template v-if="order.status === 'pending'">
                      <v-btn
                        color="success"
                        variant="text"
                        class="mr-2"
                        @click="acceptOrder(order)"
                      >
                        <v-icon>mdi-check</v-icon>
                        Xác Nhận
                      </v-btn>
                      <v-btn
                        color="error"
                        variant="text"
                        @click="rejectOrder(order)"
                      >
                        <v-icon>mdi-close</v-icon>
                        Từ Chối
                      </v-btn>
                    </template>

                    <template v-if="order.status === 'preparing'">
                      <v-btn
                        color="success"
                        variant="text"
                        @click="markAsReady(order)"
                      >
                        <v-icon>mdi-food</v-icon>
                        Đã Chuẩn Bị Xong
                      </v-btn>
                    </template>
                    
                    <template v-if="order.status === 'ready' || order.status === 'completed'">
                      <v-btn
                        color="primary"
                        variant="text"
                        class="mr-2"
                        @click="printInvoice(order)"
                      >
                        <v-icon>mdi-printer</v-icon>
                        In Hóa Đơn
                      </v-btn>
                    </template>

                    <v-btn
                      icon="mdi-eye"
                      variant="text"
                      class="ml-2"
                      @click="viewOrderDetails(order)"
                    ></v-btn>
                  </div>
                </template>
              </v-list-item>
            </template>

            <v-list-item v-else>
              <v-list-item-title class="text-center py-8 text-grey">
                Không có đơn hàng nào
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Order Details Dialog -->
    <v-dialog v-model="orderDialog.show" max-width="700">
      <v-card v-if="orderDialog.order">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Chi Tiết Đơn Hàng #{{ orderDialog.order.orderNumber }}</span>
          <v-chip :color="getStatusColor(orderDialog.order.status)">
            {{ formatStatus(orderDialog.order.status) }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <v-row>
            <!-- Customer Info -->
            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 mb-2">Thông Tin Khách Hàng</h3>
              <div>{{ orderDialog.order.customer.name }}</div>
              <div>{{ orderDialog.order.customer.phone }}</div>
              <div class="text-caption">{{ orderDialog.order.customer.email }}</div>
            </v-col>

            <!-- Delivery Info -->
            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 mb-2">Thông Tin Giao Hàng</h3>
              <div>{{ orderDialog.order.deliveryAddress }}</div>
              <div class="text-caption" v-if="orderDialog.order.deliveryNotes">
                Ghi chú: {{ orderDialog.order.deliveryNotes }}
              </div>
            </v-col>
            
            <!-- Preparation Time -->
            <v-col cols="12">
              <h3 class="text-subtitle-1 mb-2">Thời Gian Chuẩn Bị</h3>
              <v-row align="center">
                <v-col cols="6">
                  <v-text-field
                    v-model.number="orderPrepTime"
                    label="Thời gian chuẩn bị (phút)"
                    type="number"
                    :disabled="orderDialog.order.status !== 'pending' && orderDialog.order.status !== 'preparing'"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-btn
                    color="primary"
                    :disabled="orderDialog.order.status !== 'pending' && orderDialog.order.status !== 'preparing'"
                    @click="updateOrderPrepTime"
                  >
                    Cập nhật
                  </v-btn>
                </v-col>
              </v-row>
            </v-col>

            <!-- Order Items -->
            <v-col cols="12">
              <h3 class="text-subtitle-1 mb-2">Danh Sách Món</h3>
              <v-list>
                <v-list-item
                  v-for="item in orderDialog.order.items"
                  :key="item.id"
                >
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>{{ item.quantity }}x {{ item.name }}</span>
                    <span>{{ formatPrice(item.price * item.quantity) }}</span>
                  </v-list-item-title>
                  <v-list-item-subtitle class="d-flex justify-space-between">
                    <span v-if="item.notes">Ghi chú: {{ item.notes }}</span>
                    <span v-if="item.prepTime" class="text-caption">
                      <v-icon size="small" color="info">mdi-clock-outline</v-icon>
                      {{ item.prepTime }} phút
                    </span>
                  </v-list-item-subtitle>
                </v-list-item>

                <v-divider class="my-2"></v-divider>

                <!-- Order Summary -->
                <v-list-item>
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>Tạm tính</span>
                    <span>{{ formatPrice(orderDialog.order.subtotal) }}</span>
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="d-flex justify-space-between">
                    <span>Phí giao hàng</span>
                    <span>{{ formatPrice(orderDialog.order.deliveryFee) }}</span>
                  </v-list-item-title>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="d-flex justify-space-between font-weight-bold">
                    <span>Tổng cộng</span>
                    <span>{{ formatPrice(orderDialog.order.total) }}</span>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="orderDialog.show = false"
          >
            Đóng
          </v-btn>
          
          <v-btn
            color="primary"
            variant="text"
            @click="printInvoice(orderDialog.order)"
            :disabled="orderDialog.order.status !== 'ready' && orderDialog.order.status !== 'completed'"
          >
            <v-icon>mdi-printer</v-icon>
            In Hóa Đơn
          </v-btn>
          
          <template v-if="orderDialog.order.status === 'pending'">
            <v-btn
              color="success"
              @click="acceptOrder(orderDialog.order)"
            >
              Xác Nhận Đơn
            </v-btn>
            <v-btn
              color="error"
              @click="rejectOrder(orderDialog.order)"
            >
              Từ Chối Đơn
            </v-btn>
          </template>
          
          <v-btn
            v-if="orderDialog.order.status === 'preparing'"
            color="success"
            @click="markAsReady(orderDialog.order)"
          >
            Đã Chuẩn Bị Xong
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Reject Order Dialog -->
    <v-dialog v-model="rejectDialog.show" max-width="500">
      <v-card>
        <v-card-title>Từ Chối Đơn Hàng</v-card-title>
        <v-card-text>
          <v-select
            v-model="rejectDialog.reason"
            :items="rejectReasons"
            label="Lý do từ chối"
            required
          ></v-select>
          <v-textarea
            v-model="rejectDialog.note"
            label="Ghi chú thêm (không bắt buộc)"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="rejectDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="error"
            :loading="rejectDialog.loading"
            @click="confirmReject"
          >
            Xác Nhận Từ Chối
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Invoice Preview Dialog -->
    <v-dialog v-model="invoiceDialog.show" max-width="800">
      <v-card v-if="invoiceDialog.order">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Hóa Đơn #{{ invoiceDialog.order.orderNumber }}</span>
          <v-btn
            icon="mdi-printer"
            @click="actuallyPrintInvoice"
          ></v-btn>
        </v-card-title>
        
        <v-card-text>
          <div id="invoice-content" class="invoice-preview pa-4">
            <!-- Restaurant Info -->
            <div class="text-center mb-6">
              <h2 class="text-h5">Nhà Hàng XYZ</h2>
              <p>123 Đường ABC, Quận 1, TP HCM</p>
              <p>SĐT: 028-1234-5678</p>
              <p>MST: 0123456789</p>
            </div>
            
            <div class="text-center mb-4">
              <h1 class="text-h5">HÓA ĐƠN BÁN HÀNG</h1>
              <p>Số: {{ invoiceDialog.order.orderNumber }}</p>
              <p>Ngày: {{ formatDate(invoiceDialog.order.createdAt) }}</p>
            </div>
            
            <!-- Customer Info -->
            <div class="mb-4">
              <p><strong>Khách hàng:</strong> {{ invoiceDialog.order.customer.name }}</p>
              <p><strong>Địa chỉ:</strong> {{ invoiceDialog.order.deliveryAddress }}</p>
              <p><strong>SĐT:</strong> {{ invoiceDialog.order.customer.phone }}</p>
            </div>
            
            <!-- Items Table -->
            <table class="invoice-table mb-4">
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Tên món</th>
                  <th>Đơn giá</th>
                  <th>Số lượng</th>
                  <th>Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in invoiceDialog.order.items" :key="item.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ formatPrice(item.price) }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ formatPrice(item.price * item.quantity) }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" class="text-right"><strong>Tạm tính:</strong></td>
                  <td>{{ formatPrice(invoiceDialog.order.subtotal) }}</td>
                </tr>
                <tr>
                  <td colspan="4" class="text-right"><strong>Phí giao hàng:</strong></td>
                  <td>{{ formatPrice(invoiceDialog.order.deliveryFee) }}</td>
                </tr>
                <tr>
                  <td colspan="4" class="text-right"><strong>Tổng cộng:</strong></td>
                  <td>{{ formatPrice(invoiceDialog.order.total) }}</td>
                </tr>
              </tfoot>
            </table>
            
            <!-- Footer -->
            <div class="text-center">
              <p><strong>Cảm ơn quý khách đã sử dụng dịch vụ!</strong></p>
              <p>Vui lòng giữ hóa đơn để đối chiếu khi cần thiết</p>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="invoiceDialog.show = false"
          >
            Đóng
          </v-btn>
          <v-btn
            color="primary"
            @click="actuallyPrintInvoice"
          >
            In Hóa Đơn
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const store = useStore()

// State
const activeTab = ref('new')
const wsConnection = ref(null)
const orderPrepTime = ref(15) // Default preparation time

// Restaurant status
const restaurantStatus = ref({
  isOpen: true,
  status: 'online', // online, busy, offline, temporarily_closed
  estimatedPrepTime: 15 // minutes
})

const restaurantStatusOptions = [
  { title: 'Đang mở cửa', value: 'online' },
  { title: 'Đang bận', value: 'busy' },
  { title: 'Tạm ngưng nhận đơn', value: 'offline' },
  { title: 'Đóng cửa', value: 'temporarily_closed' }
]

// Dialogs
const orderDialog = ref({
  show: false,
  order: null
})

const rejectDialog = ref({
  show: false,
  order: null,
  reason: '',
  note: '',
  loading: false
})

const invoiceDialog = ref({
  show: false,
  order: null
})

// Options
const rejectReasons = [
  { title: 'Hết nguyên liệu', value: 'out_of_stock' },
  { title: 'Quá tải đơn hàng', value: 'too_busy' },
  { title: 'Sắp đóng cửa', value: 'closing_soon' },
  { title: 'Lý do khác', value: 'other' }
]

// Computed
const orders = computed(() => store.state.restaurantAdmin.orders)
const newOrdersCount = computed(() => 
  orders.value.filter(order => order.status === 'pending').length
)

// Methods
const getOrdersByStatus = (status) => {
  const statusMap = {
    new: 'pending',
    preparing: 'preparing',
    ready: 'ready',
    completed: 'completed'
  }
  return orders.value.filter(order => order.status === statusMap[status])
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    preparing: 'info',
    ready: 'success',
    completed: 'grey',
    cancelled: 'error',
    online: 'success',
    busy: 'warning',
    offline: 'grey',
    temporarily_closed: 'error'
  }
  return colors[status] || 'grey'
}

const formatStatus = (status) => {
  const statusMap = {
    pending: 'Chờ xác nhận',
    preparing: 'Đang chuẩn bị',
    ready: 'Sẵn sàng',
    completed: 'Hoàn thành',
    cancelled: 'Đã hủy'
  }
  return statusMap[status] || status
}

const formatRestaurantStatus = (status) => {
  const statusMap = {
    online: 'Đang mở cửa',
    busy: 'Đang bận',
    offline: 'Tạm ngưng nhận đơn',
    temporarily_closed: 'Đóng cửa'
  }
  return statusMap[status] || status
}

const formatDateTime = (dateStr) => {
  return format(new Date(dateStr), 'HH:mm - dd/MM/yyyy', { locale: vi })
}

const formatDate = (dateStr) => {
  return format(new Date(dateStr), 'dd/MM/yyyy', { locale: vi })
}

const formatPrice = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

const viewOrderDetails = (order) => {
  orderPrepTime.value = order.prepTime || 15
  orderDialog.value = {
    show: true,
    order
  }
}

const acceptOrder = async (order) => {
  try {
    await store.dispatch('restaurantAdmin/updateOrderStatus', {
      orderId: order.id,
      status: 'preparing',
      prepTime: orderPrepTime.value
    })
    if (orderDialog.value.show) {
      orderDialog.value.show = false
    }
  } catch (error) {
    console.error('Failed to accept order:', error)
  }
}

const rejectOrder = (order) => {
  rejectDialog.value = {
    show: true,
    order,
    reason: '',
    note: '',
    loading: false
  }
}

const confirmReject = async () => {
  if (!rejectDialog.value.order || !rejectDialog.value.reason) return

  rejectDialog.value.loading = true
  try {
    await store.dispatch('restaurantAdmin/updateOrderStatus', {
      orderId: rejectDialog.value.order.id,
      status: 'cancelled',
      reason: rejectDialog.value.reason,
      note: rejectDialog.value.note
    })
    rejectDialog.value.show = false
    if (orderDialog.value.show) {
      orderDialog.value.show = false
    }
  } catch (error) {
    console.error('Failed to reject order:', error)
  } finally {
    rejectDialog.value.loading = false
  }
}

const markAsReady = async (order) => {
  try {
    await store.dispatch('restaurantAdmin/updateOrderStatus', {
      orderId: order.id,
      status: 'ready'
    })
    if (orderDialog.value.show) {
      orderDialog.value.show = false
    }
  } catch (error) {
    console.error('Failed to mark order as ready:', error)
  }
}

const updateOrderPrepTime = async () => {
  if (!orderDialog.value.order) return
  
  try {
    await store.dispatch('restaurantAdmin/updateOrderPrepTime', {
      orderId: orderDialog.value.order.id,
      prepTime: orderPrepTime.value
    })
    // Update local order data
    orderDialog.value.order.prepTime = orderPrepTime.value
  } catch (error) {
    console.error('Failed to update preparation time:', error)
  }
}

const updateRestaurantStatus = async () => {
  try {
    await store.dispatch('restaurantAdmin/updateRestaurantStatus', {
      status: restaurantStatus.value.status,
      isOpen: restaurantStatus.value.status === 'online' || restaurantStatus.value.status === 'busy'
    })
  } catch (error) {
    console.error('Failed to update restaurant status:', error)
  }
}

const updatePrepTime = async () => {
  try {
    await store.dispatch('restaurantAdmin/updateRestaurantPrepTime', {
      estimatedPrepTime: restaurantStatus.value.estimatedPrepTime
    })
  } catch (error) {
    console.error('Failed to update estimated preparation time:', error)
  }
}

const printInvoice = (order) => {
  invoiceDialog.value = {
    show: true,
    order
  }
}

const actuallyPrintInvoice = () => {
  const invoiceContent = document.getElementById('invoice-content')
  if (!invoiceContent) return
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank')
  const invoiceHtml = `
    <html>
      <head>
        <title>Hóa đơn #${invoiceDialog.value.order.orderNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .invoice-preview { max-width: 800px; margin: 0 auto; }
          .invoice-table { width: 100%; border-collapse: collapse; }
          .invoice-table th, .invoice-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .invoice-table th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .mb-4 { margin-bottom: 20px; }
          .mb-6 { margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="invoice-preview">
          ${invoiceContent.innerHTML}
        </div>
      </body>
    </html>
  `
  
  printWindow.document.open()
  printWindow.document.write(invoiceHtml)
  printWindow.document.close()
  
  // Wait for the content to load then print
  setTimeout(() => {
    printWindow.print()
    // Close window after printing (browser dependent)
    // printWindow.close()
  }, 500)
}

// WebSocket connection for real-time updates
const connectWebSocket = () => {
  wsConnection.value = new WebSocket('ws://api.example.com/restaurant/orders')
  
  wsConnection.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    store.dispatch('restaurantAdmin/handleOrderUpdate', data)
  }
}

// Lifecycle hooks
onMounted(async () => {
  // Load restaurant status
  try {
    const status = await store.dispatch('restaurantAdmin/fetchRestaurantStatus')
    restaurantStatus.value = {
      isOpen: status.isOpen,
      status: status.status,
      estimatedPrepTime: status.estimatedPrepTime || 15
    }
  } catch (error) {
    console.error('Failed to fetch restaurant status:', error)
  }
  
  // Load orders
  await store.dispatch('restaurantAdmin/fetchOrders')
  connectWebSocket()
})

onUnmounted(() => {
  if (wsConnection.value) {
    wsConnection.value.close()
  }
})
</script>

<style scoped>
.v-list-item {
  border: 1px solid #eee;
  border-radius: 8px;
  margin-bottom: 8px;
}

/* Invoice styles */
.invoice-preview {
  background-color: white;
}

.invoice-table {
  width: 100%;
  border-collapse: collapse;
}

.invoice-table th, 
.invoice-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.invoice-table th {
  background-color: #f2f2f2;
}

.text-right {
  text-align: right;
}
</style>