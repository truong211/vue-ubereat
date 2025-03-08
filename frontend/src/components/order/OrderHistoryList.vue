<template>
  <div class="order-history-list">
    <slot name="header">
      <h3 v-if="showTitle" class="text-h6 mb-4">{{ title }}</h3>
    </slot>
    
    <!-- Empty state -->
    <div v-if="!isLoading && orders.length === 0" class="text-center py-4">
      <v-icon color="grey" size="64">mdi-receipt-text-outline</v-icon>
      <p class="mt-2 text-medium-emphasis">{{ emptyStateText }}</p>
      <slot name="empty-actions">
        <v-btn
          v-if="showBrowseButton"
          color="primary"
          class="mt-2"
          variant="text"
          to="/"
          prepend-icon="mdi-food"
        >
          Browse Restaurants
        </v-btn>
      </slot>
    </div>
    
    <!-- Loading state -->
    <div v-else-if="isLoading" class="d-flex justify-center align-center py-6">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    
    <!-- Order list -->
    <div v-else>
      <!-- List view -->
      <v-list v-if="display === 'list'" lines="two">
        <v-list-item
          v-for="order in limitedOrders"
          :key="order.id"
          :to="linkEnabled ? { name: 'OrderDetail', params: { id: order.id } } : undefined"
          :class="{'cursor-pointer': linkEnabled}"
          rounded="lg"
          class="mb-2"
        >
          <template v-slot:prepend>
            <v-avatar :image="order.restaurant.image" size="44">
              <v-icon v-if="!order.restaurant.image">mdi-store</v-icon>
            </v-avatar>
          </template>
          
          <v-list-item-title class="d-flex justify-space-between">
            <span>{{ order.restaurant.name }}</span>
            <v-chip
              :color="getStatusColor(order.status)"
              size="small"
              density="compact"
              class="ml-2"
            >
              {{ getStatusText(order.status) }}
            </v-chip>
          </v-list-item-title>
          
          <v-list-item-subtitle class="d-flex justify-space-between text-caption mt-1">
            <span>
              {{ formatDate(order.date) }}
            </span>
            <span class="font-weight-medium">${{ order.total.toFixed(2) }}</span>
          </v-list-item-subtitle>
          
          <template v-if="showActions && actionsEnabled" v-slot:append>
            <v-btn
              icon="mdi-repeat"
              variant="text"
              size="small"
              @click.stop="reorderItems(order)"
              :disabled="!isReorderEnabled(order)"
            >
              <v-tooltip activator="parent" location="top">Order Again</v-tooltip>
            </v-btn>
          </template>
        </v-list-item>
      </v-list>
      
      <!-- Card view -->
      <div v-else-if="display === 'card'">
        <v-card
          v-for="order in limitedOrders"
          :key="order.id"
          :to="linkEnabled ? { name: 'OrderDetail', params: { id: order.id } } : undefined"
          class="mb-3"
          variant="outlined"
        >
          <v-card-title class="d-flex justify-space-between py-2 px-4">
            <div class="text-subtitle-1">Order #{{ order.id }}</div>
            <v-chip
              :color="getStatusColor(order.status)"
              size="small"
              density="compact"
            >
              {{ getStatusText(order.status) }}
            </v-chip>
          </v-card-title>
          
          <v-card-text class="py-2 px-4">
            <div class="d-flex">
              <v-avatar class="mr-3" :image="order.restaurant.image" size="36">
                <v-icon v-if="!order.restaurant.image">mdi-store</v-icon>
              </v-avatar>
              <div>
                <div class="font-weight-medium">{{ order.restaurant.name }}</div>
                <div class="text-caption text-medium-emphasis">{{ formatDate(order.date) }}</div>
              </div>
              <v-spacer></v-spacer>
              <div class="text-subtitle-1 text-right">${{ order.total.toFixed(2) }}</div>
            </div>
            
            <div v-if="showItems" class="mt-2 text-caption">
              {{ formatItems(order.items) }}
            </div>
          </v-card-text>
          
          <v-divider v-if="showActions && actionsEnabled"></v-divider>
          
          <v-card-actions v-if="showActions && actionsEnabled" class="py-1 px-2">
            <v-spacer></v-spacer>
            <slot name="card-actions" :order="order">
              <v-btn
                variant="text"
                density="comfortable"
                size="small"
                prepend-icon="mdi-repeat"
                @click.stop="reorderItems(order)"
                :disabled="!isReorderEnabled(order)"
              >
                Order Again
              </v-btn>
            </slot>
          </v-card-actions>
        </v-card>
      </div>
      
      <!-- Simple view -->
      <div v-else class="simple-list">
        <div
          v-for="order in limitedOrders"
          :key="order.id"
          class="simple-list-item pa-3 mb-2 rounded"
          :class="{'cursor-pointer': linkEnabled}"
          @click="linkEnabled ? navigateToOrder(order.id) : null"
        >
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-avatar size="32" class="mr-2" :image="order.restaurant.image">
                <v-icon v-if="!order.restaurant.image">mdi-store</v-icon>
              </v-avatar>
              <div>
                <div class="text-body-2 font-weight-medium">{{ order.restaurant.name }}</div>
                <div class="text-caption">{{ formatDate(order.date) }}</div>
              </div>
            </div>
            <div class="text-right">
              <div class="text-body-2 font-weight-medium">${{ order.total.toFixed(2) }}</div>
              <v-chip
                :color="getStatusColor(order.status)"
                size="x-small"
                density="compact"
                class="mt-1"
              >
                {{ getStatusText(order.status) }}
              </v-chip>
            </div>
          </div>
          
          <div v-if="showActions && actionsEnabled" class="d-flex justify-end mt-1">
            <v-btn
              variant="text"
              density="compact"
              size="x-small"
              class="px-1"
              @click.stop="reorderItems(order)"
              :disabled="!isReorderEnabled(order)"
            >
              <v-icon size="small" class="mr-1">mdi-repeat</v-icon>
              Order Again
            </v-btn>
          </div>
        </div>
      </div>
      
      <!-- View All link -->
      <div v-if="hasMoreOrders && showViewAllLink" class="text-center mt-4">
        <v-btn
          variant="text"
          color="primary"
          :to="{ name: 'OrderHistory' }"
          :block="display === 'simple'"
        >
          View All Orders
          <v-icon end>mdi-chevron-right</v-icon>
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OrderHistoryList',
  
  props: {
    // Orders data
    orders: {
      type: Array,
      default: () => []
    },
    
    // Loading state
    isLoading: {
      type: Boolean,
      default: false
    },
    
    // Display options
    title: {
      type: String,
      default: 'Recent Orders'
    },
    
    showTitle: {
      type: Boolean,
      default: true
    },
    
    emptyStateText: {
      type: String,
      default: 'No orders found'
    },
    
    display: {
      type: String,
      default: 'list',
      validator: value => ['list', 'card', 'simple'].includes(value)
    },
    
    maxItems: {
      type: Number,
      default: 5
    },
    
    showViewAllLink: {
      type: Boolean,
      default: true
    },
    
    showBrowseButton: {
      type: Boolean,
      default: true
    },
    
    showItems: {
      type: Boolean,
      default: false
    },
    
    showActions: {
      type: Boolean,
      default: true
    },
    
    // Functionality options
    linkEnabled: {
      type: Boolean,
      default: true
    },
    
    actionsEnabled: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['reorder'],
  
  computed: {
    limitedOrders() {
      return this.orders.slice(0, this.maxItems);
    },
    
    hasMoreOrders() {
      return this.orders.length > this.maxItems;
    }
  },
  
  methods: {
    formatDate(date) {
      const orderDate = new Date(date);
      
      // If today, show "Today"
      const today = new Date();
      if (orderDate.toDateString() === today.toDateString()) {
        return `Today at ${orderDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      }
      
      // If yesterday, show "Yesterday"
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (orderDate.toDateString() === yesterday.toDateString()) {
        return `Yesterday at ${orderDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
      }
      
      // Otherwise, show date
      return orderDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    },
    
    formatItems(items) {
      if (!items || items.length === 0) {
        return 'No items';
      }
      
      if (items.length === 1) {
        return `${items[0].quantity}x ${items[0].name}`;
      }
      
      return `${items[0].quantity}x ${items[0].name} + ${items.length - 1} more`;
    },
    
    getStatusColor(status) {
      const statusColors = {
        delivered: 'success',
        in_progress: 'info',
        pending: 'warning',
        confirmed: 'info',
        preparing: 'info',
        ready: 'info',
        on_the_way: 'info',
        cancelled: 'error'
      };
      
      return statusColors[status] || 'grey';
    },
    
    getStatusText(status) {
      const statusTexts = {
        delivered: 'Delivered',
        in_progress: 'In Progress',
        pending: 'Pending',
        confirmed: 'Confirmed',
        preparing: 'Preparing',
        ready: 'Ready',
        on_the_way: 'On the Way',
        cancelled: 'Cancelled'
      };
      
      return statusTexts[status] || 'Unknown';
    },
    
    reorderItems(order) {
      this.$emit('reorder', order);
    },
    
    navigateToOrder(orderId) {
      if (this.linkEnabled) {
        this.$router.push({ name: 'OrderDetail', params: { id: orderId } });
      }
    },
    
    isReorderEnabled(order) {
      // Only allow reordering for delivered orders
      return order.status === 'delivered' || order.status === 'cancelled';
    }
  }
};
</script>

<style scoped>
.cursor-pointer {
  cursor: pointer;
}

.simple-list-item {
  background-color: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.09);
  transition: background-color 0.2s ease;
}

.cursor-pointer.simple-list-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}
</style>