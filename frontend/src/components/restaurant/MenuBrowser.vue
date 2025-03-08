<template>
  <div class="menu-browser">
    <!-- Menu Header -->
    <div class="menu-header mb-4">
      <v-text-field
        v-model="searchQuery"
        placeholder="Search menu items..."
        variant="outlined"
        density="comfortable"
        hide-details
        clearable
        prepend-inner-icon="mdi-magnify"
        class="mb-4"
        @update:model-value="handleSearch"
      ></v-text-field>
      
      <!-- Quick Filters -->
      <div class="d-flex align-center flex-wrap">
        <!-- Sort Options -->
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          label="Sort by"
          density="comfortable"
          hide-details
          variant="outlined"
          class="mr-2 mb-2"
          style="max-width: 150px;"
        ></v-select>
        
        <!-- Dietary Filters -->
        <v-chip-group
          v-model="dietaryFilters"
          multiple
          selected-class="selected-filter"
        >
          <v-chip
            v-for="filter in dietaryOptions"
            :key="filter.value"
            :value="filter.value"
            filter
            variant="elevated"
          >
            <v-icon start size="small">{{ filter.icon }}</v-icon>
            {{ filter.label }}
          </v-chip>
        </v-chip-group>
      </div>
    </div>

    <!-- Category Navigation -->
    <v-tabs
      v-model="activeCategory"
      show-arrows
      density="comfortable"
      color="primary"
      class="mb-4"
    >
      <v-tab
        v-for="category in categories"
        :key="category.id"
        :value="category.id"
        class="text-none"
      >
        <v-icon start>{{ category.icon }}</v-icon>
        {{ category.name }}
      </v-tab>
    </v-tabs>

    <!-- Menu Content -->
    <v-window v-model="activeCategory">
      <v-window-item
        v-for="category in categories"
        :key="category.id"
        :value="category.id"
      >
        <div v-if="getItemsByCategory(category.id).length === 0" class="text-center py-8">
          <v-icon size="64" color="grey-lighten-1">mdi-food-off</v-icon>
          <h3 class="text-h6 mt-4">No items found</h3>
          <p class="text-body-1 text-medium-emphasis">
            Try adjusting your filters
          </p>
        </div>

        <v-row v-else>
          <v-col
            v-for="item in getItemsByCategory(category.id)"
            :key="item.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card
              class="menu-item"
              :class="{ 'unavailable': !item.available }"
              @click="selectItem(item)"
            >
              <div class="d-flex">
                <!-- Item Image -->
                <v-img
                  :src="item.image"
                  :alt="item.name"
                  width="120"
                  height="120"
                  cover
                  class="rounded"
                >
                  <template v-slot:placeholder>
                    <v-icon size="48" color="grey-lighten-1">mdi-food</v-icon>
                  </template>
                </v-img>

                <!-- Item Details -->
                <div class="flex-grow-1 pa-3">
                  <div class="d-flex justify-space-between align-start">
                    <div>
                      <div class="text-subtitle-1 font-weight-medium">{{ item.name }}</div>
                      <div class="text-body-2 text-medium-emphasis">{{ item.description }}</div>
                    </div>
                    <div class="text-subtitle-1 font-weight-bold">${{ item.price.toFixed(2) }}</div>
                  </div>

                  <!-- Item Badges -->
                  <div class="mt-2">
                    <v-chip
                      v-if="item.popular"
                      color="primary"
                      size="x-small"
                      class="mr-1"
                    >
                      <v-icon start size="x-small">mdi-fire</v-icon>
                      Popular
                    </v-chip>
                    <v-chip
                      v-if="item.spicy"
                      color="error"
                      size="x-small"
                      class="mr-1"
                    >
                      <v-icon start size="x-small">mdi-chili-hot</v-icon>
                      Spicy
                    </v-chip>
                    <v-chip
                      v-for="tag in item.dietaryTags"
                      :key="tag"
                      :color="getDietaryTagColor(tag)"
                      size="x-small"
                      class="mr-1"
                    >
                      <v-icon start size="x-small">{{ getDietaryTagIcon(tag) }}</v-icon>
                      {{ getDietaryTagLabel(tag) }}
                    </v-chip>
                  </div>

                  <!-- Customization Hint -->
                  <div v-if="item.customizable" class="mt-2 text-caption">
                    <v-icon size="small" color="primary">mdi-pencil</v-icon>
                    Customizable
                  </div>
                </div>
              </div>
              
              <!-- Unavailable Overlay -->
              <div v-if="!item.available" class="unavailable-overlay">
                <v-chip color="error">
                  Currently Unavailable
                </v-chip>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-window-item>
    </v-window>

    <!-- Item Details Dialog -->
    <v-dialog
      v-model="showItemDialog"
      max-width="600"
      scrollable
    >
      <v-card v-if="selectedItem">
        <v-img
          :src="selectedItem.image"
          height="250"
          cover
        ></v-img>

        <v-card-title class="d-flex justify-space-between align-center">
          <div>{{ selectedItem.name }}</div>
          <div class="text-h6">${{ selectedItem.price.toFixed(2) }}</div>
        </v-card-title>

        <v-card-text>
          <p class="text-body-1">{{ selectedItem.description }}</p>

          <!-- Item Tags -->
          <div class="my-4">
            <v-chip
              v-for="tag in selectedItem.dietaryTags"
              :key="tag"
              :color="getDietaryTagColor(tag)"
              size="small"
              class="mr-2 mb-2"
            >
              <v-icon start>{{ getDietaryTagIcon(tag) }}</v-icon>
              {{ getDietaryTagLabel(tag) }}
            </v-chip>
          </div>

          <!-- Customization Options -->
          <template v-if="selectedItem.customizable">
            <v-divider class="mb-4"></v-divider>
            
            <!-- Size Selection -->
            <div v-if="selectedItem.sizes" class="mb-4">
              <div class="text-subtitle-1 mb-2">Size</div>
              <v-btn-toggle
                v-model="selectedSize"
                mandatory
                divided
                class="w-100"
              >
                <v-btn
                  v-for="size in selectedItem.sizes"
                  :key="size.value"
                  :value="size.value"
                  class="flex-grow-1"
                >
                  <div class="text-center">
                    <div>{{ size.label }}</div>
                    <div class="text-caption">${{ size.price.toFixed(2) }}</div>
                  </div>
                </v-btn>
              </v-btn-toggle>
            </div>

            <!-- Options Groups -->
            <div
              v-for="(group, index) in selectedItem.optionGroups"
              :key="index"
              class="mb-4"
            >
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-subtitle-1">{{ group.name }}</div>
                <div class="text-caption">
                  {{ group.required ? 'Required' : 'Optional' }}
                  <template v-if="group.max > 1">
                    • Select up to {{ group.max }}
                  </template>
                </div>
              </div>

              <v-radio-group
                v-if="group.max === 1"
                v-model="selectedOptions[group.name]"
                :rules="group.required ? [v => !!v || 'Required'] : []"
              >
                <v-radio
                  v-for="option in group.options"
                  :key="option.id"
                  :value="option.id"
                  :label="option.name"
                >
                  <template v-slot:label>
                    <div class="d-flex justify-space-between align-center flex-grow-1">
                      <span>{{ option.name }}</span>
                      <span v-if="option.price > 0" class="text-caption">
                        +${{ option.price.toFixed(2) }}
                      </span>
                    </div>
                  </template>
                </v-radio>
              </v-radio-group>

              <v-checkbox-btn
                v-else
                v-for="option in group.options"
                :key="option.id"
                v-model="selectedOptions[group.name]"
                :value="option.id"
                :label="option.name"
                :rules="[
                  v => !group.required || v.length > 0 || 'Required',
                  v => v.length <= group.max || `Select up to ${group.max} options`
                ]"
              >
                <template v-slot:label>
                  <div class="d-flex justify-space-between align-center flex-grow-1">
                    <span>{{ option.name }}</span>
                    <span v-if="option.price > 0" class="text-caption">
                      +${{ option.price.toFixed(2) }}
                    </span>
                  </div>
                </template>
              </v-checkbox-btn>
            </div>

            <!-- Special Instructions -->
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Special Instructions</div>
              <v-textarea
                v-model="specialInstructions"
                placeholder="Add any special requests (optional)"
                variant="outlined"
                rows="2"
                counter="200"
                :rules="[v => !v || v.length <= 200 || 'Max 200 characters']"
              ></v-textarea>
            </div>
          </template>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-btn
            variant="text"
            @click="showItemDialog = false"
          >
            Cancel
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :loading="isAddingToCart"
            :disabled="!selectedItem.available"
            @click="addToCart"
          >
            Add to Cart • ${{ calculateTotalPrice().toFixed(2) }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useDebounce } from '@/composables/useDebounce'

