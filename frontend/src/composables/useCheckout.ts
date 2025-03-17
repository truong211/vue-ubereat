import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useToast } from './useToast';
import axios from 'axios';

interface OrderData {
  address_id: number;
  payment_method: string;
  coupon_code?: string | null;
  delivery_instructions?: string;
  scheduled_time?: string | null;
}

interface CheckoutSummary {
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
}

export function useCheckout() {
  const store = useStore();
  const { showError } = useToast();
  
  const isProcessing = ref(false);
  const checkoutError = ref<string | null>(null);
  
  // Get cart items from the store
  const cartItems = computed(() => store.state.cart.items);
  
  // Get totals from the cart store
  const cartTotals = computed(() => store.getters['cart/totals']);
  
  /**
   * Calculate checkout summary including any applied promotions
   */
  const calculateCheckoutSummary = async (
    addressId: number,
    couponCode?: string
  ): Promise<CheckoutSummary> => {
    try {
      // If we have no items, return empty summary
      if (!cartItems.value.length) {
        return {
          subtotal: 0,
          deliveryFee: 0,
          tax: 0,
          discount: 0,
          total: 0
        };
      }
      
      // Call API to calculate totals including delivery fee based on location
      const response = await axios.post('/api/checkout/calculate', {
        items: cartItems.value.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          options: item.options || null
        })),
        address_id: addressId,
        coupon_code: couponCode || null
      });
      
      return response.data;
    } catch (error) {
      console.error('Error calculating checkout summary:', error);
      // Return cart totals as fallback
      return {
        subtotal: cartTotals.value.subtotal || 0,
        deliveryFee: 0, // Default since we couldn't calculate
        tax: cartTotals.value.tax || 0,
        discount: 0, // Default since we couldn't apply coupon
        total: cartTotals.value.total || 0
      };
    }
  };
  
  /**
   * Process the checkout and create an order
   */
  const processCheckout = async (orderData: OrderData) => {
    if (!cartItems.value.length) {
      throw new Error('Your cart is empty');
    }
    
    isProcessing.value = true;
    checkoutError.value = null;
    
    try {
      // Prepare request data
      const requestData = {
        ...orderData,
        items: cartItems.value.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          options: item.options || null
        }))
      };
      
      // Create the order
      const response = await axios.post('/api/orders', requestData);
      
      // Clear the cart after successful order
      store.dispatch('cart/clearCart');
      
      return {
        success: true,
        orderId: response.data.id,
        orderData: response.data
      };
    } catch (error: any) {
      checkoutError.value = 
        error.response?.data?.message || 
        'Failed to process your order. Please try again.';
      
      throw new Error(checkoutError.value);
    } finally {
      isProcessing.value = false;
    }
  };
  
  /**
   * Validate payment information based on payment method
   */
  const validatePaymentInfo = (paymentMethod: string, paymentData: any): boolean => {
    if (paymentMethod === 'cash') {
      // No validation needed for cash payment
      return true;
    }
    
    if (paymentMethod === 'credit_card') {
      if (!paymentData) return false;
      
      // Basic validation for credit card
      const { cardNumber, expiryDate, cvv, cardholderName } = paymentData;
      
      if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
        showError('Please provide all credit card details');
        return false;
      }
      
      // Validate card number format (simple validation)
      if (!/^\d{13,19}$/.test(cardNumber.replace(/\s/g, ''))) {
        showError('Invalid card number format');
        return false;
      }
      
      // Validate expiry date (MM/YY format)
      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        showError('Invalid expiry date format (MM/YY)');
        return false;
      }
      
      // Validate CVV (3-4 digits)
      if (!/^\d{3,4}$/.test(cvv)) {
        showError('Invalid CVV format');
        return false;
      }
      
      return true;
    }
    
    if (['momo', 'zalopay', 'vnpay'].includes(paymentMethod)) {
      // These payment methods will redirect to their respective payment gateways
      // No client-side validation needed
      return true;
    }
    
    return false;
  };
  
  /**
   * Process payment using selected payment method
   */
  const processPayment = async (
    paymentMethod: string,
    paymentData: any,
    orderId: number
  ) => {
    if (paymentMethod === 'cash') {
      // For cash payment, no processing needed
      return {
        success: true,
        message: 'Cash payment will be collected upon delivery'
      };
    }
    
    // For other payment methods, call payment API
    try {
      const response = await axios.post('/api/payments', {
        order_id: orderId,
        payment_method: paymentMethod,
        payment_data: paymentData
      });
      
      // For redirect-based payment methods (e.g., MoMo, ZaloPay)
      if (response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
        return {
          success: true,
          redirect: true
        };
      }
      
      // For directly processed payments
      return {
        success: true,
        payment_id: response.data.payment_id,
        message: 'Payment processed successfully'
      };
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.message || 
        'Payment processing failed. Please try again.';
      
      throw new Error(errorMessage);
    }
  };
  
  return {
    isProcessing,
    checkoutError,
    cartItems,
    cartTotals,
    calculateCheckoutSummary,
    processCheckout,
    validatePaymentInfo,
    processPayment
  };
}