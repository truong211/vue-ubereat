<!-- Previous template content remains the same until the script section -->

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'

interface Category {
  id: string
  name: string
  icon?: string
  description?: string
}

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image: string
  tags: string[]
  available: boolean
  categoryId: string
  createdAt: string // Added missing field
}

interface CategoryForm {
  id?: string
  name: string
  icon: string
  description: string
}

interface MenuItemForm {
  id?: string
  name: string
  description: string
  price: number
  image: File | null
  tags: string[]
  available: boolean
  categoryId?: string
}

const { t } = useI18n()
const store = useStore()

// State
const categories = ref<Category[]>([])
const menuItems = ref<MenuItem[]>([])
const selectedCategory = ref<Category | null>(null)
const search = ref('')
const showOutOfStock = ref(false)
const sortBy = ref('name')

// Dialog states
const categoryDialog = ref(false)
const itemDialog = ref(false)
const deleteDialog = ref(false)
const editingCategory = ref<Category | null>(null)
const editingItem = ref<MenuItem | null>(null)

// Form refs & states
const categoryFormRef = ref()
const itemFormRef = ref()
const isCategoryFormValid = ref(false)
const isItemFormValid = ref(false)
const isSaving = ref(false)
const isDeleting = ref(false)

// Forms
const categoryForm = ref<CategoryForm>({
  name: '',
  icon: '',
  description: ''
})

const itemForm = ref<MenuItemForm>({
  name: '',
  description: '',
  price: 0,
  image: null,
  tags: [],
  available: true
})

// Delete handling
const deleteType = ref<'category' | 'item'>('item')
const deleteItemId = ref('')
const deleteMessage = computed(() => 
  deleteType.value === 'category' 
    ? t('restaurant.deleteCategoryConfirm') 
    : t('restaurant.deleteItemConfirm')
)

// Sort options
const sortOptions = computed(() => [
  { title: t('restaurant.sortOptions.name'), value: 'name' },
  { title: t('restaurant.sortOptions.priceAsc'), value: 'priceAsc' },
  { title: t('restaurant.sortOptions.priceDesc'), value: 'priceDesc' },
  { title: t('restaurant.sortOptions.newest'), value: 'newest' }
])

// Validation rules
const nameRules = [
  (v: string) => !!v || t('validation.required'),
  (v: string) => v.length >= 2 || t('validation.minLength', { length: 2 })
]

const priceRules = [
  (v: number) => !!v || t('validation.required'),
  (v: number) => v > 0 || t('validation.positive')
]

const descriptionRules = [
  (v: string) => !!v || t('validation.required'),
  (v: string) => v.length >= 10 || t('validation.minLength', { length: 10 })
]

const imageRules = [
  (v: File) => !v || v.size <= 5000000 || t('validation.fileSize', { size: '5MB' })
]

// Computed
const filteredItems = computed(() => {
  let items = [...menuItems.value]

  // Filter by category
  if (selectedCategory.value) {
    items = items.filter(item => item.categoryId === selectedCategory.value?.id)
  }

  // Filter by search
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.description.toLowerCase().includes(searchLower) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchLower))
    )
  }

  // Filter by availability
  if (!showOutOfStock.value) {
    items = items.filter(item => item.available)
  }

  // Sort items
  switch (sortBy.value) {
    case 'priceAsc':
      items.sort((a, b) => a.price - b.price)
      break
    case 'priceDesc':
      items.sort((a, b) => b.price - a.price)
      break
    case 'newest':
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      break
    default:
      items.sort((a, b) => a.name.localeCompare(b.name))
  }

  return items
})

// Methods
const loadCategories = async () => {
  try {
    const response = await store.dispatch('restaurant/getCategories')
    categories.value = response
  } catch (error) {
    console.error('Error loading categories:', error)
  }
}

const loadMenuItems = async () => {
  try {
    const response = await store.dispatch('restaurant/getMenuItems')
    menuItems.value = response
  } catch (error) {
    console.error('Error loading menu items:', error)
  }
}

const selectCategory = (category: Category) => {
  selectedCategory.value = category
}

const openCategoryDialog = (category?: Category) => {
  if (category) {
    editingCategory.value = category
    categoryForm.value = {
      id: category.id,
      name: category.name,
      icon: category.icon || '',
      description: category.description || ''
    }
  } else {
    editingCategory.value = null
    categoryForm.value = {
      name: '',
      icon: '',
      description: ''
    }
  }
  categoryDialog.value = true
}

