<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2">mdi-share-variant</v-icon>
      Liên kết mạng xã hội
    </v-card-title>
    
    <v-card-text>
      <p class="text-medium-emphasis mb-6">
        Liên kết tài khoản mạng xã hội để đăng nhập dễ dàng hơn
      </p>

      <v-alert
        v-if="message"
        :type="messageType"
        variant="tonal"
        class="mb-4"
        closable
        @click:close="message = ''"
      >
        {{ message }}
      </v-alert>

      <!-- Social Providers List -->
      <div class="d-flex flex-column gap-4">
        <!-- Google Account -->
        <v-card variant="outlined" class="social-account-card">
          <v-card-text class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon size="24" color="error" class="mr-3">mdi-google</v-icon>
              <div>
                <h4>Google</h4>
                <p class="text-medium-emphasis mb-0" v-if="linkedAccounts.google">
                  Đã liên kết: {{ linkedAccounts.google.email }}
                </p>
                <p class="text-medium-emphasis mb-0" v-else>
                  Chưa liên kết
                </p>
              </div>
            </div>
            
            <div>
              <v-btn
                v-if="!linkedAccounts.google"
                color="error"
                variant="outlined"
                :loading="socialLoading.google"
                @click="linkAccount('google')"
              >
                Liên kết
              </v-btn>
              <v-btn
                v-else
                color="error"
                variant="text"
                :loading="socialLoading.google"
                @click="unlinkAccount('google')"
              >
                Hủy liên kết
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Facebook Account -->
        <v-card variant="outlined" class="social-account-card">
          <v-card-text class="d-flex align-center justify-space-between">
            <div class="d-flex align-center">
              <v-icon size="24" color="primary" class="mr-3">mdi-facebook</v-icon>
              <div>
                <h4>Facebook</h4>
                <p class="text-medium-emphasis mb-0" v-if="linkedAccounts.facebook">
                  Đã liên kết: {{ linkedAccounts.facebook.email }}
                </p>
                <p class="text-medium-emphasis mb-0" v-else>
                  Chưa liên kết
                </p>
              </div>
            </div>
            
            <div>
              <v-btn
                v-if="!linkedAccounts.facebook"
                color="primary"
                variant="outlined"
                :loading="socialLoading.facebook"
                @click="linkAccount('facebook')"
              >
                Liên kết
              </v-btn>
              <v-btn
                v-else
                color="primary"
                variant="text"
                :loading="socialLoading.facebook"
                @click="unlinkAccount('facebook')"
              >
                Hủy liên kết
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </div>

      <!-- Security Notice -->
      <v-alert
        type="info"
        variant="tonal"
        class="mt-6"
        icon="mdi-shield-check"
      >
        <template #title>Bảo mật tài khoản</template>
        <p class="mb-0">
          Liên kết với mạng xã hội giúp bạn đăng nhập nhanh chóng và bảo mật. 
          Bạn vẫn có thể sử dụng email và mật khẩu để đăng nhập như bình thường.
        </p>
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useStore } from 'vuex';
import { linkSocialAccount, unlinkSocialAccount, getLinkedAccounts, initSocialAuth } from '@/services/social-auth';

export default {
  name: 'SocialAccounts',
  
  setup() {
    const store = useStore();
    
    // Reactive state
    const linkedAccounts = ref({
      google: null,
      facebook: null
    });
    const socialLoading = ref({
      google: false,
      facebook: false
    });
    const message = ref('');
    const messageType = ref('info');
    
    // Computed
    const user = computed(() => store.getters['auth/user']);
    
    // Methods
    const loadLinkedAccounts = async () => {
      try {
        const accounts = await getLinkedAccounts();
        linkedAccounts.value = {
          google: accounts.find(acc => acc.provider === 'google') || null,
          facebook: accounts.find(acc => acc.provider === 'facebook') || null
        };
      } catch (error) {
        console.error('Failed to load linked accounts:', error);
      }
    };
    
    const linkAccount = async (provider) => {
      try {
        socialLoading.value[provider] = true;
        message.value = '';
        
        const result = await linkSocialAccount(provider);
        
        // Update the linked accounts
        linkedAccounts.value[provider] = result.account;
        
        // Update user in store if needed
        if (result.user) {
          store.commit('auth/UPDATE_USER_PROFILE', result.user);
        }
        
        message.value = `Liên kết ${provider} thành công!`;
        messageType.value = 'success';
        
      } catch (error) {
        console.error(`Failed to link ${provider}:`, error);
        message.value = `Không thể liên kết ${provider}. Vui lòng thử lại.`;
        messageType.value = 'error';
      } finally {
        socialLoading.value[provider] = false;
      }
    };
    
    const unlinkAccount = async (provider) => {
      try {
        socialLoading.value[provider] = true;
        message.value = '';
        
        // Confirm action
        if (!confirm(`Bạn có chắc muốn hủy liên kết ${provider}?`)) {
          return;
        }
        
        await unlinkSocialAccount(provider);
        
        // Update the linked accounts
        linkedAccounts.value[provider] = null;
        
        message.value = `Hủy liên kết ${provider} thành công!`;
        messageType.value = 'success';
        
      } catch (error) {
        console.error(`Failed to unlink ${provider}:`, error);
        message.value = `Không thể hủy liên kết ${provider}. Vui lòng thử lại.`;
        messageType.value = 'error';
      } finally {
        socialLoading.value[provider] = false;
      }
    };
    
    // Lifecycle
    onMounted(async () => {
      try {
        await initSocialAuth();
        await loadLinkedAccounts();
      } catch (error) {
        console.error('Failed to initialize social accounts:', error);
      }
    });
    
    return {
      linkedAccounts,
      socialLoading,
      message,
      messageType,
      user,
      linkAccount,
      unlinkAccount
    };
  }
};
</script>

<style scoped>
.social-account-card {
  transition: all 0.2s ease;
}

.social-account-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>