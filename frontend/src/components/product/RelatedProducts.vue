<template>
  <div class="related-products">
    <h2 class="text-h5 font-weight-bold mb-4">{{ title || 'Sản phẩm liên quan' }}</h2>

    <div v-if="loading" class="d-flex justify-center my-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-else-if="products.length === 0" class="text-center my-4">
      <v-icon size="48" color="grey-lighten-1">mdi-food-off</v-icon>
      <p class="text-body-1 mt-2">Không tìm thấy sản phẩm liên quan</p>
    </div>

    <v-slide-group
      v-else
      show-arrows="hover"
      class="mb-4"
    >
      <v-slide-group-item
        v-for="product in products"
        :key="product.id"
      >
        <v-card
          class="ma-2 product-card"
          width="240"
          @click="viewProductDetails(product.id)"
          hover
        >
          <v-img
            :src="product.image || '/img/product-placeholder.jpg'"
            height="180"
            cover
            class="product-image"
          >
            <div v-if="product.discountPrice" class="discount-badge">
              {{ calculateDiscount(product.price, product.discountPrice) }}% GIẢM
            </div>
          </v-img>

          <v-card-title class="text-truncate">{{ product.name }}</v-card-title>

          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-rating
                :model-value="product.rating || 0"
                color="amber"
                density="compact"
                size="small"
                readonly
                half-increments
              ></v-rating>
              <span class="text-caption ml-2">({{ product.reviewCount || 0 }})</span>
            </div>

            <div class="d-flex align-center justify-space-between">
              <div v-if="product.discountPrice">
                <span class="text-h6 font-weight-bold">{{ formatPrice(product.discountPrice) }}</span>
                <span class="text-decoration-line-through text-caption text-medium-emphasis ml-1">
                  {{ formatPrice(product.price) }}
                </span>
              </div>
              <div v-else>
                <span class="text-h6 font-weight-bold">{{ formatPrice(product.price) }}</span>
              </div>

              <v-btn
                icon
                color="primary"
                variant="text"
                @click.stop="addToCart(product)"
                class="hover-scale"
              >
                <v-icon>mdi-cart-plus</v-icon>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-slide-group-item>
    </v-slide-group>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useNotification } from '@/composables/useNotification';
import productService from '@/services/product.service';
import cartService from '@/services/cart.service';

export default {
  name: 'RelatedProducts',

  props: {
    productId: {
      type: [String, Number],
      required: true
    },
    categoryId: {
      type: [String, Number],
      default: null
    },
    title: {
      type: String,
      default: ''
    },
    maxItems: {
      type: Number,
      default: 8
    }
  },

  setup(props) {
    const router = useRouter();
    const { notify } = useNotification();

    const products = ref([]);
    const loading = ref(false);

    const fetchRelatedProducts = async () => {
      if (!props.productId) return;
      
      loading.value = true;
      try {
        const params = {
          productId: props.productId,
          categoryId: props.categoryId,
          limit: props.maxItems
        };

        const response = await productService.getRelatedProducts(params);
        products.value = response.data.data || [];
      } catch (error) {
        console.error('Error fetching related products:', error);
        notify('Không thể tải sản phẩm liên quan. Vui lòng thử lại sau.', 'error');
      } finally {
        loading.value = false;
      }
    };

    const viewProductDetails = (productId) => {
      if (productId === props.productId) return;
      router.push(`/products/${productId}`);
    };

    const addToCart = async (product) => {
      try {
        await cartService.addToCart({
          productId: product.id,
          quantity: 1
        });

        notify(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
      } catch (error) {
        console.error('Error adding to cart:', error);
        notify('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
      }
    };

    const calculateDiscount = (originalPrice, discountPrice) => {
      if (!originalPrice || !discountPrice) return 0;
      const discount = ((originalPrice - discountPrice) / originalPrice) * 100;
      return Math.round(discount);
    };

    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    };

    // Watch for changes in productId
    watch(() => props.productId, () => {
      fetchRelatedProducts();
    });

    onMounted(() => {
      fetchRelatedProducts();
    });

    return {
      products,
      loading,
      viewProductDetails,
      addToCart,
      calculateDiscount,
      formatPrice
    };
  }
};
</script>

<style scoped>
.product-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  will-change: transform;
}

.product-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1) !important;
}

.product-card:hover .product-image {
  transform: scale(1.05);
}

.product-image {
  position: relative;
  transition: transform 0.5s ease;
  overflow: hidden;
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

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.1);
}

/* Animation for slide group */
.v-slide-group-item {
  animation: fadeIn 0.5s ease forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger animation for cards */
.v-slide-group-item:nth-child(1) { animation-delay: 0.1s; }
.v-slide-group-item:nth-child(2) { animation-delay: 0.2s; }
.v-slide-group-item:nth-child(3) { animation-delay: 0.3s; }
.v-slide-group-item:nth-child(4) { animation-delay: 0.4s; }
.v-slide-group-item:nth-child(5) { animation-delay: 0.5s; }
.v-slide-group-item:nth-child(6) { animation-delay: 0.6s; }
.v-slide-group-item:nth-child(7) { animation-delay: 0.7s; }
.v-slide-group-item:nth-child(8) { animation-delay: 0.8s; }
</style> 