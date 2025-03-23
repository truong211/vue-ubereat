<template>
  <v-container>
    <h1 class="text-h4 mb-4">Quản Lý Đơn Hàng</h1>

    <!-- Order Status Tabs -->
    <v-card class="mb-6">
      <v-tabs v-model="activeTab" grow>
        <v-tab value="new" class="text-body-1">
          Đơn Mới
          <v-badge
            :content="pendingOrdersCount.toString()"
            :model-value="pendingOrdersCount > 0"
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
                    {{ formatPrice(order.totalAmount) }}
                  </div>
                  <div class="text-caption text-grey">
                    Khách hàng: {{ order.customer.fullName }} • 
                    SĐT: {{ order.customer.phone }}
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
              <div>{{ orderDialog.order.customer.fullName }}</div>
              <div>{{ orderDialog.order.customer.phone }}</div>
              <div class="text-caption">{{ orderDialog.order.customer.email }}</div>
            </v-col>

            <!-- Delivery Info -->
            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 mb-2">Thông Tin Giao Hàng</h3>
              <div>{{ orderDialog.order.deliveryAddress }}</div>
              <div class="text-caption" v-if="orderDialog.order.deliveryInstructions">
                Ghi chú: {{ orderDialog.order.deliveryInstructions }}
              </div>
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
                    <span>{{ formatPrice(item.totalPrice) }}</span>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="item.notes">
                    Ghi chú: {{ item.notes }}
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
                    <span>{{ formatPrice(orderDialog.order.totalAmount) }}</span>
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
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const store = useStore()

// State
const activeTab = ref('new')
const wsConnection = ref(null)

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

// Options
const rejectReasons = [
  { title: 'Hết nguyên liệu', value: 'out_of_stock' },
  { title: 'Quá tải đơn hàng', value: 'too_busy' },
  { title: 'Sắp đóng cửa', value: 'closing_soon' },
  { title: 'Lý do khác', value: 'other' }
]

// Computed
const pendingOrdersCount = computed(() => store.getters['restaurantOrders/pendingOrdersCount'])

const getOrdersByStatus = (status) => {
  const statusMap = {
    new: 'pending',
    preparing: 'preparing',
    ready: 'ready',
    completed: 'completed'
  }
  return store.getters['restaurantOrders/getOrdersByStatus'](statusMap[status])
}

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    preparing: 'info',
    ready: 'success',
    completed: 'grey',
    cancelled: 'error'
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

const formatDateTime = (dateStr) => {
  return format(new Date(dateStr), 'HH:mm - dd/MM/yyyy', { locale: vi })
}

const formatPrice = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

// Methods
const viewOrderDetails = (order) => {
  orderDialog.value = {
    show: true,
    order
  }
}

const acceptOrder = async (order) => {
  try {
    await store.dispatch('restaurantOrders/updateOrderStatus', {
      orderId: order.id,
      status: 'preparing'
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
    await store.dispatch('restaurantOrders/updateOrderStatus', {
      orderId: rejectDialog.value.order.id,
      status: 'cancelled',
      note: `${rejectDialog.value.reason}${rejectDialog.value.note ? ': ' + rejectDialog.value.note : ''}`
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
    await store.dispatch('restaurantOrders/updateOrderStatus', {
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

// WebSocket connection for real-time updates
const connectWebSocket = () => {
  wsConnection.value = new WebSocket('ws://api.example.com/restaurant/orders')
  
  wsConnection.value.onmessage = (event) => {
    const data = JSON.parse(event.data)
    switch (data.type) {
      case 'new_order':
        store.dispatch('restaurantOrders/fetchOrders')
        // Play notification sound
        new Audio('/assets/sounds/new-order.mp3').play()
        break
      case 'order_update':
        store.dispatch('restaurantOrders/handleOrderUpdate', data.order)
        break
    }
  }
}

// Lifecycle hooks
onMounted(async () => {
  await store.dispatch('restaurantOrders/fetchOrders')
  connectWebSocket()
})

onBeforeUnmount(() => {
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
</style>