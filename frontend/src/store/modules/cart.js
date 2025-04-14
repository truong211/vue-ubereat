export default {
  namespaced: true,
  
  state: {
    items: [],
    itemCount: 0
  },

  getters: {
    cartItemCount: (state) => state.itemCount,
    
    total: (state) => state.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    
    isEmpty: (state) => state.items.length === 0
  },

  mutations: {
    ADD_ITEM(state, item) {
      const existingItem = state.items.find(i => i.id === item.id)
      if (existingItem) {
        existingItem.quantity++
      } else {
        state.items.push({ ...item, quantity: 1 })
      }
      state.itemCount++
    },

    REMOVE_ITEM(state, itemId) {
      const index = state.items.findIndex(item => item.id === itemId)
      if (index > -1) {
        state.itemCount -= state.items[index].quantity
        state.items.splice(index, 1)
      }
    },

    UPDATE_QUANTITY(state, { itemId, quantity }) {
      const item = state.items.find(i => i.id === itemId)
      if (item) {
        const diff = quantity - item.quantity
        item.quantity = quantity
        state.itemCount += diff
      }
    },

    CLEAR_CART(state) {
      state.items = []
      state.itemCount = 0
    }
  },

  actions: {
    addItem({ commit }, item) {
      commit('ADD_ITEM', item)
    },

    removeItem({ commit }, itemId) {
      commit('REMOVE_ITEM', itemId)
    },

    updateQuantity({ commit }, { itemId, quantity }) {
      commit('UPDATE_QUANTITY', { itemId, quantity })
    },

    clearCart({ commit }) {
      commit('CLEAR_CART')
    }
  }
}
