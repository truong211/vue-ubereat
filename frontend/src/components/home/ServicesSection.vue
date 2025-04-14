<template>
  <div class="services-section">
    <h2 class="text-h4 text-center mb-8">{{ title || 'Our Services' }}</h2>
    
    <v-row>
      <v-col v-for="(service, index) in services" :key="index" cols="12" sm="6" md="3">
        <v-hover v-slot="{ isHovering, props }">
          <v-card
            class="service-card h-100 text-center pa-6"
            :elevation="isHovering ? 4 : 1"
            v-bind="props"
          >
            <div class="service-icon-wrapper mb-4">
              <v-icon :icon="service.icon" size="x-large" color="primary"></v-icon>
            </div>
            <h3 class="text-h5 mb-3">{{ service.title }}</h3>
            <p class="text-body-1">{{ service.description }}</p>
            <v-btn
              v-if="service.buttonText"
              color="primary"
              variant="text"
              class="mt-4 service-btn"
              :to="service.link || '#'"
            >
              {{ service.buttonText }}
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </v-card>
        </v-hover>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'ServicesSection',
  
  props: {
    title: {
      type: String,
      default: ''
    },
    customServices: {
      type: Array,
      default: () => []
    }
  },
  
  setup(props) {
    const defaultServices = [
      {
        icon: 'mdi-silverware-fork-knife',
        title: 'Food Delivery',
        description: 'Get your favorite meals from the best restaurants delivered to your doorstep quickly and reliably.',
        buttonText: 'Order Now',
        link: '/restaurants'
      },
      {
        icon: 'mdi-store',
        title: 'Grocery Delivery',
        description: 'Shop for fresh produce, pantry staples, and household essentials from local grocery stores.',
        buttonText: 'Shop Groceries',
        link: '/groceries'
      },
      {
        icon: 'mdi-gift',
        title: 'Special Offers',
        description: 'Discover exclusive deals, discounts, and promotions from restaurants and shops in your area.',
        buttonText: 'View Offers',
        link: '/offers'
      },
      {
        icon: 'mdi-shield-check',
        title: 'Premium Membership',
        description: 'Join our premium membership for free delivery, priority service, and exclusive member-only deals.',
        buttonText: 'Join Now',
        link: '/profile/membership'
      }
    ];
    
    const services = ref(props.customServices.length > 0 ? props.customServices : defaultServices);
    
    return {
      services
    };
  }
};
</script>

<style scoped>
.service-card {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 1;
}

.service-card:hover {
  transform: translateY(-8px);
}

.service-icon-wrapper {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background-color: rgba(var(--v-theme-primary), 0.1);
  transition: transform 0.3s ease, background-color 0.3s ease;
}

.service-card:hover .service-icon-wrapper {
  transform: scale(1.1);
  background-color: rgba(var(--v-theme-primary), 0.15);
}

.service-btn {
  opacity: 0.85;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.service-btn:hover {
  opacity: 1;
  transform: translateX(4px);
}

/* Animation for the cards on initial load */
.service-card {
  animation: fadeInUp 0.6s ease-out forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger animation */
.services-section .v-col:nth-child(1) .service-card { animation-delay: 0.1s; }
.services-section .v-col:nth-child(2) .service-card { animation-delay: 0.2s; }
.services-section .v-col:nth-child(3) .service-card { animation-delay: 0.3s; }
.services-section .v-col:nth-child(4) .service-card { animation-delay: 0.4s; }
</style> 