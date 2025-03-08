<template>
  <div class="loyalty-program">
    <!-- Tier Status Card -->
    <v-card class="mb-4">
      <v-img
        :src="currentTier.backgroundImage"
        height="200"
        cover
        class="tier-card"
      >
        <div class="tier-content pa-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <div class="text-h5">{{ currentTier.name }}</div>
              <div class="text-subtitle-1">{{ user.name }}</div>
            </div>
            <v-avatar :image="currentTier.badge" size="64"></v-avatar>
          </div>

          <div class="mt-4">
            <div class="text-h4">{{ formatNumber(points) }}</div>
            <div class="text-subtitle-2">Available Points</div>
          </div>

          <div class="mt-4">
            <v-progress-linear
              :model-value="tierProgress.percentage"
              height="8"
              rounded
              :color="currentTier.color"
            ></v-progress-linear>
            <div class="d-flex justify-space-between mt-1">
              <div class="text-caption">{{ formatNumber(tierProgress.current) }} / {{ formatNumber(tierProgress.target) }}</div>
              <div class="text-caption">{{ tierProgress.remaining }} to next tier</div>
            </div>
          </div>
        </div>
      </v-img>
    </v-card>

    <!-- Quick Actions -->
    <v-row class="mb-4">
      <v-col cols="6" sm="3">
        <v-btn
          block
          prepend-icon="mdi-gift"
          variant="outlined"
          :to="{ name: 'RewardsCatalog' }"
        >
          Rewards
        </v-btn>
      </v-col>
      <v-col cols="6" sm="3">
        <v-btn
          block
          prepend-icon="mdi-bell"
          variant="outlined"
          @click="showOffers = true"
        >
          Offers
        </v-btn>
      </v-col>
      <v-col cols="6" sm="3">
        <v-btn
          block
          prepend-icon="mdi-account-multiple"
          variant="outlined"
          @click="showReferral = true"
        >
          Refer
        </v-btn>
      </v-col>
      <v-col cols="6" sm="3">
        <v-btn
          block
          prepend-icon="mdi-history"
          variant="outlined"
          @click="showHistory = true"
        >
          History
        </v-btn>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-row>
      <!-- Available Rewards -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            Available Rewards
            <v-btn
              variant="text"
              color="primary"
              :to="{ name: 'RewardsCatalog' }"
            >
              View All
            </v-btn>
          </v-card-title>

          <v-divider></v-divider>

          <v-container class="py-2">
            <v-row>
              <v-col
                v-for="reward in availableRewards"
                :key="reward.id"
                cols="12"
                sm="6"
                lg="4"
              >
                <v-card variant="outlined" class="reward-card">
                  <v-img
                    :src="reward.image"
                    height="120"
                    cover
                  ></v-img>
                  
                  <v-card-title>{{ reward.name }}</v-card-title>
                  
                  <v-card-text>
                    <p class="mb-2">{{ reward.description }}</p>
                    <div class="text-subtitle-1 font-weight-bold">
                      {{ formatNumber(reward.points) }} points
                    </div>
                  </v-card-text>
                  
                  <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn
                      color="primary"
                      :disabled="points < reward.points"
                      @click="redeemReward(reward)"
                    >
                      Redeem
                    </v-btn>
                  </v-card-actions>
                </v-card>
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-col>

      <!-- Benefits & Progress -->
      <v-col cols="12" md="4">
        <!-- Current Benefits -->
        <v-card class="mb-4">
          <v-card-title>Current Benefits</v-card-title>
          <v-list>
            <v-list-item
              v-for="benefit in currentTier.benefits"
              :key="benefit.id"
              :value="benefit"
            >
              <template v-slot:prepend>
                <v-icon :color="currentTier.color">
                  {{ benefit.icon }}
                </v-icon>
              </template>
              <v-list-item-title>{{ benefit.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ benefit.description }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- Point Earning Opportunities -->
        <v-card>
          <v-card-title>Earn More Points</v-card-title>
          <v-list>
            <v-list-item
              v-for="opportunity in earningOpportunities"
              :key="opportunity.id"
              :value="opportunity"
            >
              <template v-slot:prepend>
                <v-icon color="primary">{{ opportunity.icon }}</v-icon>
              </template>
              <v-list-item-title>{{ opportunity.title }}</v-list-item-title>
              <v-list-item-subtitle>
                Earn {{ opportunity.points }} points
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-btn
                  size="small"
                  :to="opportunity.action.route"
                >
                  {{ opportunity.action.label }}
                </v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Offers Dialog -->
    <v-dialog v-model="showOffers" max-width="600">
      <v-card>
        <v-card-title>Special Offers</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="offer in personalizedOffers"
              :key="offer.id"
              :value="offer"
            >
              <template v-slot:prepend>
                <v-avatar :image="offer.image" size="48"></v-avatar>
              </template>
              
              <v-list-item-title>{{ offer.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ offer.description }}</v-list-item-subtitle>
              
              <template v-slot:append>
                <div class="text-right">
                  <div class="text-caption">Expires in</div>
                  <div>{{ formatExpiry(offer.expiresAt) }}</div>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showOffers = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Referral Dialog -->
    <v-dialog v-model="showReferral" max-width="500">
      <v-card>
        <v-card-title>Refer a Friend</v-card-title>
        <v-card-text>
          <div class="text-center mb-4">
            <div class="text-h6">Your Referral Code</div>
            <div class="d-flex align-center justify-center mt-2">
              <div class="text-h4 font-weight-bold">{{ referralCode }}</div>
              <v-btn
                icon="mdi-content-copy"
                variant="text"
                size="small"
                class="ml-2"
                @click="copyReferralCode"
              >
                <v-tooltip activator="parent" location="top">
                  Copy Code
                </v-tooltip>
              </v-btn>
            </div>
            <div class="text-caption mt-2">Share this code with friends</div>
          </div>

          <v-divider class="mb-4"></v-divider>

          <div class="text-subtitle-1 mb-2">Your Referral Stats</div>
          <div class="d-flex justify-space-around mb-4">
            <div class="text-center">
              <div class="text-h6">{{ referralStats.totalReferrals }}</div>
              <div class="text-caption">Total Referrals</div>
            </div>
            <div class="text-center">
              <div class="text-h6">{{ formatNumber(referralStats.pointsEarned) }}</div>
              <div class="text-caption">Points Earned</div>
            </div>
          </div>

          <!-- Share Buttons -->
          <div class="d-flex justify-space-around">
            <v-btn
              prepend-icon="mdi-whatsapp"
              color="success"
              @click="shareViaWhatsApp"
            >
              WhatsApp
            </v-btn>
            <v-btn
              prepend-icon="mdi-facebook"
              color="primary"
              @click="shareViaFacebook"
            >
              Facebook
            </v-btn>
            <v-btn
              prepend-icon="mdi-email"
              color="info"
              @click="shareViaEmail"
            >
              Email
            </v-btn>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showReferral = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- History Dialog -->
    <v-dialog v-model="showHistory" max-width="800">
      <v-card>
        <v-card-title>Points History</v-card-title>
        <v-card-text>
          <v-data-table
            :headers="historyHeaders"
            :items="pointsHistory"
            :loading="loadingHistory"
          >
            <template v-slot:item.points="{ item }">
              <span :class="item.points >= 0 ? 'text-success' : 'text-error'">
                {{ item.points >= 0 ? '+' : '' }}{{ item.points }}
              </span>
            </template>
            <template v-slot:item.balance="{ item }">
              {{ formatNumber(item.balance) }}
            </template>
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="showHistory = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { format, formatDistanceToNow } from 'date-fns'
import loyaltyService from '@/services/loyalty.service'

export default {
  name: 'LoyaltyProgram',

  props: {
    userId: {
      type: String,
      required: true
    }
  },

  setup(props) {
    const store = useStore()
    
    // State
    const points = ref(0)
    const user = ref({})
    const currentTier = ref({})
    const tierProgress = ref({})
    const availableRewards = ref([])
    const personalizedOffers = ref([])
    const pointsHistory = ref([])
    const referralCode = ref('')
    const referralStats = ref({})
    const loadingHistory = ref(false)
    
    // Dialog state
    const showOffers = ref(false)
    const showReferral = ref(false)
    const showHistory = ref(false)
    
    // Table headers
    const historyHeaders = [
      { title: 'Date', key: 'date' },
      { title: 'Description', key: 'description' },
      { title: 'Points', key: 'points', align: 'center' },
      { title: 'Balance', key: 'balance', align: 'center' }
    ]
    
    // Load data
    const loadLoyaltyData = async () => {
      try {
        const [
          status,
          rewards,
          offers,
          code,
          stats
        ] = await Promise.all([
          loyaltyService.getLoyaltyStatus(props.userId),
          loyaltyService.getAvailableRewards(props.userId),
          loyaltyService.getPersonalizedOffers(props.userId),
          loyaltyService.getReferralCode(props.userId),
          loyaltyService.getReferralStats(props.userId)
        ])
        
        points.value = status.points
        user.value = status.user
        currentTier.value = status.tier
        tierProgress.value = status.progress
        availableRewards.value = rewards
        personalizedOffers.value = offers
        referralCode.value = code.code
        referralStats.value = stats
      } catch (error) {
        console.error('Failed to load loyalty data:', error)
      }
    }
    
    const loadPointsHistory = async () => {
      loadingHistory.value = true
      try {
        const history = await loyaltyService.getPointTransactions(props.userId)
        pointsHistory.value = history
      } catch (error) {
        console.error('Failed to load points history:', error)
      } finally {
        loadingHistory.value = false
      }
    }
    
    // Rewards
    const redeemReward = async (reward) => {
      try {
        await loyaltyService.redeemReward(props.userId, reward.id)
        // Refresh data after redemption
        loadLoyaltyData()
      } catch (error) {
        console.error('Failed to redeem reward:', error)
      }
    }
    
    // Referral sharing
    const copyReferralCode = () => {
      navigator.clipboard.writeText(referralCode.value)
      store.dispatch('ui/showSnackbar', {
        text: 'Referral code copied to clipboard',
        color: 'success'
      })
    }
    
    const shareViaWhatsApp = () => {
      const text = `Join me on Food Delivery! Use my referral code ${referralCode.value} to get bonus points!`
      window.open(`whatsapp://send?text=${encodeURIComponent(text)}`)
    }
    
    const shareViaFacebook = () => {
      // Implement Facebook sharing
    }
    
    const shareViaEmail = () => {
      const subject = 'Join me on Food Delivery'
      const body = `Use my referral code ${referralCode.value} to get bonus points!`
      window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    }
    
    // Utility methods
    const formatNumber = (value) => {
      return new Intl.NumberFormat().format(value)
    }
    
    const formatDate = (date) => {
      return format(new Date(date), 'MMM d, yyyy')
    }
    
    const formatExpiry = (date) => {
      return formatDistanceToNow(new Date(date), { addSuffix: true })
    }
    
    // Example earning opportunities
    const earningOpportunities = [
      {
        id: 1,
        title: 'Complete Your Profile',
        points: 100,
        icon: 'mdi-account-check',
        action: {
          label: 'Complete',
          route: { name: 'Profile' }
        }
      },
      {
        id: 2,
        title: 'Write a Review',
        points: 50,
        icon: 'mdi-star',
        action: {
          label: 'Review',
          route: { name: 'OrderHistory' }
        }
      },
      {
        id: 3,
        title: 'Make Your First Order',
        points: 200,
        icon: 'mdi-food',
        action: {
          label: 'Order',
          route: { name: 'Restaurants' }
        }
      }
    ]
    
    // Initialize
    onMounted(() => {
      loadLoyaltyData()
    })
    
    return {
      points,
      user,
      currentTier,
      tierProgress,
      availableRewards,
      personalizedOffers,
      pointsHistory,
      referralCode,
      referralStats,
      showOffers,
      showReferral,
      showHistory,
      loadingHistory,
      historyHeaders,
      earningOpportunities,
      redeemReward,
      copyReferralCode,
      shareViaWhatsApp,
      shareViaFacebook,
      shareViaEmail,
      formatNumber,
      formatDate,
      formatExpiry
    }
  }
}
</script>

<style scoped>
.loyalty-program {
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
}

.tier-card {
  position: relative;
}

.tier-content {
  position: relative;
  z-index: 2;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.reward-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.reward-card .v-card-actions {
  margin-top: auto;
}

.tier-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
}
</style>