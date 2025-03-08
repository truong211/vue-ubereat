<template>
<!-- Previous template content remains the same -->
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useStore } from 'vuex'
import RestaurantResponse from '../review/RestaurantResponse.vue'
import ReportReview from '../review/ReportReview.vue'

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
    ReportReview
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

    const likeReview = async (review: Review) => {
      if (!store.getters.isAuthenticated) {
        store.dispatch('auth/showLoginPrompt')
        return
      }

      await store.dispatch('reviews/likeReview', {
        reviewId: review.id,
        itemType: props.itemType,
        itemId: props.itemId
      })
    }

    const dislikeReview = async (review: Review) => {
      if (!store.getters.isAuthenticated) {
        store.dispatch('auth/showLoginPrompt')
        return
      }

      await store.dispatch('reviews/dislikeReview', {
        reviewId: review.id,
        itemType: props.itemType,
        itemId: props.itemId
      })
    }

    const handleResponseUpdate = (response: any) => {
      emit('response-updated', response)
    }

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
      likeReview,
      dislikeReview,
      handleResponseUpdate
    }
  }
})
</script>

<style scoped>
.reviews-list {
  margin-bottom: 30px;
}
</style>