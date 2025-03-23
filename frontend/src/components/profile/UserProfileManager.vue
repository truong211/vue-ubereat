<template>
  <div class="user-profile-manager">
    <v-container>
      <v-row>
        <!-- Profile Sidebar -->
        <v-col cols="12" md="3">
          <v-card class="mb-6">
            <v-card-text class="text-center">
              <!-- Profile Avatar -->
              <div class="mb-4 position-relative d-inline-block">
                <v-avatar size="120">
                  <v-img
                    v-if="user.avatar"
                    :src="user.avatar"
                    alt="User avatar"
                  ></v-img>
                  <v-icon v-else size="48" icon="mdi-account"></v-icon>
                </v-avatar>
                <v-btn
                  icon="mdi-camera"
                  variant="tonal"
                  size="x-small"
                  color="primary"
                  class="avatar-edit-button"
                  @click="triggerFileInput"
                >
                </v-btn>
                <input
                  type="file"
                  ref="fileInput"
                  accept="image/*"
                  class="d-none"
                  @change="handleAvatarUpload"
                />
              </div>
              
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
import { ref, computed, onMounted } from 'vue';
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
    OrderHistory
  },
  
  setup() {
    const store = useStore();
    const toast = useToast();
    const fileInput = ref(null);
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

    // Methods
    const triggerFileInput = () => {
      fileInput.value.click();
    };
    
    const handleAvatarUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      // Validate file type
      if (!file.type.match('image.*')) {
        toast.error('Vui lòng chọn file hình ảnh');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      try {
        await store.dispatch('user/updateAvatar', file);
        toast.success('Cập nhật ảnh đại diện thành công');
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        toast.error('Không thể cập nhật ảnh đại diện');
      }
    };
    
    return {
      activeTab,
      user,
      menuItems,
      fileInput,
      triggerFileInput,
      handleAvatarUpload
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