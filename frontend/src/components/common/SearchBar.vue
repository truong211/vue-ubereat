<template>
  <div class="search-bar">
    <v-autocomplete
      v-model="selectedItem"
      :loading="loading"
      :items="searchResults"
      :search-input.sync="searchQuery"
      :placeholder="$t('search.placeholder')"
      hide-no-data
      hide-details
      item-title="name"
      item-value="id"
      clearable
      rounded
      variant="outlined"
      :menu-props="{ maxHeight: 400 }"
      @update:search="handleSearch"
      @update:modelValue="handleSelection"
    >
      <!-- Custom search input with location icon -->
      <template v-slot:prepend-inner>
        <v-icon color="primary">mdi-magnify</v-icon>
      </template>

      <!-- Custom item template -->
      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props">
          <template v-slot:prepend>
            <v-icon
              :color="getItemIcon(item.raw.type).color"
              class="mr-2"
            >
              {{ getItemIcon(item.raw.type).icon }}
            </v-icon>
          </template>
          
          <v-list-item-title>
            {{ item.raw.name }}
          </v-list-item-title>
          
          <v-list-item-subtitle>
            {{ item.raw.description }}
          </v-list-item-subtitle>

          <!-- Show distance if available -->
          <template v-slot:append v-if="item.raw.distance">
            <v-chip
              size="small"
              color="primary"
              variant="flat"
              class="ml-2"
            >
              {{ item.raw.distance }}km
            </v-chip>
          </template>
        </v-list-item>
      </template>

      <!-- Recent searches -->
      <template v-slot:prepend>
        <v-list-subheader v-if="recentSearches.length && !searchQuery">
          {{ $t('search.recent') }}
        </v-list-subheader>
        <v-list-item
          v-for="recent in recentSearches"
          :key="recent.id"
          :value="recent"
          density="compact"
          v-if="!searchQuery"
        >
          <template v-slot:prepend>
            <v-icon color="grey">mdi-history</v-icon>
          </template>
          <v-list-item-title>{{ recent.name }}</v-list-item-title>
        </v-list-item>
      </template>
    </v-autocomplete>

    <!-- Advanced filters dialog -->
    <v-dialog v-model="showFilters" max-width="600">
      <template v-slot:activator="{ props }">
        <v-btn
          color="primary"
          variant="tonal"
          v-bind="props"
          class="ml-2"
        >
          <v-icon start>mdi-filter</v-icon>
          {{ $t('search.filters') }}
          <v-badge
            v-if="activeFiltersCount"
            :content="activeFiltersCount.toString()"
            color="primary"
            class="ml-2"
          ></v-badge>
        </v-btn>
      </template>

      <v-card>
        <v-card-title>
          {{ $t('search.advancedFilters') }}
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="showFilters = false"
          ></v-btn>
        </v-card-title>

        <v-card-text>
          <v-row>
            <!-- Distance filter -->
            <v-col cols="12">
              <v-list-subheader>{{ $t('search.filters.distance') }}</v-list-subheader>
              <v-slider
                v-model="filters.distance"
                :max="10"
                :min="1"
                :step="0.5"
                thumb-label
                :label="value => `${value}km`"
              >
                <template v-slot:append>
                  <div class="text-caption mt-1">{{ filters.distance }}km</div>
                </template>
              </v-slider>
            </v-col>

            <!-- Rating filter -->
            <v-col cols="12" md="6">
              <v-list-subheader>{{ $t('search.filters.rating') }}</v-list-subheader>
              <div class="d-flex align-center">
                <v-rating
                  v-model="filters.rating"
                  hover
                  half-increments
                ></v-rating>
                <span class="ml-2 text-caption">{{ filters.rating ? `${filters.rating} of 5` : 'Any rating' }}</span>
              </div>
            </v-col>

            <!-- Price range -->
            <v-col cols="12" md="6">
              <v-list-subheader>{{ $t('search.filters.priceRange') }}</v-list-subheader>
              <v-btn-toggle
                v-model="filters.priceRange"
                multiple
                variant="outlined"
                divided
              >
                <v-btn value="$">$</v-btn>
                <v-btn value="$$">$$</v-btn>
                <v-btn value="$$$">$$$</v-btn>
              </v-btn-toggle>
            </v-col>

            <!-- Cuisine types -->
            <v-col cols="12">
              <v-list-subheader>{{ $t('search.filters.cuisines') }}</v-list-subheader>
              <v-chip-group
                v-model="filters.cuisines"
                multiple
                column
              >
                <v-chip
                  v-for="cuisine in availableCuisines"
                  :key="cuisine.id"
                  :value="cuisine.id"
                  filter
                >
                  {{ cuisine.name }}
                </v-chip>
              </v-chip-group>
            </v-col>

            <!-- Sort options -->
            <v-col cols="12">
              <v-list-subheader>{{ $t('search.sortBy') }}</v-list-subheader>
              <v-select
                v-model="sortOption"
                :items="sortOptions"
                item-title="label"
                item-value="value"
                variant="outlined"
                density="comfortable"
                hide-details
              ></v-select>
            </v-col>
          </v-row>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="resetFilters"
          >
            {{ $t('common.reset') }}
          </v-btn>
          <v-btn
            color="primary"
            @click="applyFilters"
          >
            {{ $t('common.apply') }}
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
import debounce from 'lodash/debounce'

