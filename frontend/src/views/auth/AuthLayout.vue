<template>
  <v-app>
    <v-main>
      <v-container fluid class="fill-height auth-bg" style="min-height: 100vh">
        <!-- Logo Section -->
        <v-row class="mb-10">
          <v-col cols="12" class="text-center">
            <router-link to="/" class="text-decoration-none">
              <v-img
                src="@/assets/logo.png"
                alt="Uber Eats Clone"
                width="150"
                class="mx-auto mb-4"
              />
              <h1 class="text-h4 font-weight-bold primary--text">Uber Eats Clone</h1>
            </router-link>
          </v-col>
        </v-row>

        <!-- Auth Content -->
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer app class="text-center d-flex justify-center">
      <span>&copy; {{ new Date().getFullYear() }} Uber Eats Clone. All rights reserved.</span>
    </v-footer>
  </v-app>
</template>

<script>
export default {
  name: 'AuthLayout'
}
</script>

<style scoped>
.auth-bg {
  background: linear-gradient(135deg, var(--v-primary-lighten5) 0%, var(--v-primary-lighten4) 100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
