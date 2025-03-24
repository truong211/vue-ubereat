<template>
  <div class="account-settings">
    <v-container>
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-6">Account Settings</h1>

          <v-tabs v-model="tab" bg-color="background">
            <v-tab value="profile">
              <v-icon icon="mdi-account" class="mr-2" />
              Profile
            </v-tab>
            <v-tab value="security">
              <v-icon icon="mdi-shield-account" class="mr-2" />
              Security
            </v-tab>
            <v-tab value="linked-accounts">
              <v-icon icon="mdi-link-variant" class="mr-2" />
              Linked Accounts
            </v-tab>
          </v-tabs>

          <v-window v-model="tab" class="mt-6">
            <!-- Profile Tab -->
            <v-window-item value="profile">
              <ProfileSettings />
            </v-window-item>

            <!-- Security Tab -->
            <v-window-item value="security">
              <SecuritySettings />
            </v-window-item>

            <!-- Linked Accounts Tab -->
            <v-window-item value="linked-accounts">
              <AccountLinking />
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import AccountLinking from '@/components/auth/AccountLinking.vue';
import ProfileSettings from '@/components/user/ProfileSettings.vue';
import SecuritySettings from '@/components/user/SecuritySettings.vue';

export default {
  name: 'AccountSettings',
  
  components: {
    AccountLinking,
    ProfileSettings,
    SecuritySettings
  },
  
  setup() {
    const route = useRoute();
    const tab = ref('profile');
    
    // Set tab from URL query parameter if present
    const setTabFromQuery = () => {
      if (route.query.tab) {
        const queryTab = route.query.tab.toString();
        
        // Make sure it's a valid tab
        if (['profile', 'security', 'linked-accounts'].includes(queryTab)) {
          tab.value = queryTab;
        }
      }
    };
    
    // Set initial tab
    onMounted(() => {
      setTabFromQuery();
    });
    
    // Watch for route changes
    watch(
      () => route.query,
      () => {
        setTabFromQuery();
      }
    );
    
    return {
      tab
    };
  }
};
</script>

<style scoped>
.account-settings {
  max-width: 100%;
  padding-bottom: 32px;
}
</style> 