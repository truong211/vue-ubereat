<template>
  <v-container class="order-tracking py-8">
    <h1 class="text-h4 mb-6">Track Your Order</h1>

    <!-- Order Information -->
    <v-card class="mb-6">
      <v-card-title class="d-flex justify-space-between align-center">
        <span>Order #{{ orderId }}</span>
        <v-chip
          :color="getStatusColor(order.status)"
          :text="getStatusText(order.status)"
          variant="elevated"
          class="text-uppercase"
        ></v-chip>
      </v-card-title>
      
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="6">
            <div class="text-subtitle-2 mb-2">Order Date</div>
            <div class="mb-4">{{ formatDate(order.orderDate) }}</div>
            
            <div class="text-subtitle-2 mb-2">Delivery Method</div>
            <div class="mb-4 text-capitalize">{{ order.deliveryMethod }}</div>
            
            <div class="text-subtitle-2 mb-2">Payment Method</div>
            <div class="mb-4 text-capitalize">{{ order.paymentMethod }}</div>
          </v-col>
          
          <v-col cols="12" sm="6">
            <div class="text-subtitle-2 mb-2">Estimated Delivery Time</div>
            <div class="mb-4">{{ formatDate(order.estimatedDelivery) }}</div>
            
            <template v-if="order.deliveryMethod === 'delivery'">
              <div class="text-subtitle-2 mb-2">Delivery Address</div>
              <div class="mb-4">{{ order.deliveryAddress }}</div>
            </template>
            
            <template v-else>
              <div class="text-subtitle-2 mb-2">Pickup Location</div>
              <div class="mb-4">{{ order.pickupLocation }}</div>
            </template>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
    
    <!-- Order Progress -->
    <v-card class="mb-6">
      <v-card-title>Order Progress</v-card-title>
      <v-card-text>
        <v-timeline align="start">
          <v-timeline-item
            v-for="(step, index) in orderSteps"
            :key="index"
            :dot-color="getStepColor(step, index)"
            :icon="step.icon"
            :size="getStepSize(step, index)"
          >
            <div class="d-flex justify-space-between align-center">
              <div>
                <div :class="getStepClass(step, index)">{{ step.title }}</div>
                <div class="text-caption">{{ step.description }}</div>
              </div>
              <div class="text-caption" v-if="step.time">{{ step.time }}</div>
            </div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>
    
    <!-- Order Details -->
    <v-card class="mb-6">
      <v-card-title>Order Details</v-card-title>
      <v-list>
        <v-list-item
          v-for="(restaurant, index) in order.restaurants"
          :key="index"
          :title="restaurant.name"
          :subtitle="`${restaurant.items.length} items`"
        >
          <template v-slot:append>
            <v-btn
              size="small"
              variant="text"
              color="primary"
              @click="expandedRestaurant = expandedRestaurant === index ? null : index"
            >
              {{ expandedRestaurant === index ? 'Hide' : 'Show' }} Items
            </v-btn>
          </template>
        </v-list-item>
        
        <v-expand-transition>
          <div v-if="expandedRestaurant !== null">
            <v-list-item
              v-for="(item, itemIndex) in order.restaurants[expandedRestaurant].items"
              :key="itemIndex"
              :title="item.name"
              :subtitle="`$${item.price.toFixed(2)} × ${item.quantity}`"
            >
              <template v-slot:prepend>
                <v-avatar rounded size="40">
                  <v-img :src="item.image || '/img/product-placeholder.jpg'" cover></v-img>
                </v-avatar>
              </template>
              
              <template v-slot:append>
                <div class="text-right font-weight-medium">
                  ${{ (item.price * item.quantity).toFixed(2) }}
                </div>
              </template>
            </v-list-item>
          </div>
        </v-expand-transition>
      </v-list>
      
      <v-divider></v-divider>
      
      <v-card-text>
        <div class="d-flex justify-space-between mb-2">
          <span>Subtotal</span>
          <span>${{ order.subtotal.toFixed(2) }}</span>
        </div>
        
        <div v-if="order.discount > 0" class="d-flex justify-space-between mb-2">
          <span>Discount</span>
          <span class="text-error">-${{ order.discount.toFixed(2) }}</span>
        </div>
        
        <div class="d-flex justify-space-between mb-2">
          <span>{{ order.deliveryMethod === 'delivery' ? 'Delivery Fee' : 'Pickup Fee' }}</span>
          <span>${{ order.deliveryFee.toFixed(2) }}</span>
        </div>
        
        <div class="d-flex justify-space-between mb-2">
          <span>Tax</span>
          <span>${{ order.tax.toFixed(2) }}</span>
        </div>
        
        <v-divider class="my-2"></v-divider>
        
        <div class="d-flex justify-space-between text-h6 font-weight-bold">
          <span>Total</span>
          <span>${{ order.total.toFixed(2) }}</span>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Action Buttons -->
    <div class="d-flex flex-wrap justify-center gap-3">
      <v-btn 
        color="primary" 
        variant="flat" 
        prepend-icon="mdi-headset" 
        @click="contactSupport"
      >
        Contact Support
      </v-btn>
      
      <v-btn
        color="error"
        variant="outlined"
        prepend-icon="mdi-close-circle"
        :disabled="!canCancel"
        @click="confirmCancelOrder"
      >
        Cancel Order
      </v-btn>
      
      <v-btn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-clipboard-text"
        :to="{ name: 'orderHistory' }"
      >
        Order History
      </v-btn>
    </div>
    
    <!-- Live Chat Support -->
    <v-dialog v-model="supportDialog" max-width="500">
      <v-card>
        <v-card-title>
          <span class="text-h5">Contact Support</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="supportDialog = false"></v-btn>
        </v-card-title>
        
        <v-card-text>
          <p class="mb-4">Our customer support team is here to help you with your order #{{ orderId }}.</p>
          
          <v-text-field
            v-model="supportMessage"
            label="Your Message"
            placeholder="Type your message here..."
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          
          <v-btn
            block
            color="primary"
            variant="flat"
            @click="sendSupportMessage"
            :loading="sendingMessage"
          >
            Send Message
          </v-btn>
          
          <v-divider class="my-4"></v-divider>
          
          <div class="text-center">
            <p class="mb-2">Or call us directly:</p>
            <p class="font-weight-bold">+1 (800) 123-4567</p>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    
    <!-- Cancel Order Confirmation -->
    <v-dialog v-model="cancelDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Cancel Order</v-card-title>
        
        <v-card-text>
          <p class="mb-4">Are you sure you want to cancel your order #{{ orderId }}?</p>
          
          <v-alert color="warning" variant="tonal" class="mb-4">
            <div class="d-flex align-center">
              <v-icon class="mr-3">mdi-alert-circle</v-icon>
              <span>Cancellation may be subject to a fee depending on the order status.</span>
            </div>
          </v-alert>
          
          <v-textarea
            v-model="cancelReason"
            label="Reason for Cancellation"
            placeholder="Please tell us why you're cancelling this order..."
            variant="outlined"
            rows="3"
            class="mb-4"
          ></v-textarea>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="cancelDialog = false">
            Keep Order
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="cancelOrder"
            :loading="cancellingOrder"
          >
            Cancel Order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useToast } from '@/composables/useToast';

