<template>
  <v-card class="payment-selector">
    <v-card-title>
      Payment Method
      <v-chip v-if="securePayment" size="small" color="success" class="ml-2">
        <v-icon start size="small">mdi-shield-check</v-icon>
        Secure
      </v-chip>
    </v-card-title>
    
    <v-card-text>
      <v-radio-group
        v-model="selectedPaymentMethod"
        @change="updatePaymentMethod"
      >
        <!-- Credit/Debit Card -->
        <v-radio value="credit_card">
          <template v-slot:label>
            <div class="d-flex align-center">
              <v-icon class="mr-3" color="primary">mdi-credit-card</v-icon>
              <div>
                <div class="text-subtitle-2">Credit/Debit Card</div>
                <div class="text-caption">Pay securely with your card</div>
              </div>
              <v-spacer></v-spacer>
              <div class="payment-icons">
                <img src="/img/payment/visa.svg" alt="Visa" height="20" class="mr-1">
                <img src="/img/payment/mastercard.svg" alt="Mastercard" height="20" class="mr-1">
                <img src="/img/payment/amex.svg" alt="American Express" height="20">
              </div>
            </div>
          </template>
        </v-radio>

        <!-- Digital Wallet -->
        <v-radio value="e_wallet">
          <template v-slot:label>
            <div class="d-flex align-center">
              <v-icon class="mr-3" color="indigo">mdi-wallet</v-icon>
              <div>
                <div class="text-subtitle-2">Digital Wallet</div>
                <div class="text-caption">Pay using your digital wallet</div>
              </div>
              <v-spacer></v-spacer>
              <div class="payment-icons">
                <img src="/img/payment/paypal.svg" alt="PayPal" height="20" class="mr-1">
                <img src="/img/payment/applepay.svg" alt="Apple Pay" height="20" class="mr-1">
                <img src="/img/payment/gpay.svg" alt="Google Pay" height="20">
              </div>
            </div>
          </template>
        </v-radio>

        <!-- Cash on Delivery -->
        <v-radio value="cash">
          <template v-slot:label>
            <div class="d-flex align-center">
              <v-icon class="mr-3" color="success">mdi-cash</v-icon>
              <div>
                <div class="text-subtitle-2">Cash on Delivery</div>
                <div class="text-caption">Pay with cash when your order arrives</div>
              </div>
            </div>
          </template>
        </v-radio>
      </v-radio-group>

      <!-- Credit Card Form (shown when credit card is selected) -->
      <div v-if="selectedPaymentMethod === 'credit_card'" class="mt-4">
        <v-expand-transition>
          <div>
            <v-text-field
              v-model="cardDetails.number"
              label="Card Number"
              placeholder="XXXX XXXX XXXX XXXX"
              variant="outlined"
              density="comfortable"
              maxlength="19"
              @input="formatCardNumber"
              :rules="[rules.required, rules.validCardNumber]"
            ></v-text-field>
            
            <div class="d-flex gap-4">
              <v-text-field
                v-model="cardDetails.expiry"
                label="Expiration Date"
                placeholder="MM/YY"
                variant="outlined"
                density="comfortable"
                maxlength="5"
                @input="formatExpiryDate"
                :rules="[rules.required, rules.validExpiry]"
                class="flex-1"
              ></v-text-field>
              
              <v-text-field
                v-model="cardDetails.cvv"
                label="Security Code"
                placeholder="CVC"
                variant="outlined"
                density="comfortable"
                maxlength="4"
                :rules="[rules.required, rules.validCVV]"
                class="flex-1"
              ></v-text-field>
            </div>
            
            <v-text-field
              v-model="cardDetails.name"
              label="Name on Card"
              placeholder="John Smith"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            ></v-text-field>
            
            <v-checkbox
              v-model="saveCard"
              label="Save card for future payments"
            ></v-checkbox>
          </div>
        </v-expand-transition>
      </div>

      <!-- E-Wallet Selection (shown when e_wallet is selected) -->
      <div v-if="selectedPaymentMethod === 'e_wallet'" class="mt-4">
        <v-expand-transition>
          <div>
            <v-select
              v-model="selectedWallet"
              :items="wallets"
              item-value="value"
              item-title="title"
              label="Select Wallet"
              variant="outlined"
              density="comfortable"
              :rules="[rules.required]"
            >
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-icon :color="item.raw.color">{{ item.raw.icon }}</v-icon>
                  </template>
                  <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                </template>
              </v-list-item>
            </v-select>
            
            <div class="text-caption mt-2">
              You will be redirected to complete payment after placing your order.
            </div>
          </div>
        </v-expand-transition>
      </div>
      
      <!-- Saved Cards -->
      <div v-if="savedCards.length > 0 && selectedPaymentMethod === 'credit_card'" class="mt-4">
        <v-divider class="my-4"></v-divider>
        
        <div class="text-subtitle-1 mb-2">Saved Cards</div>
        
        <v-list density="compact" rounded="lg" bg-color="grey-lighten-5" lines="two">
          <v-list-item
            v-for="card in savedCards"
            :key="card.id"
            :ripple="true"
            @click="selectSavedCard(card)"
            :active="selectedCardId === card.id"
          >
            <template v-slot:prepend>
              <v-icon :color="getCardIcon(card.type).color">{{ getCardIcon(card.type).icon }}</v-icon>
            </template>
            
            <v-list-item-title>•••• •••• •••• {{ card.last4 }}</v-list-item-title>
            <v-list-item-subtitle>Expires {{ card.expMonth }}/{{ card.expYear }}</v-list-item-subtitle>
            
            <template v-slot:append>
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click.stop="deleteSavedCard(card.id)"
              ></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </div>
    </v-card-text>
    
    <v-card-actions v-if="showActions">
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        variant="elevated"
        :disabled="!isPaymentValid"
        @click="confirm"
      >
        Confirm Payment Method
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { ref, computed, watch } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'PaymentMethodSelector',
  
  props: {
    initialMethod: {
      type: String,
      default: 'credit_card'
    },
    showActions: {
      type: Boolean,
      default: true
    },
    securePayment: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['update:payment-method', 'payment-confirmed'],
  
  setup(props, { emit }) {
    const store = useStore();
    
    // State
    const selectedPaymentMethod = ref(props.initialMethod);
    const saveCard = ref(false);
    const selectedWallet = ref(null);
    const selectedCardId = ref(null);
    
    const cardDetails = ref({
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    });
    
    // Mock saved cards - in a real app this would come from an API
    const savedCards = ref([
      {
        id: '1',
        type: 'visa',
        last4: '4242',
        expMonth: '12',
        expYear: '24',
        name: 'John Smith'
      },
      {
        id: '2',
        type: 'mastercard',
        last4: '5678',
        expMonth: '06',
        expYear: '25',
        name: 'John Smith'
      }
    ]);
    
    const wallets = [
      { title: 'PayPal', value: 'paypal', icon: 'mdi-paypal', color: 'blue' },
      { title: 'Apple Pay', value: 'applepay', icon: 'mdi-apple', color: 'black' },
      { title: 'Google Pay', value: 'gpay', icon: 'mdi-google-pay', color: 'green' }
    ];
    
    // Validation rules
    const rules = {
      required: value => !!value || 'Required',
      validCardNumber: value => {
        if (!value) return true;
        // Remove spaces and check if it's a number with 16 digits
        const cleanNumber = value.replace(/\s/g, '');
        return /^\d{16}$/.test(cleanNumber) || 'Invalid card number';
      },
      validExpiry: value => {
        if (!value) return true;
        // Check format MM/YY and also if date is not in the past
        if (!/^\d{2}\/\d{2}$/.test(value)) return 'Use format MM/YY';
        
        const [month, year] = value.split('/');
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear() % 100; // Get last two digits
        const currentMonth = currentDate.getMonth() + 1;
        
        const expMonth = parseInt(month, 10);
        const expYear = parseInt(year, 10);
        
        if (expMonth < 1 || expMonth > 12) return 'Invalid month';
        if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) {
          return 'Card expired';
        }
        
        return true;
      },
      validCVV: value => {
        if (!value) return true;
        return /^\d{3,4}$/.test(value) || 'Invalid CVV';
      }
    };
    
    // Computed properties
    const isPaymentValid = computed(() => {
      if (selectedPaymentMethod.value === 'cash') {
        return true;
      } else if (selectedPaymentMethod.value === 'credit_card') {
        if (selectedCardId.value) return true;
        
        return cardDetails.value.number && 
               cardDetails.value.expiry && 
               cardDetails.value.cvv && 
               cardDetails.value.name &&
               rules.validCardNumber(cardDetails.value.number) === true &&
               rules.validExpiry(cardDetails.value.expiry) === true &&
               rules.validCVV(cardDetails.value.cvv) === true;
      } else if (selectedPaymentMethod.value === 'e_wallet') {
        return !!selectedWallet.value;
      }
      
      return false;
    });
    
    // Methods
    const formatCardNumber = (e) => {
      let value = e.target.value.replace(/\s/g, '').substr(0, 16);
      if (value) {
        value = value.match(/.{1,4}/g).join(' ');
      }
      cardDetails.value.number = value;
    };
    
    const formatExpiryDate = (e) => {
      let value = e.target.value.replace(/\D/g, '').substr(0, 4);
      if (value.length > 2) {
        value = value.substr(0, 2) + '/' + value.substr(2);
      }
      cardDetails.value.expiry = value;
    };
    
    const selectSavedCard = (card) => {
      selectedCardId.value = card.id;
    };
    
    const deleteSavedCard = async (cardId) => {
      try {
        // In a real app, you would call an API to delete the card
        // await store.dispatch('payment/deleteSavedCard', cardId);
        
        // Mock deletion
        savedCards.value = savedCards.value.filter(card => card.id !== cardId);
        
        if (selectedCardId.value === cardId) {
          selectedCardId.value = null;
        }
      } catch (error) {
        console.error('Failed to delete card:', error);
      }
    };
    
    const getCardIcon = (type) => {
      const icons = {
        visa: { icon: 'mdi-credit-card', color: 'blue' },
        mastercard: { icon: 'mdi-credit-card', color: 'orange' },
        amex: { icon: 'mdi-credit-card', color: 'green' },
        discover: { icon: 'mdi-credit-card', color: 'red' }
      };
      
      return icons[type] || { icon: 'mdi-credit-card', color: 'grey' };
    };
    
    const updatePaymentMethod = () => {
      emit('update:payment-method', {
        type: selectedPaymentMethod.value,
        details: selectedPaymentMethod.value === 'credit_card' 
          ? (selectedCardId.value ? { savedCardId: selectedCardId.value } : cardDetails.value)
          : selectedPaymentMethod.value === 'e_wallet'
            ? { walletType: selectedWallet.value }
            : {}
      });
    };
    
    const confirm = () => {
      if (isPaymentValid.value) {
        updatePaymentMethod();
        emit('payment-confirmed', {
          type: selectedPaymentMethod.value,
          details: selectedPaymentMethod.value === 'credit_card' 
            ? (selectedCardId.value ? { savedCardId: selectedCardId.value } : cardDetails.value)
            : selectedPaymentMethod.value === 'e_wallet'
              ? { walletType: selectedWallet.value }
              : {},
          saveCard: selectedPaymentMethod.value === 'credit_card' ? saveCard.value : false
        });
      }
    };
    
    // Watch for changes in payment method to emit updates
    watch(selectedPaymentMethod, () => {
      selectedCardId.value = null;
      updatePaymentMethod();
    });
    
    watch(selectedCardId, () => {
      if (selectedCardId.value) {
        updatePaymentMethod();
      }
    });
    
    watch(selectedWallet, () => {
      if (selectedWallet.value) {
        updatePaymentMethod();
      }
    });
    
    return {
      selectedPaymentMethod,
      cardDetails,
      selectedWallet,
      selectedCardId,
      savedCards,
      wallets,
      saveCard,
      rules,
      isPaymentValid,
      
      formatCardNumber,
      formatExpiryDate,
      selectSavedCard,
      deleteSavedCard,
      getCardIcon,
      updatePaymentMethod,
      confirm
    };
  }
};
</script>

<style scoped>
.payment-selector {
  border-radius: 8px;
  overflow: hidden;
}

.payment-icons {
  display: flex;
  align-items: center;
}

.payment-icons img {
  max-height: 24px;
  margin-left: 4px;
}

.v-list-item--active {
  background-color: var(--v-primary-lighten-4, #e3f2fd);
}
</style>