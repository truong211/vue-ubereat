<template>
  <div class="promotional-banner">
    <v-carousel
      v-if="banners.length > 1"
      height="180"
      hide-delimiter-background
      show-arrows="hover"
      cycle
      interval="5000"
      class="promo-carousel rounded-lg"
    >
      <v-carousel-item
        v-for="(banner, index) in banners"
        :key="index"
        @click="handleBannerClick(banner)"
        class="cursor-pointer"
      >
        <v-img
          :src="banner.image"
          cover
          height="100%"
          :alt="banner.title"
        >
          <div class="d-flex flex-column fill-height justify-center promo-content pa-4 pa-md-6">
            <div class="promo-content-inner">
              <h3 class="text-h5 text-md-h4 font-weight-bold">{{ banner.title }}</h3>
              <p class="text-body-1 mt-2 mb-4 text-truncate-2">{{ banner.description }}</p>
              <v-btn
                color="primary"
                :to="banner.link || '#'"
                class="promo-btn"
                variant="flat"
              >
                {{ banner.buttonText || 'Learn More' }}
              </v-btn>
            </div>
          </div>
        </v-img>
      </v-carousel-item>
    </v-carousel>

    <!-- Single banner view if only one banner -->
    <v-card
      v-else-if="banners.length === 1"
      class="promo-card rounded-lg"
      @click="handleBannerClick(banners[0])"
    >
      <v-img
        :src="banners[0].image"
        cover
        height="180"
        :alt="banners[0].title"
      >
        <div class="d-flex flex-column fill-height justify-center promo-content pa-4 pa-md-6">
          <div class="promo-content-inner">
            <h3 class="text-h5 text-md-h4 font-weight-bold">{{ banners[0].title }}</h3>
            <p class="text-body-1 mt-2 mb-4 text-truncate-2">{{ banners[0].description }}</p>
            <v-btn
              color="primary"
              :to="banners[0].link || '#'"
              class="promo-btn"
              variant="flat"
            >
              {{ banners[0].buttonText || 'Learn More' }}
            </v-btn>
          </div>
        </div>
      </v-img>
    </v-card>

    <!-- Fallback to default promotional content if no banners -->
    <v-card
      v-else
      class="promo-card default-promo rounded-lg"
    >
      <div class="d-flex flex-column h-100 justify-center promo-content pa-4 pa-md-6">
        <div class="promo-content-inner">
          <h3 class="text-h5 text-md-h4 font-weight-bold">Special Offer for New Customers</h3>
          <p class="text-body-1 mt-2 mb-4">Get 20% off your first order with promo code: WELCOME20</p>
          <v-btn
            color="primary"
            to="/register"
            class="promo-btn"
            variant="flat"
          >
            Sign Up Now
          </v-btn>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'PromotionalBanner',
  
  props: {
    banners: {
      type: Array,
      default: () => []
    }
  },
  
  setup(props, { emit }) {
    const router = useRouter();
    
    const handleBannerClick = (banner) => {
      if (banner.link) {
        router.push(banner.link);
      }
      
      emit('banner-clicked', banner);
    };
    
    return {
      handleBannerClick
    };
  }
};
</script>

<style scoped>
.promotional-banner {
  margin-bottom: 32px;
}

.promo-carousel, .promo-card {
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.promo-carousel:hover, .promo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.promo-content {
  position: relative;
  z-index: 2;
  background: linear-gradient(to right, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.4));
  border-radius: 8px;
  max-width: 500px;
}

.promo-content-inner {
  animation: slide-in 0.5s ease-out;
}

.default-promo {
  height: 180px;
  background: linear-gradient(135deg, var(--primary-color) 0%, #9c27b0 100%);
  color: white;
}

.promo-btn {
  transition: transform 0.2s ease;
}

.promo-btn:hover {
  transform: translateX(4px);
}

.cursor-pointer {
  cursor: pointer;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@media (max-width: 600px) {
  .promo-content {
    max-width: 100%;
    background: linear-gradient(to right, rgba(0, 0, 0, 0.75), rgba(0, 0, 0, 0.5));
  }
}
</style> 