export default {
  name: 'OrderTrackingView',
  
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    
    // Order ID from route params
    const orderId = computed(() => route.params.id || 'Unknown');
    
    // UI State
    const isLoading = ref(false);
    const expandedRestaurant = ref(null);
    const supportDialog = ref(false);
    const cancelDialog = ref(false);
    const supportMessage = ref('');
    const cancelReason = ref('');
    const sendingMessage = ref(false);
    const cancellingOrder = ref(false);
    
    // Mock Order Data (In a real app, this would come from an API)
    const order = ref({
      id: orderId,
      status: 'processing', // ['placed', 'processing', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled']
      orderDate: new Date(),
      estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
      deliveryMethod: 'delivery',
      paymentMethod: 'creditCard',
      deliveryAddress: '123 Main St, Apt 4B, New York, NY 10001',
      pickupLocation: '',
      subtotal: 34.97,
      discount: 0,
      deliveryFee: 5.99,
      tax: 3.28,
      total: 44.24,
      restaurants: [
        {
          name: 'Burger Palace',
          id: 1,
          items: [
            {
              id: 101,
              name: 'Double Cheeseburger',
              price: 12.99,
              quantity: 1,
              image: '/img/products/burger.jpg'
            },
            {
              id: 102,
              name: 'French Fries',
              price: 3.99,
              quantity: 2,
              image: '/img/products/fries.jpg'
            }
          ]
        },
        {
          name: 'Pizza Paradise',
          id: 2,
          items: [
            {
              id: 201,
              name: 'Pepperoni Pizza',
              price: 14.99,
              quantity: 1,
              image: '/img/products/pizza.jpg'
            }
          ]
        }
      ]
    });
    
    // Order Progress Steps
    const orderSteps = ref([
      {
        title: 'Order Placed',
        description: 'Your order has been received',
        icon: 'mdi-checkbox-marked-circle',
        time: formatTime(new Date(Date.now() - 30 * 60 * 1000)),
        status: 'completed'
      },
      {
        title: 'Processing',
        description: 'Your order is being processed',
        icon: 'mdi-sync',
        time: formatTime(new Date(Date.now() - 25 * 60 * 1000)),
        status: 'completed'
      },
      {
        title: 'Preparing',
        description: 'Restaurant is preparing your food',
        icon: 'mdi-food',
        time: formatTime(new Date(Date.now() - 15 * 60 * 1000)),
        status: 'current'
      },
      {
        title: 'Ready for Pickup',
        description: 'Your order will be picked up by our delivery partner',
        icon: 'mdi-package-variant',
        status: 'pending'
      },
      {
        title: 'Out for Delivery',
        description: 'Your order is on the way',
        icon: 'mdi-truck-delivery',
        status: 'pending'
      },
      {
        title: 'Delivered',
        description: 'Enjoy your meal!',
        icon: 'mdi-check-decagram',
        status: 'pending'
      }
    ]);
    
    // Computed property to determine if the order can be cancelled
    const canCancel = computed(() => {
      const nonCancellableStatuses = ['delivered', 'cancelled', 'out_for_delivery'];
      return !nonCancellableStatuses.includes(order.value.status);
    });
    
    // Format date
    function formatDate(date) {
      if (!date) return 'N/A';
      
      return new Date(date).toLocaleString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Format time
    function formatTime(date) {
      if (!date) return '';
      
      return new Date(date).toLocaleString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Get status color
    function getStatusColor(status) {
      const statusColors = {
        placed: 'info',
        processing: 'info',
        preparing: 'warning',
        ready: 'warning',
        out_for_delivery: 'purple',
        delivered: 'success',
        cancelled: 'error'
      };
      
      return statusColors[status] || 'grey';
    }
    
    // Get status text
    function getStatusText(status) {
      const statusTexts = {
        placed: 'Order Placed',
        processing: 'Processing',
        preparing: 'Preparing',
        ready: 'Ready for Pickup',
        out_for_delivery: 'Out for Delivery',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      };
      
      return statusTexts[status] || 'Unknown';
    }
    
    // Get step style based on status
    function getStepColor(step, index) {
      if (step.status === 'completed') return 'success';
      if (step.status === 'current') return 'primary';
      return 'grey';
    }
    
    function getStepSize(step, index) {
      if (step.status === 'current') return 'large';
      return 'small';
    }
    
    function getStepClass(step, index) {
      let classes = 'text-body-1 font-weight-medium';
      
      if (step.status === 'completed') {
        classes += ' text-success';
      } else if (step.status === 'current') {
        classes += ' text-primary font-weight-bold';
      }
      
      return classes;
    }
    
    // Contact support
    function contactSupport() {
      supportDialog.value = true;
    }
    
    // Send support message
    async function sendSupportMessage() {
      if (!supportMessage.value.trim()) {
        toast.error('Please enter a message');
        return;
      }
      
      sendingMessage.value = true;
      
      try {
        // In a real app, this would send the message to an API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success('Your message has been sent. Our team will contact you shortly.');
        supportMessage.value = '';
        supportDialog.value = false;
      } catch (error) {
        console.error('Failed to send message:', error);
        toast.error('Failed to send message. Please try again.');
      } finally {
        sendingMessage.value = false;
      }
    }
    
    // Confirm cancel order
    function confirmCancelOrder() {
      if (!canCancel.value) {
        toast.error('This order cannot be cancelled at this time');
        return;
      }
      
      cancelDialog.value = true;
    }
    
    // Cancel order
    async function cancelOrder() {
      if (!cancelReason.value.trim()) {
        toast.error('Please provide a reason for cancellation');
        return;
      }
      
      cancellingOrder.value = true;
      
      try {
        // In a real app, this would cancel the order via an API
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        order.value.status = 'cancelled';
        toast.success('Your order has been cancelled');
        cancelDialog.value = false;
        
        // Update UI
        orderSteps.value = orderSteps.value.filter(step => step.status === 'completed');
        orderSteps.value.push({
          title: 'Order Cancelled',
          description: 'Your order has been cancelled',
          icon: 'mdi-close-circle',
          time: formatTime(new Date()),
          status: 'completed'
        });
      } catch (error) {
        console.error('Failed to cancel order:', error);
        toast.error('Failed to cancel order. Please try again.');
      } finally {
        cancellingOrder.value = false;
      }
    }
    
    // Fetch order data
    async function fetchOrderData() {
      isLoading.value = true;
      
      try {
        // In a real app, this would fetch the order from an API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // We're using mock data for demo purposes
      } catch (error) {
        console.error('Failed to fetch order:', error);
        toast.error('Failed to load order details');
      } finally {
        isLoading.value = false;
      }
    }
    
    // Lifecycle Hooks
    onMounted(() => {
      fetchOrderData();
    });
    
    return {
      orderId,
      isLoading,
      order,
      orderSteps,
      expandedRestaurant,
      supportDialog,
      cancelDialog,
      supportMessage,
      cancelReason,
      sendingMessage,
      cancellingOrder,
      canCancel,
      formatDate,
      getStatusColor,
      getStatusText,
      getStepColor,
      getStepSize,
      getStepClass,
      contactSupport,
      sendSupportMessage,
      confirmCancelOrder,
      cancelOrder
    };
  }
};
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}
</style>