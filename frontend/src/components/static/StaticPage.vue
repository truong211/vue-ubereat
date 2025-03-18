<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" sm="10" md="8">
        <v-card v-if="page" class="pa-6">
          <h1 class="text-h3 mb-6">{{ page.title }}</h1>
          <v-divider class="mb-6"></v-divider>
          <div class="content" v-html="page.content"></div>
        </v-card>
        <v-card v-else-if="loading" class="pa-6">
          <v-skeleton-loader type="article"></v-skeleton-loader>
        </v-card>
        <v-card v-else class="pa-6 text-center">
          <v-icon size="64" color="grey" class="mb-4">mdi-alert</v-icon>
          <h2 class="text-h5 mb-2">Page Not Found</h2>
          <p class="mb-4">The page you're looking for doesn't exist or has been moved.</p>
          <v-btn color="primary" to="/">Go Home</v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

export default {
  name: 'StaticPage',
  
  setup() {
    const route = useRoute();
    const page = ref(null);
    const loading = ref(true);

    const fetchPage = async () => {
      try {
        loading.value = true;
        const response = await axios.get(`/api/pages/${route.params.slug}`);
        page.value = response.data.data.page;
      } catch (error) {
        console.error('Error fetching page:', error);
        page.value = null;
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchPage();
    });

    return {
      page,
      loading
    };
  }
};
</script>

<style scoped>
.content {
  line-height: 1.6;
}

.content :deep(h2) {
  font-size: 1.75rem;
  margin: 2rem 0 1rem;
}

.content :deep(h3) {
  font-size: 1.5rem;
  margin: 1.5rem 0 1rem;
}

.content :deep(p) {
  margin-bottom: 1rem;
}

.content :deep(ul),
.content :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.content :deep(li) {
  margin-bottom: 0.5rem;
}

.content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 1rem 0;
}

.content :deep(blockquote) {
  margin: 1rem 0;
  padding: 1rem;
  border-left: 4px solid var(--v-primary-base);
  background: rgba(0, 0, 0, 0.05);
}
</style>