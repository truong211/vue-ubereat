<template>
  <v-container class="checkout-page py-8">
    <h1 class="text-h4 font-weight-bold mb-6">Checkout</h1>

    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <div class="mt-4 text-body-1">Loading checkout...</div>
    </div>

    <div v-else-if="!hasItems" class="empty-cart-container text-center py-12">
      <v-icon size="100" color="grey">mdi-cart-outline</v-icon>
      <h2 class="text-h5 mt-6 mb-2">Your cart is empty</h2>
      <p class="text-body-1 mb-8">Add items from restaurants to checkout</p>
      <v-btn
        color="primary"
        size="large"
        to="/restaurants"
        prepend-icon="mdi-food"
      >
        Browse Restaurants
      </v-btn>
    </div>

    <v-row v-else>
      <!-- Checkout form (left) -->
      <v-col cols="12" md="8">
        <v-stepper v-model="currentStep" class="mb-6">
          <v-stepper-header>
            <v-stepper-item value="1" title="Delivery Details"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item value="2" title="Payment"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item value="3" title="Confirmation"></v-stepper-item>
          </v-stepper-header>

          <v-stepper-window>
            <!-- Step 1: Delivery Details -->
            <v-stepper-window-item value="1">
              <v-card class="pa-4">
                <v-card-title>Delivery Address</v-card-title>
                <v-card-text>
                  <!-- Delivery address selection -->
                  <v-form ref="addressForm" v-model="isAddressFormValid">
                    <v-radio-group
                      v-model="selectedAddressId"
                      v-if="savedAddresses.length > 0"
                      :rules="[v => !!v || 'Please select a delivery address']"
                    >
                      <v-radio
                        v-for="address in savedAddresses"
                        :key="address.id"
                        :value="address.id"
                      >
                        <template v-slot:label>
                          <div>
                            <div class="font-weight-bold">{{ address.name }}</div>
                            <div>{{ address.address }}</div>
                            <div>{{ address.city }}, {{ address.state }} {{ address.zipcode }}</div>
                          </div>
                        </template>
                      </v-radio>
                    </v-radio-group>

                    <div v-else class="mb-4">
                      <v-alert type="info" class="mb-4">
                        You don't have any saved addresses. Please add a delivery address below.
                      </v-alert>
                    </div>

                    <v-btn 
                      v-if="savedAddresses.length > 0 && !showAddressForm"
                      color="primary" 
                      variant="text" 
                      @click="showAddressForm = true"
                      prepend-icon="mdi-plus"
                      class="mb-4"
                    >
                      Add New Address
                    </v-btn>

                    <!-- New address form -->
                    <div v-if="showAddressForm || savedAddresses.length === 0">
                      <v-divider class="my-4" v-if="savedAddresses.length > 0"></v-divider>
                      
                      <div class="text-h6 mb-3">Add New Address</div>
                      
                      <v-text-field
                        v-model="newAddress.name"
                        label="Address Name (e.g. Home, Work)"
                        required
                        :rules="[v => !!v || 'Address name is required']"
                      ></v-text-field>

                      <v-text-field
                        v-model="newAddress.address"
                        label="Street Address"
                        required
                        :rules="[v => !!v || 'Street address is required']"
                      ></v-text-field>

                      <v-row>
                        <v-col cols="12" sm="6">
                          <v-text-field
                            v-model="newAddress.city"
                            label="City"
                            required
                            :rules="[v => !!v || 'City is required']"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="6" sm="3">
                          <v-text-field
                            v-model="newAddress.state"
                            label="State"
                            required
                            :rules="[v => !!v || 'State is required']"
                          ></v-text-field>
                        </v-col>
                        <v-col cols="6" sm="3">
                          <v-text-field
                            v-model="newAddress.zipcode"
                            label="ZIP Code"
                            required
                            :rules="[v => !!v || 'ZIP code is required']"
                          ></v-text-field>
                        </v-col>
                      </v-row>

                      <v-checkbox
                        v-model="newAddress.default"
                        label="Make this my default address"
                      ></v-checkbox>

                      <div class="d-flex">
                        <v-spacer></v-spacer>
                        <v-btn 
                          v-if="savedAddresses.length > 0" 
                          variant="text" 
                          @click="cancelAddressForm"
                          class="mr-2"
                        >
                          Cancel
                        </v-btn>
                        <v-btn 
                          color="primary" 
                          @click="saveAddress"
                          :disabled="!isNewAddressValid"
                        >
                          Save Address
                        </v-btn>
                      </div>
                    </div>
                  </v-form>

                  <v-divider class="my-4"></v-divider>

                  <!-- Delivery instructions -->
                  <div class="text-h6 mb-2">Delivery Instructions</div>
                  <v-textarea
                    v-model="deliveryInstructions"
                    label="Special instructions for delivery"
                    placeholder="E.g., Ring doorbell, leave at the door, call upon arrival, etc."
                    rows="2"
                    auto-grow
                  ></v-textarea>

                  <v-divider class="my-4"></v-divider>

                  <!-- Delivery options -->
                  <div class="text-h6 mb-2">Delivery Options</div>
                  
                  <v-radio-group
                    v-model="deliveryOption"
                    hide-details
                  >
                    <v-radio value="standard">
                      <template v-slot:label>
                        <div>
                          <div class="font-weight-bold">Standard Delivery</div>
                          <div class="text-body-2">Delivery in 30-45 minutes</div>
                        </div>
                      </template>
                    </v-radio>
                    <v-radio value="priority">
                      <template v-slot:label>
                        <div>
                          <div class="font-weight-bold">Priority Delivery (+$2.99)</div>
                          <div class="text-body-2">Delivery in 20-30 minutes</div>
                        </div>
                      </template>
                    </v-radio>
                    <v-radio value="scheduled">
                      <template v-slot:label>
                        <div>
                          <div class="font-weight-bold">Scheduled Delivery</div>
                          <div class="text-body-2">Choose a time for your delivery</div>
                        </div>
                      </template>
                    </v-radio>
                  </v-radio-group>

                  <v-menu
                    v-if="deliveryOption === 'scheduled'"
                    min-width="auto"
                    location="bottom"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        v-model="scheduledTime"
                        label="Select Time"
                        prepend-icon="mdi-clock"
                        readonly
                        class="mt-2"
                      ></v-text-field>
                    </template>
                    <v-time-picker
                      v-model="scheduledTime"
                      format="24hr"
                      :min="currentTime"
                      :max="maxTime"
                    ></v-time-picker>
                  </v-menu>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn 
                    color="primary" 
                    @click="proceedToPayment"
                    size="large"
                    :disabled="!canProceedToPayment"
                  >
                    Continue to Payment
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-stepper-window-item>

            <!-- Step 2: Payment -->
            <v-stepper-window-item value="2">
              <payment-form
                :order-data="{
                  id: orderId,
                  amount: total,
                  items: cartItems
                }"
                @payment-success="handlePaymentSuccess"
                @payment-error="handlePaymentError"
              />
            </v-stepper-window-item>

            <!-- Step 3: Confirmation -->
            <v-stepper-window-item value="3">
              <v-card class="text-center pa-6">
                <v-icon
                  color="success"
                  size="64"
                  class="mb-4"
                >
                  mdi-check-circle
                </v-icon>
                <h2 class="text-h5 mb-2">Order Placed Successfully!</h2>
                <p class="text-body-1 mb-6">
                  Your order has been confirmed and is being processed.
                  You will receive updates about your order status.
                </p>
                <v-btn
                  color="primary"
                  size="large"
                  :to="{ name: 'OrderTracking', params: { id: orderId } }"
                >
                  Track Order
                </v-btn>
              </v-card>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-col>

      <!-- Order summary (right) -->
      <v-col cols="12" md="4">
        <v-card class="mb-6">
          <v-card-title>Order Summary</v-card-title>
          <v-card-text>
            <div class="text-subtitle-1 font-weight-bold mb-2">{{ cartRestaurant }}</div>
            
            <v-list density="compact">
              <v-list-item
                v-for="(item, index) in cartItems"
                :key="index"
                :title="item.name"
                :subtitle="`Quantity: ${item.quantity}`"
              >
                <template v-slot:append>
                  <div class="text-body-1">${{ (item.price * item.quantity).toFixed(2) }}</div>
                </template>
              </v-list-item>
            </v-list>
            
            <v-divider class="my-4"></v-divider>
            
            <div class="d-flex justify-space-between mb-2">
              <span>Subtotal</span>
              <span>${{ subtotal.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between mb-2">
              <span>Delivery Fee</span>
              <span>${{ deliveryFee.toFixed(2) }}</span>
            </div>
            
            <div v-if="deliveryOption === 'priority'" class="d-flex justify-space-between mb-2">
              <span>Priority Delivery</span>
              <span>$2.99</span>
            </div>
            
            <div class="d-flex justify-space-between mb-2">
              <span>Tax</span>
              <span>${{ tax.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between mb-2">
              <span>Tip</span>
              <div class="d-flex align-center">
                <span>${{ tipAmount.toFixed(2) }}</span>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  @click="showTipDialog = true"
                >
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
              </div>
            </div>
            
            <v-divider class="my-2"></v-divider>
            
            <div class="d-flex justify-space-between text-h6 font-weight-bold mt-2">
              <span>Total</span>
              <span>${{ orderTotal.toFixed(2) }}</span>
            </div>
            
            <v-expand-transition>
              <div v-if="isUserEnrolledInLoyalty" class="mt-4">
                <v-alert
                  color="primary"
                  variant="tonal"
                  icon="mdi-star"
                  class="mb-0"
                >
                  You'll earn {{ loyaltyPointsEarned }} reward points with this order!
                </v-alert>
              </div>
            </v-expand-transition>
          </v-card-text>
        </v-card>
        
        <!-- Promo code card -->
        <v-card class="mb-6">
          <v-card-text>
            <div class="d-flex">
              <v-text-field
                v-model="promoCode"
                label="Promo Code"
                placeholder="Enter code"
                variant="outlined"
                density="compact"
                hide-details
                class="mr-2"
              ></v-text-field>
              <v-btn
                color="primary"
                @click="applyPromoCode"
                :disabled="!promoCode"
                :loading="isApplyingPromoCode"
              >
                Apply
              </v-btn>
            </div>
            
            <v-expand-transition>
              <v-alert
                v-if="promoCodeMessage"
                :type="promoCodeSuccess ? 'success' : 'error'"
                class="mt-3 mb-0"
                density="compact"
              >
                {{ promoCodeMessage }}
              </v-alert>
            </v-expand-transition>
          </v-card-text>
        </v-card>
        
        <!-- Use rewards card -->
        <v-card v-if="availableRewards.length > 0">
          <v-card-title>Use Rewards</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedReward"
              :items="availableRewards"
              label="Select a reward to apply"
              item-title="title"
              item-value="id"
              return-object
              variant="outlined"
              density="compact"
            >
              <template v-slot:selection="{ item }">
                {{ item.title }} ({{ item.pointCost }} points)
              </template>
              <template v-slot:item="{ item }">
                <v-list-item
                  :title="item.title"
                  :subtitle="`${item.pointCost} points - ${item.description}`"
                  :prepend-icon="item.icon"
                ></v-list-item>
              </template>
            </v-select>
            
            <v-btn
              v-if="selectedReward"
              color="primary"
              block
              class="mt-3"
              @click="applyReward"
            >
              Apply Reward
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Tip dialog -->
    <v-dialog v-model="showTipDialog" max-width="500px">
      <v-card>
        <v-card-title>Add a Tip</v-card-title>
        <v-card-text>
          <p class="mb-4">Thank your driver with a tip</p>
          
          <v-radio-group v-model="tipPercentage">
            <v-row>
              <v-col cols="3">
                <v-radio value="15">
                  <template v-slot:label>
                    <div class="text-center">
                      <div class="text-h6">15%</div>
                      <div>${{ calculateTipAmount(15).toFixed(2) }}</div>
                    </div>
                  </template>
                </v-radio>
              </v-col>
              <v-col cols="3">
                <v-radio value="18">
                  <template v-slot:label>
                    <div class="text-center">
                      <div class="text-h6">18%</div>
                      <div>${{ calculateTipAmount(18).toFixed(2) }}</div>
                    </div>
                  </template>
                </v-radio>
              </v-col>
              <v-col cols="3">
                <v-radio value="20">
                  <template v-slot:label>
                    <div class="text-center">
                      <div class="text-h6">20%</div>
                      <div>${{ calculateTipAmount(20).toFixed(2) }}</div>
                    </div>
                  </template>
                </v-radio>
              </v-col>
              <v-col cols="3">
                <v-radio value="custom">
                  <template v-slot:label>
                    <div class="text-center">
                      <div class="text-h6">Custom</div>
                    </div>
                  </template>
                </v-radio>
              </v-col>
            </v-row>
          </v-radio-group>
          
          <v-text-field
            v-if="tipPercentage === 'custom'"
            v-model="customTipAmount"
            label="Custom tip amount"
            prefix="$"
            type="number"
            step="0.01"
            min="0"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showTipDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="updateTip">Update Tip</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import PaymentProcessor from '@/components/checkout/PaymentProcessor.vue';

export default {
  name: 'Checkout',
  
  components: {
    PaymentProcessor
  },
  
  setup() {
    const store = useStore();
    const router = useRouter();
    
    // Page state
    const loading = ref(false);
    const currentStep = ref('1');
    const cartItems = ref([]);
    const cartRestaurant = ref('');
    const confirmedOrderId = ref('');
    
    // Address state
    const savedAddresses = ref([]);
    const selectedAddressId = ref(null);
    const showAddressForm = ref(false);
    const newAddress = ref({
      name: '',
      address: '',
      city: '',
      state: '',
      zipcode: '',
      default: false
    });
    const isAddressFormValid = ref(false);
    
    // Delivery state
    const deliveryInstructions = ref('');
    const deliveryOption = ref('standard');
    const scheduledTime = ref('');
    
    // Payment state
    const paymentStatus = ref(null);
    
    // Promo code state
    const promoCode = ref('');
    const promoCodeDiscount = ref(0);
    const promoCodeMessage = ref('');
    const promoCodeSuccess = ref(false);
    const isApplyingPromoCode = ref(false);
    
    // Tip state
    const tipPercentage = ref('18');
    const customTipAmount = ref('');
    const showTipDialog = ref(false);
    
    // Rewards state
    const availableRewards = ref([]);
    const selectedReward = ref(null);
    const appliedRewardDiscount = ref(0);
    const isUserEnrolledInLoyalty = ref(false);
    
    // Get current time for scheduled delivery
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = ref(`${hours}:${minutes}`);
    const maxTime = ref('22:00');
    
    // Computed properties
    const hasItems = computed(() => cartItems.value.length > 0);
    
    const subtotal = computed(() => {
      return cartItems.value.reduce((total, item) => total + (item.price * item.quantity), 0);
    });
    
    const deliveryFee = computed(() => {
      // Base delivery fee
      return 3.99;
    });
    
    const priorityFee = computed(() => {
      return deliveryOption.value === 'priority' ? 2.99 : 0;
    });
    
    const tax = computed(() => {
      return subtotal.value * 0.08; // 8% tax
    });
    
    const tipAmount = computed(() => {
      if (tipPercentage.value === 'custom') {
        return parseFloat(customTipAmount.value) || 0;
      }
      return calculateTipAmount(parseInt(tipPercentage.value));
    });
    
    const orderTotal = computed(() => {
      return (
        subtotal.value + 
        deliveryFee.value + 
        priorityFee.value + 
        tax.value + 
        tipAmount.value - 
        promoCodeDiscount.value -
        appliedRewardDiscount.value
      );
    });
    
    const isNewAddressValid = computed(() => {
      return (
        newAddress.value.name &&
        newAddress.value.address &&
        newAddress.value.city &&
        newAddress.value.state &&
        newAddress.value.zipcode
      );
    });
    
    const canProceedToPayment = computed(() => {
      return selectedAddressId.value || isNewAddressValid.value;
    });
    
    const estimatedDeliveryTime = computed(() => {
      if (deliveryOption.value === 'scheduled') {
        return scheduledTime.value;
      }
      
      const now = new Date();
      const deliveryMinutes = deliveryOption.value === 'priority' ? 30 : 45;
      now.setMinutes(now.getMinutes() + deliveryMinutes);
      
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });
    
    const loyaltyPointsEarned = computed(() => {
      return Math.floor(subtotal.value);
    });
    
    // Methods
    const loadCheckoutData = async () => {
      loading.value = true;
      
      try {
        // Load cart items
        const cart = store.getters['cart'];
        cartItems.value = cart.items || [];
        cartRestaurant.value = cart.restaurant?.name || 'Restaurant';
        
        // Load saved addresses
        const addresses = await store.dispatch('user/loadAddresses');
        savedAddresses.value = addresses || [];
        
        // Set default address if available
        const defaultAddress = savedAddresses.value.find(addr => addr.default);
        if (defaultAddress) {
          selectedAddressId.value = defaultAddress.id;
        } else if (savedAddresses.value.length > 0) {
          selectedAddressId.value = savedAddresses.value[0].id;
        }
        
        // Check if user is enrolled in loyalty program
        const loyaltyStatus = await store.dispatch('user/getLoyaltyStatus');
        isUserEnrolledInLoyalty.value = loyaltyStatus?.isEnrolled || false;
        
        // Load available rewards
        if (isUserEnrolledInLoyalty.value) {
          availableRewards.value = await store.dispatch('user/getAvailableRewards') || [];
        }
        
        // Set default scheduled time if needed
        if (!scheduledTime.value) {
          const defaultTime = new Date();
          defaultTime.setHours(defaultTime.getHours() + 1);
          defaultTime.setMinutes(0);
          
          const hours = defaultTime.getHours().toString().padStart(2, '0');
          const minutes = defaultTime.getMinutes().toString().padStart(2, '0');
          scheduledTime.value = `${hours}:${minutes}`;
        }
      } catch (error) {
        console.error('Error loading checkout data:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const saveAddress = () => {
      if (!isNewAddressValid.value) return;
      
      // Generate a random ID for demo purposes
      const newId = Math.floor(Math.random() * 10000);
      
      const addressToSave = {
        ...newAddress.value,
        id: newId
      };
      
      // In a real app, you would call an API to save the address
      // For demo, just add it to the local array
      savedAddresses.value.push(addressToSave);
      
      // Set as selected address
      selectedAddressId.value = newId;
      
      // Reset form
      newAddress.value = {
        name: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        default: false
      };
      showAddressForm.value = false;
    };
    
    const cancelAddressForm = () => {
      newAddress.value = {
        name: '',
        address: '',
        city: '',
        state: '',
        zipcode: '',
        default: false
      };
      showAddressForm.value = false;
    };
    
    const calculateTipAmount = (percentage) => {
      return (subtotal.value * (percentage / 100));
    };
    
    const updateTip = () => {
      showTipDialog.value = false;
    };
    
    const proceedToPayment = () => {
      // In a real app, validate and save the delivery details
      currentStep.value = '2';
    };
    
    const generateOrderId = () => {
      return 'ORD' + Math.floor(100000 + Math.random() * 900000);
    };
    
    const handlePaymentSuccess = (paymentResult) => {
      paymentStatus.value = 'success';
      confirmedOrderId.value = generateOrderId();
      
      // In a real app, create the order in the backend
    };
    
    const handlePaymentError = (error) => {
      paymentStatus.value = 'error';
      console.error('Payment error:', error);
    };
    
    const handleDialogClosed = () => {
      if (paymentStatus.value === 'success') {
        currentStep.value = '3';
        
        // Clear cart after successful order
        // store.dispatch('clearCart');
      }
    };
    
    const applyPromoCode = async () => {
      if (!promoCode.value) return;
      
      isApplyingPromoCode.value = true;
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if valid promo code (for demo)
        if (promoCode.value.toUpperCase() === 'WELCOME10') {
          promoCodeDiscount.value = subtotal.value * 0.1; // 10% off
          promoCodeMessage.value = 'Promo code applied: 10% off';
          promoCodeSuccess.value = true;
        } else if (promoCode.value.toUpperCase() === 'FREESHIP') {
          promoCodeDiscount.value = deliveryFee.value;
          promoCodeMessage.value = 'Promo code applied: Free shipping';
          promoCodeSuccess.value = true;
        } else {
          promoCodeDiscount.value = 0;
          promoCodeMessage.value = 'Invalid promo code';
          promoCodeSuccess.value = false;
        }
      } catch (error) {
        console.error('Error applying promo code:', error);
        promoCodeMessage.value = 'Error applying code';
        promoCodeSuccess.value = false;
      } finally {
        isApplyingPromoCode.value = false;
      }
    };
    
    const applyReward = () => {
      if (!selectedReward.value) return;
      
      // Apply the reward discount
      if (selectedReward.value.title === '$5 Discount') {
        appliedRewardDiscount.value = 5;
      } else if (selectedReward.value.title === '$10 Discount') {
        appliedRewardDiscount.value = 10;
      } else if (selectedReward.value.title === 'Free Delivery') {
        appliedRewardDiscount.value = deliveryFee.value;
      }
      
      // Show confirmation
      store.dispatch('ui/showSnackbar', {
        text: `Reward "${selectedReward.value.title}" applied to your order!`,
        color: 'success'
      });
    };
    
    // Load data on mount
    onMounted(() => {
      loadCheckoutData();
    });
    
    return {
      loading,
      currentStep,
      cartItems,
      cartRestaurant,
      hasItems,
      savedAddresses,
      selectedAddressId,
      showAddressForm,
      newAddress,
      isAddressFormValid,
      isNewAddressValid,
      deliveryInstructions,
      deliveryOption,
      scheduledTime,
      currentTime,
      maxTime,
      subtotal,
      deliveryFee,
      tax,
      tipAmount,
      tipPercentage,
      customTipAmount,
      orderTotal,
      showTipDialog,
      promoCode,
      promoCodeMessage,
      promoCodeSuccess,
      isApplyingPromoCode,
      confirmedOrderId,
      canProceedToPayment,
      estimatedDeliveryTime,
      availableRewards,
      selectedReward,
      isUserEnrolledInLoyalty,
      loyaltyPointsEarned,
      saveAddress,
      cancelAddressForm,
      calculateTipAmount,
      updateTip,
      proceedToPayment,
      generateOrderId,
      handlePaymentSuccess,
      handlePaymentError,
      handleDialogClosed,
      applyPromoCode,
      applyReward
    };
  }
};
</script>

<style scoped>
.checkout-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>
