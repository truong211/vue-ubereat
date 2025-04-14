<template>
  <v-footer class="bg-grey-lighten-3">
    <v-container>
      <v-row>
        <v-col cols="12" md="4" class="mb-4 mb-md-0">
          <div class="text-h6 mb-3">UberEat</div>
          <p class="text-body-2 mb-4">
            Order food from your favorite restaurants and get it delivered right to your doorstep.
          </p>
          <div class="d-flex">
            <v-btn icon variant="text" class="mr-2">
              <v-icon>mdi-facebook</v-icon>
            </v-btn>
            <v-btn icon variant="text" class="mr-2">
              <v-icon>mdi-twitter</v-icon>
            </v-btn>
            <v-btn icon variant="text" class="mr-2">
              <v-icon>mdi-instagram</v-icon>
            </v-btn>
          </div>
        </v-col>

        <v-col cols="6" md="4">
          <div class="text-h6 mb-3">Quick Links</div>
          <v-list density="compact" bg-color="transparent" class="pa-0">
            <v-list-item 
              v-for="(link, index) in links" 
              :key="index" 
              :to="link.to"
              density="compact"
              class="px-0"
            >
              {{ link.text }}
            </v-list-item>
          </v-list>
        </v-col>

        <v-col cols="6" md="4">
          <div class="text-h6 mb-3">Categories</div>
          <v-list density="compact" bg-color="transparent" class="pa-0">
            <v-list-item 
              v-for="(category, index) in categories" 
              :key="index" 
              :to="category.to"
              density="compact"
              class="px-0"
            >
              {{ category.text }}
            </v-list-item>
          </v-list>
        </v-col>
      </v-row>

      <v-divider class="my-4"></v-divider>

      <div class="text-center">
        &copy; {{ new Date().getFullYear() }} UberEat. All rights reserved.
      </div>
    </v-container>
  </v-footer>
</template>

<script>
export default {
  name: 'AppFooter',

  setup() {
    const links = [
      { text: 'Home', to: '/' },
      { text: 'Restaurants', to: '/restaurants' },
      { text: 'Search', to: '/search' },
      { text: 'About Us', to: '/about' },
      { text: 'Contact', to: '/contact' },
      { text: 'Become a Partner', to: '/partner' }
    ]

    const categories = [
      { text: 'Vietnamese', to: '/category/vietnamese' },
      { text: 'Japanese', to: '/category/japanese' },
      { text: 'Italian', to: '/category/italian' },
      { text: 'American', to: '/category/american' },
      { text: 'Thai', to: '/category/thai' },
      { text: 'Indian', to: '/category/indian' }
    ]

    return {
      links,
      categories
    }
  }
}
</script>

<style scoped>
.v-footer {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.v-list-item {
  min-height: 36px !important;
}

.v-list-item:hover {
  color: var(--v-primary-base);
}

.text-h6 {
  font-weight: 600;
}

.v-btn {
  text-transform: none;
}
</style> 