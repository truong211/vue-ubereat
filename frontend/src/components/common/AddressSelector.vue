<template>
  <div class="address-selector">
    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center py-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else>
      <!-- Address Selection -->
      <div v-if="addresses.length > 0 && !showNewAddressForm">
        <v-radio-group
          v-model="selectedAddressId"
          @change="emitSelectedAddress"
        >
          <v-card
            v-for="address in addresses"
            :key="address.id"
            :class="['mb-3', {'selected-address': selectedAddressId === address.id}]"
            :variant="selectedAddressId === address.id ? 'outlined' : 'flat'"
            :color="selectedAddressId === address.id ? 'primary' : undefined"
            border
          >
            <v-card-item class="pa-3">
              <div class="d-flex">
                <v-radio
                  :value="address.id"
                  class="mt-0 mr-2"
                  density="compact"
                  hide-details
                ></v-radio>
                <div>
                  <div class="d-flex align-center">
                    <div class="font-weight-medium">{{ address.name }}</div>
                    <v-chip
                      v-if="address.isDefault"
                      size="x-small"
                      color="primary"
                      class="ml-2"
                    >Default</v-chip>
                  </div>
                  <div class="text-body-2">
                    {{ address.street }}, {{ address.city }}, {{ address.state }} {{ address.zipcode }}
                  </div>
                  <div class="text-caption text-medium-emphasis">
                    {{ address.instructions }}
                  </div>
                </div>

                <v-spacer></v-spacer>

                <div>
                  <v-btn
                    icon="mdi-pencil"
                    size="small"
                    variant="text"
                    @click.stop="editAddress(address)"
                  ></v-btn>
                  <v-btn
                    v-if="!address.isDefault"
                    icon="mdi-delete"
                    size="small"
                    variant="text"
                    color="error"
                    @click.stop="confirmDeleteAddress(address)"
                  ></v-btn>
                </div>
              </div>
            </v-card-item>
          </v-card>
        </v-radio-group>

        <div class="d-flex align-center mt-4">
          <v-btn
            prepend-icon="mdi-plus"
            variant="outlined"
            @click="showNewAddressForm = true"
          >
            Add New Address
          </v-btn>
          
          <v-btn
            v-if="showDetectLocation"
            prepend-icon="mdi-crosshairs-gps"
            variant="text"
            class="ml-auto"
            :loading="detectingLocation"
            @click="detectLocation"
          >
            Use Current Location
          </v-btn>
        </div>
      </div>

      <!-- Empty State or New Address Form State -->
      <div v-else>
        <v-form
          ref="addressForm"
          v-model="isFormValid"
          @submit.prevent="saveAddress"
        >
          <v-sheet
            v-if="addresses.length === 0 && !showNewAddressForm"
            class="text-center pa-4 mb-4"
            rounded
            border
          >
            <v-icon icon="mdi-map-marker" color="primary" size="56" class="mb-2"></v-icon>
            <div class="text-h6 mb-2">No addresses saved</div>
            <div class="text-body-2 mb-4">Save your addresses for faster checkout</div>
          </v-sheet>

          <div class="mb-4">
            <v-text-field
              v-model="addressForm.name"
              label="Address Name"
              placeholder="Home, Work, etc."
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Address name is required']"
            ></v-text-field>
          </div>

          <div class="mb-4">
            <v-text-field
              v-model="addressForm.street"
              label="Street Address"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Street address is required']"
              autocomplete="street-address"
            ></v-text-field>
          </div>

          <div class="mb-4">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressForm.city"
                  label="City"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'City is required']"
                  autocomplete="address-level2"
                ></v-text-field>
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field
                  v-model="addressForm.state"
                  label="State"
                  variant="outlined"
                  density="comfortable"
                  :rules="[v => !!v || 'State is required']"
                  autocomplete="address-level1"
                ></v-text-field>
              </v-col>
              <v-col cols="6" sm="3">
                <v-text-field
                  v-model="addressForm.zipcode"
                  label="ZIP Code"
                  variant="outlined"
                  density="comfortable"
                  :rules="[
                    v => !!v || 'ZIP code is required',
                    v => /^\d{5}(-\d{4})?$/.test(v) || 'Invalid ZIP format'
                  ]"
                  autocomplete="postal-code"
                ></v-text-field>
              </v-col>
            </v-row>
          </div>

          <div class="mb-4">
            <v-textarea
              v-model="addressForm.instructions"
              label="Delivery Instructions (optional)"
              hint="E.g., gate code, landmark, preferred entrance"
              variant="outlined"
              density="comfortable"
              rows="2"
              auto-grow
            ></v-textarea>
          </div>

          <div class="mb-4">
            <v-checkbox
              v-model="addressForm.isDefault"
              label="Set as default address"
              density="comfortable"
              hide-details
            ></v-checkbox>
          </div>

          <div class="d-flex">
            <v-btn
              v-if="addresses.length > 0 || addressForm.id"
              variant="text"
              @click="cancelAddressForm"
            >
              Cancel
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              type="submit"
              color="primary"
              :loading="savingAddress"
              :disabled="!isFormValid || savingAddress"
            >
              {{ addressForm.id ? 'Update' : 'Save' }} Address
            </v-btn>
          </div>
        </v-form>
      </div>

      <!-- Error Alert -->
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mt-4"
        @click:close="error = ''"
      >
        {{ error }}
      </v-alert>
    </div>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Address</v-card-title>
        <v-card-text>
          Are you sure you want to delete this address?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" @click="deleteAddress">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue'
