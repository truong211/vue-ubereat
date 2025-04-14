<template>
  <v-container class="checkout-page py-8">
    <h1 class="text-h4 mb-6">Checkout</h1>
    
    <!-- Empty Cart or Redirect -->
    <v-card v-if="!cartStore.hasItems" class="mb-6 pa-6 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-cart-outline</v-icon>
      <h2 class="text-h5 mb-4">Your cart is empty</h2>
      <p class="text-body-1 mb-6">Please add items to your cart before proceeding to checkout.</p>
      <v-btn 
        size="large" 
        color="primary" 
        :to="{ name: 'restaurants' }" 
        class="mb-2 hover-scale"
      >
        Browse Restaurants
      </v-btn>
    </v-card>

    <!-- Checkout Process -->
    <v-row v-else>
      <!-- Checkout Form -->
      <v-col cols="12" md="8">
        <v-stepper v-model="currentStep" :items="steps">
          <!-- Delivery Options Step -->
          <template v-slot:step.1>
            <v-card class="mb-6">
              <v-card-title>Delivery Options</v-card-title>
              <v-card-text>
                <v-radio-group v-model="deliveryMethod" color="primary">
                  <v-radio value="delivery" label="Delivery"></v-radio>
                  <v-radio value="pickup" label="Pickup"></v-radio>
                </v-radio-group>

                <v-expand-transition>
                  <div v-if="deliveryMethod === 'delivery'">
                    <v-text-field
                      v-model="deliveryAddress.street"
                      label="Street Address"
                      placeholder="Enter your street address"
                      variant="outlined"
                      :error-messages="errors.street"
                      class="mb-2"
                    ></v-text-field>
                    
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="deliveryAddress.city"
                          label="City"
                          variant="outlined"
                          :error-messages="errors.city"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="deliveryAddress.zipCode"
                          label="ZIP Code"
                          variant="outlined"
                          :error-messages="errors.zipCode"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    
                    <v-text-field
                      v-model="deliveryAddress.additionalInfo"
                      label="Additional Information (optional)"
                      placeholder="Apartment number, building, landmark, etc."
                      variant="outlined"
                    ></v-text-field>
                    
                    <v-textarea
                      v-model="deliveryInstructions"
                      label="Delivery Instructions (optional)"
                      placeholder="Any special instructions for delivery"
                      variant="outlined"
                      auto-grow
                      rows="2"
                    ></v-textarea>
                  </div>
                </v-expand-transition>
                
                <v-expand-transition>
                  <div v-if="deliveryMethod === 'pickup'">
                    <p class="mb-4">Please select the restaurant location for pickup:</p>
                    
                    <v-select
                      v-model="selectedPickupLocation"
                      :items="pickupLocations"
                      item-title="address"
                      item-value="id"
                      label="Pickup Location"
                      variant="outlined"
                      :error-messages="errors.pickupLocation"
                      class="mb-4"
                    ></v-select>
                    
                    <v-alert color="info" variant="tonal" class="mb-4">
                      <div class="d-flex align-center">
                        <v-icon class="mr-3">mdi-information-outline</v-icon>
                        <div>
                          <div class="font-weight-medium">Pickup Information</div>
                          <div class="text-caption">
                            Once your order is ready, you'll receive a notification.
                            Please bring a valid ID for verification.
                          </div>
                        </div>
                      </div>
                    </v-alert>
                  </div>
                </v-expand-transition>
              </v-card-text>
              <v-card-actions class="justify-end">
                <v-btn color="primary" variant="flat" @click="validateDeliveryOptions">
                  Continue
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>

          <!-- Contact Information Step -->
          <template v-slot:step.2>
            <v-card class="mb-6">
              <v-card-title>Contact Information</v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="contactInfo.firstName"
                      label="First Name"
                      variant="outlined"
                      :error-messages="errors.firstName"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="contactInfo.lastName"
                      label="Last Name"
                      variant="outlined"
                      :error-messages="errors.lastName"
                    ></v-text-field>
                  </v-col>
                </v-row>
                
                <v-text-field
                  v-model="contactInfo.phone"
                  label="Phone Number"
                  variant="outlined"
                  :error-messages="errors.phone"
                  class="mb-2"
                ></v-text-field>
                
                <v-text-field
                  v-model="contactInfo.email"
                  label="Email"
                  variant="outlined"
                  :error-messages="errors.email"
                  class="mb-4"
                ></v-text-field>
                
                <v-checkbox
                  v-model="contactInfo.receiveUpdates"
                  label="Send me order status updates via text message"
                  color="primary"
                ></v-checkbox>
              </v-card-text>
              <v-card-actions class="justify-space-between">
                <v-btn color="primary" variant="outlined" @click="currentStep = 1">
                  Back
                </v-btn>
                <v-btn color="primary" variant="flat" @click="validateContactInfo">
                  Continue
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>

          <!-- Payment Information Step -->
          <template v-slot:step.3>
            <v-card class="mb-6">
              <v-card-title>Payment Method</v-card-title>
              <v-card-text>
                <v-radio-group v-model="paymentMethod" color="primary" class="mb-4">
                  <v-radio value="creditCard" label="Credit / Debit Card"></v-radio>
                  <v-radio value="paypal" label="PayPal"></v-radio>
                  <v-radio value="cash" label="Cash on Delivery"></v-radio>
                </v-radio-group>
                
                <v-expand-transition>
                  <div v-if="paymentMethod === 'creditCard'">
                    <v-text-field
                      v-model="paymentInfo.cardNumber"
                      label="Card Number"
                      placeholder="XXXX XXXX XXXX XXXX"
                      variant="outlined"
                      :error-messages="errors.cardNumber"
                      class="mb-2"
                    ></v-text-field>
                    
                    <v-row>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="paymentInfo.expiryDate"
                          label="Expiry Date (MM/YY)"
                          placeholder="MM/YY"
                          variant="outlined"
                          :error-messages="errors.expiryDate"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-text-field
                          v-model="paymentInfo.cvv"
                          label="CVV"
                          placeholder="XXX"
                          variant="outlined"
                          type="password"
                          :error-messages="errors.cvv"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                    
                    <v-text-field
                      v-model="paymentInfo.nameOnCard"
                      label="Name on Card"
                      variant="outlined"
                      :error-messages="errors.nameOnCard"
                      class="mb-2"
                    ></v-text-field>
                  </div>
                </v-expand-transition>
                
                <v-expand-transition>
                  <v-alert v-if="paymentMethod === 'paypal'" color="info" variant="tonal" class="mb-4">
                    <div class="d-flex align-center">
                      <v-icon class="mr-3">mdi-information-outline</v-icon>
                      <div>
                        <div class="font-weight-medium">PayPal Information</div>
                        <div class="text-caption">
                          You will be redirected to PayPal to complete your payment after reviewing your order.
                        </div>
                      </div>
                    </div>
                  </v-alert>
                </v-expand-transition>
                
                <v-expand-transition>
                  <v-alert v-if="paymentMethod === 'cash'" color="info" variant="tonal" class="mb-4">
                    <div class="d-flex align-center">
                      <v-icon class="mr-3">mdi-information-outline</v-icon>
                      <div>
                        <div class="font-weight-medium">Cash Payment</div>
                        <div class="text-caption">
                          Please have the exact amount ready at the time of delivery. Our delivery partners may not carry change.
                        </div>
                      </div>
                    </div>
                  </v-alert>
                </v-expand-transition>
                
                <v-divider class="my-4"></v-divider>
                
                <v-checkbox
                  v-model="savePaymentInfo"
                  label="Save payment information for future orders"
                  color="primary"
                  :disabled="paymentMethod === 'cash'"
                ></v-checkbox>
              </v-card-text>
              <v-card-actions class="justify-space-between">
                <v-btn color="primary" variant="outlined" @click="currentStep = 2">
                  Back
                </v-btn>
                <v-btn color="primary" variant="flat" @click="validatePaymentInfo">
                  Review Order
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>

          <!-- Order Review Step -->
          <template v-slot:step.4>
            <v-card class="mb-6">
              <v-card-title>Order Review</v-card-title>
              <v-card-text>
                <!-- Order Summary Section -->
                <h3 class="text-h6 mb-3">Order Items</h3>
                
                <v-list class="mb-4">
                  <v-list-item
                    v-for="(group, index) in cartStore.restaurantGroups"
                    :key="index"
                    :title="group.restaurantName"
                    :subtitle="`${group.items.length} items`"
                  >
                    <template v-slot:append>
                      <v-btn
                        size="small"
                        variant="text"
                        color="primary"
                        @click="expandedRestaurant = expandedRestaurant === index ? null : index"
                      >
                        {{ expandedRestaurant === index ? 'Hide' : 'Show' }} Items
                      </v-btn>
                    </template>
                  </v-list-item>
                  
                  <v-expand-transition>
                    <div v-if="expandedRestaurant !== null">
                      <v-list density="compact">
                        <v-list-item
                          v-for="(item, itemIndex) in cartStore.restaurantGroups[expandedRestaurant].items"
                          :key="itemIndex"
                          :title="item.name"
                          :subtitle="`$${item.price.toFixed(2)} × ${item.quantity}`"
                        >
                          <template v-slot:append>
                            <div class="text-right font-weight-medium">
                              ${{ (item.price * item.quantity).toFixed(2) }}
                            </div>
                          </template>
                        </v-list-item>
                      </v-list>
                    </div>
                  </v-expand-transition>
                </v-list>
                
                <!-- Delivery Details Section -->
                <v-divider class="mb-4"></v-divider>
                
                <h3 class="text-h6 mb-3">{{ deliveryMethod === 'delivery' ? 'Delivery' : 'Pickup' }} Details</h3>
                
                <v-list class="mb-4">
                  <v-list-item v-if="deliveryMethod === 'delivery'">
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-map-marker</v-icon>
                    </template>
                    <template v-slot:title>
                      Delivery Address
                    </template>
                    <template v-slot:subtitle>
                      {{ deliveryAddress.street }}, {{ deliveryAddress.city }}, {{ deliveryAddress.zipCode }}
                      <span v-if="deliveryAddress.additionalInfo">
                        ({{ deliveryAddress.additionalInfo }})
                      </span>
                    </template>
                  </v-list-item>
                  
                  <v-list-item v-else>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-store</v-icon>
                    </template>
                    <template v-slot:title>
                      Pickup Location
                    </template>
                    <template v-slot:subtitle>
                      {{ getSelectedPickupAddress() }}
                    </template>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-account</v-icon>
                    </template>
                    <template v-slot:title>
                      Contact
                    </template>
                    <template v-slot:subtitle>
                      {{ contactInfo.firstName }} {{ contactInfo.lastName }} ({{ contactInfo.phone }})
                    </template>
                  </v-list-item>
                  
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-credit-card</v-icon>
                    </template>
                    <template v-slot:title>
                      Payment Method
                    </template>
                    <template v-slot:subtitle>
                      <span v-if="paymentMethod === 'creditCard'">
                        Credit Card (ending in {{ paymentInfo.cardNumber ? paymentInfo.cardNumber.slice(-4) : 'XXXX' }})
                      </span>
                      <span v-else-if="paymentMethod === 'paypal'">
                        PayPal
                      </span>
                      <span v-else>
                        Cash on Delivery
                      </span>
                    </template>
                  </v-list-item>
                </v-list>
                
                <!-- Special Instructions -->
                <v-divider class="mb-4"></v-divider>
                
                <h3 class="text-h6 mb-3">Special Instructions</h3>
                
                <v-textarea
                  v-model="specialInstructions"
                  label="Add any special requests (optional)"
                  placeholder="Allergies, special preparation, etc."
                  variant="outlined"
                  auto-grow
                  rows="2"
                  class="mb-4"
                ></v-textarea>
                
                <!-- Terms and Conditions -->
                <v-divider class="mb-4"></v-divider>
                
                <v-checkbox
                  v-model="termsAccepted"
                  color="primary"
                  :error-messages="errors.terms"
                >
                  <template v-slot:label>
                    <div>
                      I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                    </div>
                  </template>
                </v-checkbox>
              </v-card-text>
              <v-card-actions class="justify-space-between">
                <v-btn color="primary" variant="outlined" @click="currentStep = 3">
                  Back
                </v-btn>
                <v-btn
                  color="primary"
                  variant="flat"
                  size="large"
                  :loading="isPlacingOrder"
                  @click="placeOrder"
                >
                  Place Order
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-stepper>
      </v-col>
      
      <!-- Order Summary -->
      <v-col cols="12" md="4">
        <v-card class="order-summary" sticky>
          <v-card-title>Order Summary</v-card-title>
          
          <v-list density="compact">
            <v-list-item>
              <template v-slot:prepend>
                <v-badge
                  :content="cartStore.itemCount"
                  color="primary"
                >
                  <v-icon>mdi-cart-outline</v-icon>
                </v-badge>
              </template>
              <template v-slot:title>
                Items Subtotal
              </template>
              <template v-slot:append>
                ${{ cartStore.itemsSubtotal.toFixed(2) }}
              </template>
            </v-list-item>
            
            <v-list-item v-if="cartStore.discount > 0">
              <template v-slot:prepend>
                <v-icon>mdi-tag-outline</v-icon>
              </template>
              <template v-slot:title>
                Discount ({{ cartStore.discount * 100 }}%)
              </template>
              <template v-slot:append>
                <span class="text-error">-${{ cartStore.discountTotal.toFixed(2) }}</span>
              </template>
            </v-list-item>
            
            <v-list-item>
              <template v-slot:prepend>
                <v-icon>mdi-truck-delivery-outline</v-icon>
              </template>
              <template v-slot:title>
                {{ deliveryMethod === 'delivery' ? 'Delivery Fee' : 'Pickup Fee' }}
              </template>
              <template v-slot:append>
                {{ deliveryMethod === 'delivery' ? `$${cartStore.deliveryFee.toFixed(2)}` : 'Free' }}
              </template>
            </v-list-item>
            
            <v-list-item>
              <template v-slot:prepend>
                <v-icon>mdi-currency-usd</v-icon>
              </template>
              <template v-slot:title>
                Tax ({{ cartStore.taxRate * 100 }}%)
              </template>
              <template v-slot:append>
                ${{ cartStore.taxTotal.toFixed(2) }}
              </template>
            </v-list-item>
          </v-list>
          
          <v-divider></v-divider>
          
          <v-card-text class="d-flex justify-space-between align-center">
            <span class="text-h6 font-weight-bold">Total</span>
            <span class="text-h6 font-weight-bold">${{ cartStore.orderTotal.toFixed(2) }}</span>
          </v-card-text>
          
          <!-- Applied Coupon -->
          <v-card-text v-if="cartStore.appliedCoupon" class="pt-0">
            <v-alert
              color="success"
              variant="tonal"
              class="mb-0"
              density="compact"
            >
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="font-weight-bold">{{ cartStore.appliedCoupon }}</div>
                  <div class="text-caption">{{ cartStore.discount * 100 }}% discount applied</div>
                </div>
                <v-btn icon="mdi-close" size="x-small" variant="text" @click="cartStore.removeCoupon"></v-btn>
              </div>
            </v-alert>
          </v-card-text>
          
          <!-- Coupon Input -->
          <v-card-text v-else class="pt-0">
            <v-text-field
              v-model="couponCode"
              label="Promo Code"
              placeholder="Enter promo code"
              density="compact"
              hide-details
              class="mb-2"
              :error-messages="couponError"
            ></v-text-field>
            <v-btn
              block
              variant="outlined"
              size="small"
              @click="applyCoupon"
              :loading="applyingCoupon"
            >
              Apply
            </v-btn>
          </v-card-text>
          
          <!-- Delivery Time Estimate -->
          <v-card-text v-if="deliveryMethod === 'delivery'" class="pt-0">
            <v-alert
              color="info"
              variant="tonal"
              density="compact"
            >
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-clock-outline</v-icon>
                <div>
                  <div class="font-weight-bold">Estimated Delivery Time</div>
                  <div class="text-caption">30-45 minutes</div>
                </div>
              </div>
            </v-alert>
          </v-card-text>
          
          <!-- Pickup Time Estimate -->
          <v-card-text v-else class="pt-0">
            <v-alert
              color="info"
              variant="tonal"
              density="compact"
            >
              <div class="d-flex align-center">
                <v-icon class="mr-2">mdi-clock-outline</v-icon>
                <div>
                  <div class="font-weight-bold">Estimated Pickup Time</div>
                  <div class="text-caption">15-20 minutes</div>
                </div>
              </div>
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Order Confirmation Dialog -->
    <v-dialog v-model="orderConfirmationDialog" max-width="500">
      <v-card>
        <v-card-title class="text-center pa-4">
          <v-icon size="64" color="success" class="mb-2">mdi-check-circle</v-icon>
          <h2 class="text-h5">Order Placed Successfully!</h2>
        </v-card-title>
        
        <v-card-text class="text-center pa-4">
          <p class="mb-4">Your order has been received and is being processed.</p>
          <p class="font-weight-bold mb-2">Order Number: #{{ orderNumber }}</p>
          <p class="mb-4">A confirmation email has been sent to {{ contactInfo.email }}</p>
          
          <v-btn
            block
            color="primary"
            variant="flat"
            class="mb-2"
            :to="{ name: 'orderTracking', params: { id: orderNumber } }"
            @click="orderConfirmationDialog = false"
          >
            Track Order
          </v-btn>
          
          <v-btn
            block
            variant="text"
            :to="{ name: 'home' }"
            @click="orderConfirmationDialog = false"
          >
            Back to Home
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useCartStore } from '@/store/modules/cart';
import { useToast } from '@/composables/useToast';

