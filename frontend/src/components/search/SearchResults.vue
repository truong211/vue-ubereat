<template>
  <div class="search-results">
    <!-- Loading State -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
      <p class="mt-4 text-body-1">Đang tìm kiếm...</p>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="!loading && items.length === 0" variant="outlined" class="empty-state pa-8 text-center">
      <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-store-search</v-icon>
      <h3 class="text-h5 mb-2">Không tìm thấy kết quả</h3>
      <p class="text-body-1 text-medium-emphasis mb-4">
        Không tìm thấy kết quả nào phù hợp với tiêu chí tìm kiếm của bạn.
      </p>
      <v-btn color="primary" prepend-icon="mdi-refresh" @click="resetFilters">
        Đặt lại bộ lọc
      </v-btn>
    </v-card>

    <!-- Results Header -->
    <div v-else class="results-header d-flex align-center mb-4">
      <span class="text-body-1 mr-2">
        <strong>{{ items.length }}</strong> kết quả 
        <span v-if="searchQuery">cho "<strong>{{ searchQuery }}</strong>"</span>
      </span>
      <v-spacer></v-spacer>

      <!-- Sort Options -->
      <div class="d-flex align-center">
        <span class="text-body-2 mr-2">Sắp xếp theo:</span>
        <v-btn-toggle
          v-model="sortOption"
          color="primary"
          density="comfortable"
          rounded="pill"
          mandatory
        >
          <v-btn value="rating" size="small">
            <v-icon size="small">mdi-star</v-icon>
            <span class="d-none d-sm-inline ml-1">Đánh giá</span>
          </v-btn>
          <v-btn value="distance" size="small">
            <v-icon size="small">mdi-map-marker</v-icon>
            <span class="d-none d-sm-inline ml-1">Khoảng cách</span>
          </v-btn>
          <v-btn value="deliveryTime" size="small">
            <v-icon size="small">mdi-clock-outline</v-icon>
            <span class="d-none d-sm-inline ml-1">Thời gian</span>
          </v-btn>
          <v-btn value="popularity" size="small">
            <v-icon size="small">mdi-trending-up</v-icon>
            <span class="d-none d-sm-inline ml-1">Phổ biến</span>
          </v-btn>
        </v-btn-toggle>

        <!-- View Options -->
        <v-btn-toggle
          v-model="viewMode"
          color="primary"
          density="comfortable"
          class="ml-2"
        >
          <v-btn value="grid">
            <v-icon>mdi-view-grid</v-icon>
          </v-btn>
          <v-btn value="list">
            <v-icon>mdi-view-list</v-icon>
          </v-btn>
        </v-btn-toggle>
      </div>
    </div>

    <!-- Results Grid -->
    <v-row v-if="viewMode === 'grid'" dense>
      <v-col 
        v-for="item in sortedItems" 
        :key="item.id" 
        cols="12" sm="6" md="4" lg="3"
      >
        <restaurant-card :restaurant="item" />
      </v-col>
    </v-row>

    <!-- Results List -->
    <div v-else-if="viewMode === 'list'">
      <v-card
        v-for="item in sortedItems"
        :key="item.id"
        variant="outlined"
        class="mb-3 restaurant-list-item"
        :to="`/restaurant/${item.id}`"
      >
        <div class="d-flex">
          <v-img
            :src="item.thumbnail || 'https://via.placeholder.com/120'"
            height="120"
            width="120"
            class="flex-shrink-0"
            cover
          ></v-img>
          
          <div class="pa-3 d-flex flex-column w-100">
            <div class="d-flex align-center mb-1">
              <h3 class="text-h6 mr-auto">{{ item.name }}</h3>
              <div class="restaurant-rating d-flex align-center">
                <span class="mr-1">{{ item.rating }}</span>
                <v-icon color="amber" size="small">mdi-star</v-icon>
              </div>
            </div>
            
            <div class="text-subtitle-2 text-medium-emphasis mb-2">
              {{ item.cuisineType }} • {{ formatPrice(item.priceRange) }}
            </div>
            
            <div class="restaurant-badges d-flex mt-auto">
              <v-chip size="small" color="success" class="mr-2" v-if="item.deliveryTime <= 30">
                Giao nhanh
              </v-chip>
              <v-chip size="small" class="mr-2">
                <v-icon start size="x-small">mdi-map-marker</v-icon>
                {{ formatDistance(item.distance) }}
              </v-chip>
              <v-chip size="small" class="mr-2">
                <v-icon start size="x-small">mdi-clock-outline</v-icon>
                {{ item.deliveryTime }} phút
              </v-chip>
              <v-chip size="small" v-if="item.freeDelivery" color="info">
                Miễn phí giao hàng
              </v-chip>
            </div>
          </div>
        </div>
      </v-card>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        color="primary"
        :total-visible="7"
        @update:model-value="handlePageChange"
      ></v-pagination>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import RestaurantCard from '@/components/restaurant/RestaurantCard.vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  searchQuery: {
    type: String,
    default: ''
  },
  totalItems: {
    type: Number,
    default: 0
  },
  itemsPerPage: {
    type: Number,
    default: 12
  }
});

