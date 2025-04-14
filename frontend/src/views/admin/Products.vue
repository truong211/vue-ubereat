<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <h1 class="text-h4">Quản Lý Sản Phẩm</h1>
      <v-btn
        color="primary"
        prepend-icon="mdi-food-apple"
        @click="openProductDialog()"
      >
        Thêm Sản Phẩm
      </v-btn>
    </div>

    <!-- Search and Filters -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" sm="4">
            <v-text-field
              v-model="searchQuery"
              label="Tìm kiếm"
              prepend-inner-icon="mdi-magnify"
              clearable
              @input="handleSearch"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="categoryFilter"
              :items="categoryOptions"
              label="Phân loại"
              clearable
              @update:model-value="fetchProducts"
            ></v-select>
          </v-col>
          <v-col cols="12" sm="4">
            <v-select
              v-model="restaurantFilter"
              :items="restaurantOptions"
              label="Nhà hàng"
              clearable
              @update:model-value="fetchProducts"
            ></v-select>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Products Table -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="products"
        :loading="loading"
        :items-per-page="itemsPerPage"
        :page="page"
        :server-items-length="totalProducts"
        @update:page="handlePageChange"
      >
        <template v-slot:item.image="{ item }">
          <v-avatar size="40">
            <v-img
              :src="item.image || '/img/product-placeholder.jpg'"
              :alt="item.name"
            ></v-img>
          </v-avatar>
        </template>
        
        <template v-slot:item.price="{ item }">
          {{ formatPrice(item.price) }}
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="small"
          >
            {{ formatStatus(item.status) }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            color="primary"
            @click="openProductDialog(item)"
          >
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            :color="item.isAvailable ? 'error' : 'success'"
            @click="toggleProductAvailability(item)"
          >
            <v-icon>{{ item.isAvailable ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
          </v-btn>
          <v-btn
            icon
            variant="text"
            size="small"
            color="error"
            @click="confirmDeleteProduct(item)"
          >
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
        
        <!-- Error state -->
        <template v-slot:bottom v-if="error">
          <div class="d-flex align-center justify-center pa-4">
            <v-alert type="error" class="mb-0 mr-4">{{ error }}</v-alert>
            <v-btn color="primary" @click="fetchProducts">Thử lại</v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Product Edit Dialog -->
    <v-dialog v-model="productDialog.show" max-width="700">
      <v-card>
        <v-card-title>
          <span class="text-h5">{{ productDialog.isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới' }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="productForm">
            <v-row>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="productDialog.product.name"
                  label="Tên sản phẩm"
                  required
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  v-model="productDialog.product.price"
                  label="Giá (VND)"
                  type="number"
                  required
                ></v-text-field>
              </v-col>
            </v-row>
            
            <v-row>
              <v-col cols="12" md="6">
                <v-select
                  v-model="productDialog.product.categoryId"
                  :items="categoryOptions"
                  label="Phân loại"
                  required
                ></v-select>
              </v-col>
              <v-col cols="12" md="6">
                <v-select
                  v-model="productDialog.product.restaurantId"
                  :items="restaurantOptions"
                  label="Nhà hàng"
                  required
                ></v-select>
              </v-col>
            </v-row>
            
            <v-textarea
              v-model="productDialog.product.description"
              label="Mô tả"
              rows="3"
            ></v-textarea>
            
            <v-file-input
              v-model="productDialog.product.imageFile"
              label="Hình ảnh sản phẩm"
              accept="image/*"
              prepend-icon="mdi-camera"
              show-size
              truncate-length="15"
              @change="handleImageChange"
            ></v-file-input>
            
            <!-- Add preview image -->
            <div v-if="imagePreview || productDialog.product.image" class="my-3 text-center">
              <v-img
                :src="imagePreview || productDialog.product.image"
                max-width="200"
                max-height="150"
                class="mx-auto rounded"
                cover
              ></v-img>
            </div>
            
            <v-switch
              v-model="productDialog.product.isAvailable"
              color="success"
              label="Trạng thái: Đang bán"
            ></v-switch>
            
            <v-expansion-panels variant="accordion">
              <v-expansion-panel title="Tùy chọn nâng cao">
                <v-expansion-panel-text>
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="productDialog.product.preparationTime"
                        label="Thời gian chuẩn bị (phút)"
                        type="number"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field
                        v-model="productDialog.product.calories"
                        label="Calories"
                        type="number"
                      ></v-text-field>
                    </v-col>
                  </v-row>
                  
                  <v-combobox
                    v-model="productDialog.product.tags"
                    label="Tags (Nhấn Enter để thêm)"
                    chips
                    multiple
                    closable-chips
                  ></v-combobox>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="productDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="primary"
            variant="text"
            @click="saveProduct"
            :loading="productDialog.loading"
          >
            Lưu
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog.show" max-width="500">
      <v-card>
        <v-card-title>Xác nhận xóa</v-card-title>
        <v-card-text>
          Bạn có chắc chắn muốn xóa sản phẩm "{{ deleteDialog.product?.name }}"? Hành động này không thể hoàn tác.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey-darken-1"
            variant="text"
            @click="deleteDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="error"
            variant="text"
            @click="deleteProduct"
            :loading="deleteDialog.loading"
          >
            Xóa
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useStore } from 'vuex'

const toast = useToast()
const store = useStore()

// Table configuration
const headers = [
  { title: 'Hình ảnh', key: 'image', sortable: false },
  { title: 'Tên sản phẩm', key: 'name' },
  { title: 'Giá', key: 'price' },
  { title: 'Nhà hàng', key: 'restaurantName' },
  { title: 'Phân loại', key: 'categoryName' },
  { title: 'Trạng thái', key: 'status' },
  { title: 'Thao tác', key: 'actions', sortable: false }
]

// State
const loading = ref(false)
const error = ref(null)
const products = ref([])
const totalProducts = ref(0)
const page = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref('')
const categoryFilter = ref(null)
const restaurantFilter = ref(null)

// Options for select dropdowns
const categoryOptions = ref([])
const restaurantOptions = ref([])

// Dialog states
const productDialog = ref({
  show: false,
  isEdit: false,
  loading: false,
  product: {}
})

const deleteDialog = ref({
  show: false,
  loading: false,
  product: null
})

// New state variable for image preview
const imagePreview = ref(null)

// Methods
const fetchProducts = async () => {
  try {
    loading.value = true
    error.value = null
    
    // Call the admin/fetchProducts action instead of using mock data
    const response = await store.dispatch('admin/fetchProducts', {
      page: page.value,
      limit: itemsPerPage.value,
      search: searchQuery.value || undefined,
      categoryId: categoryFilter.value || undefined,
      restaurantId: restaurantFilter.value || undefined
    }).catch(err => {
      console.error('Failed to fetch products (caught):', err);
      return { items: [], total: 0 }; // Return a valid fallback response
    });
    
    // Process the response data to match our component's structure
    if (response && response.items) {
      // Make sure each product has the expected properties
      products.value = response.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description || '',
        image: item.image || '/img/product-placeholder.jpg',
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName || (item.restaurant ? item.restaurant.name : 'Unknown'),
        categoryId: item.categoryId,
        categoryName: item.categoryName || (item.category ? item.category.name : 'Uncategorized'),
        isAvailable: typeof item.isAvailable === 'boolean' ? item.isAvailable : (item.status === 'active'),
        status: item.status || (item.isAvailable ? 'active' : 'inactive'),
        preparationTime: item.preparationTime || 0,
        calories: item.calories || 0,
        tags: Array.isArray(item.tags) ? item.tags : []
      }))
      
      totalProducts.value = response.total || 0
    } else {
      products.value = []
      totalProducts.value = 0
    }
    
    // Load categories and restaurants
    await Promise.allSettled([fetchCategories(), fetchRestaurants()]);
  } catch (err) {
    toast.error('Không thể tải danh sách sản phẩm')
    console.error('Failed to fetch products:', err)
    error.value = 'Không thể tải danh sách sản phẩm. Vui lòng thử lại.'
    products.value = []
  } finally {
    loading.value = false
  }
}

const fetchCategories = async () => {
  try {
    // Use store action to fetch categories
    const response = await store.dispatch('admin/fetchCategories').catch(err => {
      console.error('Failed to fetch categories (caught):', err);
      return { data: [] }; // Return a valid fallback response with empty data array
    });
    
    // Debug the response structure
    console.log('Categories response:', response);
    
    // Create a safe fallback if response is invalid
    if (!response) {
      categoryOptions.value = [];
      return;
    }
    
    // Handle different possible response formats
    let categoryData = [];
    if (response.data && Array.isArray(response.data)) {
      categoryData = response.data;
    } else if (response && Array.isArray(response)) {
      categoryData = response;
    } else {
      // Fallback: Create a mock category for UI testing
      categoryData = [
        { id: 1, name: 'Uncategorized' }
      ];
      console.warn('Using fallback category data due to invalid response format');
    }
    
    // Map category data to select options
    categoryOptions.value = categoryData.map(cat => ({
      title: cat.name || 'Unknown Category',
      value: cat.id || 0
    }));
  } catch (err) {
    console.error('Failed to fetch categories:', err)
    toast.error('Không thể tải danh sách phân loại. Vui lòng tải lại trang.')
    // Fallback for error case: provide at least one category option
    categoryOptions.value = [{ title: 'Uncategorized', value: 0 }];
  }
}

const fetchRestaurants = async () => {
  try {
    // Use store action to fetch restaurants
    const response = await store.dispatch('admin/fetchRestaurants').catch(err => {
      console.error('Failed to fetch restaurants (caught):', err);
      return { data: [] }; // Return a valid fallback response with empty data array
    });
    
    // Debug the response structure
    console.log('Restaurants response:', response);
    
    // Create a safe fallback if response is invalid
    if (!response) {
      restaurantOptions.value = [];
      return;
    }
    
    // Handle different possible response formats
    let restaurantsData = [];
    if (response.data && Array.isArray(response.data)) {
      restaurantsData = response.data;
    } else if (response && Array.isArray(response)) {
      restaurantsData = response;
    } else {
      // Fallback: Create a mock restaurant for UI testing
      restaurantsData = [
        { id: 1, name: 'Default Restaurant' }
      ];
      console.warn('Using fallback restaurant data due to invalid response format');
    }
    
    // Map restaurant data to select options
    restaurantOptions.value = restaurantsData.map(restaurant => ({
      title: restaurant.name || 'Unknown Restaurant',
      value: restaurant.id || 0
    }));
  } catch (err) {
    console.error('Failed to fetch restaurants:', err)
    toast.error('Không thể tải danh sách nhà hàng. Vui lòng tải lại trang.')
    // Fallback for error case: provide at least one restaurant option
    restaurantOptions.value = [{ title: 'Default Restaurant', value: 0 }];
  }
}

const handlePageChange = (newPage) => {
  page.value = newPage
  fetchProducts()
}

const handleSearch = () => {
  page.value = 1
  fetchProducts()
}

const openProductDialog = (product = null) => {
  // Reset image preview
  imagePreview.value = null
  
  productDialog.value = {
    show: true,
    isEdit: !!product,
    loading: false,
    product: product ? { ...product } : {
      name: '',
      price: 0,
      restaurantId: null,
      categoryId: null,
      description: '',
      imageFile: null,
      image: '',
      isAvailable: true,
      preparationTime: 10,
      calories: 0,
      tags: []
    }
  }
}

const saveProduct = async () => {
  try {
    productDialog.value.loading = true
    
    const productData = { ...productDialog.value.product }
    
    // Make sure numeric fields are actually numbers
    if (typeof productData.price === 'string') {
      productData.price = parseFloat(productData.price) || 0
    }
    
    if (typeof productData.preparationTime === 'string') {
      productData.preparationTime = parseInt(productData.preparationTime) || 0
    }
    
    if (typeof productData.calories === 'string') {
      productData.calories = parseInt(productData.calories) || 0
    }
    
    let response
    
    if (productDialog.value.isEdit) {
      // Update existing product
      response = await store.dispatch('admin/updateProduct', {
        id: productData.id,
        productData
      })
      toast.success('Cập nhật sản phẩm thành công')
    } else {
      // Create new product
      response = await store.dispatch('admin/createProduct', productData)
      toast.success('Thêm sản phẩm thành công')
    }
    
    productDialog.value.show = false
    fetchProducts()
  } catch (error) {
    let errorMessage = 'Không thể lưu thông tin sản phẩm'
    
    // Check for specific error responses
    if (error.response) {
      if (error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message
      } else if (error.response.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.'
      } else if (error.response.status === 401) {
        errorMessage = 'Bạn không có quyền thực hiện hành động này'
      } else if (error.response.status === 404) {
        errorMessage = 'Không tìm thấy sản phẩm'
      }
    }
    
    toast.error(errorMessage)
    console.error('Failed to save product:', error)
  } finally {
    productDialog.value.loading = false
  }
}

const confirmDeleteProduct = (product) => {
  deleteDialog.value = {
    show: true,
    loading: false,
    product
  }
}

const deleteProduct = async () => {
  try {
    deleteDialog.value.loading = true
    
    // Call admin store action to delete product
    await store.dispatch('admin/deleteProduct', deleteDialog.value.product.id)
    
    toast.success('Xóa sản phẩm thành công')
    deleteDialog.value.show = false
    fetchProducts()
  } catch (error) {
    toast.error('Không thể xóa sản phẩm')
    console.error('Failed to delete product:', error)
  } finally {
    deleteDialog.value.loading = false
  }
}

const toggleProductAvailability = async (product) => {
  try {
    loading.value = true
    
    // Call admin store action to update product availability
    await store.dispatch('admin/updateProductAvailability', {
      id: product.id,
      isAvailable: !product.isAvailable
    })
    
    // Refresh the products list
    fetchProducts()
    
    toast.success(`Sản phẩm đã ${product.isAvailable ? 'ngừng bán' : 'mở bán'}`)
  } catch (error) {
    toast.error('Không thể cập nhật trạng thái sản phẩm')
    console.error('Failed to update product status:', error)
  } finally {
    loading.value = false
  }
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

const getStatusColor = (status) => {
  return status === 'active' ? 'success' : 'error'
}

const formatStatus = (status) => {
  const statusMap = {
    active: 'Đang bán',
    inactive: 'Ngừng bán'
  }
  return statusMap[status] || status
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

// Lifecycle hooks
onMounted(() => {
  fetchProducts()
})
</script> 