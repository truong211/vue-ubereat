<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Order Management</h1>
        
        <!-- Order Filters -->
        <v-card class="mb-4">
          <v-card-text>
            <v-row align="center">
              <v-col cols="12" sm="4" md="3">
                <v-select
                  v-model="filters.status"
                  :items="orderStatuses"
                  label="Order Status"
                  clearable
                  density="compact"
                ></v-select>
              </v-col>
              
              <v-col cols="12" sm="4" md="3">
                <v-text-field
                  v-model="filters.search"
                  label="Search Orders"
                  prepend-icon="mdi-magnify"
                  density="compact"
                  clearable
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="4" md="3">
                <v-select
                  v-model="filters.sortBy"
                  :items="sortOptions"
                  label="Sort By"
                  density="compact"
                ></v-select>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        
        <!-- Orders Table -->
        <v-card>
          <v-data-table
            :headers="headers"
            :items="filteredOrders"
            :loading="loading"
            :items-per-page="10"
          >
            <!-- Order Number -->
            <template v-slot:item.orderNumber="{ item }">
              <div class="font-weight-medium">#{{ item.orderNumber }}</div>
              <div class="text-caption">{{ formatDate(item.createdAt) }}</div>
            </template>
            
            <!-- Customer Info -->
            <template v-slot:item.customer="{ item }">
              <div>{{ item.customer.name }}</div>
              <div class="text-caption">{{ item.customer.phone }}</div>
            </template>
            
            <!-- Items -->
            <template v-slot:item.items="{ item }">
              <div v-for="(orderItem, index) in item.items" :key="index">
                {{ orderItem.quantity }}x {{ orderItem.name }}
              </div>
            </template>
            
            <!-- Total -->
            <template v-slot:item.total="{ item }">
              ${{ item.total.toFixed(2) }}
            </template>
            
            <!-- Status -->
            <template v-slot:item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                size="small"
              >
                {{ item.status }}
              </v-chip>
            </template>
            
            <!-- Actions -->
            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-eye"
                variant="text"
                size="small"
                @click="viewOrderDetails(item)"
              ></v-btn>
              
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn
                    icon="mdi-dots-vertical"
                    variant="text"
                    size="small"
                    v-bind="props"
                  ></v-btn>
                </template>
                
                <v-list>
                  <v-list-item
                    v-for="action in getAvailableActions(item.status)"
                    :key="action.value"
                    @click="updateOrderStatus(item.id, action.value)"
                  >
                    <v-list-item-title>{{ action.text }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Order Details Dialog -->
    <v-dialog v-model="orderDialog.show" max-width="700">
      <v-card v-if="orderDialog.order">
        <v-card-title class="d-flex align-center">
          Order #{{ orderDialog.order.orderNumber }}
          <v-spacer></v-spacer>
          <v-chip
            :color="getStatusColor(orderDialog.order.status)"
            size="small"
          >
            {{ orderDialog.order.status }}
          </v-chip>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 mb-2">Customer Information</h3>
              <div>{{ orderDialog.order.customer.name }}</div>
              <div>{{ orderDialog.order.customer.phone }}</div>
              <div class="text-caption">{{ orderDialog.order.customer.email }}</div>
            </v-col>
            
            <v-col cols="12" md="6">
              <h3 class="text-subtitle-1 mb-2">Delivery Information</h3>
              <div>{{ orderDialog.order.deliveryAddress }}</div>
              <div class="text-caption">Delivery Notes: {{ orderDialog.order.deliveryNotes || 'None' }}</div>
            </v-col>
            
            <v-col cols="12">
              <h3 class="text-subtitle-1 mb-2">Order Items</h3>
              <v-list>
                <v-list-item
                  v-for="item in orderDialog.order.items"
                  :key="item.id"
                >
                  <v-list-item-title>
                    {{ item.quantity }}x {{ item.name }}
                    <span class="float-right">${{ (item.price * item.quantity).toFixed(2) }}</span>
                  </v-list-item-title>
                  <v-list-item-subtitle v-if="item.notes">
                    Note: {{ item.notes }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
              
              <v-divider class="my-4"></v-divider>
              
              <div class="d-flex justify-space-between mb-2">
                <span>Subtotal</span>
                <span>${{ orderDialog.order.subtotal.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Delivery Fee</span>
                <span>${{ orderDialog.order.deliveryFee.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>Tax</span>
                <span>${{ orderDialog.order.tax.toFixed(2) }}</span>
              </div>
              <div class="d-flex justify-space-between font-weight-bold">
                <span>Total</span>
                <span>${{ orderDialog.order.total.toFixed(2) }}</span>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="orderDialog.show = false"
          >
            Close
          </v-btn>
          <v-btn
            v-for="action in getAvailableActions(orderDialog.order.status)"
            :key="action.value"
            :color="action.color"
            variant="tonal"
            @click="updateOrderStatus(orderDialog.order.id, action.value)"
          >
            {{ action.text }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { format } from 'date-fns';

export default {
  name: 'OrderManagement',
  
  setup() {
    const store = useStore();
    const loading = ref(false);
    
    // Filters
    const filters = ref({
      status: '',
      search: '',
      sortBy: 'newest'
    });
    
    // Order statuses and actions
    const orderStatuses = [
      { text: 'All Orders', value: '' },
      { text: 'New', value: 'new' },
      { text: 'Confirmed', value: 'confirmed' },
      { text: 'Preparing', value: 'preparing' },
      { text: 'Ready', value: 'ready' },
      { text: 'Out for Delivery', value: 'delivering' },
      { text: 'Delivered', value: 'delivered' },
      { text: 'Cancelled', value: 'cancelled' }
    ];
    
    const sortOptions = [
      { text: 'Newest First', value: 'newest' },
      { text: 'Oldest First', value: 'oldest' },
      { text: 'Highest Total', value: 'total-desc' },
      { text: 'Lowest Total', value: 'total-asc' }
    ];
    
    // Table headers
    const headers = [
      { title: 'Order', key: 'orderNumber' },
      { title: 'Customer', key: 'customer' },
      { title: 'Items', key: 'items' },
      { title: 'Total', key: 'total' },
      { title: 'Status', key: 'status' },
      { title: 'Actions', key: 'actions', sortable: false }
    ];
    
    // Orders data
    const orders = ref([]);
    const filteredOrders = computed(() => {
      let filtered = [...orders.value];
      
      // Apply status filter
      if (filters.value.status) {
        filtered = filtered.filter(order => order.status === filters.value.status);
      }
      
      // Apply search filter
      if (filters.value.search) {
        const search = filters.value.search.toLowerCase();
        filtered = filtered.filter(order =>
          order.orderNumber.toLowerCase().includes(search) ||
          order.customer.name.toLowerCase().includes(search)
        );
      }
      
      // Apply sorting
      switch (filters.value.sortBy) {
        case 'oldest':
          filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'total-desc':
          filtered.sort((a, b) => b.total - a.total);
          break;
        case 'total-asc':
          filtered.sort((a, b) => a.total - b.total);
          break;
        default: // newest
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }
      
      return filtered;
    });
    
    // Order dialog
    const orderDialog = ref({
      show: false,
      order: null
    });
    
    // Load orders
    const loadOrders = async () => {
      loading.value = true;
      try {
        orders.value = await store.dispatch('restaurant/getOrders');
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Update order status
    const updateOrderStatus = async (orderId, newStatus) => {
      try {
        await store.dispatch('restaurant/updateOrderStatus', {
          orderId,
          status: newStatus
        });
        await loadOrders();
        orderDialog.value.show = false;
      } catch (error) {
        console.error('Failed to update order status:', error);
      }
    };
    
    // View order details
    const viewOrderDetails = (order) => {
      orderDialog.value.order = order;
      orderDialog.value.show = true;
    };
    
    // Helper functions
    const formatDate = (date) => {
      return format(new Date(date), 'MMM d, yyyy h:mm a');
    };
    
    const getStatusColor = (status) => {
      const colors = {
        new: 'info',
        confirmed: 'primary',
        preparing: 'warning',
        ready: 'success',
        delivering: 'purple',
        delivered: 'success',
        cancelled: 'error'
      };
      return colors[status] || 'default';
    };
    
    const getAvailableActions = (status) => {
      switch (status) {
        case 'new':
          return [
            { text: 'Confirm Order', value: 'confirmed', color: 'primary' },
            { text: 'Cancel Order', value: 'cancelled', color: 'error' }
          ];
        case 'confirmed':
          return [{ text: 'Start Preparing', value: 'preparing', color: 'warning' }];
        case 'preparing':
          return [{ text: 'Mark as Ready', value: 'ready', color: 'success' }];
        case 'ready':
          return [{ text: 'Out for Delivery', value: 'delivering', color: 'purple' }];
        default:
          return [];
      }
    };
    
    // Load initial data
    loadOrders();
    
    return {
      loading,
      filters,
      orderStatuses,
      sortOptions,
      headers,
      filteredOrders,
      orderDialog,
      formatDate,
      getStatusColor,
      getAvailableActions,
      viewOrderDetails,
      updateOrderStatus
    };
  }
};
</script>

<style scoped>
.v-data-table ::v-deep .v-data-table__wrapper {
  overflow-x: auto;
}

.v-list-item-subtitle {
  white-space: normal !important;
}
</style>