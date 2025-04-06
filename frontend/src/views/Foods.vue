<template>
  <div class="foods-page">
    <v-container>
      <!-- Page Header -->
      <v-row class="mb-4">
        <v-col cols="12">
          <h1 class="text-h4 font-weight-bold mb-2">Featured Foods</h1>
          <p class="text-subtitle-1 text-medium-emphasis">
            Discover favorite foods and special sale items
          </p>
        </v-col>
      </v-row>

      <!-- Filters and Sort -->
      <v-row>
        <v-col cols="12" sm="8">
          <v-chip-group>
            <v-chip
              :color="activeFilter === 'all' ? 'primary' : undefined"
              @click="setFilter('all')"
            >
              All
            </v-chip>
            <v-chip
              :color="activeFilter === 'favorites' ? 'primary' : undefined"
              @click="setFilter('favorites')"
            >
              Favorites
            </v-chip>
            <v-chip
              :color="activeFilter === 'sale' ? 'primary' : undefined"
              @click="setFilter('sale')"
            >
              On Sale
            </v-chip>
            <v-chip
              :color="activeFilter === 'popular' ? 'primary' : undefined"
              @click="setFilter('popular')"
            >
              Popular
            </v-chip>
          </v-chip-group>
        </v-col>
        <v-col cols="12" sm="4" class="d-flex justify-end align-center">
          <v-select
            v-model="sortBy"
            :items="sortOptions"
            label="Sort by"
            variant="outlined"
            density="compact"
            hide-details
          ></v-select>
        </v-col>
      </v-row>

      <!-- Loading State -->
      <v-row v-if="loading" class="mt-4">
        <v-col cols="12" class="text-center">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">Loading foods...</p>
        </v-col>
      </v-row>

      <!-- Error State -->
      <v-row v-else-if="error" class="mt-4">
        <v-col cols="12">
          <v-alert
            type="error"
            :text="error"
            class="mb-4"
          ></v-alert>
          <div class="text-center">
            <v-btn color="primary" @click="fetchFoods">Thử lại</v-btn>
          </div>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <v-row v-else-if="filteredFoods.length === 0" class="mt-4">
        <v-col cols="12" class="text-center">
          <v-icon icon="mdi-food-off" size="64" color="grey-lighten-1" class="mb-4"></v-icon>
          <h3 class="text-h6 mb-2">No foods found</h3>
          <p class="text-body-2 mb-4">Please try with a different filter</p>
          <v-btn color="primary" @click="setFilter('all')">View all foods</v-btn>
        </v-col>
      </v-row>

      <!-- Sale Items Highlight -->
      <v-row v-if="!loading && !error && filteredFoods.length > 0 && activeFilter === 'sale'" class="mt-4 mb-6">
        <v-col cols="12">
          <v-card class="sale-highlight-card">
            <v-card-title class="text-h5 font-weight-bold">
              <v-icon color="error" class="mr-2">mdi-sale</v-icon>
              Special Sale Items
            </v-card-title>
            <v-card-subtitle>Limited time offers - Get them while they last!</v-card-subtitle>
          </v-card>
        </v-col>
      </v-row>

      <!-- Food Cards -->
      <v-row v-else-if="!loading && !error && filteredFoods.length > 0" class="mt-4">
        <v-col
          v-for="food in filteredFoods"
          :key="food.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <v-card
            class="food-card hover-scale"
            @click="goToFoodDetail(food.id)"
          >
            <div class="position-relative">
              <v-img
                :src="food.image || '/images/placeholder-food.jpg'"
                height="200"
                cover
                class="food-image"
              >
                <template v-slot:placeholder>
                  <v-row class="fill-height ma-0" align="center" justify="center">
                    <v-progress-circular indeterminate color="grey-lighten-5"></v-progress-circular>
                  </v-row>
                </template>
              </v-img>

              <!-- Badges -->
              <div class="badge-container">
                <v-chip
                  v-if="food.isOnSale"
                  color="error"
                  size="small"
                  class="badge sale-badge"
                >
                  -{{ food.discountPercentage }}%
                </v-chip>
                <v-chip
                  v-if="food.isFavorite"
                  icon="mdi-heart"
                  color="primary"
                  size="small"
                  class="badge favorite-badge"
                  variant="flat"
                ></v-chip>
              </div>
            </div>

            <v-card-text>
              <div class="d-flex justify-space-between align-start mb-1">
                <div class="text-subtitle-1 font-weight-medium text-truncate">{{ food.name }}</div>
                <v-rating
                  :model-value="food.rating || 0"
                  color="amber"
                  density="compact"
                  size="small"
                  readonly
                  half-increments
                ></v-rating>
              </div>

              <div class="text-caption text-grey mb-2">
                {{ food.restaurantName }}
              </div>

              <div class="d-flex align-center justify-space-between">
                <div>
                  <span v-if="food.isOnSale" class="text-decoration-line-through text-caption text-grey">
                    {{ formatPrice(food.originalPrice) }}
                  </span>
                  <span class="text-subtitle-1 font-weight-bold" :class="{ 'text-error': food.isOnSale }">
                    {{ formatPrice(food.price) }}
                  </span>
                </div>
                <v-btn
                  icon="mdi-cart-plus"
                  color="primary"
                  variant="text"
                  size="small"
                  @click.stop="addToCart(food)"
                ></v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Pagination -->
      <v-row v-if="totalPages > 1" class="mt-6">
        <v-col cols="12" class="d-flex justify-center">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            @update:model-value="changePage"
            rounded
          ></v-pagination>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import productService from '@/services/product.service';
