<template>
  <div class="favorites-page">
    <div class="page-header">
      <div class="container">
        <h1 class="page-title">{{ $t('favorites.pageTitle') }}</h1>
        <Breadcrumb :items="breadcrumbItems" />
      </div>
    </div>

    <div class="container">
      <FavoritesManager />
    </div>
  </div>
</template>

<script>
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import FavoritesManager from '@/components/user/FavoritesManager.vue';

export default {
  name: 'FavoritesPage',
  
  components: {
    Breadcrumb,
    FavoritesManager
  },
  
  computed: {
    breadcrumbItems() {
      return [
        { text: this.$t('common.home'), to: '/' },
        { text: this.$t('profile.title'), to: '/profile' },
        { text: this.$t('favorites.pageTitle'), active: true }
      ];
    }
  },
  
  metaInfo() {
    return {
      title: this.$t('favorites.pageTitle')
    };
  }
};
</script>

<style scoped>
.favorites-page {
  padding-bottom: 3rem;
}

.page-header {
  background-color: var(--bg-light, #f9f9f9);
  padding: 2rem 0;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--text-primary, #333);
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

@media (max-width: 768px) {
  .page-header {
    padding: 1.5rem 0;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
}
</style> 