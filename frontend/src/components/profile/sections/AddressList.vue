<template>
  <div class="address-list">
    <v-card>
      <v-card-text>
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-h6">Địa chỉ giao hàng</h3>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="showAddDialog = true"
          >
            Thêm địa chỉ
          </v-btn>
        </div>

        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <p class="mt-4">Đang tải địa chỉ...</p>
        </div>

        <div v-else-if="error" class="text-center py-8">
          <v-icon size="48" color="error" class="mb-4">mdi-alert-circle</v-icon>
          <p class="text-body-1">{{ error }}</p>
          <v-btn color="primary" class="mt-4" @click="loadAddresses">
            Thử lại
          </v-btn>
        </div>

        <div v-else-if="!addresses.length" class="text-center py-8">
          <v-icon size="48" color="grey" class="mb-4">mdi-map-marker</v-icon>
          <p class="text-body-1">Bạn chưa có địa chỉ giao hàng nào</p>
          <v-btn color="primary" class="mt-4" @click="showAddDialog = true">
            Thêm địa chỉ mới
          </v-btn>
        </div>

        <v-list v-else>
          <template v-for="(address, index) in addresses" :key="address.id">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon :color="address.isDefault ? 'primary' : 'grey'">
                  mdi-map-marker
                </v-icon>
              </template>

              <v-list-item-title class="font-weight-bold mb-1">
                {{ address.name }}
                <v-chip
                  v-if="address.isDefault"
                  color="primary"
                  size="x-small"
                  class="ml-2"
                >
                  Mặc định
                </v-chip>
              </v-list-item-title>

              <v-list-item-subtitle>
                {{ address.address }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  @click="editAddress(address)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="deleteAddress(address)"
                ></v-btn>
              </template>
            </v-list-item>

            <v-divider v-if="index < addresses.length - 1"></v-divider>
          </template>
        </v-list>
      </v-card-text>
    </v-card>

    <!-- Add/Edit Address Dialog -->
    <v-dialog v-model="showAddDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ editingAddress ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="isValid" @submit.prevent="saveAddress">
            <v-text-field
              v-model="formData.name"
              label="Tên địa chỉ"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="formData.address"
              label="Địa chỉ chi tiết"
              :rules="[rules.required]"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="formData.phone"
              label="Số điện thoại"
              :rules="[rules.required, rules.phone]"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            ></v-text-field>

            <v-checkbox
              v-model="formData.isDefault"
              label="Đặt làm địa chỉ mặc định"
            ></v-checkbox>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showAddDialog = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="saving"
            :disabled="!isValid || saving"
            @click="saveAddress"
          >
            {{ editingAddress ? 'Cập nhật' : 'Thêm' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Xác nhận xóa</v-card-title>
        <v-card-text>
          Bạn có chắc chắn muốn xóa địa chỉ này?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showDeleteDialog = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="error"
            :loading="deleting"
            @click="confirmDelete"
          >
            Xóa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { useToast } from 'vue-toastification'

export default {
  name: 'AddressList',

  setup() {
    const toast = useToast()
    const form = ref(null)
    
    // State
    const addresses = ref([])
    const loading = ref(true)
    const error = ref(null)
    const saving = ref(false)
    const deleting = ref(false)
    const isValid = ref(false)
    const showAddDialog = ref(false)
    const showDeleteDialog = ref(false)
    const editingAddress = ref(null)
    const addressToDelete = ref(null)

    // Form data
    const formData = reactive({
      name: '',
      address: '',
      phone: '',
      isDefault: false
    })

    // Validation rules
    const rules = {
      required: v => !!v || 'Trường này là bắt buộc',
      phone: v => !v || /^(\+84|0)\d{9,10}$/.test(v) || 'Số điện thoại không hợp lệ'
    }

    // Methods
    const loadAddresses = async () => {
      loading.value = true
      error.value = null
      
      try {
        const response = await axios.get('/api/addresses')
        addresses.value = response.data
      } catch (err) {
        console.error('Error loading addresses:', err)
        error.value = 'Không thể tải danh sách địa chỉ'
      } finally {
        loading.value = false
      }
    }

    const resetForm = () => {
      formData.name = ''
      formData.address = ''
      formData.phone = ''
      formData.isDefault = false
      editingAddress.value = null
      form.value?.resetValidation()
    }

    const editAddress = (address) => {
      editingAddress.value = address
      formData.name = address.name
      formData.address = address.address
      formData.phone = address.phone
      formData.isDefault = address.isDefault
      showAddDialog.value = true
    }

    const saveAddress = async () => {
      if (!isValid.value) return

      saving.value = true
      try {
        if (editingAddress.value) {
          await axios.put(`/api/addresses/${editingAddress.value.id}`, formData)
          toast.success('Cập nhật địa chỉ thành công')
        } else {
          await axios.post('/api/addresses', formData)
          toast.success('Thêm địa chỉ thành công')
        }
        
        await loadAddresses()
        showAddDialog.value = false
        resetForm()
      } catch (err) {
        console.error('Error saving address:', err)
        toast.error('Không thể lưu địa chỉ')
      } finally {
        saving.value = false
      }
    }

    const deleteAddress = (address) => {
      addressToDelete.value = address
      showDeleteDialog.value = true
    }

    const confirmDelete = async () => {
      if (!addressToDelete.value) return

      deleting.value = true
      try {
        await axios.delete(`/api/addresses/${addressToDelete.value.id}`)
        await loadAddresses()
        showDeleteDialog.value = false
        addressToDelete.value = null
        toast.success('Xóa địa chỉ thành công')
      } catch (err) {
        console.error('Error deleting address:', err)
        toast.error('Không thể xóa địa chỉ')
      } finally {
        deleting.value = false
      }
    }

    onMounted(loadAddresses)

    return {
      addresses,
      loading,
      error,
      saving,
      deleting,
      isValid,
      showAddDialog,
      showDeleteDialog,
      editingAddress,
      formData,
      rules,
      form,
      loadAddresses,
      editAddress,
      deleteAddress,
      saveAddress,
      confirmDelete
    }
  }
}
</script> 