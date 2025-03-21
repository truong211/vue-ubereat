// Payment Selection Component
<template>
  <v-card class="payment-methods-card">
    <v-card-title class="text-h6">
      Select Payment Method
    </v-card-title>

    <v-card-text>
      <v-radio-group v-model="selectedMethod" @change="onPaymentMethodChange" density="compact">
        <!-- VNPay -->
        <v-radio value="vnpay">
          <template v-slot:label>
            <div class="d-flex align-center">
              <v-img src="/img/payment/vnpay.png" width="40" class="mr-3" alt="VNPay"></v-img>
              <div>
                <div class="text-subtitle-2">VNPay</div>
                <div class="text-caption text-grey">Pay with VNPay wallet or bank account</div>
              </div>
            </div>
          </template>
        </v-radio>

        <!-- Momo -->
        <v-radio value="momo">
          <template v-slot:label>
            <div class="d-flex align-center">
              <v-img src="/img/payment/momo.png" width="40" class="mr-3" alt="Momo"></v-img>
              <div>
                <div class="text-subtitle-2">Momo</div>
                <div class="text-caption text-grey">Pay with Momo e-wallet</div>
              </div>
            </div>
          </template>
        </v-radio>

        <!-- ZaloPay -->
        <v-radio value="zalopay">
          <template v-slot:label>
            <div class="d-flex align-center">
              <v-img src="/img/payment/zalopay.png" width="40" class="mr-3" alt="ZaloPay"></v-img>
              <div>
                <div class="text-subtitle-2">ZaloPay</div>
                <div class="text-caption text-grey">Pay with ZaloPay e-wallet</div>
              </div>
            </div>
          </template>
        </v-radio>

        <!-- Credit/Debit Card -->
        <v-radio value="card">
          <template v-slot:label>
            <div class="d-flex align-center">
              <v-img src="/img/payment/card.png" width="40" class="mr-3" alt="Credit Card"></v-img>
              <div>
                <div class="text-subtitle-2">Credit/Debit Card</div>
                <div class="text-caption text-grey">Pay with international cards (Visa, Mastercard, JCB)</div>
              </div>
            </div>
          </template>
        </v-radio>

        <!-- Cash on Delivery -->
        <v-radio value="cash">
          <template v-slot:label>
            <div class="d-flex align-center">
              <v-icon size="40" color="grey-darken-1" class="mr-3">mdi-cash</v-icon>
              <div>
                <div class="text-subtitle-2">Cash on Delivery</div>
                <div class="text-caption text-grey">Pay when your order arrives</div>
              </div>
            </div>
          </template>
        </v-radio>
      </v-radio-group>

      <!-- Card Details Form (shown only when 'card' is selected) -->
      <div v-if="selectedMethod === 'card'" class="mt-4 pt-3 border-top">
        <h3 class="text-subtitle-1 mb-3">Card Details</h3>
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="cardDetails.number"
              label="Card Number"
              hint="Enter 16-digit card number"
              placeholder="XXXX XXXX XXXX XXXX"
              :rules="[v => !!v || 'Card number is required', validateCardNumber]"
              maxlength="19"
              @input="formatCardNumber"
              variant="outlined"
              density="comfortable"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="6">
            <v-text-field
              v-model="cardDetails.expiry"
              label="Expiry (MM/YY)"
              placeholder="MM/YY"
              :rules="[v => !!v || 'Expiry date is required', validateExpiryDate]"
              maxlength="5"
              @input="formatExpiryDate"
              variant="outlined"
              density="comfortable"
            ></v-text-field>
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model="cardDetails.cvc"
              label="CVC/CVV"
              placeholder="XXX"
              :rules="[v => !!v || 'CVC is required', v => /^\d{3,4}$/.test(v) || 'CVC must be 3 or 4 digits']"
              maxlength="4"
              type="password"
              variant="outlined"
              density="comfortable"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="cardDetails.name"
              label="Cardholder Name"
              placeholder="Name on card"
              :rules="[v => !!v || 'Cardholder name is required']"
              variant="outlined"
              density="comfortable"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-checkbox
              v-model="saveCard"
              label="Save card for future payments"
              color="primary"
              density="comfortable"
            ></v-checkbox>
          </v-col>
        </v-row>
      </div>

      <!-- Saved Cards (shown when 'card' is selected and user has saved cards) -->
      <div v-if="selectedMethod === 'card' && savedCards.length > 0" class="mt-4">
        <h3 class="text-subtitle-1 mb-3">Or use a saved card</h3>
        <v-radio-group v-model="selectedCardId" class="mt-0">
          <v-card
            v-for="card in savedCards"
            :key="card.id"
            :class="['mb-2', 'pa-3', 'rounded', { 'selected-card': selectedCardId === card.id }]"
            variant="outlined"
            @click="selectedCardId = card.id"
          >
            <div class="d-flex align-center">
              <v-radio :value="card.id" class="mr-2"></v-radio>
              <v-avatar color="grey-lighten-3" class="mr-3" rounded>
                <v-img
                  :src="`/img/payment/${card.brand.toLowerCase()}.png`"
                  width="24"
                  height="24"
                  alt="Card brand"
                ></v-img>
              </v-avatar>
              <div>
                <div class="text-subtitle-2">•••• •••• •••• {{ card.last4 }}</div>
                <div class="text-caption text-grey">Expires {{ card.expMonth }}/{{ card.expYear }}</div>
              </div>
              <v-spacer></v-spacer>
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                size="small"
                color="error"
                @click.stop="confirmDeleteCard(card)"
              ></v-btn>
            </div>
          </v-card>
        </v-radio-group>
      </div>
    </v-card-text>

    <v-card-actions>
      <v-btn
        color="primary"
        block
        size="large"
        @click="processPayment"
        :loading="loading"
        :disabled="!isFormValid"
      >
        Pay {{ formatCurrency(amount) }}
      </v-btn>
    </v-card-actions>

    <!-- Delete Card Confirmation Dialog -->
    <v-dialog v-model="deleteCardDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h6">Delete Saved Card</v-card-title>
        <v-card-text>
          Are you sure you want to delete this card? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteCardDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="text" @click="deleteCard" :loading="deletingCard">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import paymentService from '@/services/payment.service';
