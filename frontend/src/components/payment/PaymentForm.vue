<template>
  <div class="payment-form">
    <v-card class="pa-4">
      <!-- Order Summary -->
      <v-card-text>
        <h2 class="text-h5 mb-4">{{ $t('payment.orderSummary') }}</h2>
        <v-list>
          <v-list-item>
            <template v-slot:prepend>
              <v-icon color="primary">mdi-receipt</v-icon>
            </template>
            <v-list-item-title>{{ $t('payment.orderTotal') }}</v-list-item-title>
            <v-list-item-subtitle class="text-right">
              {{ formatCurrency(orderData.amount) }}
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>

      <!-- Payment Method Selection -->
      <v-card-text>
        <h3 class="text-h6 mb-4">{{ $t('payment.selectMethod') }}</h3>
        
        <!-- Saved Payment Methods -->
        <div v-if="savedMethods.length > 0" class="mb-4">
          <v-radio-group v-model="selectedMethod" class="payment-methods">
            <v-radio
              v-for="method in savedMethods"
              :key="method.id"
              :value="method.id"
            >
              <template v-slot:label>
                <div class="d-flex align-center">
                  <v-img
                    :src="getPaymentMethodIcon(method.type)"
                    width="32"
                    height="32"
                    class="mr-2"
                  ></v-img>
                  <div>
                    <div>{{ method.name }}</div>
                    <div class="text-caption">{{ maskCardNumber(method.cardNumber) }}</div>
                  </div>
                </div>
              </template>
            </v-radio>
          </v-radio-group>
        </div>

        <!-- Available Payment Methods -->
        <v-expansion-panels v-model="selectedPanel">
          <!-- VNPay -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-img
                  src="/images/payment/vnpay.png"
                  width="32"
                  height="32"
                  class="mr-2"
                ></v-img>
                {{ $t('payment.methods.vnpay') }}
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                {{ $t('payment.vnpayInfo') }}
              </v-alert>
              <v-btn
                color="primary"
                block
                :loading="loading"
                @click="processVNPay"
              >
                {{ $t('payment.payWithVNPay') }}
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- Momo -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-img
                  src="/images/payment/momo.png"
                  width="32"
                  height="32"
                  class="mr-2"
                ></v-img>
                {{ $t('payment.methods.momo') }}
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                {{ $t('payment.momoInfo') }}
              </v-alert>
              <v-btn
                color="primary"
                block
                :loading="loading"
                @click="processMomo"
              >
                {{ $t('payment.payWithMomo') }}
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>

          <!-- ZaloPay -->
          <v-expansion-panel>
            <v-expansion-panel-title>
              <div class="d-flex align-center">
                <v-img
                  src="/images/payment/zalopay.png"
                  width="32"
                  height="32"
                  class="mr-2"
                ></v-img>
                {{ $t('payment.methods.zalopay') }}
              </div>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-alert
                type="info"
                variant="tonal"
                class="mb-4"
              >
                {{ $t('payment.zalopayInfo') }}
              </v-alert>
              <v-btn
                color="primary"
                block
                :loading="loading"
                @click="processZaloPay"
              >
                {{ $t('payment.payWithZaloPay') }}
              </v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <!-- Payment Processing -->
      <v-overlay
        v-model="processingPayment"
        class="align-center justify-center"
      >
        <v-card class="pa-4 text-center" width="300">
          <v-progress-circular
            indeterminate
            color="primary"
            :size="64"
            class="mb-4"
          ></v-progress-circular>
          <div class="text-h6 mb-2">{{ $t('payment.processing') }}</div>
          <div class="text-body-2">{{ $t('payment.doNotClose') }}</div>
        </v-card>
      </v-overlay>
    </v-card>

    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" persistent max-width="400">
      <v-card>
        <v-card-text class="text-center pa-4">
          <v-icon
            color="success"
            size="64"
            class="mb-4"
          >
            mdi-check-circle
          </v-icon>
          <h3 class="text-h5 mb-2">{{ $t('payment.success.title') }}</h3>
          <p class="mb-4">{{ $t('payment.success.message') }}</p>
          <v-btn
            color="primary"
            block
            @click="handlePaymentSuccess"
          >
            {{ $t('payment.success.viewOrder') }}
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Error Dialog -->
    <v-dialog v-model="showErrorDialog" max-width="400">
      <v-card>
        <v-card-text class="text-center pa-4">
          <v-icon
            color="error"
            size="64"
            class="mb-4"
          >
            mdi-alert-circle
          </v-icon>
          <h3 class="text-h5 mb-2">{{ $t('payment.error.title') }}</h3>
          <p class="mb-4">{{ errorMessage }}</p>
          <v-btn
            color="primary"
            block
            @click="showErrorDialog = false"
          >
            {{ $t('common.close') }}
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import PaymentService from '@/services/payment.service'

