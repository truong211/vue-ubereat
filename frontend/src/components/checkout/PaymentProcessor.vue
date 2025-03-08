<template>
  <div class="payment-processor">
    <v-card>
      <v-card-title class="d-flex align-center">
        <span>Payment Method</span>
        <v-spacer></v-spacer>
        <v-chip
          v-if="processingState === 'success'"
          color="success"
          size="small"
          prepend-icon="mdi-check-circle"
        >
          Payment Successful
        </v-chip>
        <v-chip
          v-else-if="processingState === 'error'"
          color="error"
          size="small"
          prepend-icon="mdi-alert-circle"
        >
          Payment Failed
        </v-chip>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text>
        <!-- Payment method selection -->
        <v-radio-group
          v-model="selectedPaymentMethod"
          @change="resetCardFields"
          :disabled="isProcessing"
        >
          <v-radio value="credit_card">
            <template v-slot:label>
              <div class="d-flex align-center">
                <span>Credit Card</span>
                <div class="ml-4">
                  <v-icon class="mx-1" size="small">mdi-credit-card</v-icon>
                  <v-icon class="mx-1" size="small">mdi-credit-card-outline</v-icon>
                  <v-icon class="mx-1" size="small">mdi-credit-card-multiple</v-icon>
                </div>
              </div>
            </template>
          </v-radio>
          
          <v-radio value="paypal">
            <template v-slot:label>
              <div class="d-flex align-center">
                <span>PayPal</span>
                <v-icon class="ml-4" size="small">mdi-paypal</v-icon>
              </div>
            </template>
          </v-radio>
          
          <v-radio value="apple_pay" :disabled="!isApplePayAvailable">
            <template v-slot:label>
              <div class="d-flex align-center">
                <span>Apple Pay</span>
                <v-icon class="ml-4" size="small">mdi-apple</v-icon>
              </div>
            </template>
          </v-radio>
          
          <v-radio value="google_pay" :disabled="!isGooglePayAvailable">
            <template v-slot:label>
              <div class="d-flex align-center">
                <span>Google Pay</span>
                <v-icon class="ml-4" size="small">mdi-google</v-icon>
              </div>
            </template>
          </v-radio>
          
          <v-radio value="cash">
            <template v-slot:label>
              <div class="d-flex align-center">
                <span>Cash on Delivery</span>
                <v-icon class="ml-4" size="small">mdi-cash</v-icon>
              </div>
            </template>
          </v-radio>
        </v-radio-group>
        
        <!-- Credit Card Form -->
        <div v-if="selectedPaymentMethod === 'credit_card'" class="mt-4">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="cardDetails.cardNumber"
                label="Card Number"
                placeholder="1234 5678 9012 3456"
                :rules="[rules.required, rules.cardNumber]"
                :disabled="isProcessing"
                @input="formatCardNumber"
                maxlength="19"
                hint="Enter a valid card number"
                persistent-hint
              ></v-text-field>
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="cardDetails.expiryDate"
                label="Expiry Date"
                placeholder="MM/YY"
                :rules="[rules.required, rules.expiryDate]"
                :disabled="isProcessing"
                @input="formatExpiryDate"
                maxlength="5"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="cardDetails.cvv"
                label="CVV"
                placeholder="123"
                :rules="[rules.required, rules.cvv]"
                :disabled="isProcessing"
                maxlength="4"
                type="password"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="cardDetails.cardholderName"
                label="Cardholder Name"
                placeholder="John Doe"
                :rules="[rules.required]"
                :disabled="isProcessing"
              ></v-text-field>
            </v-col>
          </v-row>
          
          <v-row>
            <v-col cols="12">
              <v-checkbox
                v-model="saveCardForFuture"
                label="Save card for future payments"
                :disabled="isProcessing"
              ></v-checkbox>
            </v-col>
          </v-row>
        </div>
        
        <!-- PayPal -->
        <div v-else-if="selectedPaymentMethod === 'paypal'" class="mt-4 text-center">
          <v-img
            src="/img/paypal-button.png"
            alt="PayPal"
            width="240"
            class="mx-auto mb-4"
          ></v-img>
          <p class="text-body-2">
            You will be redirected to PayPal to complete your payment securely.
          </p>
        </div>
        
        <!-- Apple Pay -->
        <div v-else-if="selectedPaymentMethod === 'apple_pay'" class="mt-4 text-center">
          <v-img
            src="/img/apple-pay-button.png"
            alt="Apple Pay"
            width="240"
            class="mx-auto mb-4"
          ></v-img>
          <p class="text-body-2">
            Use Apple Pay to complete your payment quickly and securely.
          </p>
        </div>
        
        <!-- Google Pay -->
        <div v-else-if="selectedPaymentMethod === 'google_pay'" class="mt-4 text-center">
          <v-img
            src="/img/google-pay-button.png"
            alt="Google Pay"
            width="240"
            class="mx-auto mb-4"
          ></v-img>
          <p class="text-body-2">
            Use Google Pay to complete your payment quickly and securely.
          </p>
        </div>
        
        <!-- Cash on Delivery -->
        <div v-else-if="selectedPaymentMethod === 'cash'" class="mt-4">
          <v-alert type="info" variant="tonal" class="mb-4">
            <div class="d-flex align-center">
              <v-icon class="mr-2">mdi-information</v-icon>
              <div>
                <p class="font-weight-bold mb-1">Cash on Delivery</p>
                <p class="text-body-2 mb-0">
                  Please have the exact amount ready when the delivery arrives.
                </p>
              </div>
            </div>
          </v-alert>
          
          <v-checkbox
            v-model="needChange"
            label="I need change"
            :disabled="isProcessing"
          ></v-checkbox>
          
          <v-text-field
            v-if="needChange"
            v-model="changeAmount"
            label="Change for"
            prefix="$"
            type="number"
            hint="Enter the bill denomination you'll be paying with"
            persistent-hint
            :disabled="isProcessing"
          ></v-text-field>
        </div>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <v-card-actions>
        <v-btn
          color="primary"
          block
          :loading="isProcessing"
          :disabled="!isPaymentMethodValid"
          @click="processPayment"
        >
          Pay ${{ amount.toFixed(2) }}
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Payment Processing Dialog -->
    <v-dialog v-model="showProcessingDialog" max-width="400" persistent>
      <v-card>
        <v-card-text class="text-center pa-6">
          <v-progress-circular
            v-if="processingState === 'processing'"
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          
          <v-icon
            v-else-if="processingState === 'success'"
            color="success"
            size="64"
          >
            mdi-check-circle
          </v-icon>
          
          <v-icon
            v-else-if="processingState === 'error'"
            color="error"
            size="64"
          >
            mdi-alert-circle
          </v-icon>
          
          <h3 class="text-h5 mt-4">
            {{ getProcessingDialogTitle }}
          </h3>
          
          <p class="text-body-1 mt-2">
            {{ getProcessingDialogMessage }}
          </p>
          
          <v-btn
            v-if="processingState !== 'processing'"
            color="primary"
            class="mt-4"
            @click="closeProcessingDialog"
          >
            {{ processingState === 'success' ? 'Continue' : 'Try Again' }}
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue';

