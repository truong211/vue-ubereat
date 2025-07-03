<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card class="pa-6">
          <v-card-title class="text-h5 mb-4 d-flex justify-space-between align-center">
            <div>
              <v-icon start>mdi-map-marker-multiple</v-icon>
              Danh sách địa chỉ giao hàng
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openAddressDialog()"
              :disabled="isLoading"
            >
              Thêm địa chỉ mới
            </v-btn>
          </v-card-title>

          <v-card-text>
            <!-- Loading State -->
            <div v-if="isLoading" class="text-center py-8">
              <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
              <p class="mt-4">Đang tải danh sách địa chỉ...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="addresses.length === 0" class="text-center py-8">
              <v-icon size="80" color="grey-lighten-1">mdi-map-marker-off</v-icon>
              <h3 class="text-h5 mt-4 mb-2">Chưa có địa chỉ nào</h3>
              <p class="mb-4 text-medium-emphasis">
                Thêm địa chỉ giao hàng để thanh toán nhanh hơn
              </p>
              <v-btn
                color="primary"
                prepend-icon="mdi-plus"
                @click="openAddressDialog()"
              >
                Thêm địa chỉ đầu tiên
              </v-btn>
            </div>

            <!-- Address List -->
            <v-row v-else>
              <v-col
                v-for="address in addresses"
                :key="address.id"
                cols="12"
                md="6"
                lg="4"
              >
                <v-card
                  variant="outlined"
                  class="h-100"
                  :class="{ 'border-primary': address.isDefault }"
                >
                  <v-card-text>
                    <div class="d-flex justify-space-between align-start mb-3">
                      <div class="d-flex align-center">
                        <v-icon class="me-2" :color="address.isDefault ? 'primary' : 'grey'">
                          {{ getAddressTypeIcon(address.type) }}
                        </v-icon>
                        <h3 class="text-h6">{{ address.name }}</h3>
                      </div>
                      <v-chip
                        v-if="address.isDefault"
                        color="primary"
                        size="small"
                        variant="flat"
                      >
                        Mặc định
                      </v-chip>
                    </div>

                    <div class="address-details mb-4">
                      <p class="mb-1">{{ address.addressLine1 }}</p>
                      <p v-if="address.addressLine2" class="mb-1">{{ address.addressLine2 }}</p>
                      <p class="mb-1">
                        {{ address.ward }}, {{ address.district }}, {{ address.city }}
                      </p>
                      <p class="mb-1">{{ address.state }} {{ address.postalCode }}</p>
                      <p v-if="address.phone" class="text-body-2 text-medium-emphasis">
                        <v-icon size="small" class="me-1">mdi-phone</v-icon>
                        {{ address.phone }}
                      </p>
                      <p v-if="address.instructions" class="text-caption text-medium-emphasis mt-2">
                        <v-icon size="small" class="me-1">mdi-information-outline</v-icon>
                        {{ address.instructions }}
                      </p>
                    </div>

                    <div class="d-flex justify-space-between align-center">
                      <v-btn
                        v-if="!address.isDefault"
                        variant="text"
                        color="primary"
                        size="small"
                        @click="setDefaultAddress(address.id)"
                        :loading="settingDefault === address.id"
                      >
                        Đặt làm mặc định
                      </v-btn>
                      <div v-else></div>

                      <div>
                        <v-btn
                          icon="mdi-pencil"
                          variant="text"
                          size="small"
                          @click="openAddressDialog(address)"
                          :disabled="isUpdating"
                        ></v-btn>
                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          color="error"
                          size="small"
                          @click="confirmDeleteAddress(address)"
                          :disabled="isDeleting || (address.isDefault && addresses.length === 1)"
                        ></v-btn>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Address Form Dialog -->
    <v-dialog v-model="showAddressDialog" max-width="700" persistent>
      <v-card>
        <v-card-title class="text-h6">
          {{ editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="addressForm" v-model="isFormValid">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressData.name"
                  label="Tên địa chỉ *"
                  :rules="[rules.required]"
                  placeholder="Ví dụ: Nhà riêng, Văn phòng"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="addressData.type"
                  label="Loại địa chỉ"
                  :items="addressTypes"
                  variant="outlined"
                  density="comfortable"
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="addressData.addressLine1"
                  label="Địa chỉ chi tiết *"
                  :rules="[rules.required]"
                  placeholder="Số nhà, tên đường"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-text-field
                  v-model="addressData.addressLine2"
                  label="Địa chỉ bổ sung"
                  placeholder="Tòa nhà, khu dân cư, ..."
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="addressData.ward"
                  label="Phường/Xã *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="addressData.district"
                  label="Quận/Huyện *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="addressData.city"
                  label="Tỉnh/Thành phố *"
                  :rules="[rules.required]"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressData.postalCode"
                  label="Mã bưu điện *"
                  :rules="[rules.required, rules.postalCode]"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressData.phone"
                  label="Số điện thoại"
                  :rules="[rules.phone]"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressData.contactName"
                  label="Tên người nhận"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressData.contactPhone"
                  label="SĐT người nhận"
                  :rules="[rules.phone]"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressData.floor"
                  label="Tầng"
                  type="number"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressData.apartmentNumber"
                  label="Số căn hộ"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="addressData.instructions"
                  label="Ghi chú giao hàng"
                  placeholder="Hướng dẫn giao hàng, mã cổng, vị trí đặc biệt..."
                  variant="outlined"
                  density="comfortable"
                  rows="3"
                  auto-grow
                ></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-checkbox
                  v-model="addressData.hasElevator"
                  label="Có thang máy"
                  density="comfortable"
                ></v-checkbox>
              </v-col>

              <v-col cols="12">
                <v-checkbox
                  v-model="addressData.isDefault"
                  label="Đặt làm địa chỉ mặc định"
                  density="comfortable"
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeAddressDialog"
            :disabled="isSaving"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!isFormValid"
            :loading="isSaving"
            @click="saveAddress"
          >
            {{ editingAddress ? 'Cập nhật' : 'Thêm địa chỉ' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Xác nhận xóa địa chỉ</v-card-title>
        <v-card-text>
          Bạn có chắc chắn muốn xóa địa chỉ này không? Hành động này không thể hoàn tác.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
            :disabled="isDeleting"
          >
            Hủy
          </v-btn>
          <v-btn
            color="error"
            :loading="isDeleting"
            @click="deleteAddress"
          >
            Xóa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, reactive, computed, inject, onMounted } from 'vue';
import { useStore } from 'vuex';
import { addressService } from '@/services/address.service';

export default {
  name: 'AddressManagement',
  
  setup() {
    const store = useStore();
    const showNotification = inject('showNotification');
    
    const addressForm = ref(null);
    const isLoading = ref(false);
    const isSaving = ref(false);
    const isDeleting = ref(false);
    const isUpdating = ref(false);
    const settingDefault = ref(null);
    const isFormValid = ref(false);
    const showAddressDialog = ref(false);
    const showDeleteDialog = ref(false);
    const editingAddress = ref(null);
    const addressToDelete = ref(null);

    // Get addresses from store
    const addresses = computed(() => store.getters['user/addresses'] || []);

    // Address form data
    const addressData = reactive({
      name: '',
      type: 'home',
      addressLine1: '',
      addressLine2: '',
      ward: '',
      district: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Vietnam',
      phone: '',
      contactName: '',
      contactPhone: '',
      floor: null,
      apartmentNumber: '',
      instructions: '',
      hasElevator: true,
      isDefault: false
    });

    // Address types
    const addressTypes = [
      { title: 'Nhà riêng', value: 'home' },
      { title: 'Văn phòng', value: 'work' },
      { title: 'Khác', value: 'other' }
    ];

    // Validation rules
    const rules = {
      required: value => !!value || 'Trường này là bắt buộc',
      postalCode: value => {
        if (!value) return 'Mã bưu điện là bắt buộc';
        const pattern = /^\d{5,6}$/;
        return pattern.test(value) || 'Mã bưu điện không hợp lệ';
      },
      phone: value => {
        if (!value) return true; // Optional
        const pattern = /^[0-9+\-\s()]+$/;
        return pattern.test(value) || 'Số điện thoại không hợp lệ';
      }
    };

    /**
     * Get icon for address type
     */
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

    /**
     * Reset address form
     */
    const resetAddressForm = () => {
      Object.assign(addressData, {
        name: '',
        type: 'home',
        addressLine1: '',
        addressLine2: '',
        ward: '',
        district: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Vietnam',
        phone: '',
        contactName: '',
        contactPhone: '',
        floor: null,
        apartmentNumber: '',
        instructions: '',
        hasElevator: true,
        isDefault: false
      });
      editingAddress.value = null;
    };

    /**
     * Open address dialog for add/edit
     */
    const openAddressDialog = (address = null) => {
      if (address) {
        editingAddress.value = address;
        Object.assign(addressData, address);
      } else {
        resetAddressForm();
      }
      showAddressDialog.value = true;
    };

    /**
     * Close address dialog
     */
    const closeAddressDialog = () => {
      showAddressDialog.value = false;
      resetAddressForm();
      if (addressForm.value) {
        addressForm.value.resetValidation();
      }
    };

    /**
     * Save address (create or update)
     */
    const saveAddress = async () => {
      if (!isFormValid.value) return;

      isSaving.value = true;
      try {
        if (editingAddress.value) {
          // Update existing address
          await addressService.updateAddress(editingAddress.value.id, addressData);
          showNotification('Cập nhật địa chỉ thành công', 'success');
        } else {
          // Create new address
          await addressService.createAddress(addressData);
          showNotification('Thêm địa chỉ thành công', 'success');
        }
        
        // Refresh addresses list
        await loadAddresses();
        closeAddressDialog();
      } catch (error) {
        console.error('Error saving address:', error);
        const message = error.response?.data?.message || 'Không thể lưu địa chỉ';
        showNotification(message, 'error');
      } finally {
        isSaving.value = false;
      }
    };

    /**
     * Confirm delete address
     */
    const confirmDeleteAddress = (address) => {
      addressToDelete.value = address;
      showDeleteDialog.value = true;
    };

    /**
     * Delete address
     */
    const deleteAddress = async () => {
      if (!addressToDelete.value) return;

      isDeleting.value = true;
      try {
        await addressService.deleteAddress(addressToDelete.value.id);
        showNotification('Xóa địa chỉ thành công', 'success');
        await loadAddresses();
        showDeleteDialog.value = false;
        addressToDelete.value = null;
      } catch (error) {
        console.error('Error deleting address:', error);
        const message = error.response?.data?.message || 'Không thể xóa địa chỉ';
        showNotification(message, 'error');
      } finally {
        isDeleting.value = false;
      }
    };

    /**
     * Set address as default
     */
    const setDefaultAddress = async (addressId) => {
      settingDefault.value = addressId;
      try {
        await addressService.setDefaultAddress(addressId);
        showNotification('Đặt địa chỉ mặc định thành công', 'success');
        await loadAddresses();
      } catch (error) {
        console.error('Error setting default address:', error);
        const message = error.response?.data?.message || 'Không thể đặt địa chỉ mặc định';
        showNotification(message, 'error');
      } finally {
        settingDefault.value = null;
      }
    };

    /**
     * Load addresses from API
     */
    const loadAddresses = async () => {
      isLoading.value = true;
      try {
        await store.dispatch('user/fetchAddresses');
      } catch (error) {
        console.error('Error loading addresses:', error);
        showNotification('Không thể tải danh sách địa chỉ', 'error');
      } finally {
        isLoading.value = false;
      }
    };

    onMounted(() => {
      loadAddresses();
    });

    return {
      addressForm,
      isLoading,
      isSaving,
      isDeleting,
      isUpdating,
      settingDefault,
      isFormValid,
      showAddressDialog,
      showDeleteDialog,
      editingAddress,
      addressToDelete,
      addresses,
      addressData,
      addressTypes,
      rules,
      getAddressTypeIcon,
      openAddressDialog,
      closeAddressDialog,
      saveAddress,
      confirmDeleteAddress,
      deleteAddress,
      setDefaultAddress
    };
  }
};
</script>

<style scoped>
.address-details {
  line-height: 1.6;
}

.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.border-primary {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px;
}
</style>