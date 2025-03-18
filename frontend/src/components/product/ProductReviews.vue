<template>
  <div class="product-reviews">
    <v-container class="pa-0">
      <v-row>
        <v-col cols="12">
          <h2 class="text-h5 font-weight-bold mb-4">Product Reviews</h2>
          
          <reviews-list
            item-type="menuItem"
            :item-id="productId"
            :restaurant-id="restaurantId"
            :reviews="reviews"
            :stats="reviewStats"
            :loading="loading"
            :current-user-id="currentUserId"
            :is-restaurant-owner="isRestaurantOwner"
            :is-moderator="isModerator"
            show-overview
            show-write-review
            show-item-tags
            @review-submitted="onReviewSubmitted"
            @review-updated="onReviewUpdated"
            @review-deleted="onReviewDeleted"
          ></reviews-list>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import ReviewsList from '../review/ReviewsList.vue';

export default {
  name: 'ProductReviews',
  
  components: {
    ReviewsList
  },
  
  props: {
    productId: {
      type: [Number, String],
      required: true
    },
    restaurantId: {
      type: [Number, String],
      required: true
    }
  },
  
  setup(props) {
    const store = useStore();
    
    const loading = ref(true);
    const reviews = ref([]);
    const reviewStats = ref(null);
    
    // Get current user info
    const currentUser = computed(() => store.getters['auth/user']);
    const currentUserId = computed(() => currentUser.value?.id);
    const userRole = computed(() => currentUser.value?.role);
    
    // Check if user is restaurant owner or admin/moderator
    const isRestaurantOwner = computed(() => {
      return (
        currentUser.value &&
        currentUser.value.role === 'restaurant' &&
        currentUser.value.restaurantId == props.restaurantId
      );
    });
    
    const isModerator = computed(() => {
      return (
        currentUser.value &&
        ['admin', 'moderator'].includes(userRole.value)
      );
    });
    
    // Fetch reviews from the store
    const fetchReviews = async () => {
      loading.value = true;
      try {
        const response = await store.dispatch('reviews/fetchProductReviews', {
          productId: props.productId,
          page: 1,
          limit: 50 // Fetch more reviews to show all
        });
        
        reviews.value = response.data.reviews || [];
        
        // Calculate stats since the API might not provide them for product reviews
        calculateStats();
      } catch (error) {
        console.error('Error fetching product reviews:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Calculate review stats from the reviews we have
    const calculateStats = () => {
      if (!reviews.value || reviews.value.length === 0) {
        reviewStats.value = {
          average: 0,
          total: 0,
          distribution: []
        };
        return;
      }
      
      // Count reviews by rating
      const distribution = [1, 2, 3, 4, 5].map(rating => {
        const count = reviews.value.filter(r => r.rating === rating).length;
        return { rating, count };
      });
      
      // Calculate total and average
      const total = reviews.value.length;
      const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0);
      const average = (sum / total).toFixed(1);
      
      reviewStats.value = {
        average,
        total,
        distribution
      };
    };
    
    // Event handlers
    const onReviewSubmitted = (review) => {
      // Add new review to top of list
      reviews.value.unshift(review);
      
      // Recalculate stats
      calculateStats();
    };
    
    const onReviewUpdated = (updatedReview) => {
      // Find and update the review in the list
      const index = reviews.value.findIndex(r => r.id === updatedReview.id);
      if (index !== -1) {
        reviews.value[index] = { ...reviews.value[index], ...updatedReview };
        
        // Recalculate stats
        calculateStats();
      }
    };
    
    const onReviewDeleted = (deletedReview) => {
      // Remove review from list
      const index = reviews.value.findIndex(r => r.id === deletedReview.id);
      if (index !== -1) {
        reviews.value.splice(index, 1);
        
        // Recalculate stats
        calculateStats();
      }
    };
    
    // Watch for product ID changes to reload reviews
    watch(() => props.productId, () => {
      if (props.productId) {
        fetchReviews();
      }
    });
    
    // Load reviews when component is mounted
    onMounted(() => {
      if (props.productId) {
        fetchReviews();
      }
    });
    
    return {
      loading,
      reviews,
      reviewStats,
      currentUserId,
      isRestaurantOwner,
      isModerator,
      onReviewSubmitted,
      onReviewUpdated,
      onReviewDeleted
    };
  }
};
</script>