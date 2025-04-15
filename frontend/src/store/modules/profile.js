/**
 * Profile Store Module
 * Manages user profile data and preferences
 */

import axios from 'axios'

export default {
  namespaced: true,
  
  state: {
    // User profile data
    profile: null,
    
    // Saved addresses
    addresses: [],
    
    // Payment methods
    paymentMethods: [],
    
    // Order history
    orderHistory: [],
    
    // User preferences
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false,
        orderUpdates: true,
        promotions: true,
        newsletters: false
      },
      dietary: {
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        nutFree: false,
        dairyFree: false
      },
      displayCurrency: 'USD',
      language: 'en'
    },
    
    // Favorite restaurants
    favorites: [],
    
    // Loading states
    loading: {
      profile: false,
      addresses: false,
      paymentMethods: false,
      orderHistory: false,
      favorites: false
    },
    
    // Error states
    error: null
  },
  
  mutations: {
    // Profile mutations
    SET_PROFILE(state, profile) {
      // Ensure we always have a valid profile object with default values
      state.profile = {
        id: profile?.id || null,
        fullName: profile?.fullName || '',
        email: profile?.email || '',
        phone: profile?.phone || '',
        address: profile?.address || '',
        role: profile?.role || 'customer',
        status: profile?.status || 'active',
        ...profile
      }
    },
    
    UPDATE_PROFILE(state, profileData) {
      state.profile = { ...state.profile, ...profileData }
    },
    
    // Addresses mutations
    SET_ADDRESSES(state, addresses) {
      state.addresses = addresses
    },
    
    ADD_ADDRESS(state, address) {
      state.addresses.push(address)
      
      // If this is a default address, update other addresses
      if (address.isDefault) {
        state.addresses.forEach(addr => {
          if (addr.id !== address.id) {
            addr.isDefault = false
          }
        })
      }
    },
    
    UPDATE_ADDRESS(state, updatedAddress) {
      const index = state.addresses.findIndex(addr => addr.id === updatedAddress.id)
      if (index !== -1) {
        state.addresses.splice(index, 1, updatedAddress)
        
        // If this is a default address, update other addresses
        if (updatedAddress.isDefault) {
          state.addresses.forEach(addr => {
            if (addr.id !== updatedAddress.id) {
              addr.isDefault = false
            }
          })
        }
      }
    },
    
    REMOVE_ADDRESS(state, addressId) {
      state.addresses = state.addresses.filter(addr => addr.id !== addressId)
    },
    
    // Payment methods mutations
    SET_PAYMENT_METHODS(state, methods) {
      state.paymentMethods = methods
    },
    
    ADD_PAYMENT_METHOD(state, method) {
      state.paymentMethods.push(method)
      
      // If this is a default method, update other methods
      if (method.isDefault) {
        state.paymentMethods.forEach(m => {
          if (m.id !== method.id) {
            m.isDefault = false
          }
        })
      }
    },
    
    UPDATE_PAYMENT_METHOD(state, updatedMethod) {
      const index = state.paymentMethods.findIndex(m => m.id === updatedMethod.id)
      if (index !== -1) {
        state.paymentMethods.splice(index, 1, updatedMethod)
        
        // If this is a default method, update other methods
        if (updatedMethod.isDefault) {
          state.paymentMethods.forEach(m => {
            if (m.id !== updatedMethod.id) {
              m.isDefault = false
            }
          })
        }
      }
    },
    
    REMOVE_PAYMENT_METHOD(state, methodId) {
      state.paymentMethods = state.paymentMethods.filter(m => m.id !== methodId)
    },
    
    // Order history mutations
    SET_ORDER_HISTORY(state, orders) {
      state.orderHistory = orders
    },
    
    ADD_ORDER(state, order) {
      state.orderHistory.unshift(order)
    },
    
    UPDATE_ORDER(state, updatedOrder) {
      const index = state.orderHistory.findIndex(order => order.id === updatedOrder.id)
      if (index !== -1) {
        state.orderHistory.splice(index, 1, updatedOrder)
      }
    },
    
    // Preferences mutations
    SET_PREFERENCES(state, preferences) {
      state.preferences = { ...state.preferences, ...preferences }
    },
    
    UPDATE_NOTIFICATION_PREFERENCES(state, notificationSettings) {
      state.preferences.notifications = {
        ...state.preferences.notifications,
        ...notificationSettings
      }
    },
    
    UPDATE_DIETARY_PREFERENCES(state, dietarySettings) {
      state.preferences.dietary = {
        ...state.preferences.dietary,
        ...dietarySettings
      }
    },
    
    SET_DISPLAY_CURRENCY(state, currency) {
      state.preferences.displayCurrency = currency
    },
    
    SET_LANGUAGE(state, language) {
      state.preferences.language = language
    },
    
    // Favorites mutations
    SET_FAVORITES(state, favorites) {
      state.favorites = favorites
    },
    
    ADD_FAVORITE(state, restaurant) {
      state.favorites.push(restaurant)
    },
    
    REMOVE_FAVORITE(state, restaurantId) {
      state.favorites = state.favorites.filter(r => r.id !== restaurantId)
    },
    
    // Loading state mutations
    SET_LOADING(state, { key, isLoading }) {
      state.loading[key] = isLoading
    },
    
    // Error mutations
    SET_ERROR(state, error) {
      state.error = error
    },
    
    CLEAR_ERROR(state) {
      state.error = null
    }
  },
  
  actions: {
    /**
     * Fetch user profile data
     */
    async fetchProfile({ commit }) {
      commit('SET_LOADING', { key: 'profile', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.get('/api/user/profile')
        if (!response.data) {
          throw new Error('No profile data received')
        }
        commit('SET_PROFILE', response.data)
        return response.data
      } catch (error) {
        console.error('Profile fetch error:', error)
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch profile')
        // Set an empty profile with default values rather than null
        commit('SET_PROFILE', {})
        throw error
      } finally {
        commit('SET_LOADING', { key: 'profile', isLoading: false })
      }
    },
    
    /**
     * Update user profile data
     * @param {Object} profileData - Updated profile data
     */
    async updateProfile({ commit }, profileData) {
      commit('SET_LOADING', { key: 'profile', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.put('/api/user/profile', profileData)
        commit('UPDATE_PROFILE', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to update profile')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'profile', isLoading: false })
      }
    },
    
    /**
     * Update user avatar
     * @param {File} file - Avatar image file
     */
    async updateAvatar({ commit }, file) {
      commit('SET_LOADING', { key: 'profile', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const formData = new FormData()
        formData.append('avatar', file)
        
        const response = await axios.post('/api/user/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        
        commit('UPDATE_PROFILE', { avatar: response.data.avatar })
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to update avatar')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'profile', isLoading: false })
      }
    },
    
    /**
     * Fetch user addresses
     */
    async fetchAddresses({ commit }) {
      commit('SET_LOADING', { key: 'addresses', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.get('/api/user/addresses')
        commit('SET_ADDRESSES', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch addresses')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'addresses', isLoading: false })
      }
    },
    
    /**
     * Add a new address
     * @param {Object} address - Address data
     */
    async addAddress({ commit }, address) {
      commit('SET_LOADING', { key: 'addresses', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.post('/api/user/addresses', address)
        commit('ADD_ADDRESS', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to add address')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'addresses', isLoading: false })
      }
    },
    
    /**
     * Update an existing address
     * @param {Object} address - Address data with id
     */
    async updateAddress({ commit }, address) {
      commit('SET_LOADING', { key: 'addresses', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.put(`/api/user/addresses/${address.id}`, address)
        commit('UPDATE_ADDRESS', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to update address')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'addresses', isLoading: false })
      }
    },
    
    /**
     * Delete an address
     * @param {number} addressId - Address ID
     */
    async deleteAddress({ commit }, addressId) {
      commit('SET_LOADING', { key: 'addresses', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        await axios.delete(`/api/user/addresses/${addressId}`)
        commit('REMOVE_ADDRESS', addressId)
        return true
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to delete address')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'addresses', isLoading: false })
      }
    },
    
    /**
     * Set an address as default
     * @param {number} addressId - Address ID
     */
    async setDefaultAddress({ commit }, addressId) {
      commit('SET_LOADING', { key: 'addresses', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.put(`/api/user/addresses/${addressId}/default`)
        commit('UPDATE_ADDRESS', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to set default address')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'addresses', isLoading: false })
      }
    },
    
    /**
     * Fetch user payment methods
     */
    async fetchPaymentMethods({ commit }) {
      commit('SET_LOADING', { key: 'paymentMethods', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.get('/api/user/payment-methods')
        commit('SET_PAYMENT_METHODS', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch payment methods')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'paymentMethods', isLoading: false })
      }
    },
    
    /**
     * Delete a payment method
     * @param {string} paymentMethodId - Payment method ID
     */
    async deletePaymentMethod({ commit }, paymentMethodId) {
      commit('SET_LOADING', { key: 'paymentMethods', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        await axios.delete(`/api/user/payment-methods/${paymentMethodId}`)
        commit('REMOVE_PAYMENT_METHOD', paymentMethodId)
        return true
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to delete payment method')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'paymentMethods', isLoading: false })
      }
    },
    
    /**
     * Set a payment method as default
     * @param {string} paymentMethodId - Payment method ID
     */
    async setDefaultPaymentMethod({ commit }, paymentMethodId) {
      commit('SET_LOADING', { key: 'paymentMethods', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.put(`/api/user/payment-methods/${paymentMethodId}/default`)
        commit('UPDATE_PAYMENT_METHOD', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to set default payment method')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'paymentMethods', isLoading: false })
      }
    },
    
    /**
     * Fetch user order history
     * @param {Object} options - Pagination and filtering options
     */
    async fetchOrderHistory({ commit }, options = {}) {
      commit('SET_LOADING', { key: 'orderHistory', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.get('/api/user/orders', { params: options })
        commit('SET_ORDER_HISTORY', response.data.orders)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch order history')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'orderHistory', isLoading: false })
      }
    },
    
    /**
     * Fetch user preferences
     */
    async fetchPreferences({ commit }) {
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.get('/api/user/preferences')
        commit('SET_PREFERENCES', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch preferences')
        throw error
      }
    },
    
    /**
     * Update notification preferences
     * @param {Object} preferences - Notification preferences
     */
    async updateNotificationPreferences({ commit }, preferences) {
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.put('/api/user/preferences/notifications', preferences)
        commit('UPDATE_NOTIFICATION_PREFERENCES', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to update notification preferences')
        throw error
      }
    },
    
    /**
     * Update dietary preferences
     * @param {Object} preferences - Dietary preferences
     */
    async updateDietaryPreferences({ commit }, preferences) {
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.put('/api/user/preferences/dietary', preferences)
        commit('UPDATE_DIETARY_PREFERENCES', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to update dietary preferences')
        throw error
      }
    },
    
    /**
     * Fetch favorite restaurants
     */
    async fetchFavorites({ commit }) {
      commit('SET_LOADING', { key: 'favorites', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.get('/api/user/favorites')
        commit('SET_FAVORITES', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to fetch favorites')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'favorites', isLoading: false })
      }
    },
    
    /**
     * Add restaurant to favorites
     * @param {number} restaurantId - Restaurant ID
     */
    async addFavorite({ commit }, restaurantId) {
      commit('SET_LOADING', { key: 'favorites', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        const response = await axios.post(`/api/user/favorites/${restaurantId}`)
        commit('ADD_FAVORITE', response.data)
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to add favorite')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'favorites', isLoading: false })
      }
    },
    
    /**
     * Remove restaurant from favorites
     * @param {number} restaurantId - Restaurant ID
     */
    async removeFavorite({ commit }, restaurantId) {
      commit('SET_LOADING', { key: 'favorites', isLoading: true })
      commit('CLEAR_ERROR')
      
      try {
        await axios.delete(`/api/user/favorites/${restaurantId}`)
        commit('REMOVE_FAVORITE', restaurantId)
        return true
      } catch (error) {
        commit('SET_ERROR', error.response?.data?.message || 'Failed to remove favorite')
        throw error
      } finally {
        commit('SET_LOADING', { key: 'favorites', isLoading: false })
      }
    }
  },
  
  getters: {
    // Profile getters
    getProfile: state => state.profile,
    getName: state => state.profile?.name || '',
    getEmail: state => state.profile?.email || '',
    getAvatar: state => state.profile?.avatar || '',
    getPhone: state => state.profile?.phone || '',
    isProfileComplete: state => {
      if (!state.profile) return false
      return !!(state.profile.name && state.profile.email && state.profile.phone)
    },
    
    // Address getters
    getAddresses: state => state.addresses,
    getDefaultAddress: state => state.addresses.find(addr => addr.isDefault) || state.addresses[0],
    hasAddresses: state => state.addresses.length > 0,
    
    // Payment method getters
    getPaymentMethods: state => state.paymentMethods,
    getDefaultPaymentMethod: state => state.paymentMethods.find(m => m.isDefault) || state.paymentMethods[0],
    hasPaymentMethods: state => state.paymentMethods.length > 0,
    
    // Order history getters
    getOrderHistory: state => state.orderHistory,
    getRecentOrders: state => state.orderHistory.slice(0, 5),
    
    // Preferences getters
    getPreferences: state => state.preferences,
    getNotificationPreferences: state => state.preferences.notifications,
    getDietaryPreferences: state => state.preferences.dietary,
    getDisplayCurrency: state => state.preferences.displayCurrency,
    getLanguage: state => state.preferences.language,
    
    // Favorites getters
    getFavorites: state => state.favorites,
    isFavorite: state => restaurantId => state.favorites.some(r => r.id === restaurantId),
    
    // Loading state getters
    isLoading: state => key => state.loading[key],
    
    // Error getters
    getError: state => state.error
  }
}
