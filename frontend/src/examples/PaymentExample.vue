<template>
  <div class="payment-examples">
    <h2 class="text-h5 mb-4">Payment Processing Examples</h2>

    <!-- Example 1: Basic Payment -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Payment</h3>
      <v-card>
        <v-card-text>
          <payment-processor
            :amount="50.99"
            :order-id="'ORDER123'"
            @payment-success="handlePaymentSuccess"
            @payment-error="handlePaymentError"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Payment with Fees -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Payment with Processing Fees</h3>
      <v-card>
        <v-card-text>
          <div class="mb-4">
            <div class="d-flex justify-space-between mb-2">
              <span>Order Subtotal</span>
              <span>${{ orderAmount.toFixed(2) }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span>Processing Fee (2.9% + $0.30)</span>
              <span>${{ processingFee.toFixed(2) }}</span>
            </div>
          </div>
          
          <payment-processor
            :amount="orderAmount"
            :fees="{ processing: processingFee }"
            :order-id="'ORDER124'"
            @payment-success="handlePaymentSuccess"
            @payment-error="handlePaymentError"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ feesExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Payment in Checkout Flow -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Checkout Integration</h3>
      <v-card>
        <v-card-text>
          <v-stepper v-model="checkoutStep">
            <v-stepper-header>
              <v-stepper-item value="1">
                Delivery
              </v-stepper-item>
              <v-stepper-divider></v-stepper-divider>
              <v-stepper-item value="2">
                Payment
              </v-stepper-item>
              <v-stepper-divider></v-stepper-divider>
              <v-stepper-item value="3">
                Confirmation
              </v-stepper-item>
            </v-stepper-header>

            <v-stepper-window>
              <!-- Delivery Step -->
              <v-stepper-window-item value="1">
                <div class="pa-4">
                  <h4 class="text-h6 mb-4">Delivery Details</h4>
                  <v-text-field
                    v-model="deliveryAddress"
                    label="Delivery Address"
                    variant="outlined"
                  ></v-text-field>
                  <v-btn
                    color="primary"
                    @click="checkoutStep = '2'"
                  >
                    Continue to Payment
                  </v-btn>
                </div>
              </v-stepper-window-item>

              <!-- Payment Step -->
              <v-stepper-window-item value="2">
                <payment-processor
                  :amount="75.99"
                  :order-id="'ORDER125'"
                  @payment-success="handleCheckoutSuccess"
                  @payment-error="handlePaymentError"
                />
              </v-stepper-window-item>

              <!-- Confirmation Step -->
              <v-stepper-window-item value="3">
                <div class="pa-4 text-center">
                  <v-icon
                    color="success"
                    size="64"
                    class="mb-4"
                  >
                    mdi-check-circle
                  </v-icon>
                  <h3 class="text-h5 mb-2">Payment Successful!</h3>
                  <p class="text-body-1">
                    Your order has been confirmed and will be delivered soon.
                  </p>
                  <v-btn
                    color="primary"
                    class="mt-4"
                    @click="resetCheckout"
                  >
                    Start New Order
                  </v-btn>
                </div>
              </v-stepper-window-item>
            </v-stepper-window>
          </v-stepper>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ checkoutExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 4: Express Checkout -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Express Checkout</h3>
      <v-card>
        <v-card-text>
          <div class="d-flex align-center justify-space-between mb-4">
            <div>
              <div class="text-h6">Quick Order</div>
              <div class="text-subtitle-2">Pay with saved payment method</div>
            </div>
            <div class="text-h5">${{ expressAmount.toFixed(2) }}</div>
          </div>
          
          <payment-processor
            :amount="expressAmount"
            :order-id="'ORDER126'"
            :selected-method="'saved_cards'"
            @payment-success="handlePaymentSuccess"
            @payment-error="handlePaymentError"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ expressExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import PaymentProcessor from '@/components/payment/PaymentProcessor.vue'

export default {
  name: 'PaymentExample',
  
  components: {
    PaymentProcessor
  },
  
  setup() {
    // State
    const checkoutStep = ref('1')
    const deliveryAddress = ref('')
    
    // Example amounts
    const orderAmount = ref(45.99)
    const expressAmount = ref(29.99)
    
    // Computed
    const processingFee = computed(() => {
      return (orderAmount.value * 0.029) + 0.30
    })
    
    // Event handlers
    const handlePaymentSuccess = (result) => {
      console.log('Payment successful:', result)
      alert(`Payment successful! Transaction ID: ${result.transactionId}`)
    }
    
    const handlePaymentError = (error) => {
      console.error('Payment failed:', error)
      alert(`Payment failed: ${error.message}`)
    }
    
    const handleCheckoutSuccess = (result) => {
      console.log('Checkout successful:', result)
      checkoutStep.value = '3'
    }
    
    const resetCheckout = () => {
      checkoutStep.value = '1'
      deliveryAddress.value = ''
    }
    
    // Code examples
    const basicExample = computed(() => {
      return `<payment-processor
  :amount="50.99"
  :order-id="'ORDER123'"
  @payment-success="handlePaymentSuccess"
  @payment-error="handlePaymentError"
/>`
    })
    
    const feesExample = computed(() => {
      return `<payment-processor
  :amount="orderAmount"
  :fees="{ 
    processing: processingFee // 2.9% + $0.30
  }"
  :order-id="'ORDER124'"
  @payment-success="handlePaymentSuccess"
  @payment-error="handlePaymentError"
/>`
    })
    
    const checkoutExample = computed(() => {
      return `<v-stepper v-model="checkoutStep">
  <!-- Previous steps -->
  
  <v-stepper-window-item value="2">
    <payment-processor
      :amount="75.99"
      :order-id="'ORDER125'"
      @payment-success="handleCheckoutSuccess"
      @payment-error="handlePaymentError"
    />
  </v-stepper-window-item>
  
  <!-- Confirmation step -->
</v-stepper>`
    })
    
    const expressExample = computed(() => {
      return `<payment-processor
  :amount="29.99"
  :order-id="'ORDER126'"
  :selected-method="'saved_cards'"
  @payment-success="handlePaymentSuccess"
  @payment-error="handlePaymentError"
/>`
    })
    
    return {
      checkoutStep,
      deliveryAddress,
      orderAmount,
      expressAmount,
      processingFee,
      handlePaymentSuccess,
      handlePaymentError,
      handleCheckoutSuccess,
      resetCheckout,
      basicExample,
      feesExample,
      checkoutExample,
      expressExample
    }
  }
}
</script>

<style scoped>
.payment-examples {
  padding: 16px;
}

.code-example {
  font-family: monospace;
  white-space: pre-wrap;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}
</style>