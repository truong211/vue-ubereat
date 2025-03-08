<template>
  <v-container>
    <h1 class="text-h4 mb-6">Promotions & Offers</h1>
    
    <!-- Active Promotions -->
    <div class="mb-8">
      <h2 class="text-h5 mb-4">Your Active Promotions</h2>
      
      <div v-if="loading" class="d-flex justify-center py-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>
      
      <div v-else-if="activePromotions.length === 0" class="text-center py-6 rounded bg-grey-lighten-4">
        <v-icon size="48" color="grey">mdi-ticket-percent-outline</v-icon>
        <h3 class="text-h6 mt-2">No active promotions</h3>
        <p class="text-body-1 mt-1">Check out the available offers below!</p>
      </div>
      
      <div v-else>
        <v-row>
          <v-col 
            v-for="promo in activePromotions" 
            :key="promo.id" 
            cols="12" 
            sm="6" 
            md="4"
          >
            <v-card elevation="2" class="promo-card active">
              <div class="promo-badge">ACTIVE</div>
              
              <v-card-item>
                <template v-slot:prepend>
                  <v-icon 
                    size="large" 
                    :color="getPromoColor(promo.type)" 
                    class="me-3"
                  >
                    {{ getPromoIcon(promo.type) }}
                  </v-icon>
                </template>
                
                <v-card-title>{{ promo.title }}</v-card-title>
                <v-card-subtitle>
                  <div>Code: <span class="font-weight-bold">{{ promo.code }}</span></div>
                  <div v-if="promo.expiresAt">
                    <v-icon size="small" class="me-1">mdi-clock-outline</v-icon>
                    Expires {{ formatDate(promo.expiresAt) }}
                  </div>
                </v-card-subtitle>
              </v-card-item>
              
              <v-card-text>
                <p>{{ promo.description }}</p>
                
                <div class="d-flex align-center mt-3">
                  <v-chip
                    size="small"
                    :color="getPromoColor(promo.type)"
                    class="me-2"
                  >
                    {{ formatPromoType(promo.type) }}
                  </v-chip>
                  
                  <v-chip
                    v-if="promo.minOrderAmount"
                    size="small"
                    variant="outlined"
                  >
                    Min. Order ${{ promo.minOrderAmount.toFixed(2) }}
                  </v-chip>
                </div>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  variant="text"
                  :color="getPromoColor(promo.type)"
                  @click="applyPromotion(promo)"
                >
                  Use Now
                </v-btn>
                <v-btn
                  variant="text"
                  color="grey"
                  @click="showTerms(promo)"
                >
                  Terms
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>
    
    <!-- Available Promotions -->
    <div>
      <div class="d-flex align-center mb-4">
        <h2 class="text-h5">Available Offers</h2>
        <v-spacer></v-spacer>
        <v-text-field
          v-model="promoCode"
          label="Have a promo code?"
          variant="outlined"
          density="compact"
          hide-details
          class="max-width-200 me-2"
          @keydown.enter="applyPromoCode"
        ></v-text-field>
        <v-btn
          color="primary"
          @click="applyPromoCode"
          :loading="applyingCode"
          :disabled="!promoCode.trim()"
        >
          Apply
        </v-btn>
      </div>
      
      <div v-if="loading" class="d-flex justify-center py-4">
        <v-progress-circular indeterminate color="primary"></v-progress-circular>
      </div>
      
      <div v-else-if="availablePromotions.length === 0" class="text-center py-6 rounded bg-grey-lighten-4">
        <v-icon size="48" color="grey">mdi-ticket-percent-outline</v-icon>
        <h3 class="text-h6 mt-2">No available promotions</h3>
        <p class="text-body-1 mt-1">Check back later for new offers!</p>
      </div>
      
      <div v-else>
        <v-row>
          <v-col 
            v-for="promo in availablePromotions" 
            :key="promo.id" 
            cols="12" 
            sm="6" 
            md="4"
          >
            <v-card elevation="1" class="promo-card">
              <v-card-item>
                <template v-slot:prepend>
                  <v-icon 
                    size="large" 
                    :color="getPromoColor(promo.type)" 
                    class="me-3"
                  >
                    {{ getPromoIcon(promo.type) }}
                  </v-icon>
                </template>
                
                <v-card-title>{{ promo.title }}</v-card-title>
                <v-card-subtitle>
                  <div>Code: <span class="font-weight-bold">{{ promo.code }}</span></div>
                  <div v-if="promo.expiresAt">
                    <v-icon size="small" class="me-1">mdi-clock-outline</v-icon>
                    Expires {{ formatDate(promo.expiresAt) }}
                  </div>
                </v-card-subtitle>
              </v-card-item>
              
              <v-card-text>
                <p>{{ promo.description }}</p>
                
                <div class="d-flex align-center mt-3">
                  <v-chip
                    size="small"
                    :color="getPromoColor(promo.type)"
                    class="me-2"
                  >
                    {{ formatPromoType(promo.type) }}
                  </v-chip>
                  
                  <v-chip
                    v-if="promo.minOrderAmount"
                    size="small"
                    variant="outlined"
                  >
                    Min. Order ${{ promo.minOrderAmount.toFixed(2) }}
                  </v-chip>
                </div>
              </v-card-text>
              
              <v-divider></v-divider>
              
              <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn
                  variant="text"
                  :color="getPromoColor(promo.type)"
                  @click="addToWallet(promo)"
                >
                  Add to Wallet
                </v-btn>
                <v-btn
                  variant="text"
                  color="grey"
                  @click="showTerms(promo)"
                >
                  Terms
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </div>
    
    <!-- Terms & Conditions Dialog -->
    <v-dialog v-model="showTermsDialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ selectedPromo?.title }} - Terms & Conditions
        </v-card-title>
        
        <v-card-text>
          <p class="mb-3">Promocode: <strong>{{ selectedPromo?.code }}</strong></p>
          
          <div v-if="selectedPromo?.termsAndConditions">
            <div v-for="(term, index) in selectedPromo.termsAndConditions" :key="index" class="mb-2">
              <v-icon size="small" color="grey" class="me-2">mdi-circle-small</v-icon>
              {{ term }}
            </div>
          </div>
          
          <div v-else>
            <p class="text-body-2">
              This promotion is subject to the following terms:
            </p>
            <ul class="ps-4">
              <li>Valid for a limited time only.</li>
              <li>Cannot be combined with other offers.</li>
              <li>Valid only for qualifying items and restaurants.</li>
              <li>We reserve the right to modify or cancel this promotion at any time.</li>
            </ul>
          </div>
          
          <div v-if="selectedPromo?.expiresAt" class="mt-4">
            <v-alert
              density="compact"
              type="info"
              variant="tonal"
              icon="mdi-information"
            >
              This promotion expires on {{ formatFullDate(selectedPromo.expiresAt) }}.
            </v-alert>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="text"
            @click="showTermsDialog = false"
          >
            Close
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Success Dialog -->
    <v-dialog v-model="showSuccessDialog" max-width="400">
      <v-card>
        <v-card-text class="text-center pa-6">
          <v-icon color="success" size="64">mdi-check-circle</v-icon>
          <h3 class="text-h5 mt-4">{{ dialogTitle }}</h3>
          <p class="text-body-1 mt-2">{{ dialogMessage }}</p>
          
          <v-btn
            color="primary"
            class="mt-4"
            block
            @click="showSuccessDialog = false"
          >
            Got it
          </v-btn>
          
          <v-btn
            v-if="successAction"
            variant="text"
            color="primary"
            class="mt-2"
            block
            @click="handleSuccessAction"
          >
            {{ successActionText }}
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';

