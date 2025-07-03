// This module manages the cart entirely on the client side and persists it to
// localStorage. All network-based cart logic has been removed so that the core
// add / edit / remove functionality works out-of-the-box without requiring a
// backend.

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------
const CART_STORAGE_KEY = 'cart';

function loadPersistedCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn('Failed to parse cart from localStorage:', err);
    return null;
  }
}

function persistCart(state) {
  try {
    const payload = {
      items: state.items,
      deliveryFee: state.deliveryFee,
      tax: state.tax,
      restaurantId: state.restaurantId,
      restaurantName: state.restaurantName,
      deliveryAddress: state.deliveryAddress
    };
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to persist cart to localStorage:', err);
  }
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
const persisted = loadPersistedCart() || {};

const state = {
  items: persisted.items || [],
  deliveryFee: persisted.deliveryFee || 0,
  tax: persisted.tax || 0,
  restaurantId: persisted.restaurantId || null,
  restaurantName: persisted.restaurantName || null,
  deliveryAddress: persisted.deliveryAddress || null,
  // UI helpers
  loading: false,
  error: null
};

// ---------------------------------------------------------------------------
// Getters
// ---------------------------------------------------------------------------
const getters = {
  cartItems: s => s.items,
  cartItemsCount: s => s.items.reduce((sum, i) => sum + i.quantity, 0),
  subtotal: s => s.items.reduce((tot, i) => {
    const optTotal = (i.options || []).reduce((oSum, opt) => oSum + (opt.price || 0), 0);
    return tot + (i.price + optTotal) * i.quantity;
  }, 0),
  total: (s, g) => g.subtotal + s.deliveryFee + s.tax,
  isCartEmpty: s => s.items.length === 0,
  getError: s => s.error,
  isLoading: s => s.loading,
  deliveryAddress: s => s.deliveryAddress
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------
const mutations = {
  SET_LOADING(state, val) {
    state.loading = val;
  },
  SET_ERROR(state, err) {
    state.error = err;
  },
  SET_CART(state, payload) {
    state.items = payload.items || [];
    state.deliveryFee = payload.deliveryFee || 0;
    state.tax = payload.tax || 0;
    state.restaurantId = payload.restaurantId || null;
    state.restaurantName = payload.restaurantName || null;
    state.deliveryAddress = payload.deliveryAddress || null;
  },
  ADD_ITEM(state, item) {
    // Merge if same id & same chosen options (very basic check)
    const match = state.items.find(i => i.id === item.id && JSON.stringify(i.options) === JSON.stringify(item.options));
    if (match) {
      match.quantity += item.quantity;
    } else {
      state.items.push(item);
    }
  },
  UPDATE_ITEM_QUANTITY(state, { itemId, quantity }) {
    const item = state.items.find(i => i.id === itemId);
    if (!item) return;
    item.quantity = Math.max(0, quantity);
    if (item.quantity === 0) {
      state.items = state.items.filter(i => i.id !== itemId);
    }
  },
  UPDATE_ITEM(state, { itemId, data }) {
    const idx = state.items.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    state.items[idx] = { ...state.items[idx], ...data };
  },
  REMOVE_ITEM(state, itemId) {
    state.items = state.items.filter(i => i.id !== itemId);
  },
  CLEAR_CART(state) {
    state.items = [];
    state.deliveryFee = 0;
    state.tax = 0;
    state.restaurantId = null;
    state.restaurantName = null;
    state.deliveryAddress = null;
  },
  UPDATE_DELIVERY_FEE(state, fee) {
    state.deliveryFee = fee;
  },
  UPDATE_TAX(state, tax) {
    state.tax = tax;
  },
  UPDATE_RESTAURANT_NAME(state, name) {
    state.restaurantName = name;
  },
  UPDATE_DELIVERY_ADDRESS(state, addr) {
    state.deliveryAddress = addr;
  }
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
const actions = {
  // ---------- Persistence helpers ----------
  loadCart({ commit }) {
    const cart = loadPersistedCart();
    if (cart) commit('SET_CART', cart);
  },
  saveCart({ state }) {
    persistCart(state);
  },

  // ---------- Core CRUD ----------
  addToCart({ commit, dispatch, state }, payload) {
    /*
      Expected payload from components:
      {
        productId, quantity, options, notes, name, price, image, restaurantId, restaurantName
      }
    */
    const item = {
      id: payload.productId || payload.id,
      restaurantId: payload.restaurantId || state.restaurantId || null,
      name: payload.name || 'Item',
      price: payload.price || 0,
      image: payload.image || null,
      quantity: payload.quantity || 1,
      options: payload.options || [],
      notes: payload.notes || null
    };

    // Ensure cart only contains items from one restaurant
    if (state.restaurantId && state.restaurantId !== item.restaurantId) {
      commit('CLEAR_CART');
    }

    commit('ADD_ITEM', item);
    if (!state.restaurantName && payload.restaurantName) {
      commit('UPDATE_RESTAURANT_NAME', payload.restaurantName);
    }
    if (!state.restaurantId) {
      state.restaurantId = item.restaurantId;
    }

    dispatch('saveCart');
  },

  updateQuantity({ commit, dispatch, state }, payload) {
    // Support legacy signature { index, change }
    if (payload.index !== undefined) {
      const item = state.items[payload.index];
      if (!item) return;
      const newQty = item.quantity + (payload.change || 0);
      commit('UPDATE_ITEM_QUANTITY', { itemId: item.id, quantity: newQty });
    } else {
      commit('UPDATE_ITEM_QUANTITY', { itemId: payload.itemId, quantity: payload.quantity });
    }
    dispatch('saveCart');
  },

  updateCartItem({ commit, dispatch }, { id, ...data }) {
    // Accept updates for options / quantity / notes etc.
    commit('UPDATE_ITEM', { itemId: id, data });
    dispatch('saveCart');
  },

  getCartItem({ state }, itemId) {
    return state.items.find(i => i.id === itemId);
  },

  removeFromCart({ commit, dispatch, state }, idOrIndex) {
    let itemId = idOrIndex;
    if (typeof idOrIndex === 'number') {
      itemId = state.items[idOrIndex]?.id;
    }
    if (itemId) {
      commit('REMOVE_ITEM', itemId);
      // Reset restaurant info if cart becomes empty
      if (state.items.length === 0) {
        commit('UPDATE_RESTAURANT_NAME', null);
        state.restaurantId = null;
      }
      dispatch('saveCart');
    }
  },

  clearCart({ commit, dispatch }) {
    commit('CLEAR_CART');
    dispatch('saveCart');
  },

  // ---------------- Delivery address ----------------
  setDeliveryAddress({ commit, dispatch }, address) {
    commit('UPDATE_DELIVERY_ADDRESS', address);
    dispatch('saveCart');
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
