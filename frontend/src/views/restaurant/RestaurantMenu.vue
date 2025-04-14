<template>
  <div class="restaurant-menu">
    <v-container>
      <!-- Restaurant Header -->
      <div v-if="restaurant" class="restaurant-header mb-8">
        <v-row>
          <v-col cols="12" md="8">
            <div class="d-flex align-center mb-2">
              <v-btn icon variant="text" @click="goBack" class="mr-2">
                <v-icon>mdi-arrow-left</v-icon>
              </v-btn>
              <h1 class="text-h4">{{ restaurant.name }}</h1>
            </div>
            <div class="d-flex flex-wrap align-center mb-3">
              <v-rating
                :model-value="restaurant.rating"
                color="amber"
                density="compact"
                size="small"
                readonly
                half-increments
                class="mr-2"
              ></v-rating>
              <span class="text-body-2 mr-3">{{ restaurant.rating.toFixed(1) }} ({{ restaurant.reviewCount }})</span>

              <v-chip size="small" class="mr-2">
                <v-icon size="small" start>mdi-clock-outline</v-icon>
                {{ restaurant.deliveryTime }} phút
              </v-chip>

              <v-chip v-if="restaurant.distance" size="small" class="mr-2">
                <v-icon size="small" start>mdi-map-marker</v-icon>
                {{ formatDistance(restaurant.distance) }}
              </v-chip>

              <v-chip
                v-if="restaurant.isOpen"
                color="success"
                size="small"
                class="mr-2"
              >
                {{ $t('restaurant.menu.open') || 'Mở cửa' }}
              </v-chip>
              <v-chip
                v-else
                color="error"
                size="small"
                class="mr-2"
              >
                {{ $t('restaurant.menu.closed') || 'Đóng cửa' }}
              </v-chip>
            </div>

            <p class="text-body-1 mb-4">{{ restaurant.description }}</p>

            <div class="d-flex flex-wrap">
              <v-chip
                v-for="(cuisine, index) in restaurant.cuisines"
                :key="index"
                class="mr-2 mb-2"
                size="small"
                variant="outlined"
              >
                {{ cuisine }}
              </v-chip>
            </div>
          </v-col>

          <v-col cols="12" md="4">
            <v-card class="restaurant-info-card">
              <v-img
                :src="restaurant.image"
                height="180"
                cover
              ></v-img>
              <v-card-text>
                <div class="d-flex align-center mb-2">
                  <v-icon color="primary" class="mr-2">mdi-map-marker</v-icon>
                  <span>{{ restaurant.address }}</span>
                </div>
                <div class="d-flex align-center mb-2">
                  <v-icon color="primary" class="mr-2">mdi-phone</v-icon>
                  <span>{{ restaurant.phone }}</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon color="primary" class="mr-2">mdi-clock-outline</v-icon>
                  <span>{{ restaurant.openingHours }}</span>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Menu Tabs and Search -->
      <div class="menu-controls d-flex flex-wrap align-center justify-space-between mb-4">
        <div>
          <v-tabs v-model="activeTab" show-arrows>
            <v-tab
              v-for="(category, index) in menuCategories"
              :key="index"
              :value="category.id"
            >
              {{ category.name }}
            </v-tab>
          </v-tabs>
        </div>

        <div class="menu-search">
          <v-text-field
            v-model="searchQuery"
            :label="$t('restaurant.menu.searchPlaceholder')"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            hide-details
            class="menu-search-field"
          ></v-text-field>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="d-flex justify-center my-8">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>

      <!-- Menu Items -->
      <div v-else-if="filteredMenuItems.length > 0">
        <v-row>
          <v-col
            v-for="item in filteredMenuItems"
            :key="item.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card class="menu-item-card h-100" @click="openDishDetails(item)">
              <div class="d-flex">
                <div class="menu-item-content flex-grow-1 pa-4">
                  <h3 class="text-subtitle-1 font-weight-bold text-truncate mb-1">{{ item.name }}</h3>
                  <p class="text-caption text-medium-emphasis text-truncate-2 mb-2">{{ item.description }}</p>

                  <div v-if="item.labels && item.labels.length > 0" class="mb-2">
                    <v-chip
                      v-for="(label, idx) in item.labels"
                      :key="idx"
                      size="x-small"
                      class="mr-1"
                      :color="getLabelColor(label)"
                    >
                      {{ label }}
                    </v-chip>
                  </div>

                  <div class="d-flex align-center mt-auto">
                    <span v-if="item.discountPrice" class="text-subtitle-1 font-weight-bold mr-2">
                      {{ formatPrice(item.discountPrice) }}
                    </span>
                    <span v-if="item.discountPrice" class="text-decoration-line-through text-caption text-medium-emphasis">
                      {{ formatPrice(item.price) }}
                    </span>
                    <span v-else class="text-subtitle-1 font-weight-bold">
                      {{ formatPrice(item.price) }}
                    </span>

                    <v-spacer></v-spacer>

                    <v-btn
                      icon
                      color="primary"
                      size="small"
                      @click.stop="addToCart(item)"
                      class="add-to-cart-btn"
                    >
                      <v-icon>mdi-cart-plus</v-icon>
                    </v-btn>
                  </div>
                </div>

                <div class="menu-item-image" style="width: 120px;">
                  <v-img
                    :src="item.image"
                    height="100%"
                    cover
                  >
                    <div v-if="item.discountPrice" class="discount-badge">
                      {{ $t('restaurant.menu.discountPercent', { percent: calculateDiscount(item.price, item.discountPrice) }) }}
                    </div>
                  </v-img>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center my-8">
        <v-icon size="64" color="grey-lighten-1">mdi-food-off</v-icon>
        <h3 class="text-h5 mt-4">{{ $t('restaurant.menu.noItems') }}</h3>
        <p v-if="searchQuery" class="text-body-1 mt-2">
          {{ $t('common.noResults') }} "{{ searchQuery }}". {{ $t('common.tryAgain') }}.
        </p>
      </div>

      <!-- Dish detail dialog -->
      <v-dialog v-model="dishDialog" max-width="700">
        <v-card v-if="selectedDish" class="dish-detail-card">
          <v-img
            :src="selectedDish.image"
            height="300"
            cover
            class="dish-detail-image"
          >
            <v-btn
              icon
              variant="flat"
              color="white"
              size="small"
              class="close-btn"
              @click="dishDialog = false"
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>

            <div v-if="selectedDish.discountPrice" class="discount-badge">
              {{ calculateDiscount(selectedDish.price, selectedDish.discountPrice) }}% giảm
            </div>
          </v-img>

          <v-card-text class="pa-4">
            <h2 class="text-h5 font-weight-bold mb-2">{{ selectedDish.name }}</h2>

            <div v-if="selectedDish.labels && selectedDish.labels.length > 0" class="mb-3">
              <v-chip
                v-for="(label, idx) in selectedDish.labels"
                :key="idx"
                size="small"
                class="mr-2 mb-2"
                :color="getLabelColor(label)"
              >
                {{ label }}
              </v-chip>
            </div>

            <p class="text-body-1 mb-4">{{ selectedDish.description }}</p>

            <div class="d-flex align-center mb-4">
              <v-rating
                :model-value="selectedDish.rating || 0"
                color="amber"
                density="compact"
                size="small"
                readonly
                half-increments
                class="mr-2"
              ></v-rating>
              <span class="text-body-2">
                {{ selectedDish.rating ? selectedDish.rating.toFixed(1) : 'N/A' }}
                ({{ selectedDish.reviewCount || 0 }})
              </span>

              <v-spacer></v-spacer>

              <div>
                <span v-if="selectedDish.discountPrice" class="text-h6 font-weight-bold mr-2">
                  {{ formatPrice(selectedDish.discountPrice) }}
                </span>
                <span v-if="selectedDish.discountPrice" class="text-decoration-line-through text-caption text-medium-emphasis">
                  {{ formatPrice(selectedDish.price) }}
                </span>
                <span v-else class="text-h6 font-weight-bold">
                  {{ formatPrice(selectedDish.price) }}
                </span>
              </div>
            </div>

            <!-- Nutritional Information -->
            <div v-if="selectedDish.nutritionalInfo" class="mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Thông tin dinh dưỡng</h3>
              <v-row>
                <v-col v-for="(value, key) in selectedDish.nutritionalInfo" :key="key" cols="6" sm="3">
                  <div class="text-center pa-2 nutrition-item">
                    <div class="text-subtitle-1 font-weight-bold">{{ value }}</div>
                    <div class="text-caption text-medium-emphasis">{{ getNutritionLabel(key) }}</div>
                  </div>
                </v-col>
              </v-row>
            </div>

            <!-- Options and Add-ons -->
            <div v-if="selectedDish.options && selectedDish.options.length > 0" class="mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Tùy chọn</h3>

              <div v-for="(optionGroup, groupIndex) in selectedDish.options" :key="groupIndex" class="mb-3">
                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-2">{{ optionGroup.name }}</span>
                  <span v-if="optionGroup.required" class="text-caption text-error">*Bắt buộc</span>
                </div>

                <v-radio-group v-if="optionGroup.type === 'single'">
                  <v-radio
                    v-for="(option, optIndex) in optionGroup.items"
                    :key="optIndex"
                    :label="`${option.name} ${option.price > 0 ? '(+' + formatPrice(option.price) + ')' : ''}`"
                    :value="option.id"
                  ></v-radio>
                </v-radio-group>

                <div v-else-if="optionGroup.type === 'multiple'">
                  <v-checkbox
                    v-for="(option, optIndex) in optionGroup.items"
                    :key="optIndex"
                    :label="`${option.name} ${option.price > 0 ? '(+' + formatPrice(option.price) + ')' : ''}`"
                    :value="option.id"
                    hide-details
                    class="mb-1"
                  ></v-checkbox>
                </div>
              </div>
            </div>

            <!-- Special Requests -->
            <div class="mb-4">
              <h3 class="text-subtitle-1 font-weight-bold mb-2">Yêu cầu đặc biệt</h3>
              <v-textarea
                v-model="specialRequests"
                label="Các yêu cầu đặc biệt cho món ăn này"
                variant="outlined"
                rows="2"
                hide-details
              ></v-textarea>
            </div>

            <!-- Quantity and Add to Cart -->
            <div class="d-flex align-center">
              <v-btn-group variant="outlined">
                <v-btn icon @click="decreaseQuantity">
                  <v-icon>mdi-minus</v-icon>
                </v-btn>
                <v-btn disabled>{{ quantity }}</v-btn>
                <v-btn icon @click="increaseQuantity">
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </v-btn-group>

              <v-spacer></v-spacer>

              <v-btn
                color="primary"
                size="large"
                @click="addSelectedDishToCart"
                class="px-6"
              >
                Thêm vào giỏ hàng - {{ formatPrice(calculateTotalPrice()) }}
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useNotification } from '@/composables/useNotification';
import { useI18n } from 'vue-i18n';
import restaurantService from '@/services/restaurant.service';
import menuService from '@/services/menu.service';
import cartService from '@/services/cart.service';

