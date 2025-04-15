<template>
  <div class="main-layout d-flex flex-column min-vh-100">
    <!-- Main Content -->
    <v-main class="flex-grow-1">
      <slot></slot>
    </v-main>

    <!-- Footer -->
    <v-footer class="bg-primary text-white pa-0">
      <v-container>
        <v-row>
          <!-- Company Info -->
          <v-col cols="12" md="4" class="mb-6 mb-md-0">
            <div class="d-flex align-center mb-4">
              <v-img
                src="/images/logo.png"
                alt="UberEat Logo"
                width="40"
                height="40"
                class="mr-2"
              ></v-img>
              <span class="text-h5 font-weight-bold white--text">UberEat</span>
            </div>
            <p class="text-body-2 mb-4 white--text">
              Order food from your favorite restaurants and get it delivered right to your doorstep.
            </p>
            <div class="d-flex">
              <v-btn
                v-for="(social, index) in socialLinks"
                :key="index"
                :icon="social.icon"
                variant="text"
                color="white"
                href="#"
                target="_blank"
                class="mr-2"
              ></v-btn>
            </div>
          </v-col>

          <!-- Quick Links -->
          <v-col cols="6" md="2">
            <h3 class="text-subtitle-1 font-weight-bold mb-4 white--text">Quick Links</h3>
            <v-list density="compact" bg-color="transparent" class="pa-0 white--text">
              <v-list-item
                v-for="link in quickLinks"
                :key="link.title"
                :to="link.to"
                :title="link.title"
                density="compact"
                class="px-0"
                rounded="0"
              ></v-list-item>
            </v-list>
          </v-col>

          <!-- Categories -->
          <v-col cols="6" md="2">
            <h3 class="text-subtitle-1 font-weight-bold mb-4 white--text">Categories</h3>
            <v-list density="compact" bg-color="transparent" class="pa-0 white--text">
              <v-list-item
                v-for="category in footerCategories"
                :key="category.title"
                :to="category.to"
                :title="category.title"
                density="compact"
                class="px-0"
                rounded="0"
              ></v-list-item>
            </v-list>
          </v-col>

          <!-- Contact Info -->
          <v-col cols="12" md="4">
            <h3 class="text-subtitle-1 font-weight-bold mb-4 white--text">Contact Us</h3>
            <v-list density="compact" bg-color="transparent" class="pa-0 white--text">
              <v-list-item
                prepend-icon="mdi-map-marker"
                title="123 Nguyen Hue, District 1, HCMC"
                density="compact"
                class="px-0"
                rounded="0"
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-phone"
                title="+84 123 456 789"
                density="compact"
                class="px-0"
                rounded="0"
              ></v-list-item>
              <v-list-item
                prepend-icon="mdi-email"
                title="support@ubereat.com"
                density="compact"
                class="px-0"
                rounded="0"
              ></v-list-item>
            </v-list>

            <h3 class="text-subtitle-1 font-weight-bold mt-4 mb-2 white--text">Download App</h3>
            <div class="d-flex flex-wrap">
              <v-img
                src="/images/app-store.png"
                alt="App Store"
                width="120"
                class="mr-2 mb-2"
              ></v-img>
              <v-img
                src="/images/google-play.png"
                alt="Google Play"
                width="120"
                class="mb-2"
              ></v-img>
            </div>
          </v-col>
        </v-row>

        <v-divider class="my-4" color="white"></v-divider>

        <!-- Copyright -->
        <div class="d-flex flex-wrap justify-space-between align-center">
          <div class="text-caption white--text">
            &copy; {{ new Date().getFullYear() }} UberEat. All rights reserved.
          </div>
          <div>
            <v-btn
              v-for="(link, index) in legalLinks"
              :key="index"
              :to="link.to"
              variant="text"
              density="compact"
              class="text-caption white--text"
            >
              {{ link.title }}
            </v-btn>
          </div>
        </div>
      </v-container>
    </v-footer>
  </div>
</template>

<script>
import { ref } from 'vue';

export default {
  name: 'MainLayout',

  setup() {
    // Social links
    const socialLinks = [
      { icon: 'mdi-facebook', url: '#' },
      { icon: 'mdi-twitter', url: '#' },
      { icon: 'mdi-instagram', url: '#' },
      { icon: 'mdi-youtube', url: '#' }
    ];

    // Quick links
    const quickLinks = [
      { title: 'Home', to: '/' },
      { title: 'Restaurants', to: '/restaurants' },
      { title: 'Search', to: '/search' },
      { title: 'About Us', to: '/about' },
      { title: 'Contact', to: '/contact' },
      { title: 'Become a Partner', to: '/partner' }
    ];

    // Footer categories
    const footerCategories = [
      { title: 'Vietnamese', to: { path: '/restaurants', query: { category: 'vietnamese' } } },
      { title: 'Japanese', to: { path: '/restaurants', query: { category: 'japanese' } } },
      { title: 'Italian', to: { path: '/restaurants', query: { category: 'italian' } } },
      { title: 'American', to: { path: '/restaurants', query: { category: 'american' } } },
      { title: 'Thai', to: { path: '/restaurants', query: { category: 'thai' } } },
      { title: 'Indian', to: { path: '/restaurants', query: { category: 'indian' } } }
    ];

    // Legal links
    const legalLinks = [
      { title: 'Terms of Service', to: '/terms' },
      { title: 'Privacy Policy', to: '/privacy' },
      { title: 'Cookie Policy', to: '/cookies' }
    ];

    return {
      socialLinks,
      quickLinks,
      footerCategories,
      legalLinks
    };
  }
};
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.v-main {
  flex: 1 0 auto;
}

.v-footer {
  flex-shrink: 0;
  width: 100%;
}

.v-list-item--density-compact {
  min-height: 32px;
}

.footer-border {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}
</style>
