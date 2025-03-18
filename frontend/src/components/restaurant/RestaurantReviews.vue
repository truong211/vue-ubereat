<template>
  <div class="restaurant-reviews">
    <v-container class="pa-0">
      <v-row>
        <v-col cols="12">
          <h2 class="text-h5 font-weight-bold mb-4">Customer Reviews</h2>
          
          <reviews-list
            item-type="restaurant"
            :item-id="restaurantId"
            :reviews="reviews"
            :stats="reviewStats"
            :loading="loading"
            :current-user-id="currentUserId"
            :is-restaurant-owner="isRestaurantOwner"
            :is-moderator="isModerator"
            show-overview
            show-write-review
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
import { useRoute } from 'vue-router';
import ReviewsList from '../review/ReviewsList.vue';

export default {
  name: 'RestaurantReviews',
  
  components: {
    ReviewsList
  },
  
  props: {
    restaurantId: {
      type: [Number, String],
      required: true
    }
  },
  
  setup(props) {
    const store = useStore();
    const route = useRoute();
    
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
        const response = await store.dispatch('reviews/fetchRestaurantReviews', {
          restaurantId: props.restaurantId,
          page: 1,
          limit: 50, // Fetch more reviews to show all
          sort: 'newest'
        });
        
        reviews.value = response.data.reviews || [];
        reviewStats.value = response.data.stats || { 
          average: 0, 
          total: 0,
          distribution: []
        };
      } catch (error) {
        console.error('Error fetching restaurant reviews:', error);
      } finally {
        loading.value = false;
      }
    };
    
    // Event handlers
    const onReviewSubmitted = (review) => {
      // Add new review to top of list
      reviews.value.unshift(review);
      
      // Update stats
      if (reviewStats.value) {
        // Update total count
        reviewStats.value.total = (reviewStats.value.total || 0) + 1;
        
        // Update distribution for this rating
        let ratingIndex = reviewStats.value.distribution.findIndex(d => d.rating === review.rating);
        if (ratingIndex !== -1) {
          reviewStats.value.distribution[ratingIndex].count++;
        } else {
          reviewStats.value.distribution.push({ rating: review.rating, count: 1 });
        }
        
        // Recalculate average
        const totalRating = reviewStats.value.distribution.reduce(
          (sum, item) => sum + (item.rating * item.count), 0
        );
        reviewStats.value.average = (totalRating / reviewStats.value.total).toFixed(1);
      }
    };
    
    const onReviewUpdated = (updatedReview) => {
      // Find and update the review in the list
      const index = reviews.value.findIndex(r => r.id === updatedReview.id);
      if (index !== -1) {
        // If rating changed, we need to update the stats
        const oldRating = reviews.value[index].rating;
        const newRating = updatedReview.rating;
        
        reviews.value[index] = { ...reviews.value[index], ...updatedReview };
        
        // Update stats if rating changed
        if (oldRating !== newRating && reviewStats.value) {
          // Update distribution
          let oldRatingIndex = reviewStats.value.distribution.findIndex(d => d.rating === oldRating);
          if (oldRatingIndex !== -1) {
            reviewStats.value.distribution[oldRatingIndex].count--;
          }
          
          let newRatingIndex = reviewStats.value.distribution.findIndex(d => d.rating === newRating);
          if (newRatingIndex !== -1) {
            reviewStats.value.distribution[newRatingIndex].count++;
          } else {
            reviewStats.value.distribution.push({ rating: newRating, count: 1 });
          }
          
          // Recalculate average
          const totalRating = reviewStats.value.distribution.reduce(
            (sum, item) => sum + (item.rating * item.count), 0
          );
          reviewStats.value.average = (totalRating / reviewStats.value.total).toFixed(1);
        }
      }
    };
    
    const onReviewDeleted = (deletedReview) => {
      // Remove review from list
      const index = reviews.value.findIndex(r => r.id === deletedReview.id);
      if (index !== -1) {
        // Update stats
        if (reviewStats.value) {
          // Decrease total count
          reviewStats.value.total = Math.max(0, reviewStats.value.total - 1);
          
          // Update distribution
          const rating = reviews.value[index].rating;
          let ratingIndex = reviewStats.value.distribution.findIndex(d => d.rating === rating);
          if (ratingIndex !== -1) {
            reviewStats.value.distribution[ratingIndex].count = 
              Math.max(0, reviewStats.value.distribution[ratingIndex].count - 1);
          }
          
          // Recalculate average if there are still reviews
          if (reviewStats.value.total > 0) {
            const totalRating = reviewStats.value.distribution.reduce(
              (sum, item) => sum + (item.rating * item.count), 0
            );
            reviewStats.value.average = (totalRating / reviewStats.value.total).toFixed(1);
          } else {
            reviewStats.value.average = 0;
          }
        }
        
        // Remove from array
        reviews.value.splice(index, 1);
      }
    };
    
    // Watch for restaurant ID changes to reload reviews
    watch(() => props.restaurantId, () => {
      if (props.restaurantId) {
        fetchReviews();
      }
    });
    
    // Load reviews when component is mounted
    onMounted(() => {
      if (props.restaurantId) {
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