<template>
  <div class="smart-search-container">
    <v-autocomplete
      v-model="selectedItem"
      :loading="loading"
      :items="searchResults"
      :search-input.sync="searchQuery"
      color="primary"
      variant="outlined"
      item-title="name"
      item-value="id"
      return-object
      placeholder="Tìm kiếm nhà hàng, món ăn..."
      rounded
      hide-no-data
      hide-details
      clearable
      dense
      autocomplete="off"
      :menu-props="{ maxHeight: '300px' }"
      @update:search="handleSearch"
      @update:model-value="handleSelect"
    >
      <template v-slot:prepend-inner>
        <v-icon color="primary">mdi-magnify</v-icon>
      </template>

      <template v-slot:item="{ props, item }">
        <v-list-item v-bind="props" :subtitle="getItemSubtitle(item.raw)">
          <template v-slot:prepend>
            <v-avatar size="40" class="mr-3" rounded>
              <v-img :src="getItemThumbnail(item.raw)" cover></v-img>
            </v-avatar>
          </template>

          <template v-slot:append v-if="item.raw.type === 'restaurant'">
            <v-chip 
              color="primary" 
              size="small" 
              :text="formatDistance(item.raw.distance)"
            ></v-chip>
          </template>
        </v-list-item>
      </template>

      <template v-slot:no-data>
        <v-list-item title="Không tìm thấy kết quả" subtitle="Vui lòng thử lại với từ khóa khác"></v-list-item>
      </template>
    </v-autocomplete>

    <!-- Search suggestions while typing -->
    <div v-if="showSuggestions && searchSuggestions.length > 0" class="search-suggestions">
      <div class="pa-2 text-subtitle-2">Có thể bạn đang tìm:</div>
      <v-chip-group>
        <v-chip
          v-for="suggestion in searchSuggestions"
          :key="suggestion"
          color="primary"
          variant="outlined"
          class="ma-1"
          @click="selectSuggestion(suggestion)"
        >
          {{ suggestion }}
        </v-chip>
      </v-chip-group>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { debounce } from 'lodash';

const props = defineProps({
  searchEndpoint: {
    type: String,
    default: '/api/search'
  },
  suggestionEndpoint: {
    type: String,
    default: '/api/search/suggestions'
  },
  placeholder: {
    type: String,
    default: 'Tìm kiếm nhà hàng, món ăn...'
  }
});

const emit = defineEmits(['search', 'select']);

const router = useRouter();
const route = useRoute();

// Search state
const searchQuery = ref('');
const selectedItem = ref(null);
const searchResults = ref([]);
const searchSuggestions = ref([]);
const loading = ref(false);
const showSuggestions = ref(false);

// Handle search input
const handleSearch = debounce(async (query) => {
  if (!query || query.length < 2) {
    searchResults.value = [];
    showSuggestions.value = false;
    return;
  }

  try {
    loading.value = true;
    showSuggestions.value = true;

    // API call to get search results
    // In a real application, this would be an actual API call
    // For now, we're just simulating the response
    const response = await simulateSearchAPI(query);
    searchResults.value = response.items || [];
    searchSuggestions.value = response.suggestions || [];

    // Emit search event with just the query string instead of an object
    emit('search', query);
  } catch (error) {
    console.error('Search error:', error);
    searchResults.value = [];
    searchSuggestions.value = [];
  } finally {
    loading.value = false;
  }
}, 300);

// Handle item selection
const handleSelect = (item) => {
  if (!item) return;

  // Redirect to appropriate page based on item type
  if (item.type === 'restaurant') {
    router.push(`/restaurant/${item.id}`);
  } else if (item.type === 'dish') {
    router.push(`/dish/${item.id}`);
  } else if (item.type === 'category') {
    router.push({
      path: '/search',
      query: { ...route.query, category: item.id }
    });
  }

  // Emit select event
  emit('select', item);
};

// Select a suggestion
const selectSuggestion = (suggestion) => {
  searchQuery.value = suggestion;
  handleSearch(suggestion);
  showSuggestions.value = false;
};

// Helper functions
const getItemSubtitle = (item) => {
  if (item.type === 'restaurant') {
    return `${item.cuisineType} • ${formatDistance(item.distance)} • ${item.rating} ★`;
  } else if (item.type === 'dish') {
    return `${formatPrice(item.price)} • ${item.restaurantName}`;
  } else {
    return item.description || '';
  }
};

const getItemThumbnail = (item) => {
  return item.thumbnail || 'https://via.placeholder.com/40';
};

const formatDistance = (distance) => {
  return `${distance.toFixed(1)} km`;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

// Simulate API call for search (to be replaced with actual API in production)
const simulateSearchAPI = async (query) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));

  // Mock response
  return {
    items: [
      {
        id: 'r1',
        name: 'Nhà hàng Phở Việt',
        type: 'restaurant',
        cuisineType: 'Việt Nam',
        distance: 1.2,
        rating: 4.5,
        thumbnail: 'https://via.placeholder.com/40?text=PV'
      },
      {
        id: 'r2',
        name: 'Sushi Express',
        type: 'restaurant',
        cuisineType: 'Nhật Bản',
        distance: 2.5,
        rating: 4.3,
        thumbnail: 'https://via.placeholder.com/40?text=SE'
      },
      {
        id: 'd1',
        name: 'Phở bò tái lăn',
        type: 'dish',
        price: 65000,
        restaurantName: 'Nhà hàng Phở Việt',
        thumbnail: 'https://via.placeholder.com/40?text=PB'
      },
      {
        id: 'c1',
        name: 'Món Việt Nam',
        type: 'category',
        description: 'Danh mục món ăn Việt Nam',
        thumbnail: 'https://via.placeholder.com/40?text=VN'
      }
    ].filter(item => 
      item.name.toLowerCase().includes(query.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(query.toLowerCase())) ||
      (item.cuisineType && item.cuisineType.toLowerCase().includes(query.toLowerCase())) ||
      (item.restaurantName && item.restaurantName.toLowerCase().includes(query.toLowerCase()))
    ),
    suggestions: [
      'Phở bò',
      'Sushi',
      'Món Hàn Quốc',
      'Cơm rang',
      'Bún chả'
    ].filter(s => s.toLowerCase().includes(query.toLowerCase()))
  };
};

// Initialize from query params
onMounted(() => {
  if (route.query.q) {
    searchQuery.value = route.query.q;
    handleSearch(searchQuery.value);
  }
});

// Watch for query param changes
watch(() => route.query.q, (newQuery) => {
  if (newQuery && newQuery !== searchQuery.value) {
    searchQuery.value = newQuery;
    handleSearch(newQuery);
  }
}, { immediate: true });
</script>

<style scoped>
.smart-search-container {
  position: relative;
  width: 100%;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 10;
  background-color: white;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 8px;
  margin-top: -5px;
}
</style> 