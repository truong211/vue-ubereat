/**
 * UI Store Module
 * Handles global UI state such as loaders, snackbars, and theme settings
 */

export default {
  namespaced: true,
  
  state: {
    // Global loading state
    loading: {
      global: false,
      page: false,
      components: new Map() // Track loading state for specific components
    },
    
    // Global snackbar
    snackbar: {
      show: false,
      text: '',
      color: 'info', // 'success', 'info', 'warning', 'error'
      timeout: 3000,
      location: 'bottom' // 'top', 'bottom', 'left', 'right', etc.
    },
    
    // Confirmation dialog
    confirm: {
      show: false,
      title: '',
      message: '',
      confirmButton: 'Confirm',
      cancelButton: 'Cancel',
      confirmColor: 'primary',
      callback: null
    },
    
    // Theme and appearance settings
    theme: {
      dark: false,
      primaryColor: 'primary',
      density: 'default' // 'default', 'comfortable', 'compact'
    },
    
    // Screen size and responsiveness
    screen: {
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth < 768,
      size: 'md' // 'xs', 'sm', 'md', 'lg', 'xl'
    },
    
    // Scroll position
    scroll: {
      position: 0,
      direction: 'down' // 'up' or 'down'
    }
  },
  
  mutations: {
    // Loading state mutations
    START_PAGE_LOADING(state) {
      state.loading.page = true
    },
    
    END_PAGE_LOADING(state) {
      state.loading.page = false
    },
    
    SET_GLOBAL_LOADING(state, loading) {
      state.loading.global = loading
    },
    
    SET_COMPONENT_LOADING(state, { component, loading }) {
      state.loading.components.set(component, loading)
    },
    
    // Snackbar mutations
    SHOW_SNACKBAR(state, { text, color, timeout, location }) {
      state.snackbar = {
        show: true,
        text: text || 'Operation completed',
        color: color || 'info',
        timeout: timeout !== undefined ? timeout : 3000,
        location: location || 'bottom'
      }
    },
    
    HIDE_SNACKBAR(state) {
      state.snackbar.show = false
    },
    
    // Confirmation dialog mutations
    SHOW_CONFIRM(state, options) {
      state.confirm = {
        show: true,
        title: options.title || 'Confirm',
        message: options.message || 'Are you sure you want to proceed?',
        confirmButton: options.confirmButton || 'Confirm',
        cancelButton: options.cancelButton || 'Cancel',
        confirmColor: options.confirmColor || 'primary',
        callback: options.callback || null
      }
    },
    
    HIDE_CONFIRM(state) {
      state.confirm.show = false
    },
    
    // Theme mutations
    SET_THEME_DARK(state, isDark) {
      state.theme.dark = isDark
      
      // Save to localStorage
      localStorage.setItem('theme_dark', isDark)
      
      // Apply theme to HTML element
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
      
      // If using Vuetify, you would set the theme there too
    },
    
    SET_PRIMARY_COLOR(state, color) {
      state.theme.primaryColor = color
      localStorage.setItem('theme_primary_color', color)
    },
    
    SET_DENSITY(state, density) {
      state.theme.density = density
      localStorage.setItem('theme_density', density)
    },
    
    // Screen mutations
    UPDATE_SCREEN_SIZE(state, { width, height }) {
      state.screen.width = width
      state.screen.height = height
      state.screen.isMobile = width < 768
      
      // Determine size category
      if (width < 600) {
        state.screen.size = 'xs'
      } else if (width < 960) {
        state.screen.size = 'sm'
      } else if (width < 1280) {
        state.screen.size = 'md'
      } else if (width < 1920) {
        state.screen.size = 'lg'
      } else {
        state.screen.size = 'xl'
      }
    },
    
    // Scroll mutations
    UPDATE_SCROLL_POSITION(state, position) {
      state.scroll.direction = position > state.scroll.position ? 'down' : 'up'
      state.scroll.position = position
    }
  },
  
  actions: {
    // Page loading actions
    startPageLoading({ commit }) {
      commit('START_PAGE_LOADING')
    },
    
    endPageLoading({ commit }) {
      commit('END_PAGE_LOADING')
    },
    
    // Component loading actions
    setGlobalLoading({ commit }, loading) {
      commit('SET_GLOBAL_LOADING', loading)
    },
    
    setComponentLoading({ commit }, { component, loading }) {
      commit('SET_COMPONENT_LOADING', { component, loading })
    },
    
    // Snackbar actions
    showSnackbar({ commit }, options) {
      commit('SHOW_SNACKBAR', options)
    },
    
    hideSnackbar({ commit }) {
      commit('HIDE_SNACKBAR')
    },
    
    // Confirmation dialog actions
    showConfirm({ commit }, options) {
      return new Promise((resolve) => {
        const callback = (result) => {
          resolve(result)
        }
        
        commit('SHOW_CONFIRM', { ...options, callback })
      })
    },
    
    hideConfirm({ commit }, result) {
      commit('HIDE_CONFIRM')
      
      // Call the stored callback function with the result
      if (this.state.ui.confirm.callback) {
        this.state.ui.confirm.callback(result)
      }
    },
    
    // Theme actions
    setThemeDark({ commit }, isDark) {
      commit('SET_THEME_DARK', isDark)
    },
    
    setPrimaryColor({ commit }, color) {
      commit('SET_PRIMARY_COLOR', color)
    },
    
    setDensity({ commit }, density) {
      commit('SET_DENSITY', density)
    },
    
    // Load saved theme settings
    loadSavedTheme({ commit }) {
      try {
        // Load dark mode setting
        const savedDarkMode = localStorage.getItem('theme_dark')
        if (savedDarkMode !== null) {
          commit('SET_THEME_DARK', savedDarkMode === 'true')
        }
        
        // Load primary color
        const savedPrimaryColor = localStorage.getItem('theme_primary_color')
        if (savedPrimaryColor) {
          commit('SET_PRIMARY_COLOR', savedPrimaryColor)
        }
        
        // Load density
        const savedDensity = localStorage.getItem('theme_density')
        if (savedDensity) {
          commit('SET_DENSITY', savedDensity)
        }
      } catch (error) {
        console.error('Failed to load theme settings:', error)
      }
    },
    
    // Screen actions
    updateScreenSize({ commit }, { width, height }) {
      commit('UPDATE_SCREEN_SIZE', { width, height })
    },
    
    // Setup screen resize listener
    setupResizeListener({ dispatch }) {
      window.addEventListener('resize', () => {
        dispatch('updateScreenSize', {
          width: window.innerWidth,
          height: window.innerHeight
        })
      })
      
      // Initialize with current size
      dispatch('updateScreenSize', {
        width: window.innerWidth,
        height: window.innerHeight
      })
    },
    
    // Scroll actions
    updateScrollPosition({ commit }, position) {
      commit('UPDATE_SCROLL_POSITION', position)
    },
    
    // Setup scroll listener
    setupScrollListener({ dispatch }) {
      window.addEventListener('scroll', () => {
        dispatch('updateScrollPosition', window.scrollY)
      })
      
      // Initialize with current position
      dispatch('updateScrollPosition', window.scrollY)
    }
  },
  
  getters: {
    // Loading getters
    isPageLoading: state => state.loading.page,
    isGlobalLoading: state => state.loading.global,
    isComponentLoading: state => component => {
      return state.loading.components.get(component) || false
    },
    isAnyLoading: state => {
      return state.loading.global || 
             state.loading.page || 
             Array.from(state.loading.components.values()).some(loading => loading)
    },
    
    // Theme getters
    isDarkTheme: state => state.theme.dark,
    getPrimaryColor: state => state.theme.primaryColor,
    getDensity: state => state.theme.density,
    
    // Screen getters
    isMobile: state => state.screen.isMobile,
    isDesktop: state => !state.screen.isMobile,
    screenSize: state => state.screen.size,
    
    // Scroll getters
    isScrollingDown: state => state.scroll.direction === 'down',
    isScrollingUp: state => state.scroll.direction === 'up',
    scrollPosition: state => state.scroll.position
  }
}
