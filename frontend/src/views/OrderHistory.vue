<template>
  <v-container class="order-history-page py-8">
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4 font-weight-bold">Order History</h1>
      
      <div class="d-flex">
        <v-text-field
          v-model="searchQuery"
          placeholder="Search orders..."
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-magnify"
          hide-details
          class="me-2"
          style="max-width: 250px"
          @update:model-value="filterOrders"
        ></v-text-field>
        
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              variant="outlined"
              prepend-icon="mdi-filter"
            >
              Filter
            </v-btn>
          </template>
          <v-card min-width="250" class="pa-3">
            <v-card-text class="pb-0">
              <div class="text-subtitle-1 mb-2">Time Period</div>
              <v-radio-group
                v-model="timePeriod"
                density="compact"
                hide-details
                @update:model-value="filterOrders"
              >
                <v-radio value="all" label="All Time"></v-radio>
                <v-radio value="30days" label="Last 30 Days"></v-radio>
                <v-radio value="6months" label="Last 6 Months"></v-radio>
                <v-radio value="year" label="Last Year"></v-radio>
              </v-radio-group>
              
              <v-divider class="my-3"></v-divider>
              
              <div class="text-subtitle-1 mb-2">Order Status</div>
              <v-checkbox
                v-model="statusFilter"
                label="Delivered"
                value="delivered"
                hide-details
                density="compact"
                class="mb-1"
                @update:model-value="filterOrders"
              ></v-checkbox>
              <v-checkbox
                v-model="statusFilter"
                label="In Progress"
                value="in_progress"
                hide-details
                density="compact"
                class="mb-1"
                @update:model-value="filterOrders"
              ></v-checkbox>
              <v-checkbox
                v-model="statusFilter"
                label="Cancelled"
                value="cancelled"
                hide-details
                density="compact"
                @update:model-value="filterOrders"
              ></v-checkbox>
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                @click="resetFilters"
              >
                Reset Filters
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-menu>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading your order history...</p>
    </div>

    <div v-else-if="filteredOrders.length === 0" class="empty-orders text-center py-12">
      <v-icon color="grey" size="100">mdi-receipt</v-icon>
      <h2 class="text-h5 mt-6 mb-2">No orders found</h2>
      <p v-if="hasFilters" class="text-body-1 mb-4">
        Try adjusting your filters to see more orders
      </p>
      <p v-else class="text-body-1 mb-4">
        You haven't placed any orders yet
      </p>
      <v-btn
        color="primary"
        size="large"
        to="/"
        prepend-icon="mdi-food"
      >
        Browse Restaurants
      </v-btn>
    </div>

    <div v-else>
      <!-- Desktop View (Table) -->
      <v-card class="d-none d-md-block mb-6">
        <v-data-table
          :headers="tableHeaders"
          :items="filteredOrders"
          :items-per-page="10"
          class="elevation-1"
        >
          <template v-slot:item.id="{ item }">
            <div class="font-weight-medium">
              #{{ item.id }}
            </div>
          </template>
          
          <template v-slot:item.restaurant="{ item }">
            <div class="d-flex align-center">
              <v-avatar size="32" class="me-2">
                <v-img :src="item.restaurant.image" :alt="item.restaurant.name"></v-img>
              </v-avatar>
              <span>{{ item.restaurant.name }}</span>
            </div>
          </template>
          
          <template v-slot:item.total="{ item }">
            ${{ item.total.toFixed(2) }}
          </template>
          
          <template v-slot:item.date="{ item }">
            {{ formatDate(item.date) }}
          </template>
          
          <template v-slot:item.status="{ item }">
            <v-chip
              :color="getStatusColor(item.status)"
              size="small"
              :text-color="item.status === 'cancelled' ? 'white' : undefined"
            >
              {{ getStatusText(item.status) }}
            </v-chip>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <div class="d-flex">
              <v-btn
                icon="mdi-eye"
                variant="text"
                size="small"
                :to="{ name: 'OrderDetail', params: { id: item.id } }"
                class="me-2"
              >
                <v-tooltip activator="parent" location="top">View Order</v-tooltip>
              </v-btn>
              
              <v-btn
                v-if="item.status === 'delivered'"
                icon="mdi-star"
                variant="text"
                size="small"
                @click="openRatingDialog(item)"
                class="me-2"
              >
                <v-tooltip activator="parent" location="top">Rate Order</v-tooltip>
              </v-btn>
              
              <v-btn
                icon="mdi-repeat"
                variant="text"
                size="small"
                @click="reorderItems(item)"
              >
                <v-tooltip activator="parent" location="top">Order Again</v-tooltip>
              </v-btn>
            </div>
          </template>
        </v-data-table>
      </v-card>

      <!-- Mobile View (Cards) -->
      <div class="d-md-none">
        <v-card
          v-for="order in filteredOrders"
          :key="order.id"
          class="mb-4"
        >
          <v-card-title class="d-flex justify-space-between align-center">
            <div>Order #{{ order.id }}</div>
            <v-chip
              :color="getStatusColor(order.status)"
              size="small"
              :text-color="order.status === 'cancelled' ? 'white' : undefined"
            >
              {{ getStatusText(order.status) }}
            </v-chip>
          </v-card-title>
          
          <v-card-text>
            <div class="d-flex align-center mb-3">
              <v-avatar size="36" class="me-3">
                <v-img :src="order.restaurant.image" :alt="order.restaurant.name"></v-img>
              </v-avatar>
              <div>
                <div class="text-subtitle-1">{{ order.restaurant.name }}</div>
                <div class="text-caption">{{ formatDate(order.date) }}</div>
              </div>
            </div>
            
            <div>
              <div class="text-body-2 mb-1">
                <span class="text-medium-emphasis">Items:</span> {{ getItemsSummary(order.items) }}
              </div>
              <div class="font-weight-bold">
                <span class="text-medium-emphasis">Total:</span> ${{ order.total.toFixed(2) }}
              </div>
            </div>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <v-card-actions>
            <v-btn
              variant="text"
              :to="{ name: 'OrderDetail', params: { id: order.id } }"
              size="small"
            >
              View Details
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              v-if="order.status === 'delivered'"
              variant="text"
              size="small"
              prepend-icon="mdi-star"
              @click="openRatingDialog(order)"
            >
              Rate
            </v-btn>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              prepend-icon="mdi-repeat"
              @click="reorderItems(order)"
            >
              Order Again
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>

      <!-- Pagination -->
      <div class="text-center mt-6" v-if="filteredOrders.length > 10">
        <v-pagination
          v-model="page"
          :length="Math.ceil(filteredOrders.length / 10)"
          :total-visible="7"
        ></v-pagination>
      </div>
    </div>

    <!-- Rating Dialog -->
    <v-dialog v-model="showRatingDialog" max-width="500">
      <v-card v-if="selectedOrder">
        <v-card-title class="text-h5">
          Rate your order from {{ selectedOrder.restaurant.name }}
        </v-card-title>
        
        <v-card-text>
          <div class="text-center mb-4">
            <div class="mb-2">How was your food?</div>
            <v-rating
              v-model="rating.food"
              color="amber"
              half-increments
              hover
              size="large"
            ></v-rating>
            <div class="text-caption">{{ getRatingLabel(rating.food) }}</div>
          </div>
          
          <div class="text-center mb-4">
            <div class="mb-2">How was the delivery?</div>
            <v-rating
              v-model="rating.delivery"
              color="amber"
              half-increments
              hover
              size="large"
            ></v-rating>
            <div class="text-caption">{{ getRatingLabel(rating.delivery) }}</div>
          </div>
          
          <v-textarea
            v-model="rating.comment"
            label="Any additional comments? (optional)"
            variant="outlined"
            rows="3"
            auto-grow
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeRatingDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="submitRating"
            :disabled="!isRatingValid"
            :loading="isSubmittingRating"
          >
            Submit
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
export default {
  name: 'OrderHistoryView',
  data() {
    return {
      isLoading: true,
      orders: [],
      filteredOrders: [],
      page: 1,
      
      // Filters
      searchQuery: '',
      timePeriod: 'all',
      statusFilter: ['delivered', 'in_progress', 'cancelled'],
      
      // Table headers
      tableHeaders: [
        { title: 'Order ID', key: 'id', sortable: true },
        { title: 'Restaurant', key: 'restaurant', sortable: true },
        { title: 'Date', key: 'date', sortable: true },
        { title: 'Total', key: 'total', sortable: true },
        { title: 'Status', key: 'status', sortable: true },
        { title: 'Actions', key: 'actions', sortable: false }
      ],
      
      // Rating dialog
      showRatingDialog: false,
      selectedOrder: null,
      rating: {
        food: 0,
        delivery: 0,
        comment: ''
      },
      isSubmittingRating: false
    };
  },
  computed: {
    hasFilters() {
      return (
        this.searchQuery.trim() !== '' ||
        this.timePeriod !== 'all' ||
        this.statusFilter.length !== 3
      );
    },
    isRatingValid() {
      return this.rating.food > 0 && this.rating.delivery > 0;
    }
  },
  created() {
    this.loadOrderHistory();
  },
  methods: {
    loadOrderHistory() {
      // In a real app, this would fetch order history from the API
      setTimeout(() => {
        // Mock order data
        this.orders = [
          {
            id: '987654',
            restaurant: {
              id: 1,
              name: 'Burger Palace',
              image: '/images/restaurants/burger-logo.jpg'
            },
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            items: [
              { name: 'Classic Cheeseburger', quantity: 2 },
              { name: 'French Fries', quantity: 1 },
              { name: 'Soft Drink', quantity: 2 }
            ],
            total: 32.10,
            status: 'delivered',
            rated: false
          },
          {
            id: '876543',
            restaurant: {
              id: 2,
              name: 'Pizza Hut',
              image: '/images/restaurants/pizza-hut.jpg'
            },
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            items: [
              { name: 'Pepperoni Pizza (Large)', quantity: 1 },
              { name: 'Garlic Breadsticks', quantity: 1 },
              { name: 'Sprite', quantity: 2 }
            ],
            total: 35.75,
            status: 'delivered',
            rated: true
          },
          {
            id: '765432',
            restaurant: {
              id: 3,
              name: 'Sushi Palace',
              image: '/images/restaurants/sushi.jpg'
            },
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
            items: [
              { name: 'California Roll', quantity: 2 },
              { name: 'Spicy Tuna Roll', quantity: 1 },
              { name: 'Miso Soup', quantity: 2 }
            ],
            total: 45.20,
            status: 'delivered',
            rated: false
          },
          {
            id: '654321',
            restaurant: {
              id: 4,
              name: 'Taco Bell',
              image: '/images/restaurants/taco-bell.jpg'
            },
            date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
            items: [
              { name: 'Crunchy Taco', quantity: 3 },
              { name: 'Burrito Supreme', quantity: 1 },
              { name: 'Nacho Fries', quantity: 1 }
            ],
            total: 22.45,
            status: 'cancelled',
            rated: false
          },
          {
            id: '123456',
            restaurant: {
              id: 1,
              name: 'Burger Palace',
              image: '/images/restaurants/burger-logo.jpg'
            },
            date: new Date(), // Today
            items: [
              { name: 'Veggie Burger', quantity: 1 },
              { name: 'Onion Rings', quantity: 1 },
              { name: 'Chocolate Milkshake', quantity: 1 }
            ],
            total: 21.97,
            status: 'in_progress',
            rated: false
          }
        ];
        
        this.filterOrders();
        this.isLoading = false;
      }, 1500);
    },
    
    filterOrders() {
      let filtered = [...this.orders];
      
      // Filter by search query
      if (this.searchQuery.trim() !== '') {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(order => 
          order.id.toLowerCase().includes(query) ||
          order.restaurant.name.toLowerCase().includes(query) ||
          order.items.some(item => item.name.toLowerCase().includes(query))
        );
      }
      
      // Filter by time period
      if (this.timePeriod !== 'all') {
        const now = new Date();
        let cutoffDate;
        
        if (this.timePeriod === '30days') {
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (this.timePeriod === '6months') {
          cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        } else if (this.timePeriod === 'year') {
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        }
        
        filtered = filtered.filter(order => new Date(order.date) >= cutoffDate);
      }
      
      // Filter by status
      if (this.statusFilter.length < 3) {
        filtered = filtered.filter(order => {
          // Map order status to filter status
          let status = order.status;
          if (status !== 'delivered' && status !== 'cancelled') {
            status = 'in_progress';
          }
          
          return this.statusFilter.includes(status);
        });
      }
      
      // Sort by date (newest first)
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      this.filteredOrders = filtered;
      this.page = 1; // Reset to first page
    },
    
    resetFilters() {
      this.searchQuery = '';
      this.timePeriod = 'all';
      this.statusFilter = ['delivered', 'in_progress', 'cancelled'];
      this.filterOrders();
    },
    
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
      
      // Otherwise, show full date
      return orderDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
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
    
    getItemsSummary(items) {
      if (!items || items.length === 0) {
        return 'No items';
      }
      
      if (items.length === 1) {
        return `${items[0].quantity}x ${items[0].name}`;
      }
      
      return `${items[0].quantity}x ${items[0].name} + ${items.length - 1} more`;
    },
    
    getRatingLabel(rating) {
      if (rating === 0) return '';
      if (rating < 2) return 'Poor';
      if (rating < 3) return 'Fair';
      if (rating < 4) return 'Good';
      if (rating < 5) return 'Very Good';
      return 'Excellent';
    },
    
    openRatingDialog(order) {
      this.selectedOrder = order;
      this.rating = {
        food: 0,
        delivery: 0,
        comment: ''
      };
      this.showRatingDialog = true;
    },
    
    closeRatingDialog() {
      this.showRatingDialog = false;
      this.selectedOrder = null;
      this.rating = {
        food: 0,
        delivery: 0,
        comment: ''
      };
    },
    
    async submitRating() {
      if (!this.isRatingValid) return;
      
      this.isSubmittingRating = true;
      
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update order as rated
        if (this.selectedOrder) {
          const index = this.orders.findIndex(o => o.id === this.selectedOrder.id);
          if (index !== -1) {
            this.orders[index].rated = true;
          }
        }
        
        // Mock API submission
        console.log('Rating submitted:', {
          orderId: this.selectedOrder.id,
          restaurantId: this.selectedOrder.restaurant.id,
          food: this.rating.food,
          delivery: this.rating.delivery,
          comment: this.rating.comment
        });
        
        // Success message
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Thank you for your feedback!',
          color: 'success'
        });
        
        this.closeRatingDialog();
      } catch (error) {
        console.error('Error submitting rating:', error);
      } finally {
        this.isSubmittingRating = false;
      }
    },
    
    async reorderItems(order) {
      try {
        // In a real app, this would add the items to the cart and redirect to checkout
        console.log('Reordering:', order.items);
        
        // Success message
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Items added to cart',
          color: 'success'
        });
        
        // Redirect to restaurant page or cart
        this.$router.push({ 
          name: 'RestaurantDetail', 
          params: { id: order.restaurant.id } 
        });
      } catch (error) {
        console.error('Error reordering items:', error);
      }
    }
  }
};
</script>

<style scoped>
.order-history-page {
  min-height: 60vh;
}
</style> 