export default {
  name: 'RestaurantMenu',

  setup() {
    const route = useRoute();
    const router = useRouter();
    const { notify } = useNotification();
    const { t, locale } = useI18n();

    // State
    const restaurant = ref(null);
    const menuItems = ref([]);
    const menuCategories = ref([]);
    const loading = ref(true);
    const searchQuery = ref('');
    const activeTab = ref(null);
    const dishDialog = ref(false);
    const selectedDish = ref(null);
    const quantity = ref(1);
    const specialRequests = ref('');

    // Restaurant ID from route
    const restaurantId = computed(() => route.params.id);

    // Filter menu items based on search and active category
    const filteredMenuItems = computed(() => {
      let items = menuItems.value;

      // Filter by category
      if (activeTab.value) {
        items = items.filter(item => item.categoryId === activeTab.value);
      }

      // Filter by search query
      if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase();
        items = items.filter(item =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
        );
      }

      return items;
    });

    // Fetch restaurant details and menu
    const fetchRestaurantAndMenu = async () => {
      loading.value = true;
      try {
        // Fetch restaurant details
        const restaurantResponse = await restaurantService.getRestaurantById(restaurantId.value);
        restaurant.value = restaurantResponse.data;

        // Fetch menu categories
        const categoriesResponse = await menuService.getMenuCategories(restaurantId.value);
        menuCategories.value = categoriesResponse.data || [];

        if (menuCategories.value.length > 0) {
          activeTab.value = menuCategories.value[0].id;
        }

        // Fetch menu items
        const menuResponse = await menuService.getMenuItems(restaurantId.value);
        menuItems.value = menuResponse.data || [];
      } catch (error) {
        console.error('Error fetching restaurant and menu:', error);
        notify(t('common.error') + ': ' + t('restaurant.menu.loadError'), 'error');
      } finally {
        loading.value = false;
      }
    };

    // Calculate discount percentage
    const calculateDiscount = (originalPrice, discountPrice) => {
      if (!originalPrice || !discountPrice) return 0;
      const discount = ((originalPrice - discountPrice) / originalPrice) * 100;
      return Math.round(discount);
    };

    // Format price
    const formatPrice = (price) => {
      return new Intl.NumberFormat(locale.value === 'vi' ? 'vi-VN' : 'en-US', {
        style: 'currency',
        currency: locale.value === 'vi' ? 'VND' : 'USD'
      }).format(price);
    };

    // Format distance
    const formatDistance = (distance) => {
      if (distance < 1) {
        return `${(distance * 1000).toFixed(0)}m`;
      }
      return `${distance.toFixed(1)}km`;
    };

    // Get color for food label
    const getLabelColor = (label) => {
      const labelMap = {
        'Vegetarian': 'success',
        'Vegan': 'success-darken-1',
        'Spicy': 'error',
        'Gluten Free': 'info',
        'Organic': 'success-lighten-1',
        'Hot': 'deep-orange',
        'New': 'primary'
      };

      return labelMap[label] || 'grey';
    };

    // Get nutrition label translation
    const getNutritionLabel = (key) => {
      const labelMap = {
        'calories': 'Calories',
        'protein': 'Protein',
        'carbs': 'Carbs',
        'fat': 'Fat'
      };

      return labelMap[key] || key;
    };

    // Navigate back
    const goBack = () => {
      router.go(-1);
    };

    // Open dish details dialog
    const openDishDetails = (dish) => {
      selectedDish.value = { ...dish };
      quantity.value = 1;
      specialRequests.value = '';
      dishDialog.value = true;
    };

    // Add dish to cart directly from menu list
    const addToCart = async (dish) => {
      try {
        await cartService.addToCart({
          restaurantId: restaurantId.value,
          itemId: dish.id,
          quantity: 1,
          options: [],
          specialInstructions: ''
        });

        notify(`Đã thêm ${dish.name} vào giỏ hàng`, 'success');
      } catch (error) {
        console.error('Error adding to cart:', error);
        notify('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
      }
    };

    // Decrease quantity
    const decreaseQuantity = () => {
      if (quantity.value > 1) {
        quantity.value--;
      }
    };

    // Increase quantity
    const increaseQuantity = () => {
      quantity.value++;
    };

    // Calculate total price for selected dish with options
    const calculateTotalPrice = () => {
      if (!selectedDish.value) return 0;

      // Base price (use discount price if available)
      let total = selectedDish.value.discountPrice || selectedDish.value.price;

      // Multiply by quantity
      total *= quantity.value;

      return total;
    };

    // Add selected dish to cart with options and quantity
    const addSelectedDishToCart = async () => {
      if (!selectedDish.value) return;

      try {
        await cartService.addToCart({
          restaurantId: restaurantId.value,
          itemId: selectedDish.value.id,
          quantity: quantity.value,
          options: [], // We would collect selected options here
          specialInstructions: specialRequests.value
        });

        notify(t('cart.itemAdded', { name: selectedDish.value.name }), 'success');
        dishDialog.value = false;
      } catch (error) {
        console.error('Error adding to cart:', error);
        notify(t('common.error') + ': ' + t('cart.addError'), 'error');
      }
    };

    // Watch for changes in route parameters
    watch(() => route.params.id, (newId) => {
      if (newId) {
        fetchRestaurantAndMenu();
      }
    });

    // Watch for changes in active tab
    watch(activeTab, () => {
      // Reset search when changing category
      searchQuery.value = '';
    });

    // Fetch data when component is mounted
    onMounted(() => {
      if (restaurantId.value) {
        fetchRestaurantAndMenu();
      }
    });

    return {
      restaurant,
      menuItems,
      menuCategories,
      loading,
      searchQuery,
      activeTab,
      filteredMenuItems,
      dishDialog,
      selectedDish,
      quantity,
      specialRequests,
      calculateDiscount,
      formatPrice,
      formatDistance,
      getLabelColor,
      getNutritionLabel,
      goBack,
      openDishDetails,
      addToCart,
      decreaseQuantity,
      increaseQuantity,
      calculateTotalPrice,
      addSelectedDishToCart
    };
  }
};
</script>

<style scoped>
.restaurant-menu {
  padding-bottom: 60px;
}

.restaurant-header {
  animation: fadeIn 0.5s ease-out;
}

.restaurant-info-card {
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.restaurant-info-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.menu-controls {
  position: sticky;
  top: 64px;
  background-color: white;
  z-index: 5;
  padding: 8px 0;
}

.menu-search-field {
  max-width: 300px;
}

.menu-item-card {
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  margin-bottom: 16px;
}

.menu-item-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.menu-item-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.menu-item-image {
  position: relative;
}

.dish-detail-card {
  border-radius: 16px;
  overflow: hidden;
}

.dish-detail-image {
  position: relative;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.discount-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff5252;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 1;
}

.add-to-cart-btn {
  opacity: 0.8;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.add-to-cart-btn:hover {
  opacity: 1;
  transform: scale(1.1);
}

.nutrition-item {
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (max-width: 960px) {
  .menu-controls {
    flex-direction: column;
  }

  .menu-search {
    width: 100%;
    margin-top: 16px;
  }

  .menu-search-field {
    max-width: 100%;
  }
}
</style>