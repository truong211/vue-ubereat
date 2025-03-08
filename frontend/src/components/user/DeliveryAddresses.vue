<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      Địa chỉ giao hàng
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="showAddDialog = true"
      >
        Thêm địa chỉ
      </v-btn>
    </v-card-title>

    <v-card-text>
      <v-list v-if="addresses.length > 0">
        <!-- Default Address -->
        <div v-if="defaultAddress" class="mb-4">
          <div class="text-subtitle-2 mb-2">Địa chỉ mặc định</div>
          <v-list-item>
            <template v-slot:prepend>
              <v-icon color="primary">mdi-home</v-icon>
            </template>

            <v-list-item-title>{{ defaultAddress.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ formatAddress(defaultAddress) }}</v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                icon="mdi-pencil"
                variant="text"
                @click="editAddress(defaultAddress)"
              ></v-btn>
            </template>
          </v-list-item>
        </div>

        <!-- Other Addresses -->
        <div v-if="otherAddresses.length > 0">
          <div class="text-subtitle-2 mb-2">Địa chỉ khác</div>
          <v-list-item
            v-for="address in otherAddresses"
            :key="address.id"
          >
            <template v-slot:prepend>
              <v-icon>mdi-map-marker</v-icon>
            </template>

            <v-list-item-title>{{ address.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ formatAddress(address) }}</v-list-item-subtitle>

            <template v-slot:append>
              <v-btn
                icon="mdi-star-outline"
                variant="text"
                class="mr-2"
                @click="setAsDefault(address.id)"
              ></v-btn>
              <v-btn
                icon="mdi-pencil"
                variant="text"
                class="mr-2"
                @click="editAddress(address)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                @click="confirmDelete(address)"
              ></v-btn>
            </template>
          </v-list-item>
        </div>
      </v-list>

      <div v-else class="text-center pa-4">
        <v-icon
          size="64"
          color="grey-lighten-1"
          class="mb-4"
        >
          mdi-map-marker-off
        </v-icon>
        <div class="text-body-1 text-medium-emphasis">
          Bạn chưa có địa chỉ giao hàng nào
        </div>
      </div>
    </v-card-text>

    <!-- Add/Edit Address Dialog -->
    <v-dialog
      v-model="showAddDialog"
      max-width="600"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới' }}
        </v-card-title>

        <v-card-text>
          <v-form
            ref="form"
            v-model="isValid"
            @submit.prevent="saveAddress"
          >
            <v-text-field
              v-model="addressForm.name"
              label="Tên địa chỉ"
              :rules="[rules.required]"
              hide-details="auto"
              class="mb-4"
            ></v-text-field>

            <v-text-field
              v-model="addressForm.address"
              label="Địa chỉ"
              :rules="[rules.required]"
              hide-details="auto"
              class="mb-4"
            ></v-text-field>

            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressForm.city"
                  label="Thành phố"
                  :rules="[rules.required]"
                  hide-details="auto"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="addressForm.state"
                  label="Tỉnh"
                  :rules="[rules.required]"
                  hide-details="auto"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeDialog"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            :loading="loading"
            @click="saveAddress"
          >
            {{ editingAddress ? 'Lưu' : 'Thêm' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="showDeleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>Xác nhận xóa</v-card-title>
        <v-card-text>
          Bạn có chắc muốn xóa địa chỉ này?
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
            :loading="loading"
            @click="deleteAddress"
          >
            Xóa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStore } from '@/store'
import type { DeliveryAddress } from '@/store/modules/user'
import type { VForm } from 'vuetify/components'

const store = useStore()
const form = ref<VForm | null>(null)

const showAddDialog = ref(false)
const showDeleteDialog = ref(false)
const isValid = ref(false)
const loading = computed(() => store.state.user.loading)

const editingAddress = ref<DeliveryAddress | null>(null)
const addressToDelete = ref<DeliveryAddress | null>(null)

const addresses = computed(() => store.state.user.addresses)
const defaultAddress = computed(() => store.getters['user/defaultAddress'])
const otherAddresses = computed(() => store.getters['user/otherAddresses'])

const addressForm = ref({
  name: '',
  address: '',
  city: '',
  state: '',
  zipcode: '',
  lat: 0,
  lng: 0
})

const rules = {
  required: (v: any) => !!v || 'Trường này là bắt buộc'
}

onMounted(async () => {
  await store.dispatch('user/fetchAddresses')
})

const formatAddress = (address: DeliveryAddress) => {
  return `${address.address}, ${address.city}, ${address.state}`
}

const editAddress = (address: DeliveryAddress) => {
  editingAddress.value = address
  addressForm.value = { ...address }
  showAddDialog.value = true
}

const closeDialog = () => {
  showAddDialog.value = false
  editingAddress.value = null
  addressForm.value = {
    name: '',
    address: '',
    city: '',
    state: '',
    zipcode: '',
    lat: 0,
    lng: 0
  }
}

const saveAddress = async () => {
  if (!form.value?.validate()) return

  try {
    if (editingAddress.value) {
      await store.dispatch('user/updateAddress', {
        id: editingAddress.value.id,
        ...addressForm.value
      })
    } else {
      await store.dispatch('user/addAddress', addressForm.value)
    }
    closeDialog()
  } catch (error: any) {
    console.error('Failed to save address:', error)
    // Handle error
  }
}

const confirmDelete = (address: DeliveryAddress) => {
  addressToDelete.value = address
  showDeleteDialog.value = true
}

const deleteAddress = async () => {
  if (!addressToDelete.value) return

  try {
    await store.dispatch('user/deleteAddress', addressToDelete.value.id)
    showDeleteDialog.value = false
  } catch (error: any) {
    console.error('Failed to delete address:', error)
    // Handle error
  }
}

const setAsDefault = async (addressId: number) => {
  try {
    await store.dispatch('user/setDefaultAddress', addressId)
  } catch (error: any) {
    console.error('Failed to set default address:', error)
    // Handle error
  }
}
</script>