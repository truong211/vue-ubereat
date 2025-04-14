<template>
  <v-container fluid>
    <h1 class="text-h4 mb-4">Quản Lý Tài Khoản Khách Hàng</h1>

    <!-- Stats Cards -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4" color="primary" dark>
          <v-card-text>
            <div class="d-flex flex-column align-center">
              <div class="text-overline mb-1">TỔNG TÀI KHOẢN</div>
              <div class="text-h3 font-weight-bold">{{ stats.total || 0 }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4" color="success" dark>
          <v-card-text>
            <div class="d-flex flex-column align-center">
              <div class="text-overline mb-1">ĐANG HOẠT ĐỘNG</div>
              <div class="text-h3 font-weight-bold">{{ stats.active || 0 }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4" color="error" dark>
          <v-card-text>
            <div class="d-flex flex-column align-center">
              <div class="text-overline mb-1">ĐÃ KHÓA</div>
              <div class="text-h3 font-weight-bold">{{ stats.suspended || 0 }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="mb-4" color="warning" dark>
          <v-card-text>
            <div class="d-flex flex-column align-center">
              <div class="text-overline mb-1">BÁO CÁO</div>
              <div class="text-h3 font-weight-bold">{{ stats.reported || 0 }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="mb-4">
      <v-card-title>
        <v-icon class="mr-2">mdi-filter</v-icon>
        Bộ lọc
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6" md="4">
            <v-text-field
              v-model="filters.search"
              label="Tìm kiếm"
              prepend-inner-icon="mdi-magnify"
              clearable
              @keyup.enter="applyFilters"
              hint="Tìm theo tên, email, số điện thoại"
              persistent-hint
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Trạng thái"
              clearable
            ></v-select>
          </v-col>
          <v-col cols="12" sm="6" md="4">
            <v-select
              v-model="filters.role"
              :items="roleOptions"
              label="Vai trò"
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

    <!-- Users Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="users"
        :loading="loading"
        :items-per-page="pagination.limit"
        :page="pagination.page"
        :server-items-length="pagination.totalItems"
        @update:page="handlePageChange"
      >
        <template v-slot:item.fullName="{ item }">
          <div class="d-flex align-center">
            <v-avatar size="32" class="mr-2" color="grey-lighten-3">
              <v-img
                v-if="item.profileImage"
                :src="item.profileImage"
                alt="User Avatar"
              ></v-img>
              <span v-else>{{ getInitials(item.fullName) }}</span>
            </v-avatar>
            <div>{{ item.fullName }}</div>
          </div>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="item.status === 'active' ? 'success' : 'error'"
            size="small"
          >
            {{ item.status === 'active' ? 'Hoạt động' : 'Đã khóa' }}
          </v-chip>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip
            color="primary"
            size="small"
            variant="outlined"
          >
            {{ formatRole(item.role) }}
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
            @click="viewUser(item)"
          >
            <v-icon>mdi-eye</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            color="warning"
            @click="editUser(item)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            :color="item.status === 'active' ? 'error' : 'success'"
            @click="toggleUserStatus(item)"
          >
            <v-icon>{{ item.status === 'active' ? 'mdi-lock' : 'mdi-lock-open' }}</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- User Detail Dialog -->
    <v-dialog
      v-model="userDialog.show"
      max-width="800px"
    >
      <v-card v-if="activeUser">
        <v-toolbar
          color="primary"
          dark
        >
          <v-toolbar-title>Thông tin người dùng</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon
            @click="userDialog.show = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="pt-4">
          <v-row>
            <v-col cols="12" md="4" class="text-center">
              <v-avatar size="120" color="grey-lighten-3" class="mb-4">
                <v-img
                  v-if="activeUser.profileImage"
                  :src="activeUser.profileImage"
                  alt="User Avatar"
                ></v-img>
                <span v-else class="text-h4">{{ getInitials(activeUser.fullName) }}</span>
              </v-avatar>
              
              <div class="text-h6 mb-1">{{ activeUser.fullName }}</div>
              <v-chip
                :color="activeUser.status === 'active' ? 'success' : 'error'"
                class="mb-4"
              >
                {{ activeUser.status === 'active' ? 'Hoạt động' : 'Đã khóa' }}
              </v-chip>
              
              <v-btn
                block
                :color="activeUser.status === 'active' ? 'error' : 'success'"
                class="mb-2"
                @click="toggleUserStatus(activeUser)"
              >
                {{ activeUser.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản' }}
              </v-btn>
              
              <v-btn
                block
                color="primary"
                class="mb-2"
                @click="editUser(activeUser)"
              >
                Chỉnh sửa
              </v-btn>
            </v-col>
            
            <v-col cols="12" md="8">
              <v-card variant="outlined" class="mb-4">
                <v-card-text>
                  <div class="d-flex align-center mb-2">
                    <v-icon class="mr-2">mdi-account</v-icon>
                    <span class="text-subtitle-1 font-weight-bold">Thông tin cá nhân</span>
                  </div>
                  
                  <v-list>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-email</v-icon>
                      </template>
                      <v-list-item-title>Email</v-list-item-title>
                      <v-list-item-subtitle>{{ activeUser.email }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item v-if="activeUser.phone">
                      <template v-slot:prepend>
                        <v-icon>mdi-phone</v-icon>
                      </template>
                      <v-list-item-title>Số điện thoại</v-list-item-title>
                      <v-list-item-subtitle>{{ activeUser.phone }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-account-details</v-icon>
                      </template>
                      <v-list-item-title>Vai trò</v-list-item-title>
                      <v-list-item-subtitle>{{ formatRole(activeUser.role) }}</v-list-item-subtitle>
                    </v-list-item>
                    
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon>mdi-calendar</v-icon>
                      </template>
                      <v-list-item-title>Ngày tạo</v-list-item-title>
                      <v-list-item-subtitle>{{ formatDate(activeUser.createdAt) }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
              
              <v-card variant="outlined" class="mb-4">
                <v-card-text>
                  <div class="d-flex align-center mb-2">
                    <v-icon class="mr-2">mdi-history</v-icon>
                    <span class="text-subtitle-1 font-weight-bold">Hoạt động gần đây</span>
                  </div>
                  
                  <div v-if="userActivity.length > 0">
                    <v-timeline density="compact" align="start">
                      <v-timeline-item
                        v-for="activity in userActivity"
                        :key="activity.id"
                        :dot-color="getActivityColor(activity.type)"
                        size="small"
                      >
                        <div class="d-flex align-center">
                          <div>
                            <div class="text-body-2">{{ activity.description }}</div>
                            <div class="text-caption">{{ formatDateTime(activity.createdAt) }}</div>
                          </div>
                        </div>
                      </v-timeline-item>
                    </v-timeline>
                  </div>
                  <div v-else class="text-center py-4">
                    <v-icon size="large" color="grey-lighten-1">mdi-calendar-blank</v-icon>
                    <div class="text-body-2 text-grey mt-2">Không có hoạt động nào gần đây</div>
                  </div>
                </v-card-text>
              </v-card>
              
              <v-card variant="outlined">
                <v-card-text>
                  <div class="d-flex align-center mb-2">
                    <v-icon class="mr-2">mdi-shopping</v-icon>
                    <span class="text-subtitle-1 font-weight-bold">Thống kê đơn hàng</span>
                  </div>
                  
                  <v-row>
                    <v-col cols="6" md="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold">{{ userStats.totalOrders || 0 }}</div>
                        <div class="text-caption">Tổng đơn hàng</div>
                      </div>
                    </v-col>
                    <v-col cols="6" md="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold">{{ formatCurrency(userStats.totalSpent || 0) }}</div>
                        <div class="text-caption">Tổng chi tiêu</div>
                      </div>
                    </v-col>
                    <v-col cols="6" md="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold">{{ userStats.cancelRate || 0 }}%</div>
                        <div class="text-caption">Tỷ lệ hủy</div>
                      </div>
                    </v-col>
                    <v-col cols="6" md="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold">{{ userStats.avgOrderValue ? formatCurrency(userStats.avgOrderValue) : 0 }}</div>
                        <div class="text-caption">Giá trị TB</div>
                      </div>
                    </v-col>
                  </v-row>
                  
                  <v-btn
                    block
                    variant="text"
                    color="primary"
                    class="mt-4"
                    @click="viewUserOrders(activeUser.id)"
                  >
                    Xem tất cả đơn hàng
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- User Edit Dialog -->
    <v-dialog
      v-model="editDialog.show"
      max-width="600px"
    >
      <v-card>
        <v-toolbar
          color="primary"
          dark
        >
          <v-toolbar-title>{{ editDialog.isNew ? 'Thêm người dùng mới' : 'Chỉnh sửa người dùng' }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon
            @click="editDialog.show = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-card-text class="pt-4">
          <v-form ref="userForm" @submit.prevent="saveUser">
            <v-text-field
              v-model="editDialog.user.fullName"
              label="Họ tên"
              required
              :rules="[v => !!v || 'Họ tên là bắt buộc']"
            ></v-text-field>
            
            <v-text-field
              v-model="editDialog.user.email"
              label="Email"
              type="email"
              required
              :rules="[
                v => !!v || 'Email là bắt buộc',
                v => /.+@.+\..+/.test(v) || 'Email không hợp lệ'
              ]"
            ></v-text-field>
            
            <v-text-field
              v-if="editDialog.isNew"
              v-model="editDialog.user.password"
              label="Mật khẩu"
              type="password"
              hint="Để trống để sử dụng mật khẩu mặc định"
              persistent-hint
            ></v-text-field>
            
            <v-text-field
              v-model="editDialog.user.phone"
              label="Số điện thoại"
            ></v-text-field>
            
            <v-select
              v-model="editDialog.user.role"
              :items="roleOptions"
              label="Vai trò"
              required
              :rules="[v => !!v || 'Vai trò là bắt buộc']"
            ></v-select>
            
            <v-select
              v-model="editDialog.user.status"
              :items="statusOptions"
              label="Trạng thái"
              required
              :rules="[v => !!v || 'Trạng thái là bắt buộc']"
            ></v-select>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="editDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="editDialog.loading"
            @click="saveUser"
          >
            Lưu
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Status Change Dialog -->
    <v-dialog
      v-model="statusDialog.show"
      max-width="500px"
    >
      <v-card>
        <v-card-title>
          {{ statusDialog.action === 'suspend' ? 'Khóa tài khoản' : 'Mở khóa tài khoản' }}
        </v-card-title>
        
        <v-card-text>
          <p v-if="statusDialog.action === 'suspend'">
            Bạn có chắc chắn muốn khóa tài khoản của người dùng này? Họ sẽ không thể đăng nhập hoặc sử dụng dịch vụ cho đến khi tài khoản được mở khóa.
          </p>
          <p v-else>
            Bạn có chắc chắn muốn mở khóa tài khoản của người dùng này? Họ sẽ có thể đăng nhập và sử dụng dịch vụ bình thường.
          </p>
          
          <v-textarea
            v-if="statusDialog.action === 'suspend'"
            v-model="statusDialog.reason"
            label="Lý do (tùy chọn)"
            rows="3"
            class="mt-4"
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="statusDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            :color="statusDialog.action === 'suspend' ? 'error' : 'success'"
            :loading="statusDialog.loading"
            @click="confirmStatusChange"
          >
            {{ statusDialog.action === 'suspend' ? 'Khóa tài khoản' : 'Mở khóa tài khoản' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useToast } from 'vue-toastification'

const store = useStore()
const router = useRouter()
const toast = useToast()

// Data
const users = ref([])
const loading = ref(false)
const pagination = ref({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 1
})
const filters = ref({
  status: null,
  role: null,
  search: ''
})
const userDialog = ref({
  show: false
})
const editDialog = ref({
  show: false,
  isNew: false,
  loading: false,
  user: {}
})
const statusDialog = ref({
  show: false,
  action: null,
  user: null,
  reason: '',
  loading: false
})
const activeUser = ref(null)
const userActivity = ref([])
const userStats = ref({
  totalOrders: 0,
  totalSpent: 0,
  cancelRate: 0,
  avgOrderValue: 0
})
const stats = ref({
  total: 0,
  active: 0,
  suspended: 0,
  reported: 0
})

// Options
const statusOptions = [
  { title: 'Hoạt động', value: 'active' },
  { title: 'Đã khóa', value: 'suspended' }
]

const roleOptions = [
  { title: 'Khách hàng', value: 'customer' },
  { title: 'Nhà hàng', value: 'restaurant' },
  { title: 'Tài xế', value: 'driver' },
  { title: 'Quản trị viên', value: 'admin' }
]

const headers = [
  { title: 'Họ tên', key: 'fullName' },
  { title: 'Email', key: 'email' },
  { title: 'SĐT', key: 'phone' },
  { title: 'Vai trò', key: 'role', width: '120px' },
  { title: 'Trạng thái', key: 'status', width: '120px' },
  { title: 'Ngày tạo', key: 'createdAt', width: '150px' },
  { title: 'Thao tác', key: 'actions', sortable: false, width: '120px' }
]

// Methods
const fetchUsers = async () => {
  try {
    loading.value = true
    
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      status: filters.value.status,
      role: filters.value.role,
      search: filters.value.search
    }
    
    const response = await store.dispatch('users/fetchUsers', params)
    
    users.value = response.data
    pagination.value.totalItems = response.total
    pagination.value.totalPages = Math.ceil(response.total / pagination.value.limit)
  } catch (error) {
    toast.error('Không thể tải danh sách người dùng')
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

const fetchUserStats = async () => {
  try {
    const response = await store.dispatch('users/fetchUserStats')
    stats.value = response
  } catch (error) {
    console.error('Failed to fetch user stats:', error)
  }
}

const handlePageChange = (page) => {
  pagination.value.page = page
  fetchUsers()
}

const applyFilters = () => {
  pagination.value.page = 1
  fetchUsers()
}

const resetFilters = () => {
  filters.value = {
    status: null,
    role: null,
    search: ''
  }
  applyFilters()
}

const viewUser = async (user) => {
  try {
    loading.value = true
    
    // Fetch full user details
    const fullUser = await store.dispatch('users/getUserById', user.id)
    activeUser.value = fullUser
    
    // Fetch user activity
    userActivity.value = await store.dispatch('users/getUserActivity', user.id)
    
    // Fetch user stats
    userStats.value = await store.dispatch('users/getUserStats', user.id)
    
    userDialog.value.show = true
  } catch (error) {
    toast.error('Không thể tải thông tin người dùng')
    console.error('Failed to view user:', error)
  } finally {
    loading.value = false
  }
}

const editUser = (user) => {
  editDialog.value = {
    show: true,
    isNew: false,
    loading: false,
    user: { ...user }
  }
}

const createUser = () => {
  editDialog.value = {
    show: true,
    isNew: true,
    loading: false,
    user: {
      fullName: '',
      email: '',
      password: '',
      phone: '',
      role: 'customer',
      status: 'active'
    }
  }
}

const saveUser = async () => {
  try {
    editDialog.value.loading = true
    
    if (editDialog.value.isNew) {
      await store.dispatch('users/createUser', editDialog.value.user)
      toast.success('Tạo người dùng thành công')
    } else {
      await store.dispatch('users/updateUser', {
        id: editDialog.value.user.id,
        userData: editDialog.value.user
      })
      toast.success('Cập nhật người dùng thành công')
    }
    
    editDialog.value.show = false
    fetchUsers()
    
    // Update active user if it's the same user
    if (activeUser.value && activeUser.value.id === editDialog.value.user.id) {
      activeUser.value = { ...activeUser.value, ...editDialog.value.user }
    }
  } catch (error) {
    toast.error('Không thể lưu thông tin người dùng')
    console.error('Failed to save user:', error)
  } finally {
    editDialog.value.loading = false
  }
}

const toggleUserStatus = (user) => {
  const newAction = user.status === 'active' ? 'suspend' : 'reactivate'
  
  statusDialog.value = {
    show: true,
    action: newAction,
    user,
    reason: '',
    loading: false
  }
}

const confirmStatusChange = async () => {
  try {
    statusDialog.value.loading = true
    
    await store.dispatch('users/updateUserStatus', {
      id: statusDialog.value.user.id,
      status: statusDialog.value.action === 'suspend' ? 'suspended' : 'active',
      reason: statusDialog.value.reason
    })
    
    toast.success(
      statusDialog.value.action === 'suspend'
        ? 'Đã khóa tài khoản'
        : 'Đã mở khóa tài khoản'
    )
    
    statusDialog.value.show = false
    fetchUsers()
    
    // Update active user if it's the same user
    if (activeUser.value && activeUser.value.id === statusDialog.value.user.id) {
      activeUser.value.status = statusDialog.value.action === 'suspend' ? 'suspended' : 'active'
    }
  } catch (error) {
    toast.error('Không thể thay đổi trạng thái người dùng')
    console.error('Failed to change user status:', error)
  } finally {
    statusDialog.value.loading = false
  }
}

const viewUserOrders = (userId) => {
  router.push(`/admin/orders?userId=${userId}`)
}

// Formatters
const formatRole = (role) => {
  const roleMap = {
    customer: 'Khách hàng',
    restaurant: 'Nhà hàng',
    driver: 'Tài xế',
    admin: 'Quản trị viên'
  }
  return roleMap[role] || role
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi })
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value)
}

const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

const getActivityColor = (type) => {
  const colorMap = {
    order: 'primary',
    login: 'success',
    payment: 'purple',
    account: 'info',
    support: 'warning'
  }
  return colorMap[type] || 'grey'
}

// Lifecycle hooks
onMounted(async () => {
  await fetchUsers()
  await fetchUserStats()
})
</script>
