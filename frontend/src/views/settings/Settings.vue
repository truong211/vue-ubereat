<template>
  <div class="settings-layout">
    <v-container>
      <v-row>
        <!-- Settings Navigation -->
        <v-col cols="12" md="3" class="pr-md-6">
          <v-card variant="outlined" class="mb-4">
            <v-list nav>
              <v-list-subheader>Settings</v-list-subheader>
              
              <v-list-item to="/settings/account">
                <template v-slot:prepend>
                  <v-icon icon="mdi-account-cog" />
                </template>
                <v-list-item-title>Account</v-list-item-title>
              </v-list-item>
              
              <v-list-item to="/settings/notifications">
                <template v-slot:prepend>
                  <v-icon icon="mdi-bell-cog" />
                </template>
                <v-list-item-title>Notifications</v-list-item-title>
              </v-list-item>
              
              <v-list-item to="/settings/security">
                <template v-slot:prepend>
                  <v-icon icon="mdi-shield-account" />
                </template>
                <v-list-item-title>Security</v-list-item-title>
              </v-list-item>
              
              <v-list-item to="/settings/payment-methods">
                <template v-slot:prepend>
                  <v-icon icon="mdi-credit-card-cog" />
                </template>
                <v-list-item-title>Payment Methods</v-list-item-title>
              </v-list-item>
              
              <v-list-item to="/settings/addresses">
                <template v-slot:prepend>
                  <v-icon icon="mdi-map-marker" />
                </template>
                <v-list-item-title>Addresses</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
        
        <!-- Content Area -->
        <v-col cols="12" md="9">
          <router-view />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'SettingsLayout'
}
</script>

<style scoped>
.settings-layout {
  padding-top: 1rem;
  padding-bottom: 3rem;
}
</style> 