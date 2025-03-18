<template>
  <div class="user-management">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4">User Management</h1>
      
      <div class="d-flex">
        <v-btn
          color="primary"
          prepend-icon="mdi-account-plus"
          class="mr-2"
          @click="openAddUserDialog"
        >
          Add User
        </v-btn>
        <v-btn
          variant="outlined"
          prepend-icon="mdi-file-export"
          @click="exportUsers"
        >
          Export
        </v-btn>
      </div>
    </div>

    <!-- Filters -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-text-field
              v-model="filters.search"
              label="Search Users"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="compact"
              hide-details
              @input="debouncedSearch"
              clearable
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.role"
              label="Role"
              :items="roleOptions"
              variant="outlined"
              density="compact"
              hide-details
              @update:modelValue="fetchUsers"
              clearable
            ></v-select>
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="filters.status"
              label="Status"
              :items="statusOptions"
              variant="outlined"
              density="compact"
              hide-details
              @update:modelValue="fetchUsers"
              clearable
            ></v-select>
          </v-col>
          
          <v-col cols="12" md="3">
            <v-select
              v-model="sortBy"
              label="Sort By"
              :items="sortOptions"
              variant="outlined"
              density="compact"
              hide-details
              @update:modelValue="fetchUsers"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center my-12">
      <v-progress-circular indeterminate size="64"></v-progress-circular>
    </div>

    <!-- Error Message -->
    <v-alert
      v-else-if="error"
      type="error"
      variant="tonal"
      class="mb-6"
    >
      {{ error }}
      <template v-slot:append>
        <v-btn variant="text" @click="fetchUsers">Retry</v-btn>
      </template>
    </v-alert>

    <!-- Data Table -->
    <v-card v-else>
      <v-data-table
        :headers="headers"
        :items="users"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="elevation-1"
        item-value="id"
      >
        <template v-slot:item.avatar="{ item }">
          <v-avatar size="40">
            <v-img
              v-if="item.avatarUrl"
              :src="item.avatarUrl"
              alt="User avatar"
            ></v-img>
            <v-icon v-else icon="mdi-account" />
          </v-avatar>
        </template>

        <template v-slot:item.name="{ item }">
          <div>
            <div>{{ item.firstName }} {{ item.lastName }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.email }}</div>
          </div>
        </template>

        <template v-slot:item.role="{ item }">
          <v-chip 
            :color="getRoleColor(item.role)" 
            size="small"
          >
            {{ formatRole(item.role) }}
          </v-chip>
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

        <template v-slot:item.actions="{ item }">
          <div class="d-flex">
            <v-tooltip text="View Profile">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-account-details"
                  variant="text"
                  density="compact"
                  v-bind="props"
                  @click="viewUser(item)"
                ></v-btn>
              </template>
            </v-tooltip>

            <v-tooltip text="Edit User">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  density="compact"
                  v-bind="props"
                  @click="editUser(item)"
                ></v-btn>
              </template>
            </v-tooltip>

            <v-tooltip :text="item.status === 'active' ? 'Suspend User' : 'Activate User'">
              <template v-slot:activator="{ props }">
                <v-btn
                  :icon="item.status === 'active' ? 'mdi-lock' : 'mdi-lock-open'"
                  :color="item.status === 'active' ? 'warning' : 'success'"
                  variant="text"
                  density="compact"
                  v-bind="props"
                  @click="toggleUserStatus(item)"
                ></v-btn>
              </template>
            </v-tooltip>

            <v-tooltip text="Delete User">
              <template v-slot:activator="{ props }">
                <v-btn
                  icon="mdi-delete"
                  color="error"
                  variant="text"
                  density="compact"
                  v-bind="props"
                  @click="confirmDelete(item)"
                ></v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>
      </v-data-table>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-select
          v-model="itemsPerPage"
          :items="[5, 10, 25, 50, 100]"
          label="Items per page"
          variant="outlined"
          density="compact"
          hide-details
          class="max-width-100 mx-2"
        ></v-select>
        <v-pagination
          v-model="page"
          :length="totalPages"
          rounded="circle"
        ></v-pagination>
      </v-card-actions>
    </v-card>

    <!-- User Form Dialog -->
    <v-dialog v-model="dialogs.userForm.show" max-width="600">
      <v-card>
        <v-card-title>
          {{ dialogs.userForm.isEdit ? 'Edit User' : 'Add New User' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="userForm" v-model="dialogs.userForm.isValid" @submit.prevent="saveUser">
            <!-- Form Fields -->
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dialogs.userForm.userData.firstName"
                  label="First Name"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="dialogs.userForm.userData.lastName"
                  label="Last Name"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="dialogs.userForm.userData.email"
                  label="Email"
                  type="email"
                  :rules="[rules.required, rules.email]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="dialogs.userForm.userData.phone"
                  label="Phone Number"
                  type="tel"
                  :rules="[rules.phone]"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" v-if="!dialogs.userForm.isEdit">
                <v-text-field
                  v-model="dialogs.userForm.userData.password"
                  label="Password"
                  type="password"
                  :rules="[rules.required, rules.password]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-select
                  v-model="dialogs.userForm.userData.role"
                  label="Role"
                  :items="roleOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12">
                <v-select
                  v-model="dialogs.userForm.userData.status"
                  label="Status"
                  :items="statusOptions"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogs.userForm.show = false">Cancel</v-btn>
          <v-btn 
            color="primary" 
            :disabled="!dialogs.userForm.isValid || dialogs.userForm.loading" 
            :loading="dialogs.userForm.loading"
            @click="saveUser"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- User View Dialog -->
    <v-dialog v-model="dialogs.userView.show" max-width="700">
      <v-card>
        <v-card-title class="d-flex justify-space-between">
          User Profile
          <v-btn icon="mdi-close" variant="text" @click="dialogs.userView.show = false"></v-btn>
        </v-card-title>
        
        <v-card-text v-if="dialogs.userView.userData">
          <div class="d-flex flex-column align-center mb-6">
            <v-avatar size="80" class="mb-3">
              <v-img
                v-if="dialogs.userView.userData.avatarUrl"
                :src="dialogs.userView.userData.avatarUrl"
                alt="User avatar"
              ></v-img>
              <v-icon v-else icon="mdi-account" size="48"></v-icon>
            </v-avatar>
            <h2 class="text-h5">{{ dialogs.userView.userData.firstName }} {{ dialogs.userView.userData.lastName }}</h2>
            <v-chip :color="getRoleColor(dialogs.userView.userData.role)" class="mt-2">
              {{ formatRole(dialogs.userView.userData.role) }}
            </v-chip>
          </div>
          
          <v-divider></v-divider>
          
          <v-list lines="two">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-email"></v-icon>
              </template>
              <v-list-item-title>Email</v-list-item-title>
              <v-list-item-subtitle>{{ dialogs.userView.userData.email }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item v-if="dialogs.userView.userData.phone">
              <template v-slot:prepend>
                <v-icon icon="mdi-phone"></v-icon>
              </template>
              <v-list-item-title>Phone</v-list-item-title>
              <v-list-item-subtitle>{{ dialogs.userView.userData.phone }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-calendar"></v-icon>
              </template>
              <v-list-item-title>Member Since</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(dialogs.userView.userData.createdAt) }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item>
              <template v-slot:prepend>
                <v-icon icon="mdi-check-circle"></v-icon>
              </template>
              <v-list-item-title>Account Status</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip :color="getStatusColor(dialogs.userView.userData.status)" size="small">
                  {{ formatStatus(dialogs.userView.userData.status) }}
                </v-chip>
              </v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item v-if="dialogs.userView.userData.lastLogin">
              <template v-slot:prepend>
                <v-icon icon="mdi-login"></v-icon>
              </template>
              <v-list-item-title>Last Login</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(dialogs.userView.userData.lastLogin) }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item v-if="dialogs.userView.userData.ordersCount !== undefined">
              <template v-slot:prepend>
                <v-icon icon="mdi-cart"></v-icon>
              </template>
              <v-list-item-title>Total Orders</v-list-item-title>
              <v-list-item-subtitle>{{ dialogs.userView.userData.ordersCount }}</v-list-item-subtitle>
            </v-list-item>
            
            <v-list-item v-if="dialogs.userView.userData.totalSpent !== undefined">
              <template v-slot:prepend>
                <v-icon icon="mdi-currency-usd"></v-icon>
              </template>
              <v-list-item-title>Total Spent</v-list-item-title>
              <v-list-item-subtitle>${{ dialogs.userView.userData.totalSpent.toFixed(2) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="editUser(dialogs.userView.userData)">
            Edit User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogs.deleteConfirm.show" max-width="450">
      <v-card>
        <v-card-title class="bg-error text-white">
          Confirm Delete
        </v-card-title>
        
        <v-card-text class="pt-4">
          <p>Are you sure you want to delete this user?</p>
          <p class="font-weight-bold mt-2" v-if="dialogs.deleteConfirm.user">
            {{ dialogs.deleteConfirm.user.firstName }} {{ dialogs.deleteConfirm.user.lastName }} ({{ dialogs.deleteConfirm.user.email }})
          </p>
          <p class="text-caption mt-3 text-error">
            This action cannot be undone. All user data will be permanently removed.
          </p>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogs.deleteConfirm.show = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            :loading="dialogs.deleteConfirm.loading" 
            @click="deleteUser"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import { format } from 'date-fns';
import { debounce } from 'lodash';

export default {
  name: 'UserManagement',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    const userForm = ref(null);
    
    // Data
    const users = ref([]);
    const loading = ref(false);
    const error = ref('');
    const page = ref(1);
    const itemsPerPage = ref(10);
    const totalPages = ref(1);
    const totalUsers = ref(0);
    
    // Filters
    const filters = reactive({
      search: '',
      role: null,
      status: null
    });
    
    const sortBy = ref('createdAt:desc');
    
    // Dialogs state
    const dialogs = reactive({
      userForm: {
        show: false,
        isEdit: false,
        isValid: false,
        loading: false,
        userData: {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          password: '',
          role: 'customer',
          status: 'active'
        }
      },
      userView: {
        show: false,
        userData: null
      },
      deleteConfirm: {
        show: false,
        loading: false,
        user: null
      }
    });
    
    // Table headers
    const headers = [
      { title: '', key: 'avatar', sortable: false, width: '60px' },
      { title: 'Name', key: 'name', sortable: false },
      { title: 'Role', key: 'role', sortable: true, align: 'center' },
      { title: 'Status', key: 'status', sortable: true, align: 'center' },
      { title: 'Created', key: 'createdAt', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
    ];
    
    // Options
    const roleOptions = ['admin', 'customer', 'restaurant', 'driver'];
    const statusOptions = ['active', 'inactive', 'suspended', 'pending'];
    const sortOptions = [
      { title: 'Newest First', value: 'createdAt:desc' },
      { title: 'Oldest First', value: 'createdAt:asc' },
      { title: 'Name A-Z', value: 'firstName:asc' },
      { title: 'Name Z-A', value: 'firstName:desc' },
      { title: 'Email A-Z', value: 'email:asc' },
      { title: 'Email Z-A', value: 'email:desc' }
    ];
    
    // Validation rules
    const rules = {
      required: v => !!v || 'Field is required',
      email: v => /.+@.+\..+/.test(v) || 'Email must be valid',
      phone: v => !v || /^\+?[\d\s-]{10,15}$/.test(v) || 'Phone number must be valid',
      password: v => !v || v.length >= 8 || 'Password must be at least 8 characters'
    };
    
    // Methods
    const fetchUsers = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const [field, direction] = sortBy.value.split(':');
        
        const params = {
          page: page.value,
          limit: itemsPerPage.value,
          sortField: field,
          sortDirection: direction,
          search: filters.search || undefined,
          role: filters.role || undefined,
          status: filters.status || undefined
        };
        
        const response = await store.dispatch('admin/fetchUsers', params);
        
        users.value = response.data;
        totalUsers.value = response.total;
        totalPages.value = Math.ceil(response.total / itemsPerPage.value);
      } catch (err) {
        console.error('Error fetching users:', err);
        error.value = 'Failed to load users. Please try again.';
      } finally {
        loading.value = false;
      }
    };
    
    // Create debounced search
    const debouncedSearch = debounce(() => {
      fetchUsers();
    }, 500);
    
    const resetUserForm = () => {
      dialogs.userForm.userData = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        role: 'customer',
        status: 'active'
      };
      
      if (userForm.value) {
        userForm.value.reset();
      }
    };
    
    const openAddUserDialog = () => {
      resetUserForm();
      dialogs.userForm.isEdit = false;
      dialogs.userForm.show = true;
    };
    
    const editUser = (user) => {
      dialogs.userForm.userData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.status
      };
      
      dialogs.userForm.isEdit = true;
      dialogs.userForm.show = true;
      
      // Close view dialog if open
      if (dialogs.userView.show) {
        dialogs.userView.show = false;
      }
    };
    
    const viewUser = async (user) => {
      try {
        const userData = await store.dispatch('admin/getUserDetails', user.id);
        dialogs.userView.userData = userData;
        dialogs.userView.show = true;
      } catch (err) {
        console.error('Error fetching user details:', err);
        toast.error('Failed to load user details');
      }
    };
    
    const saveUser = async () => {
      if (!dialogs.userForm.isValid) return;
      
      dialogs.userForm.loading = true;
      
      try {
        if (dialogs.userForm.isEdit) {
          await store.dispatch('admin/updateUser', {
            id: dialogs.userForm.userData.id,
            userData: dialogs.userForm.userData
          });
          toast.success('User updated successfully');
        } else {
          await store.dispatch('admin/createUser', dialogs.userForm.userData);
          toast.success('User created successfully');
        }
        
        dialogs.userForm.show = false;
        fetchUsers();
      } catch (err) {
        console.error('Error saving user:', err);
        toast.error(err.response?.data?.message || 'Failed to save user');
      } finally {
        dialogs.userForm.loading = false;
      }
    };
    
    const toggleUserStatus = async (user) => {
      try {
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        await store.dispatch('admin/updateUserStatus', {
          id: user.id,
          status: newStatus
        });
        
        // Update in the local array
        const index = users.value.findIndex(u => u.id === user.id);
        if (index !== -1) {
          users.value[index].status = newStatus;
        }
        
        toast.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      } catch (err) {
        console.error('Error updating user status:', err);
        toast.error('Failed to update user status');
      }
    };
    
    const confirmDelete = (user) => {
      dialogs.deleteConfirm.user = user;
      dialogs.deleteConfirm.show = true;
    };
    
    const deleteUser = async () => {
      if (!dialogs.deleteConfirm.user) return;
      
      dialogs.deleteConfirm.loading = true;
      
      try {
        await store.dispatch('admin/deleteUser', dialogs.deleteConfirm.user.id);
        toast.success('User deleted successfully');
        
        dialogs.deleteConfirm.show = false;
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        toast.error('Failed to delete user');
      } finally {
        dialogs.deleteConfirm.loading = false;
      }
    };
    
    const exportUsers = async () => {
      try {
        await store.dispatch('admin/exportUsers', {
          role: filters.role || undefined,
          status: filters.status || undefined,
          search: filters.search || undefined
        });
        
        toast.success('User export started. You will receive an email when ready.');
      } catch (err) {
        console.error('Error exporting users:', err);
        toast.error('Failed to export users');
      }
    };
    
    // Formatting helpers
    const formatRole = (role) => {
      const roles = {
        admin: 'Administrator',
        customer: 'Customer',
        restaurant: 'Restaurant Manager',
        driver: 'Delivery Driver'
      };
      return roles[role] || role;
    };
    
    const formatStatus = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1);
    };
    
    const formatDate = (dateString) => {
      try {
        return format(new Date(dateString), 'MMM d, yyyy');
      } catch (e) {
        return 'Invalid Date';
      }
    };
    
    const getRoleColor = (role) => {
      const colors = {
        admin: 'purple',
        customer: 'primary',
        restaurant: 'amber',
        driver: 'green'
      };
      return colors[role] || 'grey';
    };
    
    const getStatusColor = (status) => {
      const colors = {
        active: 'success',
        pending: 'warning',
        suspended: 'error',
        inactive: 'grey'
      };
      return colors[status] || 'grey';
    };
    
    // Watchers
    watch(page, fetchUsers);
    watch(itemsPerPage, () => {
      page.value = 1;
      fetchUsers();
    });
    watch(sortBy, fetchUsers);
    
    onMounted(fetchUsers);
    
    return {
      users,
      loading,
      error,
      page,
      itemsPerPage,
      totalPages,
      totalUsers,
      filters,
      sortBy,
      headers,
      dialogs,
      userForm,
      roleOptions,
      statusOptions,
      sortOptions,
      rules,
      fetchUsers,
      debouncedSearch,
      openAddUserDialog,
      editUser,
      viewUser,
      saveUser,
      toggleUserStatus,
      confirmDelete,
      deleteUser,
      exportUsers,
      formatRole,
      formatStatus,
      formatDate,
      getRoleColor,
      getStatusColor
    };
  }
};
</script>

<style scoped>
.max-width-100 {
  max-width: 100px;
}
</style>