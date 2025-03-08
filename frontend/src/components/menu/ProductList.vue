<template>
  <div class="product-list">
    <v-card class="mb-4">
      <v-card-title class="d-flex align-center">
        <span>Menu Items</span>
        <v-spacer></v-spacer>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="showAddDialog = true"
        >
          Add Product
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <!-- Search and Filter -->
        <v-row class="mb-4">
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="filters.search"
              label="Search products"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              @input="applyFilters"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.category"
              :items="categoryOptions"
              label="Category"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="applyFilters"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="3">
            <v-select
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              variant="outlined"
              density="comfortable"
              hide-details
              @update:model-value="applyFilters"
            ></v-select>
          </v-col>
          
          <v-col cols="12" sm="2">
            <v-btn
              color="primary"
              block
              @click="applyFilters"
              :loading="loading"
            >
              Filter
            </v-btn>
          </v-col>
        </v-row>
        
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-4">
          <v-progress-circular
            indeterminate
            color="primary"
          ></v-progress-circular>
          <div class="mt-2">Loading products...</div>
        </div>
        
        <!-- Empty State -->
        <v-alert
          v-else-if="filteredProducts.length === 0"
          type="info"
          text="No products found. Add your first product or adjust your filters."
          class="mb-0"
        ></v-alert>
        
        <!-- Product Table -->
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
            <tr v-for="product in filteredProducts" :key="product.id">
              <td width="80">
                <v-img
                  :src="product.image_url || '/images/food-placeholder.jpg'"
                  width="60"
                  height="60"
                  cover
                  class="rounded"
                ></v-img>
              </td>
              <td>
                <div class="font-weight-medium">{{ product.name }}</div>
                <div class="text-caption text-truncate" style="max-width: 200px;">
                  {{ product.description || 'No description' }}
                </div>
              </td>
              <td>
                {{ getCategoryName(product.category_id) }}
              </td>
              <td>
                {{ formatPrice(product.price) }}
              </td>
              <td>
                <v-chip
                  :color="getStatusColor(product.status)"
                  size="small"
                  class="text-capitalize"
                >
                  {{ product.status }}
                </v-chip>
              </td>
              <td>
                <div class="d-flex">
                  <v-btn
                    icon
                    variant="text"
                    color="primary"
                    @click="editProduct(product)"
                  >
                    <v-icon>mdi-pencil</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="text"
                    color="error"
                    @click="confirmDelete(product)"
                  >
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                  <v-btn
                    icon
                    variant="text"
                    color="info"
                    @click="toggleFeatured(product)"
                  >
                    <v-icon>
                      {{ product.featured ? 'mdi-star' : 'mdi-star-outline' }}
                    </v-icon>
                  </v-btn>
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>
        
        <!-- Pagination -->
        <div v-if="filteredProducts.length > 0" class="text-center mt-4">
          <v-pagination
            v-model="pagination.page"
            :length="pagination.totalPages"
            @update:model-value="changePage"
            rounded="circle"
          ></v-pagination>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Add/Edit Product Dialog -->
    <v-dialog
      v-model="dialog"
      max-width="900"
      scrollable
    >
      <product-form
        v-if="dialog"
        :product="selectedProduct"
        :categories="categories"
        :restaurant-id="restaurantId"
        @save="saveProduct"
        @cancel="dialog = false"
      ></product-form>
    </v-dialog>
    
    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title class="text-h5">
          Delete Product
        </v-card-title>
        
        <v-card-text>
          <p>Are you sure you want to delete <strong>{{ selectedProduct?.name }}</strong>?</p>
          <v-alert
            type="warning"
            density="compact"
            class="mt-2"
          >
            This action cannot be undone.
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
            @click="deleteProduct"
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
import ProductForm from './ProductForm.vue';

