import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import PaymentService from '@/services/payment.service'
import { useStripe } from '@stripe/stripe-js'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'

export interface Address {
  id: string
  street: string
  city: string
  state: string
  zipCode: string
  isDefault: boolean
}

export interface PaymentMethod {
  id: string
  type: 'CREDIT_CARD' | 'VNPAY' | 'MOMO' | 'ZALOPAY' | 'PAYPAL' | 'STRIPE'
  last4?: string
  isDefault: boolean
}

export interface OrderSummary {
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
}

export interface CouponValidation {
  isValid: boolean
  discountAmount: number
  message: string
}

export function useCheckout() {
  const router = useRouter()
  const paymentService = new PaymentService()
  const stripe = useStripe()

  // State management
  const selectedAddress = ref<Address | null>(null)
  const selectedPaymentMethod = ref<PaymentMethod | null>(null)
  const addresses = ref<Address[]>([])
  const paymentMethods = ref<PaymentMethod[]>([])
  const couponCode = ref('')
  const loading = ref(false)
  const error = ref('')
  const currentStep = ref<'address' | 'payment' | 'confirmation'>('address')

  // Order summary
  const orderSummary = ref<OrderSummary>({
    subtotal: 0,
    deliveryFee: 0,
    discount: 0,
    total: 0
  })

  // Computed properties
  const isAddressSelected = computed(() => selectedAddress.value !== null)
  const isPaymentMethodSelected = computed(() => selectedPaymentMethod.value !== null)
  const canProceedToPayment = computed(() => isAddressSelected.value)
  const canConfirmOrder = computed(() => isAddressSelected.value && isPaymentMethodSelected.value)

  // Load user's saved addresses
  const loadAddresses = async () => {
    try {
      loading.value = true
      const response = await fetch('/api/user/addresses')
      addresses.value = await response.json()
      error.value = ''
    } catch (err) {
      error.value = 'Failed to load addresses'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // Load available payment methods
  const loadPaymentMethods = async () => {
    try {
      loading.value = true
      const methods = await paymentService.getPaymentMethods()
      paymentMethods.value = methods
      error.value = ''
    } catch (err) {
      error.value = 'Failed to load payment methods'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // Apply coupon code
  const applyCoupon = async (code: string): Promise<CouponValidation> => {
    try {
      loading.value = true
      const response = await fetch(`/api/coupons/validate?code=${code}`)
      const validation = await response.json()
      
      if (validation.isValid) {
        couponCode.value = code
        orderSummary.value.discount = validation.discountAmount
        orderSummary.value.total = 
          orderSummary.value.subtotal + 
          orderSummary.value.deliveryFee - 
          orderSummary.value.discount
      }

      error.value = ''
      return validation
    } catch (err) {
      error.value = 'Invalid coupon code'
      console.error(err)
      return { isValid: false, discountAmount: 0, message: 'Invalid coupon code' }
    } finally {
      loading.value = false
    }
  }

  // Process Stripe payment
  const processStripePayment = async (paymentMethodId: string) => {
    try {
      const { clientSecret } = await paymentService.createPaymentIntent({
        amount: orderSummary.value.total,
        currency: 'usd'
      })

      const { paymentIntent, error: stripeError } = await stripe?.confirmCardPayment(
        clientSecret,
        { payment_method: paymentMethodId }
      )

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      return paymentIntent
    } catch (err) {
      throw new Error('Stripe payment failed')
    }
  }

  // Process PayPal payment
  const processPayPalPayment = async () => {
    // PayPal payment logic will be handled by PayPal Buttons component
    return true
  }

  // Process payment
  const processPayment = async () => {
    if (!canConfirmOrder.value) {
      error.value = 'Please select both delivery address and payment method'
      return
    }

    try {
      loading.value = true
      const orderData = {
        id: Date.now().toString(),
        amount: orderSummary.value.total,
        address: selectedAddress.value,
        paymentMethod: selectedPaymentMethod.value,
        couponCode: couponCode.value
      }

      let paymentResult
      switch (selectedPaymentMethod.value?.type) {
        case 'STRIPE':
          paymentResult = await processStripePayment(selectedPaymentMethod.value.id)
          break
        case 'PAYPAL':
          paymentResult = await processPayPalPayment()
          break
        case 'VNPAY':
          paymentResult = await paymentService.initVNPay(orderData)
          break
        case 'MOMO':
          paymentResult = await paymentService.initMomo(orderData)
          break
        case 'ZALOPAY':
          paymentResult = await paymentService.initZaloPay(orderData)
          break
        default:
          throw new Error('Unsupported payment method')
      }

      // Handle redirect or confirmation
      if (paymentResult.redirectUrl) {
        window.location.href = paymentResult.redirectUrl
      } else {
        await router.push(`/order-confirmation/${orderData.id}`)
      }

      error.value = ''
    } catch (err) {
      error.value = 'Payment processing failed'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  // Navigation methods
  const nextStep = () => {
    if (currentStep.value === 'address' && canProceedToPayment.value) {
      currentStep.value = 'payment'
    } else if (currentStep.value === 'payment' && canConfirmOrder.value) {
      currentStep.value = 'confirmation'
    }
  }

  const previousStep = () => {
    if (currentStep.value === 'payment') {
      currentStep.value = 'address'
    } else if (currentStep.value === 'confirmation') {
      currentStep.value = 'payment'
    }
  }

  return {
    // State
    selectedAddress,
    selectedPaymentMethod,
    addresses,
    paymentMethods,
    couponCode,
    loading,
    error,
    orderSummary,
    currentStep,

    // Computed
    isAddressSelected,
    isPaymentMethodSelected,
    canProceedToPayment,
    canConfirmOrder,

    // Methods
    loadAddresses,
    loadPaymentMethods,
    applyCoupon,
    processPayment,
    nextStep,
    previousStep
  }
}