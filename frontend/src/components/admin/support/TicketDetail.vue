<template>
  <v-card v-if="ticket">
    <v-toolbar
      :color="getStatusColor(ticket.status)"
      dark
    >
      <v-toolbar-title>{{ ticket.subject }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        icon
        @click="$emit('close')"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-card-text class="pt-4">
      <v-row>
        <v-col cols="12" md="8">
          <!-- Ticket Info -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2">mdi-information-outline</v-icon>
                <span class="text-subtitle-1 font-weight-bold">Thông tin yêu cầu</span>
              </div>
              <p class="mb-2">{{ ticket.description }}</p>
              <div class="d-flex flex-wrap mt-3">
                <v-chip
                  :color="getStatusColor(ticket.status)"
                  class="mr-2 mb-2"
                >
                  {{ formatStatus(ticket.status) }}
                </v-chip>
                <v-chip
                  :color="getPriorityColor(ticket.priority)"
                  class="mr-2 mb-2"
                >
                  {{ formatPriority(ticket.priority) }}
                </v-chip>
                <v-chip
                  color="secondary"
                  variant="outlined"
                  class="mr-2 mb-2"
                >
                  {{ formatCategory(ticket.category) }}
                </v-chip>
              </div>
            </v-card-text>
          </v-card>

          <!-- Messages -->
          <div class="messages-container mb-4">
            <div
              v-for="message in messages"
              :key="message.id"
              :class="[
                'message',
                message.senderId === currentUserId ? 'message-sent' : 'message-received',
                message.isInternal ? 'message-internal' : ''
              ]"
            >
              <div class="message-header">
                <span class="font-weight-medium">{{ message.sender?.fullName || 'Unknown' }}</span>
                <span class="text-caption ml-2">{{ formatDateTime(message.createdAt) }}</span>
                <v-chip
                  v-if="message.isInternal"
                  size="x-small"
                  color="grey"
                  class="ml-2"
                >
                  Ghi chú nội bộ
                </v-chip>
              </div>
              <div class="message-content">
                {{ message.content }}
              </div>
            </div>
          </div>

          <!-- Reply Form -->
          <v-card variant="outlined">
            <v-card-text>
              <v-textarea
                v-model="newMessage"
                label="Trả lời"
                rows="3"
                auto-grow
                hide-details
              ></v-textarea>
              <div class="d-flex align-center mt-2">
                <v-switch
                  v-model="isInternalNote"
                  label="Ghi chú nội bộ"
                  color="primary"
                  hide-details
                  density="compact"
                ></v-switch>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  :loading="sendingMessage"
                  @click="sendMessage"
                >
                  Gửi
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4">
          <!-- Customer Info -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2">mdi-account</v-icon>
                <span class="text-subtitle-1 font-weight-bold">Thông tin khách hàng</span>
              </div>
              <div v-if="ticket.user">
                <p class="mb-1"><strong>Tên:</strong> {{ ticket.user.fullName }}</p>
                <p class="mb-1"><strong>Email:</strong> {{ ticket.user.email }}</p>
                <p class="mb-1" v-if="ticket.user.phone"><strong>SĐT:</strong> {{ ticket.user.phone }}</p>
              </div>
            </v-card-text>
          </v-card>

          <!-- Ticket Actions -->
          <v-card variant="outlined" class="mb-4">
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2">mdi-cog</v-icon>
                <span class="text-subtitle-1 font-weight-bold">Thao tác</span>
              </div>
              
              <v-select
                v-model="ticketStatus"
                :items="statusOptions"
                label="Trạng thái"
                class="mb-2"
              ></v-select>
              
              <v-select
                v-model="ticketPriority"
                :items="priorityOptions"
                label="Mức độ ưu tiên"
                class="mb-2"
              ></v-select>
              
              <v-btn
                color="primary"
                block
                class="mb-2"
                :loading="updatingTicket"
                @click="updateTicketDetails"
              >
                Cập nhật
              </v-btn>
              
              <v-btn
                v-if="!ticket.assignedTo"
                color="success"
                block
                class="mb-2"
                :loading="assigningTicket"
                @click="assignToMe"
              >
                Nhận xử lý
              </v-btn>
            </v-card-text>
          </v-card>

          <!-- Related Info -->
          <v-card variant="outlined" v-if="ticket.orderId">
            <v-card-text>
              <div class="d-flex align-center mb-2">
                <v-icon class="mr-2">mdi-package-variant</v-icon>
                <span class="text-subtitle-1 font-weight-bold">Đơn hàng liên quan</span>
              </div>
              <p class="mb-1"><strong>Mã đơn hàng:</strong> #{{ ticket.orderId }}</p>
              <v-btn
                color="primary"
                variant="text"
                block
                @click="viewOrder(ticket.orderId)"
              >
                Xem đơn hàng
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useToast } from 'vue-toastification'

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'updated'])
const store = useStore()
const router = useRouter()
const toast = useToast()

