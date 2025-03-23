<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">Menu Management</h1>
        
        <!-- Menu Categories -->
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            Categories
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openCategoryDialog()"
            >
              Add Category
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <v-list>
              <v-list-item
                v-for="category in categories"
                :key="category.id"
                :title="category.name"
                :subtitle="category.description"
              >
                <template v-slot:append>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    @click="openCategoryDialog(category)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    @click="confirmDeleteCategory(category)"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
        
        <!-- Menu Items -->
        <v-card>
          <v-card-title class="d-flex align-center">
            Menu Items
            <v-spacer></v-spacer>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openItemDialog()"
            >
              Add Item
            </v-btn>
          </v-card-title>
          
          <v-card-text>
            <!-- Search and Filter -->
            <v-row class="mb-4">
              <v-col cols="12" sm="4">
                <v-select
                  v-model="selectedCategory"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Filter by Category"
                  clearable
                ></v-select>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="searchQuery"
                  label="Search Items"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                ></v-text-field>
              </v-col>
            </v-row>

            <v-table>
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
                  <td>{{ getCategoryName(item.categoryId) }}</td>
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
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Category Dialog -->
    <v-dialog v-model="categoryDialog.show" max-width="500">
      <v-card>
        <v-card-title>
          {{ categoryDialog.isEdit ? 'Edit' : 'Add' }} Category
        </v-card-title>
        
        <v-card-text>
          <v-form ref="categoryForm">
            <v-text-field
              v-model="categoryDialog.form.name"
              label="Category Name"
              :rules="[rules.required]"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="categoryDialog.form.description"
              label="Description"
              rows="3"
              placeholder="Enter a detailed description of this category"
              hint="A good description helps customers understand what kinds of items they can find in this category"
            ></v-textarea>

            <v-file-input
              v-model="categoryDialog.form.image"
              label="Category Image"
              accept="image/*"
              prepend-icon="mdi-camera"
              :show-size="true"
              hint="Upload a representative image for this category"
              persistent-hint
              class="mt-4"
            >
              <template v-slot:selection="{ fileNames }">
                <template v-for="fileName in fileNames" :key="fileName">
                  <v-chip
                    size="small"
                    label
                    color="primary"
                    class="me-2"
                  >
                    {{ fileName }}
                  </v-chip>
                </template>
              </template>
            </v-file-input>

            <v-switch
              v-model="categoryDialog.form.isActive"
              color="success"
              label="Category is active and visible to customers"
              class="mt-4"
            ></v-switch>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="categoryDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="categoryDialog.loading"
            @click="saveCategory"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Item Dialog -->
    <v-dialog v-model="itemDialog.show" max-width="800" persistent>
      <v-card>
        <v-card-title>
          {{ itemDialog.isEdit ? 'Edit' : 'Add' }} Menu Item
        </v-card-title>
        
        <v-card-text>
          <v-form ref="itemForm">
            <v-row>
              <!-- Basic Info -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="itemDialog.form.name"
                  label="Item Name"
                  :rules="[rules.required]"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="itemDialog.form.categoryId"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Category"
                  :rules="[rules.required]"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="itemDialog.form.price"
                  label="Base Price"
                  type="number"
                  prefix="$"
                  :rules="[rules.required, rules.price]"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="itemDialog.form.image"
                  label="Item Image"
                  accept="image/*"
                  :rules="[itemDialog.isEdit ? undefined : rules.required]"
                  @change="handleImagePreview"
                  prepend-icon="mdi-camera"
                  :show-size="true"
                  hint="Upload a clear, appetizing photo of the dish"
                  persistent-hint
                >
                  <template v-slot:selection="{ fileNames }">
                    <template v-for="fileName in fileNames" :key="fileName">
                      <v-chip size="small" label color="primary" class="me-2">
                        {{ fileName }}
                      </v-chip>
                    </template>
                  </template>
                </v-file-input>
                
                <!-- Image Preview -->
                <v-img
                  v-if="imagePreview || itemDialog.form.imageUrl"
                  :src="imagePreview || itemDialog.form.imageUrl"
                  height="200"
                  cover
                  class="mt-2 rounded-lg"
                ></v-img>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="itemDialog.form.description"
                  label="Description"
                  :rules="[rules.required]"
                  rows="3"
                  counter="500"
                  placeholder="Describe the dish, including main ingredients and preparation method"
                  hint="A detailed description helps customers make informed choices"
                  persistent-hint
                ></v-textarea>
              </v-col>

              <!-- Dietary Information -->
              <v-col cols="12">
                <div class="text-subtitle-1 mb-2">Dietary Information</div>
                <v-chip-group
                  v-model="itemDialog.form.dietaryTags"
                  multiple
                  column
                >
                  <v-chip
                    v-for="tag in dietaryOptions"
                    :key="tag.value"
                    filter
                    :value="tag.value"
                  >
                    <v-icon start>{{ tag.icon }}</v-icon>
                    {{ tag.label }}
                  </v-chip>
                </v-chip-group>
              </v-col>

              <!-- Additional Settings -->
              <v-col cols="12">
                <v-switch
                  v-model="itemDialog.form.available"
                  color="success"
                  label="Item is available for ordering"
                ></v-switch>
                <v-switch
                  v-model="itemDialog.form.featured"
                  color="primary"
                  label="Feature this item (shown prominently in the menu)"
                ></v-switch>
              </v-col>

              <!-- Size Options -->
              <v-col cols="12">
                <div class="d-flex align-center mb-2">
                  <div class="text-subtitle-1">Size Options</div>
                  <v-spacer></v-spacer>
                  <v-btn
                    size="small"
                    icon="mdi-plus"
                    variant="text"
                    @click="addSizeOption"
                  ></v-btn>
                </div>
                <v-row
                  v-for="(size, index) in itemDialog.form.sizes"
                  :key="index"
                  class="align-center"
                >
                  <v-col cols="5">
                    <v-text-field
                      v-model="size.name"
                      label="Size Name"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="5">
                    <v-text-field
                      v-model.number="size.price"
                      label="Additional Price"
                      type="number"
                      prefix="$"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="2">
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      density="comfortable"
                      @click="removeSizeOption(index)"
                    ></v-btn>
                  </v-col>
                </v-row>
              </v-col>

              <!-- Toppings -->
              <v-col cols="12">
                <div class="d-flex align-center mb-2">
                  <div class="text-subtitle-1">Toppings/Add-ons</div>
                  <v-spacer></v-spacer>
                  <v-btn
                    size="small"
                    icon="mdi-plus"
                    variant="text"
                    @click="addTopping"
                  ></v-btn>
                </div>
                <v-row
                  v-for="(topping, index) in itemDialog.form.toppings"
                  :key="index"
                  class="align-center"
                >
                  <v-col cols="5">
                    <v-text-field
                      v-model="topping.name"
                      label="Topping Name"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="5">
                    <v-text-field
                      v-model.number="topping.price"
                      label="Price"
                      type="number"
                      prefix="$"
                      density="comfortable"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="2">
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      density="comfortable"
                      @click="removeTopping(index)"
                    ></v-btn>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="closeItemDialog"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :loading="itemDialog.loading"
            @click="saveItem"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="400">
      <v-card>
        <v-card-title>Delete {{ deleteDialog.type }}</v-card-title>
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
            :loading="deleteDialog.loading"
            @click="handleDelete"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