export default {
  name: 'PaymentProcessor',
  
  props: {
    amount: {
      type: Number,
      required: true
    },
    orderId: {
      type: String,
      required: true
    }
  },
  
  setup(props, { emit }) {
    // State
    const selectedPaymentMethod = ref('credit_card');
    const cardDetails = ref({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    });
    const saveCardForFuture = ref(false);
    const needChange = ref(false);
    const changeAmount = ref('');
    const isProcessing = ref(false);
    const processingState = ref(null); // processing, success, error
    const showProcessingDialog = ref(false);
    
    // Environment detection for payment methods
    const isApplePayAvailable = ref(false);
    const isGooglePayAvailable = ref(false);
    
    // Check for Apple Pay availability
    const checkApplePayAvailability = () => {
      // In a real app, would check if Apple Pay is supported
      // For demo, just check if on iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      isApplePayAvailable.value = isIOS;
    };
    
    // Check for Google Pay availability
    const checkGooglePayAvailability = () => {
      // In a real app, would check if Google Pay is supported
      // For demo, just check if on Android
      const isAndroid = /Android/.test(navigator.userAgent);
      isGooglePayAvailable.value = isAndroid;
    };
    
    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      cardNumber: v => {
        if (!v) return 'Card number is required';
        
        // Remove spaces
        const cleanNumber = v.replace(/\s/g, '');
        
        // Check if numeric and correct length
        if (!/^\d{16}$/.test(cleanNumber)) {
          return 'Card number must be 16 digits';
        }
        
        // Simple Luhn algorithm check
        let sum = 0;
        let alternate = false;
        for (let i = cleanNumber.length - 1; i >= 0; i--) {
          let n = parseInt(cleanNumber.charAt(i), 10);
          if (alternate) {
            n *= 2;
            if (n > 9) {
              n = (n % 10) + 1;
            }
          }
          sum += n;
          alternate = !alternate;
        }
        
        return (sum % 10 === 0) || 'Invalid card number';
      },
      expiryDate: v => {
        if (!v) return 'Expiry date is required';
        
        // Check format
        if (!/^\d{2}\/\d{2}$/.test(v)) {
          return 'Format must be MM/YY';
        }
        
        const [month, year] = v.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100;
        const currentMonth = currentDate.getMonth() + 1;
        
        // Convert to numbers
        const numericMonth = parseInt(month, 10);
        const numericYear = parseInt(year, 10);
        
        // Check month validity
        if (numericMonth < 1 || numericMonth > 12) {
          return 'Invalid month';
        }
        
        // Check if card is expired
        if (numericYear < currentYear || 
           (numericYear === currentYear && numericMonth < currentMonth)) {
          return 'Card is expired';
        }
        
        return true;
      },
      cvv: v => {
        if (!v) return 'CVV is required';
        
        // Check if numeric and correct length (3-4 digits)
        return /^\d{3,4}$/.test(v) || 'CVV must be 3 or 4 digits';
      }
    };
    
    // Format card number with spaces
    const formatCardNumber = () => {
      if (!cardDetails.value.cardNumber) return;
      
      // Remove all non-numeric characters
      let value = cardDetails.value.cardNumber.replace(/\D/g, '');
      
      // Add a space after every 4 characters
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
      
      // Update the value
      cardDetails.value.cardNumber = value;
    };
    
    // Format expiry date
    const formatExpiryDate = () => {
      if (!cardDetails.value.expiryDate) return;
      
      // Remove all non-numeric characters
      let value = cardDetails.value.expiryDate.replace(/\D/g, '');
      
      // Add slash after first 2 characters if not already there
      if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
      }
      
      // Update the value
      cardDetails.value.expiryDate = value;
    };
    
    // Reset card fields
    const resetCardFields = () => {
      if (selectedPaymentMethod.value !== 'credit_card') {
        cardDetails.value = {
          cardNumber: '',
          expiryDate: '',
          cvv: '',
          cardholderName: ''
        };
        saveCardForFuture.value = false;
      }
      
      if (selectedPaymentMethod.value !== 'cash') {
        needChange.value = false;
        changeAmount.value = '';
      }
    };
    
    // Check if payment method is valid
    const isPaymentMethodValid = computed(() => {
      if (selectedPaymentMethod.value === 'credit_card') {
        return (
          !!cardDetails.value.cardNumber.trim() &&
          !!cardDetails.value.expiryDate.trim() &&
          !!cardDetails.value.cvv.trim() &&
          !!cardDetails.value.cardholderName.trim() &&
          rules.cardNumber(cardDetails.value.cardNumber) === true &&
          rules.expiryDate(cardDetails.value.expiryDate) === true &&
          rules.cvv(cardDetails.value.cvv) === true
        );
      }
      
      // Other payment methods are valid by default
      return true;
    });
    
    // Process payment
    const processPayment = async () => {
      isProcessing.value = true;
      processingState.value = 'processing';
      showProcessingDialog.value = true;
      
      try {
        // In a real app, this would be an API call to process payment
        // const response = await axios.post('/api/payments', {
        //   orderId: props.orderId,
        //   amount: props.amount,
        //   paymentMethod: selectedPaymentMethod.value,
        //   cardDetails: selectedPaymentMethod.value === 'credit_card' ? cardDetails.value : undefined,
        //   saveCard: saveCardForFuture.value,
        //   cashDetails: selectedPaymentMethod.value === 'cash' ? {
        //     needChange: needChange.value,
        //     changeAmount: changeAmount.value
        //   } : undefined
        // });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate success (90% chance) or failure (10% chance)
        const isSuccess = Math.random() < 0.9;
        
        if (isSuccess) {
          processingState.value = 'success';
          
          // Emit success event
          emit('payment-success', {
            paymentMethod: selectedPaymentMethod.value,
            transactionId: 'TX-' + Math.floor(100000000 + Math.random() * 900000000),
            amount: props.amount
          });
        } else {
          processingState.value = 'error';
          
          // Emit error event
          emit('payment-error', {
            errorCode: 'PAYMENT_FAILED',
            errorMessage: 'Your payment could not be processed. Please try again.'
          });
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        processingState.value = 'error';
        
        // Emit error event
        emit('payment-error', {
          errorCode: 'PAYMENT_ERROR',
          errorMessage: 'An error occurred while processing your payment.'
        });
      } finally {
        isProcessing.value = false;
      }
    };
    
    // Close processing dialog
    const closeProcessingDialog = () => {
      showProcessingDialog.value = false;
      
      // If successful, emit close event
      if (processingState.value === 'success') {
        emit('dialog-closed');
      }
      
      // Reset processing state if error
      if (processingState.value === 'error') {
        processingState.value = null;
      }
    };
    
    // Dynamic dialog title
    const getProcessingDialogTitle = computed(() => {
      if (processingState.value === 'processing') {
        return 'Processing Payment';
      } else if (processingState.value === 'success') {
        return 'Payment Successful';
      } else if (processingState.value === 'error') {
        return 'Payment Failed';
      }
      return '';
    });
    
    // Dynamic dialog message
    const getProcessingDialogMessage = computed(() => {
      if (processingState.value === 'processing') {
        return 'Please wait while we process your payment...';
      } else if (processingState.value === 'success') {
        return 'Your payment was processed successfully. Thank you for your order!';
      } else if (processingState.value === 'error') {
        return 'There was an error processing your payment. Please try a different payment method or try again later.';
      }
      return '';
    });
    
    // Check payment method availability on mount
    checkApplePayAvailability();
    checkGooglePayAvailability();
    
    return {
      selectedPaymentMethod,
      cardDetails,
      saveCardForFuture,
      needChange,
      changeAmount,
      isProcessing,
      processingState,
      showProcessingDialog,
      isApplePayAvailable,
      isGooglePayAvailable,
      rules,
      isPaymentMethodValid,
      formatCardNumber,
      formatExpiryDate,
      resetCardFields,
      processPayment,
      closeProcessingDialog,
      getProcessingDialogTitle,
      getProcessingDialogMessage
    };
  }
};
</script>

<style scoped>
.payment-processor {
  max-width: 800px;
  margin: 0 auto;
}
</style> 