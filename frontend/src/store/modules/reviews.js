import axios from 'axios'

export default {
  state: {
    restaurantReviews: {},  // Store reviews by restaurantId
    menuItemReviews: {},    // Store reviews by menuItemId
    userReviews: [],        // Reviews created by the current user
    loading: false,
    error: null
  },
  
  mutations: {
    SET_RESTAURANT_REVIEWS(state, { restaurantId, reviews }) {
      state.restaurantReviews = {
        ...state.restaurantReviews,
        [restaurantId]: reviews
      }
    },
    
    SET_MENU_ITEM_REVIEWS(state, { menuItemId, reviews }) {
      state.menuItemReviews = {
        ...state.menuItemReviews,
        [menuItemId]: reviews
      }
    },
    
    SET_USER_REVIEWS(state, reviews) {
      state.userReviews = reviews
    },
    
    ADD_RESTAURANT_REVIEW(state, { restaurantId, review }) {
      if (!state.restaurantReviews[restaurantId]) {
        state.restaurantReviews[restaurantId] = []
      }
      state.restaurantReviews[restaurantId].unshift(review)
      state.userReviews.unshift(review)
    },
    
    ADD_MENU_ITEM_REVIEW(state, { menuItemId, review }) {
      if (!state.menuItemReviews[menuItemId]) {
        state.menuItemReviews[menuItemId] = []
      }
      state.menuItemReviews[menuItemId].unshift(review)
      state.userReviews.unshift(review)
    },
    
    UPDATE_REVIEW(state, { reviewId, updates }) {
      // Update review in restaurantReviews
      Object.keys(state.restaurantReviews).forEach(restaurantId => {
        const review = state.restaurantReviews[restaurantId].find(r => r.id === reviewId)
        if (review) {
          Object.assign(review, updates)
        }
      })
      
      // Update review in menuItemReviews
      Object.keys(state.menuItemReviews).forEach(menuItemId => {
        const review = state.menuItemReviews[menuItemId].find(r => r.id === reviewId)
        if (review) {
          Object.assign(review, updates)
        }
      })
      
      // Update review in userReviews
      const userReview = state.userReviews.find(r => r.id === reviewId)
      if (userReview) {
        Object.assign(userReview, updates)
      }
    },
    
    DELETE_REVIEW(state, { reviewId, itemType, itemId }) {
      if (itemType === 'restaurant') {
        state.restaurantReviews[itemId] = state.restaurantReviews[itemId].filter(
          review => review.id !== reviewId
        )
      } else if (itemType === 'menuItem') {
        state.menuItemReviews[itemId] = state.menuItemReviews[itemId].filter(
          review => review.id !== reviewId
        )
      }
      
      state.userReviews = state.userReviews.filter(review => review.id !== reviewId)
    },
    
    SET_LOADING(state, loading) {
      state.loading = loading
    },
    
    SET_ERROR(state, error) {
      state.error = error
    }
  },
  
  actions: {
    // Fetch reviews for a restaurant
    async fetchRestaurantReviews({ commit, state }, restaurantId) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        const response = await axios.get(`/api/restaurants/${restaurantId}/reviews`)
        const reviews = response.data
        
        commit('SET_RESTAURANT_REVIEWS', { restaurantId, reviews })
        commit('SET_LOADING', false)
        
        return reviews
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch restaurant reviews')
        commit('SET_LOADING', false)
        throw error
      }
    },
    
    // Fetch reviews for a menu item
    async fetchMenuItemReviews({ commit, state }, { restaurantId, menuItemId }) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        const response = await axios.get(`/api/restaurants/${restaurantId}/menu-items/${menuItemId}/reviews`)
        const reviews = response.data
        
        commit('SET_MENU_ITEM_REVIEWS', { menuItemId, reviews })
        commit('SET_LOADING', false)
        
        return reviews
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch menu item reviews')
        commit('SET_LOADING', false)
        throw error
      }
    },
    
    // Fetch reviews created by the current user
    async fetchUserReviews({ commit }) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        const response = await axios.get('/api/user/reviews')
        const reviews = response.data
        
        commit('SET_USER_REVIEWS', reviews)
        commit('SET_LOADING', false)
        
        return reviews
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to fetch user reviews')
        commit('SET_LOADING', false)
        throw error
      }
    },
    
    // Submit a review for a restaurant
    async submitRestaurantReview({ commit }, { restaurantId, rating, comment }) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        const response = await axios.post(`/api/restaurants/${restaurantId}/reviews`, {
          rating,
          comment
        })
        
        const review = response.data
        
        commit('ADD_RESTAURANT_REVIEW', { restaurantId, review })
        commit('SET_LOADING', false)
        
        return review
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to submit restaurant review')
        commit('SET_LOADING', false)
        throw error
      }
    },
    
    // Submit a review for a menu item
    async submitMenuItemReview({ commit }, { restaurantId, menuItemId, rating, comment }) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        const response = await axios.post(`/api/restaurants/${restaurantId}/menu-items/${menuItemId}/reviews`, {
          rating,
          comment
        })
        
        const review = response.data
        
        commit('ADD_MENU_ITEM_REVIEW', { menuItemId, review })
        commit('SET_LOADING', false)
        
        return review
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to submit menu item review')
        commit('SET_LOADING', false)
        throw error
      }
    },
    
    // Update a review
    async updateReview({ commit }, { reviewId, itemType, itemId, rating, comment }) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        let endpoint = ''
        if (itemType === 'restaurant') {
          endpoint = `/api/restaurants/${itemId}/reviews/${reviewId}`
        } else if (itemType === 'menuItem') {
          endpoint = `/api/restaurants/${itemId.split('_')[0]}/menu-items/${itemId.split('_')[1]}/reviews/${reviewId}`
        }
        
        const response = await axios.put(endpoint, {
          rating,
          comment
        })
        
        const updatedReview = response.data
        
        commit('UPDATE_REVIEW', { reviewId, updates: updatedReview })
        commit('SET_LOADING', false)
        
        return updatedReview
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to update review')
        commit('SET_LOADING', false)
        throw error
      }
    },
    
    // Delete a review
    async deleteReview({ commit }, { reviewId, itemType, itemId }) {
      try {
        commit('SET_LOADING', true)
        commit('SET_ERROR', null)
        
        let endpoint = ''
        if (itemType === 'restaurant') {
          endpoint = `/api/restaurants/${itemId}/reviews/${reviewId}`
        } else if (itemType === 'menuItem') {
          endpoint = `/api/restaurants/${itemId.split('_')[0]}/menu-items/${itemId.split('_')[1]}/reviews/${reviewId}`
        }
        
        await axios.delete(endpoint)
        
        commit('DELETE_REVIEW', { reviewId, itemType, itemId })
        commit('SET_LOADING', false)
        
        return true
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to delete review')
        commit('SET_LOADING', false)
        throw error
      }
    },
    
    // Add like to a review
    async addReviewLike({ commit }, { reviewId, itemType, itemId }) {
      try {
        commit('SET_ERROR', null)
        
        let endpoint = ''
        if (itemType === 'restaurant') {
          endpoint = `/api/restaurants/${itemId}/reviews/${reviewId}/like`
        } else if (itemType === 'menuItem') {
          endpoint = `/api/restaurants/${itemId.split('_')[0]}/menu-items/${itemId.split('_')[1]}/reviews/${reviewId}/like`
        }
        
        const response = await axios.post(endpoint)
        
        // Update the review with the new like count
        const updates = {
          likes: response.data.likes,
          userLiked: true,
          userDisliked: false
        }
        
        commit('UPDATE_REVIEW', { reviewId, updates })
        
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to like review')
        throw error
      }
    },
    
    // Remove like from a review
    async removeReviewLike({ commit }, { reviewId, itemType, itemId }) {
      try {
        commit('SET_ERROR', null)
        
        let endpoint = ''
        if (itemType === 'restaurant') {
          endpoint = `/api/restaurants/${itemId}/reviews/${reviewId}/like`
        } else if (itemType === 'menuItem') {
          endpoint = `/api/restaurants/${itemId.split('_')[0]}/menu-items/${itemId.split('_')[1]}/reviews/${reviewId}/like`
        }
        
        const response = await axios.delete(endpoint)
        
        // Update the review with the new like count
        const updates = {
          likes: response.data.likes,
          userLiked: false
        }
        
        commit('UPDATE_REVIEW', { reviewId, updates })
        
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to remove like from review')
        throw error
      }
    },
    
    // Add dislike to a review
    async addReviewDislike({ commit }, { reviewId, itemType, itemId }) {
      try {
        commit('SET_ERROR', null)
        
        let endpoint = ''
        if (itemType === 'restaurant') {
          endpoint = `/api/restaurants/${itemId}/reviews/${reviewId}/dislike`
        } else if (itemType === 'menuItem') {
          endpoint = `/api/restaurants/${itemId.split('_')[0]}/menu-items/${itemId.split('_')[1]}/reviews/${reviewId}/dislike`
        }
        
        const response = await axios.post(endpoint)
        
        // Update the review with the new dislike count
        const updates = {
          dislikes: response.data.dislikes,
          userDisliked: true,
          userLiked: false
        }
        
        commit('UPDATE_REVIEW', { reviewId, updates })
        
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to dislike review')
        throw error
      }
    },
    
    // Remove dislike from a review
    async removeReviewDislike({ commit }, { reviewId, itemType, itemId }) {
      try {
        commit('SET_ERROR', null)
        
        let endpoint = ''
        if (itemType === 'restaurant') {
          endpoint = `/api/restaurants/${itemId}/reviews/${reviewId}/dislike`
        } else if (itemType === 'menuItem') {
          endpoint = `/api/restaurants/${itemId.split('_')[0]}/menu-items/${itemId.split('_')[1]}/reviews/${reviewId}/dislike`
        }
        
        const response = await axios.delete(endpoint)
        
        // Update the review with the new dislike count
        const updates = {
          dislikes: response.data.dislikes,
          userDisliked: false
        }
        
        commit('UPDATE_REVIEW', { reviewId, updates })
        
        return response.data
      } catch (error) {
        commit('SET_ERROR', error.message || 'Failed to remove dislike from review')
        throw error
      }
    }
  },
  
  getters: {
    getRestaurantReviews: (state) => (restaurantId) => {
      return state.restaurantReviews[restaurantId] || []
    },
    
    getMenuItemReviews: (state) => (menuItemId) => {
      return state.menuItemReviews[menuItemId] || []
    },
    
    getUserReviews: (state) => {
      return state.userReviews
    },
    
    getReviewsLoading: (state) => {
      return state.loading
    },
    
    getReviewsError: (state) => {
      return state.error
    }
  }
} 