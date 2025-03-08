import axios from 'axios';
import { useStorage } from '@vueuse/core';
import socialAuth from '@/services/social-auth';
import otpAuth from '@/services/otp-auth';

const state = {
  user: null,
  accessToken: useStorage('access_token', null),
  refreshToken: useStorage('refresh_token', null),
  isAuthenticated: false,
  otpVerified: false,
  registrationData: null,
  verificationStep: 1, // 1: Registration form, 2: OTP verification, 3: Success
  loading: false,
  preferredAuthMethod: useStorage('preferred_auth_method', 'password'),
  availableAuthMethods: {
    password: true,
    otp: true,
    google: true,
    facebook: true
  }
};

const mutations = {
  SET_USER(state, user) {
    state.user = user;
    state.isAuthenticated = !!user;
  },
  SET_TOKENS(state, { accessToken, refreshToken }) {
    state.accessToken = accessToken;
    state.refreshToken = refreshToken;
  },
  SET_OTP_VERIFIED(state, verified) {
    state.otpVerified = verified;
  },
  SET_REGISTRATION_DATA(state, data) {
    state.registrationData = data;
  },
  SET_VERIFICATION_STEP(state, step) {
    state.verificationStep = step;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  },
  SET_PREFERRED_AUTH_METHOD(state, method) {
    state.preferredAuthMethod = method;
  },
  SET_AVAILABLE_AUTH_METHODS(state, methods) {
    state.availableAuthMethods = methods;
  },
  CLEAR_AUTH(state) {
    state.user = null;
    state.accessToken = null;
    state.refreshToken = null;
    state.isAuthenticated = false;
    state.otpVerified = false;
    state.registrationData = null;
    state.verificationStep = 1;
  }
};

