<template>
  <v-container class="payment-methods-page py-8">
    <h1 class="text-h4 font-weight-bold mb-6">Quản lý phương thức thanh toán</h1>
    
    <v-card class="mb-6">
      <v-tabs v-model="activeTab" bg-color="primary">
        <v-tab value="cards">Thẻ tín dụng & Thẻ ghi nợ</v-tab>
        <v-tab value="ewallets">Ví điện tử</v-tab>
        <v-tab value="other">Phương thức khác</v-tab>
      </v-tabs>
      
      <v-window v-model="activeTab">
        <!-- Credit/Debit Cards Tab -->
        <v-window-item value="cards">
          <v-card-text>
            <div v-if="isLoading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="mt-4">Đang tải...</p>
            </div>
            
            <div v-else>
              <!-- Card List -->
              <div v-if="cards.length > 0">
                <v-list>
                  <v-list-item
                    v-for="card in cards"
                    :key="card.id"
                    :title="card.cardName"
                    :subtitle="`${maskCardNumber(card.cardNumber)} | Hết hạn: ${card.expiryMonth}/${card.expiryYear}`"
                  >
                    <template v-slot:prepend>
                      <v-avatar rounded>
                        <v-img :src="getCardBrandIcon(card.brand)" alt="Card brand"></v-img>
                      </v-avatar>
                    </template>
                    
                    <template v-slot:append>
                      <v-chip
                        v-if="card.isDefault"
                        color="primary"
                        size="small"
                        class="mr-2"
                      >
                        Mặc định
                      </v-chip>
                      
                      <v-menu location="bottom end">
                        <template v-slot:activator="{ props }">
                          <v-btn
                            icon="mdi-dots-vertical"
                            v-bind="props"
                            variant="text"
                            size="small"
                          ></v-btn>
                        </template>
                        
                        <v-list density="compact" min-width="200">
                          <v-list-item
                            v-if="!card.isDefault"
                            @click="setAsDefault(card.id)"
                            prepend-icon="mdi-check-circle"
                          >
                            Đặt làm mặc định
                          </v-list-item>
                          
                          <v-list-item
                            @click="editPaymentMethod(card)"
                            prepend-icon="mdi-pencil"
                          >
                            Chỉnh sửa
                          </v-list-item>
                          
                          <v-list-item
                            @click="confirmDeletePaymentMethod(card)"
                            prepend-icon="mdi-delete"
                            color="error"
                          >
                            Xóa
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
              
              <div v-else class="text-center py-6">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-credit-card-outline</v-icon>
                <p class="text-body-1 mb-4">Bạn chưa lưu thẻ nào</p>
              </div>
              
              <div class="text-center mt-4">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-plus"
                  @click="showAddCardDialog = true"
                >
                  Thêm thẻ mới
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-window-item>
        
        <!-- E-Wallets Tab -->
        <v-window-item value="ewallets">
          <v-card-text>
            <div v-if="isLoading" class="text-center py-4">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="mt-4">Đang tải...</p>
            </div>
            
            <div v-else>
              <!-- E-Wallets List -->
              <div v-if="ewallets.length > 0">
                <v-list>
                  <v-list-item
                    v-for="wallet in ewallets"
                    :key="wallet.id"
                    :title="getWalletName(wallet.provider)"
                    :subtitle="wallet.email || wallet.phone"
                  >
                    <template v-slot:prepend>
                      <v-avatar>
                        <v-img :src="getWalletIcon(wallet.provider)" alt="E-wallet"></v-img>
                      </v-avatar>
                    </template>
                    
                    <template v-slot:append>
                      <v-chip
                        v-if="wallet.isDefault"
                        color="primary"
                        size="small"
                        class="mr-2"
                      >
                        Mặc định
                      </v-chip>
                      
                      <v-menu location="bottom end">
                        <template v-slot:activator="{ props }">
                          <v-btn
                            icon="mdi-dots-vertical"
                            v-bind="props"
                            variant="text"
                            size="small"
                          ></v-btn>
                        </template>
                        
                        <v-list density="compact" min-width="200">
                          <v-list-item
                            v-if="!wallet.isDefault"
                            @click="setAsDefault(wallet.id)"
                            prepend-icon="mdi-check-circle"
                          >
                            Đặt làm mặc định
                          </v-list-item>
                          
                          <v-list-item
                            @click="confirmDeletePaymentMethod(wallet)"
                            prepend-icon="mdi-delete"
                            color="error"
                          >
                            Xóa
                          </v-list-item>
                        </v-list>
                      </v-menu>
                    </template>
                  </v-list-item>
                </v-list>
              </div>
              
              <div v-else class="text-center py-6">
                <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-wallet-outline</v-icon>
                <p class="text-body-1 mb-4">Bạn chưa liên kết ví điện tử nào</p>
              </div>
              
              <div class="text-center mt-4">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-plus"
                  @click="showLinkWalletDialog = true"
                >
                  Liên kết ví điện tử
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-window-item>
        
        <!-- Other Payment Methods Tab -->
        <v-window-item value="other">
          <v-card-text>
            <v-list>
              <v-list-item title="Tiền mặt khi nhận hàng" subtitle="Thanh toán bằng tiền mặt khi nhận hàng">
                <template v-slot:prepend>
                  <v-avatar color="green-lighten-1" class="text-white">
                    <v-icon>mdi-cash</v-icon>
                  </v-avatar>
                </template>
                
                <template v-slot:append>
                  <v-chip color="success" size="small">Có sẵn</v-chip>
                </template>
              </v-list-item>
              
              <v-list-item title="Chuyển khoản ngân hàng" subtitle="Thanh toán qua chuyển khoản ngân hàng">
                <template v-slot:prepend>
                  <v-avatar color="blue-lighten-1" class="text-white">
                    <v-icon>mdi-bank</v-icon>
                  </v-avatar>
                </template>
                
                <template v-slot:append>
                  <v-chip color="success" size="small">Có sẵn</v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-window-item>
      </v-window>
    </v-card>
    
    <!-- Add Card Dialog -->
    <v-dialog v-model="showAddCardDialog" max-width="600">
      <v-card>
        <v-card-title>Thêm thẻ mới</v-card-title>
        
        <v-card-text>
          <v-form ref="cardForm" v-model="isCardFormValid" @submit.prevent="saveCard">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="cardForm.cardName"
                  label="Tên thẻ (tùy chọn)"
                  placeholder="VD: Thẻ cá nhân"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="cardForm.cardNumber"
                  label="Số thẻ"
                  placeholder="1234 5678 9012 3456"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Số thẻ là bắt buộc',
                    v => /^\d{4}\s\d{4}\s\d{4}\s\d{4}$|^\d{16}$/.test(v.replace(/\s/g, '')) || 'Số thẻ không hợp lệ'
                  ]"
                  @input="formatCardNumber"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="cardForm.cardholderName"
                  label="Tên chủ thẻ"
                  placeholder="NGUYEN VAN A"
                  variant="outlined"
                  :rules="[v => !!v || 'Tên chủ thẻ là bắt buộc']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="6" sm="2">
                <v-select
                  v-model="cardForm.expiryMonth"
                  label="Tháng"
                  :items="monthOptions"
                  variant="outlined"
                  :rules="[v => !!v || 'Bắt buộc']"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="6" sm="2">
                <v-select
                  v-model="cardForm.expiryYear"
                  label="Năm"
                  :items="yearOptions"
                  variant="outlined"
                  :rules="[v => !!v || 'Bắt buộc']"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="cardForm.cvv"
                  label="Mã bảo mật (CVV)"
                  placeholder="123"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Mã CVV là bắt buộc',
                    v => /^\d{3,4}$/.test(v) || 'Mã CVV không hợp lệ'
                  ]"
                  maxlength="4"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-select
                  v-model="cardForm.cardType"
                  label="Loại thẻ"
                  :items="[
                    { title: 'Thẻ tín dụng', value: 'credit' },
                    { title: 'Thẻ ghi nợ', value: 'debit' }
                  ]"
                  variant="outlined"
                  :rules="[v => !!v || 'Loại thẻ là bắt buộc']"
                  required
                ></v-select>
              </v-col>
              
              <v-col cols="12">
                <v-checkbox
                  v-model="cardForm.setAsDefault"
                  label="Đặt làm phương thức thanh toán mặc định"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showAddCardDialog = false">Hủy</v-btn>
          <v-btn
            color="primary"
            :loading="isSaving"
            :disabled="!isCardFormValid"
            @click="saveCard"
          >
            Lưu thẻ
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Link E-Wallet Dialog -->
    <v-dialog v-model="showLinkWalletDialog" max-width="500">
      <v-card>
        <v-card-title>Liên kết ví điện tử</v-card-title>
        
        <v-card-text>
          <v-form ref="walletForm" v-model="isWalletFormValid" @submit.prevent="linkWallet">
            <v-select
              v-model="walletForm.provider"
              label="Chọn nhà cung cấp ví"
              :items="walletProviders"
              item-title="name"
              item-value="value"
              variant="outlined"
              :rules="[v => !!v || 'Vui lòng chọn nhà cung cấp ví']"
              required
            >
              <template v-slot:item="{ item, props }">
                <v-list-item v-bind="props">
                  <template v-slot:prepend>
                    <v-avatar size="32">
                      <v-img :src="item.raw.icon" alt="Wallet provider icon"></v-img>
                    </v-avatar>
                  </template>
                  <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
            
            <div v-if="walletForm.provider" class="mt-4">
              <v-radio-group
                v-model="walletForm.contactType"
                inline
                class="mt-0"
              >
                <v-radio label="Email" value="email"></v-radio>
                <v-radio label="Số điện thoại" value="phone"></v-radio>
              </v-radio-group>
              
              <v-text-field
                v-if="walletForm.contactType === 'email'"
                v-model="walletForm.email"
                label="Email đã đăng ký với ví"
                variant="outlined"
                :rules="[
                  v => !!v || 'Email là bắt buộc',
                  v => /.+@.+\..+/.test(v) || 'Email không hợp lệ'
                ]"
                required
              ></v-text-field>
              
              <v-text-field
                v-else
                v-model="walletForm.phone"
                label="Số điện thoại đã đăng ký với ví"
                variant="outlined"
                :rules="[
                  v => !!v || 'Số điện thoại là bắt buộc',
                  v => /^\d{10}$/.test(v) || 'Số điện thoại không hợp lệ'
                ]"
                required
              ></v-text-field>
              
              <v-checkbox
                v-model="walletForm.setAsDefault"
                label="Đặt làm phương thức thanh toán mặc định"
                class="mt-2"
              ></v-checkbox>
            </div>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showLinkWalletDialog = false">Hủy</v-btn>
          <v-btn
            color="primary"
            :loading="isSaving"
            :disabled="!isWalletFormValid"
            @click="linkWallet"
          >
            Liên kết
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Xóa phương thức thanh toán?</v-card-title>
        <v-card-text>
          Bạn có chắc chắn muốn xóa phương thức thanh toán này không? Hành động này không thể hoàn tác.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDeleteDialog = false">Hủy</v-btn>
          <v-btn
            color="error"
            :loading="isDeleting"
            @click="deletePaymentMethod"
          >
            Xóa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { mapState, mapActions } from 'vuex';

