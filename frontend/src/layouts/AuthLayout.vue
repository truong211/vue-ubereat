<template>
  <div class="auth-layout">
    <v-container fluid class="fill-height pa-0">
      <v-row no-gutters class="fill-height">
        <!-- Left panel (image/branding) for desktop -->
        <v-col cols="12" md="6" class="d-none d-md-flex auth-banner">
          <div class="d-flex flex-column justify-center align-center text-white pa-8 h-100">
            <div class="text-center">
              <img src="@/assets/logo-white.png" alt="Logo" height="60" class="mb-8" />
              <h1 class="text-h3 font-weight-bold mb-4">UberEat</h1>
              <p class="text-subtitle-1 mb-16">Khám phá ẩm thực ngon tuyệt từ mọi nơi</p>
            </div>
            
            <v-img
              src="@/assets/auth-illustration.svg"
              alt="Food delivery illustration"
              max-width="400"
              class="mt-auto"
            ></v-img>
          </div>
        </v-col>
        
        <!-- Auth form content -->
        <v-col cols="12" md="6" class="bg-white">
          <v-app-bar
            color="transparent"
            elevation="0"
            class="d-md-none px-4"
          >
            <img src="@/assets/logo.png" alt="Logo" height="40" />
            <v-spacer></v-spacer>
            <v-btn
              icon
              variant="text"
              color="primary"
              to="/"
            >
              <v-icon>mdi-home</v-icon>
            </v-btn>
          </v-app-bar>
          
          <router-view />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'AuthLayout'
}
</script>

<style scoped>
.auth-layout {
  min-height: 100vh;
  width: 100%;
}

.auth-banner {
  background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%);
  background-size: cover;
  background-position: center;
}

@media (max-width: 959px) {
  :deep(.login-container),
  :deep(.register-container),
  :deep(.forgot-password-container),
  :deep(.verify-email-container),
  :deep(.verify-otp-container) {
    padding-top: 80px;
  }
}
</style>