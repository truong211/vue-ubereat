import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { useToast } from './useToast';
import axios from 'axios';

/**
 * Composable for handling checkout process
 * @returns {Object} Checkout methods and state
 */
export function useCheckout() {
  const store = useStore();
  const router = useRouter();
  const toast = useToast();
  
  // State
  const isProcessing = ref(false);
  const checkoutError = ref(null);
  
  // Computed
  const cart = computed(() => store.state.cart.cart);
  const cartItems = computed(() => store.state.cart.cart?.items || []);
  const cartTotal = computed(() => store.state.cart.cart?.total || 0);
  const cartSubtotal = computed(() => store.state.cart.cart?.subtotal || 0);
  const cartTax = computed(() => store.state.cart.cart?.tax || 0);
  const cartDeliveryFee = computed(() => store.state.cart.cart?.deliveryFee || 0);
  const cartDiscount = computed(() => store.state.cart.cart?.discount || 0);
  
  /**
   * Process checkout and create order
   * @param {Object} orderData - Order data
   * @returns {Promise<Object>} Order result
   */
  const processCheckout = async (orderData) => {
    if (cartItems.value.length === 0) {
      throw new Error('Giỏ hàng của bạn đang trống');
    }
    
    isProcessing.value = true;
    checkoutError.value = null;
    
    try {
      // Prepare request data
      const requestData = {
        ...orderData,
        items: cartItems.value.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          options: item.options || null,
          notes: item.notes || null
        }))
      };
      
      // Create the order
      const response = await axios.post('/api/orders', requestData);
      
      // Clear the cart after successful order
      await store.dispatch('cart/clearCart');
      
      return {
        success: true,
        orderId: response.data.data.orderId,
        orderNumber: response.data.data.orderNumber,
        orderData: response.data.data
      };
    } catch (error) {
      checkoutError.value = 
        error.response?.data?.message || 
        'Không thể xử lý đơn hàng của bạn. Vui lòng thử lại.';
      
      throw new Error(checkoutError.value);
    } finally {
      isProcessing.value = false;
    }
  };
  
  /**
   * Process payment for an order
   * @param {string} orderId - Order ID
   * @param {string} paymentMethod - Payment method
   * @returns {Promise<Object>} Payment result
   */
  const processPayment = async (orderId, paymentMethod) => {
    isProcessing.value = true;
    checkoutError.value = null;
    
    try {
      const response = await axios.post('/api/payments/process', {
        orderId,
        method: paymentMethod
      });
      
      return {
        success: true,
        redirectUrl: response.data.redirect_url,
        paymentData: response.data
      };
    } catch (error) {
      checkoutError.value = 
        error.response?.data?.message || 
        'Không thể xử lý thanh toán. Vui lòng thử lại.';
      
      throw new Error(checkoutError.value);
    } finally {
      isProcessing.value = false;
    }
  };
  
  /**
   * Navigate to order tracking page
   * @param {string} orderId - Order ID
   */
  const goToOrderTracking = (orderId) => {
    router.push({
      name: 'OrderTracking',
      params: { id: orderId }
    });
  };
  
  /**
   * Apply coupon code
   * @param {string} code - Coupon code
   * @returns {Promise<Object>} Coupon result
   */
  const applyCoupon = async (code) => {
    try {
      const response = await axios.post('/api/coupons/apply', { code });
      
      // Refresh cart to get updated totals
      await store.dispatch('cart/fetchCart');
      
      toast.success('Mã giảm giá đã được áp dụng thành công');
      
      return {
        success: true,
        discount: response.data.discount,
        couponData: response.data
      };
    } catch (error) {
      toast.error(
        error.response?.data?.message || 
        'Không thể áp dụng mã giảm giá. Vui lòng thử lại.'
      );
      
      throw error;
    }
  };
  
  /**
   * Remove coupon code
   * @returns {Promise<boolean>} Success
   */
  const removeCoupon = async () => {
    try {
      await axios.post('/api/coupons/remove');
      
      // Refresh cart to get updated totals
      await store.dispatch('cart/fetchCart');
      
      toast.info('Mã giảm giá đã được xóa');
      
      return true;
    } catch (error) {
      toast.error(
        error.response?.data?.message || 
        'Không thể xóa mã giảm giá. Vui lòng thử lại.'
      );
      
      throw error;
    }
  };
  
  return {
    // State
    isProcessing,
    checkoutError,
    
    // Computed
    cart,
    cartItems,
    cartTotal,
    cartSubtotal,
    cartTax,
    cartDeliveryFee,
    cartDiscount,
    
    // Methods
    processCheckout,
    processPayment,
    goToOrderTracking,
    applyCoupon,
    removeCoupon
  };
}
