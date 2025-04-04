<template>
  <div class="settings-page">
    <Breadcrumb :items="breadcrumbItems" />
    <h1 class="page-title">{{ $t('settings.title') }}</h1>
    
    <div class="settings-container">
      <div class="settings-nav">
        <ul>
          <li 
            v-for="(section, index) in settingsSections" 
            :key="index" 
            :class="{ active: activeSection === section.id }"
            @click="activeSection = section.id"
          >
            <i :class="section.icon"></i>
            <span>{{ section.title }}</span>
          </li>
        </ul>
      </div>
      
      <div class="settings-content">
        <!-- Personal Information -->
        <div v-if="activeSection === 'personal'" class="settings-section">
          <h2>{{ $t('settings.personalInfo') }}</h2>
          <form @submit.prevent="updatePersonalInfo">
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">{{ $t('settings.firstName') }}</label>
                <input 
                  id="firstName" 
                  v-model="personalInfo.firstName" 
                  type="text" 
                  :placeholder="$t('settings.firstNamePlaceholder')"
                  required
                />
              </div>
              <div class="form-group">
                <label for="lastName">{{ $t('settings.lastName') }}</label>
                <input 
                  id="lastName" 
                  v-model="personalInfo.lastName" 
                  type="text" 
                  :placeholder="$t('settings.lastNamePlaceholder')"
                  required
                />
              </div>
            </div>
            
            <div class="form-group">
              <label for="email">{{ $t('settings.email') }}</label>
              <input 
                id="email" 
                v-model="personalInfo.email" 
                type="email" 
                :placeholder="$t('settings.emailPlaceholder')"
                required
                :disabled="!canChangeEmail"
              />
              <small v-if="!canChangeEmail">{{ $t('settings.emailChangeDisabled') }}</small>
            </div>
            
            <div class="form-group">
              <label for="phone">{{ $t('settings.phone') }}</label>
              <input 
                id="phone" 
                v-model="personalInfo.phone" 
                type="tel" 
                :placeholder="$t('settings.phonePlaceholder')"
              />
            </div>
            
            <div class="form-group">
              <label for="birthdate">{{ $t('settings.birthdate') }}</label>
              <input 
                id="birthdate" 
                v-model="personalInfo.birthdate" 
                type="date"
              />
            </div>
            
            <div class="form-actions">
              <button 
                type="submit" 
                class="btn-primary"
                :disabled="isUpdatingPersonal"
              >
                <i v-if="isUpdatingPersonal" class="fas fa-spinner fa-spin"></i>
                {{ $t('settings.saveChanges') }}
              </button>
            </div>
          </form>
        </div>
        
        <!-- Account Security -->
        <div v-if="activeSection === 'security'" class="settings-section">
          <h2>{{ $t('settings.security') }}</h2>
          
          <div class="setting-group">
            <h3>{{ $t('settings.changePassword') }}</h3>
            <form @submit.prevent="updatePassword">
              <div class="form-group">
                <label for="currentPassword">{{ $t('settings.currentPassword') }}</label>
                <input 
                  id="currentPassword" 
                  v-model="securityInfo.currentPassword" 
                  type="password" 
                  :placeholder="$t('settings.currentPasswordPlaceholder')"
                  required
                />
              </div>
              
              <div class="form-group">
                <label for="newPassword">{{ $t('settings.newPassword') }}</label>
                <input 
                  id="newPassword" 
                  v-model="securityInfo.newPassword" 
                  type="password" 
                  :placeholder="$t('settings.newPasswordPlaceholder')"
                  required
                />
                <div v-if="securityInfo.newPassword" class="password-strength">
                  <div 
                    class="strength-meter" 
                    :class="passwordStrengthClass"
                  ></div>
                  <span>{{ passwordStrengthText }}</span>
                </div>
              </div>
              
              <div class="form-group">
                <label for="confirmPassword">{{ $t('settings.confirmPassword') }}</label>
                <input 
                  id="confirmPassword" 
                  v-model="securityInfo.confirmPassword" 
                  type="password" 
                  :placeholder="$t('settings.confirmPasswordPlaceholder')"
                  required
                />
                <small v-if="passwordsDoNotMatch" class="error-text">
                  {{ $t('settings.passwordsDoNotMatch') }}
                </small>
              </div>
              
              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn-primary"
                  :disabled="isUpdatingSecurity || passwordsDoNotMatch"
                >
                  <i v-if="isUpdatingSecurity" class="fas fa-spinner fa-spin"></i>
                  {{ $t('settings.updatePassword') }}
                </button>
              </div>
            </form>
          </div>
          
          <div class="setting-group">
            <h3>{{ $t('settings.twoFactorAuth') }}</h3>
            <div class="toggle-wrapper">
              <label class="toggle">
                <input type="checkbox" v-model="securityInfo.twoFactorEnabled" @change="toggleTwoFactor">
                <span class="toggle-slider"></span>
              </label>
              <span>{{ $t('settings.enableTwoFactor') }}</span>
            </div>
            <p class="setting-description">{{ $t('settings.twoFactorDescription') }}</p>
          </div>
          
          <div class="setting-group">
            <h3>{{ $t('settings.loginActivity') }}</h3>
            <button class="btn-outline" @click="loadLoginActivity">
              <i class="fas fa-history"></i>
              {{ $t('settings.viewLoginHistory') }}
            </button>
          </div>
        </div>
        
        <!-- Preferences -->
        <div v-if="activeSection === 'preferences'" class="settings-section">
          <h2>{{ $t('settings.preferences') }}</h2>
          
          <div class="setting-group">
            <h3>{{ $t('settings.language') }}</h3>
            <div class="form-group">
              <select v-model="preferences.language">
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
              </select>
            </div>
          </div>
          
          <div class="setting-group">
            <h3>{{ $t('settings.notifications') }}</h3>
            
            <div class="checkbox-group">
              <label class="checkbox">
                <input type="checkbox" v-model="preferences.notifications.email">
                {{ $t('settings.emailNotifications') }}
              </label>
              <p class="setting-description">{{ $t('settings.emailNotificationsDesc') }}</p>
            </div>
            
            <div class="checkbox-group">
              <label class="checkbox">
                <input type="checkbox" v-model="preferences.notifications.push">
                {{ $t('settings.pushNotifications') }}
              </label>
              <p class="setting-description">{{ $t('settings.pushNotificationsDesc') }}</p>
            </div>
            
            <div class="checkbox-group">
              <label class="checkbox">
                <input type="checkbox" v-model="preferences.notifications.sms">
                {{ $t('settings.smsNotifications') }}
              </label>
              <p class="setting-description">{{ $t('settings.smsNotificationsDesc') }}</p>
            </div>
          </div>
          
          <div class="setting-group">
            <h3>{{ $t('settings.theme') }}</h3>
            <div class="theme-options">
              <div 
                class="theme-option"
                :class="{ active: preferences.theme === 'light' }"
                @click="preferences.theme = 'light'"
              >
                <div class="theme-preview light"></div>
                <span>{{ $t('settings.lightTheme') }}</span>
              </div>
              <div 
                class="theme-option"
                :class="{ active: preferences.theme === 'dark' }"
                @click="preferences.theme = 'dark'"
              >
                <div class="theme-preview dark"></div>
                <span>{{ $t('settings.darkTheme') }}</span>
              </div>
              <div 
                class="theme-option"
                :class="{ active: preferences.theme === 'system' }"
                @click="preferences.theme = 'system'"
              >
                <div class="theme-preview system"></div>
                <span>{{ $t('settings.systemTheme') }}</span>
              </div>
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              class="btn-primary"
              @click="savePreferences"
              :disabled="isUpdatingPreferences"
            >
              <i v-if="isUpdatingPreferences" class="fas fa-spinner fa-spin"></i>
              {{ $t('settings.saveChanges') }}
            </button>
          </div>
        </div>
        
        <!-- Privacy -->
        <div v-if="activeSection === 'privacy'" class="settings-section">
          <h2>{{ $t('settings.privacy') }}</h2>
          
          <div class="setting-group">
            <h3>{{ $t('settings.dataUsage') }}</h3>
            
            <div class="checkbox-group">
              <label class="checkbox">
                <input type="checkbox" v-model="privacySettings.allowDataCollection">
                {{ $t('settings.allowDataCollection') }}
              </label>
              <p class="setting-description">{{ $t('settings.dataCollectionDesc') }}</p>
            </div>
            
            <div class="checkbox-group">
              <label class="checkbox">
                <input type="checkbox" v-model="privacySettings.allowLocationTracking">
                {{ $t('settings.allowLocationTracking') }}
              </label>
              <p class="setting-description">{{ $t('settings.locationTrackingDesc') }}</p>
            </div>
          </div>
          
          <div class="setting-group">
            <h3>{{ $t('settings.marketing') }}</h3>
            
            <div class="checkbox-group">
              <label class="checkbox">
                <input type="checkbox" v-model="privacySettings.allowMarketing">
                {{ $t('settings.allowMarketing') }}
              </label>
              <p class="setting-description">{{ $t('settings.marketingDesc') }}</p>
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              class="btn-primary"
              @click="savePrivacySettings"
              :disabled="isUpdatingPrivacy"
            >
              <i v-if="isUpdatingPrivacy" class="fas fa-spinner fa-spin"></i>
              {{ $t('settings.saveChanges') }}
            </button>
          </div>
          
          <div class="setting-group danger-zone">
            <h3>{{ $t('settings.dangerZone') }}</h3>
            
            <button class="btn-danger" @click="showDeleteConfirm = true">
              {{ $t('settings.deleteAccount') }}
            </button>
            <p class="setting-description">{{ $t('settings.deleteAccountWarning') }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Account Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay">
      <div class="modal">
        <h3>{{ $t('settings.confirmDelete') }}</h3>
        <p>{{ $t('settings.deleteWarningDetail') }}</p>
        
        <div class="form-group">
          <label for="deleteConfirmPassword">{{ $t('settings.enterPassword') }}</label>
          <input 
            id="deleteConfirmPassword" 
            v-model="deleteAccountPassword" 
            type="password" 
            :placeholder="$t('settings.passwordPlaceholder')"
            required
          />
        </div>
        
        <div class="modal-actions">
          <button class="btn-outline" @click="showDeleteConfirm = false">
            {{ $t('common.cancel') }}
          </button>
          <button 
            class="btn-danger"
            @click="deleteAccount"
            :disabled="isDeleting || !deleteAccountPassword"
          >
            <i v-if="isDeleting" class="fas fa-spinner fa-spin"></i>
            {{ $t('settings.permanentlyDelete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Breadcrumb from '@/components/common/Breadcrumb.vue';
import { mapActions } from 'vuex';

export default {
  name: 'Settings',
  
  components: {
    Breadcrumb
  },
  
  data() {
    return {
      breadcrumbItems: [
        { text: this.$t('nav.profile'), path: '/profile' },
        { text: this.$t('settings.title') }
      ],
      activeSection: 'personal',
      settingsSections: [
        { id: 'personal', title: this.$t('settings.personalInfo'), icon: 'fas fa-user' },
        { id: 'security', title: this.$t('settings.security'), icon: 'fas fa-shield-alt' },
        { id: 'preferences', title: this.$t('settings.preferences'), icon: 'fas fa-sliders-h' },
        { id: 'privacy', title: this.$t('settings.privacy'), icon: 'fas fa-user-shield' }
      ],
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthdate: ''
      },
      securityInfo: {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        twoFactorEnabled: false
      },
      preferences: {
        language: 'en',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        theme: 'system'
      },
      privacySettings: {
        allowDataCollection: true,
        allowLocationTracking: true,
        allowMarketing: true
      },
      isUpdatingPersonal: false,
      isUpdatingSecurity: false,
      isUpdatingPreferences: false,
      isUpdatingPrivacy: false,
      showDeleteConfirm: false,
      deleteAccountPassword: '',
      isDeleting: false,
      canChangeEmail: true
    };
  },
  
  computed: {
    passwordsDoNotMatch() {
      return this.securityInfo.newPassword && 
             this.securityInfo.confirmPassword && 
             this.securityInfo.newPassword !== this.securityInfo.confirmPassword;
    },
    
    passwordStrength() {
      const password = this.securityInfo.newPassword;
      if (!password) return 0;
      
      let score = 0;
      
      // Length
      if (password.length >= 8) score += 1;
      if (password.length >= 12) score += 1;
      
      // Complexity
      if (/[A-Z]/.test(password)) score += 1;
      if (/[a-z]/.test(password)) score += 1;
      if (/[0-9]/.test(password)) score += 1;
      if (/[^A-Za-z0-9]/.test(password)) score += 1;
      
      return Math.min(score, 5);
    },
    
    passwordStrengthClass() {
      const strengthMap = {
        0: 'very-weak',
        1: 'very-weak',
        2: 'weak',
        3: 'medium',
        4: 'strong',
        5: 'very-strong'
      };
      
      return strengthMap[this.passwordStrength];
    },
    
    passwordStrengthText() {
      const strengthMap = {
        0: this.$t('settings.passwordVeryWeak'),
        1: this.$t('settings.passwordVeryWeak'),
        2: this.$t('settings.passwordWeak'),
        3: this.$t('settings.passwordMedium'),
        4: this.$t('settings.passwordStrong'),
        5: this.$t('settings.passwordVeryStrong')
      };
      
      return strengthMap[this.passwordStrength];
    }
  },
  
  created() {
    this.loadUserData();
  },
  
  methods: {
    ...mapActions({
      updateProfile: 'user/updateProfile',
      updateUserPassword: 'user/updatePassword',
      updateUserPreferences: 'user/updatePreferences',
      updatePrivacy: 'user/updatePrivacy',
      deleteUserAccount: 'user/deleteAccount'
    }),
    
    async loadUserData() {
      try {
        // In a real app, you would fetch the user's data from your store or API
        const user = this.$store.getters['auth/currentUser'];
        
        if (user) {
          this.personalInfo = {
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phone: user.phone || '',
            birthdate: user.birthdate || ''
          };
          
          this.securityInfo.twoFactorEnabled = user.twoFactorEnabled || false;
          this.preferences = user.preferences || this.preferences;
          this.privacySettings = user.privacySettings || this.privacySettings;
          this.canChangeEmail = !user.oauthProvider; // Can't change email if using OAuth
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        this.$toast.error(this.$t('settings.loadError'));
      }
    },
    
    async updatePersonalInfo() {
      try {
        this.isUpdatingPersonal = true;
        await this.updateProfile(this.personalInfo);
        this.$toast.success(this.$t('settings.personalInfoUpdated'));
      } catch (error) {
        console.error('Failed to update personal info:', error);
        this.$toast.error(this.$t('settings.updateError'));
      } finally {
        this.isUpdatingPersonal = false;
      }
    },
    
    async updatePassword() {
      if (this.passwordsDoNotMatch) {
        this.$toast.error(this.$t('settings.passwordsDoNotMatch'));
        return;
      }
      
      try {
        this.isUpdatingSecurity = true;
        await this.updateUserPassword({
          currentPassword: this.securityInfo.currentPassword,
          newPassword: this.securityInfo.newPassword
        });
        
        this.securityInfo = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          twoFactorEnabled: this.securityInfo.twoFactorEnabled
        };
        
        this.$toast.success(this.$t('settings.passwordUpdated'));
      } catch (error) {
        console.error('Failed to update password:', error);
        this.$toast.error(error.message || this.$t('settings.updateError'));
      } finally {
        this.isUpdatingSecurity = false;
      }
    },
    
    async toggleTwoFactor() {
      try {
        this.isUpdatingSecurity = true;
        
        // In a real app, this would involve additional steps for 2FA setup
        await this.updateUserPreferences({
          twoFactorEnabled: this.securityInfo.twoFactorEnabled
        });
        
        const message = this.securityInfo.twoFactorEnabled 
          ? this.$t('settings.twoFactorEnabled')
          : this.$t('settings.twoFactorDisabled');
          
        this.$toast.success(message);
      } catch (error) {
        console.error('Failed to toggle 2FA:', error);
        this.securityInfo.twoFactorEnabled = !this.securityInfo.twoFactorEnabled; // Revert
        this.$toast.error(this.$t('settings.updateError'));
      } finally {
        this.isUpdatingSecurity = false;
      }
    },
    
    loadLoginActivity() {
      // In a real app, this would navigate to a history page or open a modal
      this.$toast.info(this.$t('settings.comingSoon'));
    },
    
    async savePreferences() {
      try {
        this.isUpdatingPreferences = true;
        await this.updateUserPreferences(this.preferences);
        
        // Apply language change immediately
        if (this.$i18n.locale !== this.preferences.language) {
          this.$i18n.locale = this.preferences.language;
        }
        
        // Apply theme change
        document.documentElement.setAttribute('data-theme', this.preferences.theme);
        
        this.$toast.success(this.$t('settings.preferencesUpdated'));
      } catch (error) {
        console.error('Failed to update preferences:', error);
        this.$toast.error(this.$t('settings.updateError'));
      } finally {
        this.isUpdatingPreferences = false;
      }
    },
    
    async savePrivacySettings() {
      try {
        this.isUpdatingPrivacy = true;
        await this.updatePrivacy(this.privacySettings);
        this.$toast.success(this.$t('settings.privacyUpdated'));
      } catch (error) {
        console.error('Failed to update privacy settings:', error);
        this.$toast.error(this.$t('settings.updateError'));
      } finally {
        this.isUpdatingPrivacy = false;
      }
    },
    
    async deleteAccount() {
      if (!this.deleteAccountPassword) {
        this.$toast.error(this.$t('settings.passwordRequired'));
        return;
      }
      
      try {
        this.isDeleting = true;
        await this.deleteUserAccount({
          password: this.deleteAccountPassword
        });
        
        // Log out and redirect to homepage
        await this.$store.dispatch('auth/logout');
        this.$router.push('/');
        this.$toast.success(this.$t('settings.accountDeleted'));
      } catch (error) {
        console.error('Failed to delete account:', error);
        this.$toast.error(error.message || this.$t('settings.deleteError'));
      } finally {
        this.isDeleting = false;
        this.showDeleteConfirm = false;
      }
    }
  }
}
</script>

<style scoped>
.settings-page {
  padding: 20px 0;
}

.page-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 30px;
}

.settings-container {
  display: flex;
  gap: 30px;
  margin-top: 20px;
}

.settings-nav {
  width: 250px;
  flex-shrink: 0;
}

.settings-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.settings-nav li {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.settings-nav li.active {
  background-color: #f8f9fa;
  color: #FF5722;
  border-left-color: #FF5722;
  font-weight: 600;
}

.settings-nav li:hover:not(.active) {
  background-color: #f8f9fa;
}

.settings-nav i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
}

.settings-content {
  flex-grow: 1;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 25px;
}

.settings-section h2 {
  margin-top: 0;
  margin-bottom: 25px;
  font-size: 1.4rem;
  font-weight: 600;
  color: #333;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.setting-group {
  margin-bottom: 30px;
}

.setting-group h3 {
  font-size: 1.1rem;
  margin-bottom: 15px;
  color: #555;
}

.form-group {
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-row .form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

input[type="text"],
input[type="email"],
input[type="tel"],
input[type="password"],
input[type="date"],
select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

input:focus,
select:focus {
  border-color: #FF5722;
  outline: none;
}

input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
}

small {
  display: block;
  margin-top: 5px;
  color: #6c757d;
  font-size: 0.85rem;
}

.error-text {
  color: #dc3545;
}

.form-actions {
  margin-top: 20px;
}

.btn-primary,
.btn-outline,
.btn-danger {
  padding: 10px 20px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 0.95rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background-color: #FF5722;
  color: white;
}

.btn-primary:hover {
  background-color: #f4511e;
}

.btn-primary:disabled {
  background-color: #ffccbc;
  cursor: not-allowed;
}

.btn-outline {
  background-color: transparent;
  border: 1px solid #ddd;
  color: #666;
}

.btn-outline:hover {
  border-color: #FF5722;
  color: #FF5722;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-danger:hover {
  background-color: #c82333;
}

.btn-danger:disabled {
  background-color: #f7d7da;
  color: #721c24;
  cursor: not-allowed;
}

.password-strength {
  margin-top: 10px;
}

.strength-meter {
  height: 5px;
  border-radius: 3px;
  margin-bottom: 5px;
}

.strength-meter.very-weak {
  width: 20%;
  background-color: #dc3545;
}

.strength-meter.weak {
  width: 40%;
  background-color: #ffc107;
}

.strength-meter.medium {
  width: 60%;
  background-color: #fd7e14;
}

.strength-meter.strong {
  width: 80%;
  background-color: #20c997;
}

.strength-meter.very-strong {
  width: 100%;
  background-color: #28a745;
}

.toggle-wrapper {
  display: flex;
  align-items: center;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
  margin-right: 10px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

input:checked + .toggle-slider {
  background-color: #FF5722;
}

input:focus + .toggle-slider {
  box-shadow: 0 0 1px #FF5722;
}

input:checked + .toggle-slider:before {
  transform: translateX(26px);
}

.setting-description {
  color: #6c757d;
  font-size: 0.9rem;
  margin-top: 5px;
}

.checkbox-group {
  margin-bottom: 15px;
}

.checkbox {
  display: flex;
  align-items: center;
  font-weight: 500;
  cursor: pointer;
}

.checkbox input {
  margin-right: 10px;
}

.theme-options {
  display: flex;
  gap: 20px;
}

.theme-option {
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}

.theme-option:hover {
  transform: translateY(-3px);
}

.theme-option.active .theme-preview {
  border-color: #FF5722;
}

.theme-preview {
  width: 80px;
  height: 50px;
  border-radius: 4px;
  border: 2px solid transparent;
  margin-bottom: 8px;
}

.theme-preview.light {
  background-color: #fff;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.theme-preview.dark {
  background-color: #222;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.theme-preview.system {
  background: linear-gradient(to right, #fff 50%, #222 50%);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.danger-zone {
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #f7d7da;
}

.danger-zone h3 {
  color: #dc3545;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal {
  background-color: white;
  border-radius: 8px;
  padding: 25px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.modal h3 {
  margin-top: 0;
  color: #dc3545;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .settings-container {
    flex-direction: column;
  }
  
  .settings-nav {
    width: 100%;
  }
  
  .settings-nav ul {
    display: flex;
    flex-wrap: wrap;
  }
  
  .settings-nav li {
    flex: 1;
    min-width: 120px;
    border-left: none;
    border-bottom: 3px solid transparent;
    justify-content: center;
    padding: 10px;
  }
  
  .settings-nav li.active {
    border-left-color: transparent;
    border-bottom-color: #FF5722;
  }
  
  .settings-nav i {
    margin-right: 5px;
  }
  
  .form-row {
    flex-direction: column;
    gap: 0;
  }
  
  .theme-options {
    flex-wrap: wrap;
  }
}
</style> 