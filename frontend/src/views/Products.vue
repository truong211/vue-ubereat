<template>
  <div class="products-page">
    <v-container>
      <div class="page-header">
        <h1 class="page-title text-h4 font-weight-bold">
          {{ categoryTitle }}
        </h1>
        <p class="text-subtitle-1 text-medium-emphasis">
          Khám phá đa dạng các món {{ categoryTitle.toLowerCase() }} từ thực đơn của chúng tôi
        </p>
      </div>

      <v-row>
        <!-- Filters Sidebar -->
        <v-col cols="12" md="3" class="filters-sidebar">
          <v-card class="pa-4">
            <h3 class="text-h6 font-weight-bold mb-4">Bộ lọc</h3>

            <!-- Price Range filter -->
            <div class="filter-section mb-4">
              <h4 class="text-subtitle-1 font-weight-medium mb-2">Khoảng giá</h4>
              <v-range-slider
                v-model="priceRange"
                :min="minPriceLimit"
                :max="maxPriceLimit"
                :step="10000"
                thumb-label="always"
                :thumb-size="20"
                color="primary"
                @end="applyFilters"
              >
                <template v-slot:thumb-label="{ modelValue }">
                  {{ formatCurrency(modelValue) }}
                </template>
              </v-range-slider>
              <div class="d-flex justify-space-between">
                <span class="text-body-2">{{ formatCurrency(priceRange[0]) }}</span>
                <span class="text-body-2">{{ formatCurrency(priceRange[1]) }}</span>
              </div>
            </div>

            <!-- Restaurant filter -->
            <div class="filter-section mb-4" v-if="restaurants.length > 0">
              <h4 class="text-subtitle-1 font-weight-medium mb-2">Nhà hàng</h4>
              <v-select
                v-model="selectedRestaurant"
                :items="restaurants"
                item-title="name"
                item-value="id"
                label="Chọn nhà hàng"
                variant="outlined"
                density="comfortable"
                clearable
                @update:model-value="applyFilters"
              ></v-select>
            </div>

            <!-- Dietary preferences -->
            <div class="filter-section mb-4">
              <h4 class="text-subtitle-1 font-weight-medium mb-2">Chế độ ăn</h4>
              <v-checkbox
                v-model="isVegetarian"
                label="Ăn chay"
                density="compact"
                color="success"
                hide-details
                @update:model-value="applyFilters"
              ></v-checkbox>
              <v-checkbox
                v-model="isVegan"
                label="Thuần chay"
                density="compact"
                color="success"
                hide-details
                @update:model-value="applyFilters"
              ></v-checkbox>
              <v-checkbox
                v-model="isGlutenFree"
                label="Không gluten"
                density="compact"
                color="success"
                hide-details
                @update:model-value="applyFilters"
              ></v-checkbox>
            </div>

            <!-- Rating filter -->
            <div class="filter-section mb-4">
              <h4 class="text-subtitle-1 font-weight-medium mb-2">Xếp hạng tối thiểu</h4>
              <v-rating
                v-model="minRating"
                color="amber"
                active-color="amber-darken-3"
                half-increments
                hover
                size="small"
                @update:model-value="applyFilters"
              ></v-rating>
            </div>

            <!-- Clear Filters button -->
            <v-btn
              color="primary"
              variant="outlined"
              block
              class="mt-4"
              @click="clearFilters"
            >
              Xóa bộ lọc
            </v-btn>
          </v-card>
        </v-col>

        <!-- Products Grid -->
        <v-col cols="12" md="9">
          <!-- Sort and View Controls -->
          <div class="controls-row d-flex justify-space-between align-center mb-4">
            <div class="search-wrapper" style="width: 300px;">
              <v-text-field
                v-model="searchQuery"
                label="Tìm kiếm sản phẩm"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-magnify"
                hide-details
                clearable
                @update:model-value="debounceSearch"
              ></v-text-field>
            </div>

            <div class="d-flex align-center">
              <v-select
                v-model="sortBy"
                :items="sortOptions"
                label="Sắp xếp theo"
                variant="outlined"
                density="comfortable"
                hide-details
                style="width: 200px; margin-right: 12px;"
                @update:model-value="applyFilters"
              ></v-select>

              <div class="view-toggle">
                <v-btn-toggle v-model="viewMode" color="primary" mandatory rounded>
                  <v-btn value="grid" density="comfortable">
                    <v-icon>mdi-view-grid</v-icon>
                  </v-btn>
                  <v-btn value="list" density="comfortable">
                    <v-icon>mdi-view-list</v-icon>
                  </v-btn>
                </v-btn-toggle>
              </div>
            </div>
          </div>

          <!-- Loading state -->
          <div v-if="loading" class="d-flex justify-center my-8">
            <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          </div>

          <!-- Empty state -->
          <v-card v-else-if="products.length === 0" class="pa-6 d-flex flex-column align-center">
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-food-off</v-icon>
            <h3 class="text-h5 font-weight-medium mb-2">Không tìm thấy sản phẩm nào</h3>
            <p class="text-body-1 text-medium-emphasis text-center">
              Chúng tôi không tìm thấy sản phẩm nào phù hợp với tiêu chí của bạn. Hãy điều chỉnh bộ lọc.
            </p>
            <v-btn color="primary" class="mt-4" @click="clearFilters">Xóa bộ lọc</v-btn>
          </v-card>

          <!-- Grid view -->
          <v-row v-else-if="viewMode === 'grid'">
            <v-col
              v-for="product in products"
              :key="product.id"
              cols="12"
              sm="6"
              md="4"
              xl="3"
            >
              <v-hover v-slot="{ isHovering, props }">
                <v-card
                  v-bind="props"
                  :elevation="isHovering ? 4 : 1"
                  :class="{ 'on-hover': isHovering }"
                  class="product-card h-100"
                  @click="goToProductDetails(product.id)"
                >
                  <div class="position-relative">
                    <v-img
                      :src="product.image || '/img/product-placeholder.jpg'"
                      height="180"
                      cover
                      :gradient="isHovering ? 'to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.5)' : undefined"
                      class="position-relative"
                    >
                      <div class="product-badges">
                        <v-chip
                          v-if="product.isPopular"
                          color="red"
                          size="small"
                          label
                          class="mb-1"
                        >
                          Phổ biến
                        </v-chip>
                        <v-chip
                          v-if="product.discountPrice"
                          color="green"
                          size="small"
                          label
                        >
                          Giảm giá
                        </v-chip>
                        <v-chip
                          v-if="product.isVegetarian"
                          color="success-lighten-1"
                          size="small"
                          label
                          class="mt-1"
                        >
                          Chay
                        </v-chip>
                      </div>
                    </v-img>

                    <v-btn
                      v-if="isHovering"
                      size="small"
                      color="primary"
                      class="add-to-cart-btn"
                      @click.stop="addToCart(product)"
                      prepend-icon="mdi-cart-plus"
                      variant="elevated"
                      rounded
                    >
                      Thêm vào giỏ
                    </v-btn>
                  </div>

                  <v-card-item>
                    <v-card-title class="px-0 text-h6 text-truncate">{{ product.name }}</v-card-title>
                    <div v-if="product.restaurant" class="text-subtitle-2 text-medium-emphasis mb-2">
                      {{ product.restaurant.name }}
                    </div>
                    <v-card-subtitle class="px-0 pb-0 text-truncate">
                      {{ product.description }}
                    </v-card-subtitle>
                  </v-card-item>

                  <v-card-text class="pt-0">
                    <div class="d-flex align-center mb-2">
                      <v-rating
                        :model-value="product.rating || 0"
                        color="amber"
                        density="compact"
                        size="small"
                        readonly
                        half-increments
                      ></v-rating>
                      <span class="text-body-2 ml-1">
                        {{ product.rating || 0 }} ({{ product.reviewCount || 0 }})
                      </span>
                    </div>

                    <div class="d-flex align-center">
                      <div class="text-h6 font-weight-bold">
                        {{ formatCurrency(product.discountPrice || product.price) }}
                      </div>
                      <div v-if="product.discountPrice" class="text-decoration-line-through text-medium-emphasis ml-2">
                        {{ formatCurrency(product.price) }}
                      </div>
                      <v-spacer></v-spacer>
                      <v-chip
                        v-if="product.preparationTime"
                        size="small"
                        color="grey-lighten-3"
                      >
                        <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                        {{ product.preparationTime }} phút
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-hover>
            </v-col>
          </v-row>

          <!-- List view -->
          <div v-else class="list-view">
            <v-card
              v-for="product in products"
              :key="product.id"
              class="mb-4 product-list-item"
              @click="goToProductDetails(product.id)"
            >
              <div class="d-flex">
                <v-img
                  :src="product.image || '/img/product-placeholder.jpg'"
                  width="150"
                  height="150"
                  cover
                  class="rounded-s"
                ></v-img>

                <div class="flex-grow-1 d-flex flex-column pa-3">
                  <div class="d-flex justify-space-between align-start">
                    <div>
                      <div class="d-flex align-center">
                        <h3 class="text-h6 font-weight-bold">{{ product.name }}</h3>
                        <div class="product-badges-inline ml-2">
                          <v-chip
                            v-if="product.isPopular"
                            color="red"
                            size="x-small"
                            label
                            class="mr-1"
                          >
                            Phổ biến
                          </v-chip>
                          <v-chip
                            v-if="product.isVegetarian"
                            color="success-lighten-1"
                            size="x-small"
                            label
                          >
                            Chay
                          </v-chip>
                        </div>
                      </div>
                      <div v-if="product.restaurant" class="text-subtitle-2 text-medium-emphasis mb-1">
                        {{ product.restaurant.name }}
                      </div>
                    </div>

                    <div class="price-container text-right">
                      <div class="text-h6 font-weight-bold">
                        {{ formatCurrency(product.discountPrice || product.price) }}
                      </div>
                      <div v-if="product.discountPrice" class="text-decoration-line-through text-medium-emphasis">
                        {{ formatCurrency(product.price) }}
                      </div>
                    </div>
                  </div>

                  <p class="text-body-2 text-medium-emphasis mt-2 product-description">
                    {{ product.description }}
                  </p>

                  <v-spacer></v-spacer>

                  <div class="d-flex justify-space-between align-center mt-2">
                    <div class="d-flex align-center">
                      <v-rating
                        :model-value="product.rating || 0"
                        color="amber"
                        density="compact"
                        size="small"
                        readonly
                        half-increments
                      ></v-rating>
                      <span class="text-body-2 ml-1">
                        {{ product.rating || 0 }} ({{ product.reviewCount || 0 }})
                      </span>
                    </div>

                    <div class="d-flex align-center">
                      <v-chip
                        v-if="product.preparationTime"
                        size="small"
                        color="grey-lighten-3"
                        class="mr-2"
                      >
                        <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                        {{ product.preparationTime }} min
                      </v-chip>

                      <v-btn
                        color="primary"
                        variant="text"
                        density="comfortable"
                        @click.stop="addToCart(product)"
                      >
                        <v-icon class="mr-1">mdi-cart-plus</v-icon>
                        Add to Cart
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>
            </v-card>
          </div>

          <!-- Pagination -->
          <div class="d-flex justify-center mt-6" v-if="totalPages > 1">
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="5"
              rounded
              @update:model-value="applyFilters"
            ></v-pagination>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { mapActions } from 'vuex';
