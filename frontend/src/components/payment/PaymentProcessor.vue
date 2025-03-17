<template>
  <div class="payment-processor">
    <v-card variant="flat" class="mb-4">
      <v-card-text>
        <h3 class="text-h6 mb-4">Select Payment Method</h3>
        
        <!-- Payment Method Selection -->
        <v-radio-group
          v-model="selectedMethod"
          @update:model-value="handlePaymentMethodChange"
        >
          <!-- Cash Payment -->
          <v-card
            :class="['payment-option mb-3', selectedMethod === 'cash' ? 'selected' : '']"
            hover
            @click="selectedMethod = 'cash'"
          >
            <v-card-text class="d-flex align-center">
              <v-radio
                value="cash"
                class="mr-2"
              ></v-radio>
              <v-icon
                size="32"
                color="success"
                class="mr-4"
              >
                mdi-cash
              </v-icon>
              <div>
                <div class="text-subtitle-1 font-weight-medium">Cash on Delivery</div>
                <div class="text-caption text-grey">Pay with cash upon delivery</div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Credit/Debit Card -->
          <v-card
            :class="['payment-option mb-3', selectedMethod === 'card' ? 'selected' : '']"
            hover
            @click="selectedMethod = 'card'"
          >
            <v-card-text class="d-flex align-center">
              <v-radio
                value="card"
                class="mr-2"
              ></v-radio>
              <div class="mr-4 d-flex">
                <v-icon size="32" color="primary">mdi-credit-card</v-icon>
              </div>
              <div class="flex-grow-1">
                <div class="text-subtitle-1 font-weight-medium">Credit/Debit Card</div>
                <div class="text-caption text-grey">Pay securely with your card</div>
              </div>
              <div class="payment-logos">
                <img src="/img/visa.png" alt="Visa" class="payment-logo" />
                <img src="/img/mastercard.png" alt="Mastercard" class="payment-logo" />
              </div>
            </v-card-text>
            
            <!-- Card Input Form -->
            <v-expand-transition>
              <div v-if="selectedMethod === 'card'" class="px-4 pb-4">
                <v-divider class="mb-4"></v-divider>
                <v-form
                  ref="cardForm"
                  v-model="cardFormValid"
                  @submit.prevent="validateCardForm"
                >
                  <v-row>
                    <v-col cols="12">
                      <v-text-field
                        v-model="cardNumber"
                        label="Card Number"
                        :rules="[v => !!v || 'Card number is required']"
                        placeholder="1234 5678 9012 3456"
                        @input="formatCardNumber"
                        maxlength="19"
                        variant="outlined"
                        density="comfortable"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="expiryDate"
                        label="Expiry Date"
                        :rules="[v => !!v || 'Expiry date is required']"
                        placeholder="MM/YY"
                        @input="formatExpiryDate"
                        maxlength="5"
                        variant="outlined"
                        density="comfortable"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="cvv"
                        label="CVV"
                        :rules="[v => !!v || 'CVV is required']"
                        placeholder="123"
                        maxlength="4"
                        variant="outlined"
                        density="comfortable"
                        type="password"
                      ></v-text-field>
                    </v-col>
                    
                    <v-col cols="12">
                      <v-checkbox
                        v-model="saveCard"
                        label="Save card for future payments"
                        hide-details
                      ></v-checkbox>
                    </v-col>
                  </v-row>
                </v-form>
              </div>
            </v-expand-transition>
          </v-card>

          <!-- Momo -->
          <v-card
            :class="['payment-option mb-3', selectedMethod === 'momo' ? 'selected' : '']"
            hover
            @click="selectedMethod = 'momo'"
          >
            <v-card-text class="d-flex align-center">
              <v-radio
                value="momo"
                class="mr-2"
              ></v-radio>
              <div class="mr-4">
                <img src="/img/momo.png" alt="Momo" class="payment-logo" />
              </div>
              <div>
                <div class="text-subtitle-1 font-weight-medium">Momo Wallet</div>
                <div class="text-caption text-grey">Pay with your Momo wallet</div>
              </div>
            </v-card-text>
          </v-card>

          <!-- ZaloPay -->
          <v-card
            :class="['payment-option mb-3', selectedMethod === 'zalopay' ? 'selected' : '']"
            hover
            @click="selectedMethod = 'zalopay'"
          >
            <v-card-text class="d-flex align-center">
              <v-radio
                value="zalopay"
                class="mr-2"
              ></v-radio>
              <div class="mr-4">
                <img src="/img/zalopay.png" alt="ZaloPay" class="payment-logo" />
              </div>
              <div>
                <div class="text-subtitle-1 font-weight-medium">ZaloPay</div>
                <div class="text-caption text-grey">Pay with your ZaloPay wallet</div>
              </div>
            </v-card-text>
          </v-card>

          <!-- VNPay -->
          <v-card
            :class="['payment-option mb-3', selectedMethod === 'vnpay' ? 'selected' : '']"
            hover
            @click="selectedMethod = 'vnpay'"
          >
            <v-card-text class="d-flex align-center">
              <v-radio
                value="vnpay"
                class="mr-2"
              ></v-radio>
              <div class="mr-4">
                <img src="/img/vnpay.png" alt="VNPay" class="payment-logo" />
              </div>
              <div>
                <div class="text-subtitle-1 font-weight-medium">VNPay</div>
                <div class="text-caption text-grey">Pay with your bank account via VNPay</div>
              </div>
            </v-card-text>
          </v-card>
        </v-radio-group>
      </v-card-text>
    </v-card>

    <!-- Saved Cards (shown only if user has saved cards) -->
    <v-expand-transition>
      <v-card v-if="savedCards.length > 0 && selectedMethod === 'card'" variant="flat">
        <v-card-text>
          <h3 class="text-h6 mb-4">Saved Cards</h3>
          <v-radio-group v-model="selectedSavedCard">
            <v-card
              v-for="card in savedCards"
              :key="card.id"
              :class="['payment-option mb-3', selectedSavedCard === card.id ? 'selected' : '']"
              hover
              @click="selectSavedCard(card)"
            >
              <v-card-text class="d-flex align-center">
                <v-radio
                  :value="card.id"
                  class="mr-2"
                ></v-radio>
                <v-icon
                  size="32"
                  :color="getCardIcon(card.brand).color"
                  class="mr-4"
                >
                  {{ getCardIcon(card.brand).icon }}
                </v-icon>
                <div>
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ card.brand }} •••• {{ card.last4 }}
                  </div>
                  <div class="text-caption text-grey">
                    Expires {{ card.expMonth }}/{{ card.expYear }}
                  </div>
                </div>
                <v-spacer></v-spacer>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  size="small"
                  @click.stop="confirmDeleteCard(card)"
                >
                </v-btn>
              </v-card-text>
            </v-card>
          </v-radio-group>
        </v-card-text>
      </v-card>
    </v-expand-transition>

    <!-- Delete Card Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Saved Card</v-card-title>
        <v-card-text>
          Are you sure you want to delete this saved card?<br>
          {{ selectedCardToDelete?.brand }} ending in {{ selectedCardToDelete?.last4 }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="deleteCard"
            :loading="isDeleting"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

export default {
  name: 'PaymentProcessor',
  
  data() {
    return {
      selectedMethod: null,
      cardFormValid: false,
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      saveCard: false,
      selectedSavedCard: null,
      savedCards: [], // Will be populated from backend
      showDeleteDialog: false,
      selectedCardToDelete: null,
      isDeleting: false
    };
  },

  computed: {
    isValidPayment() {
      if (this.selectedMethod === 'card') {
        return this.selectedSavedCard || this.cardFormValid;
      }
      return !!this.selectedMethod;
    }
  },

  watch: {
    selectedMethod(newMethod) {
      // Reset selected saved card when changing payment method
      if (newMethod !== 'card') {
        this.selectedSavedCard = null;
      }
      
      // Emit the selected method
      this.emitPaymentMethod();
    },
    
    selectedSavedCard() {
      this.emitPaymentMethod();
    }
  },

  methods: {
    ...mapActions({
      deleteSavedCard: 'payment/deleteSavedCard',
      fetchSavedCards: 'payment/fetchSavedCards'
    }),

    handlePaymentMethodChange() {
      // Reset form when changing payment method
      if (this.selectedMethod !== 'card') {
        this.$refs.cardForm?.reset();
      }
    },

    formatCardNumber(e) {
      // Remove any non-digit characters
      let value = e.target.value.replace(/\D/g, '');
      
      // Add space after every 4 digits
      value = value.replace(/(\d{4})/g, '$1 ').trim();
      
      // Update the model
      this.cardNumber = value;
    },

    formatExpiryDate(e) {
      // Remove any non-digit characters
      let value = e.target.value.replace(/\D/g, '');
      
      // Add slash after month
      if (value.length > 2) {
        value = value.slice(0, 2) + '/' + value.slice(2);
      }
      
      // Update the model
      this.expiryDate = value;
    },

    async validateCardForm() {
      const valid = await this.$refs.cardForm.validate();
      
      if (valid) {
        // Would typically validate with payment processor here
        return true;
      }
      
      return false;
    },

    getCardIcon(brand) {
      const icons = {
        visa: { icon: 'mdi-credit-card', color: 'blue' },
        mastercard: { icon: 'mdi-credit-card', color: 'orange' },
        amex: { icon: 'mdi-credit-card', color: 'blue-grey' }
      };
      
      return icons[brand.toLowerCase()] || { icon: 'mdi-credit-card', color: 'grey' };
    },

    selectSavedCard(card) {
      this.selectedSavedCard = card.id;
      // Clear new card form
      this.$refs.cardForm?.reset();
    },

    confirmDeleteCard(card) {
      this.selectedCardToDelete = card;
      this.showDeleteDialog = true;
    },

    async deleteCard() {
      if (!this.selectedCardToDelete) return;
      
      try {
        this.isDeleting = true;
        await this.deleteSavedCard(this.selectedCardToDelete.id);
        
        // Remove from local list
        this.savedCards = this.savedCards.filter(
          card => card.id !== this.selectedCardToDelete.id
        );
        
        // Reset selected card if it was deleted
        if (this.selectedSavedCard === this.selectedCardToDelete.id) {
          this.selectedSavedCard = null;
        }
        
        this.$toast.success('Card deleted successfully');
      } catch (error) {
        console.error('Error deleting card:', error);
        this.$toast.error('Failed to delete card. Please try again.');
      } finally {
        this.isDeleting = false;
        this.showDeleteDialog = false;
        this.selectedCardToDelete = null;
      }
    },

    emitPaymentMethod() {
      let paymentDetails = null;
      
      if (this.selectedMethod === 'card' && this.selectedSavedCard) {
        // Using a saved card
        const savedCard = this.savedCards.find(card => card.id === this.selectedSavedCard);
        if (savedCard) {
          paymentDetails = {
            type: 'saved_card',
            card_id: savedCard.id
          };
        }
      } else if (this.selectedMethod === 'card' && this.cardFormValid) {
        // Using a new card
        paymentDetails = {
          type: 'new_card',
          card_number: this.cardNumber.replace(/\s/g, ''),
          expiry: this.expiryDate,
          cvv: this.cvv,
          save_card: this.saveCard
        };
      } else if (this.selectedMethod) {
        // Using other payment methods
        paymentDetails = {
          type: this.selectedMethod
        };
      }
      
      this.$emit('payment-method-selected', paymentDetails);
    }
  },

  async mounted() {
    try {
      // Fetch saved cards from backend
      const cards = await this.fetchSavedCards();
      this.savedCards = cards;
    } catch (error) {
      console.error('Error fetching saved cards:', error);
      this.$toast.error('Failed to load saved cards');
    }
  }
};
</script>

<style scoped>
.payment-processor {
  max-width: 800px;
  margin: 0 auto;
}

.payment-option {
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all 0.2s ease;
}

.payment-option:hover {
  border-color: var(--v-primary-base);
}

.payment-option.selected {
  border: 2px solid var(--v-primary-base);
  background-color: var(--v-primary-lighten-5);
}

.payment-logo {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.payment-logos {
  display: flex;
  gap: 8px;
}

.v-text-field ::v-deep() .v-field__input {
  font-family: "Courier New", monospace;
}
</style>