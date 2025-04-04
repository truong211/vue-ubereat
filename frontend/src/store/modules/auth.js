import axios from 'axios'
import router from '@/router'
import { clearAuthStorage } from '@/config'

const state = {
  token: localStorage.getItem('token') || '',
  refreshToken: localStorage.getItem('refresh_token') || '',
  user: JSON.parse(localStorage.getItem('user')) || null,
  verificationId: null,
  loading: false,
  error: null,
  otpData: {
    verificationId: null,
    email: null,
    phone: null
  },
  verificationStep: 1  // 1: initial, 2: OTP verification, 3: success
}

const mutations = {
  AUTH_REQUEST(state) {
    state.loading = true
    state.error = null
  },
  
  AUTH_SUCCESS(state, { token, user }) {
    state.token = token
    state.user = user
    state.loading = false
    state.error = null
  },
  
  AUTH_ERROR(state, error) {
    state.loading = false
    state.error = error
  },
  
  SET_VERIFICATION_ID(state, id) {
    state.verificationId = id
  },
  
  SET_OTP_DATA(state, data) {
    state.otpData = { ...state.otpData, ...data }
  },
  
  SET_VERIFICATION_STEP(state, step) {
    state.verificationStep = step
  },
  
  UPDATE_USER_PROFILE(state, userData) {
    state.user = { 
      ...state.user, 
      ...userData 
    }
    
    localStorage.setItem('user', JSON.stringify(state.user))
  },
  
  LOGOUT(state) {
    state.token = ''
    state.user = null
    state.verificationId = null
    state.otpData = {
      verificationId: null,
      email: null,
      phone: null
    }
    state.verificationStep = 1
  },

  CLEAR_AUTH(state) {
    state.token = ''
    state.user = null
    state.verificationId = null
    state.otpData = {
      verificationId: null,
      email: null,
      phone: null
    }
    state.verificationStep = 1
    state.loading = false
    state.error = null
  },
  
  SET_TOKENS(state, { accessToken, refreshToken }) {
    state.token = accessToken
    state.refreshToken = refreshToken
  }
}

