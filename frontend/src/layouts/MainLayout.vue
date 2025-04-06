<template>
  <div class="main-layout">
    <header class="header">
      <div class="container header-content">
        <div class="header-left">
          <router-link to="/" class="text-decoration-none">
            <v-img
              src="/images/logo.png"
              alt="Uber Eats Clone"
              width="150"
              class="mx-auto mb-4"
            />
            <h1 class="text-h4 font-weight-bold primary--text">Uber Eats Clone</h1>
          </router-link>
          <div class="location-selector">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{ currentLocation || $t('common.selectLocation') }}</span>
          </div>
        </div>
        <div class="header-center">
          <SearchBar />
          <div class="nav-links">
            <router-link to="/foods" class="nav-link">
              <v-icon>mdi-food</v-icon>
              <span class="ml-1">Food</span>
            </router-link>
            <router-link to="/restaurants" class="nav-link">
              <v-icon>mdi-store</v-icon>
              <span class="ml-1">Restaurants</span>
            </router-link>
          </div>
        </div>
        <div class="header-right">
          <button
            class="language-toggle"
            @click="toggleLanguageSelector"
          >
            <i class="fas fa-globe"></i>
          </button>
          <div v-if="showLanguageSelector" class="language-dropdown">
            <LanguageSwitcher />
          </div>
          <router-link
            to="/cart"
            class="cart-button"
          >
            <i class="fas fa-shopping-cart"></i>
            <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
          </router-link>
          <div class="user-menu">
            <button
              class="user-menu-toggle"
              @click="toggleUserMenu"
            >
              <i class="fas fa-user-circle"></i>
            </button>
            <div v-if="showUserMenu" class="user-dropdown">
              <ul>
                <li>
                  <router-link to="/profile">
                    <i class="fas fa-user"></i>
                    {{ $t('nav.profile') }}
                  </router-link>
                </li>
                <li>
                  <router-link to="/orders">
                    <i class="fas fa-list"></i>
                    {{ $t('nav.orders') }}
                  </router-link>
                </li>
                <li>
                  <router-link to="/profile/favorites">
                    <i class="fas fa-heart"></i>
                    {{ $t('nav.favorites') }}
                  </router-link>
                </li>
                <li>
                  <router-link to="/profile/addresses">
                    <i class="fas fa-map-marker-alt"></i>
                    {{ $t('nav.addresses') }}
                  </router-link>
                </li>
                <li>
                  <router-link to="/profile/payment-methods">
                    <i class="fas fa-credit-card"></i>
                    {{ $t('nav.paymentMethods') }}
                  </router-link>
                </li>
                <li>
                  <router-link to="/settings/notifications">
                    <i class="fas fa-bell"></i>
                    {{ $t('nav.notifications') }}
                  </router-link>
                </li>
                <li class="divider"></li>
                <li>
                  <button @click="logout" class="logout-button">
                    <i class="fas fa-sign-out-alt"></i>
                    {{ $t('nav.logout') }}
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <NotificationCenter />
        </div>
      </div>
    </header>
    <main class="main-content">
      <div class="container">
        <router-view />
      </div>
    </main>
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>{{ $t('footer.aboutUs') }}</h4>
            <ul>
              <li><router-link to="/about">{{ $t('footer.about') }}</router-link></li>
              <li><router-link to="/careers">{{ $t('footer.careers') }}</router-link></li>
              <li><router-link to="/blog">{{ $t('footer.blog') }}</router-link></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>{{ $t('footer.support') }}</h4>
            <ul>
              <li><router-link to="/help">{{ $t('footer.help') }}</router-link></li>
              <li><router-link to="/faq">{{ $t('footer.faq') }}</router-link></li>
              <li><router-link to="/contact">{{ $t('footer.contact') }}</router-link></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>{{ $t('footer.business') }}</h4>
            <ul>
              <li><router-link to="/restaurant/register">{{ $t('footer.addRestaurant') }}</router-link></li>
              <li><router-link to="/business">{{ $t('footer.business') }}</router-link></li>
              <li><router-link to="/partner">{{ $t('footer.becomePartner') }}</router-link></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>{{ $t('footer.legal') }}</h4>
            <ul>
              <li><router-link to="/terms">{{ $t('footer.terms') }}</router-link></li>
              <li><router-link to="/privacy">{{ $t('footer.privacy') }}</router-link></li>
              <li><router-link to="/cookies">{{ $t('footer.cookies') }}</router-link></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <div class="copyright">
            &copy; {{ new Date().getFullYear() }} UberEat. {{ $t('footer.allRightsReserved') }}
          </div>
          <div class="social-links">
            <a href="#" target="_blank" rel="noopener" title="Facebook"><i class="fab fa-facebook"></i></a>
            <a href="#" target="_blank" rel="noopener" title="Twitter"><i class="fab fa-twitter"></i></a>
            <a href="#" target="_blank" rel="noopener" title="Instagram"><i class="fab fa-instagram"></i></a>
          </div>
        </div>
      </div>
    </footer>
    <InstallPrompt v-if="showInstallPrompt" />
  </div>
</template>

