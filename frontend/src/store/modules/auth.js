import axios from 'axios'
import socialAuth from '@/services/social-auth'

export default {
  state: {
    status: '',
    token: localStorage.getItem('token') || '',
    user: JSON.parse(localStorage.getItem('user')) || null,
    verificationId: null,
    loading: false,
    error: null
  },

  mutations: {
    AUTH_REQUEST(state) {
      state.status = 'loading'
      state.loading = true
      state.error = null
    },
    
    AUTH_SUCCESS(state, { token, user }) {
      state.status = 'success'
      state.token = token
      state.user = user
      state.loading = false
      state.error = null
    },
    
    AUTH_ERROR(state, error) {
      state.status = 'error'
      state.loading = false
      state.error = error
    },
    
    SET_VERIFICATION_ID(state, id) {
      state.verificationId = id
    },
    
    UPDATE_USER_PROFILE(state, userData) {
      state.user = { ...state.user, ...userData }
    },
    
    LOGOUT(state) {
      state.status = ''
      state.token = ''
      state.user = null
    }
  },

  actions: {
    login({ commit }, { type, credentials }) {
      commit('AUTH_REQUEST')
      
      return new Promise(async (resolve, reject) => {
        try {
          let socialCredentials = null
          let endpoint = ''
          
          // Handle different login types
          switch (type) {
            case 'email':
              endpoint = '/api/auth/login/email'
              break
              
            case 'google':
              // Get Google credentials using social auth service
              socialCredentials = await socialAuth.signInWithGoogle()
              endpoint = '/api/auth/login/google'
              credentials = socialCredentials
              break
              
            case 'facebook':
              // Get Facebook credentials using social auth service
              socialCredentials = await socialAuth.signInWithFacebook()
              endpoint = '/api/auth/login/facebook'
              credentials = socialCredentials
              break
              
            default:
              commit('AUTH_ERROR', 'Invalid login type')
              reject('Invalid login type')
              return
          }
          
          // Send credentials to backend
          const response = await axios.post(endpoint, credentials)
          const { token, user } = response.data
          
          // Store token and user data
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          
          // Set auth header for all future requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          commit('AUTH_SUCCESS', { token, user })
          resolve(response)
        } catch (err) {
          const errorMsg = err.response?.data?.message || err.message || 'Authentication failed'
          commit('AUTH_ERROR', errorMsg)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          reject(errorMsg)
        }
      })
    },

    register({ commit }, userData) {
      commit('AUTH_REQUEST')
      
      return new Promise((resolve, reject) => {
        axios.post('/api/auth/register', userData)
          .then(response => {
            const { token, user } = response.data
            
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            
            commit('AUTH_SUCCESS', { token, user })
            resolve(response)
          })
          .catch(err => {
            const errorMsg = err.response?.data?.message || 'Registration failed'
            commit('AUTH_ERROR', errorMsg)
            reject(errorMsg)
          })
      })
    },

    requestPhoneVerification({ commit }, phoneNumber) {
      commit('AUTH_REQUEST')
      
      return new Promise((resolve, reject) => {
        axios.post('/api/auth/phone/request', { phoneNumber })
          .then(response => {
            commit('SET_VERIFICATION_ID', response.data.verificationId)
            commit('AUTH_REQUEST')
            resolve(response)
          })
          .catch(err => {
            const errorMsg = err.response?.data?.message || 'Phone verification request failed'
            commit('AUTH_ERROR', errorMsg)
            reject(errorMsg)
          })
      })
    },

    verifyPhoneCode({ commit, state }, verificationCode) {
      commit('AUTH_REQUEST')
      
      return new Promise((resolve, reject) => {
        if (!state.verificationId) {
          const errorMsg = 'No verification in progress'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
          return
        }
        
        axios.post('/api/auth/phone/verify', { 
          verificationId: state.verificationId, 
          code: verificationCode 
        })
          .then(response => {
            const { token, user } = response.data
            
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            
            commit('AUTH_SUCCESS', { token, user })
            commit('SET_VERIFICATION_ID', null)
            resolve(response)
          })
          .catch(err => {
            const errorMsg = err.response?.data?.message || 'Phone verification failed'
            commit('AUTH_ERROR', errorMsg)
            reject(errorMsg)
          })
      })
    },
    
    requestPasswordReset({ commit }, email) {
      return new Promise((resolve, reject) => {
        axios.post('/api/auth/password/request-reset', { email })
          .then(response => {
            resolve(response)
          })
          .catch(err => {
            const errorMsg = err.response?.data?.message || 'Password reset request failed'
            reject(errorMsg)
          })
      })
    },
    
    resetPassword({ commit }, { token, newPassword }) {
      return new Promise((resolve, reject) => {
        axios.post('/api/auth/password/reset', { token, newPassword })
          .then(response => {
            resolve(response)
          })
          .catch(err => {
            const errorMsg = err.response?.data?.message || 'Password reset failed'
            reject(errorMsg)
          })
      })
    },
    
    updateProfile({ commit }, userData) {
      return new Promise((resolve, reject) => {
        axios.put('/api/user/profile', userData)
          .then(response => {
            const updatedUser = response.data
            localStorage.setItem('user', JSON.stringify(updatedUser))
            commit('UPDATE_USER_PROFILE', updatedUser)
            resolve(response)
          })
          .catch(err => {
            const errorMsg = err.response?.data?.message || 'Profile update failed'
            reject(errorMsg)
          })
      })
    },
    
    loadUser({ commit }) {
      return new Promise((resolve, reject) => {
        // Skip if no token
        const token = localStorage.getItem('token')
        if (!token) {
          reject('No auth token')
          return
        }
        
        // Set auth header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        
        axios.get('/api/user/profile')
          .then(response => {
            const user = response.data
            localStorage.setItem('user', JSON.stringify(user))
            commit('AUTH_SUCCESS', { token, user })
            resolve(user)
          })
          .catch(err => {
            // Token might be invalid or expired
            commit('LOGOUT')
            localStorage.removeItem('token')
            localStorage.removeItem('user')
            delete axios.defaults.headers.common['Authorization']
            reject(err)
          })
      })
    },

    logout({ commit }) {
      return new Promise((resolve) => {
        commit('LOGOUT')
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete axios.defaults.headers.common['Authorization']
        resolve()
      })
    }
  },
  
  getters: {
    isAuthenticated: state => !!state.token,
    authStatus: state => state.status,
    user: state => state.user,
    isRestaurantOwner: state => state.user?.role === 'restaurant',
    isAdmin: state => state.user?.role === 'admin',
    isDriver: state => state.user?.role === 'driver',
    loading: state => state.loading,
    error: state => state.error,
    token: state => state.token
  }
}