const actions = {
  // Login with email and password
  login({ commit }, { email, password }) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post('/api/auth/login', { email, password })
        .then(response => {
          const { token, refreshToken, user } = response.data
          
          localStorage.setItem('token', token)
          localStorage.setItem('refresh_token', refreshToken)
          localStorage.setItem('user', JSON.stringify(user))
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          commit('AUTH_SUCCESS', { token, user })
          commit('SET_TOKENS', { accessToken: token, refreshToken })
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'Login failed'
          commit('AUTH_ERROR', errorMsg)
          localStorage.removeItem('token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
          reject(errorMsg)
        })
    })
  },

  // Register a new user
  register({ commit, dispatch }, userData) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post('/api/auth/register', userData)
        .then(response => {
          // If verification is required, set the verification data
          if (response.data.verificationRequired) {
            commit('SET_OTP_DATA', {
              email: userData.email,
              phone: userData.phone,
              verificationId: response.data.verificationId
            })
            commit('SET_VERIFICATION_STEP', 2)
            resolve(response.data)
          } else {
            // Otherwise proceed with direct login if token provided
            const { token, user } = response.data
            
            if (token && user) {
              localStorage.setItem('token', token)
              localStorage.setItem('user', JSON.stringify(user))
              
              axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
              
              commit('AUTH_SUCCESS', { token, user })
            } else {
              // Just clear any loading state if no token provided
              commit('AUTH_ERROR', null)
            }
            
            resolve(response.data)
          }
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'Registration failed'
          commit('AUTH_ERROR', errorMsg)
          reject(err.response?.data || err)
        })
    })
  },

  // Verify email with OTP
  verifyEmailOTP({ commit, state }, otp) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post('/api/auth/verify-email-otp', { 
        verificationId: state.otpData.verificationId,
        email: state.otpData.email, 
        otp 
      })
        .then(response => {
          if (response.data.token && response.data.user) {
            const { token, user } = response.data
            
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            
            commit('AUTH_SUCCESS', { token, user })
            commit('SET_VERIFICATION_STEP', 3)
          } else {
            commit('SET_VERIFICATION_STEP', 3)
          }
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'OTP verification failed'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
        })
    })
  },

  // Verify phone with OTP
  verifyPhoneOTP({ commit, state }, otp) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post('/api/auth/verify-phone-otp', { 
        verificationId: state.otpData.verificationId,
        phone: state.otpData.phone, 
        otp 
      })
        .then(response => {
          if (response.data.token && response.data.user) {
            const { token, user } = response.data
            
            localStorage.setItem('token', token)
            localStorage.setItem('user', JSON.stringify(user))
            
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
            
            commit('AUTH_SUCCESS', { token, user })
            commit('SET_VERIFICATION_STEP', 3)
          } else {
            commit('SET_VERIFICATION_STEP', 3)
          }
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'OTP verification failed'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
        })
    })
  },

  // Resend OTP for email verification
  resendEmailOTP({ commit, state }) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post('/api/auth/resend-email-otp', { 
        email: state.otpData.email
      })
        .then(response => {
          commit('SET_OTP_DATA', {
            verificationId: response.data.verificationId
          })
          commit('AUTH_ERROR', null)
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'Failed to resend OTP'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
        })
    })
  },

  // Resend OTP for phone verification
  resendPhoneOTP({ commit, state }) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post('/api/auth/resend-phone-otp', { 
        phone: state.otpData.phone
      })
        .then(response => {
          commit('SET_OTP_DATA', {
            verificationId: response.data.verificationId
          })
          commit('AUTH_ERROR', null)
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'Failed to resend OTP'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
        })
    })
  },

  // Request password reset
  requestPasswordReset({ commit }, email) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post('/api/auth/password/request-reset', { email })
        .then(response => {
          commit('AUTH_ERROR', null)
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'Password reset request failed'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
        })
    })
  },

  // Verify reset token and OTP
  verifyResetToken({ commit }, { token, otp }) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post('/api/auth/password/verify-reset', { token, otp })
        .then(response => {
          commit('AUTH_ERROR', null)
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'Verification failed'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
        })
    })
  },

  // Reset password
  resetPassword({ commit }, { token, otp, newPassword }) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post('/api/auth/password/reset', { token, otp, newPassword })
        .then(response => {
          commit('AUTH_ERROR', null)
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'Password reset failed'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
        })
    })
  },

  // Update user profile
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

  // Login with social providers
  loginWithSocial({ commit }, { provider, accessToken }) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post(`/api/auth/login/${provider}`, { accessToken })
        .then(response => {
          const { token, user } = response.data
          
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          commit('AUTH_SUCCESS', { token, user })
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'Social login failed'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
        })
    })
  },

  // Load user profile
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

  // Logout user
  logout({ commit }) {
    return new Promise((resolve) => {
      commit('LOGOUT')
      clearAuthStorage()
      delete axios.defaults.headers.common['Authorization']
      router.push('/login')
      resolve()
    })
  },

  // Verify email with token (typically from email link)
  verifyEmail({ commit }, { token }) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.get(`/api/auth/verify-email/${token}`)
        .then(response => {
          commit('AUTH_ERROR', null)
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'Email verification failed'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
        })
    })
  },
  
  // Resend verification email
  resendVerificationEmail({ commit }, { email }) {
    commit('AUTH_REQUEST')
    
    return new Promise((resolve, reject) => {
      axios.post('/api/auth/resend-verification-email', { email })
        .then(response => {
          commit('AUTH_ERROR', null)
          resolve(response.data)
        })
        .catch(err => {
          const errorMsg = err.response?.data?.message || 'Failed to resend verification email'
          commit('AUTH_ERROR', errorMsg)
          reject(errorMsg)
        })
    })
  },
  
  // Check authentication status - useful for app initialization
  checkAuth({ dispatch, commit }) {
    return new Promise((resolve) => {
      // Check for token in localStorage
      const token = localStorage.getItem('token')
      if (!token) {
        commit('LOGOUT')
        resolve(false)
        return
      }
      
      // Set auth header and try to load user
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      
      dispatch('loadUser')
        .then(() => {
          resolve(true)
        })
        .catch(() => {
          // If loadUser fails, clear auth state
          commit('LOGOUT')
          clearAuthStorage()
          delete axios.defaults.headers.common['Authorization']
          resolve(false)
        })
    })
  },

  // Update user profile data
  updateUser({ commit }, userData) {
    return new Promise((resolve) => {
      // Update user data in Vuex store
      commit('UPDATE_USER_PROFILE', userData)
      
      // Return the updated user
      resolve(userData)
    })
  }
}

const getters = {
  isAuthenticated: state => !!state.token,
  user: state => state.user,
  loading: state => state.loading,
  error: state => state.error,
  verificationStep: state => state.verificationStep,
  otpData: state => state.otpData,
  isAdmin: state => state.user?.role === 'admin',
  isRestaurant: state => state.user?.role === 'restaurant',
  isDriver: state => state.user?.role === 'driver',
  isCustomer: state => state.user?.role === 'customer'
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
