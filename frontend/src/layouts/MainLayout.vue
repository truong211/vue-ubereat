<template>
  <v-app>
    <app-header />
    
    <v-main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notifications.js'
import AppHeader from '@/components/layout/AppHeader.vue'

export default {
  name: 'MainLayout',
  
  components: {
    AppHeader
  },
  
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const notificationStore = useNotificationStore()
    
    const isLoading = ref(false)
    
    onMounted(async () => {
      if (authStore.token && !authStore.user) {
        try {
          await authStore.fetchUser()
        } catch (error) {
          console.error('Error fetching user:', error)
        }
      }
      await notificationStore.initNotifications()
    })
    
    const logout = async () => {
      await authStore.logout()
      router.push('/login')
    }
    
    return {
      isLoading,
      logout
    }
  }
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.v-main {
  min-height: calc(100vh - 64px - 56px); /* Adjust based on your header and footer heights */
  background-color: #f5f5f5;
}
</style>