export default {
  name: 'SearchBar',
  
  props: {
    initialQuery: {
      type: String,
      default: ''
    }
  },

  emits: ['search', 'filter'],

  setup(props, { emit }) {
    const store = useStore()
    const { t } = useI18n()

    const searchQuery = ref(props.initialQuery)
    const selectedItem = ref(null)
    const loading = ref(false)
    const searchResults = ref([])
    const showFilters = ref(false)
    
    // Filters state
    const filters = ref({
      distance: 5,
      rating: 0,
      priceRange: [],
      cuisines: []
    })

    const sortOption = ref('relevance')
    
    const sortOptions = [
      { label: t('search.sort.relevance'), value: 'relevance' },
      { label: t('search.sort.rating'), value: 'rating' },
      { label: t('search.sort.distance'), value: 'distance' },
      { label: t('search.sort.priceAsc'), value: 'price_asc' },
      { label: t('search.sort.priceDesc'), value: 'price_desc' }
    ]

    const availableCuisines = [
      { id: 'italian', name: t('cuisines.italian') },
      { id: 'japanese', name: t('cuisines.japanese') },
      { id: 'chinese', name: t('cuisines.chinese') },
      { id: 'thai', name: t('cuisines.thai') },
      { id: 'indian', name: t('cuisines.indian') },
      { id: 'mexican', name: t('cuisines.mexican') }
    ]

    // Computed properties
    const activeFiltersCount = computed(() => {
      let count = 0
      if (filters.value.rating > 0) count++
      if (filters.value.distance !== 5) count++
      count += filters.value.priceRange.length
      count += filters.value.cuisines.length
      return count
    })

    // Recent searches from localStorage
    const recentSearches = ref([])
    
    const loadRecentSearches = () => {
      const saved = localStorage.getItem('recentSearches')
      if (saved) {
        recentSearches.value = JSON.parse(saved)
      }
    }

    const saveRecentSearch = (item) => {
      if (!item) return
      
      const recent = {
        id: item.id,
        name: item.name,
        type: item.type,
        timestamp: new Date().toISOString()
      }

      const updated = [
        recent,
        ...recentSearches.value.filter(s => s.id !== item.id)
      ].slice(0, 5)

      recentSearches.value = updated
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    }

    // Search handling
    const handleSearch = debounce(async (query) => {
      if (!query) {
        searchResults.value = []
        return
      }

      loading.value = true
      try {
        // Get user's location for distance calculation
        const location = await store.dispatch('getUserLocation')
        
        // Fetch search results
        const results = await store.dispatch('search/searchRestaurants', {
          query,
          location,
          filters: filters.value
        })
        
        searchResults.value = results
      } catch (error) {
        console.error('Search error:', error)
        store.dispatch('ui/showSnackbar', {
          text: t('search.error'),
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }, 300)

    const handleSelection = (item) => {
      if (!item) return
      
      saveRecentSearch(item)
      emit('search', item)
    }

    const getItemIcon = (type) => {
      const icons = {
        restaurant: { icon: 'mdi-store', color: 'primary' },
        cuisine: { icon: 'mdi-food', color: 'success' },
        dish: { icon: 'mdi-food-variant', color: 'info' }
      }
      return icons[type] || { icon: 'mdi-magnify', color: 'grey' }
    }

    const resetFilters = () => {
      filters.value = {
        distance: 5,
        rating: 0,
        priceRange: [],
        cuisines: []
      }
      sortOption.value = 'relevance'
    }

    const applyFilters = () => {
      emit('filter', {
        ...filters.value,
        sortBy: sortOption.value
      })
      showFilters.value = false
      
      // Refresh search with new filters if we have a query
      if (searchQuery.value) {
        handleSearch(searchQuery.value)
      }
    }

    // Lifecycle hooks
    onMounted(() => {
      loadRecentSearches()
    })

    return {
      searchQuery,
      selectedItem,
      loading,
      searchResults,
      showFilters,
      filters,
      sortOption,
      sortOptions,
      availableCuisines,
      activeFiltersCount,
      recentSearches,
      handleSearch,
      handleSelection,
      getItemIcon,
      resetFilters,
      applyFilters
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.v-autocomplete {
  max-width: 600px;
  flex-grow: 1;
}

@media (max-width: 600px) {
  .search-bar {
    flex-direction: column;
    width: 100%;
  }

  .v-btn {
    width: 100%;
    margin-left: 0 !important;
    margin-top: var(--spacing-sm);
  }
}
</style>