<template>
  <v-container>
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <h2 class="text-h5">My Addresses</h2>
        <v-btn color="primary" @click="dialog = true">
          <v-icon left>mdi-plus</v-icon>
          Add New Address
        </v-btn>
      </v-col>

      <v-col cols="12">
        <v-list>
          <v-list-item v-for="address in addresses" :key="address.id" class="mb-2">
            <template v-slot:prepend>
              <v-icon :icon="address.type === 'home' ? 'mdi-home' : 'mdi-office-building'"></v-icon>
            </template>

            <v-list-item-title>{{ address.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ address.street }}, {{ address.city }}, {{ address.state }} {{ address.zipCode }}</v-list-item-subtitle>

            <template v-slot:append>
              <v-btn icon="mdi-pencil" variant="text" @click="editAddress(address)"></v-btn>
              <v-btn icon="mdi-delete" variant="text" color="error" @click="confirmDelete(address)"></v-btn>
            </template>
          </v-list-item>
        </v-list>
      </v-col>
    </v-row>

    <!-- Add/Edit Address Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          <span>{{ editedIndex === -1 ? 'New Address' : 'Edit Address' }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="form" v-model="isValid">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.name"
                    label="Address Name"
                    :rules="[v => !!v || 'Name is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12">
                  <v-text-field
                    v-model="editedItem.street"
                    label="Street Address"
                    :rules="[v => !!v || 'Street address is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.city"
                    label="City"
                    :rules="[v => !!v || 'City is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.state"
                    label="State"
                    :rules="[v => !!v || 'State is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="editedItem.zipCode"
                    label="ZIP Code"
                    :rules="[v => !!v || 'ZIP code is required']"
                    required
                  ></v-text-field>
                </v-col>

                <v-col cols="12" md="6">
                  <v-select
                    v-model="editedItem.type"
                    :items="['home', 'work', 'other']"
                    label="Address Type"
                    required
                  ></v-select>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="close">Cancel</v-btn>
          <v-btn color="primary" @click="save" :disabled="!isValid">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title>Delete Address</v-card-title>
        <v-card-text>Are you sure you want to delete this address?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="deleteAddress">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const form = ref(null)
const isValid = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const editedIndex = ref(-1)
const addressToDelete = ref(null)

const addresses = computed(() => store.state.user.addresses)

const defaultItem = {
  name: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  type: 'home'
}

const editedItem = ref({ ...defaultItem })

const editAddress = (address) => {
  editedIndex.value = addresses.value.indexOf(address)
  editedItem.value = Object.assign({}, address)
  dialog.value = true
}

const confirmDelete = (address) => {
  addressToDelete.value = address
  deleteDialog.value = true
}

const deleteAddress = async () => {
  try {
    await store.dispatch('user/deleteAddress', addressToDelete.value.id)
    deleteDialog.value = false
  } catch (error) {
    console.error('Error deleting address:', error)
  }
}

const close = () => {
  dialog.value = false
  editedIndex.value = -1
  editedItem.value = Object.assign({}, defaultItem)
}

const save = async () => {
  try {
    if (editedIndex.value > -1) {
      await store.dispatch('user/updateAddress', {
        id: addresses.value[editedIndex.value].id,
        ...editedItem.value
      })
    } else {
      await store.dispatch('user/addAddress', editedItem.value)
    }
    close()
  } catch (error) {
    console.error('Error saving address:', error)
  }
}
</script>