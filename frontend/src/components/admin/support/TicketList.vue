<template>
  <div>
    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-title>
        <v-icon class="mr-2">mdi-filter</v-icon>
        Bộ lọc
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="3">
            <v-text-field
              v-model="filters.search"
              label="Tìm kiếm"
              prepend-inner-icon="mdi-magnify"
              clearable
              @keyup.enter="applyFilters"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Trạng thái"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.priority"
              :items="priorityOptions"
              label="Mức độ ưu tiên"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select
              v-model="filters.category"
              :items="categoryOptions"
              label="Danh mục"
              clearable
            ></v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" class="d-flex justify-end">
            <v-btn
              color="primary"
              @click="applyFilters"
              class="mr-2"
            >
              Áp dụng
            </v-btn>
            <v-btn
              variant="outlined"
              @click="resetFilters"
            >
              Đặt lại
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Tickets Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="tickets"
        :loading="loading"
        :items-per-page="pagination.limit"
        :page="pagination.page"
        :server-items-length="pagination.totalItems"
        @update:page="handlePageChange"
      >
        <template v-slot:item.subject="{ item }">
          <div class="font-weight-medium">{{ item.subject }}</div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <template v-slot:item.priority="{ item }">
          <v-chip
            :color="getPriorityColor(item.priority)"
            size="small"
          >
            {{ formatPriority(item.priority) }}
          </v-chip>
        </template>

        <template v-slot:item.category="{ item }">
          <v-chip
            color="secondary"
            size="small"
            variant="outlined"
          >
            {{ formatCategory(item.category) }}
          </v-chip>
        </template>

        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            @click="openTicket(item)"
          >
            <v-icon>mdi-eye</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            color="success"
            @click="assignToMe(item)"
            v-if="!item.assignedTo"
          >
            <v-icon>mdi-account-check</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineEmits } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useToast } from 'vue-toastification'

const emit = defineEmits(['open-ticket'])
const store = useStore()
const toast = useToast()

// Data
const tickets = ref([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1
})
const filters = ref({
  status: null,
  priority: null,
  category: null,
  search: ''
})

// Options
const statusOptions = [
  { title: 'Mới', value: 'open' },
  { title: 'Đang xử lý', value: 'in_progress' },
  { title: 'Đã giải quyết', value: 'resolved' },
  { title: 'Đã đóng', value: 'closed' }
]

const priorityOptions = [
  { title: 'Thấp', value: 'low' },
  { title: 'Trung bình', value: 'medium' },
  { title: 'Cao', value: 'high' },
  { title: 'Khẩn cấp', value: 'urgent' }
]

const categoryOptions = [
  { title: 'Tài khoản', value: 'account' },
  { title: 'Đơn hàng', value: 'order' },
  { title: 'Thanh toán', value: 'payment' },
  { title: 'Giao hàng', value: 'delivery' },
  { title: 'Nhà hàng', value: 'restaurant' },
  { title: 'Ứng dụng', value: 'app' },
  { title: 'Khác', value: 'other' }
]

const headers = [
  { title: 'Tiêu đề', key: 'subject' },
  { title: 'Trạng thái', key: 'status', width: '120px' },
  { title: 'Ưu tiên', key: 'priority', width: '120px' },
  { title: 'Danh mục', key: 'category', width: '120px' },
  { title: 'Ngày tạo', key: 'createdAt', width: '150px' },
  { title: 'Thao tác', key: 'actions', sortable: false, width: '100px' }
]

// Computed
const currentUserId = computed(() => store.state.auth.user?.id)

// Methods
const fetchTickets = async () => {
  try {
    loading.value = true
    await store.dispatch('support/fetchAdminTickets')
    tickets.value = store.state.support.adminTickets
    pagination.value = store.state.support.pagination
  } catch (error) {
    toast.error('Không thể tải danh sách yêu cầu hỗ trợ')
    console.error('Failed to fetch tickets:', error)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  pagination.value.page = page
  store.dispatch('support/setPage', page)
  fetchTickets()
}

const applyFilters = () => {
  store.dispatch('support/setFilters', filters.value)
  pagination.value.page = 1
  store.dispatch('support/setPage', 1)
  fetchTickets()
}

const resetFilters = () => {
  filters.value = {
    status: null,
    priority: null,
    category: null,
    search: ''
  }
  applyFilters()
}

const openTicket = (ticket) => {
  emit('open-ticket', ticket)
}

const assignToMe = async (ticket) => {
  try {
    loading.value = true
    
    await store.dispatch('support/assignTicket', {
      ticketId: ticket.id,
      adminId: currentUserId.value
    })
    
    // Refresh ticket list
    fetchTickets()
    
    toast.success('Đã nhận xử lý yêu cầu')
  } catch (error) {
    toast.error('Không thể nhận xử lý yêu cầu')
    console.error('Failed to assign ticket:', error)
  } finally {
    loading.value = false
  }
}

// Formatters
const formatStatus = (status) => {
  const statusMap = {
    open: 'Mới',
    in_progress: 'Đang xử lý',
    resolved: 'Đã giải quyết',
    closed: 'Đã đóng'
  }
  return statusMap[status] || status
}

const formatPriority = (priority) => {
  const priorityMap = {
    low: 'Thấp',
    medium: 'Trung bình',
    high: 'Cao',
    urgent: 'Khẩn cấp'
  }
  return priorityMap[priority] || priority
}

const formatCategory = (category) => {
  const categoryMap = {
    account: 'Tài khoản',
    order: 'Đơn hàng',
    payment: 'Thanh toán',
    delivery: 'Giao hàng',
    restaurant: 'Nhà hàng',
    app: 'Ứng dụng',
    other: 'Khác'
  }
  return categoryMap[category] || category
}

const getStatusColor = (status) => {
  const colorMap = {
    open: 'warning',
    in_progress: 'info',
    resolved: 'success',
    closed: 'grey'
  }
  return colorMap[status] || 'grey'
}

const getPriorityColor = (priority) => {
  const colorMap = {
    low: 'success',
    medium: 'info',
    high: 'warning',
    urgent: 'error'
  }
  return colorMap[priority] || 'grey'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
}

// Lifecycle hooks
onMounted(async () => {
  await fetchTickets()
})

// Expose methods to parent component
defineExpose({
  fetchTickets
})
</script>
