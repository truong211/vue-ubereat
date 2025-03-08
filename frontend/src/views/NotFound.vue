<template>
  <div class="not-found-container">
    <div class="card text-center">
      <div class="card-body">
        <h1 class="display-1 mb-4">404</h1>
        <h2 class="mb-4">Page Not Found</h2>
        <p class="mb-4">The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.</p>
        <router-link to="/" class="btn btn-primary">
          Return to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// No additional logic needed for this component
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 20px;
}

.card {
  max-width: 500px;
  width: 100%;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

.display-1 {
  color: #dc3545;
  font-weight: bold;
}

.btn-primary {
  padding: 10px 30px;
}
</style>