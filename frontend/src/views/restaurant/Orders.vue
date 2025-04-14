<template>
  <div>
    <!-- Header with filters -->
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">Orders</h1>
      <v-spacer></v-spacer>
      <v-btn-toggle
        v-model="timeFilter"
        mandatory
        class="mr-4"
      >
        <v-btn value="today">Today</v-btn>
        <v-btn value="week">This Week</v-btn>
        <v-btn value="month">This Month</v-btn>
      </v-btn-toggle>
      <v-select
        v-model="statusFilter"
        :items="statusOptions"
        label="Status"
        item-title="text"
        item-value="value"
        hide-details
        class="max-width-200"
        variant="outlined"
        density="comfortable"
      ></v-select>
    </div>

    <!-- Orders Grid -->
    <v-row>
      <v-col cols="12" md="3">
        <!-- New Orders -->
        <v-card class="mb-6">
          <v-card-title class="bg-primary text-white">
            New Orders
            <v-badge
              :content="newOrders.length.toString()"
              :model-value="newOrders.length > 0"
              color="error"
              class="ml-2"
              inline
            ></v-badge>
          </v-card-title>
          <v-card-text class="pa-0">
            <order-list
              :orders="newOrders"
              @click="openOrderDetails"
              @accept="acceptOrder"
              @reject="rejectOrder"
            ></order-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <!-- Preparing -->
        <v-card class="mb-6">
          <v-card-title class="bg-info text-white">
            Preparing
            <v-badge
              :content="preparingOrders.length.toString()"
              :model-value="preparingOrders.length > 0"
              color="info"
              class="ml-2"
              inline
            ></v-badge>
          </v-card-title>
          <v-card-text class="pa-0">
            <order-list
              :orders="preparingOrders"
              @click="openOrderDetails"
              @ready="markOrderReady"
            ></order-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <!-- Ready for Pickup -->
        <v-card class="mb-6">
          <v-card-title class="bg-success text-white">
            Ready for Pickup
            <v-badge
              :content="readyOrders.length.toString()"
              :model-value="readyOrders.length > 0"
              color="success"
              class="ml-2"
              inline
            ></v-badge>
          </v-card-title>
          <v-card-text class="pa-0">
            <order-list
              :orders="readyOrders"
              @click="openOrderDetails"
              @pickup="confirmPickup"
            ></order-list>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <!-- Completed -->
        <v-card class="mb-6">
          <v-card-title class="bg-grey text-white">
            Completed Today
          </v-card-title>
          <v-card-text class="pa-0">
            <order-list
              :orders="completedOrders"
              @click="openOrderDetails"
            ></order-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Order Details Dialog -->
    <v-dialog
      v-model="orderDialog.show"
      max-width="700"
    >
      <v-card>
        <v-toolbar
          :color="getStatusColor(orderDialog.order?.status)"
          dark
        >
          <v-toolbar-title>
            Order #{{ orderDialog.order?.id }}
            <v-chip
              class="ml-2"
              size="small"
            >
              {{ formatOrderStatus(orderDialog.order?.status) }}
            </v-chip>
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="orderDialog.show = false"
          ></v-btn>
        </v-toolbar>

        <v-card-text class="pa-4">
          <!-- Order Info -->
          <v-row>
            <v-col cols="6">
              <div class="text-subtitle-2">Customer</div>
              <div>{{ orderDialog.order?.customer?.name }}</div>
              <div>{{ orderDialog.order?.customer?.phone }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-subtitle-2">Delivery Address</div>
              <div>{{ orderDialog.order?.address?.street }}</div>
              <div>{{ orderDialog.order?.address?.city }}</div>
              <div class="text-caption" v-if="orderDialog.order?.address?.instructions">
                Note: {{ orderDialog.order?.address?.instructions }}
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <!-- Order Items -->
          <div class="text-subtitle-2 mb-2">Order Items</div>
          <v-list>
            <v-list-item
              v-for="item in orderDialog.order?.items"
              :key="item.id"
              :title="`${item.quantity}x ${item.name}`"
              :subtitle="formatItemOptions(item.options)"
            >
              <template v-slot:append>
                {{ formatPrice(item.price * item.quantity) }}
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <!-- Order Totals -->
          <div class="d-flex justify-space-between mb-2">
            <span>Subtotal</span>
            <span>{{ formatPrice(orderDialog.order?.subtotal) }}</span>
          </div>
          <div class="d-flex justify-space-between mb-2">
            <span>Delivery Fee</span>
            <span>{{ formatPrice(orderDialog.order?.deliveryFee) }}</span>
          </div>
          <div v-if="orderDialog.order?.discount" class="d-flex justify-space-between mb-2">
            <span>Discount</span>
            <span class="text-success">-{{ formatPrice(orderDialog.order?.discount) }}</span>
          </div>
          <div class="d-flex justify-space-between text-h6">
            <span>Total</span>
            <span>{{ formatPrice(orderDialog.order?.total) }}</span>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- Action Buttons -->
          <v-card-actions>
            <v-btn
              v-if="orderDialog.order?.status === 'pending'"
              color="success"
              prepend-icon="mdi-check"
              @click="acceptOrder(orderDialog.order)"
            >
              Accept Order
            </v-btn>
            <v-btn
              v-if="orderDialog.order?.status === 'pending'"
              color="error"
              prepend-icon="mdi-close"
              @click="rejectOrder(orderDialog.order)"
            >
              Reject Order
            </v-btn>
            <v-btn
              v-if="orderDialog.order?.status === 'preparing'"
              color="success"
              prepend-icon="mdi-check-all"
              @click="markOrderReady(orderDialog.order)"
            >
              Mark as Ready
            </v-btn>
            <v-btn
              v-if="orderDialog.order?.status === 'ready'"
              color="success"
              prepend-icon="mdi-bike"
              @click="confirmPickup(orderDialog.order)"
            >
              Confirm Pickup
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-printer"
              @click="printOrder(orderDialog.order)"
            >
              Print Order
            </v-btn>
          </v-card-actions>

          <!-- Shipper Info -->
          <template v-if="orderDialog.order?.shipper">
            <v-divider class="my-4"></v-divider>
            <div class="text-subtitle-2 mb-2">Delivery Partner</div>
            <v-list-item
              :title="orderDialog.order.shipper.name"
              :subtitle="orderDialog.order.shipper.phone"
            >
              <template v-slot:prepend>
                <v-avatar color="grey">
                  <v-img
                    v-if="orderDialog.order.shipper.avatar"
                    :src="orderDialog.order.shipper.avatar"
                  ></v-img>
                  <span v-else class="text-h6 text-white">
                    {{ orderDialog.order.shipper.name.charAt(0) }}
                  </span>
                </v-avatar>
              </template>
              <template v-slot:append>
                <v-btn
                  icon="mdi-phone"
                  variant="text"
                  color="primary"
                  @click="callShipper(orderDialog.order.shipper)"
                ></v-btn>
              </template>
            </v-list-item>
          </template>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Confirm Dialog -->
    <v-dialog
      v-model="confirmDialog.show"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="confirmDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="confirmDialog.color"
            @click="confirmDialog.onConfirm"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useRestaurantAdminStore } from '@/stores/restaurantAdmin'; // Assuming Pinia store path
