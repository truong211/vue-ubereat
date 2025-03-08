<template>
  <v-container class="fill-height">
    <v-row justify="center" align="center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="elevation-12">
          <v-card-title class="text-center text-h5 py-4">
            {{ isLogin ? 'Login' : 'Create Account' }}
          </v-card-title>

          <v-card-text>
            <v-tabs v-model="activeTab" grow>
              <v-tab value="login">Login</v-tab>
              <v-tab value="register">Register</v-tab>
            </v-tabs>

            <v-window v-model="activeTab" class="mt-4">
              <v-window-item value="login">
                <auth-form :is-login="true" />
              </v-window-item>

              <v-window-item value="register">
                <register-form />
              </v-window-item>
            </v-window>
          </v-card-text>

          <v-card-actions class="justify-center pb-4">
            <v-btn
              variant="text"
              @click="$router.push('/auth/forgot-password')"
            >
              Forgot Password?
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import AuthForm from '@/components/auth/AuthForm.vue'
import RegisterForm from '@/components/auth/RegisterForm.vue'

const route = useRoute()
const activeTab = ref('login')

const isLogin = computed(() => activeTab.value === 'login')
</script>

<style scoped>
.v-card {
  border-radius: 12px;
}

.v-card-title {
  background: linear-gradient(to right, #1867c0, #5cbbf6);
  color: white;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}
</style>