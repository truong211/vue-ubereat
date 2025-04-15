<template>
  <v-container class="order-details-page py-8">
    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading order details...</p>
    </div>
    
    <div v-else-if="!order">
      <v-alert
        type="error"
        class="mb-6"
      >
        Order not found. The order may have been deleted or you don't have permission to view it.
      </v-alert>
      
      <v-btn
        color="primary"
        to="/orders"
        prepend-icon="mdi-arrow-left"
      >
        Back to Orders
      </v-btn>
    </div>
    
    <div v-else>
      <div class="d-flex align-center mb-6">
        <v-btn
          variant="text"
          to="/orders"
          prepend-icon="mdi-arrow-left"
          class="mr-4"
        >
          Back to Orders
        </v-btn>
        <h1 class="text-h4 font-weight-bold mb-0">Order #{{ order.orderNumber }}</h1>
      </div>
      
      <v-row>
        <!-- Order details (left side) -->
        <v-col cols="12" md="8">
          <!-- Order Status Card -->
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2" :color="getStatusColor(order.status)">
                {{ getStatusIcon(order.status) }}
              </v-icon>
              Order Status
            </v-card-title>
            
            <v-card-text>
              <v-timeline align="start" direction="horizontal" class="status-timeline mb-4">
                <v-timeline-item
                  v-for="(status, index) in orderStatusFlow"
                  :key="status.value"
                  :dot-color="getTimelineColor(status.value, order.status)"
                  :size="getTimelineSize(status.value, order.status)"
                  :icon="isCurrentStatus(status.value, order.status) ? status.icon : undefined"
                >
                  <template v-slot:opposite>
                    <div 
                      class="status-label"
                      :class="{ 
                        'font-weight-bold': isCurrentStatus(status.value, order.status),
                        'text-disabled': !isStatusReached(status.value, order.status)
                      }"
                    >
                      {{ status.label }}
                    </div>
                  </template>
                </v-timeline-item>
              </v-timeline>
              
              <div class="status-message d-flex align-center justify-center">
                <v-icon :color="getStatusColor(order.status)" class="mr-2" size="large">
                  {{ getStatusIcon(order.status) }}
                </v-icon>
                <div class="text-h6">
                  {{ getStatusMessage(order.status) }}
                </div>
              </div>
              
              <v-divider class="my-4"></v-divider>
              
              <!-- Estimated delivery time -->
              <div class="d-flex align-center justify-center">
                <v-icon color="primary" class="mr-2">mdi-clock-outline</v-icon>
                <div>
                  <span class="text-body-1">Estimated Delivery Time: </span>
                  <span class="text-body-1 font-weight-bold">
                    {{ formatDateTime(order.estimatedDeliveryTime) }}
                  </span>
                </div>
              </div>
              
              <!-- Action buttons based on order status -->
              <div v-if="order.status === 'pending' || order.status === 'confirmed'" class="mt-4 text-center">
                <v-btn
                  color="error"
                  variant="outlined"
                  @click="showCancelDialog = true"
                >
                  Cancel Order
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Restaurant Info Card -->
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-store</v-icon>
              Restaurant Information
            </v-card-title>
            
            <v-card-text>
              <div class="d-flex">
                <v-avatar size="60" class="mr-4">
                  <v-img :src="order.restaurant.logo || '/img/placeholder-restaurant.png'" alt="Restaurant"></v-img>
                </v-avatar>
                <div>
                  <h3 class="text-h6 mb-1">{{ order.restaurant.name }}</h3>
                  <p class="text-body-2 mb-1">{{ order.restaurant.address }}</p>
                  <p class="text-body-2">
                    <v-icon size="small" class="mr-1">mdi-phone</v-icon>
                    {{ order.restaurant.phone }}
                  </p>
                </div>
                
                <v-spacer></v-spacer>
                
                <v-btn
                  color="primary"
                  variant="text"
                  :to="`/restaurant/${order.restaurant.id}`"
                  prepend-icon="mdi-store"
                >
                  Visit Restaurant
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Delivery Info Card -->
          <v-card class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-map-marker</v-icon>
              Delivery Information
            </v-card-title>
            
            <v-card-text>
              <div class="d-flex mb-4">
                <div>
                  <h3 class="text-subtitle-1 font-weight-medium mb-1">Delivery Address</h3>
                  <p class="text-body-2">{{ order.deliveryAddress }}</p>
                  
                  <div v-if="order.deliveryInstructions" class="mt-2">
                    <h3 class="text-subtitle-1 font-weight-medium mb-1">Delivery Instructions</h3>
                    <p class="text-body-2 font-italic">{{ order.deliveryInstructions }}</p>
                  </div>
                </div>
                
                <v-spacer></v-spacer>
                
                <div v-if="order.status === 'out_for_delivery' && order.driver">
                  <h3 class="text-subtitle-1 font-weight-medium mb-1">Driver Information</h3>
                  <div class="d-flex align-center">
                    <v-avatar size="36" class="mr-2">
                      <v-img :src="order.driver.profileImage || '/img/placeholder-avatar.png'" alt="Driver"></v-img>
                    </v-avatar>
                    <div>
                      <p class="text-body-2 mb-0">{{ order.driver.fullName }}</p>
                      <p class="text-body-2">
                        <v-icon size="small" class="mr-1">mdi-phone</v-icon>
                        {{ order.driver.phone }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Map placeholder -->
              <v-card variant="outlined" height="200" class="d-flex align-center justify-center">
                <div class="text-center">
                  <v-icon size="48" color="grey-lighten-1">mdi-map</v-icon>
                  <p class="text-body-2 text-medium-emphasis mt-2">Delivery Map</p>
                </div>
              </v-card>
            </v-card-text>
          </v-card>
          
          <!-- Rate Order Card (if delivered and not yet rated) -->
          <v-card v-if="order.status === 'delivered' && !order.isRated" class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-star</v-icon>
              Rate Your Order
            </v-card-title>
            
            <v-card-text>
              <div class="text-center mb-4">
                <p class="text-body-1 mb-4">How was your experience? Let us know what you think.</p>
                <v-rating
                  v-model="rating"
                  color="amber"
                  hover
                  half-increments
                  size="large"
                ></v-rating>
              </div>
              
              <v-textarea
                v-model="review"
                label="Write your review (optional)"
                placeholder="Tell us about your experience with this order..."
                variant="outlined"
                rows="3"
              ></v-textarea>
              
              <div class="text-center mt-4">
                <v-btn
                  color="primary"
                  :loading="isSubmittingReview"
                  :disabled="!rating"
                  @click="submitReview"
                >
                  Submit Review
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Review Card (if already rated) -->
          <v-card v-else-if="order.rating" class="mb-4">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-star</v-icon>
              Your Review
            </v-card-title>
            
            <v-card-text>
              <div class="text-center mb-2">
                <v-rating
                  :model-value="order.rating"
                  color="amber"
                  readonly
                  half-increments
                ></v-rating>
              </div>
              
              <div v-if="order.review" class="review-text text-center font-italic mt-4">
                "{{ order.review }}"
              </div>
              
              <div class="text-center text-caption mt-4">
                Submitted on {{ formatDate(order.reviewedAt || order.updatedAt) }}
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <!-- Order summary (right side) -->
        <v-col cols="12" md="4">
          <v-card class="order-summary">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-receipt</v-icon>
              Order Summary
            </v-card-title>
            
            <v-card-text class="pa-0">
              <!-- Order items -->
              <v-list density="compact">
                <v-list-item
                  v-for="(item, index) in order.orderDetails"
                  :key="item.id"
                  :subtitle="item.notes"
                  class="px-4"
                >
                  <template v-slot:prepend>
                    <span class="font-weight-medium">{{ item.quantity }}×</span>
                  </template>
                  
                  <v-list-item-title>{{ item.name }}</v-list-item-title>
                  
                  <template v-slot:append>
                    <span class="text-body-2 font-weight-medium">${{ (item.totalPrice).toFixed(2) }}</span>
                  </template>
                </v-list-item>
              </v-list>
              
              <v-divider></v-divider>
              
              <!-- Order timestamps -->
              <div class="pa-4 text-caption">
                <div class="d-flex justify-space-between mb-2">
                  <span>Order Placed</span>
                  <span>{{ formatDateTime(order.createdAt) }}</span>
                </div>
                
                <div v-if="order.scheduledDelivery" class="d-flex justify-space-between mb-2">
                  <span>Scheduled Delivery</span>
                  <span>{{ formatDateTime(order.scheduledDelivery.time) }}</span>
                </div>
              </div>
              
              <v-divider></v-divider>
              
              <!-- Payment details -->
              <div class="pa-4">
                <h3 class="text-subtitle-1 font-weight-medium mb-3">Payment Details</h3>
                
                <div class="d-flex align-center mb-3">
                  <v-icon class="mr-2" :color="getPaymentMethodColor(order.paymentMethod)">
                    {{ getPaymentMethodIcon(order.paymentMethod) }}
                  </v-icon>
                  <span class="text-body-2">{{ getPaymentMethodName(order.paymentMethod) }}</span>
                  
                  <v-spacer></v-spacer>
                  
                  <v-chip
                    :color="getPaymentStatusColor(order.paymentStatus)"
                    size="small"
                  >
                    {{ capitalizeFirstLetter(order.paymentStatus) }}
                  </v-chip>
                </div>
                
                <!-- Price breakdown -->
                <div class="d-flex justify-space-between mb-3">
                  <span class="text-body-1">Subtotal</span>
                  <span class="text-body-1">${{ order.subtotal.toFixed(2) }}</span>
                </div>
                
                <div v-if="order.discountAmount > 0" class="d-flex justify-space-between mb-3 text-success">
                  <span class="text-body-1">Discount</span>
                  <span class="text-body-1">-${{ order.discountAmount.toFixed(2) }}</span>
                </div>
                
                <div class="d-flex justify-space-between mb-3">
                  <span class="text-body-1">Delivery Fee</span>
                  <span class="text-body-1">${{ order.deliveryFee.toFixed(2) }}</span>
                </div>
                
                <div class="d-flex justify-space-between mb-4">
                  <span class="text-body-1">Tax</span>
                  <span class="text-body-1">${{ order.taxAmount.toFixed(2) }}</span>
                </div>
                
                <v-divider class="mb-4"></v-divider>
                
                <!-- Total -->
                <div class="d-flex justify-space-between mb-4">
                  <span class="text-h6 font-weight-bold">Total</span>
                  <span class="text-h6 font-weight-bold">${{ order.totalAmount.toFixed(2) }}</span>
                </div>
                
                <!-- Receipt download -->
                <v-btn
                  block
                  prepend-icon="mdi-receipt"
                  @click="downloadReceipt"
                >
                  Download Receipt
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
    
    <!-- Cancel Order Dialog -->
    <v-dialog v-model="showCancelDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Cancel Your Order</v-card-title>
        <v-card-text>
          <p class="mb-4">Are you sure you want to cancel this order? This action cannot be undone.</p>
          
          <v-textarea
            v-model="cancellationReason"
            label="Reason for Cancellation"
            placeholder="Please tell us why you're cancelling this order..."
            variant="outlined"
            rows="3"
            :rules="[v => !!v || 'Reason is required']"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showCancelDialog = false"
          >
            Keep Order
          </v-btn>
          <v-btn
            color="error"
            :loading="isCancelling"
            :disabled="!cancellationReason"
            @click="cancelOrder"
          >
            Cancel Order
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Review Submitted Dialog -->
    <v-dialog v-model="showReviewSuccessDialog" max-width="400">
      <v-card>
        <v-card-text class="text-center py-6">
          <v-icon color="success" size="64" class="mb-4">mdi-check-circle</v-icon>
          <h2 class="text-h5 mb-4">Thank You for Your Feedback!</h2>
          <p>Your review has been submitted successfully.</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            @click="showReviewSuccessDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { defineComponent } from 'vue';
import { useOrdersStore } from '@/store/modules/orders';
import { format, parseISO } from 'date-fns';

export default defineComponent({ // Use defineComponent
  name: 'OrderDetailsView',
  
  setup() {
    const ordersStore = useOrdersStore();
    return { ordersStore }; // Expose store instance
  },

  data() {
    return {
      isLoading: true,

      // Review
      rating: 0,
      review: '',
      isSubmittingReview: false,
      showReviewSuccessDialog: false,

      // Cancellation
      showCancelDialog: false,
      cancellationReason: '',
      isCancelling: false,

      // Order status flow
      orderStatusFlow: [
        { value: 'pending', label: 'Pending', icon: 'mdi-clock-outline' },
        { value: 'confirmed', label: 'Confirmed', icon: 'mdi-check-circle-outline' },
        { value: 'preparing', label: 'Preparing', icon: 'mdi-food-outline' },
        { value: 'ready_for_pickup', label: 'Ready', icon: 'mdi-package-variant-closed' },
        { value: 'out_for_delivery', label: 'On the Way', icon: 'mdi-truck-delivery-outline' },
        { value: 'delivered', label: 'Delivered', icon: 'mdi-check-circle' }
      ]
    };
  },
  
  computed: {
    // Access state from Pinia orders store
    order() {
      // Assuming 'currentOrder' is a state property or getter in the Pinia store
      return this.ordersStore.currentOrder;
    },
    
    orderId() {
      return this.$route.params.id;
    }
  },
  
  async created() {
    await this.loadOrderDetails();
  },
  
  methods: {
    // Removed mapActions block. Methods will call store actions directly.
    
    async loadOrderDetails() {
      try {
        this.isLoading = true;
        await this.ordersStore.fetchOrderDetails(this.orderId); // Call action on ordersStore
      } catch (error) {
        console.error('Failed to load order details:', error);
        this.$toast.error('Failed to load order details. Please try again.');
      } finally {
        this.isLoading = false;
      }
    },
    
    formatDateTime(dateTime) {
      if (!dateTime) return 'N/A';
      
      const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
      return format(date, 'MMM d, yyyy h:mm a');
    },
    
    formatDate(dateTime) {
      if (!dateTime) return 'N/A';
      
      const date = typeof dateTime === 'string' ? parseISO(dateTime) : dateTime;
      return format(date, 'MMM d, yyyy');
    },
    
    getStatusColor(status) {
      const statusColors = {
        pending: 'blue',
        confirmed: 'indigo',
        preparing: 'deep-purple',
        ready_for_pickup: 'deep-orange',
        out_for_delivery: 'amber-darken-2',
        delivered: 'success',
        cancelled: 'error'
      };
      
      return statusColors[status] || 'grey';
    },
    
    getStatusIcon(status) {
      const statusIcons = {
        pending: 'mdi-clock-outline',
        confirmed: 'mdi-check-circle-outline',
        preparing: 'mdi-food-outline',
        ready_for_pickup: 'mdi-package-variant-closed',
        out_for_delivery: 'mdi-truck-delivery-outline',
        delivered: 'mdi-check-circle',
        cancelled: 'mdi-cancel'
      };
      
      return statusIcons[status] || 'mdi-help-circle-outline';
    },
    
    getStatusMessage(status) {
      const statusMessages = {
        pending: 'Your order is being reviewed by the restaurant',
        confirmed: 'Your order has been confirmed by the restaurant',
        preparing: 'The restaurant is preparing your order',
        ready_for_pickup: 'Your order is ready for pickup by the delivery person',
        out_for_delivery: 'Your order is on the way to you',
        delivered: 'Your order has been delivered successfully',
        cancelled: 'This order has been cancelled'
      };
      
      return statusMessages[status] || 'Order status unknown';
    },
    
    getTimelineColor(statusValue, currentStatus) {
      if (this.isStatusReached(statusValue, currentStatus)) {
        return this.isCurrentStatus(statusValue, currentStatus) ? this.getStatusColor(currentStatus) : 'success';
      }
      return 'grey';
    },
    
    getTimelineSize(statusValue, currentStatus) {
      return this.isCurrentStatus(statusValue, currentStatus) ? 'large' : 'small';
    },
    
    isCurrentStatus(statusValue, currentStatus) {
      return statusValue === currentStatus;
    },
    
    isStatusReached(statusValue, currentStatus) {
      const statusOrder = {
        pending: 0,
        confirmed: 1,
        preparing: 2,
        ready_for_pickup: 3,
        out_for_delivery: 4,
        delivered: 5,
        cancelled: -1
      };
      
      // Special handling for cancelled status
      if (currentStatus === 'cancelled') {
        return statusValue === 'cancelled';
      }
      
      return statusOrder[statusValue] <= statusOrder[currentStatus];
    },
    
    getPaymentMethodIcon(method) {
      const icons = {
        cash: 'mdi-cash',
        credit_card: 'mdi-credit-card',
        debit_card: 'mdi-credit-card-outline',
        e_wallet: 'mdi-wallet'
      };
      
      return icons[method] || 'mdi-help-circle-outline';
    },
    
    getPaymentMethodColor(method) {
      const colors = {
        cash: 'green',
        credit_card: 'blue',
        debit_card: 'indigo',
        e_wallet: 'purple'
      };
      
      return colors[method] || 'grey';
    },
    
    getPaymentMethodName(method) {
      const names = {
        cash: 'Cash on Delivery',
        credit_card: 'Credit Card',
        debit_card: 'Debit Card',
        e_wallet: 'E-Wallet'
      };
      
      return names[method] || 'Unknown Payment Method';
    },
    
    getPaymentStatusColor(status) {
      const colors = {
        pending: 'warning',
        paid: 'success',
        failed: 'error',
        refunded: 'info'
      };
      
      return colors[status] || 'grey';
    },
    
    capitalizeFirstLetter(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    async submitReview() {
      if (!this.rating) return;
      
      try {
        this.isSubmittingReview = true;
        
        // Call action on ordersStore
        await this.ordersStore.submitReview({
          id: this.orderId,
          rating: this.rating,
          review: this.review
        });
        
        this.showReviewSuccessDialog = true;
        
        // Reset form
        this.rating = 0;
        this.review = '';
      } catch (error) {
        console.error('Failed to submit review:', error);
        this.$toast.error('Failed to submit your review. Please try again.');
      } finally {
        this.isSubmittingReview = false;
      }
    },
    
    async cancelOrder() {
      if (!this.cancellationReason) return;
      
      try {
        this.isCancelling = true;
        
        // Call action on ordersStore
        await this.ordersStore.cancelOrder({
          id: this.orderId,
          cancellationReason: this.cancellationReason
        });
        
        this.showCancelDialog = false;
        this.$toast.success('Your order has been cancelled');
        
        // Reset form
        this.cancellationReason = '';
      } catch (error) {
        console.error('Failed to cancel order:', error);
        this.$toast.error('Failed to cancel your order. Please try again.');
      } finally {
        this.isCancelling = false;
      }
    },
    
    downloadReceipt() {
      // In a real implementation, this would call an API endpoint to generate and download a receipt
      this.$toast.info('Receipt download functionality will be implemented soon');
    }
  }
}); // Close defineComponent
</script>

<style scoped>
.order-summary {
  position: sticky;
  top: 20px;
}

.status-timeline {
  margin-bottom: 2rem;
}

.status-label {
  font-size: 0.75rem;
  text-align: center;
  max-width: 80px;
  white-space: normal;
  word-break: break-word;
}

.text-disabled {
  color: rgba(0, 0, 0, 0.38);
}

.review-text {
  font-size: 1.1rem;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .order-summary {
    position: static;
  }
}
</style>