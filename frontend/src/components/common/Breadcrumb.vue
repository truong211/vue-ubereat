<template>
  <nav aria-label="breadcrumb" class="breadcrumb-container">
    <ol class="breadcrumb">
      <li class="breadcrumb-item">
        <router-link to="/">{{ $t('common.home') }}</router-link>
      </li>
      <li 
        v-for="(item, index) in items" 
        :key="index" 
        class="breadcrumb-item"
        :class="{ active: index === items.length - 1 }"
      >
        <router-link 
          v-if="item.path && index !== items.length - 1" 
          :to="item.path"
        >
          {{ item.text }}
        </router-link>
        <span v-else>{{ item.text }}</span>
      </li>
    </ol>
  </nav>
</template>

<script>
export default {
  name: 'Breadcrumb',
  props: {
    items: {
      type: Array,
      required: true,
      default: () => []
    }
  }
}
</script>

<style scoped>
.breadcrumb-container {
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  background-color: #f8f9fa;
  border-radius: 0.25rem;
}

.breadcrumb {
  display: flex;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
  list-style: none;
}

.breadcrumb-item {
  display: flex;
}

.breadcrumb-item + .breadcrumb-item {
  padding-left: 0.5rem;
}

.breadcrumb-item + .breadcrumb-item::before {
  display: inline-block;
  padding-right: 0.5rem;
  color: #6c757d;
  content: "/";
}

.breadcrumb-item a {
  color: #007bff;
  text-decoration: none;
}

.breadcrumb-item a:hover {
  text-decoration: underline;
}

.breadcrumb-item.active {
  color: #6c757d;
}
</style> 