<template>
  <div class="payment-methods">
    <h2 class="text-h6 mb-4">Payment Methods</h2>
    
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center my-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    
    <!-- Error Alert -->
    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>
    
    <!-- Payment Methods List -->
    <div v-else>
      <!-- Add New Payment Method Button -->
      <div class="d-flex justify-end mb-4">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openAddPaymentDialog"
        >
          Add Payment Method
        </v-btn>
      </div>
      
      <!-- Empty State -->
      <v-card
        v-if="paymentMethods.length === 0"
        variant="outlined"
        class="text-center py-8 px-4"
      >
        <v-icon size="64" color="grey-lighten-1" icon="mdi-credit-card-off"></v-icon>
        <h3 class="text-h6 mt-4 mb-2">No Payment Methods</h3>
        <p class="text-medium-emphasis mb-6">
          Add a payment method to make checkout faster
        </p>
        <v-btn
          color="primary"
          prepend-icon="mdi-credit-card-plus"
          @click="openAddPaymentDialog"
        >
          Add Payment Method
        </v-btn>
      </v-card>
      
      <!-- Payment Methods Cards -->
      <v-card
        v-for="(method, index) in paymentMethods"
        :key="method.id"
        class="mb-4"
      >
        <v-card-text>
          <div class="d-flex justify-space-between align-center">
            <div class="d-flex align-center">
              <v-icon
                size="32"
                :color="getCardBrandColor(method.brand)"
                class="mr-3"
              >
                {{ getCardBrandIcon(method.brand) }}
              </v-icon>
              
              <div>
                <h3 class="text-subtitle-1 font-weight-medium mb-1">
                  {{ getCardBrandName(method.brand) }} •••• {{ method.last4 }}
                </h3>
                <p class="text-caption text-medium-emphasis mb-0">
                  Expires {{ method.expMonth }}/{{ method.expYear }}
                </p>
              </div>
              
              <v-chip
                v-if="method.isDefault"
                size="small"
                color="success"
                class="ml-3"
              >
                Default
              </v-chip>
            </div>
            
            <div>
              <v-btn
                v-if="!method.isDefault"
                variant="text"
                color="primary"
                size="small"
                @click="setDefaultPaymentMethod(method.id)"
              >
                Set as Default
              </v-btn>
              <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                size="small"
                @click="openDeleteDialog(method)"
              ></v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
    
    <!-- Add Payment Method Dialog -->
    <v-dialog v-model="dialogs.addPayment.show" max-width="600">
      <v-card>
        <v-card-title>Add Payment Method</v-card-title>
        
        <v-card-text>
          <v-form ref="paymentForm" v-model="dialogs.addPayment.isFormValid">
            <v-text-field
              v-model="dialogs.addPayment.formData.cardNumber"
              label="Card Number"
              variant="outlined"
              :rules="[rules.required, rules.cardNumber]"
              maxlength="19"
              @input="formatCardNumber"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="dialogs.addPayment.formData.cardName"
              label="Name on Card"
              variant="outlined"
              :rules="[rules.required]"
              required
            ></v-text-field>
            
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="dialogs.addPayment.formData.expiry"
                  label="Expiration Date (MM/YY)"
                  variant="outlined"
                  :rules="[rules.required, rules.expiryDate]"
                  maxlength="5"
                  @input="formatExpiryDate"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="6">
                <v-text-field
                  v-model="dialogs.addPayment.formData.cvv"
                  label="CVV"
                  variant="outlined"
                  :rules="[rules.required, rules.cvv]"
                  maxlength="4"
                  type="password"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-checkbox
              v-model="dialogs.addPayment.formData.setDefault"
              label="Set as default payment method"
            ></v-checkbox>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="dialogs.addPayment.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="dialogs.addPayment.loading"
            :disabled="!dialogs.addPayment.isFormValid || dialogs.addPayment.loading"
            @click="addPaymentMethod"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="dialogs.delete.show" max-width="400">
      <v-card>
        <v-card-title>Delete Payment Method</v-card-title>
        
        <v-card-text>
          <p>Are you sure you want to delete this payment method?</p>
          <div v-if="dialogs.delete.method" class="d-flex align-center mt-3">
            <v-icon
              size="24"
              :color="getCardBrandColor(dialogs.delete.method.brand)"
              class="mr-2"
            >
              {{ getCardBrandIcon(dialogs.delete.method.brand) }}
            </v-icon>
            <span>
              {{ getCardBrandName(dialogs.delete.method.brand) }} •••• {{ dialogs.delete.method.last4 }}
            </span>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="dialogs.delete.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="dialogs.delete.loading"
            @click="deletePaymentMethod"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';

