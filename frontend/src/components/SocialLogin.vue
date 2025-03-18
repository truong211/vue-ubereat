<template>
  <div class="social-login-container">
    <div class="social-login-title" v-if="title">{{ title }}</div>
    <div class="social-login-buttons">
      <button
        type="button"
        class="btn btn-google"
        @click="loginWithGoogle"
        :disabled="loading"
      >
        <i class="fab fa-google"></i> {{ buttonText }} Google
      </button>
      <button
        type="button"
        class="btn btn-facebook"
        @click="loginWithFacebook"
        :disabled="loading"
      >
        <i class="fab fa-facebook-f"></i> {{ buttonText }} Facebook
      </button>
    </div>
    <div class="social-login-divider" v-if="showDivider">
      <span>or</span>
    </div>
  </div>
</template>

<script>
import config from '@/config';
export default {
  name: 'SocialLogin',
  props: {
    title: {
      type: String,
      default: ''
    },
    buttonText: {
      type: String,
      default: 'Continue with'
    },
    showDivider: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      loading: false
    };
  },
  methods: {
    loginWithGoogle() {
      this.loading = true;
      // Open Google OAuth login page in a new window
      window.location.href = `${config.apiBaseUrl}/auth/google`;
    },
    loginWithFacebook() {
      this.loading = true;
      // Open Facebook OAuth login page in a new window
      window.location.href = `${config.apiBaseUrl}/auth/facebook`;
    }
  }
};
</script>

<style scoped>
.social-login-container {
  margin: 20px 0;
  width: 100%;
}

.social-login-title {
  text-align: center;
  margin-bottom: 15px;
  font-weight: 500;
}

.social-login-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.social-login-divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 20px 0;
}

.social-login-divider::before,
.social-login-divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.social-login-divider span {
  padding: 0 10px;
  color: #6c757d;
  font-size: 14px;
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  padding: 12px 16px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s, box-shadow 0.3s;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn i {
  margin-right: 10px;
  font-size: 18px;
}

.btn-google {
  background-color: white;
  color: #757575;
  border: 1px solid #dbdbdb;
}

.btn-google:hover:not(:disabled) {
  background-color: #f8f9fa;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.btn-facebook {
  background-color: #1877f2;
  color: white;
}

.btn-facebook:hover:not(:disabled) {
  background-color: #166fe5;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
</style>