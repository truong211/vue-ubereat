import { Module } from 'vuex';
import { RootState } from './index';
import jwtAuth from '@/services/jwt-auth';
import axios from 'axios';

export interface AuthState {
  user: any | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
}

const auth: Module<AuthState, RootState> = {
  namespaced: true,

  state: {
    user: null,
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
    loading: false
  },

  mutations: {
    SET_USER(state, user) {
      state.user = user;
    },
    SET_TOKENS(state, { accessToken, refreshToken }) {
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      if (accessToken) {
        localStorage.setItem('accessToken', accessToken);
      } else {
        localStorage.removeItem('accessToken');
      }
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      } else {
        localStorage.removeItem('refreshToken');
      }
    },
    SET_LOADING(state, loading: boolean) {
      state.loading = loading;
    },
    CLEAR_AUTH(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  actions: {
    async login({ commit }, credentials) {
      try {
        commit('SET_LOADING', true);
        const { accessToken, refreshToken, user } = await jwtAuth.login(credentials);
        commit('SET_TOKENS', { accessToken, refreshToken });
        jwtAuth.setAuthHeader(accessToken);
        commit('SET_USER', user);
        return { accessToken, refreshToken, user };
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async requestPasswordReset({ commit }, email: string) {
      try {
        commit('SET_LOADING', true);
        await axios.post('/api/auth/password/request-reset', { email });
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async verifyResetToken({ commit }, token: string) {
      try {
        commit('SET_LOADING', true);
        await axios.get(`/api/auth/password/verify-token/${token}`);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async resetPassword({ commit }, { token, newPassword }: { token: string; newPassword: string }) {
      try {
        commit('SET_LOADING', true);
        await axios.post('/api/auth/password/reset', {
          token,
          newPassword
        });
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async loadUser({ commit, state }) {
      try {
        if (!state.accessToken) return null;
        const response = await axios.get('/api/auth/me');
        const user = response.data;
        commit('SET_USER', user);
        return user;
      } catch (error) {
        console.error('Error loading user:', error);
        throw error;
      }
    },

    async refreshToken({ commit, state }) {
      try {
        if (!state.refreshToken) {
          throw new Error('No refresh token available');
        }
        const accessToken = await jwtAuth.refresh(state.refreshToken);
        commit('SET_TOKENS', { 
          accessToken, 
          refreshToken: state.refreshToken 
        });
        jwtAuth.setAuthHeader(accessToken);
        return accessToken;
      } catch (error) {
        commit('CLEAR_AUTH');
        throw error;
      }
    },

    async logout({ commit, state }) {
      try {
        if (state.refreshToken) {
          await jwtAuth.logout(state.refreshToken);
        }
      } finally {
        commit('CLEAR_AUTH');
        jwtAuth.setAuthHeader(null);
      }
    }
  },

  getters: {
    isAuthenticated: (state) => !!state.accessToken,
    hasRole: (state) => (role: string | string[]) => {
      if (!state.user) return false;
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(state.user.role);
    },
    isAdmin: (state) => state.user?.role === 'admin',
    isRestaurant: (state) => state.user?.role === 'restaurant',
    isDriver: (state) => state.user?.role === 'driver',
    isCustomer: (state) => state.user?.role === 'customer'
  }
};

export default auth;