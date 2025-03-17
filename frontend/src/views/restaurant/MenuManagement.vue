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
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

export default {
  name: 'MenuManagement',
  
  setup() {
    const store = useStore();
    const loading = ref(false);
    
    // Table headers
    const headers = [
      { title: 'Image', key: 'image', sortable: false },
      { title: 'Name', key: 'name' },
      { title: 'Category', key: 'category' },
      { title: 'Price', key: 'price' },
      { title: 'Actions', key: 'actions', sortable: false }
    ];
    
    // Categories state
    const categories = ref([]);
    const categoryDialog = ref({
      show: false,
      isEdit: false,
      loading: false,
      form: {
        name: '',
        description: ''
      }
    });
    
    // Menu items state
    const menuItems = ref([]);
    const itemDialog = ref({
      show: false,
      isEdit: false,
      loading: false,
      form: {
        name: '',
        categoryId: null,
        price: 0,
        description: '',
        imageFile: null
      }
    });
    
    // Validation rules
    const itemImageRules = [
      v => !v || v.size < 2000000 || 'Image size should be less than 2 MB!'
    ];
    
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
    
    // Category methods
    const loadCategories = async () => {
      try {
        categories.value = await store.dispatch('restaurant/getCategories');
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    
    const openCategoryDialog = (category = null) => {
      categoryDialog.value.isEdit = !!category;
      categoryDialog.value.form = category
        ? { ...category }
        : { name: '', description: '' };
      categoryDialog.value.show = true;
    };
    
    const saveCategoryDialog = async () => {
      try {
        categoryDialog.value.loading = true;
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
    
    const deleteCategory = async (id) => {
      if (confirm('Are you sure you want to delete this category?')) {
        try {
          await store.dispatch('restaurant/deleteCategory', id);
          await loadCategories();
        } catch (error) {
          console.error('Failed to delete category:', error);
        }
      }
    };
    
    // Menu item methods
    const loadMenuItems = async () => {
      try {
        menuItems.value = await store.dispatch('restaurant/getMenuItems');
      } catch (error) {
        console.error('Failed to load menu items:', error);
      }
    };
    
    const openItemDialog = (item = null) => {
      itemDialog.value.isEdit = !!item;
      itemDialog.value.form = item
        ? { ...item, imageFile: null }
        : {
          name: '',
          categoryId: null,
          price: 0,
          description: '',
          imageFile: null
        };
      itemDialog.value.show = true;
    };
    
    const saveItemDialog = async () => {
      try {
        itemDialog.value.loading = true;
        const formData = new FormData();
        Object.keys(itemDialog.value.form).forEach(key => {
          if (key === 'imageFile' && itemDialog.value.form[key]) {
            formData.append('image', itemDialog.value.form[key]);
          } else {
            formData.append(key, itemDialog.value.form[key]);
          }
        });
        
        if (itemDialog.value.isEdit) {
          await store.dispatch('restaurant/updateMenuItem', formData);
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
    
    const deleteItem = async (id) => {
      if (confirm('Are you sure you want to delete this menu item?')) {
        try {
          await store.dispatch('restaurant/deleteMenuItem', id);
          await loadMenuItems();
        } catch (error) {
          console.error('Failed to delete menu item:', error);
        }
      }
    };
    
    return {
      loading,
      headers,
      categories,
      menuItems,
      categoryDialog,
      itemDialog,
      itemImageRules,
      openCategoryDialog,
      saveCategoryDialog,
      deleteCategory,
      openItemDialog,
      saveItemDialog,
      deleteItem
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