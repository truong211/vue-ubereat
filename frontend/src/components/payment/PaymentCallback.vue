<template>
  <div class="payment-callback">
    <v-container class="py-10">
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6">
          <v-card>
            <v-card-text class="text-center pa-6">
              <template v-if="loading">
                <v-progress-circular
                  indeterminate
                  color="primary"
                  size="64"
                ></v-progress-circular>
                <h2 class="text-h5 mt-4">Verifying Payment...</h2>
                <p class="text-body-1">Please wait while we confirm your payment.</p>
              </template>

              <template v-else-if="error">
                <v-icon color="error" size="64">mdi-alert-circle</v-icon>
                <h2 class="text-h5 mt-4">Payment Verification Failed</h2>
                <p class="text-body-1">{{ error }}</p>
                <v-btn
                  color="primary"
                  class="mt-4"
                  :to="{ name: 'OrderHistory' }"
                >
                  View Orders
                </v-btn>
              </template>

              <template v-else>
                <v-icon color="success" size="64">mdi-check-circle</v-icon>
                <h2 class="text-h5 mt-4">Payment Successful!</h2>
                <p class="text-body-1">Your payment has been processed successfully.</p>
                <div class="payment-details mt-6 text-left">
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-subtitle-1">Order ID:</span>
                    <span class="text-subtitle-1">#{{ orderId }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-subtitle-1">Amount:</span>
                    <span class="text-subtitle-1">{{ formatCurrency(amount) }}</span>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-subtitle-1">Payment Method:</span>
                    <span class="text-subtitle-1">{{ paymentMethod }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-subtitle-1">Transaction ID:</span>
                    <span class="text-subtitle-1">{{ transactionId }}</span>
                  </div>
                </div>
                <div class="mt-6">
                  <v-btn
                    color="primary"
                    class="mr-2"
                    :to="{ name: 'OrderDetails', params: { id: orderId }}"
                  >
                    View Order
                  </v-btn>
                  <v-btn
                    color="secondary"
                    variant="outlined"
                    @click="downloadReceipt"
                  >
                    Download Receipt
                  </v-btn>
                </div>
              </template>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import paymentService from '@/services/payment.service';

export default {
  name: 'PaymentCallback',

  setup() {
    const route = useRoute();
    const router = useRouter();
    const loading = ref(true);
    const error = ref(null);
    const orderId = ref(null);
    const amount = ref(0);
    const paymentMethod = ref('');
    const transactionId = ref('');

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value);
    };

    const processCallback = async () => {
      try {
        const provider = route.path.includes('vnpay') ? 'vnpay' 
          : route.path.includes('momo') ? 'momo'
          : route.path.includes('zalopay') ? 'zalopay'
          : null;

        if (!provider) {
          throw new Error('Invalid payment provider');
        }

        const result = await paymentService.verifyPayment(provider, route.query);
        
        if (result.success) {
          orderId.value = result.orderId;
          amount.value = result.amount;
          paymentMethod.value = provider.toUpperCase();
          transactionId.value = result.transactionId;
        } else {
          throw new Error(result.message || 'Payment verification failed');
        }
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };

    const downloadReceipt = async () => {
      try {
        await paymentService.downloadReceipt(orderId.value);
      } catch (err) {
        console.error('Failed to download receipt:', err);
      }
    };

    onMounted(() => {
      processCallback();
    });

    return {
      loading,
      error,
      orderId,
      amount,
      paymentMethod,
      transactionId,
      formatCurrency,
      downloadReceipt
    };
  }
};
</script>

<style scoped>
.payment-callback {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.payment-details {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
}
</style>