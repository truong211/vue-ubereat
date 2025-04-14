<template>
  <div>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4">{{ $t('restaurant.menu.title') }}</h1>
      <v-spacer></v-spacer>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        @click="openItemDialog()"
      >
        {{ $t('restaurant.menu.addMenuItem') }}
      </v-btn>
    </div>

    <!-- Categories Navigation -->
    <v-card class="mb-6">
      <v-tabs
        v-model="activeCategory"
        show-arrows
        color="primary"
      >
        <v-tab value="all">{{ $t('restaurant.menu.allItems') }}</v-tab>
        <v-tab
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
        >
          {{ category.name }}
        </v-tab>
        <v-tab value="new" @click="openCategoryDialog()">
          <v-icon>mdi-plus</v-icon>
        </v-tab>
      </v-tabs>
    </v-card>

    <!-- Menu Items Grid -->
    <v-row>
      <v-col
        v-for="item in filteredItems"
        :key="item.id"
        cols="12"
        sm="6"
        md="4"
        lg="3"
      >
        <v-card>
          <v-img
            :src="item.image"
            height="200"
            cover
          >
            <template v-slot:placeholder>
              <v-row
                class="fill-height ma-0"
                align="center"
                justify="center"
              >
                <v-progress-circular
                  indeterminate
                  color="grey-lighten-5"
                ></v-progress-circular>
              </v-row>
            </template>
            <!-- Item Status Badge -->
            <v-chip
              class="ma-2"
              :color="item.available ? 'success' : 'error'"
            >
              {{ item.available ? $t('common.available') : $t('common.unavailable') }}
            </v-chip>
          </v-img>

          <v-card-title>{{ item.name }}</v-card-title>

          <v-card-text>
            <div class="text-subtitle-1 mb-1">
              {{ formatPrice(item.price) }}
            </div>
            <div class="text-caption">{{ item.description }}</div>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              icon="mdi-eye"
              variant="text"
              @click="openItemDialog(item)"
            ></v-btn>
            <v-btn
              :icon="item.available ? 'mdi-close' : 'mdi-check'"
              variant="text"
              :color="item.available ? 'error' : 'success'"
              @click="toggleItemAvailability(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              @click="confirmDelete(item)"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Menu Item Dialog -->
    <v-dialog
      v-model="itemDialog.show"
      max-width="700"
      persistent
    >
      <v-card>
        <v-card-title>
          {{ itemDialog.item ? 'Edit' : 'Add' }} Menu Item
        </v-card-title>

        <v-card-text>
          <v-form ref="itemForm" v-model="itemDialog.valid">
            <v-row>
              <!-- Basic Info -->
              <v-col cols="12" sm="8">
                <v-text-field
                  v-model="itemDialog.form.name"
                  label="Item Name"
                  :rules="[rules.required]"
                  variant="outlined"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="itemDialog.form.price"
                  label="Base Price"
                  type="number"
                  prefix="$"
                  :rules="[rules.required, rules.price]"
                  variant="outlined"
                ></v-text-field>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="itemDialog.form.description"
                  label="Description"
                  :rules="[rules.required]"
                  variant="outlined"
                  rows="3"
                ></v-textarea>
              </v-col>

              <!-- Category Selection -->
              <v-col cols="12" sm="6">
                <v-select
                  v-model="itemDialog.form.categoryId"
                  label="Category"
                  :items="categories"
                  item-title="name"
                  item-value="id"
                  :rules="[rules.required]"
                  variant="outlined"
                ></v-select>
              </v-col>

              <!-- Image Upload -->
              <v-col cols="12">
                <v-file-input
                  v-model="itemDialog.form.image"
                  label="Item Image"
                  accept="image/*"
                  :rules="[itemDialog.item ? undefined : rules.required]"
                  variant="outlined"
                  prepend-icon="mdi-camera"
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
                      variant="outlined"
                      density="compact"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="5">
                    <v-text-field
                      v-model="size.price"
                      label="Additional Price"
                      type="number"
                      prefix="$"
                      variant="outlined"
                      density="compact"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="2">
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      density="compact"
                      @click="removeSizeOption(index)"
                    ></v-btn>
                  </v-col>
                </v-row>
              </v-col>

              <!-- Toppings -->
              <v-col cols="12">
                <div class="d-flex align-center mb-2">
                  <div class="text-subtitle-1">Toppings</div>
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
                      variant="outlined"
                      density="compact"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="5">
                    <v-text-field
                      v-model="topping.price"
                      label="Price"
                      type="number"
                      prefix="$"
                      variant="outlined"
                      density="compact"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="2">
                    <v-btn
                      icon="mdi-delete"
                      variant="text"
                      color="error"
                      density="compact"
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
            {{ itemDialog.item ? 'Update' : 'Add' }} Item
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Category Dialog -->
    <v-dialog
      v-model="categoryDialog.show"
      max-width="500"
    >
      <v-card>
        <v-card-title>
          {{ categoryDialog.category ? 'Edit' : 'Add' }} Category
        </v-card-title>

        <v-card-text>
          <v-form ref="categoryForm" v-model="categoryDialog.valid">
            <v-text-field
              v-model="categoryDialog.form.name"
              label="Category Name"
              :rules="[rules.required]"
              variant="outlined"
            ></v-text-field>
            <v-textarea
              v-model="categoryDialog.form.description"
              label="Description"
              variant="outlined"
              rows="3"
            ></v-textarea>
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
            {{ categoryDialog.category ? 'Update' : 'Add' }} Category
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Confirm Delete Dialog -->
    <v-dialog
      v-model="confirmDialog.show"
      max-width="400"
    >
      <v-card>
        <v-card-title>{{ confirmDialog.title }}</v-card-title>
        <v-card-text>{{ confirmDialog.message }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="confirmDialog.show = false"
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
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'

export default {
  name: 'RestaurantMenu',

  setup() {
    const store = useStore()
    const itemForm = ref(null)
    const categoryForm = ref(null)
    const { t, locale } = useI18n()

    // State
    const activeCategory = ref('all')
    const menuItems = computed(() => store.getters['restaurantAdmin/getMenuItems'])
    const categories = computed(() => store.state.restaurantAdmin.categories)

    const filteredItems = computed(() => {
      if (activeCategory.value === 'all') return menuItems.value
      return menuItems.value.filter(item => item.categoryId === activeCategory.value)
    })

    // Dialog states
    const itemDialog = ref({
      show: false,
      loading: false,
      valid: false,
      item: null,
      form: {
        name: '',
        price: '',
        description: '',
        categoryId: null,
        image: null,
        sizes: [],
        toppings: []
      }
    })

    const categoryDialog = ref({
      show: false,
      loading: false,
      valid: false,
      category: null,
      form: {
        name: '',
        description: ''
      }
    })

    const confirmDialog = ref({
      show: false,
      title: '',
      message: '',
      item: null
    })

    // Validation rules
    const rules = {
      required: v => !!v || 'Required',
      price: v => v >= 0 || 'Price must be non-negative'
    }

    // Methods
    const openItemDialog = (item = null) => {
      if (item) {
        itemDialog.value.item = item
        itemDialog.value.form = { ...item }
      } else {
        itemDialog.value.item = null
        itemDialog.value.form = {
          name: '',
          price: '',
          description: '',
          categoryId: null,
          image: null,
          sizes: [],
          toppings: []
        }
      }
      itemDialog.value.show = true
    }

    const closeItemDialog = () => {
      itemDialog.value.show = false
      itemDialog.value.item = null
      itemDialog.value.form = {
        name: '',
        price: '',
        description: '',
        categoryId: null,
        image: null,
        sizes: [],
        toppings: []
      }
    }

    const openCategoryDialog = (category = null) => {
      if (category) {
        categoryDialog.value.category = category
        categoryDialog.value.form = { ...category }
      }
      categoryDialog.value.show = true
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
        if (itemDialog.value.item) {
          await store.dispatch('restaurantAdmin/updateMenuItem', {
            id: itemDialog.value.item.id,
            ...itemDialog.value.form
          })
        } else {
          await store.dispatch('restaurantAdmin/createMenuItem', itemDialog.value.form)
        }
        closeItemDialog()
      } catch (error) {
        console.error('Failed to save menu item:', error)
      } finally {
        itemDialog.value.loading = false
      }
    }

    const saveCategory = async () => {
      if (!categoryForm.value.validate()) return

      categoryDialog.value.loading = true
      try {
        if (categoryDialog.value.category) {
          await store.dispatch('restaurantAdmin/updateCategory', {
            id: categoryDialog.value.category.id,
            ...categoryDialog.value.form
          })
        } else {
          await store.dispatch('restaurantAdmin/createCategory', categoryDialog.value.form)
        }
        categoryDialog.value.show = false
      } catch (error) {
        console.error('Failed to save category:', error)
      } finally {
        categoryDialog.value.loading = false
      }
    }

    const toggleItemAvailability = async (item) => {
      try {
        await store.dispatch('restaurantAdmin/updateMenuItem', {
          id: item.id,
          available: !item.available
        })
      } catch (error) {
        console.error('Failed to toggle item availability:', error)
      }
    }

    const confirmDelete = (item) => {
      confirmDialog.value = {
        show: true,
        title: 'Delete Menu Item',
        message: `Are you sure you want to delete "${item.name}"?`,
        item
      }
    }

    const handleDelete = async () => {
      if (!confirmDialog.value.item) return

      try {
        if (confirmDialog.value.item.type === 'category') {
          await store.dispatch('categories/deleteCategory', confirmDialog.value.item.id)
        } else {
          await store.dispatch('restaurantAdmin/deleteMenuItem', confirmDialog.value.item.id)
        }
        confirmDialog.value.show = false
      } catch (error) {
        console.error('Failed to delete menu item:', error)
      }
    }

    const formatPrice = (price) => {
      return `$${Number(price).toFixed(2)}`
    }

    // Lifecycle
    onMounted(async () => {
      try {
        await Promise.all([
          store.dispatch('restaurantAdmin/fetchMenuItems'),
          store.dispatch('restaurantAdmin/fetchCategories')
        ])
      } catch (error) {
        console.error('Failed to fetch menu data:', error)
      }
    })

    return {
      // State
      activeCategory,
      menuItems,
      categories,
      filteredItems,
      itemDialog,
      categoryDialog,
      confirmDialog,
      itemForm,
      categoryForm,
      rules,

      // Methods
      openItemDialog,
      closeItemDialog,
      openCategoryDialog,
      addSizeOption,
      removeSizeOption,
      addTopping,
      removeTopping,
      saveItem,
      saveCategory,
      toggleItemAvailability,
      confirmDelete,
      handleDelete,
      formatPrice
    }
  },

  methods: {
    // Format price
    formatPrice(price) {
      const locale = this.$i18n.locale
      return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: locale === 'vi' ? 'VND' : 'USD'
      }).format(price)
    }
  }
}
</script>
