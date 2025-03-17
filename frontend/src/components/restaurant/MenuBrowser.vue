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

          <!-- Nutritional Information -->
          <v-expansion-panels class="mt-4">
            <v-expansion-panel>
              <v-expansion-panel-title>
                <v-icon start>mdi-nutrition</v-icon>
                Nutritional Information
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-list density="compact" class="bg-grey-lighten-4 rounded">
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-fire-circle</v-icon>
                    </template>
                    <v-list-item-title>Calories</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedItem.nutrition?.calories || 'N/A' }} kcal</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-protein</v-icon>
                    </template>
                    <v-list-item-title>Protein</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedItem.nutrition?.protein || 'N/A' }} g</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-molecule</v-icon>
                    </template>
                    <v-list-item-title>Carbohydrates</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedItem.nutrition?.carbs || 'N/A' }} g</v-list-item-subtitle>
                  </v-list-item>
                  <v-list-item>
                    <template v-slot:prepend>
                      <v-icon color="primary">mdi-water</v-icon>
                    </template>
                    <v-list-item-title>Fat</v-list-item-title>
                    <v-list-item-subtitle>{{ selectedItem.nutrition?.fat || 'N/A' }} g</v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>

          <!-- Allergen Information -->
          <div v-if="selectedItem.allergens && selectedItem.allergens.length" class="mt-4">
            <div class="d-flex align-center mb-2">
              <v-icon color="warning">mdi-alert-circle</v-icon>
              <span class="text-subtitle-1 ml-2">Allergen Information</span>
            </div>
            <v-chip-group>
              <v-chip
                v-for="allergen in selectedItem.allergens"
                :key="allergen"
                color="warning"
                variant="outlined"
                size="small"
              >
                {{ allergen }}
              </v-chip>
            </v-chip-group>
          </div>

          <!-- Customization Options -->
          <div v-if="selectedItem.customizationOptions" class="mt-4">
            <div class="text-subtitle-1 mb-2">Customize Your Order</div>
            <v-radio-group v-model="selectedOptions.size" class="mb-4">
              <template v-slot:label>
                <div class="d-flex align-center">
                  <v-icon start>mdi-ruler</v-icon>
                  <span class="ml-2">Size</span>
                </div>
              </template>
              <v-radio
                v-for="size in selectedItem.customizationOptions.sizes"
                :key="size.value"
                :value="size.value"
                :label="`${size.label} (+$${size.additionalPrice.toFixed(2)})`"
              ></v-radio>
            </v-radio-group>

            <v-divider class="mb-4"></v-divider>

            <template v-if="selectedItem.customizationOptions.addons">
              <div class="d-flex align-center mb-2">
                <v-icon>mdi-plus-circle</v-icon>
                <span class="text-subtitle-1 ml-2">Extra Toppings</span>
              </div>
              <v-checkbox
                v-for="addon in selectedItem.customizationOptions.addons"
                :key="addon.value"
                v-model="selectedOptions.addons"
                :value="addon.value"
                :label="`${addon.label} (+$${addon.price.toFixed(2)})`"
                hide-details
                class="mb-2"
              ></v-checkbox>
            </template>
          </div>

          <!-- Special Instructions -->
          <v-text-field
            v-model="specialInstructions"
            label="Special Instructions"
            placeholder="Any special requests?"
            variant="outlined"
            class="mt-4"
            clearable
          ></v-text-field>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-row align="center">
            <v-col cols="6">
              <div class="d-flex align-center">
                <v-btn
                  icon="mdi-minus"
                  variant="outlined"
                  size="small"
                  @click="decrementQuantity"
                  :disabled="quantity <= 1"
                ></v-btn>
                <span class="mx-4 text-h6">{{ quantity }}</span>
                <v-btn
                  icon="mdi-plus"
                  variant="outlined"
                  size="small"
                  @click="incrementQuantity"
                ></v-btn>
              </div>
            </v-col>
            <v-col cols="6" class="text-right">
              <v-btn
                color="primary"
                size="large"
                block
                @click="addToCart"
                :disabled="!selectedItem.available"
              >
                Add to Cart - ${{ calculateTotal.toFixed(2) }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'MenuBrowser',
  
  props: {
    categories: {
      type: Array,
      required: true
    },
    items: {
      type: Array,
      required: true
    }
  },
  
  emits: [
    'add-to-cart',
    'update:search',
    'update:filters'
  ],
  
  setup(props, { emit }) {
    const searchQuery = ref('')
    const sortBy = ref('recommended')
    const dietaryFilters = ref([])
    const activeCategory = ref(null)
    const showItemDialog = ref(false)
    const selectedItem = ref(null)
    const quantity = ref(1)
    const specialInstructions = ref('')
    const selectedOptions = ref({
      size: null,
      addons: []
    })
    
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
    
    // Calculate total price including customizations
    const calculateTotal = computed(() => {
      if (!selectedItem.value) return 0
      
      let total = selectedItem.value.price * quantity.value
      
      // Add size price
      if (selectedOptions.value.size && selectedItem.value.customizationOptions?.sizes) {
        const selectedSize = selectedItem.value.customizationOptions.sizes.find(
          size => size.value === selectedOptions.value.size
        )
        if (selectedSize) {
          total += selectedSize.additionalPrice * quantity.value
        }
      }
      
      // Add addon prices
      if (selectedOptions.value.addons.length && selectedItem.value.customizationOptions?.addons) {
        selectedOptions.value.addons.forEach(addonValue => {
          const addon = selectedItem.value.customizationOptions.addons.find(
            a => a.value === addonValue
          )
          if (addon) {
            total += addon.price * quantity.value
          }
        })
      }
      
      return total
    })
    
    // Quantity controls
    const incrementQuantity = () => {
      quantity.value++
    }

    const decrementQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--
      }
    }

    // Add to cart
    const addToCart = () => {
      emit('add-to-cart', {
        item: selectedItem.value,
        quantity: quantity.value,
        options: selectedOptions.value,
        specialInstructions: specialInstructions.value,
        totalPrice: calculateTotal.value
      })
      showItemDialog.value = false
      resetDialog()
    }

    // Reset dialog state
    const resetDialog = () => {
      quantity.value = 1
      specialInstructions.value = ''
      selectedOptions.value = {
        size: null,
        addons: []
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