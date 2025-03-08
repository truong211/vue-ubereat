import axios from 'axios'

export default {
  namespaced: true,
  
  state: {
    users: [],
    restaurants: [],
    drivers: [],
    categories: [],
    promotions: [],
    stats: {
      totalOrders: 0,
      totalRevenue: 0,
      totalUsers: 0,
      totalRestaurants: 0,
      totalDrivers: 0
    },
    loading: false,
    error: null
  },
  
  mutations: {
    setLoading(state, status) {
      state.loading = status
    },
    
    setError(state, error) {
      state.error = error
    },
    
    setUsers(state, users) {
      state.users = users
    },
    
    addUser(state, user) {
      state.users.push(user)
    },
    
    updateUser(state, updatedUser) {
      const index = state.users.findIndex(user => user.id === updatedUser.id)
      if (index !== -1) {
        state.users.splice(index, 1, updatedUser)
      }
    },
    
    removeUser(state, userId) {
      state.users = state.users.filter(user => user.id !== userId)
    },
    
    setRestaurants(state, restaurants) {
      state.restaurants = restaurants
    },
    
    addRestaurant(state, restaurant) {
      state.restaurants.push(restaurant)
    },
    
    updateRestaurant(state, updatedRestaurant) {
      const index = state.restaurants.findIndex(restaurant => restaurant.id === updatedRestaurant.id)
      if (index !== -1) {
        state.restaurants.splice(index, 1, updatedRestaurant)
      }
    },
    
    removeRestaurant(state, restaurantId) {
      state.restaurants = state.restaurants.filter(restaurant => restaurant.id !== restaurantId)
    },
    
    setDrivers(state, drivers) {
      state.drivers = drivers
    },
    
    addDriver(state, driver) {
      state.drivers.push(driver)
    },
    
    updateDriver(state, updatedDriver) {
      const index = state.drivers.findIndex(driver => driver.id === updatedDriver.id)
      if (index !== -1) {
        state.drivers.splice(index, 1, updatedDriver)
      }
    },
    
    removeDriver(state, driverId) {
      state.drivers = state.drivers.filter(driver => driver.id !== driverId)
    },
    
    setCategories(state, categories) {
      state.categories = categories
    },
    
    addCategory(state, category) {
      state.categories.push(category)
    },
    
    updateCategory(state, updatedCategory) {
      const index = state.categories.findIndex(category => category.id === updatedCategory.id)
      if (index !== -1) {
        state.categories.splice(index, 1, updatedCategory)
      }
    },
    
    removeCategory(state, categoryId) {
      state.categories = state.categories.filter(category => category.id !== categoryId)
    },
    
    setPromotions(state, promotions) {
      state.promotions = promotions
    },
    
    addPromotion(state, promotion) {
      state.promotions.push(promotion)
    },
    
    updatePromotion(state, updatedPromotion) {
      const index = state.promotions.findIndex(promotion => promotion.id === updatedPromotion.id)
      if (index !== -1) {
        state.promotions.splice(index, 1, updatedPromotion)
      }
    },
    
    removePromotion(state, promotionId) {
      state.promotions = state.promotions.filter(promotion => promotion.id !== promotionId)
    },
    
    setStats(state, stats) {
      state.stats = { ...state.stats, ...stats }
    }
  },
  
  actions: {
    // User management actions
    async fetchUsers({ commit }, { page = 1, limit = 10, filter = '' } = {}) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/admin/users', {
          params: { page, limit, filter }
        })
        commit('setUsers', response.data.users)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch users'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async createUser({ commit }, userData) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.post('/api/admin/users', userData)
        commit('addUser', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to create user'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async updateUser({ commit }, { id, ...userData }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.put(`/api/admin/users/${id}`, userData)
        commit('updateUser', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to update user'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async deleteUser({ commit }, userId) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        await axios.delete(`/api/admin/users/${userId}`)
        commit('removeUser', userId)
        commit('setLoading', false)
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to delete user'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    // Restaurant management actions
    async fetchRestaurants({ commit }, { page = 1, limit = 10, filter = '' } = {}) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/admin/restaurants', {
          params: { page, limit, filter }
        })
        commit('setRestaurants', response.data.restaurants)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch restaurants'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async createRestaurant({ commit }, restaurantData) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.post('/api/admin/restaurants', restaurantData)
        commit('addRestaurant', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to create restaurant'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async updateRestaurant({ commit }, { id, ...restaurantData }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.put(`/api/admin/restaurants/${id}`, restaurantData)
        commit('updateRestaurant', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to update restaurant'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async deleteRestaurant({ commit }, restaurantId) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        await axios.delete(`/api/admin/restaurants/${restaurantId}`)
        commit('removeRestaurant', restaurantId)
        commit('setLoading', false)
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to delete restaurant'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async approveRestaurant({ commit }, restaurantId) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.put(`/api/admin/restaurants/${restaurantId}/approve`)
        commit('updateRestaurant', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to approve restaurant'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    // Driver management actions
    async fetchDrivers({ commit }, { page = 1, limit = 10, filter = '' } = {}) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/admin/drivers', {
          params: { page, limit, filter }
        })
        commit('setDrivers', response.data.drivers)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch drivers'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    // Category management actions
    async fetchCategories({ commit }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/admin/categories')
        commit('setCategories', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch categories'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async createCategory({ commit }, categoryData) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.post('/api/admin/categories', categoryData)
        commit('addCategory', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to create category'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async updateCategory({ commit }, { id, ...categoryData }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.put(`/api/admin/categories/${id}`, categoryData)
        commit('updateCategory', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to update category'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async deleteCategory({ commit }, categoryId) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        await axios.delete(`/api/admin/categories/${categoryId}`)
        commit('removeCategory', categoryId)
        commit('setLoading', false)
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to delete category'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    // Promotion management actions
    async fetchPromotions({ commit }, { page = 1, limit = 10, filter = '' } = {}) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/admin/promotions', {
          params: { page, limit, filter }
        })
        commit('setPromotions', response.data.promotions)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch promotions'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async createPromotion({ commit }, promotionData) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.post('/api/admin/promotions', promotionData)
        commit('addPromotion', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to create promotion'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async updatePromotion({ commit }, { id, ...promotionData }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.put(`/api/admin/promotions/${id}`, promotionData)
        commit('updatePromotion', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to update promotion'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    async deletePromotion({ commit }, promotionId) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        await axios.delete(`/api/admin/promotions/${promotionId}`)
        commit('removePromotion', promotionId)
        commit('setLoading', false)
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to delete promotion'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    },
    
    // Dashboard statistics
    async fetchDashboardStats({ commit }) {
      commit('setLoading', true)
      commit('setError', null)
      
      try {
        const response = await axios.get('/api/admin/stats/dashboard')
        commit('setStats', response.data)
        commit('setLoading', false)
        return response.data
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to fetch dashboard statistics'
        commit('setError', errorMsg)
        commit('setLoading', false)
        throw errorMsg
      }
    }
  },
  
  getters: {
    loading: state => state.loading,
    error: state => state.error,
    users: state => state.users,
    restaurants: state => state.restaurants,
    drivers: state => state.drivers,
    categories: state => state.categories,
    promotions: state => state.promotions,
    stats: state => state.stats,
    
    // User getters
    getUserById: state => id => {
      return state.users.find(user => user.id === id)
    },
    
    usersByRole: state => role => {
      return state.users.filter(user => user.role === role)
    },
    
    // Restaurant getters
    getRestaurantById: state => id => {
      return state.restaurants.find(restaurant => restaurant.id === id)
    },
    
    pendingRestaurants: state => {
      return state.restaurants.filter(restaurant => restaurant.status === 'pending')
    },
    
    activeRestaurants: state => {
      return state.restaurants.filter(restaurant => restaurant.status === 'active')
    },
    
    // Driver getters
    getDriverById: state => id => {
      return state.drivers.find(driver => driver.id === id)
    },
    
    activeDrivers: state => {
      return state.drivers.filter(driver => driver.isActive)
    },
    
    // Category getters
    getCategoryById: state => id => {
      return state.categories.find(category => category.id === id)
    },
    
    // Promotion getters
    getPromotionById: state => id => {
      return state.promotions.find(promotion => promotion.id === id)
    },
    
    activePromotions: state => {
      return state.promotions.filter(promotion => promotion.isActive)
    }
  }
}
