<template>
  <div class="menu-item-review">
    <!-- Previous template content remains the same -->
  </div>
</template>

<script lang="ts">
import { ref, computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import ReviewsList from '@/components/common/ReviewsList.vue'

interface MenuItem {
  id: number | string
  name: string
  category: string
  image: string
  rating: number
  reviewCount: number
}

interface Review {
  id: string
  taste: number
  presentation: number
  value: number
  photos?: string[]
  positiveAspects?: string[]
  negativeAspects?: string[]
}

interface MenuItemReviewData {
  taste: number
  presentation: number
  value: number
  photos: File[]
  positiveAspects: string[]
  negativeAspects: string[]
}

export default defineComponent({
  name: 'MenuItemReview',

  components: {
    ReviewsList
  },

  props: {
    menuItemId: {
      type: [String, Number],
      required: true
    },
    restaurantId: {
      type: [String, Number],
      required: true
    },
    reviews: {
      type: Array as () => Review[],
      required: true
    },
    menuItem: {
      type: Object as () => MenuItem,
      required: true
    }
  },

  setup(props) {
    const { t } = useI18n()
    const photoDialog = ref(false)
    const selectedPhoto = ref<string | null>(null)

    const menuItemReview = ref<MenuItemReviewData>({
      taste: 0,
      presentation: 0,
      value: 0,
      photos: [],
      positiveAspects: [],
      negativeAspects: []
    })

    const photoRules = [
      (files: File[]) => !files || files.length <= 5 || t('review.tooManyPhotos'),
      (files: File[]) => !files || !files.some(f => f.size > 5000000) || t('review.photoTooLarge')
    ]

    const positiveAspects = [
      { label: t('review.aspects.taste'), value: 'taste' },
      { label: t('review.aspects.portion'), value: 'portion' },
      { label: t('review.aspects.freshness'), value: 'freshness' },
      { label: t('review.aspects.presentation'), value: 'presentation' },
      { label: t('review.aspects.temperature'), value: 'temperature' },
      { label: t('review.aspects.value'), value: 'value' }
    ]

    const negativeAspects = [
      { label: t('review.aspects.notTasty'), value: 'not_tasty' },
      { label: t('review.aspects.tooSmall'), value: 'too_small' },
      { label: t('review.aspects.notFresh'), value: 'not_fresh' },
      { label: t('review.aspects.poorPresentation'), value: 'poor_presentation' },
      { label: t('review.aspects.wrongTemperature'), value: 'wrong_temperature' },
      { label: t('review.aspects.overpriced'), value: 'overpriced' }
    ]

    const getRatingColor = (rating: number): string => {
      if (rating >= 4) return 'success'
      if (rating >= 3) return 'warning'
      return 'error'
    }

    const getAspectLabel = (aspect: string, type: 'positive' | 'negative'): string => {
      const list = type === 'positive' ? positiveAspects : negativeAspects
      return list.find(a => a.value === aspect)?.label || aspect
    }

    const openPhotoDialog = (photo: string): void => {
      selectedPhoto.value = photo
      photoDialog.value = true
    }

    return {
      menuItemReview,
      photoRules,
      positiveAspects,
      negativeAspects,
      photoDialog,
      selectedPhoto,
      getRatingColor,
      getAspectLabel,
      openPhotoDialog
    }
  }
})
</script>

<style scoped>
.menu-item-review {
  max-width: 960px;
  margin: 0 auto;
}

.review-photos {
  cursor: pointer;
}

.review-photos .v-img {
  transition: transform 0.2s;
}

.review-photos .v-img:hover {
  transform: scale(1.05);
}
</style>