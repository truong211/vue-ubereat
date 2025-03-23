<template>
  <v-container fluid>
    <v-tabs v-model="activeTab" grow>
      <v-tab>Categories</v-tab>
      <v-tab>Menu Items</v-tab>
    </v-tabs>

    <v-tabs-items v-model="activeTab">
      <!-- Categories Tab -->
      <v-tab-item>
        <v-container>
          <v-row>
            <v-col cols="12" class="d-flex justify-space-between align-center">
              <h2>Categories</h2>
              <v-btn
                color="primary"
                @click="openCategoryDialog()"
              >
                Add Category
              </v-btn>
            </v-col>
          </v-row>

          <v-data-table
            :headers="categoryHeaders"
            :items="categories"
            :loading="loading"
            :server-items-length="totalCategories"
            :options.sync="categoryOptions"
            @update:options="fetchCategories"
          >
            <template v-slot:item.image="{ item }">
              <v-avatar size="40" v-if="item.image">
                <v-img :src="item.image" :alt="item.name"></v-img>
              </v-avatar>
              <span v-else>No image</span>
            </template>

            <template v-slot:item.isActive="{ item }">
              <v-chip
                :color="item.isActive ? 'success' : 'error'"
                small
              >
                {{ item.isActive ? 'Active' : 'Inactive' }}
              </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                small
                class="mr-2"
                @click="openCategoryDialog(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                small
                color="error"
                @click="confirmDeleteCategory(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-container>
      </v-tab-item>

      <!-- Menu Items Tab -->
      <v-tab-item>
        <v-container>
          <v-row>
            <v-col cols="12" class="d-flex justify-space-between align-center">
              <h2>Menu Items</h2>
              <v-btn
                color="primary"
                @click="openMenuItemDialog()"
              >
                Add Menu Item
              </v-btn>
            </v-col>
          </v-row>

          <!-- Filters -->
          <v-row>
            <v-col cols="12" sm="4">
              <v-select
                v-model="filters.categoryId"
                :items="categories"
                item-text="name"
                item-value="id"
                label="Filter by Category"
                clearable
                @change="fetchMenuItems"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="filters.status"
                :items="statusOptions"
                label="Filter by Status"
                clearable
                @change="fetchMenuItems"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="filters.search"
                label="Search Items"
                append-icon="mdi-magnify"
                clearable
                @input="debounceSearch"
              ></v-text-field>
            </v-col>
          </v-row>

          <v-data-table
            :headers="menuItemHeaders"
            :items="menuItems"
            :loading="loading"
            :server-items-length="totalMenuItems"
            :options.sync="menuItemOptions"
            @update:options="fetchMenuItems"
          >
            <template v-slot:item.image="{ item }">
              <v-avatar size="40" v-if="item.image">
                <v-img :src="item.image" :alt="item.name"></v-img>
              </v-avatar>
              <span v-else>No image</span>
            </template>

            <template v-slot:item.price="{ item }">
              ₫{{ item.price.toLocaleString() }}
            </template>

            <template v-slot:item.discountPrice="{ item }">
              <template v-if="item.discountPrice">
                ₫{{ item.discountPrice.toLocaleString() }}
              </template>
              <span v-else>-</span>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip
                :color="getStatusColor(item.status)"
                small
              >
                {{ item.status }}
              </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon
                small
                class="mr-2"
                @click="openMenuItemDialog(item)"
              >
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                small
                color="error"
                @click="confirmDeleteMenuItem(item)"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-container>
      </v-tab-item>
    </v-tabs-items>

    <!-- Category Dialog -->
    <v-dialog
      v-model="categoryDialog"
      max-width="600px"
    >
      <category-form
        :edit-mode="!!selectedCategory"
        :category="selectedCategory"
        @submit="handleCategorySubmit"
        @cancel="closeCategoryDialog"
      />
    </v-dialog>

    <!-- Menu Item Dialog -->
    <v-dialog
      v-model="menuItemDialog"
      max-width="900px"
    >
      <menu-item-form
        :edit-mode="!!selectedMenuItem"
        :menu-item="selectedMenuItem"
        :categories="categories"
        @submit="handleMenuItemSubmit"
        @cancel="closeMenuItemDialog"
      />
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog
      v-model="deleteDialog"
      max-width="400"
    >
      <v-card>
        <v-card-title>Confirm Delete</v-card-title>
        <v-card-text>
          Are you sure you want to delete this {{ deleteType }}?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            text
            @click="deleteDialog = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="error"
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
import { debounce } from 'lodash'
import CategoryForm from '@/components/admin/CategoryForm.vue'
import MenuItemForm from '@/components/admin/MenuItemForm.vue'