<script>
import SearchBar from '@/components/common/SearchBar.vue';
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue';
import NotificationCenter from '@/components/common/NotificationCenter.vue';
import InstallPrompt from '@/components/common/InstallPrompt.vue';
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'MainLayout',

  components: {
    SearchBar,
    LanguageSwitcher,
    NotificationCenter,
    InstallPrompt
  },

  data() {
    return {
      showLanguageSelector: false,
      showUserMenu: false,
      showInstallPrompt: false
    };
  },

  computed: {
    ...mapGetters({
      isAuthenticated: 'auth/isAuthenticated',
      currentUser: 'auth/currentUser'
    }),

    cartItemCount() {
      return this.$store.getters['cart/cartItemCount'] || 0;
    },

    currentLocation() {
      return this.$store.getters['location/currentAddress'];
    }
  },

  mounted() {
    this.checkForAppInstallPrompt();
    document.addEventListener('click', this.closeMenus);
  },

  beforeDestroy() {
    document.removeEventListener('click', this.closeMenus);
  },

  methods: {
    ...mapActions({
      logoutUser: 'auth/logout'
    }),

    toggleLanguageSelector(event) {
      event.stopPropagation();
      this.showLanguageSelector = !this.showLanguageSelector;
      this.showUserMenu = false;
    },

    toggleUserMenu(event) {
      event.stopPropagation();
      this.showUserMenu = !this.showUserMenu;
      this.showLanguageSelector = false;
    },

    closeMenus(event) {
      const isDropdownClick = event.target.closest('.language-dropdown') ||
                             event.target.closest('.user-dropdown');
      const isToggleClick = event.target.closest('.language-toggle') ||
                           event.target.closest('.user-menu-toggle');

      if (!isDropdownClick && !isToggleClick) {
        this.showLanguageSelector = false;
        this.showUserMenu = false;
      }
    },

    async logout() {
      try {
        await this.logoutUser();
        this.$router.push('/login');
      } catch (error) {
        console.error('Logout failed:', error?.message || 'Unknown error during logout');
        // Still redirect to login even if logout failed
        this.$router.push('/login');
      }
    },

    checkForAppInstallPrompt() {
      // Check if app has been installed or prompt has been shown recently
      const hasShownPrompt = localStorage.getItem('installPromptShown');
      const lastPromptDate = localStorage.getItem('installPromptDate');
      const now = new Date().getTime();

      // Show prompt if not shown in the last 14 days and app is not installed
      if ((!hasShownPrompt || now - lastPromptDate > 14 * 24 * 60 * 60 * 1000) &&
          !window.matchMedia('(display-mode: standalone)').matches) {

        // Show prompt after a delay to not interrupt initial user experience
        setTimeout(() => {
          this.showInstallPrompt = true;
          localStorage.setItem('installPromptShown', 'true');
          localStorage.setItem('installPromptDate', now);
        }, 30000); // 30 seconds delay
      }
    }
  }
}
</script>

<style scoped>
.main-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 15px 0;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left, .header-right {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.logo img {
  height: 30px;
}

.location-selector {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
}

.location-selector i {
  margin-right: 5px;
  color: #FF5722;
}

.header-center {
  flex-grow: 1;
  max-width: 600px;
  margin: 0 20px;
}

.language-toggle, .user-menu-toggle, .cart-button {
  background: none;
  border: none;
  font-size: 1.2rem;
  color: #333;
  padding: 8px;
  margin-left: 10px;
  cursor: pointer;
  position: relative;
}

.cart-badge {
  position: absolute;
  top: 0;
  right: 0;
  background-color: #FF5722;
  color: white;
  border-radius: 50%;
  width: 18px;
  height: 18px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.language-dropdown, .user-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  width: 220px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  margin-top: 5px;
}

.user-menu {
  position: relative;
}

.user-dropdown ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.user-dropdown li {
  padding: 0;
}

.user-dropdown a, .user-dropdown .logout-button {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: #333;
  text-decoration: none;
  transition: background-color 0.2s;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  font-size: 0.9rem;
  cursor: pointer;
}

.user-dropdown a:hover, .user-dropdown .logout-button:hover {
  background-color: #f8f9fa;
}

.user-dropdown i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
}

.divider {
  border-top: 1px solid #eee;
  margin: 5px 0;
}

.logout-button {
  color: #dc3545;
}

.main-content {
  flex-grow: 1;
  padding: 30px 0;
}

.footer {
  background-color: #f8f9fa;
  padding: 40px 0 20px;
  margin-top: auto;
}

.footer-content {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 30px;
}

.footer-section {
  flex: 1;
  min-width: 200px;
  margin-bottom: 20px;
}

.footer-section h4 {
  font-size: 1.1rem;
  margin-bottom: 15px;
  color: #333;
}

.footer-section ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-section li {
  margin-bottom: 10px;
}

.footer-section a {
  color: #666;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s;
}

.footer-section a:hover {
  color: #FF5722;
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 1px solid #e1e1e1;
}

.copyright {
  color: #888;
  font-size: 0.85rem;
}

.social-links {
  display: flex;
}

.social-links a {
  color: #666;
  font-size: 1.2rem;
  margin-left: 15px;
  transition: color 0.2s;
}

.social-links a:hover {
  color: #FF5722;
}

.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
  }

  .header-left, .header-center, .header-right {
    width: 100%;
    margin: 10px 0;
  }

  .footer-content {
    flex-direction: column;
  }

  .footer-section {
    margin-bottom: 30px;
  }

  .footer-bottom {
    flex-direction: column;
    text-align: center;
  }

  .social-links {
    margin-top: 15px;
    justify-content: center;
  }

  .social-links a {
    margin: 0 8px;
  }
}

/* Add the CSS styles for nav-links and nav-link */
.nav-links {
  display: flex;
  margin-top: 10px;
  justify-content: center;
}

.nav-link {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  margin: 0 5px;
  color: var(--v-primary-base);
  font-weight: 500;
  text-decoration: none;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background-color: rgba(255, 82, 82, 0.1);
}

.nav-link.router-link-active {
  background-color: rgba(255, 82, 82, 0.15);
  color: var(--v-primary-darken1);
  font-weight: 600;
}
</style>