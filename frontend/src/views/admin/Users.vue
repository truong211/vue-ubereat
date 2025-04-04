<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h4">Quản Lý Người Dùng</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-account-plus"
        @click="openUserDialog()"
      >
        Thêm người dùng
      </v-btn>
    </div>

    <!-- Search and Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="searchQuery"
              label="Tìm kiếm"
              prepend-inner-icon="mdi-magnify"
              clearable
              @input="handleSearch"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="roleFilter"
              :items="roleOptions"
              label="Vai trò"
              clearable
              @update:model-value="fetchUsers"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="statusFilter"
              :items="statusOptions"
              label="Trạng thái"
              clearable
              @update:model-value="fetchUsers"
            ></v-select>
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
        :items-per-page="itemsPerPage"
        :page="page"
        :server-items-length="totalUsers"
        @update:page="handlePageChange"
      >
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            @click="openUserDialog(item)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            :color="item.status === 'active' ? 'error' : 'success'"
            @click="openActionDialog(item, item.status === 'active' ? 'suspend' : 'reactivate')"
          >
            <v-icon>{{ item.status === 'active' ? 'mdi-lock' : 'mdi-lock-open' }}</v-icon>
          </v-btn>
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
      </v-data-table>
    </v-card>

    <!-- User Edit Dialog -->
    <v-dialog v-model="userDialog.show" max-width="600">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ userDialog.isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới' }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="userForm">
            <v-text-field
              v-model="userDialog.user.fullName"
              label="Họ tên"
              required
            ></v-text-field>
            <v-text-field
              v-model="userDialog.user.email"
              label="Email"
              type="email"
              required
            ></v-text-field>
            <v-text-field
              v-if="!userDialog.isEdit"
              v-model="userDialog.user.password"
              label="Mật khẩu"
              type="password"
              hint="Để trống để sử dụng mật khẩu mặc định: changeme123"
              persistent-hint
            ></v-text-field>
            <v-text-field
              v-model="userDialog.user.phone"
              label="Số điện thoại"
            ></v-text-field>
            <v-select
              v-model="userDialog.user.role"
              :items="roleOptions"
              label="Vai trò"
              required
            ></v-select>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="userDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            @click="saveUser"
            :loading="userDialog.loading"
          >
            Lưu
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Action Confirmation Dialog -->
    <v-dialog v-model="actionDialog.show" max-width="500">
      <v-card>
        <v-card-title>{{ getActionTitle }}</v-card-title>
        <v-card-text>
          <v-textarea
            v-if="actionDialog.action === 'suspend'"
            v-model="actionDialog.reason"
            label="Lý do"
            rows="3"
            required
          ></v-textarea>
          <p v-else>
            Bạn có chắc chắn muốn {{ actionDialog.action === 'suspend' ? 'khóa' : 'mở khóa' }} tài khoản này?
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="actionDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            :color="actionDialog.action === 'suspend' ? 'error' : 'success'"
            variant="text"
            @click="confirmAction"
            :loading="actionDialog.loading"
          >
            Xác nhận
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useToast } from 'vue-toastification'
import { useStore } from 'vuex';

const toast = useToast()
const store = useStore();

// Table configuration
const headers = [
  { title: 'Họ tên', key: 'fullName' },
  { title: 'Email', key: 'email' },
  { title: 'SĐT', key: 'phone' },
  { title: 'Vai trò', key: 'role' },
  { title: 'Trạng thái', key: 'status' },
  { title: 'Ngày tạo', key: 'createdAt' },
  { title: 'Thao tác', key: 'actions', sortable: false }
]

// State
const loading = ref(false)
const users = ref([])
const totalUsers = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref('')
const roleFilter = ref(null)
const statusFilter = ref(null)

const roleOptions = [
  { title: 'Khách hàng', value: 'customer' },
  { title: 'Nhà hàng', value: 'restaurant' },
  { title: 'Tài xế', value: 'driver' },
  { title: 'Quản trị viên', value: 'admin' }
]

const statusOptions = [
  { title: 'Đang hoạt động', value: 'active' },
  { title: 'Đã khóa', value: 'suspended' }
]

// Dialog states
const userDialog = ref({
  show: false,
  isEdit: false,
  loading: false,
  user: {}
})

const actionDialog = ref({
  show: false,
  action: null,
  user: null,
  reason: '',
  loading: false
})

// Computed
const getActionTitle = computed(() => {
  if (actionDialog.value.action === 'suspend') {
    return 'Khóa tài khoản'
  }
  return 'Mở khóa tài khoản'
})

// Methods
const fetchUsers = async () => {
  try {
    loading.value = true;
    await store.dispatch('users/fetchUsers', {
      page: page.value,
      limit: itemsPerPage.value
    });
  } catch (error) {
    toast.error('Không thể tải danh sách người dùng');
    console.error('Failed to fetch users:', error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (newPage) => {
  page.value = newPage;
  store.dispatch('users/fetchUsers', {
    page: newPage,
    limit: itemsPerPage.value
  });
};

const handleSearch = () => {
  store.dispatch('users/setFilters', {
    search: searchQuery.value,
    role: roleFilter.value,
    status: statusFilter.value
  });
};

const openUserDialog = (user = null) => {
  userDialog.value = {
    show: true,
    isEdit: !!user,
    loading: false,
    user: user ? { ...user } : {
      fullName: '',
      email: '',
      username: '',
      password: '',
      phone: '',
      role: 'customer'
    }
  }
}

const saveUser = async () => {
  try {
    userDialog.value.loading = true;
    const userData = userDialog.value.user;
    
    if (userDialog.value.isEdit) {
      await store.dispatch('users/updateUser', {
        id: userData.id,
        userData
      });
      toast.success('Cập nhật thành công');
    } else {
      await store.dispatch('users/createUser', userData);
      toast.success('Thêm mới thành công');
    }
    
    userDialog.value.show = false;
    fetchUsers();
  } catch (error) {
    toast.error('Không thể lưu thông tin người dùng');
    console.error('Failed to save user:', error);
  } finally {
    userDialog.value.loading = false;
  }
};

const openActionDialog = (user, action) => {
  actionDialog.value = {
    show: true,
    action,
    user,
    reason: '',
    loading: false
  }
}

const confirmAction = async () => {
  try {
    actionDialog.value.loading = true;
    await store.dispatch('users/updateUserStatus', {
      id: actionDialog.value.user.id,
      status: actionDialog.value.action === 'suspend' ? 'suspended' : 'active',
      reason: actionDialog.value.reason
    });
    
    toast.success(
      actionDialog.value.action === 'suspend'
        ? 'Đã khóa tài khoản'
        : 'Đã mở khóa tài khoản'
    );
    actionDialog.value.show = false;
    fetchUsers();
  } catch (error) {
    toast.error('Không thể thực hiện thao tác');
    console.error('Failed to perform action:', error);
  } finally {
    actionDialog.value.loading = false;
  }
};

const getStatusColor = (status) => {
  return status === 'active' ? 'success' : 'error'
}

const formatStatus = (status) => {
  const statusMap = {
    active: 'Đang hoạt động',
    suspended: 'Đã khóa'
  }
  return statusMap[status] || status
}

const formatDate = (date) => {
  return format(new Date(date), 'HH:mm - dd/MM/yyyy', { locale: vi })
}

// Lifecycle
onMounted(() => {
  fetchUsers()
})
</script>