export default {
  name: 'PaymentMethods',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    const paymentForm = ref(null);
    
    // State
    const loading = ref(true);
    const error = ref('');
    const paymentMethods = ref([]);
    
    // Dialog states
    const dialogs = reactive({
      addPayment: {
        show: false,
        loading: false,
        isFormValid: false,
        formData: {
          cardNumber: '',
          cardName: '',
          expiry: '',
          cvv: '',
          setDefault: false
        }
      },
      delete: {
        show: false,
        loading: false,
        method: null
      }
    });
    
    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      cardNumber: v => /^[\d\s]{13,19}$/.test(v.replace(/\s/g, '')) || 'Invalid card number',
      expiryDate: v => /^(0[1-9]|1[0-2])\/\d{2}$/.test(v) || 'Invalid expiry date (MM/YY)',
      cvv: v => /^\d{3,4}$/.test(v) || 'CVV must be 3 or 4 digits'
    };
    
    // Format functions
    const formatCardNumber = () => {
      if (!dialogs.addPayment.formData.cardNumber) return;
      
      const value = dialogs.addPayment.formData.cardNumber.replace(/\s/g, '');
      if (value.length > 0) {
        dialogs.addPayment.formData.cardNumber = value
          .replace(/\D/g, '')
          .replace(/(\d{4})(?=\d)/g, '$1 ')
          .trim();
      }
    };
    
    const formatExpiryDate = () => {
      if (!dialogs.addPayment.formData.expiry) return;
      
      const expiry = dialogs.addPayment.formData.expiry.replace(/\D/g, '');
      
      if (expiry.length > 0) {
        // Format as MM/YY
        if (expiry.length >= 2) {
          dialogs.addPayment.formData.expiry = `${expiry.substring(0, 2)}/${expiry.substring(2, 4)}`;
        } else {
          dialogs.addPayment.formData.expiry = expiry;
        }
      }
    };
    
    // Card brand helpers
    const getCardBrandIcon = (brand) => {
      const icons = {
        visa: 'mdi-credit-card',
        mastercard: 'mdi-credit-card',
        amex: 'mdi-credit-card',
        discover: 'mdi-credit-card',
        paypal: 'mdi-paypal',
      };
      return icons[brand?.toLowerCase()] || 'mdi-credit-card';
    };
    
    const getCardBrandColor = (brand) => {
      const colors = {
        visa: 'blue',
        mastercard: 'orange',
        amex: 'blue-darken-2',
        discover: 'orange-darken-1',
        paypal: 'blue-darken-1',
      };
      return colors[brand?.toLowerCase()] || 'grey';
    };
    
    const getCardBrandName = (brand) => {
      const names = {
        visa: 'Visa',
        mastercard: 'Mastercard',
        amex: 'American Express',
        discover: 'Discover',
        paypal: 'PayPal',
      };
      return names[brand?.toLowerCase()] || 'Card';
    };
    
    // API calls
    const fetchPaymentMethods = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const response = await store.dispatch('user/fetchPaymentMethods');
        paymentMethods.value = response?.data || [];
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        error.value = 'Failed to load payment methods. Please try again.';
      } finally {
        loading.value = false;
      }
    };
    
    const addPaymentMethod = async () => {
      if (!dialogs.addPayment.isFormValid) return;
      
      dialogs.addPayment.loading = true;
      
      try {
        // Parse expiry date
        const [month, year] = dialogs.addPayment.formData.expiry.split('/');
        
        const paymentData = {
          cardNumber: dialogs.addPayment.formData.cardNumber.replace(/\s/g, ''),
          cardName: dialogs.addPayment.formData.cardName,
          expMonth: month,
          expYear: `20${year}`, // Convert YY to YYYY
          cvv: dialogs.addPayment.formData.cvv,
          setDefault: dialogs.addPayment.formData.setDefault
        };
        
        await store.dispatch('user/addPaymentMethod', paymentData);
        
        // Reset form and close dialog
        dialogs.addPayment.formData = {
          cardNumber: '',
          cardName: '',
          expiry: '',
          cvv: '',
          setDefault: false
        };
        dialogs.addPayment.show = false;
        
        // Refresh payment methods
        await fetchPaymentMethods();
        
        toast.success('Payment method added successfully');
      } catch (err) {
        console.error('Error adding payment method:', err);
        error.value = err.response?.data?.message || 'Failed to add payment method. Please check your card details.';
        toast.error('Failed to add payment method');
      } finally {
        dialogs.addPayment.loading = false;
      }
    };
    
    const setDefaultPaymentMethod = async (paymentMethodId) => {
      try {
        await store.dispatch('user/setDefaultPaymentMethod', paymentMethodId);
        
        // Update local state
        paymentMethods.value = paymentMethods.value.map(method => ({
          ...method,
          isDefault: method.id === paymentMethodId
        }));
        
        toast.success('Default payment method updated');
      } catch (err) {
        console.error('Error setting default payment method:', err);
        toast.error('Failed to update default payment method');
      }
    };
    
    const openAddPaymentDialog = () => {
      dialogs.addPayment.show = true;
    };
    
    const openDeleteDialog = (method) => {
      dialogs.delete.method = method;
      dialogs.delete.show = true;
    };
    
    const deletePaymentMethod = async () => {
      if (!dialogs.delete.method) return;
      
      dialogs.delete.loading = true;
      
      try {
        await store.dispatch('user/deletePaymentMethod', dialogs.delete.method.id);
        
        // Remove from local state
        paymentMethods.value = paymentMethods.value.filter(m => m.id !== dialogs.delete.method.id);
        
        // Close dialog
        dialogs.delete.show = false;
        dialogs.delete.method = null;
        
        toast.success('Payment method deleted');
      } catch (err) {
        console.error('Error deleting payment method:', err);
        toast.error('Failed to delete payment method');
      } finally {
        dialogs.delete.loading = false;
      }
    };
    
    onMounted(fetchPaymentMethods);
    
    return {
      paymentForm,
      loading,
      error,
      paymentMethods,
      dialogs,
      rules,
      formatCardNumber,
      formatExpiryDate,
      getCardBrandIcon,
      getCardBrandColor,
      getCardBrandName,
      openAddPaymentDialog,
      openDeleteDialog,
      addPaymentMethod,
      deletePaymentMethod,
      setDefaultPaymentMethod
    };
  }
};
</script>