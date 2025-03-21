<template>
  <div class="payment-receipt">
    <v-container class="py-10">
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6">
          <v-card>
            <v-card-text>
              <template v-if="loading">
                <div class="text-center py-8">
                  <v-progress-circular
                    indeterminate
                    color="primary"
                    size="64"
                  ></v-progress-circular>
                  <p class="text-body-1 mt-4">Loading receipt...</p>
                </div>
              </template>

              <template v-else-if="error">
                <div class="text-center py-8">
                  <v-icon color="error" size="64">mdi-alert-circle</v-icon>
                  <h3 class="text-h5 mt-4">Failed to Load Receipt</h3>
                  <p class="text-body-1">{{ error }}</p>
                </div>
              </template>

              <template v-else>
                <!-- Receipt Header -->
                <div class="text-center mb-6">
                  <h2 class="text-h4">Payment Receipt</h2>
                  <p class="text-subtitle-1 mt-2">Thank you for your order!</p>
                </div>

                <!-- Receipt Content -->
                <div class="receipt-content">
                  <!-- Order Details -->
                  <div class="receipt-section">
                    <h3 class="text-h6 mb-3">Order Details</h3>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-body-1">Order Number:</span>
                      <span class="text-body-1 font-weight-medium">#{{ receipt.orderId }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-body-1">Transaction ID:</span>
                      <span class="text-body-1 font-weight-medium">{{ receipt.transactionId }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-body-1">Date:</span>
                      <span class="text-body-1 font-weight-medium">{{ formatDate(receipt.date) }}</span>
                    </div>
                  </div>

                  <!-- Payment Details -->
                  <div class="receipt-section">
                    <h3 class="text-h6 mb-3">Payment Details</h3>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-body-1">Payment Method:</span>
                      <span class="text-body-1 font-weight-medium">{{ receipt.paymentMethod }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-body-1">Status:</span>
                      <v-chip
                        :color="getStatusColor(receipt.status)"
                        size="small"
                      >
                        {{ receipt.status }}
                      </v-chip>
                    </div>
                  </div>

                  <!-- Amount Breakdown -->
                  <div class="receipt-section">
                    <h3 class="text-h6 mb-3">Amount Details</h3>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-body-1">Subtotal:</span>
                      <span class="text-body-1">{{ formatCurrency(receipt.subtotal) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-body-1">Tax:</span>
                      <span class="text-body-1">{{ formatCurrency(receipt.tax) }}</span>
                    </div>
                    <div class="d-flex justify-space-between mb-2">
                      <span class="text-body-1">Delivery Fee:</span>
                      <span class="text-body-1">{{ formatCurrency(receipt.deliveryFee) }}</span>
                    </div>
                    <v-divider class="my-2"></v-divider>
                    <div class="d-flex justify-space-between">
                      <span class="text-h6">Total:</span>
                      <span class="text-h6">{{ formatCurrency(receipt.total) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Actions -->
                <div class="text-center mt-6">
                  <v-btn
                    color="primary"
                    class="mr-2"
                    @click="downloadReceipt"
                    :loading="downloading"
                  >
                    <v-icon left>mdi-download</v-icon>
                    Download PDF
                  </v-btn>
                  <v-btn
                    color="secondary"
                    variant="outlined"
                    :to="{ name: 'OrderDetails', params: { id: receipt.orderId }}"
                  >
                    <v-icon left>mdi-eye</v-icon>
                    View Order
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
import { useRoute } from 'vue-router';
import paymentService from '@/services/payment.service';

export default {
  name: 'PaymentReceipt',

  setup() {
    const route = useRoute();
    const loading = ref(true);
    const error = ref(null);
    const receipt = ref(null);
    const downloading = ref(false);

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getStatusColor = (status) => {
      const colors = {
        completed: 'success',
        pending: 'warning',
        failed: 'error'
      };
      return colors[status.toLowerCase()] || 'grey';
    };

    const loadReceipt = async () => {
      try {
        const response = await paymentService.getReceipt(route.params.id);
        receipt.value = response.data;
      } catch (err) {
        error.value = err.message || 'Failed to load receipt';
      } finally {
        loading.value = false;
      }
    };

    const downloadReceipt = async () => {
      try {
        downloading.value = true;
        await paymentService.downloadReceipt(route.params.id);
      } catch (err) {
        console.error('Failed to download receipt:', err);
      } finally {
        downloading.value = false;
      }
    };

    onMounted(() => {
      loadReceipt();
    });

    return {
      loading,
      error,
      receipt,
      downloading,
      formatCurrency,
      formatDate,
      getStatusColor,
      downloadReceipt
    };
  }
};
</script>

<style scoped>
.payment-receipt {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.receipt-content {
  max-width: 600px;
  margin: 0 auto;
}

.receipt-section {
  background-color: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.receipt-section:last-child {
  margin-bottom: 0;
}
</style>