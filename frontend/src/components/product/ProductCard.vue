<template>
  <v-hover v-slot="{ isHovering, props }">
    <v-card
      v-bind="props"
      :elevation="isHovering ? 4 : 1"
      :class="{ 'on-hover': isHovering }"
      class="product-card h-100"
      @click="viewProductDetails"
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
              {{ calculateDiscount(product.price, product.discountPrice) }}% GIẢM
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
          @click.stop="addToCartHandler"
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
          <span class="text-caption ml-2">({{ product.reviewCount || 0 }})</span>
        </div>

        <div class="d-flex align-center justify-space-between">
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
            @click.stop="addToCartHandler"
            class="hover-scale"
          >
            <v-icon>mdi-cart-plus</v-icon>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-hover>
</template>

<script>
import { useRouter } from 'vue-router';
import { useNotification } from '@/composables/useNotification';
import cartService from '@/services/cart.service';

export default {
  name: 'ProductCard',
  
  props: {
    product: {
      type: Object,
      required: true
    }
  },
  
  emits: ['add-to-cart'],
  
  setup(props, { emit }) {
    const router = useRouter();
    const { notify } = useNotification();
    
    const viewProductDetails = () => {
      router.push(`/products/${props.product.id}`);
    };
    
    const addToCartHandler = async () => {
      try {
        await cartService.addToCart({
          productId: props.product.id,
          quantity: 1
        });
        
        notify(`Đã thêm ${props.product.name} vào giỏ hàng`, 'success');
        emit('add-to-cart', props.product);
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
.product-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  will-change: transform;
  position: relative;
  animation: fadeIn 0.5s ease-out;
}

.product-card.on-hover {
  transform: translateY(-5px);
}

.position-relative {
  position: relative;
}

.product-badges {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  z-index: 1;
}

.add-to-cart-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 1;
  transition: transform 0.2s ease;
}

.add-to-cart-btn:hover {
  transform: scale(1.05);
}

.hover-scale {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.1);
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