import addressService from '@/services/address.service'

export default {
  name: 'AddressSelector',
  
  props: {
    // Initial selected address ID
    modelValue: {
      type: [Number, null],
      default: null
    },
    
    // Whether to show detect location button
    showDetectLocation: {
      type: Boolean,
      default: true
    }
  },
  
  emits: ['update:modelValue', 'address-selected', 'address-saved', 'address-deleted', 'error'],
  
  setup(props, { emit }) {
    // State
    const loading = ref(false)
    const addresses = ref([])
    const selectedAddressId = ref(props.modelValue)
    const showNewAddressForm = ref(false)
    const isFormValid = ref(false)
    const formRef = ref(null)
    const addressForm = ref({
      id: null,
      name: '',
      street: '',
      city: '',
      state: '',
      zipcode: '',
      instructions: '',
      isDefault: false
    })
    const savingAddress = ref(false)
    const error = ref('')
    const deleteDialog = ref(false)
    const addressToDelete = ref(null)
    const detectingLocation = ref(false)
    
    // Watch for prop changes
    watch(() => props.modelValue, (newVal) => {
      selectedAddressId.value = newVal
    })
    
    // Load addresses on mount
    onMounted(async () => {
      await loadAddresses()
      
      // If no address is selected but we have addresses, select the default or first one
      if (!selectedAddressId.value && addresses.value.length > 0) {
        const defaultAddress = addresses.value.find(a => a.isDefault)
        selectedAddressId.value = defaultAddress ? defaultAddress.id : addresses.value[0].id
        emitSelectedAddress()
      }
    })
    
    // Load user addresses
    const loadAddresses = async () => {
      loading.value = true
      error.value = ''
      
      try {
        addresses.value = await addressService.getUserAddresses()
        
        // Show new address form if no addresses
        if (addresses.value.length === 0) {
          showNewAddressForm.value = true
        }
      } catch (err) {
        error.value = 'Failed to load addresses. Please try again.'
        emit('error', error.value)
      } finally {
        loading.value = false
      }
    }
    
    // Emit selected address
    const emitSelectedAddress = () => {
      emit('update:modelValue', selectedAddressId.value)
      
      const selectedAddress = addresses.value.find(addr => addr.id === selectedAddressId.value)
      if (selectedAddress) {
        emit('address-selected', selectedAddress)
      }
    }
    
    // Edit address
    const editAddress = (address) => {
      addressForm.value = { ...address }
      showNewAddressForm.value = true
    }
    
    // Cancel address form
    const cancelAddressForm = () => {
      addressForm.value = {
        id: null,
        name: '',
        street: '',
        city: '',
        state: '',
        zipcode: '',
        instructions: '',
        isDefault: false
      }
      
      if (addresses.value.length > 0) {
        showNewAddressForm.value = false
      }
    }
    
    // Save address
    const saveAddress = async () => {
      if (!isFormValid.value) return
      
      savingAddress.value = true
      error.value = ''
      
      try {
        let savedAddress
        
        if (addressForm.value.id) {
          // Update existing address
          savedAddress = await addressService.updateAddress(
            addressForm.value.id,
            addressForm.value
          )
          
          // Update the address in the list
          const index = addresses.value.findIndex(a => a.id === savedAddress.id)
          if (index !== -1) {
            addresses.value[index] = savedAddress
          }
        } else {
          // Create new address
          savedAddress = await addressService.createAddress(addressForm.value)
          addresses.value.push(savedAddress)
        }
        
        // If this is now the default address, update other addresses
        if (savedAddress.isDefault) {
          addresses.value.forEach(addr => {
            if (addr.id !== savedAddress.id) {
              addr.isDefault = false
            }
          })
        }
        
        // Select the saved address
        selectedAddressId.value = savedAddress.id
        emitSelectedAddress()
        
        // Reset form and hide it if we have addresses
        cancelAddressForm()
        
        // Emit event
        emit('address-saved', savedAddress)
      } catch (err) {
        error.value = err.message || 'Failed to save address. Please try again.'
        emit('error', error.value)
      } finally {
        savingAddress.value = false
      }
    }
    
    // Confirm address deletion
    const confirmDeleteAddress = (address) => {
      addressToDelete.value = address
      deleteDialog.value = true
    }
    
    // Delete address
    const deleteAddress = async () => {
      if (!addressToDelete.value) return
      
      error.value = ''
      
      try {
        await addressService.deleteAddress(addressToDelete.value.id)
        
        // Remove from list
        addresses.value = addresses.value.filter(a => a.id !== addressToDelete.value.id)
        
        // If the deleted address was selected, select another one
        if (selectedAddressId.value === addressToDelete.value.id) {
          selectedAddressId.value = addresses.value.length > 0 ? addresses.value[0].id : null
          emitSelectedAddress()
        }
        
        // Emit event
        emit('address-deleted', addressToDelete.value.id)
        
        // Show form if no addresses left
        if (addresses.value.length === 0) {
          showNewAddressForm.value = true
        }
      } catch (err) {
        error.value = 'Failed to delete address. Please try again.'
        emit('error', error.value)
      } finally {
        deleteDialog.value = false
        addressToDelete.value = null
      }
    }
    
    // Detect current location
    const detectLocation = async () => {
      detectingLocation.value = true
      error.value = ''
      
      try {
        const location = await addressService.getCurrentLocation()
        
        if (location && location.street) {
          // Fill form with detected location
          addressForm.value = {
            id: null,
            name: 'Current Location',
            street: location.street || '',
            city: location.city || '',
            state: location.state || '',
            zipcode: location.zipcode || '',
            instructions: '',
            isDefault: addresses.value.length === 0
          }
          
          showNewAddressForm.value = true
        } else {
          error.value = 'Could not determine your address. Please enter it manually.'
        }
      } catch (err) {
        error.value = 'Failed to detect your location. Please try again or enter address manually.'
        emit('error', error.value)
      } finally {
        detectingLocation.value = false
      }
    }
    
    return {
      loading,
      addresses,
      selectedAddressId,
      showNewAddressForm,
      isFormValid,
      formRef,
      addressForm,
      savingAddress,
      error,
      deleteDialog,
      addressToDelete,
      detectingLocation,
      emitSelectedAddress,
      editAddress,
      cancelAddressForm,
      saveAddress,
      confirmDeleteAddress,
      deleteAddress,
      detectLocation
    }
  }
}
</script>

<style scoped>
.selected-address {
  border: 2px solid var(--v-primary-base) !important;
}

.address-selector {
  position: relative;
}

@media (max-width: 600px) {
  .address-card-actions {
    display: flex;
    flex-direction: column;
  }
}
</style>
