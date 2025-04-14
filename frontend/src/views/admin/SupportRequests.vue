<template>
  <div class="support-requests">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="headline">
              Danh Sách Yêu Cầu Hỗ Trợ
              <v-spacer></v-spacer>
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Tìm kiếm"
                single-line
                hide-details
              ></v-text-field>
            </v-card-title>

            <v-card-text>
              <v-data-table
                :headers="headers"
                :items="tickets"
                :search="search"
                :loading="loading"
                :items-per-page="10"
                :footer-props="{
                  'items-per-page-options': [10, 20, 50],
                }"
                class="elevation-1"
              >
                <template v-slot:item.status="{ item }">
                  <v-chip
                    :color="getStatusColor(item.status)"
                    dark
                    small
                  >
                    {{ item.status }}
                  </v-chip>
                </template>

                <template v-slot:item.priority="{ item }">
                  <v-chip
                    :color="getPriorityColor(item.priority)"
                    dark
                    small
                  >
                    {{ item.priority }}
                  </v-chip>
                </template>

                <template v-slot:item.createdAt="{ item }">
                  {{ formatDate(item.createdAt) }}
                </template>

                <template v-slot:item.actions="{ item }">
                  <v-btn
                    small
                    color="primary"
                    text
                    @click="viewTicket(item)"
                  >
                    <v-icon small>mdi-eye</v-icon> Xem
                  </v-btn>
                  <v-btn
                    small
                    color="success"
                    text
                    @click="assignTicket(item)"
                    v-if="item.status === 'open'"
                  >
                    <v-icon small>mdi-account-check</v-icon> Tiếp nhận
                  </v-btn>
                  <v-btn
                    small
                    color="error"
                    text
                    @click="closeTicket(item)"
                    v-if="item.status !== 'closed'"
                  >
                    <v-icon small>mdi-close-circle</v-icon> Đóng
                  </v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="assignDialog" max-width="500px">
        <v-card>
          <v-card-title>Tiếp nhận yêu cầu hỗ trợ</v-card-title>
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
    </v-container>
  </div>
</template>

<script>
import { format } from 'date-fns';

export default {
  name: 'SupportRequests',
  
  data() {
    return {
      search: '',
      loading: false,
      tickets: [],
      selectedTicket: null,
      assignDialog: false,
      closeDialog: false,
      selectedStaff: null,
      staffList: [],
      closeReason: '',
      headers: [
        { text: 'ID', value: 'id', sortable: true },
        { text: 'Tiêu đề', value: 'title', sortable: true },
        { text: 'Khách hàng', value: 'customerName', sortable: true },
        { text: 'Danh mục', value: 'category', sortable: true },
        { text: 'Trạng thái', value: 'status', sortable: true },
        { text: 'Mức độ ưu tiên', value: 'priority', sortable: true },
        { text: 'Ngày tạo', value: 'createdAt', sortable: true },
        { text: 'Thao tác', value: 'actions', sortable: false }
      ]
    };
  },
  
  created() {
    this.fetchTickets();
    this.fetchStaffList();
  },
  
  methods: {
    fetchTickets() {
      this.loading = true;
      // Replace with actual API call
      setTimeout(() => {
        this.tickets = [
          {
            id: 1,
            title: 'Không thể đặt hàng',
            customerName: 'Nguyễn Văn A',
            category: 'Đặt hàng',
            status: 'open',
            priority: 'high',
            createdAt: new Date('2025-04-01T10:30:00')
          },
          {
            id: 2,
            title: 'Vấn đề với thanh toán',
            customerName: 'Trần Thị B',
            category: 'Thanh toán',
            status: 'in_progress',
            priority: 'medium',
            createdAt: new Date('2025-04-02T14:20:00')
          },
          {
            id: 3,
            title: 'Đơn hàng bị hủy',
            customerName: 'Lê Văn C',
            category: 'Đơn hàng',
            status: 'closed',
            priority: 'low',
            createdAt: new Date('2025-04-03T09:15:00')
          }
        ];
        this.loading = false;
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
    
    viewTicket(ticket) {
      this.$router.push({ name: 'SupportTicketDetails', params: { id: ticket.id } });
    },
    
    assignTicket(ticket) {
      this.selectedTicket = ticket;
      this.assignDialog = true;
    },
    
    closeTicket(ticket) {
      this.selectedTicket = ticket;
      this.closeDialog = true;
    },
    
    confirmAssign() {
      // Replace with actual API call
      console.log(`Assigning ticket #${this.selectedTicket.id} to staff #${this.selectedStaff}`);
      // Update ticket status
      const index = this.tickets.findIndex(t => t.id === this.selectedTicket.id);
      if (index !== -1) {
        this.tickets[index].status = 'in_progress';
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
      console.log(`Closing ticket #${this.selectedTicket.id} with reason: ${this.closeReason}`);
      // Update ticket status
      const index = this.tickets.findIndex(t => t.id === this.selectedTicket.id);
      if (index !== -1) {
        this.tickets[index].status = 'closed';
      }
      
      this.$store.dispatch('ui/showSnackbar', {
        message: 'Đã đóng yêu cầu hỗ trợ thành công!',
        color: 'success'
      });
      
      this.closeDialog = false;
      this.closeReason = '';
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
    }
  }
};
</script>

<style scoped>
.support-requests {
  padding: 20px 0;
}
</style>