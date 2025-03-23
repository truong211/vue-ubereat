<template>
  <div class="payment-processor">
    <v-stepper v-model="step" :items="steps">
      <template v-slot:item.1>
        <v-card class="mb-4">
          <v-card-title class="text-h5 font-weight-bold">Chi tiết hóa đơn</v-card-title>
          <v-card-text>
            <v-sheet class="invoice-container pa-4">
              <!-- Restaurant Info -->
              <div class="d-flex align-center mb-6">
                <v-avatar size="48" class="mr-3">
                  <v-img :src="order.restaurant?.logo || '/img/placeholder-restaurant.png'" alt="Restaurant"></v-img>
                </v-avatar>
                <div>
                  <div class="text-h6 font-weight-bold">{{ order.restaurant?.name }}</div>
                  <div class="text-caption">{{ order.restaurant?.address }}</div>
                </div>
              </div>
              
              <!-- Order Items -->
              <div class="invoice-items mb-6">
                <h3 class="text-subtitle-1 font-weight-bold mb-3">Các món đã đặt</h3>
                <div
                  v-for="(item, index) in order.items"
                  :key="index"
                  class="d-flex justify-space-between py-2"
                  :class="{'border-bottom': index < order.items.length - 1}"
                >
                  <div>
                    <div class="font-weight-medium">
                      {{ item.quantity }}x {{ item.name }}
                    </div>
                    <div v-if="item.options && Object.keys(item.options).length > 0" class="text-caption">
                      <template v-if="item.options.size">
                        Size: {{ item.options.size.name }}
                      </template>
                      
                      <template v-if="item.options.toppings && item.options.toppings.length">
                        <div class="ml-3">
                          <span class="font-weight-medium">Toppings:</span>
                          <ul class="mt-1 mb-0 pl-4">
                            <li v-for="topping in item.options.toppings" :key="topping.id">
                              {{ topping.quantity }}x {{ topping.name }} (+{{ formatCurrency(topping.price) }})
                            </li>
                          </ul>
                        </div>
                      </template>
                      
                      <template v-if="item.options.extras && item.options.extras.length">
                        <div class="ml-3">
                          <span class="font-weight-medium">Extras:</span>
                          <ul class="mt-1 mb-0 pl-4">
                            <li v-for="extra in item.options.extras" :key="extra.id">
                              {{ extra.name }} (+{{ formatCurrency(extra.price) }})
                            </li>
                          </ul>
                        </div>
                      </template>
                    </div>
                    <div v-if="item.notes" class="text-caption font-italic">
                      Ghi chú: {{ item.notes }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="font-weight-medium">{{ formatCurrency(item.total) }}</div>
                    <div class="text-caption">{{ formatCurrency(item.price) }} mỗi món</div>
                  </div>
                </div>
              </div>
              
              <!-- Price Summary -->
              <div class="invoice-summary mb-6">
                <h3 class="text-subtitle-1 font-weight-bold mb-3">Tổng cộng</h3>
                
                <div class="d-flex justify-space-between mb-2">
                  <span>Tạm tính</span>
                  <span>{{ formatCurrency(order.subtotal) }}</span>
                </div>
                
                <div v-if="order.discount > 0" class="d-flex justify-space-between mb-2 text-success">
                  <span>Giảm giá</span>
                  <span>-{{ formatCurrency(order.discount) }}</span>
                </div>
                
                <div class="d-flex justify-space-between mb-2">
                  <span>Phí vận chuyển</span>
                  <span>{{ formatCurrency(order.deliveryFee) }}</span>
                </div>
                
                <div class="d-flex justify-space-between mb-2">
                  <span>Thuế ({{ (order.taxRate * 100).toFixed() }}%)</span>
                  <span>{{ formatCurrency(order.tax) }}</span>
                </div>
                
                <v-divider class="my-3"></v-divider>
                
                <div class="d-flex justify-space-between font-weight-bold text-h6">
                  <span>Thành tiền</span>
                  <span>{{ formatCurrency(order.total) }}</span>
                </div>
              </div>
              
              <!-- Delivery Info -->
              <div class="invoice-delivery mb-6">
                <h3 class="text-subtitle-1 font-weight-bold mb-3">Thông tin giao hàng</h3>
                
                <div class="d-flex mb-2">
                  <v-icon size="small" class="mr-2">mdi-map-marker</v-icon>
                  <span>{{ order.deliveryAddress }}</span>
                </div>
                
                <div v-if="order.deliveryInstructions" class="d-flex mb-2">
                  <v-icon size="small" class="mr-2">mdi-information-outline</v-icon>
                  <span>{{ order.deliveryInstructions }}</span>
                </div>
                
                <div class="d-flex">
                  <v-icon size="small" class="mr-2">mdi-clock-outline</v-icon>
                  <span>Thời gian giao hàng dự kiến: {{ estimatedDeliveryTime }}</span>
                </div>
              </div>
            </v-sheet>
            
            <!-- Actions -->
            <div class="d-flex justify-end mt-4">
              <v-btn
                color="primary"
                @click="step++"
              >
                Tiếp tục thanh toán
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </template>
      
      <template v-slot:item.2>
        <v-card class="mb-4">
          <v-card-title class="text-h5 font-weight-bold">Chọn phương thức thanh toán</v-card-title>
          <v-card-text>
            <payment-selector
              :payment-methods="paymentMethods"
              :default-selected="selectedPaymentMethodId"
              @payment-method-change="handlePaymentMethodChange"
            />
            
            <!-- Special message for Cash on Delivery -->
            <v-alert
              v-if="selectedPaymentMethod && selectedPaymentMethod.type === 'cash'"
              type="info"
              variant="outlined"
              class="mt-4"
            >
              <div class="text-subtitle-1 font-weight-medium">Thanh toán tiền mặt khi nhận hàng</div>
              <p class="mb-0">Vui lòng chuẩn bị đúng số tiền khi nhận hàng. Đơn hàng của bạn sẽ được xác nhận ngay lập tức và bạn sẽ thanh toán khi nhận được hàng.</p>
            </v-alert>
            
            <!-- Actions -->
            <div class="d-flex justify-space-between mt-4">
              <v-btn
                variant="outlined"
                @click="step--"
              >
                Quay lại
              </v-btn>
              
              <v-btn
                color="primary"
                :disabled="!selectedPaymentMethod"
                @click="processPayment"
              >
                {{ selectedPaymentMethod && selectedPaymentMethod.type === 'cash' ? 'Xác nhận đặt hàng' : 'Thanh toán' }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </template>
      
      <template v-slot:item.3>
        <v-card class="mb-4">
          <v-card-text class="text-center py-8">
            <div v-if="paymentStatus === 'processing'">
              <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
              <h3 class="text-h5 font-weight-bold mb-2">Đang xử lý thanh toán</h3>
              <p class="mb-0">Vui lòng đợi trong khi chúng tôi xử lý giao dịch của bạn...</p>
            </div>
            
            <div v-else-if="paymentStatus === 'success'">
              <v-icon color="success" size="64" class="mb-4">mdi-check-circle</v-icon>
              <h3 class="text-h5 font-weight-bold mb-2">Thanh toán thành công!</h3>
              <p class="mb-4">Đơn hàng của bạn đã được xác nhận và đang được xử lý.</p>
              <div class="d-flex justify-center">
                <v-btn
                  color="primary"
                  :to="`/orders/${orderConfirmation.id}`"
                >
                  Xem chi tiết đơn hàng
                </v-btn>
              </div>
            </div>
            
            <div v-else-if="paymentStatus === 'redirect'">
              <v-icon color="info" size="64" class="mb-4">mdi-open-in-new</v-icon>
              <h3 class="text-h5 font-weight-bold mb-2">Chuyển đến cổng thanh toán</h3>
              <p class="mb-4">Bạn sẽ được chuyển đến cổng thanh toán an toàn để hoàn tất giao dịch.</p>
              <div class="d-flex justify-center">
                <v-btn
                  color="primary"
                  :href="paymentRedirectUrl"
                  target="_blank"
                >
                  Đi đến trang thanh toán
                </v-btn>
              </div>
            </div>
            
            <div v-else-if="paymentStatus === 'error'">
              <v-icon color="error" size="64" class="mb-4">mdi-alert-circle</v-icon>
              <h3 class="text-h5 font-weight-bold mb-2">Thanh toán thất bại</h3>
              <p class="mb-4">{{ paymentError || 'Đã xảy ra lỗi khi xử lý thanh toán. Vui lòng thử lại.' }}</p>
              <div class="d-flex justify-center gap-4">
                <v-btn
                  variant="outlined"
                  @click="step--"
                >
                  Thử lại
                </v-btn>
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="contactSupport"
                >
                  Liên hệ hỗ trợ
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </template>
    </v-stepper>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import PaymentSelector from './PaymentSelector.vue';

export default {
  name: 'PaymentProcessor',
  
  components: {
    PaymentSelector
  },
  
  props: {
    order: {
      type: Object,
      required: true
    }
  },
  
  data() {
    return {
      step: 1,
      steps: ['Xem hóa đơn', 'Chọn phương thức thanh toán', 'Hoàn tất thanh toán'],
      selectedPaymentMethodId: 'cash',
      paymentStatus: null,
      paymentRedirectUrl: null,
      paymentError: null,
      orderConfirmation: null
    };
  },
  
  computed: {
    ...mapState({
      paymentMethods: state => state.user.paymentMethods || []
    }),
    
    selectedPaymentMethod() {
      if (this.selectedPaymentMethodId === 'cash') {
        return {
          id: 'cash',
          type: 'cash',
          name: 'Tiền mặt khi nhận hàng'
        };
      }
      
      return this.paymentMethods.find(
        method => method.id === this.selectedPaymentMethodId
      ) || null;
    },
    
    estimatedDeliveryTime() {
      // Calculate estimated delivery time (30-45 minutes from now)
      const now = new Date();
      const minTime = new Date(now.getTime() + 30 * 60000);
      const maxTime = new Date(now.getTime() + 45 * 60000);
      
      const formatTime = (date) => {
        return date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit'
        });
      };
      
      return `${formatTime(minTime)} - ${formatTime(maxTime)}`;
    }
  },
  
  created() {
    this.loadPaymentMethods();
    
    // Try to find default payment method
    if (this.paymentMethods.length > 0) {
      const defaultMethod = this.paymentMethods.find(method => method.isDefault);
      if (defaultMethod) {
        this.selectedPaymentMethodId = defaultMethod.id;
      }
    }
  },
  
  methods: {
    ...mapActions({
      fetchPaymentMethods: 'user/fetchPaymentMethods',
      createOrder: 'order/createOrder',
      processOnlinePayment: 'payment/processPayment'
    }),
    
    async loadPaymentMethods() {
      try {
        await this.fetchPaymentMethods();
      } catch (error) {
        console.error('Failed to load payment methods:', error);
      }
    },
    
    handlePaymentMethodChange(method) {
      this.selectedPaymentMethodId = method.id;
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    },
    
    async processPayment() {
      if (!this.selectedPaymentMethod) return;
      
      this.step = 3;
      this.paymentStatus = 'processing';
      
      try {
        if (this.selectedPaymentMethod.type === 'cash') {
          // Process cash on delivery
          const orderResult = await this.createOrder({
            paymentMethod: 'cash',
            deliveryInstructions: this.order.deliveryInstructions || ''
          });
          
          this.orderConfirmation = orderResult;
          this.paymentStatus = 'success';
        } else if (this.selectedPaymentMethod.type === 'card') {
          // Process card payment
          const orderResult = await this.createOrder({
            paymentMethod: 'credit_card',
            paymentMethodId: this.selectedPaymentMethod.id,
            deliveryInstructions: this.order.deliveryInstructions || ''
          });
          
          this.orderConfirmation = orderResult;
          this.paymentStatus = 'success';
        } else if (this.selectedPaymentMethod.type === 'ewallet') {
          // Process e-wallet payment (redirect to payment gateway)
          const paymentResult = await this.processOnlinePayment({
            orderId: this.order.id,
            method: this.selectedPaymentMethod.provider
          });
          
          if (paymentResult.redirect_url) {
            this.paymentRedirectUrl = paymentResult.redirect_url;
            this.paymentStatus = 'redirect';
          } else {
            throw new Error('Không nhận được URL chuyển hướng từ cổng thanh toán');
          }
        }
      } catch (error) {
        console.error('Payment failed:', error);
        this.paymentStatus = 'error';
        this.paymentError = error.message || 'Đã xảy ra lỗi khi xử lý thanh toán';
      }
    },
    
    contactSupport() {
      // Implement contact support functionality
      window.open('/support', '_blank');
    }
  }
};
</script>

<style scoped>
.payment-processor {
  max-width: 800px;
  margin: 0 auto;
}

.invoice-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: #f9f9f9;
}

.border-bottom {
  border-bottom: 1px dashed #e0e0e0;
}

/* Gap utility class for older browsers */
.gap-4 {
  gap: 16px;
}
</style>