import productService from '@/services/product.service';

const state = {
  featuredProducts: [],
  allProducts: [],
  currentProduct: null,
  loading: false,
  error: null
};

const getters = {
  featuredProducts: state => state.featuredProducts,
  allProducts: state => state.allProducts,
  currentProduct: state => state.currentProduct,
  isLoading: state => state.loading,
  error: state => state.error
};

const actions = {
  async fetchFeaturedProducts({ commit }) {
    try {
      commit('setProductsLoading', true);
      const response = await productService.getProducts({
        limit: 8,
        sort: 'popular',
        onSale: true
      });
      commit('setFeaturedProducts', response.data || []);
      return response.data || [];
    } catch (error) {
      commit('setProductsError', error.message);
      return [];
    } finally {
      commit('setProductsLoading', false);
    }
  },

  async fetchProducts({ commit }, params) {
    try {
      commit('setProductsLoading', true);
      const response = await productService.getProducts(params);
      commit('setAllProducts', response.data || []);
      return response.data || [];
    } catch (error) {
      commit('setProductsError', error.message);
      return [];
    } finally {
      commit('setProductsLoading', false);
    }
  },

  setCurrentProduct({ commit }, product) {
    commit('setCurrentProduct', product);
  }
};

const mutations = {
  setFeaturedProducts(state, products) {
    state.featuredProducts = products;
    state.error = null;
  },
  setAllProducts(state, products) {
    state.allProducts = products;
    state.error = null;
  },
  setCurrentProduct(state, product) {
    state.currentProduct = product;
  },
  setProductsLoading(state, loading) {
    state.loading = loading;
  },
  setProductsError(state, error) {
    state.error = error;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};