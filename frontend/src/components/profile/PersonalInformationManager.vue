<template>
  <div class="personal-info-manager">
    <!-- Navigation Tabs -->
    <v-tabs v-model="activeTab" class="mb-6" color="primary">
      <v-tab value="profile">
        <v-icon start>mdi-account</v-icon>
        Thông tin cá nhân
      </v-tab>
      <v-tab value="addresses">
        <v-icon start>mdi-map-marker</v-icon>
        Địa chỉ giao hàng
      </v-tab>
      <v-tab value="orders">
        <v-icon start>mdi-clipboard-list</v-icon>
        Lịch sử đơn hàng
      </v-tab>
    </v-tabs>

    <!-- Tab Content -->
    <v-window v-model="activeTab">
      <!-- Profile Tab -->
      <v-window-item value="profile">
        <UserProfileForm />
      </v-window-item>

      <!-- Addresses Tab -->
      <v-window-item value="addresses">
        <AddressManagement />
      </v-window-item>

      <!-- Orders Tab -->
      <v-window-item value="orders">
        <OrderHistoryView />
      </v-window-item>
    </v-window>

    <!-- Loading Overlay -->
    <v-overlay v-model="isLoading" class="align-center justify-center">
      <v-progress-circular
        color="primary"
        indeterminate
        size="64"
      ></v-progress-circular>
    </v-overlay>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
    >
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Đóng
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { ref, reactive, onMounted, provide } from 'vue';
import { useStore } from 'vuex';
import UserProfileForm from './UserProfileForm.vue';
import AddressManagement from './AddressManagement.vue';
import OrderHistoryView from './OrderHistoryView.vue';

export default {
  name: 'PersonalInformationManager',
  
  components: {
    UserProfileForm,
    AddressManagement,
    OrderHistoryView
  },
  
  setup() {
    const store = useStore();
    const activeTab = ref('profile');
    const isLoading = ref(false);
    
    const snackbar = reactive({
      show: false,
      text: '',
      color: 'success',
      timeout: 4000
    });

    /**
     * Show notification snackbar
     */
    const showNotification = (text, color = 'success') => {
      snackbar.text = text;
      snackbar.color = color;
      snackbar.show = true;
    };

    /**
     * Initialize component data
     */
    const initializeData = async () => {
      isLoading.value = true;
      try {
        // Load user profile, addresses, and recent orders
        await Promise.all([
          store.dispatch('user/fetchProfile'),
          store.dispatch('user/fetchAddresses'),
          store.dispatch('user/fetchRecentOrders')
        ]);
      } catch (error) {
        console.error('Error loading user data:', error);
        showNotification('Không thể tải dữ liệu người dùng', 'error');
      } finally {
        isLoading.value = false;
      }
    };

    // Provide notification function to child components
    provide('showNotification', showNotification);
    provide('setLoading', (loading) => { isLoading.value = loading; });

    onMounted(() => {
      initializeData();
    });

    return {
      activeTab,
      isLoading,
      snackbar,
      showNotification
    };
  }
};
</script>

<style scoped>
.personal-info-manager {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.v-tabs {
  margin-bottom: 24px;
}

.v-window {
  min-height: 400px;
}
</style>