<template>
  <v-autocomplete
    v-model="selectedItem"
    :loading="loading"
    :items="searchResults"
    :search-input.sync="searchQuery"
    :menu-props="{ maxHeight: 400 }"
    :placeholder="$t('search.placeholder')"
    hide-no-data
    hide-selected
    item-title="name"
    item-value="id"
    return-object
    clearable
    rounded
    solo
    @update:search-input="handleSearchInput"
    @update:model-value="handleSelection"
  >
    <template v-slot:prepend-inner>
      <v-icon icon="mdi-magnify" />
    </template>

    <template v-slot:item="{ props, item }">
      <v-list-item v-bind="props">
        <template v-slot:prepend>
          <v-icon
            :icon="getItemIcon(item.raw.type)"
            :color="getItemColor(item.raw.type)"
            class="mr-2"
          />
        </template>
        <v-list-item-title>{{ item.raw.name }}</v-list-item-title>
        <v-list-item-subtitle>{{ getItemSubtitle(item.raw) }}</v-list-item-subtitle>
      </v-list-item>
    </template>

    <template v-slot:no-data>
      <v-list-item>
        <v-list-item-title>{{ $t('search.noResults') }}</v-list-item-title>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useDebounce } from '@vueuse/core'

const store = useStore()
const loading = ref(false)
const searchQuery = ref('')
const selectedItem = ref(null)
const searchResults = ref([])

// Debounced search function to prevent too many API calls
const debouncedSearch = useDebounce(async (query) => {
  if (!query) {
    searchResults.value = []
    return
  }

  loading.value = true
  try {
    // Fetch search results from Vuex action
    const results = await store.dispatch('search/searchAll', query)
    searchResults.value = results
  } catch (error) {
    console.error('Search error:', error)
    // Handle error appropriately
  } finally {
    loading.value = false
  }
}, 300)

// Watch for search input changes
watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})

// Handle item selection
const handleSelection = (item) => {
  if (item) {
    // Save to search history
    store.dispatch('search/addToHistory', item)
    // Navigate or handle selection based on item type
    handleItemSelection(item)
  }
}

// Handle search input changes
const handleSearchInput = (value) => {
  searchQuery.value = value
}

// Get appropriate icon based on item type
const getItemIcon = (type) => {
  switch (type) {
    case 'restaurant':
      return 'mdi-store'
    case 'dish':
      return 'mdi-food'
    case 'category':
      return 'mdi-tag'
    default:
      return 'mdi-magnify'
  }
}

// Get appropriate color based on item type
const getItemColor = (type) => {
  switch (type) {
    case 'restaurant':
      return 'primary'
    case 'dish':
      return 'success'
    case 'category':
      return 'info'
    default:
      return 'grey'
  }
}

// Get subtitle based on item type and data
const getItemSubtitle = (item) => {
  switch (item.type) {
    case 'restaurant':
      return item.cuisine || ''
    case 'dish':
      return `${item.restaurant} • ${item.price}`
    case 'category':
      return `${item.count} items`
    default:
      return ''
  }
}

// Handle item selection based on type
const handleItemSelection = (item) => {
  switch (item.type) {
    case 'restaurant':
      // Navigate to restaurant detail
      router.push(`/restaurant/${item.id}`)
      break
    case 'dish':
      // Navigate to restaurant with dish highlight
      router.push(`/restaurant/${item.restaurantId}?dish=${item.id}`)
      break
    case 'category':
      // Navigate to search results with category filter
      router.push(`/search?category=${item.id}`)
      break
  }
}
</script>

<style scoped>
.v-autocomplete {
  max-width: 600px;
  margin: 0 auto;
}
</style>