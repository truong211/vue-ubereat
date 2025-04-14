<template>
  <v-container class="checkout-page py-8">
    <h1 class="text-h4 font-weight-bold mb-6">Thanh toán</h1>

    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Đang tải...</p>
    </div>

    <div v-else-if="!cart || !cart.items || cart.items.length === 0" class="text-center py-12">
      <v-icon size="100" color="grey">mdi-cart-outline</v-icon>
      <h2 class="text-h5 mt-6 mb-2">Giỏ hàng trống</h2>
      <p class="text-body-1 mb-8">Bạn chưa có món ăn nào trong giỏ hàng</p>
      <v-btn
        color="primary"
        size="large"
        to="/"
        prepend-icon="mdi-food"
      >
        Khám phá nhà hàng
      </v-btn>
    </div>

    <div v-else>
      <v-row>
        <!-- Left Column: Shipping Information -->
        <v-col cols="12" md="6">
          <v-card class="mb-6">
            <v-card-title class="text-h5 font-weight-bold">
              Thông tin giao hàng
            </v-card-title>

            <v-card-text>
              <v-form ref="deliveryForm" v-model="isDeliveryFormValid">
                <h3 class="text-subtitle-1 font-weight-bold mb-2">Địa chỉ giao hàng</h3>

                <!-- Saved addresses selection -->
                <div v-if="addresses.length > 0" class="mb-4">
                  <v-select
                    v-model="selectedAddressId"
                    label="Chọn địa chỉ lưu trữ"
                    :items="addresses"
                    item-title="addressLine"
                    item-value="id"
                    return-object
                    variant="outlined"
                    @update:model-value="handleAddressSelection"
                  >
                    <template v-slot:selection="{ item }">
                      <div>
                        <div class="font-weight-medium">{{ item.title }}</div>
                        <div class="text-caption">{{ item.addressLine }}</div>
                      </div>
                    </template>

                    <template v-slot:item="{ item, props }">
                      <v-list-item v-bind="props">
                        <template v-slot:prepend>
                          <v-icon>{{ getAddressIcon(item.raw.type) }}</v-icon>
                        </template>

                        <v-list-item-title>{{ item.raw.title }}</v-list-item-title>
                        <v-list-item-subtitle>{{ item.raw.addressLine }}</v-list-item-subtitle>
                      </v-list-item>
                    </template>
                  </v-select>
                </div>

                <!-- Manual address entry -->
                <div v-if="!selectedAddressId || showManualAddress">
                  <v-btn
                    v-if="addresses.length > 0 && selectedAddressId"
                    variant="text"
                    prepend-icon="mdi-pencil"
                    size="small"
                    class="mb-4"
                    @click="editSelectedAddress"
                  >
                    Chỉnh sửa địa chỉ
                  </v-btn>

                  <v-text-field
                    v-model="deliveryForm.addressLine1"
                    label="Địa chỉ"
                    placeholder="Số nhà, tên đường"
                    variant="outlined"
                    :rules="[v => !!v || 'Địa chỉ là bắt buộc']"
                    class="mb-3"
                    required
                  ></v-text-field>

                  <v-text-field
                    v-model="deliveryForm.addressLine2"
                    label="Địa chỉ (tùy chọn)"
                    placeholder="Căn hộ, dãy phòng, tầng, v.v"
                    variant="outlined"
                    class="mb-3"
                  ></v-text-field>

                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="deliveryForm.city"
                        label="Thành phố"
                        variant="outlined"
                        :rules="[v => !!v || 'Thành phố là bắt buộc']"
                        required
                      ></v-text-field>
                    </v-col>

                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="deliveryForm.district"
                        label="Quận/Huyện"
                        variant="outlined"
                        :rules="[v => !!v || 'Quận/Huyện là bắt buộc']"
                        required
                      ></v-text-field>
                    </v-col>
                  </v-row>

                  <v-checkbox
                    v-model="saveAddress"
                    label="Lưu địa chỉ này cho lần sau"
                    class="mt-2"
                  ></v-checkbox>

                  <v-text-field
                    v-if="saveAddress"
                    v-model="deliveryForm.addressLabel"
                    label="Đặt tên cho địa chỉ này"
                    placeholder="Ví dụ: Nhà, Công ty"
                    variant="outlined"
                    :rules="[v => !!v || 'Tên địa chỉ là bắt buộc']"
                    class="mb-3"
                  ></v-text-field>
                </div>

                <v-divider class="my-6"></v-divider>

                <h3 class="text-subtitle-1 font-weight-bold mb-2">Thông tin liên hệ</h3>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="deliveryForm.name"
                      label="Họ tên"
                      variant="outlined"
                      :rules="[v => !!v || 'Họ tên là bắt buộc']"
                      required
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="deliveryForm.phone"
                      label="Số điện thoại"
                      variant="outlined"
                      :rules="[
                        v => !!v || 'Số điện thoại là bắt buộc',
                        v => /^\d{10}$/.test(v) || 'Số điện thoại không hợp lệ'
                      ]"
                      required
                    ></v-text-field>
                  </v-col>
                </v-row>

                <v-textarea
                  v-model="deliveryForm.instructions"
                  label="Hướng dẫn giao hàng (tùy chọn)"
                  placeholder="Ví dụ: Để ở cổng, gọi khi đến nơi, v.v."
                  variant="outlined"
                  auto-grow
                  rows="2"
                  class="mb-2"
                ></v-textarea>
              </v-form>
            </v-card-text>
          </v-card>

          <!-- Delivery Time -->
          <v-card class="mb-6">
            <v-card-title class="text-h6 font-weight-bold">
              Thời gian giao hàng
            </v-card-title>

            <v-card-text>
              <v-radio-group
                v-model="deliveryTimeOption"
                @change="handleDeliveryTimeChange"
              >
                <v-radio value="asap">
                  <template v-slot:label>
                    <div>
                      <div class="font-weight-medium">Giao ngay khi có thể</div>
                      <div class="text-caption">Thời gian giao hàng dự kiến: ~30-45 phút</div>
                    </div>
                  </template>
                </v-radio>

                <v-radio value="scheduled">
                  <template v-slot:label>
                    <div>
                      <div class="font-weight-medium">Đặt trước</div>
                      <div class="text-caption">Chọn thời gian giao hàng cụ thể</div>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>

              <v-expand-transition>
                <div v-if="deliveryTimeOption === 'scheduled'" class="pt-3">
                  <v-row>
                    <v-col cols="12" sm="6">
                      <v-menu
                        v-model="showDatePicker"
                        :close-on-content-click="false"
                      >
                        <template v-slot:activator="{ props }">
                          <v-text-field
                            v-model="formattedScheduledDate"
                            label="Ngày giao hàng"
                            readonly
                            variant="outlined"
                            prepend-inner-icon="mdi-calendar"
                            v-bind="props"
                          ></v-text-field>
                        </template>

                        <v-date-picker
                          v-model="scheduledDate"
                          @update:model-value="showDatePicker = false"
                        ></v-date-picker>
                      </v-menu>
                    </v-col>

                    <v-col cols="12" sm="6">
                      <v-select
                        v-model="scheduledTime"
                        label="Thời gian giao hàng"
                        :items="availableTimeSlots"
                        variant="outlined"
                        prepend-inner-icon="mdi-clock-outline"
                      ></v-select>
                    </v-col>
                  </v-row>
                </div>
              </v-expand-transition>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right Column: Order Summary & Payment -->
        <v-col cols="12" md="6">
          <!-- Order Summary -->
          <v-card class="mb-6">
            <v-card-title class="text-h5 font-weight-bold d-flex justify-space-between align-center">
              <span>Tóm tắt đơn hàng</span>
              <v-btn
                variant="text"
                size="small"
                color="primary"
                prepend-icon="mdi-pencil"
                to="/cart"
              >
                Chỉnh sửa
              </v-btn>
            </v-card-title>

            <v-card-text>
              <div class="d-flex align-center mb-4">
                <v-avatar size="40" class="mr-3">
                  <v-img :src="cart.restaurant?.logo || '/img/placeholder-restaurant.png'" alt="Restaurant"></v-img>
                </v-avatar>
                <div>
                  <div class="text-subtitle-1 font-weight-bold">{{ cart.restaurant?.name }}</div>
                  <div class="text-caption">{{ cart.items.length }} món</div>
                </div>
              </div>

              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item
                  v-for="item in cart.items"
                  :key="item.id"
                  class="px-0"
                >
                  <template v-slot:prepend>
                    <div class="text-body-1 font-weight-medium mr-2">{{ item.quantity }}x</div>
                  </template>

                  <v-list-item-title>{{ item.product.name }}</v-list-item-title>

                  <template v-slot:append>
                    <div class="text-body-1 font-weight-medium">{{ formatCurrency(item.itemTotal) }}</div>
                  </template>

                  <!-- Item options -->
                  <template v-if="hasOptions(item)">
                    <v-list-item-subtitle class="text-caption mt-1">
                      {{ getOptionsText(item) }}
                    </v-list-item-subtitle>
                  </template>
                </v-list-item>
              </v-list>

              <v-divider class="my-4"></v-divider>

              <!-- Price Summary -->
              <div class="px-0">
                <div class="d-flex justify-space-between mb-2">
                  <span class="text-caption">Tạm tính</span>
                  <span class="text-caption">{{ formatCurrency(cart.subtotal) }}</span>
                </div>

                <div v-if="cart.discountAmount > 0" class="d-flex justify-space-between mb-2 text-success">
                  <span class="text-caption">Giảm giá</span>
                  <span class="text-caption">-{{ formatCurrency(cart.discountAmount) }}</span>
                </div>

                <div class="d-flex justify-space-between mb-2">
                  <span class="text-caption">Phí vận chuyển</span>
                  <span class="text-caption">{{ formatCurrency(cart.deliveryFee) }}</span>
                </div>

                <div class="d-flex justify-space-between mb-2">
                  <span class="text-caption">Thuế</span>
                  <span class="text-caption">{{ formatCurrency(cart.taxAmount) }}</span>
                </div>

                <v-divider class="my-2"></v-divider>

                <div class="d-flex justify-space-between font-weight-bold">
                  <span>Tổng cộng</span>
                  <span>{{ formatCurrency(cart.total) }}</span>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Payment Methods -->
          <v-card class="mb-6">
            <v-card-title class="text-h5 font-weight-bold">
              Phương thức thanh toán
            </v-card-title>

            <v-card-text>
              <payment-selector
                :payment-methods="paymentMethods"
                :default-selected="selectedPaymentMethodId"
                @payment-method-change="handlePaymentMethodChange"
              />
            </v-card-text>
          </v-card>

          <!-- Complete Order -->
          <v-card class="mb-6" elevation="0" color="grey-lighten-4">
            <v-card-text class="text-center">
              <p class="text-body-2 mb-4">
                Bằng cách nhấp vào "Đặt hàng", bạn đồng ý với <a href="/terms" class="text-decoration-none">Điều khoản dịch vụ</a> và <a href="/privacy" class="text-decoration-none">Chính sách bảo mật</a> của chúng tôi.
              </p>

              <v-btn
                color="primary"
                size="large"
                block
                :loading="isProcessing"
                :disabled="!isFormValid || isProcessing"
                @click="placeOrder"
              >
                {{ selectedPaymentMethod && selectedPaymentMethod.type === 'cash' ? 'Đặt hàng' : 'Thanh toán' }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Payment Processing Dialog -->
    <v-dialog
      v-model="showPaymentDialog"
      fullscreen
      :scrim="false"
      transition="dialog-bottom-transition"
      persistent
    >
      <v-card>
        <v-toolbar color="primary" density="compact">
          <v-btn
            icon="mdi-close"
            @click="cancelPayment"
            v-if="paymentStatus !== 'processing'"
          ></v-btn>
          <v-toolbar-title>Thanh toán</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>

        <v-card-text class="pa-6">
          <payment-processor
            :order="orderData"
            @payment-completed="handlePaymentCompleted"
            @payment-error="handlePaymentError"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { formatISO, addMinutes, format, parse, parseISO } from 'date-fns';
import { defineComponent } from 'vue';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { useOrderStore } from '@/stores/order';
import { usePaymentStore } from '@/stores/payment';
import { useNotificationStore } from '@/stores/notification';
import PaymentSelector from '@/components/payment/PaymentSelector.vue';
import PaymentProcessor from '@/components/payment/PaymentProcessor.vue';
// Removed useCheckout and useToast composables

export default defineComponent({ // Use defineComponent
  name: 'CheckoutView',

  components: {
    PaymentSelector,
    PaymentProcessor
  },

  setup() {
    const cartStore = useCartStore();
    const authStore = useAuthStore();
    const userStore = useUserStore();
    const orderStore = useOrderStore();
    const paymentStore = usePaymentStore();
    const notificationStore = useNotificationStore();

    // Helper for navigation, replacing goToOrderTracking composable
    const navigateToOrder = (orderId) => {
        // Assuming Vue Router is available via this.$router in Options API methods
        // If not, import useRouter here and return it
        // import { useRouter } from 'vue-router';
        // const router = useRouter();
        // router.push({ name: 'OrderDetails', params: { id: orderId } });
    };


    return {
      cartStore,
      authStore,
      userStore,
      orderStore,
      paymentStore,
      notificationStore,
      navigateToOrder // Expose navigation helper if needed directly in setup/template
    };
  },

  data() {
    return {
      isLoading: true,
      isProcessing: false,
      paymentStatus: null,

      // Form data
      isDeliveryFormValid: false,
      selectedAddressId: null,
      showManualAddress: false,
      saveAddress: false,
      deliveryForm: {
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        district: '',
        instructions: '',
        addressLabel: ''
      },

      // Delivery time
      deliveryTimeOption: 'asap',
      showDatePicker: false,
      scheduledDate: formatISO(new Date(), { representation: 'date' }),
      scheduledTime: null,

      // Payment
      selectedPaymentMethodId: 'cash',
      showPaymentDialog: false,

      // Order data for payment processor
      orderData: null
    };
  },

  computed: {
    // Access state from Pinia stores
    cart() {
      return this.cartStore.cart;
    },
    user() {
      return this.authStore.user;
    },
    addresses() {
      return this.userStore.addresses || [];
    },
    paymentMethods() {
      return this.userStore.paymentMethods || [];
    },

    isFormValid() {
      return this.isDeliveryFormValid &&
        (this.deliveryTimeOption !== 'scheduled' ||
        (this.scheduledDate && this.scheduledTime));
    },

    formattedScheduledDate() {
      if (!this.scheduledDate) return '';

      try {
        const date = parseISO(this.scheduledDate);
        return format(date, 'dd/MM/yyyy');
      } catch (error) {
        return '';
      }
    },

    availableTimeSlots() {
      // Generate time slots from current time rounded to next 30 min until end of day
      // For future dates, generate from 8:00 AM to 9:30 PM
      const currentDate = new Date();
      const selectedDate = parseISO(this.scheduledDate);

      const isToday = currentDate.toDateString() === selectedDate.toDateString();

      let startHour = isToday ? currentDate.getHours() : 8;
      let startMinute = isToday ? Math.ceil(currentDate.getMinutes() / 30) * 30 : 0;

      if (isToday && startMinute === 60) {
        startHour += 1;
        startMinute = 0;
      }

      const slots = [];
      const endHour = 21;
      const endMinute = 30;

      for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute = hour === startHour ? startMinute : 0; minute < 60; minute += 30) {
          if (hour === endHour && minute > endMinute) continue;

          const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(timeString);
        }
      }

      return slots;
    },

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
    }
  },

  watch: {
    user(newValue) {
      if (newValue && !this.deliveryForm.name) {
        this.deliveryForm.name = newValue.name || '';
        this.deliveryForm.phone = newValue.phone || '';
      }
    },

    scheduledDate() {
      // Reset time when date changes
      this.scheduledTime = this.availableTimeSlots[0] || null;
    }
  },

  created() {
    this.loadData();
  },

  methods: {
    // Removed mapActions block. Methods will call store actions directly.

    async loadData() {
      try {
        this.isLoading = true;

        // Load all required data
        await Promise.all([
          // Call actions on Pinia stores
          this.cartStore.fetchCart(),
          this.authStore.fetchCurrentUser(), // Assuming action name
          this.userStore.fetchAddresses(),
          this.userStore.fetchPaymentMethods()
        ]);

        // Set initial values from user data
        if (this.user) {
          this.deliveryForm.name = this.user.name || '';
          this.deliveryForm.phone = this.user.phone || '';
        }

        // Set default address if available
        if (this.addresses.length > 0) {
          const defaultAddress = this.addresses.find(addr => addr.isDefault) || this.addresses[0];
          this.selectedAddressId = defaultAddress;
          this.handleAddressSelection(defaultAddress);
        }

        // Set default payment method if available
        if (this.paymentMethods.length > 0) {
          const defaultMethod = this.paymentMethods.find(method => method.isDefault);
          if (defaultMethod) {
            this.selectedPaymentMethodId = defaultMethod.id;
          }
        }
      } catch (error) {
        console.error('Failed to load checkout data:', error);
        this.notificationStore.showToast({ message: 'Không thể tải dữ liệu thanh toán. Vui lòng thử lại.', type: 'error' });
      } finally {
        this.isLoading = false;
      }
    },

    getAddressIcon(type) {
      const icons = {
        home: 'mdi-home',
        work: 'mdi-briefcase',
        other: 'mdi-map-marker'
      };

      return icons[type] || 'mdi-map-marker';
    },

    handleAddressSelection(address) {
      if (!address) {
        this.showManualAddress = true;
        return;
      }

      // Fill in form with selected address
      this.deliveryForm.addressLine1 = address.addressLine || '';
      this.deliveryForm.addressLine2 = address.addressDetail || '';
      this.deliveryForm.city = address.city || '';
      this.deliveryForm.district = address.district || '';

      this.showManualAddress = false;
    },

    editSelectedAddress() {
      this.showManualAddress = true;
    },

    handleDeliveryTimeChange() {
      if (this.deliveryTimeOption === 'scheduled' && !this.scheduledTime) {
        this.scheduledTime = this.availableTimeSlots[0] || null;
      }
    },

    handlePaymentMethodChange(method) {
      this.selectedPaymentMethodId = method.id;
    },

    hasOptions(item) {
      return item.options && Object.keys(item.options).length > 0;
    },

    getOptionsText(item) {
      if (!item.options) return '';

      const options = [];

      if (item.options.size) {
        options.push(`Size: ${item.options.size.name}`);
      }

      if (item.options.toppings && item.options.toppings.length) {
        const toppingsText = item.options.toppings
          .map(topping => `${topping.quantity}× ${topping.name}`)
          .join(', ');

        options.push(`Toppings: ${toppingsText}`);
      }

      if (item.options.extras && item.options.extras.length) {
        const extrasText = item.options.extras
          .map(extra => extra.name)
          .join(', ');

        options.push(`Extras: ${extrasText}`);
      }

      return options.join(' • ');
    },

    formatCurrency(amount) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(amount);
    },

    async saveAddress() {
      if (!this.saveAddress) return null;

      try {
        const addressData = {
          title: this.deliveryForm.addressLabel,
          type: 'home',
          addressLine: this.deliveryForm.addressLine1,
          addressDetail: this.deliveryForm.addressLine2 || '',
          district: this.deliveryForm.district,
          city: this.deliveryForm.city,
          isDefault: this.addresses.length === 0 // Set as default if it's the first address
        };

        // Call action on userStore
        const result = await this.userStore.saveAddress(addressData);
        return result;
      } catch (error) {
        console.error('Failed to save address:', error);
        this.notificationStore.showToast({ message: 'Không thể lưu địa chỉ. Vui lòng thử lại sau.', type: 'error' });
        return null;
      }
    },

    async placeOrder() {
      if (!this.$refs.deliveryForm.validate()) return;

      this.isProcessing = true;

      try {
        // Save address if requested
        if (this.saveAddress) {
          await this.saveAddress();
        }

        // Combine address fields
        const fullAddress = [
          this.deliveryForm.addressLine1,
          this.deliveryForm.addressLine2,
          this.deliveryForm.district,
          this.deliveryForm.city
        ].filter(Boolean).join(', ');

        // Prepare scheduled delivery time if selected
        let scheduledDeliveryTime = null;
        if (this.deliveryTimeOption === 'scheduled' && this.scheduledDate && this.scheduledTime) {
          const dateStr = this.scheduledDate;
          const timeStr = this.scheduledTime;

          const date = parseISO(dateStr);
          const [hours, minutes] = timeStr.split(':').map(Number);

          date.setHours(hours, minutes);
          scheduledDeliveryTime = date.toISOString();
        }

        // Prepare order data
        this.orderData = {
          ...this.cart,
          deliveryAddress: fullAddress,
          deliveryContact: {
            name: this.deliveryForm.name,
            phone: this.deliveryForm.phone
          },
          deliveryInstructions: this.deliveryForm.instructions,
          scheduledDeliveryTime,
          paymentMethod: this.selectedPaymentMethod,
          taxRate: this.cart.taxRate || 0.1 // Default to 10% if not provided
        };

        if (this.selectedPaymentMethod.type === 'cash') {
          // For cash payments, directly create the order
          try {
            const orderData = {
              paymentMethod: 'cash',
              deliveryAddress: fullAddress,
              contactName: this.deliveryForm.name,
              contactPhone: this.deliveryForm.phone,
              deliveryInstructions: this.deliveryForm.instructions,
              scheduledDeliveryTime
            };

            // Call action on orderStore (assuming it handles checkout for cash)
            const result = await this.orderStore.createOrder(orderData); // Assuming createOrder handles cash

            // Navigate to order tracking using router directly
            this.$router.push({ name: 'OrderDetails', params: { id: result.orderId } });
          } catch (checkoutError) {
            this.notificationStore.showToast({ message: checkoutError.message || 'Không thể đặt hàng. Vui lòng thử lại sau.', type: 'error' });
          }
        } else {
          // For other payment methods, show payment dialog
          this.showPaymentDialog = true;
        }
      } catch (error) {
        console.error('Failed to place order:', error);
        this.notificationStore.showToast({ message: 'Không thể đặt hàng. Vui lòng thử lại sau.', type: 'error' });
      } finally {
        this.isProcessing = false;
      }
    },

    handlePaymentCompleted(order) {
      this.showPaymentDialog = false;
      // Navigate using router directly
      this.$router.push({ name: 'OrderDetails', params: { id: order.id } });
    },

    handlePaymentError(error) {
      console.error('Payment error:', error);
      this.notificationStore.showToast({ message: 'Thanh toán thất bại. Vui lòng thử lại sau.', type: 'error' });
      this.showPaymentDialog = false;
    },

    cancelPayment() {
      this.showPaymentDialog = false;
    }
  }
}); // Close defineComponent
</script>

<style scoped>
.checkout-page {
  max-width: 1200px;
  margin: 0 auto;
}

.dialog-bottom-transition-enter-active,
.dialog-bottom-transition-leave-active {
  transition: transform 0.3s ease;
}

.dialog-bottom-transition-enter-from,
.dialog-bottom-transition-leave-to {
  transform: translateY(100%);
}
</style>