import { apiClient } from '@/services/api.service';
import { PRODUCT } from '@/services/api.endpoints';
import { debounce } from 'lodash';

export default {
  name: 'ProductsPage',
  props: {
    category: {
      type: String,
      default: ''
    },
    restaurantId: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    return {
      loading: true,
      products: [],
      restaurants: [],
      totalProducts: 0,
      totalPages: 1,
      currentPage: 1,
      searchQuery: '',
      viewMode: 'grid',
      sortBy: 'popular',
      selectedRestaurant: null,
      isVegetarian: false,
      isVegan: false,
      isGlutenFree: false,
      minRating: 0,
      priceRange: [0, 500000],
      minPriceLimit: 0,
      maxPriceLimit: 500000,
      sortOptions: [
        { title: 'Phổ biến', value: 'popular' },
        { title: 'Giá: Thấp đến cao', value: 'price_asc' },
        { title: 'Giá: Cao đến thấp', value: 'price_desc' },
        { title: 'Đánh giá', value: 'rating' },
        { title: 'Tên: A-Z', value: 'name_asc' },
        { title: 'Tên: Z-A', value: 'name_desc' }
      ]
    };
  },
  computed: {
    categoryTitle() {
      if (!this.category) {
        return 'Tất cả sản phẩm';
      }

      // Convert category slug to title (e.g. "ice-cream" -> "Ice Cream")
      return this.category
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    },
    queryParams() {
      const params = {
        page: this.currentPage,
        limit: 12
      };

      // Add search query if present
      if (this.searchQuery) {
        params.search = this.searchQuery;
      }

      // Add category if present
      if (this.category) {
        params.categorySlug = this.category;
      }

      // Add restaurant filter if selected
      if (this.selectedRestaurant || this.restaurantId) {
        params.restaurantId = this.selectedRestaurant || this.restaurantId;
      }

      // Add sorting
      if (this.sortBy) {
        const [field, direction] = this.sortBy.split('_');
        params.sort = field;
        if (direction) {
          params.order = direction;
        }
      }

      // Add price range
      if (this.priceRange[0] > this.minPriceLimit) {
        params.minPrice = this.priceRange[0];
      }
      if (this.priceRange[1] < this.maxPriceLimit) {
        params.maxPrice = this.priceRange[1];
      }

      // Add dietary filters
      if (this.isVegetarian) {
        params.isVegetarian = true;
      }
      if (this.isVegan) {
        params.isVegan = true;
      }
      if (this.isGlutenFree) {
        params.isGlutenFree = true;
      }

      // Add rating filter
      if (this.minRating > 0) {
        params.minRating = this.minRating;
      }

      return params;
    }
  },
  watch: {
    '$route.query': {
      handler() {
        this.initFromRouteQuery();
        this.fetchProducts();
      },
      immediate: true
    },
    category() {
      this.fetchProducts();
    },
    restaurantId() {
      this.selectedRestaurant = this.restaurantId;
      this.fetchProducts();
    }
  },
  created() {
    // Initialize search params from the URL query
    this.initFromRouteQuery();

    // Initialize debounced search
    this.debounceSearch = debounce(() => {
      this.currentPage = 1; // Reset to first page on new search
      this.applyFilters();
    }, 500);

    // Fetch restaurants for filtering
    this.fetchRestaurants();

    // Fetch products with current filters
    this.fetchProducts();
  },
  methods: {
    ...mapActions({
      addToCartAction: 'cart/addToCart'
    }),

    async fetchProducts() {
      this.loading = true;
      let productsData = [];
      let countData = 0;
      let totalPagesData = 1;

      try {
        // Check if the backend server is running
        try {
          const response = await apiClient.get(PRODUCT.ALL, {
            params: this.queryParams
          });

          // Check if response.data.data exists
          if (!response.data || !response.data.data) {
            console.error('Invalid response format:', response.data);
            this.$toast.error('Failed to load products. Please try again.');
            this.products = [];
            this.totalProducts = 0;
            this.totalPages = 1;
            return;
          }

          // Extract data from response
          const { products = [], count = 0, totalPages = 1 } = response.data.data;
          productsData = products;
          countData = count;
          totalPagesData = totalPages;
        } catch (apiError) {
          // If the API returns HTML instead of JSON, it means the backend server is not running
          // or the proxy is not configured correctly
          console.error('API error:', apiError);
          this.$toast.error('Backend server not available. Please start the backend server.');
          this.products = [];
          this.totalProducts = 0;
          this.totalPages = 1;
          return;
        }

        // Update component data
        this.products = productsData;
        this.totalProducts = countData;
        this.totalPages = totalPagesData;

        // Update price limits if needed
        if (this.products.length > 0) {
          const prices = this.products.map(p => p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          if (minPrice < this.minPriceLimit) {
            this.minPriceLimit = Math.floor(minPrice / 10000) * 10000;
            if (this.priceRange[0] < this.minPriceLimit) {
              this.priceRange[0] = this.minPriceLimit;
            }
          }

          if (maxPrice > this.maxPriceLimit) {
            this.maxPriceLimit = Math.ceil(maxPrice / 10000) * 10000;
            if (this.priceRange[1] > this.maxPriceLimit) {
              this.priceRange[1] = this.maxPriceLimit;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        // Use a safe way to access toast
        if (this.$toast && typeof this.$toast.error === 'function') {
          this.$toast.error('Failed to load products. Please try again.');
        }
        this.products = [];
        this.totalProducts = 0;
        this.totalPages = 1;
      } finally {
        this.loading = false;
      }
    },

    async fetchRestaurants() {
      try {
        try {
          const response = await apiClient.get('/restaurants', {
            params: { limit: 50 }
          });

          // Check if response.data.data exists
          if (!response.data || !response.data.data) {
            console.error('Invalid restaurant response format:', response.data);
            this.restaurants = [];
            return;
          }

          this.restaurants = response.data.data.restaurants || [];
        } catch (apiError) {
          // If the API returns HTML instead of JSON, it means the backend server is not running
          // or the proxy is not configured correctly
          console.error('API error in fetchRestaurants:', apiError);
          this.restaurants = [];
        }
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        this.restaurants = [];

        // Use a safe way to access toast
        if (this.$toast && typeof this.$toast.error === 'function') {
          this.$toast.error('Failed to load restaurants. Please try again.');
        }
      }
    },

    initFromRouteQuery() {
      const query = this.$route.query;

      // Set page
      this.currentPage = parseInt(query.page) || 1;

      // Set search query
      this.searchQuery = query.search || '';

      // Set filter values
      this.selectedRestaurant = query.restaurantId || this.restaurantId || null;
      this.isVegetarian = query.isVegetarian === 'true';
      this.isVegan = query.isVegan === 'true';
      this.isGlutenFree = query.isGlutenFree === 'true';
      this.minRating = parseFloat(query.minRating) || 0;

      // Set price range
      this.priceRange = [
        parseInt(query.minPrice) || this.minPriceLimit,
        parseInt(query.maxPrice) || this.maxPriceLimit
      ];

      // Set sort order
      if (query.sort && query.order) {
        this.sortBy = `${query.sort}_${query.order}`;
      } else {
        this.sortBy = 'popular';
      }

      // Set view mode
      this.viewMode = query.view || 'grid';
    },

    applyFilters() {
      // Update route query params with current filter values
      this.$router.push({
        path: this.$route.path,
        query: {
          page: this.currentPage,
          search: this.searchQuery || undefined,
          restaurantId: this.selectedRestaurant || undefined,
          isVegetarian: this.isVegetarian || undefined,
          isVegan: this.isVegan || undefined,
          isGlutenFree: this.isGlutenFree || undefined,
          minRating: this.minRating > 0 ? this.minRating : undefined,
          minPrice: this.priceRange[0] > this.minPriceLimit ? this.priceRange[0] : undefined,
          maxPrice: this.priceRange[1] < this.maxPriceLimit ? this.priceRange[1] : undefined,
          sort: this.sortBy.split('_')[0] || undefined,
          order: this.sortBy.split('_')[1] || undefined,
          view: this.viewMode
        }
      });
    },

    clearFilters() {
      this.searchQuery = '';
      this.selectedRestaurant = this.restaurantId || null;
      this.isVegetarian = false;
      this.isVegan = false;
      this.isGlutenFree = false;
      this.minRating = 0;
      this.priceRange = [this.minPriceLimit, this.maxPriceLimit];
      this.sortBy = 'popular';
      this.currentPage = 1;
      this.applyFilters();
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value);
    },

    goToProductDetails(productId) {
      this.$router.push({
        name: 'ProductDetail',
        params: { productId }
      });
    },

    async addToCart(product) {
      try {
        await this.addToCartAction({
          productId: product.id,
          quantity: 1
        });

        this.$toast.success(`${product.name} added to your cart`);
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.$toast.error(error.response?.data?.message || 'Failed to add item to cart');
      }
    }
  }
};
</script>

<style scoped>
.product-card {
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
}

.product-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.add-to-cart-btn {
  position: absolute;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  z-index: 1;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.product-description {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-list-item {
  transition: all 0.3s;
  cursor: pointer;
}

.product-list-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.product-badges-inline {
  display: flex;
  align-items: center;
}

@media (max-width: 600px) {
  .controls-row {
    flex-direction: column;
    align-items: stretch;
  }

  .controls-row > div {
    width: 100%;
    margin-bottom: 12px;
  }

  .search-wrapper {
    width: 100% !important;
  }
}

.product-card {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.product-card .v-img::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.02), rgba(0,0,0,0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.product-card:hover .v-img::after {
  opacity: 1;
}

.product-badges {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 1;
}
</style>