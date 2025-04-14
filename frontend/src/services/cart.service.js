import api from './api';

const cartService = {
  getCart: async () => {
    return api.get('/cart');
  },
  
  addToCart: async (itemData) => {
    return api.post('/cart/items', itemData);
  },
  
  updateCartItem: async (itemId, updateData) => {
    return api.put(`/cart/items/${itemId}`, updateData);
  },
  
  removeCartItem: async (itemId) => {
    return api.delete(`/cart/items/${itemId}`);
  },
  
  clearCart: async () => {
    return api.delete('/cart');
  },
  
  applyCoupon: async (couponCode) => {
    return api.post('/cart/coupon', { code: couponCode });
  },
  
  removeCoupon: async () => {
    return api.delete('/cart/coupon');
  },
  
  getDeliveryEstimate: async (addressId) => {
    return api.get(`/cart/delivery-estimate?addressId=${addressId}`);
  }
};

export default cartService; 