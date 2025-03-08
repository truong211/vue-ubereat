<template>
  <div class="loyalty-examples">
    <h2 class="text-h5 mb-4">Loyalty Program Examples</h2>

    <!-- Example 1: Basic Loyalty Program -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Basic Loyalty Program</h3>
      <v-card>
        <v-card-text>
          <loyalty-program
            user-id="123"
          />
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ basicExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 2: Points Simulation -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Points Simulation</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <!-- Points Calculator -->
            <v-col cols="12" md="4">
              <v-card variant="outlined">
                <v-card-title>Points Calculator</v-card-title>
                <v-card-text>
                  <v-text-field
                    v-model.number="simulatedOrder.amount"
                    label="Order Amount"
                    prefix="$"
                    type="number"
                    :rules="[rules.positiveNumber]"
                  ></v-text-field>

                  <v-select
                    v-model="simulatedOrder.type"
                    :items="orderTypes"
                    label="Order Type"
                  ></v-select>

                  <v-checkbox
                    v-model="simulatedOrder.isPromotion"
                    label="Promotional Period"
                  ></v-checkbox>

                  <v-divider class="my-4"></v-divider>

                  <div class="d-flex justify-space-between align-center">
                    <div class="text-subtitle-1">Points Earned:</div>
                    <div class="text-h5">{{ calculatedPoints }}</div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Loyalty Preview -->
            <v-col cols="12" md="8">
              <loyalty-program
                :user-id="'123'"
                :simulated-points="calculatedPoints"
                @points-update="handlePointsUpdate"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ simulationExample }}</pre>
        </v-card-text>
      </v-card>
    </section>

    <!-- Example 3: Tier Comparison -->
    <section class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-2">Tier Comparison</h3>
      <v-card>
        <v-card-text>
          <v-row>
            <v-col
              v-for="tier in loyaltyTiers"
              :key="tier.id"
              cols="12"
              md="4"
            >
              <v-card
                :color="tier.color"
                :variant="tier.variant"
                class="tier-card"
              >
                <v-card-title>
                  <v-avatar :image="tier.badge" size="32" class="mr-2"></v-avatar>
                  {{ tier.name }}
                </v-card-title>
                
                <v-card-text>
                  <div class="text-subtitle-1 mb-2">
                    {{ tier.pointsRequired }} points required
                  </div>

                  <v-list density="compact">
                    <v-list-item
                      v-for="benefit in tier.benefits"
                      :key="benefit.id"
                      :value="benefit"
                    >
                      <template v-slot:prepend>
                        <v-icon :color="tier.iconColor">{{ benefit.icon }}</v-icon>
                      </template>
                      <v-list-item-title>{{ benefit.name }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-text class="bg-grey-lighten-4">
          <pre class="code-example">{{ tiersExample }}</pre>
        </v-card-text>
      </v-card>
    </section>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import LoyaltyProgram from '@/components/user/LoyaltyProgram.vue'

export default {
  name: 'LoyaltyProgramExample',
  
  components: {
    LoyaltyProgram
  },
  
  setup() {
    // State
    const simulatedOrder = ref({
      amount: 50,
      type: 'delivery',
      isPromotion: false
    })
    
    // Order types
    const orderTypes = [
      { title: 'Delivery', value: 'delivery' },
      { title: 'Pickup', value: 'pickup' },
      { title: 'Dine-in', value: 'dine_in' }
    ]
    
    // Loyalty tiers
    const loyaltyTiers = ref([
      {
        id: 'bronze',
        name: 'Bronze',
        badge: '/images/badges/bronze.png',
        color: 'brown-lighten-4',
        variant: 'outlined',
        iconColor: 'brown',
        pointsRequired: 0,
        benefits: [
          { id: 1, name: 'Earn 1 point per $1', icon: 'mdi-currency-usd' },
          { id: 2, name: 'Birthday reward', icon: 'mdi-cake-variant' },
          { id: 3, name: 'Member-only offers', icon: 'mdi-tag' }
        ]
      },
      {
        id: 'silver',
        name: 'Silver',
        badge: '/images/badges/silver.png',
        color: 'grey-lighten-3',
        variant: 'elevated',
        iconColor: 'grey-darken-1',
        pointsRequired: 1000,
        benefits: [
          { id: 1, name: 'Earn 1.5 points per $1', icon: 'mdi-currency-usd' },
          { id: 2, name: 'Free delivery', icon: 'mdi-truck-delivery' },
          { id: 3, name: 'Priority support', icon: 'mdi-headset' },
          { id: 4, name: 'All Bronze benefits', icon: 'mdi-check' }
        ]
      },
      {
        id: 'gold',
        name: 'Gold',
        badge: '/images/badges/gold.png',
        color: 'amber-lighten-4',
        variant: 'elevated',
        iconColor: 'amber-darken-2',
        pointsRequired: 5000,
        benefits: [
          { id: 1, name: 'Earn 2 points per $1', icon: 'mdi-currency-usd' },
          { id: 2, name: 'Priority orders', icon: 'mdi-star' },
          { id: 3, name: 'Exclusive events', icon: 'mdi-glass-wine' },
          { id: 4, name: 'All Silver benefits', icon: 'mdi-check' }
        ]
      }
    ])
    
    // Rules
    const rules = {
      positiveNumber: v => v >= 0 || 'Must be 0 or greater'
    }
    
    // Computed
    const calculatedPoints = computed(() => {
      let points = simulatedOrder.value.amount
      
      // Base multiplier by order type
      const multipliers = {
        delivery: 1,
        pickup: 1.2,
        dine_in: 1.5
      }
      points *= multipliers[simulatedOrder.value.type]
      
      // Promotional bonus
      if (simulatedOrder.value.isPromotion) {
        points *= 1.5
      }
      
      return Math.round(points)
    })
    
    // Event handlers
    const handlePointsUpdate = (points) => {
      console.log('Points updated:', points)
    }
    
    // Code examples
    const basicExample = computed(() => {
      return `<loyalty-program
  user-id="123"
/>`
    })
    
    const simulationExample = computed(() => {
      return `<loyalty-program
  :user-id="'123'"
  :simulated-points="calculatedPoints"
  @points-update="handlePointsUpdate"
/>`
    })
    
    const tiersExample = computed(() => {
      return `<!-- Tier Card Example -->
<v-card
  :color="tier.color"
  :variant="tier.variant"
>
  <v-card-title>
    <v-avatar :image="tier.badge" size="32"></v-avatar>
    {{ tier.name }}
  </v-card-title>
  
  <v-card-text>
    <v-list>
      <v-list-item
        v-for="benefit in tier.benefits"
        :key="benefit.id"
      >
        <v-icon>{{ benefit.icon }}</v-icon>
        {{ benefit.name }}
      </v-list-item>
    </v-list>
  </v-card-text>
</v-card>`
    })
    
    return {
      simulatedOrder,
      orderTypes,
      loyaltyTiers,
      rules,
      calculatedPoints,
      handlePointsUpdate,
      basicExample,
      simulationExample,
      tiersExample
    }
  }
}
</script>

<style scoped>
.loyalty-examples {
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

.tier-card {
  height: 100%;
}
</style>