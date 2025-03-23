<template>
  <div class="review-section">
    <!-- Review Summary -->
    <div class="review-summary mb-8">
      <v-row>
        <v-col cols="12" sm="4">
          <div class="text-center">
            <div class="text-h2 font-weight-bold">{{ stats.average }}</div>
            <v-rating
              :model-value="parseFloat(stats.average)"
              color="amber"
              half-increments
              readonly
              size="small"
            ></v-rating>
            <div class="text-subtitle-1 mt-2">
              {{ stats.total }} đánh giá
            </div>
          </div>
        </v-col>
        <v-col cols="12" sm="8">
          <div class="rating-distribution">
            <div v-for="n in 5" :key="n" class="d-flex align-center mb-2">
              <div style="width: 50px">{{ 6 - n }} sao</div>
              <v-progress-linear
                :model-value="(stats.distribution[6 - n] / stats.total) * 100"
                color="amber"
                height="8"
                class="mx-2"
              ></v-progress-linear>
              <div style="width: 50px" class="text-caption">
                {{ stats.distribution[6 - n] || 0 }}
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Review Filters -->
    <div class="review-filters mb-6">
      <v-row>
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="filters.rating"
            :items="ratingOptions"
            label="Lọc theo số sao"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="12" sm="6" md="4">
          <v-select
            v-model="filters.sort"
            :items="sortOptions"
            label="Sắp xếp theo"
            density="compact"
            variant="outlined"
            hide-details
          ></v-select>
        </v-col>
      </v-row>
    </div>

    <!-- Write Review Section -->
    <div v-if="canReview" class="write-review mb-8">
      <v-card variant="outlined">
        <v-card-title>Viết đánh giá của bạn</v-card-title>
        <v-card-text>
          <v-form ref="reviewForm" v-model="newReview.isValid">
            <v-row>
              <v-col cols="12">
                <div class="d-flex align-center mb-3">
                  <span class="text-body-1 mr-4">Đánh giá của bạn:</span>
                  <v-rating
                    v-model="newReview.rating"
                    color="amber"
                    half-increments
                    hover
                    size="large"
                  ></v-rating>
                </div>
              </v-col>
              <v-col cols="12">
                <v-textarea
                  v-model="newReview.comment"
                  label="Chia sẻ trải nghiệm của bạn (tối thiểu 10 ký tự)"
                  :rules="commentRules"
                  variant="outlined"
                  rows="4"
                  counter="500"
                ></v-textarea>
              </v-col>
              <v-col cols="12">
                <v-file-input
                  v-model="newReview.photos"
                  label="Thêm hình ảnh (tối đa 5 ảnh)"
                  accept="image/*"
                  :rules="photoRules"
                  variant="outlined"
                  density="compact"
                  multiple
                  chips
                  show-size
                  truncate-length="15"
                  :disabled="newReview.photos.length >= 5"
                ></v-file-input>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            :loading="newReview.loading"
            :disabled="!newReview.isValid || newReview.loading"
            @click="submitReview"
          >
            Gửi đánh giá
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>

    <!-- Reviews List -->
    <div class="reviews-list">
      <v-card v-for="review in reviews" :key="review.id" variant="outlined" class="mb-4">
        <v-card-text>
          <!-- Review Header -->
          <div class="d-flex align-center mb-3">
            <v-avatar size="40" color="grey" class="mr-3">
              <v-img
                v-if="review.user.profileImage"
                :src="review.user.profileImage"
              ></v-img>
              <v-icon v-else>mdi-account</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-medium">{{ review.user.fullName }}</div>
              <div class="d-flex align-center">
                <v-rating
                  :model-value="review.rating"
                  color="amber"
                  density="compact"
                  half-increments
                  readonly
                  size="small"
                ></v-rating>
                <span class="text-caption ml-2">
                  {{ formatDate(review.createdAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Review Content -->
          <p class="text-body-1 mb-3">{{ review.comment }}</p>

          <!-- Review Photos -->
          <div v-if="review.images?.length" class="review-photos mb-3">
            <v-row>
              <v-col
                v-for="(image, index) in review.images"
                :key="index"
                cols="6"
                sm="4"
                md="3"
              >
                <v-img
                  :src="image"
                  aspect-ratio="1"
                  cover
                  class="rounded"
                  @click="openPhotoDialog(review.images, index)"
                ></v-img>
              </v-col>
            </v-row>
          </div>

          <!-- Review Restaurant Response -->
          <div v-if="review.response" class="restaurant-response mb-3">
            <v-card variant="outlined" color="surface-variant">
              <v-card-text>
                <div class="d-flex align-center mb-2">
                  <v-avatar color="primary" size="32" class="mr-2">
                    <v-icon color="white" size="small">mdi-store</v-icon>
                  </v-avatar>
                  <div>
                    <div class="font-weight-medium">Phản hồi của nhà hàng</div>
                    <span class="text-caption">
                      {{ formatDate(review.responseDate) }}
                    </span>
                  </div>
                </div>
                <p class="text-body-2 mb-0">{{ review.response }}</p>
              </v-card-text>
            </v-card>
          </div>

          <!-- Review Actions -->
          <div class="review-actions d-flex align-center">
            <v-btn
              variant="text"
              :prepend-icon="review.userVote === true ? 'mdi-thumb-up' : 'mdi-thumb-up-outline'"
              :color="review.userVote === true ? 'success' : undefined"
              @click="voteReview(review.id, true)"
            >
              {{ review.likes || 0 }}
            </v-btn>
            <v-btn
              variant="text"
              :prepend-icon="review.userVote === false ? 'mdi-thumb-down' : 'mdi-thumb-down-outline'"
              :color="review.userVote === false ? 'error' : undefined"
              @click="voteReview(review.id, false)"
            >
              {{ review.dislikes || 0 }}
            </v-btn>
            <v-btn
              variant="text"
              prepend-icon="mdi-flag-outline"
              @click="openReportDialog(review)"
            >
              Báo cáo
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Load More -->
      <div v-if="hasMoreReviews" class="text-center mt-6">
        <v-btn
          variant="outlined"
          :loading="loading"
          @click="loadMoreReviews"
        >
          Xem thêm đánh giá
        </v-btn>
      </div>
    </div>

    <!-- Photo Dialog -->
    <v-dialog v-model="photoDialog.show" max-width="800">
      <v-card>
        <v-img
          :src="photoDialog.images[photoDialog.currentIndex]"
          max-height="80vh"
          contain
        ></v-img>
        <v-card-actions>
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            @click="previousPhoto"
            :disabled="photoDialog.currentIndex === 0"
          ></v-btn>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            @click="nextPhoto"
            :disabled="photoDialog.currentIndex === photoDialog.images.length - 1"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Report Dialog -->
    <v-dialog v-model="reportDialog.show" max-width="500">
      <v-card>
        <v-card-title>Báo cáo đánh giá</v-card-title>
        <v-card-text>
          <v-form ref="reportForm" v-model="reportDialog.isValid">
            <v-select
              v-model="reportDialog.reason"
              :items="reportReasons"
              label="Lý do báo cáo"
              variant="outlined"
              :rules="[v => !!v || 'Vui lòng chọn lý do']"
            ></v-select>
            <v-textarea
              v-model="reportDialog.description"
              label="Mô tả chi tiết (không bắt buộc)"
              variant="outlined"
              rows="3"
              counter="500"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            @click="reportDialog.show = false"
          >
            Hủy
          </v-btn>
          <v-btn
            color="error"
            :loading="reportDialog.loading"
            :disabled="!reportDialog.isValid || reportDialog.loading"
            @click="submitReport"
          >
            Báo cáo
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const props = defineProps({
  restaurantId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['review-submitted'])

const store = useStore()

// State
const loading = ref(false)
const page = ref(1)
const stats = ref({
  average: 0,
  total: 0,
  distribution: {}
})
const reviews = ref([])
const hasMoreReviews = ref(true)
const canReview = ref(false)

// Filters
const filters = ref({
  rating: 'all',
  sort: 'newest'
})

const ratingOptions = [
  { title: 'Tất cả', value: 'all' },
  { title: '5 sao', value: '5' },
  { title: '4 sao', value: '4' },
  { title: '3 sao', value: '3' },
  { title: '2 sao', value: '2' },
  { title: '1 sao', value: '1' }
]

const sortOptions = [
  { title: 'Mới nhất', value: 'newest' },
  { title: 'Cũ nhất', value: 'oldest' },
  { title: 'Đánh giá cao nhất', value: 'highest' },
  { title: 'Đánh giá thấp nhất', value: 'lowest' }
]

// New Review Form
const reviewForm = ref(null)
const newReview = ref({
  rating: 0,
  comment: '',
  photos: [],
  isValid: false,
  loading: false
})

const commentRules = [
  v => !!v || 'Vui lòng nhập nhận xét',
  v => v.length >= 10 || 'Nhận xét phải có ít nhất 10 ký tự',
  v => v.length <= 500 || 'Nhận xét không được vượt quá 500 ký tự'
]

const photoRules = [
  files => !files.length || files.length <= 5 || 'Chỉ được tải lên tối đa 5 ảnh',
  files => {
    for (const file of files) {
      const size = file.size / 1024 / 1024
      if (size > 5) return 'Mỗi ảnh không được vượt quá 5MB'
    }
    return true
  }
]

// Report Dialog
const reportForm = ref(null)
const reportDialog = ref({
  show: false,
  review: null,
  reason: '',
  description: '',
  isValid: false,
  loading: false
})

const reportReasons = [
  { title: 'Nội dung không phù hợp', value: 'inappropriate' },
  { title: 'Spam hoặc lừa đảo', value: 'spam' },
  { title: 'Đánh giá không trung thực', value: 'fake' },
  { title: 'Vi phạm điều khoản sử dụng', value: 'tos' },
  { title: 'Khác', value: 'other' }
]

// Photo Dialog
const photoDialog = ref({
  show: false,
  images: [],
  currentIndex: 0
})

// Methods
const fetchReviews = async (isLoadMore = false) => {
  if (loading.value) return

  loading.value = true
  try {
    const response = await store.dispatch('reviews/fetchRestaurantReviews', {
      restaurantId: props.restaurantId,
      page: page.value,
      rating: filters.value.rating === 'all' ? null : filters.value.rating,
      sort: filters.value.sort
    })

    if (isLoadMore) {
      reviews.value.push(...response.reviews)
    } else {
      reviews.value = response.reviews
    }

    stats.value = response.stats
    hasMoreReviews.value = page.value * 10 < response.pagination.total
  } catch (error) {
    console.error('Error fetching reviews:', error)
    store.dispatch('notifications/show', {
      type: 'error',
      message: 'Không thể tải đánh giá'
    })
  } finally {
    loading.value = false
  }
}

const checkCanReview = async () => {
  try {
    const canReviewResponse = await store.dispatch('reviews/checkCanReview', props.restaurantId)
    canReview.value = canReviewResponse.canReview
  } catch (error) {
    console.error('Error checking review ability:', error)
  }
}

const submitReview = async () => {
  if (!newReview.value.isValid) return

  newReview.value.loading = true
  try {
    const formData = new FormData()
    formData.append('restaurantId', props.restaurantId)
    formData.append('rating', newReview.value.rating)
    formData.append('comment', newReview.value.comment)

    for (const photo of newReview.value.photos) {
      formData.append('photos', photo)
    }

    await store.dispatch('reviews/createReview', formData)

    // Reset form
    newReview.value = {
      rating: 0,
      comment: '',
      photos: [],
      isValid: false,
      loading: false
    }
    if (reviewForm.value) {
      reviewForm.value.reset()
    }

    // Refresh reviews
    page.value = 1
    await fetchReviews()
    emit('review-submitted')

    store.dispatch('notifications/show', {
      type: 'success',
      message: 'Cảm ơn bạn đã đánh giá!'
    })
  } catch (error) {
    console.error('Error submitting review:', error)
    store.dispatch('notifications/show', {
      type: 'error',
      message: 'Không thể gửi đánh giá'
    })
  } finally {
    newReview.value.loading = false
  }
}

const voteReview = async (reviewId, isHelpful) => {
  try {
    await store.dispatch('reviews/voteReview', {
      reviewId,
      isHelpful
    })
    await fetchReviews()
  } catch (error) {
    console.error('Error voting review:', error)
    store.dispatch('notifications/show', {
      type: 'error',
      message: 'Không thể đánh giá bình luận'
    })
  }
}

const openReportDialog = (review) => {
  reportDialog.value = {
    show: true,
    review,
    reason: '',
    description: '',
    isValid: false,
    loading: false
  }
}

const submitReport = async () => {
  if (!reportDialog.value.isValid) return

  reportDialog.value.loading = true
  try {
    await store.dispatch('reviews/reportReview', {
      reviewId: reportDialog.value.review.id,
      reason: reportDialog.value.reason,
      description: reportDialog.value.description
    })

    reportDialog.value.show = false
    store.dispatch('notifications/show', {
      type: 'success',
      message: 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét nội dung này.'
    })
  } catch (error) {
    console.error('Error reporting review:', error)
    store.dispatch('notifications/show', {
      type: 'error',
      message: 'Không thể gửi báo cáo'
    })
  } finally {
    reportDialog.value.loading = false
  }
}

const loadMoreReviews = () => {
  page.value++
  fetchReviews(true)
}

const openPhotoDialog = (images, index) => {
  photoDialog.value = {
    show: true,
    images,
    currentIndex: index
  }
}

const previousPhoto = () => {
  if (photoDialog.value.currentIndex > 0) {
    photoDialog.value.currentIndex--
  }
}

const nextPhoto = () => {
  if (photoDialog.value.currentIndex < photoDialog.value.images.length - 1) {
    photoDialog.value.currentIndex++
  }
}

const formatDate = (date) => {
  return format(new Date(date), 'dd MMMM yyyy', { locale: vi })
}

// Watch filters
watch(filters, () => {
  page.value = 1
  fetchReviews()
}, { deep: true })

// Lifecycle hooks
onMounted(() => {
  fetchReviews()
  checkCanReview()
})
</script>

<style scoped>
.review-section {
  max-width: 1200px;
  margin: 0 auto;
}

.rating-distribution {
  max-width: 400px;
}

.review-photos {
  .v-img {
    cursor: pointer;
    transition: transform 0.2s;

    &:hover {
      transform: scale(1.05);
    }
  }
}

.restaurant-response {
  background-color: var(--v-surface-variant);
  border-radius: 8px;
  padding: 16px;
}
</style>