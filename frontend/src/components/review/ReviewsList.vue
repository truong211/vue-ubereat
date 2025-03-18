<template>
  <div class="reviews-list">
    <!-- Reviews header with stats and filters -->
    <v-card class="mb-4">
      <v-card-text>
        <div v-if="showOverview && stats" class="rating-overview mb-5">
          <v-row align="center">
            <v-col cols="12" sm="4" class="text-center">
              <div class="text-h2 font-weight-bold">{{ stats.average }}</div>
              <v-rating
                :model-value="parseFloat(stats.average)"
                color="amber"
                half-increments
                readonly
                size="small"
              ></v-rating>
              <div class="text-subtitle-1 mt-1">{{ stats.total }} {{ stats.total === 1 ? 'review' : 'reviews' }}</div>
            </v-col>
            
            <v-divider vertical class="d-none d-sm-flex"></v-divider>
            
            <v-col cols="12" sm="8">
              <div v-for="n in 5" :key="n" class="d-flex align-center mb-2">
                <div class="text-body-2 mr-4" style="width: 20px">{{ 6-n }}</div>
                <v-progress-linear
                  :model-value="getRatingPercentage(6-n)"
                  color="amber"
                  height="8"
                  class="flex-grow-1 mr-4"
                  rounded
                ></v-progress-linear>
                <div class="text-body-2" style="width: 40px">{{ getRatingCount(6-n) }}</div>
              </div>
            </v-col>
          </v-row>
        </div>
        
        <!-- Review filters -->
        <div class="review-filters d-flex flex-wrap align-center">
          <v-select
            v-model="filters.sort"
            :items="sortOptions"
            label="Sort by"
            density="compact"
            hide-details
            variant="outlined"
            class="me-3 mb-2"
            style="width: 150px;"
          ></v-select>
          
          <v-btn-toggle
            v-model="filters.rating"
            density="comfortable"
            color="primary"
            class="me-3 mb-2"
          >
            <v-btn value="all">All</v-btn>
            <v-btn value="positive">Positive</v-btn>
            <v-btn value="critical">Critical</v-btn>
          </v-btn-toggle>
          
          <v-spacer></v-spacer>
          
          <v-text-field
            v-model="filters.search"
            placeholder="Search reviews"
            prepend-inner-icon="mdi-magnify"
            variant="outlined"
            density="compact"
            hide-details
            clearable
            class="mb-2"
            style="max-width: 250px;"
          ></v-text-field>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- Write a review section -->
    <v-expand-transition>
      <v-card v-if="showWriteReview && !hasReviewed" class="mb-4">
        <v-card-title>Write a Review</v-card-title>
        <v-card-text>
          <v-form ref="reviewForm" v-model="isReviewFormValid">
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Your Rating</div>
              <v-rating
                v-model="newReview.rating"
                color="amber"
                hover
                half-increments
                size="large"
              ></v-rating>
            </div>
            
            <v-textarea
              v-model="newReview.comment"
              label="Your Review"
              placeholder="Share details about your experience"
              variant="outlined"
              counter="500"
              rows="4"
              :rules="reviewRules"
            ></v-textarea>
            
            <div v-if="showItemTags" class="mb-4">
              <div class="text-subtitle-1 mb-2">What did you like?</div>
              <v-chip-group
                v-model="newReview.tags.positive"
                multiple
                column
              >
                <v-chip filter value="tasty">Tasty</v-chip>
                <v-chip filter value="fresh">Fresh</v-chip>
                <v-chip filter value="good_portion">Good Portion</v-chip>
                <v-chip filter value="well_presented">Well Presented</v-chip>
                <v-chip filter value="good_value">Good Value</v-chip>
              </v-chip-group>
              
              <div class="text-subtitle-1 mt-4 mb-2">What could be improved?</div>
              <v-chip-group
                v-model="newReview.tags.negative"
                multiple
                column
              >
                <v-chip filter value="too_small">Too Small</v-chip>
                <v-chip filter value="too_bland">Too Bland</v-chip>
                <v-chip filter value="too_expensive">Too Expensive</v-chip>
                <v-chip filter value="not_fresh">Not Fresh</v-chip>
                <v-chip filter value="not_as_described">Not As Described</v-chip>
              </v-chip-group>
            </div>
            
            <v-file-input
              v-if="allowPhotos"
              v-model="newReview.photos"
              label="Add Photos (Optional)"
              accept="image/*"
              prepend-icon="mdi-camera"
              variant="outlined"
              :rules="photoRules"
              multiple
              show-size
              counter
              truncate-length="15"
            ></v-file-input>
            
            <v-card-actions class="px-0 pt-3">
              <v-spacer></v-spacer>
              <v-btn
                color="primary"
                :disabled="!isReviewFormValid || isSubmittingReview"
                :loading="isSubmittingReview"
                @click="submitReview"
                :block="fullWidthButton"
              >
                {{ submitButtonText }}
              </v-btn>
            </v-card-actions>
          </v-form>
        </v-card-text>
      </v-card>
    </v-expand-transition>
    
    <!-- Reviews list -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
      <div class="mt-3">Loading reviews...</div>
    </div>
    <template v-else>
      <!-- Reviews content -->
      <template v-if="filteredReviews.length > 0">
        <review-item
          v-for="review in paginatedReviews"
          :key="review.id"
          :review="review"
          :current-user-id="currentUserId"
          :is-restaurant-owner="isRestaurantOwner"
          :is-moderator="isModerator"
          @update="handleReviewUpdate"
          @delete="handleReviewDelete"
          @edit="handleReviewEdit"
        ></review-item>
        
        <!-- Pagination -->
        <div v-if="filteredReviews.length > reviewsPerPage" class="text-center my-4">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
          ></v-pagination>
        </div>
      </template>
      
      <!-- No reviews state -->
      <v-card v-else class="text-center py-8">
        <v-icon size="64" color="grey">mdi-message-text-outline</v-icon>
        <div class="text-h6 mt-4">{{ noReviewsMessage }}</div>
        <div v-if="showWriteReview && !hasReviewed" class="mt-2">
          <v-btn color="primary" @click="scrollToReviewForm">Be the first to write a review</v-btn>
        </div>
      </v-card>
    </template>
    
    <!-- Edit review dialog -->
    <v-dialog v-model="editReviewDialog.show" max-width="600">
      <v-card>
        <v-card-title>Edit Your Review</v-card-title>
        <v-card-text>
          <v-form ref="editReviewForm" v-model="isEditReviewFormValid">
            <div class="mb-4">
              <div class="text-subtitle-1 mb-2">Your Rating</div>
              <v-rating
                v-model="editReviewDialog.review.rating"
                color="amber"
                hover
                half-increments
                size="large"
              ></v-rating>
            </div>
            
            <v-textarea
              v-model="editReviewDialog.review.comment"
              label="Your Review"
              placeholder="Share details about your experience"
              variant="outlined"
              counter="500"
              rows="4"
              :rules="reviewRules"
            ></v-textarea>
            
            <div v-if="showItemTags" class="mb-4">
              <div class="text-subtitle-1 mb-2">What did you like?</div>
              <v-chip-group
                v-model="editReviewDialog.review.tags.positive"
                multiple
                column
              >
                <v-chip filter value="tasty">Tasty</v-chip>
                <v-chip filter value="fresh">Fresh</v-chip>
                <v-chip filter value="good_portion">Good Portion</v-chip>
                <v-chip filter value="well_presented">Well Presented</v-chip>
                <v-chip filter value="good_value">Good Value</v-chip>
              </v-chip-group>
              
              <div class="text-subtitle-1 mt-4 mb-2">What could be improved?</div>
              <v-chip-group
                v-model="editReviewDialog.review.tags.negative"
                multiple
                column
              >
                <v-chip filter value="too_small">Too Small</v-chip>
                <v-chip filter value="too_bland">Too Bland</v-chip>
                <v-chip filter value="too_expensive">Too Expensive</v-chip>
                <v-chip filter value="not_fresh">Not Fresh</v-chip>
                <v-chip filter value="not_as_described">Not As Described</v-chip>
              </v-chip-group>
            </div>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="editReviewDialog.show = false"
          >
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!isEditReviewFormValid || isSubmittingReview"
            :loading="isSubmittingReview"
            @click="updateReview"
          >
            Update Review
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import ReviewItem from './ReviewItem.vue';

