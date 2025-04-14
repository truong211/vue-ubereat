<template>
  <v-container class="categories-page py-8">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 font-weight-bold mb-6">Category Management</h1>

        <v-card class="mb-6">
          <v-card-text>
            <p class="text-body-1">
              Manage food categories across the platform. Categories help customers find restaurants and dishes more easily.
            </p>
          </v-card-text>
        </v-card>

        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <div>Categories</div>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="openCategoryDialog()"
            >
              Add Category
            </v-btn>
          </v-card-title>

          <v-card-text>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="search"
                  label="Search categories"
                  density="comfortable"
                  prepend-inner-icon="mdi-magnify"
                  hide-details
                  single-line
                  variant="outlined"
                  class="mb-4"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" sm="6">
                <v-select
                  v-model="statusFilter"
                  label="Status Filter"
                  density="comfortable"
                  :items="[
                    { title: 'All Status', value: 'all' },
                    { title: 'Active', value: 'active' },
                    { title: 'Inactive', value: 'inactive' }
                  ]"
                  hide-details
                  variant="outlined"
                ></v-select>
              </v-col>
            </v-row>
            
            <v-data-table
              :headers="headers"
              :items="filteredCategories"
              :loading="loading"
              class="mt-4"
            >
              <template v-slot:item.image="{ item }">
                <v-avatar size="40" rounded>
                  <v-img
                    v-if="item.imageUrl"
                    :src="item.imageUrl"
                    :alt="item.name"
                  ></v-img>
                  <v-icon
                    v-else
                    color="grey-lighten-1"
                  >
                    mdi-food
                  </v-icon>
                </v-avatar>
              </template>

              <template v-slot:item.restaurantCount="{ item }">
                <v-chip
                  size="small"
                  color="primary"
                  variant="outlined"
                >
                  {{ item.restaurantCount }} restaurants
                </v-chip>
              </template>

              <template v-slot:item.active="{ item }">
                <v-switch
                  v-model="item.active"
                  color="success"
                  density="compact"
                  hide-details
                  :loading="updatingStatus === item.id"
                  @change="toggleCategory(item)"
                ></v-switch>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-pencil" variant="text" size="small" @click="openCategoryDialog(item)"></v-btn>
                <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDelete(item)"></v-btn>
              </template>

              <!-- Empty state -->
              <template v-slot:no-data>
                <div class="text-center pa-4">
                  <v-icon size="large" color="grey-lighten-1" icon="mdi-food-off" class="mb-2"></v-icon>
                  <div class="text-body-1 mb-2">No categories found</div>
                  <div class="text-caption text-grey">Create your first category to help organize restaurants and menu items</div>
                </div>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Category Dialog -->
    <v-dialog v-model="categoryDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ editingCategory ? 'Edit Category' : 'Add Category' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="categoryFormRef" v-model="isFormValid">
            <v-row>
              <v-col cols="12">
                <v-text-field
                  v-model="categoryForm.name"
                  :rules="nameRules"
                  label="Category Name"
                  required
                ></v-text-field>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="categoryForm.description"
                  label="Description"
                  rows="3"
                  auto-grow
                ></v-textarea>
              </v-col>
              
              <v-col cols="12">
                <v-file-input
                  v-model="categoryForm.image"
                  label="Category Image"
                  accept="image/*"
                  prepend-icon="mdi-camera"
                  :show-size="true"
                  @change="handleImageChange"
                ></v-file-input>
              </v-col>

              <v-col cols="12" v-if="imagePreview || (editingCategory && editingCategory.imageUrl)">
                <v-img
                  :src="imagePreview || editingCategory.imageUrl"
                  max-width="200"
                  max-height="150"
                  class="mx-auto"
                  cover
                ></v-img>
              </v-col>
              
              <v-col cols="12">
                <v-switch
                  v-model="categoryForm.active"
                  color="success"
                  label="Active"
                  hide-details
                ></v-switch>
              </v-col>

              <v-col cols="12">
                <v-select
                  v-model="categoryForm.restaurantId"
                  label="Restaurant"
                  :items="restaurants"
                  item-title="name"
                  item-value="id"
                  persistent-hint
                  hint="Required for new categories"
                  :rules="[v => !!v || 'Restaurant is required']"
                  required
                ></v-select>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="categoryDialog = false">Cancel</v-btn>
          <v-btn 
            color="primary"
            :loading="isSaving"
            @click="saveCategory"
            :disabled="!isFormValid"
          >
            Save
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>Delete Category</v-card-title>
        <v-card-text>
          <p>Are you sure you want to delete <strong>{{ categoryToDelete?.name }}</strong>?</p>
          <p v-if="categoryToDelete?.restaurantCount > 0" class="text-warning">
            <v-icon color="warning" class="me-1">mdi-alert</v-icon>
            This category is used by {{ categoryToDelete.restaurantCount }} restaurants.
          </p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn
            color="error"
            :loading="isDeleting" 
            @click="deleteCategory"
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
  name: 'AdminCategories',
  
  setup() {
    const store = useStore()
    
    // State
    const search = ref('')
    const statusFilter = ref('all')
    const loading = ref(false)
    const categoryDialog = ref(false)
    const deleteDialog = ref(false)
    const isSaving = ref(false)
    const isDeleting = ref(false)
    const isFormValid = ref(false)
    const updatingStatus = ref(null)
    const imagePreview = ref(null)
    const restaurants = ref([])
    
    const categoryForm = ref({
      name: '',
      description: '',
      image: null,
      active: true,
      restaurantId: null
    })
    
    const editingCategory = ref(null)
    const categoryFormRef = ref(null)
    const categoryToDelete = ref(null)
    
    // Table headers
    const headers = [
      { title: 'Image', key: 'image', sortable: false, align: 'center' },
      { title: 'Name', key: 'name', sortable: true },
      { title: 'Description', key: 'description', sortable: false },
      { title: 'Restaurants', key: 'restaurantCount', sortable: true },
      { title: 'Active', key: 'active', sortable: true },
      { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
    ]
    
    // Form validation rules
    const nameRules = [
      v => !!v || 'Category name is required',
      v => v.length >= 2 || 'Name must be at least 2 characters'
    ]
    
    // Filtered categories
    const filteredCategories = computed(() => {
      let categories = store.state.admin?.categories || []
      
      // Search filter
      if (search.value) {
        const searchLower = search.value.toLowerCase()
        categories = categories.filter(c => 
          c.name.toLowerCase().includes(searchLower) ||
          (c.description && c.description.toLowerCase().includes(searchLower))
        )
      }
      
      // Status filter
      if (statusFilter.value !== 'all') {
        categories = categories.filter(c => 
          statusFilter.value === 'active' ? c.active : !c.active
        )
      }
      
      return categories
    })
    
    // Methods
    const openCategoryDialog = (category = null) => {
      if (category) {
        editingCategory.value = category
        categoryForm.value = {
          name: category.name,
          description: category.description || '',
          image: null,
          active: category.active,
          restaurantId: category.restaurantId || (restaurants.value.length > 0 ? restaurants.value[0].id : null)
        }
        imagePreview.value = null
      } else {
        editingCategory.value = null
        categoryForm.value = {
          name: '',
          description: '',
          image: null,
          active: true,
          restaurantId: restaurants.value.length > 0 ? restaurants.value[0].id : null
        }
        imagePreview.value = null
      }
      categoryDialog.value = true
    }
    
    const handleImageChange = (file) => {
      // Clear the preview if file is null, undefined, or an empty array
      if (!file || (Array.isArray(file) && file.length === 0)) {
        imagePreview.value = null
        return
      }
      
      // If file is an array (multiple files), take the first one
      const fileToRead = Array.isArray(file) ? file[0] : file
      
      // Make sure we have a valid file before trying to read it
      if (fileToRead instanceof Blob) {
        const reader = new FileReader()
        reader.onload = (e) => {
          imagePreview.value = e.target.result
        }
        reader.readAsDataURL(fileToRead)
      } else {
        console.warn('Invalid file input:', fileToRead)
        imagePreview.value = null
      }
    }
    
    const saveCategory = async () => {
      if (!categoryFormRef.value) return
      
      const { valid } = await categoryFormRef.value.validate()
      if (!valid) return
      
      isSaving.value = true
      try {
        const formData = new FormData()
        formData.append('name', categoryForm.value.name)
        formData.append('description', categoryForm.value.description)
        formData.append('isActive', categoryForm.value.active)
        formData.append('restaurantId', categoryForm.value.restaurantId)
        
        // Handle image upload safely
        if (categoryForm.value.image) {
          // If it's an array (multiple files), take the first one
          const fileToUpload = Array.isArray(categoryForm.value.image) 
            ? categoryForm.value.image[0] 
            : categoryForm.value.image
          
          // Make sure we have a valid file before trying to upload it
          if (fileToUpload instanceof Blob) {
            formData.append('image', fileToUpload)
          }
        }
        
        if (editingCategory.value) {
          await store.dispatch('admin/updateCategory', {
            id: editingCategory.value.id,
            data: formData
          })
          store.dispatch('ui/showSnackbar', {
            text: 'Category updated successfully',
            color: 'success'
          })
        } else {
          await store.dispatch('admin/createCategory', formData)
          store.dispatch('ui/showSnackbar', {
            text: 'Category created successfully',
            color: 'success'
          })
        }
        
        categoryDialog.value = false
        loadCategories()
      } catch (error) {
        console.error('Failed to save category:', error)
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to save category. Please try again.',
          color: 'error'
        })
      } finally {
        isSaving.value = false
      }
    }
    
    const confirmDelete = (category) => {
      categoryToDelete.value = category
      deleteDialog.value = true
    }
    
    const deleteCategory = async () => {
      if (!categoryToDelete.value) return
      
      isDeleting.value = true
      try {
        await store.dispatch('admin/deleteCategory', categoryToDelete.value.id)
        deleteDialog.value = false
        store.dispatch('ui/showSnackbar', {
          text: 'Category deleted successfully',
          color: 'success'
        })
        loadCategories()
      } catch (error) {
        console.error('Failed to delete category:', error)
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to delete category. Please try again.',
          color: 'error'
        })
      } finally {
        isDeleting.value = false
      }
    }
    
    const toggleCategory = async (category) => {
      updatingStatus.value = category.id
      try {
        await store.dispatch('admin/updateCategory', {
          id: category.id,
          data: { isActive: category.active }
        })
        store.dispatch('ui/showSnackbar', {
          text: `Category ${category.active ? 'activated' : 'deactivated'} successfully`,
          color: 'success'
        })
      } catch (error) {
        console.error('Failed to update category status:', error)
        category.active = !category.active // Revert on failure
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to update category status. Please try again.',
          color: 'error'
        })
      } finally {
        updatingStatus.value = null
      }
    }
    
    // Load categories on mount
    const loadCategories = async () => {
      loading.value = true
      try {
        await store.dispatch('admin/fetchCategories')
      } catch (error) {
        console.error('Failed to load categories:', error)
        store.dispatch('ui/showSnackbar', {
          text: 'Failed to load categories. Please try again.',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }
    
    // Load restaurants for dropdown
    const fetchRestaurants = async () => {
      try {
        const response = await store.dispatch('admin/fetchRestaurants')
        if (response?.data?.restaurants) {
          restaurants.value = response.data.restaurants
        } else if (Array.isArray(response?.data)) {
          restaurants.value = response.data
        } else if (Array.isArray(response)) {
          restaurants.value = response
        } else {
          console.warn('Unexpected response format for restaurants:', response)
          restaurants.value = []
        }
      } catch (error) {
        console.error('Failed to fetch restaurants:', error)
        restaurants.value = []
      }
    }
    
    onMounted(() => {
      loadCategories()
      fetchRestaurants()
    })
    
    return {
      search,
      statusFilter,
      loading,
      categoryDialog,
      deleteDialog,
      isSaving,
      isDeleting,
      isFormValid,
      updatingStatus,
      imagePreview,
      categoryForm,
      editingCategory,
      categoryFormRef,
      categoryToDelete,
      headers,
      nameRules,
      filteredCategories,
      openCategoryDialog,
      handleImageChange,
      saveCategory,
      confirmDelete,
      deleteCategory,
      toggleCategory,
      restaurants
    }
  }
}
</script>

<style scoped>
.categories-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>