export default {
  name: 'PaymentForm',

  props: {
    orderData: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const router = useRouter()
    const store = useStore()
    const { t } = useI18n()

    const selectedMethod = ref(null)
    const selectedPanel = ref(null)
    const savedMethods = ref([])
    const loading = ref(false)
    const processingPayment = ref(false)
    const showSuccessDialog = ref(false)
    const showErrorDialog = ref(false)
    const errorMessage = ref('')

    // Load saved payment methods
    const loadSavedMethods = async () => {
      try {
        const methods = await PaymentService.getPaymentMethods()
        savedMethods.value = methods
      } catch (error) {
        console.error('Error loading payment methods:', error)
      }
    }

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount)
    }

    // Get payment method icon
    const getPaymentMethodIcon = (type) => {
      const icons = {
        visa: '/images/payment/visa.png',
        mastercard: '/images/payment/mastercard.png',
        vnpay: '/images/payment/vnpay.png',
        momo: '/images/payment/momo.png',
        zalopay: '/images/payment/zalopay.png'
      }
      return icons[type] || icons.default
    }

    // Mask card number
    const maskCardNumber = (number) => {
      return `•••• ${number.slice(-4)}`
    }

    // Process VNPay payment
    const processVNPay = async () => {
      try {
        loading.value = true
        const response = await PaymentService.initVNPay(props.orderData)
        window.location.href = response.paymentUrl
      } catch (error) {
        errorMessage.value = t('payment.error.vnpay')
        showErrorDialog.value = true
      } finally {
        loading.value = false
      }
    }

    // Process Momo payment
    const processMomo = async () => {
      try {
        loading.value = true
        const response = await PaymentService.initMomo(props.orderData)
        window.location.href = response.paymentUrl
      } catch (error) {
        errorMessage.value = t('payment.error.momo')
        showErrorDialog.value = true
      } finally {
        loading.value = false
      }
    }

    // Process ZaloPay payment
    const processZaloPay = async () => {
      try {
        loading.value = true
        const response = await PaymentService.initZaloPay(props.orderData)
        window.location.href = response.paymentUrl
      } catch (error) {
        errorMessage.value = t('payment.error.zalopay')
        showErrorDialog.value = true
      } finally {
        loading.value = false
      }
    }

    // Handle successful payment
    const handlePaymentSuccess = () => {
      showSuccessDialog.value = false
      router.push({
        name: 'OrderDetail',
        params: { id: props.orderData.id }
      })
    }

    // Handle payment callback
    const handlePaymentCallback = async (provider, data) => {
      try {
        processingPayment.value = true
        const result = await PaymentService.handlePaymentCallback(provider, data)
        if (result.success) {
          showSuccessDialog.value = true
          // Request invoice generation
          await PaymentService.requestInvoice(props.orderData.id)
        } else {
          errorMessage.value = result.message || t('payment.error.general')
          showErrorDialog.value = true
        }
      } catch (error) {
        errorMessage.value = t('payment.error.general')
        showErrorDialog.value = true
      } finally {
        processingPayment.value = false
      }
    }

    onMounted(() => {
      loadSavedMethods()
      
      // Check for payment callback
      const urlParams = new URLSearchParams(window.location.search)
      const provider = urlParams.get('provider')
      if (provider) {
        handlePaymentCallback(provider, Object.fromEntries(urlParams))
      }
    })

    return {
      selectedMethod,
      selectedPanel,
      savedMethods,
      loading,
      processingPayment,
      showSuccessDialog,
      showErrorDialog,
      errorMessage,
      formatCurrency,
      getPaymentMethodIcon,
      maskCardNumber,
      processVNPay,
      processMomo,
      processZaloPay,
      handlePaymentSuccess
    }
  }
}
</script>

<style scoped>
.payment-form {
  max-width: 600px;
  margin: 0 auto;
}

.payment-methods {
  margin-bottom: var(--spacing-md);
}

.v-expansion-panels {
  margin-bottom: var(--spacing-md);
}

.v-expansion-panel-title {
  min-height: 64px;
}

@media (max-width: 600px) {
  .payment-form {
    max-width: 100%;
  }
}
</style>