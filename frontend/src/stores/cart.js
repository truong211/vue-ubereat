import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', {
  state: () => ({
    items: [],
    restaurantId: null
  }),

  getters: {
    cartItems: (state) => state.items,
    itemCount: (state) => state.items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: (state) => state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    isEmpty: (state) => state.items.length === 0
  },

  actions: {
    addItem(item) {
      // Check if adding from a different restaurant
      if (this.restaurantId && item.restaurantId !== this.restaurantId) {
        if (!confirm('Adding items from a different restaurant will clear your current cart. Continue?')) {
          return false
        }
        this.clearCart()
      }

      const existingItem = this.items.find(i => i.id === item.id)
      if (existingItem) {
        existingItem.quantity += 1
      } else {
        this.items.push({
          ...item,
          quantity: 1
        })
        this.restaurantId = item.restaurantId
      }
      this.saveToLocalStorage()
      return true
    },

    removeItem(itemId) {
      const index = this.items.findIndex(item => item.id === itemId)
      if (index > -1) {
        this.items.splice(index, 1)
        if (this.items.length === 0) {
          this.restaurantId = null
        }
        this.saveToLocalStorage()
      }
    },

    updateQuantity(itemId, quantity) {
      const item = this.items.find(i => i.id === itemId)
      if (item) {
        item.quantity = Math.max(0, quantity)
        if (item.quantity === 0) {
          this.removeItem(itemId)
        }
        this.saveToLocalStorage()
      }
    },

    clearCart() {
      this.items = []
      this.restaurantId = null
      this.saveToLocalStorage()
    },

    saveToLocalStorage() {
      localStorage.setItem('cart', JSON.stringify({
        items: this.items,
        restaurantId: this.restaurantId
      }))
    },

    loadFromLocalStorage() {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const { items, restaurantId } = JSON.parse(savedCart)
        this.items = items
        this.restaurantId = restaurantId
      }
    }
  }
}) 