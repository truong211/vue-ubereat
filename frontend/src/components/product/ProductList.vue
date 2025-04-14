<template>
  <div class="product-list">
    <v-list>
      <v-list-item
        v-for="product in products"
        :key="product.id"
        @click="viewProductDetails(product.id)"
        class="product-list-item mb-3"
        rounded
      >
        <template v-slot:prepend>
          <v-avatar rounded size="80" class="mr-4">
            <v-img
              :src="product.image || '/img/product-placeholder.jpg'"
              cover
            >
              <div v-if="product.discountPrice" class="discount-badge">
                {{ calculateDiscount(product.price, product.discountPrice) }}% 
              </div>
            </v-img>
          </v-avatar>
        </template>

        <v-list-item-title class="text-subtitle-1 font-weight-bold mb-1">
          {{ product.name }}
          <v-chip
            v-if="product.isPopular"
            color="red"
            size="x-small"
            label
            class="ml-2"
          >
            Phổ biến
          </v-chip>
          <v-chip
            v-if="product.isVegetarian"
            color="success-lighten-1"
            size="x-small"
            label
            class="ml-2"
          >
            Chay
          </v-chip>
        </v-list-item-title>
        
        <v-list-item-subtitle v-if="product.restaurant" class="text-caption mb-1">
          {{ product.restaurant.name }}
        </v-list-item-subtitle>

        <v-list-item-subtitle class="text-truncate mb-2">
          {{ product.description }}
        </v-list-item-subtitle>
        
        <div class="d-flex align-center">
          <v-rating
            :model-value="product.rating || 0"
            color="amber"
            density="compact"
            size="x-small"
            readonly
            half-increments
          ></v-rating>
          <span class="text-caption ml-1">({{ product.reviewCount || 0 }})</span>
        </div>

        <template v-slot:append>
          <div class="d-flex flex-column align-end">
            <div class="d-flex align-center mb-2">
              <div v-if="product.discountPrice">
                <span class="text-h6 font-weight-bold">{{ formatPrice(product.discountPrice) }}</span>
                <span class="text-decoration-line-through text-caption text-medium-emphasis ml-1">
                  {{ formatPrice(product.price) }}
                </span>
              </div>
              <div v-else>
                <span class="text-h6 font-weight-bold">{{ formatPrice(product.price) }}</span>
              </div>
            </div>
            
            <v-btn
              color="primary"
              density="comfortable"
              variant="tonal"
              rounded
              prepend-icon="mdi-cart-plus"
              @click.stop="addToCartHandler(product)"
            >
              Thêm vào giỏ
            </v-btn>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';
import { useNotification } from '@/composables/useNotification';
import cartService from '@/services/cart.service';

export default {
  name: 'ProductList',
  
  props: {
    products: {
      type: Array,
      required: true
    }
  },
  
  emits: ['add-to-cart'],
  
  setup(props, { emit }) {
    const router = useRouter();
    const { notify } = useNotification();
    
    const viewProductDetails = (productId) => {
      router.push(`/products/${productId}`);
    };
    
    const addToCartHandler = async (product) => {
      try {
        await cartService.addToCart({
          productId: product.id,
          quantity: 1
        });
        
        notify(`Đã thêm ${product.name} vào giỏ hàng`, 'success');
        emit('add-to-cart', product);
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
    
    return {
      viewProductDetails,
      addToCartHandler,
      calculateDiscount,
      formatPrice
    };
  }
};
</script>

<style scoped>
.product-list-item {
  transition: background-color 0.2s ease, transform 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.05);
  animation: fadeIn 0.5s ease-out;
}

.product-list-item:hover {
  background-color: rgba(0, 0, 0, 0.03);
  transform: translateX(5px);
}

.discount-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #ff5252;
  color: white;
  padding: 2px 4px;
  border-radius: 0 4px 0 4px;
  font-size: 10px;
  font-weight: bold;
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
</style> 