export default {
  name: 'CheckoutView',
  
  setup() {
    const router = useRouter();
    const cartStore = useCartStore();
    const toast = useToast();
    
    // Make sure cart is loaded
    cartStore.loadCart();
    
    // Stepper
    const currentStep = ref(1);
    const steps = [{
      title: 'Delivery Options',
      value: 1,
    }, {
      title: 'Contact Details',
      value: 2,
    }, {
      title: 'Payment',
      value: 3,
    }, {
      title: 'Review',
      value: 4,
    }];
    
    // Delivery Options
    const deliveryMethod = ref('delivery');
    const deliveryAddress = ref({
      street: '',
      city: '',
      zipCode: '',
      additionalInfo: ''
    });
    const deliveryInstructions = ref('');
    
    // Pickup Options
    const selectedPickupLocation = ref(null);
    const pickupLocations = ref([
      { id: 1, address: '123 Main St, New York, NY 10001', restaurantId: 1 },
      { id: 2, address: '456 Market St, San Francisco, CA 94103', restaurantId: 2 },
      { id: 3, address: '789 Broadway, Chicago, IL 60601', restaurantId: 3 }
    ]);
    
    // Contact Information
    const contactInfo = ref({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      receiveUpdates: true
    });
    
    // Payment Information
    const paymentMethod = ref('creditCard');
    const paymentInfo = ref({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      nameOnCard: ''
    });
    const savePaymentInfo = ref(false);
    
    // Order Review
    const specialInstructions = ref('');
    const termsAccepted = ref(false);
    const expandedRestaurant = ref(null);
    
    // Coupon Code
    const couponCode = ref('');
    const couponError = ref('');
    const applyingCoupon = ref(false);
    
    // Order Confirmation
    const orderConfirmationDialog = ref(false);
    const orderNumber = ref('');
    const isPlacingOrder = ref(false);
    
    // Validation Errors
    const errors = ref({
      street: '',
      city: '',
      zipCode: '',
      pickupLocation: '',
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      nameOnCard: '',
      terms: ''
    });
    
    // Methods
    const validateDeliveryOptions = () => {
      let isValid = true;
      
      // Reset errors
      errors.value.street = '';
      errors.value.city = '';
      errors.value.zipCode = '';
      errors.value.pickupLocation = '';
      
      if (deliveryMethod.value === 'delivery') {
        if (!deliveryAddress.value.street) {
          errors.value.street = 'Street address is required';
          isValid = false;
        }
        
        if (!deliveryAddress.value.city) {
          errors.value.city = 'City is required';
          isValid = false;
        }
        
        if (!deliveryAddress.value.zipCode) {
          errors.value.zipCode = 'ZIP code is required';
          isValid = false;
        }
      } else if (deliveryMethod.value === 'pickup') {
        if (!selectedPickupLocation.value) {
          errors.value.pickupLocation = 'Please select a pickup location';
          isValid = false;
        }
      }
      
      if (isValid) {
        currentStep.value = 2;
      }
    };
    
    const validateContactInfo = () => {
      let isValid = true;
      
      // Reset errors
      errors.value.firstName = '';
      errors.value.lastName = '';
      errors.value.phone = '';
      errors.value.email = '';
      
      if (!contactInfo.value.firstName) {
        errors.value.firstName = 'First name is required';
        isValid = false;
      }
      
      if (!contactInfo.value.lastName) {
        errors.value.lastName = 'Last name is required';
        isValid = false;
      }
      
      if (!contactInfo.value.phone) {
        errors.value.phone = 'Phone number is required';
        isValid = false;
      }
      
      if (!contactInfo.value.email) {
        errors.value.email = 'Email is required';
        isValid = false;
      } else if (!validateEmail(contactInfo.value.email)) {
        errors.value.email = 'Please enter a valid email address';
        isValid = false;
      }
      
      if (isValid) {
        currentStep.value = 3;
      }
    };
    
    const validatePaymentInfo = () => {
      let isValid = true;
      
      // Reset errors
      errors.value.cardNumber = '';
      errors.value.expiryDate = '';
      errors.value.cvv = '';
      errors.value.nameOnCard = '';
      
      if (paymentMethod.value === 'creditCard') {
        if (!paymentInfo.value.cardNumber) {
          errors.value.cardNumber = 'Card number is required';
          isValid = false;
        }
        
        if (!paymentInfo.value.expiryDate) {
          errors.value.expiryDate = 'Expiry date is required';
          isValid = false;
        }
        
        if (!paymentInfo.value.cvv) {
          errors.value.cvv = 'CVV is required';
          isValid = false;
        }
        
        if (!paymentInfo.value.nameOnCard) {
          errors.value.nameOnCard = 'Name on card is required';
          isValid = false;
        }
      }
      
      if (isValid) {
        currentStep.value = 4;
      }
    };
    
    const validateEmail = (email) => {
      const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(email).toLowerCase());
    };
    
    const applyCoupon = async () => {
      if (!couponCode.value) {
        couponError.value = 'Please enter a promo code';
        return;
      }
      
      couponError.value = '';
      applyingCoupon.value = true;
      
      try {
        const success = cartStore.applyCoupon(couponCode.value);
        
        if (success) {
          toast.success('Coupon applied successfully!');
          couponCode.value = '';
        } else {
          couponError.value = 'Invalid or expired promo code';
          toast.error('Invalid or expired promo code');
        }
      } catch (error) {
        console.error(error);
        couponError.value = 'An error occurred, please try again';
        toast.error('Failed to apply coupon');
      } finally {
        applyingCoupon.value = false;
      }
    };
    
    const getSelectedPickupAddress = () => {
      if (!selectedPickupLocation.value) return 'No location selected';
      
      const location = pickupLocations.value.find(loc => loc.id === selectedPickupLocation.value);
      return location ? location.address : 'Unknown location';
    };
    
    const placeOrder = async () => {
      // Validate terms acceptance
      errors.value.terms = '';
      
      if (!termsAccepted.value) {
        errors.value.terms = 'You must accept the terms and conditions';
        return;
      }
      
      isPlacingOrder.value = true;
      
      try {
        // In a real app, this would be an API call to create the order
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Generate a random order number
        orderNumber.value = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
        
        // Clear the cart
        cartStore.clearCart();
        
        // Show confirmation dialog
        orderConfirmationDialog.value = true;
      } catch (error) {
        console.error('Failed to place order:', error);
        toast.error('Failed to place your order. Please try again.');
      } finally {
        isPlacingOrder.value = false;
      }
    };
    
    return {
      // Data
      cartStore,
      currentStep,
      steps,
      deliveryMethod,
      deliveryAddress,
      deliveryInstructions,
      selectedPickupLocation,
      pickupLocations,
      contactInfo,
      paymentMethod,
      paymentInfo,
      savePaymentInfo,
      specialInstructions,
      termsAccepted,
      expandedRestaurant,
      couponCode,
      couponError,
      applyingCoupon,
      orderConfirmationDialog,
      orderNumber,
      isPlacingOrder,
      errors,
      
      // Methods
      validateDeliveryOptions,
      validateContactInfo,
      validatePaymentInfo,
      applyCoupon,
      getSelectedPickupAddress,
      placeOrder
    };
  }
};
</script>

<style scoped>
.order-summary {
  position: sticky;
  top: 80px;
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

.quantity-input {
  width: 60px;
}

.quantity-input :deep(input) {
  text-align: center;
}
</style>
