<template>
  <v-container>
    <h1 class="text-h4 mb-6">Checkout</h1>
    
    <v-stepper v-model="currentStep">
      <v-stepper-header>
        <v-stepper-item step="1" title="Delivery Address"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item step="2" title="Payment Method"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item step="3" title="Order Review"></v-stepper-item>
      </v-stepper-header>

      <v-stepper-window>
        <!-- Step 1: Delivery Address -->
        <v-stepper-window-item step="1">
          <v-card class="my-6">
            <v-card-text>
              <DeliveryAddressSelector @address-selected="setSelectedAddress" />
            </v-card-text>
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                :disabled="!selectedAddress"
                @click="currentStep = 2"
              >
                Continue to Payment
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-window-item>

        <!-- Step 2: Payment Method -->
        <v-stepper-window-item step="2">
          <v-card class="my-6">
            <v-card-text>
              <PaymentProcessor @payment-method-selected="setPaymentMethod" />
              <CouponInput class="mt-6" @coupon-applied="applyCoupon" />
            </v-card-text>
            <v-card-actions>
              <v-btn
                variant="text"
                @click="currentStep = 1"
              >
                <v-icon start>mdi-arrow-left</v-icon>
                Back
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                :disabled="!paymentMethod"
                @click="currentStep = 3"
              >
                Review Order
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-window-item>

        <!-- Step 3: Order Review -->
        <v-stepper-window-item step="3">
          <v-card class="my-6">
            <v-card-text>
              <OrderSummary
                :address="selectedAddress"
                :payment-method="paymentMethod"
                :applied-coupon="appliedCoupon"
              />
            </v-card-text>
            <v-card-actions>
              <v-btn
                variant="text"
                @click="currentStep = 2"
              >
                <v-icon start>mdi-arrow-left</v-icon>
                Back
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                color="success"
                :loading="isProcessing"
                @click="placeOrder"
              >
                <v-icon start>mdi-check-circle</v-icon>
                Place Order
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>
  </v-container>
</template>

<script>
import { useToast } from '@/composables/useToast';
import { useCheckout } from '@/composables/useCheckout';
import DeliveryAddressSelector from './DeliveryAddressSelector.vue';
import PaymentProcessor from './PaymentProcessor.vue';
import CouponInput from './CouponInput.vue';
import OrderSummary from './OrderSummary.vue';

export default {
  name: 'CheckoutPage',
  components: {
    DeliveryAddressSelector,
    PaymentProcessor,
    CouponInput,
    OrderSummary
  },
  data() {
    return {
      currentStep: 1,
      selectedAddress: null,
      paymentMethod: null,
      appliedCoupon: null,
      isProcessing: false
    };
  },
  setup() {
    const { showSuccess, showError } = useToast();
    const { processCheckout } = useCheckout();
    
    return {
      showSuccess,
      showError,
      processCheckout
    };
  },
  methods: {
    setSelectedAddress(address) {
      this.selectedAddress = address;
    },
    setPaymentMethod(method) {
      this.paymentMethod = method;
    },
    applyCoupon(coupon) {
      this.appliedCoupon = coupon;
      this.showSuccess(`Coupon "${coupon.code}" applied successfully!`);
    },
    async placeOrder() {
      if (!this.selectedAddress || !this.paymentMethod) {
        this.showError('Please complete all required information');
        return;
      }

      try {
        this.isProcessing = true;
        
        const orderData = {
          address_id: this.selectedAddress.id,
          payment_method: this.paymentMethod.id,
          coupon_code: this.appliedCoupon?.code || null
        };
        
        const result = await this.processCheckout(orderData);
        
        this.showSuccess('Order placed successfully!');
        
        // Navigate to order tracking page
        this.$router.push({
          name: 'OrderTracking', 
          params: { id: result.orderId }
        });
      } catch (error) {
        console.error('Checkout error:', error);
        this.showError(error.message || 'Failed to place your order. Please try again.');
      } finally {
        this.isProcessing = false;
      }
    }
  }
};
</script>

<style scoped>
.v-stepper {
  box-shadow: none;
  background: transparent;
}
</style>