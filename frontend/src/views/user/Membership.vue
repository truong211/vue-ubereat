<template>
  <v-container>
    <!-- Membership Status Card -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-text class="d-flex align-center">
            <div class="membership-icon mr-4">
              <v-icon size="42" :color="membershipTierColor">{{ membershipTierIcon }}</v-icon>
            </div>
            <div>
              <h2 class="text-h5 mb-2">{{ membershipTier }} Member</h2>
              <p class="text-subtitle-1 text-medium-emphasis">
                Member since {{ formatDate(memberSince) }}
              </p>
              <p class="mt-2">{{ membershipPoints }} points accumulated</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Benefits Comparison -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title>Membership Benefits</v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th class="text-left">Benefits</th>
                  <th class="text-center">Basic</th>
                  <th class="text-center">Silver</th>
                  <th class="text-center">Gold</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="benefit in benefits" :key="benefit.name">
                  <td>{{ benefit.name }}</td>
                  <td class="text-center">
                    <v-icon v-if="benefit.basic" color="success">mdi-check</v-icon>
                    <v-icon v-else color="error">mdi-close</v-icon>
                  </td>
                  <td class="text-center">
                    <v-icon v-if="benefit.silver" color="success">mdi-check</v-icon>
                    <v-icon v-else color="error">mdi-close</v-icon>
                  </td>
                  <td class="text-center">
                    <v-icon v-if="benefit.gold" color="success">mdi-check</v-icon>
                    <v-icon v-else color="error">mdi-close</v-icon>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Upgrade Options -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title>Upgrade Your Membership</v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="tier in upgradeTiers" :key="tier.name" cols="12" md="4">
                <v-card variant="outlined" class="h-100">
                  <v-card-title class="text-center">{{ tier.name }}</v-card-title>
                  <v-card-text class="text-center">
                    <div class="text-h4 mb-4">${{ tier.price }}/year</div>
                    <ul class="tier-features">
                      <li v-for="feature in tier.features" :key="feature">{{ feature }}</li>
                    </ul>
                  </v-card-text>
                  <v-card-actions class="justify-center pb-4">
                    <v-btn
                      color="primary"
                      :disabled="tier.name === membershipTier"
                      @click="upgradeMembership(tier)"
                    >
                      {{ tier.name === membershipTier ? 'Current Plan' : 'Upgrade Now' }}
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Special Offers -->
    <v-row>
      <v-col cols="12">
        <v-card class="mb-4">
          <v-card-title>Exclusive Member Offers</v-card-title>
          <v-card-text>
            <v-row>
              <v-col v-for="offer in exclusiveOffers" :key="offer.id" cols="12" sm="6" md="4">
                <v-card variant="outlined" class="h-100">
                  <v-img :src="offer.image" height="200" cover></v-img>
                  <v-card-title>{{ offer.title }}</v-card-title>
                  <v-card-text>
                    <p>{{ offer.description }}</p>
                    <div class="mt-2">
                      <v-chip color="primary" size="small">{{ offer.discount }}% OFF</v-chip>
                      <v-chip color="warning" size="small" class="ml-2">Ends {{ formatDate(offer.endDate) }}</v-chip>
                    </div>
                  </v-card-text>
                  <v-card-actions>
                    <v-btn color="primary" variant="text" block>Redeem Now</v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Transaction History -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            Transaction History
            <v-btn color="primary" variant="text" @click="loadMoreTransactions">
              View All
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Points</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="transaction in transactions" :key="transaction.id">
                  <td>{{ formatDate(transaction.date) }}</td>
                  <td>{{ transaction.type }}</td>
                  <td :class="transaction.points >= 0 ? 'text-success' : 'text-error'">
                    {{ transaction.points >= 0 ? '+' : '' }}{{ transaction.points }}
                  </td>
                  <td>
                    <v-chip
                      :color="getStatusColor(transaction.status)"
                      size="small"
                    >
                      {{ transaction.status }}
                    </v-chip>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading Dialog -->
    <v-dialog v-model="loading" persistent width="300">
      <v-card>
        <v-card-text class="text-center pa-4">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="mt-3">{{ loadingMessage }}</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'

