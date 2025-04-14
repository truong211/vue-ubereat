<template>
  <div class="settings-page">
    <h1 class="text-2xl font-bold mb-6">Settings</h1>
    <AccountSettings />
  </div>
</template>

<script>
import AccountSettings from './AccountSettings.vue'

export default {
  name: 'Settings',
  components: {
    AccountSettings
  }
}
</script>

<style scoped>
.settings-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}
</style> 