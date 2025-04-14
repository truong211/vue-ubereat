<template>
  <v-container>
    <h1 class="text-h4 mb-4">Order Management</h1>

    <!-- View Mode Switch -->
    <div class="d-flex align-center mb-4">
      <v-btn-toggle v-model="viewMode" mandatory>
        <v-btn value="orders">
          <v-icon start>mdi-format-list-bulleted</v-icon>
          Orders
        </v-btn>
        <v-btn value="disputes">
          <v-icon start>mdi-alert-circle</v-icon>
          Disputes
          <v-badge
            :content="pendingDisputesCount.toString()"
            :model-value="pendingDisputesCount > 0"
            color="error"
            class="ml-2"
          ></v-badge>
        </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Orders View -->
    <div v-if="viewMode === 'orders'">
      <!-- Search and Filters -->
      <v-card class="mb-4">
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="filters.search"
                label="Search orders"
                prepend-inner-icon="mdi-magnify"
                clearable
                @update:model-value="fetchOrders"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="filters.status"
                :items="statusOptions"
                label="Status"
                clearable
                @update:model-value="fetchOrders"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="filters.restaurant"
                :items="restaurantOptions"
                label="Restaurant"
                item-title="name"
                item-value="id"
                clearable
                @update:model-value="fetchOrders"
              ></v-select>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" sm="6">
              <v-menu
                ref="startDateMenu"
                v-model="startDateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                max-width="290px"
                min-width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="filters.startDate"
                    label="From Date"
                    readonly
                    v-bind="props"
                    clearable
                    @click:clear="filters.startDate = null"
                    prepend-inner-icon="mdi-calendar"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="filters.startDate"
                  @update:model-value="startDateMenu = false"
                ></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="6">
              <v-menu
                ref="endDateMenu"
                v-model="endDateMenu"
                :close-on-content-click="false"
                transition="scale-transition"
                max-width="290px"
                min-width="auto"
              >
                <template v-slot:activator="{ props }">
                  <v-text-field
                    v-model="filters.endDate"
                    label="To Date"
                    readonly
                    v-bind="props"
                    clearable
                    @click:clear="filters.endDate = null"
                    prepend-inner-icon="mdi-calendar"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="filters.endDate"
                  @update:model-value="endDateMenu = false"
                ></v-date-picker>
              </v-menu>
            </v-col>
          </v-row>
          <v-row class="mt-2">
            <v-col cols="12" class="d-flex justify-end">
              <v-btn variant="text" @click="resetFilters" class="mr-2">Reset</v-btn>
              <v-btn color="primary" @click="applyFilters">Apply Filters</v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Order Stats -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card color="info" variant="tonal">
            <v-card-text>
              <div class="text-overline mb-1">Total Orders</div>
              <div class="text-h4 mb-2">{{ orderStats.total }}</div>
              <div class="d-flex align-center">
                <v-icon :color="orderStats.totalChange >= 0 ? 'success' : 'error'">
                  {{ orderStats.totalChange >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
                </v-icon>
                <span class="ml-1" :class="orderStats.totalChange >= 0 ? 'text-success' : 'text-error'">
                  {{ Math.abs(orderStats.totalChange) }}% from last period
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card color="success" variant="tonal">
            <v-card-text>
              <div class="text-overline mb-1">Revenue</div>
              <div class="text-h4 mb-2">${{ orderStats.revenue.toFixed(2) }}</div>
              <div class="d-flex align-center">
                <v-icon :color="orderStats.revenueChange >= 0 ? 'success' : 'error'">
                  {{ orderStats.revenueChange >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
                </v-icon>
                <span class="ml-1" :class="orderStats.revenueChange >= 0 ? 'text-success' : 'text-error'">
                  {{ Math.abs(orderStats.revenueChange) }}% from last period
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card color="warning" variant="tonal">
            <v-card-text>
              <div class="text-overline mb-1">Average Order Value</div>
              <div class="text-h4 mb-2">${{ orderStats.avgOrderValue.toFixed(2) }}</div>
              <div class="d-flex align-center">
                <v-icon :color="orderStats.avgOrderValueChange >= 0 ? 'success' : 'error'">
                  {{ orderStats.avgOrderValueChange >= 0 ? 'mdi-trending-up' : 'mdi-trending-down' }}
                </v-icon>
                <span class="ml-1" :class="orderStats.avgOrderValueChange >= 0 ? 'text-success' : 'text-error'">
                  {{ Math.abs(orderStats.avgOrderValueChange) }}% from last period
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card color="error" variant="tonal">
            <v-card-text>
              <div class="text-overline mb-1">Cancellation Rate</div>
              <div class="text-h4 mb-2">{{ orderStats.cancellationRate.toFixed(1) }}%</div>
              <div class="d-flex align-center">
                <v-icon :color="orderStats.cancellationRateChange <= 0 ? 'success' : 'error'">
                  {{ orderStats.cancellationRateChange <= 0 ? 'mdi-trending-down' : 'mdi-trending-up' }}
                </v-icon>
                <span class="ml-1" :class="orderStats.cancellationRateChange <= 0 ? 'text-success' : 'text-error'">
                  {{ Math.abs(orderStats.cancellationRateChange) }}% from last period
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Orders Table -->
      <v-card>
        <v-data-table
          :headers="headers"
          :items="orders"
          :loading="loading"
          :items-per-page="itemsPerPage"
          :page="page"
          :server-items-length="totalOrders"
          @update:page="handlePageChange"
        >
          <!-- Order ID Column -->
          <template v-slot:item.orderNumber="{ item }">
            #{{ item.raw.orderNumber }}
          </template>

          <!-- Status Column -->
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.raw.status)"
              size="small"
            >
              {{ formatStatus(item.raw.status) }}
            </v-chip>
          </template>

          <!-- Payment Status Column -->
          <template v-slot:item.paymentStatus="{ item }">
            <v-chip
              :color="getPaymentStatusColor(item.raw.paymentStatus)"
              size="small"
            >
              {{ formatPaymentStatus(item.raw.paymentStatus) }}
            </v-chip>
          </template>

          <!-- Actions Column -->
          <template v-slot:item.actions="{ item }">
            <v-btn
              icon
              variant="text"
              size="small"
              color="primary"
              @click="openOrderDetails(item.raw)"
            >
              <v-icon>mdi-eye</v-icon>
            </v-btn>
            <v-btn
              v-if="canManageOrder(item.raw)"
              icon
              variant="text"
              size="small"
              :color="item.raw.status === 'pending' ? 'success' : 'warning'"
              @click="openActionDialog(item.raw)"
            >
              <v-icon>{{ getActionIcon(item.raw.status) }}</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-card>
    </div>

    <!-- Disputes View -->
    <div v-else>
      <v-card class="mb-4">
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="disputeFilters.search"
                label="Search disputes"
                prepend-inner-icon="mdi-magnify"
                clearable
                @update:model-value="fetchDisputes"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="disputeFilters.status"
                :items="disputeStatusOptions"
                label="Status"
                clearable
                @update:model-value="fetchDisputes"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="disputeFilters.reason"
                :items="disputeReasonOptions"
                label="Dispute Reason"
                clearable
                @update:model-value="fetchDisputes"
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-data-table
        :headers="disputeHeaders"
        :items="disputes"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :page="disputePage"
        :server-items-length="totalDisputes"
        @update:page="handleDisputePageChange"
      >
        <template v-slot:item.orderNumber="{ item }">
          #{{ item.raw.order.orderNumber }}
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getDisputeStatusColor(item.raw.status)"
            size="small"
          >
            {{ formatDisputeStatus(item.raw.status) }}
          </v-chip>
        </template>

        <template v-slot:item.refundAmount="{ item }">
          ${{ item.raw.refundAmount.toFixed(2) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            @click="openDisputeDetails(item.raw)"
          >
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </div>

    <!-- Order Details Dialog -->
    <v-dialog v-model="orderDialog.show" max-width="800">
      <v-card v-if="orderDialog.order">
        <v-card-title class="text-h5">
          Order #{{ orderDialog.order.orderNumber }}
          <v-chip
            :color="getStatusColor(orderDialog.order.status)"
            size="small"
            class="ml-2"
          >
            {{ formatStatus(orderDialog.order.status) }}
          </v-chip>
        </v-card-title>

        <v-card-text>
          <v-row>
            <!-- Restaurant Info -->
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Restaurant Details</v-card-title>
                <v-card-text>
                  <p><strong>Name:</strong> {{ orderDialog.order.restaurant?.name }}</p>
                  <p><strong>Phone:</strong> {{ orderDialog.order.restaurant?.phone }}</p>
                  <p><strong>Address:</strong> {{ orderDialog.order.restaurant?.address }}</p>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Customer Info -->
            <v-col cols="12" md="6">
              <v-card variant="outlined">
                <v-card-title>Customer Details</v-card-title>
                <v-card-text>
                  <p><strong>Name:</strong> {{ orderDialog.order.customer?.name }}</p>
                  <p><strong>Phone:</strong> {{ orderDialog.order.customer?.phone }}</p>
                  <p><strong>Address:</strong> {{ orderDialog.order.customer?.address }}</p>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Order Items -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title>Order Items</v-card-title>
                <v-card-text>
                  <v-table density="compact">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="item in orderDialog.order.items" :key="item.id">
                        <td>{{ item.name }}</td>
                        <td>{{ item.quantity }}</td>
                        <td>${{ item.price.toFixed(2) }}</td>
                        <td>${{ (item.price * item.quantity).toFixed(2) }}</td>
                      </tr>
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
                        <td>${{ orderDialog.order.subtotal?.toFixed(2) }}</td>
                      </tr>
                      <tr>
                        <td colspan="3" class="text-right"><strong>Delivery Fee:</strong></td>
                        <td>${{ orderDialog.order.deliveryFee?.toFixed(2) }}</td>
                      </tr>
                      <tr>
                        <td colspan="3" class="text-right"><strong>Total:</strong></td>
                        <td>${{ orderDialog.order.total?.toFixed(2) }}</td>
                      </tr>
                    </tfoot>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Order Timeline -->
            <v-col cols="12">
              <v-card variant="outlined">
                <v-card-title>Order Timeline</v-card-title>
                <v-card-text>
                  <v-timeline density="compact">
                    <v-timeline-item
                      v-for="status in orderStatusTimeline"
                      :key="status.status"
                      :dot-color="getTimelineColor(status.status, orderDialog.order.status)"
                      :icon="status.icon"
                    >
                      <div class="d-flex justify-space-between">
                        <div>
                          <div class="text-subtitle-1">{{ status.label }}</div>
                          <div class="text-caption">{{ status.description }}</div>
                        </div>
                        <div v-if="getStatusTimestamp(status.status)" class="text-caption">
                          {{ formatDateTime(getStatusTimestamp(status.status)) }}
                        </div>
                      </div>
                    </v-timeline-item>
                  </v-timeline>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <!-- Add Dispute Management Component -->
        <v-divider class="my-4"></v-divider>
        <v-card-text>
          <OrderDispute
            :order="orderDialog.order"
            :dispute="orderDialog.dispute"
            @update:dispute="updateDispute"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="orderDialog.show = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Action Dialog -->
    <v-dialog v-model="actionDialog.show" max-width="500">
      <v-card v-if="actionDialog.order">
        <v-card-title>{{ getActionDialogTitle }}</v-card-title>
        <v-card-text>
          <template v-if="actionDialog.order.status === 'pending'">
            <p>Do you want to approve or reject this order?</p>
            <v-radio-group v-model="actionDialog.action" class="mt-4">
              <v-radio label="Approve Order" value="approve"></v-radio>
              <v-radio label="Reject Order" value="reject"></v-radio>
            </v-radio-group>
            <v-textarea
              v-if="actionDialog.action === 'reject'"
              v-model="actionDialog.reason"
              label="Rejection Reason"
              rows="3"
              required
            ></v-textarea>
          </template>
          <template v-else>
            <p>Are you sure you want to {{ getActionLabel }} this order?</p>
            <v-textarea
              v-model="actionDialog.note"
              label="Additional Notes"
              rows="3"
            ></v-textarea>
          </template>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="actionDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            :color="actionDialog.action === 'reject' ? 'error' : 'success'"
            variant="text"
            @click="confirmAction"
            :loading="actionDialog.loading"
            :disabled="actionDialog.action === 'reject' && !actionDialog.reason"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dispute Details Dialog -->
    <v-dialog v-model="disputeDialog.show" max-width="800">
      <v-card v-if="disputeDialog.dispute">
        <v-card-title class="text-h5">
          Dispute for Order #{{ disputeDialog.dispute.order.orderNumber }}
        </v-card-title>

        <v-card-text>
          <OrderDispute
            :order="disputeDialog.dispute.order"
            :dispute="disputeDialog.dispute"
            @update:dispute="updateDispute"
          />
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="disputeDialog.show = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { format } from 'date-fns';
import { useToast } from 'vue-toastification';
import { useStore } from 'vuex';
import OrderDispute from '@/components/admin/OrderDispute.vue';

const store = useStore();
const toast = useToast();

// Table configuration
const headers = [
  { title: 'Order #', key: 'orderNumber', sortable: true },
  { title: 'Restaurant', key: 'restaurant.name', sortable: true },
  { title: 'Customer', key: 'customer.name', sortable: true },
  { title: 'Total', key: 'total', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Payment', key: 'paymentStatus', sortable: true },
  { title: 'Created At', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
];

// State
const loading = ref(false);
const page = ref(1);
const itemsPerPage = ref(10);
const totalOrders = ref(0);
const orders = ref([]);

const filters = ref({
  search: '',
  status: null,
  restaurant: null,
  startDate: null,
  endDate: null
});

const startDateMenu = ref(false);
const endDateMenu = ref(false);

const orderStats = ref({
  total: 0,
  totalChange: 0,
  revenue: 0,
  revenueChange: 0,
  avgOrderValue: 0,
  avgOrderValueChange: 0,
  cancellationRate: 0,
  cancellationRateChange: 0
});

// Dialog state
const orderDialog = ref({
  show: false,
  order: null,
  dispute: null
});

const actionDialog = ref({
  show: false,
  order: null,
  action: 'approve',
  reason: '',
  note: '',
  loading: false
});

// Options
const statusOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Confirmed', value: 'confirmed' },
  { title: 'Preparing', value: 'preparing' },
  { title: 'Ready for Pickup', value: 'ready_for_pickup' },
  { title: 'Out for Delivery', value: 'out_for_delivery' },
  { title: 'Delivered', value: 'delivered' },
  { title: 'Cancelled', value: 'cancelled' }
];

const restaurantOptions = computed(() => store.state.restaurants.list);

const orderStatusTimeline = [
  {
    status: 'pending',
    label: 'Order Placed',
    description: 'Waiting for restaurant confirmation',
    icon: 'mdi-clock-outline'
  },
  {
    status: 'confirmed',
    label: 'Order Confirmed',
    description: 'Restaurant has accepted the order',
    icon: 'mdi-check-circle-outline'
  },
  {
    status: 'preparing',
    label: 'Preparing',
    description: 'Restaurant is preparing the order',
    icon: 'mdi-food-outline'
  },
  {
    status: 'ready_for_pickup',
    label: 'Ready for Pickup',
    description: 'Order is ready for driver pickup',
    icon: 'mdi-package-variant-closed'
  },
  {
    status: 'out_for_delivery',
    label: 'Out for Delivery',
    description: 'Driver is delivering the order',
    icon: 'mdi-truck-delivery-outline'
  },
  {
    status: 'delivered',
    label: 'Delivered',
    description: 'Order has been delivered',
    icon: 'mdi-check-circle'
  }
];

// Computed
const getActionDialogTitle = computed(() => {
  if (actionDialog.value.order?.status === 'pending') {
    return 'Review Order';
  }
  return `Update Order Status`;
});

const getActionLabel = computed(() => {
  const status = actionDialog.value.order?.status;
  switch (status) {
    case 'confirmed': return 'start preparing';
    case 'preparing': return 'mark as ready';
    case 'ready_for_pickup': return 'mark as out for delivery';
    case 'out_for_delivery': return 'mark as delivered';
    default: return 'update';
  }
});

// Methods
const fetchOrders = async () => {
  try {
    loading.value = true;
    const response = await store.dispatch('orders/fetchOrders', {
      page: page.value,
      limit: itemsPerPage.value,
      ...filters.value
    });
    orders.value = response.orders;
    totalOrders.value = response.total;
    orderStats.value = response.stats;
  } catch (error) {
    toast.error('Failed to load orders');
    console.error('Failed to fetch orders:', error);
  } finally {
    loading.value = false;
  }
};

const handlePageChange = (newPage) => {
  page.value = newPage;
  fetchOrders();
};

const resetFilters = () => {
  filters.value = {
    search: '',
    status: null,
    restaurant: null,
    startDate: null,
    endDate: null
  };
  fetchOrders();
};

const applyFilters = () => {
  fetchOrders();
};

const openOrderDetails = async (order) => {
  try {
    const [orderDetails, dispute] = await Promise.all([
      store.dispatch('orders/fetchOrderDetails', order.id),
      store.dispatch('disputes/fetchDisputeByOrder', order.id)
    ]);
    
    orderDialog.value = {
      show: true,
      order: orderDetails,
      dispute: dispute
    };
  } catch (error) {
    toast.error('Failed to load order details');
    console.error('Failed to load order details:', error);
  }
};

const openActionDialog = (order) => {
  actionDialog.value = {
    show: true,
    order,
    action: order.status === 'pending' ? 'approve' : 'update',
    reason: '',
    note: '',
    loading: false
  };
};

const confirmAction = async () => {
  if (!actionDialog.value.order) return;

  actionDialog.value.loading = true;
  try {
    let newStatus;
    if (actionDialog.value.order.status === 'pending') {
      if (actionDialog.value.action === 'approve') {
        newStatus = 'confirmed';
      } else {
        newStatus = 'cancelled';
      }
    } else {
      newStatus = getNextStatus(actionDialog.value.order.status);
    }

    await store.dispatch('orders/updateOrderStatus', {
      orderId: actionDialog.value.order.id,
      status: newStatus,
      reason: actionDialog.value.reason,
      note: actionDialog.value.note
    });

    toast.success('Order status updated successfully');
    actionDialog.value.show = false;
    fetchOrders();

    // Update order in details dialog if open
    if (orderDialog.value.show && orderDialog.value.order?.id === actionDialog.value.order.id) {
      orderDialog.value.order.status = newStatus;
    }
  } catch (error) {
    toast.error('Failed to update order status');
    console.error('Failed to update order status:', error);
  } finally {
    actionDialog.value.loading = false;
  }
};

const getNextStatus = (currentStatus) => {
  const statusFlow = {
    confirmed: 'preparing',
    preparing: 'ready_for_pickup',
    ready_for_pickup: 'out_for_delivery',
    out_for_delivery: 'delivered'
  };
  return statusFlow[currentStatus] || currentStatus;
};

const getStatusColor = (status) => {
  const colors = {
    pending: 'warning',
    confirmed: 'info',
    preparing: 'info',
    ready_for_pickup: 'success',
    out_for_delivery: 'primary',
    delivered: 'success',
    cancelled: 'error'
  };
  return colors[status] || 'grey';
};

const getPaymentStatusColor = (status) => {
  const colors = {
    paid: 'success',
    pending: 'warning',
    failed: 'error',
    refunded: 'grey'
  };
  return colors[status] || 'grey';
};

const getTimelineColor = (timelineStatus, currentStatus) => {
  const statusOrder = orderStatusTimeline.map(s => s.status);
  const timelineIndex = statusOrder.indexOf(timelineStatus);
  const currentIndex = statusOrder.indexOf(currentStatus);
  
  if (currentStatus === 'cancelled') return 'grey';
  if (timelineIndex < currentIndex) return 'success';
  if (timelineIndex === currentIndex) return getStatusColor(currentStatus);
  return 'grey';
};

const getActionIcon = (status) => {
  switch (status) {
    case 'pending': return 'mdi-check-circle';
    case 'confirmed': return 'mdi-food';
    case 'preparing': return 'mdi-package-variant';
    case 'ready_for_pickup': return 'mdi-truck';
    case 'out_for_delivery': return 'mdi-check';
    default: return 'mdi-dots-horizontal';
  }
};

const formatStatus = (status) => {
  return status.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

const formatPaymentStatus = (status) => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatDateTime = (date) => {
  return format(new Date(date), 'MMM d, yyyy HH:mm');
};

const getStatusTimestamp = (status) => {
  if (!orderDialog.value.order) return null;
  const timestamps = {
    pending: orderDialog.value.order.createdAt,
    confirmed: orderDialog.value.order.confirmedAt,
    preparing: orderDialog.value.order.preparingAt,
    ready_for_pickup: orderDialog.value.order.readyAt,
    out_for_delivery: orderDialog.value.order.pickedUpAt,
    delivered: orderDialog.value.order.deliveredAt,
    cancelled: orderDialog.value.order.cancelledAt
  };
  return timestamps[status];
};

const canManageOrder = (order) => {
  return !['delivered', 'cancelled'].includes(order.status);
};

// Additional state for disputes
const viewMode = ref('orders');
const disputePage = ref(1);
const totalDisputes = ref(0);
const disputes = ref([]);
const disputeFilters = ref({
  search: '',
  status: null,
  reason: null
});

const disputeDialog = ref({
  show: false,
  dispute: null
});

// Additional options for disputes
const disputeHeaders = [
  { title: 'Order #', key: 'orderNumber', sortable: true },
  { title: 'Customer', key: 'order.customer.name', sortable: true },
  { title: 'Restaurant', key: 'order.restaurant.name', sortable: true },
  { title: 'Reason', key: 'reason', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Refund Amount', key: 'refundAmount', sortable: true },
  { title: 'Created At', key: 'createdAt', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false }
];

const disputeStatusOptions = [
  { title: 'Pending', value: 'pending' },
  { title: 'Approved', value: 'approved' },
  { title: 'Rejected', value: 'rejected' },
  { title: 'Resolved', value: 'resolved' }
];

const disputeReasonOptions = [
  'Wrong items received',
  'Missing items',
  'Quality issues',
  'Delivery issues',
  'Long delivery time',
  'Food safety concern',
  'Other'
];

// Additional computed properties
const pendingDisputesCount = computed(() => {
  return disputes.value.filter(d => d.status === 'pending').length;
});

// Additional methods for disputes
const fetchDisputes = async () => {
  try {
    loading.value = true;
    const response = await store.dispatch('disputes/fetchDisputes', {
      page: disputePage.value,
      limit: itemsPerPage.value,
      ...disputeFilters.value
    });
    disputes.value = response.disputes;
    totalDisputes.value = response.total;
  } catch (error) {
    toast.error('Failed to load disputes');
    console.error('Failed to fetch disputes:', error);
  } finally {
    loading.value = false;
  }
};

const handleDisputePageChange = (newPage) => {
  disputePage.value = newPage;
  fetchDisputes();
};

const openDisputeDetails = (dispute) => {
  disputeDialog.value = {
    show: true,
    dispute: { ...dispute }
  };
};

const updateDispute = (updatedDispute) => {
  if (orderDialog.value.show && orderDialog.value.order.id === updatedDispute.orderId) {
    orderDialog.value.dispute = updatedDispute;
  }
  if (disputeDialog.value.show && disputeDialog.value.dispute.id === updatedDispute.id) {
    disputeDialog.value.dispute = updatedDispute;
  }
  // Refresh lists
  fetchDisputes();
  fetchOrders();
};

// Watch for viewMode changes
watch(viewMode, (newMode) => {
  if (newMode === 'disputes') {
    fetchDisputes();
  }
});

// Initialize
onMounted(() => {
  fetchOrders();
});
</script>