<template>
  <div class="menu-customization">
    <!-- Content remains the same as before -->
    <v-card>
      <v-img
        v-if="item.image"
        :src="item.image"
        height="200"
        cover
      ></v-img>

      <v-card-title>{{ item.name }}</v-card-title>
      
      <!-- Rest of the template remains the same -->
    </v-card>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import { useStore } from 'vuex'
import { useToast } from '@/composables/useToast'

interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  dietaryTags?: string[];
  allergens?: string[];
  sizes?: Array<{
    id: string;
    name: string;
    priceAdjustment: number;
  }>;
  ingredients?: Array<{
    id: string;
    name: string;
    priceAdjustment?: number;
  }>;
  addOns?: Array<{
    id: string;
    name: string;
    price: number;
    maxQuantity: number;
  }>;
}

interface CartCustomizations {
  size?: {
    id: string;
    name: string;
    priceAdjustment: number;
  };
  ingredients?: string[];
  addons?: Array<{
    id: string;
    quantity: number;
  }>;
  specialInstructions?: string;
}

interface AddToCartPayload {
  itemId: string;
  quantity: number;
  customizations: CartCustomizations;
}

export default {
  name: 'MenuCustomization',

  props: {
    item: {
      type: Object as () => MenuItem,
      required: true,
      validator: (item: MenuItem) => {
        return Boolean(item.id && item.name && typeof item.price === 'number')
      }
    }
  },

  emits: ['added-to-cart'],

  setup(props, { emit }) {
    const store = useStore()
    const { showToast } = useToast()

    // State
    const quantity = ref(1)
    const selectedSize = ref(props.item.sizes?.[0] || null)
    const selectedIngredients = ref(
      props.item.ingredients?.map(i => i.id) || []
    )
    const selectedAddons = ref<Record<string, number>>({})
    const specialInstructions = ref('')
    const addingToCart = ref(false)

    // Initialize addons
    if (props.item.addOns) {
      props.item.addOns.forEach(addon => {
        selectedAddons.value[addon.id] = 0
      })
    }

    // Computed
    const calculateTotalPrice = computed(() => {
      let total = props.item.price

      // Add size adjustment
      if (selectedSize.value) {
        total += selectedSize.value.priceAdjustment
      }

      // Add ingredients adjustments
      if (props.item.ingredients) {
        props.item.ingredients.forEach(ingredient => {
          if (selectedIngredients.value.includes(ingredient.id) && ingredient.priceAdjustment) {
            total += ingredient.priceAdjustment
          }
        })
      }

      // Add addons
      if (props.item.addOns) {
        props.item.addOns.forEach(addon => {
          total += (addon.price * selectedAddons.value[addon.id])
        })
      }

      return Number(total.toFixed(2))
    })

    const hasCustomizations = computed(() => {
      return (
        (selectedSize.value && props.item.sizes?.length > 1) ||
        (selectedIngredients.value.length !== props.item.ingredients?.length) ||
        Object.values(selectedAddons.value).some(qty => qty > 0) ||
        specialInstructions.value.trim().length > 0
      )
    })

    const hasAllergens = computed(() => {
      return props.item.allergens?.length > 0
    })

    // Methods
    const getDietaryIcon = (tag: string): string => {
      const icons: Record<string, string> = {
        vegetarian: 'mdi-leaf',
        vegan: 'mdi-sprout',
        glutenFree: 'mdi-grain',
        spicy: 'mdi-pepper-hot',
        halal: 'mdi-food-halal'
      }
      return icons[tag.toLowerCase()] || 'mdi-food'
    }

    const getAddonQuantity = (addon: { id: string }): number => {
      return selectedAddons.value[addon.id] || 0
    }

    const increaseAddon = (addon: { id: string; maxQuantity: number }): void => {
      if (selectedAddons.value[addon.id] < addon.maxQuantity) {
        selectedAddons.value[addon.id]++
      }
    }

    const decreaseAddon = (addon: { id: string }): void => {
      if (selectedAddons.value[addon.id] > 0) {
        selectedAddons.value[addon.id]--
      }
    }

    const addToCart = async (): Promise<void> => {
      addingToCart.value = true
      try {
        const customizations: CartCustomizations = {
          size: selectedSize.value,
          ingredients: selectedIngredients.value,
          addons: Object.entries(selectedAddons.value)
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => ({
              id,
              quantity: qty
            })),
          specialInstructions: specialInstructions.value.trim()
        }

        const payload: AddToCartPayload = {
          itemId: props.item.id,
          quantity: quantity.value,
          customizations
        }

        await store.dispatch('cart/addItem', payload)

        showToast('Added to cart', 'success')
        emit('added-to-cart', {
          item: props.item,
          quantity: quantity.value,
          customizations
        })
      } catch (error) {
        console.error('Failed to add item to cart:', error)
        showToast('Failed to add item to cart', 'error')
      } finally {
        addingToCart.value = false
      }
    }

    return {
      // State
      quantity,
      selectedSize,
      selectedIngredients,
      selectedAddons,
      specialInstructions,
      addingToCart,

      // Computed
      calculateTotalPrice,
      hasCustomizations,
      hasAllergens,

      // Methods
      getDietaryIcon,
      getAddonQuantity,
      increaseAddon,
      decreaseAddon,
      addToCart
    }
  }
}
</script>

<style scoped>
.menu-customization {
  max-width: 600px;
  margin: 0 auto;
}

.v-btn-group .v-btn--disabled {
  opacity: 1 !important;
  color: inherit !important;
}
</style>