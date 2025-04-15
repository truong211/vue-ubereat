<template>
  <v-container class="cart-page py-8">
    <h1 class="text-h4 font-weight-bold mb-6">Your Cart</h1>

    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading your cart...</p>
    </div>

    <div v-else-if="!cart || !cart.items || cart.items.length === 0" class="empty-cart-container text-center py-12">
      <v-icon size="100" color="grey">mdi-cart-outline</v-icon>
      <h2 class="text-h5 mt-6 mb-2">Your cart is empty</h2>
      <p class="text-body-1 mb-8">Add items from restaurants to start your order</p>
      <v-btn
        color="primary"
        size="large"
        to="/"
        prepend-icon="mdi-food"
      >
        Browse Restaurants
      </v-btn>
    </div>

    <v-row v-else>
      <!-- Cart items (left side) -->
      <v-col cols="12" md="8">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-avatar size="40" class="mr-3">
              <v-img :src="cart.restaurant?.logo || '/img/placeholder-restaurant.png'" alt="Restaurant"></v-img>
            </v-avatar>
            <div>
              <div class="text-h6">{{ cart.restaurant?.name }}</div>
              <div class="text-caption text-medium-emphasis d-flex align-center">
                <v-icon size="small" class="mr-1">mdi-map-marker</v-icon>
                <span>{{ cart.restaurant?.address }}</span>
                <v-chip v-if="cart.restaurant?.estimatedDeliveryTime" size="x-small" class="ml-2" color="primary" variant="flat">
                  {{ cart.restaurant?.estimatedDeliveryTime }} min
                </v-chip>
              </div>
            </div>
          </v-card-title>
          
          <v-divider></v-divider>
          
          <v-card-text class="pa-0">
            <!-- Cart items list -->
            <v-list>
              <v-list-item
                v-for="(item, index) in cart.items"
                :key="item.id"
                class="py-4"
              >
                <template v-slot:prepend>
                  <div class="d-flex align-center">
                    <v-btn
                      icon="mdi-minus"
                      size="small"
                      variant="text"
                      :disabled="item.quantity <= 1"
                      @click="updateItemQuantity(item.id, item.quantity - 1)"
                    ></v-btn>
                    <span class="mx-2">{{ item.quantity }}</span>
                    <v-btn
                      icon="mdi-plus"
                      size="small"
                      variant="text"
                      @click="updateItemQuantity(item.id, item.quantity + 1)"
                    ></v-btn>
                  </div>
                </template>
                
                <div class="d-flex flex-column flex-grow-1">
                  <v-list-item-title class="text-subtitle-1 font-weight-medium">
                    {{ item.product.name }}
                  </v-list-item-title>
                  
                  <!-- Item options -->
                  <div v-if="item.options" class="options-container mt-1">
                    <div v-for="(optionValue, optionId) in item.options" :key="optionId" class="option-item">
                      <template v-if="Array.isArray(optionValue)">
                        <v-chip 
                          v-for="choice in optionValue" 
                          :key="choice.id" 
                          size="x-small" 
                          class="mr-1 mb-1" 
                          color="secondary" 
                          variant="flat"
                        >
                          {{ choice.name }}
                          <span v-if="choice.price > 0">(+${{ choice.price.toFixed(2) }})</span>
                        </v-chip>
                      </template>
                      <template v-else>
                        <v-chip size="x-small" class="mr-1 mb-1" color="secondary" variant="flat">
                          {{ optionValue.name }}
                          <span v-if="optionValue.price > 0">(+${{ optionValue.price.toFixed(2) }})</span>
                        </v-chip>
                      </template>
                    </div>
                  </div>
                  
                  <!-- Item notes -->
                  <div v-if="item.notes" class="notes-container mt-1">
                    <div class="text-caption text-medium-emphasis d-flex align-center">
                      <v-icon size="x-small" class="mr-1">mdi-note-text-outline</v-icon>
                      <i>{{ item.notes }}</i>
                    </div>
                  </div>
                  
                  <!-- Item actions -->
                  <div class="item-actions mt-2">
                    <v-btn 
                      variant="text" 
                      size="x-small" 
                      density="compact" 
                      prepend-icon="mdi-pencil" 
                      @click="editItem(item)"
                    >
                      Edit
                    </v-btn>
                    <v-btn 
                      variant="text" 
                      size="x-small" 
                      density="compact" 
                      color="secondary" 
                      prepend-icon="mdi-note-edit-outline" 
                      @click="editItemNotes(item)"
                    >
                      {{ item.notes ? 'Edit Note' : 'Add Note' }}
                    </v-btn>
                  </div>
                </div>
                
                <template v-slot:append>
                  <div class="d-flex align-center">
                    <span class="text-subtitle-1 font-weight-bold mr-4">
                      ${{ item.itemTotal.toFixed(2) }}
                    </span>
                    <v-btn
                      icon="mdi-delete-outline"
                      size="small"
                      variant="text"
                      color="error"
                      @click="removeItem(item.id)"
                    ></v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
          
          <v-divider></v-divider>
          
          <v-card-actions class="pa-4">
            <v-btn
              prepend-icon="mdi-plus"
              variant="text"
              :to="`/restaurant/${cart.restaurant?.id}`"
            >
              Add more items
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              color="error"
              variant="text"
              prepend-icon="mdi-delete"
              @click="confirmClearCart"
            >
              Clear cart
            </v-btn>
          </v-card-actions>
        </v-card>
        
        <!-- Special instructions -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-note-text</v-icon>
            Special Instructions
          </v-card-title>
          <v-card-text>
            <v-textarea
              v-model="specialInstructions"
              placeholder="Add special instructions for the restaurant (e.g., allergies, dietary restrictions, etc.)"
              variant="outlined"
              rows="3"
              auto-grow
              hide-details
              @change="updateSpecialInstructions"
            ></v-textarea>
          </v-card-text>
        </v-card>
        
        <!-- Delivery Options -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-map-marker</v-icon>
            Delivery Address
          </v-card-title>
          <v-card-text v-if="isLoadingAddresses">
            <v-skeleton-loader type="list-item"></v-skeleton-loader>
          </v-card-text>
          <v-card-text v-else-if="addresses.length === 0" class="text-center py-4">
            <p class="mb-4">You don't have any saved addresses</p>
            <v-btn 
              color="primary" 
              prepend-icon="mdi-plus" 
              @click="showAddAddressDialog = true"
            >
              Add New Address
            </v-btn>
          </v-card-text>
          <v-card-text v-else class="pa-0">
            <v-radio-group v-model="selectedAddressId" @change="updateDeliveryAddress">
              <v-list>
                <v-list-item v-for="address in addresses" :key="address.id">
                  <template v-slot:prepend>
                    <v-radio :value="address.id"></v-radio>
                  </template>
                  
                  <v-list-item-title>{{ address.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ address.addressLine1 }}
                    <span v-if="address.addressLine2">, {{ address.addressLine2 }}</span>
                    <br>
                    {{ address.city }}, {{ address.state }} {{ address.postalCode }}
                  </v-list-item-subtitle>
                  
                  <template v-slot:append>
                    <v-btn
                      icon="mdi-pencil"
                      size="small"
                      variant="text"
                      @click.stop="editAddress(address)"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
            </v-radio-group>
            
            <v-divider></v-divider>
            
            <v-card-actions>
              <v-btn 
                prepend-icon="mdi-plus" 
                variant="text" 
                @click="showAddAddressDialog = true"
              >
                Add New Address
              </v-btn>
            </v-card-actions>
          </v-card-text>
        </v-card>
        
        <!-- Delivery Time -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">mdi-clock-outline</v-icon>
            Delivery Time
          </v-card-title>
          <v-card-text>
            <v-radio-group v-model="deliveryTimeOption" @change="updateDeliveryTime">
              <v-radio
                label="Deliver ASAP"
                value="asap"
                :hint="isScheduledDelivery ? '' : `Estimated delivery time: ${estimatedDeliveryTime}`"
                persistent-hint
              ></v-radio>
              
              <v-radio
                label="Schedule for Later"
                value="scheduled"
              ></v-radio>
            </v-radio-group>
            
            <v-expand-transition>
              <div v-if="deliveryTimeOption === 'scheduled'" class="mt-4">
                <v-card-subtitle class="px-0 pb-0">Select Date and Time</v-card-subtitle>
                
                <div class="d-flex">
                  <v-menu
                    v-model="showDatePicker"
                    :close-on-content-click="false"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        v-model="scheduledDate"
                        label="Delivery Date"
                        readonly
                        variant="outlined"
                        density="compact"
                        class="mr-2"
                        prepend-inner-icon="mdi-calendar"
                      ></v-text-field>
                    </template>
                    <v-date-picker
                      v-model="scheduledDate"
                      :min="currentDate"
                      :max="maxScheduleDate"
                      @update:model-value="showDatePicker = false"
                    ></v-date-picker>
                  </v-menu>
                
                  <v-menu
                    v-model="showTimePicker"
                    :close-on-content-click="false"
                  >
                    <template v-slot:activator="{ props }">
                      <v-text-field
                        v-bind="props"
                        v-model="scheduledTime"
                        label="Delivery Time"
                        readonly
                        variant="outlined"
                        density="compact"
                        prepend-inner-icon="mdi-clock-outline"
                      ></v-text-field>
                    </template>
                    <v-time-picker
                      v-model="scheduledTime"
                      format="24hr"
                      :allowed-minutes="allowedMinutes"
                      @update:model-value="showTimePicker = false"
                    ></v-time-picker>
                  </v-menu>
                </div>
                
                <p class="text-caption mt-2">
                  Schedule delivery up to 7 days in advance. Orders can be scheduled in 15-minute intervals.
                </p>
                
                <v-btn 
                  color="primary" 
                  class="mt-2" 
                  @click="scheduleDelivery"
                  :loading="isScheduling"
                  :disabled="!isValidScheduleTime"
                >
                  Confirm Schedule
                </v-btn>
              </div>
            </v-expand-transition>
          </v-card-text>
        </v-card>
      </v-col>
      
      <!-- Order summary (right side) -->
      <v-col cols="12" md="4">
        <v-card class="order-summary">
          <v-card-title>Order Summary</v-card-title>
          
          <v-card-text>
            <!-- Promo code -->
            <div class="mb-4">
              <v-text-field
                v-model="promoCode"
                label="Promo Code"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="isApplyingPromo || !!cart.appliedPromotion"
                :error="!!promoError"
                class="mb-2"
              >
                <template v-slot:append>
                  <v-btn
                    color="primary"
                    :disabled="!promoCode || isApplyingPromo || !!cart.appliedPromotion"
                    :loading="isApplyingPromo"
                    size="small"
                    @click="applyPromoCode"
                  >
                    Apply
                  </v-btn>
                </template>
              </v-text-field>
              <div v-if="promoError" class="text-error text-caption">
                {{ promoError }}
              </div>
              <div v-if="cart.appliedPromotion" class="d-flex align-center mt-2">
                <v-chip
                  color="success"
                  size="small"
                  class="mr-2"
                  closable
                  @click:close="removePromoCode"
                >
                  {{ cart.appliedPromotion.code }}: 
                  <span v-if="cart.appliedPromotion.type === 'percentage'">
                    {{ cart.appliedPromotion.value }}% off
                  </span>
                  <span v-else-if="cart.appliedPromotion.type === 'fixed_amount'">
                    ${{ cart.appliedPromotion.value }} off
                  </span>
                  <span v-else-if="cart.appliedPromotion.type === 'free_delivery'">
                    Free Delivery
                  </span>
                </v-chip>
              </div>
            </div>
            
            <v-divider class="mb-4"></v-divider>
            
            <!-- Price breakdown -->
            <div class="d-flex justify-space-between mb-3">
              <span class="text-body-1">Subtotal</span>
              <span class="text-body-1">${{ cart.subtotal?.toFixed(2) }}</span>
            </div>
            
            <div v-if="cart.itemOptions > 0" class="d-flex justify-space-between mb-3">
              <span class="text-body-1">Options</span>
              <span class="text-body-1">${{ cart.itemOptions?.toFixed(2) }}</span>
            </div>
            
            <div v-if="cart.discountAmount > 0" class="d-flex justify-space-between mb-3 text-success">
              <span class="text-body-1">Discount</span>
              <span class="text-body-1">-${{ cart.discountAmount?.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between mb-3">
              <span class="text-body-1">Delivery Fee</span>
              <span class="text-body-1">${{ cart.deliveryFee?.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-1">Tax</span>
              <span class="text-body-1">${{ cart.taxAmount?.toFixed(2) }}</span>
            </div>
            
            <v-divider class="mb-4"></v-divider>
            
            <!-- Total -->
            <div class="d-flex justify-space-between mb-6">
              <span class="text-h6 font-weight-bold">Total</span>
              <span class="text-h6 font-weight-bold">${{ cart.total?.toFixed(2) }}</span>
            </div>
            
            <!-- Checkout button -->
            <v-btn
              color="primary"
              size="large"
              block
              :disabled="!canProceedToCheckout"
              :loading="isProcessing"
              @click="proceedToCheckout"
            >
              Proceed to Checkout
            </v-btn>
            
            <div v-if="!canProceedToCheckout && checkoutValidationMessage" class="text-error text-caption text-center mt-2">
              {{ checkoutValidationMessage }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Clear cart confirmation dialog -->
    <v-dialog v-model="showClearCartDialog" max-width="400">
      <v-card>
        <v-card-title class="text-h5">Clear your cart?</v-card-title>
        <v-card-text>
          Are you sure you want to remove all items from your cart? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showClearCartDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="clearCart"
            :loading="isClearing"
          >
            Clear Cart
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Edit item notes dialog -->
    <v-dialog v-model="showNotesDialog" max-width="500">
      <v-card>
        <v-card-title>Special Instructions for Item</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="itemNotes"
            label="Special Instructions"
            placeholder="Add any special requests for this item (e.g., no onions, extra spicy, etc.)"
            variant="outlined"
            rows="3"
            auto-grow
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showNotesDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveItemNotes"
            :loading="isSavingNotes"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Add/Edit Address Dialog -->
    <v-dialog v-model="showAddressDialog" max-width="600">
      <v-card>
        <v-card-title>{{ isEditingAddress ? 'Edit Address' : 'Add New Address' }}</v-card-title>
        <v-card-text>
          <v-form ref="addressForm" v-model="isAddressFormValid" @submit.prevent="saveAddress">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="addressForm.name"
                  label="Address Name"
                  placeholder="Home, Work, etc."
                  variant="outlined"
                  :rules="[v => !!v || 'Name is required']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="addressForm.addressLine1"
                  label="Street Address"
                  variant="outlined"
                  :rules="[v => !!v || 'Address is required']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="addressForm.addressLine2"
                  label="Apt, Suite, Floor (optional)"
                  variant="outlined"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="addressForm.city"
                  label="City"
                  variant="outlined"
                  :rules="[v => !!v || 'City is required']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="addressForm.state"
                  label="State"
                  variant="outlined"
                  :rules="[v => !!v || 'State is required']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="addressForm.postalCode"
                  label="Zip Code"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Zip code is required',
                    v => /^\d{5}(-\d{4})?$/.test(v) || 'Invalid zip code'
                  ]"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-text-field
                  v-model="addressForm.phone"
                  label="Phone Number"
                  variant="outlined"
                  :rules="[
                    v => !!v || 'Phone number is required',
                    v => /^\(\d{3}\) \d{3}-\d{4}$|^\d{10}$/.test(v) || 'Invalid phone number'
                  ]"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="addressForm.instructions"
                  label="Delivery Instructions (optional)"
                  placeholder="E.g., Door code, landmarks, etc."
                  variant="outlined"
                  rows="2"
                  auto-grow
                ></v-textarea>
              </v-col>
              
              <v-col cols="12">
                <v-checkbox
                  v-model="addressForm.isDefault"
                  label="Make this my default address"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showAddressDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="isSavingAddress"
            :disabled="!isAddressFormValid"
            @click="saveAddress"
          >
            Save Address
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { defineComponent } from 'vue';
import { format, addHours, addDays, addMinutes, isAfter, parse } from 'date-fns';
import { useCartStore } from '@/stores/cart';
import { useAuthStore } from '@/stores/auth';
import { useUserStore } from '@/stores/user';
import { useNotificationStore } from '@/stores/notifications';
// Removed addressService import

export default defineComponent({ // Use defineComponent
  name: 'CartView',
  setup() {
    const cartStore = useCartStore();
    const authStore = useAuthStore();
    const userStore = useUserStore();
    const notificationStore = useNotificationStore();
    return { cartStore, authStore, userStore, notificationStore }; // Expose store instances
  },

  data() {
    return {
      isLoading: true,
      specialInstructions: '',
      promoCode: '',
      promoError: '',
      isApplyingPromo: false,
      isProcessing: false,
      isClearing: false,

      // Dialogs
      showClearCartDialog: false,
      showNotesDialog: false,
      showAddressDialog: false,

      // Address Management
      isLoadingAddresses: true,
      // addresses: [], // Will be fetched from userStore
      selectedAddressId: null,
      isEditingAddress: false,
      isSavingAddress: false,
      isAddressFormValid: false,
      addressForm: {
        id: null,
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        phone: '',
        instructions: '',
        isDefault: false
      },

      // Item Notes
      currentItemId: null,
      itemNotes: '',
      isSavingNotes: false,

      // Delivery Time Settings
      deliveryTimeOption: 'asap',
      isScheduledDelivery: false,
      isScheduling: false,
      scheduledDate: format(new Date(), 'yyyy-MM-dd'),
      scheduledTime: format(addHours(new Date(), 1), 'HH:mm'),
      showDatePicker: false,
      showTimePicker: false
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
    // Access addresses from userStore
    addresses() {
        return this.userStore.addresses || [];
    },
    
    currentDate() {
      return format(new Date(), 'yyyy-MM-dd');
    },
    
    maxScheduleDate() {
      return format(addDays(new Date(), 7), 'yyyy-MM-dd');
    },
    
    estimatedDeliveryTime() {
      if (!this.cart.restaurant) return 'N/A';
      
      const estimatedMinutes = this.cart.restaurant.estimatedDeliveryTime || 45;
      const now = new Date();
      const estimatedTime = addMinutes(now, estimatedMinutes);
      
      return format(estimatedTime, 'h:mm a');
    },
    
    isValidScheduleTime() {
      if (!this.scheduledDate || !this.scheduledTime) return false;
      
      const scheduledDateTime = parse(
        `${this.scheduledDate} ${this.scheduledTime}`,
        'yyyy-MM-dd HH:mm',
        new Date()
      );
      
      const now = new Date();
      
      // Must be at least 45 min in the future
      const minTime = addMinutes(now, 45);
      
      return isAfter(scheduledDateTime, minTime);
    },
    
    canProceedToCheckout() {
      return (
        this.cart && 
        this.cart.items && 
        this.cart.items.length > 0 && 
        this.selectedAddressId
      );
    },
    
    checkoutValidationMessage() {
      if (!this.cart || !this.cart.items || this.cart.items.length === 0) {
        return 'Your cart is empty';
      }
      
      if (!this.selectedAddressId) {
        return 'Please select a delivery address';
      }
      
      return '';
    }
  },
  created() {
    this.loadCart();
    this.loadAddresses(); // Keep calling this method
  },
  methods: {
    // Removed mapActions block. Methods will call store actions directly.
    
    async loadCart() {
      try {
        this.isLoading = true;
        const cartData = await this.cartStore.fetchCart(); // Call action on cartStore
        
        console.log('Cart data loaded:', cartData);
        
        if (!cartData || !cartData.items) {
          console.warn('Empty cart or invalid cart data structure');
          this.cart = {
            items: [],
            restaurant: null,
            subtotal: 0,
            deliveryFee: 0,
            taxAmount: 0,
            total: 0
          };
          return;
        }
        
        // Store the cart data
        this.cart = cartData;
        
        // Set special instructions if available
        this.specialInstructions = cartData.specialInstructions || '';
        
        // Set delivery time options
        if (cartData.scheduledDelivery) {
          this.deliveryTimeOption = 'scheduled';
          try {
            const scheduledDate = new Date(cartData.scheduledDelivery.time);
            this.scheduledDate = format(scheduledDate, 'yyyy-MM-dd');
            this.scheduledTime = format(scheduledDate, 'HH:mm');
          } catch (err) {
            console.error('Error parsing scheduled delivery date:', err);
            this.deliveryTimeOption = 'asap';
          }
        } else {
          this.deliveryTimeOption = 'asap';
        }
        
        // Set address if available
        if (cartData.deliveryAddress) {
          this.selectedAddressId = cartData.deliveryAddress.id;
        }
      } catch (error) {
        console.error('Failed to load cart:', error); // Log the actual error object
        // Safely construct the error message for the user
        const userMessage = error?.response?.data?.message || error?.message || 'An unexpected error occurred while loading your cart. Please try again.';
        this.notificationStore.showToast({ message: userMessage, type: 'error' });
        
        // Initialize with empty cart
        this.cart = {
          items: [],
          restaurant: null,
          subtotal: 0,
          deliveryFee: 0,
          taxAmount: 0,
          total: 0
        };
      } finally {
        this.isLoading = false;
      }
    },
    
    async loadAddresses() {
      try {
        this.isLoadingAddresses = true;
        // Call the service directly instead of the mapped action
        // Call action on userStore
        await this.userStore.fetchAddresses();
        // Addresses are now available via computed property this.addresses
        
        // Ensure addresses is always an array
        // No need to set this.addresses directly, computed property handles it
        
        // If no address is selected and we have addresses, select the default one
        if (!this.selectedAddressId && this.addresses.length > 0) {
          const defaultAddress = this.addresses.find(addr => addr.isDefault) || this.addresses[0];
          this.selectedAddressId = defaultAddress.id;
          
          // Update cart with the selected address
          // No need to call updateDeliveryAddress here, selection will trigger it if needed
        }
      } catch (error) {
        console.error('Failed to load addresses:', error);
        // Safe access to error properties
        const errorMessage = error?.response?.data?.message || 'Failed to load your delivery addresses.';
        this.notificationStore.showToast({ message: errorMessage, type: 'error' });
      } finally {
        this.isLoadingAddresses = false;
      }
    },
    
    async updateItemQuantity(itemId, quantity) {
      try {
        // Call action on cartStore
        await this.cartStore.updateCartItem({
          id: itemId,
          quantity: quantity
        });
      } catch (error) {
        console.error('Failed to update quantity:', error);
        this.notificationStore.showToast({ message: 'Failed to update quantity. Please try again.', type: 'error' });
      }
    },
    
    async removeItem(itemId) {
      try {
        await this.cartStore.removeCartItem(itemId); // Call action on cartStore
        this.notificationStore.showToast({ message: 'Item removed from cart', type: 'success' });
      } catch (error) {
        console.error('Failed to remove item:', error);
        this.notificationStore.showToast({ message: 'Failed to remove item. Please try again.', type: 'error' });
      }
    },
    
    confirmClearCart() {
      this.showClearCartDialog = true;
    },
    
    async clearCart() {
      try {
        this.isClearing = true;
        await this.cartStore.clearCart(); // Call action on cartStore
        this.showClearCartDialog = false;
        this.notificationStore.showToast({ message: 'Cart cleared successfully', type: 'success' });
      } catch (error) {
        console.error('Failed to clear cart:', error);
        this.notificationStore.showToast({ message: 'Failed to clear cart. Please try again.', type: 'error' });
      } finally {
        this.isClearing = false;
      }
    },
    
    async applyPromoCode() {
      if (!this.promoCode) return;
      
      try {
        this.isApplyingPromo = true;
        this.promoError = '';
        
        await this.cartStore.applyPromotion(this.promoCode); // Call action on cartStore
        this.promoCode = '';
        this.notificationStore.showToast({ message: 'Promotion applied successfully', type: 'success' });
      } catch (error) {
        console.error('Failed to apply promotion:', error);
        this.promoError = error.response?.data?.message || 'Invalid promotion code';
      } finally {
        this.isApplyingPromo = false;
      }
    },
    
    async removePromoCode() {
      try {
        await this.cartStore.removePromotion(); // Call action on cartStore
        this.notificationStore.showToast({ message: 'Promotion removed', type: 'success' });
      } catch (error) {
        console.error('Failed to remove promotion:', error);
        this.notificationStore.showToast({ message: 'Failed to remove promotion. Please try again.', type: 'error' });
      }
    },
    
    async updateSpecialInstructions() {
      try {
        await this.cartStore.setSpecialInstructions(this.specialInstructions); // Call action on cartStore
      } catch (error) {
        console.error('Failed to update instructions:', error);
        this.notificationStore.showToast({ message: 'Failed to save instructions. Please try again.', type: 'error' });
      }
    },
    
    editItem(item) {
      // Navigate to product detail page with cart item details for editing
      this.$router.push({
        name: 'ProductDetail',
        params: {
          restaurantId: this.cart.restaurant.id,
          productId: item.product.id,
        },
        query: {
          edit: 'true',
          cartItemId: item.id
        }
      });
    },
    
    editItemNotes(item) {
      this.currentItemId = item.id;
      this.itemNotes = item.notes || '';
      this.showNotesDialog = true;
    },
    
    async saveItemNotes() {
      try {
        this.isSavingNotes = true;
        
        // Call action on cartStore
        await this.cartStore.updateCartItem({
          id: this.currentItemId,
          notes: this.itemNotes
        });
        
        this.showNotesDialog = false;
        this.notificationStore.showToast({ message: 'Special instructions saved', type: 'success' });
      } catch (error) {
        console.error('Failed to save notes:', error);
        this.notificationStore.showToast({ message: 'Failed to save special instructions. Please try again.', type: 'error' });
      } finally {
        this.isSavingNotes = false;
      }
    },
    
    async updateDeliveryAddress() {
      if (!this.selectedAddressId) return;
      
      try {
        await this.cartStore.setDeliveryAddress(this.selectedAddressId); // Call action on cartStore
      } catch (error) {
        console.error('Failed to update delivery address:', error);
        this.notificationStore.showToast({ message: 'Failed to update delivery address. Please try again.', type: 'error' });
      }
    },
    
    editAddress(address) {
      this.isEditingAddress = true;
      this.addressForm = { ...address };
      this.showAddressDialog = true;
    },
    
    async saveAddress() {
      if (!this.$refs.addressForm.validate()) return;
      
      try {
        this.isSavingAddress = true;
        
        if (this.isEditingAddress) {
          await this.userStore.updateAddress(this.addressForm); // Call action on userStore
          this.notificationStore.showToast({ message: 'Address updated successfully', type: 'success' });
        } else {
          const newAddress = await this.userStore.createAddress(this.addressForm); // Call action on userStore
          this.selectedAddressId = newAddress.id;
          await this.cartStore.setDeliveryAddress(newAddress.id); // Update cart with new address ID
          this.notificationStore.showToast({ message: 'Address added successfully', type: 'success' });
        }
        
        // No need to call loadAddresses, userStore should update automatically
        this.showAddressDialog = false;
        
        // Reset form
        this.resetAddressForm();
      } catch (error) {
        console.error('Failed to save address:', error);
        this.notificationStore.showToast({ message: 'Failed to save address. Please try again.', type: 'error' });
      } finally {
        this.isSavingAddress = false;
      }
    },
    
    resetAddressForm() {
      this.isEditingAddress = false;
      this.addressForm = {
        id: null,
        name: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        postalCode: '',
        phone: '',
        instructions: '',
        isDefault: false
      };
    },
    
    async updateDeliveryTime() {
      if (this.deliveryTimeOption === 'asap' && this.isScheduledDelivery) {
        // Cancel scheduled delivery
        try {
          await this.cartStore.cancelScheduledDelivery(); // Call action on cartStore
          this.isScheduledDelivery = false;
          this.notificationStore.showToast({ message: 'Delivery set to ASAP', type: 'success' });
        } catch (error) {
          console.error('Failed to cancel scheduled delivery:', error);
          this.notificationStore.showToast({ message: 'Failed to update delivery time. Please try again.', type: 'error' });
        }
      }
    },
    
    async scheduleDelivery() {
      if (!this.isValidScheduleTime) {
        this.notificationStore.showToast({ message: 'Please select a valid future time for delivery (at least 45 minutes from now)', type: 'error' });
        return;
      }
      
      try {
        this.isScheduling = true;
        
        // Combine date and time into a single DateTime
        const scheduledDateTime = parse(
          `${this.scheduledDate} ${this.scheduledTime}`,
          'yyyy-MM-dd HH:mm',
          new Date()
        );
        
        await this.cartStore.scheduleDelivery(scheduledDateTime.toISOString()); // Call action on cartStore
        
        this.isScheduledDelivery = true;
        this.notificationStore.showToast({ message: 'Delivery time scheduled successfully', type: 'success' });
      } catch (error) {
        console.error('Failed to schedule delivery:', error);
        this.notificationStore.showToast({ message: 'Failed to schedule delivery time. Please try again.', type: 'error' });
      } finally {
        this.isScheduling = false;
      }
    },
    
    async proceedToCheckout() {
      if (!this.canProceedToCheckout) return;
      
      try {
        this.isProcessing = true;
        
        // Verify everything is set before proceeding
        if (!this.selectedAddressId) {
          this.notificationStore.showToast({ message: 'Please select a delivery address', type: 'error' });
          return;
        }
        
        // Navigate to checkout page
        this.$router.push({ name: 'Checkout' });
      } catch (error) {
        console.error('Failed to proceed to checkout:', error);
        this.notificationStore.showToast({ message: 'Failed to proceed to checkout. Please try again.', type: 'error' });
      } finally {
        this.isProcessing = false;
      }
    }
  }
}); // Close defineComponent
</script>

<style scoped>
.order-summary {
  position: sticky;
  top: 20px;
}

.options-container {
  display: flex;
  flex-wrap: wrap;
}

@media (max-width: 960px) {
  .order-summary {
    position: static;
  }
}
</style>