export default {
  name: 'MenuManagement',
  
  setup() {
    const store = useStore()
    const itemForm = ref(null)
    const categoryForm = ref(null)
    
    // State
    const loading = ref(false)
    const searchQuery = ref('')
    const selectedCategory = ref(null)
    const imagePreview = ref(null)

    // Dialog states
    const categoryDialog = ref({
      show: false,
      isEdit: false,
      loading: false,
      form: {
        name: '',
        description: ''
      }
    })

    const itemDialog = ref({
      show: false,
      isEdit: false,
      loading: false,
      form: {
        name: '',
        description: '',
        price: 0,
        categoryId: null,
        image: null,
        sizes: [],
        toppings: [],
        dietaryTags: [],
        available: true,
        featured: false,
        imageUrl: null
      }
    })

    const deleteDialog = ref({
      show: false,
      loading: false,
      type: '',
      item: null
    })

    // Validation rules
    const rules = {
      required: v => !!v || 'This field is required',
      price: v => v >= 0 || 'Price must be non-negative'
    }

    // Computed
    const categories = computed(() => store.state.restaurantAdmin.categories)
    const menuItems = computed(() => store.state.restaurantAdmin.menuItems)
    
    const filteredItems = computed(() => {
      let items = [...menuItems.value]
      
      if (selectedCategory.value) {
        items = items.filter(item => item.categoryId === selectedCategory.value)
      }
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        items = items.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        )
      }
      
      return items
    })

    // Methods
    const loadData = async () => {
      loading.value = true
      try {
        await Promise.all([
          store.dispatch('restaurantAdmin/fetchCategories'),
          store.dispatch('restaurantAdmin/fetchMenuItems')
        ])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        loading.value = false
      }
    }

    const getCategoryName = (categoryId) => {
      const category = categories.value.find(c => c.id === categoryId)
      return category ? category.name : 'Uncategorized'
    }

    // Category methods
    const openCategoryDialog = (category = null) => {
      categoryDialog.value.isEdit = !!category
      categoryDialog.value.form = category
        ? { ...category }
        : { name: '', description: '' }
      categoryDialog.value.show = true
    }

    const saveCategory = async () => {
      if (!categoryForm.value.validate()) return

      categoryDialog.value.loading = true
      try {
        if (categoryDialog.value.isEdit) {
          await store.dispatch('restaurantAdmin/updateCategory', categoryDialog.value.form)
        } else {
          await store.dispatch('restaurantAdmin/createCategory', categoryDialog.value.form)
        }
        categoryDialog.value.show = false
        await loadData()
      } catch (error) {
        console.error('Failed to save category:', error)
      } finally {
        categoryDialog.value.loading = false
      }
    }

    const confirmDeleteCategory = (category) => {
      deleteDialog.value = {
        show: true,
        loading: false,
        type: 'Category',
        item: category
      }
    }

    // Item methods
    const openItemDialog = (item = null) => {
      itemDialog.value.isEdit = !!item
      itemDialog.value.form = item
        ? { 
            ...item,
            image: null,
            sizes: [...(item.sizes || [])],
            toppings: [...(item.toppings || [])],
            dietaryTags: [...(item.dietaryTags || [])],
            available: item.available,
            featured: item.featured,
            imageUrl: item.imageUrl || null
          }
        : {
            name: '',
            description: '',
            price: 0,
            categoryId: null,
            image: null,
            sizes: [],
            toppings: [],
            dietaryTags: [],
            available: true,
            featured: false,
            imageUrl: null
          }
      itemDialog.value.show = true
    }

    const closeItemDialog = () => {
      itemDialog.value.show = false
      itemDialog.value.form = {
        name: '',
        description: '',
        price: 0,
        categoryId: null,
        image: null,
        sizes: [],
        toppings: [],
        dietaryTags: [],
        available: true,
        featured: false,
        imageUrl: null
      }
      imagePreview.value = null
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

    const addSizeOption = () => {
      itemDialog.value.form.sizes.push({
        name: '',
        price: 0
      })
    }

    const removeSizeOption = (index) => {
      itemDialog.value.form.sizes.splice(index, 1)
    }

    const addTopping = () => {
      itemDialog.value.form.toppings.push({
        name: '',
        price: 0
      })
    }

    const removeTopping = (index) => {
      itemDialog.value.form.toppings.splice(index, 1)
    }

    const saveItem = async () => {
      if (!itemForm.value.validate()) return

      itemDialog.value.loading = true
      try {
        const formData = new FormData()
        Object.keys(itemDialog.value.form).forEach(key => {
          if (key === 'image' && itemDialog.value.form[key]) {
            formData.append('image', itemDialog.value.form[key])
          } else if (key === 'sizes' || key === 'toppings' || key === 'dietaryTags') {
            formData.append(key, JSON.stringify(itemDialog.value.form[key]))
          } else {
            formData.append(key, itemDialog.value.form[key])
          }
        })

        if (itemDialog.value.isEdit) {
          await store.dispatch('restaurantAdmin/updateMenuItem', {
            id: itemDialog.value.form.id,
            data: formData
          })
        } else {
          await store.dispatch('restaurantAdmin/createMenuItem', formData)
        }
        closeItemDialog()
        await loadData()
      } catch (error) {
        console.error('Failed to save menu item:', error)
      } finally {
        itemDialog.value.loading = false
      }
    }

    const confirmDeleteItem = (item) => {
      deleteDialog.value = {
        show: true,
        loading: false,
        type: 'Menu Item',
        item: item
      }
    }

    const handleDelete = async () => {
      if (!deleteDialog.value.item) return

      deleteDialog.value.loading = true
      try {
        if (deleteDialog.value.type === 'Category') {
          await store.dispatch('restaurantAdmin/deleteCategory', deleteDialog.value.item.id)
        } else {
          await store.dispatch('restaurantAdmin/deleteMenuItem', deleteDialog.value.item.id)
        }
        deleteDialog.value.show = false
        await loadData()
      } catch (error) {
        console.error('Failed to delete:', error)
      } finally {
        deleteDialog.value.loading = false
      }
    }

    const toggleItemAvailability = async (item) => {
      try {
        await store.dispatch('restaurantAdmin/updateMenuItem', {
          id: item.id,
          data: { available: item.available }
        })
      } catch (error) {
        item.available = !item.available // Revert on error
        console.error('Failed to update item availability:', error)
      }
    }

    const dietaryOptions = [
      { label: 'Vegetarian', value: 'vegetarian', icon: 'mdi-leaf' },
      { label: 'Vegan', value: 'vegan', icon: 'mdi-sprout' },
      { label: 'Gluten Free', value: 'gluten_free', icon: 'mdi-grain-off' },
      { label: 'Halal', value: 'halal', icon: 'mdi-food-halal' },
      { label: 'Contains Nuts', value: 'nuts', icon: 'mdi-peanut' },
      { label: 'Spicy', value: 'spicy', icon: 'mdi-pepper-hot' }
    ]

    // Initialize
    onMounted(() => {
      loadData()
    })

    return {
      // State
      loading,
      searchQuery,
      selectedCategory,
      imagePreview,
      categoryDialog,
      itemDialog,
      deleteDialog,
      itemForm,
      categoryForm,
      categories,
      menuItems,
      filteredItems,
      rules,
      dietaryOptions,  // Add this

      // Methods
      getCategoryName,
      openCategoryDialog,
      saveCategory,
      confirmDeleteCategory,
      openItemDialog,
      closeItemDialog,
      handleImagePreview,
      addSizeOption,
      removeSizeOption,
      addTopping,
      removeTopping,
      saveItem,
      confirmDeleteItem,
      handleDelete,
      toggleItemAvailability
    }
  }
}
</script>

<style scoped>
.v-table img {
  object-fit: cover;
  border-radius: 4px;
}
</style>