<template>
  <v-container class="order-confirmation py-8 text-center">
    <v-card class="pa-6 mx-auto" max-width="700">
      <v-card-title class="text-center d-flex flex-column align-center">
        <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
        <h1 class="text-h4 mb-2">Order Confirmed!</h1>
        <p class="text-subtitle-1">Thank you for your order</p>
      </v-card-title>
      
      <v-card-text>
        <div class="my-6">
          <div class="text-h6 mb-2">Order Number</div>
          <div class="text-h3 font-weight-bold">#{{ orderId }}</div>
        </div>
        
        <v-alert color="info" variant="tonal" class="mb-6">
          <div class="text-body-1">
            A confirmation email has been sent to <strong>{{ email }}</strong>
          </div>
        </v-alert>
        
        <v-card variant="outlined" class="mb-6">
          <v-card-text>
            <div class="text-h6 mb-4">Order Summary</div>
            
            <div class="d-flex justify-space-between mb-2">
              <span>Items Subtotal:</span>
              <span>${{ orderDetails.subtotal.toFixed(2) }}</span>
            </div>
            
            <div v-if="orderDetails.discount > 0" class="d-flex justify-space-between mb-2">
              <span>Discount:</span>
              <span class="text-error">-${{ orderDetails.discount.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between mb-2">
              <span>{{ orderDetails.deliveryMethod === 'delivery' ? 'Delivery Fee' : 'Pickup Fee' }}:</span>
              <span>${{ orderDetails.deliveryFee.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between mb-2">
              <span>Tax:</span>
              <span>${{ orderDetails.tax.toFixed(2) }}</span>
            </div>
            
            <v-divider class="my-3"></v-divider>
            
            <div class="d-flex justify-space-between text-h6 font-weight-bold">
              <span>Total:</span>
              <span>${{ orderDetails.total.toFixed(2) }}</span>
            </div>
          </v-card-text>
        </v-card>
        
        <div class="mb-6">
          <div class="text-h6 mb-3">Estimated Delivery Time</div>
          <div class="text-body-1">{{ orderDetails.estimatedDeliveryTime }}</div>
        </div>
        
        <div v-if="orderDetails.deliveryMethod === 'delivery'" class="mb-6">
          <div class="text-h6 mb-3">Delivery Address</div>
          <div class="text-body-1">{{ orderDetails.address }}</div>
        </div>
        
        <div v-else class="mb-6">
          <div class="text-h6 mb-3">Pickup Location</div>
          <div class="text-body-1">{{ orderDetails.pickupLocation }}</div>
        </div>
        
        <div class="mb-6">
          <div class="text-h6 mb-3">Payment Method</div>
          <div class="text-body-1 text-capitalize">{{ orderDetails.paymentMethod }}</div>
        </div>
      </v-card-text>
      
      <v-card-actions class="d-flex flex-column">
        <v-btn
          color="primary"
          variant="flat"
          size="large"
          block
          class="mb-3"
          :to="{ name: 'orderTracking', params: { id: orderId } }"
        >
          Track Your Order
        </v-btn>
        
        <v-btn
          variant="outlined"
          size="large"
          block
          :to="{ name: 'home' }"
        >
          Continue Shopping
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';

export default {
  name: 'OrderConfirmationView',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    
    // Order ID from route params
    const orderId = computed(() => route.params.id || '');
    
    // Mock email (in a real app, this would come from the user's profile or order data)
    const email = ref('');
    
    // Mock order details (in a real app, these would be fetched from the API)
    const orderDetails = ref({
      subtotal: 34.97,
      discount: 0,
      deliveryFee: 5.99,
      tax: 3.28,
      total: 44.24,
      deliveryMethod: 'delivery',
      estimatedDeliveryTime: '30-45 minutes',
      address: '123 Main St, Apt 4B, New York, NY 10001',
      pickupLocation: '',
      paymentMethod: 'creditCard'
    });
    
    // Simulate loading order data from API
    const fetchOrderDetails = async () => {
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data (this would come from the API)
        email.value = 'user@example.com';
        
        // If no order ID is provided, redirect to home
        if (!orderId.value) {
          toast.error('Invalid order');
          router.push({ name: 'home' });
        }
      } catch (error) {
        console.error('Failed to fetch order details:', error);
        toast.error('Failed to load order details');
      }
    };
    
    onMounted(() => {
      fetchOrderDetails();
    });
    
    return {
      orderId,
      email,
      orderDetails
    };
  }
};
</script>

<style scoped>
.order-confirmation {
  min-height: 80vh;
}
</style>