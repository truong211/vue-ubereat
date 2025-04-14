<template>
  <div class="not-found-container">
    <div class="error-content">
      <div class="error-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" fill="currentColor"/>
        </svg>
      </div>
      <h1 class="error-title">404</h1>
      <h2 class="error-subtitle">Page Not Found</h2>
      <p class="error-message">
        We couldn't find the page you're looking for. Please check the URL or return to the home page.
      </p>
      <router-link to="/" class="home-button">
        Return to Home
      </router-link>
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
  min-height: 100vh;
  padding: 20px;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.error-content {
  text-align: center;
  max-width: 600px;
  width: 100%;
  padding: 48px 24px;
  animation: fadeIn 0.6s ease-out;
  background-color: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-icon {
  color: #06C167;
  margin-bottom: 32px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
  }
}

.error-icon svg {
  width: 80px;
  height: 80px;
  filter: drop-shadow(0 0 8px rgba(6, 193, 103, 0.3));
}

.error-title {
  font-size: 72px;
  font-weight: 700;
  color: #1c1c1c;
  margin: 0 0 16px;
  letter-spacing: -1px;
}

.error-subtitle {
  font-size: 36px;
  font-weight: 500;
  color: #2d2d2d;
  margin: 0 0 24px;
}

.error-message {
  font-size: 18px;
  color: #4a4a4a;
  margin: 0 0 40px;
  line-height: 1.6;
  max-width: 480px;
  margin-left: auto;
  margin-right: auto;
}

.home-button {
  display: inline-block;
  background-color: #06C167;
  color: #ffffff;
  padding: 18px 36px;
  border-radius: 500px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(6, 193, 103, 0.3);
}

.home-button:hover {
  background-color: #00A355;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(6, 193, 103, 0.4);
}

.home-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(6, 193, 103, 0.3);
}

@media (max-width: 768px) {
  .error-title {
    font-size: 56px;
  }

  .error-subtitle {
    font-size: 28px;
  }

  .error-message {
    font-size: 16px;
    padding: 0 20px;
  }

  .home-button {
    padding: 16px 32px;
  }

  .error-icon svg {
    width: 64px;
    height: 64px;
  }
}

@media (max-width: 480px) {
  .error-content {
    padding: 32px 20px;
  }

  .error-title {
    font-size: 42px;
  }

  .error-subtitle {
    font-size: 22px;
  }

  .error-message {
    font-size: 15px;
    padding: 0 16px;
  }

  .home-button {
    padding: 14px 28px;
    font-size: 15px;
  }
}
</style>