// import { format } from 'date-fns'; // date-fns format was not used in the original script block
import OrderList from '@/components/restaurant/OrderList.vue';

export default defineComponent({
  name: 'RestaurantOrders',
  components: { OrderList },

  setup() {
    const restaurantAdminStore = useRestaurantAdminStore();
    return { restaurantAdminStore }; // Expose store instance
  },

  data() {
    return {
      timeFilter: 'today',
      statusFilter: 'all',
      statusOptions: [
        { text: 'All Orders', value: 'all' },
        { text: 'New Orders', value: 'pending' },
        { text: 'Preparing', value: 'preparing' },
        { text: 'Ready', value: 'ready' },
        { text: 'Completed', value: 'completed' },
        { text: 'Cancelled', value: 'cancelled' }
      ],
      orderDialog: {
        show: false,
        order: null
      },
      // Added confirmDialog state from the removed script setup
      confirmDialog: {
        show: false,
        title: '',
        message: '',
        color: 'primary',
        onConfirm: null
      }
    };
  },

  computed: {
    // Access state/getters from Pinia store
    orders() {
      return this.restaurantAdminStore.orders;
    },
    // Assuming pendingOrders is a getter or state property in the Pinia store
    pendingOrders() {
      // If it's state: return this.restaurantAdminStore.pendingOrders;
      // If it's a getter: return this.restaurantAdminStore.getPendingOrders;
      // Fallback to original logic if store structure is unknown:
      return this.orders.filter(order => order.status === 'pending');
    },
    loading() {
      return this.restaurantAdminStore.loading;
    },
    error() {
      return this.restaurantAdminStore.error;
    },

    // Keep original computed properties that derive from store state
    newOrders() {
      // This now uses the computed 'pendingOrders' which accesses the store
      return this.pendingOrders;
    },
    preparingOrders() {
      return this.orders.filter(order => order.status === 'preparing');
    },
    readyOrders() {
      return this.orders.filter(order => order.status === 'ready');
    },
    completedOrders() {
      // Consider adding date filtering if needed, like in the removed script setup
      return this.orders.filter(order => order.status === 'completed');
    }
  },

  methods: {
    // Call actions on the store instance
    async loadOrders() {
      try {
        await this.restaurantAdminStore.fetchOrders({
          status: this.statusFilter === 'all' ? null : this.statusFilter, // Pass null for 'all'
          timeframe: this.timeFilter
        });
      } catch (error) {
        console.error('Error loading orders:', error);
        // TODO: Add user feedback (e.g., snackbar)
      }
    },

    openOrderDetails(order) {
      this.orderDialog.order = order;
      this.orderDialog.show = true;
    },

    // Method to show confirmation dialog (adapted from removed script setup)
    showConfirmDialog(title, message, color, onConfirmCallback) {
      this.confirmDialog = {
        show: true,
        title,
        message,
        color,
        onConfirm: async () => {
          await onConfirmCallback(); // Execute the callback
          this.confirmDialog.show = false; // Close dialog after confirmation
        }
      };
    },

    // Refactored actions to use confirm dialog and Pinia store
    async updateOrderStatus(orderId, status) {
       try {
         await this.restaurantAdminStore.updateOrder({ orderId, status });
         // Optionally close dialog or show success message
         if (this.orderDialog.show && this.orderDialog.order?.id === orderId) {
            // Update status in the dialog if it's open
            this.orderDialog.order.status = status;
            // Close dialog for terminal statuses
            if (['cancelled', 'completed'].includes(status)) {
                this.orderDialog.show = false;
            }
         }
         console.log(`Order ${orderId} updated to ${status}`); // Placeholder feedback
       } catch (error) {
         console.error(`Error updating order ${orderId} to ${status}:`, error);
         // TODO: Add user feedback
       }
    },

    acceptOrder(order) {
      this.showConfirmDialog(
        'Accept Order?',
        `Are you sure you want to accept order #${order.id}?`,
        'success',
        () => this.updateOrderStatus(order.id, 'preparing')
      );
    },

    rejectOrder(order) {
       this.showConfirmDialog(
        'Reject Order?',
        `Are you sure you want to reject order #${order.id}? This cannot be undone.`,
        'error',
        () => this.updateOrderStatus(order.id, 'cancelled')
      );
    },

    markOrderReady(order) {
      this.showConfirmDialog(
        'Mark as Ready?',
        `Mark order #${order.id} as ready for pickup?`,
        'success',
        () => this.updateOrderStatus(order.id, 'ready')
      );
    },

    confirmPickup(order) {
       this.showConfirmDialog(
        'Confirm Pickup?',
        `Confirm that order #${order.id} has been picked up?`,
        'success',
        // Assuming 'completed' is the final status after pickup
        () => this.updateOrderStatus(order.id, 'completed')
      );
    },

    // Utility methods (kept from original script)
    formatPrice(price) {
      if (price === undefined || price === null) return '';
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    },

    formatOrderStatus(status) {
      if (!status) return 'Unknown';
      const statusMap = {
        pending: 'Pending',
        preparing: 'Preparing',
        ready: 'Ready',
        completed: 'Completed',
        cancelled: 'Cancelled'
        // Add 'delivering' if used
      };
      return statusMap[status] || status.charAt(0).toUpperCase() + status.slice(1);
    },

    getStatusColor(status) {
      const colorMap = {
        pending: 'warning',
        preparing: 'info',
        ready: 'success',
        completed: 'grey',
        cancelled: 'error'
        // Add 'delivering' if used
      };
      return colorMap[status] || 'grey';
    },

    formatItemOptions(options) {
      // Assuming options is an array like [{ name: 'Size', value: 'Large' }, { name: 'Sauce', value: 'BBQ' }]
      if (!options || !Array.isArray(options) || options.length === 0) return '';
      return options.map(opt => `${opt.name}: ${opt.value}`).join(', ');
    },

    // Added methods from removed script setup that were missing
     printOrder(order) {
      console.log('Printing order:', order);
      // Implement printing logic here (e.g., open a new window with printable format)
      // showToast('Printing order...', 'info')
    },

    callShipper(shipper) {
      if (shipper?.phone) {
        window.location.href = `tel:${shipper.phone}`;
      }
    }
  },

  watch: {
    timeFilter() {
      this.loadOrders();
    },
    statusFilter() {
      this.loadOrders();
    }
  },

  mounted() {
    this.loadOrders(); // Load orders when component mounts
    // TODO: Re-implement WebSocket connection if needed, using Pinia store
  }
});
</script>

<style scoped>
.max-width-200 {
  max-width: 200px;
}
/* Add any other styles from the original <style> block if they existed */
</style>
