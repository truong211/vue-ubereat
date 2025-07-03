<template>
  <div class="user-profile-manager">
    <v-container>
      <v-row>
        <!-- Profile Sidebar -->
        <v-col cols="12" md="3">
          <v-card class="mb-6">
            <v-card-text class="text-center">
              <!-- Profile Avatar (with preview & validation) -->
              <avatar-upload
                v-model="avatarProxy"
                :current-avatar="user.avatar"
                class="mb-4"
              />
              
              <h2 class="text-h6 mb-1">{{ user.name || 'Người dùng' }}</h2>
              <p class="text-medium-emphasis">{{ user.email }}</p>
            </v-card-text>
          </v-card>
          
          <v-card>
            <v-list density="compact">
              <v-list-item
                v-for="(item, i) in menuItems"
                :key="i"
                :prepend-icon="item.icon"
                :title="item.title"
                @click="activeTab = item.value"
                :active="activeTab === item.value"
                :value="item.value"
                rounded
              ></v-list-item>
            </v-list>
          </v-card>
        </v-col>
        
        <!-- Main Content Area -->
        <v-col cols="12" md="9">
          <v-window v-model="activeTab">
            <!-- Personal Info Tab -->
            <v-window-item value="personal">
              <personal-info />
            </v-window-item>
            
            <!-- Addresses Tab -->
            <v-window-item value="addresses">
              <address-manager />
            </v-window-item>
            
            <!-- Order History Tab -->
            <v-window-item value="orders">
              <order-history />
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useToast } from 'vue-toastification';
import PersonalInfo from './sections/PersonalInfo.vue';
import AddressManager from './AddressManager.vue';
import OrderHistory from './sections/OrderHistory.vue';

export default {
  name: 'UserProfileManager',
  
  components: {
    PersonalInfo,
    AddressManager,
    OrderHistory,
    AvatarUpload: () => import('@/components/user/AvatarUpload.vue')
  },
  
  setup() {
    const store = useStore();
    const toast = useToast();
    const avatarProxy = ref('');
    const activeTab = ref('personal');
    
    const user = computed(() => store.state.auth.user || {});

    // Navigation menu items
    const menuItems = [
      {
        title: 'Thông tin cá nhân',
        icon: 'mdi-account',
        value: 'personal'
      },
      {
        title: 'Địa chỉ giao hàng',
        icon: 'mdi-map-marker',
        value: 'addresses'
      },
      {
        title: 'Lịch sử đơn hàng',
        icon: 'mdi-history',
        value: 'orders'
      }
    ];

    // Initialize avatar with current user avatar
    onMounted(() => {
      avatarProxy.value = store.state.auth.user?.avatar || '';
    });

    // Watcher: when avatarProxy updates (after AvatarUpload emits), update store
    watch(avatarProxy, (newVal, oldVal) => {
      if (newVal && newVal !== oldVal) {
        // If AvatarUpload already uploaded and returns URL, propagate to auth
        store.commit('auth/UPDATE_USER_PROFILE', { avatar: newVal }, { root: true });
      }
    });

    return {
      activeTab,
      user,
      menuItems,
      avatarProxy
    };
  }
};
</script>

<style scoped>
.avatar-edit-button {
  position: absolute;
  bottom: 0;
  right: 0;
  border: 2px solid white;
}

.position-relative {
  position: relative;
}
</style>