// Data
const messages = ref([])
const newMessage = ref('')
const isInternalNote = ref(false)
const sendingMessage = ref(false)
const updatingTicket = ref(false)
const assigningTicket = ref(false)
const ticketStatus = ref(null)
const ticketPriority = ref(null)

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

// Computed
const currentUserId = computed(() => store.state.auth.user?.id)

// Methods
const fetchTicketMessages = async () => {
  try {
    const fetchedMessages = await store.dispatch('support/fetchTicketMessages', props.ticket.id)
    messages.value = fetchedMessages
  } catch (error) {
    toast.error('Không thể tải tin nhắn')
    console.error('Failed to fetch ticket messages:', error)
  }
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return
  
  try {
    sendingMessage.value = true
    await store.dispatch('support/addTicketMessage', {
      ticketId: props.ticket.id,
      content: newMessage.value,
      isInternal: isInternalNote.value
    })
    
    // Refresh messages
    await fetchTicketMessages()
    
    newMessage.value = ''
    isInternalNote.value = false
    toast.success('Tin nhắn đã được gửi')
  } catch (error) {
    toast.error('Không thể gửi tin nhắn')
    console.error('Failed to send message:', error)
  } finally {
    sendingMessage.value = false
  }
}

const updateTicketDetails = async () => {
  try {
    updatingTicket.value = true
    
    const updates = {}
    if (ticketStatus.value !== props.ticket.status) {
      updates.status = ticketStatus.value
    }
    
    if (ticketPriority.value !== props.ticket.priority) {
      updates.priority = ticketPriority.value
    }
    
    if (Object.keys(updates).length === 0) {
      toast.info('Không có thay đổi để cập nhật')
      return
    }
    
    await store.dispatch('support/updateTicket', {
      ticketId: props.ticket.id,
      data: updates
    })
    
    toast.success('Cập nhật thành công')
    emit('updated')
  } catch (error) {
    toast.error('Không thể cập nhật yêu cầu hỗ trợ')
    console.error('Failed to update ticket:', error)
  } finally {
    updatingTicket.value = false
  }
}

const assignToMe = async () => {
  try {
    assigningTicket.value = true
    
    await store.dispatch('support/assignTicket', {
      ticketId: props.ticket.id,
      adminId: currentUserId.value
    })
    
    toast.success('Đã nhận xử lý yêu cầu')
    emit('updated')
  } catch (error) {
    toast.error('Không thể nhận xử lý yêu cầu')
    console.error('Failed to assign ticket:', error)
  } finally {
    assigningTicket.value = false
  }
}

const viewOrder = (orderId) => {
  router.push(`/admin/orders/${orderId}`)
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

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi })
}

// Watchers
watch(() => props.ticket, async (newTicket) => {
  if (newTicket) {
    ticketStatus.value = newTicket.status
    ticketPriority.value = newTicket.priority
    await fetchTicketMessages()
  }
}, { immediate: true })
</script>

<style scoped>
.messages-container {
  max-height: 400px;
  overflow-y: auto;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.message {
  margin-bottom: 16px;
  padding: 12px;
  border-radius: 8px;
  max-width: 80%;
}

.message-sent {
  background-color: #e3f2fd;
  margin-left: auto;
}

.message-received {
  background-color: white;
  margin-right: auto;
}

.message-internal {
  background-color: #f5f5f5;
  border: 1px dashed #9e9e9e;
}

.message-header {
  margin-bottom: 4px;
  display: flex;
  align-items: center;
}

.message-content {
  white-space: pre-wrap;
}
</style>
