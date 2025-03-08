<template>
  <div class="payment-processor">
    <!-- Payment Method Selection -->
    <div class="mb-4">
      <v-tabs
        v-model="selectedMethod"
        show-arrows
        density="comfortable"
      >
        <v-tab
          v-for="method in availableMethods"
          :key="method.id"
          :value="method.id"
          class="text-none"
        >
          <v-icon start>{{ method.icon }}</v-icon>
          {{ method.name }}
        </v-tab>
      </v-tabs>
    </div>

    <!-- Payment Forms -->
    <v-window v-model="selectedMethod">
      <!-- Credit Card Form -->
      <v-window-item value="card">
        <div class="card-form">
          <!-- Card Number -->
          <div class="mb-4">
            <v-text-field
              v-model="cardDetails.number"
              label="Card Number"
              :rules="[rules.required, rules.cardNumber]"
              :error-messages="cardErrors.number"
              placeholder="1234 5678 9012 3456"
              maxlength="19"
              @input="formatCardNumber"
              @blur="validateCardNumber"
            >
              <template v-slot:append>
                <v-icon :color="cardBrandColor">{{ cardBrandIcon }}</v-icon>
              </template>
            </v-text-field>
          </div>

          <v-row>
            <v-col cols="8">
              <!-- Expiry Date -->
              <v-text-field
                v-model="cardDetails.expiry"
                label="Expiry Date"
                :rules="[rules.required, rules.expiry]"
                :error-messages="cardErrors.expiry"
                placeholder="MM/YY"
                maxlength="5"
                @input="formatExpiry"
                @blur="validateExpiry"
              ></v-text-field>
            </v-col>
            <v-col cols="4">
              <!-- CVV -->
              <v-text-field
                v-model="cardDetails.cvv"
                label="CVV"
                :rules="[rules.required, rules.cvv]"
                :error-messages="cardErrors.cvv"
                placeholder="123"
                maxlength="4"
                @blur="validateCVV"
              ></v-text-field>
            </v-col>
          </v-row>

          <!-- Name on Card -->
          <v-text-field
            v-model="cardDetails.name"
            label="Name on Card"
            :rules="[rules.required]"
            :error-messages="cardErrors.name"
            placeholder="John Doe"
            @blur="validateName"
          ></v-text-field>

          <!-- Save Card Option -->
          <v-checkbox
            v-if="isAuthenticated"
            v-model="saveCard"
            label="Save card for future payments"
            :disabled="processingPayment"
          ></v-checkbox>
        </div>
      </v-window-item>

      <!-- Digital Wallet -->
      <v-window-item value="digital_wallet">
        <div class="digital-wallet-form">
          <v-list>
            <v-list-item
              v-for="wallet in digitalWallets"
              :key="wallet.id"
              :value="wallet.id"
              @click="selectDigitalWallet(wallet)"
            >
              <template v-slot:prepend>
                <v-avatar :image="wallet.icon" size="32"></v-avatar>
              </template>
              
              <v-list-item-title>{{ wallet.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ wallet.description }}</v-list-item-subtitle>
              
              <template v-slot:append>
                <v-btn
                  :color="wallet.color"
                  :loading="wallet.id === processingWallet"
                  @click.stop="connectWallet(wallet)"
                >
                  {{ wallet.connected ? 'Connected' : 'Connect' }}
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </div>
      </v-window-item>

      <!-- Saved Cards -->
      <v-window-item value="saved_cards">
        <div v-if="savedCards.length === 0" class="text-center py-8">
          <v-icon size="48" color="grey-lighten-1">mdi-credit-card-off</v-icon>
          <div class="text-body-1 mt-2">No saved cards</div>
          <v-btn
            variant="text"
            color="primary"
            class="mt-4"
            @click="selectedMethod = 'card'"
          >
            Add New Card
          </v-btn>
        </div>

        <v-list v-else select-strategy="single-select" v-model="selectedSavedCard">
          <v-list-item
            v-for="card in savedCards"
            :key="card.id"
            :value="card.id"
          >
            <template v-slot:prepend>
              <v-icon :color="getCardBrandColor(card.brand)">
                {{ getCardBrandIcon(card.brand) }}
              </v-icon>
            </template>
            
            <v-list-item-title>•••• {{ card.last4 }}</v-list-item-title>
            <v-list-item-subtitle>
              Expires {{ card.expMonth }}/{{ card.expYear }}
            </v-list-item-subtitle>
            
            <template v-slot:append>
              <v-btn
                icon="mdi-delete"
                variant="text"
                size="small"
                color="error"
                @click.stop="confirmDeleteCard(card)"
              >
                <v-tooltip activator="parent" location="top">
                  Remove Card
                </v-tooltip>
              </v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-window-item>
    </v-window>

    <!-- Payment Summary -->
    <v-divider class="my-4"></v-divider>

    <div class="payment-summary">
      <div class="d-flex justify-space-between mb-2">
        <span class="text-body-2">Subtotal</span>
        <span class="text-body-2">${{ amount.toFixed(2) }}</span>
      </div>
      
      <div v-if="fees.processing > 0" class="d-flex justify-space-between mb-2">
        <span class="text-body-2">Processing Fee</span>
        <span class="text-body-2">${{ fees.processing.toFixed(2) }}</span>
      </div>
      
      <div class="d-flex justify-space-between font-weight-bold">
        <span>Total</span>
        <span>${{ totalAmount.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Payment Button -->
    <v-btn
      color="primary"
      block
      size="large"
      class="mt-4"
      :loading="processingPayment"
      :disabled="!isValid || processingPayment"
      @click="processPayment"
    >
      Pay ${{ totalAmount.toFixed(2) }}
    </v-btn>

    <!-- Delete Card Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Remove Card?</v-card-title>
        <v-card-text>
          Are you sure you want to remove this card? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deletingCard"
            @click="deleteCard"
          >
            Remove
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'PaymentProcessor',

  props: {
    amount: {
      type: Number,
      required: true,
    },
    fees: {
      type: Object,
      default: () => ({
        processing: 0
      })
    },
    orderId: {
      type: String,
      required: true
    }
  },

  emits: [
    'payment-success',
    'payment-error'
  ],

  setup(props, { emit }) {
    const store = useStore()
    
    // State
    const selectedMethod = ref('card')
    const processingPayment = ref(false)
    const processingWallet = ref(null)
    const showDeleteDialog = ref(false)
    const deletingCard = ref(false)
    const cardToDelete = ref(null)
    
    // Card Form
    const cardDetails = ref({
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    })
    
    const cardErrors = ref({
      number: '',
      expiry: '',
      cvv: '',
      name: ''
    })
    
    const saveCard = ref(false)
    const selectedSavedCard = ref(null)
    
    // Available payment methods
    const availableMethods = [
      {
        id: 'card',
        name: 'Credit Card',
        icon: 'mdi-credit-card'
      },
      {
        id: 'digital_wallet',
        name: 'Digital Wallet',
        icon: 'mdi-wallet'
      },
      {
        id: 'saved_cards',
        name: 'Saved Cards',
        icon: 'mdi-credit-card-multiple',
        requiresAuth: true
      }
    ].filter(method => 
      !method.requiresAuth || store.getters['auth/isAuthenticated']
    )
    
    // Digital wallets
    const digitalWallets = [
      {
        id: 'google_pay',
        name: 'Google Pay',
        icon: '/icons/google-pay.png',
        description: 'Pay with Google Pay',
        color: 'primary',
        connected: false
      },
      {
        id: 'apple_pay',
        name: 'Apple Pay',
        icon: '/icons/apple-pay.png',
        description: 'Pay with Apple Pay',
        color: 'black',
        connected: false
      }
    ]
    
    // Saved cards from store
    const savedCards = computed(() => 
      store.state.payment.savedCards || []
    )
    
    // Computed
    const isAuthenticated = computed(() => 
      store.getters['auth/isAuthenticated']
    )
    
    const totalAmount = computed(() => 
      props.amount + props.fees.processing
    )
    
    const cardBrand = computed(() => {
      const number = cardDetails.value.number.replace(/\s/g, '')
      if (number.startsWith('4')) return 'visa'
      if (number.startsWith('5')) return 'mastercard'
      if (number.startsWith('3')) return 'amex'
      return 'generic'
    })
    
    const cardBrandIcon = computed(() => {
      const icons = {
        visa: 'mdi-credit-card-outline',
        mastercard: 'mdi-credit-card-outline',
        amex: 'mdi-credit-card-outline',
        generic: 'mdi-credit-card-outline'
      }
      return icons[cardBrand.value]
    })
    
    const cardBrandColor = computed(() => {
      const colors = {
        visa: 'blue',
        mastercard: 'orange',
        amex: 'blue-grey',
        generic: 'grey'
      }
      return colors[cardBrand.value]
    })
    
    const isValid = computed(() => {
      if (selectedMethod.value === 'card') {
        return !Object.values(cardErrors.value).some(error => error) &&
          Object.values(cardDetails.value).every(value => value)
      }
      if (selectedMethod.value === 'saved_cards') {
        return !!selectedSavedCard.value
      }
      if (selectedMethod.value === 'digital_wallet') {
        return digitalWallets.some(wallet => wallet.connected)
      }
      return false
    })
    
    // Methods
    const formatCardNumber = (event) => {
      let value = event.target.value.replace(/\s/g, '')
      value = value.replace(/[^0-9]/g, '')
      
      const parts = []
      for (let i = 0; i < value.length && i < 16; i += 4) {
        parts.push(value.slice(i, i + 4))
      }
      
      cardDetails.value.number = parts.join(' ')
    }
    
    const formatExpiry = (event) => {
      let value = event.target.value.replace(/\D/g, '')
      
      if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2)
      }
      
      cardDetails.value.expiry = value
    }
    
    const validateCardNumber = () => {
      const number = cardDetails.value.number.replace(/\s/g, '')
      if (!number) {
        cardErrors.value.number = 'Card number is required'
        return false
      }
      
      if (!/^\d{15,16}$/.test(number)) {
        cardErrors.value.number = 'Invalid card number'
        return false
      }
      
      cardErrors.value.number = ''
      return true
    }
    
    const validateExpiry = () => {
      const [month, year] = cardDetails.value.expiry.split('/')
      if (!month || !year) {
        cardErrors.value.expiry = 'Expiry date is required'
        return false
      }
      
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      const currentYear = now.getFullYear() % 100
      
      if (parseInt(year) < currentYear || 
         (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
        cardErrors.value.expiry = 'Card has expired'
        return false
      }
      
      cardErrors.value.expiry = ''
      return true
    }
    
    const validateCVV = () => {
      const cvv = cardDetails.value.cvv
      if (!cvv) {
        cardErrors.value.cvv = 'CVV is required'
        return false
      }
      
      if (!/^\d{3,4}$/.test(cvv)) {
        cardErrors.value.cvv = 'Invalid CVV'
        return false
      }
      
      cardErrors.value.cvv = ''
      return true
    }
    
    const validateName = () => {
      const name = cardDetails.value.name
      if (!name) {
        cardErrors.value.name = 'Name is required'
        return false
      }
      
      if (name.length < 3) {
        cardErrors.value.name = 'Name is too short'
        return false
      }
      
      cardErrors.value.name = ''
      return true
    }
    
    const connectWallet = async (wallet) => {
      processingWallet.value = wallet.id
      
      try {
        // Connect to digital wallet
        await store.dispatch('payment/connectWallet', wallet.id)
        
        // Update wallet status
        const index = digitalWallets.findIndex(w => w.id === wallet.id)
        if (index !== -1) {
          digitalWallets[index].connected = true
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error)
      } finally {
        processingWallet.value = null
      }
    }
    
    const processPayment = async () => {
      processingPayment.value = true
      
      try {
        let paymentResult
        
        switch (selectedMethod.value) {
          case 'card':
            paymentResult = await processCardPayment()
            break
            
          case 'saved_cards':
            paymentResult = await processSavedCardPayment()
            break
            
          case 'digital_wallet':
            paymentResult = await processDigitalWalletPayment()
            break
        }
        
        if (paymentResult.success) {
          emit('payment-success', paymentResult)
        } else {
          emit('payment-error', paymentResult.error)
        }
      } catch (error) {
        console.error('Payment failed:', error)
        emit('payment-error', error)
      } finally {
        processingPayment.value = false
      }
    }
    
    const processCardPayment = async () => {
      // Save card if requested
      if (saveCard.value) {
        await store.dispatch('payment/saveCard', {
          number: cardDetails.value.number,
          expiry: cardDetails.value.expiry,
          name: cardDetails.value.name
        })
      }
      
      // Process payment
      return await store.dispatch('payment/processPayment', {
        method: 'card',
        orderId: props.orderId,
        amount: props.amount,
        card: cardDetails.value
      })
    }
    
    const processSavedCardPayment = async () => {
      return await store.dispatch('payment/processPayment', {
        method: 'saved_card',
        orderId: props.orderId,
        amount: props.amount,
        cardId: selectedSavedCard.value
      })
    }
    
    const processDigitalWalletPayment = async () => {
      const connectedWallet = digitalWallets.find(w => w.connected)
      if (!connectedWallet) return { success: false, error: 'No wallet connected' }
      
      return await store.dispatch('payment/processPayment', {
        method: 'digital_wallet',
        orderId: props.orderId,
        amount: props.amount,
        walletId: connectedWallet.id
      })
    }
    
    const confirmDeleteCard = (card) => {
      cardToDelete.value = card
      showDeleteDialog.value = true
    }
    
    const deleteCard = async () => {
      if (!cardToDelete.value) return
      
      deletingCard.value = true
      try {
        await store.dispatch('payment/deleteCard', cardToDelete.value.id)
        showDeleteDialog.value = false
      } catch (error) {
        console.error('Failed to delete card:', error)
      } finally {
        deletingCard.value = false
        cardToDelete.value = null
      }
    }
    
    // Validation rules
    const rules = {
      required: v => !!v || 'Required',
      cardNumber: v => /^\d{15,16}$/.test(v.replace(/\s/g, '')) || 'Invalid card number',
      expiry: v => /^\d{2}\/\d{2}$/.test(v) || 'Invalid expiry date',
      cvv: v => /^\d{3,4}$/.test(v) || 'Invalid CVV'
    }

    return {
      selectedMethod,
      processingPayment,
      processingWallet,
      showDeleteDialog,
      deletingCard,
      cardDetails,
      cardErrors,
      saveCard,
      selectedSavedCard,
      availableMethods,
      digitalWallets,
      savedCards,
      isAuthenticated,
      totalAmount,
      cardBrand,
      cardBrandIcon,
      cardBrandColor,
      isValid,
      rules,
      formatCardNumber,
      formatExpiry,
      validateCardNumber,
      validateExpiry,
      validateCVV,
      validateName,
      connectWallet,
      processPayment,
      confirmDeleteCard,
      deleteCard
    }
  }
}
</script>

<style scoped>
.payment-processor {
  max-width: 600px;
  margin: 0 auto;
}

.card-form {
  padding: 16px 0;
}

.digital-wallet-form {
  padding: 8px 0;
}

.payment-summary {
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 8px;
}
</style>