export default {
  name: 'ReviewsList',
  
  components: {
    ReviewItem
  },
  
  props: {
    itemType: {
      type: String,
      required: true,
      validator: (value) => ['restaurant', 'menuItem'].includes(value)
    },
    itemId: {
      type: [String, Number],
      required: true
    },
    restaurantId: {
      type: [String, Number],
      required: false
    },
    reviews: {
      type: Array,
      default: () => []
    },
    stats: {
      type: Object,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    showOverview: {
      type: Boolean,
      default: true
    },
    showWriteReview: {
      type: Boolean,
      default: true
    },
    showItemTags: {
      type: Boolean,
      default: false
    },
    allowPhotos: {
      type: Boolean,
      default: true
    },
    fullWidthButton: {
      type: Boolean,
      default: false
    },
    currentUserId: {
      type: [String, Number],
      default: null
    },
    isRestaurantOwner: {
      type: Boolean,
      default: false
    },
    isModerator: {
      type: Boolean,
      default: false
    },
    submitButtonText: {
      type: String,
      default: 'Submit Review'
    },
    noReviewsMessage: {
      type: String,
      default: 'No reviews yet'
    }
  },
  
  emits: ['review-submitted', 'review-updated', 'review-deleted'],
  
  setup(props, { emit }) {
    const store = useStore();
    const reviewForm = ref(null);
    const editReviewForm = ref(null);
    const isReviewFormValid = ref(false);
    const isEditReviewFormValid = ref(false);
    const isSubmittingReview = ref(false);
    const hasReviewed = ref(false);
    const currentPage = ref(1);
    const reviewsPerPage = 10;
    const editReviewDialog = ref({
      show: false,
      review: null
    });
    
    // Filter state
    const filters = ref({
      sort: 'newest',
      rating: 'all',
      search: ''
    });
    
    // New review form state
    const newReview = ref({
      rating: 0,
      comment: '',
      tags: {
        positive: [],
        negative: []
      },
      photos: []
    });
    
    // Validation
    const reviewRules = [
      v => v.length <= 500 || 'Review cannot exceed 500 characters'
    ];
    
    const photoRules = [
      files => !files || files.length <= 5 || 'Maximum 5 photos allowed',
      files => !files || !files.some(f => f.size > 5000000) || 'Image size should not exceed 5MB'
    ];
    
    // Sort options for the dropdown
    const sortOptions = [
      { title: 'Newest First', value: 'newest' },
      { title: 'Oldest First', value: 'oldest' },
      { title: 'Highest Rating', value: 'highest' },
      { title: 'Lowest Rating', value: 'lowest' },
      { title: 'Most Helpful', value: 'helpful' }
    ];
    
    // Computed
    const filteredReviews = computed(() => {
      if (!props.reviews) return [];
      
      let filtered = [...props.reviews];
      
      // Filter by rating
      if (filters.value.rating === 'positive') {
        filtered = filtered.filter(review => review.rating >= 4);
      } else if (filters.value.rating === 'critical') {
        filtered = filtered.filter(review => review.rating < 4);
      }
      
      // Filter by search term
      if (filters.value.search.trim()) {
        const search = filters.value.search.toLowerCase();
        filtered = filtered.filter(review => 
          review.comment && review.comment.toLowerCase().includes(search) ||
          review.user && review.user.fullName && review.user.fullName.toLowerCase().includes(search)
        );
      }
      
      // Sort reviews
      switch (filters.value.sort) {
        case 'newest':
          filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          break;
        case 'oldest':
          filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          break;
        case 'highest':
          filtered.sort((a, b) => b.rating - a.rating);
          break;
        case 'lowest':
          filtered.sort((a, b) => a.rating - b.rating);
          break;
        case 'helpful':
          filtered.sort((a, b) => (b.helpfulVotes || 0) - (a.helpfulVotes || 0));
          break;
      }
      
      return filtered;
    });
    
    const paginatedReviews = computed(() => {
      const start = (currentPage.value - 1) * reviewsPerPage;
      const end = start + reviewsPerPage;
      return filteredReviews.value.slice(start, end);
    });
    
    const totalPages = computed(() => {
      return Math.ceil(filteredReviews.value.length / reviewsPerPage);
    });
    
    // Methods
    const getRatingCount = (rating) => {
      if (!props.stats || !props.stats.distribution) return 0;
      
      const ratingData = props.stats.distribution.find(item => item.rating === rating);
      return ratingData ? ratingData.count : 0;
    };
    
    const getRatingPercentage = (rating) => {
      if (!props.stats || !props.stats.total || props.stats.total === 0) return 0;
      return (getRatingCount(rating) / props.stats.total) * 100;
    };
    
    const scrollToReviewForm = async () => {
      await nextTick();
      const element = document.querySelector('.reviews-list .v-card');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };
    
    const submitReview = async () => {
      if (!isReviewFormValid.value) return;
      
      isSubmittingReview.value = true;
      
      try {
        const reviewData = {
          itemType: props.itemType,
          itemId: props.itemId,
          rating: newReview.value.rating,
          comment: newReview.value.comment,
          tags: {
            positive: newReview.value.tags.positive,
            negative: newReview.value.tags.negative
          }
        };
        
        // Add restaurant ID if provided
        if (props.restaurantId) {
          reviewData.restaurantId = props.restaurantId;
        }
        
        const response = await store.dispatch('reviews/createReview', reviewData);
        
        // Handle photo uploads if any
        if (newReview.value.photos && newReview.value.photos.length > 0) {
          await store.dispatch('reviews/uploadReviewPhotos', {
            reviewId: response.id,
            photos: newReview.value.photos
          });
        }
        
        // Reset form
        newReview.value.rating = 0;
        newReview.value.comment = '';
        newReview.value.tags.positive = [];
        newReview.value.tags.negative = [];
        newReview.value.photos = [];
        hasReviewed.value = true;
        
        emit('review-submitted', response);
        
        store.dispatch('notifications/show', {
          type: 'success',
          message: 'Your review has been submitted!'
        });
      } catch (error) {
        console.error('Failed to submit review:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to submit your review. Please try again.'
        });
      } finally {
        isSubmittingReview.value = false;
      }
    };
    
    const handleReviewUpdate = (updatedReview) => {
      emit('review-updated', updatedReview);
    };
    
    const handleReviewDelete = (deletedReview) => {
      emit('review-deleted', deletedReview);
    };
    
    const handleReviewEdit = (review) => {
      editReviewDialog.value = {
        show: true,
        review: JSON.parse(JSON.stringify(review)) // Deep copy
      };
    };
    
    const updateReview = async () => {
      if (!isEditReviewFormValid.value) return;
      
      isSubmittingReview.value = true;
      
      try {
        const reviewData = {
          reviewId: editReviewDialog.value.review.id,
          rating: editReviewDialog.value.review.rating,
          comment: editReviewDialog.value.review.comment,
          tags: editReviewDialog.value.review.tags
        };
        
        const response = await store.dispatch('reviews/updateReview', reviewData);
        
        editReviewDialog.value.show = false;
        emit('review-updated', response);
        
        store.dispatch('notifications/show', {
          type: 'success',
          message: 'Your review has been updated!'
        });
      } catch (error) {
        console.error('Failed to update review:', error);
        store.dispatch('notifications/show', {
          type: 'error',
          message: 'Failed to update your review. Please try again.'
        });
      } finally {
        isSubmittingReview.value = false;
      }
    };
    
    // Reset page when filters change
    watch([() => filters.value.sort, () => filters.value.rating, () => filters.value.search], () => {
      currentPage.value = 1;
    });
    
    // Check if user has already reviewed this item
    const checkHasReviewed = () => {
      if (!props.reviews || !props.currentUserId) return;
      
      const userReview = props.reviews.find(review => 
        review.user && review.user.id == props.currentUserId
      );
      
      hasReviewed.value = !!userReview;
    };
    
    // Watch for reviews changes to check if user has already reviewed
    watch(() => props.reviews, checkHasReviewed, { immediate: true });
    
    return {
      reviewForm,
      editReviewForm,
      isReviewFormValid,
      isEditReviewFormValid,
      isSubmittingReview,
      hasReviewed,
      currentPage,
      reviewsPerPage,
      filters,
      newReview,
      editReviewDialog,
      reviewRules,
      photoRules,
      sortOptions,
      filteredReviews,
      paginatedReviews,
      totalPages,
      
      getRatingCount,
      getRatingPercentage,
      scrollToReviewForm,
      submitReview,
      updateReview,
      handleReviewUpdate,
      handleReviewDelete,
      handleReviewEdit
    };
  }
};
</script>

<style scoped>
.reviews-list {
  max-width: 800px;
  margin: 0 auto;
}
</style>