import { favoritesService } from '@/services/favorites.service';
import { useStore } from 'vuex';

const router = useRouter();
const toast = useToast();
const store = useStore();

// State
const foods = ref([]);
const loading = ref(true);
const error = ref(null);
const activeFilter = ref('sale');
const sortBy = ref('popular');
const currentPage = ref(1);
const totalPages = ref(1);
const totalItems = ref(0);
const itemsPerPage = 12;

// Sort options
const sortOptions = [
  { title: 'Popular', value: 'popular' },
  { title: 'Price: Low to High', value: 'price_asc' },
  { title: 'Price: High to Low', value: 'price_desc' },
  { title: 'Rating', value: 'rating' },
];

// Fetch foods
const fetchFoods = async () => {
  loading.value = true;
  error.value = null;

  try {
    // Get favorite foods
    let favoriteFoodsResponse;
    try {
      favoriteFoodsResponse = await favoritesService.getFavoriteFoods();
    } catch (err) {
      console.warn('Could not fetch favorite foods. User might not be authenticated.', err);
      favoriteFoodsResponse = { data: { data: { foods: [] } } };
    }

    const favoriteFoodIds = favoriteFoodsResponse?.data?.data?.foods?.map(food => food.id) || [];

    // Get popular/sale foods
    const params = {
      page: currentPage.value,
      limit: itemsPerPage,
      sort: sortBy.value
    };

    if (activeFilter.value === 'sale') {
      params.onSale = true;
    }

    // Get products from API
    const response = await productService.getProducts(params);

    // Process foods data
    if (response.data && response.data.data) {
      const foodsData = response.data.data.products || [];

      // Mark favorite foods
      foods.value = foodsData.map(food => ({
        ...food,
        isFavorite: favoriteFoodIds.includes(food.id),
        isOnSale: food.discountPrice && food.discountPrice < food.price,
        discountPercentage: food.discountPrice ?
          Math.round((1 - food.discountPrice / food.price) * 100) : 0,
        price: food.discountPrice || food.price,
        originalPrice: food.price
      }));

      totalItems.value = response.data.data.count || foodsData.length;
      totalPages.value = Math.ceil(totalItems.value / itemsPerPage);
    } else {
      foods.value = [];
      totalItems.value = 0;
      totalPages.value = 1;
    }
  } catch (err) {
    console.error('Error fetching foods:', err);
    error.value = 'Không thể tải danh sách món ăn. Vui lòng thử lại sau.';
    foods.value = [];
  } finally {
    loading.value = false;
  }
};

// Filtered foods
const filteredFoods = computed(() => {
  let result = [...foods.value];

  // Apply filters
  if (activeFilter.value === 'favorites') {
    result = result.filter(food => food.isFavorite);
  } else if (activeFilter.value === 'sale') {
    result = result.filter(food => food.isOnSale);
  } else if (activeFilter.value === 'popular') {
    // Sort by popularity (already handled in API call, but we can add additional logic here)
    result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }

  // Apply sort
  if (sortBy.value === 'price_asc') {
    result.sort((a, b) => a.price - b.price);
  } else if (sortBy.value === 'price_desc') {
    result.sort((a, b) => b.price - a.price);
  } else if (sortBy.value === 'rating') {
    result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }

  return result;
});

// Set filter
const setFilter = (filter) => {
  activeFilter.value = filter;
  currentPage.value = 1;
  fetchFoods();
};

// Change page
const changePage = (page) => {
  currentPage.value = page;
  fetchFoods();
};

// Format price
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price || 0);
};

// Go to food detail
const goToFoodDetail = (id) => {
  router.push(`/products/${id}`);
};

// Add to cart
const addToCart = async (food) => {
  try {
    await store.dispatch('cart/addToCart', {
      productId: food.id,
      quantity: 1
    });

    toast.success(`Đã thêm ${food.name} vào giỏ hàng`);
  } catch (err) {
    console.error('Error adding to cart:', err);
    toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
  }
};

// Watch for changes
watch([sortBy, activeFilter], () => {
  fetchFoods();
});

// Initialize
onMounted(() => {
  fetchFoods();
});
</script>

<style scoped>
.foods-page {
  min-height: 100vh;
}

.food-card {
  transition: all 0.3s ease;
  height: 100%;
}

.hover-scale:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.food-image {
  position: relative;
}

.badge-container {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.badge {
  margin: 0;
}

.sale-badge {
  font-weight: bold;
}

.sale-highlight-card {
  background: linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%);
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(255, 82, 82, 0.2);
  padding: 10px;
  color: white;
}
</style>