const actions = {
  // Initialize SDK
  initSocialAuth() {
    socialAuth.initSocialAuth();
  },

  // Start registration process
  async startRegistration({ commit }, userData) {
    commit('SET_LOADING', true);
    try {
      // First step: Save registration data
      commit('SET_REGISTRATION_DATA', userData);
      
      // If email and phone are provided, send both OTPs
      if (userData.email && userData.phone) {
        const result = await otpAuth.sendDualOTP(userData.email, userData.phone);
        // Store verification IDs in registration data
        commit('SET_REGISTRATION_DATA', {
          ...userData,
          emailVerificationId: result.emailVerificationId,
          phoneVerificationId: result.phoneVerificationId
        });
      } else if (userData.email) {
        // Send only email OTP
        const emailVerificationId = await otpAuth.sendEmailOTP(userData.email);
        commit('SET_REGISTRATION_DATA', {
          ...userData,
          emailVerificationId
        });
      }
      
      // Move to verification step
      commit('SET_VERIFICATION_STEP', 2);
      commit('SET_LOADING', false);
      return true;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Complete registration with OTP verification
  async completeRegistration({ commit, state }, otpData) {
    commit('SET_LOADING', true);
    try {
      // Verify OTPs
      if (state.registrationData.emailVerificationId && state.registrationData.phoneVerificationId) {
        // Verify both email and phone OTPs
        await otpAuth.verifyDualOTP(
          state.registrationData.emailVerificationId,
          otpData.emailOtp,
          state.registrationData.phoneVerificationId,
          otpData.phoneOtp
        );
      } else if (state.registrationData.emailVerificationId) {
        // Verify only email OTP
        await otpAuth.verifyEmailOTP(
          state.registrationData.emailVerificationId, 
          otpData.emailOtp
        );
      }
      
      // OTPs verified, now register the user
      const response = await axios.post('/api/auth/register', {
        ...state.registrationData,
        verified: true
      });
      
      const { user, accessToken, refreshToken } = response.data;
      
      // Update auth state
      commit('SET_USER', user);
      commit('SET_TOKENS', { accessToken, refreshToken });
      commit('SET_OTP_VERIFIED', true);
      commit('SET_VERIFICATION_STEP', 3);
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Request password reset via email
  async requestPasswordReset({ commit }, { email }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.post('/api/auth/forgot-password', { email });
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Reset password using token from email
  async resetPassword({ commit }, { token, newPassword }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.post('/api/auth/reset-password', { 
        token, 
        newPassword 
      });
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Request password reset via OTP (either email or SMS)
  async requestPasswordResetOTP({ commit }, { email, phone }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.post('/api/auth/password/request-otp', { 
        email, 
        phone 
      });
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Reset password using OTP
  async resetPasswordWithOTP({ commit }, { verificationId, otp, newPassword }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.post('/api/auth/password/reset-with-otp', {
        verificationId,
        otp,
        newPassword
      });
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Standard registration (original method, still used but extended)
  async register({ commit, dispatch }, userData) {
    try {
      const response = await axios.post('/api/auth/register', userData);
      // After registration, we'll need OTP verification
      commit('SET_USER', response.data.user);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify OTP directly
  async verifyOTP({ commit }, { email, otp, type }) {
    try {
      const response = await axios.post('/api/auth/verify-otp', { email, otp, type });
      commit('SET_OTP_VERIFIED', true);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Resend OTP
  async resendOTP({ commit, state }, { type, email, phone } = {}) {
    commit('SET_LOADING', true);
    try {
      let targetEmail = email;
      let targetPhone = phone;
      
      // Use data from registration if not provided directly
      if (state.registrationData && !targetEmail) {
        targetEmail = state.registrationData.email;
      }
      
      if (state.registrationData && !targetPhone) {
        targetPhone = state.registrationData.phone;
      }
      
      if (!targetEmail && !targetPhone) {
        throw new Error('Email or phone number is required');
      }
      
      let result;
      
      if ((type === 'email' || !type) && targetEmail) {
        result = await otpAuth.sendEmailOTP(targetEmail);
        if (state.registrationData) {
          commit('SET_REGISTRATION_DATA', {
            ...state.registrationData,
            emailVerificationId: result.verificationId || result
          });
        }
      }
      
      if ((type === 'phone' || !type) && targetPhone) {
        result = await otpAuth.sendPhoneOTP(targetPhone);
        if (state.registrationData) {
          commit('SET_REGISTRATION_DATA', {
            ...state.registrationData,
            phoneVerificationId: result.verificationId || result
          });
        }
      }
      
      commit('SET_LOADING', false);
      return result;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Password login
  async login({ commit }, credentials) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.post('/api/auth/login/email', credentials);
      const { user, accessToken, refreshToken } = response.data;
      
      commit('SET_USER', user);
      commit('SET_TOKENS', { accessToken, refreshToken });
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Store preferred auth method
      commit('SET_PREFERRED_AUTH_METHOD', 'password');
      
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // OTP Login (passwordless)
  async loginWithOTP({ commit }, { email, phone, otp }) {
    commit('SET_LOADING', true);
    try {
      const response = await axios.post('/api/auth/login/otp', { email, phone, otp });
      const { user, accessToken, refreshToken } = response.data;
      
      commit('SET_USER', user);
      commit('SET_TOKENS', { accessToken, refreshToken });
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Store preferred auth method
      commit('SET_PREFERRED_AUTH_METHOD', 'otp');
      
      commit('SET_LOADING', false);
      return response.data;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Send OTP for passwordless login
  async sendLoginOTP({ commit }, { email, phone }) {
    commit('SET_LOADING', true);
    try {
      let result;
      
      if (email) {
        result = await otpAuth.sendLoginOTP(email);
      } else if (phone) {
        result = await otpAuth.sendPhoneOTP(phone);
      } else {
        throw new Error('Email or phone is required');
      }
      
      commit('SET_LOADING', false);
      return result;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Social media login
  async loginWithSocial({ commit }, { provider }) {
    commit('SET_LOADING', true);
    try {
      const result = await socialAuth.loginWithSocial(provider);
      const { user, accessToken, refreshToken } = result;
      
      commit('SET_USER', user);
      commit('SET_TOKENS', { accessToken, refreshToken });
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Store preferred auth method
      commit('SET_PREFERRED_AUTH_METHOD', provider);
      
      commit('SET_LOADING', false);
      return result;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Handle social login callback
  async handleSocialCallback({ commit }, { provider, code }) {
    commit('SET_LOADING', true);
    try {
      const result = await socialAuth.handleSocialCallback(provider, code);
      const { user, accessToken, refreshToken } = result;
      
      commit('SET_USER', user);
      commit('SET_TOKENS', { accessToken, refreshToken });
      
      // Set axios default header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      // Store preferred auth method
      commit('SET_PREFERRED_AUTH_METHOD', provider);
      
      commit('SET_LOADING', false);
      return result;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Link social account to existing user
  async linkSocialAccount({ commit }, { provider }) {
    commit('SET_LOADING', true);
    try {
      const result = await socialAuth.linkSocialAccount(provider);
      
      // Update user data with linked account info
      commit('SET_USER', result.user);
      
      commit('SET_LOADING', false);
      return result;
    } catch (error) {
      commit('SET_LOADING', false);
      throw error;
    }
  },

  // Refresh authentication token
  async refreshToken({ commit, state }) {
    try {
      if (!state.refreshToken) {
        throw new Error('No refresh token available');
      }
      
      const response = await axios.post('/api/auth/refresh-token', {
        refreshToken: state.refreshToken
      });
      
      const { accessToken, refreshToken } = response.data;
      
      commit('SET_TOKENS', { accessToken, refreshToken });
      
      // Update axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      return accessToken;
    } catch (error) {
      commit('CLEAR_AUTH');
      throw error;
    }
  },

  // Setup axios interceptors for automatic token refresh
  setupAxiosInterceptors({ state, dispatch }) {
    // Add request interceptor
    axios.interceptors.request.use(
      config => {
        if (state.accessToken) {
          config.headers['Authorization'] = `Bearer ${state.accessToken}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );
    
    // Add response interceptor
    axios.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;
        
        // If error is 401 and not a retry and we have a refresh token
        if (error.response?.status === 401 && !originalRequest._retry && state.refreshToken) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const newToken = await dispatch('refreshToken');
            
            // Update the failed request
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // If refresh fails, logout
            await dispatch('logout');
            throw refreshError;
          }
        }
        
        return Promise.reject(error);
      }
    );
  },

  // Logout
  async logout({ commit }) {
    try {
      if (state.accessToken) {
        await axios.post('/api/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear authentication state
      commit('CLEAR_AUTH');
      
      // Clear axios header
      delete axios.defaults.headers.common['Authorization'];
    }
  }
};

const getters = {
  isAuthenticated: state => state.isAuthenticated,
  user: state => state.user,
  loading: state => state.loading,
  verificationStep: state => state.verificationStep,
  preferredAuthMethod: state => state.preferredAuthMethod,
  availableAuthMethods: state => state.availableAuthMethods
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
};