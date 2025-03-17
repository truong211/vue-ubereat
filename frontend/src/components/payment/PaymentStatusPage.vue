<template>
  <div class="payment-status">
    <v-container class="py-10">
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6">
          <v-card class="text-center pa-6">
            <!-- Loading State -->
            <div v-if="loading" class="py-8">
              <v-progress-circular
                indeterminate
                color="primary"
                size="64"
              ></v-progress-circular>
              <div class="text-h6 mt-4">Verifying payment...</div>
              <div class="text-body-1 text-grey mt-2">Please wait while we confirm your payment</div>
            </div>

            <!-- Success State -->
            <template v-else-if="status === 'success'">
              <v-icon
                color="success"
                size="64"
                class="mb-4"
              >
                mdi-check-circle
              </v-icon>
              <h2 class="text-h4 mb-2">Payment Successful!</h2>
              <p class="text-body-1 mb-6">Your order has been confirmed and is being prepared.</p>
              <div class="payment-details pa-4 mb-6 text-left">
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-subtitle-1">Order Number:</span>
                  <span class="font-weight-medium">#{{ orderId }}</span>
                </div>
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-subtitle-1">Amount Paid:</span>
                  <span class="font-weight-medium">{{ formatPrice(amount) }}</span>
                </div>
                <div class="d-flex justify-space-between">
                  <span class="text-subtitle-1">Payment Method:</span>
                  <span class="font-weight-medium">{{ formatPaymentMethod(paymentMethod) }}</span>
                </div>
              </div>
              <div class="d-flex justify-center">
                <v-btn
                  color="primary"
                  class="mx-2"
                  @click="viewOrder"
                >
                  Track Order
                </v-btn>
                <v-btn
                  variant="outlined"
                  class="mx-2"
                  @click="goToOrders"
                >
                  View All Orders
                </v-btn>
              </div>
            </template>

            <!-- Error State -->
            <template v-else-if="status === 'error' || status === 'failed'">
              <v-icon
                color="error"
                size="64"
                class="mb-4"
              >
                mdi-alert-circle
              </v-icon>
              <h2 class="text-h4 mb-2">Payment Failed</h2>
              <p class="text-body-1 mb-6">{{ error || 'Something went wrong with your payment. Please try again.' }}</p>
              <div class="d-flex justify-center">
                <v-btn
                  color="primary"
                  class="mx-2"
                  @click="retryPayment"
                >
                  Try Again
                </v-btn>
                <v-btn
                  variant="text"
                  class="mx-2"
                  @click="contactSupport"
                >
                  Contact Support
                </v-btn>
              </div>
            </template>

            <!-- Processing State -->
            <template v-else-if="status === 'processing'">
              <v-icon
                color="info"
                size="64"
                class="mb-4"
              >
                mdi-clock-outline
              </v-icon>
              <h2 class="text-h4 mb-2">Payment Processing</h2>
              <p class="text-body-1 mb-6">Your payment is being processed. This may take a few moments.</p>
              <v-progress-linear
                indeterminate
                color="primary"
                class="mb-6"
              ></v-progress-linear>
              <p class="text-caption text-grey">Please do not close this window</p>
            </template>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Support Dialog -->
    <v-dialog v-model="showSupportDialog" max-width="500">
      <v-card>
        <v-card-title>Contact Support</v-card-title>
        <v-card-text>
          <p class="mb-4">Our support team is here to help you with any payment issues.</p>
          <div class="support-contact mb-4">
            <div class="d-flex align-center mb-2">
              <v-icon color="primary" class="mr-2">mdi-phone</v-icon>
              <span>Hotline: 1800-123-456</span>
            </div>
            <div class="d-flex align-center mb-2">
              <v-icon color="primary" class="mr-2">mdi-email</v-icon>
              <span>Email: support@ubereat.com</span>
            </div>
          </div>
          <v-form @submit.prevent="submitSupportRequest">
            <v-textarea
              v-model="supportMessage"
              label="Describe your issue"
              rows="4"
              variant="outlined"
              counter
              maxlength="500"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showSupportDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="submitSupportRequest"
            :loading="submittingSupport"
          >
            Send Message
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'PaymentStatusPage',

  data() {
    return {
      loading: true,
      status: null,
      error: null,
      orderId: null,
      amount: null,
      paymentMethod: null,
      showSupportDialog: false,
      supportMessage: '',
      submittingSupport: false
    };
  },

  methods: {
    async verifyPayment() {
      try {
        const { orderId, provider, payment_id } = this.$route.query;
        
        if (!orderId || !provider) {
          throw new Error('Invalid payment verification request');
        }

        this.orderId = orderId;
        
        // Verify payment with backend
        const result = await this.$store.dispatch('payment/verifyPayment', {
          provider,
          paymentId: payment_id
        });

        // Update status based on verification result
        this.status = result.status;
        this.amount = result.amount;
        this.paymentMethod = result.payment_method;

        if (result.status === 'failed') {
          this.error = result.message;
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        this.status = 'error';
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },

    formatPrice(amount) {
      if (!amount) return '';
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    },

    formatPaymentMethod(method) {
      const methods = {
        card: 'Credit/Debit Card',
        vnpay: 'VNPay',
        momo: 'Momo Wallet',
        zalopay: 'ZaloPay'
      };
      return methods[method] || method;
    },

    viewOrder() {
      this.$router.push({
        name: 'OrderTracking',
        params: { id: this.orderId }
      });
    },

    goToOrders() {
      this.$router.push({ name: 'Orders' });
    },

    retryPayment() {
      this.$router.push({
        name: 'Checkout',
        query: { order_id: this.orderId }
      });
    },

    contactSupport() {
      this.showSupportDialog = true;
    },

    async submitSupportRequest() {
      if (!this.supportMessage.trim()) return;

      this.submittingSupport = true;

      try {
        await this.$store.dispatch('support/submitRequest', {
          order_id: this.orderId,
          message: this.supportMessage,
          type: 'payment_issue'
        });

        this.$toast.success('Support request sent successfully');
        this.showSupportDialog = false;
        this.supportMessage = '';
      } catch (error) {
        console.error('Error submitting support request:', error);
        this.$toast.error('Failed to send support request. Please try again.');
      } finally {
        this.submittingSupport = false;
      }
    }
  },

  mounted() {
    this.verifyPayment();
  }
};
</script>

<style scoped>
.payment-status {
  min-height: calc(100vh - 64px);
  background-color: #f5f5f5;
}

.payment-details {
  background-color: #f8f9fa;
  border-radius: 8px;
}

.support-contact {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
}
</style>