const emit = defineEmits(['reset-filters', 'sort', 'page-change']);

const router = useRouter();
const route = useRoute();

// State
const sortOption = ref('rating');
const viewMode = ref('grid');
const currentPage = ref(1);

// Computed properties
const totalPages = computed(() => {
  return Math.ceil(props.totalItems / props.itemsPerPage);
});

const sortedItems = computed(() => {
  // Create a copy of the array to avoid mutating props
  const itemsCopy = [...props.items];
  
  // Sort based on selected option
  switch (sortOption.value) {
    case 'rating':
      return itemsCopy.sort((a, b) => b.rating - a.rating);
    
    case 'distance':
      return itemsCopy.sort((a, b) => a.distance - b.distance);
    
    case 'deliveryTime':
      return itemsCopy.sort((a, b) => a.deliveryTime - b.deliveryTime);
    
    case 'popularity':
      return itemsCopy.sort((a, b) => b.popularity - a.popularity);
    
    default:
      return itemsCopy;
  }
});

// Methods
const resetFilters = () => {
  emit('reset-filters');
};

const handlePageChange = (page) => {
  emit('page-change', page);
  
  // Update route query params
  router.push({
    query: { ...route.query, page }
  });
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// Helper functions
const formatDistance = (distance) => {
  return `${distance.toFixed(1)} km`;
};

const formatPrice = (range) => {
  const formatter = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  });
  
  if (Array.isArray(range) && range.length === 2) {
    return `${formatter.format(range[0])} - ${formatter.format(range[1])}`;
  } else if (typeof range === 'object' && range.min !== undefined && range.max !== undefined) {
    return `${formatter.format(range.min)} - ${formatter.format(range.max)}`;
  } else {
    return '';
  }
};

// Initialize from route
onMounted(() => {
  if (route.query.sort) {
    sortOption.value = route.query.sort;
  }
  
  if (route.query.view) {
    viewMode.value = route.query.view;
  }
  
  if (route.query.page) {
    currentPage.value = parseInt(route.query.page) || 1;
  }
});

// Watch for sort option changes
watch(sortOption, (newValue) => {
  // Update route query params
  router.push({
    query: { ...route.query, sort: newValue }
  });
  
  // Emit sort event
  emit('sort', newValue);
});

// Watch for view mode changes
watch(viewMode, (newValue) => {
  // Update route query params
  router.push({
    query: { ...route.query, view: newValue }
  });
});
</script>

<style scoped>
.restaurant-list-item {
  transition: transform 0.2s, box-shadow 0.2s;
  text-decoration: none;
}

.restaurant-list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.w-100 {
  width: 100%;
}

.empty-state {
  border: 1px dashed rgba(0, 0, 0, 0.12);
}
</style> 