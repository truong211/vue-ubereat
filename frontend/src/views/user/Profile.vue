<template>
  <v-container>
    <v-row>
      <!-- Profile Header -->
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-text class="d-flex align-center">
            <v-avatar
              size="100"
              color="grey-lighten-2"
              class="mr-4"
            >
              <v-img
                v-if="profile.avatar"
                :src="profile.avatar"
                :alt="profile.name"
              ></v-img>
              <v-icon
                v-else
                size="48"
                icon="mdi-account"
              ></v-icon>
            </v-avatar>
            <div>
              <h2 class="text-h5 mb-2">{{ profile.name || 'Loading...' }}</h2>
              <p class="text-subtitle-1 text-medium-emphasis">
                {{ profile.email }}
              </p>
              <v-btn
                variant="outlined"
                color="primary"
                size="small"
                :to="{ name: 'Settings' }"
                prepend-icon="mdi-cog"
                class="mt-2"
              >
                Account Settings
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Main Content -->
      <v-col cols="12">
        <v-card>
          <v-tabs v-model="activeTab">
            <v-tab value="info">
              <v-icon start>mdi-account</v-icon>
              Personal Info
            </v-tab>
            <v-tab value="orders">
              <v-icon start>mdi-clipboard-list</v-icon>
              Orders
            </v-tab>
            <v-tab value="addresses">
              <v-icon start>mdi-map-marker</v-icon>
              Addresses
            </v-tab>
          </v-tabs>

          <v-card-text>
            <v-window v-model="activeTab">
              <v-window-item value="info">
                <personal-info />
              </v-window-item>

              <v-window-item value="orders">
                <order-history />
              </v-window-item>

              <v-window-item value="addresses">
                <address-list />
              </v-window-item>
            </v-window>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { ref, onMounted } from 'vue'
import axiosInstance from 'axios'
import { useAuthStore } from '@/stores/auth'
import PersonalInfo from '@/components/profile/sections/PersonalInfo.vue'
import OrderHistory from '@/components/profile/sections/OrderHistory.vue'
import AddressList from '@/components/profile/sections/AddressList.vue'

export default {
  name: 'Profile',
  
  components: {
    PersonalInfo,
    OrderHistory,
    AddressList
  },
  
  setup() {
    const authStore = useAuthStore()
    const activeTab = ref('info')
    const profile = ref({
      name: '',
      email: '',
      avatar: '',
      phone: ''
    })
    
    const fetchUserProfile = async () => {
      try {
        const response = await authStore.fetchUser();
        if (response.success && response.user) {
          return response.user;
        }
        throw new Error('Invalid profile data received');
      } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
    };

    const loadProfile = async () => {
      try {
        const userData = await fetchUserProfile()
        profile.value = {
          name: userData.fullName || userData.name || 'No name provided',
          email: userData.email || '',
          avatar: userData.profileImage || '',
          phone: userData.phone || ''
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      }
    }
    
    onMounted(() => {
      loadProfile()
    })

    return {
      activeTab,
      profile
    }
  }
}
</script>

<style scoped>
.v-card {
  border-radius: 8px;
}

.v-avatar {
  border: 2px solid #e0e0e0;
}
</style>