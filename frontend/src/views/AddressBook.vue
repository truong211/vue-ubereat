<template>
  <v-container class="address-book py-8">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">My Addresses</h1>

        <div v-if="loading" class="text-center py-6">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">Loading your addresses...</p>
        </div>

        <template v-else>
          <!-- Address Actions -->
          <div class="d-flex justify-space-between align-center mb-6">
            <span class="text-subtitle-1">
              {{ addresses.length }} {{ addresses.length === 1 ? 'address' : 'addresses' }} saved
            </span>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showAddressDialog = true"
              :disabled="loading"
            >
              Add New Address
            </v-btn>
          </div>

          <!-- No Addresses Message -->
          <v-sheet v-if="addresses.length === 0" class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-map-marker-off</v-icon>
            <h3 class="text-h5 mt-4 mb-2">No addresses yet</h3>
            <p class="mb-4 text-medium-emphasis">
              Add delivery addresses to make your checkout faster
            </p>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="showAddressDialog = true"
            >
              Add New Address
            </v-btn>
          </v-sheet>

          <!-- Address List -->
          <v-row v-else>
            <v-col
              v-for="address in addresses"
              :key="address.id"
              cols="12"
              sm="6"
              lg="4"
            >
              <v-card class="h-100">
                <v-card-text>
                  <div class="d-flex justify-space-between">
                    <div class="d-flex align-center">
                      <v-icon size="24" class="mr-2">{{ getAddressTypeIcon(address.type) }}</v-icon>
                      <h3 class="text-h6">{{ address.name }}</h3>
                    </div>
                    <v-chip
                      v-if="address.isDefault"
                      color="success"
                      size="small"
                    >
                      Default
                    </v-chip>
                  </div>

                  <div class="address-details my-4">
                    <p class="mb-1">{{ address.street }}</p>
                    <p class="mb-1">{{ address.city }}, {{ address.state }} {{ address.zipCode }}</p>
                    <p class="text-caption text-medium-emphasis" v-if="address.instructions">
                      <v-icon size="small" color="grey">mdi-information-outline</v-icon>
                      {{ address.instructions }}
                    </p>
                  </div>

                  <div class="d-flex justify-end">
                    <v-btn
                      v-if="!address.isDefault"
                      variant="text"
                      color="primary"
                      @click="setDefaultAddress(address.id)"
                      :disabled="settingDefault"
                      class="mr-2"
                    >
                      Set as Default
                    </v-btn>
                    <v-menu location="bottom end">
                      <template v-slot:activator="{ props }">
                        <v-btn
                          icon="mdi-dots-vertical"
                          variant="text"
                          v-bind="props"
                        ></v-btn>
                      </template>
                      <v-list>
                        <v-list-item
                          prepend-icon="mdi-pencil"
                          title="Edit"
                          @click="editAddress(address)"
                        ></v-list-item>
                        <v-list-item
                          prepend-icon="mdi-delete"
                          title="Delete"
                          @click="confirmDelete(address)"
                          :disabled="address.isDefault && addresses.length > 1"
                        ></v-list-item>
                      </v-list>
                    </v-menu>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </template>
      </v-col>
    </v-row>

    <!-- Address Form Dialog -->
    <v-dialog v-model="showAddressDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editedAddress ? 'Edit Address' : 'Add New Address' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="addressForm" v-model="isFormValid">
            <v-text-field
              v-model="addressForm.name"
              label="Address Name (e.g., Home, Work)"
              :rules="[v => !!v || 'Address name is required']"
              required
            ></v-text-field>

            <v-select
              v-model="addressForm.type"
              label="Address Type"
              :items="addressTypes"
              required
            ></v-select>

            <v-text-field
              v-model="addressForm.street"
              label="Street Address"
              :rules="[v => !!v || 'Street address is required']"
              required
            ></v-text-field>

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressForm.city"
                  label="City"
                  :rules="[v => !!v || 'City is required']"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="3">
                <v-text-field
                  v-model="addressForm.state"
                  label="State"
                  :rules="[v => !!v || 'State is required']"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="3">
                <v-text-field
                  v-model="addressForm.zipCode"
                  label="ZIP Code"
                  :rules="[
                    v => !!v || 'ZIP code is required',
                    v => /^\d{5}(-\d{4})?$/.test(v) || 'Invalid ZIP code format'
                  ]"
                  required
                ></v-text-field>
              </v-col>
            </v-row>

            <v-textarea
              v-model="addressForm.instructions"
              label="Delivery Instructions (Optional)"
              hint="E.g., gate code, landmark, preferred entrance"
              rows="2"
              auto-grow
            ></v-textarea>

            <v-checkbox
              v-if="!editedAddress || !editedAddress.isDefault"
              v-model="addressForm.isDefault"
              label="Set as default address"
            ></v-checkbox>
          </v-form>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeAddressDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!isFormValid"
            :loading="saving"
            @click="saveAddress"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Address?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this address? This action cannot be undone.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="deleteAddress"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
    >
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'AddressBook',
  
  setup() {
    const store = useStore();
    
    // State
    const loading = ref(true);
    const saving = ref(false);
    const deleting = ref(false);
    const settingDefault = ref(false);
    const isFormValid = ref(false);
    const showAddressDialog = ref(false);
    const showDeleteDialog = ref(false);
    const addressForm = reactive({
      name: '',
      type: 'home',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      instructions: '',
      isDefault: false
    });
    const editedAddress = ref(null);
    const addressToDelete = ref(null);
    const snackbar = reactive({
      show: false,
      text: '',
      color: 'success',
      timeout: 3000
    });
    
    // Address types for select dropdown
    const addressTypes = [
      { title: 'Home', value: 'home' },
      { title: 'Work', value: 'work' },
      { title: 'Other', value: 'other' }
    ];

    // Get addresses from store
    const addresses = computed(() => store.state.profile?.addresses || []);
    
    // Reset form to default state
    const resetForm = () => {
      addressForm.name = '';
      addressForm.type = 'home';
      addressForm.street = '';
      addressForm.city = '';
      addressForm.state = '';
      addressForm.zipCode = '';
      addressForm.instructions = '';
      addressForm.isDefault = false;
      editedAddress.value = null;
    };

    // Close address dialog
    const closeAddressDialog = () => {
      showAddressDialog.value = false;
      resetForm();
    };

    // Edit address
    const editAddress = (address) => {
      editedAddress.value = address;
      addressForm.name = address.name;
      addressForm.type = address.type;
      addressForm.street = address.street;
      addressForm.city = address.city;
      addressForm.state = address.state;
      addressForm.zipCode = address.zipCode;
      addressForm.instructions = address.instructions || '';
      addressForm.isDefault = address.isDefault;
      showAddressDialog.value = true;
    };

    // Confirm delete
    const confirmDelete = (address) => {
      addressToDelete.value = address;
      showDeleteDialog.value = true;
    };

    // Save address
    const saveAddress = async () => {
      saving.value = true;
      
      try {
        if (editedAddress.value) {
          // Update existing address
          await store.dispatch('profile/updateAddress', {
            id: editedAddress.value.id,
            name: addressForm.name,
            type: addressForm.type,
            street: addressForm.street,
            city: addressForm.city,
            state: addressForm.state,
            zipCode: addressForm.zipCode,
            instructions: addressForm.instructions,
            isDefault: addressForm.isDefault
          });
          
          showSnackbar('Address updated successfully');
        } else {
          // Add new address
          await store.dispatch('profile/addAddress', {
            name: addressForm.name,
            type: addressForm.type,
            street: addressForm.street,
            city: addressForm.city,
            state: addressForm.state,
            zipCode: addressForm.zipCode,
            instructions: addressForm.instructions,
            isDefault: addressForm.isDefault
          });
          
          showSnackbar('New address added successfully');
        }
        
        closeAddressDialog();
        fetchAddresses();
      } catch (error) {
        console.error('Error saving address:', error);
        showSnackbar('Failed to save address. Please try again.', 'error');
      } finally {
        saving.value = false;
      }
    };

    // Delete address
    const deleteAddress = async () => {
      if (!addressToDelete.value) return;
      
      deleting.value = true;
      
      try {
        await store.dispatch('profile/deleteAddress', addressToDelete.value.id);
        showDeleteDialog.value = false;
        showSnackbar('Address deleted successfully');
        fetchAddresses();
      } catch (error) {
        console.error('Error deleting address:', error);
        showSnackbar('Failed to delete address. Please try again.', 'error');
      } finally {
        deleting.value = false;
        addressToDelete.value = null;
      }
    };

    // Set address as default
    const setDefaultAddress = async (addressId) => {
      settingDefault.value = true;
      
      try {
        await store.dispatch('profile/setDefaultAddress', addressId);
        showSnackbar('Default address updated');
        fetchAddresses();
      } catch (error) {
        console.error('Error setting default address:', error);
        showSnackbar('Failed to update default address. Please try again.', 'error');
      } finally {
        settingDefault.value = false;
      }
    };

    // Get appropriate icon for address type
    const getAddressTypeIcon = (type) => {
      switch (type) {
        case 'home':
          return 'mdi-home';
        case 'work':
          return 'mdi-office-building';
        default:
          return 'mdi-map-marker';
      }
    };

    // Show snackbar with message
    const showSnackbar = (text, color = 'success') => {
      snackbar.text = text;
      snackbar.color = color;
      snackbar.show = true;
    };

    // Fetch addresses from API
    const fetchAddresses = async () => {
      loading.value = true;
      
      try {
        await store.dispatch('profile/fetchAddresses');
      } catch (error) {
        console.error('Error fetching addresses:', error);
        showSnackbar('Failed to load addresses', 'error');
      } finally {
        loading.value = false;
      }
    };

    // Initialize component
    onMounted(() => {
      fetchAddresses();
    });

    return {
      addresses,
      loading,
      saving,
      deleting,
      settingDefault,
      isFormValid,
      showAddressDialog,
      showDeleteDialog,
      addressForm,
      editedAddress,
      addressToDelete,
      snackbar,
      addressTypes,
      closeAddressDialog,
      editAddress,
      confirmDelete,
      saveAddress,
      deleteAddress,
      setDefaultAddress,
      getAddressTypeIcon
    };
  }
};
</script>

<style scoped>
.address-book {
  max-width: 1200px;
}

.address-details {
  line-height: 1.5;
}
</style>