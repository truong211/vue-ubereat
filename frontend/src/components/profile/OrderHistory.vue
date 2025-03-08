<template>
  <div class="order-history">
    <div class="d-flex justify-space-between align-center mb-6">
      <h2 class="text-h5">Order History</h2>
      <v-text-field
        v-model="orderSearch"
        append-inner-icon="mdi-magnify"
        label="Search orders"
        density="compact"
        hide-details
        variant="outlined"
        class="max-width-200"
      ></v-text-field>
    </div>
    
    <div v-if="isLoading" class="text-center py-6">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading your orders...</p>
    </div>
    
    <div v-else-if="filteredOrders.length === 0" class="text-center py-6">
      <v-icon size="64" color="grey">mdi-package-variant</v-icon>
      <h3 class="text-h6 mt-4 mb-2">No orders found</h3>
      <p class="mb-4">You haven't placed any orders yet</p>
      <v-btn color="primary" to="/">Browse Restaurants</v-btn>
    </div>
    
    <v-card
      v-for="(order, index) in filteredOrders"
      :key="order.id"
      class="mb-4"
      :class="{ 'border-primary': order.status === 'active' }"
    >
      <v-card-title class="d-flex justify-space-between align-center">
        <div>
          <span class="text-subtitle-1">Order #{{ order.orderNumber }}</span>
          <v-chip
            size="small"
            :color="getOrderStatusColor(order.status)"
            class="ml-2"
          >
            {{ getOrderStatusText(order.status) }}
          </v-chip>
        </div>
        <span class="text-caption text-medium-emphasis">{{ formatDate(order.date) }}</span>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text>
        <div class="d-flex align-start mb-4">
          <v-avatar size="48" class="mr-4">
            <v-img :src="order.restaurant.image" alt="Restaurant"></v-img>
          </v-avatar>
          <div>
            <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ order.restaurant.name }}</h3>
            <p class="text-caption text-medium-emphasis mb-0">{{ order.restaurant.address }}</p>
          </div>
        </div>
        
        <v-list density="compact" class="bg-transparent pa-0">
          <v-list-item
            v-for="(item, itemIndex) in order.items"
            :key="itemIndex"
            class="px-0"
          >
            <template v-slot:prepend>
              <span class="text-body-2 mr-2">{{ item.quantity }}x</span>
            </template>
            <v-list-item-title class="text-body-2">
              {{ item.name }}
            </v-list-item-title>
            <template v-slot:append>
              <span class="text-body-2">${{ (item.price * item.quantity).toFixed(2) }}</span>
            </template>
          </v-list-item>
        </v-list>
        
        <v-divider class="my-3"></v-divider>
        
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <span>Subtotal</span>
          <span>${{ order.subtotal.toFixed(2) }}</span>
        </div>
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <span>Delivery Fee</span>
          <span>${{ order.deliveryFee.toFixed(2) }}</span>
        </div>
        <div class="d-flex justify-space-between text-body-2 mb-1">
          <span>Tax</span>
          <span>${{ order.tax.toFixed(2) }}</span>
        </div>
        <div class="d-flex justify-space-between text-subtitle-1 font-weight-bold mt-2">
          <span>Total</span>
          <span>${{ order.total.toFixed(2) }}</span>
        </div>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions>
        <v-btn
          variant="text"
          prepend-icon="mdi-receipt"
          @click="viewOrderDetails(order.id)"
        >
          View Details
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          v-if="order.status === 'delivered'"
          color="primary"
          variant="text"
          prepend-icon="mdi-repeat"
          @click="reorderItems(order.id)"
        >
          Reorder
        </v-btn>
        <v-btn
          v-if="order.status === 'active'"
          color="error"
          variant="text"
          prepend-icon="mdi-close"
          @click="cancelOrder(order.id)"
        >
          Cancel Order
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <div class="text-center mt-4" v-if="orders.length > displayedOrderCount">
      <v-btn
        variant="outlined"
        @click="loadMoreOrders"
      >
        Load More Orders
      </v-btn>
    </div>
    
    <!-- Order Details Dialog -->
    <v-dialog v-model="showOrderDetailsDialog" max-width="600">
      <v-card v-if="selectedOrder">
        <v-card-title class="text-h5">
          Order #{{ selectedOrder.orderNumber }}
          <v-chip
            size="small"
            :color="getOrderStatusColor(selectedOrder.status)"
            class="ml-2"
          >
            {{ getOrderStatusText(selectedOrder.status) }}
          </v-chip>
        </v-card-title>
        
        <v-card-text>
          <p class="text-caption text-medium-emphasis mb-4">
            Placed on {{ formatDate(selectedOrder.date) }}
          </p>
          
          <div class="d-flex align-start mb-4">
            <v-avatar size="48" class="mr-4">
              <v-img :src="selectedOrder.restaurant.image" alt="Restaurant"></v-img>
            </v-avatar>
            <div>
              <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ selectedOrder.restaurant.name }}</h3>
              <p class="text-caption text-medium-emphasis mb-0">{{ selectedOrder.restaurant.address }}</p>
            </div>
          </div>
          
          <v-divider class="mb-4"></v-divider>
          
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Order Items</h3>
          <v-list density="compact" class="bg-transparent pa-0 mb-4">
            <v-list-item
              v-for="(item, itemIndex) in selectedOrder.items"
              :key="itemIndex"
              class="px-0"
            >
              <template v-slot:prepend>
                <span class="text-body-2 mr-2">{{ item.quantity }}x</span>
              </template>
              <v-list-item-title class="text-body-2">
                {{ item.name }}
                <div v-if="item.options && item.options.length" class="text-caption text-medium-emphasis">
                  {{ item.options.join(', ') }}
                </div>
              </v-list-item-title>
              <template v-slot:append>
                <span class="text-body-2">${{ (item.price * item.quantity).toFixed(2) }}</span>
              </template>
            </v-list-item>
          </v-list>
          
          <v-divider class="mb-4"></v-divider>
          
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Delivery Information</h3>
          <p class="mb-1"><strong>Address:</strong> {{ selectedOrder.deliveryAddress }}</p>
          <p class="mb-1"><strong>Delivery Instructions:</strong> {{ selectedOrder.deliveryInstructions || 'None' }}</p>
          <p class="mb-4"><strong>Estimated Delivery Time:</strong> {{ selectedOrder.estimatedDeliveryTime }}</p>
          
          <v-divider class="mb-4"></v-divider>
          
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Payment Summary</h3>
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span>Subtotal</span>
            <span>${{ selectedOrder.subtotal.toFixed(2) }}</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span>Delivery Fee</span>
            <span>${{ selectedOrder.deliveryFee.toFixed(2) }}</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span>Tax</span>
            <span>${{ selectedOrder.tax.toFixed(2) }}</span>
          </div>
          <div class="d-flex justify-space-between text-body-2 mb-1">
            <span>Tip</span>
            <span>${{ selectedOrder.tip.toFixed(2) }}</span>
          </div>
          <div class="d-flex justify-space-between text-subtitle-1 font-weight-bold mt-2">
            <span>Total</span>
            <span>${{ selectedOrder.total.toFixed(2) }}</span>
          </div>
          
          <v-divider class="my-4"></v-divider>
          
          <h3 class="text-subtitle-1 font-weight-bold mb-2">Payment Method</h3>
          <div class="d-flex align-center">
            <v-icon size="24" :color="getCardType(selectedOrder.paymentMethod.cardNumber).color" class="mr-2">
              {{ getCardType(selectedOrder.paymentMethod.cardNumber).icon }}
            </v-icon>
            <span>{{ getCardType(selectedOrder.paymentMethod.cardNumber).name }} •••• {{ selectedOrder.paymentMethod.cardNumber.slice(-4) }}</span>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-btn
            variant="text"
            prepend-icon="mdi-help-circle"
            @click="contactSupport(selectedOrder.id)"
          >
            Help
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="showOrderDetailsDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'OrderHistory',
  data() {
    return {
      isLoading: true,
      orderSearch: '',
      orders: [],
      displayedOrderCount: 5,
      showOrderDetailsDialog: false,
      selectedOrder: null
    };
  },
  computed: {
    filteredOrders() {
      if (!this.orderSearch) {
        return this.orders.slice(0, this.displayedOrderCount);
      }
      
      const search = this.orderSearch.toLowerCase();
      return this.orders
        .filter(order => 
          order.orderNumber.toLowerCase().includes(search) ||
          order.restaurant.name.toLowerCase().includes(search) ||
          this.getOrderStatusText(order.status).toLowerCase().includes(search)
        )
        .slice(0, this.displayedOrderCount);
    }
  },
  created() {
    this.loadOrders();
  },
  methods: {
    loadOrders() {
      // Simulate API call
      setTimeout(() => {
        this.orders = [
          {
            id: 1,
            orderNumber: 'OD1234567',
            date: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            status: 'active',
            restaurant: {
              id: 1,
              name: 'Burger Palace',
              address: '123 Main St, New York, NY',
              image: 'https://via.placeholder.com/48'
            },
            items: [
              { id: 1, name: 'Double Cheeseburger', quantity: 1, price: 8.99, options: ['No pickles', 'Extra cheese'] },
              { id: 2, name: 'French Fries (Large)', quantity: 1, price: 3.99 },
              { id: 3, name: 'Chocolate Milkshake', quantity: 1, price: 4.99 }
            ],
            subtotal: 17.97,
            deliveryFee: 2.99,
            tax: 1.80,
            tip: 3.00,
            total: 25.76,
            deliveryAddress: '456 Apartment Blvd, Apt 7B, New York, NY 10001',
            deliveryInstructions: 'Leave at door, please knock',
            estimatedDeliveryTime: '30-45 minutes',
            paymentMethod: {
              cardNumber: '4111111111111111',
              cardType: 'Visa'
            }
          },
          {
            id: 2,
            orderNumber: 'OD7654321',
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            status: 'delivered',
            restaurant: {
              id: 2,
              name: 'Pizza Heaven',
              address: '789 Broadway, New York, NY',
              image: 'https://via.placeholder.com/48'
            },
            items: [
              { id: 4, name: 'Large Pepperoni Pizza', quantity: 1, price: 14.99 },
              { id: 5, name: 'Garlic Knots', quantity: 1, price: 5.99 },
              { id: 6, name: 'Soda (2L)', quantity: 1, price: 2.99 }
            ],
            subtotal: 23.97,
            deliveryFee: 1.99,
            tax: 2.40,
            tip: 4.00,
            total: 32.36,
            deliveryAddress: '456 Apartment Blvd, Apt 7B, New York, NY 10001',
            deliveryInstructions: '',
            estimatedDeliveryTime: 'Delivered at 7:30 PM',
            paymentMethod: {
              cardNumber: '5555555555554444',
              cardType: 'MasterCard'
            }
          },
          {
            id: 3,
            orderNumber: 'OD9876543',
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
            status: 'delivered',
            restaurant: {
              id: 3,
              name: 'Sushi Express',
              address: '567 5th Ave, New York, NY',
              image: 'https://via.placeholder.com/48'
            },
            items: [
              { id: 7, name: 'California Roll (8 pcs)', quantity: 1, price: 7.99 },
              { id: 8, name: 'Spicy Tuna Roll (8 pcs)', quantity: 1, price: 9.99 },
              { id: 9, name: 'Miso Soup', quantity: 2, price: 2.50 }
            ],
            subtotal: 22.98,
            deliveryFee: 3.99,
            tax: 2.30,
            tip: 4.50,
            total: 33.77,
            deliveryAddress: '456 Apartment Blvd, Apt 7B, New York, NY 10001',
            deliveryInstructions: 'Call when arriving',
            estimatedDeliveryTime: 'Delivered at 8:15 PM',
            paymentMethod: {
              cardNumber: '4111111111111111',
              cardType: 'Visa'
            }
          },
          {
            id: 4,
            orderNumber: 'OD5432109',
            date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
            status: 'delivered',
            restaurant: {
              id: 4,
              name: 'Taco Fiesta',
              address: '890 Taco Lane, New York, NY',
              image: 'https://via.placeholder.com/48'
            },
            items: [
              { id: 10, name: 'Beef Taco Combo', quantity: 1, price: 12.99, options: ['Extra salsa'] },
              { id: 11, name: 'Guacamole & Chips', quantity: 1, price: 5.99 },
              { id: 12, name: 'Mexican Soda', quantity: 1, price: 2.49 }
            ],
            subtotal: 21.47,
            deliveryFee: 2.99,
            tax: 2.15,
            tip: 4.00,
            total: 30.61,
            deliveryAddress: '456 Apartment Blvd, Apt 7B, New York, NY 10001',
            deliveryInstructions: '',
            estimatedDeliveryTime: 'Delivered at 6:45 PM',
            paymentMethod: {
              cardNumber: '5555555555554444',
              cardType: 'MasterCard'
            }
          },
          {
            id: 5,
            orderNumber: 'OD1357924',
            date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
            status: 'delivered',
            restaurant: {
              id: 5,
              name: 'Noodle House',
              address: '123 Asian Ave, New York, NY',
              image: 'https://via.placeholder.com/48'
            },
            items: [
              { id: 13, name: 'Pad Thai', quantity: 1, price: 11.99, options: ['Chicken', 'Spicy'] },
              { id: 14, name: 'Spring Rolls (4 pcs)', quantity: 1, price: 6.99 },
              { id: 15, name: 'Thai Iced Tea', quantity: 1, price: 3.49 }
            ],
            subtotal: 22.47,
            deliveryFee: 3.99,
            tax: 2.25,
            tip: 4.50,
            total: 33.21,
            deliveryAddress: '456 Apartment Blvd, Apt 7B, New York, NY 10001',
            deliveryInstructions: 'Doorman building, leave with front desk',
            estimatedDeliveryTime: 'Delivered at 7:20 PM',
            paymentMethod: {
              cardNumber: '4111111111111111',
              cardType: 'Visa'
            }
          },
          {
            id: 6,
            orderNumber: 'OD2468013',
            date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
            status: 'delivered',
            restaurant: {
              id: 6,
              name: 'Salad & Co',
              address: '456 Healthy St, New York, NY',
              image: 'https://via.placeholder.com/48'
            },
            items: [
              { id: 16, name: 'Cobb Salad', quantity: 1, price: 12.99, options: ['No bacon', 'Extra avocado'] },
              { id: 17, name: 'Fruit Smoothie', quantity: 1, price: 5.99 }
            ],
            subtotal: 18.98,
            deliveryFee: 2.99,
            tax: 1.90,
            tip: 3.50,
            total: 27.37,
            deliveryAddress: '456 Apartment Blvd, Apt 7B, New York, NY 10001',
            deliveryInstructions: '',
            estimatedDeliveryTime: 'Delivered at 12:30 PM',
            paymentMethod: {
              cardNumber: '5555555555554444',
              cardType: 'MasterCard'
            }
          }
        ];
        
        this.isLoading = false;
      }, 1500);
    },
    
    loadMoreOrders() {
      this.displayedOrderCount += 5;
    },
    
    formatDate(date) {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    },
    
    getOrderStatusText(status) {
      switch (status) {
        case 'active':
          return 'In Progress';
        case 'delivered':
          return 'Delivered';
        case 'cancelled':
          return 'Cancelled';
        default:
          return status.charAt(0).toUpperCase() + status.slice(1);
      }
    },
    
    getOrderStatusColor(status) {
      switch (status) {
        case 'active':
          return 'primary';
        case 'delivered':
          return 'success';
        case 'cancelled':
          return 'error';
        default:
          return 'grey';
      }
    },
    
    getCardType(number) {
      // Remove spaces
      const cardNumber = number.replace(/\s/g, '');
      
      // Check first digit
      if (cardNumber.startsWith('4')) {
        return { name: 'Visa', icon: 'mdi-credit-card', color: 'blue' };
      } else if (cardNumber.startsWith('5')) {
        return { name: 'MasterCard', icon: 'mdi-credit-card', color: 'orange' };
      } else if (cardNumber.startsWith('3')) {
        return { name: 'Amex', icon: 'mdi-credit-card', color: 'green' };
      } else if (cardNumber.startsWith('6')) {
        return { name: 'Discover', icon: 'mdi-credit-card', color: 'red' };
      } else {
        return { name: 'Card', icon: 'mdi-credit-card', color: 'grey' };
      }
    },
    
    viewOrderDetails(orderId) {
      this.selectedOrder = this.orders.find(order => order.id === orderId);
      this.showOrderDetailsDialog = true;
    },
    
    reorderItems(orderId) {
      // In a real app, this would add the items to the cart
      alert(`Reordering items from order #${orderId}`);
    },
    
    cancelOrder(orderId) {
      if (confirm(`Are you sure you want to cancel order #${orderId}?`)) {
        // In a real app, this would call an API to cancel the order
        const orderIndex = this.orders.findIndex(order => order.id === orderId);
        if (orderIndex !== -1) {
          this.orders[orderIndex].status = 'cancelled';
        }
      }
    },
    
    contactSupport(orderId) {
      // In a real app, this would open a support chat or form
      alert(`Contacting support about order #${orderId}`);
    }
  }
};
</script>

<style scoped>
.max-width-200 {
  max-width: 200px;
}

.border-primary {
  border: 2px solid var(--v-primary-base) !important;
}
</style>