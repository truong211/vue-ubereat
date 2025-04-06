import productService from '@/services/product.service';

const state = {
  products: [],
  product: null,
  popularProducts: [],
  recommendedProducts: [],
  loading: false,
  error: null,
  totalProducts: 0,
  totalPages: 1,
  currentPage: 1
};

const getters = {
  getProducts: state => state.products,
  getProduct: state => state.product,
  getPopularProducts: state => state.popularProducts,
  getRecommendedProducts: state => state.recommendedProducts,
  isLoading: state => state.loading,
  getError: state => state.error,
  getTotalProducts: state => state.totalProducts,
  getTotalPages: state => state.totalPages,
  getCurrentPage: state => state.currentPage
};

const actions = {
  // Fetch products with filters
  async fetchProducts({ commit }, params = {}) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await productService.getProducts(params);
      const { products, count, totalPages, currentPage } = response.data.data;
      
      commit('SET_PRODUCTS', products || []);
      commit('SET_TOTAL_PRODUCTS', count || 0);
      commit('SET_TOTAL_PAGES', totalPages || 1);
      commit('SET_CURRENT_PAGE', currentPage || 1);
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching products:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch products');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch a single product by ID
  async fetchProduct({ commit }, productId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await productService.getProductById(productId);
      commit('SET_PRODUCT', response.data.data.product || null);
      return response.data.data.product;
    } catch (error) {
      console.error('Error fetching product:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch product');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch product details with options
  async fetchProductDetails({ commit }, productId) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await productService.getProductDetails(productId);
      commit('SET_PRODUCT', response.data.data.product || null);
      return response.data.data.product;
    } catch (error) {
      console.error('Error fetching product details:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch product details');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch popular products
  async fetchPopularProducts({ commit }, params = {}) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await productService.getPopularProducts(params);
      commit('SET_POPULAR_PRODUCTS', response.data.data.products || []);
      return response.data.data.products;
    } catch (error) {
      console.error('Error fetching popular products:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch popular products');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch recommended products
  async fetchRecommendedProducts({ commit }, params = {}) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await productService.getRecommendedProducts(params);
      commit('SET_RECOMMENDED_PRODUCTS', response.data.data.products || []);
      return response.data.data.products;
    } catch (error) {
      console.error('Error fetching recommended products:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch recommended products');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Search products
  async searchProducts({ commit }, { query, params = {} }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await productService.searchProducts(query, params);
      const { products, count, totalPages, currentPage } = response.data.data;
      
      commit('SET_PRODUCTS', products || []);
      commit('SET_TOTAL_PRODUCTS', count || 0);
      commit('SET_TOTAL_PAGES', totalPages || 1);
      commit('SET_CURRENT_PAGE', currentPage || 1);
      
      return response.data.data;
    } catch (error) {
      console.error('Error searching products:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to search products');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch products by category
  async fetchProductsByCategory({ commit }, { categoryId, params = {} }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await productService.getProductsByCategory(categoryId, params);
      const { products, count, totalPages, currentPage } = response.data.data;
      
      commit('SET_PRODUCTS', products || []);
      commit('SET_TOTAL_PRODUCTS', count || 0);
      commit('SET_TOTAL_PAGES', totalPages || 1);
      commit('SET_CURRENT_PAGE', currentPage || 1);
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching products by category:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch products by category');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  },
  
  // Fetch products by restaurant
  async fetchProductsByRestaurant({ commit }, { restaurantId, params = {} }) {
    commit('SET_LOADING', true);
    commit('SET_ERROR', null);
    
    try {
      const response = await productService.getProductsByRestaurant(restaurantId, params);
      const { products, count, totalPages, currentPage } = response.data.data;
      
      commit('SET_PRODUCTS', products || []);
      commit('SET_TOTAL_PRODUCTS', count || 0);
      commit('SET_TOTAL_PAGES', totalPages || 1);
      commit('SET_CURRENT_PAGE', currentPage || 1);
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching products by restaurant:', error);
      commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch products by restaurant');
      throw error;
    } finally {
      commit('SET_LOADING', false);
    }
  }
};

const mutations = {
  SET_PRODUCTS(state, products) {
    state.products = products;
  },
  SET_PRODUCT(state, product) {
    state.product = product;
  },
  SET_POPULAR_PRODUCTS(state, products) {
    state.popularProducts = products;
  },
  SET_RECOMMENDED_PRODUCTS(state, products) {
    state.recommendedProducts = products;
  },
  SET_LOADING(state, status) {
    state.loading = status;
  },
  SET_ERROR(state, error) {
    state.error = error;
  },
  SET_TOTAL_PRODUCTS(state, count) {
    state.totalProducts = count;
  },
  SET_TOTAL_PAGES(state, pages) {
    state.totalPages = pages;
  },
  SET_CURRENT_PAGE(state, page) {
    state.currentPage = page;
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}; 