export default {
  name: 'MenuBrowser',
  
  props: {
    // Restaurant menu data
    categories: {
      type: Array,
      required: true
    },
    
    items: {
      type: Array,
      required: true
    },
    
    // Customization options
    showSearch: {
      type: Boolean,
      default: true
    },
    
    showFilters: {
      type: Boolean,
      default: true
    }
  },
  
  emits: [
    'add-to-cart',
    'update:search',
    'update:filters'
  ],
  
  setup(props, { emit }) {
    // Search and filter state
    const searchQuery = ref('')
    const activeCategory = ref(props.categories[0]?.id)
    const sortBy = ref('recommended')
    const dietaryFilters = ref([])
    
    // Item selection state
    const showItemDialog = ref(false)
    const selectedItem = ref(null)
    const selectedSize = ref(null)
    const selectedOptions = ref({})
    const specialInstructions = ref('')
    const isAddingToCart = ref(false)
    
    // Filter options
    const sortOptions = [
      { title: 'Recommended', value: 'recommended' },
      { title: 'Price: Low to High', value: 'price_asc' },
      { title: 'Price: High to Low', value: 'price_desc' },
      { title: 'Most Popular', value: 'popular' }
    ]
    
    const dietaryOptions = [
      { label: 'Vegetarian', value: 'vegetarian', icon: 'mdi-leaf' },
      { label: 'Vegan', value: 'vegan', icon: 'mdi-sprout' },
      { label: 'Gluten Free', value: 'gluten_free', icon: 'mdi-grain-off' },
      { label: 'Halal', value: 'halal', icon: 'mdi-food-halal' }
    ]
    
    // Methods
    const handleSearch = useDebounce((query) => {
      emit('update:search', query)
    }, 300)
    
    const getItemsByCategory = (categoryId) => {
      return props.items.filter(item => {
        if (item.categoryId !== categoryId) return false
        
        // Apply search filter
        if (searchQuery.value) {
          const search = searchQuery.value.toLowerCase()
          if (!item.name.toLowerCase().includes(search) &&
              !item.description.toLowerCase().includes(search)) {
            return false
          }
        }
        
        // Apply dietary filters
        if (dietaryFilters.value.length > 0) {
          return dietaryFilters.value.every(filter => 
            item.dietaryTags.includes(filter)
          )
        }
        
        return true
      }).sort((a, b) => {
        // Apply sorting
        switch (sortBy.value) {
          case 'price_asc':
            return a.price - b.price
          case 'price_desc':
            return b.price - a.price
          case 'popular':
            return (b.popular ? 1 : 0) - (a.popular ? 1 : 0)
          default:
            return 0
        }
      })
    }
    
    const selectItem = (item) => {
      if (!item.available) return
      
      selectedItem.value = item
      selectedSize.value = item.sizes?.[0]?.value
      selectedOptions.value = {}
      specialInstructions.value = ''
      showItemDialog.value = true
    }
    
    const calculateTotalPrice = () => {
      if (!selectedItem.value) return 0
      
      let total = selectedItem.value.price
      
      // Add size price
      if (selectedSize.value && selectedItem.value.sizes) {
        const size = selectedItem.value.sizes.find(s => s.value === selectedSize.value)
        if (size) {
          total = size.price
        }
      }
      
      // Add options prices
      if (selectedItem.value.optionGroups) {
        selectedItem.value.optionGroups.forEach(group => {
          const selectedIds = Array.isArray(selectedOptions.value[group.name])
            ? selectedOptions.value[group.name]
            : [selectedOptions.value[group.name]]
          
          selectedIds.forEach(id => {
            const option = group.options.find(o => o.id === id)
            if (option && option.price) {
              total += option.price
            }
          })
        })
      }
      
      return total
    }
    
    const addToCart = async () => {
      if (isAddingToCart.value || !selectedItem.value?.available) return
      
      isAddingToCart.value = true
      
      try {
        const itemToAdd = {
          id: selectedItem.value.id,
          name: selectedItem.value.name,
          price: calculateTotalPrice(),
          size: selectedSize.value,
          options: selectedOptions.value,
          specialInstructions: specialInstructions.value,
          quantity: 1
        }
        
        emit('add-to-cart', itemToAdd)
        showItemDialog.value = false
      } catch (error) {
        console.error('Failed to add item to cart:', error)
      } finally {
        isAddingToCart.value = false
      }
    }
    
    const getDietaryTagColor = (tag) => {
      const colors = {
        vegetarian: 'success',
        vegan: 'success-darken-1',
        gluten_free: 'warning',
        halal: 'info'
      }
      return colors[tag] || 'grey'
    }
    
    const getDietaryTagIcon = (tag) => {
      const icons = {
        vegetarian: 'mdi-leaf',
        vegan: 'mdi-sprout',
        gluten_free: 'mdi-grain-off',
        halal: 'mdi-food-halal'
      }
      return icons[tag] || 'mdi-food'
    }
    
    const getDietaryTagLabel = (tag) => {
      const labels = {
        vegetarian: 'Vegetarian',
        vegan: 'Vegan',
        gluten_free: 'Gluten Free',
        halal: 'Halal'
      }
      return labels[tag] || tag
    }
    
    // Emit initial filters
    watch([searchQuery, dietaryFilters, sortBy], () => {
      emit('update:filters', {
        search: searchQuery.value,
        dietary: dietaryFilters.value,
        sort: sortBy.value
      })
    })
    
    return {
      // State
      searchQuery,
      activeCategory,
      sortBy,
      dietaryFilters,
      showItemDialog,
      selectedItem,
      selectedSize,
      selectedOptions,
      specialInstructions,
      isAddingToCart,
      
      // Options
      sortOptions,
      dietaryOptions,
      
      // Methods
      handleSearch,
      getItemsByCategory,
      selectItem,
      calculateTotalPrice,
      addToCart,
      getDietaryTagColor,
      getDietaryTagIcon,
      getDietaryTagLabel
    }
  }
}
</script>

<style scoped>
.menu-browser {
  max-width: 1200px;
  margin: 0 auto;
}

.menu-item {
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.menu-item:hover {
  transform: translateY(-2px);
}

.menu-item.unavailable {
  opacity: 0.7;
  cursor: not-allowed;
}

.unavailable-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
}

.selected-filter {
  background-color: var(--v-primary-base) !important;
  color: white !important;
}
</style>