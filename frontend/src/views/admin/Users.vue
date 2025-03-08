<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">User Management</h1>
      <v-spacer></v-spacer>
      <v-btn-group>
        <v-btn
          v-for="type in userTypes"
          :key="type.value"
          :color="activeType === type.value ? 'primary' : undefined"
          variant="tonal"
          @click="activeType = type.value"
        >
          {{ type.title }}
          <v-badge
            v-if="type.count"
            :content="type.count.toString()"
            :color="type.color"
            class="ml-2"
            floating
          ></v-badge>
        </v-btn>
      </v-btn-group>
    </div>

    <!-- Search and Filters -->
    <v-card class="mb-6">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="filters.search"
              label="Search users"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </v-col>

          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.sortBy"
              :items="sortOptions"
              label="Sort By"
              variant="outlined"
              density="comfortable"
              hide-details
            ></v-select>
          </v-col>

          <v-col cols="12" sm="2">
            <v-btn
              color="primary"
              block
              prepend-icon="mdi-filter"
              @click="applyFilters"
            >
              Filter
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Users Table -->
    <v-data-table-server
      v-model:items-per-page="itemsPerPage"
      :headers="getHeaders"
      :items="users"
      :loading="loading"
      :items-length="totalUsers"
      @update:options="loadUsers"
    >
      <!-- Avatar -->
      <template v-slot:item.avatar="{ item }">
        <v-avatar size="40">
          <v-img
            v-if="item.avatar"
            :src="item.avatar"
            :alt="item.name"
          ></v-img>
          <span v-else class="text-h6">
            {{ item.name.charAt(0) }}
          </span>
        </v-avatar>
      </template>

      <!-- Status -->
      <template v-slot:item.status="{ item }">
        <v-chip
          :color="getStatusColor(item.status)"
          size="small"
        >
          {{ formatStatus(item.status) }}
        </v-chip>
      </template>

      <!-- Role Specific Info -->
      <template v-slot:item.roleInfo="{ item }">
        <template v-if="item.role === 'driver'">
          <div class="d-flex align-center">
            <v-icon
              :color="item.online ? 'success' : 'grey'"
              size="small"
              class="mr-2"
            >
              mdi-circle-small
            </v-icon>
            {{ item.online ? 'Online' : 'Offline' }}
            <v-chip
              v-if="item.currentOrder"
              color="info"
              size="x-small"
              class="ml-2"
            >
              On Delivery
            </v-chip>
          </div>
        </template>
        <template v-else-if="item.role === 'restaurant'">
          <v-chip
            :color="item.restaurant?.isOpen ? 'success' : 'error'"
            size="x-small"
          >
            {{ item.restaurant?.isOpen ? 'Open' : 'Closed' }}
          </v-chip>
        </template>
        <template v-else>
          {{ item.orderCount }} orders
        </template>
      </template>

      <!-- Actions -->
      <template v-slot:item.actions="{ item }">
        <v-btn-group density="comfortable">
          <v-btn
            icon="mdi-eye"
            variant="text"
            @click="viewUser(item)"
          ></v-btn>

          <v-btn
            v-if="item.status === 'active'"
            icon="mdi-block-helper"
            variant="text"
            color="warning"
            @click="suspendUser(item)"
          ></v-btn>

          <v-btn
            v-if="item.status === 'suspended'"
            icon="mdi-account-reactivate"
            variant="text"
            color="success"
            @click="reactivateUser(item)"
          ></v-btn>

          <v-btn
            icon="mdi-delete"
            variant="text"
            color="error"
            @click="deleteUser(item)"
          ></v-btn>
        </v-btn-group>
      </template>
    </v-data-table-server>

    <!-- User Details Dialog -->
    <v-dialog
      v-model="detailsDialog.show"
      max-width="800"
    >
      <v-card v-if="detailsDialog.user">
        <v-card-title class="d-flex align-center">
          User Details
          <v-chip
            :color="getStatusColor(detailsDialog.user.status)"
            class="ml-4"
            size="small"
          >
            {{ formatStatus(detailsDialog.user.status) }}
          </v-chip>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="detailsDialog.show = false"
          ></v-btn>
        </v-card-title>

        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="d-flex align-center mb-4">
                <v-avatar size="64" color="primary" class="mr-4">
                  <v-img
                    v-if="detailsDialog.user.avatar"
                    :src="detailsDialog.user.avatar"
                    alt="User avatar"
                  ></v-img>
                  <span v-else class="text-h4 white--text">
                    {{ detailsDialog.user.name.charAt(0) }}
                  </span>
                </v-avatar>
                <div>
                  <h3 class="text-h6 mb-1">{{ detailsDialog.user.name }}</h3>
                  <div class="text-subtitle-2 text-medium-emphasis">
                    {{ formatRole(detailsDialog.user.role) }}
                  </div>
                </div>
              </div>

              <v-list density="comfortable">
                <v-list-item prepend-icon="mdi-email">
                  {{ detailsDialog.user.email }}
                </v-list-item>
                <v-list-item prepend-icon="mdi-phone">
                  {{ detailsDialog.user.phone }}
                </v-list-item>
                <v-list-item prepend-icon="mdi-map-marker">
                  {{ detailsDialog.user.address }}
                </v-list-item>
                <v-list-item prepend-icon="mdi-calendar">
                  Joined {{ formatDate(detailsDialog.user.createdAt) }}
                </v-list-item>
              </v-list>
            </v-col>

            <v-col cols="12" md="6">
              <!-- Role-specific information -->
              <template v-if="detailsDialog.user.role === 'customer'">
                <div class="text-subtitle-1 font-weight-bold mb-2">Order History</div>
                <div class="d-flex mb-4">
                  <div class="flex-grow-1">
                    <div class="text-h6">{{ detailsDialog.user.orderCount }}</div>
                    <div class="text-caption">Total Orders</div>
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-h6">{{ formatPrice(detailsDialog.user.totalSpent) }}</div>
                    <div class="text-caption">Total Spent</div>
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-h6">{{ detailsDialog.user.favoriteRestaurants }}</div>
                    <div class="text-caption">Favorite Restaurants</div>
                  </div>
                </div>
              </template>

              <template v-if="detailsDialog.user.role === 'driver'">
                <div class="text-subtitle-1 font-weight-bold mb-2">Delivery Stats</div>
                <div class="d-flex mb-4">
                  <div class="flex-grow-1">
                    <div class="text-h6">{{ detailsDialog.user.deliveryCount }}</div>
                    <div class="text-caption">Deliveries</div>
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-h6">{{ detailsDialog.user.rating.toFixed(1) }}</div>
                    <div class="text-caption">Rating</div>
                  </div>
                  <div class="flex-grow-1">
                    <div class="text-h6">{{ formatPrice(detailsDialog.user.earnings) }}</div>
                    <div class="text-caption">Total Earnings</div>
                  </div>
                </div>
              </template>

              <template v-if="detailsDialog.user.role === 'restaurant'">
                <div class="text-subtitle-1 font-weight-bold mb-2">Restaurant Info</div>
                <v-list density="comfortable">
                  <v-list-item>
                    <div class="text-subtitle-2">Restaurant Name</div>
                    <div>{{ detailsDialog.user.restaurant?.name }}</div>
                  </v-list-item>
                  <v-list-item>
                    <div class="text-subtitle-2">Status</div>
                    <div>
                      <v-chip
                        :color="detailsDialog.user.restaurant?.isOpen ? 'success' : 'error'"
                        size="small"
                      >
                        {{ detailsDialog.user.restaurant?.isOpen ? 'Open' : 'Closed' }}
                      </v-chip>
                    </div>
                  </v-list-item>
                  <v-list-item>
                    <div class="text-subtitle-2">Rating</div>
                    <div class="d-flex align-center">
                      <v-rating
                        :model-value="detailsDialog.user.restaurant?.rating"
                        color="amber"
                        density="compact"
                        half-increments
                        readonly
                        size="small"
                      ></v-rating>
                      <span class="text-body-2 ml-2">
                        ({{ detailsDialog.user.restaurant?.reviewCount }} reviews)
                      </span>
                    </div>
                  </v-list-item>
                </v-list>
              </template>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <!-- Recent Activity -->
          <div class="text-subtitle-1 font-weight-bold mb-2">Recent Activity</div>
          <v-timeline density="compact" truncate>
            <v-timeline-item
              v-for="activity in detailsDialog.user.recentActivity"
              :key="activity.id"
              :dot-color="getActivityColor(activity.type)"
              size="small"
            >
              <div class="text-caption">{{ formatDate(activity.timestamp) }}</div>
              <div>{{ activity.description }}</div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="detailsDialog.show = false"
          >
            Close
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="deleteUser(detailsDialog.user)"
          >
            Delete User
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Action Dialog -->
    <v-dialog v-model="actionDialog.show" max-width="500">
      <v-card>
        <v-card-title>{{ actionDialog.title }}</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="actionDialog.reason"
            :label="actionDialog.reasonLabel"
            :rules="[v => !!v || 'Reason is required']"
            variant="outlined"
            rows="3"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="actionDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="actionDialog.color"
            @click="confirmAction"
          >
            {{ actionDialog.confirmText }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title>Delete User Account</v-card-title>
        <v-card-text>
          Are you sure you want to permanently delete this user account?
          This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="confirmDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { adminAPI } from '@/services/api.service'
import { useToast } from 'vue-toastification'

export default {
  name: 'AdminUsers',

  setup() {
    const store = useStore()

    // Table state
    const loading = ref(false)
    const itemsPerPage = ref(10)
    const totalUsers = ref(0)

    // Active user type filter
    const activeType = ref('all')
    const userTypes = [
      { title: 'All Users', value: 'all', count: 0, color: 'primary' },
      { title: 'Customers', value: 'customer', count: 0, color: 'primary' },
      { title: 'Restaurants', value: 'restaurant', count: 0, color: 'green' },
      { title: 'Drivers', value: 'driver', count: 0, color: 'blue' },
      { title: 'Admins', value: 'admin', count: 0, color: 'purple' }
    ]

    // Table headers
    const getHeaders = computed(() => [
      { title: '', key: 'avatar', sortable: false, width: '60px' },
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Email', key: 'email', sortable: true },
      { title: 'Phone', key: 'phone', sortable: true },
      { title: 'Role', key: 'role', sortable: true },
      { title: 'Status', key: 'status', sortable: true },
      { title: 'Joined', key: 'createdAt', sortable: true }
    ])

    // Filters
    const filters = ref({
      search: '',
      status: 'all',
      sortBy: 'createdAt_desc'
    })

    const statusOptions = [
      { title: 'All Statuses', value: 'all' },
      { title: 'Active', value: 'active' },
      { title: 'Suspended', value: 'suspended' },
      { title: 'Pending', value: 'pending' }
    ]

    const sortOptions = [
      { title: 'Newest First', value: 'createdAt_desc' },
      { title: 'Oldest First', value: 'createdAt_asc' },
      { title: 'Name A-Z', value: 'name_asc' },
      { title: 'Name Z-A', value: 'name_desc' },
      { title: 'Most Orders', value: 'orderCount_desc' },
      { title: 'Highest Rated', value: 'rating_desc' }
    ]

    // Users data
    const users = computed(() => store.state.admin.users)

    // Dialogs
    const detailsDialog = ref({
      show: false,
      user: null
    })

    const actionDialog = ref({
      show: false,
      title: '',
      reason: '',
      reasonLabel: '',
      color: '',
      confirmText: '',
      action: null,
      user: null
    })

    const deleteDialog = ref({
      show: false,
      user: null
    })

    // Methods
    const loadUsers = async (options = {}) => {
      loading.value = true
      try {
        const params = {
          page: options.page || 1,
          limit: options.itemsPerPage || itemsPerPage.value,
          role: activeType.value !== 'all' ? activeType.value : undefined,
          status: filters.value.status !== 'all' ? filters.value.status : undefined,
          search: filters.value.search || undefined,
          sort: filters.value.sortBy || 'createdAt_desc'
        }
        
        const response = await adminAPI.getUsers(params)
        totalUsers.value = response.data.total
        store.dispatch('admin/fetchUsers', {
          page: params.page,
          itemsPerPage: params.limit,
          sortBy: params.sort.split('_')[0],
          sortDesc: params.sort.split('_')[1] === 'desc',
          role: params.role,
          ...filters.value
        })
      } catch (error) {
        useToast().error('Failed to load users: ' + (error.response?.data?.message || error.message))
      } finally {
        loading.value = false
      }
    }

    const applyFilters = async () => {
      try {
        await loadUsers()
      } catch (error) {
        console.error('Failed to apply filters:', error)
      }
    }

    const viewUser = (user) => {
      detailsDialog.value = {
        show: true,
        user
      }
    }

    const suspendUser = (user) => {
      actionDialog.value = {
        show: true,
        title: 'Suspend User',
        reasonLabel: 'Suspension Reason',
        reason: '',
        color: 'warning',
        confirmText: 'Suspend',
        action: 'suspend',
        user
      }
    }

    const reactivateUser = (user) => {
      actionDialog.value = {
        show: true,
        title: 'Reactivate User',
        reasonLabel: 'Reactivation Reason (Optional)',
        reason: '',
        color: 'success',
        confirmText: 'Reactivate',
        action: 'reactivate',
        user
      }
    }

    const deleteUser = (user) => {
      deleteDialog.value = {
        show: true,
        user
      }
    }

    const confirmAction = async () => {
      try {
        const toast = useToast()
        
        if (actionDialog.value.action === 'suspend') {
          await adminAPI.updateUser(actionDialog.value.user.id, { 
            status: 'suspended',
            suspensionReason: actionDialog.value.reason 
          })
          toast.success('User has been suspended')
        } else if (actionDialog.value.action === 'reactivate') {
          await adminAPI.updateUser(actionDialog.value.user.id, { 
            status: 'active',
            reactivationReason: actionDialog.value.reason 
          })
          toast.success('User has been reactivated')
        } else if (actionDialog.value.action === 'role') {
          await adminAPI.updateUser(actionDialog.value.user.id, { 
            role: actionDialog.value.newRole 
          })
          toast.success('User role has been updated')
        }
        
        await loadUsers()
        await loadUserCounts()
        actionDialog.value.show = false
      } catch (error) {
        useToast().error('Action failed: ' + (error.response?.data?.message || error.message))
      }
    }

    const confirmDelete = async () => {
      try {
        await adminAPI.deleteUser(deleteDialog.value.user.id)
        deleteDialog.value.show = false
        if (detailsDialog.value.show) {
          detailsDialog.value.show = false
        }
        await loadUsers()
      } catch (error) {
        console.error('Failed to delete user:', error)
      }
    }

    // Load user counts for each user type
    const loadUserCounts = async () => {
      try {
        const response = await adminAPI.getUserCounts()
        const counts = response.data
        
        userTypes.forEach(type => {
          if (type.value in counts) {
            type.count = counts[type.value]
          }
        })
      } catch (error) {
        console.error('Failed to load user counts:', error)
      }
    }
    
    // Initial data loading
    loadUsers()
    loadUserCounts()

    // Utility functions
    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'success'
        case 'suspended': return 'error'
        case 'pending': return 'warning'
        default: return 'grey'
      }
    }

    const formatStatus = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1)
    }

    const formatRole = (role) => {
      switch (role) {
        case 'customer': return 'Customer'
        case 'restaurant': return 'Restaurant Owner'
        case 'driver': return 'Delivery Driver'
        case 'admin': return 'Admin'
        default: return role
      }
    }

    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }).format(date)
    }

    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }

    const getActivityColor = (type) => {
      switch (type) {
        case 'order': return 'success'
        case 'login': return 'info'
        case 'update': return 'primary'
        case 'error': return 'error'
        default: return 'grey'
      }
    }

    return {
      loading,
      itemsPerPage,
      totalUsers,
      activeType,
      userTypes,
      getHeaders,
      filters,
      statusOptions,
      sortOptions,
      users,
      detailsDialog,
      actionDialog,
      deleteDialog,
      loadUsers,
      applyFilters,
      viewUser,
      suspendUser,
      reactivateUser,
      deleteUser,
      confirmAction,
      confirmDelete,
      getStatusColor,
      formatStatus,
      formatRole,
      formatDate,
      formatPrice,
      getActivityColor
    }
  }
}
</script>
