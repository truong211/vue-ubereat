import axios from 'axios';

const state = {
  currentCoupon: null,
  appliedDiscount: 0,
  error: null,
  loading: false
};

const getters = {
  getCurrentCoupon: (state) => state.currentCoupon,
  getAppliedDiscount: (state) => state.appliedDiscount,
  getCouponError: (state) => state.error,
  isLoading: (state) => state.loading
};

const actions = {
  async validateCoupon({ commit }, code) {
    try {
      commit('SET_LOADING', true);
      commit('SET_ERROR', null);
      
      const response = await axios.post('/api/coupons/validate', { code });
      
      if (response.data.valid) {
        commit('SET_CURRENT_COUPON', response.data.coupon);
        return true;
      } else {
        commit('SET_ERROR', response.data.message);
        return false;
      }
    } catch (error) {
      commit('SET_ERROR', error.response?.data?.message || 'Error validating coupon');
      return false;
    } finally {
      commit('SET_LOADING', false);
    }
  },

  applyCouponToTotal({ commit, state }, subtotal) {
    if (!state.currentCoupon) return subtotal;

    const now = new Date();
    const couponStartDate = new Date(state.currentCoupon.startDate);
    const couponEndDate = new Date(state.currentCoupon.endDate);

    if (now < couponStartDate || now > couponEndDate) {
      commit('SET_ERROR', 'Coupon has expired');
      commit('SET_CURRENT_COUPON', null);
      commit('SET_APPLIED_DISCOUNT', 0);
      return subtotal;
    }

    let discount = 0;
    if (state.currentCoupon.type === 'percentage') {
      discount = (subtotal * state.currentCoupon.value) / 100;
    } else if (state.currentCoupon.type === 'fixed') {
      discount = state.currentCoupon.value;
    }

    // Ensure discount doesn't exceed the subtotal
    discount = Math.min(discount, subtotal);
    commit('SET_APPLIED_DISCOUNT', discount);

    return subtotal - discount;
  },

  clearCoupon({ commit }) {
    commit('SET_CURRENT_COUPON', null);
    commit('SET_APPLIED_DISCOUNT', 0);
    commit('SET_ERROR', null);
  }
};

const mutations = {
  SET_CURRENT_COUPON(state, coupon) {
    state.currentCoupon = coupon;
  },
  SET_APPLIED_DISCOUNT(state, discount) {
    state.appliedDiscount = discount;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_LOADING(state, loading) {
    state.loading = loading;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};