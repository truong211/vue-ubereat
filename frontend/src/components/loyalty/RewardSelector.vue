<template>
  <div class="reward-selector">
    <v-expand-transition>
      <div v-if="!showRewards && hasApplicableRewards">
        <v-btn
          block
          color="primary"
          variant="outlined"
          prepend-icon="mdi-ticket-percent"
          @click="showRewards = true"
          class="mt-4"
        >
          {{ availableRewards.length }} Rewards Available
        </v-btn>
      </div>
    </v-expand-transition>

    <v-expand-transition>
      <div v-if="showRewards">
        <v-card variant="outlined" class="mt-4">
          <v-card-title class="d-flex justify-space-between">
            Apply Rewards
            <v-btn
              icon="mdi-close"
              variant="text"
              density="comfortable"
              size="small"
              @click="showRewards = false"
            ></v-btn>
          </v-card-title>
          
          <div v-if="loading" class="text-center py-4">
            <v-progress-circular indeterminate></v-progress-circular>
          </div>
          
          <v-card-text v-else-if="availableRewards.length === 0" class="text-center">
            <v-icon size="48" color="grey-lighten-1">mdi-ticket-off</v-icon>
            <div class="text-subtitle-1 mt-2">No applicable rewards found</div>
            <div class="text-caption text-grey">
              Earn more points to unlock rewards
            </div>
          </v-card-text>
          
          <v-card-text v-else class="pa-0">
            <v-radio-group v-model="selectedReward" @update:model-value="updateSelectedReward">
              <v-list>
                <v-list-item
                  v-for="reward in availableRewards"
                  :key="reward.id"
                  :value="reward.id"
                >
                  <template v-slot:prepend>
                    <v-radio :value="reward.id" color="primary"></v-radio>
                  </template>

                  <v-list-item-title class="font-weight-medium">
                    {{ reward.name }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="text-caption">
                    {{ getRewardDescription(reward) }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="text-caption">
                      {{ formatValue(reward) }}
                    </div>
                  </template>
                </v-list-item>
                
                <v-divider></v-divider>
                
                <v-list-item value="">
                  <template v-slot:prepend>
                    <v-radio value="" color="primary"></v-radio>
                  </template>

                  <v-list-item-title>
                    Don't apply any rewards
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-radio-group>
          </v-card-text>
        </v-card>
      </div>
    </v-expand-transition>

    <!-- Selected Reward Summary -->
    <v-expand-transition>
      <v-alert
        v-if="appliedReward"
        color="success"
        variant="tonal"
        class="mt-4"
        closable
        @click:close="removeReward"
      >
        <div class="d-flex align-center">
          <v-avatar
            :color="getRewardColor(appliedReward.type)"
            size="32"
            class="mr-3"
          >
            <v-icon color="white" size="small">
              {{ getRewardIcon(appliedReward.type) }}
            </v-icon>
          </v-avatar>
          <div>
            <div class="text-subtitle-2 font-weight-medium">
              {{ appliedReward.name }}
            </div>
            <div class="text-caption">
              {{ getRewardDescription(appliedReward) }}
            </div>
          </div>
          <v-spacer></v-spacer>
          <div class="text-subtitle-2 font-weight-bold">
            {{ formatValue(appliedReward) }}
          </div>
        </div>
      </v-alert>
    </v-expand-transition>
  </div>
</template>

<script>
import { loyaltyService } from '@/services/loyalty.service';

export default {
  name: 'RewardSelector',
  
  props: {
    orderTotal: {
      type: Number,
      required: true
    },
    restaurantId: {
      type: String,
      default: null
    }
  },
  
  data() {
    return {
      loading: false,
      showRewards: false,
      selectedReward: '',
      availableRewards: [],
      appliedReward: null
    };
  },
  
  computed: {
    hasApplicableRewards() {
      return this.availableRewards.length > 0;
    }
  },
  
  watch: {
    restaurantId() {
      this.loadRewards();
    },
    
    orderTotal() {
      if (this.appliedReward) {
        this.updateDiscount();
      }
    }
  },
  
  async created() {
    await this.loadRewards();
  },
  
  methods: {
    async loadRewards() {
      this.loading = true;
      
      try {
        // Load rewards that can be applied to this order
        const result = await loyaltyService.getAvailableRewards();
        
        if (result && Array.isArray(result.rewards)) {
          // Filter rewards that are applicable to this order
          this.availableRewards = result.rewards.filter(reward => {
            // Check if restaurant-specific reward applies to current restaurant
            if (reward.restaurantId && this.restaurantId) {
              if (reward.restaurantId !== this.restaurantId) {
                return false;
              }
            }
            
            // Check if reward has minimum order requirement
            if (reward.minimumOrder && this.orderTotal < reward.minimumOrder) {
              return false;
            }
            
            return true;
          });
        } else {
          this.availableRewards = [];
        }
      } catch (error) {
        console.error('Error loading rewards:', error);
        this.availableRewards = [];
      } finally {
        this.loading = false;
      }
    },
    
    updateSelectedReward(rewardId) {
      if (!rewardId) {
        this.removeReward();
        return;
      }
      
      const reward = this.availableRewards.find(r => r.id === rewardId);
      if (reward) {
        this.appliedReward = reward;
        this.updateDiscount();
        this.$emit('reward-selected', {
          rewardId: reward.id,
          discount: this.calculateDiscount(reward)
        });
        this.showRewards = false;
      }
    },
    
    removeReward() {
      this.selectedReward = '';
      this.appliedReward = null;
      this.$emit('reward-removed');
    },
    
    updateDiscount() {
      if (!this.appliedReward) {
        return;
      }
      
      const discount = this.calculateDiscount(this.appliedReward);
      this.$emit('reward-updated', {
        rewardId: this.appliedReward.id,
        discount: discount
      });
    },
    
    calculateDiscount(reward) {
      if (!reward) return 0;
      
      let discount = 0;
      
      switch (reward.type) {
        case 'discount_percent':
          discount = this.orderTotal * (reward.value / 100);
          // Apply max discount if specified
          if (reward.maxDiscount && discount > reward.maxDiscount) {
            discount = reward.maxDiscount;
          }
          break;
          
        case 'discount_amount':
          discount = reward.value;
          break;
          
        case 'free_delivery':
          discount = this.$store.state.checkout.deliveryFee || 0;
          break;
          
        case 'free_item':
          // Handled separately by the checkout
          discount = 0;
          break;
          
        default:
          discount = 0;
      }
      
      return Math.min(discount, this.orderTotal);
    },
    
    getRewardDescription(reward) {
      if (!reward) return '';
      
      switch (reward.type) {
        case 'discount_percent':
          const maxText = reward.maxDiscount ? ` (up to $${reward.maxDiscount.toFixed(2)})` : '';
          return `${reward.value}% off your order${maxText}`;
          
        case 'discount_amount':
          return `$${reward.value.toFixed(2)} off your order`;
          
        case 'free_delivery':
          return 'Free delivery on this order';
          
        case 'free_item':
          return reward.description || 'Free item with your order';
          
        default:
          return reward.description || '';
      }
    },
    
    formatValue(reward) {
      if (!reward) return '';
      
      switch (reward.type) {
        case 'discount_percent':
          const discount = this.calculateDiscount(reward);
          return `-$${discount.toFixed(2)}`;
          
        case 'discount_amount':
          return `-$${Math.min(reward.value, this.orderTotal).toFixed(2)}`;
          
        case 'free_delivery':
          const deliveryFee = this.$store.state.checkout.deliveryFee || 0;
          return `-$${deliveryFee.toFixed(2)}`;
          
        case 'free_item':
          return 'FREE';
          
        default:
          return '';
      }
    },
    
    getRewardColor(type) {
      const colors = {
        discount_percent: 'green',
        discount_amount: 'blue',
        free_delivery: 'purple',
        free_item: 'amber-darken-2',
      };
      return colors[type] || 'primary';
    },
    
    getRewardIcon(type) {
      const icons = {
        discount_percent: 'mdi-percent',
        discount_amount: 'mdi-currency-usd-off',
        free_delivery: 'mdi-truck-delivery',
        free_item: 'mdi-food',
      };
      return icons[type] || 'mdi-ticket';
    }
  }
};
</script>

<style scoped>
.reward-selector {
  margin-bottom: 16px;
}
</style>