<template>
  <div class="user-detail">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-btn icon class="mr-2" @click="$router.back()">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <h2>User Details</h2>
            </v-card-title>
            
            <v-divider></v-divider>
            
            <v-card-text v-if="loading">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <span class="ml-2">Loading user details...</span>
            </v-card-text>
            
            <v-card-text v-else-if="error">
              <v-alert type="error">
                {{ error }}
              </v-alert>
            </v-card-text>
            
            <template v-else-if="user">
              <v-card-text>
                <v-row>
                  <v-col cols="12" md="4" class="text-center">
                    <v-avatar size="150" color="primary">
                      <v-img v-if="user.avatar" :src="user.avatar" cover></v-img>
                      <span v-else class="text-h3 text-white">{{ getInitials(user.name) }}</span>
                    </v-avatar>
                    
                    <div class="mt-4">
                      <h3 class="text-h5">{{ user.name }}</h3>
                      <p class="text-body-1 text-medium-emphasis">{{ user.role || 'User' }}</p>
                    </div>
                  </v-col>
                  
                  <v-col cols="12" md="8">
                    <v-list>
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon class="mr-2">mdi-email</v-icon>
                        </template>
                        <v-list-item-title>Email</v-list-item-title>
                        <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon class="mr-2">mdi-phone</v-icon>
                        </template>
                        <v-list-item-title>Phone</v-list-item-title>
                        <v-list-item-subtitle>{{ user.phone || 'Not provided' }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon class="mr-2">mdi-calendar</v-icon>
                        </template>
                        <v-list-item-title>Joined</v-list-item-title>
                        <v-list-item-subtitle>{{ formatDate(user.createdAt) }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon class="mr-2">mdi-map-marker</v-icon>
                        </template>
                        <v-list-item-title>Address</v-list-item-title>
                        <v-list-item-subtitle>{{ user.address || 'Not provided' }}</v-list-item-subtitle>
                      </v-list-item>
                      
                      <v-list-item>
                        <template v-slot:prepend>
                          <v-icon class="mr-2">mdi-account-check</v-icon>
                        </template>
                        <v-list-item-title>Status</v-list-item-title>
                        <v-list-item-subtitle>
                          <v-chip
                            :color="user.active ? 'success' : 'error'"
                            size="small"
                          >
                            {{ user.active ? 'Active' : 'Inactive' }}
                          </v-chip>
                        </v-list-item-subtitle>
                      </v-list-item>
                    </v-list>
                  </v-col>
                </v-row>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="text" @click="editUser">
                  <v-icon class="mr-1">mdi-pencil</v-icon>
                  Edit
                </v-btn>
                <v-btn color="error" variant="text" @click="showDeleteDialog = true">
                  <v-icon class="mr-1">mdi-delete</v-icon>
                  Delete
                </v-btn>
              </v-card-actions>
            </template>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- User's Order History -->
      <v-row v-if="user && orders.length > 0" class="mt-4">
        <v-col cols="12">
          <v-card>
            <v-card-title>Order History</v-card-title>
            <v-divider></v-divider>
            <v-data-table
              :headers="orderHeaders"
              :items="orders"
              :items-per-page="5"
              class="elevation-1"
            >
              <template v-slot:item.orderDate="{ item }">
                {{ formatDate(item.orderDate) }}
              </template>
              <template v-slot:item.status="{ item }">
                <v-chip
                  :color="getStatusColor(item.status)"
                  size="small"
                >
                  {{ item.status }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon
                  size="small"
                  @click="viewOrder(item.id)"
                >
                  <v-icon>mdi-eye</v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this user? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="showDeleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="deleteUser">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'UserDetail',
  props: {
    id: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      user: null,
      orders: [],
      loading: true,
      error: null,
      showDeleteDialog: false,
      orderHeaders: [
        { title: 'Order ID', key: 'id' },
        { title: 'Date', key: 'orderDate' },
        { title: 'Restaurant', key: 'restaurant' },
        { title: 'Amount', key: 'amount' },
        { title: 'Status', key: 'status' },
        { title: 'Actions', key: 'actions', sortable: false }
      ]
    };
  },
  created() {
    this.fetchUserData();
  },
  methods: {
    async fetchUserData() {
      this.loading = true;
      this.error = null;
      
      try {
        // Fetch user data
        const userResponse = await axios.get(`/api/admin/users/${this.id}`);
        this.user = userResponse.data;
        
        // Fetch user's orders
        const ordersResponse = await axios.get(`/api/admin/users/${this.id}/orders`);
        this.orders = ordersResponse.data || [];
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        this.error = 'Failed to load user data. Please try again later.';
      } finally {
        this.loading = false;
      }
    },
    
    getInitials(name) {
      if (!name) return '?';
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    },
    
    getStatusColor(status) {
      const statusColors = {
        'pending': 'warning',
        'confirmed': 'info',
        'preparing': 'info',
        'ready': 'info',
        'on_the_way': 'info',
        'delivered': 'success',
        'cancelled': 'error'
      };
      
      return statusColors[status] || 'grey';
    },
    
    editUser() {
      this.$router.push({ name: 'TableEdit', params: { tableName: 'users', id: this.id } });
    },
    
    async deleteUser() {
      try {
        await axios.delete(`/api/admin/users/${this.id}`);
        this.showDeleteDialog = false;
        this.$router.push({ name: 'AdminUsers' });
        // Show success notification
        this.$store.dispatch('notification/show', {
          type: 'success',
          message: 'User deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        // Show error notification
        this.$store.dispatch('notification/show', {
          type: 'error',
          message: 'Failed to delete user'
        });
      }
    },
    
    viewOrder(orderId) {
      this.$router.push({ name: 'TableView', params: { tableName: 'orders', id: orderId } });
    }
  }
};
</script>

<style scoped>
.user-detail {
  padding-bottom: 24px;
}
</style> 