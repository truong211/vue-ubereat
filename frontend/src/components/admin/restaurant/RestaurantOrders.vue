<template>
  <div class="restaurant-orders">
    <!-- Header with filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.search"
              label="Tìm kiếm đơn hàng"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @keyup.enter="applyFilters"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Trạng thái"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-menu
              ref="dateMenu"
              v-model="dateMenu"
              :close-on-content-click="false"
              transition="scale-transition"
              offset-y
              min-width="auto"
            >
              <template v-slot:activator="{ props }">
                <v-text-field
                  v-model="filters.dateRange"
                  label="Khoảng thời gian"
                  prepend-inner-icon="mdi-calendar"
                  readonly
                  v-bind="props"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  clearable
                  @click:clear="clearDateRange"
                ></v-text-field>
              </template>
              <v-date-picker
                v-model="dateRangeArray"
                range
                @update:model-value="updateDateRange"
              ></v-date-picker>
            </v-menu>
          </v-col>

          <v-col cols="12" md="3">
            <v-btn
              color="primary"
              block
              @click="applyFilters"
            >
              Áp dụng bộ lọc
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Orders Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="orders"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :page="page"
        :server-items-length="totalOrders"
        @update:page="handlePageChange"
        @update:items-per-page="handleItemsPerPageChange"
      >
        <!-- Order Number Column -->
        <template v-slot:item.orderNumber="{ item }">
          <div class="font-weight-medium">#{{ item.orderNumber }}</div>
        </template>

        <!-- Customer Column -->
        <template v-slot:item.customer="{ item }">
          <div>{{ item.customerName }}</div>
          <div class="text-caption">{{ item.customerPhone }}</div>
        </template>

        <!-- Items Column -->
        <template v-slot:item.items="{ item }">
          <div>{{ item.totalItems }} món</div>
          <v-tooltip location="bottom">
            <template v-slot:activator="{ props }">
              <div class="text-caption text-primary" v-bind="props" style="cursor: pointer;">
                Xem chi tiết
              </div>
            </template>
            <div>
              <div v-for="(orderItem, index) in item.orderItems" :key="index" class="mb-1">
                {{ orderItem.quantity }}x {{ orderItem.name }}
              </div>
            </div>
          </v-tooltip>
        </template>

        <!-- Total Column -->
        <template v-slot:item.totalAmount="{ item }">
          <div class="font-weight-bold">{{ formatPrice(item.totalAmount) }}</div>
        </template>

        <!-- Status Column -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <!-- Date Column -->
        <template v-slot:item.createdAt="{ item }">
          <div>{{ formatDate(item.createdAt) }}</div>
          <div class="text-caption">{{ formatTime(item.createdAt) }}</div>
        </template>

        <!-- Actions Column -->
        <template v-slot:item.actions="{ item }">
          <v-btn-group density="comfortable">
            <v-btn
              icon="mdi-eye"
              variant="text"
              @click="viewOrder(item)"
            ></v-btn>
            <v-btn
              v-if="canUpdateStatus(item.status)"
              icon="mdi-update"
              variant="text"
              color="primary"
              @click="updateOrderStatus(item)"
            ></v-btn>
          </v-btn-group>
        </template>
      </v-data-table>
    </v-card>

    <!-- Order Detail Dialog -->
    <v-dialog v-model="orderDetailDialog.show" max-width="800">
      <v-card v-if="orderDetailDialog.order">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Chi tiết đơn hàng #{{ orderDetailDialog.order.orderNumber }}</span>
          <v-chip
            :color="getStatusColor(orderDetailDialog.order.status)"
          >
            {{ formatStatus(orderDetailDialog.order.status) }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <v-card variant="outlined" class="mb-4">
                <v-card-title>Thông tin khách hàng</v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-account</v-icon>
                      </template>
                      <v-list-item-title>Tên khách hàng</v-list-item-title>
                      <v-list-item-subtitle>{{ orderDetailDialog.order.customerName }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-phone</v-icon>
                      </template>
                      <v-list-item-title>Số điện thoại</v-list-item-title>
                      <v-list-item-subtitle>{{ orderDetailDialog.order.customerPhone }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-email</v-icon>
                      </template>
                      <v-list-item-title>Email</v-list-item-title>
                      <v-list-item-subtitle>{{ orderDetailDialog.order.customerEmail }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>

              <v-card variant="outlined">
                <v-card-title>Thông tin giao hàng</v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-map-marker</v-icon>
                      </template>
                      <v-list-item-title>Địa chỉ giao hàng</v-list-item-title>
                      <v-list-item-subtitle>{{ orderDetailDialog.order.deliveryAddress }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-truck-delivery</v-icon>
                      </template>
                      <v-list-item-title>Phương thức giao hàng</v-list-item-title>
                      <v-list-item-subtitle>{{ orderDetailDialog.order.deliveryMethod }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item v-if="orderDetailDialog.order.deliveryNote">
                      <template v-slot:prepend>
                        <v-icon>mdi-note-text</v-icon>
                      </template>
                      <v-list-item-title>Ghi chú giao hàng</v-list-item-title>
                      <v-list-item-subtitle>{{ orderDetailDialog.order.deliveryNote }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12" md="6">
              <v-card variant="outlined" class="mb-4">
                <v-card-title>Thông tin thanh toán</v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-credit-card</v-icon>
                      </template>
                      <v-list-item-title>Phương thức thanh toán</v-list-item-title>
                      <v-list-item-subtitle>{{ orderDetailDialog.order.paymentMethod }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-cash</v-icon>
                      </template>
                      <v-list-item-title>Trạng thái thanh toán</v-list-item-title>
                      <v-list-item-subtitle>
                        <v-chip
                          :color="orderDetailDialog.order.isPaid ? 'success' : 'warning'"
                          size="small"
                        >
                          {{ orderDetailDialog.order.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán' }}
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item v-if="orderDetailDialog.order.paymentId">
                      <template v-slot:prepend>
                        <v-icon>mdi-identifier</v-icon>
                      </template>
                      <v-list-item-title>Mã thanh toán</v-list-item-title>
                      <v-list-item-subtitle>{{ orderDetailDialog.order.paymentId }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>

              <v-card variant="outlined">
                <v-card-title>Thông tin đơn hàng</v-card-title>
                <v-card-text>
                  <v-list density="compact">
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-calendar</v-icon>
                      </template>
                      <v-list-item-title>Ngày đặt hàng</v-list-item-title>
                      <v-list-item-subtitle>{{ formatDateTime(orderDetailDialog.order.createdAt) }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item v-if="orderDetailDialog.order.note">
                      <template v-slot:prepend>
                        <v-icon>mdi-note-text</v-icon>
                      </template>
                      <v-list-item-title>Ghi chú đơn hàng</v-list-item-title>
                      <v-list-item-subtitle>{{ orderDetailDialog.order.note }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>

            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title>Chi tiết món ăn</v-card-title>
                <v-card-text class="pa-0">
                  <v-table>
                    <thead>
                      <tr>
                        <th>Món ăn</th>
                        <th class="text-center">Số lượng</th>
                        <th class="text-right">Đơn giá</th>
                        <th class="text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in orderDetailDialog.order.orderItems" :key="item.id">
                        <td>
                          <div class="d-flex align-center">
                            <v-avatar size="40" class="mr-2" rounded>
                              <v-img :src="item.image || '/img/food-placeholder.jpg'" cover></v-img>
                            </v-avatar>
                            <div>
                              <div>{{ item.name }}</div>
                              <div class="text-caption" v-if="item.options">
                                {{ formatOptions(item.options) }}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td class="text-center">{{ item.quantity }}</td>
                        <td class="text-right">{{ formatPrice(item.price) }}</td>
                        <td class="text-right">{{ formatPrice(item.price * item.quantity) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="3" class="text-right font-weight-bold">Tạm tính:</td>
                        <td class="text-right">{{ formatPrice(orderDetailDialog.order.subtotal) }}</td>
                      </tr>
                      <tr>
                        <td colspan="3" class="text-right font-weight-bold">Phí giao hàng:</td>
                        <td class="text-right">{{ formatPrice(orderDetailDialog.order.deliveryFee) }}</td>
                      </tr>
                      <tr v-if="orderDetailDialog.order.discount">
                        <td colspan="3" class="text-right font-weight-bold">Giảm giá:</td>
                        <td class="text-right">-{{ formatPrice(orderDetailDialog.order.discount) }}</td>
                      </tr>
                      <tr>
                        <td colspan="3" class="text-right font-weight-bold">Tổng cộng:</td>
                        <td class="text-right font-weight-bold">{{ formatPrice(orderDetailDialog.order.totalAmount) }}</td>
                      </tr>
                    </tfoot>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="orderDetailDialog.show = false">Đóng</v-btn>
          <v-btn
            v-if="canUpdateStatus(orderDetailDialog.order.status)"
            color="primary"
            @click="updateOrderStatus(orderDetailDialog.order)"
          >
            Cập nhật trạng thái
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Update Status Dialog -->
    <v-dialog v-model="updateStatusDialog.show" max-width="500">
      <v-card v-if="updateStatusDialog.order">
        <v-card-title>Cập nhật trạng thái đơn hàng</v-card-title>
        <v-card-text>
          <p class="mb-4">Đơn hàng #{{ updateStatusDialog.order.orderNumber }}</p>
          
          <v-select
            v-model="updateStatusDialog.newStatus"
            :items="getAvailableStatusOptions(updateStatusDialog.order.status)"
            label="Trạng thái mới"
            variant="outlined"
          ></v-select>
          
          <v-textarea
            v-model="updateStatusDialog.note"
            label="Ghi chú (tùy chọn)"
            variant="outlined"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="updateStatusDialog.show = false">Hủy</v-btn>
          <v-btn color="primary" @click="confirmUpdateStatus">Cập nhật</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted, watch, defineProps } from 'vue'
import { useToast } from 'vue-toastification'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { adminAPI } from '@/services/api.service'

export default {
  name: 'RestaurantOrders',
  
  props: {
    restaurantId: {
      type: [String, Number],
      required: true
    }
  },
  
  setup(props) {
    const toast = useToast()
    
    // State
    const loading = ref(true)
    const orders = ref([])
    const totalOrders = ref(0)
    const page = ref(1)
    const itemsPerPage = ref(10)
    const dateMenu = ref(false)
    const dateRangeArray = ref([])
    
    // Filters
    const filters = ref({
      search: '',
      status: null,
      dateRange: '',
      startDate: null,
      endDate: null
    })
    
    // Dialog states
    const orderDetailDialog = ref({
      show: false,
      order: null
    })
    
    const updateStatusDialog = ref({
      show: false,
      order: null,
      newStatus: '',
      note: ''
    })
    
    // Options
    const statusOptions = [
      { title: 'Tất cả', value: null },
      { title: 'Chờ xác nhận', value: 'pending' },
      { title: 'Đã xác nhận', value: 'confirmed' },
      { title: 'Đang chuẩn bị', value: 'preparing' },
      { title: 'Đang giao hàng', value: 'delivering' },
      { title: 'Đã giao', value: 'completed' },
      { title: 'Đã hủy', value: 'cancelled' }
    ]
    
    // Table headers
    const headers = [
      { title: 'Mã đơn', key: 'orderNumber', sortable: true },
      { title: 'Khách hàng', key: 'customer', sortable: false },
      { title: 'Món ăn', key: 'items', sortable: false },
      { title: 'Tổng tiền', key: 'totalAmount', sortable: true },
      { title: 'Trạng thái', key: 'status', sortable: true },
      { title: 'Ngày đặt', key: 'createdAt', sortable: true },
      { title: 'Thao tác', key: 'actions', sortable: false, align: 'end' }
    ]
    
    // Methods
    const loadOrders = async () => {
      loading.value = true
      try {
        const params = {
          page: page.value,
          limit: itemsPerPage.value,
          status: filters.value.status,
          search: filters.value.search || undefined,
          startDate: filters.value.startDate,
          endDate: filters.value.endDate
        }
        
        const response = await adminAPI.getRestaurantOrders(props.restaurantId, params)
        orders.value = response.data.orders
        totalOrders.value = response.data.total
      } catch (error) {
        toast.error('Không thể tải danh sách đơn hàng')
        console.error('Failed to load orders:', error)
      } finally {
        loading.value = false
      }
    }
    
    const handlePageChange = (newPage) => {
      page.value = newPage
      loadOrders()
    }
    
    const handleItemsPerPageChange = (newItemsPerPage) => {
      itemsPerPage.value = newItemsPerPage
      page.value = 1
      loadOrders()
    }
    
    const applyFilters = () => {
      page.value = 1
      loadOrders()
    }
    
    const updateDateRange = () => {
      if (dateRangeArray.value.length === 2) {
        const [start, end] = dateRangeArray.value
        filters.value.startDate = start
        filters.value.endDate = end
        filters.value.dateRange = `${formatDate(start)} - ${formatDate(end)}`
        dateMenu.value = false
      }
    }
    
    const clearDateRange = () => {
      dateRangeArray.value = []
      filters.value.startDate = null
      filters.value.endDate = null
      filters.value.dateRange = ''
    }
    
    const viewOrder = (order) => {
      orderDetailDialog.value = {
        show: true,
        order
      }
    }
    
    const updateOrderStatus = (order) => {
      updateStatusDialog.value = {
        show: true,
        order,
        newStatus: getNextStatus(order.status),
        note: ''
      }
    }
    
    const confirmUpdateStatus = async () => {
      try {
        await adminAPI.updateOrderStatus(
          updateStatusDialog.value.order.id,
          {
            status: updateStatusDialog.value.newStatus,
            note: updateStatusDialog.value.note
          }
        )
        
        toast.success('Cập nhật trạng thái đơn hàng thành công')
        updateStatusDialog.value.show = false
        
        // Update order in list
        const index = orders.value.findIndex(o => o.id === updateStatusDialog.value.order.id)
        if (index !== -1) {
          orders.value[index].status = updateStatusDialog.value.newStatus
        }
        
        // Update order in detail dialog if open
        if (orderDetailDialog.value.show && orderDetailDialog.value.order.id === updateStatusDialog.value.order.id) {
          orderDetailDialog.value.order.status = updateStatusDialog.value.newStatus
        }
      } catch (error) {
        toast.error('Không thể cập nhật trạng thái đơn hàng')
        console.error('Failed to update order status:', error)
      }
    }
    
    // Utility functions
    const getStatusColor = (status) => {
      switch (status) {
        case 'pending': return 'warning'
        case 'confirmed': return 'info'
        case 'preparing': return 'primary'
        case 'delivering': return 'purple'
        case 'completed': return 'success'
        case 'cancelled': return 'error'
        default: return 'grey'
      }
    }
    
    const formatStatus = (status) => {
      const statusMap = {
        pending: 'Chờ xác nhận',
        confirmed: 'Đã xác nhận',
        preparing: 'Đang chuẩn bị',
        delivering: 'Đang giao hàng',
        completed: 'Đã giao',
        cancelled: 'Đã hủy'
      }
      return statusMap[status] || status
    }
    
    const formatDate = (dateString) => {
      if (!dateString) return ''
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
    }
    
    const formatTime = (dateString) => {
      if (!dateString) return ''
      return format(new Date(dateString), 'HH:mm', { locale: vi })
    }
    
    const formatDateTime = (dateString) => {
      if (!dateString) return ''
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi })
    }
    
    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price)
    }
    
    const formatOptions = (options) => {
      if (!options) return ''
      
      try {
        const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options
        return Object.entries(parsedOptions)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      } catch (error) {
        return options
      }
    }
    
    const canUpdateStatus = (status) => {
      return ['pending', 'confirmed', 'preparing', 'delivering'].includes(status)
    }
    
    const getNextStatus = (currentStatus) => {
      const statusFlow = {
        pending: 'confirmed',
        confirmed: 'preparing',
        preparing: 'delivering',
        delivering: 'completed'
      }
      return statusFlow[currentStatus] || currentStatus
    }
    
    const getAvailableStatusOptions = (currentStatus) => {
      const options = []
      
      switch (currentStatus) {
        case 'pending':
          options.push(
            { title: 'Xác nhận đơn hàng', value: 'confirmed' },
            { title: 'Hủy đơn hàng', value: 'cancelled' }
          )
          break
        case 'confirmed':
          options.push(
            { title: 'Bắt đầu chuẩn bị', value: 'preparing' },
            { title: 'Hủy đơn hàng', value: 'cancelled' }
          )
          break
        case 'preparing':
          options.push(
            { title: 'Bắt đầu giao hàng', value: 'delivering' },
            { title: 'Hủy đơn hàng', value: 'cancelled' }
          )
          break
        case 'delivering':
          options.push(
            { title: 'Đã giao hàng', value: 'completed' },
            { title: 'Hủy đơn hàng', value: 'cancelled' }
          )
          break
      }
      
      return options
    }
    
    // Watch for restaurant ID changes
    watch(() => props.restaurantId, () => {
      if (props.restaurantId) {
        loadOrders()
      }
    }, { immediate: true })
    
    return {
      loading,
      orders,
      totalOrders,
      page,
      itemsPerPage,
      filters,
      dateMenu,
      dateRangeArray,
      statusOptions,
      headers,
      orderDetailDialog,
      updateStatusDialog,
      loadOrders,
      handlePageChange,
      handleItemsPerPageChange,
      applyFilters,
      updateDateRange,
      clearDateRange,
      viewOrder,
      updateOrderStatus,
      confirmUpdateStatus,
      getStatusColor,
      formatStatus,
      formatDate,
      formatTime,
      formatDateTime,
      formatPrice,
      formatOptions,
      canUpdateStatus,
      getNextStatus,
      getAvailableStatusOptions
    }
  }
}
</script>

<style scoped>
.restaurant-orders {
  padding: 16px;
}
</style>