export default {
  name: 'Membership',

  setup() {
    const store = useStore()
    const loading = ref(false)
    const loadingMessage = ref('')

    // Membership data
    const membershipTier = ref('Basic')
    const membershipPoints = ref(0)
    const memberSince = ref(new Date())

    // Computed values
    const membershipTierIcon = computed(() => {
      switch (membershipTier.value) {
        case 'Gold':
          return 'mdi-crown'
        case 'Silver':
          return 'mdi-star'
        default:
          return 'mdi-account'
      }
    })

    const membershipTierColor = computed(() => {
      switch (membershipTier.value) {
        case 'Gold':
          return 'amber-darken-2'
        case 'Silver':
          return 'grey-lighten-1'
        default:
          return 'primary'
      }
    })

    // Benefits data
    const benefits = ref([
      {
        name: 'Free Delivery on Orders Above $20',
        basic: true,
        silver: true,
        gold: true
      },
      {
        name: 'Priority Customer Support',
        basic: false,
        silver: true,
        gold: true
      },
      {
        name: 'Exclusive Monthly Offers',
        basic: false,
        silver: true,
        gold: true
      },
      {
        name: 'Double Points on Weekends',
        basic: false,
        silver: false,
        gold: true
      },
      {
        name: 'Free Birthday Reward',
        basic: true,
        silver: true,
        gold: true
      }
    ])

    // Upgrade tiers data
    const upgradeTiers = ref([
      {
        name: 'Basic',
        price: '0',
        features: ['Free Delivery on Orders Above $20', 'Basic Customer Support', 'Birthday Reward']
      },
      {
        name: 'Silver',
        price: '49.99',
        features: ['All Basic Benefits', 'Priority Support', 'Exclusive Monthly Offers']
      },
      {
        name: 'Gold',
        price: '99.99',
        features: ['All Silver Benefits', 'Double Points on Weekends', 'VIP Events Access']
      }
    ])

    // Exclusive offers data
    const exclusiveOffers = ref([
      {
        id: 1,
        title: 'Weekend Special',
        description: 'Get extra 20% off on weekend orders',
        discount: 20,
        endDate: new Date(2024, 3, 30),
        image: '/images/offers/weekend-special.jpg'
      },
      {
        id: 2,
        title: 'Premium Restaurants',
        description: 'Exclusive access to premium restaurant deals',
        discount: 15,
        endDate: new Date(2024, 4, 15),
        image: '/images/offers/premium-restaurants.jpg'
      },
      {
        id: 3,
        title: 'Birthday Month',
        description: 'Double points during your birthday month',
        discount: 25,
        endDate: new Date(2024, 5, 1),
        image: '/images/offers/birthday-special.jpg'
      }
    ])

    // Transaction history data
    const transactions = ref([
      {
        id: 1,
        date: new Date(2024, 3, 10),
        type: 'Order Reward',
        points: 100,
        status: 'Completed'
      },
      {
        id: 2,
        date: new Date(2024, 3, 8),
        type: 'Points Redemption',
        points: -500,
        status: 'Completed'
      },
      {
        id: 3,
        date: new Date(2024, 3, 5),
        type: 'Bonus Points',
        points: 250,
        status: 'Pending'
      }
    ])

    // Methods
    const formatDate = (date) => {
      return format(new Date(date), 'MMM d, yyyy')
    }

    const getStatusColor = (status) => {
      switch (status.toLowerCase()) {
        case 'completed':
          return 'success'
        case 'pending':
          return 'warning'
        case 'failed':
          return 'error'
        default:
          return 'grey'
      }
    }

    const upgradeMembership = async (tier) => {
      loading.value = true
      loadingMessage.value = `Processing upgrade to ${tier.name} membership...`

      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Update membership tier
        membershipTier.value = tier.name
        
        // Show success message
        store.dispatch('ui/showSnackbar', {
          message: `Successfully upgraded to ${tier.name} membership!`,
          color: 'success'
        })
      } catch (error) {
        store.dispatch('ui/showSnackbar', {
          message: 'Failed to upgrade membership. Please try again.',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    }

    const loadMoreTransactions = () => {
      // Implement loading more transactions
      console.log('Loading more transactions...')
    }

    // Load initial data
    onMounted(async () => {
      loading.value = true
      loadingMessage.value = 'Loading membership data...'

      try {
        // Simulate API call to fetch membership data
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Update data with response
        const userData = store.getters['auth/user']
        if (userData) {
          membershipTier.value = userData.membershipTier || 'Basic'
          membershipPoints.value = userData.points || 0
          memberSince.value = userData.memberSince || new Date()
        }
      } catch (error) {
        store.dispatch('ui/showSnackbar', {
          message: 'Failed to load membership data',
          color: 'error'
        })
      } finally {
        loading.value = false
      }
    })

    return {
      loading,
      loadingMessage,
      membershipTier,
      membershipPoints,
      memberSince,
      membershipTierIcon,
      membershipTierColor,
      benefits,
      upgradeTiers,
      exclusiveOffers,
      transactions,
      formatDate,
      getStatusColor,
      upgradeMembership,
      loadMoreTransactions
    }
  }
}
</script>

<style scoped>
.tier-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tier-features li {
  margin-bottom: 8px;
  position: relative;
  padding-left: 24px;
}

.tier-features li::before {
  content: "✓";
  position: absolute;
  left: 0;
  color: var(--v-primary-base);
}

.text-success {
  color: rgb(var(--v-theme-success));
}

.text-error {
  color: rgb(var(--v-theme-error));
}
</style>