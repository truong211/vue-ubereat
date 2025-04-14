<template>
  <div class="admin-login-layout">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'AdminLoginLayout'
}
</script>

<style scoped>
.admin-login-layout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>
