<template>
  <div class="address-manager">
    <h2 class="text-h6 mb-4">Delivery Addresses</h2>
    
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
    
    <!-- Success Alert -->
    <v-alert
      v-if="successMessage"
      type="success"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="successMessage = ''"
    >
      {{ successMessage }}
    </v-alert>
    
    <!-- Add New Address Button -->
    <div class="d-flex justify-end mb-4">
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openAddAddressDialog()"
      >
        Add New Address
      </v-btn>
    </div>
    
    <!-- Empty State -->
    <v-card
      v-if="addresses.length === 0 && !loading"
      variant="outlined"
      class="text-center py-8 px-4"
    >
      <v-icon size="64" color="grey-lighten-1" icon="mdi-map-marker-off"></v-icon>
      <h3 class="text-h6 mt-4 mb-2">No Saved Addresses</h3>
      <p class="text-medium-emphasis mb-6">
        Add delivery addresses to make checkout faster
      </p>
      <v-btn
        color="primary"
        prepend-icon="mdi-map-marker-plus"
        @click="openAddAddressDialog()"
      >
        Add Address
      </v-btn>
    </v-card>
    
    <!-- Address List -->
    <v-card
      v-for="address in addresses"
      :key="address.id"
      class="mb-4"
      :class="{ 'border-success': address.isDefault }"
    >
      <v-card-text>
        <div class="d-flex justify-space-between">
          <div>
            <div class="d-flex align-center mb-1">
              <v-icon
                :icon="getAddressTypeIcon(address.type)"
                class="mr-2"
                :color="address.isDefault ? 'success' : undefined"
              ></v-icon>
              <h3 class="text-subtitle-1 font-weight-medium">
                {{ address.name }}
              </h3>
              <v-chip
                v-if="address.isDefault"
                size="small"
                color="success"
                class="ml-2"
              >
                Default
              </v-chip>
              <v-chip
                v-if="address.type"
                size="small"
                color="primary"
                variant="outlined"
                class="ml-2"
              >
                {{ formatAddressType(address.type) }}
              </v-chip>
            </div>
            
            <p class="text-body-2 mb-1">{{ address.streetAddress }}</p>
            <p class="text-body-2 mb-1" v-if="address.apartment">{{ address.apartment }}</p>
            <p class="text-body-2 mb-1">{{ address.city }}, {{ address.state }} {{ address.zipCode }}</p>
            
            <p v-if="address.instructions" class="text-body-2 text-medium-emphasis mt-2">
              <v-icon icon="mdi-information-outline" size="small" class="mr-1"></v-icon>
              {{ address.instructions }}
            </p>
          </div>
          
          <div class="d-flex flex-column">
            <v-btn
              v-if="!address.isDefault"
              variant="text"
              color="primary"
              size="small"
              class="mb-1"
              @click="setAsDefault(address.id)"
            >
              Set as Default
            </v-btn>
            <v-btn
              variant="text"
              color="primary"
              size="small"
              class="mb-1"
              @click="openEditDialog(address)"
            >
              Edit
            </v-btn>
            <v-btn
              variant="text"
              color="error"
              size="small"
              @click="openDeleteDialog(address)"
            >
              Delete
            </v-btn>
          </div>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Add/Edit Address Dialog -->
    <v-dialog v-model="addressDialog.show" max-width="600">
      <v-card>
        <v-card-title>
          {{ addressDialog.isEdit ? 'Edit Address' : 'Add New Address' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="addressForm" v-model="addressDialog.isFormValid">
            <v-text-field
              v-model="addressDialog.form.name"
              label="Address Name (e.g., Home, Work)"
              :rules="[rules.required]"
              variant="outlined"
              required
            ></v-text-field>
            
            <v-select
              v-model="addressDialog.form.type"
              label="Address Type"
              :items="addressTypes"
              item-title="text"
              item-value="value"
              variant="outlined"
              :rules="[rules.required]"
              required
            ></v-select>
            
            <v-text-field
              v-model="addressDialog.form.streetAddress"
              label="Street Address"
              :rules="[rules.required]"
              variant="outlined"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="addressDialog.form.apartment"
              label="Apartment, Suite, etc. (optional)"
              variant="outlined"
            ></v-text-field>
            
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressDialog.form.city"
                  label="City"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="6" sm="3">
                <v-text-field
                  v-model="addressDialog.form.state"
                  label="State"
                  :rules="[rules.required]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="6" sm="3">
                <v-text-field
                  v-model="addressDialog.form.zipCode"
                  label="ZIP Code"
                  :rules="[rules.required, rules.zipCode]"
                  variant="outlined"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-textarea
              v-model="addressDialog.form.instructions"
              label="Delivery Instructions (optional)"
              variant="outlined"
              rows="2"
              counter="200"
              hint="Special instructions for the delivery driver"
            ></v-textarea>
            
            <v-checkbox
              v-if="!addressDialog.isEdit || !addressDialog.form.isDefault"
              v-model="addressDialog.form.setAsDefault"
              label="Set as default address"
            ></v-checkbox>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="addressDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="addressDialog.loading"
            :disabled="!addressDialog.isFormValid || addressDialog.loading"
            @click="saveAddress"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title>Delete Address</v-card-title>
        
        <v-card-text>
          <p>Are you sure you want to delete this address?</p>
          <div v-if="deleteDialog.address" class="mt-3">
            <p class="font-weight-medium mb-1">{{ deleteDialog.address.name }}</p>
            <p class="text-body-2 mb-0">{{ deleteDialog.address.streetAddress }}</p>
            <p class="text-body-2 mb-0" v-if="deleteDialog.address.apartment">{{ deleteDialog.address.apartment }}</p>
            <p class="text-body-2">{{ deleteDialog.address.city }}, {{ deleteDialog.address.state }} {{ deleteDialog.address.zipCode }}</p>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="deleteDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deleteDialog.loading"
            @click="deleteAddress"
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
  name: 'AddressManager',
  
  setup() {
    const store = useStore();
    const toast = useToast();
    const addressForm = ref(null);
    
    // State
    const loading = ref(true);
    const error = ref('');
    const successMessage = ref('');
    const addresses = ref([]);
    
    // Address Type Options
    const addressTypes = [
      { text: 'Home', value: 'home' },
      { text: 'Work', value: 'work' },
      { text: 'Friend/Family', value: 'friend' },
      { text: 'Other', value: 'other' }
    ];
    
    // Form Dialogs
    const addressDialog = reactive({
      show: false,
      isEdit: false,
      isFormValid: false,
      loading: false,
      editId: null,
      form: {
        name: '',
        type: 'home',
        streetAddress: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: '',
        instructions: '',
        setAsDefault: false,
        isDefault: false
      }
    });
    
    const deleteDialog = reactive({
      show: false,
      loading: false,
      address: null
    });
    
    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      zipCode: v => /^\d{5}(-\d{4})?$/.test(v) || 'Invalid ZIP code format'
    };
    
    // Helper functions
    const getAddressTypeIcon = (type) => {
      const icons = {
        home: 'mdi-home',
        work: 'mdi-office-building',
        friend: 'mdi-account',
        other: 'mdi-map-marker'
      };
      return icons[type] || 'mdi-map-marker';
    };
    
    const formatAddressType = (type) => {
      const types = {
        home: 'Home',
        work: 'Work',
        friend: 'Friend/Family',
        other: 'Other'
      };
      return types[type] || 'Address';
    };
    
    const resetAddressForm = () => {
      addressDialog.form = {
        name: '',
        type: 'home',
        streetAddress: '',
        apartment: '',
        city: '',
        state: '',
        zipCode: '',
        instructions: '',
        setAsDefault: false,
        isDefault: false
      };
      addressDialog.isEdit = false;
      addressDialog.editId = null;
    };
    
    // API calls
    const fetchAddresses = async () => {
      loading.value = true;
      error.value = '';
      
      try {
        const response = await store.dispatch('user/fetchAddresses');
        addresses.value = response?.data || [];
      } catch (err) {
        console.error('Error fetching addresses:', err);
        error.value = 'Failed to load your addresses. Please try again.';
      } finally {
        loading.value = false;
      }
    };
    
    const saveAddress = async () => {
      if (!addressDialog.isFormValid) return;
      
      addressDialog.loading = true;
      error.value = '';
      successMessage.value = '';
      
      try {
        const addressData = {
          name: addressDialog.form.name,
          type: addressDialog.form.type,
          streetAddress: addressDialog.form.streetAddress,
          apartment: addressDialog.form.apartment,
          city: addressDialog.form.city,
          state: addressDialog.form.state,
          zipCode: addressDialog.form.zipCode,
          instructions: addressDialog.form.instructions
        };
        
        if (addressDialog.isEdit) {
          // Update existing address
          await store.dispatch('user/updateAddress', {
            id: addressDialog.editId,
            data: addressData
          });
          
          // Set as default if selected and not already default
          if (addressDialog.form.setAsDefault && !addressDialog.form.isDefault) {
            await store.dispatch('user/setDefaultAddress', addressDialog.editId);
          }
          
          successMessage.value = 'Address updated successfully';
          toast.success('Address updated successfully');
        } else {
          // Add new address
          const response = await store.dispatch('user/addAddress', addressData);
          
          // Set as default if selected
          if (addressDialog.form.setAsDefault) {
            await store.dispatch('user/setDefaultAddress', response.id);
          }
          
          successMessage.value = 'New address added successfully';
          toast.success('New address added successfully');
        }
        
        // Close dialog and refresh addresses
        addressDialog.show = false;
        await fetchAddresses();
      } catch (err) {
        console.error('Error saving address:', err);
        error.value = err.response?.data?.message || 'Failed to save address. Please try again.';
        toast.error('Failed to save address');
      } finally {
        addressDialog.loading = false;
      }
    };
    
    const setAsDefault = async (addressId) => {
      try {
        await store.dispatch('user/setDefaultAddress', addressId);
        
        // Update local state
        addresses.value = addresses.value.map(address => ({
          ...address,
          isDefault: address.id === addressId
        }));
        
        successMessage.value = 'Default address updated';
        toast.success('Default address updated');
      } catch (err) {
        console.error('Error setting default address:', err);
        error.value = 'Failed to set default address. Please try again.';
        toast.error('Failed to update default address');
      }
    };
    
    const deleteAddress = async () => {
      if (!deleteDialog.address) return;
      
      deleteDialog.loading = true;
      error.value = '';
      
      try {
        await store.dispatch('user/deleteAddress', deleteDialog.address.id);
        
        // Remove from local state
        addresses.value = addresses.value.filter(a => a.id !== deleteDialog.address.id);
        
        // Close dialog
        deleteDialog.show = false;
        deleteDialog.address = null;
        
        successMessage.value = 'Address deleted successfully';
        toast.success('Address deleted successfully');
      } catch (err) {
        console.error('Error deleting address:', err);
        error.value = 'Failed to delete address. Please try again.';
        toast.error('Failed to delete address');
      } finally {
        deleteDialog.loading = false;
      }
    };
    
    // Dialog functions
    const openAddAddressDialog = () => {
      resetAddressForm();
      addressDialog.show = true;
    };
    
    const openEditDialog = (address) => {
      resetAddressForm();
      
      addressDialog.isEdit = true;
      addressDialog.editId = address.id;
      addressDialog.form = {
        name: address.name,
        type: address.type || 'home',
        streetAddress: address.streetAddress,
        apartment: address.apartment || '',
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        instructions: address.instructions || '',
        setAsDefault: false,
        isDefault: address.isDefault
      };
      
      addressDialog.show = true;
    };
    
    const openDeleteDialog = (address) => {
      deleteDialog.address = address;
      deleteDialog.show = true;
    };
    
    onMounted(fetchAddresses);
    
    return {
      addressForm,
      loading,
      error,
      successMessage,
      addresses,
      addressTypes,
      addressDialog,
      deleteDialog,
      rules,
      getAddressTypeIcon,
      formatAddressType,
      openAddAddressDialog,
      openEditDialog,
      openDeleteDialog,
      saveAddress,
      setAsDefault,
      deleteAddress
    };
  }
};
</script>

<style scoped>
.border-success {
  border: 2px solid rgb(var(--v-theme-success));
}
</style>