export default {
  name: 'ProductList',
  
  components: {
    ProductForm
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
      deleting: false,
      selectedProduct: null,
      filters: {
        search: '',
        category: null,
        status: null
      },
      pagination: {
        page: 1,
        limit: 10,
        totalPages: 1
      },
      statusOptions: [
        { title: 'All Statuses', value: null },
        { title: 'Available', value: 'available' },
        { title: 'Unavailable', value: 'unavailable' },
        { title: 'Sold Out', value: 'sold_out' }
      ]
    };
  },
  
  computed: {
    ...mapState({
      products: state => state.restaurantAdmin.products,
      categories: state => state.restaurantAdmin.categories,
      totalProducts: state => state.restaurantAdmin.totalProducts
    }),
    
    filteredProducts() {
      return this.products;
    },
    
    categoryOptions() {
      const options = [{ title: 'All Categories', value: null }];
      
      if (this.categories) {
        this.categories.forEach(category => {
          options.push({
            title: category.name,
            value: category.id
          });
        });
      }
      
      return options;
    }
  },
  
  watch: {
    showAddDialog(val) {
      if (val) {
        this.openAddDialog();
      }
    }
  },
  
  methods: {
    ...mapActions({
      fetchProducts: 'restaurantAdmin/fetchProducts',
      fetchCategories: 'restaurantAdmin/fetchCategories',
      createProduct: 'restaurantAdmin/createProduct',
      updateProduct: 'restaurantAdmin/updateProduct',
      removeProduct: 'restaurantAdmin/deleteProduct',
      toggleProductFeatured: 'restaurantAdmin/toggleProductFeatured'
    }),
    
    async loadData() {
      this.loading = true;
      
      try {
        // Load categories first
        await this.fetchCategories(this.restaurantId);
        
        // Then load products
        await this.fetchProducts({
          restaurantId: this.restaurantId,
          page: this.pagination.page,
          limit: this.pagination.limit,
          ...this.filters
        });
        
        this.pagination.totalPages = Math.ceil(this.totalProducts / this.pagination.limit);
      } catch (error) {
        this.$toast.error('Failed to load menu data');
        console.error('Error loading menu data:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async applyFilters() {
      this.pagination.page = 1;
      await this.loadData();
    },
    
    async changePage(page) {
      this.pagination.page = page;
      await this.loadData();
    },
    
    openAddDialog() {
      this.selectedProduct = null;
      this.dialog = true;
      this.showAddDialog = false;
    },
    
    editProduct(product) {
      this.selectedProduct = product;
      this.dialog = true;
    },
    
    async saveProduct({ id, formData }) {
      try {
        if (id) {
          // Update existing product
          await this.updateProduct({
            id,
            data: formData
          });
          this.$toast.success('Product updated successfully');
        } else {
          // Create new product
          await this.createProduct(formData);
          this.$toast.success('Product created successfully');
        }
        
        this.dialog = false;
        await this.loadData();
      } catch (error) {
        this.$toast.error(id ? 'Failed to update product' : 'Failed to create product');
        console.error('Error saving product:', error);
      }
    },
    
    confirmDelete(product) {
      this.selectedProduct = product;
      this.deleteDialog = true;
    },
    
    async deleteProduct() {
      if (!this.selectedProduct) return;
      
      this.deleting = true;
      
      try {
        await this.removeProduct(this.selectedProduct.id);
        this.$toast.success('Product deleted successfully');
        this.deleteDialog = false;
        await this.loadData();
      } catch (error) {
        this.$toast.error('Failed to delete product');
        console.error('Error deleting product:', error);
      } finally {
        this.deleting = false;
      }
    },
    
    async toggleFeatured(product) {
      try {
        await this.toggleProductFeatured({
          id: product.id,
          featured: !product.featured
        });
        
        this.$toast.success(
          product.featured
            ? 'Product removed from featured'
            : 'Product added to featured'
        );
        
        // Refresh the product list
        await this.loadData();
      } catch (error) {
        this.$toast.error('Failed to update product');
        console.error('Error updating product featured status:', error);
      }
    },
    
    formatPrice(price) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    },
    
    getCategoryName(categoryId) {
      const category = this.categories.find(cat => cat.id === categoryId);
      return category ? category.name : 'Uncategorized';
    },
    
    getStatusColor(status) {
      switch (status) {
        case 'available':
          return 'success';
        case 'unavailable':
          return 'error';
        case 'sold_out':
          return 'warning';
        default:
          return 'grey';
      }
    }
  },
  
  async mounted() {
    await this.loadData();
  }
};
</script>

<style scoped>
.v-table {
  border-radius: 8px;
}
</style> 