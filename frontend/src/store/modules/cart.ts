import { Module } from 'vuex'
import { RootState } from '../types'

export interface CartItem {
  id: string
  restaurantId: string
  name: string
  price: number
  quantity: number
  image?: string
  description?: string
  options: {
    name: string
    value: string
    price: number
  }[]
  specialInstructions?: string
}

export interface CartState {
  items: CartItem[]
  deliveryFee: number
  tax: number
  restaurantId: string | null
  restaurantName: string | null
}

const state: CartState = {
  items: [],
  deliveryFee: 0,
  tax: 0,
  restaurantId: null,
  restaurantName: null
}

const getters = {
  cartItems: (state: CartState) => state.items,
  itemCount: (state: CartState) => state.items.reduce((total, item) => total + item.quantity, 0),
  subtotal: (state: CartState) => {
    return state.items.reduce((total, item) => {
      const itemTotal = item.price * item.quantity
      const optionsTotal = item.options.reduce((sum, opt) => sum + opt.price, 0) * item.quantity
      return total + itemTotal + optionsTotal
    }, 0)
  },
  total: (state: CartState, getters: any) => {
    return getters.subtotal + state.deliveryFee + state.tax
  },
  canAddToCart: (state: CartState) => (restaurantId: string) => {
    return !state.restaurantId || state.restaurantId === restaurantId
  },
  isEmpty: (state: CartState) => state.items.length === 0,
  restaurantInfo: (state: CartState) => ({
    id: state.restaurantId,
    name: state.restaurantName
  })
}

const mutations = {
  addItem(state: CartState, item: CartItem) {
    const existingItem = state.items.find(i => i.id === item.id)
    if (existingItem) {
      existingItem.quantity += item.quantity
    } else {
      state.items.push(item)
    }
    if (!state.restaurantId) {
      state.restaurantId = item.restaurantId
    }
  },
  updateItemQuantity(state: CartState, { itemId, quantity }: { itemId: string; quantity: number }) {
    const item = state.items.find(i => i.id === itemId)
    if (item) {
      item.quantity = Math.max(0, quantity)
      if (item.quantity === 0) {
        state.items = state.items.filter(i => i.id !== itemId)
      }
    }
    if (state.items.length === 0) {
      state.restaurantId = null
      state.restaurantName = null
    }
  },
  updateItemOptions(state: CartState, { itemId, options }: { itemId: string; options: CartItem['options'] }) {
    const item = state.items.find(i => i.id === itemId)
    if (item) {
      item.options = options
    }
  },
  updateSpecialInstructions(state: CartState, { itemId, instructions }: { itemId: string; instructions: string }) {
    const item = state.items.find(i => i.id === itemId)
    if (item) {
      item.specialInstructions = instructions
    }
  },
  updateDeliveryFee(state: CartState, fee: number) {
    state.deliveryFee = fee
  },
  updateTax(state: CartState, tax: number) {
    state.tax = tax
  },
  updateRestaurantName(state: CartState, name: string) {
    state.restaurantName = name
  },
  clearCart(state: CartState) {
    state.items = []
    state.deliveryFee = 0
    state.tax = 0
    state.restaurantId = null
    state.restaurantName = null
  },
  setCart(state: CartState, cartData: Partial<CartState>) {
    if (cartData.items) state.items = cartData.items
    if (cartData.deliveryFee !== undefined) state.deliveryFee = cartData.deliveryFee
    if (cartData.tax !== undefined) state.tax = cartData.tax
    if (cartData.restaurantId !== undefined) state.restaurantId = cartData.restaurantId
    if (cartData.restaurantName !== undefined) state.restaurantName = cartData.restaurantName
  }
}

const actions = {
  initializeCart({ commit }: { commit: any }) {
    try {
      const savedCart = localStorage.getItem('cart')
      if (savedCart) {
        const cartData = JSON.parse(savedCart)
        commit('setCart', cartData)
      }
    } catch (error) {
      console.error('Error initializing cart from localStorage:', error)
    }
  },
  
  saveCart({ state }: { state: CartState }) {
    try {
      localStorage.setItem('cart', JSON.stringify({
        items: state.items,
        deliveryFee: state.deliveryFee,
        tax: state.tax,
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName
      }))
    } catch (error) {
      console.error('Error saving cart to localStorage:', error)
    }
  },
  
  addToCart({ commit, dispatch, state }: { commit: any, dispatch: any, state: CartState }, payload: { item: CartItem, restaurantName?: string }) {
    commit('addItem', payload.item)
    
    // Update restaurant name if provided
    if (payload.restaurantName && !state.restaurantName) {
      commit('updateRestaurantName', payload.restaurantName)
    }
    
    dispatch('saveCart')
  },
  
  updateQuantity({ commit, dispatch }: { commit: any, dispatch: any }, { itemId, quantity }: { itemId: string, quantity: number }) {
    commit('updateItemQuantity', { itemId, quantity })
    dispatch('saveCart')
  },
  
  updateOptions({ commit, dispatch }: { commit: any, dispatch: any }, { itemId, options }: { itemId: string, options: CartItem['options'] }) {
    commit('updateItemOptions', { itemId, options })
    dispatch('saveCart')
  },
  
  updateInstructions({ commit, dispatch }: { commit: any, dispatch: any }, { itemId, instructions }: { itemId: string, instructions: string }) {
    commit('updateSpecialInstructions', { itemId, instructions })
    dispatch('saveCart')
  },
  
  removeItem({ commit, dispatch }: { commit: any, dispatch: any }, itemId: string) {
    commit('updateItemQuantity', { itemId, quantity: 0 })
    dispatch('saveCart')
  },
  
  clearCartItems({ commit, dispatch }: { commit: any, dispatch: any }) {
    commit('clearCart')
    dispatch('saveCart')
  }
}

export const cart: Module<CartState, RootState> = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}