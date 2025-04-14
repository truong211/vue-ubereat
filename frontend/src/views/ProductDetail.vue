<template>
  <div class="product-detail-page">
    <v-container>
      <v-row v-if="loading">
        <v-col cols="12" class="d-flex justify-center my-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
        </v-col>
      </v-row>

      <div v-else-if="error" class="text-center my-8">
        <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
        <h3 class="text-h5 font-weight-bold mb-2">Lỗi khi tải sản phẩm</h3>
        <p class="text-body-1 mb-4">{{ error }}</p>
        <v-btn color="primary" @click="$router.go(-1)">Quay lại</v-btn>
      </div>

      <template v-else-if="product">
        <!-- Breadcrumbs -->
        <v-breadcrumbs :items="breadcrumbs" class="pa-0 mb-4"></v-breadcrumbs>

        <v-row>
          <!-- Product Image -->
          <v-col cols="12" md="5" class="product-image-col">
            <v-card class="product-image-card">
              <v-img
                :src="product.image || '/img/product-placeholder.jpg'"
                height="400"
                cover
                class="product-main-image"
              >
                <div class="product-badges">
                  <v-chip v-if="product.isPopular" color="red" class="mb-1">Phổ biến</v-chip>
                  <v-chip v-if="product.discountPrice" color="green">Giảm giá</v-chip>
                </div>
              </v-img>
            </v-card>
          </v-col>

          <!-- Product Info -->
          <v-col cols="12" md="7">
            <div class="product-info">
              <div class="d-flex align-center mb-2">
                <h1 class="text-h4 font-weight-bold">{{ product.name }}</h1>
                <v-spacer></v-spacer>
                <v-btn
                  icon
                  color="red"
                  variant="text"
                  @click="toggleFavorite"
                >
                  <v-icon>{{ isFavorite ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
                </v-btn>
                <v-btn
                  icon
                  color="primary"
                  variant="text"
                  @click="shareProduct"
                >
                  <v-icon>mdi-share-variant</v-icon>
                </v-btn>
              </div>

              <div class="d-flex align-center mb-4">
                <v-rating
                  :model-value="product.rating || 0"
                  color="amber"
                  density="compact"
                  half-increments
                  readonly
                ></v-rating>
                <span class="text-body-2 ml-2">
                  {{ product.rating || 0 }} ({{ product.reviewCount || 0 }} đánh giá)
                </span>
                <v-divider vertical class="mx-2"></v-divider>
                <v-chip v-if="product.isVegetarian" color="success" size="small" class="mx-1">Ăn chay</v-chip>
                <v-chip v-if="product.isVegan" color="success-darken-1" size="small" class="mx-1">Thuần chay</v-chip>
                <v-chip v-if="product.isGlutenFree" color="success-lighten-1" size="small" class="mx-1">Không gluten</v-chip>
              </div>

              <div class="restaurant-info mb-4" v-if="product.restaurant">
                <v-btn
                  :to="{ name: 'RestaurantDetail', params: { id: product.restaurant.id }}"
                  variant="text"
                  color="primary"
                  class="pl-0"
                >
                  <v-avatar size="24" class="mr-2">
                    <v-img :src="product.restaurant.logo || '/img/restaurant-placeholder.jpg'" cover></v-img>
                  </v-avatar>
                  {{ product.restaurant.name }}
                </v-btn>
              </div>

              <p class="text-body-1 mb-4">{{ product.description }}</p>

              <div class="price-section mb-6">
                <div class="d-flex align-center">
                  <div class="current-price text-h4 font-weight-bold primary--text">
                    {{ formatCurrency(product.discountPrice || product.price) }}
                  </div>
                  <div v-if="product.discountPrice" class="original-price text-h6 text-decoration-line-through text-medium-emphasis ml-3">
                    {{ formatCurrency(product.price) }}
                  </div>
                  <v-spacer></v-spacer>
                  <v-chip v-if="product.preparationTime" color="grey-lighten-3">
                    <v-icon size="small" class="mr-1">mdi-clock-outline</v-icon>
                    Thời gian chuẩn bị: {{ product.preparationTime }} phút
                  </v-chip>
                </div>
              </div>

              <!-- Options Section -->
              <div v-if="product.options && product.options.length > 0" class="options-section mb-6">
                <h3 class="text-h6 font-weight-bold mb-3">Tùy chỉnh đơn hàng của bạn</h3>

                <div
                  v-for="(option, optionIndex) in product.options"
                  :key="optionIndex"
                  class="option-group mb-4"
                >
                  <div class="d-flex align-center mb-2">
                    <h4 class="text-subtitle-1 font-weight-bold">{{ option.name }}</h4>
                    <v-chip v-if="option.required" color="red" size="x-small" class="ml-2">Bắt buộc</v-chip>
                  </div>

                  <v-radio-group
                    v-if="option.type === 'single'"
                    v-model="selectedOptions[option.id]"
                    :mandatory="option.required"
                  >
                    <v-radio
                      v-for="choice in option.choices"
                      :key="choice.id"
                      :label="getChoiceLabel(choice)"
                      :value="choice"
                    ></v-radio>
                  </v-radio-group>

                  <div v-else-if="option.type === 'multiple'">
                    <v-checkbox
                      v-for="choice in option.choices"
                      :key="choice.id"
                      v-model="multipleOptions[option.id]"
                      :label="getChoiceLabel(choice)"
                      :value="choice"
                      hide-details
                      class="mb-1"
                    ></v-checkbox>
                  </div>
                </div>
              </div>

              <!-- Special Instructions -->
              <div class="special-instructions mb-6">
                <h3 class="text-h6 font-weight-bold mb-3">Hướng dẫn đặc biệt</h3>
                <v-textarea
                  v-model="specialInstructions"
                  variant="outlined"
                  placeholder="Thêm hướng dẫn đặc biệt cho món này (ví dụ: dị ứng, ưa thích gia vị, v.v.)"
                  rows="2"
                  hide-details
                ></v-textarea>
              </div>

              <!-- Quantity and Add to Cart -->
              <div class="cart-actions">
                <div class="d-flex align-center">
                  <div class="quantity-selector mr-4">
                    <v-btn
                      icon="mdi-minus"
                      variant="outlined"
                      size="small"
                      @click="decreaseQuantity"
                      :disabled="quantity <= 1"
                    ></v-btn>
                    <span class="mx-3 text-h6">{{ quantity }}</span>
                    <v-btn
                      icon="mdi-plus"
                      variant="outlined"
                      size="small"
                      @click="increaseQuantity"
                    ></v-btn>
                  </div>

                  <v-btn
                    color="primary"
                    size="large"
                    block
                    :loading="isAddingToCart"
                    @click="addToCart"
                  >
                    <v-icon class="mr-2">mdi-cart-plus</v-icon>
                    Thêm vào giỏ hàng - {{ formatCurrency(totalPrice) }}
                  </v-btn>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>

        <!-- Nutritional Info and Ingredients -->
        <v-row class="mt-8">
          <v-col cols="12">
            <v-card>
              <v-tabs v-model="activeTab" color="primary">
                <v-tab value="details">Chi tiết</v-tab>
                <v-tab value="nutrition">Thông tin dinh dưỡng</v-tab>
                <v-tab value="reviews">Đánh giá ({{ product.reviewCount || 0 }})</v-tab>
              </v-tabs>

              <v-card-text class="pt-4">
                <v-window v-model="activeTab">
                  <!-- Details Tab -->
                  <v-window-item value="details">
                    <div class="details-content">
                      <h3 class="text-h6 font-weight-bold mb-3">Thành phần</h3>
                      <v-chip-group v-if="product.ingredients && product.ingredients.length">
                        <v-chip
                          v-for="(ingredient, index) in product.ingredients"
                          :key="index"
                          variant="outlined"
                          color="primary"
                        >
                          {{ ingredient }}
                        </v-chip>
                      </v-chip-group>
                      <p v-else class="text-body-1 text-medium-emphasis">Không có thông tin về thành phần</p>

                      <v-divider class="my-4"></v-divider>

                      <h3 class="text-h6 font-weight-bold mb-3">Chất gây dị ứng</h3>
                      <v-chip-group v-if="product.allergens && product.allergens.length">
                        <v-chip
                          v-for="(allergen, index) in product.allergens"
                          :key="index"
                          color="error"
                          variant="outlined"
                        >
                          {{ allergen }}
                        </v-chip>
                      </v-chip-group>
                      <p v-else class="text-body-1 text-medium-emphasis">Không có thông tin về chất gây dị ứng</p>
                    </div>
                  </v-window-item>

                  <!-- Nutrition Tab -->
                  <v-window-item value="nutrition">
                    <div class="nutrition-content">
                      <div v-if="product.nutritionalInfo" class="nutrition-table">
                        <v-simple-table>
                          <template v-slot:default>
                            <thead>
                              <tr>
                                <th class="text-left">Chất dinh dưỡng</th>
                                <th class="text-right">Số lượng</th>
                                <th class="text-right">% Giá trị hàng ngày</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(value, key) in product.nutritionalInfo" :key="key">
                                <td>{{ formatNutrientName(key) }}</td>
                                <td class="text-right">{{ formatNutrientValue(key, value) }}</td>
                                <td class="text-right">{{ calculateDailyValue(key, value) }}</td>
                              </tr>
                            </tbody>
                          </template>
                        </v-simple-table>
                      </div>
                      <p v-else class="text-body-1 text-medium-emphasis">Không có thông tin dinh dưỡng</p>
                    </div>
                  </v-window-item>

                  <!-- Reviews Tab -->
                  <v-window-item value="reviews">
                    <div class="reviews-content">
                      <div v-if="product.reviews && product.reviews.length" class="reviews-list">
                        <v-timeline align="start" line-thickness="thin">
                          <v-timeline-item
                            v-for="review in product.reviews"
                            :key="review.id"
                            dot-color="primary"
                            size="small"
                          >
                            <div class="review-item">
                              <div class="d-flex align-center mb-2">
                                <v-avatar size="36" class="mr-2">
                                  <v-img
                                    :src="review.user.profileImage || '/img/avatar-placeholder.jpg'"
                                    alt="User avatar"
                                  ></v-img>
                                </v-avatar>
                                <div>
                                  <div class="font-weight-bold">{{ review.user.fullName }}</div>
                                  <div class="text-caption text-medium-emphasis">
                                    {{ formatDate(review.createdAt) }}
                                  </div>
                                </div>
                                <v-spacer></v-spacer>
                                <v-rating
                                  :model-value="review.rating || 0"
                                  color="amber"
                                  density="compact"
                                  size="small"
                                  readonly
                                ></v-rating>
                              </div>
                              <p class="text-body-2 ml-12">{{ review.content }}</p>
                            </div>
                          </v-timeline-item>
                        </v-timeline>

                        <div class="text-center mt-4" v-if="product.reviewCount > product.reviews.length">
                          <v-btn
                            color="primary"
                            variant="outlined"
                            @click="viewAllReviews"
                          >
                            Xem tất cả {{ product.reviewCount }} đánh giá
                          </v-btn>
                        </div>
                      </div>
                      <div v-else class="text-center py-8">
                        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-star-outline</v-icon>
                        <h3 class="text-h6 font-weight-medium mb-2">Chưa có đánh giá nào</h3>
                        <p class="text-body-1 text-medium-emphasis">
                          Hãy là người đầu tiên đánh giá sản phẩm này!
                        </p>
                      </div>
                    </div>
                  </v-window-item>
                </v-window>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <!-- Similar Products -->
        <div class="similar-products mt-8" v-if="similarProducts.length > 0">
          <div class="d-flex justify-space-between align-center mb-4">
            <h2 class="text-h5 font-weight-bold">Sản phẩm tương tự</h2>
            <v-btn variant="text" color="primary" to="/products" class="hover-scale">
              Xem thêm
            </v-btn>
          </div>
          <v-row>
            <v-col
              v-for="similarProduct in similarProducts"
              :key="similarProduct.id"
              cols="12"
              sm="6"
              md="3"
            >
              <v-hover v-slot="{ isHovering, props }">
                <v-card
                  v-bind="props"
                  :elevation="isHovering ? 4 : 1"
                  :class="{ 'on-hover': isHovering }"
                  @click="goToProductDetails(similarProduct.id)"
                  class="similar-product-card h-100"
                >
                  <div class="position-relative">
                    <v-img
                      :src="similarProduct.image || '/img/product-placeholder.jpg'"
                      height="150"
                      cover
                    >
                      <div class="product-badges" v-if="similarProduct.isPopular || similarProduct.discountPrice || similarProduct.isVegetarian">
                        <v-chip
                          v-if="similarProduct.isPopular"
                          color="red"
                          size="x-small"
                          label
                          class="mb-1"
                        >
                          Phổ biến
                        </v-chip>
                        <v-chip
                          v-if="similarProduct.discountPrice"
                          color="green"
                          size="x-small"
                          label
                        >
                          Giảm giá
                        </v-chip>
                      </div>
                    </v-img>
                  </div>

                  <v-card-item>
                    <v-card-title class="text-subtitle-1 text-truncate">
                      {{ similarProduct.name }}
                    </v-card-title>
                    <div class="d-flex align-center mt-1">
                      <v-rating
                        :model-value="similarProduct.rating || 0"
                        color="amber"
                        density="compact"
                        size="small"
                        readonly
                        half-increments
                      ></v-rating>
                      <span class="text-caption text-medium-emphasis ml-1">
                        ({{ similarProduct.reviewCount || 0 }})
                      </span>
                    </div>
                  </v-card-item>

                  <v-card-text>
                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-subtitle-1 font-weight-bold">
                          {{ formatCurrency(similarProduct.discountPrice || similarProduct.price) }}
                        </div>
                        <div v-if="similarProduct.discountPrice" class="text-decoration-line-through text-caption text-medium-emphasis">
                          {{ formatCurrency(similarProduct.price) }}
                        </div>
                      </div>
                      <v-btn
                        icon="mdi-cart-plus"
                        color="primary"
                        size="small"
                        variant="text"
                        @click.stop="addToCart(similarProduct)"
                        class="hover-scale"
                      ></v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-hover>
            </v-col>
          </v-row>
        </div>

        <!-- Related Products Section -->
        <section class="related-products-section mt-8">
          <v-container>
            <RelatedProducts 
              :productId="productId"
              :categoryId="product.categoryId"
              title="Sản phẩm tương tự"
              :maxItems="8"
            />
          </v-container>
        </section>
      </template>
    </v-container>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import { useCartStore } from '@/stores/cart';       // Import Pinia cart store
import { useUserStore } from '@/stores/user';       // Import Pinia user store
import { useNotificationStore } from '@/stores/notification'; // Import Pinia notification store
import axios from 'axios';
import { format } from 'date-fns';
import { PRODUCT } from '@/services/api.endpoints';
import RelatedProducts from '@/components/product/RelatedProducts.vue';

export default defineComponent({ // Use defineComponent
  name: 'ProductDetailPage',
  props: {
    productId: {
      type: [String, Number],
      required: true
    }
  },
  components: {
    RelatedProducts
  },
  setup() {
    const cartStore = useCartStore();
    const userStore = useUserStore();
    const notificationStore = useNotificationStore();
    return { cartStore, userStore, notificationStore }; // Expose store instances
  },
  data() {
    return {
      loading: true,
      error: null,
      product: null,
      similarProducts: [],
      isFavorite: false,
      quantity: 1,
      selectedOptions: {},
      multipleOptions: {},
      specialInstructions: '',
      activeTab: 'details',
      isAddingToCart: false
    };
  },
  computed: {
    breadcrumbs() {
      const items = [
        {
          title: 'Trang chủ',
          disabled: false,
          to: '/'
        },
        {
          title: 'Sản phẩm',
          disabled: false,
          to: '/products'
        }
      ];

      if (this.product) {
        if (this.product.category) {
          items.push({
            title: this.product.category.name,
            disabled: false,
            to: `/products?categoryId=${this.product.category.id}`
          });
        }

        items.push({
          title: this.product.name,
          disabled: true
        });
      }

      return items;
    },
    totalPrice() {
      if (!this.product) return 0;

      let basePrice = this.product.discountPrice || this.product.price;
      let optionsPrice = 0;

      // Add single selection option prices
      for (const optionId in this.selectedOptions) {
        const choice = this.selectedOptions[optionId];
        if (choice && choice.price) {
          optionsPrice += parseFloat(choice.price);
        }
      }

      // Add multiple selection option prices
      for (const optionId in this.multipleOptions) {
        const choices = this.multipleOptions[optionId] || [];
        choices.forEach(choice => {
          if (choice && choice.price) {
            optionsPrice += parseFloat(choice.price);
          }
        });
      }

      return (basePrice + optionsPrice) * this.quantity;
    }
  },
  watch: {
    productId: {
      handler() {
        this.fetchProductDetails();
      },
      immediate: true
    }
  },
  created() {
    // Redirect to products page if productId is undefined
    if (this.productId === undefined || this.productId === 'undefined') {
      this.$router.replace('/products');
      return;
    }

    this.initMultipleOptions();
    this.checkFavoriteStatus();
  },
  methods: {
    // Removed mapActions block. Methods will call store actions directly.

    async fetchProductDetails() {
      // Redirect to products page if productId is undefined
      if (this.productId === undefined || this.productId === 'undefined') {
        this.$router.replace('/products');
        return;
      }

      this.loading = true;
      this.error = null;

      try {
        // Get product details
        const response = await axios.get(`${PRODUCT.DETAILS(this.productId)}`);

        // Check if product data exists
        if (!response.data.data || !response.data.data.product) {
          throw new Error('Không tìm thấy sản phẩm');
        }

        this.product = response.data.data.product;

        // Initialize options
        this.initMultipleOptions();

        // Get similar products
        this.fetchSimilarProducts();

        // Check favorite status
        this.checkFavoriteStatus();
      } catch (error) {
        console.error('Error fetching product details:', error);
        this.error = error.response?.data?.message || 'Không thể tải thông tin sản phẩm. Vui lòng thử lại sau.';
      } finally {
        this.loading = false;
      }
    },

    async fetchSimilarProducts() {
      if (!this.product) return;

      try {
        // Get similar products based on category and excluding current product
        const response = await axios.get(PRODUCT.ALL, {
          params: {
            categoryId: this.product.categoryId,
            limit: 4,
            exclude: this.productId
          }
        });

        this.similarProducts = response.data.data.products || [];
      } catch (error) {
        console.error('Error fetching similar products:', error);
        this.similarProducts = [];
      }
    },

    initMultipleOptions() {
      if (!this.product || !this.product.options) return;

      this.product.options.forEach(option => {
        if (option.type === 'multiple') {
          this.multipleOptions[option.id] = [];
        }
      });
    },

    async checkFavoriteStatus() {
      if (!this.product) return;

      try {
        const isFavorite = await this.userStore.checkIfFavorite(this.product.id); // Call action on userStore
        this.isFavorite = isFavorite;
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    },

    async toggleFavorite() {
      if (!this.product) return;

      try {
        if (this.isFavorite) {
          await this.userStore.removeFromFavorites(this.product.id); // Call action on userStore
          // Call action on notificationStore
          this.notificationStore.showToast({
            message: `${this.product.name} đã được xóa khỏi danh sách yêu thích`,
            type: 'info'
          });
        } else {
          await this.userStore.addToFavorites(this.product.id); // Call action on userStore
          // Call action on notificationStore
          this.notificationStore.showToast({
            message: `${this.product.name} đã được thêm vào danh sách yêu thích`,
            type: 'success'
          });
        }

        // Toggle the state
        this.isFavorite = !this.isFavorite;
      } catch (error) {
        console.error('Error toggling favorite:', error);
        // Call action on notificationStore
        this.notificationStore.showToast({
          message: error.response?.data?.message || 'Không thể cập nhật danh sách yêu thích',
          type: 'error'
        });
      }
    },

    shareProduct() {
      if (!this.product) return;

      if (navigator.share) {
        navigator.share({
          title: this.product.name,
          text: this.product.description,
          url: window.location.href
        })
        .catch(error => console.error('Error sharing:', error));
      } else {
        // Fallback - copy URL to clipboard
        navigator.clipboard.writeText(window.location.href);
        // Call action on notificationStore
        this.notificationStore.showToast({
          message: 'Đã sao chép liên kết vào bộ nhớ tạm!',
          type: 'success'
        });
      }
    },

    increaseQuantity() {
      this.quantity++;
    },

    decreaseQuantity() {
      if (this.quantity > 1) {
        this.quantity--;
      }
    },

    formatCurrency(value) {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(value);
    },

    formatDate(dateString) {
      return format(new Date(dateString), 'dd/MM/yyyy');
    },

    getChoiceLabel(choice) {
      if (!choice) return '';
      return choice.price > 0
        ? `${choice.name} (+${this.formatCurrency(choice.price)})`
        : choice.name;
    },

    formatNutrientName(key) {
      // Convert camelCase or snake_case to Title Case with spaces
      return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .replace(/^./, str => str.toUpperCase())
        .trim();
    },

    formatNutrientValue(key, value) {
      if (key.includes('calorie')) return `${value} kcal`;
      if (key.includes('fat') || key.includes('protein') || key.includes('carb')) {
        return `${value}g`;
      }
      if (key.includes('sodium')) return `${value}mg`;
      return value;
    },

    calculateDailyValue(key, value) {
      const dailyValues = {
        calories: 2000,
        totalFat: 65,
        saturatedFat: 20,
        cholesterol: 300,
        sodium: 2400,
        totalCarbohydrates: 300,
        dietaryFiber: 25,
        protein: 50
      };

      const matchedKey = Object.keys(dailyValues).find(k =>
        key.toLowerCase().includes(k.toLowerCase())
      );

      if (matchedKey) {
        const percentage = Math.round((value / dailyValues[matchedKey]) * 100);
        return `${percentage}%`;
      }

      return '-';
    },

    goToProductDetails(productId) {
      this.$router.push({
        name: 'ProductDetail',
        params: { productId }
      });
    },

    async addToCart(product) {
      if (!product) return;

      try {
        // Call action on cartStore instance
        await this.cartStore.addToCart({
          productId: product.id,
          quantity: 1
        });

        // Call action on notificationStore
        this.notificationStore.showToast({
          message: `${product.name} đã được thêm vào giỏ hàng`,
          type: 'success'
        });
      } catch (error) {
        console.error('Error adding to cart:', error);
        // Call action on notificationStore
        this.notificationStore.showToast({
          message: error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng',
          type: 'error'
        });
      }
    },

    viewAllReviews() {
      if (!this.product) return;

      this.$router.push({
        name: 'ProductReviews',
        params: { productId: this.product.id }
      });
    },

    async addToCart() {
      if (this.isAddingToCart || !this.product) return;

      this.isAddingToCart = true;

      try {
        // Prepare options
        const options = {};

        // Add single selection options
        for (const optionId in this.selectedOptions) {
          if (this.selectedOptions[optionId]) {
            options[optionId] = this.selectedOptions[optionId];
          }
        }

        // Add multiple selection options
        for (const optionId in this.multipleOptions) {
          if (this.multipleOptions[optionId] && this.multipleOptions[optionId].length) {
            options[optionId] = this.multipleOptions[optionId];
          }
        }

        // Call action on cartStore instance
        await this.cartStore.addToCart({
          productId: this.product.id,
          quantity: this.quantity,
          options: Object.keys(options).length > 0 ? options : null,
          notes: this.specialInstructions || null
        });

        // Call action on notificationStore
        this.notificationStore.showToast({
          message: `${this.product.name} đã được thêm vào giỏ hàng của bạn`,
          type: 'success'
        });

        // Reset quantity and special instructions
        this.quantity = 1;
        this.specialInstructions = '';
      } catch (error) {
        console.error('Error adding to cart:', error);
        // Call action on notificationStore
        this.notificationStore.showToast({
          message: error.response?.data?.message || 'Không thể thêm sản phẩm vào giỏ hàng',
          type: 'error'
        });
      } finally {
        this.isAddingToCart = false;
      }
    }
  }
}); // Close defineComponent
</script>

<style scoped>
.product-detail-page {
  padding-bottom: 40px;
}

.product-image-card {
  position: relative;
  overflow: hidden;
}

.product-badges {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 1;
}

.quantity-selector {
  display: flex;
  align-items: center;
}

.similar-product-card {
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.similar-product-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.similar-product-card .v-img::after {
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

.similar-product-card:hover .v-img::after {
  opacity: 1;
}

@media (max-width: 600px) {
  .cart-actions .v-btn {
    width: 100%;
    margin-top: 16px;
  }

  .quantity-selector {
    margin-right: 0;
  }
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.1);
}
</style>