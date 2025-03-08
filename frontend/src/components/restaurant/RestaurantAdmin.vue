<template>
  <div class="restaurant-admin">
    <!-- Stats Row (Previous implementation) -->
    <v-row>
      <!-- ... Stats cards implementation remains the same ... -->
    </v-row>

    <!-- Main Tabs (Previous implementation) -->
    <v-tabs v-model="activeTab" class="mt-4">
      <!-- ... Tabs implementation remains the same ... -->
    </v-tabs>

    <!-- Tab Content (Previous implementation) -->
    <v-window v-model="activeTab" class="mt-4">
      <!-- ... Previous tab content implementation remains the same ... -->
    </v-window>

    <!-- Add/Edit Item Dialog -->
    <v-dialog v-model="showItemDialog" max-width="600">
      <v-card>
        <v-card-title>
          {{ editingItem ? 'Edit Item' : 'Add New Item' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="itemForm" @submit.prevent="saveItem">
            <v-text-field
              v-model="itemForm.name"
              label="Item Name"
              :rules="[rules.required]"
              required
            ></v-text-field>

            <v-text-field
              v-model="itemForm.price"
              label="Price"
              type="number"
              prefix="$"
              :rules="[rules.required, rules.positiveNumber]"
              required
            ></v-text-field>

            <v-textarea
              v-model="itemForm.description"
              label="Description"
              rows="3"
              :rules="[rules.required]"
              required
            ></v-textarea>

            <v-select
              v-model="itemForm.categoryId"
              :items="menuCategories"
              item-title="name"
              item-value="id"
              label="Category"
              required
              :rules="[rules.required]"
            ></v-select>

            <!-- Options Groups -->
            <div class="mb-4">
              <div class="d-flex align-center mb-2">
                <div class="text-subtitle-1">Customization Options</div>
                <v-spacer></v-spacer>
                <v-btn
                  color="primary"
                  size="small"
                  prepend-icon="mdi-plus"
                  @click="addOptionGroup"
                >
                  Add Group
                </v-btn>
              </div>

              <v-expansion-panels>
                <v-expansion-panel
                  v-for="(group, groupIndex) in itemForm.optionGroups"
                  :key="groupIndex"
                >
                  <v-expansion-panel-title>
                    {{ group.name || 'New Option Group' }}
                  </v-expansion-panel-title>
                  
                  <v-expansion-panel-text>
                    <v-text-field
                      v-model="group.name"
                      label="Group Name"
                      required
                    ></v-text-field>

                    <div class="d-flex gap-4">
                      <v-checkbox
                        v-model="group.required"
                        label="Required"
                      ></v-checkbox>
                      
                      <v-text-field
                        v-model.number="group.max"
                        label="Max Selections"
                        type="number"
                        min="1"
                        style="max-width: 150px;"
                      ></v-text-field>
                    </div>

                    <!-- Options -->
                    <div
                      v-for="(option, optionIndex) in group.options"
                      :key="optionIndex"
                      class="d-flex gap-2 mb-2"
                    >
                      <v-text-field
                        v-model="option.name"
                        label="Option Name"
                        density="compact"
                      ></v-text-field>
                      
                      <v-text-field
                        v-model.number="option.price"
                        label="Additional Price"
                        type="number"
                        prefix="$"
                        density="compact"
                        style="max-width: 150px;"
                      ></v-text-field>
                      
                      <v-btn
                        icon="mdi-delete"
                        color="error"
                        size="small"
                        variant="text"
                        @click="removeOption(group, optionIndex)"
                      ></v-btn>
                    </div>

                    <v-btn
                      variant="text"
                      size="small"
                      prepend-icon="mdi-plus"
                      @click="addOption(group)"
                    >
                      Add Option
                    </v-btn>

                    <v-divider class="my-2"></v-divider>

                    <div class="d-flex justify-end">
                      <v-btn
                        color="error"
                        variant="text"
                        size="small"
                        @click="removeOptionGroup(groupIndex)"
                      >
                        Remove Group
                      </v-btn>
                    </div>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </div>

            <!-- Tags -->
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Tags</div>
              <v-chip-group v-model="itemForm.tags" multiple>
                <v-chip
                  v-for="tag in availableTags"
                  :key="tag.value"
                  :value="tag.value"
                  filter
                >
                  <v-icon start>{{ tag.icon }}</v-icon>
                  {{ tag.label }}
                </v-chip>
              </v-chip-group>
            </div>

            <!-- Image Upload -->
            <v-file-input
              v-model="itemForm.image"
              label="Item Image"
              accept="image/*"
              prepend-icon="mdi-camera"
              :rules="[editingItem ? undefined : rules.required]"
              @change="handleImagePreview"
            ></v-file-input>

            <v-img
              v-if="imagePreview || itemForm.imageUrl"
              :src="imagePreview || itemForm.imageUrl"
              width="200"
              height="200"
              cover
              class="rounded mt-2"
            ></v-img>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showItemDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="savingItem"
            @click="saveItem"
          >
            {{ editingItem ? 'Update Item' : 'Add Item' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Item?</v-card-title>
        <v-card-text>
          Are you sure you want to delete this item? This action cannot be undone.
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
            :loading="deletingItem"
            @click="deleteItem"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useToast } from '@/composables/useToast'

export default {
  name: 'RestaurantAdmin',

  setup() {
    const store = useStore()
    const { showToast } = useToast()
    
    // State
    const activeTab = ref('orders')
    const settingsTab = ref('general')
    const showItemDialog = ref(false)
    const showDeleteDialog = ref(false)
    const editingItem = ref(null)
    const itemToDelete = ref(null)
    const imagePreview = ref(null)
    const savingItem = ref(false)
    const deletingItem = ref(false)
    const itemForm = ref({
      name: '',
      price: 0,
      description: '',
      categoryId: null,
      tags: [],
      image: null,
      imageUrl: null,
      optionGroups: []
    })

    // Available tags for menu items
    const availableTags = [
      { label: 'Vegetarian', value: 'vegetarian', icon: 'mdi-leaf' },
      { label: 'Vegan', value: 'vegan', icon: 'mdi-sprout' },
      { label: 'Spicy', value: 'spicy', icon: 'mdi-pepper-hot' },
      { label: 'Popular', value: 'popular', icon: 'mdi-star' },
      { label: 'New', value: 'new', icon: 'mdi-new-box' }
    ]

    // Form Rules
    const rules = {
      required: v => !!v || 'Required',
      positiveNumber: v => v > 0 || 'Must be greater than 0'
    }

    // Load data
    const loadRestaurantData = async () => {
      try {
        await store.dispatch('restaurantAdmin/loadRestaurantData')
      } catch (error) {
        console.error('Failed to load restaurant data:', error)
        showToast('Failed to load restaurant data', 'error')
      }
    }

    // Item management methods
    const addOptionGroup = () => {
      itemForm.value.optionGroups.push({
        name: '',
        required: false,
        max: 1,
        options: []
      })
    }

    const addOption = (group) => {
      group.options.push({
        name: '',
        price: 0
      })
    }

    const removeOption = (group, index) => {
      group.options.splice(index, 1)
    }

    const removeOptionGroup = (index) => {
      itemForm.value.optionGroups.splice(index, 1)
    }

    const handleImagePreview = (file) => {
      if (!file) {
        imagePreview.value = null
        return
      }

      const reader = new FileReader()
      reader.onload = e => {
        imagePreview.value = e.target.result
      }
      reader.readAsDataURL(file)
    }

    const resetItemForm = () => {
      itemForm.value = {
        name: '',
        price: 0,
        description: '',
        categoryId: null,
        tags: [],
        image: null,
        imageUrl: null,
        optionGroups: []
      }
      imagePreview.value = null
      editingItem.value = null
    }

    const editItem = (item) => {
      editingItem.value = item
      itemForm.value = {
        ...item,
        image: null,
        optionGroups: item.optionGroups?.map(group => ({ ...group })) || []
      }
      showItemDialog.value = true
    }

    const saveItem = async () => {
      const valid = await itemForm.value.$validate()
      if (!valid) return

      savingItem.value = true
      try {
        const formData = new FormData()
        Object.keys(itemForm.value).forEach(key => {
          if (key === 'optionGroups') {
            formData.append(key, JSON.stringify(itemForm.value[key]))
          } else if (key === 'image' && itemForm.value[key]) {
            formData.append(key, itemForm.value[key])
          } else {
            formData.append(key, itemForm.value[key])
          }
        })

        if (editingItem.value) {
          await store.dispatch('restaurantAdmin/updateMenuItem', {
            id: editingItem.value.id,
            data: formData
          })
          showToast('Item updated successfully', 'success')
        } else {
          await store.dispatch('restaurantAdmin/addMenuItem', formData)
          showToast('Item added successfully', 'success')
        }

        showItemDialog.value = false
        resetItemForm()
      } catch (error) {
        console.error('Failed to save item:', error)
        showToast('Failed to save item', 'error')
      } finally {
        savingItem.value = false
      }
    }

    const confirmDeleteItem = (item) => {
      itemToDelete.value = item
      showDeleteDialog.value = true
    }

    const deleteItem = async () => {
      if (!itemToDelete.value) return

      deletingItem.value = true
      try {
        await store.dispatch('restaurantAdmin/deleteMenuItem', itemToDelete.value.id)
        showToast('Item deleted successfully', 'success')
        showDeleteDialog.value = false
      } catch (error) {
        console.error('Failed to delete item:', error)
        showToast('Failed to delete item', 'error')
      } finally {
        deletingItem.value = false
        itemToDelete.value = null
      }
    }

    // Initialize
    onMounted(() => {
      loadRestaurantData()
    })

    return {
      activeTab,
      settingsTab,
      showItemDialog,
      showDeleteDialog,
      editingItem,
      itemForm,
      imagePreview,
      savingItem,
      deletingItem,
      availableTags,
      rules,
      addOptionGroup,
      addOption,
      removeOption,
      removeOptionGroup,
      handleImagePreview,
      editItem,
      saveItem,
      confirmDeleteItem,
      deleteItem
    }
  }
}
</script>

<style scoped>
.restaurant-admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.stats-card {
  height: 100%;
}

.time-select {
  max-width: 120px;
}
</style>