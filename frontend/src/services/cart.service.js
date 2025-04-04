import { apiClient } from './api.service';
import { CART } from './api.endpoints';

class CartService {
  // Get cart items for the current user
  async getCartItems() {
    return apiClient.get(CART.GET);
  }
  
  // Add an item to the cart
  async addToCart(productId, quantity = 1, options = null) {
    return apiClient.post(CART.ADD, {
      productId,
      quantity,
      options
    });
  }
  
  // Update item quantity in the cart
  async updateQuantity(cartItemId, quantity) {
    return apiClient.put(CART.UPDATE(cartItemId), { quantity });
  }
  
  // Remove an item from the cart
  async removeFromCart(cartItemId) {
    return apiClient.delete(CART.REMOVE(cartItemId));
  }
  
  // Clear the entire cart
  async clearCart() {
    return apiClient.delete(CART.CLEAR);
  }
  
  // Validate cart (check item availability, price changes, etc.)
  async validateCart() {
    return apiClient.get(CART.VALIDATE);
  }
}

export default new CartService(); 