import { useStore } from 'vuex';

export default {
  name: 'PaymentMethodSelector',
  
  props: {
    amount: {
      type: Number,
      required: true
    },
    orderId: {
      type: Number,
      required: true
    }
  },
  
  emits: ['payment-processed', 'payment-started', 'payment-method-changed'],
  
  setup(props, { emit }) {
    const store = useStore();
    const selectedMethod = ref('vnpay');
    const loading = ref(false);
    const savedCards = ref([]);
    const selectedCardId = ref(null);
    const saveCard = ref(false);
    const deleteCardDialog = ref(false);
    const cardToDelete = ref(null);
    const deletingCard = ref(false);
    
    const cardDetails = ref({
      number: '',
      expiry: '',
      cvc: '',
      name: ''
    });

    // Fetch saved cards on component mount
    onMounted(async () => {
      try {
        const response = await paymentService.getSavedCards();
        savedCards.value = response;
        if (response.length > 0) {
          selectedCardId.value = response[0].id;
        }
      } catch (error) {
        console.error('Failed to fetch saved cards:', error);
      }
    });

    // Format card number with spaces
    const formatCardNumber = (event) => {
      let value = event.target.value.replace(/\s/g, '');
      value = value.replace(/\D/g, '');
      
      if (value.length > 0) {
        value = value.match(new RegExp('.{1,4}', 'g')).join(' ');
      }
      
      cardDetails.value.number = value;
    };

    // Format expiry date with slash
    const formatExpiryDate = (event) => {
      let value = event.target.value.replace(/\s/g, '');
      value = value.replace(/\D/g, '');
      
      if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
      }
      
      cardDetails.value.expiry = value;
    };

    // Validate card number
    const validateCardNumber = (value) => {
      if (!value) return true;
      const cardNumber = value.replace(/\s/g, '');
      return /^\d{16}$/.test(cardNumber) || 'Card number must be 16 digits';
    };

    // Validate expiry date
    const validateExpiryDate = (value) => {
      if (!value) return true;
      
      const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
      if (!regex.test(value)) {
        return 'Invalid format (MM/YY)';
      }
      
      const [month, year] = value.split('/');
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      
      if (Number(year) < currentYear) {
        return 'Card has expired';
      }
      
      if (Number(year) === currentYear && Number(month) < currentMonth) {
        return 'Card has expired';
      }
      
      return true;
    };

    // Check if form is valid based on selected payment method
    const isFormValid = computed(() => {
      if (selectedMethod.value === 'card') {
        if (selectedCardId.value) {
          return true;
        }
        
        return (
          cardDetails.value.number.replace(/\s/g, '').length === 16 &&
          validateExpiryDate(cardDetails.value.expiry) === true &&
          cardDetails.value.cvc.length >= 3 &&
          cardDetails.value.name.trim() !== ''
        );
      }
      
      return true;
    });

    // Process payment based on selected method
    const processPayment = async () => {
      try {
        loading.value = true;
        emit('payment-started', { method: selectedMethod.value });
        
        // Prepare return URL for redirect-based payments
        const returnUrl = `${window.location.origin}/payment/callback`;
        
        let result;
        
        switch (selectedMethod.value) {
          case 'vnpay':
            result = await paymentService.processVNPayPayment(props.orderId, returnUrl);
            if (result.redirect_url) {
              window.location.href = result.redirect_url;
            }
            break;
            
          case 'momo':
            result = await paymentService.processMomoPayment(props.orderId, returnUrl);
            if (result.redirect_url) {
              window.location.href = result.redirect_url;
            }
            break;
            
          case 'zalopay':
            result = await paymentService.processZaloPayPayment(props.orderId, returnUrl);
            if (result.redirect_url) {
              window.location.href = result.redirect_url;
            }
            break;
            
          case 'card':
            let cardToken;
            
            if (selectedCardId.value) {
              // Use saved card
              cardToken = selectedCardId.value;
            } else {
              // Process new card
              // In a real implementation, you would tokenize the card details securely
              // For this example, we'll simulate with a mock token
              const cardData = {
                number: cardDetails.value.number.replace(/\s/g, ''),
                exp_month: cardDetails.value.expiry.split('/')[0],
                exp_year: cardDetails.value.expiry.split('/')[1],
                cvc: cardDetails.value.cvc,
                name: cardDetails.value.name
              };
              
              // Simulate tokenization
              cardToken = `tok_${Date.now()}`;
            }
            
            result = await paymentService.processCardPayment(
              props.orderId,
              cardToken,
              saveCard.value
            );
            
            emit('payment-processed', {
              success: result.success,
              method: 'card',
              status: result.status
            });
            break;
            
          case 'cash':
            // For cash payments, just update the order
            await paymentService.processCashPayment(props.orderId);
            emit('payment-processed', {
              success: true,
              method: 'cash',
              status: 'pending'
            });
            break;
        }
        
        // Show success notification
        if (selectedMethod.value === 'card' || selectedMethod.value === 'cash') {
          store.dispatch('ui/showSnackbar', {
            message: 'Payment processed successfully',
            color: 'success'
          });
        }
      } catch (error) {
        console.error('Payment processing error:', error);
        
        // Show error notification
        store.dispatch('ui/showSnackbar', {
          message: error.message || 'Payment processing failed',
          color: 'error'
        });
        
        emit('payment-processed', {
          success: false,
          method: selectedMethod.value,
          error: error.message
        });
      } finally {
        loading.value = false;
      }
    };

    // Handle payment method change
    const onPaymentMethodChange = () => {
      emit('payment-method-changed', selectedMethod.value);
    };

    // Confirm card deletion
    const confirmDeleteCard = (card) => {
      cardToDelete.value = card;
      deleteCardDialog.value = true;
    };

    // Delete saved card
    const deleteCard = async () => {
      if (!cardToDelete.value) return;
      
      try {
        deletingCard.value = true;
        await paymentService.deleteSavedCard(cardToDelete.value.id);
        
        // Remove card from local state
        savedCards.value = savedCards.value.filter(card => card.id !== cardToDelete.value.id);
        
        // If deleted card was selected, select another one or clear selection
        if (selectedCardId.value === cardToDelete.value.id) {
          selectedCardId.value = savedCards.value.length > 0 ? savedCards.value[0].id : null;
        }
        
        // Show success notification
        store.dispatch('ui/showSnackbar', {
          message: 'Card deleted successfully',
          color: 'success'
        });
      } catch (error) {
        console.error('Failed to delete card:', error);
        
        // Show error notification
        store.dispatch('ui/showSnackbar', {
          message: 'Failed to delete card',
          color: 'error'
        });
      } finally {
        deletingCard.value = false;
        deleteCardDialog.value = false;
        cardToDelete.value = null;
      }
    };

    // Format currency for display
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    };

    return {
      selectedMethod,
      cardDetails,
      savedCards,
      selectedCardId,
      saveCard,
      loading,
      deleteCardDialog,
      deletingCard,
      isFormValid,
      formatCardNumber,
      formatExpiryDate,
      validateCardNumber,
      validateExpiryDate,
      processPayment,
      onPaymentMethodChange,
      confirmDeleteCard,
      deleteCard,
      formatCurrency
    };
  }
};
</script>

<style scoped>
.payment-methods-card {
  border-radius: 8px;
}

.selected-card {
  border: 2px solid var(--v-primary-base) !important;
  background-color: rgba(var(--v-primary-base), 0.05);
}

.border-top {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}
</style>