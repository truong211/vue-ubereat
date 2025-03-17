<template>
  <div class="loyalty-dashboard">
    <v-row>
      <!-- Loyalty Status Card -->
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-item>
            <v-card-title class="text-h5">
              {{ userTier | capitalize }} Member
            </v-card-title>
            <template v-slot:append>
              <v-avatar
                :color="getTierColor(userTier)"
                size="48"
              >
                <v-icon color="white" size="large">{{ getTierIcon(userTier) }}</v-icon>
              </v-avatar>
            </template>
          </v-card-item>

          <v-card-text>
            <div class="d-flex align-center mb-4">
              <span class="text-h4 font-weight-bold mr-2">{{ userPoints }}</span>
              <span class="text-subtitle-1">Points</span>
            </div>

            <!-- Progress to Next Tier (only if not on highest tier) -->
            <template v-if="nextTierInfo.nextTier">
              <div class="text-subtitle-1 mb-2">
                {{ nextTierInfo.pointsNeeded }} points to {{ nextTierInfo.nextTier }}
              </div>
              <v-progress-linear
                :model-value="nextTierInfo.progress"
                :color="getTierColor(nextTierInfo.nextTier)"
                height="10"
                rounded
              ></v-progress-linear>
              <div class="d-flex justify-space-between mt-1 text-caption">
                <span>{{ userTier }}</span>
                <span>{{ nextTierInfo.nextTier }}</span>
              </div>
            </template>
            <template v-else>
              <div class="text-subtitle-1 text-success mb-2">
                You've reached our highest tier!
              </div>
            </template>

            <v-divider class="my-4"></v-divider>

            <!-- Tier Benefits -->
            <div class="text-h6 mb-2">Your Benefits</div>
            <v-list density="compact" class="bg-transparent">
              <v-list-item v-if="currentTierBenefits.pointsMultiplier > 1">
                <template v-slot:prepend>
                  <v-icon color="success">mdi-star-plus-outline</v-icon>
                </template>
                <v-list-item-title>{{ currentTierBenefits.pointsMultiplier }}× Points on all orders</v-list-item-title>
              </v-list-item>

              <v-list-item v-if="currentTierBenefits.freeDelivery">
                <template v-slot:prepend>
                  <v-icon color="success">mdi-truck-delivery</v-icon>
                </template>
                <v-list-item-title>Free delivery on eligible orders</v-list-item-title>
              </v-list-item>

              <v-list-item v-if="currentTierBenefits.exclusiveOffers">
                <template v-slot:prepend>
                  <v-icon color="success">mdi-tag-multiple</v-icon>
                </template>
                <v-list-item-title>Access to exclusive offers</v-list-item-title>
              </v-list-item>

              <v-list-item v-if="currentTierBenefits.prioritySupport">
                <template v-slot:prepend>
                  <v-icon color="success">mdi-headset</v-icon>
                </template>
                <v-list-item-title>Priority customer support</v-list-item-title>
              </v-list-item>

              <v-list-item v-if="currentTierBenefits.birthdayReward">
                <template v-slot:prepend>
                  <v-icon color="success">mdi-cake-variant</v-icon>
                </template>
                <v-list-item-title>Birthday reward</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-text>

          <!-- Birthday Reward Banner (if available) -->
          <v-banner
            v-if="hasBirthdayReward"
            color="pink-lighten-4"
            class="text-center"
            icon="mdi-cake-variant"
          >
            <div class="text-subtitle-1 font-weight-bold">
              Birthday Reward Available!
            </div>
            <v-btn
              color="pink"
              class="mt-2"
              @click="claimBirthdayReward"
              :loading="loadingBirthday"
            >
              Claim Now
            </v-btn>
          </v-banner>

          <v-divider></v-divider>
          
          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              @click="showTierDetails = true"
            >
              View Tier Details
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- Available Rewards Card -->
      <v-col cols="12" md="6">
        <v-card class="mb-4">
          <v-card-title class="d-flex align-center">
            Available Rewards
            <v-spacer></v-spacer>
            <v-btn
              icon
              @click="refreshRewards"
              :loading="loadingRewards"
            >
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
          </v-card-title>

          <v-card-text v-if="loadingRewards" class="text-center">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </v-card-text>

          <v-card-text v-else-if="rewards.length === 0" class="text-center pa-6">
            <v-icon size="64" color="grey-lighten-1">mdi-ticket-off</v-icon>
            <div class="text-h6 mt-4">No rewards available</div>
            <div class="text-body-2 text-grey">
              Earn more points to unlock rewards
            </div>
          </v-card-text>

          <template v-else>
            <v-list>
              <v-list-item
                v-for="reward in rewards"
                :key="reward.id"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="getRewardColor(reward.type)"
                    size="40"
                  >
                    <v-icon color="white">{{ getRewardIcon(reward.type) }}</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="text-subtitle-1 font-weight-medium">
                  {{ reward.name }}
                </v-list-item-title>

                <v-list-item-subtitle>
                  {{ reward.description }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <v-btn
                    color="primary"
                    :disabled="userPoints < reward.pointsCost"
                    @click="redeemReward(reward)"
                    :loading="redeeming === reward.id"
                  >
                    {{ reward.pointsCost }} Points
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>

            <v-divider></v-divider>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                @click="loadMoreRewards"
                v-if="hasMoreRewards"
                :loading="loadingMore"
              >
                Load More
              </v-btn>
            </v-card-actions>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recent Points Activity -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>Recent Activity</v-card-title>

          <v-card-text v-if="loadingHistory" class="text-center py-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </v-card-text>

          <v-card-text v-else-if="pointsHistory.length === 0" class="text-center pa-6">
            <v-icon size="64" color="grey-lighten-1">mdi-history</v-icon>
            <div class="text-h6 mt-4">No activity yet</div>
            <div class="text-body-2 text-grey">
              Start earning points by placing orders
            </div>
          </v-card-text>

          <template v-else>
            <v-list>
              <v-list-item
                v-for="item in pointsHistory"
                :key="item.id"
              >
                <template v-slot:prepend>
                  <v-avatar
                    :color="item.points > 0 ? 'success' : 'error'"
                    size="36"
                  >
                    <v-icon color="white">
                      {{ item.points > 0 ? 'mdi-plus' : 'mdi-minus' }}
                    </v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title>
                  {{ item.description }}
                </v-list-item-title>

                <v-list-item-subtitle>
                  {{ formatDate(item.createdAt) }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <span
                    class="text-subtitle-1"
                    :class="item.points > 0 ? 'text-success' : 'text-error'"
                  >
                    {{ item.points > 0 ? '+' : '' }}{{ item.points }} pts
                  </span>
                </template>
              </v-list-item>
            </v-list>
            
            <v-divider></v-divider>
            
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                variant="text"
                color="primary"
                to="/loyalty/history"
              >
                View Complete History
              </v-btn>
            </v-card-actions>
          </template>
        </v-card>
      </v-col>
    </v-row>

    <!-- Referral Program Card -->
    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Refer a Friend</v-card-title>

          <v-card-text class="text-center">
            <div class="text-h6 mb-2">
              Earn {{ referralPoints }} points for every friend who signs up and places their first order
            </div>

            <v-text-field
              v-model="referralCode"
              label="Your Referral Code"
              readonly
              class="mt-4"
              append-inner-icon="mdi-content-copy"
              @click:append-inner="copyReferralCode"
            ></v-text-field>

            <v-btn
              color="primary"
              class="mt-4"
              @click="shareReferralCode"
            >
              <v-icon start>mdi-share-variant</v-icon>
              Share Your Code
            </v-btn>

            <v-expand-transition>
              <div v-if="showReferralStats" class="mt-6">
                <div class="text-h6">Your Referral Stats</div>
                <v-row class="mt-4">
                  <v-col cols="12" sm="4">
                    <div class="text-h3 text-center">{{ referralStats.totalReferrals }}</div>
                    <div class="text-subtitle-1 text-center">Total Referrals</div>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <div class="text-h3 text-center">{{ referralStats.pendingReferrals }}</div>
                    <div class="text-subtitle-1 text-center">Pending</div>
                  </v-col>
                  <v-col cols="12" sm="4">
                    <div class="text-h3 text-center text-success">{{ referralStats.pointsEarned }}</div>
                    <div class="text-subtitle-1 text-center">Points Earned</div>
                  </v-col>
                </v-row>
              </div>
            </v-expand-transition>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              @click="showReferralStats = !showReferralStats"
            >
              {{ showReferralStats ? 'Hide' : 'Show' }} Stats
              <v-icon>{{ showReferralStats ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tier Details Dialog -->
    <v-dialog
      v-model="showTierDetails"
      max-width="800"
    >
      <v-card>
        <v-card-title>Loyalty Tiers</v-card-title>
        
        <v-card-text>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">Tier</th>
                <th class="text-left">Points Required</th>
                <th class="text-left">Points Multiplier</th>
                <th class="text-left">Free Delivery</th>
                <th class="text-left">Exclusive Offers</th>
                <th class="text-left">Priority Support</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(tier, name) in allTierBenefits"
                :key="name"
                :class="{ 'highlighted-row': name === userTier }"
              >
                <td>
                  <div class="d-flex align-center">
                    <v-avatar :color="getTierColor(name)" size="24" class="mr-2">
                      <v-icon color="white" size="small">{{ getTierIcon(name) }}</v-icon>
                    </v-avatar>
                    {{ name | capitalize }}
                  </div>
                </td>
                <td>{{ getTierPoints(name) }}</td>
                <td>{{ tier.pointsMultiplier }}×</td>
                <td>
                  <v-icon v-if="tier.freeDelivery" color="success">mdi-check</v-icon>
                  <v-icon v-else color="error">mdi-close</v-icon>
                </td>
                <td>
                  <v-icon v-if="tier.exclusiveOffers" color="success">mdi-check</v-icon>
                  <v-icon v-else color="error">mdi-close</v-icon>
                </td>
                <td>
                  <v-icon v-if="tier.prioritySupport" color="success">mdi-check</v-icon>
                  <v-icon v-else color="error">mdi-close</v-icon>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="showTierDetails = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { format } from 'date-fns';
import { mapState } from 'vuex';
import loyaltyService from '@/services/loyalty.service';

export default {
  name: 'LoyaltyDashboard',
  
  data() {
    return {
      rewards: [],
      pointsHistory: [],
      hasBirthdayReward: false,
      loadingRewards: false,
      loadingHistory: false,
      loadingMore: false,
      loadingBirthday: false,
      showTierDetails: false,
      redeeming: null,
      nextTierInfo: {},
      currentTierBenefits: {},
      allTierBenefits: {},
      referralCode: '',
      referralPoints: 500,
      referralStats: {
        totalReferrals: 0,
        pendingReferrals: 0,
        pointsEarned: 0
      },
      showReferralStats: false,
      page: 1,
      hasMoreRewards: false
    };
  },
  
  computed: {
    ...mapState({
      user: state => state.auth.user
    }),
    
    userPoints() {
      return this.user?.loyaltyPoints || 0;
    },
    
    userTier() {
      return loyaltyService.getUserTier();
    }
  },
  
  filters: {
    capitalize(value) {
      if (!value) return '';
      return value.charAt(0).toUpperCase() + value.slice(1);
    }
  },
  
  async created() {
    await this.initialize();
  },
  
  methods: {
    async initialize() {
      this.nextTierInfo = loyaltyService.getNextTierInfo();
      this.currentTierBenefits = loyaltyService.getTierBenefits(this.userTier);
      this.allTierBenefits = loyaltyService.getTierBenefits();
      
      await Promise.all([
        this.loadRewards(),
        this.loadHistory(),
        this.checkBirthdayReward(),
        this.loadReferralInfo()
      ]);
    },
    
    async loadRewards() {
      this.loadingRewards = true;
      try {
        const result = await loyaltyService.getAvailableRewards();
        this.rewards = result.rewards || [];
        this.hasMoreRewards = result.hasMore || false;
      } catch (error) {
        console.error('Error loading rewards:', error);
        this.$toast.error('Failed to load rewards');
      } finally {
        this.loadingRewards = false;
      }
    },
    
    async loadMoreRewards() {
      if (this.loadingMore) return;
      
      this.loadingMore = true;
      this.page += 1;
      
      try {
        const result = await loyaltyService.getAvailableRewards({ page: this.page });
        this.rewards = [...this.rewards, ...(result.rewards || [])];
        this.hasMoreRewards = result.hasMore || false;
      } catch (error) {
        console.error('Error loading more rewards:', error);
        this.$toast.error('Failed to load more rewards');
      } finally {
        this.loadingMore = false;
      }
    },
    
    async loadHistory() {
      this.loadingHistory = true;
      try {
        const result = await loyaltyService.getRewardHistory(1, 5);
        this.pointsHistory = result.rewards || [];
      } catch (error) {
        console.error('Error loading history:', error);
        this.$toast.error('Failed to load activity history');
      } finally {
        this.loadingHistory = false;
      }
    },
    
    async checkBirthdayReward() {
      try {
        this.hasBirthdayReward = await loyaltyService.checkBirthdayReward();
      } catch (error) {
        console.error('Error checking birthday reward:', error);
      }
    },
    
    async loadReferralInfo() {
      try {
        // Get referral code
        const codeResult = await loyaltyService.getReferralCode(this.user.id);
        this.referralCode = codeResult.code || '';
        
        // Get referral stats
        const statsResult = await loyaltyService.getReferralStats(this.user.id);
        this.referralStats = {
          totalReferrals: statsResult.totalReferrals || 0,
          pendingReferrals: statsResult.pendingReferrals || 0,
          pointsEarned: statsResult.pointsEarned || 0
        };
      } catch (error) {
        console.error('Error loading referral info:', error);
      }
    },
    
    async refreshRewards() {
      this.page = 1;
      await this.loadRewards();
    },
    
    async redeemReward(reward) {
      this.redeeming = reward.id;
      try {
        const result = await loyaltyService.redeemReward(reward.id);
        
        if (result.success) {
          // Update user points
          this.$store.commit('auth/UPDATE_USER', { 
            loyaltyPoints: result.remainingPoints 
          });
          
          // Show success message
          this.$toast.success(`Successfully redeemed ${reward.name}`);
          
          // Refresh rewards list
          await this.refreshRewards();
          
          // Refresh history
          await this.loadHistory();
        } else {
          this.$toast.error(result.message || 'Failed to redeem reward');
        }
      } catch (error) {
        console.error('Error redeeming reward:', error);
        this.$toast.error('Failed to redeem reward. Please try again.');
      } finally {
        this.redeeming = null;
      }
    },
    
    async claimBirthdayReward() {
      this.loadingBirthday = true;
      try {
        const result = await loyaltyService.claimBirthdayReward();
        
        if (result.success) {
          // Show success message
          this.$toast.success('Birthday reward claimed successfully!');
          
          // Update birthday reward status
          this.hasBirthdayReward = false;
          
          // Refresh history
          await this.loadHistory();
        } else {
          this.$toast.error(result.message || 'Failed to claim birthday reward');
        }
      } catch (error) {
        console.error('Error claiming birthday reward:', error);
        this.$toast.error('Failed to claim birthday reward. Please try again.');
      } finally {
        this.loadingBirthday = false;
      }
    },
    
    copyReferralCode() {
      navigator.clipboard.writeText(this.referralCode);
      this.$toast.success('Referral code copied to clipboard');
    },
    
    shareReferralCode() {
      if (navigator.share) {
        navigator.share({
          title: 'Join me on FoodDelivery!',
          text: `Sign up using my referral code ${this.referralCode} and get a discount on your first order!`,
          url: `https://fooddelivery.com/refer?code=${this.referralCode}`
        })
          .then(() => console.log('Share successful'))
          .catch(error => console.error('Error sharing:', error));
      } else {
        this.copyReferralCode();
      }
    },
    
    formatDate(dateString) {
      if (!dateString) return '';
      return format(new Date(dateString), 'MMM d, yyyy');
    },
    
    getTierColor(tier) {
      const colors = {
        bronze: 'amber-darken-1',
        silver: 'grey',
        gold: 'amber',
        platinum: 'blue-grey-darken-1'
      };
      return colors[tier] || 'primary';
    },
    
    getTierIcon(tier) {
      const icons = {
        bronze: 'mdi-medal',
        silver: 'mdi-medal-outline',
        gold: 'mdi-crown',
        platinum: 'mdi-crown-outline'
      };
      return icons[tier] || 'mdi-star';
    },
    
    getRewardColor(type) {
      const colors = {
        discount: 'green',
        freeItem: 'blue',
        freeDelivery: 'purple',
        vipAccess: 'red',
        giftCard: 'amber-darken-2'
      };
      return colors[type] || 'primary';
    },
    
    getRewardIcon(type) {
      const icons = {
        discount: 'mdi-percent',
        freeItem: 'mdi-food',
        freeDelivery: 'mdi-truck-delivery',
        vipAccess: 'mdi-ticket-confirmation',
        giftCard: 'mdi-gift'
      };
      return icons[type] || 'mdi-star';
    },
    
    getTierPoints(tier) {
      const points = {
        bronze: '0',
        silver: '1,000',
        gold: '5,000',
        platinum: '10,000'
      };
      return points[tier] || '0';
    }
  }
};
</script>

<style scoped>
.loyalty-dashboard {
  margin-bottom: 24px;
}

.highlighted-row {
  background-color: rgba(var(--v-theme-primary), 0.1);
}
</style>