export default {
  name: 'MenuManagement',
  components: {
    CategoryForm,
    MenuItemForm
  },
  data() {
    return {
      activeTab: 0,
      loading: false,
      // Categories
      categories: [],
      totalCategories: 0,
      categoryOptions: {},
      categoryHeaders: [
        { text: 'Image', value: 'image', sortable: false },
        { text: 'Name', value: 'name' },
        { text: 'Description', value: 'description' },
        { text: 'Status', value: 'isActive' },
        { text: 'Display Order', value: 'displayOrder' },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      // Menu Items
      menuItems: [],
      totalMenuItems: 0,
      menuItemOptions: {},
      menuItemHeaders: [
        { text: 'Image', value: 'image', sortable: false },
        { text: 'Name', value: 'name' },
        { text: 'Category', value: 'category.name' },
        { text: 'Price', value: 'price' },
        { text: 'Discount', value: 'discountPrice' },
        { text: 'Status', value: 'status' },
        { text: 'Actions', value: 'actions', sortable: false }
      ],
      // Filters
      filters: {
        categoryId: null,
        status: null,
        search: ''
      },
      // Dialogs
      categoryDialog: false,
      menuItemDialog: false,
      deleteDialog: false,
      // Selected Items
      selectedCategory: null,
      selectedMenuItem: null,
      deleteType: '',
      itemToDelete: null,
      // Options
      statusOptions: [
        { text: 'Available', value: 'available' },
        { text: 'Out of Stock', value: 'out_of_stock' },
        { text: 'Hidden', value: 'hidden' }
      ]
    }
  },
  created() {
    this.fetchCategories()
    this.fetchMenuItems()
    this.debounceSearch = debounce(this.fetchMenuItems, 300)
  },
  methods: {
    // Category Methods
    async fetchCategories() {
      this.loading = true
      try {
        const { data } = await this.$axios.get('/api/categories', {
          params: {
            ...this.categoryOptions,
            restaurantId: this.$store.state.auth.user.restaurantId
          }
        })
        this.categories = data.items
        this.totalCategories = data.total
      } catch (error) {
        console.error('Error fetching categories:', error)
        this.$toast.error('Failed to load categories')
      } finally {
        this.loading = false
      }
    },

    openCategoryDialog(category = null) {
      this.selectedCategory = category
      this.categoryDialog = true
    },

    closeCategoryDialog() {
      this.selectedCategory = null
      this.categoryDialog = false
    },

    async handleCategorySubmit(formData) {
      try {
        if (this.selectedCategory) {
          await this.$axios.patch(`/api/categories/${this.selectedCategory.id}`, formData)
          this.$toast.success('Category updated successfully')
        } else {
          await this.$axios.post('/api/categories', formData)
          this.$toast.success('Category created successfully')
        }
        this.closeCategoryDialog()
        this.fetchCategories()
      } catch (error) {
        console.error('Error submitting category:', error)
        this.$toast.error('Failed to save category')
      }
    },

    // Menu Item Methods
    async fetchMenuItems() {
      this.loading = true
      try {
        const { data } = await this.$axios.get('/api/products', {
          params: {
            ...this.menuItemOptions,
            ...this.filters,
            restaurantId: this.$store.state.auth.user.restaurantId
          }
        })
        this.menuItems = data.items
        this.totalMenuItems = data.total
      } catch (error) {
        console.error('Error fetching menu items:', error)
        this.$toast.error('Failed to load menu items')
      } finally {
        this.loading = false
      }
    },

    openMenuItemDialog(menuItem = null) {
      this.selectedMenuItem = menuItem
      this.menuItemDialog = true
    },

    closeMenuItemDialog() {
      this.selectedMenuItem = null
      this.menuItemDialog = false
    },

    async handleMenuItemSubmit(formData) {
      try {
        if (this.selectedMenuItem) {
          await this.$axios.patch(`/api/products/${this.selectedMenuItem.id}`, formData)
          this.$toast.success('Menu item updated successfully')
        } else {
          await this.$axios.post('/api/products', formData)
          this.$toast.success('Menu item created successfully')
        }
        this.closeMenuItemDialog()
        this.fetchMenuItems()
      } catch (error) {
        console.error('Error submitting menu item:', error)
        this.$toast.error('Failed to save menu item')
      }
    },

    // Delete Methods
    confirmDeleteCategory(category) {
      this.deleteType = 'category'
      this.itemToDelete = category
      this.deleteDialog = true
    },

    confirmDeleteMenuItem(menuItem) {
      this.deleteType = 'menu item'
      this.itemToDelete = menuItem
      this.deleteDialog = true
    },

    async handleDelete() {
      try {
        if (this.deleteType === 'category') {
          await this.$axios.delete(`/api/categories/${this.itemToDelete.id}`)
          this.fetchCategories()
        } else {
          await this.$axios.delete(`/api/products/${this.itemToDelete.id}`)
          this.fetchMenuItems()
        }
        this.$toast.success(`${this.deleteType} deleted successfully`)
      } catch (error) {
        console.error('Error deleting item:', error)
        this.$toast.error(`Failed to delete ${this.deleteType}`)
      } finally {
        this.deleteDialog = false
        this.itemToDelete = null
      }
    },

    // Utility Methods
    getStatusColor(status) {
      switch (status) {
        case 'available':
          return 'success'
        case 'out_of_stock':
          return 'warning'
        case 'hidden':
          return 'grey'
        default:
          return 'primary'
      }
    }
  }
}
</script>