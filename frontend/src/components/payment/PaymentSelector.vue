<template>
  <div class="payment-selector">
    <h3 class="text-h6 font-weight-bold mb-4">{{ title }}</h3>
    
    <v-radio-group
      v-model="selectedMethodId"
      @change="handlePaymentMethodChange"
    >
      <!-- Cash on Delivery -->
      <v-card
        variant="outlined"
        :class="['payment-method-card mb-3', {'selected-payment': selectedMethodId === 'cash'}]"
      >
        <v-radio
          value="cash"
          hide-details
          class="payment-radio"
        >
          <template v-slot:label>
            <div class="d-flex align-center payment-method-content">
              <v-avatar color="green-lighten-1" class="mr-3 text-white">
                <v-icon>mdi-cash</v-icon>
              </v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-medium">Tiền mặt khi nhận hàng</div>
                <div class="text-caption text-medium-emphasis">Thanh toán khi nhận hàng</div>
              </div>
            </div>
          </template>
        </v-radio>
      </v-card>
      
      <!-- Cards -->
      <template v-if="cards.length > 0">
        <v-card
          v-for="card in cards"
          :key="card.id"
          variant="outlined"
          :class="['payment-method-card mb-3', {'selected-payment': selectedMethodId === card.id}]"
        >
          <v-radio
            :value="card.id"
            hide-details
            class="payment-radio"
          >
            <template v-slot:label>
              <div class="d-flex align-center payment-method-content">
                <v-avatar rounded class="mr-3">
                  <v-img :src="getCardBrandIcon(card.brand)" alt="Card brand"></v-img>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ card.cardName || `${card.cardType === 'credit' ? 'Thẻ tín dụng' : 'Thẻ ghi nợ'}` }}
                    <v-chip
                      v-if="card.isDefault"
                      color="primary"
                      size="x-small"
                      class="ml-2"
                    >
                      Mặc định
                    </v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ maskCardNumber(card.cardNumber) }} | Hết hạn: {{ card.expiryMonth }}/{{ card.expiryYear }}
                  </div>
                </div>
              </div>
            </template>
          </v-radio>
        </v-card>
      </template>
      
      <!-- E-wallets -->
      <template v-if="ewallets.length > 0">
        <v-card
          v-for="wallet in ewallets"
          :key="wallet.id"
          variant="outlined"
          :class="['payment-method-card mb-3', {'selected-payment': selectedMethodId === wallet.id}]"
        >
          <v-radio
            :value="wallet.id"
            hide-details
            class="payment-radio"
          >
            <template v-slot:label>
              <div class="d-flex align-center payment-method-content">
                <v-avatar class="mr-3">
                  <v-img :src="getWalletIcon(wallet.provider)" alt="E-wallet"></v-img>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-medium">
                    {{ getWalletName(wallet.provider) }}
                    <v-chip
                      v-if="wallet.isDefault"
                      color="primary"
                      size="x-small"
                      class="ml-2"
                    >
                      Mặc định
                    </v-chip>
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ wallet.email || wallet.phone }}
                  </div>
                </div>
              </div>
            </template>
          </v-radio>
        </v-card>
      </template>
    </v-radio-group>
    
    <div class="d-flex justify-space-between align-center mt-4">
      <v-btn
        color="primary"
        variant="text"
        :to="managementLink"
        prepend-icon="mdi-plus"
      >
        Thêm phương thức thanh toán
      </v-btn>
      
      <v-btn
        v-if="showConfirmButton"
        color="primary"
        :disabled="!selectedMethodId"
        @click="confirmSelection"
      >
        {{ confirmButtonText }}
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PaymentSelector',
  
  props: {
    paymentMethods: {
      type: Array,
      default: () => []
    },
    defaultSelected: {
      type: String,
      default: 'cash'
    },
    title: {
      type: String,
      default: 'Phương thức thanh toán'
    },
    showConfirmButton: {
      type: Boolean,
      default: false
    },
    confirmButtonText: {
      type: String,
      default: 'Xác nhận'
    },
    managementLink: {
      type: String,
      default: '/profile/payment-methods'
    }
  },
  
  emits: [
    'update:selected',
    'payment-method-change',
    'confirm'
  ],
  
  data() {
    return {
      selectedMethodId: this.defaultSelected
    };
  },
  
  computed: {
    cards() {
      return this.paymentMethods.filter(method => method.type === 'card');
    },
    
    ewallets() {
      return this.paymentMethods.filter(method => method.type === 'ewallet');
    },
    
    selectedPaymentMethod() {
      if (this.selectedMethodId === 'cash') {
        return {
          id: 'cash',
          type: 'cash',
          name: 'Tiền mặt khi nhận hàng'
        };
      }
      
      return this.paymentMethods.find(method => method.id === this.selectedMethodId) || null;
    }
  },
  
  watch: {
    defaultSelected(newValue) {
      this.selectedMethodId = newValue;
    }
  },
  
  methods: {
    handlePaymentMethodChange() {
      this.$emit('update:selected', this.selectedMethodId);
      this.$emit('payment-method-change', this.selectedPaymentMethod);
    },
    
    confirmSelection() {
      this.$emit('confirm', this.selectedPaymentMethod);
    },
    
    maskCardNumber(number) {
      if (!number) return '';
      const last4 = number.slice(-4);
      return `•••• ${last4}`;
    },
    
    getCardBrandIcon(brand) {
      const brandIcons = {
        visa: '/img/payment/visa.png',
        mastercard: '/img/payment/mastercard.png',
        amex: '/img/payment/amex.png',
        jcb: '/img/payment/jcb.png',
        default: '/img/payment/card-generic.png'
      };
      
      return brandIcons[brand?.toLowerCase()] || brandIcons.default;
    },
    
    getWalletName(provider) {
      const walletNames = {
        momo: 'MoMo',
        zalopay: 'ZaloPay',
        vnpay: 'VNPay',
        paypal: 'PayPal'
      };
      
      return walletNames[provider] || provider;
    },
    
    getWalletIcon(provider) {
      const walletIcons = {
        momo: '/img/payment/momo.png',
        zalopay: '/img/payment/zalopay.png',
        vnpay: '/img/payment/vnpay.png',
        paypal: '/img/payment/paypal.png',
        default: '/img/payment/wallet-generic.png'
      };
      
      return walletIcons[provider] || walletIcons.default;
    }
  }
};
</script>

<style scoped>
.payment-method-card {
  position: relative;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
  overflow: hidden;
}

.payment-method-card:hover {
  border-color: var(--v-primary-base);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.payment-method-card.selected-payment {
  border-color: var(--v-primary-base);
  background-color: rgba(var(--v-primary-base), 0.05);
}

.payment-radio {
  padding: 16px;
  width: 100%;
}

.payment-method-content {
  width: 100%;
  padding-left: 8px;
}
</style>