<template>
  <div class="menu-management">
    <!-- Menu Actions Header -->
    <div class="d-flex align-center mb-4">
      <h2 class="text-h5">Menu Management</h2>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openItemDialog()"
      >
        Add Menu Item
      </v-btn>
    </div>

    <!-- Category Filter and Search -->
    <v-row class="mb-4">
      <v-col cols="12" sm="4">
        <v-select
          v-model="selectedCategory"
          :items="categories"
          label="Filter by Category"
          clearable
          density="comfortable"
        ></v-select>
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field
          v-model="search"
          label="Search Items"
          prepend-inner-icon="mdi-magnify"
          density="comfortable"
          clearable
        ></v-text-field>
      </v-col>
      <v-col cols="12" sm="4" class="d-flex align-center">
        <v-btn-toggle
          v-model="viewMode"
          density="comfortable"
          color="primary"
        >
          <v-btn value="grid" icon="mdi-grid"></v-btn>
          <v-btn value="list" icon="mdi-format-list-bulleted"></v-btn>
        </v-btn-toggle>
      </v-col>
    </v-row>

    <!-- Grid View -->
    <v-row v-if="viewMode === 'grid'" class="menu-grid">
      <v-col 
        v-for="item in filteredItems" 
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card class="h-100">
          <v-img
            :src="item.image || '/img/placeholder-food.png'"
            height="200"
            cover
          ></v-img>
          
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-2">
              <div class="text-h6">{{ item.name }}</div>
              <div class="text-h6">${{ item.price.toFixed(2) }}</div>
            </div>
            <div class="text-subtitle-2 mb-2">{{ item.category }}</div>
            <div class="text-body-2">{{ item.description }}</div>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              @click="openItemDialog(item)"
            >
              Edit
            </v-btn>
            <v-spacer></v-spacer>
            <v-switch
              v-model="item.available"
              color="success"
              :label="item.available ? 'Available' : 'Unavailable'"
              hide-details
              density="comfortable"
              @change="toggleItemAvailability(item)"
            ></v-switch>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- List View -->
    <v-table v-else>
      <thead>
        <tr>
          <th>Image</th>
          <th>Name</th>
          <th>Category</th>
          <th>Price</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredItems" :key="item.id">
          <td>
            <v-avatar size="48">
              <v-img :src="item.image || '/img/placeholder-food.png'" cover></v-img>
            </v-avatar>
          </td>
          <td>{{ item.name }}</td>
          <td>{{ item.category }}</td>
          <td>${{ item.price.toFixed(2) }}</td>
          <td>
            <v-switch
              v-model="item.available"
              color="success"
              hide-details
              density="comfortable"
              @change="toggleItemAvailability(item)"
            ></v-switch>
          </td>
          <td>
            <v-btn
              icon="mdi-pencil"
              variant="text"
              color="primary"
              size="small"
              @click="openItemDialog(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              size="small"
              @click="confirmDeleteItem(item)"
            ></v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- Item Dialog -->
    <v-dialog v-model="itemDialog.show" max-width="600">
      <v-card>
        <v-card-title>
          {{ itemDialog.editMode ? 'Edit Item' : 'Add New Item' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="itemForm" @submit.prevent="saveItem">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="itemDialog.item.name"
                  label="Item Name"
                  :rules="[v => !!v || 'Name is required']"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.number="itemDialog.item.price"
                  label="Price"
                  prefix="$"
                  type="number"
                  step="0.01"
                  :rules="[
                    v => !!v || 'Price is required',
                    v => v > 0 || 'Price must be greater than 0'
                  ]"
                  required
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-select
                  v-model="itemDialog.item.category"
                  :items="categories"
                  label="Category"
                  :rules="[v => !!v || 'Category is required']"
                  required
                ></v-select>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="itemDialog.item.description"
                  label="Description"
                  rows="3"
                  :rules="[v => !!v || 'Description is required']"
                  required
                ></v-textarea>
              </v-col>

              <v-col cols="12">
                <v-file-input
                  v-model="itemDialog.item.imageFile"
                  label="Item Image"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  :show-size="true"
                ></v-file-input>
              </v-col>

              <v-col cols="12">
                <v-switch
                  v-model="itemDialog.item.available"
                  color="success"
                  label="Available"
                  hide-details
                ></v-switch>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="itemDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveItem"
            :loading="itemDialog.loading"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title>Delete Item</v-card-title>
        <v-card-text>
          Are you sure you want to delete "{{ deleteDialog.item?.name }}"?
          This action cannot be undone.
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
            @click="deleteItem"
            :loading="deleteDialog.loading"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useToast } from 'vue-toastification'

