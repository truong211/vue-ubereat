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
                    @click="deleteCategory(category.id)"
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
            <v-data-table
              :headers="headers"
              :items="menuItems"
              :loading="loading"
            >
              <template v-slot:item.image="{ item }">
                <v-img
                  :src="item.image"
                  width="50"
                  height="50"
                  cover
                  class="rounded"
                ></v-img>
              </template>
              
              <template v-slot:item.price="{ item }">
                ${{ item.price.toFixed(2) }}
              </template>
              
              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  size="small"
                  @click="openItemDialog(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  size="small"
                  color="error"
                  @click="deleteItem(item.id)"
                ></v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    
    <!-- Category Dialog -->
    <v-dialog v-model="categoryDialog.show" max-width="500px">
      <v-card>
        <v-card-title>
          {{ categoryDialog.isEdit ? 'Edit' : 'Add' }} Category
        </v-card-title>
        
        <v-card-text>
          <v-form ref="categoryForm">
            <v-text-field
              v-model="categoryDialog.form.name"
              label="Category Name"
              :rules="[v => !!v || 'Name is required']"
            ></v-text-field>
            <v-textarea
              v-model="categoryDialog.form.description"
              label="Description"
            ></v-textarea>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="saveCategoryDialog"
            :loading="categoryDialog.loading"
          >
            Save
          </v-btn>
          <v-btn
            variant="text"
            @click="categoryDialog.show = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Item Dialog -->
    <v-dialog v-model="itemDialog.show" max-width="700px">
      <v-card>
        <v-card-title>
          {{ itemDialog.isEdit ? 'Edit' : 'Add' }} Menu Item
        </v-card-title>
        
        <v-card-text>
          <v-form ref="itemForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="itemDialog.form.name"
                  label="Item Name"
                  :rules="[v => !!v || 'Name is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-select
                  v-model="itemDialog.form.categoryId"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  label="Category"
                  :rules="[v => !!v || 'Category is required']"
                ></v-select>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="itemDialog.form.price"
                  label="Price"
                  prefix="$"
                  type="number"
                  step="0.01"
                  :rules="[v => !!v || 'Price is required']"
                ></v-text-field>
              </v-col>
              
              <v-col cols="12" md="6">
                <v-file-input
                  v-model="itemDialog.form.imageFile"
                  label="Item Image"
                  accept="image/*"
                  :rules="itemImageRules"
                ></v-file-input>
              </v-col>
              
              <v-col cols="12">
                <v-textarea
                  v-model="itemDialog.form.description"
                  label="Description"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="saveItemDialog"
            :loading="itemDialog.loading"
          >
            Save
          </v-btn>
          <v-btn
            variant="text"
            @click="itemDialog.show = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'MenuManagement',
  
  setup() {
    const store = useStore();
    const loading = ref(false);
    const categories = ref([]);
    const menuItems = ref([]);
    const searchQuery = ref('');
    const selectedCategory = ref(null);
    
    const categoryDialog = ref({
      show: false,
      isEdit: false,
      loading: false,
      form: {
        name: '',
        description: '',
        displayOrder: 0,
        isActive: true
      }
    });

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
        preparationTime: 15,
        isAvailable: true,
        allergies: [],
        customizations: []
      }
    });

    // Add customization field
    const addCustomization = () => {
      itemDialog.value.form.customizations.push({
        name: '',
        options: [],
        required: false,
        multiple: false,
        min: 0,
        max: 1
      });
    };

    // Add option to customization
    const addOption = (customizationIndex) => {
      itemDialog.value.form.customizations[customizationIndex].options.push({
        name: '',
        price: 0
      });
    };

    // Filter items by category and search query
    const filteredItems = computed(() => {
      let items = [...menuItems.value];
      
      if (selectedCategory.value) {
        items = items.filter(item => item.categoryId === selectedCategory.value);
      }
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        items = items.filter(item => 
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
        );
      }
      
      return items;
    });

    // Load initial data
    onMounted(async () => {
      loading.value = true;
      try {
        await Promise.all([
          loadCategories(),
          loadMenuItems()
        ]);
      } catch (error) {
        console.error('Failed to load menu data:', error);
      } finally {
        loading.value = false;
      }
    });

    // Save category changes
    const saveCategory = async () => {
      if (!validateCategoryForm()) return;
      
      categoryDialog.value.loading = true;
      try {
        if (categoryDialog.value.isEdit) {
          await store.dispatch('restaurant/updateCategory', categoryDialog.value.form);
        } else {
          await store.dispatch('restaurant/createCategory', categoryDialog.value.form);
        }
        await loadCategories();
        categoryDialog.value.show = false;
      } catch (error) {
        console.error('Failed to save category:', error);
      } finally {
        categoryDialog.value.loading = false;
      }
    };

    // Save menu item changes
    const saveMenuItem = async () => {
      if (!validateItemForm()) return;
      
      itemDialog.value.loading = true;
      try {
        const formData = new FormData();
        Object.keys(itemDialog.value.form).forEach(key => {
          if (key === 'customizations') {
            formData.append(key, JSON.stringify(itemDialog.value.form[key]));
          } else if (itemDialog.value.form[key] !== null) {
            formData.append(key, itemDialog.value.form[key]);
          }
        });

        if (itemDialog.value.isEdit) {
          await store.dispatch('restaurant/updateMenuItem', {
            id: itemDialog.value.form.id,
            data: formData
          });
        } else {
          await store.dispatch('restaurant/createMenuItem', formData);
        }
        await loadMenuItems();
        itemDialog.value.show = false;
      } catch (error) {
        console.error('Failed to save menu item:', error);
      } finally {
        itemDialog.value.loading = false;
      }
    };

    // Toggle item availability
    const toggleItemAvailability = async (item) => {
      try {
        await store.dispatch('restaurant/updateMenuItem', {
          id: item.id,
          data: { isAvailable: !item.isAvailable }
        });
        await loadMenuItems();
      } catch (error) {
        console.error('Failed to update item availability:', error);
      }
    };

    return {
      loading,
      categories,
      menuItems,
      searchQuery,
      selectedCategory,
      categoryDialog,
      itemDialog,
      filteredItems,
      addCustomization,
      addOption,
      saveCategory,
      saveMenuItem,
      toggleItemAvailability
    };
  }
};
</script>

<style scoped>
.v-data-table img {
  object-fit: cover;
  border-radius: 4px;
}
</style>