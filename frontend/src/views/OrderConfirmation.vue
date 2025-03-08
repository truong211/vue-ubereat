<template>
  <v-container class="order-confirmation-page py-8">
    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading order confirmation...</p>
    </div>

    <v-row v-else justify="center">
      <v-col cols="12" sm="10" md="8" lg="6">
        <!-- Success Card -->
        <v-card class="mb-6 success-card">
          <v-card-text class="text-center pa-6">
            <v-icon
              color="success"
              size="100"
              class="mb-6"
            >
              mdi-check-circle
            </v-icon>
            <h1 class="text-h4 font-weight-bold mb-2">Order Confirmed!</h1>
            <p class="text-subtitle-1 mb-6">
              Your order has been successfully placed and is being processed.
            </p>
            <div class="text-h6">Order ID: #{{ order.id }}</div>
            <div class="text-subtitle-1 mb-4">
              Estimated delivery time: {{ order.estimatedDeliveryTime }}
            </div>
            <v-divider class="mb-4"></v-divider>
            <div class="d-flex justify-center mb-4">
              <v-btn
                size="large"
                color="primary"
                :to="{ name: 'OrderTracking', params: { id: order.id } }"
                prepend-icon="mdi-map-marker"
              >
                Track Your Order
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Order Details Card -->
        <v-card class="mb-6">
          <v-card-title class="d-flex align-center">
            <v-avatar size="40" class="mr-3">
              <v-img :src="order.restaurant.image" alt="Restaurant"></v-img>
            </v-avatar>
            <div>
              <div class="text-h6">{{ order.restaurant.name }}</div>
              <div class="text-caption text-medium-emphasis">
                <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                {{ order.restaurant.address }}
              </div>
            </div>
          </v-card-title>

          <v-divider></v-divider>

          <v-list>
            <v-list-subheader>Items</v-list-subheader>
            
            <v-list-item
              v-for="(item, index) in order.items"
              :key="index"
              class="px-4"
            >
              <template v-slot:prepend>
                <div class="item-quantity mr-2">{{ item.quantity }}x</div>
              </template>
              <v-list-item-title>{{ item.name }}</v-list-item-title>
              <div v-if="item.options && item.options.length" class="text-caption text-medium-emphasis">
                {{ item.options.join(', ') }}
              </div>
              <template v-slot:append>
                ${{ (item.price * item.quantity).toFixed(2) }}
              </template>
            </v-list-item>
          </v-list>

          <v-divider></v-divider>

          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-1">Subtotal</span>
              <span class="text-body-1">${{ order.subtotal.toFixed(2) }}</span>
            </div>
            
            <div v-if="order.discount > 0" class="d-flex justify-space-between mb-2 text-success">
              <span class="text-body-1">Discount</span>
              <span class="text-body-1">-${{ order.discount.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-1">Delivery Fee</span>
              <span class="text-body-1">${{ order.deliveryFee.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-1">Tax</span>
              <span class="text-body-1">${{ order.tax.toFixed(2) }}</span>
            </div>
            
            <v-divider class="mb-4"></v-divider>
            
            <div class="d-flex justify-space-between">
              <span class="text-h6 font-weight-bold">Total</span>
              <span class="text-h6 font-weight-bold">${{ order.total.toFixed(2) }}</span>
            </div>
          </v-card-text>
        </v-card>

        <!-- Delivery Information Card -->
        <v-card class="mb-6">
          <v-card-title>Delivery Information</v-card-title>
          
          <v-card-text>
            <div class="mb-4">
              <div class="text-subtitle-1 font-weight-bold">Delivery Address</div>
              <div class="text-body-1">{{ order.deliveryAddress }}</div>
              <div v-if="order.deliveryInstructions" class="text-caption text-medium-emphasis mt-1">
                {{ order.deliveryInstructions }}
              </div>
            </div>
            
            <div class="mb-4">
              <div class="text-subtitle-1 font-weight-bold">Delivery Time</div>
              <div class="text-body-1">{{ order.deliveryOption }}</div>
            </div>
            
            <div>
              <div class="text-subtitle-1 font-weight-bold">Payment Method</div>
              <div class="text-body-1">{{ order.paymentMethod }}</div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Actions -->
        <div class="d-flex justify-center flex-wrap">
          <v-btn
            variant="text"
            class="ma-2"
            to="/"
            prepend-icon="mdi-home"
          >
            Return to Home
          </v-btn>
          <v-btn
            variant="text"
            class="ma-2"
            :to="{ name: 'OrderHistory' }"
            prepend-icon="mdi-history"
          >
            View Order History
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'OrderConfirmationView',
  data() {
    return {
      isLoading: true,
      order: null
    };
  },
  created() {
    this.loadOrderDetails();
  },
  methods: {
    loadOrderDetails() {
      // In a real app, this would fetch order data from the API using this.$route.params.id
      const orderId = this.$route.params.id || '123456';
      
      // Simulate API call with delay
      setTimeout(() => {
        // Mock order data
        this.order = {
          id: orderId,
          createdAt: new Date(),
          estimatedDeliveryTime: '30-45 minutes',
          
          restaurant: {
            id: 1,
            name: 'Burger Palace',
            image: '/images/restaurants/burger-logo.jpg',
            address: '123 Main St, New York, NY 10001'
          },
          
          items: [
            {
              name: 'Classic Cheeseburger',
              price: 8.99,
              quantity: 2,
              options: ['Regular', 'Extra Cheese']
            },
            {
              name: 'French Fries',
              price: 3.99,
              quantity: 1,
              options: ['Large']
            },
            {
              name: 'Soft Drink',
              price: 2.49,
              quantity: 2,
              options: ['Medium', 'Coca-Cola']
            }
          ],
          
          subtotal: 26.95,
          discount: 0,
          deliveryFee: 2.99,
          tax: 2.16,
          total: 32.10,
          
          deliveryAddress: '456 Park Avenue, Apt 7B, New York, NY 10022',
          deliveryInstructions: 'Ring doorbell twice',
          deliveryOption: 'As soon as possible',
          paymentMethod: 'Credit Card (**** 1234)'
        };
        
        this.isLoading = false;
      }, 1500);
    }
  }
};
</script>

<style scoped>
.success-card {
  border-top: 5px solid #4caf50;
}

.item-quantity {
  font-weight: bold;
  min-width: 24px;
}
</style> 