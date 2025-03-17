<template>
  <v-container>
    <h1 class="text-h4 mb-6">My Addresses</h1>
    
    <v-row>
      <!-- Add New Address Button -->
      <v-col cols="12" md="4" lg="3">
        <v-card
          height="100%"
          class="d-flex align-center justify-center new-address-card"
          @click="openAddressDialog()"
        >
          <div class="text-center">
            <v-icon size="48" color="primary">mdi-plus-circle</v-icon>
            <div class="text-body-1 mt-2">Add New Address</div>
          </div>
        </v-card>
      </v-col>
      
      <!-- Address Cards -->
      <v-col 
        v-for="address in addresses" 
        :key="address.id" 
        cols="12" md="4" lg="3"
      >
        <v-card class="fill-height">
          <v-card-title class="d-flex justify-space-between align-center">
            {{ address.label }}
            <v-badge
              v-if="address.is_default"
              color="success"
              content="Default"
              inline
            ></v-badge>
          </v-card-title>
          
          <v-card-text>
            <p class="text-body-1">{{ address.recipient_name }}</p>
            <p class="text-body-2">{{ address.phone }}</p>
            <p class="text-body-2">{{ formatAddress(address) }}</p>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              v-if="!address.is_default" 
              variant="text" 
              color="primary"
              @click="setDefaultAddress(address.id)"
            >
              Set as Default
            </v-btn>
            <v-btn 
              variant="text" 
              color="primary"
              @click="openAddressDialog(address)"
            >
              Edit
            </v-btn>
            <v-btn 
              variant="text" 
              color="error"
              @click="confirmDelete(address.id)"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Address Form Dialog -->
    <v-dialog v-model="addressDialog" max-width="500px">
      <v-card>
        <v-card-title>{{ editingAddress ? 'Edit Address' : 'Add New Address' }}</v-card-title>
        
        <v-card-text>
          <v-form ref="addressForm" v-model="isFormValid">
            <v-text-field
              v-model="addressForm.label"
              label="Address Label"
              placeholder="Home, Work, etc."
              :rules="[v => !!v || 'Label is required']"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="addressForm.recipient_name"
              label="Recipient Name"
              placeholder="Full Name"
              :rules="[v => !!v || 'Name is required']"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="addressForm.phone"
              label="Phone Number"
              placeholder="Phone Number"
              :rules="[
                v => !!v || 'Phone number is required',
                v => /^\d{10,11}$/.test(v) || 'Invalid phone number'
              ]"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="addressForm.street_address"
              label="Street Address"
              placeholder="Street Address"
              :rules="[v => !!v || 'Street address is required']"
              required
            ></v-textarea>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="addressForm.city"
                  label="City"
                  placeholder="City"
                  :rules="[v => !!v || 'City is required']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="addressForm.state"
                  label="State/Province"
                  placeholder="State/Province"
                  :rules="[v => !!v || 'State is required']"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="addressForm.postal_code"
                  label="Postal Code"
                  placeholder="Postal Code"
                  :rules="[v => !!v || 'Postal code is required']"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="addressForm.country"
                  :items="countries"
                  label="Country"
                  placeholder="Select Country"
                  :rules="[v => !!v || 'Country is required']"
                  required
                ></v-select>
              </v-col>
            </v-row>
            
            <v-checkbox
              v-model="addressForm.is_default"
              label="Set as default address"
            ></v-checkbox>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="addressDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            :disabled="!isFormValid || isSubmitting"
            :loading="isSubmitting"
            @click="saveAddress"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Delete Address</v-card-title>
        
        <v-card-text>
          Are you sure you want to delete this address?
          This action cannot be undone.
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            :loading="isDeleting"
            @click="deleteAddress"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { useToast } from '@/composables/useToast';
import axios from 'axios';

export default {
  name: 'AddressList',
  
  setup() {
    const { showSuccess, showError } = useToast();
    return { showSuccess, showError };
  },
  
  data() {
    return {
      addresses: [],
      addressDialog: false,
      deleteDialog: false,
      isFormValid: false,
      isSubmitting: false,
      isDeleting: false,
      addressIdToDelete: null,
      editingAddress: null,
      addressForm: {
        label: '',
        recipient_name: '',
        phone: '',
        street_address: '',
        city: '',
        state: '',
        postal_code: '',
        country: '',
        is_default: false
      },
      countries: ['Vietnam', 'United States', 'China', 'Japan', 'South Korea', 'Singapore']
    };
  },
  
  created() {
    this.fetchAddresses();
  },
  
  methods: {
    async fetchAddresses() {
      try {
        const response = await axios.get('/api/user/addresses');
        this.addresses = response.data;
      } catch (error) {
        console.error('Error fetching addresses:', error);
        this.showError('Failed to load addresses. Please try again.');
      }
    },
    
    formatAddress(address) {
      return `${address.street_address}, ${address.city}, ${address.state}, ${address.postal_code}, ${address.country}`;
    },
    
    openAddressDialog(address = null) {
      this.editingAddress = address;
      
      if (address) {
        // Edit mode - populate form with address data
        this.addressForm = { ...address };
      } else {
        // Add mode - reset form
        this.addressForm = {
          label: '',
          recipient_name: '',
          phone: '',
          street_address: '',
          city: '',
          state: '',
          postal_code: '',
          country: '',
          is_default: false
        };
      }
      
      this.addressDialog = true;
    },
    
    async saveAddress() {
      try {
        if (!this.$refs.addressForm.validate()) {
          return;
        }
        
        this.isSubmitting = true;
        
        if (this.editingAddress) {
          // Update existing address
          await axios.put(`/api/user/addresses/${this.editingAddress.id}`, this.addressForm);
          this.showSuccess('Address updated successfully');
        } else {
          // Create new address
          await axios.post('/api/user/addresses', this.addressForm);
          this.showSuccess('New address added successfully');
        }
        
        // Refresh addresses list
        await this.fetchAddresses();
        this.addressDialog = false;
      } catch (error) {
        console.error('Error saving address:', error);
        this.showError(error.response?.data?.message || 'Failed to save address. Please try again.');
      } finally {
        this.isSubmitting = false;
      }
    },
    
    confirmDelete(addressId) {
      this.addressIdToDelete = addressId;
      this.deleteDialog = true;
    },
    
    async deleteAddress() {
      try {
        this.isDeleting = true;
        await axios.delete(`/api/user/addresses/${this.addressIdToDelete}`);
        this.showSuccess('Address deleted successfully');
        
        // Refresh addresses list
        await this.fetchAddresses();
        this.deleteDialog = false;
      } catch (error) {
        console.error('Error deleting address:', error);
        this.showError(error.response?.data?.message || 'Failed to delete address. Please try again.');
      } finally {
        this.isDeleting = false;
        this.addressIdToDelete = null;
      }
    },
    
    async setDefaultAddress(addressId) {
      try {
        await axios.patch(`/api/user/addresses/${addressId}/default`);
        this.showSuccess('Default address updated');
        
        // Refresh addresses list
        await this.fetchAddresses();
      } catch (error) {
        console.error('Error setting default address:', error);
        this.showError('Failed to update default address. Please try again.');
      }
    }
  }
};
</script>

<style scoped>
.new-address-card {
  border: 2px dashed rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: all 0.3s;
}

.new-address-card:hover {
  border-color: var(--v-primary-base);
  background-color: rgba(var(--v-primary-base), 0.05);
}
</style>