import { Module } from 'vuex';
import { RootState } from '../index';
import axios from 'axios';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  addresses: DeliveryAddress[];
}

export interface DeliveryAddress {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  lat: number;
  lng: number;
  isDefault: boolean;
}

export interface UserState {
  profile: UserProfile | null;
  addresses: DeliveryAddress[];
  loading: boolean;
}

const user: Module<UserState, RootState> = {
  namespaced: true,

  state: {
    profile: null,
    addresses: [],
    loading: false
  },

  mutations: {
    SET_LOADING(state, loading: boolean) {
      state.loading = loading;
    },

    SET_PROFILE(state, profile: UserProfile) {
      state.profile = profile;
    },

    UPDATE_PROFILE(state, updates: Partial<UserProfile>) {
      if (state.profile) {
        state.profile = { ...state.profile, ...updates };
      }
    },

    SET_ADDRESSES(state, addresses: DeliveryAddress[]) {
      state.addresses = addresses;
    },

    ADD_ADDRESS(state, address: DeliveryAddress) {
      state.addresses.push(address);
    },

    UPDATE_ADDRESS(state, updatedAddress: DeliveryAddress) {
      const index = state.addresses.findIndex(addr => addr.id === updatedAddress.id);
      if (index !== -1) {
        state.addresses[index] = updatedAddress;
      }
    },

    DELETE_ADDRESS(state, addressId: number) {
      state.addresses = state.addresses.filter(addr => addr.id !== addressId);
    }
  },

  actions: {
    async fetchProfile({ commit }) {
      commit('SET_LOADING', true);
      try {
        const response = await axios.get('/api/user/profile');
        commit('SET_PROFILE', response.data);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async updateProfile({ commit }, updates: Partial<UserProfile>) {
      commit('SET_LOADING', true);
      try {
        const response = await axios.put('/api/user/profile', updates);
        commit('UPDATE_PROFILE', response.data);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async updateAvatar({ commit }, avatarUrl: string) {
      commit('UPDATE_PROFILE', { avatar: avatarUrl });
    },

    async changePassword({ commit }, { currentPassword, newPassword }: { currentPassword: string; newPassword: string }) {
      commit('SET_LOADING', true);
      try {
        await axios.put('/api/user/password', {
          currentPassword,
          newPassword
        });
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async fetchAddresses({ commit }) {
      commit('SET_LOADING', true);
      try {
        const response = await axios.get('/api/user/addresses');
        commit('SET_ADDRESSES', response.data);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async addAddress({ commit }, address: Omit<DeliveryAddress, 'id'>) {
      commit('SET_LOADING', true);
      try {
        const response = await axios.post('/api/user/addresses', address);
        commit('ADD_ADDRESS', response.data);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async updateAddress({ commit }, { id, ...updates }: DeliveryAddress) {
      commit('SET_LOADING', true);
      try {
        const response = await axios.put(`/api/user/addresses/${id}`, updates);
        commit('UPDATE_ADDRESS', response.data);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async deleteAddress({ commit }, addressId: number) {
      commit('SET_LOADING', true);
      try {
        await axios.delete(`/api/user/addresses/${addressId}`);
        commit('DELETE_ADDRESS', addressId);
      } finally {
        commit('SET_LOADING', false);
      }
    },

    async setDefaultAddress({ commit }, addressId: number) {
      commit('SET_LOADING', true);
      try {
        const response = await axios.put(`/api/user/addresses/${addressId}/default`);
        commit('SET_ADDRESSES', response.data);
      } finally {
        commit('SET_LOADING', false);
      }
    }
  },

  getters: {
    defaultAddress: (state) => state.addresses.find(addr => addr.isDefault),
    otherAddresses: (state) => state.addresses.filter(addr => !addr.isDefault)
  }
};

export default user;