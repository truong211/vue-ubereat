<template>
  <v-container class="order-detail-page py-8">
    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading order details...</p>
    </div>

    <div v-else>
      <!-- Back button and order ID header -->
      <div class="d-flex align-center mb-6">
        <v-btn
          variant="text"
          prepend-icon="mdi-arrow-left"
          to="/orders"
          class="me-2"
        >
          Back to Orders
        </v-btn>
        
        <v-divider vertical class="mx-2"></v-divider>
        
        <h1 class="text-h5 font-weight-bold">Order #{{ order.id }}</h1>
        <v-chip
          :color="getStatusColor(order.status)"
          class="ml-4"
          size="small"
        >
          {{ getStatusText(order.status) }}
        </v-chip>
      </div>

      <v-row>
        <!-- Order Information (left column) -->
        <v-col cols="12" md="8">
          <!-- Restaurant Info -->
          <v-card class="mb-4">
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
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                :to="{ name: 'RestaurantDetail', params: { id: order.restaurant.id } }"
              >
                Order Again
              </v-btn>
            </v-card-title>
          </v-card>

          <!-- Order Timeline -->
          <v-card class="mb-4">
            <v-card-title>Order Timeline</v-card-title>
            <v-card-text>
              <v-timeline density="compact" align="start">
                <v-timeline-item
                  v-for="(event, index) in order.timeline"
                  :key="index"
                  :dot-color="event.color"
                  :icon="event.icon"
                  size="small"
                  fill-dot
                >
                  <div class="d-flex justify-space-between">
                    <div>
                      <div class="text-subtitle-1 font-weight-medium">{{ event.title }}</div>
                      <div class="text-caption text-medium-emphasis">{{ event.description }}</div>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ formatDate(event.timestamp) }}
                    </div>
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>

          <!-- Order Items -->
          <v-card class="mb-4">
            <v-card-title>Order Items</v-card-title>
            <v-list>
              <v-list-item
                v-for="(item, index) in order.items"
                :key="index"
                class="py-3"
              >
                <template v-slot:prepend>
                  <div class="item-quantity mr-2">{{ item.quantity }}×</div>
                </template>
                
                <v-list-item-title class="font-weight-medium mb-1">
                  {{ item.name }}
                </v-list-item-title>
                
                <div v-if="item.options && item.options.length" class="text-caption text-medium-emphasis mb-1">
                  {{ item.options.join(', ') }}
                </div>
                
                <template v-slot:append>
                  <span class="text-subtitle-2 font-weight-bold">
                    ${{ (item.price * item.quantity).toFixed(2) }}
                  </span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>

          <!-- Delivery Information -->
          <v-card class="mb-4">
            <v-card-title>Delivery Details</v-card-title>
            <v-card-text>
              <div class="mb-4">
                <div class="text-subtitle-1 font-weight-bold mb-1">Delivery Address</div>
                <p class="mb-0">{{ order.deliveryAddress }}</p>
                <p v-if="order.deliveryInstructions" class="text-caption text-medium-emphasis mt-1 mb-0">
                  <v-icon size="small" class="mr-1">mdi-information</v-icon>
                  {{ order.deliveryInstructions }}
                </p>
              </div>
              
              <v-divider class="my-4"></v-divider>
              
              <div class="mb-0">
                <div class="text-subtitle-1 font-weight-bold mb-1">Delivered by</div>
                <div v-if="order.driver" class="d-flex align-center">
                  <v-avatar size="40" class="mr-3">
                    <v-img :src="order.driver.avatar" alt="Driver"></v-img>
                  </v-avatar>
                  <div>
                    <div>{{ order.driver.name }}</div>
                    <div class="d-flex align-center">
                      <v-rating
                        :model-value="order.driver.rating"
                        color="amber"
                        density="compact"
                        half-increments
                        readonly
                        size="small"
                      ></v-rating>
                      <span class="text-caption ml-1">{{ order.driver.rating }} ({{ order.driver.totalRatings }})</span>
                    </div>
                  </div>
                </div>
                <p v-else class="mb-0 text-medium-emphasis">
                  Driver information not available
                </p>
              </div>
            </v-card-text>
          </v-card>
          
          <!-- Customer Support -->
          <v-card v-if="order.status === 'delivered' || order.status === 'cancelled'">
            <v-card-title>Need Help?</v-card-title>
            <v-card-text>
              <div class="d-flex flex-column flex-sm-row gap-3">
                <v-btn
                  prepend-icon="mdi-receipt-text-check"
                  variant="outlined"
                  @click="reportIssue('missing')"
                >
                  Missing Items
                </v-btn>
                <v-btn
                  prepend-icon="mdi-food-off"
                  variant="outlined"
                  @click="reportIssue('quality')"
                >
                  Food Quality Issue
                </v-btn>
                <v-btn
                  prepend-icon="mdi-headset"
                  variant="outlined"
                  @click="contactSupport"
                >
                  Contact Support
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <!-- Order Summary (right column) -->
        <v-col cols="12" md="4">
          <v-card class="order-summary">
            <v-card-title>Order Summary</v-card-title>
            <v-card-text class="pt-2">
              <div class="d-flex justify-space-between mb-1">
                <div class="text-body-1 text-medium-emphasis">Order Date</div>
                <div class="text-body-1">{{ formatDate(order.createdAt) }}</div>
              </div>
              
              <div class="d-flex justify-space-between mb-1">
                <div class="text-body-1 text-medium-emphasis">Payment Method</div>
                <div class="text-body-1">{{ order.paymentMethod }}</div>
              </div>
              
              <v-divider class="my-4"></v-divider>
              
              <!-- Price breakdown -->
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
              
              <!-- Total -->
              <div class="d-flex justify-space-between mb-6">
                <span class="text-h6 font-weight-bold">Total</span>
                <span class="text-h6 font-weight-bold">${{ order.total.toFixed(2) }}</span>
              </div>
              
              <!-- Receipt -->
              <v-btn
                block
                color="primary"
                prepend-icon="mdi-receipt"
                @click="downloadReceipt"
                class="mb-3"
              >
                Download Receipt
              </v-btn>
              
              <!-- Rate order button -->
              <v-btn
                v-if="order.status === 'delivered' && !order.isRated"
                block
                prepend-icon="mdi-star"
                variant="outlined"
                @click="rateOrder"
              >
                Rate Order
              </v-btn>
              
              <div v-else-if="order.isRated" class="text-center mt-4">
                <div class="text-subtitle-2 mb-2">Your Rating</div>
                <v-rating
                  :model-value="order.userRating"
                  color="amber"
                  half-increments
                  readonly
                ></v-rating>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Rating Dialog -->
    <v-dialog v-model="showRatingDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Rate Your Order</v-card-title>
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
            @click="showRatingDialog = false"
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

    <!-- Report Issue Dialog -->
    <v-dialog v-model="showIssueDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5">Report an Issue</v-card-title>
        <v-card-text>
          <p class="mb-4">{{ getIssuePrompt() }}</p>
          
          <div v-if="issueType === 'missing'">
            <div class="mb-2">Select the missing items:</div>
            <v-checkbox
              v-for="(item, index) in order.items"
              :key="index"
              v-model="missingItems"
              :value="item.id"
              :label="`${item.name} (${item.quantity}x)`"
              hide-details
              class="mb-2"
            ></v-checkbox>
          </div>
          
          <v-textarea
            v-model="issueDescription"
            :label="getIssueTextareaLabel()"
            variant="outlined"
            rows="3"
            auto-grow
            class="mt-4"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showIssueDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="submitIssue"
            :disabled="!canSubmitIssue"
            :loading="isSubmittingIssue"
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
  name: 'OrderDetailView',
  data() {
    return {
      isLoading: true,
      order: null,
      
      // Rating dialog
      showRatingDialog: false,
      rating: {
        food: 0,
        delivery: 0,
        comment: ''
      },
      isSubmittingRating: false,
      
      // Issue reporting
      showIssueDialog: false,
      issueType: null,
      issueDescription: '',
      missingItems: [],
      isSubmittingIssue: false
    };
  },
  computed: {
    isRatingValid() {
      return this.rating.food > 0 && this.rating.delivery > 0;
    },
    canSubmitIssue() {
      if (this.issueType === 'missing') {
        return this.missingItems.length > 0;
      }
      return this.issueDescription.trim().length > 0;
    }
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
          status: 'delivered',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          deliveredAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // 45 minutes after order
          isRated: false,
          userRating: 0,
          
          restaurant: {
            id: 1,
            name: 'Burger Palace',
            image: '/images/restaurants/burger-logo.jpg',
            address: '123 Main St, New York, NY 10001'
          },
          
          driver: {
            id: 1,
            name: 'Michael Johnson',
            avatar: '/images/driver-avatar.jpg',
            rating: 4.8,
            totalRatings: 342,
            phone: '+1 (555) 987-6543'
          },
          
          items: [
            {
              id: 101,
              name: 'Classic Cheeseburger',
              price: 8.99,
              quantity: 2,
              options: ['Regular', 'Extra Cheese']
            },
            {
              id: 301,
              name: 'French Fries',
              price: 3.99,
              quantity: 1,
              options: ['Large']
            },
            {
              id: 401,
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
          paymentMethod: 'Credit Card (**** 1234)',
          
          timeline: [
            {
              title: 'Order Placed',
              description: 'Your order has been received by the restaurant',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              color: 'primary',
              icon: 'mdi-receipt-text'
            },
            {
              title: 'Order Confirmed',
              description: 'Restaurant has confirmed your order',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
              color: 'primary',
              icon: 'mdi-check'
            },
            {
              title: 'Preparing Order',
              description: 'Your food is being prepared',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000),
              color: 'primary',
              icon: 'mdi-food'
            },
            {
              title: 'Driver Assigned',
              description: 'Michael Johnson is your driver',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 25 * 60 * 1000),
              color: 'primary',
              icon: 'mdi-account'
            },
            {
              title: 'Order Picked Up',
              description: 'Driver has picked up your order',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
              color: 'primary',
              icon: 'mdi-truck-delivery'
            },
            {
              title: 'Order Delivered',
              description: 'Your order has been delivered. Enjoy your meal!',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
              color: 'success',
              icon: 'mdi-check-circle'
            }
          ]
        };
        
        this.isLoading = false;
      }, 1000);
    },
    
    getStatusColor(status) {
      const statusColors = {
        pending: 'warning',
        confirmed: 'info',
        preparing: 'info',
        ready: 'info',
        on_the_way: 'info',
        delivered: 'success',
        cancelled: 'error'
      };
      
      return statusColors[status] || 'grey';
    },
    
    getStatusText(status) {
      const statusTexts = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        preparing: 'Preparing',
        ready: 'Ready for Pickup',
        on_the_way: 'On the Way',
        delivered: 'Delivered',
        cancelled: 'Cancelled'
      };
      
      return statusTexts[status] || 'Unknown';
    },
    
    formatDate(date) {
      if (!date) return '';
      
      const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      };
      
      return new Date(date).toLocaleString('en-US', options);
    },
    
    downloadReceipt() {
      // In a real app, this would generate and download a PDF receipt
      alert('This would download a PDF receipt in a real app');
    },
    
    rateOrder() {
      this.showRatingDialog = true;
    },
    
    getRatingLabel(rating) {
      if (rating === 0) return '';
      if (rating < 2) return 'Poor';
      if (rating < 3) return 'Fair';
      if (rating < 4) return 'Good';
      if (rating < 5) return 'Very Good';
      return 'Excellent';
    },
    
    async submitRating() {
      if (!this.isRatingValid) return;
      
      this.isSubmittingRating = true;
      
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update order rating in UI
        this.order.isRated = true;
        this.order.userRating = (this.rating.food + this.rating.delivery) / 2;
        
        // Show success message
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Thank you for your feedback!',
          color: 'success'
        });
        
        // Close dialog
        this.showRatingDialog = false;
      } catch (error) {
        console.error('Error submitting rating:', error);
      } finally {
        this.isSubmittingRating = false;
      }
    },
    
    reportIssue(type) {
      this.issueType = type;
      this.issueDescription = '';
      this.missingItems = [];
      this.showIssueDialog = true;
    },
    
    getIssuePrompt() {
      if (this.issueType === 'missing') {
        return 'Please select the items that were missing from your order.';
      } else if (this.issueType === 'quality') {
        return 'We\'re sorry about the quality issue with your food. Please provide more details about the problem.';
      }
      return 'Please describe the issue you experienced with your order.';
    },
    
    getIssueTextareaLabel() {
      if (this.issueType === 'missing') {
        return 'Additional comments (optional)';
      } else if (this.issueType === 'quality') {
        return 'Describe the quality issue';
      }
      return 'Describe your issue';
    },
    
    async submitIssue() {
      this.isSubmittingIssue = true;
      
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Log the issue data
        console.log('Issue submitted:', {
          orderId: this.order.id,
          issueType: this.issueType,
          description: this.issueDescription,
          missingItems: this.issueType === 'missing' ? this.missingItems : []
        });
        
        // Show success message
        this.$store.dispatch('ui/showSnackbar', {
          text: 'Your issue has been reported. We\'ll get back to you soon.',
          color: 'success'
        });
        
        // Close dialog
        this.showIssueDialog = false;
      } catch (error) {
        console.error('Error submitting issue:', error);
      } finally {
        this.isSubmittingIssue = false;
      }
    },
    
    contactSupport() {
      // In a real app, this would open a chat or support form
      alert('This would open a customer support chat in a real app');
    }
  }
};
</script>

<style scoped>
.order-summary {
  position: sticky;
  top: 20px;
}

.item-quantity {
  font-weight: bold;
  min-width: 24px;
}

.gap-3 {
  gap: 12px;
}

@media (max-width: 960px) {
  .order-summary {
    position: static;
  }
}
</style> 