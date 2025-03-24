<template>
  <v-card class="search-filters mb-4" variant="outlined">
    <v-card-title class="d-flex align-center">
      <span>Bộ lọc</span>
      <v-spacer></v-spacer>
      <v-btn 
        variant="text" 
        color="primary" 
        density="comfortable" 
        @click="resetFilters"
      >
        Đặt lại
      </v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <v-card-text>
      <v-row dense>
        <!-- Khoảng cách -->
        <v-col cols="12">
          <div class="text-subtitle-2 mb-2">Khoảng cách</div>
          <v-slider
            v-model="filters.distance"
            :max="10"
            :min="1"
            :step="0.5"
            thumb-label
            color="primary"
            :hide-details="false"
            :details="`${filters.distance} km`"
          ></v-slider>
        </v-col>

        <!-- Đánh giá -->
        <v-col cols="12">
          <div class="text-subtitle-2 mb-2">Đánh giá tối thiểu</div>
          <v-rating
            v-model="filters.rating"
            color="amber"
            active-color="amber"
            hover
            half-increments
            length="5"
            size="small"
          ></v-rating>
        </v-col>

        <!-- Khoảng giá -->
        <v-col cols="12">
          <div class="text-subtitle-2 mb-2">Khoảng giá</div>
          <v-range-slider
            v-model="filters.priceRange"
            :max="500000"
            :min="0"
            :step="10000"
            color="primary"
            thumb-label
            :hide-details="false"
            :details="`${formatPrice(filters.priceRange[0])} - ${formatPrice(filters.priceRange[1])}`"
          ></v-range-slider>
        </v-col>

        <!-- Thời gian giao hàng -->
        <v-col cols="12">
          <div class="text-subtitle-2 mb-2">Thời gian giao tối đa</div>
          <v-btn-toggle
            v-model="filters.deliveryTime"
            color="primary"
            mandatory
            variant="outlined"
            rounded="lg"
            density="comfortable"
            class="w-100"
          >
            <v-btn value="15">15 phút</v-btn>
            <v-btn value="30">30 phút</v-btn>
            <v-btn value="45">45 phút</v-btn>
            <v-btn value="60">60 phút</v-btn>
          </v-btn-toggle>
        </v-col>

        <!-- Loại món ăn -->
        <v-col cols="12">
          <div class="text-subtitle-2 mb-2">Loại món ăn</div>
          <v-autocomplete
            v-model="filters.cuisineTypes"
            :items="cuisineTypeOptions"
            chips
            closable-chips
            multiple
            variant="outlined"
            density="compact"
            hide-details
          ></v-autocomplete>
        </v-col>

        <!-- Ưu đãi đặc biệt -->
        <v-col cols="12">
          <div class="text-subtitle-2 mb-2">Ưu đãi đặc biệt</div>
          <v-checkbox
            v-model="filters.specialOffers.freeDelivery"
            label="Miễn phí giao hàng"
            color="primary"
            hide-details
            density="compact"
          ></v-checkbox>
          <v-checkbox
            v-model="filters.specialOffers.hasPromotion"
            label="Có khuyến mãi"
            color="primary"
            hide-details
            density="compact"
          ></v-checkbox>
          <v-checkbox
            v-model="filters.specialOffers.newRestaurant"
            label="Nhà hàng mới"
            color="primary"
            hide-details
            density="compact"
          ></v-checkbox>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions>
      <v-btn
        block
        color="primary"
        @click="applyFilters"
      >
        Áp dụng bộ lọc
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const emit = defineEmits(['update:filters', 'apply-filters']);

const filters = reactive({
  distance: 5,
  rating: 0,
  priceRange: [0, 500000],
  deliveryTime: "45",
  cuisineTypes: [],
  specialOffers: {
    freeDelivery: false,
    hasPromotion: false,
    newRestaurant: false
  }
});

const cuisineTypeOptions = [
  'Việt Nam',
  'Hàn Quốc',
  'Nhật Bản',
  'Trung Quốc',
  'Thái Lan',
  'Ý',
  'Mỹ',
  'Ấn Độ',
  'Đồ ăn nhanh',
  'Đồ chay',
  'Đồ uống',
  'Bánh ngọt',
  'Đồ ăn vặt',
  'Hải sản',
  'Lẩu',
  'Nướng'
];

// Format price to VND
const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price);
};

// Apply filters
const applyFilters = () => {
  // Create a query object from the filters
  const query = {
    ...route.query,
    distance: filters.distance,
    rating: filters.rating,
    priceMin: filters.priceRange[0],
    priceMax: filters.priceRange[1],
    deliveryTime: filters.deliveryTime,
    cuisineTypes: filters.cuisineTypes.join(','),
    freeDelivery: filters.specialOffers.freeDelivery ? 1 : undefined,
    hasPromotion: filters.specialOffers.hasPromotion ? 1 : undefined,
    newRestaurant: filters.specialOffers.newRestaurant ? 1 : undefined
  };
  
  // Remove undefined values
  Object.keys(query).forEach(key => query[key] === undefined && delete query[key]);
  
  // Update route with query params
  router.push({ query });
  
  // Emit event to parent component
  emit('apply-filters', { ...filters });
};

// Reset filters
const resetFilters = () => {
  Object.assign(filters, {
    distance: 5,
    rating: 0,
    priceRange: [0, 500000],
    deliveryTime: "45",
    cuisineTypes: [],
    specialOffers: {
      freeDelivery: false,
      hasPromotion: false,
      newRestaurant: false
    }
  });
  
  // Apply the reset filters
  applyFilters();
};

// Watch for route query changes
watch(() => route.query, (newQuery) => {
  if (Object.keys(newQuery).length) {
    // Update filter values from query parameters
    if (newQuery.distance) filters.distance = parseFloat(newQuery.distance);
    if (newQuery.rating) filters.rating = parseFloat(newQuery.rating);
    if (newQuery.priceMin && newQuery.priceMax) {
      filters.priceRange = [parseInt(newQuery.priceMin), parseInt(newQuery.priceMax)];
    }
    if (newQuery.deliveryTime) filters.deliveryTime = newQuery.deliveryTime;
    if (newQuery.cuisineTypes) filters.cuisineTypes = newQuery.cuisineTypes.split(',');
    
    filters.specialOffers.freeDelivery = !!newQuery.freeDelivery;
    filters.specialOffers.hasPromotion = !!newQuery.hasPromotion;
    filters.specialOffers.newRestaurant = !!newQuery.newRestaurant;
  }
}, { immediate: true });

// Watch filters for changes and emit to parent
watch(filters, (newFilters) => {
  emit('update:filters', { ...newFilters });
}, { deep: true });

// Initialize filters from query params
onMounted(() => {
  if (Object.keys(route.query).length) {
    if (route.query.distance) filters.distance = parseFloat(route.query.distance);
    if (route.query.rating) filters.rating = parseFloat(route.query.rating);
    if (route.query.priceMin && route.query.priceMax) {
      filters.priceRange = [parseInt(route.query.priceMin), parseInt(route.query.priceMax)];
    }
    if (route.query.deliveryTime) filters.deliveryTime = route.query.deliveryTime;
    if (route.query.cuisineTypes) filters.cuisineTypes = route.query.cuisineTypes.split(',');
    
    filters.specialOffers.freeDelivery = !!route.query.freeDelivery;
    filters.specialOffers.hasPromotion = !!route.query.hasPromotion;
    filters.specialOffers.newRestaurant = !!route.query.newRestaurant;
  }
});
</script>

<style scoped>
.w-100 {
  width: 100%;
}
</style> 