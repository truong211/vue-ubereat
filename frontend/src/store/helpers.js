import store from './index'

// Auth store helper
export const useAuthStore = () => ({
  isAuthenticated: store.state.auth.isAuthenticated,
  user: store.state.auth.user,
  accessToken: store.state.auth.accessToken,
  refreshToken: store.state.auth.refreshToken,
  getters: {
    isAuthenticated: () => store.getters['auth/isAuthenticated'],
    userRole: () => store.getters['auth/userRole']
  },
  ...mapActions(store, 'auth')
})

// Category store helper
export const useCategoryStore = () => ({
  categories: store.state.category.categories,
  loading: store.state.category.loading,
  error: store.state.category.error,
  selectedCategory: store.state.category.selectedCategory,
  getters: {
    allCategories: () => store.getters['category/allCategories'],
    isLoading: () => store.getters['category/isLoading'],
    getError: () => store.getters['category/getError'],
    getSelectedCategory: () => store.getters['category/getSelectedCategory']
  },
  ...mapActions(store, 'category')
})

// Chat store helper
export const useChatStore = () => ({
  isChatOpen: store.state.chat.isChatOpen,
  activeChat: store.state.chat.activeChat,
  ...mapActions(store, 'chat')
})

// Notifications store helper
export const useNotificationStore = () => ({
  notifications: store.state.notifications.notifications,
  showNotification: store.state.notifications.showNotification,
  currentNotification: store.state.notifications.currentNotification,
  hasPermission: store.state.notifications.hasPermission,
  ...mapActions(store, 'notifications')
})

// Helper function to map actions
function mapActions(store, namespace) {
  const storeModule = store._modules.root._children[namespace]
  if (!storeModule) return {}

  const actions = {}
  Object.keys(storeModule.context.actions).forEach(actionName => {
    actions[actionName] = (...args) => store.dispatch(`${namespace}/${actionName}`, ...args)
  })
  return actions
}

// Add other store helpers as needed
export const useProductStore = () => ({
  ...mapActions(store, 'product')
})

export const useRestaurantStore = () => ({
  ...mapActions(store, 'restaurants')
})

export const useCartStore = () => ({
  ...mapActions(store, 'cart')
})

export const useUserStore = () => ({
  ...mapActions(store, 'user')
})
