<template>
  <div class="category-list">
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <span>Menu Categories</span>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="showAddDialog = true"
        >
          Add Category
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <p class="text-body-2 mb-4">
          Organize your menu by creating categories. Drag and drop to reorder categories.
        </p>
        
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
          <div class="mt-2">Loading categories...</div>
        </div>
        
        <!-- Empty State -->
        <v-alert
          v-else-if="categories.length === 0"
          type="info"
          text="You haven't created any categories yet. Add your first category to organize your menu."
          class="mb-0"
        ></v-alert>
        
        <!-- Category List -->
        <v-list v-else lines="two">
          <draggable
            v-model="sortedCategories"
            item-key="id"
            handle=".drag-handle"
            @end="updateOrder"
          >
            <template #item="{ element: category }">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon class="drag-handle cursor-move mr-2">mdi-drag</v-icon>
                  <v-checkbox
                    v-model="category.isActive"
                    @change="toggleCategoryStatus(category)"
                    hide-details
                    density="compact"
                  ></v-checkbox>
                </template>
                
                <v-list-item-title class="font-weight-bold">
                  {{ category.name }}
                </v-list-item-title>
                
                <v-list-item-subtitle>
                  {{ category.description || 'No description' }}
                  <div class="mt-1">
                    <v-chip
                      size="small"
                      color="primary"
                      variant="outlined"
                      class="mr-1"
                    >
                      {{ category.productCount || 0 }} items
                    </v-chip>
                    <v-chip
                      v-if="!category.isActive"
                      size="small"
                      color="error"
                      variant="outlined"
                    >
                      Hidden
                    </v-chip>
                  </div>
                </v-list-item-subtitle>
                
                <template v-slot:append>
                  <div class="d-flex">
                    <v-btn
                      icon
                      variant="text"
                      color="primary"
                      @click="editCategory(category)"
                    >
                      <v-icon>mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn
                      icon
                      variant="text"
                      color="error"
                      @click="confirmDelete(category)"
                    >
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
              <v-divider></v-divider>
            </template>
          </draggable>
        </v-list>
      </v-card-text>
    </v-card>
    
    <!-- Add/Edit Category Dialog -->
    <v-dialog
      v-model="dialog"
      max-width="500"
    >
      <v-card>
        <v-card-title>
          {{ editMode ? 'Edit Category' : 'Add New Category' }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="form" v-model="formValid" @submit.prevent="saveCategory">
            <v-text-field
              v-model="formData.name"
              label="Category Name"
              :rules="[v => !!v || 'Name is required']"
              required
              variant="outlined"
              class="mb-4"
            ></v-text-field>
            
            <v-textarea
              v-model="formData.description"
              label="Description (optional)"
              variant="outlined"
              rows="3"
              class="mb-4"
            ></v-textarea>
            
            <v-file-input
              v-model="formData.image"
              label="Category Image (optional)"
              accept="image/*"
              variant="outlined"
              prepend-icon="mdi-camera"
              class="mb-4"
              :show-size="1000"
            >
              <template v-slot:selection="{ fileNames }">
                <template v-for="(fileName, index) in fileNames" :key="index">
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
              v-model="formData.isActive"
              color="primary"
              label="Active (visible to customers)"
              hide-details
              class="mb-4"
            ></v-switch>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="dialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="saveCategory"
            :disabled="!formValid"
            :loading="saving"
          >
            {{ editMode ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-h5">
          Delete Category
        </v-card-title>
        
        <v-card-text>
          <p>Are you sure you want to delete <strong>{{ selectedCategory?.name }}</strong>?</p>
          <v-alert
            v-if="selectedCategory?.productCount > 0"
            type="warning"
            density="compact"
            class="mt-2"
          >
            This category contains {{ selectedCategory.productCount }} products. Deleting it will remove the category association from these products.
          </v-alert>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
            @click="deleteCategory"
            :loading="deleting"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex';
import draggable from 'vuedraggable';

export default {
  name: 'CategoryList',
  
  components: {
    draggable
  },
  
  props: {
    restaurantId: {
      type: [Number, String],
      required: true
    }
  },
  
  data() {
    return {
      loading: false,
      dialog: false,
      showAddDialog: false,
      deleteDialog: false,
      editMode: false,
      formValid: false,
      saving: false,
      deleting: false,
      selectedCategory: null,
      formData: {
        name: '',
        description: '',
        isActive: true,
        image: null
      },
      sortedCategories: []
    };
  },
  
  computed: {
    ...mapState({
      categories: state => state.restaurantAdmin.categories
    })
  },
  
  watch: {
    categories: {
      handler(newVal) {
        this.sortedCategories = [...newVal].sort((a, b) => a.displayOrder - b.displayOrder);
      },
      immediate: true
    },
    
    showAddDialog(val) {
      if (val) {
        this.openAddDialog();
      }
    }
  },
  
  methods: {
    ...mapActions({
      fetchCategories: 'restaurantAdmin/fetchCategories',
      createCategory: 'restaurantAdmin/createCategory',
      updateCategory: 'restaurantAdmin/updateCategory',
      removeCategory: 'restaurantAdmin/deleteCategory',
      updateCategoryOrder: 'restaurantAdmin/updateCategoryOrder'
    }),
    
    async loadCategories() {
      this.loading = true;
      
      try {
        await this.fetchCategories(this.restaurantId);
      } catch (error) {
        this.$toast.error('Failed to load categories');
        console.error('Error loading categories:', error);
      } finally {
        this.loading = false;
      }
    },
    
    openAddDialog() {
      this.editMode = false;
      this.formData = {
        name: '',
        description: '',
        isActive: true,
        image: null
      };
      this.dialog = true;
    },
    
    editCategory(category) {
      this.editMode = true;
      this.selectedCategory = category;
      this.formData = {
        name: category.name,
        description: category.description || '',
        isActive: category.isActive,
        image: null
      };
      this.dialog = true;
    },
    
    async saveCategory() {
      if (!this.formValid) return;
      
      this.saving = true;
      
      try {
        const formData = new FormData();
        formData.append('name', this.formData.name);
        formData.append('description', this.formData.description);
        formData.append('isActive', this.formData.isActive);
        formData.append('restaurantId', this.restaurantId);
        
        if (this.formData.image) {
          formData.append('image', this.formData.image);
        }
        
        if (this.editMode) {
          await this.updateCategory({
            id: this.selectedCategory.id,
            data: formData
          });
          this.$toast.success('Category updated successfully');
        } else {
          await this.createCategory(formData);
          this.$toast.success('Category created successfully');
        }
        
        this.dialog = false;
      } catch (error) {
        this.$toast.error(this.editMode ? 'Failed to update category' : 'Failed to create category');
        console.error('Error saving category:', error);
      } finally {
        this.saving = false;
      }
    },
    
    confirmDelete(category) {
      this.selectedCategory = category;
      this.deleteDialog = true;
    },
    
    async deleteCategory() {
      if (!this.selectedCategory) return;
      
      this.deleting = true;
      
      try {
        await this.removeCategory(this.selectedCategory.id);
        this.$toast.success('Category deleted successfully');
        this.deleteDialog = false;
      } catch (error) {
        this.$toast.error('Failed to delete category');
        console.error('Error deleting category:', error);
      } finally {
        this.deleting = false;
      }
    },
    
    async toggleCategoryStatus(category) {
      try {
        const formData = new FormData();
        formData.append('isActive', category.isActive);
        
        await this.updateCategory({
          id: category.id,
          data: formData
        });
        
        this.$toast.success(`Category ${category.isActive ? 'activated' : 'deactivated'} successfully`);
      } catch (error) {
        // Revert the toggle if it fails
        category.isActive = !category.isActive;
        this.$toast.error('Failed to update category status');
        console.error('Error updating category status:', error);
      }
    },
    
    async updateOrder() {
      try {
        const orderData = this.sortedCategories.map((category, index) => ({
          id: category.id,
          displayOrder: index
        }));
        
        await this.updateCategoryOrder({
          restaurantId: this.restaurantId,
          categories: orderData
        });
        
        this.$toast.success('Category order updated');
      } catch (error) {
        this.$toast.error('Failed to update category order');
        console.error('Error updating category order:', error);
        
        // Reload categories to reset order
        await this.loadCategories();
      }
    }
  },
  
  async mounted() {
    await this.loadCategories();
  }
};
</script>

<style scoped>
.cursor-move {
  cursor: move;
}

.drag-handle {
  cursor: move;
}
</style> 