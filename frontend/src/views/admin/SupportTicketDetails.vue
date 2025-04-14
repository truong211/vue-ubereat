<template>
  <div class="support-ticket-details">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card v-if="ticket">
            <v-card-title class="headline d-flex align-center">
              <div>
                <v-btn icon small class="mr-2" @click="goBack">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                Chi tiết yêu cầu hỗ trợ #{{ ticket.id }}
              </div>
              <v-spacer></v-spacer>
              <v-chip :color="getStatusColor(ticket.status)" dark>
                {{ getStatusText(ticket.status) }}
              </v-chip>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-title>Tiêu đề:</v-list-item-title>
                      <v-list-item-subtitle class="mt-1">{{ ticket.title }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-title>Khách hàng:</v-list-item-title>
                      <v-list-item-subtitle class="mt-1">
                        <v-btn
                          text
                          small
                          color="primary"
                          @click="viewCustomerProfile"
                        >
                          {{ ticket.customerName }}
                          <v-icon small right>mdi-account</v-icon>
                        </v-btn>
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-title>Danh mục:</v-list-item-title>
                      <v-list-item-subtitle class="mt-1">{{ ticket.category }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-col>

                <v-col cols="12" md="6">
                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-title>Độ ưu tiên:</v-list-item-title>
                      <v-list-item-subtitle class="mt-1">
                        <v-chip :color="getPriorityColor(ticket.priority)" small dark>
                          {{ getPriorityText(ticket.priority) }}
                        </v-chip>
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-title>Người được phân công:</v-list-item-title>
                      <v-list-item-subtitle class="mt-1">
                        {{ ticket.assignedTo ? ticket.assignedTo : 'Chưa phân công' }}
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>

                  <v-list-item>
                    <v-list-item-content>
                      <v-list-item-title>Ngày tạo:</v-list-item-title>
                      <v-list-item-subtitle class="mt-1">{{ formatDate(ticket.createdAt) }}</v-list-item-subtitle>
                    </v-list-item-content>
                  </v-list-item>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <v-row>
                <v-col cols="12">
                  <h3 class="subtitle-1 font-weight-bold mb-2">Nội dung yêu cầu:</h3>
                  <div class="ticket-content pa-3 rounded-lg">
                    {{ ticket.content }}
                  </div>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <!-- Additional details section -->
              <v-row v-if="ticket.orderId">
                <v-col cols="12">
                  <h3 class="subtitle-1 font-weight-bold mb-2">Thông tin đơn hàng liên quan:</h3>
                  <v-card outlined>
                    <v-card-text>
                      <v-row>
                        <v-col cols="6">Mã đơn hàng: #{{ ticket.orderId }}</v-col>
                        <v-col cols="6">Trạng thái: {{ ticket.orderStatus }}</v-col>
                      </v-row>
                      <v-btn small color="primary" class="mt-2" @click="viewOrder">
                        <v-icon small left>mdi-eye</v-icon> Xem đơn hàng
                      </v-btn>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <v-divider class="my-4"></v-divider>

              <!-- Conversation history -->
              <v-row>
                <v-col cols="12">
                  <h3 class="subtitle-1 font-weight-bold mb-2">Lịch sử trao đổi:</h3>
                  
                  <div v-if="ticket.messages && ticket.messages.length > 0">
                    <div v-for="(message, index) in ticket.messages" :key="index" class="message-container mb-4">
                      <div :class="['message', message.isAdmin ? 'admin-message' : 'customer-message']">
                        <div class="message-header d-flex align-center">
                          <strong>{{ message.sender }}</strong> 
                          <span class="ml-2 grey--text text--darken-1">{{ formatDate(message.timestamp) }}</span>
                        </div>
                        <div class="message-content mt-1">{{ message.content }}</div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-center pa-4 grey--text">
                    Chưa có trao đổi nào.
                  </div>

                  <v-divider class="my-4"></v-divider>

                  <!-- Reply section -->
                  <div v-if="ticket.status !== 'closed'">
                    <h3 class="subtitle-1 font-weight-bold mb-2">Phản hồi:</h3>
                    <v-textarea
                      v-model="replyMessage"
                      outlined
                      label="Nhập phản hồi"
                      rows="4"
                    ></v-textarea>
                    <v-btn color="primary" @click="sendReply" :disabled="!replyMessage.trim()">
                      <v-icon left>mdi-send</v-icon> Gửi phản hồi
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions class="pa-4">
              <v-btn color="primary" @click="updateTicket">
                <v-icon left>mdi-pencil</v-icon> Cập nhật
              </v-btn>
              
              <v-btn v-if="ticket.status === 'open'" color="success" class="ml-2" @click="assignTicket">
                <v-icon left>mdi-account-check</v-icon> Phân công
              </v-btn>
              
              <v-btn v-if="ticket.status !== 'closed'" color="error" class="ml-2" @click="closeTicket">
                <v-icon left>mdi-close-circle</v-icon> Đóng yêu cầu
              </v-btn>
              
              <v-spacer></v-spacer>
              
              <v-btn color="warning" @click="exportTicket">
                <v-icon left>mdi-export</v-icon> Xuất báo cáo
              </v-btn>
            </v-card-actions>
          </v-card>

          <v-card v-else>
            <v-card-text class="text-center">
              <v-progress-circular indeterminate color="primary" v-if="loading"></v-progress-circular>
              <div v-else>Không tìm thấy yêu cầu hỗ trợ</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Dialogs -->
      <v-dialog v-model="assignDialog" max-width="500px">
        <v-card>
          <v-card-title>Phân công yêu cầu hỗ trợ</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedStaff"
              :items="staffList"
              item-text="name"
              item-value="id"
              label="Chọn nhân viên hỗ trợ"
              required
            ></v-select>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="assignDialog = false">Hủy</v-btn>
            <v-btn color="success" text @click="confirmAssign">Xác nhận</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="closeDialog" max-width="500px">
        <v-card>
          <v-card-title>Đóng yêu cầu hỗ trợ</v-card-title>
          <v-card-text>
            <p>Bạn có chắc chắn muốn đóng yêu cầu hỗ trợ này?</p>
            <v-textarea
              v-model="closeReason"
              label="Lý do đóng yêu cầu"
              rows="3"
              required
            ></v-textarea>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="closeDialog = false">Hủy</v-btn>
            <v-btn color="success" text @click="confirmClose">Xác nhận</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="updateDialog" max-width="600px">
        <v-card>
          <v-card-title>Cập nhật yêu cầu hỗ trợ</v-card-title>
          <v-card-text>
            <v-form ref="updateForm">
              <v-select
                v-model="updateData.priority"
                :items="priorityOptions"
                label="Độ ưu tiên"
                required
              ></v-select>
              
              <v-select
                v-model="updateData.category"
                :items="categoryOptions"
                label="Danh mục"
                required
              ></v-select>
              
              <v-textarea
                v-model="updateData.notes"
                label="Ghi chú nội bộ"
                rows="3"
              ></v-textarea>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="error" text @click="updateDialog = false">Hủy</v-btn>
            <v-btn color="success" text @click="confirmUpdate">Cập nhật</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { format } from 'date-fns';

export default {
  name: 'SupportTicketDetails',
  
  props: {
    id: {
      type: [String, Number],
      required: true
    }
  },
  
  data() {
    return {
      loading: true,
      ticket: null,
      replyMessage: '',
      assignDialog: false,
      closeDialog: false,
      updateDialog: false,
      selectedStaff: null,
      staffList: [],
      closeReason: '',
      updateData: {
        priority: '',
        category: '',
        notes: ''
      },
      priorityOptions: [
        'high',
        'medium',
        'low'
      ],
      categoryOptions: [
        'Đặt hàng',
        'Thanh toán',
        'Đơn hàng',
        'Tài khoản',
        'Khác'
      ]
    };
  },
  
  created() {
    this.fetchTicketDetails();
    this.fetchStaffList();
  },
  
  methods: {
    fetchTicketDetails() {
      this.loading = true;
      // Replace with actual API call
      setTimeout(() => {
        // Mock data
        this.ticket = {
          id: this.id,
          title: 'Không thể thanh toán đơn hàng #12345',
          customerName: 'Nguyễn Văn A',
          customerId: 123,
          category: 'Thanh toán',
          status: 'in_progress',
          priority: 'high',
          createdAt: new Date('2025-04-01T10:30:00'),
          content: 'Tôi đã cố gắng thanh toán đơn hàng nhiều lần nhưng không thành công. Tôi đã thử nhiều thẻ khác nhau nhưng vẫn gặp lỗi. Vui lòng hỗ trợ giúp tôi.',
          assignedTo: 'Trần Thị Y - Hỗ trợ thanh toán',
          orderId: '12345',
          orderStatus: 'Chờ thanh toán',
          messages: [
            {
              sender: 'Nguyễn Văn A',
              isAdmin: false,
              content: 'Tôi đã cố gắng thanh toán đơn hàng nhiều lần nhưng không thành công.',
              timestamp: new Date('2025-04-01T10:30:00')
            },
            {
              sender: 'Trần Thị Y (Nhân viên hỗ trợ)',
              isAdmin: true,
              content: 'Chào anh/chị, chúng tôi đã nhận được yêu cầu hỗ trợ của bạn. Vui lòng cho chúng tôi biết bạn đã sử dụng phương thức thanh toán nào?',
              timestamp: new Date('2025-04-01T11:15:00')
            },
            {
              sender: 'Nguyễn Văn A',
              isAdmin: false,
              content: 'Tôi đã thử thanh toán bằng thẻ Visa và MasterCard.',
              timestamp: new Date('2025-04-01T11:30:00')
            }
          ]
        };
        this.loading = false;
        
        // Pre-fill update form
        this.updateData.priority = this.ticket.priority;
        this.updateData.category = this.ticket.category;
      }, 500);
    },
    
    fetchStaffList() {
      // Replace with actual API call
      setTimeout(() => {
        this.staffList = [
          { id: 1, name: 'Nguyễn Văn X - Hỗ trợ thanh toán' },
          { id: 2, name: 'Trần Thị Y - Hỗ trợ đơn hàng' },
          { id: 3, name: 'Phạm Văn Z - Hỗ trợ chung' }
        ];
      }, 500);
    },
    
    goBack() {
      this.$router.push({ name: 'SupportTickets' });
    },
    
    viewCustomerProfile() {
      this.$router.push({ 
        name: 'CustomerAccountDetails', 
        params: { id: this.ticket.customerId } 
      });
    },
    
    viewOrder() {
      this.$router.push({ 
        name: 'AdminOrders',
        query: { orderId: this.ticket.orderId }
      });
    },
    
    assignTicket() {
      this.assignDialog = true;
    },
    
    closeTicket() {
      this.closeDialog = true;
    },
    
    updateTicket() {
      this.updateDialog = true;
    },
    
    confirmAssign() {
      // Replace with actual API call
      console.log(`Assigning ticket #${this.id} to staff #${this.selectedStaff}`);
      
      // Update local state
      const staffMember = this.staffList.find(s => s.id === this.selectedStaff);
      if (staffMember) {
        this.ticket.assignedTo = staffMember.name;
        this.ticket.status = 'in_progress';
      }
      
      this.$store.dispatch('ui/showSnackbar', {
        message: 'Đã phân công yêu cầu hỗ trợ thành công!',
        color: 'success'
      });
      
      this.assignDialog = false;
      this.selectedStaff = null;
    },
    
    confirmClose() {
      // Replace with actual API call
      console.log(`Closing ticket #${this.id} with reason: ${this.closeReason}`);
      
      // Add closing message to conversation
      this.ticket.messages.push({
        sender: 'Admin',
        isAdmin: true,
        content: `Yêu cầu hỗ trợ đã được đóng. Lý do: ${this.closeReason}`,
        timestamp: new Date()
      });
      
      // Update status
      this.ticket.status = 'closed';
      
      this.$store.dispatch('ui/showSnackbar', {
        message: 'Đã đóng yêu cầu hỗ trợ thành công!',
        color: 'success'
      });
      
      this.closeDialog = false;
      this.closeReason = '';
    },
    
    confirmUpdate() {
      // Replace with actual API call
      console.log(`Updating ticket #${this.id}`, this.updateData);
      
      // Update local state
      this.ticket.priority = this.updateData.priority;
      this.ticket.category = this.updateData.category;
      
      this.$store.dispatch('ui/showSnackbar', {
        message: 'Đã cập nhật yêu cầu hỗ trợ thành công!',
        color: 'success'
      });
      
      this.updateDialog = false;
    },
    
    sendReply() {
      if (!this.replyMessage.trim()) return;
      
      // Replace with actual API call
      console.log(`Sending reply to ticket #${this.id}: ${this.replyMessage}`);
      
      // Add message to conversation
      this.ticket.messages.push({
        sender: 'Admin',
        isAdmin: true,
        content: this.replyMessage,
        timestamp: new Date()
      });
      
      this.$store.dispatch('ui/showSnackbar', {
        message: 'Đã gửi phản hồi thành công!',
        color: 'success'
      });
      
      this.replyMessage = '';
    },
    
    exportTicket() {
      // Replace with actual export functionality
      console.log(`Exporting ticket #${this.id}`);
      
      this.$store.dispatch('ui/showSnackbar', {
        message: 'Đã xuất báo cáo thành công!',
        color: 'success'
      });
    },
    
    formatDate(date) {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    },
    
    getStatusColor(status) {
      switch (status) {
        case 'open':
          return 'red';
        case 'in_progress':
          return 'orange';
        case 'closed':
          return 'green';
        default:
          return 'grey';
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 'open':
          return 'Mở';
        case 'in_progress':
          return 'Đang xử lý';
        case 'closed':
          return 'Đã đóng';
        default:
          return status;
      }
    },
    
    getPriorityColor(priority) {
      switch (priority) {
        case 'high':
          return 'red';
        case 'medium':
          return 'orange';
        case 'low':
          return 'blue';
        default:
          return 'grey';
      }
    },
    
    getPriorityText(priority) {
      switch (priority) {
        case 'high':
          return 'Cao';
        case 'medium':
          return 'Trung bình';
        case 'low':
          return 'Thấp';
        default:
          return priority;
      }
    }
  }
};
</script>

<style scoped>
.support-ticket-details {
  padding: 20px 0;
}

.ticket-content {
  background-color: #f5f5f5;
  white-space: pre-wrap;
}

.message-container {
  margin-bottom: 16px;
}

.message {
  padding: 12px;
  border-radius: 8px;
  max-width: 80%;
}

.customer-message {
  background-color: #f5f5f5;
  margin-right: auto;
}

.admin-message {
  background-color: #e3f2fd;
  margin-left: auto;
}

.message-header {
  margin-bottom: 4px;
  font-size: 0.9rem;
}

.message-content {
  white-space: pre-wrap;
}
</style>