<template>
  <v-card class="promotional-banner mb-6" elevation="2" rounded="lg">
    <v-carousel
      cycle
      height="180"
      hide-delimiter-background
      show-arrows="hover"
      interval="6000"
    >
      <v-carousel-item
        v-for="(banner, index) in promotionalBanners"
        :key="index"
        :src="banner.image"
        cover
      >
        <div class="banner-content d-flex flex-column justify-center h-100 pa-4">
          <v-card flat color="transparent" class="banner-card pa-4">
            <h3 class="text-h5 font-weight-bold mb-2">{{ banner.title }}</h3>
            <p class="mb-2">{{ banner.description }}</p>
            <v-btn
              color="primary"
              class="mt-2"
              variant="elevated"
              :to="banner.link"
            >
              {{ banner.buttonText }}
            </v-btn>
          </v-card>
        </div>
      </v-carousel-item>
    </v-carousel>
  </v-card>
</template>

<script>
export default {
  name: 'PromotionalBanner',
  
  props: {
    banners: {
      type: Array,
      default: () => []
    }
  },
  
  computed: {
    promotionalBanners() {
      return this.banners.length ? this.banners : [
        {
          title: 'Special Offer: 30% Off Your First Order',
          description: 'Use code WELCOME30 at checkout',
          buttonText: 'Order Now',
          link: '/restaurants',
          image: '/images/banners/promo-banner1.jpg'
        },
        {
          title: 'Free Delivery This Weekend',
          description: 'On all orders over $20',
          buttonText: 'See Restaurants',
          link: '/restaurants',
          image: '/images/banners/promo-banner2.jpg'
        },
        {
          title: 'New Restaurants Added',
          description: 'Discover exciting new flavors',
          buttonText: 'Explore Now',
          link: '/restaurants',
          image: '/images/banners/promo-banner3.jpg'
        }
      ]
    }
  }
}
</script>

<style scoped>
.promotional-banner {
  overflow: hidden;
}

.banner-content {
  background: linear-gradient(to right, rgba(0,0,0,0.7), rgba(0,0,0,0.2));
}

.banner-card {
  max-width: 500px;
  color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

@media (max-width: 600px) {
  .banner-card {
    max-width: 100%;
  }
}
</style> 