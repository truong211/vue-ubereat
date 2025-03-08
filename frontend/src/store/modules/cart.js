import api from '@/services/api.service';

// Helper function to calculate cart totals
const calculateTotals = (items) => {
  const subtotal = items.reduce((total, item) => {
    const itemTotal = item.price * item.quantity;
    const optionsTotal = item.options?.reduce(
      (sum, opt) => sum + (opt.price || 0),
      0
    ) || 0;
    return total + itemTotal + (optionsTotal * item.quantity);
  }, 0);
  
  return {
    subtotal,
    itemCount: items.reduce((count, item) => count + item.quantity, 0)
  };
};

// Helper function to save cart to localStorage
const saveCartToStorage = (cart) => {
  try {
    localStorage.setItem('cart', JSON.stringify(cart));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

// Helper function to load cart from localStorage
const loadCartFromStorage = () => {
  try {
    const cartData = localStorage.getItem('cart');
    return cartData ? JSON.parse(cartData) : null;
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
    return null;
  }
};

const state = {
  items: [],
  restaurantId: null,
  restaurantName: '',
  subtotal: 0,
  deliveryFee: 0,
  tax: 0,
  tip: 0,
  discount: 0,
  promoCode: null,
  loading: false,
  error: null
};

const getters = {
  cartItems: state => state.items,
  itemCount: state => state.items.reduce((count, item) => count + item.quantity, 0),
  subtotal: state => state.subtotal,
  deliveryFee: state => state.deliveryFee,
  tax: state => state.tax,
  tip: state => state.tip,
  discount: state => state.discount,
  total: state => {
    return state.subtotal + state.deliveryFee + state.tax + state.tip - state.discount;
  },
  hasItems: state => state.items.length > 0,
  restaurantId: state => state.restaurantId,
  restaurantName: state => state.restaurantName,
  promoCode: state => state.promoCode,
  loading: state => state.loading,
  error: state => state.error
};

const actions = {
  // Initialize cart from localStorage
  initializeCart({ commit }) {
    const savedCart = loadCartFromStorage();
    if (savedCart) {
      commit('setCart', savedCart);
    }
  },

  // Add item to cart
  async addToCart({ commit, state }, { item, quantity = 1, options = [], specialInstructions = '' }) {
    try {
      // Check if adding from a different restaurant
      if (state.restaurantId && state.restaurantId !== item.restaurantId) {
        const confirmed = window.confirm(
          `Your cart contains items from ${state.restaurantName}. Do you want to clear your cart and add items from ${item.restaurantName}?`
        );
        
        if (!confirmed) {
          return false;
        }
        
        commit('clearCart');
      }
      
      // Set restaurant info if cart is empty
      if (state.items.length === 0) {
        commit('setRestaurant', {
          id: item.restaurantId,
          name: item.restaurantName
        });
      }
      
      // Check if item already exists with same options
      const existingItemIndex = state.items.findIndex(cartItem => {
        if (cartItem.id !== item.id) return false;
        
        if (cartItem.options.length !== options.length) return false;
        
        const optionsMatch = cartItem.options.every(option => {
          const matchingOption = options.find(o => o.id === option.id);
          return matchingOption && matchingOption.value === option.value;
        });
        
        return optionsMatch && cartItem.specialInstructions === specialInstructions;
      });
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        commit('updateItemQuantity', {
          index: existingItemIndex,
          quantity: state.items[existingItemIndex].quantity + quantity
        });
      } else {
        // Add new item
        commit('addItem', {
          ...item,
          quantity,
          options,
          specialInstructions
        });
      }
      
      // Save to localStorage
      saveCartToStorage({
        items: state.items,
        restaurantId: state.restaurantId,
        restaurantName: state.restaurantName
      });
      
      return true;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      commit('setError', 'Failed to add item to cart');
      return false;
    }
  },

  // Update item quantity
  updateQuantity({ commit, state }, { index, quantity }) {
    commit('updateItemQuantity', { index, quantity });
    saveCartToStorage({
      items: state.items,
      restaurantId: state.restaurantId,
      restaurantName: state.restaurantName
    });
  },

  // Remove item from cart
  removeItem({ commit, state }, index) {
    commit('removeItem', index);
    saveCartToStorage({
      items: state.items,
      restaurantId: state.restaurantId,
      restaurantName: state.restaurantName
    });
  },

  // Clear cart
  clearCart({ commit }) {
    commit('clearCart');
    localStorage.removeItem('cart');
  },

  // Apply promo code
  applyPromoCode({ commit }, code) {
    // Here you would typically validate the promo code with your backend
    // For demo purposes, we'll use a simple example
    if (code.toUpperCase() === 'SAVE10') {
      commit('setDiscount', 10);
      commit('setPromoCode', code);
    } else {
      commit('setDiscount', 0);
      commit('setPromoCode', null);
    }
  },

  // Update delivery fee
  updateDeliveryFee({ commit }, fee) {
    commit('setDeliveryFee', fee);
  },

  // Update tip amount
  updateTip({ commit }, tip) {
    commit('setTip', tip);
  }
};

const mutations = {
  setLoading(state, loading) {
    state.loading = loading;
  },

  setError(state, error) {
    state.error = error;
  },

  addItem(state, item) {
    state.items.push(item);
    const { subtotal } = calculateTotals(state.items);
    state.subtotal = subtotal;
    state.tax = subtotal * 0.1; // 10% tax rate
  },

  updateItemQuantity(state, { index, quantity }) {
    if (quantity <= 0) {
      state.items.splice(index, 1);
    } else {
      state.items[index].quantity = quantity;
    }
    
    const { subtotal } = calculateTotals(state.items);
    state.subtotal = subtotal;
    state.tax = subtotal * 0.1;
  },

  removeItem(state, index) {
    state.items.splice(index, 1);
    const { subtotal } = calculateTotals(state.items);
    state.subtotal = subtotal;
    state.tax = subtotal * 0.1;

    if (state.items.length === 0) {
      state.restaurantId = null;
      state.restaurantName = '';
      state.promoCode = null;
      state.discount = 0;
    }
  },

  setCart(state, cart) {
    state.items = cart.items || [];
    state.restaurantId = cart.restaurantId;
    state.restaurantName = cart.restaurantName;
    const { subtotal } = calculateTotals(state.items);
    state.subtotal = subtotal;
    state.tax = subtotal * 0.1;
  },

  clearCart(state) {
    state.items = [];
    state.restaurantId = null;
    state.restaurantName = '';
    state.subtotal = 0;
    state.tax = 0;
    state.tip = 0;
    state.discount = 0;
    state.promoCode = null;
  },

  setRestaurant(state, { id, name }) {
    state.restaurantId = id;
    state.restaurantName = name;
  },

  setDeliveryFee(state, fee) {
    state.deliveryFee = fee;
  },

  setTip(state, tip) {
    state.tip = tip;
  },

  setDiscount(state, amount) {
    state.discount = amount;
  },

  setPromoCode(state, code) {
    state.promoCode = code;
  },

  updateItemOptions(state, { itemId, options }) {
    const item = state.items.find(item => item.id === itemId);
    if (item) {
      item.options = options;
      const { subtotal } = calculateTotals(state.items);
      state.subtotal = subtotal;
      state.tax = subtotal * 0.1;
    }
  },

  updateSpecialInstructions(state, { itemId, instructions }) {
    const item = state.items.find(item => item.id === itemId);
    if (item) {
      item.specialInstructions = instructions;
    }
  }
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
};
