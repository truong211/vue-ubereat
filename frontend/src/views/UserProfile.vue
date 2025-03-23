<template>
  <v-container class="profile-page py-8">
    <h1 class="text-h4 font-weight-bold mb-6">Thông tin cá nhân</h1>

    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Đang tải thông tin...</p>
    </div>

    <v-alert
      v-if="error"
      type="error"
      variant="tonal"
      class="mb-4"
      closable
      @click:close="error = ''"
    >
      {{ error }}
    </v-alert>

    <user-profile-manager v-else />
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import UserProfileManager from '@/components/profile/UserProfileManager.vue';

export default {
  name: 'UserProfile',
  
  components: {
    UserProfileManager
  },
  
  setup() {
    const store = useStore();
    const isLoading = ref(true);
    const error = ref(null);
    
    const loadUserData = async () => {
      isLoading.value = true;
      error.value = null;
      try {
        await store.dispatch('user/fetchProfile');
        await store.dispatch('user/fetchAddresses');
      } catch (err) {
        console.error('Error loading user profile:', err);
        error.value = err.message || 'Không thể tải thông tin người dùng';
      } finally {
        isLoading.value = false;
      }
    };
    
    onMounted(() => {
      loadUserData();
    });
    
    return {
      isLoading,
      error
    };
  }
}
</script>

<style scoped>
.profile-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>