const store = useStore()
const toast = useToast()

// State
const search = ref('')
const selectedCategory = ref(null)
const viewMode = ref('grid')
const itemForm = ref(null)

const itemDialog = ref({
  show: false,
  editMode: false,
  loading: false,
  item: {
    name: '',
    price: 0,
    category: '',
    description: '',
    available: true,
    image: '',
    imageFile: null
  }
})

const deleteDialog = ref({
  show: false,
  loading: false,
  item: null
})

// Computed
const menuItems = computed(() => store.state.restaurantAdmin.menuItems)
const categories = computed(() => store.state.restaurantAdmin.categories)

const filteredItems = computed(() => {
  let items = [...menuItems.value]
  
  if (search.value) {
    const searchTerm = search.value.toLowerCase()
    items = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.description.toLowerCase().includes(searchTerm)
    )
  }

  if (selectedCategory.value) {
    items = items.filter(item => item.category === selectedCategory.value)
  }

  return items
})

// Methods
const openItemDialog = (item = null) => {
  itemDialog.value.editMode = !!item
  itemDialog.value.item = item 
    ? { ...item, imageFile: null }
    : {
        name: '',
        price: 0,
        category: '',
        description: '',
        available: true,
        image: '',
        imageFile: null
      }
  itemDialog.value.show = true
}

const saveItem = async () => {
  if (!itemForm.value.validate()) return

  itemDialog.value.loading = true
  try {
    const formData = new FormData()
    Object.keys(itemDialog.value.item).forEach(key => {
      if (key === 'imageFile' && itemDialog.value.item[key]) {
        formData.append('image', itemDialog.value.item[key])
      } else if (key !== 'imageFile') {
        formData.append(key, itemDialog.value.item[key])
      }
    })

    if (itemDialog.value.editMode) {
      await store.dispatch('restaurantAdmin/updateMenuItem', {
        id: itemDialog.value.item.id,
        data: formData
      })
      toast.success('Item updated successfully')
    } else {
      await store.dispatch('restaurantAdmin/createMenuItem', formData)
      toast.success('Item created successfully')
    }

    itemDialog.value.show = false
  } catch (error) {
    toast.error(error.message || 'Failed to save item')
  } finally {
    itemDialog.value.loading = false
  }
}

const toggleItemAvailability = async (item) => {
  try {
    await store.dispatch('restaurantAdmin/updateMenuItem', {
      id: item.id,
      data: { available: item.available }
    })
    toast.success(`Item ${item.available ? 'enabled' : 'disabled'} successfully`)
  } catch (error) {
    item.available = !item.available // Revert the change
    toast.error('Failed to update item availability')
  }
}

const confirmDeleteItem = (item) => {
  deleteDialog.value.item = item
  deleteDialog.value.show = true
}

const deleteItem = async () => {
  if (!deleteDialog.value.item) return

  deleteDialog.value.loading = true
  try {
    await store.dispatch('restaurantAdmin/deleteMenuItem', deleteDialog.value.item.id)
    toast.success('Item deleted successfully')
    deleteDialog.value.show = false
  } catch (error) {
    toast.error('Failed to delete item')
  } finally {
    deleteDialog.value.loading = false
  }
}
</script>

<style scoped>
.menu-management {
  padding: 16px;
}

.menu-grid {
  gap: 16px;
}

.v-card {
  transition: transform 0.2s;
}

.v-card:hover {
  transform: translateY(-2px);
}
</style>