export default {
  name: 'PaymentMethodsView',
  
  data() {
    return {
      activeTab: 'cards',
      isLoading: false,
      isSaving: false,
      isDeleting: false,
      
      // Card form
      showAddCardDialog: false,
      isCardFormValid: false,
      cardForm: {
        id: null,
        cardName: '',
        cardNumber: '',
        cardholderName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardType: 'credit',
        setAsDefault: false
      },
      
      // E-wallet form
      showLinkWalletDialog: false,
      isWalletFormValid: false,
      walletForm: {
        provider: null,
        contactType: 'email',
        email: '',
        phone: '',
        setAsDefault: false
      },
      
      // Delete dialog
      showDeleteDialog: false,
      itemToDelete: null,
      
      // Wallet providers
      walletProviders: [
        { 
          name: 'MoMo', 
          value: 'momo',
          icon: '/img/payment/momo.png'
        },
        { 
          name: 'ZaloPay', 
          value: 'zalopay',
          icon: '/img/payment/zalopay.png'
        },
        { 
          name: 'VNPay', 
          value: 'vnpay',
          icon: '/img/payment/vnpay.png'
        },
        { 
          name: 'PayPal', 
          value: 'paypal',
          icon: '/img/payment/paypal.png'
        }
      ]
    };
  },
  
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    
    cards() {
      return this.user?.paymentMethods?.filter(
        method => method.type === 'card'
      ) || [];
    },
    
    ewallets() {
      return this.user?.paymentMethods?.filter(
        method => method.type === 'ewallet'
      ) || [];
    },
    
    monthOptions() {
      return Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return {
          title: month < 10 ? `0${month}` : `${month}`,
          value: month < 10 ? `0${month}` : `${month}`
        };
      });
    },
    
    yearOptions() {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 20 }, (_, i) => {
        const year = currentYear + i;
        return {
          title: `${year}`,
          value: `${year.toString().substr(2)}`
        };
      });
    }
  },
  
  created() {
    this.loadPaymentMethods();
  },
  
  methods: {
    ...mapActions({
      fetchPaymentMethods: 'user/fetchPaymentMethods',
      addPaymentMethod: 'user/addPaymentMethod',
      updatePaymentMethod: 'user/updatePaymentMethod',
      removePaymentMethod: 'user/removePaymentMethod',
      setDefaultPaymentMethod: 'user/setDefaultPaymentMethod'
    }),
    
    async loadPaymentMethods() {
      try {
        this.isLoading = true;
        await this.fetchPaymentMethods();
      } catch (error) {
        console.error('Failed to load payment methods:', error);
        this.$toast.error('Không thể tải phương thức thanh toán. Vui lòng thử lại.');
      } finally {
        this.isLoading = false;
      }
    },
    
    maskCardNumber(number) {
      if (!number) return '';
      const last4 = number.slice(-4);
      return `•••• •••• •••• ${last4}`;
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
    },
    
    formatCardNumber(value) {
      if (!value) return '';
      
      const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
      const matches = v.match(/\d{4,16}/g);
      const match = matches && matches[0] || '';
      const parts = [];
      
      for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
      }
      
      if (parts.length) {
        this.cardForm.cardNumber = parts.join(' ');
      } else {
        this.cardForm.cardNumber = value;
      }
    },
    
    detectCardBrand(cardNumber) {
      const number = cardNumber.replace(/\s+/g, '');
      
      if (/^4/.test(number)) return 'visa';
      if (/^5[1-5]/.test(number)) return 'mastercard';
      if (/^3[47]/.test(number)) return 'amex';
      if (/^(62|88)/.test(number)) return 'unionpay';
      if (/^35/.test(number)) return 'jcb';
      
      return 'unknown';
    },
    
    setAsDefault(id) {
      this.setDefaultPaymentMethod(id)
        .then(() => {
          this.$toast.success('Đã cập nhật phương thức thanh toán mặc định');
        })
        .catch(error => {
          console.error('Failed to set default payment method:', error);
          this.$toast.error('Không thể cập nhật phương thức thanh toán mặc định');
        });
    },
    
    editPaymentMethod(method) {
      this.cardForm = {
        id: method.id,
        cardName: method.cardName || '',
        cardNumber: method.cardNumber,
        cardholderName: method.cardholderName,
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        cvv: '',
        cardType: method.cardType,
        setAsDefault: method.isDefault
      };
      
      this.showAddCardDialog = true;
    },
    
    confirmDeletePaymentMethod(method) {
      this.itemToDelete = method;
      this.showDeleteDialog = true;
    },
    
    async deletePaymentMethod() {
      if (!this.itemToDelete) return;
      
      try {
        this.isDeleting = true;
        await this.removePaymentMethod(this.itemToDelete.id);
        this.$toast.success('Đã xóa phương thức thanh toán');
        this.showDeleteDialog = false;
        this.itemToDelete = null;
      } catch (error) {
        console.error('Failed to delete payment method:', error);
        this.$toast.error('Không thể xóa phương thức thanh toán');
      } finally {
        this.isDeleting = false;
      }
    },
    
    async saveCard() {
      if (!this.$refs.cardForm.validate()) return;
      
      try {
        this.isSaving = true;
        
        const cardData = {
          ...this.cardForm,
          brand: this.detectCardBrand(this.cardForm.cardNumber),
          type: 'card'
        };
        
        if (this.cardForm.id) {
          // Update existing card
          await this.updatePaymentMethod(cardData);
          this.$toast.success('Đã cập nhật thông tin thẻ');
        } else {
          // Add new card
          await this.addPaymentMethod(cardData);
          this.$toast.success('Đã thêm thẻ mới');
        }
        
        this.showAddCardDialog = false;
        this.resetCardForm();
      } catch (error) {
        console.error('Failed to save card:', error);
        this.$toast.error('Không thể lưu thông tin thẻ. Vui lòng thử lại.');
      } finally {
        this.isSaving = false;
      }
    },
    
    async linkWallet() {
      if (!this.$refs.walletForm.validate()) return;
      
      try {
        this.isSaving = true;
        
        const walletData = {
          provider: this.walletForm.provider,
          type: 'ewallet',
          [this.walletForm.contactType]: 
            this.walletForm.contactType === 'email' 
              ? this.walletForm.email 
              : this.walletForm.phone,
          isDefault: this.walletForm.setAsDefault
        };
        
        await this.addPaymentMethod(walletData);
        this.$toast.success('Đã liên kết ví điện tử');
        
        this.showLinkWalletDialog = false;
        this.resetWalletForm();
      } catch (error) {
        console.error('Failed to link wallet:', error);
        this.$toast.error('Không thể liên kết ví điện tử. Vui lòng thử lại.');
      } finally {
        this.isSaving = false;
      }
    },
    
    resetCardForm() {
      this.cardForm = {
        id: null,
        cardName: '',
        cardNumber: '',
        cardholderName: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        cardType: 'credit',
        setAsDefault: false
      };
    },
    
    resetWalletForm() {
      this.walletForm = {
        provider: null,
        contactType: 'email',
        email: '',
        phone: '',
        setAsDefault: false
      };
    }
  }
};
</script>

<style scoped>
.payment-methods-page {
  max-width: 900px;
  margin: 0 auto;
}
</style>