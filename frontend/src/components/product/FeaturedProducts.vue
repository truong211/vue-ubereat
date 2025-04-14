<template>
  <div class="featured-products">
    <div class="d-flex justify-space-between align-center mb-6">
      <h2 class="text-h4">{{ title || 'Sản phẩm nổi bật' }}</h2>
      <v-btn variant="text" color="primary" :to="viewAllLink" class="hover-scale">
        {{ viewAllText || 'Xem tất cả' }}
        <v-icon end>mdi-arrow-right</v-icon>
      </v-btn>
    </div>

    <v-slide-group
      v-if="slideView && !loading"
      :show-arrows="true"
      class="mb-4"
    >
      <v-slide-group-item v-for="product in products" :key="product.id">
        <v-card 
          class="ma-2 product-card" 
          width="240" 
          @click="viewProductDetails(product.id)" 
          hover
        >
          <v-img
            :src="product.image"
            height="200"
            cover
            class="product-image"
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-row>
            </template>

            <div v-if="product.discountPrice" class="discount-badge">
              {{ calculateDiscount(product.price, product.discountPrice) }}% GIẢM
            </div>
          </v-img>

          <v-card-title class="text-truncate">{{ product.name }}</v-card-title>

          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-rating
                :model-value="product.rating"
                color="amber"
                density="compact"
                size="small"
                readonly
                half-increments
              ></v-rating>
              <span class="text-caption ml-2">({{ product.reviewCount || 0 }})</span>
            </div>

            <div class="d-flex align-center">
              <div v-if="product.discountPrice" class="mr-2">
                <span class="text-h6 font-weight-bold">{{ formatPrice(product.discountPrice) }}</span>
                <span class="text-decoration-line-through text-caption text-medium-emphasis ml-1">
                  {{ formatPrice(product.price) }}
                </span>
              </div>
              <div v-else>
                <span class="text-h6 font-weight-bold">{{ formatPrice(product.price) }}</span>
              </div>

              <v-spacer></v-spacer>

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

    <v-row v-if="!slideView && !loading">
      <v-col v-for="product in products" :key="product.id" cols="12" sm="6" md="4" lg="3">
        <v-card class="h-100 product-card" @click="viewProductDetails(product.id)" hover>
          <v-img
            :src="product.image"
            height="200"
            cover
            class="product-image"
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
              </v-row>
            </template>

            <div v-if="product.discountPrice" class="discount-badge">
              {{ calculateDiscount(product.price, product.discountPrice) }}% GIẢM
            </div>
          </v-img>

          <v-card-title class="text-truncate">{{ product.name }}</v-card-title>

          <v-card-text>
            <div class="d-flex align-center mb-2">
              <v-rating
                :model-value="product.rating"
                color="amber"
                density="compact"
                size="small"
                readonly
                half-increments
              ></v-rating>
              <span class="text-caption ml-2">({{ product.reviewCount || 0 }})</span>
            </div>

            <div class="d-flex align-center">
              <div v-if="product.discountPrice" class="mr-2">
                <span class="text-h6 font-weight-bold">{{ formatPrice(product.discountPrice) }}</span>
                <span class="text-decoration-line-through text-caption text-medium-emphasis ml-1">
                  {{ formatPrice(product.price) }}
                </span>
              </div>
              <div v-else>
                <span class="text-h6 font-weight-bold">{{ formatPrice(product.price) }}</span>
              </div>

              <v-spacer></v-spacer>

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
      </v-col>
    </v-row>

    <div v-if="loading" class="d-flex justify-center my-4">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>

    <div v-if="!loading && products.length === 0" class="text-center my-8">
      <v-icon size="64" color="grey-lighten-1">mdi-food-off</v-icon>
      <p class="text-h6 mt-4">Không tìm thấy sản phẩm nào</p>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { mapState, mapActions } from 'vuex';
import { useToast } from '@/composables/useToast';
import { useNotification } from '@/composables/useNotification';
import productService from '@/services/product.service';
import cartService from '@/services/cart.service';

export default {
  name: 'FeaturedProducts',

  props: {
    maxItems: {
      type: Number,
      default: 8
    },
    category: {
      type: [String, Number],
      default: null
    },
    slideView: {
      type: Boolean,
      default: true
    },
    title: {
      type: String,
      default: ''
    },
    viewAllText: {
      type: String,
      default: ''
    },
    viewAllLink: {
      type: String,
      default: '/foods'
    }
  },

  setup(props) {
    const router = useRouter();
    const toast = useToast();
    const { notify } = useNotification();

    const products = ref([]);
    const loading = ref(false);

    const fetchProducts = async () => {
      loading.value = true;
      try {
        const params = {
          limit: props.maxItems,
          sort: 'popular',
          onSale: true
        };

        if (props.category) {
          params.categoryId = props.category;
        }

        const response = await productService.getProducts(params);
        products.value = response.data.data || [];
      } catch (error) {
        console.error('Error fetching featured products:', error);
        notify('Không thể tải sản phẩm. Vui lòng thử lại sau.', 'error');
      } finally {
        loading.value = false;
      }
    };

    const viewProductDetails = (productId) => {
      router.push(`/products/${productId}`);
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

    onMounted(() => {
      fetchProducts();
    });

    return {
      products,
      loading,
      viewProductDetails,
      calculateDiscount,
      formatPrice
    };
  },

    computed: {
      ...mapState({
        cartItems: state => state.cart.items,
        cartItemCount: state => state.cart.itemCount
      })
    },
    
    methods: {
      ...mapActions({
        addItemToCart: 'cart/addItem',
        notify: 'ui/notify'
      }),

    async addToCart(product) {
      try {
        await cartService.addToCart({
          productId: product.id,
          quantity: 1
        });

        // Add to Vuex store
        await this.addItemToCart(product);

        this.notify(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
      } catch (error) {
        console.error('Error adding to cart:', error);
        this.notify('Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'error');
      }
    }
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