export default {
  name: 'UserPromotions',
  
  setup() {
    const router = useRouter();
    const store = useStore();
    
    // Data
    const loading = ref(true);
    const promotions = ref([]);
    const promoCode = ref('');
    const applyingCode = ref(false);
    const showTermsDialog = ref(false);
    const showSuccessDialog = ref(false);
    const selectedPromo = ref(null);
    const dialogTitle = ref('');
    const dialogMessage = ref('');
    const successAction = ref(null);
    const successActionText = ref('');
    
    // Get promotions from API (mock data for now)
    const fetchPromotions = async () => {
      loading.value = true;
      
      try {
        // In a real app, this would be an API call
        // const response = await axios.get('/api/promotions');
        // promotions.value = response.data;
        
        // For demo purposes, simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        promotions.value = generateMockPromotions();
      } catch (error) {
        console.error('Error fetching promotions:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Active and available promotions
    const activePromotions = computed(() => {
      return promotions.value.filter(promo => promo.isActive);
    });
    
    const availablePromotions = computed(() => {
      return promotions.value.filter(promo => !promo.isActive);
    });
    
    // Format date
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Tomorrow';
      } else if (diffDays < 7) {
        return `in ${diffDays} days`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    };
    
    // Format full date
    const formatFullDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    // Get promotion icon based on type
    const getPromoIcon = (type) => {
      switch (type) {
        case 'discount_percentage':
          return 'mdi-percent';
        case 'discount_amount':
          return 'mdi-cash';
        case 'free_delivery':
          return 'mdi-truck-delivery';
        case 'buy_one_get_one':
          return 'mdi-food';
        default:
          return 'mdi-ticket-percent';
      }
    };
    
    // Get promotion color based on type
    const getPromoColor = (type) => {
      switch (type) {
        case 'discount_percentage':
          return 'purple';
        case 'discount_amount':
          return 'green';
        case 'free_delivery':
          return 'blue';
        case 'buy_one_get_one':
          return 'orange';
        default:
          return 'primary';
      }
    };
    
    // Format promotion type for display
    const formatPromoType = (type) => {
      switch (type) {
        case 'discount_percentage':
          return 'Percentage Off';
        case 'discount_amount':
          return 'Amount Off';
        case 'free_delivery':
          return 'Free Delivery';
        case 'buy_one_get_one':
          return 'Buy One Get One';
        default:
          return 'Special Offer';
      }
    };
    
    // Apply a promotion code
    const applyPromoCode = async () => {
      if (!promoCode.value.trim()) return;
      
      applyingCode.value = true;
      
      try {
        // In a real app, this would be an API call
        // const response = await axios.post('/api/promotions/apply', { code: promoCode.value });
        
        // For demo purposes, simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock response - 70% chance of success
        const isSuccess = Math.random() > 0.3;
        
        if (isSuccess) {
          // Find promotion in available promotions
          const promo = availablePromotions.value.find(
            p => p.code.toUpperCase() === promoCode.value.toUpperCase()
          );
          
          if (promo) {
            // Add to active promotions
            promo.isActive = true;
            
            // Show success dialog
            dialogTitle.value = 'Promo Code Applied!';
            dialogMessage.value = `The promotion "${promo.title}" has been added to your wallet.`;
            showSuccessDialog.value = true;
            
            // Clear promo code
            promoCode.value = '';
          } else {
            // Show success dialog for new promo
            dialogTitle.value = 'Promo Code Applied!';
            dialogMessage.value = 'The promotion has been successfully applied to your account.';
            showSuccessDialog.value = true;
            
            // Add a new mock promotion to active list
            const newPromo = generateMockPromotion(true, promoCode.value);
            promotions.value.push(newPromo);
            
            // Clear promo code
            promoCode.value = '';
          }
        } else {
          // Show error in store
          store.dispatch('ui/showSnackbar', {
            text: 'Invalid promotion code. Please try again.',
            color: 'error'
          });
        }
      } catch (error) {
        console.error('Error applying promo code:', error);
        
        // Show error in store
        store.dispatch('ui/showSnackbar', {
          text: 'Error applying promotion code. Please try again.',
          color: 'error'
        });
      } finally {
        applyingCode.value = false;
      }
    };
    
    // Add a promotion to user's wallet
    const addToWallet = async (promo) => {
      try {
        // In a real app, this would be an API call
        // await axios.post('/api/promotions/wallet', { promoId: promo.id });
        
        // For demo purposes, simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Update local state
        promo.isActive = true;
        
        // Show success dialog
        dialogTitle.value = 'Added to Wallet!';
        dialogMessage.value = `The promotion "${promo.title}" has been added to your wallet.`;
        showSuccessDialog.value = true;
      } catch (error) {
        console.error('Error adding promotion to wallet:', error);
        
        // Show error in store
        store.dispatch('ui/showSnackbar', {
          text: 'Error adding promotion to wallet. Please try again.',
          color: 'error'
        });
      }
    };
    
    // Apply a promotion
    const applyPromotion = (promo) => {
      selectedPromo.value = promo;
      
      // Show success dialog
      dialogTitle.value = 'Use This Promotion';
      dialogMessage.value = `Would you like to use "${promo.title}" on your next order?`;
      successAction.value = 'order';
      successActionText.value = 'Order Now';
      showSuccessDialog.value = true;
    };
    
    // Show terms and conditions
    const showTerms = (promo) => {
      selectedPromo.value = promo;
      showTermsDialog.value = true;
    };
    
    // Handle success action
    const handleSuccessAction = () => {
      if (successAction.value === 'order') {
        // Navigate to restaurants page
        router.push('/restaurants');
      }
      
      // Close dialog
      showSuccessDialog.value = false;
      successAction.value = null;
      successActionText.value = '';
    };
    
    // Generate mock promotions
    const generateMockPromotions = () => {
      const mockPromotions = [];
      
      // Add some active promotions
      mockPromotions.push(
        {
          id: 1,
          title: '20% Off Your Order',
          code: 'WELCOME20',
          type: 'discount_percentage',
          value: 20,
          minOrderAmount: 15,
          description: 'Enjoy 20% off your next order with this welcome promotion!',
          isActive: true,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
          termsAndConditions: [
            'Valid for orders of $15 or more',
            'Maximum discount of $20',
            'Cannot be combined with other offers',
            'Valid for first-time users only'
          ]
        },
        {
          id: 2,
          title: 'Free Delivery',
          code: 'FREEDEL',
          type: 'free_delivery',
          description: 'Get free delivery on your next order with no minimum purchase required!',
          isActive: true,
          expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days from now
        }
      );
      
      // Add some available promotions
      mockPromotions.push(
        {
          id: 3,
          title: '$10 Off Your Order',
          code: 'SAVE10',
          type: 'discount_amount',
          value: 10,
          minOrderAmount: 30,
          description: 'Save $10 on your next order of $30 or more!',
          isActive: false,
          expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
        },
        {
          id: 4,
          title: 'Buy One Get One Free',
          code: 'BOGO',
          type: 'buy_one_get_one',
          description: 'Buy one entrée and get one of equal or lesser value for free!',
          isActive: false,
          expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days from now
        },
        {
          id: 5,
          title: '15% Off For New Users',
          code: 'NEWUSER15',
          type: 'discount_percentage',
          value: 15,
          description: 'New users get 15% off their first order!',
          isActive: false,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
        },
        {
          id: 6,
          title: 'Weekend Special: 25% Off',
          code: 'WEEKEND25',
          type: 'discount_percentage',
          value: 25,
          minOrderAmount: 20,
          description: 'Enjoy 25% off your weekend orders!',
          isActive: false,
          expiresAt: getNextWeekend().toISOString() // Next weekend
        }
      );
      
      return mockPromotions;
    };
    
    // Generate a mock promotion based on a promo code
    const generateMockPromotion = (isActive = true, code = 'PROMO') => {
      const types = ['discount_percentage', 'discount_amount', 'free_delivery', 'buy_one_get_one'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let title, description, value, minOrderAmount;
      
      switch (type) {
        case 'discount_percentage':
          value = Math.floor(Math.random() * 30) + 10; // 10-40%
          title = `${value}% Off Your Order`;
          description = `Enjoy ${value}% off your next order!`;
          minOrderAmount = Math.floor(Math.random() * 20) + 10; // $10-30
          break;
        
        case 'discount_amount':
          value = Math.floor(Math.random() * 15) + 5; // $5-20
          title = `$${value} Off Your Order`;
          description = `Save $${value} on your next order!`;
          minOrderAmount = value * 2 + Math.floor(Math.random() * 10); // 2x value + random
          break;
          
        case 'free_delivery':
          title = 'Free Delivery';
          description = 'Get free delivery on your next order!';
          break;
          
        case 'buy_one_get_one':
          title = 'Buy One Get One Free';
          description = 'Buy one entrée and get one of equal or lesser value for free!';
          break;
          
        default:
          title = 'Special Offer';
          description = 'Enjoy this special offer on your next order!';
      }
      
      return {
        id: Date.now(),
        title,
        code: code.toUpperCase(),
        type,
        value,
        minOrderAmount,
        description,
        isActive,
        expiresAt: new Date(Date.now() + (Math.floor(Math.random() * 20) + 5) * 24 * 60 * 60 * 1000).toISOString()
      };
    };
    
    // Get next weekend date
    const getNextWeekend = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 is Sunday, 6 is Saturday
      
      // If today is Sunday (0), add 6 days to get to next Saturday
      // If today is Monday (1), add 5 days to get to next Saturday
      // ...and so on
      const daysUntilWeekend = dayOfWeek === 0 ? 6 : 6 - dayOfWeek;
      
      const nextWeekend = new Date(now);
      nextWeekend.setDate(now.getDate() + daysUntilWeekend);
      
      return nextWeekend;
    };
    
    // Fetch promotions on mount
    onMounted(() => {
      fetchPromotions();
    });
    
    return {
      loading,
      promotions,
      activePromotions,
      availablePromotions,
      promoCode,
      applyingCode,
      showTermsDialog,
      showSuccessDialog,
      selectedPromo,
      dialogTitle,
      dialogMessage,
      successAction,
      successActionText,
      formatDate,
      formatFullDate,
      getPromoIcon,
      getPromoColor,
      formatPromoType,
      applyPromoCode,
      addToWallet,
      applyPromotion,
      showTerms,
      handleSuccessAction
    };
  }
};
</script>

<style scoped>
.max-width-200 {
  max-width: 200px;
}

.promo-card {
  position: relative;
  height: 100%;
  transition: transform 0.2s ease;
}

.promo-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

.promo-card.active {
  border: 2px solid var(--v-primary-base);
}

.promo-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background-color: var(--v-primary-base);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
  z-index: 1;
}
</style> 