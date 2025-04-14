<!-- This is a new component for managing restaurant products/dishes -->
<template>
  <div class="product-management">
    <v-container>
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex align-center">
              <div>
                <v-btn icon small class="mr-2" @click="goBack">
                  <v-icon>mdi-arrow-left</v-icon>
                </v-btn>
                <span class="headline">Quản lý sản phẩm</span>
              </div>
              <v-spacer></v-spacer>
              <v-btn color="primary" @click="showAddProductDialog">
                <v-icon left>mdi-plus</v-icon>
                Thêm sản phẩm mới
              </v-btn>
            </v-card-title>

            <v-card-text>
              <v-row>
                <v-col cols="12" lg="3" md="4">
                  <!-- Filter Sidebar -->
                  <v-card outlined>
                    <v-card-title class="subtitle-1">Bộ lọc</v-card-title>
                    <v-divider></v-divider>
                    <v-card-text>
                      <v-text-field
                        v-model="filters.search"
                        label="Tìm kiếm sản phẩm"
                        prepend-inner-icon="mdi-magnify"
                        clearable
                        dense
                        outlined
                        hide-details
                        class="mb-4"
                      ></v-text-field>

                      <v-select
                        v-model="filters.category"
                        :items="categories"
                        item-text="name"
                        item-value="id"
                        label="Danh mục"
                        outlined
                        dense
                        clearable
                        hide-details
                        class="mb-4"
                      ></v-select>

                      <v-select
                        v-model="filters.status"
                        :items="statusOptions"
                        item-text="text"
                        item-value="value"
                        label="Trạng thái"
                        outlined
                        dense
                        clearable
                        hide-details
                        class="mb-4"
                      ></v-select>

                      <v-range-slider
                        v-model="filters.priceRange"
                        :max="maxPrice"
                        :min="0"
                        hide-details
                        class="mt-6 mb-2"
                        label="Khoảng giá"
                      >
                        <template v-slot:prepend>
                          <v-text-field
                            :value="formatCurrency(filters.priceRange[0])"
                            readonly
                            outlined
                            dense
                            hide-details
                            class="mt-0 pt-0"
                            style="width: 100px"
                          ></v-text-field>
                        </template>
                        <template v-slot:append>
                          <v-text-field
                            :value="formatCurrency(filters.priceRange[1])"
                            readonly
                            outlined
                            dense
                            hide-details
                            class="mt-0 pt-0"
                            style="width: 100px"
                          ></v-text-field>
                        </template>
                      </v-range-slider>

                      <v-btn
                        block
                        outlined
                        color="primary"
                        class="mt-4"
                        @click="applyFilters"
                      >
                        <v-icon left>mdi-filter</v-icon>
                        Áp dụng bộ lọc
                      </v-btn>
                      
                      <v-btn
                        block
                        text
                        color="grey"
                        class="mt-2"
                        @click="resetFilters"
                      >
                        <v-icon left>mdi-filter-remove</v-icon>
                        Xóa bộ lọc
                      </v-btn>
                    </v-card-text>
                  </v-card>

                  <!-- Categories Management -->
                  <v-card outlined class="mt-4">
                    <v-card-title class="subtitle-1">
                      Danh mục sản phẩm
                      <v-spacer></v-spacer>
                      <v-btn
                        icon
                        x-small
                        @click="showCategoryDialog"
                        color="primary"
                      >
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-list dense>
                      <v-list-item-group v-model="selectedCategory" color="primary">
                        <v-list-item
                          v-for="category in categories"
                          :key="category.id"
                          @click="selectCategory(category.id)"
                        >
                          <v-list-item-icon>
                            <v-icon v-text="category.icon || 'mdi-food'"></v-icon>
                          </v-list-item-icon>
                          <v-list-item-content>
                            <v-list-item-title v-text="category.name"></v-list-item-title>
                            <v-list-item-subtitle>
                              {{ category.productsCount }} sản phẩm
                            </v-list-item-subtitle>
                          </v-list-item-content>
                          <v-list-item-action>
                            <v-menu>
                              <template v-slot:activator="{ on, attrs }">
                                <v-btn icon x-small v-bind="attrs" v-on="on">
                                  <v-icon>mdi-dots-vertical</v-icon>
                                </v-btn>
                              </template>
                              <v-list dense>
                                <v-list-item @click.stop="editCategory(category)">
                                  <v-list-item-icon>
                                    <v-icon small>mdi-pencil</v-icon>
                                  </v-list-item-icon>
                                  <v-list-item-title>Chỉnh sửa</v-list-item-title>
                                </v-list-item>
                                <v-list-item @click.stop="confirmDeleteCategory(category)">
                                  <v-list-item-icon>
                                    <v-icon small color="error">mdi-delete</v-icon>
                                  </v-list-item-icon>
                                  <v-list-item-title class="error--text">Xóa</v-list-item-title>
                                </v-list-item>
                              </v-list>
                            </v-menu>
                          </v-list-item-action>
                        </v-list-item>
                      </v-list-item-group>
                    </v-list>
                  </v-card>
                </v-col>

                <v-col cols="12" lg="9" md="8">
                  <!-- Products List -->
                  <v-card outlined>
                    <v-card-title class="subtitle-1">
                      Danh sách sản phẩm
                      <v-spacer></v-spacer>
                      <v-select
                        v-model="viewMode"
                        :items="viewModeOptions"
                        outlined
                        dense
                        hide-details
                        class="view-mode-select"
                        style="max-width: 150px"
                      ></v-select>
                    </v-card-title>
                    <v-divider></v-divider>

                    <!-- Grid View -->
                    <v-card-text v-if="viewMode === 'grid'">
                      <v-row>
                        <v-col
                          v-for="product in filteredProducts"
                          :key="product.id"
                          cols="12"
                          sm="6"
                          md="4"
                          lg="4"
                        >
                          <v-card
                            outlined
                            hover
                            class="product-card"
                          >
                            <v-img
                              :src="product.image"
                              height="200"
                              cover
                              class="align-end"
                            >
                              <v-chip
                                small
                                class="ma-2"
                                :color="getStatusColor(product.status)"
                                text-color="white"
                              >
                                {{ getStatusText(product.status) }}
                              </v-chip>
                            </v-img>
                            <v-card-title class="subtitle-1 pt-2 pb-0">
                              {{ product.name }}
                            </v-card-title>
                            <v-card-subtitle class="pb-0">
                              <v-chip x-small class="mr-2">{{ getCategoryName(product.categoryId) }}</v-chip>
                              <span>{{ formatCurrency(product.price) }}</span>
                            </v-card-subtitle>
                            <v-card-text class="pt-2">
                              <div class="caption grey--text text-truncate">
                                {{ product.description }}
                              </div>
                            </v-card-text>
                            <v-divider></v-divider>
                            <v-card-actions>
                              <v-btn
                                text
                                small
                                color="primary"
                                @click="editProduct(product)"
                              >
                                <v-icon left small>mdi-pencil</v-icon>
                                Sửa
                              </v-btn>
                              <v-btn
                                text
                                small
                                color="primary"
                                @click="toggleProductStatus(product)"
                              >
                                <v-icon left small>
                                  {{ product.status === 'active' ? 'mdi-eye-off' : 'mdi-eye' }}
                                </v-icon>
                                {{ product.status === 'active' ? 'Ẩn' : 'Hiện' }}
                              </v-btn>
                              <v-spacer></v-spacer>
                              <v-btn
                                text
                                small
                                color="error"
                                @click="confirmDeleteProduct(product)"
                              >
                                <v-icon left small>mdi-delete</v-icon>
                                Xóa
                              </v-btn>
                            </v-card-actions>
                          </v-card>
                        </v-col>

                        <v-col v-if="filteredProducts.length === 0" cols="12">
                          <v-alert type="info" outlined>
                            Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
                          </v-alert>
                        </v-col>
                      </v-row>
                    </v-card-text>

                    <!-- Table View -->
                    <v-data-table
                      v-else
                      :headers="tableHeaders"
                      :items="filteredProducts"
                      :items-per-page="10"
                      :footer-props="{
                        itemsPerPageOptions: [5, 10, 15, 20],
                      }"
                      class="elevation-0"
                    >
                      <template v-slot:item.image="{ item }">
                        <v-avatar size="40" class="my-1">
                          <v-img :src="item.image" :alt="item.name"></v-img>
                        </v-avatar>
                      </template>

                      <template v-slot:item.name="{ item }">
                        <div class="font-weight-medium">{{ item.name }}</div>
                        <div class="caption">
                          <v-chip x-small>{{ getCategoryName(item.categoryId) }}</v-chip>
                        </div>
                      </template>

                      <template v-slot:item.price="{ item }">
                        {{ formatCurrency(item.price) }}
                      </template>

                      <template v-slot:item.status="{ item }">
                        <v-chip
                          small
                          :color="getStatusColor(item.status)"
                          text-color="white"
                        >
                          {{ getStatusText(item.status) }}
                        </v-chip>
                      </template>
                      
                      <template v-slot:item.options="{ item }">
                        <v-chip-group column>
                          <v-chip v-for="option in item.options" :key="option.id" x-small>
                            {{ option.name }}
                          </v-chip>
                        </v-chip-group>
                      </template>

                      <template v-slot:item.actions="{ item }">
                        <v-btn
                          icon
                          x-small
                          color="primary"
                          class="mr-1"
                          @click="editProduct(item)"
                        >
                          <v-icon>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          x-small
                          :color="item.status === 'active' ? 'warning' : 'success'"
                          class="mr-1"
                          @click="toggleProductStatus(item)"
                        >
                          <v-icon>{{ item.status === 'active' ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          x-small
                          color="error"
                          @click="confirmDeleteProduct(item)"
                        >
                          <v-icon>mdi-delete</v-icon>
                        </v-btn>
                      </template>
                    </v-data-table>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Add/Edit Product Dialog -->
    <v-dialog v-model="productDialog" max-width="800px" persistent>
      <v-card>
        <v-card-title class="headline">
          {{ editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="productForm" v-model="validForm">
            <v-container>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.name"
                    label="Tên sản phẩm"
                    :rules="[v => !!v || 'Tên sản phẩm là bắt buộc']"
                    required
                    outlined
                    dense
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="productForm.categoryId"
                    :items="categories"
                    item-text="name"
                    item-value="id"
                    label="Danh mục"
                    :rules="[v => !!v || 'Danh mục là bắt buộc']"
                    required
                    outlined
                    dense
                  ></v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.price"
                    label="Giá bán"
                    :rules="[
                      v => !!v || 'Giá bán là bắt buộc',
                      v => v > 0 || 'Giá bán phải lớn hơn 0',
                    ]"
                    type="number"
                    suffix="VND"
                    required
                    outlined
                    dense
                  ></v-text-field>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="productForm.status"
                    :items="statusOptions"
                    item-text="text"
                    item-value="value"
                    label="Trạng thái"
                    outlined
                    dense
                  ></v-select>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="productForm.description"
                    label="Mô tả sản phẩm"
                    outlined
                    dense
                    auto-grow
                    rows="3"
                  ></v-textarea>
                </v-col>
                <v-col cols="12">
                  <v-file-input
                    v-model="productForm.imageFile"
                    label="Hình ảnh sản phẩm"
                    accept="image/*"
                    outlined
                    dense
                    prepend-icon="mdi-camera"
                    placeholder="Chọn hoặc kéo thả ảnh vào đây"
                    hint="Định dạng: JPG, PNG, GIF"
                    show-size
                  ></v-file-input>
                </v-col>
                <v-col cols="12" v-if="productForm.image">
                  <div class="d-flex align-center">
                    <span class="body-2 mr-4">Ảnh hiện tại:</span>
                    <v-avatar size="64">
                      <v-img :src="productForm.image" :alt="productForm.name"></v-img>
                    </v-avatar>
                  </div>
                </v-col>

                <!-- Product Options Section -->
                <v-col cols="12">
                  <div class="d-flex align-center">
                    <div class="subtitle-1">Tùy chọn sản phẩm</div>
                    <v-spacer></v-spacer>
                    <v-btn color="primary" text @click="addOption">
                      <v-icon left>mdi-plus</v-icon> Thêm tùy chọn
                    </v-btn>
                  </div>
                  <v-divider class="my-2"></v-divider>
                </v-col>

                <template v-if="productForm.options.length > 0">
                  <v-col cols="12" v-for="(option, optionIndex) in productForm.options" :key="optionIndex">
                    <v-card outlined>
                      <v-card-text>
                        <v-row>
                          <v-col cols="12" md="6">
                            <v-text-field
                              v-model="option.name"
                              label="Tên tùy chọn"
                              outlined
                              dense
                              hide-details
                            ></v-text-field>
                          </v-col>
                          <v-col cols="12" md="5">
                            <v-select
                              v-model="option.type"
                              :items="optionTypes"
                              label="Loại tùy chọn"
                              outlined
                              dense
                              hide-details
                            ></v-select>
                          </v-col>
                          <v-col cols="12" md="1" class="d-flex align-center justify-center">
                            <v-btn icon color="error" @click="removeOption(optionIndex)">
                              <v-icon>mdi-delete</v-icon>
                            </v-btn>
                          </v-col>
                          
                          <v-col cols="12">
                            <v-divider class="mb-2"></v-divider>
                            <div class="d-flex align-center mb-2">
                              <div class="body-2">Các giá trị</div>
                              <v-spacer></v-spacer>
                              <v-btn x-small text color="primary" @click="addOptionValue(optionIndex)">
                                <v-icon x-small left>mdi-plus</v-icon> Thêm giá trị
                              </v-btn>
                            </div>
                            
                            <div v-for="(value, valueIndex) in option.values" :key="valueIndex" class="mb-2">
                              <v-row align="center">
                                <v-col cols="12" sm="5">
                                  <v-text-field
                                    v-model="value.label"
                                    label="Nhãn"
                                    outlined
                                    dense
                                    hide-details
                                  ></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="5">
                                  <v-text-field
                                    v-model.number="value.price"
                                    label="Giá thêm"
                                    type="number"
                                    outlined
                                    dense
                                    hide-details
                                    suffix="VND"
                                  ></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="2" class="d-flex align-center">
                                  <v-btn icon x-small color="error" @click="removeOptionValue(optionIndex, valueIndex)">
                                    <v-icon>mdi-close</v-icon>
                                  </v-btn>
                                </v-col>
                              </v-row>
                            </div>
                            
                            <div v-if="option.values.length === 0" class="text-center pa-2 grey--text text--lighten-1">
                              Chưa có giá trị. Hãy thêm giá trị mới.
                            </div>
                          </v-col>
                        </v-row>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </template>
                
                <v-col cols="12" v-else>
                  <v-alert type="info" text>
                    Sản phẩm chưa có tùy chọn. Thêm tùy chọn như kích thước, đá, đường...
                  </v-alert>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="closeProductDialog">Hủy</v-btn>
          <v-btn color="success" text @click="saveProduct" :disabled="!validForm">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Category Dialog -->
    <v-dialog v-model="categoryDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="headline">
          {{ editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="categoryForm" v-model="validCategoryForm">
            <v-container>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="categoryForm.name"
                    label="Tên danh mục"
                    :rules="[v => !!v || 'Tên danh mục là bắt buộc']"
                    required
                    outlined
                    dense
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="categoryForm.icon"
                    label="Icon (Material Design Icons)"
                    prefix="mdi-"
                    outlined
                    dense
                    hint="Ví dụ: food, coffee, pizza,..."
                    persistent-hint
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="categoryForm.description"
                    label="Mô tả danh mục"
                    outlined
                    dense
                    rows="3"
                  ></v-textarea>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="error" text @click="closeCategoryDialog">Hủy</v-btn>
          <v-btn color="success" text @click="saveCategory" :disabled="!validCategoryForm">Lưu</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="headline error--text">
          <v-icon large color="error" class="mr-2">mdi-alert-circle</v-icon>
          Xác nhận xóa
        </v-card-title>
        <v-card-text>
          <p>{{ deleteMessage }}</p>
          <p>Hành động này không thể hoàn tác. Bạn có chắc chắn muốn tiếp tục?</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey darken-1" text @click="deleteDialog = false">Hủy</v-btn>
          <v-btn color="error" text @click="confirmDelete">Xóa</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'ProductManagement',
  
  data() {
    return {
      // View controls
      viewMode: 'grid',
      viewModeOptions: [
        { text: 'Dạng lưới', value: 'grid' },
        { text: 'Dạng bảng', value: 'table' }
      ],
      
      // Filters
      filters: {
        search: '',
        category: null,
        status: null,
        priceRange: [0, 1000000]
      },
      
      // Product form
      productDialog: false,
      validForm: false,
      editingProduct: false,
      productForm: {
        id: null,
        name: '',
        description: '',
        price: 0,
        categoryId: null,
        status: 'active',
        image: null,
        imageFile: null,
        options: []
      },
      
      // Category form
      categoryDialog: false,
      validCategoryForm: false,
      editingCategory: false,
      categoryForm: {
        id: null,
        name: '',
        icon: '',
        description: '',
      },
      
      // Delete dialog
      deleteDialog: false,
      deleteType: null, // 'product' or 'category'
      deleteItem: null,
      deleteMessage: '',
      
      // Selected category
      selectedCategory: null,
      
      // Table headers
      tableHeaders: [
        { text: 'Hình ảnh', value: 'image', sortable: false },
        { text: 'Tên sản phẩm', value: 'name' },
        { text: 'Giá bán', value: 'price' },
        { text: 'Trạng thái', value: 'status' },
        { text: 'Tùy chọn', value: 'options', sortable: false },
        { text: 'Thao tác', value: 'actions', sortable: false, align: 'center' }
      ],
      
      // Status options
      statusOptions: [
        { text: 'Hoạt động', value: 'active' },
        { text: 'Hết hàng', value: 'out_of_stock' },
        { text: 'Ẩn', value: 'hidden' }
      ],
      
      // Option types
      optionTypes: [
        { text: 'Đơn lựa chọn', value: 'single' },
        { text: 'Đa lựa chọn', value: 'multiple' }
      ],
      
      // Mock data
      products: [],
      categories: []
    };
  },
  
  computed: {
    maxPrice() {
      if (this.products.length === 0) return 1000000;
      return Math.max(...this.products.map(p => p.price)) + 100000;
    },
    
    filteredProducts() {
      let result = [...this.products];
      
      if (this.filters.search) {
        const searchLower = this.filters.search.toLowerCase();
        result = result.filter(product => 
          product.name.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower)
        );
      }
      
      if (this.filters.category) {
        result = result.filter(product => product.categoryId === this.filters.category);
      }
      
      if (this.filters.status) {
        result = result.filter(product => product.status === this.filters.status);
      }
      
      result = result.filter(product => 
        product.price >= this.filters.priceRange[0] && 
        product.price <= this.filters.priceRange[1]
      );
      
      return result;
    }
  },
  
  created() {
    this.fetchProducts();
    this.fetchCategories();
  },
  
  methods: {
    fetchProducts() {
      // Mock data - Replace with actual API call
      this.products = [
        {
          id: 1,
          name: 'Cà phê đen',
          description: 'Cà phê nguyên chất được pha phin truyền thống, đậm đà hương vị.',
          price: 29000,
          categoryId: 1,
          status: 'active',
          image: 'https://example.com/images/black-coffee.jpg',
          options: [
            {
              id: 1,
              name: 'Kích cỡ',
              type: 'single',
              values: [
                { id: 1, label: 'Nhỏ', price: 0 },
                { id: 2, label: 'Vừa', price: 5000 },
                { id: 3, label: 'Lớn', price: 10000 }
              ]
            },
            {
              id: 2,
              name: 'Đường',
              type: 'single',
              values: [
                { id: 4, label: 'Không đường', price: 0 },
                { id: 5, label: 'Ít đường', price: 0 },
                { id: 6, label: 'Đường vừa', price: 0 },
                { id: 7, label: 'Nhiều đường', price: 0 }
              ]
            }
          ]
        },
        {
          id: 2,
          name: 'Cà phê sữa',
          description: 'Cà phê phin truyền thống kết hợp với sữa đặc, tạo nên hương vị đậm đà khó quên.',
          price: 35000,
          categoryId: 1,
          status: 'active',
          image: 'https://example.com/images/milk-coffee.jpg',
          options: [
            {
              id: 3,
              name: 'Kích cỡ',
              type: 'single',
              values: [
                { id: 8, label: 'Nhỏ', price: 0 },
                { id: 9, label: 'Vừa', price: 5000 },
                { id: 10, label: 'Lớn', price: 10000 }
              ]
            }
          ]
        },
        {
          id: 3,
          name: 'Bánh mì thịt nguội',
          description: 'Bánh mì giòn với thịt nguội, pate, rau thơm và gia vị đậm đà.',
          price: 25000,
          categoryId: 2,
          status: 'active',
          image: 'https://example.com/images/banh-mi.jpg',
          options: []
        }
      ];
    },
    
    fetchCategories() {
      // Mock data - Replace with actual API call
      this.categories = [
        {
          id: 1,
          name: 'Cà phê',
          icon: 'mdi-coffee',
          description: 'Các loại cà phê đặc trưng',
          productsCount: 2
        },
        {
          id: 2,
          name: 'Bánh mì',
          icon: 'mdi-baguette',
          description: 'Các loại bánh mì tươi ngon',
          productsCount: 1
        },
        {
          id: 3,
          name: 'Trà & Trà sữa',
          icon: 'mdi-tea',
          description: 'Các loại trà thơm ngon',
          productsCount: 0
        },
        {
          id: 4,
          name: 'Bánh ngọt',
          icon: 'mdi-cake',
          description: 'Các loại bánh ngọt',
          productsCount: 0
        }
      ];
    },
    
    formatCurrency(amount) {
      return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(amount);
    },
    
    getStatusColor(status) {
      switch (status) {
        case 'active':
          return 'success';
        case 'out_of_stock':
          return 'warning';
        case 'hidden':
          return 'grey';
        default:
          return 'grey';
      }
    },
    
    getStatusText(status) {
      switch (status) {
        case 'active':
          return 'Hoạt động';
        case 'out_of_stock':
          return 'Hết hàng';
        case 'hidden':
          return 'Đã ẩn';
        default:
          return status;
      }
    },
    
    getCategoryName(categoryId) {
      const category = this.categories.find(c => c.id === categoryId);
      return category ? category.name : 'Không phân loại';
    },
    
    applyFilters() {
      // Logic to apply filters
      console.log('Filters applied:', this.filters);
    },
    
    resetFilters() {
      this.filters = {
        search: '',
        category: null,
        status: null,
        priceRange: [0, this.maxPrice]
      };
    },
    
    selectCategory(categoryId) {
      this.filters.category = categoryId;
      this.applyFilters();
    },
    
    goBack() {
      this.$router.go(-1);
    },
    
    // Product CRUD operations
    showAddProductDialog() {
      this.editingProduct = false;
      this.productForm = {
        id: null,
        name: '',
        description: '',
        price: 0,
        categoryId: null,
        status: 'active',
        image: null,
        imageFile: null,
        options: []
      };
      this.productDialog = true;
    },
    
    editProduct(product) {
      this.editingProduct = true;
      // Clone the product to avoid modifying the original
      this.productForm = JSON.parse(JSON.stringify(product));
      this.productForm.imageFile = null;
      this.productDialog = true;
    },
    
    closeProductDialog() {
      this.productDialog = false;
      // Reset form
      if (this.$refs.productForm) {
        this.$refs.productForm.reset();
      }
    },
    
    saveProduct() {
      if (!this.$refs.productForm.validate()) return;
      
      // Upload image logic would go here
      
      if (this.editingProduct) {
        // Update existing product
        const index = this.products.findIndex(p => p.id === this.productForm.id);
        if (index !== -1) {
          // If no new image was uploaded, keep the old image
          if (!this.productForm.imageFile) {
            this.productForm.image = this.products[index].image;
          }
          this.products.splice(index, 1, { ...this.productForm });
        }
      } else {
        // Create new product
        const newId = Math.max(0, ...this.products.map(p => p.id)) + 1;
        // Normally we would get the image URL from the upload response
        this.productForm.image = this.productForm.image || 'https://example.com/images/placeholder.jpg';
        this.products.push({
          ...this.productForm,
          id: newId
        });
        
        // Update category product count
        const categoryIndex = this.categories.findIndex(c => c.id === this.productForm.categoryId);
        if (categoryIndex !== -1) {
          this.categories[categoryIndex].productsCount += 1;
        }
      }
      
      // Show success message
      this.$store.dispatch('ui/showSnackbar', {
        message: `Sản phẩm đã được ${this.editingProduct ? 'cập nhật' : 'thêm'} thành công!`,
        color: 'success'
      });
      
      this.closeProductDialog();
    },
    
    confirmDeleteProduct(product) {
      this.deleteType = 'product';
      this.deleteItem = product;
      this.deleteMessage = `Bạn đang chuẩn bị xóa sản phẩm "${product.name}".`;
      this.deleteDialog = true;
    },
    
    toggleProductStatus(product) {
      const index = this.products.findIndex(p => p.id === product.id);
      if (index !== -1) {
        const updatedProduct = { ...this.products[index] };
        updatedProduct.status = updatedProduct.status === 'active' ? 'hidden' : 'active';
        this.products.splice(index, 1, updatedProduct);
        
        // Show success message
        this.$store.dispatch('ui/showSnackbar', {
          message: `Trạng thái sản phẩm đã được thay đổi thành ${this.getStatusText(updatedProduct.status)}!`,
          color: 'success'
        });
      }
    },
    
    // Category CRUD operations
    showCategoryDialog() {
      this.editingCategory = false;
      this.categoryForm = {
        id: null,
        name: '',
        icon: '',
        description: ''
      };
      this.categoryDialog = true;
    },
    
    editCategory(category) {
      this.editingCategory = true;
      this.categoryForm = { ...category };
      if (this.categoryForm.icon && this.categoryForm.icon.startsWith('mdi-')) {
        this.categoryForm.icon = this.categoryForm.icon.substring(4);
      }
      this.categoryDialog = true;
    },
    
    closeCategoryDialog() {
      this.categoryDialog = false;
      // Reset form
      if (this.$refs.categoryForm) {
        this.$refs.categoryForm.reset();
      }
    },
    
    saveCategory() {
      if (!this.$refs.categoryForm.validate()) return;
      
      // Ensure icon has mdi- prefix
      if (this.categoryForm.icon && !this.categoryForm.icon.startsWith('mdi-')) {
        this.categoryForm.icon = 'mdi-' + this.categoryForm.icon;
      }
      
      if (this.editingCategory) {
        // Update existing category
        const index = this.categories.findIndex(c => c.id === this.categoryForm.id);
        if (index !== -1) {
          const productsCount = this.categories[index].productsCount;
          this.categories.splice(index, 1, { 
            ...this.categoryForm,
            productsCount
          });
        }
      } else {
        // Create new category
        const newId = Math.max(0, ...this.categories.map(c => c.id)) + 1;
        this.categories.push({
          ...this.categoryForm,
          id: newId,
          productsCount: 0
        });
      }
      
      // Show success message
      this.$store.dispatch('ui/showSnackbar', {
        message: `Danh mục đã được ${this.editingCategory ? 'cập nhật' : 'thêm'} thành công!`,
        color: 'success'
      });
      
      this.closeCategoryDialog();
    },
    
    confirmDeleteCategory(category) {
      const productsInCategory = this.products.filter(p => p.categoryId === category.id).length;
      
      if (productsInCategory > 0) {
        this.$store.dispatch('ui/showSnackbar', {
          message: `Không thể xóa danh mục này vì đang có ${productsInCategory} sản phẩm thuộc danh mục!`,
          color: 'error'
        });
        return;
      }
      
      this.deleteType = 'category';
      this.deleteItem = category;
      this.deleteMessage = `Bạn đang chuẩn bị xóa danh mục "${category.name}".`;
      this.deleteDialog = true;
    },
    
    confirmDelete() {
      if (this.deleteType === 'product') {
        const index = this.products.findIndex(p => p.id === this.deleteItem.id);
        if (index !== -1) {
          // Update category product count
          const categoryId = this.products[index].categoryId;
          const categoryIndex = this.categories.findIndex(c => c.id === categoryId);
          if (categoryIndex !== -1 && this.categories[categoryIndex].productsCount > 0) {
            this.categories[categoryIndex].productsCount -= 1;
          }
          
          // Remove the product
          this.products.splice(index, 1);
        }
      } else if (this.deleteType === 'category') {
        const index = this.categories.findIndex(c => c.id === this.deleteItem.id);
        if (index !== -1) {
          this.categories.splice(index, 1);
        }
      }
      
      // Show success message
      this.$store.dispatch('ui/showSnackbar', {
        message: `${this.deleteType === 'product' ? 'Sản phẩm' : 'Danh mục'} đã được xóa thành công!`,
        color: 'success'
      });
      
      this.deleteDialog = false;
    },
    
    // Product options management
    addOption() {
      this.productForm.options.push({
        id: Date.now(), // Temporary ID
        name: '',
        type: 'single',
        values: []
      });
    },
    
    removeOption(index) {
      this.productForm.options.splice(index, 1);
    },
    
    addOptionValue(optionIndex) {
      const option = this.productForm.options[optionIndex];
      option.values.push({
        id: Date.now(), // Temporary ID
        label: '',
        price: 0
      });
    },
    
    removeOptionValue(optionIndex, valueIndex) {
      this.productForm.options[optionIndex].values.splice(valueIndex, 1);
    }
  }
};
</script>

<style scoped>
.view-mode-select ::v-deep .v-input__slot {
  min-height: 36px !important;
}

.product-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.product-card .v-card__text {
  flex-grow: 1;
}
</style>