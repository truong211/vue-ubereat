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
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { format } from 'date-fns';

export default {
  name: 'OrderManagement',
  setup() {
    const store = useStore();
    const loading = ref(false);
    const orders = ref([]);
    const selectedOrder = ref(null);
    const orderFilters = ref({
      status: 'all',
      dateRange: null,
      searchQuery: ''
    });

    const orderDialog = ref({
      show: false,
      order: null,
      loading: false,
      note: ''
    });

    // Computed properties for order filtering
    const filteredOrders = computed(() => {
      let result = [...orders.value];
      
      // Filter by status
      if (orderFilters.value.status !== 'all') {
        result = result.filter(order => order.status === orderFilters.value.status);
      }
      
      // Filter by date range
      if (orderFilters.value.dateRange) {
        const [start, end] = orderFilters.value.dateRange;
        result = result.filter(order => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= start && orderDate <= end;
        });
      }
      
      // Filter by search query
      if (orderFilters.value.searchQuery) {
        const query = orderFilters.value.searchQuery.toLowerCase();
        result = result.filter(order => 
          order.orderNumber.toLowerCase().includes(query) ||
          order.customer.fullName.toLowerCase().includes(query)
        );
      }
      
      return result;
    });

    // Order status groups
    const orderGroups = computed(() => ({
      new: filteredOrders.value.filter(order => order.status === 'pending'),
      preparing: filteredOrders.value.filter(order => order.status === 'preparing'),
      ready: filteredOrders.value.filter(order => order.status === 'ready'),
      delivering: filteredOrders.value.filter(order => order.status === 'out_for_delivery'),
      completed: filteredOrders.value.filter(order => order.status === 'delivered'),
      cancelled: filteredOrders.value.filter(order => order.status === 'cancelled')
    }));

    // Load orders with real-time updates
    const loadOrders = async () => {
      loading.value = true;
      try {
        const response = await store.dispatch('restaurantAdmin/fetchOrders');
        orders.value = response.orders;
        
        // Initialize WebSocket connection for real-time updates
        initializeWebSocket();
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        loading.value = false;
      }
    };

    // WebSocket setup for real-time updates
    const initializeWebSocket = () => {
      const socket = store.state.restaurantAdmin.socket;
      
      if (!socket) return;
      
      socket.on('new_order', (data) => {
        orders.value.unshift(data.order);
        // Show notification
        showNotification('New Order', `Order #${data.order.orderNumber} received`);
      });

      socket.on('order_status_updated', (data) => {
        const index = orders.value.findIndex(order => order.id === data.orderId);
        if (index !== -1) {
          orders.value[index].status = data.status;
          orders.value[index].updatedAt = data.updatedAt;
        }
      });
    };

    // Update order status
    const updateOrderStatus = async (order, newStatus) => {
      try {
        await store.dispatch('restaurantAdmin/updateOrder', {
          orderId: order.id,
          status: newStatus,
          note: orderDialog.value.note
        });
        
        // Show success message
        showNotification('Order Updated', `Order #${order.orderNumber} status changed to ${newStatus}`);
      } catch (error) {
        console.error('Failed to update order status:', error);
      }
    };

    // Show notification using native browser notification
    const showNotification = (title, body) => {
      if (!('Notification' in window)) return;
      
      if (Notification.permission === 'granted') {
        new Notification(title, { body });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body });
          }
        });
      }
    };

    // Format order total
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    };

    // Get status color for visual indication
    const getStatusColor = (status) => {
      const colors = {
        pending: 'warning',
        confirmed: 'info',
        preparing: 'primary',
        ready: 'success',
        out_for_delivery: 'purple',
        delivered: 'green',
        cancelled: 'error'
      };
      return colors[status] || 'grey';
    };

    // Initialize component
    onMounted(() => {
      loadOrders();
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
      }
    });

    return {
      loading,
      orders,
      orderFilters,
      filteredOrders,
      orderGroups,
      orderDialog,
      updateOrderStatus,
      formatCurrency,
      getStatusColor
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