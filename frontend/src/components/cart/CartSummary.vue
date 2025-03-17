<template>
  <v-card class="cart-summary">
    <v-card-title class="d-flex align-center pa-4">
      <v-icon start>mdi-cart</v-icon>
      Your Order
      <v-spacer></v-spacer>
      <v-chip>{{ items.length }} items</v-chip>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Cart Items -->
    <v-list lines="three">
      <v-list-item
        v-for="item in items"
        :key="item.id"
        :title="item.name"
        :subtitle="item.description"
      >
        <template v-slot:prepend>
          <v-avatar size="48" rounded="lg">
            <v-img :src="item.image" cover></v-img>
          </v-avatar>
        </template>

        <template v-slot:append>
          <div class="d-flex align-center">
            <v-btn
              icon="mdi-minus"
              variant="text"
              density="comfortable"
              @click="updateQuantity(item, item.quantity - 1)"
              :disabled="item.quantity <= 1"
            ></v-btn>
            <span class="mx-2">{{ item.quantity }}</span>
            <v-btn
              icon="mdi-plus"
              variant="text"
              density="comfortable"
              @click="updateQuantity(item, item.quantity + 1)"
            ></v-btn>
            <div class="ml-4 text-right">
              <div class="text-subtitle-1 font-weight-bold">${{ (item.price * item.quantity).toFixed(2) }}</div>
              <div class="text-caption text-medium-emphasis">${{ item.price.toFixed(2) }} each</div>
            </div>
          </div>
        </template>
      </v-list-item>
    </v-list>

    <v-divider></v-divider>

    <!-- Order Summary -->
    <v-card-text>
      <div class="d-flex justify-space-between mb-2">
        <span>Subtotal</span>
        <span>${{ subtotal.toFixed(2) }}</span>
      </div>
      <div class="d-flex justify-space-between mb-2">
        <span>Delivery Fee</span>
        <span>${{ deliveryFee.toFixed(2) }}</span>
      </div>
      <div class="d-flex justify-space-between mb-2">
        <span>Tax</span>
        <span>${{ tax.toFixed(2) }}</span>
      </div>
      <div v-if="discount > 0" class="d-flex justify-space-between mb-2 text-success">
        <span>Discount</span>
        <span>-${{ discount.toFixed(2) }}</span>
      </div>
      <v-divider class="my-2"></v-divider>
      <div class="d-flex justify-space-between text-h6 font-weight-bold">
        <span>Total</span>
        <span>${{ total.toFixed(2) }}</span>
      </div>
    </v-card-text>

    <!-- Promo Code -->
    <v-card-text>
      <v-text-field
        v-model="promoCode"
        label="Promo Code"
        variant="outlined"
        density="comfortable"
        hide-details
        :error-messages="promoError"
        class="mb-2"
      >
        <template v-slot:append>
          <v-btn
            color="primary"
            variant="text"
            :loading="applyingPromo"
            @click="applyPromoCode"
          >
            Apply
          </v-btn>
        </template>
      </v-text-field>
    </v-card-text>

    <!-- Checkout Button -->
    <v-card-actions class="pa-4">
      <v-btn
        color="primary"
        block
        size="large"
        :disabled="!items.length"
        @click="proceedToCheckout"
      >
        Proceed to Checkout
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'CartSummary',

  props: {
    items: {
      type: Array,
      required: true
    },
    deliveryFee: {
      type: Number,
      default: 0
    }
  },

  emits: ['update:items', 'checkout'],

  setup(props, { emit }) {
    const promoCode = ref('')
    const promoError = ref('')
    const applyingPromo = ref(false)
    const discount = ref(0)

    // Computed Properties
    const subtotal = computed(() => {
      return props.items.reduce((total, item) => {
        return total + (item.price * item.quantity)
      }, 0)
    })

    const tax = computed(() => {
      return subtotal.value * 0.1 // 10% tax
    })

    const total = computed(() => {
      return subtotal.value + props.deliveryFee + tax.value - discount.value
    })

    // Methods
    const updateQuantity = (item, newQuantity) => {
      if (newQuantity < 1) return
      
      const updatedItems = props.items.map(cartItem => {
        if (cartItem.id === item.id) {
          return { ...cartItem, quantity: newQuantity }
        }
        return cartItem
      })
      
      emit('update:items', updatedItems)
    }

    const applyPromoCode = async () => {
      if (!promoCode.value) return
      
      applyingPromo.value = true
      promoError.value = ''

      try {
        // TODO: Implement promo code validation with backend
        const response = await validatePromoCode(promoCode.value)
        discount.value = response.discount
      } catch (error) {
        promoError.value = error.message || 'Invalid promo code'
        discount.value = 0
      } finally {
        applyingPromo.value = false
      }
    }

    const proceedToCheckout = () => {
      emit('checkout', {
        items: props.items,
        subtotal: subtotal.value,
        deliveryFee: props.deliveryFee,
        tax: tax.value,
        discount: discount.value,
        total: total.value,
        promoCode: promoCode.value
      })
    }

    return {
      promoCode,
      promoError,
      applyingPromo,
      discount,
      subtotal,
      tax,
      total,
      updateQuantity,
      applyPromoCode,
      proceedToCheckout
    }
  }
}
</script>

<style scoped>
.cart-summary {
  position: sticky;
  top: 24px;
}
</style>