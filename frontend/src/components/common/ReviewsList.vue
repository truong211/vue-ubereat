<template>
  <div class="reviews-list">
    <!-- Rating overview -->
    <div v-if="showOverview && reviews.length > 0" class="rating-overview mb-6">
      <v-row>
        <v-col cols="12" sm="4" class="text-center">
          <div class="text-h3 font-weight-bold">{{ averageRating.toFixed(1) }}</div>
          <v-rating
            :model-value="averageRating"
            color="amber"
            half-increments
            readonly
            class="justify-center my-2"
          ></v-rating>
          <div class="text-subtitle-1">{{ reviews.length }} {{ $t('review.reviews') }}</div>
        </v-col>
        
        <v-col cols="12" sm="8">
          <div v-for="n in 5" :key="n" class="d-flex align-center mb-2">
            <div class="text-body-2 mr-4">{{ 6-n }}</div>
            <v-progress-linear
              :model-value="getRatingPercentage(6-n)"
              color="amber"
              height="8"
              class="flex-grow-1 mr-4"
              rounded
            ></v-progress-linear>
            <div class="text-body-2" style="min-width: 40px">{{ getRatingCount(6-n) }}</div>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Write review form -->
    <div v-if="showWriteReview && canReview" class="write-review mb-6">
      <v-form ref="reviewForm" v-model="isReviewFormValid">
        <v-card variant="outlined" class="pa-4">
          <div class="mb-4">
            <div class="text-subtitle-1 mb-2">{{ $t('review.yourRating') }}</div>
            <v-rating
              v-model="userReview.rating"
              color="amber"
              hover
              half-increments
              size="large"
            ></v-rating>
          </div>
          
          <v-textarea
            v-model="userReview.comment"
            :label="$t('review.yourReview')"
            :placeholder="$t('review.reviewPlaceholder')"
            variant="outlined"
            rows="4"
            counter="500"
            :rules="reviewRules"
          ></v-textarea>
          
          <div class="d-flex justify-end mt-4">
            <v-btn
              color="primary"
              :loading="isSubmittingReview"
              :disabled="!isReviewFormValid || isSubmittingReview"
              @click="submitReview"
            >
              {{ $t('review.submit') }}
            </v-btn>
          </div>
        </v-card>
      </v-form>
    </div>

    <!-- Review filters -->
    <div v-if="reviews.length > 0" class="review-filters d-flex align-center mb-4 flex-wrap">
      <v-select
        v-model="reviewFilters.sort"
        :items="sortOptions"
        label="Sort by"
        variant="outlined"
        density="compact"
        hide-details
        class="mr-4 mb-2"
        style="max-width: 200px"
      ></v-select>
      
      <v-btn-toggle
        v-model="reviewFilters.rating"
        mandatory
        color="primary"
        class="mb-2"
      >
        <v-btn value="all">{{ $t('review.all') }}</v-btn>
        <v-btn value="positive">{{ $t('review.positive') }}</v-btn>
        <v-btn value="critical">{{ $t('review.critical') }}</v-btn>
      </v-btn-toggle>
      
      <v-spacer></v-spacer>
      
      <v-text-field
        v-model="reviewFilters.search"
        :placeholder="$t('review.searchPlaceholder')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        density="compact"
        hide-details
        class="mb-2"
        style="max-width: 250px"
      ></v-text-field>
    </div>

    <!-- Reviews list -->
    <v-card v-if="paginatedReviews.length > 0" variant="outlined">
      <v-list lines="three">
        <template v-for="(review, index) in paginatedReviews" :key="review.id">
          <v-list-item>
            <template v-slot:prepend>
              <v-avatar :image="review.userAvatar" :color="!review.userAvatar ? 'grey-lighten-1' : undefined">
                <template v-if="!review.userAvatar">
                  <v-icon icon="mdi-account"></v-icon>
                </template>
              </v-avatar>
            </template>

            <v-list-item-title class="d-flex align-center justify-space-between mb-2">
              <div class="d-flex align-center">
                <span class="font-weight-medium">{{ review.userName }}</span>
                <v-chip
                  v-if="review.isVerified"
                  size="x-small"
                  color="success"
                  class="ml-2"
                >
                  {{ $t('review.verified') }}
                </v-chip>
              </div>
              <v-rating
                :model-value="review.rating"
                color="amber"
                density="compact"
                half-increments
                readonly
                size="small"
              ></v-rating>
            </v-list-item-title>

            <v-list-item-subtitle class="text-caption mb-2">
              {{ formatDate(review.date) }}
            </v-list-item-subtitle>

            <v-list-item-text class="text-body-1 mb-3">
              {{ review.comment }}
            </v-list-item-text>

            <!-- Review Actions -->
            <div class="review-actions flex items-center space-x-4 text-sm">
              <button
                @click="handleVote(review.id, true)"
                :class="{
                  'text-primary': review.userLiked,
                  'text-gray-500': !review.userLiked
                }"
                class="flex items-center space-x-1 hover:text-primary"
              >
                <i class="fas fa-thumbs-up"></i>
                <span>{{ review.helpfulVotes || 0 }}</span>
              </button>

              <button
                @click="handleVote(review.id, false)"
                :class="{
                  'text-primary': review.userDisliked,
                  'text-gray-500': !review.userDisliked
                }"
                class="flex items-center space-x-1 hover:text-primary"
              >
                <i class="fas fa-thumbs-down"></i>
                <span>{{ review.unhelpfulVotes || 0 }}</span>
              </button>
            </div>

            <!-- Restaurant response -->
            <restaurant-response
              v-if="restaurantId"
              :review-id="review.id"
              :restaurant-id="restaurantId"
              :response="review.restaurantResponse"
              class="mt-3"
              @response-updated="handleResponseUpdate"
            />

            <!-- Individual Item Ratings -->
            <order-item-review 
              v-if="review.itemRatings && review.itemRatings.length"
              :review="review" 
              :products="getOrderProducts(review)"
              class="mt-3"
            />
          </v-list-item>
          
          <v-divider v-if="index < paginatedReviews.length - 1"></v-divider>
        </template>
      </v-list>

      <!-- Pagination -->
      <v-card-actions v-if="filteredReviews.length > reviewsPerPage">
        <v-spacer></v-spacer>
        <v-pagination
          v-model="reviewPage"
          :length="Math.ceil(filteredReviews.length / reviewsPerPage)"
          :total-visible="7"
        ></v-pagination>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>

    <!-- No reviews message -->
    <v-card v-else class="text-center py-8">
      <v-icon size="64" color="grey">mdi-message-text-outline</v-icon>
      <div class="text-h6 mt-4">{{ $t(noReviewsMessage) }}</div>
    </v-card>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import RestaurantResponse from '../review/RestaurantResponse.vue'
