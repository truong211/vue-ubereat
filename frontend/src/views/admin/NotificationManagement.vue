<template>
  <v-container fluid>
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center justify-space-between">
        <h1 class="text-h5">Quản lý thông báo hệ thống</h1>
        <v-btn color="primary" @click="openNotificationDialog()">
          <v-icon left>mdi-plus</v-icon>
          Tạo thông báo mới
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4">
            <v-select
              v-model="filters.type"
              :items="notificationTypes"
              label="Loại thông báo"
              outlined
              dense
              clearable
              @change="loadNotifications"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="8">
            <v-text-field
              v-model="filters.search"
              label="Tìm kiếm thông báo"
              outlined
              dense
              clearable
              append-icon="mdi-magnify"
              @keyup.enter="loadNotifications"
              @click:append="loadNotifications"
            ></v-text-field>
          </v-col>
        </v-row>
        
        <v-data-table
          :headers="headers"
          :items="notifications"
          :loading="loading"
          :server-items-length="totalNotifications"
          :footer-props="{
            'items-per-page-options': [10, 20, 50],
          }"
          :items-per-page="filters.limit"
          @update:page="page => updatePagination('page', page)"
          @update:items-per-page="limit => updatePagination('limit', limit)"
          class="elevation-1"
        >
          <template v-slot:item.title="{ item }">
            <div class="font-weight-medium">{{ item.title }}</div>
            <div class="text-caption grey--text text-truncate" style="max-width: 300px">{{ item.message }}</div>
          </template>
          
          <template v-slot:item.createdAt="{ item }">
            {{ formatDate(item.createdAt) }}
          </template>
          
          <template v-slot:item.type="{ item }">
            <v-chip small :color="getTypeColor(item.type)" text-color="white">
              {{ getTypeLabel(item.type) }}
            </v-chip>
          </template>
          
          <template v-slot:item.user="{ item }">
            <div v-if="item.user">
              {{ item.user.fullName }}
              <div class="text-caption grey--text">{{ item.user.email }}</div>
            </div>
            <div v-else class="text-caption grey--text">N/A</div>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  color="info"
                  v-bind="attrs"
                  v-on="on"
                  @click="viewNotificationDetails(item)"
                >
                  <v-icon small>mdi-eye</v-icon>
                </v-btn>
              </template>
              <span>Xem chi tiết</span>
            </v-tooltip>
            
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  icon
                  small
                  color="error"
                  v-bind="attrs"
                  v-on="on"
                  @click="confirmDeleteNotification(item)"
                >
                  <v-icon small>mdi-delete</v-icon>
                </v-btn>
              </template>
              <span>Xóa</span>
            </v-tooltip>
          </template>
          
          <template v-slot:no-data>
            <v-alert
              type="info"
              outlined
              dense
              class="ma-0"
            >
              Chưa có thông báo nào.
            </v-alert>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
    
    <!-- Create Notification Dialog -->
    <v-dialog v-model="notificationDialog" max-width="900px" persistent>
      <v-card>
        <v-card-title class="primary white--text">
          Tạo thông báo mới
          <v-spacer></v-spacer>
          <v-btn icon dark @click="closeNotificationDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pt-4">
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-container>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.title"
                    label="Tiêu đề thông báo"
                    required
                    :rules="[v => !!v || 'Tiêu đề là bắt buộc']"
                    outlined
                  ></v-text-field>
                </v-col>
                
                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedItem.type"
                    :items="notificationTypes"
                    label="Loại thông báo"
                    required
                    :rules="[v => !!v || 'Loại thông báo là bắt buộc']"
                    outlined
                  ></v-select>
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="editedItem.message"
                    label="Nội dung thông báo"
                    required
                    :rules="[v => !!v || 'Nội dung thông báo là bắt buộc']"
                    outlined
                    rows="4"
                  ></v-textarea>
                </v-col>
                
                <v-col cols="12">
                  <v-radio-group v-model="notificationTarget" row>
                    <v-radio value="specific" label="Gửi cho người dùng cụ thể"></v-radio>
                    <v-radio value="all" label="Gửi cho tất cả người dùng"></v-radio>
                  </v-radio-group>
                </v-col>
                
                <v-col cols="12" v-if="notificationTarget === 'specific'">
                  <v-autocomplete
                    v-model="selectedUsers"
                    :items="users"
                    :loading="loadingUsers"
                    :search-input.sync="userSearch"
                    item-text="fullName"
                    item-value="id"
                    label="Chọn người dùng"
                    multiple
                    chips
                    outlined
                    :rules="notificationTarget === 'specific' ? [v => v.length > 0 || 'Vui lòng chọn ít nhất một người dùng'] : []"
                  >
                    <template v-slot:selection="{ item }">
                      <v-chip small>
                        {{ item.fullName }}
                      </v-chip>
                    </template>
                    <template v-slot:item="{ item }">
                      <v-list-item-content>
                        <v-list-item-title>{{ item.fullName }}</v-list-item-title>
                        <v-list-item-subtitle>{{ item.email }}</v-list-item-subtitle>
                      </v-list-item-content>
                    </template>
                  </v-autocomplete>
                </v-col>
                
                <v-col cols="12">
                  <v-textarea
                    v-model="editedItem.data"
                    label="Dữ liệu bổ sung (JSON)"
                    outlined
                    rows="2"
                    hint="Có thể để trống nếu không có dữ liệu bổ sung"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="grey darken-1"
            text
            @click="closeNotificationDialog"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!valid"
            :loading="saving"
            @click="saveNotification"
          >
            Gửi thông báo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- View Notification Details Dialog -->
    <v-dialog v-model="detailsDialog" max-width="700px">
      <v-card>
        <v-card-title class="primary white--text">
          Chi tiết thông báo
          <v-spacer></v-spacer>
          <v-btn icon dark @click="detailsDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text class="pt-4">
          <v-list>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-subtitle class="text-caption">Tiêu đề</v-list-item-subtitle>
                <v-list-item-title class="font-weight-bold">{{ selectedItem.title }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            
            <v-divider></v-divider>
            
            <v-list-item>
              <v-list-item-content>
                <v-list-item-subtitle class="text-caption">Loại thông báo</v-list-item-subtitle>
                <v-list-item-title>
                  <v-chip small :color="getTypeColor(selectedItem.type)" text-color="white">
                    {{ getTypeLabel(selectedItem.type) }}
                  </v-chip>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            
            <v-divider></v-divider>
            
            <v-list-item>
              <v-list-item-content>
                <v-list-item-subtitle class="text-caption">Nội dung</v-list-item-subtitle>
                <v-list-item-title class="text-body-1 mt-2">{{ selectedItem.message }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            
            <v-divider></v-divider>
            
            <v-list-item v-if="selectedItem.user">
              <v-list-item-content>
                <v-list-item-subtitle class="text-caption">Người nhận</v-list-item-subtitle>
                <v-list-item-title>
                  {{ selectedItem.user.fullName }} ({{ selectedItem.user.email }})
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            
            <v-divider v-if="selectedItem.user"></v-divider>
            
            <v-list-item>
              <v-list-item-content>
                <v-list-item-subtitle class="text-caption">Thời gian gửi</v-list-item-subtitle>
                <v-list-item-title>{{ formatDateTime(selectedItem.createdAt) }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            
            <v-divider></v-divider>
            
            <v-list-item v-if="selectedItem.data">
              <v-list-item-content>
                <v-list-item-subtitle class="text-caption">Dữ liệu</v-list-item-subtitle>
                <v-list-item-title class="text-body-2 mt-2">
                  <pre>{{ JSON.stringify(selectedItem.data, null, 2) }}</pre>
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="text-h6">Xác nhận xóa thông báo?</v-card-title>
        <v-card-text>Bạn có chắc chắn muốn xóa thông báo này? Hành động này không thể hoàn tác.</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="deleteDialog = false">Hủy</v-btn>
          <v-btn color="error" text :loading="deleting" @click="deleteNotification">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { format } from 'date-fns';
import NotificationService from '@/services/notification.service';
import UserService from '@/services/user.service';

export default {
  name: 'NotificationManagement',
  
  data() {
    return {
      // Table & filters
      loading: false,
      notifications: [],
      totalNotifications: 0,
      filters: {
        page: 1,
        limit: 10,
        type: null,
        search: '',
      },
      headers: [
        { text: 'Tiêu đề & Nội dung', value: 'title', sortable: false },
        { text: 'Loại thông báo', value: 'type', sortable: false },
        { text: 'Người nhận', value: 'user', sortable: false },
        { text: 'Thời gian', value: 'createdAt', sortable: false },
        { text: 'Hành động', value: 'actions', sortable: false, align: 'center' },
      ],
      
      // Notification types
      notificationTypes: [
        { text: 'Chung', value: 'general' },
        { text: 'Đơn hàng', value: 'order' },
        { text: 'Khuyến mãi', value: 'promotion' },
        { text: 'Hệ thống', value: 'system' },
      ],
      
      // Users
      users: [],
      selectedUsers: [],
      loadingUsers: false,
      userSearch: null,
      
      // Dialog state
      notificationDialog: false,
      detailsDialog: false,
      deleteDialog: false,
      valid: true,
      saving: false,
      deleting: false,
      
      // Notification targeting
      notificationTarget: 'specific',
      
      // Selected items
      selectedItem: {},
      editedItem: {
        title: '',
        message: '',
        type: 'general',
        data: '',
      },
      defaultItem: {
        title: '',
        message: '',
        type: 'general',
        data: '',
      },
    };
  },
  
  watch: {
    userSearch(val) {
      if (val && val.length > 2) {
        this.searchUsers(val);
      }
    },
  },
  
  created() {
    this.loadNotifications();
  },
  
  methods: {
    async loadNotifications() {
      this.loading = true;
      
      try {
        const { page, limit, type, search } = this.filters;
        const params = { page, limit };
        
        if (type) params.type = type;
        if (search) params.search = search;
        
        const response = await NotificationService.getAllNotifications(params);
        
        this.notifications = response.data.notifications;
        this.totalNotifications = response.data.total;
      } catch (error) {
        console.error('Error loading notifications:', error);
        this.$store.dispatch('alert/setAlert', {
          type: 'error',
          message: 'Không thể tải danh sách thông báo. Vui lòng thử lại sau.'
        });
      } finally {
        this.loading = false;
      }
    },
    
    updatePagination(prop, value) {
      this.filters[prop] = value;
      this.loadNotifications();
    },
    
    formatDate(dateString) {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    },
    
    formatDateTime(dateString) {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
    },
    
    getTypeColor(type) {
      switch (type) {
        case 'order': return 'primary';
        case 'promotion': return 'purple';
        case 'system': return 'red';
        default: return 'blue-grey';
      }
    },
    
    getTypeLabel(type) {
      switch (type) {
        case 'order': return 'Đơn hàng';
        case 'promotion': return 'Khuyến mãi';
        case 'system': return 'Hệ thống';
        default: return 'Chung';
      }
    },
    
    async searchUsers(query) {
      this.loadingUsers = true;
      
      try {
        const response = await UserService.searchUsers(query);
        this.users = response.data;
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        this.loadingUsers = false;
      }
    },
    
    openNotificationDialog() {
      this.editedItem = Object.assign({}, this.defaultItem);
      this.selectedUsers = [];
      this.notificationTarget = 'specific';
      this.notificationDialog = true;
      
      this.$nextTick(() => {
        this.$refs.form.resetValidation();
      });
    },
    
    closeNotificationDialog() {
      this.notificationDialog = false;
      
      // Allow dialog to close before resetting data
      this.$nextTick(() => {
        this.editedItem = Object.assign({}, this.defaultItem);
        this.selectedUsers = [];
      });
    },
    
    viewNotificationDetails(item) {
      this.selectedItem = Object.assign({}, item);
      this.detailsDialog = true;
    },
    
    confirmDeleteNotification(item) {
      this.selectedItem = Object.assign({}, item);
      this.deleteDialog = true;
    },
    
    async saveNotification() {
      if (this.$refs.form.validate()) {
        this.saving = true;
        
        try {
          const notificationData = {
            title: this.editedItem.title,
            message: this.editedItem.message,
            type: this.editedItem.type,
          };
          
          // Add extra data if provided
          if (this.editedItem.data && this.editedItem.data.trim() !== '') {
            try {
              notificationData.data = JSON.parse(this.editedItem.data);
            } catch (e) {
              // If not valid JSON, store as string
              notificationData.data = this.editedItem.data;
            }
          }
          
          let response;
          
          if (this.notificationTarget === 'all') {
            // Send to all users
            response = await NotificationService.createNotificationForAllUsers(notificationData);
          } else {
            // Send to specific users
            notificationData.userIds = this.selectedUsers;
            response = await NotificationService.createBulkNotifications(notificationData);
          }
          
          this.$store.dispatch('alert/setAlert', {
            type: 'success',
            message: `Đã gửi thông báo thành công cho ${this.notificationTarget === 'all' ? 'tất cả người dùng' : this.selectedUsers.length + ' người dùng'}!`
          });
          
          this.closeNotificationDialog();
          this.loadNotifications();
        } catch (error) {
          console.error('Error sending notification:', error);
          this.$store.dispatch('alert/setAlert', {
            type: 'error',
            message: 'Không thể gửi thông báo. Vui lòng thử lại sau.'
          });
        } finally {
          this.saving = false;
        }
      }
    },
    
    async deleteNotification() {
      this.deleting = true;
      
      try {
        await NotificationService.deleteNotification(this.selectedItem.id);
        
        this.$store.dispatch('alert/setAlert', {
          type: 'success',
          message: 'Thông báo đã được xóa thành công!'
        });
        
        this.loadNotifications();
      } catch (error) {
        console.error('Error deleting notification:', error);
        this.$store.dispatch('alert/setAlert', {
          type: 'error',
          message: 'Không thể xóa thông báo. Vui lòng thử lại sau.'
        });
      } finally {
        this.deleting = false;
        this.deleteDialog = false;
      }
    }
  }
};
</script>