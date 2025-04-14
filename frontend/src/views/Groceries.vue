<template>
  <div class="groceries">
    <header>
      <h1>{{ $t('groceries.title') }}</h1>
    </header>
    <div class="content">
      <p>{{ $t('groceries.browseText') }}</p>
      <!-- Add your groceries content here -->
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'Groceries'
}
</script>

<style scoped>
.groceries {
  padding: 20px;
}

header {
  margin-bottom: 20px;
}

.content {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>