<template>
  <div class="restaurant-layout">
    <header class="bg-white shadow">
      <nav class="container mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <router-link to="/restaurant/dashboard" class="text-xl font-bold">Restaurant Dashboard</router-link>
          <div class="flex items-center space-x-4">
            <router-link to="/restaurant/orders" class="nav-link">Orders</router-link>
            <router-link to="/restaurant/menu" class="nav-link">Menu</router-link>
            <router-link to="/restaurant/settings" class="nav-link">Settings</router-link>
          </div>
        </div>
      </nav>
    </header>

    <main class="container mx-auto px-4 py-8">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
export default {
  name: 'RestaurantLayout'
}
</script>

<style scoped>
.restaurant-layout {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.nav-link {
  padding: 0.5rem 1rem;
  color: #4a5568;
  text-decoration: none;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.nav-link:hover {
  background-color: #edf2f7;
  color: #2d3748;
}

.router-link-active {
  color: #2d3748;
  font-weight: 600;
  background-color: #edf2f7;
}
</style> 