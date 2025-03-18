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
              
              <h2 class="text-h6 mb-1">{{ user.name }}</h2>
              <p class="text-medium-emphasis">{{ user.email }}</p>
              
              <v-chip
                v-if="loyaltyTier"
                :color="getTierColor(loyaltyTier)"
                class="mt-2"
              >
                {{ loyaltyTier.charAt(0).toUpperCase() + loyaltyTier.slice(1) }} Member
              </v-chip>
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
            
            <!-- Favorite Restaurants Tab -->
            <v-window-item value="favorites">
              <favorites-manager />
            </v-window-item>
            
            <!-- Saved Items Tab -->
            <v-window-item value="saved-items">
              <saved-items-manager />
            </v-window-item>
            
            <!-- Payment Methods Tab -->
            <v-window-item value="payment">
              <payment-methods />
            </v-window-item>
            
            <!-- Notification Settings Tab -->
            <v-window-item value="notifications">
              <notification-preferences />
            </v-window-item>
            
            <!-- Account Settings Tab -->
            <v-window-item value="account">
              <account-settings />
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
import PersonalInfo from './sections/PersonalInfo.vue';
import AddressManager from './AddressManager.vue';
import OrderHistory from './sections/OrderHistory.vue';
import FavoritesManager from './sections/FavoritesManager.vue';
import SavedItemsManager from './sections/SavedItemsManager.vue';
import PaymentMethods from './sections/PaymentMethods.vue';
import NotificationPreferences from '../NotificationPreferences.vue';
import AccountSettings from './sections/AccountSettings.vue';

export default {
  name: 'UserProfileManager',
  
  components: {
    PersonalInfo,
    AddressManager,
    OrderHistory,
    FavoritesManager,
    SavedItemsManager,
    PaymentMethods,
    NotificationPreferences,
    AccountSettings
  },
  
  setup() {
    const store = useStore();
    const fileInput = ref(null);
    const activeTab = ref('personal');
    
    const user = computed(() => store.state.auth.user || {});
    const loyaltyTier = computed(() => store.state.loyalty?.tier || null);
    
    const menuItems = [
      { title: 'Personal Information', icon: 'mdi-account-outline', value: 'personal' },
      { title: 'My Addresses', icon: 'mdi-map-marker-outline', value: 'addresses' },
      { title: 'Order History', icon: 'mdi-history', value: 'orders' },
      { title: 'Favorite Restaurants', icon: 'mdi-heart-outline', value: 'favorites' },
      { title: 'Saved Items', icon: 'mdi-food', value: 'saved-items' },
      { title: 'Payment Methods', icon: 'mdi-credit-card-outline', value: 'payment' },
      { title: 'Notification Settings', icon: 'mdi-bell-outline', value: 'notifications' },
      { title: 'Account Settings', icon: 'mdi-cog-outline', value: 'account' }
    ];
    
    const triggerFileInput = () => {
      fileInput.value.click();
    };
    
    const handleAvatarUpload = async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        await store.dispatch('user/updateAvatar', file);
        // Show success toast or notification
      } catch (error) {
        console.error('Failed to upload avatar:', error);
        // Show error toast or notification
      }
    };
    
    const getTierColor = (tier) => {
      const colors = {
        bronze: 'amber-darken-1',
        silver: 'grey',
        gold: 'amber',
        platinum: 'blue-grey-darken-1'
      };
      return colors[tier] || 'primary';
    };
    
    onMounted(() => {
      // Load any necessary user data
      store.dispatch('user/fetchProfile');
    });
    
    return {
      activeTab,
      user,
      loyaltyTier,
      menuItems,
      fileInput,
      triggerFileInput,
      handleAvatarUpload,
      getTierColor
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