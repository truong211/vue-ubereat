<template>
  <v-container class="profile-page py-8">
    <h1 class="text-h4 font-weight-bold mb-6">My Profile</h1>

    <div v-if="isLoading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4">Loading your profile...</p>
    </div>

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
      try {
        await store.dispatch('user/fetchProfile');
        isLoading.value = false;
      } catch (err) {
        console.error('Error loading user profile:', err);
        error.value = err.message || 'Failed to load profile';
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