const openItemDialog = (item?: MenuItem) => {
  if (item) {
    editingItem.value = item
    itemForm.value = {
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      image: null,
      tags: [...item.tags],
      available: item.available,
      categoryId: item.categoryId
    }
  } else {
    editingItem.value = null
    itemForm.value = {
      name: '',
      description: '',
      price: 0,
      image: null,
      tags: [],
      available: true,
      categoryId: selectedCategory.value?.id
    }
  }
  itemDialog.value = true
}

const saveCategory = async () => {
  const isValid = await categoryFormRef.value?.validate()
  if (!isValid?.valid) return

  isSaving.value = true
  try {
    await store.dispatch('restaurant/saveCategory', categoryForm.value)
    await loadCategories()
    categoryDialog.value = false
    store.dispatch('showNotification', {
      type: 'success',
      message: t('restaurant.categorySaved')
    })
  } catch (error) {
    store.dispatch('showNotification', {
      type: 'error',
      message: t('restaurant.saveFailed')
    })
  } finally {
    isSaving.value = false
  }
}

const saveItem = async () => {
  const isValid = await itemFormRef.value?.validate()
  if (!isValid?.valid) return

  isSaving.value = true
  try {
    const formData = new FormData()

    // Add all string/number fields as strings
    formData.append('name', itemForm.value.name)
    formData.append('description', itemForm.value.description)
    formData.append('price', String(itemForm.value.price))
    formData.append('available', String(itemForm.value.available))
    formData.append('categoryId', itemForm.value.categoryId || selectedCategory.value?.id || '')

    // Add array as JSON string
    formData.append('tags', JSON.stringify(itemForm.value.tags))

    // Add ID if editing
    if (editingItem.value) {
      formData.append('id', editingItem.value.id)
    }

    // Add image if selected
    if (itemForm.value.image) {
      formData.append('image', itemForm.value.image)
    }

    await store.dispatch('restaurant/saveMenuItem', formData)
    await loadMenuItems()
    itemDialog.value = false
    store.dispatch('showNotification', {
      type: 'success',
      message: t('restaurant.itemSaved')
    })
  } catch (error) {
    store.dispatch('showNotification', {
      type: 'error',
      message: t('restaurant.saveFailed')
    })
  } finally {
    isSaving.value = false
  }
}

const confirmDeleteCategory = (category: Category) => {
  deleteType.value = 'category'
  deleteItemId.value = category.id
  deleteDialog.value = true
}

const confirmDeleteItem = (item: MenuItem) => {
  deleteType.value = 'item'
  deleteItemId.value = item.id
  deleteDialog.value = true
}

const confirmDelete = async () => {
  isDeleting.value = true
  try {
    if (deleteType.value === 'category') {
      await store.dispatch('restaurant/deleteCategory', deleteItemId.value)
      await loadCategories()
    } else {
      await store.dispatch('restaurant/deleteMenuItem', deleteItemId.value)
      await loadMenuItems()
    }
    deleteDialog.value = false
    store.dispatch('showNotification', {
      type: 'success',
      message: t(`restaurant.${deleteType.value}Deleted`)
    })
  } catch (error) {
    store.dispatch('showNotification', {
      type: 'error',
      message: t('restaurant.deleteFailed')
    })
  } finally {
    isDeleting.value = false
  }
}

const updateItemAvailability = async (item: MenuItem) => {
  try {
    await store.dispatch('restaurant/updateMenuItemAvailability', {
      id: item.id,
      available: item.available
    })
  } catch (error) {
    item.available = !item.available // Revert on failure
    store.dispatch('showNotification', {
      type: 'error',
      message: t('restaurant.updateFailed')
    })
  }
}

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

// Load initial data
loadCategories()
loadMenuItems()

// Expose to template
defineExpose({
  categories,
  menuItems,
  selectedCategory,
  search,
  showOutOfStock,
  sortBy,
  sortOptions,
  filteredItems,
  categoryDialog,
  itemDialog,
  deleteDialog,
  categoryForm,
  itemForm,
  categoryFormRef,
  itemFormRef,
  isCategoryFormValid,
  isItemFormValid,
  isSaving,
  isDeleting,
  deleteMessage,
  nameRules,
  priceRules,
  descriptionRules,
  imageRules,
  selectCategory,
  openCategoryDialog,
  openItemDialog,
  saveCategory,
  saveItem,
  confirmDeleteCategory,
  confirmDeleteItem,
  confirmDelete,
  updateItemAvailability,
  formatPrice,
  editingCategory,
  editingItem
})
</script>

<style scoped>
.menu-management {
  padding: 16px;
}

.v-card {
  border-radius: 8px;
}

.menu-item-image {
  transition: transform 0.2s;
}

.menu-item-image:hover {
  transform: scale(1.05);
}
</style>