import ReportReview from '../review/ReportReview.vue'
import OrderItemReview from '../review/OrderItemReview.vue'

interface Review {
  id: string
  rating: number
  comment: string
  date: string
  userName: string
  userAvatar?: string
  isVerified?: boolean
  likes?: number
  dislikes?: number
  userLiked?: boolean
  userDisliked?: boolean
  restaurantResponse?: any
  itemRatings?: any[]
  order?: any
}

interface UserReview {
  rating: number
  comment: string
}

interface ReviewFilters {
  sort: string
  rating: string
  search: string
}

export default defineComponent({
  name: 'ReviewsList',

  components: {
    RestaurantResponse,
    ReportReview,
    OrderItemReview
  },

  props: {
    reviews: {
      type: Array as PropType<Review[]>,
      required: true
    },
    itemId: {
      type: [String, Number],
      required: true
    },
    itemType: {
      type: String as PropType<'restaurant' | 'menuItem'>,
      required: true,
      validator: (value: string) => ['restaurant', 'menuItem'].includes(value)
    },
    showOverview: {
      type: Boolean,
      default: true
    },
    showWriteReview: {
      type: Boolean,
      default: true
    },
    noReviewsMessage: {
      type: String,
      default: 'review.beFirstToReview'
    },
    restaurantId: {
      type: [String, Number],
      required: false
    }
  },

  emits: ['review-submitted', 'response-updated'],

  setup(props, { emit }) {
    const { t } = useI18n()
    const store = useStore()
    
    // Form refs and state
    const reviewForm = ref<any>(null)
    const isReviewFormValid = ref(false)
    const isSubmittingReview = ref(false)
    const userReview = ref<UserReview>({
      rating: 0,
      comment: ''
    })

    // Pagination
    const reviewPage = ref(1)
    const reviewsPerPage = 5

    // Filters
    const reviewFilters = ref<ReviewFilters>({
      sort: 'newest',
      rating: 'all',
      search: ''
    })

    const sortOptions = [
      { title: t('review.sortOptions.newest'), value: 'newest' },
      { title: t('review.sortOptions.oldest'), value: 'oldest' },
      { title: t('review.sortOptions.highestRated'), value: 'highest' },
      { title: t('review.sortOptions.lowestRated'), value: 'lowest' },
      { title: t('review.sortOptions.mostHelpful'), value: 'helpful' }
    ]

    // Validation rules
    const reviewRules = [
      (v: string) => !!v || t('review.rules.required'),
      (v: string) => v.length >= 10 || t('review.rules.minLength'),
      (v: string) => v.length <= 500 || t('review.rules.maxLength')
    ]

    // Computed properties
    const averageRating = computed(() => {
      if (!props.reviews || props.reviews.length === 0) return 0
      const sum = props.reviews.reduce((acc, review) => acc + review.rating, 0)
      return sum / props.reviews.length
    })

    const canReview = computed(() => {
      return store.getters.isAuthenticated
    })

    const filteredReviews = computed(() => {
      let filtered = [...props.reviews]

      // Filter by rating type
      if (reviewFilters.value.rating === 'positive') {
        filtered = filtered.filter(review => review.rating >= 4)
      } else if (reviewFilters.value.rating === 'critical') {
        filtered = filtered.filter(review => review.rating < 4)
      }

      // Filter by search term
      const search = reviewFilters.value.search.toLowerCase()
      if (search) {
        filtered = filtered.filter(review => 
          review.comment.toLowerCase().includes(search) ||
          review.userName.toLowerCase().includes(search)
        )
      }

      // Sort reviews
      switch (reviewFilters.value.sort) {
        case 'newest':
          filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          break
        case 'oldest':
          filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          break
        case 'highest':
          filtered.sort((a, b) => b.rating - a.rating)
          break
        case 'lowest':
          filtered.sort((a, b) => a.rating - b.rating)
          break
        case 'helpful':
          filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0))
          break
      }

      return filtered
    })

    const paginatedReviews = computed(() => {
      const start = (reviewPage.value - 1) * reviewsPerPage
      return filteredReviews.value.slice(start, start + reviewsPerPage)
    })

    // Methods
    const getRatingCount = (rating: number): number => {
      return props.reviews.filter(review => Math.round(review.rating) === rating).length
    }

    const getRatingPercentage = (rating: number): number => {
      if (props.reviews.length === 0) return 0
      return (getRatingCount(rating) / props.reviews.length) * 100
    }

    const formatDate = (date: string): string => {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const submitReview = async () => {
      const isValid = await reviewForm.value?.validate()
      if (!isValid?.valid) return

      isSubmittingReview.value = true
      try {
        await store.dispatch(`reviews/submit${props.itemType}Review`, {
          itemId: props.itemId,
          ...userReview.value
        })

        userReview.value = { rating: 0, comment: '' }
        emit('review-submitted')
      } finally {
        isSubmittingReview.value = false
      }
    }

    const handleVote = async (reviewId: string, type: boolean) => {
      if (!store.getters.isAuthenticated) {
        store.dispatch('auth/showLoginPrompt')
        return
      }
    
      try {
        await store.dispatch('reviews/voteReview', {
          reviewId: reviewId,
          itemType: props.itemType,
          itemId: props.itemId,
          voteType: type ? 'like' : 'dislike'
        })
    
        // Optimistic update
        const review = props.reviews.find(r => r.id === reviewId)
        if (review) {
          if (type) {
            review.userLiked = !review.userLiked
            review.likes = (review.likes || 0) + (review.userLiked ? 1 : -1)
            if (review.userDisliked) {
              review.userDisliked = false
              review.dislikes = Math.max(0, (review.dislikes || 0) - 1)
            }
          } else {
            review.userDisliked = !review.userDisliked
            review.dislikes = (review.dislikes || 0) + (review.userDisliked ? 1 : -1)
            if (review.userLiked) {
              review.userLiked = false
              review.likes = Math.max(0, (review.likes || 0) - 1)
            }
          }
        }
      } catch (error) {
        console.error(`Failed to vote:`, error)
        store.dispatch('showNotification', {
          type: 'error',
          message: t('review.voteError')
        })
      }
    }

    const handleResponseUpdate = (response: any) => {
      emit('response-updated', response)
    }

    // Get order products for a review
    const getOrderProducts = (review: Review) => {
      return review.order?.items || [];
    };

    // Reset page when filters change
    watch([
      () => reviewFilters.value.sort,
      () => reviewFilters.value.rating,
      () => reviewFilters.value.search
    ], () => {
      reviewPage.value = 1
    })

    return {
      reviewForm,
      isReviewFormValid,
      isSubmittingReview,
      userReview,
      reviewPage,
      reviewsPerPage,
      reviewFilters,
      sortOptions,
      reviewRules,
      averageRating,
      canReview,
      filteredReviews,
      paginatedReviews,
      getRatingCount,
      getRatingPercentage,
      formatDate,
      submitReview,
      handleVote,
      handleResponseUpdate,
      getOrderProducts
    }
  }
})
</script>

<style scoped>
.reviews-list {
  margin-bottom: 30px;
}
</style>