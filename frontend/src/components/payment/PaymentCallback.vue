<template>
  <div class="payment-callback">
    <v-container class="py-8">
      <v-row justify="center">
        <v-col cols="12" sm="8" md="6">
          <v-card v-if="loading" class="text-center pa-6">
            <v-progress-circular
              indeterminate
              color="primary"
              size="64"
            ></v-progress-circular>
            <div class="text-h6 mt-4">Processing your payment...</div>
            <div class="text-body-1 text-medium-emphasis">
              Please do not close this window
            </div>
          </v-card>

          <v-card v-else-if="error" class="error-card pa-6">
            <v-icon
              color="error"
              size="64"
              class="mb-4"
            >
              mdi-alert-circle
            </v-icon>
            <h2 class="text-h5 mb-2">Payment Failed</h2>
            <p class="text-body-1 mb-6">{{ error }}</p>
            <v-btn
              color="primary"
              block
              :to="{ name: 'Checkout' }"
            >
              Try Again
            </v-btn>
          </v-card>

          <v-card v-else class="success-card pa-6">
            <v-icon
              color="success"
              size="64"
              class="mb-4"
            >
              mdi-check-circle
            </v-icon>
            <h2 class="text-h5 mb-2">Payment Successful</h2>
            <p class="text-body-1 mb-6">
              Your payment has been processed successfully.
              You will be redirected to the order confirmation page.
            </p>
            <v-btn
              color="primary"
              block
              :to="{ name: 'OrderConfirmation', params: { id: orderId } }"
            >
              View Order Details
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import VNPayService from '@/services/vnpay.service'
import MomoService from '@/services/momo.service'

export default {
  name: 'PaymentCallback',

  setup() {
    const route = useRoute()
    const router = useRouter()
    const loading = ref(true)
    const error = ref(null)
    const orderId = ref(null)

    const processPayment = async () => {
      try {
        const paymentType = route.path.includes('vnpay') ? 'vnpay' : 'momo'
        const service = paymentType === 'vnpay' ? VNPayService : MomoService

        // Process payment callback
        const result = await service.processCallback(route.query)

        if (result.success) {
          orderId.value = result.orderId
          // Verify payment status
          await service.verifyPayment({
            orderId: result.orderId,
            amount: result.amount,
            transactionId: result.transactionId
          })
        } else {
          throw new Error(result.message || 'Payment verification failed')
        }
      } catch (err) {
        error.value = err.message || 'An error occurred while processing your payment'
      } finally {
        loading.value = false
      }
    }

    onMounted(() => {
      processPayment()
    })

    return {
      loading,
      error,
      orderId
    }
  }
}
</script>

<style scoped>
.payment-callback {
  min-height: 60vh;
  display: flex;
  align-items: center;
}

.error-card,
.success-card {
  text-align: center;
}
</style>