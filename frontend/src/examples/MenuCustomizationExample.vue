<template>
  <div class="menu-customization-examples">
    <h2 class="text-h5 mb-4">Menu Customization Examples</h2>

    <!-- Example 1: Basic Menu Item -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Menu Item</h3>
      <v-card>
        <v-card-text>
          <menu-customization
            :item="basicItem"
            @added-to-cart="handleAddToCart"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Pizza with Customizations -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Pizza with Customizations</h3>
      <v-card>
        <v-card-text>
          <menu-customization
            :item="pizzaItem"
            @added-to-cart="handleAddToCart"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ pizzaExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Item with Allergens -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Item with Allergens</h3>
      <v-card>
        <v-card-text>
          <menu-customization
            :item="allergenItem"
            @added-to-cart="handleAddToCart"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ allergenExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 4: Dietary Options -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Dietary Options</h3>
      <v-card>
        <v-card-text>
          <menu-customization
            :item="dietaryItem"
            @added-to-cart="handleAddToCart"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ dietaryExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Cart Preview -->
    <v-dialog v-model="showCart" max-width="400">
      <v-card>
        <v-card-title>Cart Preview</v-card-title>
        <v-card-text>
          <v-list v-if="cartItems.length">
            <v-list-item
              v-for="(item, index) in cartItems"
              :key="index"
              :value="item"
            >
              <v-list-item-title>{{ item.item.name }}</v-list-item-title>
              <v-list-item-subtitle>
                Qty: {{ item.quantity }} • ${{ calculateItemTotal(item) }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider class="my-2"></v-divider>

            <v-list-item>
              <v-list-item-title class="text-right">
                Total: ${{ calculateCartTotal }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
          <div v-else class="text-center py-4">
            Cart is empty
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showCart = false"
          >
            Close
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!cartItems.length"
            @click="checkout"
          >
            Checkout
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script lang="ts">
import { ref, computed } from 'vue'
import MenuCustomization from '@/components/menu/MenuCustomization.vue'

export default {
  name: 'MenuCustomizationExample',

  components: {
    MenuCustomization
  },

  setup() {
    // Sample items
    const basicItem = {
      id: '1',
      name: 'Classic Burger',
      description: 'Beef patty with lettuce, tomato, and cheese',
      price: 9.99,
      image: '/images/sample/burger.jpg'
    }

    const pizzaItem = {
      id: '2',
      name: 'Custom Pizza',
      description: 'Build your own pizza with your favorite toppings',
      price: 12.99,
      image: '/images/sample/pizza.jpg',
      sizes: [
        { id: 's', name: 'Small (10")', priceAdjustment: 0 },
        { id: 'm', name: 'Medium (12")', priceAdjustment: 3 },
        { id: 'l', name: 'Large (14")', priceAdjustment: 6 }
      ],
      ingredients: [
        { id: 'cheese', name: 'Cheese', priceAdjustment: 0 },
        { id: 'pepperoni', name: 'Pepperoni', priceAdjustment: 1.5 },
        { id: 'mushrooms', name: 'Mushrooms', priceAdjustment: 1 },
        { id: 'onions', name: 'Onions', priceAdjustment: 0.5 },
        { id: 'peppers', name: 'Bell Peppers', priceAdjustment: 0.5 }
      ],
      addOns: [
        { id: 'ex_cheese', name: 'Extra Cheese', price: 2, maxQuantity: 1 },
        { id: 'garlic', name: 'Garlic Crust', price: 1, maxQuantity: 1 },
        { id: 'ranch', name: 'Ranch Dip', price: 0.5, maxQuantity: 3 }
      ]
    }

    const allergenItem = {
      id: '3',
      name: 'Shrimp Pasta',
      description: 'Creamy pasta with shrimp and garlic sauce',
      price: 15.99,
      image: '/images/sample/pasta.jpg',
      allergens: ['shellfish', 'dairy', 'gluten'],
      addOns: [
        { id: 'ex_shrimp', name: 'Extra Shrimp', price: 4, maxQuantity: 2 },
        { id: 'cheese', name: 'Parmesan Cheese', price: 1, maxQuantity: 1 }
      ]
    }

    const dietaryItem = {
      id: '4',
      name: 'Buddha Bowl',
      description: 'Healthy bowl with quinoa, vegetables, and tofu',
      price: 13.99,
      image: '/images/sample/bowl.jpg',
      dietaryTags: ['vegetarian', 'vegan', 'glutenFree'],
      addOns: [
        { id: 'av', name: 'Avocado', price: 2, maxQuantity: 1 },
        { id: 'tofu', name: 'Extra Tofu', price: 3, maxQuantity: 1 },
        { id: 'seeds', name: 'Mixed Seeds', price: 1, maxQuantity: 1 }
      ]
    }

    // Cart state
    const showCart = ref(false)
    const cartItems = ref<Array<{
      item: any;
      quantity: number;
      customizations: any;
    }>>([])

    // Computed
    const calculateCartTotal = computed(() => {
      return cartItems.value.reduce((total, item) => {
        return total + calculateItemTotal(item)
      }, 0).toFixed(2)
    })

    // Methods
    const handleAddToCart = (event: any) => {
      cartItems.value.push(event)
      showCart.value = true
    }

    const calculateItemTotal = (item: any) => {
      let total = item.item.price

      if (item.customizations.size) {
        total += item.customizations.size.priceAdjustment
      }

      if (item.customizations.addons) {
        item.customizations.addons.forEach((addon: any) => {
          const addOnDef = item.item.addOns?.find((a: any) => a.id === addon.id)
          if (addOnDef) {
            total += addOnDef.price * addon.quantity
          }
        })
      }

      return (total * item.quantity).toFixed(2)
    }

    const checkout = () => {
      console.log('Proceeding to checkout with items:', cartItems.value)
    }

    // Code examples
    const basicExample = `<menu-customization
  :item="{
    id: '1',
    name: 'Classic Burger',
    description: 'Beef patty with lettuce, tomato, and cheese',
    price: 9.99,
    image: '/images/burger.jpg'
  }"
  @added-to-cart="handleAddToCart"
/>`

    const pizzaExample = `<menu-customization
  :item="{
    id: '2',
    name: 'Custom Pizza',
    price: 12.99,
    sizes: [
      { id: 's', name: 'Small (10")', priceAdjustment: 0 },
      { id: 'm', name: 'Medium (12")', priceAdjustment: 3 },
      { id: 'l', name: 'Large (14")', priceAdjustment: 6 }
    ],
    ingredients: [
      { id: 'cheese', name: 'Cheese', priceAdjustment: 0 },
      { id: 'pepperoni', name: 'Pepperoni', priceAdjustment: 1.5 }
    ],
    addOns: [
      { id: 'ex_cheese', name: 'Extra Cheese', price: 2, maxQuantity: 1 }
    ]
  }"
  @added-to-cart="handleAddToCart"
/>`

    const allergenExample = `<menu-customization
  :item="{
    id: '3',
    name: 'Shrimp Pasta',
    price: 15.99,
    allergens: ['shellfish', 'dairy', 'gluten'],
    addOns: [
      { id: 'ex_shrimp', name: 'Extra Shrimp', price: 4, maxQuantity: 2 }
    ]
  }"
  @added-to-cart="handleAddToCart"
/>`

    const dietaryExample = `<menu-customization
  :item="{
    id: '4',
    name: 'Buddha Bowl',
    price: 13.99,
    dietaryTags: ['vegetarian', 'vegan', 'glutenFree'],
    addOns: [
      { id: 'av', name: 'Avocado', price: 2, maxQuantity: 1 }
    ]
  }"
  @added-to-cart="handleAddToCart"
/>`

    return {
      // Sample items
      basicItem,
      pizzaItem,
      allergenItem,
      dietaryItem,

      // Cart state
      showCart,
      cartItems,
      calculateCartTotal,

      // Methods
      handleAddToCart,
      calculateItemTotal,
      checkout,

      // Code examples
      basicExample,
      pizzaExample,
      allergenExample,
      dietaryExample
    }
  }
}
</script>

<style scoped>
.menu-customization-examples {
  padding: 16px;
}

.code-example {
  font-family: monospace;
  white-space: pre-wrap;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  overflow-x: auto;
}
</style>